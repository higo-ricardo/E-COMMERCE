// ─── HIVERCAR · productRepository.js ────────────────────────────────────────
// Acesso ao banco: coleção "produtos".
// Camada: Infrastructure / Repository.
//
// Sprint 06 — alterações:
//   + barcode   (string — EAN-8 ou EAN-13)
//   + costPrice (float  — preço de custo para cálculo de margem)
//   + weight    (float  — peso em kg para cálculo de frete)
//   + stockGTO  (integer — substitui stockMin — nível mínimo de alerta individual)
//   + deletedAt (string — soft-delete; null = ativo, ISO 8601 = excluído)
//   - Todas as queries adicionam Query.isNull("deletedAt") automaticamente

import { databases, Query } from "./appwriteClient.js"
import { CONFIG }           from "./config.js"

const { DB, COL, STORE } = CONFIG

export const ProductRepository = {

  /**
   * Lista produtos paginados, com filtros opcionais.
   * Nunca retorna produtos com deletedAt preenchido (soft-delete).
   */
  async list(page = 1, filters = {}) {
    const offset  = (page - 1) * STORE.PAGE_SIZE
    const queries = [
      Query.limit(STORE.PAGE_SIZE),
      Query.offset(offset),
      Query.isNull("deletedAt"),    // soft-delete
    ]

    if (filters.category) queries.push(Query.equal("category", filters.category))
    if (filters.brand)    queries.push(Query.equal("brand",    filters.brand))
    if (filters.vehicle)  queries.push(Query.search("vehicles", filters.vehicle))
    if (filters.isActive !== undefined) queries.push(Query.equal("isActive", filters.isActive))

    const res = await databases.listDocuments(DB, COL.PRODUCTS, queries)
    return {
      products: res.documents,
      total:    res.total,
      pages:    Math.ceil(res.total / STORE.PAGE_SIZE),
      page,
    }
  },

  /**
   * Busca full-text por nome. US-28.
   * Também filtra soft-deleted e aplica filtros opcionais.
   */
  async search(term, page = 1, filters = {}) {
    const offset  = (page - 1) * STORE.PAGE_SIZE
    const queries = [
      Query.search("name", term),
      Query.limit(STORE.PAGE_SIZE),
      Query.offset(offset),
      Query.isNull("deletedAt"),    // soft-delete
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

  /**
   * Busca pelo campo NCM (para pesquisa fiscal). US-28.
   */
  async searchByNcm(term, page = 1) {
    const offset  = (page - 1) * STORE.PAGE_SIZE
    const res = await databases.listDocuments(DB, COL.PRODUCTS, [
      Query.search("ncm", term),
      Query.limit(STORE.PAGE_SIZE),
      Query.offset(offset),
      Query.isNull("deletedAt"),
    ])
    return {
      products: res.documents,
      total:    res.total,
      pages:    Math.ceil(res.total / STORE.PAGE_SIZE),
      page,
    }
  },

  /**
   * Busca pelo campo barcode (EAN-8 ou EAN-13).
   * Útil na leitura de código de barras no ERP.
   */
  async searchByBarcode(barcode) {
    const res = await databases.listDocuments(DB, COL.PRODUCTS, [
      Query.equal("barcode", barcode),
      Query.isNull("deletedAt"),
      Query.limit(1),
    ])
    return res.documents[0] ?? null
  },

  /**
   * Retorna produtos com estoque abaixo do nível mínimo individual (stockGTO).
   * Usa STOCK_MIN_DEFAULT quando stockGTO não está definido.
   */
  async getCriticalStock(limit = 100) {
    const res = await databases.listDocuments(DB, COL.PRODUCTS, [
      Query.equal("isActive", true),
      Query.isNull("deletedAt"),
      Query.limit(200),
    ])
    const minDefault = CONFIG.STOCK_MIN_DEFAULT ?? 5
    return res.documents
      .filter(p => (p.stock ?? 0) < (p.stockGTO ?? minDefault))
      .slice(0, limit)
  },

  /**
   * Busca todos os valores únicos de categorias e marcas (para filtros UI). 
   * Ignora soft-deleted.
   */
  async getFilterOptions() {
    const res = await databases.listDocuments(DB, COL.PRODUCTS, [
      Query.limit(200),
      Query.isNull("deletedAt"),
    ])
    const categories = [...new Set(res.documents.map(p => p.category).filter(Boolean))].sort()
    const brands     = [...new Set(res.documents.map(p => p.brand).filter(Boolean))].sort()
    return { categories, brands }
  },

  /**
   * Soft-delete: registra deletedAt e desativa o produto.
   * O documento nunca é apagado do banco — fica disponível para auditoria.
   */
  async softDelete(id) {
    return databases.updateDocument(DB, COL.PRODUCTS, id, {
      deletedAt: new Date().toISOString(),
      isActive:  false,
    })
  },

  /**
   * Restaura um produto excluído via soft-delete.
   */
  async restore(id) {
    return databases.updateDocument(DB, COL.PRODUCTS, id, {
      deletedAt: null,
      isActive:  true,
    })
  },
}
