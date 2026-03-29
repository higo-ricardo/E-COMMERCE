import { OrderService } from "../../js/orderService.js"
import { CartService } from "../../js/cartService.js"
import { PaymentService } from "../../js/paymentService.js"
import { TaxEngine } from "../../js/taxEngine.js"
import { initParticles } from "../../js/utils.js"
import { ErrorService } from "../../js/errorService.js"
import { CheckoutValidator } from "./CheckoutValidator.js"

export class CheckoutController {
  constructor() {
    this.selectedFrete = 0
    this.currentPay = "pix"
    this.pixPaymentId = null
    this.pixPollTimer = null
    this.freteOpcoes = []
    this.freteCalculado = false
    this.secs = 900
    this.badge = document.getElementById("cartBadge")
  }

  init() {
    initParticles()

    if (this.badge) this.badge.textContent = CartService.count()

    this.syncConfirmarBtn()
    this.renderResumo()

    window.goStep = n => this.goStep(n)

    this.bindFreteOptions()
    this.bindPaymentOptions()
    this.bindMasks()
    this.bindBuscarCep()
    this.bindConfirmarPedido()
    this.initTimer()
    this.bindCalcularFrete()
    this.bindPixActions()
  }

  getValue(id) {
    return document.getElementById(id)?.value ?? ""
  }

  setError(id, msg) {
    const el = document.getElementById(id)
    if (!el) return

    el.style.borderColor = "var(--red, #fb1230)"
    el.style.boxShadow = "0 0 0 2px rgba(251,18,48,.2)"

    let span = el.parentElement?.querySelector(".field-error")
    if (!span) {
      span = document.createElement("span")
      span.className = "field-error"
      span.style.cssText = "color:#f87171;font-size:11px;display:block;margin-top:4px;font-family:'Barlow',sans-serif;"
      el.insertAdjacentElement("afterend", span)
    }

    span.textContent = msg

    const clear = () => {
      this.clearError(id)
      el.removeEventListener("input", clear)
    }
    el.addEventListener("input", clear)
  }

  clearError(id) {
    const el = document.getElementById(id)
    if (!el) return
    el.style.borderColor = ""
    el.style.boxShadow = ""
    el.parentElement?.querySelector(".field-error")?.remove()
  }

  validateStep1() {
    let ok = true
    const nome = this.getValue("nome").trim()
    const cpf = this.getValue("cpf").trim()
    const email = this.getValue("email").trim()

    if (!CheckoutValidator.isNomeValid(nome)) {
      this.setError("nome", "Informe nome e sobrenome (mínimo 2 palavras).")
      ok = false
    } else {
      this.clearError("nome")
    }

    if (!CheckoutValidator.isCpfValid(cpf)) {
      this.setError("cpf", "CPF inválido. Verifique os dígitos.")
      ok = false
    } else {
      this.clearError("cpf")
    }

    if (!CheckoutValidator.isEmailValid(email)) {
      this.setError("email", "E-mail inválido. Ex: seu@email.com")
      ok = false
    } else {
      this.clearError("email")
    }

    return ok
  }

  validateStep2() {
    let ok = true
    const cep = this.getValue("cep").replace(/\D/g, "")
    const numero = this.getValue("numero").trim()

    if (cep.length !== 8) {
      this.setError("cep", "CEP inválido. Digite 8 dígitos.")
      ok = false
    } else {
      this.clearError("cep")
    }

    if (!numero) {
      this.setError("numero", "Informe o número do endereço.")
      ok = false
    } else {
      this.clearError("numero")
    }

    return ok
  }

  validateStep3() {
    let ok = true

    if (!document.getElementById("aceitarTermos")?.checked) {
      ErrorService.toastWarn("Você precisa aceitar os Termos de Uso para continuar.")
      ok = false
    }

    if (this.currentPay === "card") {
      const cardNum = this.getValue("cardNum").replace(/\D/g, "")
      const cardVal = this.getValue("cardVal").trim()
      const cardCvv = this.getValue("cardCvv").trim()

      if (cardNum.length < 13) {
        this.setError("cardNum", "Número de cartão inválido.")
        ok = false
      } else {
        this.clearError("cardNum")
      }

      if (!/^\d{2}\/\d{2}$/.test(cardVal)) {
        this.setError("cardVal", "Use MM/AA.")
        ok = false
      } else {
        this.clearError("cardVal")
      }

      if (cardCvv.length < 3) {
        this.setError("cardCvv", "CVV inválido.")
        ok = false
      } else {
        this.clearError("cardCvv")
      }
    }

    return ok
  }

  syncConfirmarBtn() {
    const btn = document.getElementById("confirmarBtn")
    if (!btn) return
    const hasItems = CartService.count() > 0
    btn.disabled = !hasItems
    btn.title = hasItems ? "" : "Seu carrinho está vazio."
  }

  fmtBRL(v) {
    return "R$ " + Number(v).toFixed(2).replace(".", ",")
  }

  renderResumo() {
    const cart = CartService.get()
    const subtotal = CartService.total()
    const ufDestino = this.getValue("estado") || "MA"

    const taxResult = TaxEngine.calculateCart(
      cart.map(i => ({ ncm: i.ncm || null, price: i.price, qty: i.qty || 1 })),
      { ufDestino },
    )

    const tax = taxResult.totalImpostos
    const total = subtotal + tax + this.selectedFrete

    const resumoItens = document.getElementById("resumoItens")
    if (resumoItens) {
      resumoItens.innerHTML = cart.map(i => `
        <div style="display:flex;justify-content:space-between;padding:6px 0;border-bottom:1px solid rgba(255,255,255,.04);font-size:12px">
          <span style="color:var(--muted)">${i.name} ×${i.qty || 1}</span>
          <span>${this.fmtBRL(Number(i.price) * (i.qty || 1))}</span>
        </div>`).join("")
    }

    const set = (id, value) => {
      const el = document.getElementById(id)
      if (el) el.textContent = value
    }

    set("rSub", this.fmtBRL(subtotal))
    set("rTax", this.fmtBRL(tax))
    set("rFrete", this.fmtBRL(this.selectedFrete))
    set("rTotal", this.fmtBRL(total))
  }

  goStep(n) {
    const current = [...document.querySelectorAll(".step-panel")]
      .findIndex(p => p.classList.contains("active")) + 1

    if (n > current) {
      if (current === 1 && !this.validateStep1()) return
      if (current === 2 && !this.validateStep2()) return
    }

    document.querySelectorAll(".step-panel").forEach((panel, i) => {
      panel.classList.toggle("active", i + 1 === n)
    })

    document.querySelectorAll(".step").forEach((step, i) => {
      step.classList.toggle("active", i + 1 === n)
      step.classList.toggle("done", i + 1 < n)
    })

    window.scrollTo({ top: 0, behavior: "smooth" })
  }

  bindFreteOptions() {
    document.querySelectorAll("#freteOptions .pay-option").forEach(option => {
      option.onclick = () => {
        document.querySelectorAll("#freteOptions .pay-option").forEach(x => x.classList.remove("selected"))
        option.classList.add("selected")
        this.selectedFrete = Number(option.dataset.frete) || 0
        this.renderResumo()
      }
    })
  }

  bindPaymentOptions() {
    document.querySelectorAll("#payOptions .pay-option").forEach(option => {
      option.onclick = () => {
        document.querySelectorAll("#payOptions .pay-option").forEach(x => x.classList.remove("selected"))
        option.classList.add("selected")
        this.currentPay = option.dataset.pay

        const cardFields = document.getElementById("cardFields")
        if (cardFields) cardFields.style.display = this.currentPay === "card" ? "block" : "none"
      }
    })
  }

  bindMasks() {
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
  }

  bindBuscarCep() {
    const button = document.getElementById("buscarCep")
    if (!button) return

    button.onclick = async () => {
      const cep = this.getValue("cep").replace(/\D/g, "")

      if (cep.length !== 8) {
        this.setError("cep", "Digite 8 dígitos antes de buscar.")
        return
      }

      try {
        const data = await fetch(`https://viacep.com.br/ws/${cep}/json/`).then(r => r.json())
        if (data.erro) {
          this.setError("cep", "CEP não encontrado. Preencha manualmente.")
          return
        }

        const set = (id, value) => {
          const el = document.getElementById(id)
          if (el) el.value = value || ""
        }

        set("endereco", data.logradouro)
        set("bairro", data.bairro)
        set("cidade", data.localidade)
        set("estado", data.uf)

        this.clearError("cep")
        ErrorService.toastSuccess("Endereço preenchido automaticamente.")
      } catch (err) {
        ErrorService.handle(err, "checkout.buscarCep", {
          fallback: "Não foi possível buscar o CEP. Preencha manualmente.",
        })
      }
    }
  }

  bindConfirmarPedido() {
    const btn = document.getElementById("confirmarBtn")
    if (!btn) return

    btn.onclick = async () => {
      const okS1 = this.validateStep1()
      const okS2 = this.validateStep2()
      const okS3 = this.validateStep3()

      if (!okS1) {
        this.goStep(1)
        return
      }
      if (!okS2) {
        this.goStep(2)
        return
      }
      if (!okS3) return

      btn.disabled = true
      btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Processando...'

      try {
        const order = await OrderService.placeOrder(
          {
            nome: this.getValue("nome").trim(),
            email: this.getValue("email").trim(),
            cpf: this.getValue("cpf").trim(),
            telefone: this.getValue("telefone").trim(),
            endereco: this.getValue("endereco").trim(),
            numero: this.getValue("numero").trim(),
            bairro: this.getValue("bairro").trim(),
            cidade: this.getValue("cidade").trim(),
            estado: this.getValue("estado").trim(),
            cep: this.getValue("cep").trim(),
          },
          this.selectedFrete,
          this.currentPay,
        )

        const pedidoNum = document.getElementById("pedidoNum")
        if (pedidoNum) pedidoNum.textContent = "Pedido #" + order.$id.slice(-5).toUpperCase()

        document.getElementById("modal")?.classList.add("show")
        if (this.badge) this.badge.textContent = CartService.count()
      } catch (err) {
        ErrorService.handle(err, "checkout.confirmarPedido", {
          fallback: "Erro ao confirmar pedido. Tente novamente.",
        })
        btn.disabled = false
        btn.innerHTML = '<i class="fas fa-lock"></i> Confirmar Pedido'
      }
    }
  }

  initTimer() {
    const tMin = document.getElementById("tMin")
    const tSec = document.getElementById("tSec")

    setInterval(() => {
      if (this.secs <= 0) return
      this.secs -= 1
      if (tMin) tMin.textContent = String(Math.floor(this.secs / 60)).padStart(2, "0")
      if (tSec) tSec.textContent = String(this.secs % 60).padStart(2, "0")
    }, 1000)
  }

  bindCalcularFrete() {
    const btn = document.getElementById("calcularFreteBtn")
    if (!btn) return

    btn.addEventListener("click", async () => {
      const cep = this.getValue("cep").replace(/\D/g, "")
      const items = CartService.get()

      if (!cep || cep.length !== 8) {
        this.setError("cep", "Informe um CEP válido para calcular o frete.")
        return
      }

      btn.disabled = true
      btn.innerHTML = "<span class=\"spinner\"></span> Calculando…"

      try {
        const pesoTotal = items.reduce((sum, item) => sum + 0.5 * (item.qty || 1), 0)
        const valorTotal = CartService.total()

        this.freteOpcoes = await PaymentService.calcularFrete(cep, pesoTotal, valorTotal)
        this.freteCalculado = true

        const container = document.getElementById("freteOptions")
        if (container) {
          container.innerHTML = this.freteOpcoes.map(op => `
            <div class="pay-option ${op.tipo === "retirada" ? "selected" : ""}" data-frete="${op.valor}" data-id="${op.id}">
              <div class="pay-icon"><i class="fas fa-${op.tipo === "retirada" ? "store" : op.tipo === "sedex" ? "rocket" : "box"}"></i></div>
              <div>
                <div class="pay-name">${op.nome}</div>
                <div class="pay-detail">${op.descricao}${op.prazo > 0 ? ` — ${op.prazo} dia(s) útil(eis)` : ""}</div>
              </div>
              ${op.valor > 0
                ? `<div style="margin-left:auto;font-family:'Bebas Neue',sans-serif;font-size:18px;color:var(--green)">R$ ${op.valor.toFixed(2)}</div>`
                : `<div style="margin-left:auto;font-family:'Bebas Neue',sans-serif;font-size:16px;color:var(--green)">GRÁTIS</div>`
              }
              <div class="pay-check"><i class="fas fa-check"></i></div>
            </div>`).join("")

          container.querySelectorAll(".pay-option").forEach(el => {
            el.addEventListener("click", () => {
              container.querySelectorAll(".pay-option").forEach(x => x.classList.remove("selected"))
              el.classList.add("selected")
              this.selectedFrete = Number(el.dataset.frete) || 0
              this.renderResumo()
            })
          })

          this.selectedFrete = 0
          this.renderResumo()
          ErrorService.toastSuccess("Frete calculado com sucesso!")
        }
      } catch (err) {
        ErrorService.handle(err, "checkout.calcularFrete", {
          fallback: "Não foi possível calcular o frete.",
        })
      } finally {
        btn.disabled = false
        btn.innerHTML = "<i class=\"fas fa-truck\"></i> Recalcular"
      }
    })
  }

  async iniciarPollingPix(paymentId) {
    if (this.pixPollTimer) clearInterval(this.pixPollTimer)

    let tentativas = 0
    const maxTentativas = 60

    this.pixPollTimer = setInterval(async () => {
      tentativas += 1

      try {
        const { paid, status } = await PaymentService.checkPaymentStatus(paymentId)
        const statusEl = document.getElementById("pixStatus")

        if (paid) {
          clearInterval(this.pixPollTimer)
          if (statusEl) {
            statusEl.innerHTML = "<span style=\"color:var(--green)\"><i class=\"fas fa-circle-check\"></i> Pagamento confirmado!</span>"
          }
          document.getElementById("confirmarBtn")?.click()
          return
        }

        if (statusEl && status === "pending") {
          const elapsed = tentativas * 5
          statusEl.textContent = `Aguardando pagamento… (${elapsed}s)`
        }
      } catch {}

      if (tentativas >= maxTentativas) {
        clearInterval(this.pixPollTimer)
        const statusEl = document.getElementById("pixStatus")
        if (statusEl) {
          statusEl.innerHTML = "<span style=\"color:var(--red)\">Tempo esgotado. Gere um novo QR Code.</span>"
        }
      }
    }, 5000)
  }

  bindPixActions() {
    const gerarPixBtn = document.getElementById("gerarPixBtn")
    if (gerarPixBtn) {
      gerarPixBtn.addEventListener("click", async () => {
        const email = this.getValue("email").trim()
        const uf = this.getValue("estado") || "MA"
        const cart = CartService.get()

        const taxResult = TaxEngine.calculateCart(
          cart.map(i => ({ ncm: i.ncm || null, price: i.price, qty: i.qty || 1 })),
          { ufDestino: uf },
        )

        const total = CartService.total() + taxResult.totalImpostos + this.selectedFrete

        if (!email) {
          ErrorService.toastWarn("Informe o e-mail antes de gerar o QR Code.")
          return
        }

        if (total <= 0) {
          ErrorService.toastWarn("Carrinho vazio.")
          return
        }

        gerarPixBtn.disabled = true
        gerarPixBtn.innerHTML = "<span class=\"spinner\"></span> Gerando QR Code…"

        try {
          const orderId = `PRE_${Date.now()}`
          const pix = await PaymentService.createPixPayment({ total, orderId, email })
          this.pixPaymentId = pix.paymentId

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

          await this.iniciarPollingPix(this.pixPaymentId)
          ErrorService.toastSuccess("QR Code gerado! Abra seu app bancário para pagar.")
        } catch (err) {
          ErrorService.handle(err, "checkout.gerarPix", { fallback: "Erro ao gerar QR Code PIX." })
        } finally {
          gerarPixBtn.disabled = false
          gerarPixBtn.innerHTML = "<i class=\"fas fa-qrcode\"></i> Gerar QR Code PIX"
        }
      })
    }

    const copiarPixBtn = document.getElementById("copiarPixBtn")
    if (copiarPixBtn) {
      copiarPixBtn.addEventListener("click", () => {
        const qrText = document.getElementById("qrCodeText")
        if (!qrText?.value) return

        navigator.clipboard?.writeText(qrText.value)
          .then(() => ErrorService.toastSuccess("Código PIX copiado!"))
          .catch(() => {
            qrText.select()
            document.execCommand("copy")
            ErrorService.toastSuccess("Código copiado!")
          })
      })
    }
  }
}


