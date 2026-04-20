import { useState, useRef } from "react";
import { saveEmail } from "./firebase";

const C = {
  cream: "#f5f2eb",
  ink: "#1a1a18",
  inkMid: "#3a3a36",
  inkLight: "#6b6b64",
  inkFaint: "#a8a89e",
  inkLine: "#d4d0c8",
  white: "#ffffff",
  strong: "#2d6a4f",   strongBg: "#eef5f1",
  weak: "#8b5e00",     weakBg: "#fdf6e7",
  missing: "#8b1a1a",  missingBg: "#fdf0f0",
  short: "#2d6a4f",    shortBg: "#eef5f1",
  mid: "#1a3d6b",      midBg: "#eef2f8",
  long: "#4a2060",     longBg: "#f5eefa",
};

const ASSETS = [
  { key: "owned_media",  label: "Owned Media",            desc: "Web, CTAs, copy, UX"               },
  { key: "seo",          label: "SEO & Posicionamiento",  desc: "Estructura, contenido, tecnico"     },
  { key: "content",      label: "Content Assets",         desc: "Blog, videos, recursos"             },
  { key: "data",         label: "Data Assets",            desc: "CRM, listas, tracking"              },
  { key: "performance",  label: "Performance",            desc: "Paid, automatizacion, CRO"          },
  { key: "community",    label: "Community & Social",     desc: "Comunidad, engagement, UGC"         },
  { key: "partnerships", label: "Partnerships",           desc: "Afiliados, backlinks, canales"      },
  { key: "technical",    label: "Technical Stack",        desc: "Analytics, herramientas, integr."   },
];

const STATUS_CONFIG = {
  strong:  { label: "Solido",  color: C.strong,  bg: C.strongBg  },
  weak:    { label: "Debil",   color: C.weak,    bg: C.weakBg    },
  missing: { label: "Ausente", color: C.missing, bg: C.missingBg },
};

const HORIZON_CONFIG = {
  short: { label: "Corto plazo", sub: "0 - 3 meses",  color: C.short, bg: C.shortBg },
  mid:   { label: "Medio plazo", sub: "3 - 9 meses",  color: C.mid,   bg: C.midBg   },
  long:  { label: "Largo plazo", sub: "9 - 18 meses", color: C.long,  bg: C.longBg  },
};

const CACHE_PREFIX = "blink_report_";
const EMAIL_KEY    = "blink_email_collected";

function cacheKey(brand, website) {
  const b = (brand || "").toLowerCase().trim().replace(/\s+/g, "_");
  const w = (website || "").toLowerCase().trim().replace(/https?:\/\//, "").replace(/\/$/, "");
  return CACHE_PREFIX + b + (w ? `__${w}` : "");
}

function getCache(brand, website) {
  try {
    const raw = localStorage.getItem(cacheKey(brand, website));
    return raw ? JSON.parse(raw) : null;
  } catch { return null; }
}

function setCache(brand, website, data) {
  try {
    localStorage.setItem(cacheKey(brand, website), JSON.stringify(data));
  } catch {}
}

function buildPrompt(brandName, webLine, socialsText) {
  return `Eres un consultor senior de growth y marketing digital. Investiga y analiza el ecosistema digital de esta marca usando informacion publica.

MARCA: ${brandName}
WEB: ${webLine}
REDES SOCIALES: ${socialsText || "No especificadas"}

REGLA CRITICA — SIN SITIO WEB:
Si la marca no tiene sitio web propio, esto es una alerta maxima:
- owned_media debe tener status "missing" y score maximo de 15
- seo debe tener status "missing" y score de 0
- El summary debe mencionar explicitamente que la marca no tiene canal propio
- Las 3 acciones del roadmap short deben ser TODAS sobre crear sitio web y captura de datos propia
- biggest_opportunity debe ser sobre construir presencia propia
- El gap de owned_media debe enfatizar: sin web propia la marca no posee ningun canal digital real, es completamente dependiente de plataformas terceras

Devuelve UNICAMENTE un JSON valido. Sin texto. Sin backticks. Solo JSON puro.

{
  "brand_name": "${brandName}",
  "summary": "Resumen ejecutivo 2-3 frases. Tono directo y profesional.",
  "score_global": 65,
  "assets": {
    "owned_media":    { "status": "strong|weak|missing", "score": 75, "observations": "1) CTAs: hay CTA claro above the fold, copy especifico o generico. 2) Copy: diferenciado o corporativo, habla al cliente o de la empresa. 3) UX: navegacion, jerarquia visual, mobile-first, velocidad, estructura del funnel.", "gap": "Gap principal en CTAs, copy o UX — o SIN CANAL PROPIO si no tiene web" },
    "seo":            { "status": "strong|weak|missing", "score": 50, "observations": "1) Tecnico: URLs amigables, meta titles, H1 claro, sitemap.xml. 2) Contenido: blog activo, frecuencia, keywords en titulos. 3) Autoridad: presencia en directorios, menciones, indexacion estimada.", "gap": "Gap principal de SEO" },
    "content":        { "status": "strong|weak|missing", "score": 50, "observations": "observaciones especificas", "gap": "gap detectado" },
    "data":           { "status": "strong|weak|missing", "score": 30, "observations": "Senales externas: formularios, popups, newsletter visible, lead magnets", "gap": "gap detectado" },
    "performance":    { "status": "strong|weak|missing", "score": 40, "observations": "Senales externas: pixels detectables, landing pages, retargeting evidente", "gap": "gap detectado" },
    "community":      { "status": "strong|weak|missing", "score": 60, "observations": "observaciones especificas", "gap": "gap detectado" },
    "partnerships":   { "status": "strong|weak|missing", "score": 35, "observations": "observaciones especificas", "gap": "gap detectado" },
    "technical":      { "status": "strong|weak|missing", "score": 45, "observations": "Senales externas: analytics, chat, herramientas detectables en el sitio", "gap": "gap detectado" }
  },
  "roadmap": {
    "short": [
      {"title": "Accion concreta", "description": "Descripcion del impacto y como ejecutarla", "asset": "owned_media"},
      {"title": "...", "description": "...", "asset": "data"},
      {"title": "...", "description": "...", "asset": "seo"}
    ],
    "mid": [
      {"title": "...", "description": "...", "asset": "performance"},
      {"title": "...", "description": "...", "asset": "community"},
      {"title": "...", "description": "...", "asset": "technical"}
    ],
    "long": [
      {"title": "...", "description": "...", "asset": "partnerships"},
      {"title": "...", "description": "...", "asset": "content"},
      {"title": "...", "description": "...", "asset": "data"}
    ]
  },
  "biggest_opportunity": "Una frase que capture la mayor oportunidad de growth para esta marca"
}`;
}

function IconAsset({ assetKey, size = 18 }) {
  const s = size;
  const icons = {
    owned_media:    <svg width={s} height={s} viewBox="0 0 18 18" fill="none"><rect x="1" y="3" width="16" height="12" rx="1" stroke="currentColor" strokeWidth="1.2"/><path d="M1 7h16" stroke="currentColor" strokeWidth="1.2"/><circle cx="4" cy="5" r="0.8" fill="currentColor"/><circle cx="7" cy="5" r="0.8" fill="currentColor"/></svg>,
    seo:            <svg width={s} height={s} viewBox="0 0 18 18" fill="none"><circle cx="8" cy="8" r="5" stroke="currentColor" strokeWidth="1.2"/><path d="M12 12l3.5 3.5" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round"/><path d="M6 8h4M8 6v4" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round"/></svg>,
    content:        <svg width={s} height={s} viewBox="0 0 18 18" fill="none"><path d="M3 2h8l4 4v10H3V2z" stroke="currentColor" strokeWidth="1.2"/><path d="M11 2v4h4" stroke="currentColor" strokeWidth="1.2"/><path d="M6 9h6M6 12h4" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round"/></svg>,
    data:           <svg width={s} height={s} viewBox="0 0 18 18" fill="none"><ellipse cx="9" cy="5" rx="6" ry="2.5" stroke="currentColor" strokeWidth="1.2"/><path d="M3 5v4c0 1.38 2.69 2.5 6 2.5S15 10.38 15 9V5" stroke="currentColor" strokeWidth="1.2"/><path d="M3 9v4c0 1.38 2.69 2.5 6 2.5S15 14.38 15 13V9" stroke="currentColor" strokeWidth="1.2"/></svg>,
    performance:    <svg width={s} height={s} viewBox="0 0 18 18" fill="none"><path d="M2 13l4-5 3 3 3-6 4 3" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"/><circle cx="15" cy="8" r="1.5" fill="currentColor"/></svg>,
    community:      <svg width={s} height={s} viewBox="0 0 18 18" fill="none"><circle cx="9" cy="6" r="3" stroke="currentColor" strokeWidth="1.2"/><path d="M3 16c0-3.31 2.69-6 6-6s6 2.69 6 6" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round"/></svg>,
    partnerships:   <svg width={s} height={s} viewBox="0 0 18 18" fill="none"><circle cx="4" cy="9" r="2.5" stroke="currentColor" strokeWidth="1.2"/><circle cx="14" cy="9" r="2.5" stroke="currentColor" strokeWidth="1.2"/><path d="M6.5 9h5" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round"/></svg>,
    technical:      <svg width={s} height={s} viewBox="0 0 18 18" fill="none"><path d="M6 4l-4 5 4 5M12 4l4 5-4 5" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"/></svg>,
  };
  return icons[assetKey] || null;
}

function ScoreBar({ score }) {
  const color = score >= 70 ? C.strong : score >= 45 ? C.weak : C.missing;
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
      <div style={{ flex: 1, height: 3, background: C.inkLine, borderRadius: 2 }}>
        <div style={{ width: `${score}%`, height: "100%", background: color, borderRadius: 2, transition: "width 1s ease" }} />
      </div>
      <span style={{ fontSize: 12, fontFamily: "'Space Grotesk', sans-serif", fontWeight: 600, color: C.inkMid, minWidth: 26, textAlign: "right" }}>{score}</span>
    </div>
  );
}

function AssetRow({ asset, data, index }) {
  const st = STATUS_CONFIG[data.status] || STATUS_CONFIG.weak;
  return (
    <div style={{
      borderBottom: `1px solid ${C.inkLine}`,
      padding: "22px 0",
      display: "grid",
      gridTemplateColumns: "220px 1fr 100px",
      gap: 32,
      alignItems: "start",
      animation: "fadeUp 0.4s ease both",
      animationDelay: `${index * 60}ms`,
    }}>
      <div>
        <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 4 }}>
          <span style={{ color: C.inkLight }}><IconAsset assetKey={asset.key} /></span>
          <span style={{ fontFamily: "'Space Grotesk', sans-serif", fontWeight: 700, fontSize: 14, color: C.ink }}>{asset.label}</span>
        </div>
        <span style={{ fontSize: 11, color: C.inkFaint, letterSpacing: "0.06em", textTransform: "uppercase" }}>{asset.desc}</span>
      </div>
      <div>
        <p style={{ margin: "0 0 8px", fontSize: 13, color: C.inkMid, lineHeight: 1.75 }}>{data.observations}</p>
        {data.gap && (
          <p style={{ margin: 0, fontSize: 12, color: C.inkLight, fontStyle: "italic", lineHeight: 1.6 }}>Gap — {data.gap}</p>
        )}
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: 10, alignItems: "flex-end" }}>
        <span style={{
          fontSize: 10, letterSpacing: "0.1em", textTransform: "uppercase",
          color: st.color, background: st.bg, padding: "3px 9px",
          border: `1px solid ${st.color}22`,
        }}>{st.label}</span>
        <ScoreBar score={data.score} />
      </div>
    </div>
  );
}

function RoadmapBlock({ horizon, items }) {
  const cfg = HORIZON_CONFIG[horizon];
  const assetMap = Object.fromEntries(ASSETS.map(a => [a.key, a]));
  return (
    <div style={{ borderTop: `1px solid ${C.inkLine}`, paddingTop: 28 }}>
      <div style={{ display: "flex", alignItems: "baseline", gap: 16, marginBottom: 22 }}>
        <h3 style={{ margin: 0, fontFamily: "'Space Grotesk', sans-serif", fontSize: 18, fontWeight: 700, color: C.ink }}>{cfg.label}</h3>
        <span style={{ fontSize: 11, color: C.inkFaint, letterSpacing: "0.1em", textTransform: "uppercase" }}>{cfg.sub}</span>
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 16 }}>
        {items.map((item, i) => (
          <div key={i} style={{ padding: "18px 20px", background: cfg.bg, border: `1px solid ${cfg.color}22` }}>
            <div style={{ fontSize: 10, color: cfg.color, letterSpacing: "0.12em", textTransform: "uppercase", marginBottom: 8 }}>
              {String(i + 1).padStart(2, "0")}
              {item.asset && assetMap[item.asset] && (
                <span style={{ marginLeft: 8, color: C.inkFaint }}>{assetMap[item.asset].label}</span>
              )}
            </div>
            <div style={{ fontFamily: "'Space Grotesk', sans-serif", fontSize: 14, fontWeight: 700, color: C.ink, marginBottom: 8, lineHeight: 1.3 }}>{item.title}</div>
            <div style={{ fontSize: 12, color: C.inkMid, lineHeight: 1.7 }}>{item.description}</div>
          </div>
        ))}
      </div>
    </div>
  );
}

function InputField({ label, value, onChange, placeholder, full }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 6, gridColumn: full ? "1 / -1" : undefined }}>
      <label style={{ fontSize: 10, color: C.inkFaint, letterSpacing: "0.12em", textTransform: "uppercase" }}>{label}</label>
      <input
        value={value}
        onChange={e => onChange(e.target.value)}
        placeholder={placeholder}
        style={{
          background: "transparent", border: "none", borderBottom: `1px solid ${C.inkLine}`,
          padding: "9px 0", fontSize: 14, color: C.ink, fontFamily: "'DM Sans', sans-serif",
          outline: "none", transition: "border-color 0.2s",
        }}
        onFocus={e => e.target.style.borderBottomColor = C.ink}
        onBlur={e => e.target.style.borderBottomColor = C.inkLine}
      />
    </div>
  );
}

function EmailModal({ brandName, onClose }) {
  const [email, setEmail] = useState("");
  const [saving, setSaving] = useState(false);
  const [done, setDone] = useState(false);
  const [err, setErr] = useState(null);

  const submit = async () => {
    if (!email || !email.includes("@")) { setErr("Email invalido."); return; }
    setSaving(true); setErr(null);
    try {
      await saveEmail(email, brandName);
      localStorage.setItem(EMAIL_KEY, "1");
      setDone(true);
    } catch (e) {
      setErr("Error al guardar. Intenta de nuevo.");
    }
    setSaving(false);
  };

  return (
    <div style={{
      position: "fixed", inset: 0, background: "rgba(26,26,24,0.55)",
      display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1000,
    }} onClick={onClose}>
      <div style={{
        background: C.cream, border: `1px solid ${C.inkLine}`,
        padding: "44px 48px", maxWidth: 420, width: "90%",
        animation: "fadeUp 0.3s ease both",
      }} onClick={e => e.stopPropagation()}>
        {done ? (
          <>
            <p style={{ fontFamily: "'Space Grotesk', sans-serif", fontSize: 18, fontWeight: 700, color: C.ink, marginBottom: 10 }}>Listo.</p>
            <p style={{ fontSize: 13, color: C.inkMid, lineHeight: 1.7 }}>Email guardado. Te enviamos el reporte.</p>
            <button onClick={onClose} style={{
              marginTop: 28, background: C.ink, color: C.cream, border: "none",
              padding: "11px 28px", fontSize: 11, letterSpacing: "0.12em",
              textTransform: "uppercase", cursor: "pointer", fontFamily: "'DM Sans', sans-serif", fontWeight: 600,
            }}>Cerrar</button>
          </>
        ) : (
          <>
            <p style={{ fontSize: 10, color: C.inkFaint, letterSpacing: "0.14em", textTransform: "uppercase", marginBottom: 12 }}>Reporte listo</p>
            <p style={{ fontFamily: "'Space Grotesk', sans-serif", fontSize: 20, fontWeight: 700, color: C.ink, marginBottom: 10, lineHeight: 1.2 }}>
              Recibe el diagnostico<br/>en tu email.
            </p>
            <p style={{ fontSize: 13, color: C.inkMid, lineHeight: 1.7, marginBottom: 28 }}>
              Ingresa tu email para guardar y recibir este reporte.
            </p>
            <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
              <label style={{ fontSize: 10, color: C.inkFaint, letterSpacing: "0.12em", textTransform: "uppercase" }}>Email</label>
              <input
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                onKeyDown={e => e.key === "Enter" && submit()}
                placeholder="tu@email.com"
                autoFocus
                style={{
                  background: "transparent", border: "none", borderBottom: `1px solid ${C.inkLine}`,
                  padding: "9px 0", fontSize: 14, color: C.ink, fontFamily: "'DM Sans', sans-serif",
                  outline: "none",
                }}
              />
            </div>
            {err && <p style={{ marginTop: 10, fontSize: 12, color: C.missing, fontStyle: "italic" }}>{err}</p>}
            <div style={{ marginTop: 28, display: "flex", gap: 16, alignItems: "center" }}>
              <button onClick={submit} disabled={saving} style={{
                background: saving ? C.inkFaint : C.ink, color: C.cream, border: "none",
                padding: "11px 28px", fontSize: 11, letterSpacing: "0.12em",
                textTransform: "uppercase", cursor: saving ? "not-allowed" : "pointer",
                fontFamily: "'DM Sans', sans-serif", fontWeight: 600,
              }}>
                {saving ? "Guardando..." : "Enviar reporte"}
              </button>
              <button onClick={onClose} style={{
                background: "transparent", border: "none", fontSize: 11,
                color: C.inkFaint, cursor: "pointer", letterSpacing: "0.1em",
                textTransform: "uppercase", fontFamily: "'DM Sans', sans-serif",
              }}>
                Omitir
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

export default function App() {
  const [form, setForm] = useState({
    brand: "", website: "",
    instagram: "", linkedin: "", tiktok: "", twitter: "",
    youtube: "", facebook: "", pinterest: "", threads: "",
  });
  const [loading, setLoading] = useState(false);
  const [report, setReport] = useState(null);
  const [error, setError] = useState(null);
  const [showEmailModal, setShowEmailModal] = useState(false);
  const reportRef = useRef(null);

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const analyze = async () => {
    if (!form.brand) return;

    const cached = getCache(form.brand, form.website);
    if (cached) {
      setReport(cached);
      setTimeout(() => reportRef.current?.scrollIntoView({ behavior: "smooth" }), 100);
      if (!localStorage.getItem(EMAIL_KEY)) setShowEmailModal(true);
      return;
    }

    setLoading(true); setError(null); setReport(null);
    try {
      const noWebsite = !form.website || form.website.trim() === "";
      const webLine = noWebsite ? "NO TIENE SITIO WEB — solo presencia en redes sociales" : form.website;
      const socialsText = [
        form.instagram && `Instagram: ${form.instagram}`,
        form.linkedin  && `LinkedIn: ${form.linkedin}`,
        form.tiktok    && `TikTok: ${form.tiktok}`,
        form.twitter   && `Twitter: ${form.twitter}`,
        form.youtube   && `YouTube: ${form.youtube}`,
        form.facebook  && `Facebook: ${form.facebook}`,
        form.pinterest && `Pinterest: ${form.pinterest}`,
        form.threads   && `Threads: ${form.threads}`,
      ].filter(Boolean).join(", ");

      const prompt = buildPrompt(form.brand, webLine, socialsText);

      const res = await fetch("/api/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt, noWebsite }),
      });

      const text = await res.text();
      if (!res.ok) {
        let msg = `Error ${res.status}`;
        try { msg = JSON.parse(text).error || msg; } catch {}
        throw new Error(msg);
      }

      let r;
      try { r = JSON.parse(text); } catch {
        throw new Error("Respuesta invalida del servidor");
      }
      if (!r || !r.assets) throw new Error("Reporte invalido recibido");

      setCache(form.brand, form.website, r);
      setReport(r);
      setTimeout(() => reportRef.current?.scrollIntoView({ behavior: "smooth" }), 100);
      if (!localStorage.getItem(EMAIL_KEY)) setShowEmailModal(true);
    } catch (e) {
      setError(`${e.message || "Error al analizar. Intenta de nuevo."}`);
    }
    setLoading(false);
  };

  const globalScore = report?.score_global || 0;
  const globalColor = globalScore >= 70 ? C.strong : globalScore >= 45 ? C.weak : C.missing;

  return (
    <div style={{ minHeight: "100vh", background: C.cream, fontFamily: "'DM Sans', sans-serif", color: C.ink }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@400;500;600;700&family=DM+Sans:wght@300;400;500;600&display=swap');
        * { box-sizing: border-box; margin: 0; padding: 0; }
        input::placeholder { color: #a8a89e; font-size: 13px; }
        @keyframes fadeUp { from { opacity: 0; transform: translateY(12px); } to { opacity: 1; transform: translateY(0); } }
        @media print { .no-print { display: none !important; } body { background: white !important; } }
      `}</style>

      {showEmailModal && (
        <EmailModal
          brandName={report?.brand_name || form.brand}
          onClose={() => setShowEmailModal(false)}
        />
      )}

      <nav style={{ borderBottom: `1px solid ${C.inkLine}`, padding: "0 60px", height: 56, display: "flex", alignItems: "center", justifyContent: "space-between", background: C.cream }}>
        <span style={{ fontFamily: "'Space Grotesk', sans-serif", fontWeight: 700, fontSize: 16, letterSpacing: "0.12em", textTransform: "uppercase", color: C.ink }}>BLINK</span>
        <span style={{ fontSize: 10, color: C.inkFaint, letterSpacing: "0.14em", textTransform: "uppercase" }}>Digital Brand Diagnostics</span>
      </nav>

      <div style={{ maxWidth: 960, margin: "0 auto", padding: "0 60px" }}>

        <div className="no-print" style={{ padding: "64px 0 56px", borderBottom: `1px solid ${C.inkLine}` }}>
          <div style={{ marginBottom: 48 }}>
            <p style={{ fontSize: 10, color: C.inkFaint, letterSpacing: "0.14em", textTransform: "uppercase", marginBottom: 14 }}>Diagnostico de Ecosistema Digital</p>
            <h1 style={{ fontFamily: "'Space Grotesk', sans-serif", fontSize: 48, fontWeight: 700, lineHeight: 1.1, letterSpacing: "-0.02em", color: C.ink, maxWidth: 520 }}>
              El estado digital<br/>de cualquier marca.
            </h1>
            <p style={{ marginTop: 18, fontSize: 14, color: C.inkLight, lineHeight: 1.7, maxWidth: 400 }}>
              Ingresa los datos publicos de la marca. BLINK analiza senales externas y genera un diagnostico completo con roadmap de mejoras.
            </p>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "28px 48px", maxWidth: 640 }}>
            <InputField label="Nombre de la marca *" value={form.brand} onChange={v => set("brand", v)} placeholder="Acme Studio" full />
            <InputField label="Sitio web (opcional)" value={form.website} onChange={v => set("website", v)} placeholder="https://acme.com" full />
          </div>

          <div style={{ marginTop: 32 }}>
            <p style={{ fontSize: 10, color: C.inkFaint, letterSpacing: "0.12em", textTransform: "uppercase", marginBottom: 20 }}>Redes sociales</p>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "20px 48px", maxWidth: 640 }}>
              <InputField label="Instagram" value={form.instagram} onChange={v => set("instagram", v)} placeholder="URL de Instagram" />
              <InputField label="LinkedIn" value={form.linkedin} onChange={v => set("linkedin", v)} placeholder="URL de LinkedIn" />
              <InputField label="TikTok" value={form.tiktok} onChange={v => set("tiktok", v)} placeholder="URL de TikTok" />
              <InputField label="X / Twitter" value={form.twitter} onChange={v => set("twitter", v)} placeholder="URL de Twitter" />
              <InputField label="YouTube" value={form.youtube} onChange={v => set("youtube", v)} placeholder="URL de YouTube" />
              <InputField label="Facebook" value={form.facebook} onChange={v => set("facebook", v)} placeholder="URL de Facebook" />
              <InputField label="Pinterest" value={form.pinterest} onChange={v => set("pinterest", v)} placeholder="URL de Pinterest" />
              <InputField label="Threads" value={form.threads} onChange={v => set("threads", v)} placeholder="URL de Threads" />
            </div>
          </div>

          <div style={{ marginTop: 36, display: "flex", alignItems: "center", gap: 24 }}>
            <button onClick={analyze} disabled={loading || !form.brand} style={{
              background: loading || !form.brand ? C.inkFaint : C.ink,
              color: C.cream, border: "none", padding: "13px 32px",
              fontSize: 12, letterSpacing: "0.12em", textTransform: "uppercase",
              cursor: loading || !form.brand ? "not-allowed" : "pointer",
              fontFamily: "'DM Sans', sans-serif", fontWeight: 600, transition: "background 0.2s",
            }}>
              {loading ? "Analizando..." : "Generar diagnostico"}
            </button>
            {loading && <span style={{ fontSize: 12, color: C.inkFaint, letterSpacing: "0.06em" }}>Analizando senales digitales...</span>}
          </div>

          {error && <p style={{ marginTop: 16, fontSize: 13, color: C.missing, fontStyle: "italic" }}>{error}</p>}
        </div>

        {report && (
          <div ref={reportRef} style={{ paddingBottom: 80 }}>

            {report.assets?.owned_media?.status === "missing" && (
              <div style={{ margin: "32px 0 0", padding: "20px 24px", background: C.missingBg, border: `1px solid ${C.missing}`, borderLeft: `4px solid ${C.missing}` }}>
                <p style={{ fontSize: 10, color: C.missing, letterSpacing: "0.14em", textTransform: "uppercase", marginBottom: 8, fontWeight: 600 }}>
                  Alerta critica — Sin canal propio
                </p>
                <p style={{ fontSize: 13, color: C.inkMid, lineHeight: 1.75, maxWidth: 620 }}>
                  Esta marca no tiene sitio web propio. Esto significa que <strong style={{ color: C.ink }}>no posee ningun activo digital real</strong> — su audiencia, contenido y datos viven en plataformas de terceros que pueden cambiar algoritmos, aumentar costos o desaparecer. La prioridad absoluta es construir un canal propio con dominio, web y sistema de captura de datos antes de cualquier otra accion de marketing.
                </p>
              </div>
            )}

            <div style={{ padding: "52px 0 40px", borderBottom: `1px solid ${C.inkLine}` }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: 32 }}>
                <div style={{ flex: 1 }}>
                  <p style={{ fontSize: 10, color: C.inkFaint, letterSpacing: "0.14em", textTransform: "uppercase", marginBottom: 12 }}>Diagnostico de Ecosistema Digital</p>
                  <h2 style={{ fontFamily: "'Space Grotesk', sans-serif", fontSize: 40, fontWeight: 700, letterSpacing: "-0.02em", color: C.ink, marginBottom: 20 }}>{report.brand_name}</h2>
                  <p style={{ fontSize: 14, color: C.inkMid, lineHeight: 1.8, maxWidth: 500 }}>{report.summary}</p>
                </div>
                <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 12 }}>
                  <div style={{ width: 90, height: 90, border: `1px solid ${C.inkLine}`, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", background: C.white }}>
                    <span style={{ fontFamily: "'Space Grotesk', sans-serif", fontSize: 36, fontWeight: 700, color: globalColor, lineHeight: 1 }}>{globalScore}</span>
                    <span style={{ fontSize: 9, color: C.inkFaint, letterSpacing: "0.12em", textTransform: "uppercase" }}>Score</span>
                  </div>
                  <button className="no-print" onClick={() => window.print()} style={{
                    background: "transparent", border: `1px solid ${C.inkLine}`,
                    padding: "7px 16px", fontSize: 10, letterSpacing: "0.1em",
                    textTransform: "uppercase", color: C.inkLight, cursor: "pointer", fontFamily: "'DM Sans', sans-serif"
                  }}>Exportar PDF</button>
                </div>
              </div>
              {report.biggest_opportunity && (
                <div style={{ marginTop: 28, paddingTop: 24, borderTop: `1px solid ${C.inkLine}`, display: "flex", gap: 20, alignItems: "flex-start" }}>
                  <span style={{ fontSize: 10, color: C.inkFaint, letterSpacing: "0.1em", textTransform: "uppercase", minWidth: 130, paddingTop: 2 }}>Mayor oportunidad</span>
                  <p style={{ fontSize: 15, fontFamily: "'Space Grotesk', sans-serif", fontStyle: "italic", color: C.ink, lineHeight: 1.6, flex: 1 }}>"{report.biggest_opportunity}"</p>
                </div>
              )}
            </div>

            <div style={{ padding: "40px 0" }}>
              <p style={{ fontSize: 10, color: C.inkFaint, letterSpacing: "0.14em", textTransform: "uppercase", marginBottom: 4 }}>Evaluacion por Asset</p>
              <div style={{ borderTop: `1px solid ${C.inkLine}` }}>
                {ASSETS.map((asset, i) => report.assets[asset.key] && (
                  <AssetRow key={asset.key} asset={asset} data={report.assets[asset.key]} index={i} />
                ))}
              </div>
            </div>

            {report.roadmap && (
              <div style={{ display: "flex", flexDirection: "column", gap: 40, paddingBottom: 40 }}>
                <p style={{ fontSize: 10, color: C.inkFaint, letterSpacing: "0.14em", textTransform: "uppercase" }}>Roadmap de Mejoras</p>
                {["short", "mid", "long"].map(h => report.roadmap[h] && <RoadmapBlock key={h} horizon={h} items={report.roadmap[h]} />)}
              </div>
            )}

            <div style={{ borderTop: `1px solid ${C.inkLine}`, paddingTop: 24, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <span style={{ fontSize: 10, color: C.inkFaint, letterSpacing: "0.1em", textTransform: "uppercase" }}>BLINK</span>
              <span style={{ fontSize: 10, color: C.inkFaint, letterSpacing: "0.1em" }}>Diagnostico externo basado en senales publicas</span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
