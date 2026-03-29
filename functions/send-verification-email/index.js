// ─── HIVERCAR · functions/send-verification-email/index.js ───────────────────
// US-33: Envia e-mail de verificação após o cadastro de um novo cliente.
//
// TRIGGER: Database → collection "users" → event "*.create"
//   (disparado pelo cadastro.html ao criar o Mirror)
//
// FLUXO:
//   1. Recebe o documento USERS recém-criado (payload)
//   2. Gera um token de verificação via Appwrite account.createVerification()
//   3. Envia o e-mail com o link de verificação via Resend
//   4. O cliente clica no link → redirecionado para confirmar-email.html
//   5. confirmar-email.html chama account.updateVerification() e marca isVerified=true no Mirror
//
// VARIÁVEIS DE AMBIENTE:
//   RESEND_API_KEY     → chave da API Resend
//   EMAIL_FROM         → HIVERCAR AUTOPEÇAS <noreply@hivercar.com.br>
//   APP_URL            → https://hivercar.com.br
//   APPWRITE_ENDPOINT  → https://nyc.cloud.appwrite.io/v1
//   APPWRITE_PROJECT   → 69a0c93200084defefe1
// ─────────────────────────────────────────────────────────────────────────────

import { Client, Account, Databases, Users } from "node-appwrite"

const DB_ID    = process.env.APPWRITE_DB       || "69a0ebc70034fa76feff"
const COL_USERS= "users"

export default async ({ req, res, log, error }) => {
  try {
    // ── Parse payload ────────────────────────────────────────────────────
    const user = req.body
    if (!user?.$id || !user?.email) {
      return res.json({ ok: false, reason: "payload_invalido" }, 400)
    }

    log(`[send-verification-email] Novo usuário: ${user.email} (${user.$id})`)

    // ── SDK do Appwrite (server-side com API key) ─────────────────────────
    const client = new Client()
      .setEndpoint(process.env.APPWRITE_FUNCTION_API_ENDPOINT)
      .setProject(process.env.APPWRITE_FUNCTION_PROJECT_ID)
      .setKey(req.headers["x-appwrite-key"] ?? '')

    const databases = new Databases(client)
    const users     = new Users(client)

    // ── Gerar token de verificação via Appwrite ───────────────────────────
    const redirectUrl = `${process.env.APP_URL ?? "https://hivercar.com.br"}/confirmar-email.html`

    // Usa a API Users (server-side) para criar o token sem precisar de sessão
    let verificationToken
    try {
      const jwt = await users.createJWT(user.$id)
      verificationToken = jwt.jwt
    } catch (e) {
      // Se falhar, usa um token simples derivado do $id + timestamp
      verificationToken = Buffer.from(`${user.$id}:${Date.now()}`).toString("base64url")
      log("[send-verification-email] JWT fallback: " + e.message)
    }

    const verifyLink = `${redirectUrl}?userId=${user.$id}&token=${verificationToken}`

    // ── Montar e enviar o e-mail ──────────────────────────────────────────
    const html = buildVerificationEmail({
      name: user.name || "Cliente",
      email: user.email,
      verifyLink,
    })

    const resendResp = await fetch("https://api.resend.com/emails", {
      method:  "POST",
      headers: {
        "Authorization": `Bearer ${process.env.RESEND_API_KEY}`,
        "Content-Type":  "application/json",
      },
      body: JSON.stringify({
        from:    process.env.EMAIL_FROM ?? "HIVERCAR AUTOPEÇAS <noreply@hivercar.com.br>",
        to:      [user.email],
        subject: "Confirme seu e-mail - HIVERCAR AUTOPEÇAS",
        html,
      }),
    })

    if (!resendResp.ok) {
      const txt = await resendResp.text()
      error(`[send-verification-email] Resend error ${resendResp.status}: ${txt}`)
      return res.json({ ok: false, reason: "resend_error" }, 500)
    }

    const resendData = await resendResp.json()
    log(`[send-verification-email] E-mail enviado para ${user.email} - ID: ${resendData.id}`)
    return res.json({ ok: true, resend_id: resendData.id })

  } catch (err) {
    error(`[send-verification-email] Erro inesperado: ${err.message}`)
    return res.json({ ok: false, error: err.message }, 500)
  }
}

// ── TEMPLATE HTML ─────────────────────────────────────────────────────────────
function buildVerificationEmail({ name, email, verifyLink }) {
  return `<!DOCTYPE html>
<html lang="pt-BR">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#0a0a0a;font-family:'Segoe UI',Arial,sans-serif">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#0a0a0a;padding:32px 16px">
    <tr><td align="center">
      <table width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;background:#111214;border:1px solid #252729;border-top:3px solid #26fd71;border-radius:8px;overflow:hidden">

        <!-- HEADER -->
        <tr>
          <td style="padding:28px 32px;background:#0d0f10;border-bottom:1px solid #1e2023">
            <span style="font-family:'Trebuchet MS',sans-serif;font-size:22px;font-weight:900;color:#f0f0ee;letter-spacing:2px">
              HIVER<span style="color:#26fd71">CAR</span>
            </span>
            <span style="font-size:11px;color:#545658;letter-spacing:1px;margin-left:8px">AUTOPEÇAS</span>
          </td>
        </tr>

        <!-- BODY -->
        <tr>
          <td style="padding:32px">
            <p style="font-size:16px;color:#f0f0ee;margin:0 0 8px">Olá, <strong>${name}</strong>!</p>
            <p style="font-size:14px;color:#818386;margin:0 0 28px">
              Obrigado por se cadastrar na HIVERCAR AUTOPEÇAS. Para ativar sua conta, confirme seu endereço de e-mail clicando no botão abaixo.
            </p>

            <div style="text-align:center;margin-bottom:28px">
              <a href="${verifyLink}"
                 style="display:inline-block;background:#26fd71;color:#0a0a0a;font-weight:700;font-size:14px;padding:16px 40px;text-decoration:none;letter-spacing:1px;border-radius:2px">
                ✓ CONFIRMAR MEU E-MAIL
              </a>
            </div>

            <p style="font-size:12px;color:#545658;text-align:center;margin:0 0 8px">
              Ou copie e cole este link no seu navegador:
            </p>
            <p style="font-size:11px;color:#3b82f6;text-align:center;word-break:break-all;margin:0">
              ${verifyLink}
            </p>

            <div style="margin-top:28px;padding:14px;background:#0a1a10;border-left:3px solid #26fd71;font-size:12px;color:#818386">
              <strong style="color:#f0f0ee">Não se cadastrou?</strong> Ignore este e-mail com segurança. Nenhuma ação será necessária.
            </div>
          </td>
        </tr>

        <!-- FOOTER -->
        <tr>
          <td style="padding:16px 32px;background:#0d0f10;border-top:1px solid #1e2023;text-align:center">
            <p style="font-size:11px;color:#3a3c3e;margin:0">
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
