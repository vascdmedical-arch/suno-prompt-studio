const { OPENAI_MODEL, callOpenAI, handleOptions, requireApiKey, sendJson } = require("./_shared");

module.exports = async function handler(req, res) {
  if (handleOptions(req, res)) return;

  if (req.method !== "POST") {
    sendJson(res, 405, { ok: false, error: "POST only" });
    return;
  }

  if (!requireApiKey(res)) return;

  const result = await callOpenAI({
    model: process.env.OPENAI_MODEL || OPENAI_MODEL,
    input: "Return OK as plain text.",
    max_output_tokens: 16,
  });

  if (!result.ok) {
    sendJson(res, result.status, {
      ok: false,
      requestId: result.requestId,
      error: result.data?.error?.message || result.raw || "OpenAI API request failed",
    });
    return;
  }

  sendJson(res, 200, {
    ok: true,
    model: result.data.model || process.env.OPENAI_MODEL || OPENAI_MODEL,
    requestId: result.requestId,
  });
};
