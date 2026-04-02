// ─── HIVERCAR · orderRepository.js ───────────────────────────────────────────
// Acesso ao banco: coleção "orders".
// Camada: Infrastructure / Repository.
//
// Sprint 02:
//   + getById(id)            → busca pedido por ID (necessário para cancelOrder)
//   + updateStatus(id,data)  → atualiza campos do pedido (status, updatedAt)
//
// Sprint 07 - US-65, US-89:
//   + list() atualizado para suportar filtros avançados e paginação

import { databases, ID, Query, Permission, Role } from "./appwriteClient.js"
import { CONFIG }               from "./config.js"

const { DB, COL } = CONFIG

export const OrderRepository = {

  async create(order, userId) {
    const permissions = [
      Permission.read(Role.user(userId)),
      Permission.update(Role.user(userId)),
      Permission.delete(Role.user(userId)),
    ]
    return databases.createDocument(DB, COL.ORDERS, ID.unique(), order, permissions)
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
    
    // Limit e offset para paginação (US-89)
    const limit = Math.min(Math.max(1, filters.limit || 100), 500) // max 500
    const offset = Math.max(0, filters.offset || 0)
    
    queries.push(Query.limit(limit))
    if (offset > 0) queries.push(Query.offset(offset))
    
    // Ordenação
    queries.push(Query.orderDesc("$createdAt"))
    
    // Filtro por status
    if (filters.status) {
      queries.push(Query.equal("status", filters.status))
    }
    
    // Filtro por período (dateFrom e dateTo)
    if (filters.dateFrom) {
      queries.push(Query.greaterThanEqual("$createdAt", filters.dateFrom + "T00:00:00"))
    }
    if (filters.dateTo) {
      queries.push(Query.lessThanEqual("$createdAt", filters.dateTo + "T23:59:59"))
    }
    
    // Busca por nome/cliente (search)
    // Appwrite não suporta full-text search nativo, então filtramos em memória
    let res
    if (filters.search) {
      // Busca ampla sem filtro de search primeiro
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

  /** Atualiza campos do pedido (status, updatedAt, etc.). */
  async update(id, patch) {
    return databases.updateDocument(DB, COL.ORDERS, id, patch)
  },

  /**
   * Deleta um pedido (apenas admin).
   * @param {string} id - ID do pedido
   */
  async delete(id) {
    return databases.deleteDocument(DB, COL.ORDERS, id)
  },
}
