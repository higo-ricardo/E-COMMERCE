// ─── HIVERCAR · orderHistoryService.js ───────────────────────────────────────
// US-09: Audit log de alterações de status de pedido.
//
// Responsabilidades:
//   - Registrar cada mudança de status na collection "order_history"
//   - Bloquear transições inválidas conforme CONFIG.ORDER_STATUS_FLOW
//   - Retornar timeline de status de um pedido (para modal de detalhes)
//
// Collection "order_history" — atributos necessários no Appwrite:
//   orderId   (string, required)
//   oldStatus (string, required)
//   newStatus (string, required)
//   changedBy (string, required)   — userId ou "sistema"
//   changedAt (string, required)   — ISO 8601
//   note      (string, optional)   — observação livre
//
// Camada: Domain / Service — importado por painel-vendas.html e orderService.js

import { databases, ID, Query } from "./appwriteClient.js"
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
// EXPORTAÇÃO AGRUPADA
// ─────────────────────────────────────────────────────────────────────────────

export const OrderHistoryService = {
  canTransition,
  changeOrderStatus,
  getOrderTimeline,
}
