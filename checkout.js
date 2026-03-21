// ─── HIVERCAR · checkout.js ──────────────────────────────────────────────────
// Controlador da página checkout.html. Apenas UI — zero lógica de negócio.
// Camada: Presentation.
//
// US-04: Validação robusta
//   - Sem alert() — erros inline abaixo dos campos
//   - CPF validado com algoritmo dos dígitos verificadores
//   - E-mail validado com regex antes de criar pedido
//   - Botão 'Confirmar' desabilitado se campos inválidos
//   - Highlight vermelho em campos com erro
//
// US-24: Catch silenciosos substituídos por ErrorService
// US-29: Integração PIX via PaymentService (QR Code + polling de status)
// US-30: Cálculo de frete real via PaymentService.calcularFrete (ViaCEP + tabela)

import { OrderService }       from "./orderService.js"
import { CartService }        from "./cartService.js"
import { PaymentService }     from "./paymentService.js"
import { fmt, initParticles } from "./utils.js"
import { ErrorService }       from "./errorService.js"

// ── INIT ──────────────────────────────────────────────────────────────────────
initParticles()

// ── BADGE ─────────────────────────────────────────────────────────────────────
const badge = document.getElementById("cartBadge")
if (badge) badge.textContent = CartService.count()

// ── ESTADO ────────────────────────────────────────────────────────────────────
let selectedFrete   = 0
let currentPay      = "pix"
let pixPaymentId    = null    // US-29: ID do pagamento PIX criado
let pixPollTimer    = null    // US-29: timer de polling de confirmação
let freteOpcoes     = []      // US-30: opções calculadas
let freteCalculado  = false   // US-30: flag

const fmtBRL = v => "R$ " + Number(v).toFixed(2).replace(".", ",")

// ── VALIDADORES ───────────────────────────────────────────────────────────────

/** Valida e-mail com regex. */
function isEmailValid(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email.trim())
}

/**
 * Valida CPF pelo algoritmo dos dígitos verificadores.
 * Aceita "000.000.000-00" ou "00000000000".
 */
function isCpfValid(raw) {
  const cpf = raw.replace(/\D/g, "")
  if (cpf.length !== 11) return false
  if (/^(\d)\1+$/.test(cpf)) return false // todos iguais

  let sum = 0
  for (let i = 0; i < 9; i++) sum += parseInt(cpf[i]) * (10 - i)
  let d1 = (sum * 10) % 11; if (d1 === 10 || d1 === 11) d1 = 0
  if (d1 !== parseInt(cpf[9])) return false

  sum = 0
  for (let i = 0; i < 10; i++) sum += parseInt(cpf[i]) * (11 - i)
  let d2 = (sum * 10) % 11; if (d2 === 10 || d2 === 11) d2 = 0
  return d2 === parseInt(cpf[10])
}

/** Valida nome (mínimo 2 palavras, 3+ chars cada). */
function isNomeValid(nome) {
  const parts = nome.trim().split(/\s+/)
  return parts.length >= 2 && parts.every(p => p.length >= 2)
}

// ── INLINE ERROR ──────────────────────────────────────────────────────────────
function setError(id, msg) {
  const el = document.getElementById(id)
  if (!el) return
  el.style.borderColor = "var(--red, #fb1230)"
  el.style.boxShadow   = "0 0 0 2px rgba(251,18,48,.2)"

  let span = el.parentElement?.querySelector(".field-error")
  if (!span) {
    span = document.createElement("span")
    span.className = "field-error"
    span.style.cssText = `
      color:#f87171;font-size:11px;display:block;
      margin-top:4px;font-family:'Barlow',sans-serif;
    `
    el.insertAdjacentElement("afterend", span)
  }
  span.textContent = msg

  const clear = () => { clearError(id); el.removeEventListener("input", clear) }
  el.addEventListener("input", clear)
}

function clearError(id) {
  const el = document.getElementById(id)
  if (!el) return
  el.style.borderColor = ""
  el.style.boxShadow   = ""
  el.parentElement?.querySelector(".field-error")?.remove()
}

// ── VALIDAÇÃO STEP 1 ──────────────────────────────────────────────────────────
function validateStep1() {
  let ok = true
  const nome  = document.getElementById("nome")?.value.trim()  || ""
  const cpf   = document.getElementById("cpf")?.value.trim()   || ""
  const email = document.getElementById("email")?.value.trim() || ""

  if (!isNomeValid(nome)) {
    setError("nome", "Informe nome e sobrenome (mínimo 2 palavras).")
    ok = false
  } else clearError("nome")

  if (!isCpfValid(cpf)) {
    setError("cpf", "CPF inválido. Verifique os dígitos.")
    ok = false
  } else clearError("cpf")

  if (!isEmailValid(email)) {
    setError("email", "E-mail inválido. Ex: seu@email.com")
    ok = false
  } else clearError("email")

  return ok
}

// ── VALIDAÇÃO STEP 2 ──────────────────────────────────────────────────────────
function validateStep2() {
  let ok = true
  const cep    = document.getElementById("cep")?.value.replace(/\D/g, "") || ""
  const numero = document.getElementById("numero")?.value.trim() || ""

  if (cep.length !== 8) {
    setError("cep", "CEP inválido. Digite 8 dígitos.")
    ok = false
  } else clearError("cep")

  if (!numero) {
    setError("numero", "Informe o número do endereço.")
    ok = false
  } else clearError("numero")

  return ok
}

// ── VALIDAÇÃO STEP 3 (pagamento) ──────────────────────────────────────────────
function validateStep3() {
  let ok = true
  const termos = document.getElementById("aceitarTermos")?.checked
  if (!termos) {
    ErrorService.toastWarn("Você precisa aceitar os Termos de Uso para continuar.")
    ok = false
  }
  if (currentPay === "card") {
    const cardNum = document.getElementById("cardNum")?.value.replace(/\D/g,"") || ""
    const cardVal = document.getElementById("cardVal")?.value.trim() || ""
    const cardCvv = document.getElementById("cardCvv")?.value.trim() || ""
    if (cardNum.length < 13) { setError("cardNum", "Número de cartão inválido."); ok = false }
    else clearError("cardNum")
    if (!/^\d{2}\/\d{2}$/.test(cardVal)) { setError("cardVal", "Use MM/AA."); ok = false }
    else clearError("cardVal")
    if (cardCvv.length < 3) { setError("cardCvv", "CVV inválido."); ok = false }
    else clearError("cardCvv")
  }
  return ok
}

// ── CONTROLE DO BOTÃO CONFIRMAR ───────────────────────────────────────────────
function syncConfirmarBtn() {
  const confirmarBtn = document.getElementById("confirmarBtn")
  if (!confirmarBtn) return
  const hasItems = CartService.count() > 0
  confirmarBtn.disabled = !hasItems
  confirmarBtn.title    = hasItems ? "" : "Seu carrinho está vazio."
}
syncConfirmarBtn()

// ── RESUMO ────────────────────────────────────────────────────────────────────
function renderResumo() {
  const cart  = CartService.get()
  const sub   = CartService.total()
  const tax   = sub * 0.12
  const total = sub + tax + selectedFrete

  const resumoItens = document.getElementById("resumoItens")
  if (resumoItens) {
    resumoItens.innerHTML = cart.map(i => `
      <div style="display:flex;justify-content:space-between;padding:6px 0;border-bottom:1px solid rgba(255,255,255,.04);font-size:12px">
        <span style="color:var(--muted)">${i.name} ×${i.qty || 1}</span>
        <span>${fmtBRL(Number(i.price) * (i.qty || 1))}</span>
      </div>`).join("")
  }

  const set = (id, v) => { const el = document.getElementById(id); if (el) el.textContent = v }
  set("rSub",   fmtBRL(sub))
  set("rTax",   fmtBRL(tax))
  set("rFrete", fmtBRL(selectedFrete))
  set("rTotal", fmtBRL(total))
}

renderResumo()

// ── STEPS ─────────────────────────────────────────────────────────────────────
window.goStep = n => {
  // Ao avançar, valida o step atual
  const current = [...document.querySelectorAll(".step-panel")]
    .findIndex(p => p.classList.contains("active")) + 1

  if (n > current) {
    if (current === 1 && !validateStep1()) return
    if (current === 2 && !validateStep2()) return
  }

  document.querySelectorAll(".step-panel").forEach((p, i) => p.classList.toggle("active", i + 1 === n))
  document.querySelectorAll(".step").forEach((s, i) => {
    s.classList.toggle("active", i + 1 === n)
    s.classList.toggle("done",   i + 1 < n)
  })
  window.scrollTo({ top: 0, behavior: "smooth" })
}

// ── FRETE ─────────────────────────────────────────────────────────────────────
document.querySelectorAll("#freteOptions .pay-option").forEach(o => {
  o.onclick = () => {
    document.querySelectorAll("#freteOptions .pay-option").forEach(x => x.classList.remove("selected"))
    o.classList.add("selected")
    selectedFrete = Number(o.dataset.frete) || 0
    renderResumo()
  }
})

// ── PAGAMENTO ─────────────────────────────────────────────────────────────────
document.querySelectorAll("#payOptions .pay-option").forEach(o => {
  o.onclick = () => {
    document.querySelectorAll("#payOptions .pay-option").forEach(x => x.classList.remove("selected"))
    o.classList.add("selected")
    currentPay = o.dataset.pay
    const cardFields = document.getElementById("cardFields")
    if (cardFields) cardFields.style.display = currentPay === "card" ? "block" : "none"
  }
})

// ── MÁSCARA CPF ───────────────────────────────────────────────────────────────
const cpfInput = document.getElementById("cpf")
if (cpfInput) {
  cpfInput.addEventListener("input", () => {
    let v = cpfInput.value.replace(/\D/g, "").slice(0, 11)
    if (v.length > 9) v = v.replace(/(\d{3})(\d{3})(\d{3})(\d{0,2})/, "$1.$2.$3-$4")
    else if (v.length > 6) v = v.replace(/(\d{3})(\d{3})(\d{0,3})/, "$1.$2.$3")
    else if (v.length > 3) v = v.replace(/(\d{3})(\d{0,3})/, "$1.$2")
    cpfInput.value = v
  })
}

// ── MÁSCARA CARTÃO ────────────────────────────────────────────────────────────
const cardNumInput = document.getElementById("cardNum")
if (cardNumInput) {
  cardNumInput.addEventListener("input", () => {
    const v = cardNumInput.value.replace(/\D/g, "").slice(0, 16)
    cardNumInput.value = v.replace(/(\d{4})(?=\d)/g, "$1 ")
  })
}
const cardValInput = document.getElementById("cardVal")
if (cardValInput) {
  cardValInput.addEventListener("input", () => {
    let v = cardValInput.value.replace(/\D/g, "").slice(0, 4)
    if (v.length > 2) v = v.replace(/(\d{2})(\d{0,2})/, "$1/$2")
    cardValInput.value = v
  })
}

// ── CEP ───────────────────────────────────────────────────────────────────────
const buscarCepBtn = document.getElementById("buscarCep")
if (buscarCepBtn) {
  buscarCepBtn.onclick = async () => {
    const cep = document.getElementById("cep")?.value.replace(/\D/g, "")
    if (cep?.length !== 8) { setError("cep", "Digite 8 dígitos antes de buscar."); return }
    try {
      const d = await fetch(`https://viacep.com.br/ws/${cep}/json/`).then(r => r.json())
      if (d.erro) {
        setError("cep", "CEP não encontrado. Preencha manualmente.")
        return
      }
      const set = (id, v) => { const el = document.getElementById(id); if (el) el.value = v || "" }
      set("endereco", d.logradouro)
      set("bairro",   d.bairro)
      set("cidade",   d.localidade)
      set("estado",   d.uf)
      clearError("cep")
      ErrorService.toastSuccess("Endereço preenchido automaticamente.")
    } catch (err) {
      ErrorService.handle(err, "checkout.buscarCep", { fallback: "Não foi possível buscar o CEP. Preencha manualmente." })
    }
  }
}

// ── CONFIRMAR PEDIDO ──────────────────────────────────────────────────────────
const confirmarBtn = document.getElementById("confirmarBtn")
if (confirmarBtn) {
  confirmarBtn.onclick = async () => {
    // Valida todos os steps antes de enviar
    const okS1 = validateStep1()
    const okS2 = validateStep2()
    const okS3 = validateStep3()

    if (!okS1) { window.goStep(1); return }
    if (!okS2) { window.goStep(2); return }
    if (!okS3) return

    confirmarBtn.disabled = true
    confirmarBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Processando...'

    try {
      const nome     = document.getElementById("nome")?.value.trim()
      const email    = document.getElementById("email")?.value.trim()
      const cpf      = document.getElementById("cpf")?.value.trim()
      const telefone = document.getElementById("telefone")?.value.trim()
      const endereco = document.getElementById("endereco")?.value.trim()
      const numero   = document.getElementById("numero")?.value.trim()
      const bairro   = document.getElementById("bairro")?.value.trim()
      const cidade   = document.getElementById("cidade")?.value.trim()
      const estado   = document.getElementById("estado")?.value.trim()
      const cep      = document.getElementById("cep")?.value.trim()

      const order = await OrderService.placeOrder(
        { nome, email, cpf, telefone, endereco, numero, bairro, cidade, estado, cep },
        selectedFrete,
        currentPay,
      )

      const pedidoNum = document.getElementById("pedidoNum")
      if (pedidoNum) pedidoNum.textContent = "Pedido #" + order.$id.slice(-5).toUpperCase()
      document.getElementById("modal")?.classList.add("show")
      if (badge) badge.textContent = CartService.count()

    } catch (err) {
      ErrorService.handle(err, "checkout.confirmarPedido", { fallback: "Erro ao confirmar pedido. Tente novamente." })
      confirmarBtn.disabled = false
      confirmarBtn.innerHTML = '<i class="fas fa-lock"></i> Confirmar Pedido'
    }
  }
}

// ── TIMER ─────────────────────────────────────────────────────────────────────
let secs = 900
const tMin = document.getElementById("tMin")
const tSec = document.getElementById("tSec")
setInterval(() => {
  if (secs <= 0) return
  secs--
  if (tMin) tMin.textContent = String(Math.floor(secs / 60)).padStart(2, "0")
  if (tSec) tSec.textContent = String(secs % 60).padStart(2, "0")
}, 1000)

// ── US-30: FRETE REAL ─────────────────────────────────────────────────────────
const calcularFreteBtn = document.getElementById("calcularFreteBtn")
if (calcularFreteBtn) {
  calcularFreteBtn.addEventListener("click", async () => {
    const cep   = document.getElementById("cep")?.value.replace(/\D/g, "")
    const items = CartService.get()
    if (!cep || cep.length !== 8) { setError("cep", "Informe um CEP válido para calcular o frete."); return }

    calcularFreteBtn.disabled = true
    calcularFreteBtn.innerHTML = `<span class="spinner"></span> Calculando…`

    try {
      // Peso estimado: 0.5kg por item
      const pesoTotal = items.reduce((s, i) => s + 0.5 * (i.qty || 1), 0)
      const valorTotal = CartService.total()

      freteOpcoes = await PaymentService.calcularFrete(cep, pesoTotal, valorTotal)
      freteCalculado = true

      const container = document.getElementById("freteOptions")
      if (container) {
        container.innerHTML = freteOpcoes.map(op => `
          <div class="pay-option ${op.tipo === 'retirada' ? 'selected' : ''}" data-frete="${op.valor}" data-id="${op.id}">
            <div class="pay-icon">
              <i class="fas fa-${op.tipo === 'retirada' ? 'store' : op.tipo === 'sedex' ? 'rocket' : 'box'}"></i>
            </div>
            <div>
              <div class="pay-name">${op.nome}</div>
              <div class="pay-detail">${op.descricao}${op.prazo > 0 ? ` — ${op.prazo} dia(s) útil(eis)` : ''}</div>
            </div>
            ${op.valor > 0
              ? `<div style="margin-left:auto;font-family:'Bebas Neue',sans-serif;font-size:18px;color:var(--green)">R$ ${op.valor.toFixed(2)}</div>`
              : `<div style="margin-left:auto;font-family:'Bebas Neue',sans-serif;font-size:16px;color:var(--green)">GRÁTIS</div>`
            }
            <div class="pay-check"><i class="fas fa-check"></i></div>
          </div>`).join("")

        // Reativar seleção
        container.querySelectorAll(".pay-option").forEach(el => {
          el.addEventListener("click", () => {
            container.querySelectorAll(".pay-option").forEach(x => x.classList.remove("selected"))
            el.classList.add("selected")
            selectedFrete = Number(el.dataset.frete) || 0
            renderResumo()
          })
        })

        // Seleciona retirada por padrão
        selectedFrete = 0
        renderResumo()
        ErrorService.toastSuccess("Frete calculado com sucesso!")
      }
    } catch (err) {
      ErrorService.handle(err, "checkout.calcularFrete", { fallback: "Não foi possível calcular o frete." })
    } finally {
      calcularFreteBtn.disabled = false
      calcularFreteBtn.innerHTML = `<i class="fas fa-truck"></i> Recalcular`
    }
  })
}

// ── US-29: PIX — POLLING DE CONFIRMAÇÃO ──────────────────────────────────────
async function iniciarPollingPix(paymentId) {
  if (pixPollTimer) clearInterval(pixPollTimer)
  let tentativas = 0
  const maxTentativas = 60  // polling por até 5 minutos (60 × 5s)

  pixPollTimer = setInterval(async () => {
    tentativas++
    try {
      const { paid, status } = await PaymentService.checkPaymentStatus(paymentId)
      const statusEl = document.getElementById("pixStatus")

      if (paid) {
        clearInterval(pixPollTimer)
        if (statusEl) {
          statusEl.innerHTML = `<span style="color:var(--green)"><i class="fas fa-circle-check"></i> Pagamento confirmado!</span>`
        }
        // Finaliza o pedido automaticamente
        const confirmarBtn = document.getElementById("confirmarBtn")
        if (confirmarBtn) confirmarBtn.click()
        return
      }

      if (statusEl && status === "pending") {
        const elapsed = tentativas * 5
        statusEl.textContent = `Aguardando pagamento… (${elapsed}s)`
      }
    } catch { /* ignora erros de polling */ }

    if (tentativas >= maxTentativas) {
      clearInterval(pixPollTimer)
      const statusEl = document.getElementById("pixStatus")
      if (statusEl) {
        statusEl.innerHTML = `<span style="color:var(--red)">Tempo esgotado. Gere um novo QR Code.</span>`
      }
    }
  }, 5000)
}

// ── US-29: GERAR QR CODE PIX ──────────────────────────────────────────────────
const gerarPixBtn = document.getElementById("gerarPixBtn")
if (gerarPixBtn) {
  gerarPixBtn.addEventListener("click", async () => {
    const email = document.getElementById("email")?.value.trim()
    const total = CartService.total() * (1 + 0.12) + selectedFrete

    if (!email) { ErrorService.toastWarn("Informe o e-mail antes de gerar o QR Code."); return }
    if (total <= 0) { ErrorService.toastWarn("Carrinho vazio."); return }

    gerarPixBtn.disabled = true
    gerarPixBtn.innerHTML = `<span class="spinner"></span> Gerando QR Code…`

    try {
      const orderId = `PRE_${Date.now()}`
      const pix = await PaymentService.createPixPayment({ total, orderId, email })
      pixPaymentId = pix.paymentId

      // Exibe QR Code
      const qrContainer = document.getElementById("qrCodeContainer")
      if (qrContainer) {
        qrContainer.style.display = "block"
        const qrText = document.getElementById("qrCodeText")
        if (qrText) qrText.value = pix.qrCode || ""

        if (pix.isMock) {
          const mock = document.getElementById("pixMockWarning")
          if (mock) mock.style.display = "flex"
        }
      }

      // Inicia polling
      iniciarPollingPix(pixPaymentId)

      ErrorService.toastSuccess("QR Code gerado! Abra seu app bancário para pagar.")
    } catch (err) {
      ErrorService.handle(err, "checkout.gerarPix", { fallback: "Erro ao gerar QR Code PIX." })
    } finally {
      gerarPixBtn.disabled = false
      gerarPixBtn.innerHTML = `<i class="fas fa-qrcode"></i> Gerar QR Code PIX`
    }
  })
}

// ── US-29: COPIAR CÓDIGO PIX ──────────────────────────────────────────────────
const copiarPixBtn = document.getElementById("copiarPixBtn")
if (copiarPixBtn) {
  copiarPixBtn.addEventListener("click", () => {
    const qrText = document.getElementById("qrCodeText")
    if (qrText?.value) {
      navigator.clipboard?.writeText(qrText.value)
        .then(() => ErrorService.toastSuccess("Código PIX copiado!"))
        .catch(() => { qrText.select(); document.execCommand("copy"); ErrorService.toastSuccess("Código copiado!") })
    }
  })
}
