const { OPENAI_MODEL, handleOptions, sendJson } = require("./_shared");

module.exports = async function handler(req, res) {
  if (handleOptions(req, res)) return;

  sendJson(res, 200, {
    ok: true,
    hasApiKey: Boolean(process.env.OPENAI_API_KEY),
    model: process.env.OPENAI_MODEL || OPENAI_MODEL,
  });
};
