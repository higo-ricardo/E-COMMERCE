// ─── HIVERCAR · productService.js ────────────────────────────────────────────
// Cache em memória + lógica de listagem/busca/filtros. Zero UI.
// Camada: Domain / Service.
//
// US-25: Invalidação explícita após CRUD + log hit/miss (debug mode).
//   - invalidateCache()     → limpa todo o cache (chamar após salvar/editar/excluir produto)
//   - invalidateCacheKey()  → remove entrada específica
//   - DEBUG_CACHE = true    → loga hits, misses e invalidações no console

import { ProductRepository } from "./repositories.js"
import { CONFIG }            from "./config.js"

const cache = new Map()
const TTL   = CONFIG.STORE.CACHE_TTL

// ── Debug mode ──────────────────────────────────────────────────────────────
// Setar window.HIVERCAR_DEBUG = true no console do browser para ativar logs.
const DEBUG = () => typeof window !== "undefined" && window.HIVERCAR_DEBUG === true

function log(type, key) {
  if (!DEBUG()) return
  const styles = {
    HIT:   "color:#26fd71;font-weight:bold",
    MISS:  "color:#facc15;font-weight:bold",
    INVAL: "color:#f87171;font-weight:bold",
    SET:   "color:#60a5fa",
  }
  console.debug(`%c[CACHE ${type}]`, styles[type] ?? "", key)
}

// ── Helpers de cache ─────────────────────────────────────────────────────────
function cacheKey(prefix, term, page, filters, sort = "created-desc") {
  return `${prefix}|${term}|${page}|${JSON.stringify(filters)}|${sort}`
}

function cacheGet(key) {
  const entry = cache.get(key)
  if (!entry) { log("MISS", key); return null }
  if (Date.now() - entry.time > TTL) { cache.delete(key); log("MISS", key + " (expirado)"); return null }
  log("HIT", key)
  return entry.data
}

function cacheSet(key, data) {
  cache.set(key, { time: Date.now(), data })
  log("SET", key)
}

// ── Serviço ──────────────────────────────────────────────────────────────────
export const ProductService = {

  /** Lista paginada com filtros opcionais {category, brand, vehicle}. */
  async list(page = 1, filters = {}, sort = "created-desc") {
    const key    = cacheKey("list", "", page, filters, sort)
    const cached = cacheGet(key)
    if (cached) return cached
    const result = await ProductRepository.list(page, filters, sort)
    cacheSet(key, result)
    return result
  },

  /** Busca por termo + filtros opcionais. */
  async search(term, page = 1, filters = {}, sort = "created-desc") {
    const trimmed = term.trim()
    if (!trimmed) return this.list(page, filters, sort)
    const key    = cacheKey("search", trimmed, page, filters, sort)
    const cached = cacheGet(key)
    if (cached) return cached
    const result = await ProductRepository.search(trimmed, page, filters, sort)
    cacheSet(key, result)
    return result
  },

  /** Opções de filtros (categorias e marcas). Cached separado. */
  async getFilterOptions() {
    const key    = "filter_options"
    const cached = cacheGet(key)
    if (cached) return cached
    const result = await ProductRepository.getFilterOptions()
    cacheSet(key, result)
    return result
  },

  /**
   * Invalida TODO o cache.
   * Chamar após: salvar produto, editar produto, excluir produto.
   * US-25 · Tasks 1, 2.
   */
  invalidateCache() {
    const size = cache.size
    cache.clear()
    log("INVAL", `cache completo limpo — ${size} entradas removidas`)
  },

  /**
   * Invalida apenas uma entrada específica do cache (uso interno / avançado).
   * @param {string} prefix  "list" | "search" | "filter_options"
   * @param {string} term    termo de busca (vazio para listas)
   * @param {number} page    página
   * @param {object} filters filtros aplicados
   */
  invalidateCacheKey(prefix, term = "", page = 1, filters = {}) {
    const key = cacheKey(prefix, term, page, filters)
    cache.delete(key)
    log("INVAL", key)
  },

  /** Retorna estatísticas do cache (útil para debug). */
  cacheStats() {
    return {
      entries:  cache.size,
      keys:     [...cache.keys()],
      debugOn:  DEBUG(),
    }
  },
  /** Busca produto por código de barras (EAN-8 ou EAN-13). Sem cache — leitura pontual. */
  async searchByBarcode(barcode) {
    return ProductRepository.searchByBarcode(barcode)
  },

  /** Retorna produtos com stock < minStock (ou STOCK_CRITICAL). Sem cache — dados críticos. */
  async getCriticalStock(limit = 100) {
    return ProductRepository.getCriticalStock(limit)
  },

  /** Soft-delete. Invalida cache. */
  async softDelete(id) {
    const result = await ProductRepository.softDelete(id)
    this.invalidateCache()
    return result
  },

  /** Restaura produto excluído. Invalida cache. */
  async restore(id) {
    const result = await ProductRepository.restore(id)
    this.invalidateCache()
    return result
  },
}
