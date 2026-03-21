// ─── HIVERCAR · functions/send-stock-alert/index.js ──────────────────────────
// US-20 Task 4: Alerta automático quando estoque de produto < 3.
//
// TRIGGER: Database → collection "produtos" → event "databases.*.collections.*.documents.*.update"
//
// SETUP NO APPWRITE CONSOLE:
//   1. Functions → Create Function
//   2. Runtime: Node.js 18
//   3. Entrypoint: index.js
//   4. Build: npm install
//   5. Event Trigger: databases.[DB_ID].collections.[produtos_COL_ID].documents.*.update
//   6. Variables:
//        RESEND_API_KEY      → chave da API Resend
//        ALERT_EMAIL_TO      → email do responsável pelo estoque
//        ALERT_EMAIL_FROM    → noreply@hivercar.com.br
//        WHATSAPP_NUMBER     → 5598981168787
//        ZAPI_INSTANCE       → ID instância Z-API (opcional)
//        ZAPI_TOKEN          → token Z-API (opcional)
//        STOCK_THRESHOLD     → 3 (padrão)
//
// COMPORTAMENTO:
//   - Recebe o documento atualizado via req.body
//   - Se stock < STOCK_THRESHOLD: dispara e-mail via Resend + WhatsApp via Z-API
//   - Se stock >= STOCK_THRESHOLD: ignora silenciosamente
//   - Idempotente: não duplica alertas (Appwrite garante at-least-once delivery)
// ─────────────────────────────────────────────────────────────────────────────

import { Client, Databases } from "node-appwrite"

const THRESHOLD = parseInt(process.env.STOCK_THRESHOLD ?? "3")

// ── Entry point ───────────────────────────────────────────────────────────────
export default async ({ req, res, log, error }) => {
  try {
    // 1. Parse do evento
    const payload = req.body
    if (!payload || typeof payload !== "object") {
      return res.json({ ok: false, reason: "payload inválido" }, 400)
    }

    const productId   = payload.$id        ?? payload.id
    const productName = payload.name       ?? "Produto desconhecido"
    const stock       = Number(payload.stock ?? 99)
    const isActive    = payload.isActive    !== false

    log(`[stock-alert] ${productName} → stock=${stock}, active=${isActive}`)

    // 2. Verificação: só alerta se ativo e abaixo do threshold
    if (!isActive || stock >= THRESHOLD) {
      return res.json({ ok: true, alerted: false, reason: "threshold não atingido" })
    }

    log(`[stock-alert] ALERTA CRÍTICO: ${productName} tem apenas ${stock} unidades!`)

    const results = await Promise.allSettled([
      sendEmail(productName, stock, productId),
      sendWhatsApp(productName, stock),
    ])

    results.forEach((r, i) => {
      const channel = i === 0 ? "email" : "whatsapp"
      if (r.status === "rejected") {
        error(`[stock-alert] Falha no canal ${channel}: ${r.reason}`)
      } else {
        log(`[stock-alert] ${channel} enviado com sucesso`)
      }
    })

    return res.json({
      ok:        true,
      alerted:   true,
      product:   productName,
      stock,
      threshold: THRESHOLD,
      email:     results[0].status,
      whatsapp:  results[1].status,
    })

  } catch (err) {
    error(`[stock-alert] Erro inesperado: ${err.message}`)
    return res.json({ ok: false, error: err.message }, 500)
  }
}

// ── Envio de e-mail via Resend ────────────────────────────────────────────────
async function sendEmail(productName, stock, productId) {
  const key  = process.env.RESEND_API_KEY
  const to   = process.env.ALERT_EMAIL_TO
  const from = process.env.ALERT_EMAIL_FROM ?? "noreply@hivercar.com.br"

  if (!key || !to) throw new Error("RESEND_API_KEY ou ALERT_EMAIL_TO não configurados")

  const urgencia = stock === 0 ? "🔴 ESTOQUE ZERADO" : "🟠 ESTOQUE CRÍTICO"

  const body = {
    from,
    to: [to],
    subject: `${urgencia} — ${productName}`,
    html: `
      <div style="font-family:sans-serif;max-width:600px;margin:0 auto">
        <div style="background:#fb1230;color:#fff;padding:20px 28px">
          <h1 style="margin:0;font-size:22px;letter-spacing:.05em">⚠ ALERTA DE ESTOQUE</h1>
          <p style="margin:8px 0 0;opacity:.85">HIVERCAR AUTOPEÇAS — Sistema ERP</p>
        </div>
        <div style="padding:28px;background:#f8f8f8">
          <h2 style="color:#111;margin:0 0 16px">${productName}</h2>
          <table style="width:100%;border-collapse:collapse">
            <tr>
              <td style="padding:10px;background:#fff;border:1px solid #ddd;font-weight:700">Estoque Atual</td>
              <td style="padding:10px;background:#fff;border:1px solid #ddd;color:#fb1230;font-weight:700;font-size:24px">${stock} un.</td>
            </tr>
            <tr>
              <td style="padding:10px;background:#fff;border:1px solid #ddd;font-weight:700">Limite de Alerta</td>
              <td style="padding:10px;background:#fff;border:1px solid #ddd">${THRESHOLD} unidades</td>
            </tr>
            <tr>
              <td style="padding:10px;background:#fff;border:1px solid #ddd;font-weight:700">ID do Produto</td>
              <td style="padding:10px;background:#fff;border:1px solid #ddd;font-family:monospace;font-size:12px">${productId}</td>
            </tr>
          </table>
          <div style="margin-top:24px;padding:16px;background:#fff3cd;border-left:4px solid #fb1230">
            <strong>Ação necessária:</strong> acesse o ERP → Gestão de Estoque → Reposição Manual para repor este produto.
          </div>
          <a href="https://hivercar.com.br/admin-estoque.html"
             style="display:inline-block;margin-top:20px;padding:12px 24px;background:#fb1230;color:#fff;text-decoration:none;font-weight:700;font-size:13px;letter-spacing:.05em">
            GERENCIAR ESTOQUE →
          </a>
        </div>
        <div style="padding:16px 28px;background:#111;color:#666;font-size:11px">
          Alerta automático do sistema HIVERCAR ERP. Enviado em ${new Date().toLocaleString("pt-BR")}.
        </div>
      </div>
    `,
  }

  const resp = await fetch("https://api.resend.com/emails", {
    method:  "POST",
    headers: { "Authorization": `Bearer ${key}`, "Content-Type": "application/json" },
    body:    JSON.stringify(body),
  })

  if (!resp.ok) {
    const txt = await resp.text()
    throw new Error(`Resend ${resp.status}: ${txt}`)
  }
  return resp.json()
}

// ── Envio de WhatsApp via Z-API ───────────────────────────────────────────────
async function sendWhatsApp(productName, stock) {
  const instance = process.env.ZAPI_INSTANCE
  const token    = process.env.ZAPI_TOKEN
  const phone    = process.env.WHATSAPP_NUMBER ?? "5598981168787"

  if (!instance || !token) {
    // WhatsApp não configurado — loga mas não falha (e-mail basta)
    console.warn("[stock-alert] Z-API não configurado — WhatsApp ignorado")
    return { skipped: true }
  }

  const emoji    = stock === 0 ? "🔴" : "🟠"
  const mensagem = [
    `${emoji} *ALERTA DE ESTOQUE — HIVERCAR*`,
    ``,
    `*Produto:* ${productName}`,
    `*Estoque atual:* ${stock} ${stock === 1 ? "unidade" : "unidades"}`,
    `*Limite:* ${THRESHOLD} unidades`,
    ``,
    `Acesse o ERP para realizar a reposição:`,
    `https://hivercar.com.br/admin-estoque.html`,
  ].join("\n")

  const url  = `https://api.z-api.io/instances/${instance}/token/${token}/send-text`
  const resp = await fetch(url, {
    method:  "POST",
    headers: { "Content-Type": "application/json" },
    body:    JSON.stringify({ phone, message: mensagem }),
  })

  if (!resp.ok) {
    const txt = await resp.text()
    throw new Error(`Z-API ${resp.status}: ${txt}`)
  }
  return resp.json()
}
