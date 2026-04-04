// ─── HIVERCAR · orderService.js ──────────────────────────────────────────────
// Lógica de pedido: validação, cálculo de totais, persistência. Zero UI.
// Camada: Domain / Service.
//
// Sprint 05 - US-44:
//   - TaxEngine.calculateCart() substituiu TAX_RATE fixo de 12%
//   - placeOrder() agora retorna breakdown fiscal completo no pedido
//   - Retrocompatível: se item não tiver NCM, usa regra genérica cap.87
//
// Sprint 07 - US-64, US-65, US-66, US-87:
//   + createManualOrder()    → criar pedido manualmente (vendedor)
//   + listOrders()           → listar todos os pedidos com filtros
//   + getOrderDetails()      → ver detalhes completos de um pedido
//   + generateOrderNumber()  → gerar número único de pedido

import { AuthService }           from "./authService.js"
import { CartService }            from "./cartService.js"
import { OrderRepository, ProductRepository } from "./repositories.js"
import { docNumService } from "./docNumService.js"
import { CONFIG }                 from "./config.js"

export const OrderService = {

  async placeOrder(customerData, frete = 0, payment = "pix", modalFrete = "RETIRADA", couponCode = null, discountAmount = 0) {
    const cart = CartService.get()
    if (!cart.length) throw new Error("Carrinho vazio")

    const subtotal = cart.reduce((s, i) => {
      const price = Number(i.price)
      if (Number.isNaN(price)) throw new Error(`Valor do item inválido: ${i.name || i.$id || 'desconhecido'}`)
      return s + price * (i.qty || 1)
    }, 0)

    // Usa totalWithDiscount do CartService para consistência
    const totalWithDiscount = CartService.totalWithDiscount()
    const taxes = 0
    const total = Math.max(0, +(totalWithDiscount + frete).toFixed(2))

    const authUser = await AuthService.getUser()
    if (!authUser || !authUser.$id) throw new Error("Usuário não autenticado. Faça login para continuar.")

    const customerName = (customerData.nome || customerData.name)?.trim() || authUser?.name || authUser?.email || "CONSUMIDOR FINAL"

    const paymentOption = (payment || "dinheiro").toString().trim().toLowerCase()
    const paymentMap = {
      pix: "PIX",
      boleto: "BOLETO",
      card: "CARTÃO DE CRÉDITO",
      crediario: "CREDIÁRIO",
      dinheiro: "DINHEIRO",
      ted: "TED",
      debito: "CARTÃO DE DÉBITO",
      fiado: "FIADO",
    }

    const order = {
      number:         docNumService.order(),
      user:           customerName,
      email:          (customerData.email || customerData.emailAddress || "").trim(),
      mobile:         (customerData.telefone || customerData.mobile || "").trim() || null,
      address:        (customerData.endereco || customerData.address || "").trim() || null,
      items:          JSON.stringify(cart),
      subtotal:       +subtotal.toFixed(2),
      taxes,
      frete:          +frete,
      discountAmount: +discountAmount,
      total,
      payment:        paymentMap[paymentOption] || "DINHEIRO",
      status:         "NOVO",
      modalFrete:     (modalFrete || "RETIRADA").toString().toUpperCase(),
      couponCode:     couponCode || null,
    }

    const saved = await OrderRepository.create(order, authUser.$id)
    CartService.clear()
    return saved
  },

  // ─── SPRINT 07 — US-64: Criar Pedido Manualmente ───────────────────────────
  /**
   * Cria um pedido manualmente (vendedor registra venda offline).
   * @param {Object} orderData - Dados do pedido
   * @param {string} orderData.customerName - Nome do cliente
   * @param {string} orderData.customerEmail - E-mail do cliente
   * @param {string} orderData.customerMobile - Telefone do cliente
   * @param {string} orderData.customerAddress - Endereço do cliente
   * @param {Array}  orderData.items - Array de itens [{name, price, qty}]
   * @param {string} orderData.payment - Forma de pagamento
   * @param {string} orderData.modalFrete - Modalidade de frete
   * @param {number} orderData.frete - Valor do frete
   * @param {string} [orderData.couponCode] - Cupom de desconto (opcional)
   * @param {number} [orderData.discountAmount] - Valor do desconto (opcional)
   * @returns {Promise<Object>} Pedido criado
   */
  async createManualOrder(orderData, userId) {
    const { items } = orderData
    if (!items || !Array.isArray(items) || items.length === 0) {
      throw new Error("Pedido deve ter pelo menos um item")
    }

    // Valida e calcula subtotal
    const subtotal = items.reduce((s, i) => {
      const price = Number(i.price)
      const qty = Number(i.qty || 1)
      if (Number.isNaN(price)) throw new Error(`Valor do item inválido: ${i.name || 'desconhecido'}`)
      return s + price * qty
    }, 0)

    const discountAmount = Math.max(0, Number(orderData.discountAmount || 0))
    const frete = Math.max(0, Number(orderData.frete || 0))
    const total = Math.max(0, +(subtotal - discountAmount + frete).toFixed(2))

    const paymentOption = (orderData.payment || "dinheiro").toString().trim().toLowerCase()
    const paymentMap = {
      pix: "PIX",
      boleto: "BOLETO",
      card: "CARTÃO DE CRÉDITO",
      crediario: "CREDIÁRIO",
      dinheiro: "DINHEIRO",
      ted: "TED",
      debito: "CARTÃO DE DÉBITO",
      fiado: "FIADO",
    }

    const order = {
      number:         docNumService.order(),
      user:           (orderData.customerName || "CONSUMIDOR FINAL").trim(),
      email:          (orderData.customerEmail || "").trim(),
      mobile:         (orderData.customerMobile || "").trim() || null,
      address:        (orderData.customerAddress || "").trim() || null,
      items:          JSON.stringify(items),
      subtotal:       +subtotal.toFixed(2),
      taxes:          0,
      frete:          +frete,
      discountAmount: +discountAmount,
      total,
      payment:        paymentMap[paymentOption] || "DINHEIRO",
      status:         "NOVO",
      modalFrete:     (orderData.modalFrete || "RETIRADA").toString().toUpperCase(),
      couponCode:     orderData.couponCode || null,
      manualOrder:    true,  // flag para identificar pedidos manuais
    }

    return OrderRepository.create(order, userId)
  },

  // ─── SPRINT 07 — US-65: Visualizar Todos os Pedidos ────────────────────────
  /**
   * Lista pedidos com filtros e paginação.
   * @param {Object} filters - Filtros opcionais
   * @param {string} [filters.status] - Filtrar por status
   * @param {string} [filters.dateFrom] - Data inicial (YYYY-MM-DD)
   * @param {string} [filters.dateTo] - Data final (YYYY-MM-DD)
   * @param {string} [filters.search] - Busca por nome/cliente
   * @param {number} [filters.limit] - Limite de registros (padrão: 100)
   * @param {number} [filters.offset] - Offset para paginação (padrão: 0)
   * @returns {Promise<{documents: Array, total: number}>}
   */
  async listOrders(filters = {}) {
    return OrderRepository.list(filters)
  },

  // ─── SPRINT 07 — US-66: Ver Detalhes de um Pedido ──────────────────────────
  /**
   * Retorna detalhes completos de um pedido.
   * @param {string} orderId - ID do pedido
   * @returns {Promise<Object>} Pedido com detalhes
   */
  async getOrderDetails(orderId) {
    const order = await OrderRepository.getById(orderId)
    if (!order) throw new Error("Pedido não encontrado")

    // Parse dos itens
    let items = []
    try {
      items = typeof order.items === 'string' ? JSON.parse(order.items) : order.items
    } catch (e) {
      items = []
    }

    // Busca histórico do pedido (se existir)
    let history = []
    try {
      const { OrderHistoryService } = await import('./orderHistoryService.js')
      history = await OrderHistoryService.getHistoryByOrder(orderId)
    } catch (e) {
      // orderHistoryService pode não existir ainda
    }

    return {
      ...order,
      items,
      history,
    }
  },

  // ─── SPRINT 07 — US-87: Gerar Números Únicos de Pedido ─────────────────────
  /**
   * Gera um número único de pedido (wrapper para docNumService).
   * @returns {string} Número do pedido
   */
  generateOrderNumber() {
    return docNumService.order()
  },

  // ─── SPRINT 07 — US-85: CHECKOUT INTELIGENTE ───────────────────────────────
  /**
   * Verifica o estado do carrinho e autenticação para determinar o fluxo ideal.
   * @returns {Promise<{canCheckout: boolean, step: number, redirect?: string, message?: string}>}
   *   step: 1 (dados), 2 (entrega), 3 (pagamento)
   */
  async getSmartCheckoutState() {
    const cart = CartService.get()
    
    // Carrinho vazio → não pode fazer checkout
    if (!cart || cart.length === 0) {
      return {
        canCheckout: false,
        step: 0,
        redirect: "loja.html",
        message: "Seu carrinho está vazio.",
      }
    }

    const user = await AuthService.getUser()
    
    // Usuário não autenticado → login primeiro
    if (!user) {
      return {
        canCheckout: true,
        step: 0,
        redirect: "login.html?redirect=checkout.html",
        message: "Faça login para continuar.",
      }
    }

    // Usuário autenticado → verifica se tem dados completos
    try {
      const { getMirrorByEmail } = await import('./userService.js')
      const mirror = await getMirrorByEmail(user.email)
      
      // Verifica dados do step 1
      const hasStep1 = mirror?.name && mirror?.cpf
      // Verifica dados do step 2
      const hasStep2 = mirror?.cep && mirror?.address && mirror?.number
      
      if (!hasStep1) {
        return { canCheckout: true, step: 1, message: "Complete seus dados pessoais." }
      }
      
      if (!hasStep2) {
        return { canCheckout: true, step: 2, message: "Complete seu endereço." }
      }
      
      // Todos os dados completos → vai direto para pagamento
      return { canCheckout: true, step: 3, message: "Escolha a forma de pagamento." }
    } catch (e) {
      // Erro ao buscar mirror → começa do step 1
      return { canCheckout: true, step: 1, message: "Complete seus dados." }
    }
  },

  /**
   * Valida se todos os itens do carrinho estão disponíveis e com preços atualizados.
   * @returns {Promise<{valid: boolean, validations: Array, message?: string}>}
   */
  async validateCart() {
    const cart = CartService.get()
    if (!cart || cart.length === 0) {
      return { valid: false, validations: [], message: "Carrinho vazio" }
    }

    const validations = []
    let allValid = true

    for (const item of cart) {
      try {
        const product = await ProductRepository.getById(item.$id)
        const inStock = (product?.stock ?? 0) >= (item.qty ?? 1)
        const priceMatch = Number(product?.price) === Number(item.price)

        validations.push({
          id: item.$id,
          valid: inStock && priceMatch,
          inStock,
          priceMatch,
        })

        if (!inStock || !priceMatch) allValid = false
      } catch {
        validations.push({ id: item.$id, valid: false, error: "Produto não encontrado" })
        allValid = false
      }
    }

    return {
      valid: allValid,
      validations,
      message: allValid ? undefined : "Alguns itens do carrinho estão indisponíveis ou com preço alterado.",
    }
  },
}
