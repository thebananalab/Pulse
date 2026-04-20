const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
const GEMINI_URL = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${GEMINI_API_KEY}`;

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
        .replace(/'/g, '"');
      return JSON.parse(raw);
    }
  } catch {}
  return null;
}

async function callGemini(prompt, maxTokens = 2000) {
  const response = await fetch(GEMINI_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      contents: [{ parts: [{ text: prompt }] }],
      generationConfig: { maxOutputTokens: maxTokens, temperature: 0.7 },
    }),
  });

  if (!response.ok) {
    const err = await response.text();
    throw new Error(`Gemini error ${response.status}: ${err.slice(0, 200)}`);
  }

  const data = await response.json();
  return data.candidates?.[0]?.content?.parts?.[0]?.text || "";
}

export default async function handler(req, res) {
  res.setHeader("Content-Type", "application/json");

  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const { prompt, noWebsite } = req.body || {};
  if (!prompt) return res.status(400).json({ error: "Missing prompt" });

  const brandMatch = prompt.match(/MARCA: (.+)/);
  const brandName = brandMatch ? brandMatch[1].trim() : "la marca";

  const noWebNote = noWebsite
    ? `IMPORTANTE: La marca NO tiene sitio web propio. Aplica estrictamente: owned_media status="missing" score maximo 15, seo status="missing" score=0. Las 3 acciones del roadmap short deben ser todas sobre construir sitio web propio y sistema de captura de datos.`
    : "";

  const jsonPrompt = `Eres un consultor senior de growth y marketing digital. Analiza el ecosistema digital de esta marca basandote en los datos proporcionados y tu conocimiento de la marca.

${prompt}

${noWebNote}

Genera EXCLUSIVAMENTE el siguiente JSON. Sin texto antes ni despues. Sin backticks. Solo el objeto JSON empezando con { y terminando con }:

{"brand_name":"${brandName}","summary":"resumen ejecutivo 2-3 frases directo y profesional sobre el estado digital de la marca","score_global":50,"assets":{"owned_media":{"status":"strong|weak|missing","score":50,"observations":"Analiza: 1) CTAs: hay CTA claro above the fold, copy especifico o generico. 2) Copy: diferenciado o corporativo. 3) UX: navegacion, jerarquia visual, mobile-first, estructura del funnel.","gap":"gap principal en CTAs, copy o UX"},"seo":{"status":"strong|weak|missing","score":50,"observations":"Analiza: URLs amigables, meta titles, H1 claro, blog activo, frecuencia de contenido, senales de autoridad.","gap":"gap principal de SEO"},"content":{"status":"strong|weak|missing","score":50,"observations":"observaciones sobre blog, videos, recursos descargables, frecuencia y calidad","gap":"gap de contenido"},"data":{"status":"strong|weak|missing","score":50,"observations":"Senales externas: formularios visibles, newsletter, lead magnets, popups de captura","gap":"gap de captura de datos"},"performance":{"status":"strong|weak|missing","score":50,"observations":"Senales externas: pixels detectables, landing pages especificas, retargeting evidente","gap":"gap de performance"},"community":{"status":"strong|weak|missing","score":50,"observations":"Estado de redes sociales: frecuencia, engagement visible, UGC, comunidad activa","gap":"gap de comunidad"},"partnerships":{"status":"strong|weak|missing","score":50,"observations":"Presencia en directorios, backlinks visibles, colaboraciones publicadas, afiliados","gap":"gap de partnerships"},"technical":{"status":"strong|weak|missing","score":50,"observations":"Senales externas: analytics, chat, herramientas detectables, stack visible","gap":"gap tecnico"}},"roadmap":{"short":[{"title":"titulo accion concreta 1","description":"descripcion detallada del impacto y como ejecutarla en menos de 3 meses","asset":"owned_media"},{"title":"titulo accion concreta 2","description":"descripcion detallada","asset":"data"},{"title":"titulo accion concreta 3","description":"descripcion detallada","asset":"seo"}],"mid":[{"title":"titulo","description":"descripcion detallada de accion a 3-9 meses","asset":"content"},{"title":"titulo","description":"descripcion detallada","asset":"community"},{"title":"titulo","description":"descripcion detallada","asset":"technical"}],"long":[{"title":"titulo","description":"descripcion detallada de accion a 9-18 meses","asset":"partnerships"},{"title":"titulo","description":"descripcion detallada","asset":"performance"},{"title":"titulo","description":"descripcion detallada","asset":"data"}]},"biggest_opportunity":"una frase especifica que capture la mayor oportunidad de growth para esta marca concreta"}`;

  try {
    const text = await callGemini(jsonPrompt, 2000);

    const p = tryParse(text);
    if (p && p.assets) return res.status(200).json(p);

    return res.status(500).json({ error: "No se pudo generar el reporte. Intenta de nuevo." });
  } catch (err) {
    console.error("Handler error:", err);
    return res.status(500).json({ error: err.message || "Error interno del servidor" });
  }
}
