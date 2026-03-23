// ─── HIVERCAR · orderService.js ──────────────────────────────────────────────
// Lógica de pedido: validação, cálculo de totais, persistência. Zero UI.
// Camada: Domain / Service.
//
// Sprint 05 — US-44:
//   - TaxEngine.calculateCart() substituiu TAX_RATE fixo de 12%
//   - placeOrder() agora retorna breakdown fiscal completo no pedido
//   - Retrocompatível: se item não tiver NCM, usa regra genérica cap.87

import { CartService }     from "./cartService.js"
import { OrderRepository } from "./orderRepository.js"
import { CONFIG }          from "./config.js"
import { TaxEngine }       from "./taxEngine.js"

export const OrderService = {

  async placeOrder(customerData, frete = 0, payment = "pix") {
    const cart = CartService.get()
    if (!cart.length) throw new Error("Carrinho vazio")

    const subtotal = cart.reduce((s, i) => s + Number(i.price) * (i.qty || 1), 0)

    // US-44: calcular impostos reais via TaxEngine
    const ufDestino = customerData.estado || CONFIG.FISCAL.UF_ORIGEM
    const taxResult = TaxEngine.calculateCart(
      cart.map(i => ({ ncm: i.ncm || null, price: i.price, qty: i.qty || 1 })),
      { ufDestino, isB2B: false, regime: CONFIG.FISCAL.REGIME }
    )

    const taxes = taxResult.totalImpostos
    const total = +(subtotal + taxes + frete).toFixed(2)

    const order = {
      ...customerData,
      items:          JSON.stringify(cart),
      subtotal:       +subtotal.toFixed(2),
      taxes,
      taxBreakdown:   JSON.stringify(taxResult.resumoImpostos), // US-44: breakdown fiscal
      taxRate:        taxResult.aliquotaEfetiva,                // US-44: alíquota real
      frete:          +frete,
      total,
      payment,
      status:         "novo",
      nfeStatus:      "pendente",   // US-43: pendente | emitida | cancelada | erro
      createdAt:      new Date().toISOString(),
    }

    const saved = await OrderRepository.create(order)
    CartService.clear()
    return saved
  },
}
