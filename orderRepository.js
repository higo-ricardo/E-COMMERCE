// ─── HIVERCAR · orderRepository.js ───────────────────────────────────────────
// Acesso ao banco: coleção "orders".
// Camada: Infrastructure / Repository.
//
// Sprint 02:
//   + getById(id)            → busca pedido por ID (necessário para cancelOrder)
//   + updateStatus(id,data)  → atualiza campos do pedido (status, updatedAt)

import { databases, ID, Query } from "./appwriteClient.js"
import { CONFIG }               from "./config.js"

const { DB, COL } = CONFIG

export const OrderRepository = {

  async create(order) {
    return databases.createDocument(DB, COL.ORDERS, ID.unique(), order)
  },

  async getById(id) {
    return databases.getDocument(DB, COL.ORDERS, id)
  },

  async list(filters = {}, limit = 100) {
    const queries = [Query.limit(limit), Query.orderDesc("createdAt")]
    if (filters.status) queries.push(Query.equal("status", filters.status))
    const res = await databases.listDocuments(DB, COL.ORDERS, queries)
    return res.documents
  },

  /** Atualiza campos do pedido (status, updatedAt, etc.). */
  async update(id, patch) {
    return databases.updateDocument(DB, COL.ORDERS, id, patch)
  },
}
