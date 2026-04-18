// ─── HIVERCAR · repositories.js ──────────────────────────────────────────────
// Repositórios de acesso ao banco (Appwrite)
// Camada: Infrastructure / Repository
//
// Unifica: orderRepository, productRepository, couponRepository, couponUsageRepository
// Reduz de 4 arquivos para 1, mantendo mesma interface de exports

import { databases, ID, Query, Permission, Role } from "./db.js"
import { CONFIG } from "./config.js"

const { DB, COL } = CONFIG

// ─────────────────────────────────────────────────────────────────────────────
// ORDER REPOSITORY
// ─────────────────────────────────────────────────────────────────────────────

export const OrderRepository = {

  async create(order, userId) {
    // Permissões herdadas da collection "orders" configurada no Appwrite Console.
    // userId não é passado como atributo do documento — o `order.user` já contém o nome.
    return databases.createDocument(DB, COL.ORDERS, ID.unique(), order)
  },

  async getById(id) {
    return databases.getDocument(DB, COL.ORDERS, id)
  },

  /**
   * Lista pedidos com filtros e paginação.
   * @param {Object} filters - Filtros opcionais
   * @param {string} [filters.status] - Filtrar por status
   * @param {string} [filters.dateFrom] - Data inicial (YYYY-MM-DD)
   * @param {string} [filters.dateTo] - Data final (YYYY-MM-DD)
   * @param {string} [filters.search] - Busca por nome/cliente
   * @param {number} [filters.limit] - Limite de registros (padrão: 100)
   * @param {number} [filters.offset] - Offset para paginação (padrão: 0)
   * @returns {Promise<{documents: Array, total: number}>}
   */
  async list(filters = {}) {
    const queries = []
    
    // Limit e offset para paginação
    const limit = Math.min(Math.max(1, filters.limit || 100), 500)
    const offset = Math.max(0, filters.offset || 0)
    
    queries.push(Query.limit(limit))
    if (offset > 0) queries.push(Query.offset(offset))
    queries.push(Query.orderDesc("$createdAt"))
    
    // Filtro por status
    if (filters.status) {
      queries.push(Query.equal("status", filters.status))
    }
    
    // Filtro por período
    if (filters.dateFrom) {
      queries.push(Query.greaterThanEqual("$createdAt", filters.dateFrom + "T00:00:00"))
    }
    if (filters.dateTo) {
      queries.push(Query.lessThanEqual("$createdAt", filters.dateTo + "T23:59:59"))
    }
    
    // Busca por nome/cliente (full-text não suportado, filtro em memória)
    let res
    if (filters.search) {
      res = await databases.listDocuments(DB, COL.ORDERS, queries)
      const searchLower = filters.search.toLowerCase()
      res.documents = res.documents.filter(doc => {
        const user = (doc.user || "").toLowerCase()
        const email = (doc.email || "").toLowerCase()
        const mobile = (doc.mobile || "").toLowerCase()
        const number = (doc.number || "").toLowerCase()
        return user.includes(searchLower) || 
               email.includes(searchLower) || 
               mobile.includes(searchLower) ||
               number.includes(searchLower)
      })
    } else {
      res = await databases.listDocuments(DB, COL.ORDERS, queries)
    }
    
    return {
      documents: res.documents,
      total: res.total,
    }
  },

  async update(id, patch) {
    return databases.updateDocument(DB, COL.ORDERS, id, patch)
  },

  async delete(id) {
    return databases.deleteDocument(DB, COL.ORDERS, id)
  },
}

// ─────────────────────────────────────────────────────────────────────────────
// PRODUCT REPOSITORY
// ─────────────────────────────────────────────────────────────────────────────

export const ProductRepository = {

  async create(product) {
    // Permissões herdadas da collection "products" configurada no Appwrite Console:
    // - Read: any (público para vitrine da loja)
    // - Write/Update/Delete: role "admins"
    return databases.createDocument(DB, COL.PRODUCTS, ID.unique(), product)
  },

  async getById(id) {
    return databases.getDocument(DB, COL.PRODUCTS, id)
  },

  /**
   * Lista produtos com paginação por página e filtros opcionais.
   * @param {number} page - Página (1-based)
   * @param {Object} filters - Filtros: {category, brand, vehicle}
   * @returns {Promise<{products: Array, total: number, page: number, pages: number}>}
   */
  async list(page = 1, filters = {}, sort = "created-desc") {
    const PAGE_SIZE = 15
    const queries = [
      Query.limit(PAGE_SIZE),
      Query.offset((page - 1) * PAGE_SIZE),
      Query.isNull("deletedAt"),  // soft-delete: nunca exibe produtos excluídos
    ]

    // Ordenação
    switch (sort) {
      case "name-asc":
        queries.push(Query.orderAsc("name"))
        break
      case "name-desc":
        queries.push(Query.orderDesc("name"))
        break
      case "price-asc":
        queries.push(Query.orderAsc("price"))
        break
      case "price-desc":
        queries.push(Query.orderDesc("price"))
        break
      case "created-desc":
      default:
        queries.push(Query.orderDesc("$createdAt"))
        break
    }

    if (filters.category) {
      queries.push(Query.equal("category", filters.category))
    }
    if (filters.brand) {
      queries.push(Query.equal("brand", filters.brand))
    }
    if (filters.vehicle) {
      queries.push(Query.search("compatibleVehicles", filters.vehicle))
    }

    const res = await databases.listDocuments(DB, COL.PRODUCTS, queries)
    const pages = Math.ceil(res.total / PAGE_SIZE)

    return {
      products: res.documents,
      total: res.total,
      page,
      pages: Math.max(1, pages),
    }
  },

  /**
   * Busca produtos por termo + filtros opcionais.
   * @param {string} term - Termo de busca
   * @param {number} page - Página (1-based)
   * @param {Object} filters - Filtros: {category, brand, vehicle}
   * @returns {Promise<{products: Array, total: number, page: number, pages: number}>}
   */
  async search(term, page = 1, filters = {}, sort = "created-desc") {
    const PAGE_SIZE = 15
    const queries = [
      Query.limit(PAGE_SIZE),
      Query.offset((page - 1) * PAGE_SIZE),
      Query.isNull("deletedAt"),  // soft-delete
    ]

    // Ordenação
    switch (sort) {
      case "name-asc":
        queries.push(Query.orderAsc("name"))
        break
      case "name-desc":
        queries.push(Query.orderDesc("name"))
        break
      case "price-asc":
        queries.push(Query.orderAsc("price"))
        break
      case "price-desc":
        queries.push(Query.orderDesc("price"))
        break
      case "created-desc":
      default:
        queries.push(Query.orderDesc("$createdAt"))
        break
    }

    if (filters.category) {
      queries.push(Query.equal("category", filters.category))
    }
    if (filters.brand) {
      queries.push(Query.equal("brand", filters.brand))
    }
    if (filters.vehicle) {
      queries.push(Query.search("compatibleVehicles", filters.vehicle))
    }

    const searchLower = term.toLowerCase()

    let res
    try {
      res = await databases.listDocuments(DB, COL.PRODUCTS, [
        Query.search("name", term),
        ...queries,
      ])
    } catch {
      const all = await databases.listDocuments(DB, COL.PRODUCTS, [
        Query.limit(500),
        ...queries,
      ])
      res = {
        ...all,
        documents: all.documents.filter(doc => {
          const name = (doc.name || "").toLowerCase()
          const ncm = (doc.ncm || "").toLowerCase()
          const brand = (doc.brand || "").toLowerCase()
          const category = (doc.category || "").toLowerCase()
          const description = (doc.description || "").toLowerCase()
          return name.includes(searchLower) ||
                 ncm.includes(searchLower) ||
                 brand.includes(searchLower) ||
                 category.includes(searchLower) ||
                 description.includes(searchLower)
        }),
        total: 0,
      }
      res.total = res.documents.length
    }

    const pages = Math.ceil(res.total / PAGE_SIZE)

    return {
      products: res.documents,
      total: res.total,
      page,
      pages: Math.max(1, pages),
    }
  },

  /**
   * Retorna opções de filtros (categorias e marcas únicas).
   * @returns {Promise<{categories: string[], brands: string[]}>}
   */
  async getFilterOptions() {
    try {
      const res = await databases.listDocuments(DB, COL.PRODUCTS, [
        Query.limit(500),
        Query.orderDesc("$createdAt"),
      ])

      const categories = [...new Set(
        res.documents
          .map(d => d.category)
          .filter(Boolean)
      )].sort()

      const brands = [...new Set(
        res.documents
          .map(d => d.brand)
          .filter(Boolean)
      )].sort()

      return { categories, brands }
    } catch {
      return { categories: [], brands: [] }
    }
  },

  /** Busca produto por código de barras (EAN-8 ou EAN-13). */
  async searchByBarcode(barcode) {
    const clean = barcode.replace(/\D/g, "")
    const res = await databases.listDocuments(DB, COL.PRODUCTS, [
      Query.equal("ean", clean),
      Query.limit(1),
    ])
    return res.documents[0] ?? null
  },

  /** Retorna produtos com estoque abaixo do mínimo (ou STOCK_CRITICAL). */
  async getCriticalStock(limit = 100) {
    const res = await databases.listDocuments(DB, COL.PRODUCTS, [
      Query.limit(limit),
      Query.orderAsc("stock"),
    ])

    const threshold = CONFIG.STOCK_CRITICAL
    return res.documents.filter(doc => {
      const minQty = doc.minQTT ?? threshold
      return (doc.stock ?? 0) < minQty
    })
  },

  /** Soft-delete: marca produto como excluído sem remover do banco. */
  async softDelete(id) {
    return databases.updateDocument(DB, COL.PRODUCTS, id, {
      isActive: false,
      deletedAt: new Date().toISOString(),
    })
  },

  /** Restaura produto previamente excluído (soft-delete). */
  async restore(id) {
    return databases.updateDocument(DB, COL.PRODUCTS, id, {
      isActive: true,
      deletedAt: null,
    })
  },

  async update(id, data) {
    return databases.updateDocument(DB, COL.PRODUCTS, id, data)
  },

  async delete(id) {
    return databases.deleteDocument(DB, COL.PRODUCTS, id)
  },

  async findByFilters(filters = {}) {
    const queries = [Query.limit(100)]

    if (filters.category) {
      queries.push(Query.equal("category", filters.category))
    }
    if (filters.brand) {
      queries.push(Query.equal("brand", filters.brand))
    }
    if (filters.search) {
      queries.push(Query.search("name", filters.search))
    }
    if (filters.minPrice != null) {
      queries.push(Query.greaterThanEqual("price", filters.minPrice))
    }
    if (filters.maxPrice != null) {
      queries.push(Query.lessThanEqual("price", filters.maxPrice))
    }

    const res = await databases.listDocuments(DB, COL.PRODUCTS, queries)
    return res.documents
  },
}

// ─────────────────────────────────────────────────────────────────────────────
// COUPON REPOSITORY
// ─────────────────────────────────────────────────────────────────────────────

export const CouponRepository = {

  async create(coupon) {
    // Permissões herdadas da collection "coupons" configurada no Appwrite Console:
    // - Read: any (público para validação no checkout)
    // - Write/Update/Delete: role "admins" (via Appwrite Console → Database → coupons → Settings → Permissions)
    return databases.createDocument(DB, COL.COUPONS, ID.unique(), coupon)
  },

  async findByCode(code) {
    const res = await databases.listDocuments(DB, COL.COUPONS, [
      Query.equal("code", code),
      Query.limit(1),
    ])
    return res.documents[0] ?? null
  },

  async update(code, data) {
    const coupon = await this.findByCode(code)
    if (!coupon) throw new Error(`Cupom "${code}" não encontrado`)
    return databases.updateDocument(DB, COL.COUPONS, coupon.$id, data)
  },

  async incrementUsage(code) {
    const coupon = await this.findByCode(code)
    if (!coupon) throw new Error(`Cupom "${code}" não encontrado`)
    
    const currentUsage = coupon.timesUsed || 0
    return databases.updateDocument(DB, COL.COUPONS, coupon.$id, {
      timesUsed: currentUsage + 1,
    })
  },

  async listActive() {
    const res = await databases.listDocuments(DB, COL.COUPONS, [
      Query.equal("isActive", true),
      Query.orderDesc("$createdAt"),
      Query.limit(100),
    ])
    return res.documents
  },

  async list() {
    const res = await databases.listDocuments(DB, COL.COUPONS, [
      Query.orderDesc("$createdAt"),
      Query.limit(200),
    ])
    return res.documents
  },
}

// ─────────────────────────────────────────────────────────────────────────────
// COUPON USAGE REPOSITORY
// ─────────────────────────────────────────────────────────────────────────────

export const CouponUsageRepository = {

  async create(code, cpf, couponCreatedAt) {
    return databases.createDocument(DB, COL.COUPON_USAGE, ID.unique(), {
      code,
      cpf: cpf || null,
      uses: 1,
      lastUsedAt: new Date().toISOString(),
      createdAt: couponCreatedAt || null,
    })
  },

  async findByCodeAndCpf(code, cpf) {
    const res = await databases.listDocuments(DB, COL.COUPON_USAGE, [
      Query.equal("code", code),
      Query.equal("cpf", cpf),
      Query.limit(1),
    ])
    return res.documents[0] ?? null
  },

  async increment(code, cpf, couponCreatedAt) {
    if (cpf) {
      const usage = await this.findByCodeAndCpf(code, cpf)
      if (!usage) {
        return this.create(code, cpf, couponCreatedAt)
      }
      return databases.updateDocument(DB, COL.COUPON_USAGE, usage.$id, {
        uses: (usage.uses || 0) + 1,
        lastUsedAt: new Date().toISOString(),
      })
    }
    // Sem CPF: cria registro sem cpf
    return this.create(code, null, couponCreatedAt)
  },
}
