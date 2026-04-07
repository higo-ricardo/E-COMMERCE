// ─── HIVERCAR · controllers/checkout/CheckoutController.js ───────────────────
// Checkout em 3 steps: Dados → Entrega → Pagamento
// Integração com OrderService, CartService, CouponService, PaymentService

import { OrderService } from "../../js/orderService.js"
import { CartService } from "../../js/cartService.js"
import { CouponService } from "../../js/couponService.js"
import { getCurrentUser } from "../../js/authGuard.js"
import { getMirrorByEmail, ensureMirrorForUser } from "../../js/userService.js"
import { ErrorService } from "../../js/errorService.js"
import { esc, formatBRL } from "../../js/utils.js"
import { CONFIG } from "../../js/config.js"

export class CheckoutController {
  constructor() {
    this.step = 1
    this.data = {
      nome: "",
      cpf: "",
      email: "",
      telefone: "",
      cep: "",
      numero: "",
      endereco: "",
      bairro: "",
      cidade: "",
      estado: "",
      fre葡te: 0,
      modalFrete: "RETIRADA",
      payment: "pix",
    }
    this.coupon = null
    this.discountAmount = 0
    this.timer = null
    this.timerMinutes = 15
    this.timerSeconds = 0
  }

  async init() {
    this.setupDOM()
    await this.checkAuth()
    this.loadCart()
    this.startTimer()
    this.bindEvents()
  }

  async checkAuth() {
    const user = await getCurrentUser()
    if (!user) {
      window.location.href = "login.html?redirect=checkout.html"
      return
    }

    // Busca dados do Mirror e preenche formulário
    try {
      const mirror = await getMirrorByEmail(user.email) || await ensureMirrorForUser(user)
      if (mirror) {
        // Step 1 - Dados Pessoais
        if (mirror.name) this.dom.nome.value = mirror.name
        if (mirror.cpf) this.dom.cpf.value = this.maskCPF(String(mirror.cpf).padStart(11, "0"))
        if (mirror.email) this.dom.email.value = mirror.email
        if (mirror.mobile) this.dom.telefone.value = this.maskPhone(String(mirror.mobile))

        // Step 2 - Endereço
        if (mirror.cep) this.dom.cep.value = this.maskCEP(String(mirror.cep).padStart(8, "0"))
        if (mirror.address) this.dom.endereco.value = mirror.address
        if (mirror.number) this.dom.numero.value = String(mirror.number)
        if (mirror.district) this.dom.bairro.value = mirror.district
        if (mirror.city) this.dom.cidade.value = mirror.city
        if (mirror.state) this.dom.estado.value = mirror.state
      }
    } catch (err) {
      console.warn("[Checkout] Não foi possível carregar dados do usuário:", err?.message || err)
    }
  }

  setupDOM() {
    this.dom = {
      step1: document.getElementById("step1"),
      step2: document.getElementById("step2"),
      step3: document.getElementById("step3"),
      s1: document.getElementById("s1"),
      s2: document.getElementById("s2"),
      s3: document.getElementById("s3"),
      nome: document.getElementById("nome"),
      cpf: document.getElementById("cpf"),
      email: document.getElementById("email"),
      telefone: document.getElementById("telefone"),
      cep: document.getElementById("cep"),
      numero: document.getElementById("numero"),
      endereco: document.getElementById("endereco"),
      bairro: document.getElementById("bairro"),
      cidade: document.getElementById("cidade"),
      estado: document.getElementById("estado"),
      buscarCep: document.getElementById("buscarCep"),
      freightOptions: document.getElementById("freteOptions"),
      payOptions: document.getElementById("payOptions"),
      cardFields: document.getElementById("cardFields"),
      aceitarTermos: document.getElementById("aceitarTermos"),
      confirmarBtn: document.getElementById("confirmarBtn"),
      resumoItens: document.getElementById("resumoItens"),
      rSub: document.getElementById("rSub"),
      rTax: document.getElementById("rTax"),
      rFrete: document.getElementById("rFrete"),
      rDiscountRow: document.getElementById("rDiscountRow"),
      rDiscount: document.getElementById("rDiscount"),
      rTotal: document.getElementById("rTotal"),
      cupomInput: document.getElementById("cupomInput"),
      cupomBtn: document.getElementById("cupomBtn"),
      cupomMsg: document.getElementById("cupomMsg"),
      modal: document.getElementById("modal"),
      pedidoNum: document.getElementById("pedidoNum"),
      modalTitle: document.getElementById("modalTitle"),
      tMin: document.getElementById("tMin"),
      tSec: document.getElementById("tSec"),
    }
  }

  loadCart() {
    const cart = CartService.get()
    if (!cart || cart.length === 0) {
      this.dom.resumoItens.innerHTML = '<div class="empty-state">Carrinho vazio</div>'
      this.dom.confirmarBtn.disabled = true
      return
    }

    const subtotal = CartService.total()
    const totalWithDiscount = CartService.totalWithDiscount()
    const discount = subtotal - totalWithDiscount

    this.dom.resumoItens.innerHTML = cart.slice(0, 5).map(item => `
      <div style="display:flex;align-items:center;gap:10px;padding:8px 0;border-bottom:1px solid var(--border)">
        <div style="width:40px;height:40px;background:var(--dark);display:flex;align-items:center;justify-content:center">
          <i class="fas fa-box" style="color:var(--muted);font-size:14px"></i>
        </div>
        <div style="flex:1">
          <div style="font-size:12px;font-weight:600">${esc(item.name || "Produto")}</div>
          <div style="font-size:11px;color:var(--muted)">Qtd: ${item.qty || 1}</div>
        </div>
        <div style="font-size:12px;color:var(--green)">${formatBRL(Number(item.price) * (item.qty || 1))}</div>
      </div>
    `).join("") + (cart.length > 5 ? `<div style="font-size:11px;color:var(--muted);padding:8px 0">+${cart.length - 5} itens</div>` : "")

    const freight = this.data.frete || 0
    const total = totalWithDiscount + freight

    this.dom.rSub.textContent = formatBRL(subtotal)
    this.dom.rTax.textContent = "R$ 0,00"
    this.dom.rFrete.textContent = freight === 0 ? "Grátis" : formatBRL(freight)
    
    if (discount > 0) {
      this.dom.rDiscountRow.style.display = "flex"
      this.dom.rDiscount.textContent = "-" + formatBRL(discount)
    } else {
      this.dom.rDiscountRow.style.display = "none"
    }

    this.dom.rTotal.textContent = formatBRL(total)
  }

  startTimer() {
    this.timerMinutes = 15
    this.timerSeconds = 0
    
    if (this.timer) clearInterval(this.timer)
    
    this.timer = setInterval(() => {
      if (this.timerSeconds === 0) {
        if (this.timerMinutes === 0) {
          clearInterval(this.timer)
          ErrorService.toastWarn("Tempo expirado! O carrinho será limpo.", 5000)
          return
        }
        this.timerMinutes--
        this.timerSeconds = 59
      } else {
        this.timerSeconds--
      }
      
      this.dom.tMin.textContent = String(this.timerMinutes).padStart(2, "0")
      this.dom.tSec.textContent = String(this.timerSeconds).padStart(2, "0")
    }, 1000)
  }

  bindEvents() {
    window.goStep = (step) => this.navigateToStep(step)

    this.dom.buscarCep?.addEventListener("click", () => this.buscarCep())
    this.dom.cupomBtn?.addEventListener("click", () => this.applyCoupon())
    this.dom.confirmarBtn?.addEventListener("click", () => this.confirmOrder())

    this.dom.freightOptions?.addEventListener("click", (e) => {
      const option = e.target.closest(".pay-option")
      if (!option) return
      
      this.dom.freightOptions.querySelectorAll(".pay-option").forEach(o => o.classList.remove("selected"))
      option.classList.add("selected")
      
      this.data.frete = Number(option.dataset.frete) || 0
      this.data.modalFrete = option.dataset.modalfrete || "RETIRADA"
      this.updateTotals()
    })

    this.dom.payOptions?.addEventListener("click", (e) => {
      const option = e.target.closest(".pay-option")
      if (!option) return
      
      this.dom.payOptions.querySelectorAll(".pay-option").forEach(o => o.classList.remove("selected"))
      option.classList.add("selected")
      
      this.data.payment = option.dataset.pay || "pix"
      this.dom.cardFields.style.display = this.data.payment === "card" ? "block" : "none"
    })

    this.dom.cep?.addEventListener("input", (e) => {
      e.target.value = this.maskCEP(e.target.value)
    })

    this.dom.cep?.addEventListener("blur", (e) => {
      const cep = e.target.value.replace(/\D/g, "")
      if (cep.length === 8 && !this.dom.endereco.value) {
        this.buscarCep()
      }
    })

    this.dom.cpf?.addEventListener("input", (e) => {
      e.target.value = this.maskCPF(e.target.value)
    })

    this.dom.telefone?.addEventListener("input", (e) => {
      e.target.value = this.maskPhone(e.target.value)
    })
  }

  navigateToStep(step) {
    if (step === 2 && !this.validateStep1()) return
    if (step === 3 && !this.validateStep2()) return

    this.step = step
    this.dom.step1.classList.toggle("active", step === 1)
    this.dom.step2.classList.toggle("active", step === 2)
    this.dom.step3.classList.toggle("active", step === 3)

    this.dom.s1.classList.toggle("active", step === 1)
    this.dom.s2.classList.toggle("active", step === 2)
    this.dom.s3.classList.toggle("active", step === 3)

    if (step > 1) {
      this.dom.s1.classList.add("done")
    }
    if (step > 2) {
      this.dom.s2.classList.add("done")
    }
  }

  validateStep1() {
    const nome = this.dom.nome.value.trim()
    const cpf = this.dom.cpf.value.trim()
    const email = this.dom.email.value.trim()

    if (!nome) {
      ErrorService.fieldError("nome", "Preencha seu nome completo")
      this.dom.nome.focus()
      return false
    }

    if (!cpf || cpf.length < 11) {
      ErrorService.fieldError("cpf", "Preencha um CPF válido")
      this.dom.cpf.focus()
      return false
    }

    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email)) {
      ErrorService.fieldError("email", "Preencha um e-mail válido")
      this.dom.email.focus()
      return false
    }

    this.data.nome = nome
    this.data.cpf = cpf.replace(/\D/g, "")
    this.data.email = email
    this.data.telefone = this.dom.telefone.value.trim()

    return true
  }

  validateStep2() {
    const cep = this.dom.cep.value.trim()
    const numero = this.dom.numero.value.trim()

    if (!cep || cep.length < 8) {
      ErrorService.fieldError("cep", "Preencha um CEP válido")
      this.dom.cep.focus()
      return false
    }

    if (!numero) {
      ErrorService.fieldError("numero", "Preencha o número do endereço")
      this.dom.numero.focus()
      return false
    }

    this.data.cep = cep.replace(/\D/g, "")
    this.data.numero = numero
    this.data.endereco = this.dom.endereco.value.trim()
    this.data.bairro = this.dom.bairro.value.trim()
    this.data.cidade = this.dom.cidade.value.trim()
    this.data.estado = this.dom.estado.value

    return true
  }

  async buscarCep() {
    const cep = this.dom.cep.value.replace(/\D/g, "")
    if (cep.length !== 8) {
      ErrorService.handle(new Error("CEP inválido: deve ter 8 dígitos"), "CheckoutController.buscarCep")
      return
    }

    this.dom.buscarCep.disabled = true
    this.dom.buscarCep.innerHTML = '<i class="fas fa-spinner fa-spin"></i>'

    try {
      const resp = await fetch(`https://viacep.com.br/ws/${cep}/json/`)
      const data = await resp.json()

      if (data.erro) {
        ErrorService.handle(new Error("CEP não encontrado na base dos Correios"), "CheckoutController.buscarCep")
        return
      }

      this.dom.endereco.value = data.logradouro || ""
      this.dom.bairro.value = data.bairro || ""
      this.dom.cidade.value = data.localidade || ""
      this.dom.estado.value = data.uf || ""

      ErrorService.toastSuccess("Endereço encontrado!", 3000)
    } catch (err) {
      ErrorService.handle(err, "CheckoutController.buscarCep")
    } finally {
      this.dom.buscarCep.disabled = false
      this.dom.buscarCep.innerHTML = '<i class="fas fa-magnifying-glass"></i>'
    }
  }

  async applyCoupon() {
    const code = this.dom.cupomInput.value.trim().toUpperCase()
    if (!code) {
      ErrorService.handle(new Error("Digite um código de cupom"), "CheckoutController.applyCoupon")
      return
    }

    this.dom.cupomBtn.disabled = true
    this.dom.cupomBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i>'

    try {
      const cart = CartService.get()
      const subtotal = CartService.total()

      const result = await CouponService.apply(code, { subtotal, items: cart, cpf: this.data.cpf })

      if (!result.ok) {
        this.dom.cupomMsg.innerHTML = `<span style="color:var(--red)">${esc(result.message || "Cupom inválido")}</span>`
        ErrorService.handle(new Error(result.message || "Cupom inválido"), "CheckoutController.applyCoupon", { silent: true })
        return
      }

      this.coupon = result.coupon
      this.discountAmount = result.discount
      CartService.setCoupon({ code: result.coupon.code, discount: result.discount })

      this.dom.cupomMsg.innerHTML = `<span style="color:var(--green)">Cupom ${result.coupon.code} aplicado! (-${formatBRL(result.discount)})</span>`
      this.loadCart()
      ErrorService.toastSuccess("Cupom aplicado!", 3000)
    } catch (err) {
      this.dom.cupomMsg.innerHTML = `<span style="color:var(--red)">Erro ao aplicar cupom</span>`
      ErrorService.handle(err, "CheckoutController.applyCoupon")
    } finally {
      this.dom.cupomBtn.disabled = false
      this.dom.cupomBtn.innerHTML = "Aplicar"
    }
  }

  updateTotals() {
    this.loadCart()
  }

  async confirmOrder() {
    if (!this.dom.aceitarTermos.checked) {
      ErrorService.handle(new Error("Aceite os termos para continuar"), "CheckoutController.confirmOrder")
      return
    }

    const cart = CartService.get()
    if (!cart || cart.length === 0) {
      ErrorService.handle(new Error("Carrinho vazio"), "CheckoutController.confirmOrder")
      return
    }

    this.dom.confirmarBtn.disabled = true
    this.dom.confirmarBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Processando...'

    try {
      const customerData = {
        nome: this.data.nome,
        name: this.data.nome,
        email: this.data.email,
        emailAddress: this.data.email,
        telefone: this.data.telefone,
        mobile: this.data.telefone,
        endereco: this.data.endereco,
        address: this.data.endereco,
      }

      const order = await OrderService.placeOrder(
        customerData,
        this.data.frete,
        this.data.payment,
        this.data.modalFrete,
        this.coupon?.code || null,
        this.discountAmount
      )

      this.showSuccessModal(order)
      CartService.clear()

    } catch (err) {
      console.error("[Checkout] Erro ao criar pedido:", err)
      ErrorService.handle(err, "CheckoutController.confirmOrder")
      this.dom.confirmarBtn.disabled = false
      this.dom.confirmarBtn.innerHTML = '<i class="fas fa-lock"></i> Confirmar Pedido'
    }
  }

  showSuccessModal(order) {
    const orderNumber = order?.number || "00000"
    this.dom.pedidoNum.textContent = `Pedido #${orderNumber}`
    this.dom.modal.classList.add("show")
  }

  maskCEP(v) {
    v = v.replace(/\D/g, "").slice(0, 8)
    if (v.length > 5) v = v.replace(/(\d{5})(\d)/, "$1-$2")
    return v
  }

  maskCPF(v) {
    v = v.replace(/\D/g, "").slice(0, 11)
    if (v.length > 9) v = v.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, "$1.$2.$3-$4")
    else if (v.length > 6) v = v.replace(/(\d{3})(\d{3})(\d)/, "$1.$2.$3")
    else if (v.length > 3) v = v.replace(/(\d{3})(\d)/, "$1.$2")
    return v
  }

  maskPhone(v) {
    v = v.replace(/\D/g, "").slice(0, 11)
    if (v.length > 8) v = v.replace(/(\d{2})(\d{5})(\d)/, "($1) $2-$3")
    else if (v.length > 6) v = v.replace(/(\d{2})(\d{4})(\d)/, "($1) $2-$3")
    else if (v.length > 2) v = v.replace(/(\d{2})(\d)/, "($1) $2")
    return v
  }
}