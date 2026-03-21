// ─── HIVERCAR · orderService.js ──────────────────────────────────────────────
// Lógica de pedido: validação, cálculo de totais, persistência. Zero UI.
// Camada: Domain / Service.

import { CartService }     from "./cartService.js"
import { OrderRepository } from "./orderRepository.js"
import { CONFIG }          from "./config.js"

export const OrderService = {

  async placeOrder(customerData, frete = 0, payment = "pix") {
    const cart = CartService.get()
    if (!cart.length) throw new Error("Carrinho vazio")

    const subtotal = cart.reduce((s, i) => s + Number(i.price) * (i.qty || 1), 0)
    const taxes    = +(subtotal * CONFIG.TAX_RATE).toFixed(2)
    const total    = +(subtotal + taxes + frete).toFixed(2)

    const order = {
      ...customerData,
      items:     JSON.stringify(cart),
      subtotal:  +subtotal.toFixed(2),
      taxes,
      frete:     +frete,
      total,
      payment,
      status:    "novo",
      createdAt: new Date().toISOString(),
    }

    const saved = await OrderRepository.create(order)
    CartService.clear()
    return saved
  },
}
