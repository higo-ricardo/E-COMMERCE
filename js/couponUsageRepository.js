// ─── HIVERCAR · couponUsageRepository.js ──────────────────────────────────────
// Collection: coupon_usage (Appwrite) — controla usos por CPF e por código.

import { databases, Query, ID } from "./appwriteClient.js"
import { CONFIG } from "./config.js"

const DB = CONFIG.DB
const COL = CONFIG.COL.COUPON_USAGE

const normalize = (doc) => ({
  ...doc,
  code: doc?.code?.toUpperCase(),
})

export const CouponUsageRepository = {
  async findByCodeAndCpf(code, cpf) {
    if (!code || !cpf) return null
    const res = await databases.listDocuments(DB, COL, [
      Query.equal("code", String(code).toUpperCase()),
      Query.equal("cpf", cpf),
      Query.limit(1),
    ])
    return res.total > 0 ? normalize(res.documents[0]) : null
  },

  /**
   * Incrementa uses para (code, cpf). Cria se não existir.
   * Previne race condition TOCTOU com validação pós-incremento.
   * @param {string} code - Código do cupom
   * @param {string} cpf - CPF do usuário
   * @param {number} [cpfLimit] - Limite de usos por CPF (opcional)
   */
  async increment(code, cpf, cpfLimit = null) {
    if (!code || !cpf) throw new Error("code e cpf são obrigatórios para registrar uso por CPF")
    
    const existing = await this.findByCodeAndCpf(code, cpf)
    const now = new Date().toISOString()
    
    // Pré-validação: verifica se atingiu limite por CPF
    if (existing && cpfLimit != null && (existing.uses || 0) >= cpfLimit) {
      throw new Error(`Limite de ${cpfLimit} usos por CPF atingido para este cupom.`)
    }

    if (existing) {
      const currentUses = existing.uses || 0
      const updated = await databases.updateDocument(DB, COL, existing.$id, {
        uses: currentUses + 1,
        lastUsedAt: now,
      })
      
      // Pós-validação: verifica race condition
      const newUses = updated.uses || 0
      if (cpfLimit != null && newUses > cpfLimit) {
        // Reverte
        await databases.updateDocument(DB, COL, existing.$id, {
          uses: currentUses,
        })
        throw new Error(`Limite de ${cpfLimit} usos por CPF atingido durante processamento.`)
      }
      
      return normalize(updated)
    }

    // Novo registro
    const created = await databases.createDocument(DB, COL, ID.unique(), {
      code: String(code).toUpperCase(),
      cpf,
      uses: 1,
      lastUsedAt: now,
    })
    
    // Valida criação inicial
    if (cpfLimit != null && created.uses > cpfLimit) {
      throw new Error(`Limite de ${cpfLimit} usos por CPF atingido.`)
    }
    
    return normalize(created)
  },

  async reset() {
    // Apenas para testes locais: não implementado (evitar list+delete em prod).
    throw new Error("reset não implementado para coupon_usage (evite apagar em produção).")
  },
}
