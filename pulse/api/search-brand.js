function tryParseJSON(text) {
  try {
    const s = text.indexOf("{"), e = text.lastIndexOf("}");
    if (s !== -1 && e > s) return JSON.parse(text.slice(s, e + 1));
  } catch {}
  return null;
}

export default async function handler(req, res) {
  res.setHeader("Content-Type", "application/json");
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

  const { brand } = req.body || {};
  if (!brand) return res.status(400).json({ error: "Missing brand" });

  const ANTHROPIC_API_KEY = process.env.ANTHROPIC_API_KEY;
  if (!ANTHROPIC_API_KEY) return res.status(500).json({ error: "Missing API key" });

  const prompt = `Eres un investigador digital. Busca las URLs exactas y reales de presencia digital de la marca "${brand}".

Devuelve SOLO este JSON. URLs reales que conozcas. Si no existe alguna, deja el campo "". No inventes URLs.

{"website":"","instagram":"","linkedin":"","tiktok":"","twitter":"","youtube":"","facebook":"","pinterest":"","threads":""}`;

  try {
    const response = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": ANTHROPIC_API_KEY,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model: "claude-sonnet-4-20250514",
        max_tokens: 400,
        messages: [{ role: "user", content: prompt }],
      }),
    });

    if (!response.ok) return res.status(502).json({ error: "API error" });

    const data = await response.json();
    const text = (data.content || []).filter(b => b.type === "text").map(b => b.text).join("");
    const parsed = tryParseJSON(text);
    if (!parsed) return res.status(500).json({ error: "Parse error" });

    return res.status(200).json(parsed);
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
}
