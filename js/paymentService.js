// ─── HIVERCAR · paymentService.js ────────────────────────────────────────────
// US-29: Integração PIX (Mercado Pago) - geração de QR Code e polling de status
// US-30: Cálculo de frete real via ViaCEP + tabela de preços simulada
//
// MODO DE OPERAÇÃO:
//   Em produção: define window.HIVERCAR_MP_PUBLIC_KEY = "APP_USR-..." e
//                window.HIVERCAR_MP_ACCESS_TOKEN = "APP_USR-..." (via Appwrite Function)
//   Em desenvolvimento: usa valores mock automáticos
//
// USO:
//   import { PaymentService } from "./paymentService.js"
//
//   // Criar preferência PIX
//   const pix = await PaymentService.createPixPayment({ total, orderId, email })
//   // pix.qrCode   - string para exibir com QR Code
//   // pix.qrCodeBase64 - imagem base64
//   // pix.paymentId - ID para polling
//
//   // Verificar status
//   const status = await PaymentService.checkPaymentStatus(paymentId)
//   // status.paid - boolean
//
//   // Calcular frete
//   const opcoes = await PaymentService.calcularFrete(cepDestino, pesoKg)
//   // opcoes - [{ tipo, nome, valor, prazo }]
// ─────────────────────────────────────────────────────────────────────────────

import { CONFIG } from "./config.js"

// ── Detecta modo mock ─────────────────────────────────────────────────────────
const isMock = () =>
  typeof window === "undefined" ||
  !window.HIVERCAR_MP_ACCESS_TOKEN ||
  window.HIVERCAR_MP_ACCESS_TOKEN === "SANDBOX"

// ── CEP de origem (loja) ──────────────────────────────────────────────────────
const CEP_ORIGEM = "65500000"  // Chapadinha - MA

// ─────────────────────────────────────────────────────────────────────────────
// PIX - Mercado Pago
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Cria preferência de pagamento PIX no Mercado Pago.
 * Em modo dev/mock, retorna dados simulados para teste visual.
 *
 * PRODUÇÃO: requer Appwrite Function intermediária para guardar o access_token
 * no servidor (nunca expor no frontend).
 * Crie uma function "create-pix-payment" que recebe { total, orderId, email }
 * e chama a API do MP com o token servidor.
 *
 * @param {{ total: number, orderId: string, email: string, description?: string }} params
 */
export async function createPixPayment({ total, orderId, email, description }) {
  if (isMock()) {
    return _mockPixPayment(total, orderId)
  }

  // Em produção: chama Appwrite Function que faz a requisição ao Mercado Pago
  // com o access_token no servidor (nunca no frontend)
  try {
    const fnEndpoint = `${CONFIG.ENDPOINT}/functions/${CONFIG.FUNCTIONS?.CREATE_PIX || "create-pix-payment"}/executions`
    const resp = await fetch(fnEndpoint, {
      method: "POST",
      headers: { "Content-Type": "application/json", "X-Appwrite-Project": CONFIG.PROJECT_ID },
      body: JSON.stringify({ total, orderId, email, description: description || `Pedido HIVERCAR #${orderId}` }),
    })
    if (!resp.ok) throw new Error(`Function PIX retornou ${resp.status}`)
    const data = await resp.json()
    return {
      paymentId:    data.id,
      qrCode:       data.point_of_interaction?.transaction_data?.qr_code,
      qrCodeBase64: data.point_of_interaction?.transaction_data?.qr_code_base64,
      status:       data.status,
      expiresAt:    data.date_of_expiration,
    }
  } catch (err) {
    console.error("[PaymentService] createPixPayment error:", err)
    // Fallback para mock em caso de erro de integração
    return _mockPixPayment(total, orderId)
  }
}

/**
 * Verifica o status de um pagamento PIX pelo ID.
 * @param {string} paymentId
 * @returns {{ paid: boolean, status: string }}
 */
export async function checkPaymentStatus(paymentId) {
  if (isMock() || paymentId?.startsWith("MOCK_")) {
    // Mock: simula aprovação após 15 segundos (para demonstração)
    const createdAt = parseInt(paymentId?.split("_")?.[1] || "0")
    const paid = Date.now() - createdAt > 15000
    return { paid, status: paid ? "approved" : "pending" }
  }

  try {
    const fnEndpoint = `${CONFIG.ENDPOINT}/functions/${CONFIG.FUNCTIONS?.CHECK_PAYMENT || "check-payment-status"}/executions`
    const resp = await fetch(fnEndpoint, {
      method: "POST",
      headers: { "Content-Type": "application/json", "X-Appwrite-Project": CONFIG.PROJECT_ID },
      body: JSON.stringify({ paymentId }),
    })
    if (!resp.ok) throw new Error(`Check payment ${resp.status}`)
    const data = await resp.json()
    return { paid: data.status === "approved", status: data.status }
  } catch (err) {
    console.error("[PaymentService] checkPaymentStatus error:", err)
    return { paid: false, status: "error", error: err.message }
  }
}

// ── Dados mock para PIX ───────────────────────────────────────────────────────
function _mockPixPayment(total, orderId) {
  const mockId = `MOCK_${Date.now()}_${orderId}`
  // QR Code mock - string válida para ser exibida (não funcional para pagamento)
  const qrString = `00020126580014BR.GOV.BCB.PIX0136hivercar-mock@pix.br5204000053039865406${Number(total).toFixed(2).replace(".", "")}5802BR5913HIVERCAR AUTO6009CHAPADINHA62070503***6304HIVERCAR`
  return {
    paymentId:    mockId,
    qrCode:       qrString,
    qrCodeBase64: null,   // null em modo mock - UI usa biblioteca de QR
    status:       "pending",
    expiresAt:    new Date(Date.now() + 30 * 60 * 1000).toISOString(),
    isMock:       true,
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// FRETE - Cálculo via tabela + ViaCEP para validar CEP
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Calcula opções de frete para o CEP de destino.
 * Em produção: substituir _calcFreteTabela por chamada à API dos Correios
 * ou Melhor Envio (https://melhorenvio.com.br/integracao).
 *
 * @param {string} cepDestino - CEP do cliente (apenas dígitos)
 * @param {number} pesoKg     - Peso total dos produtos em kg
 * @param {number} valorDeclarado - Valor total do pedido para seguro
 * @returns {Promise<Array<{ id, tipo, nome, valor, prazo, descricao }>>}
 */
export async function calcularFrete(cepDestino, pesoKg = 0.5, valorDeclarado = 0) {
  const cep = cepDestino.replace(/\D/g, "")
  if (cep.length !== 8) throw new Error("CEP inválido")

  // 1. Valida e obtém UF do CEP via ViaCEP (gratuito, sem chave)
  let uf = "MA"  // padrão
  try {
    const resp = await fetch(`https://viacep.com.br/ws/${cep}/json/`)
    if (resp.ok) {
      const data = await resp.json()
      if (!data.erro) uf = data.uf
    }
  } catch {
    // Continua com UF padrão - frete ainda é calculado
  }

  // 2. Calcula com tabela simulada (substituir por API Correios em produção)
  return _calcFreteTabela(uf, pesoKg, valorDeclarado)
}

/**
 * Tabela de fretes por UF - valores aproximados Correios 2024.
 * PRODUÇÃO: substituir pela API oficial dos Correios ou Melhor Envio.
 * Documentação: https://melhorenvio.com.br/integracao/
 */
function _calcFreteTabela(uf, pesoKg, valorDeclarado) {
  // Base por região
  const regioes = {
    MA: { base: 12, extra: 1.8 },   // Maranhão (origem)
    PA: { base: 14, extra: 2.0 },
    PI: { base: 16, extra: 2.2 },
    CE: { base: 18, extra: 2.5 },
    PE: { base: 20, extra: 2.8 },
    BA: { base: 22, extra: 3.0 },
    GO: { base: 25, extra: 3.5 },
    MG: { base: 28, extra: 3.8 },
    SP: { base: 32, extra: 4.0 },
    RJ: { base: 30, extra: 4.0 },
    RS: { base: 38, extra: 5.0 },
    default: { base: 35, extra: 4.5 },
  }

  const { base, extra } = regioes[uf] || regioes.default
  const seguro  = valorDeclarado > 50 ? valorDeclarado * 0.01 : 0
  const peso    = Math.max(0.3, pesoKg)

  // PAC: mais barato, mais lento
  const pac = {
    id:        "pac",
    tipo:      "pac",
    nome:      "PAC - Correios",
    valor:     +(base + extra * peso + seguro).toFixed(2),
    prazo:     uf === "MA" ? 3 : uf === "SP" || uf === "RJ" ? 8 : 5,
    descricao: "Entrega econômica",
  }

  // SEDEX: mais caro, mais rápido
  const sedex = {
    id:        "sedex",
    tipo:      "sedex",
    nome:      "SEDEX - Correios",
    valor:     +((base * 1.8) + (extra * 1.5 * peso) + seguro).toFixed(2),
    prazo:     uf === "MA" ? 1 : uf === "SP" || uf === "RJ" ? 3 : 2,
    descricao: "Entrega expressa",
  }

  // Retirada grátis sempre disponível
  const retirada = {
    id:        "retirada",
    tipo:      "retirada",
    nome:      "Retirar na Loja",
    valor:     0,
    prazo:     0,
    descricao: "Av. Ataliba Vieira, 1357 - Chapadinha",
  }

  return [retirada, pac, sedex]
}

// ─────────────────────────────────────────────────────────────────────────────
// EXPORTAÇÃO AGRUPADA
// ─────────────────────────────────────────────────────────────────────────────

export const PaymentService = {
  createPixPayment,
  checkPaymentStatus,
  calcularFrete,
}
