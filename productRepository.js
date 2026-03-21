// ─── HIVERCAR · productRepository.js ────────────────────────────────────────
// Acesso ao banco: coleção "produtos".
// Camada: Infrastructure / Repository.

import { databases, Query } from "./appwriteClient.js"
import { CONFIG }           from "./config.js"

const { DB, COL, STORE } = CONFIG

export const ProductRepository = {

  /** Lista produtos paginados, com filtros opcionais. */
  async list(page = 1, filters = {}) {
    const offset   = (page - 1) * STORE.PAGE_SIZE
    const queries  = [Query.limit(STORE.PAGE_SIZE), Query.offset(offset)]

    if (filters.category) queries.push(Query.equal("category", filters.category))
    if (filters.brand)    queries.push(Query.equal("brand",    filters.brand))
    if (filters.vehicle)  queries.push(Query.search("vehicles", filters.vehicle))

    const res = await databases.listDocuments(DB, COL.PRODUCTS, queries)
    return {
      products: res.documents,
      total:    res.total,
      pages:    Math.ceil(res.total / STORE.PAGE_SIZE),
      page,
    }
  },

  /** Busca por nome, NCM e veículo (full-text em múltiplos campos). US-28. */
  async search(term, page = 1, filters = {}) {
    const offset  = (page - 1) * STORE.PAGE_SIZE

    // Estratégia: busca principal por nome. Resultados complementares por
    // NCM/veículo são mesclados no frontend via productService.searchMultiField.
    const queries = [
      Query.search("name", term),
      Query.limit(STORE.PAGE_SIZE),
      Query.offset(offset),
    ]

    if (filters.category) queries.push(Query.equal("category", filters.category))
    if (filters.brand)    queries.push(Query.equal("brand",    filters.brand))
    if (filters.vehicle)  queries.push(Query.search("vehicles", filters.vehicle))

    const res = await databases.listDocuments(DB, COL.PRODUCTS, queries)
    return {
      products: res.documents,
      total:    res.total,
      pages:    Math.ceil(res.total / STORE.PAGE_SIZE),
      page,
    }
  },

  /** US-28: Busca pelo campo NCM (para pesquisa fiscal). */
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

  /** Busca todos os valores únicos de categorias e marcas (para filtros UI). */
  async getFilterOptions() {
    const res = await databases.listDocuments(DB, COL.PRODUCTS, [Query.limit(100)])
    const categories = [...new Set(res.documents.map(p => p.category).filter(Boolean))].sort()
    const brands     = [...new Set(res.documents.map(p => p.brand).filter(Boolean))].sort()
    return { categories, brands }
  },
}
