// ─── HIVERCAR · couponRepository.js ───────────────────────────────────────────
// Camada de acesso à collection COUPONS (Appwrite).

import { databases, Query, ID } from "./appwriteClient.js"
import { CONFIG } from "./config.js"

const DB = CONFIG.DB
const COL = CONFIG.COL.COUPONS

const normalize = (coupon) => ({
  ...coupon,
  code: coupon?.code?.toUpperCase(),
})

export const CouponRepository = {
  /**
   * Cria cupom na collection COUPONS.
   * Campos: code, type, value, minOrderValue, maxDiscount, expirationDate,
   * usageLimit, timesUsed, cpf, isActive, cpfLimit.
   */
  async create(payload) {
    const body = normalize({
      code: payload.code,
      type: payload.type,
      value: payload.value,
      minOrderValue: payload.minOrderValue ?? 50,
      maxDiscount: payload.maxDiscount ?? null,
      expirationDate: payload.expirationDate ?? null,
      usageLimit: payload.usageLimit ?? null,
      timesUsed: payload.timesUsed ?? 0,
      cpf: payload.cpf ?? null,
      isActive: payload.isActive ?? true,
      cpfLimit: payload.cpfLimit ?? null,
    })

    const doc = await databases.createDocument(DB, COL, ID.unique(), body)
    return normalize(doc)
  },

  /**
   * Busca cupom por código (case-insensitive).
   */
  async findByCode(code) {
    if (!code) return null
    const codeUp = String(code).toUpperCase()
    const res = await databases.listDocuments(DB, COL, [
      Query.equal("code", codeUp),
      Query.limit(1),
    ])
    return res.total > 0 ? normalize(res.documents[0]) : null
  },

  /**
   * Lista cupons (opção de filtros simples).
   */
  async list({ activeOnly = false } = {}) {
    const queries = []
    if (activeOnly) queries.push(Query.equal("isActive", true))
    const res = await databases.listDocuments(DB, COL, queries)
    return res.documents.map(normalize)
  },

  /**
   * Incrementa contagem de uso (timesUsed) e retorna documento atualizado.
   * Previne race condition TOCTOU com validação pós-incremento.
   * Se o incremento violar o limite, reverte e lança erro.
   */
  async incrementUsage(code) {
    const existing = await this.findByCode(code)
    if (!existing) return null
    
    const currentUses = existing.timesUsed || 0
    const usageLimit = existing.usageLimit
    
    // Pré-validação: se já atingiu o limite, não incrementa
    if (usageLimit != null && currentUses >= usageLimit) {
      throw new Error(`Cupom atingiu limite de ${usageLimit} usos.`)
    }
    
    // Incrementa
    const updated = await databases.updateDocument(DB, COL, existing.$id, {
      timesUsed: currentUses + 1,
    })
    
    // Pós-validação: verifica se houve race condition
    const newUses = updated.timesUsed || 0
    if (usageLimit != null && newUses > usageLimit) {
      // Race condition detectada! Reverte o incremento
      await databases.updateDocument(DB, COL, existing.$id, {
        timesUsed: currentUses,
      })
      throw new Error(`Cupom atingiu limite de ${usageLimit} usos durante processamento.`)
    }
    
    return normalize(updated)
  },
}
