// ─── HIVERCAR · adminService.js ──────────────────────────────────────────────
// Métricas e operações do painel ERP. Zero UI.
// Camada: Domain / Service - exclusivo do ERP.
//
// Sprint 03 - correções:
//   - Todas as queries com Query.limit + Query.orderDesc (sem scan full)
//   - getMetrics() adaptado ao novo modelo OS (clienteName, placa, modelo)
//   - getCustomerList() lê da collection USERS (Auth Mirror)
//   + getRecentStockMovements()

import { databases, ID, Query } from "./appwriteClient.js"
import { CONFIG }               from "./config.js"

const { DB, COL } = CONFIG

export const AdminService = {

  async getMetrics() {
    const today = new Date()
    today.setHours(0, 0, 0, 0)

    const [ordersRes, productsRes, osRes] = await Promise.all([
      databases.listDocuments(DB, COL.ORDERS,   [Query.orderDesc("$createdAt"), Query.limit(100)]),
      databases.listDocuments(DB, COL.PRODUCTS, [Query.limit(200)]),
      databases.listDocuments(DB, COL.SERVICE_ORDERS, [Query.orderDesc("$createdAt"), Query.limit(50)]),
    ])

    const orders   = ordersRes.documents
    const products = productsRes.documents
    const os       = osRes.documents

    const ordersToday    = orders.filter(o => new Date(o.$createdAt) >= today)
    const lowStockProds  = products.filter(p => Number(p.qtd ?? 0) < 5 && p.isActive !== false)
    const osAbertas      = os.filter(o => o.status === "aberta" || o.status === "em_andamento")

    return {
      salesToday:       ordersToday.reduce((s, o) => s + (Number(o.total) || 0), 0),
      salesTotal:       orders.reduce((s, o) => s + (Number(o.total) || 0), 0),
      orders:           orders.length,
      ordersToday:      ordersToday.length,
      lowStock:         lowStockProds.length,
      serviceOrders:    osAbertas.length,
      recentOrders:     orders.slice(0, 5),
      lowStockProducts: lowStockProds.slice(0, 10),
      recentOS: os.slice(0, 5).map(o => ({
        ...o,
        displayName:    o.clienteName || o.customer || "-",
        displayVehicle: o.placa ? `${o.placa} ${o.modelo || '-'}`.trim() : (o.vehicle || "-"),
      })),
    }
  },

  async getCustomerList(limit = 50) {
    // Compatível com schema novo (USERS) e legado (cliente)
    try {
      const res = await databases.listDocuments(DB, COL.USERS, [
        Query.equal("role", "USERS"),
        Query.orderDesc("$createdAt"),
        Query.limit(limit),
      ])
      return res.documents
    } catch {
      const res = await databases.listDocuments(DB, COL.USERS, [
        Query.equal("role", "cliente"),
        Query.orderDesc("$createdAt"),
        Query.limit(limit),
      ])
      return res.documents
    }
  },

  async getCustomers() { return this.getCustomerList() },

  async getOrders(limit = 50) {
    const res = await databases.listDocuments(DB, COL.ORDERS, [
      Query.orderDesc("$createdAt"),
      Query.limit(limit),
    ])
    return res.documents
  },

  async getRecentStockMovements(limit = 20) {
    const res = await databases.listDocuments(DB, COL.STOCK_HISTORY, [
      Query.orderDesc("movedAt"),
      Query.limit(limit),
    ])
    return res.documents
  },

  async createServiceOrder(clienteName, placa, modelo, tecnico, descricao) {
    return databases.createDocument(DB, COL.SERVICE_ORDERS, ID.unique(), {
      clienteName, placa, modelo, tecnico, descricao,
      status: "aberta", maoObra: 0, pecas: "[]",
    })
  },

  async updateServiceOrderStatus(id, status) {
    return databases.updateDocument(DB, COL.SERVICE_ORDERS, id, { status })
  },
}
