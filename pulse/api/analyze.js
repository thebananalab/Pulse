module.exports = async (req, res) => {
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

  const { prompt } = req.body;
  const ANTHROPIC_API_KEY = process.env.ANTHROPIC_API_KEY;

  if (!ANTHROPIC_API_KEY) return res.status(500).json({ error: "API key missing" });

  try {
    const response = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": ANTHROPIC_API_KEY,
        "anthropic-version": "2023-06-01",
        "anthropic-beta": "web-search-2025-03-05", 
      },
      body: JSON.stringify({
        model: "claude-3-5-sonnet-latest",
        max_tokens: 2000, // Reducido para ganar velocidad
        tools: [{ type: "web_search_20250305" }],
        // Forzamos a Claude a que use la herramienta y responda rápido
        messages: [{ 
          role: "user", 
          content: prompt + "\nResponde directamente con el objeto JSON, sé breve en las observaciones." 
        }],
      }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error?.message || "Error en Anthropic");
    }

    const data = await response.json();
    
    // Extraemos el texto de la respuesta
    const text = data.content.find(c => c.type === 'text')?.text;
    const json = tryParse(text);

    if (json) return res.status(200).json(json);
    
    // Si no hay JSON pero hay texto, lo enviamos igual para no romper el frontend
    return res.status(200).json({ summary: text || "No se pudo generar el JSON" });

  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
};

function tryParse(text) {
  if (!text) return null;
  try {
    const s = text.indexOf("{"), e = text.lastIndexOf("}");
    if (s !== -1 && e > s) return JSON.parse(text.slice(s, e + 1));
  } catch (e) {}
  return null;
}
