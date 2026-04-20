const ASSET_LABELS = {
  owned_media:  "Owned Media",
  seo:          "SEO & Posicionamiento",
  content:      "Content Assets",
  data:         "Data Assets",
  performance:  "Performance",
  community:    "Community & Social",
  partnerships: "Partnerships",
  technical:    "Technical Stack",
};

function scoreColor(score) {
  return score >= 70 ? "#2d6a4f" : score >= 45 ? "#8b5e00" : "#8b1a1a";
}

function statusLabel(s) {
  return s === "strong" ? "Solido" : s === "weak" ? "Debil" : "Ausente";
}

function buildEmailHTML(report) {
  const gc = scoreColor(report.score_global || 0);

  const assetRows = Object.entries(report.assets || {}).map(([key, a]) => {
    const sc = scoreColor(a.score || 0);
    return `
      <tr>
        <td style="padding:10px 16px;border-bottom:1px solid #d4d0c8;font-size:13px;color:#1a1a18;font-family:Arial,sans-serif;">${ASSET_LABELS[key] || key}</td>
        <td style="padding:10px 16px;border-bottom:1px solid #d4d0c8;font-size:20px;font-weight:700;color:${sc};font-family:Arial,sans-serif;text-align:center;width:60px;">${a.score || 0}</td>
        <td style="padding:10px 16px;border-bottom:1px solid #d4d0c8;font-size:10px;color:${sc};font-family:Arial,sans-serif;text-align:right;text-transform:uppercase;letter-spacing:0.07em;">${statusLabel(a.status)}</td>
      </tr>`;
  }).join("");

  const roadmapItems = (report.roadmap?.short || []).map((item, i) => `
    <tr>
      <td style="padding:12px 16px;border-bottom:1px solid #d4d0c8;font-size:12px;color:#a8a89e;font-family:Arial,sans-serif;width:28px;vertical-align:top;">0${i + 1}</td>
      <td style="padding:12px 16px;border-bottom:1px solid #d4d0c8;vertical-align:top;">
        <div style="font-size:13px;font-weight:700;color:#1a1a18;font-family:Arial,sans-serif;margin-bottom:4px;">${item.title}</div>
        <div style="font-size:12px;color:#3a3a36;font-family:Arial,sans-serif;line-height:1.6;">${item.description}</div>
      </td>
    </tr>`).join("");

  return `<!DOCTYPE html>
<html>
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#f5f2eb;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f5f2eb;padding:40px 20px;">
    <tr><td align="center">
      <table cellpadding="0" cellspacing="0" style="background:#ffffff;border:1px solid #d4d0c8;max-width:600px;width:100%;">

        <tr><td style="padding:24px 32px;border-bottom:1px solid #d4d0c8;">
          <span style="font-size:13px;font-weight:700;letter-spacing:0.14em;text-transform:uppercase;color:#1a1a18;font-family:Arial,sans-serif;">BLINK</span>
          <span style="font-size:10px;color:#a8a89e;letter-spacing:0.1em;text-transform:uppercase;margin-left:14px;font-family:Arial,sans-serif;">Digital Brand Diagnostics</span>
        </td></tr>

        <tr><td style="padding:32px;">
          <table width="100%" cellpadding="0" cellspacing="0">
            <tr>
              <td>
                <div style="font-size:10px;color:#a8a89e;letter-spacing:0.12em;text-transform:uppercase;margin-bottom:8px;font-family:Arial,sans-serif;">Diagnostico de Ecosistema Digital</div>
                <div style="font-size:28px;font-weight:700;color:#1a1a18;font-family:Arial,sans-serif;margin-bottom:14px;">${report.brand_name}</div>
                <div style="font-size:13px;color:#3a3a36;line-height:1.75;font-family:Arial,sans-serif;max-width:380px;">${report.summary}</div>
              </td>
              <td align="right" valign="top" style="min-width:80px;">
                <div style="border:1px solid #d4d0c8;padding:14px 18px;text-align:center;display:inline-block;">
                  <div style="font-size:30px;font-weight:700;color:${gc};font-family:Arial,sans-serif;line-height:1;">${report.score_global}</div>
                  <div style="font-size:9px;color:#a8a89e;letter-spacing:0.1em;text-transform:uppercase;font-family:Arial,sans-serif;margin-top:2px;">Score</div>
                </div>
              </td>
            </tr>
          </table>
        </td></tr>

        ${report.biggest_opportunity ? `
        <tr><td style="padding:20px 32px;border-top:1px solid #d4d0c8;border-bottom:1px solid #d4d0c8;background:#f5f2eb;">
          <span style="font-size:10px;color:#a8a89e;letter-spacing:0.1em;text-transform:uppercase;font-family:Arial,sans-serif;">Mayor oportunidad — </span>
          <span style="font-size:13px;color:#1a1a18;font-style:italic;font-family:Arial,sans-serif;">"${report.biggest_opportunity}"</span>
        </td></tr>` : ""}

        <tr><td style="padding:24px 32px 8px;">
          <div style="font-size:10px;color:#a8a89e;letter-spacing:0.12em;text-transform:uppercase;font-family:Arial,sans-serif;">Evaluacion por Asset</div>
        </td></tr>
        <tr><td style="padding:0 16px;">
          <table width="100%" cellpadding="0" cellspacing="0">${assetRows}</table>
        </td></tr>

        <tr><td style="padding:24px 32px 8px;">
          <div style="font-size:10px;color:#a8a89e;letter-spacing:0.12em;text-transform:uppercase;font-family:Arial,sans-serif;">Acciones inmediatas — 0 a 3 meses</div>
        </td></tr>
        <tr><td style="padding:0 16px;">
          <table width="100%" cellpadding="0" cellspacing="0">${roadmapItems}</table>
        </td></tr>

        <tr><td style="padding:24px 32px;border-top:1px solid #d4d0c8;margin-top:16px;">
          <span style="font-size:10px;color:#a8a89e;letter-spacing:0.1em;text-transform:uppercase;font-family:Arial,sans-serif;">BLINK — Diagnostico externo basado en senales publicas</span>
        </td></tr>

      </table>
    </td></tr>
  </table>
</body>
</html>`;
}

export default async function handler(req, res) {
  res.setHeader("Content-Type", "application/json");
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

  const { email, report } = req.body || {};
  if (!email || !report) return res.status(400).json({ error: "Missing email or report" });

  const RESEND_API_KEY = process.env.RESEND_API_KEY;
  if (!RESEND_API_KEY) return res.status(500).json({ error: "RESEND_API_KEY not configured in Vercel" });

  const from = process.env.RESEND_FROM || "BLINK <onboarding@resend.dev>";

  try {
    const response = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${RESEND_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from,
        to: email,
        subject: `Reporte BLINK — ${report.brand_name}`,
        html: buildEmailHTML(report),
      }),
    });

    if (!response.ok) {
      const err = await response.text();
      console.error("Resend error:", err);
      return res.status(502).json({ error: `Email send failed: ${err.slice(0, 120)}` });
    }

    return res.status(200).json({ ok: true });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
}
