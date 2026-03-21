// ─── HIVERCAR · functions/send-os-status/index.js ───────────────────────────
// US-39: Envia notificação WhatsApp ao cliente quando o status da OS é alterado.
//
// TRIGGER: Database → collection "os_history" → event "*.create"
//   (disparado pelo admin-os.html ao registrar uma mudança de status)
//
// FLUXO:
//   1. Recebe o documento os_history recém-criado
//   2. Busca a OS pelo osId para obter telefone do cliente
//   3. Envia WhatsApp via Z-API com mensagem personalizada por status
//   4. Em paralelo, envia e-mail via Resend (se cliente tiver e-mail na OS)
//
// VARIÁVEIS DE AMBIENTE:
//   ZAPI_INSTANCE      → ID da instância Z-API
//   ZAPI_TOKEN         → Token Z-API
//   RESEND_API_KEY     → Chave da API Resend (opcional)
//   EMAIL_FROM         → HIVERCAR AUTOPEÇAS <noreply@hivercar.com.br>
//   APPWRITE_ENDPOINT  → https://nyc.cloud.appwrite.io/v1
//   APPWRITE_PROJECT   → 69a0c93200084defefe1
//   APPWRITE_API_KEY   → Server key do Appwrite (para buscar a OS)
//
// SETUP NO APPWRITE CONSOLE:
//   Event: databases.*.collections.os_history.documents.*.create
//   Runtime: Node.js 18
//   Entrypoint: index.js
// ─────────────────────────────────────────────────────────────────────────────

import { Client, Databases } from "node-appwrite"

// ── Labels de status em português ────────────────────────────────────────────
const STATUS_LABELS = {
  aberta:           { label: "Aberta",           emoji: "🔧" },
  em_andamento:     { label: "Em Andamento",      emoji: "⚙️" },
  aguardando_pecas: { label: "Aguardando Peças",  emoji: "📦" },
  concluida:        { label: "Concluída",         emoji: "✅" },
  cancelada:        { label: "Cancelada",         emoji: "❌" },
}

// ── Entry point ───────────────────────────────────────────────────────────────
export default async ({ req, res, log, error }) => {
  try {
    // 1. Parse do payload (documento os_history recém-criado)
    const histDoc = req.body
    if (!histDoc || !histDoc.osId) {
      return res.json({ ok: false, reason: "payload inválido — osId ausente" }, 400)
    }

    const { osId, statusAnterior, statusNovo, changedBy, changedAt } = histDoc
    log(`[send-os-status] OS ${osId}: ${statusAnterior} → ${statusNovo}`)

    // 2. Busca a OS no banco para obter dados do cliente
    const client = new Client()
      .setEndpoint(process.env.APPWRITE_FUNCTION_API_ENDPOINT || process.env.APPWRITE_ENDPOINT)
      .setProject(process.env.APPWRITE_FUNCTION_PROJECT_ID || process.env.APPWRITE_PROJECT)
      .setKey(req.headers["x-appwrite-key"] ?? process.env.APPWRITE_API_KEY ?? "")

    const db = new Databases(client)
    const DB  = process.env.DB_ID || "69a0ebc70034fa76feff"
    const COL = "service_orders"

    let os
    try {
      os = await db.getDocument(DB, COL, osId)
    } catch (e) {
      error(`[send-os-status] OS ${osId} não encontrada: ${e.message}`)
      return res.json({ ok: false, reason: "OS não encontrada" }, 404)
    }

    const clienteNome  = os.clienteName || "Cliente"
    const telefone     = os.telefone?.replace(/\D/g, "")
    const placa        = os.placa     || "—"
    const modelo       = os.modelo    || "—"
    const novoStatusInfo = STATUS_LABELS[statusNovo] || { label: statusNovo, emoji: "🔔" }

    log(`[send-os-status] Cliente: ${clienteNome} | Tel: ${telefone} | Status: ${novoStatusInfo.label}`)

    // 3. Dispara WhatsApp e E-mail em paralelo
    const results = await Promise.allSettled([
      telefone ? sendWhatsApp(telefone, clienteNome, placa, modelo, statusNovo, novoStatusInfo, osId) : Promise.resolve({ skipped: true, reason: "sem telefone" }),
      sendEmail(os.email || null, clienteNome, placa, modelo, statusNovo, novoStatusInfo, osId, changedAt),
    ])

    const [wa, email] = results.map((r, i) => ({
      channel: i === 0 ? "whatsapp" : "email",
      status:  r.status,
      reason:  r.status === "rejected" ? r.reason?.message : undefined,
    }))

    results.forEach(r => {
      if (r.status === "rejected") error(`[send-os-status] Falha: ${r.reason}`)
    })

    log(`[send-os-status] Concluído — WA: ${wa.status} | E-mail: ${email.status}`)
    return res.json({ ok: true, osId, statusNovo, whatsapp: wa, email })

  } catch (err) {
    error(`[send-os-status] Erro inesperado: ${err.message}`)
    return res.json({ ok: false, error: err.message }, 500)
  }
}

// ── WhatsApp via Z-API ────────────────────────────────────────────────────────
async function sendWhatsApp(telefone, nome, placa, modelo, status, statusInfo, osId) {
  const instance = process.env.ZAPI_INSTANCE
  const token    = process.env.ZAPI_TOKEN

  if (!instance || !token) {
    throw new Error("Z-API não configurado (ZAPI_INSTANCE / ZAPI_TOKEN ausentes)")
  }

  // Formata o telefone: apenas dígitos, com código do país
  const phone = telefone.startsWith("55") ? telefone : `55${telefone}`

  // Mensagem personalizada por status
  const mensagens = {
    aberta: [
      `${statusInfo.emoji} *Olá, ${nome}!*`,
      ``,
      `Sua Ordem de Serviço foi *aberta* na HIVERCAR AUTOPEÇAS.`,
      ``,
      `🚗 *Veículo:* ${modelo} — Placa ${placa}`,
      `📋 *Nº OS:* ${osId.substring(0, 8).toUpperCase()}`,
      ``,
      `Em breve nosso técnico iniciará a análise. Fique tranquilo(a)!`,
      ``,
      `Dúvidas? Responda esta mensagem.`,
    ],
    em_andamento: [
      `${statusInfo.emoji} *${nome}, boa notícia!*`,
      ``,
      `Seu veículo *${modelo} — ${placa}* está *em manutenção agora*.`,
      ``,
      `Nosso técnico já está trabalhando. Você será avisado(a) quando concluirmos.`,
      ``,
      `📋 OS: ${osId.substring(0, 8).toUpperCase()}`,
    ],
    aguardando_pecas: [
      `📦 *Atenção, ${nome}!*`,
      ``,
      `Seu veículo *${modelo} — ${placa}* está *aguardando chegada de peças*.`,
      ``,
      `Estamos providenciando os componentes necessários. Assim que chegarem, a manutenção continua imediatamente.`,
      ``,
      `📋 OS: ${osId.substring(0, 8).toUpperCase()}`,
      `Qualquer dúvida, é só falar!`,
    ],
    concluida: [
      `✅ *${nome}, seu veículo está pronto!*`,
      ``,
      `🚗 *${modelo} — ${placa}* concluiu a manutenção com sucesso.`,
      ``,
      `Você já pode vir buscar! Nosso horário de funcionamento é de seg–sex 8h–18h e sáb 8h–12h.`,
      ``,
      `📍 Av. Ataliba Vieira, 1357 — Chapadinha`,
      `📋 OS: ${osId.substring(0, 8).toUpperCase()}`,
      ``,
      `Obrigado por confiar na HIVERCAR AUTOPEÇAS! 🙏`,
    ],
    cancelada: [
      `❌ *${nome}, sua OS foi cancelada.*`,
      ``,
      `A Ordem de Serviço do veículo *${modelo} — ${placa}* foi cancelada.`,
      ``,
      `Para mais informações, entre em contato conosco.`,
      `📋 OS: ${osId.substring(0, 8).toUpperCase()}`,
    ],
  }

  const linhas = mensagens[status] || [
    `${statusInfo.emoji} *Atualização da sua OS — HIVERCAR*`,
    ``,
    `Veículo: ${modelo} — ${placa}`,
    `Novo status: *${statusInfo.label}*`,
    `OS: ${osId.substring(0, 8).toUpperCase()}`,
  ]

  const message = linhas.join("\n")

  const url  = `https://api.z-api.io/instances/${instance}/token/${token}/send-text`
  const resp = await fetch(url, {
    method:  "POST",
    headers: { "Content-Type": "application/json" },
    body:    JSON.stringify({ phone, message }),
  })

  if (!resp.ok) {
    const txt = await resp.text()
    throw new Error(`Z-API ${resp.status}: ${txt}`)
  }
  return resp.json()
}

// ── E-mail via Resend ─────────────────────────────────────────────────────────
async function sendEmail(emailAddr, nome, placa, modelo, status, statusInfo, osId, changedAt) {
  const key  = process.env.RESEND_API_KEY
  const from = process.env.EMAIL_FROM || "HIVERCAR AUTOPEÇAS <noreply@hivercar.com.br>"

  if (!key)       throw new Error("RESEND_API_KEY não configurado")
  if (!emailAddr) throw new Error("Cliente sem e-mail na OS — e-mail ignorado")

  const dateStr = new Date(changedAt || Date.now()).toLocaleString("pt-BR", {
    dateStyle: "long", timeStyle: "short",
  })

  const statusColors = {
    aberta:           "#3b82f6",
    em_andamento:     "#f59e0b",
    aguardando_pecas: "#f97316",
    concluida:        "#26fd71",
    cancelada:        "#fb1230",
  }
  const color = statusColors[status] || "#6b7280"

  const html = `<!DOCTYPE html>
<html lang="pt-BR">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#0a0a0a;font-family:'Segoe UI',Arial,sans-serif">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#0a0a0a;padding:32px 16px">
    <tr><td align="center">
      <table width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;background:#111214;border:1px solid #252729;border-top:3px solid ${color};border-radius:10px;overflow:hidden">

        <tr>
          <td style="padding:28px 32px 20px;background:#0d0f10;border-bottom:1px solid #1e2023">
            <table width="100%" cellpadding="0" cellspacing="0"><tr>
              <td><span style="font-family:'Trebuchet MS',sans-serif;font-size:20px;font-weight:900;color:#f0f0ee;letter-spacing:2px">HIVER<span style="color:#26fd71">CAR</span></span><br><span style="font-size:11px;color:#545658;letter-spacing:1px">AUTOPEÇAS</span></td>
              <td align="right"><span style="display:inline-block;background:${color}22;border:1px solid ${color};color:${color};font-size:12px;font-weight:700;padding:6px 14px;border-radius:4px;letter-spacing:1px">${statusInfo.emoji} ${statusInfo.label.toUpperCase()}</span></td>
            </tr></table>
          </td>
        </tr>

        <tr><td style="padding:28px 32px 0">
          <p style="font-size:16px;color:#f0f0ee;margin:0 0 6px">Olá, <strong>${nome}</strong>!</p>
          <p style="font-size:14px;color:#818386;margin:0">O status da sua Ordem de Serviço foi atualizado.</p>
        </td></tr>

        <tr><td style="padding:20px 32px">
          <table width="100%" cellpadding="0" cellspacing="0" style="background:#0d0f10;border:1px solid #1e2023;border-radius:6px">
            <tr>
              <td style="padding:14px 18px;border-right:1px solid #1e2023">
                <div style="font-size:10px;color:#545658;letter-spacing:1px;margin-bottom:4px">PLACA</div>
                <div style="font-size:20px;font-weight:700;color:#26fd71;letter-spacing:3px">${placa}</div>
              </td>
              <td style="padding:14px 18px;border-right:1px solid #1e2023">
                <div style="font-size:10px;color:#545658;letter-spacing:1px;margin-bottom:4px">VEÍCULO</div>
                <div style="font-size:14px;color:#c8caca">${modelo}</div>
              </td>
              <td style="padding:14px 18px;border-right:1px solid #1e2023">
                <div style="font-size:10px;color:#545658;letter-spacing:1px;margin-bottom:4px">Nº OS</div>
                <div style="font-size:14px;color:#c8caca;font-family:monospace">${osId.substring(0, 8).toUpperCase()}</div>
              </td>
              <td style="padding:14px 18px">
                <div style="font-size:10px;color:#545658;letter-spacing:1px;margin-bottom:4px">ATUALIZADO EM</div>
                <div style="font-size:12px;color:#c8caca">${dateStr}</div>
              </td>
            </tr>
          </table>
        </td></tr>

        <tr><td style="padding:0 32px 32px;text-align:center">
          <p style="font-size:13px;color:#545658;line-height:1.6;margin-bottom:20px">
            Dúvidas? Fale conosco pelo WhatsApp<br>
            <a href="https://wa.me/5598981168787" style="color:#26fd71;text-decoration:none">(98) 98116-8787</a>
          </p>
        </td></tr>

        <tr><td style="padding:16px 32px;background:#0d0f10;border-top:1px solid #1e2023;text-align:center">
          <p style="font-size:11px;color:#3a3c3e;margin:0;line-height:1.8">
            HIVERCAR AUTOPEÇAS · Av. Ataliba Vieira, 1357 — Chapadinha, MA<br>
            © ${new Date().getFullYear()} Todos os direitos reservados.
          </p>
        </td></tr>

      </table>
    </td></tr>
  </table>
</body></html>`

  const resp = await fetch("https://api.resend.com/emails", {
    method:  "POST",
    headers: { "Authorization": `Bearer ${key}`, "Content-Type": "application/json" },
    body:    JSON.stringify({
      from,
      to:      [emailAddr],
      subject: `${statusInfo.emoji} OS ${osId.substring(0, 8).toUpperCase()} — ${statusInfo.label} | HIVERCAR`,
      html,
    }),
  })

  if (!resp.ok) {
    const txt = await resp.text()
    throw new Error(`Resend ${resp.status}: ${txt}`)
  }
  return resp.json()
}
