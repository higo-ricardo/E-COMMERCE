// ─── HIVERCAR · functions/emit-nfe/index.js ──────────────────────────────────
// US-43: Appwrite Function — Emissão de NFC-e via integrador NF-e
//
// TRIGGER: HTTP (chamada direta do nfService.js após confirmação de pagamento)
//
// SUPORTE A INTEGRADORES:
//   NFE_PROVIDER = "nfeio"     → NFe.io    (https://nfe.io)
//   NFE_PROVIDER = "focus"     → Focus NF-e (https://focusnfe.com.br)
//   NFE_PROVIDER = "plugnotas" → Plugnotas  (https://plugnotas.com.br)
//
// VARIÁVEIS DE AMBIENTE OBRIGATÓRIAS:
//   NFE_PROVIDER       → "nfeio" | "focus" | "plugnotas"
//   NFE_API_KEY        → API key / token do integrador escolhido
//   NFE_COMPANY_ID     → ID da empresa no integrador (NFe.io e Plugnotas)
//   NFE_AMBIENTE       → "homologacao" | "producao"
//   RESEND_API_KEY     → para enviar PDF da NF ao cliente
//   EMAIL_FROM         → HIVERCAR AUTOPEÇAS <noreply@hivercar.com.br>
//   APPWRITE_DB        → 69a0ebc70034fa76feff
//
// SETUP NO APPWRITE CONSOLE:
//   1. Criar Function com Runtime Node.js 18
//   2. Entrypoint: index.js
//   3. Adicionar as variáveis de ambiente acima
//   4. Permissão: qualquer usuário autenticado pode executar
// ─────────────────────────────────────────────────────────────────────────────

import { Client, Databases } from "node-appwrite"

const PROVIDER  = process.env.NFE_PROVIDER  || "nfeio"
const API_KEY   = process.env.NFE_API_KEY   || ""
const COMPANY   = process.env.NFE_COMPANY_ID || ""
const AMBIENTE  = process.env.NFE_AMBIENTE  || "homologacao"
const DB_ID     = process.env.APPWRITE_DB   || "69a0ebc70034fa76feff"

export default async ({ req, res, log, error }) => {
  const client = new Client()
    .setEndpoint(process.env.APPWRITE_FUNCTION_API_ENDPOINT)
    .setProject(process.env.APPWRITE_FUNCTION_PROJECT_ID)
    .setKey(req.headers["x-appwrite-key"] ?? "")

  const db = new Databases(client)

  let orderId, payload
  try {
    orderId = req.body?.orderId
    payload = req.body?.payload
    if (!orderId || !payload) throw new Error("orderId e payload são obrigatórios")
  } catch (e) {
    return res.json({ ok: false, mensagem: "Payload inválido: " + e.message }, 400)
  }

  // ── Verificar se credenciais estão configuradas ───────────────────────────
  if (!API_KEY) {
    const msg = "NFE_API_KEY não configurada. Sprint 05 requer credencial do integrador NF-e."
    error("[emit-nfe] " + msg)
    return res.json({
      ok:        false,
      mensagem:  msg,
      instrucoes:[
        "1. Contratar integrador NF-e: NFe.io, Focus NF-e ou Plugnotas",
        "2. Obter API Key e Company ID do integrador",
        "3. Configurar variáveis NFE_API_KEY, NFE_COMPANY_ID no Appwrite Console",
        "4. Obter certificado digital A1 e cadastrá-lo no integrador",
        "5. Testar em ambiente de homologação antes de produção",
      ],
    }, 424)  // 424 = Failed Dependency
  }

  log(`[emit-nfe] Emitindo NFC-e para pedido ${orderId} via ${PROVIDER} (${AMBIENTE})`)

  try {
    let result

    // ── Chamar o integrador correto ───────────────────────────────────────
    if (PROVIDER === "nfeio") {
      result = await emitirNFeIo(payload)
    } else if (PROVIDER === "focus") {
      result = await emitirFocus(payload, orderId)
    } else if (PROVIDER === "plugnotas") {
      result = await emitirPlugnotas(payload)
    } else {
      throw new Error(`Provedor desconhecido: ${PROVIDER}`)
    }

    log(`[emit-nfe] Sucesso — chave: ${result.chaveAcesso}`)

    // ── Enviar PDF por e-mail ao cliente ──────────────────────────────────
    if (result.pdfUrl && payload.destinatario?.email && process.env.RESEND_API_KEY) {
      await enviarEmailNFe({
        email:       payload.destinatario.email,
        nome:        payload.destinatario.nome,
        pedidoNum:   orderId.slice(-8).toUpperCase(),
        pdfUrl:      result.pdfUrl,
        chaveAcesso: result.chaveAcesso,
        total:       payload.totais?.totalNota,
      })
      log(`[emit-nfe] PDF enviado por e-mail para ${payload.destinatario.email}`)
    }

    return res.json({ ok: true, ...result })

  } catch (err) {
    error(`[emit-nfe] Erro: ${err.message}`)
    return res.json({
      ok:       false,
      mensagem: err.message,
      ambiente: AMBIENTE,
    }, 500)
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// ADAPTADORES POR INTEGRADOR
// ─────────────────────────────────────────────────────────────────────────────

async function emitirNFeIo(payload) {
  // Documentação: https://nfe.io/docs/
  const url  = AMBIENTE === "producao"
    ? `https://api.nfe.io/v1/companies/${COMPANY}/nfce`
    : `https://api.sandbox.nfe.io/v1/companies/${COMPANY}/nfce`

  const resp = await fetch(url, {
    method:  "POST",
    headers: { "Authorization": `Bearer ${API_KEY}`, "Content-Type": "application/json" },
    body:    JSON.stringify(payload),
  })

  const data = await resp.json()
  if (!resp.ok || data.status === "error") {
    throw new Error(`NFe.io: ${data.message || JSON.stringify(data)}`)
  }

  return {
    chaveAcesso: data.accessKey,
    protocolo:   data.approvalNumber,
    pdfUrl:      data.pdfFileUrl    || null,
    xmlUrl:      data.xmlFileUrl    || null,
  }
}

async function emitirFocus(payload, referencia) {
  // Documentação: https://focusnfe.com.br/docs/
  const base = AMBIENTE === "producao"
    ? "https://api.focusnfe.com.br"
    : "https://homologacao.focusnfe.com.br"

  const resp = await fetch(`${base}/v2/nfce?ref=${referencia}`, {
    method:  "POST",
    headers: {
      "Authorization": "Basic " + Buffer.from(API_KEY + ":").toString("base64"),
      "Content-Type":  "application/json",
    },
    body: JSON.stringify(payload),
  })

  const data = await resp.json()
  if (data.status === "erro") {
    throw new Error(`Focus NF-e: ${data.mensagem_sefaz || JSON.stringify(data.erros)}`)
  }

  return {
    chaveAcesso: data.chave_nfe,
    protocolo:   data.numero_protocolo,
    pdfUrl:      data.caminho_danfe || null,
    xmlUrl:      data.caminho_xml   || null,
  }
}

async function emitirPlugnotas(payload) {
  // Documentação: https://plugnotas.com.br/doc
  const url = AMBIENTE === "producao"
    ? "https://api.plugnotas.com.br/nfce"
    : "https://api.sandbox.plugnotas.com.br/nfce"

  const resp = await fetch(url, {
    method:  "POST",
    headers: { "x-api-key": API_KEY, "Content-Type": "application/json" },
    body:    JSON.stringify([payload]),   // Plugnotas aceita array
  })

  const data = await resp.json()
  const nfe  = Array.isArray(data) ? data[0] : data

  if (nfe?.error || nfe?.status === "rejected") {
    throw new Error(`Plugnotas: ${nfe.message || JSON.stringify(nfe)}`)
  }

  return {
    chaveAcesso: nfe.chave,
    protocolo:   nfe.protocolo || null,
    pdfUrl:      nfe.pdf       || null,
    xmlUrl:      nfe.xml       || null,
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// E-MAIL COM PDF DA NF-e
// ─────────────────────────────────────────────────────────────────────────────
async function enviarEmailNFe({ email, nome, pedidoNum, pdfUrl, chaveAcesso, total }) {
  const fmtBRL = v => "R$ " + Number(v || 0).toFixed(2).replace(".", ",")

  await fetch("https://api.resend.com/emails", {
    method:  "POST",
    headers: {
      "Authorization": `Bearer ${process.env.RESEND_API_KEY}`,
      "Content-Type":  "application/json",
    },
    body: JSON.stringify({
      from:    process.env.EMAIL_FROM ?? "HIVERCAR AUTOPEÇAS <noreply@hivercar.com.br>",
      to:      [email],
      subject: `NFC-e do seu pedido #${pedidoNum} — HIVERCAR AUTOPEÇAS`,
      html: `
<!DOCTYPE html>
<html lang="pt-BR">
<body style="background:#0a0a0a;font-family:Arial,sans-serif;padding:32px 16px">
  <table width="600" style="max-width:600px;margin:0 auto;background:#111214;border:1px solid #252729;border-top:3px solid #26fd71">
    <tr><td style="padding:28px 32px;background:#0d0f10;border-bottom:1px solid #1e2023">
      <span style="font-size:22px;font-weight:900;color:#f0f0ee;letter-spacing:2px">HIVER<span style="color:#26fd71">CAR</span></span>
    </td></tr>
    <tr><td style="padding:32px">
      <p style="color:#f0f0ee;font-size:16px;margin:0 0 8px">Olá, <strong>${nome || "Cliente"}</strong>!</p>
      <p style="color:#818386;font-size:14px;margin:0 0 24px">
        A Nota Fiscal do seu pedido #${pedidoNum} foi emitida com sucesso.
      </p>
      <table width="100%" style="background:#0d0f10;border:1px solid #1e2023;margin-bottom:24px">
        <tr>
          <td style="padding:12px 16px;font-size:11px;color:#545658;letter-spacing:1px">PEDIDO</td>
          <td style="padding:12px 16px;font-size:11px;color:#545658;letter-spacing:1px">TOTAL</td>
          <td style="padding:12px 16px;font-size:11px;color:#545658;letter-spacing:1px">CHAVE DE ACESSO</td>
        </tr>
        <tr>
          <td style="padding:12px 16px;font-size:16px;font-weight:700;color:#26fd71">#${pedidoNum}</td>
          <td style="padding:12px 16px;font-size:16px;font-weight:700;color:#f0f0ee">${fmtBRL(total)}</td>
          <td style="padding:12px 16px;font-size:9px;font-family:monospace;color:#818386;word-break:break-all">${chaveAcesso}</td>
        </tr>
      </table>
      ${pdfUrl ? `
      <div style="text-align:center;margin-bottom:24px">
        <a href="${pdfUrl}" style="background:#26fd71;color:#0a0a0a;font-weight:700;font-size:14px;padding:14px 32px;text-decoration:none;display:inline-block;letter-spacing:1px">
          📄 BAIXAR NFC-e (PDF)
        </a>
      </div>` : ""}
      <p style="font-size:12px;color:#545658;text-align:center">
        Dúvidas? WhatsApp: <a href="https://wa.me/5598981168787" style="color:#26fd71">(98) 98116-8787</a>
      </p>
    </td></tr>
    <tr><td style="padding:16px 32px;background:#0d0f10;text-align:center">
      <p style="font-size:11px;color:#3a3c3e;margin:0">HIVERCAR AUTOPEÇAS · © ${new Date().getFullYear()}</p>
    </td></tr>
  </table>
</body>
</html>`,
    }),
  })
}
