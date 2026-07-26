const OPENAI_API_KEY = process.env.OPENAI_API_KEY || "";
const OPENAI_MODEL = process.env.OPENAI_MODEL || "gpt-5.6-luna";

function sendJson(res, status, payload) {
  res.statusCode = status;
  res.setHeader("Content-Type", "application/json; charset=utf-8");
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET,POST,OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");
  res.end(JSON.stringify(payload));
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

function handleOptions(req, res) {
  if (req.method !== "OPTIONS") return false;
  sendJson(res, 204, {});
  return true;
}

function requireApiKey(res) {
  if (OPENAI_API_KEY) return true;
  sendJson(res, 503, {
    ok: false,
    code: "missing_api_key",
    error: "OPENAI_API_KEY is not set",
  });
  return false;
}

async function callOpenAI(payload) {
  const response = await fetch("https://api.openai.com/v1/responses", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${OPENAI_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });

  const requestId = response.headers.get("x-request-id") || "";
  const raw = await response.text();
  const data = parseJson(raw, {});
  return { data, ok: response.ok, raw, requestId, status: response.status };
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

function normalizePromptResult(data, requestId) {
  const outputText = extractOutputText(data);
  const parsed = parseAssistantJson(outputText);
  const variations = Array.isArray(parsed.variations) ? parsed.variations : [];
  const firstVariationPrompt = variations.find((variation) => variation && variation.prompt)?.prompt || "";

  return {
    ok: true,
    model: data.model || OPENAI_MODEL,
    requestId,
    enhancedPrompt: parsed.enhancedPrompt || firstVariationPrompt || outputText,
    stylePrompt: parsed.stylePrompt || "",
    lyricPrompt: parsed.lyricPrompt || "",
    variations,
    ideas: Array.isArray(parsed.ideas) ? parsed.ideas : [],
    cautions: Array.isArray(parsed.cautions) ? parsed.cautions : [],
  };
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

function parseJson(text, fallback) {
  try {
    return JSON.parse(text);
  } catch {
    return fallback;
  }
}

function clampVariantCount(value) {
  const number = Number(value);
  if (!Number.isFinite(number)) return 1;
  return Math.min(5, Math.max(1, Math.round(number)));
}

module.exports = {
  OPENAI_MODEL,
  buildOpenAIPayload,
  callOpenAI,
  handleOptions,
  normalizePromptResult,
  readJson,
  requireApiKey,
  sendJson,
};
