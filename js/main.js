// ─── HIVERCAR · functions/send-order-email/src/main.js ───────────────────────
// US-11: Appwrite Function disparada por event trigger após criação de pedido.
//
// Trigger configurado no Console Appwrite:
//   Event: databases.*.collections.orders.documents.*.create
//
// Variáveis de ambiente necessárias (Settings > Variables na Function):
//   RESEND_API_KEY   - chave da API do Resend.com
//   EMAIL_FROM       - "HIVERCAR AUTOPEÇAS <noreply@hivercar.com.br>"
//   STORE_URL        - "https://hivercar.com.br"
//
// Runtime: node-18.0
// Entrypoint: src/main.js

import { Client, Databases } from "node-appwrite"

// ── Bootstrap Appwrite SDK (dentro da Function) ───────────────────────────────
export default async ({ req, res, log, error }) => {
  const client = new Client()
    .setEndpoint(process.env.APPWRITE_FUNCTION_API_ENDPOINT)
    .setProject(process.env.APPWRITE_FUNCTION_PROJECT_ID)
    .setKey(req.headers["x-appwrite-key"] ?? '')

  const db = new Databases(client)

  // ── Lê payload do evento ──────────────────────────────────────────────────
  let order
  try {
    order = req.body
    if (!order || !order.$id) throw new Error("Payload inválido")
  } catch (e) {
    error("Payload inválido: " + e.message)
    return res.json({ ok: false, reason: "invalid_payload" }, 400)
  }

  const { $id: orderId, nome, email, items: itemsRaw, subtotal, taxes, frete, total, payment, createdAt } = order

  if (!email) {
    error(`Pedido ${orderId} sem e-mail de cliente - e-mail não enviado.`)
    return res.json({ ok: false, reason: "no_email" }, 200)
  }

  // ── Processa itens ────────────────────────────────────────────────────────
  let items = []
  try {
    items = JSON.parse(itemsRaw || "[]")
  } catch {
    items = []
  }

  // ── Monta HTML do e-mail ──────────────────────────────────────────────────
  const html = buildConfirmationEmail({ orderId, nome, email, items, subtotal, taxes, frete, total, payment, createdAt })

  // ── Envia via Resend.com ──────────────────────────────────────────────────
  try {
    const resendRes = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Content-Type":  "application/json",
        "Authorization": `Bearer ${process.env.RESEND_API_KEY}`,
      },
      body: JSON.stringify({
        from:    process.env.EMAIL_FROM ?? "HIVERCAR AUTOPEÇAS <noreply@hivercar.com.br>",
        to:      [email],
        subject: `✅ Pedido #${orderId.slice(-5).toUpperCase()} confirmado - HIVERCAR`,
        html,
      }),
    })

    const resendData = await resendRes.json()

    if (!resendRes.ok) {
      error(`Resend retornou ${resendRes.status}: ${JSON.stringify(resendData)}`)
      return res.json({ ok: false, reason: "resend_error", details: resendData }, 500)
    }

    log(`E-mail de confirmação enviado: ${email} - pedido ${orderId} - resend_id: ${resendData.id}`)
    return res.json({ ok: true, resend_id: resendData.id })

  } catch (fetchErr) {
    error("Falha ao chamar Resend API: " + fetchErr.message)
    return res.json({ ok: false, reason: "fetch_error" }, 500)
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// TEMPLATE HTML - CONFIRMAÇÃO DE PEDIDO
// ─────────────────────────────────────────────────────────────────────────────
function fmtBRL(v) {
  return "R$ " + Number(v || 0).toFixed(2).replace(".", ",")
}

function buildConfirmationEmail({ orderId, nome, email, items, subtotal, taxes, frete, total, payment, createdAt }) {
  const payLabels = { pix: "PIX", card: "Cartão de Crédito", boleto: "Boleto" }
  const payLabel  = payLabels[payment] ?? payment
  const shortId   = String(orderId).slice(-5).toUpperCase()
  const dateStr   = new Date(createdAt).toLocaleString("pt-BR", { dateStyle: "long", timeStyle: "short" })

  const rowsHtml = items.map(i => `
    <tr>
      <td style="padding:10px 12px;border-bottom:1px solid #252729;font-size:14px;color:#c8caca">${i.name}</td>
      <td style="padding:10px 12px;border-bottom:1px solid #252729;font-size:14px;color:#c8caca;text-align:center">${i.qty || 1}</td>
      <td style="padding:10px 12px;border-bottom:1px solid #252729;font-size:14px;color:#26fd71;text-align:right">${fmtBRL(Number(i.price) * (i.qty || 1))}</td>
    </tr>`).join("")

  return `<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width,initial-scale=1">
  <title>Pedido #${shortId} Confirmado</title>
</head>
<body style="margin:0;padding:0;background:#0a0a0a;font-family:'Segoe UI',Arial,sans-serif">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#0a0a0a;padding:32px 16px">
    <tr><td align="center">
      <table width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;background:#111214;border:1px solid #252729;border-top:3px solid #26fd71;border-radius:10px;overflow:hidden">

        <!-- HEADER -->
        <tr>
          <td style="padding:32px 32px 24px;background:#0d0f10;border-bottom:1px solid #1e2023">
            <table width="100%" cellpadding="0" cellspacing="0">
              <tr>
                <td>
                  <span style="font-family:'Trebuchet MS',sans-serif;font-size:22px;font-weight:900;color:#f0f0ee;letter-spacing:2px">
                    HIVER<span style="color:#26fd71">CAR</span>
                  </span><br>
                  <span style="font-size:11px;color:#545658;letter-spacing:1px">AUTOPEÇAS</span>
                </td>
                <td align="right">
                  <span style="display:inline-block;background:#0a1a10;border:1px solid #26fd71;color:#26fd71;font-size:12px;font-weight:700;padding:6px 14px;border-radius:4px;letter-spacing:1px">
                    ✅ CONFIRMADO
                  </span>
                </td>
              </tr>
            </table>
          </td>
        </tr>

        <!-- SAUDAÇÃO -->
        <tr>
          <td style="padding:28px 32px 0">
            <p style="font-size:16px;color:#f0f0ee;margin:0 0 6px">Olá, <strong>${nome || "Cliente"}</strong>!</p>
            <p style="font-size:14px;color:#818386;margin:0">
              Seu pedido foi recebido e está sendo processado. Confira os detalhes abaixo.
            </p>
          </td>
        </tr>

        <!-- INFO DO PEDIDO -->
        <tr>
          <td style="padding:20px 32px">
            <table width="100%" cellpadding="0" cellspacing="0" style="background:#0d0f10;border:1px solid #1e2023;border-radius:6px">
              <tr>
                <td style="padding:14px 18px;border-right:1px solid #1e2023">
                  <div style="font-size:10px;color:#545658;letter-spacing:1px;margin-bottom:4px">PEDIDO</div>
                  <div style="font-size:18px;font-weight:700;color:#26fd71;letter-spacing:2px">#${shortId}</div>
                </td>
                <td style="padding:14px 18px;border-right:1px solid #1e2023">
                  <div style="font-size:10px;color:#545658;letter-spacing:1px;margin-bottom:4px">DATA</div>
                  <div style="font-size:13px;color:#c8caca">${dateStr}</div>
                </td>
                <td style="padding:14px 18px">
                  <div style="font-size:10px;color:#545658;letter-spacing:1px;margin-bottom:4px">PAGAMENTO</div>
                  <div style="font-size:13px;color:#c8caca">${payLabel}</div>
                </td>
              </tr>
            </table>
          </td>
        </tr>

        <!-- ITENS -->
        <tr>
          <td style="padding:0 32px 20px">
            <div style="font-size:10px;color:#545658;letter-spacing:1px;margin-bottom:10px">ITENS DO PEDIDO</div>
            <table width="100%" cellpadding="0" cellspacing="0" style="border:1px solid #1e2023;border-radius:6px;overflow:hidden">
              <thead>
                <tr style="background:#0d0f10">
                  <th style="padding:10px 12px;font-size:11px;color:#545658;text-align:left;letter-spacing:1px;font-weight:600">PRODUTO</th>
                  <th style="padding:10px 12px;font-size:11px;color:#545658;text-align:center;letter-spacing:1px;font-weight:600">QTD</th>
                  <th style="padding:10px 12px;font-size:11px;color:#545658;text-align:right;letter-spacing:1px;font-weight:600">TOTAL</th>
                </tr>
              </thead>
              <tbody>${rowsHtml}</tbody>
            </table>
          </td>
        </tr>

        <!-- TOTAIS -->
        <tr>
          <td style="padding:0 32px 20px">
            <table width="100%" cellpadding="0" cellspacing="0" style="border:1px solid #1e2023;border-radius:6px;overflow:hidden">
              <tr>
                <td style="padding:10px 16px;font-size:13px;color:#818386;border-bottom:1px solid #1a1c1e">Subtotal</td>
                <td style="padding:10px 16px;font-size:13px;color:#c8caca;text-align:right;border-bottom:1px solid #1a1c1e">${fmtBRL(subtotal)}</td>
              </tr>
              <tr>
                <td style="padding:10px 16px;font-size:13px;color:#818386;border-bottom:1px solid #1a1c1e">Impostos (12%)</td>
                <td style="padding:10px 16px;font-size:13px;color:#c8caca;text-align:right;border-bottom:1px solid #1a1c1e">${fmtBRL(taxes)}</td>
              </tr>
              <tr>
                <td style="padding:10px 16px;font-size:13px;color:#818386;border-bottom:1px solid #1a1c1e">Frete</td>
                <td style="padding:10px 16px;font-size:13px;color:#c8caca;text-align:right;border-bottom:1px solid #1a1c1e">${fmtBRL(frete)}</td>
              </tr>
              <tr style="background:#0a1a10">
                <td style="padding:14px 16px;font-size:15px;font-weight:700;color:#f0f0ee">TOTAL</td>
                <td style="padding:14px 16px;font-size:18px;font-weight:700;color:#26fd71;text-align:right">${fmtBRL(total)}</td>
              </tr>
            </table>
          </td>
        </tr>

        <!-- CTA -->
        <tr>
          <td style="padding:0 32px 32px;text-align:center">
            <a href="${process.env.STORE_URL ?? "https://hivercar.com.br"}/loja.html"
               style="display:inline-block;background:#26fd71;color:#0a0a0a;font-weight:700;font-size:14px;padding:14px 32px;border-radius:6px;text-decoration:none;letter-spacing:1px">
              CONTINUAR COMPRANDO →
            </a>
            <p style="font-size:12px;color:#545658;margin-top:20px;line-height:1.6">
              Dúvidas? Entre em contato pelo WhatsApp<br>
              <a href="https://wa.me/5598981168787" style="color:#26fd71;text-decoration:none">(98) 98116-8787</a>
            </p>
          </td>
        </tr>

        <!-- FOOTER -->
        <tr>
          <td style="padding:16px 32px;background:#0d0f10;border-top:1px solid #1e2023;text-align:center">
            <p style="font-size:11px;color:#3a3c3e;margin:0;line-height:1.8">
              HIVERCAR AUTOPEÇAS · Av. Ataliba Vieira, 1357 - Chapadinha, MA<br>
              © ${new Date().getFullYear()} Todos os direitos reservados.
            </p>
          </td>
        </tr>

      </table>
    </td></tr>
  </table>
</body>
</html>`
}
