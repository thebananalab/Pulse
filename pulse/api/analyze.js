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
    return res.status(500).json({ error: "API key not configured" });
  }

  try {
    // Step 1: Research with web search
    const res1 = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": ANTHROPIC_API_KEY,
        "anthropic-version": "2023-06-01",
        "anthropic-beta": "web-search-2025-03-05",
      },
      body: JSON.stringify({
        model: "claude-sonnet-4-20250514",
        max_tokens: 3000,
        tools: [{ type: "web_search_20250305", name: "web_search" }],
        messages: [{ role: "user", content: prompt }],
      }),
    });

    if (!res1.ok) {
      const err = await res1.text();
      throw new Error(`Anthropic API error ${res1.status}: ${err}`);
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

    // Try parsing directly from step 1
    const textBlocks1 = (data1.content || [])
      .filter((b) => b.type === "text")
      .map((b) => b.text);

    for (let i = textBlocks1.length - 1; i >= 0; i--) {
      const p = tryParse(textBlocks1[i]);
      if (p && p.assets) return res.status(200).json(p);
    }

    // Step 2: Force pure JSON from research context
    const brandMatch = prompt.match(/MARCA: (.+)/);
    const brandName = brandMatch ? brandMatch[1].trim() : "la marca";

    const jsonPrompt = `Basandote en esta investigacion sobre "${brandName}":

${researchSummary.slice(0, 6000)}

${
  noWebsite
    ? `IMPORTANTE: La marca NO tiene sitio web propio. Aplica las reglas: owned_media status="missing" score=15, seo status="missing" score=0, roadmap short con 3 acciones sobre construir web y captura de datos propios.`
    : ""
}

Genera EXCLUSIVAMENTE el siguiente JSON completado con datos reales de la investigacion. Absolutamente nada mas. Sin explicaciones. Sin texto. Solo el objeto JSON comenzando con { y terminando con }:

{"brand_name":"${brandName}","summary":"resumen ejecutivo 2-3 frases","score_global":50,"assets":{"owned_media":{"status":"missing","score":15,"observations":"observaciones especificas basadas en la investigacion","gap":"gap detectado"},"seo":{"status":"missing","score":0,"observations":"observaciones","gap":"gap"},"content":{"status":"weak","score":30,"observations":"observaciones","gap":"gap"},"data":{"status":"missing","score":10,"observations":"observaciones","gap":"gap"},"performance":{"status":"missing","score":5,"observations":"observaciones","gap":"gap"},"community":{"status":"weak","score":40,"observations":"observaciones","gap":"gap"},"partnerships":{"status":"missing","score":10,"observations":"observaciones","gap":"gap"},"technical":{"status":"missing","score":5,"observations":"observaciones","gap":"gap"}},"roadmap":{"short":[{"title":"titulo accion 1","description":"descripcion detallada","asset":"owned_media"},{"title":"titulo accion 2","description":"descripcion detallada","asset":"data"},{"title":"titulo accion 3","description":"descripcion detallada","asset":"owned_media"}],"mid":[{"title":"titulo","description":"descripcion","asset":"content"},{"title":"titulo","description":"descripcion","asset":"community"},{"title":"titulo","description":"descripcion","asset":"technical"}],"long":[{"title":"titulo","description":"descripcion","asset":"partnerships"},{"title":"titulo","description":"descripcion","asset":"seo"},{"title":"titulo","description":"descripcion","asset":"performance"}]},"biggest_opportunity":"oportunidad principal de growth"}`;

    const res2 = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": ANTHROPIC_API_KEY,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model: "claude-sonnet-4-20250514",
        max_tokens: 2000,
        messages: [{ role: "user", content: jsonPrompt }],
      }),
    });

    if (!res2.ok) throw new Error(`Step 2 API error ${res2.status}`);
    const data2 = await res2.json();

    const textBlocks2 = (data2.content || [])
      .filter((b) => b.type === "text")
      .map((b) => b.text);

    for (let i = textBlocks2.length - 1; i >= 0; i--) {
      const p = tryParse(textBlocks2[i]);
      if (p && p.assets) return res.status(200).json(p);
    }

    const p = tryParse(textBlocks2.join("\n"));
    if (p) return res.status(200).json(p);

    return res.status(500).json({ error: "No se pudo generar el reporte" });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: err.message });
  }
}

function tryParse(text) {
  if (!text) return null;
  try {
    const fenced = text.match(/```json\s*([\s\S]*?)\s*```/);
    if (fenced) return JSON.parse(fenced[1]);
  } catch {}
  try {
    const fenced = text.match(/```\s*([\s\S]*?)\s*```/);
    if (fenced) return JSON.parse(fenced[1]);
  } catch {}
  try {
    const s = text.indexOf("{"), e = text.lastIndexOf("}");
    if (s !== -1 && e > s) return JSON.parse(text.slice(s, e + 1));
  } catch {}
  try {
    const s = text.indexOf("{"), e = text.lastIndexOf("}");
    if (s !== -1 && e > s) {
      const raw = text
        .slice(s, e + 1)
        .replace(/,\s*([}\]])/g, "$1")
        .replace(/'/g, '"');
      return JSON.parse(raw);
    }
  } catch {}
  return null;
}
