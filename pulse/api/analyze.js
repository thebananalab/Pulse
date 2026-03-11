export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const { prompt, noWebsite } = req.body;

  if (!prompt) {
    return res.status(400).json({ error: "Missing prompt" });
  }

  const ANTHROPIC_API_KEY = process.env.ANTHROPIC_API_KEY;
  if (!ANTHROPIC_API_KEY) {
    return res.status(500).json({ error: "API key not configured en Vercel" });
  }

  try {
    // Step 1: Research with web search
    const res1 = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": ANTHROPIC_API_KEY,
        "anthropic-version": "2023-06-01",
        // Asegúrate de tener acceso a esta beta en tu cuenta de Anthropic
        "anthropic-beta": "web-search-2025-03-05", 
      },
      body: JSON.stringify({
        model: "claude-3-5-sonnet-latest", // <--- Actualizado
        max_tokens: 3000,
        tools: [{ type: "web_search_20250305" }], 
        messages: [{ role: "user", content: prompt }],
      }),
    });

    if (!res1.ok) {
      const err = await res1.json();
      throw new Error(`Anthropic API error (Step 1): ${err.error?.message || res1.statusText}`);
    }

    const data1 = await res1.json();

    // Collect research context
    const researchSummary = (data1.content || [])
      .map((b) => {
        if (b.type === "text") return b.text;
        if (b.type === "tool_result") return JSON.stringify(b.content || "");
        return "";
      })
      .filter(Boolean)
      .join("\n");

    // Intentar parsear directamente si Claude ya nos dio el JSON
    const textBlocks1 = (data1.content || [])
      .filter((b) => b.type === "text")
      .map((b) => b.text);

    for (let i = textBlocks1.length - 1; i >= 0; i--) {
      const p = tryParse(textBlocks1[i]);
      if (p && p.assets) return res.status(200).json(p);
    }

    // Step 2: Force pure JSON si el paso 1 no devolvió el formato final
    const brandMatch = prompt.match(/MARCA: (.+)/);
    const brandName = brandMatch ? brandMatch[1].trim() : "la marca";

    const jsonPrompt = `Basandote en esta investigacion sobre "${brandName}":
    ${researchSummary.slice(0, 6000)}
    ${noWebsite ? "REGLA: owned_media status='missing', score=15." : ""}
    Genera EXCLUSIVAMENTE el JSON solicitado. Sin texto adicional.`;

    const res2 = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": ANTHROPIC_API_KEY,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model: "claude-3-5-sonnet-latest", // <--- Actualizado
        max_tokens: 2000,
        messages: [{ role: "user", content: jsonPrompt }],
      }),
    });

    if (!res2.ok) throw new Error(`Step 2 API error ${res2.status}`);
    const data2 = await res2.json();

    const resultText = data2.content.filter(b => b.type === 'text').map(b => b.text).join('\n');
    const finalJson = tryParse(resultText);

    if (finalJson) {
      return res.status(200).json(finalJson);
    }

    return res.status(500).json({ error: "No se pudo procesar el JSON final" });

  } catch (err) {
    console.error("ERROR EN API:", err.message);
    return res.status(500).json({ error: err.message });
  }
}

// ... Mantén tu función tryParse igual abajo
