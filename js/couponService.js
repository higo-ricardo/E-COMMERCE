// ─── HIVERCAR · couponService.js ──────────────────────────────────────────────
// Service responsável por validação, aplicação e contadores de cupons.
// Integração com Appwrite (collection COUPONS + COUPON_USAGE).

import { CouponRepository } from "./repositories.js"
import { CouponUsageRepository } from "./repositories.js"
import { CONFIG } from "./config.js"

const REASON_MESSAGES = {
  coupon_not_found: "Cupom não encontrado.",
  coupon_inactive: "Cupom inativo. Peça outro código ao administrador.",
  coupon_expired: "Cupom expirado. Escolha outro válido.",
  coupon_usage_limit: "Limite de uso do cupom atingido.",
  coupon_min_order: "Pedido não atingiu o valor mínimo para aplicar este cupom.",
  coupon_cpf_mismatch: "Este cupom é exclusivo para outro CPF.",
  coupon_cpf_limit: "Limite de uso por CPF atingido para este cupom.",
  default: "Cupom inválido ou não aplicável.",
}

const reasonMessage = (reason) => REASON_MESSAGES[reason] || REASON_MESSAGES.default

export const CouponService = {
  /**
   * Cria um cupom no Appwrite.
   * @param {Object} payload - {code, type, value, minOrderValue, maxDiscount, expirationDate, usageLimit, cpf, isActive, cpfLimit}
   */
  async create(payload) {
    const { code, type, value } = payload || {}
    if (!code || !type || value == null) {
      throw new Error("code, type e value são obrigatórios")
    }
    if (!["percentage", "fixed"].includes(type)) {
      throw new Error("type deve ser 'percentage' ou 'fixed'")
    }
    const body = {
      ...payload,
      maxDiscount: payload.maxDiscount ?? null,
      minOrderValue: payload.minOrderValue ?? 50,
      usageLimit: payload.usageLimit ?? null,
      cpfLimit: payload.cpfLimit ?? null,
      isActive: payload.isActive ?? true,
      timesUsed: 0,
    }
    return CouponRepository.create(body)
  },

  /**
   * Valida se o cupom está apto a ser usado no contexto informado.
   * @param {string} code
   * @param {Object} context - {cartTotal, cpf}
   * @returns {{ok: boolean, reason?: string, message?: string, coupon?: Object}}
   */
  async validate(code, context = {}) {
    const coupon = await CouponRepository.findByCode(code)
    if (!coupon) return { ok: false, reason: "coupon_not_found", message: reasonMessage("coupon_not_found") }
    if (!coupon.isActive) return { ok: false, reason: "coupon_inactive", message: reasonMessage("coupon_inactive"), coupon }

    const now = new Date()
    if (coupon.expirationDate) {
      const exp = new Date(coupon.expirationDate)
      if (isFinite(exp) && exp < now) {
        return { ok: false, reason: "coupon_expired", message: reasonMessage("coupon_expired"), coupon }
      }
    }

    if (coupon.usageLimit != null && coupon.timesUsed >= coupon.usageLimit) {
      return { ok: false, reason: "coupon_usage_limit", message: reasonMessage("coupon_usage_limit"), coupon }
    }

    if (coupon.minOrderValue != null && context.cartTotal != null) {
      if (context.cartTotal < coupon.minOrderValue) {
        return { ok: false, reason: "coupon_min_order", message: reasonMessage("coupon_min_order"), coupon }
      }
    }

    if (coupon.cpf) {
      // Cupom restrito a um CPF específico
      if (!context.cpf || context.cpf !== coupon.cpf) {
        return { ok: false, reason: "coupon_cpf_mismatch", message: reasonMessage("coupon_cpf_mismatch"), coupon }
      }
    }

    // Limite por CPF (quando definido) — aplica tanto para cupom restrito a CPF quanto para cupom geral com cpfLimit
    if (coupon.cpfLimit && context.cpf) {
      const usage = await CouponUsageRepository.findByCodeAndCpf(coupon.code, context.cpf)
      if (usage && usage.uses >= coupon.cpfLimit) {
        return { ok: false, reason: "coupon_cpf_limit", message: reasonMessage("coupon_cpf_limit"), coupon }
      }
    }

    return { ok: true, coupon }
  },

  /**
   * Aplica o cupom e retorna novo subtotal + detalhes.
   * @param {string} code
   * @param {Object} cart - {subtotal, items}
   * @returns {{ok: boolean, subtotal: number, discount: number, reason?: string, coupon?: Object}}
   */
  async apply(code, cart) {
    const subtotal = cart?.subtotal ?? 0
    const validation = await this.validate(code, { cartTotal: subtotal, cpf: cart?.cpf })
    if (!validation.ok) {
      return { ok: false, subtotal, discount: 0, reason: validation.reason, message: validation.message, coupon: validation.coupon }
    }

    const coupon = validation.coupon
    let discount = 0
    if (coupon.type === "percentage" || coupon.type === "percentual") {
      discount = (subtotal * (coupon.value / 100))
    } else {
      discount = coupon.value
    }

    // Tratar cupom com desconto zero
    if (discount <= 0) {
      return { ok: false, subtotal, discount: 0, reason: "invalid_discount", message: "Cupom sem valor de desconto." }
    }

    if (coupon.maxDiscount != null) {
      discount = Math.min(discount, coupon.maxDiscount)
    }

    // Limite de desconto configurável (default: 50% do pedido)
    const maxDiscountPercent = CONFIG.COUPON?.MAX_DISCOUNT_PERCENT ?? 0.5
    const maxDiscountCap = subtotal * maxDiscountPercent
    discount = Math.min(discount, maxDiscountCap)

    const finalSubtotal = Math.max(0, subtotal - discount)

    // Atualiza contadores (global e por CPF se aplicável)
    try {
      await CouponRepository.incrementUsage(code)
    } catch (err) {
      return {
        ok: false,
        subtotal,
        discount: 0,
        reason: "coupon_usage_limit",
        message: err.message || "Cupom atingiu limite de uso.",
        coupon,
      }
    }

    // Registra uso na collection coupon_usage (sempre que há CPF)
    if (cart?.cpf) {
      try {
        await CouponUsageRepository.increment(code, cart.cpf, coupon.$createdAt)
      } catch (err) {
        console.warn("[CouponService] Falha ao registrar uso por CPF:", err?.message || err)
      }
    }

    return {
      ok: true,
      subtotal: finalSubtotal,
      discount,
      message: undefined,
      coupon,
    }
  },

  /**
   * Marca uso do cupom (global + por usuário).
   * @param {string} code
   * @param {string|number} userId
   */
  async markUsed(code) {
    return CouponRepository.incrementUsage(code)
  },

  list() {
    return CouponRepository.list()
  },

  reset() {
    CouponRepository.reset()
  }
}

export { reasonMessage }
