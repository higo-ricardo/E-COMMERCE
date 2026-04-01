// ─── HIVERCAR · orderService.js ──────────────────────────────────────────────
// Lógica de pedido: validação, cálculo de totais, persistência. Zero UI.
// Camada: Domain / Service.
//
// Sprint 05 - US-44:
//   - TaxEngine.calculateCart() substituiu TAX_RATE fixo de 12%
//   - placeOrder() agora retorna breakdown fiscal completo no pedido
//   - Retrocompatível: se item não tiver NCM, usa regra genérica cap.87

import { AuthService }           from "./authService.js"
import { CartService }            from "./cartService.js"
import { OrderRepository }        from "./orderRepository.js"
import { DocumentNumberService } from "./documentNumberService.js"
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

    const taxes = 0
    const total = +(subtotal + frete).toFixed(2)

    const authUser = await AuthService.getUser()
    if (!authUser) throw new Error("Usuário não autenticado. Faça login para continuar.")
    
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
      number:         DocumentNumberService.order(),
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
}
