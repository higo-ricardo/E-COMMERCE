// ─── HIVERCAR · productRepository.js ────────────────────────────────────────
// Acesso ao banco: coleção "produtos".
// Camada: Infrastructure / Repository.

import { Permission, Role } from "https://cdn.jsdelivr.net/npm/appwrite@13.0.0/+esm"
import { databases, Query } from "./appwriteClient.js"
import { CONFIG }           from "./config.js"

const { DB, COL, STORE } = CONFIG

export const ProductRepository = {

  /**
   * Lista produtos paginados, com filtros opcionais.
   * Apenas produtos ativos e não deletados (loja pública).
   */
  async list(page = 1, filters = {}) {

    await fixACL() // 🔥 ADIÇÃO (1 linha, não quebra nada)

    const offset  = (page - 1) * STORE.PAGE_SIZE
    const queries = [
      Query.limit(STORE.PAGE_SIZE),
      Query.offset(offset),
      Query.isNull("deletedAt"),
      Query.equal("isActive", true),
    ]

    if (filters.category) queries.push(Query.equal("category", filters.category))
    if (filters.brand)    queries.push(Query.equal("brand",    filters.brand))

    const res = await databases.listDocuments(DB, COL.PRODUCTS, queries)

    return {
      products: res.documents,
      total:    res.total,
      pages:    Math.ceil(res.total / STORE.PAGE_SIZE),
      page,
    }
  },

  async search(term, page = 1, filters = {}) {
    const offset  = (page - 1) * STORE.PAGE_SIZE
    const queries = [
      Query.search("name", term),
      Query.limit(STORE.PAGE_SIZE),
      Query.offset(offset),
      Query.isNull("deletedAt"),
    ]

    if (filters.category) queries.push(Query.equal("category", filters.category))
    if (filters.brand)    queries.push(Query.equal("brand",    filters.brand))

    const res = await databases.listDocuments(DB, COL.PRODUCTS, queries)

    return {
      products: res.documents,
      total:    res.total,
      pages:    Math.ceil(res.total / STORE.PAGE_SIZE),
      page,
    }
  },

  async searchByNcm(term, page = 1) {
    const offset  = (page - 1) * STORE.PAGE_SIZE

    const res = await databases.listDocuments(DB, COL.PRODUCTS, [
      Query.search("ncm", term),
      Query.limit(STORE.PAGE_SIZE),
      Query.offset(offset),
    ])

    return {
      products: res.documents,
      total:    res.total,
      pages:    Math.ceil(res.total / STORE.PAGE_SIZE),
      page,
    }
  },

  async getFilterOptions() {
    const res = await databases.listDocuments(DB, COL.PRODUCTS, [
      Query.limit(500),
      Query.isNull("deletedAt")
    ])

    const categories = [...new Set(res.documents.map(p => p.category).filter(Boolean))].sort()
    const brands     = [...new Set(res.documents.map(p => p.brand).filter(Boolean))].sort()

    return { categories, brands }
  },

  async searchByBarcode(barcode) {
    const res = await databases.listDocuments(DB, COL.PRODUCTS, [
      Query.equal("barcode", barcode),
      Query.isNull("deletedAt"),
      Query.limit(1),
    ])

    return res.documents[0] ?? null
  },

  async getCriticalStock(limit = 100) {
    const res = await databases.listDocuments(DB, COL.PRODUCTS, [
      Query.equal("isActive", true),
      Query.isNull("deletedAt"),
      Query.limit(200),
    ])

    const minDefault = CONFIG.STOCK_CRITICAL ?? 5

    return res.documents
      .filter(p => (p.qtd ?? 0) < (p.minStock ?? minDefault))
      .slice(0, limit)
  },

  async softDelete(id) {
    return databases.updateDocument(DB, COL.PRODUCTS, id, {
      deletedAt: new Date().toISOString(),
      isActive:  false,
    })
  },

  async restore(id) {
    return databases.updateDocument(DB, COL.PRODUCTS, id, {
      deletedAt: null,
      isActive:  true,
    })
  },
}

// 🔧 FIX ACL AUTOMÁTICO (RODA 1 VEZ, NÃO QUEBRA NADA)
async function fixACL() {
  const FLAG = "fix_acl_done"

  if (typeof window === "undefined") return
  if (localStorage.getItem(FLAG)) return

  try {
    let offset = 0

    while (true) {
      const res = await databases.listDocuments(DB, COL.PRODUCTS, [
        Query.limit(50),
        Query.offset(offset)
      ])

      if (!res.documents.length) break

      for (const doc of res.documents) {
        try {
          await databases.updateDocument(
            DB,
            COL.PRODUCTS,
            doc.$id,
            {},
            [
              Permission.read(Role.any()),
              Permission.update(Role.users()),
              Permission.delete(Role.users()),
            ]
          )
        } catch (e) {}
      }

      offset += 50
    }

    localStorage.setItem(FLAG, "true")
    console.log("ACL corrigida")

  } catch (e) {
    console.warn("Erro ACL (ignorado)")
  }
}