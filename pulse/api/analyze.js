export default async function handler(req, res) {
  // Always respond with JSON
  res.setHeader("Content-Type", "application/json");

  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const { prompt, noWebsite } = req.body || {};

  if (!prompt) {
    return res.status(400).json({ error: "Missing prompt" });
  }

  const ANTHROPIC_API_KEY = process.env.ANTHROPIC_API_KEY;
  if (!ANTHROPIC_API_KEY) {
    return res.status(500).json({ error: "ANTHROPIC_API_KEY no configurada en Vercel" });
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
      const errText = await res1.text();
      console.error("Step 1 error:", res1.status, errText);
      return res.status(502).json({ error: `Error en investigacion: ${res1.status}` });
    }

    const data1 = await res1.json();

    // Try parsing JSON directly from step 1 text blocks
    const textBlocks1 = (data1.content || [])
      .filter((b) => b.type === "text")
      .map((b) => b.text);

    for (let i = textBlocks1.length - 1; i >= 0; i--) {
      const p = tryParse(textBlocks1[i]);
      if (p && p.assets) return res.status(200).json(p);
    }

    // Collect full research context for step 2
    const researchSummary = (data1.content || [])
      .map((b) => {
        if (b.type === "text") return b.text;
        if (b.type === "tool_result") {
          try { return JSON.stringify(b.content); } catch { return ""; }
        }
        return "";
      })
      .filter(Boolean)
      .join("\n")
      .slice(0, 6000);

    // Extract brand name from prompt
    const brandMatch = prompt.match(/MARCA: (.+)/);
    const brandName = brandMatch ? brandMatch[1].trim() : "la marca";

    const noWebNote = noWebsite
      ? `IMPORTANTE: La marca NO tiene sitio web propio. Aplica: owned_media status="missing" score=15, seo status="missing" score=0. Las 3 acciones de short deben ser sobre construir web y captura de datos propios.`
      : "";

    // Step 2: Pure JSON generation — no tools, no ambiguity
    const jsonPrompt = `Basandote en esta investigacion sobre "${brandName}":

${researchSummary}

${noWebNote}

Genera EXCLUSIVAMENTE el siguiente JSON completado con datos reales. Nada mas. Sin explicacion. Sin texto extra. Empieza con { y termina con }:

{"brand_name":"${brandName}","summary":"resumen ejecutivo 2-3 frases directo y profesional","score_global":50,"assets":{"owned_media":{"status":"missing","score":15,"observations":"observaciones especificas basadas en la investigacion sobre CTAs, copy y UX","gap":"gap principal detectado"},"seo":{"status":"missing","score":0,"observations":"observaciones sobre estructura tecnica, contenido y autoridad","gap":"gap de SEO"},"content":{"status":"weak","score":30,"observations":"observaciones sobre blog, videos, recursos","gap":"gap de contenido"},"data":{"status":"missing","score":10,"observations":"observaciones sobre formularios, newsletter, captura de leads","gap":"gap de datos"},"performance":{"status":"missing","score":5,"observations":"observaciones sobre paid, pixels, landing pages","gap":"gap de performance"},"community":{"status":"weak","score":40,"observations":"observaciones sobre redes sociales y engagement","gap":"gap de comunidad"},"partnerships":{"status":"missing","score":10,"observations":"observaciones sobre backlinks y partnerships","gap":"gap de partnerships"},"technical":{"status":"missing","score":5,"observations":"observaciones sobre analytics y stack tecnico","gap":"gap tecnico"}},"roadmap":{"short":[{"title":"titulo accion 1","description":"descripcion detallada del impacto y como ejecutarla","asset":"owned_media"},{"title":"titulo accion 2","description":"descripcion detallada","asset":"data"},{"title":"titulo accion 3","description":"descripcion detallada","asset":"seo"}],"mid":[{"title":"titulo","description":"descripcion detallada","asset":"content"},{"title":"titulo","description":"descripcion detallada","asset":"community"},{"title":"titulo","description":"descripcion detallada","asset":"technical"}],"long":[{"title":"titulo","description":"descripcion detallada","asset":"partnerships"},{"title":"titulo","description":"descripcion detallada","asset":"performance"},{"title":"titulo","description":"descripcion detallada","asset":"data"}]},"biggest_opportunity":"oportunidad principal de growth especifica para esta marca"}`;

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

    if (!res2.ok) {
      const errText = await res2.text();
      console.error("Step 2 error:", res2.status, errText);
      return res.status(502).json({ error: `Error generando reporte: ${res2.status}` });
    }

    const data2 = await res2.json();
    const textBlocks2 = (data2.content || [])
      .filter((b) => b.type === "text")
      .map((b) => b.text);

    for (let i = textBlocks2.length - 1; i >= 0; i--) {
      const p = tryParse(textBlocks2[i]);
      if (p && p.assets) return res.status(200).json(p);
    }

    const fallback = tryParse(textBlocks2.join("\n"));
    if (fallback) return res.status(200).json(fallback);

    return res.status(500).json({ error: "No se pudo generar el reporte. Intenta de nuevo." });

  } catch (err) {
    console.error("Handler error:", err);
    return res.status(500).json({ error: err.message || "Error interno del servidor" });
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
      const raw = text.slice(s, e + 1)
        .replace(/,\s*([}\]])/g, "$1")
        .replace(/\'\'/g, '\"');
      return JSON.parse(raw);
    }
  } catch {}
  return null;
}
