// @vitest-environment jsdom
import { describe, it, expect, beforeEach, vi } from "vitest"

// In-memory mocks for Appwrite repositories
const coupons = new Map()
const usage = new Map() // key: `${code}|${cpf}` -> {uses,lastUsedAt}

vi.mock("../js/couponRepository.js", () => ({
  CouponRepository: {
    async create(payload) {
      const doc = {
        $id: `c_${coupons.size + 1}`,
        timesUsed: 0,
        ...payload,
        code: payload.code.toUpperCase(),
      }
      coupons.set(doc.code, doc)
      return doc
    },
    async findByCode(code) {
      return coupons.get(String(code).toUpperCase()) || null
    },
    async list() {
      return Array.from(coupons.values())
    },
    async incrementUsage(code) {
      const doc = coupons.get(String(code).toUpperCase())
      if (!doc) return null
      doc.timesUsed = (doc.timesUsed || 0) + 1
      coupons.set(doc.code, doc)
      return doc
    },
  },
}))

vi.mock("../js/couponUsageRepository.js", () => ({
  CouponUsageRepository: {
    async findByCodeAndCpf(code, cpf) {
      return usage.get(`${code.toUpperCase()}|${cpf}`) || null
    },
    async increment(code, cpf) {
      const key = `${code.toUpperCase()}|${cpf}`
      const current = usage.get(key) || { code: code.toUpperCase(), cpf, uses: 0 }
      const updated = { ...current, uses: current.uses + 1, lastUsedAt: new Date().toISOString() }
      usage.set(key, updated)
      return updated
    },
  },
}))

import { CouponService } from "../js/couponService.js"

describe("CouponService", () => {
  beforeEach(() => {
    coupons.clear()
    usage.clear()
  })

  it("cria cupom com código em maiúsculas e defaults", async () => {
    const created = await CouponService.create({ code: "black10", type: "percentual", value: 10 })
    expect(created.code).toBe("BLACK10")
    expect(created.minOrderValue).toBe(50)
    expect(created.timesUsed).toBe(0)
  })

  it("falha na validação quando cupom não existe", async () => {
    const res = await CouponService.validate("NOPE", { cartTotal: 100 })
    expect(res.ok).toBe(false)
    expect(res.reason).toBe("coupon_not_found")
  })

  it("bloqueia cupom inativo, expirado, limite global e pedido mínimo", async () => {
    await CouponService.create({ code: "OFF", type: "percentual", value: 10, isActive: false })
    let res = await CouponService.validate("OFF", { cartTotal: 100 })
    expect(res.reason).toBe("coupon_inactive")

    await CouponService.create({ code: "EXP", type: "percentual", value: 10, expirationDate: "2000-01-01" })
    res = await CouponService.validate("EXP", { cartTotal: 100 })
    expect(res.reason).toBe("coupon_expired")

    await CouponService.create({ code: "LIM", type: "percentual", value: 10, usageLimit: 1 })
    await CouponService.apply("LIM", { subtotal: 100 })
    res = await CouponService.validate("LIM", { cartTotal: 100 })
    expect(res.reason).toBe("coupon_usage_limit")

    await CouponService.create({ code: "MIN", type: "percentual", value: 10, minOrderValue: 200 })
    res = await CouponService.validate("MIN", { cartTotal: 100 })
    expect(res.reason).toBe("coupon_min_order")
  })

  it("bloqueia CPF inválido ou limite por CPF", async () => {
    await CouponService.create({ code: "CPF1", type: "percentual", value: 10, cpf: "123", cpfLimit: 1 })
    let res = await CouponService.validate("CPF1", { cartTotal: 100, cpf: "999" })
    expect(res.reason).toBe("coupon_cpf_mismatch")

    // primeiro uso
    let applyRes = await CouponService.apply("CPF1", { subtotal: 100, cpf: "123" })
    expect(applyRes.ok).toBe(true)
    // segundo uso deve bloquear
    res = await CouponService.validate("CPF1", { cartTotal: 100, cpf: "123" })
    expect(res.reason).toBe("coupon_cpf_limit")
  })

  it("aplica desconto percentual com teto maxDiscount e cap de 50%", async () => {
    await CouponService.create({ code: "MAX", type: "percentual", value: 80, maxDiscount: 300 })
    const res = await CouponService.apply("MAX", { subtotal: 1000 })
    expect(res.ok).toBe(true)
    expect(res.discount).toBe(300) // 80% de 1000 = 800, teto 300
    expect(res.subtotal).toBe(700)
  })

  it("aplica desconto fixo mas limita a 50% e evita negativo", async () => {
    await CouponService.create({ code: "FIX", type: "fixed", value: 120 })
    const res = await CouponService.apply("FIX", { subtotal: 100 })
    expect(res.ok).toBe(true)
    expect(res.discount).toBe(50) // cap 50% do subtotal
    expect(res.subtotal).toBe(50)
  })

  it("incrementa contadores global e por CPF ao aplicar", async () => {
    await CouponService.create({ code: "CNT", type: "percentual", value: 10, cpfLimit: 5 })
    const r1 = await CouponService.apply("CNT", { subtotal: 100, cpf: "321" })
    expect(r1.ok).toBe(true)
    const doc = coupons.get("CNT")
    expect(doc.timesUsed).toBe(1)
    const usageDoc = usage.get("CNT|321")
    expect(usageDoc.uses).toBe(1)
  })
})
