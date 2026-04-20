const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
const GEMINI_URL = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${GEMINI_API_KEY}`;

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

  const prompt = `Eres un investigador digital. Busca las URLs exactas y reales de presencia digital de la marca "${brand}".

Devuelve SOLO este JSON. URLs reales que conozcas. Si no existe alguna, deja el campo "". No inventes URLs.

{"website":"","instagram":"","linkedin":"","tiktok":"","twitter":"","youtube":"","facebook":"","pinterest":"","threads":""}`;

  try {
    const response = await fetch(GEMINI_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: { maxOutputTokens: 400, temperature: 0.3 },
      }),
    });

    if (!response.ok) {
      const err = await response.text();
      return res.status(502).json({ error: `Gemini error: ${err.slice(0, 120)}` });
    }

    const data = await response.json();
    const text = data.candidates?.[0]?.content?.parts?.[0]?.text || "";
    const parsed = tryParseJSON(text);
    if (!parsed) return res.status(500).json({ error: "Parse error" });

    return res.status(200).json(parsed);
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
}
