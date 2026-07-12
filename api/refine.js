const {
  buildOpenAIPayload,
  callOpenAI,
  handleOptions,
  normalizePromptResult,
  readJson,
  requireApiKey,
  sendJson,
} = require("./_shared");

module.exports = async function handler(req, res) {
  if (handleOptions(req, res)) return;

  if (req.method !== "POST") {
    sendJson(res, 405, { ok: false, error: "POST only" });
    return;
  }

  if (!requireApiKey(res)) return;

  const body = await readJson(req);
  const result = await callOpenAI(buildOpenAIPayload(body));

  if (!result.ok) {
    sendJson(res, result.status, {
      ok: false,
      requestId: result.requestId,
      error: result.data?.error?.message || result.raw || "OpenAI API request failed",
    });
    return;
  }

  sendJson(res, 200, normalizePromptResult(result.data, result.requestId));
};
