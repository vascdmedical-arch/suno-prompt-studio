const http = require("node:http");
const fs = require("node:fs");
const path = require("node:path");
const { URL } = require("node:url");

loadLocalEnv();

const IS_RENDER = Boolean(process.env.RENDER || process.env.RENDER_SERVICE_ID);
const PORT = Number(process.env.PORT || 4173);
const HOST = process.env.HOST || (IS_RENDER ? "0.0.0.0" : "127.0.0.1");
const OPENAI_API_KEY = process.env.OPENAI_API_KEY || "";
const OPENAI_MODEL = process.env.OPENAI_MODEL || "gpt-5-mini";
const OPENAI_TIMEOUT_MS = Number(process.env.OPENAI_TIMEOUT_MS || 70_000);
const ROOT = __dirname;

const MIME_TYPES = {
  ".html": "text/html; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".svg": "image/svg+xml",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".webp": "image/webp",
};

const server = http.createServer(async (req, res) => {
  setCommonHeaders(res);

  if (req.method === "OPTIONS") {
    res.writeHead(204);
    res.end();
    return;
  }

  const reqUrl = new URL(req.url || "/", `http://${req.headers.host || `${HOST}:${PORT}`}`);

  try {
    if (reqUrl.pathname === "/api/health") {
      sendJson(res, 200, {
        ok: true,
        hasApiKey: Boolean(OPENAI_API_KEY),
        model: OPENAI_MODEL,
      });
      return;
    }

    if (reqUrl.pathname === "/api/refine") {
      await handleRefine(req, res);
      return;
    }

    if (reqUrl.pathname === "/api/test") {
      await handleApiTest(req, res);
      return;
    }

    serveStatic(reqUrl.pathname, res);
  } catch (error) {
    sendJson(res, 500, {
      ok: false,
      error: error.message || "Server error",
    });
  }
});

server.on("error", (error) => {
  if (error.code === "EADDRINUSE") {
    console.error(`Port ${PORT} is already in use. Close the other server or set PORT to another number.`);
  } else if (error.code === "EPERM") {
    console.error(`Permission denied while opening http://${HOST}:${PORT}/. Start this app from Terminal or start.command.`);
  } else {
    console.error(error.message || error);
  }
  process.exit(1);
});

server.listen(PORT, HOST, () => {
  console.log(`Suno Prompt Studio is running at http://${HOST}:${PORT}/`);
  console.log(OPENAI_API_KEY ? `OpenAI model: ${OPENAI_MODEL}` : "OPENAI_API_KEY is not set");
});

function setCommonHeaders(res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET,POST,OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");
  res.setHeader("X-Content-Type-Options", "nosniff");
}

function loadLocalEnv() {
  [".env", ".env.local"].forEach((fileName) => {
    const envPath = path.join(__dirname, fileName);
    if (!fs.existsSync(envPath)) return;

    const lines = fs.readFileSync(envPath, "utf8").split(/\r?\n/);
    lines.forEach((line) => {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith("#")) return;
      const equalsIndex = trimmed.indexOf("=");
      if (equalsIndex === -1) return;

      const key = trimmed.slice(0, equalsIndex).trim();
      const rawValue = trimmed.slice(equalsIndex + 1).trim();
      if (!key || process.env[key] !== undefined) return;
      process.env[key] = rawValue.replace(/^["']|["']$/g, "");
    });
  });
}

async function handleRefine(req, res) {
  if (req.method !== "POST") {
    sendJson(res, 405, { ok: false, error: "POST only" });
    return;
  }

  if (!OPENAI_API_KEY) {
    sendJson(res, 503, {
      ok: false,
      code: "missing_api_key",
      error: "OPENAI_API_KEY is not set",
    });
    return;
  }

  const body = await readJson(req);
  const apiPayload = buildOpenAIPayload(body);
  const response = await callOpenAI(apiPayload, res);
  if (!response) return;

  const requestId = response.headers.get("x-request-id") || "";
  const raw = await response.text();
  const data = parseJson(raw, {});

  if (!response.ok) {
    sendJson(res, response.status, {
      ok: false,
      requestId,
      error: data?.error?.message || raw || "OpenAI API request failed",
    });
    return;
  }

  const outputText = extractOutputText(data);
  const parsed = normalizeParsedResult(parseAssistantJson(outputText));
  const variations = Array.isArray(parsed.variations) ? parsed.variations : [];
  const firstVariationPrompt = variations.find((variation) => variation && variation.prompt)?.prompt || "";
  sendJson(res, 200, {
    ok: true,
    model: data.model || OPENAI_MODEL,
    requestId,
    enhancedPrompt: parsed.enhancedPrompt || firstVariationPrompt || outputText,
    stylePrompt: parsed.stylePrompt || "",
    lyricPrompt: parsed.lyricPrompt || "",
    variations,
    ideas: Array.isArray(parsed.ideas) ? parsed.ideas : [],
    cautions: Array.isArray(parsed.cautions) ? parsed.cautions : [],
  });
}

async function handleApiTest(req, res) {
  if (req.method !== "POST") {
    sendJson(res, 405, { ok: false, error: "POST only" });
    return;
  }

  if (!OPENAI_API_KEY) {
    sendJson(res, 503, {
      ok: false,
      code: "missing_api_key",
      error: "OPENAI_API_KEY is not set",
    });
    return;
  }

  const response = await callOpenAI(
    {
      model: OPENAI_MODEL,
      input: "Return OK as plain text.",
      max_output_tokens: 16,
    },
    res,
  );
  if (!response) return;

  const raw = await response.text();
  const data = parseJson(raw, {});
  if (!response.ok) {
    sendJson(res, response.status, {
      ok: false,
      requestId: response.headers.get("x-request-id") || "",
      error: data?.error?.message || raw || "OpenAI API request failed",
    });
    return;
  }

  sendJson(res, 200, {
    ok: true,
    model: data.model || OPENAI_MODEL,
    requestId: response.headers.get("x-request-id") || "",
  });
}

function buildOpenAIPayload(body) {
  const formData = body.formData || {};
  const currentPrompt = body.currentPrompt || "";
  const aiMode = body.aiMode || "refine";
  const aiCount = clampVariantCount(body.aiCount);
  const aiInstruction = body.aiInstruction || "";

  return {
    model: OPENAI_MODEL,
    instructions: [
      "You are a careful music prompt director for Suno.",
      "You are also a hugely successful J-pop music creator, an elite AI music creator, a hitmaker and excellent producer fluent in K-pop and City Pop, a musician deeply versed in jazz, and a specialist in the latest Suno music creation workflows.",
      "Think like an experienced producer, lyric editor, and prompt engineer.",
      "Prioritize memorable hooks, commercially strong melodies, sophisticated harmony, tasteful jazz-informed color, polished Japanese pop sensibility, and production ideas that work well in AI-generated music.",
      "Create original prompts only. Reference songs may guide mood, arrangement, texture, energy, or lyrical tone, but never ask to copy melodies, lyrics, hooks, artist identity, or distinctive signatures.",
      "If songForm.genre is an array, treat it as a genre blend. Make the combination coherent instead of listing disconnected styles.",
      "Do not browse YouTube links. Use only the titles, artists, notes, and URLs supplied by the user.",
      "Return only valid JSON with keys: enhancedPrompt, stylePrompt, lyricPrompt, variations, ideas, cautions.",
      "Do not put a JSON object inside enhancedPrompt. enhancedPrompt must be a plain paste-ready Suno prompt string.",
      "The variations key must be an array of objects with label and prompt. Return the requested number of variations.",
      "Keep enhancedPrompt ready to paste into Suno. Use English for technical music/style tags, and preserve Japanese when the song concept or lyric language is Japanese.",
      "If songForm.promptMode is simple3000, keep enhancedPrompt and every variation prompt within 3000 characters. If it is advanced1000, keep them within 1000 characters while preserving the strongest style, lyric, and arrangement direction.",
    ].join(" "),
    input: JSON.stringify(
      {
        task: aiMode,
        variantCount: aiCount,
        extraDirection: aiInstruction,
        currentPrompt,
        songForm: formData,
      },
      null,
      2,
    ),
    max_output_tokens: 1800,
    text: {
      format: buildResponseFormatSchema(),
      verbosity: "medium",
    },
  };
}

async function callOpenAI(payload, res) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), OPENAI_TIMEOUT_MS);

  try {
    return await fetch("https://api.openai.com/v1/responses", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${OPENAI_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
      signal: controller.signal,
    });
  } catch (error) {
    const isTimeout = error.name === "AbortError";
    sendJson(res, isTimeout ? 504 : 502, {
      ok: false,
      code: isTimeout ? "openai_timeout" : "openai_request_failed",
      error: isTimeout
        ? "OpenAI API request timed out. Please try again."
        : error.message || "OpenAI API request failed",
    });
    return null;
  } finally {
    clearTimeout(timer);
  }
}

function buildResponseFormatSchema() {
  return {
    type: "json_schema",
    name: "suno_prompt_result",
    strict: true,
    schema: {
      type: "object",
      additionalProperties: false,
      required: ["enhancedPrompt", "stylePrompt", "lyricPrompt", "variations", "ideas", "cautions"],
      properties: {
        enhancedPrompt: { type: "string" },
        stylePrompt: { type: "string" },
        lyricPrompt: { type: "string" },
        variations: {
          type: "array",
          items: {
            type: "object",
            additionalProperties: false,
            required: ["label", "prompt"],
            properties: {
              label: { type: "string" },
              prompt: { type: "string" },
            },
          },
        },
        ideas: {
          type: "array",
          items: { type: "string" },
        },
        cautions: {
          type: "array",
          items: { type: "string" },
        },
      },
    },
  };
}

function clampVariantCount(value) {
  const number = Number(value);
  if (!Number.isFinite(number)) return 1;
  return Math.min(5, Math.max(1, Math.round(number)));
}

function extractOutputText(data) {
  if (typeof data.output_text === "string" && data.output_text.trim()) {
    return data.output_text.trim();
  }

  if (!Array.isArray(data.output)) return "";

  return data.output
    .flatMap((item) => (Array.isArray(item.content) ? item.content : []))
    .filter((content) => content && content.type === "output_text" && typeof content.text === "string")
    .map((content) => content.text)
    .join("\n")
    .trim();
}

function parseAssistantJson(text) {
  const direct = parseJson(text, null);
  if (direct) return direct;

  const match = text.match(/\{[\s\S]*\}/);
  if (!match) return {};
  return parseJson(match[0], {});
}

function normalizeParsedResult(parsed) {
  if (!parsed || typeof parsed !== "object") return {};
  const nested = typeof parsed.enhancedPrompt === "string" ? parseAssistantJson(parsed.enhancedPrompt.trim()) : {};
  if (!nested || typeof nested !== "object" || !nested.enhancedPrompt) return parsed;

  return {
    ...parsed,
    ...nested,
    variations: Array.isArray(nested.variations) ? nested.variations : parsed.variations,
    ideas: Array.isArray(nested.ideas) ? nested.ideas : parsed.ideas,
    cautions: Array.isArray(nested.cautions) ? nested.cautions : parsed.cautions,
  };
}

function parseJson(text, fallback) {
  try {
    return JSON.parse(text);
  } catch {
    return fallback;
  }
}

function readJson(req) {
  return new Promise((resolve, reject) => {
    let raw = "";
    req.on("data", (chunk) => {
      raw += chunk;
      if (raw.length > 1_500_000) {
        reject(new Error("Request body is too large"));
        req.destroy();
      }
    });
    req.on("end", () => resolve(parseJson(raw || "{}", {})));
    req.on("error", reject);
  });
}

function serveStatic(urlPath, res) {
  const requested = urlPath === "/" ? "/index.html" : decodeURIComponent(urlPath);
  const filePath = path.normalize(path.join(ROOT, requested));

  if (!filePath.startsWith(ROOT)) {
    sendText(res, 403, "Forbidden");
    return;
  }

  fs.readFile(filePath, (error, data) => {
    if (error) {
      sendText(res, 404, "Not found");
      return;
    }

    const ext = path.extname(filePath).toLowerCase();
    res.writeHead(200, { "Content-Type": MIME_TYPES[ext] || "application/octet-stream" });
    res.end(data);
  });
}

function sendJson(res, status, payload) {
  res.writeHead(status, { "Content-Type": "application/json; charset=utf-8" });
  res.end(JSON.stringify(payload));
}

function sendText(res, status, text) {
  res.writeHead(status, { "Content-Type": "text/plain; charset=utf-8" });
  res.end(text);
}
