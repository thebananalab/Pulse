// 1. Usamos module.exports para que Vercel lo encuentre sí o sí
module.exports = async (req, res) => {
  
  // Solo aceptamos POST
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const { prompt, noWebsite } = req.body;

  if (!prompt) {
    return res.status(400).json({ error: "Missing prompt" });
  }

  // 2. Verificación de la API Key dentro de la función
  const ANTHROPIC_API_KEY = process.env.ANTHROPIC_API_KEY;

  if (!ANTHROPIC_API_KEY) {
    return res.status(500).json({ 
      error: "API key not configured",
      env_keys_found: Object.keys(process.env).filter(k => !k.includes('VERCEL')) 
    });
  }

  try {
    // LLAMADA A ANTHROPIC (Paso 1: Búsqueda)
    const res1 = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": ANTHROPIC_API_KEY,
        "anthropic-version": "2023-06-01",
        "anthropic-beta": "web-search-2025-03-05", 
      },
      body: JSON.stringify({
        model: "claude-3-5-sonnet-latest",
        max_tokens: 3000,
        tools: [{ type: "web_search_20250305" }], 
        messages: [{ role: "user", content: prompt }],
      }),
    });

    if (!res1.ok) {
      const err = await res1.json();
      throw new Error(`Anthropic Error: ${err.error?.message || res1.statusText}`);
    }

    const data1 = await res1.json();
    
    // Aquí iría el resto de tu lógica de procesamiento...
    // Por ahora, devolvemos el resultado de Claude para confirmar que funciona:
    return res.status(200).json(data1);

  } catch (err) {
    console.error("ERROR:", err.message);
    return res.status(500).json({ error: err.message });
  }
};

// 3. La función de ayuda fuera del export principal
function tryParse(text) {
  // ... tu código de tryParse ...
}
