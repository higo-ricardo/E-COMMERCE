// ─── HIVERCAR · orderHistoryService.js ───────────────────────────────────────
// US-09, US-67, US-68, US-69, US-70: Audit log de alterações de status de pedido.
//
// Responsabilidades:
//   - Registrar cada mudança de status na collection "order_history"
//   - Bloquear transições inválidas conforme CONFIG.ORDER_STATUS_FLOW
//   - Retornar timeline de status de um pedido (para modal de detalhes)
//
// Collection "order_history" - atributos necessários no Appwrite:
//   orderId   (string, required)
//   oldStatus (string, required)
//   newStatus (string, required)
//   changedBy (string, required)   - userId ou "sistema"
//   changedAt (string, required)   - ISO 8601
//   note      (string, optional)   - observação livre
//
// Camada: Domain / Service - importado por painel-vendas.html e orderService.js

import { databases, ID, Query, Permission, Role } from "./db.js"
import { CONFIG }               from "./config.js"

const { DB, COL, ORDER_STATUS_FLOW } = CONFIG

// ─────────────────────────────────────────────────────────────────────────────
// VALIDAÇÃO DE TRANSIÇÃO
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Verifica se a transição de status é permitida.
 * @param {string} from  Status atual do pedido
 * @param {string} to    Novo status desejado
 * @returns {{ ok: boolean, reason?: string }}
 */
export function canTransition(from, to) {
  if (from === to) {
    return { ok: false, reason: `Pedido já está com status "${from}".` }
  }
  const allowed = ORDER_STATUS_FLOW[from]
  if (!allowed) {
    return { ok: false, reason: `Status de origem desconhecido: "${from}".` }
  }
  if (allowed.length === 0) {
    return { ok: false, reason: `O status "${from}" é terminal e não pode ser alterado.` }
  }
  if (!allowed.includes(to)) {
    return {
      ok:     false,
      reason: `Transição inválida: "${from}" → "${to}". Permitido: ${allowed.map(s => `"${s}"`).join(", ")}.`,
    }
  }
  return { ok: true }
}

// ─────────────────────────────────────────────────────────────────────────────
// REGISTRAR ALTERAÇÃO
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Registra uma entrada no audit log e atualiza o status do pedido.
 *
 * @param {string}  orderId    ID do pedido
 * @param {string}  oldStatus  Status anterior
 * @param {string}  newStatus  Novo status
 * @param {string}  changedBy  ID do usuário que fez a alteração (ou "sistema")
 * @param {string}  [note]     Observação opcional
 * @returns {Promise<{ historyDoc: object, orderDoc: object }>}
 * @throws {Error}  Se a transição for inválida
 */
export async function changeOrderStatus(orderId, oldStatus, newStatus, changedBy = "sistema", note = "") {
  // 1. Valida transição
  const { ok, reason } = canTransition(oldStatus, newStatus)
  if (!ok) throw new Error(reason)

  // 2. Registra no histórico
  const perms = [
    Permission.read(Role.user(changedBy)),
    Permission.read(Role.team("admins")),
    Permission.update(Role.team("admins")),
    Permission.delete(Role.team("admins")),
  ]
  const historyDoc = await databases.createDocument(
    DB,
    COL.ORDER_HISTORY,
    ID.unique(),
    {
      orderId,
      oldStatus,
      newStatus,
      changedBy,
      changedAt: new Date().toISOString(),
      note:      note || null,
    },
    perms,
  )

  // 3. Atualiza o pedido
  const orderDoc = await databases.updateDocument(DB, COL.ORDERS, orderId, {
    status:    newStatus,
    updatedAt: new Date().toISOString(),
  })

  return { historyDoc, orderDoc }
}

// ─────────────────────────────────────────────────────────────────────────────
// BUSCAR TIMELINE
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Retorna a timeline de status de um pedido, ordenada da mais antiga para a mais recente.
 * @param {string} orderId
 * @returns {Promise<Array>}
 */
export async function getOrderTimeline(orderId) {
  const res = await databases.listDocuments(DB, COL.ORDER_HISTORY, [
    Query.equal("orderId", orderId),
    Query.orderAsc("changedAt"),
    Query.limit(50),
  ])
  return res.documents
}

// ─────────────────────────────────────────────────────────────────────────────
// SPRINT 07 — US-70: REGISTRAR HISTÓRICO DE MUDANÇAS
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Retorna o histórico de mudanças de um pedido (alias para getOrderTimeline).
 * @param {string} orderId - ID do pedido
 * @returns {Promise<Array>}
 */
export async function getHistoryByOrder(orderId) {
  return getOrderTimeline(orderId)
}

/**
 * Registra uma mudança de status com campos adicionais para auditoria.
 * US-67, US-68, US-69: Processando, Enviado, Entregue
 * @param {string} orderId - ID do pedido
 * @param {string} newStatus - Novo status
 * @param {string} userId - ID do usuário que fez a alteração
 * @param {string} [note] - Observação opcional
 * @returns {Promise<Object>}
 */
export async function registerStatusChange(orderId, newStatus, userId, note = "") {
  const order = await databases.getDocument(DB, COL.ORDERS, orderId)
  const oldStatus = order.status
  
  return changeOrderStatus(orderId, oldStatus, newStatus, userId, note)
}

/**
 * Verifica se um pedido pode ser cancelado.
 * US-73, US-74: Cancelamento de pedidos
 * @param {string} status - Status atual do pedido
 * @returns {{ canCancel: boolean, reason?: string }}
 */
export function canCancelOrder(status) {
  const cancellableStatuses = ["NOVO", "PAGO", "CONFIRMADO", "EM_PREPARO"]
  if (status === "CANCELADO") {
    return { canCancel: false, reason: "Pedido já está cancelado" }
  }
  if (!cancellableStatuses.includes(status)) {
    return { canCancel: false, reason: `Pedido não pode ser cancelado no status "${status}"` }
  }
  return { canCancel: true }
}

/**
 * Cancela um pedido com registro de histórico.
 * @param {string} orderId - ID do pedido
 * @param {string} userId - ID do usuário que cancelou
 * @param {string} [reason] - Motivo do cancelamento
 * @returns {Promise<Object>}
 */
export async function cancelOrder(orderId, userId, reason = "") {
  const order = await databases.getDocument(DB, COL.ORDERS, orderId)
  const { canCancel, reason: cancelReason } = canCancelOrder(order.status)
  
  if (!canCancel) {
    throw new Error(cancelReason)
  }
  
  const note = reason ? `Cancelamento: ${reason}` : ""
  return changeOrderStatus(orderId, order.status, "CANCELADO", userId, note)
}

/**
 * Confirma a entrega de um pedido.
 * US-71: Confirmar Entrega
 * @param {string} orderId - ID do pedido
 * @param {string} userId - ID do usuário que confirmou
 * @returns {Promise<Object>}
 */
export async function confirmDelivery(orderId, userId) {
  const order = await databases.getDocument(DB, COL.ORDERS, orderId)
  
  if (order.status !== "ENVIADO") {
    throw new Error(`Só é possível confirmar entrega de pedidos "ENVIADOS". Status atual: ${order.status}`)
  }
  
  return changeOrderStatus(orderId, "ENVIADO", "ENTREGUE", userId, "Entrega confirmada")
}

/**
 * Registra devolução de pedido.
 * US-75, US-76: Devoluções (Returns)
 * @param {string} orderId - ID do pedido
 * @param {string} userId - ID do usuário que registrou
 * @param {string} [reason] - Motivo da devolução
 * @returns {Promise<Object>}
 */
export async function registerReturn(orderId, userId, reason = "") {
  const order = await databases.getDocument(DB, COL.ORDERS, orderId)
  
  // Só permite devolução de pedidos entregues
  if (order.status !== "ENTREGUE") {
    throw new Error(`Só é possível registrar devolução de pedidos "ENTREGUES". Status atual: ${order.status}`)
  }
  
  const note = reason ? `Devolução: ${reason}` : "Devolução registrada"
  
  // Atualiza pedido com flag de devolução
  const orderDoc = await databases.updateDocument(DB, COL.ORDERS, orderId, {
    status: "DEVOLVIDO",
    updatedAt: new Date().toISOString(),
    returnReason: reason || null,
    returnedAt: new Date().toISOString(),
  })
  
  // Registra no histórico
  const historyDoc = await databases.createDocument(
    DB,
    COL.ORDER_HISTORY,
    ID.unique(),
    {
      orderId,
      oldStatus: "ENTREGUE",
      newStatus: "DEVOLVIDO",
      changedBy: userId,
      changedAt: new Date().toISOString(),
      note,
    },
  )
  
  return { historyDoc, orderDoc }
}

// ─────────────────────────────────────────────────────────────────────────────
// EXPORTAÇÃO AGRUPADA
// ─────────────────────────────────────────────────────────────────────────────

export const OrderHistoryService = {
  canTransition,
  changeOrderStatus,
  getOrderTimeline,
  getHistoryByOrder,
  registerStatusChange,
  canCancelOrder,
  cancelOrder,
  confirmDelivery,
  registerReturn,
}
