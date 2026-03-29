// ─── HIVERCAR · stockService.js ──────────────────────────────────────────────
// US-20: Gestão de estoque - baixa automática ao vender, verificação, reversão.
// US-36: isStockCritical() verifica se estoque atingiu o minStock individual.
//
// Responsabilidades:
//   - checkStock(items)         → verifica se há estoque para todos os itens
//   - deductStock(items, ref)   → baixa estoque + registra em stock_history
//   - revertStock(items, ref)   → devolve estoque (pedido cancelado) + registra
//   - getStockHistory(productId)→ historico de movimentações de um produto
//
// Collection "stock_history" - atributos necessários no Appwrite:
//   productId   (string, required)
//   productName (string, required)
//   qty         (integer, required)   - positivo = entrada, negativo = saída
//   type        (string, required)    - "venda" | "cancelamento" | "ajuste"
//   reference   (string, required)    - orderId ou "manual"
//   movedAt     (string, required)    - ISO 8601
//   stockBefore (integer, required)
//   stockAfter  (integer, required)
//
// Camada: Domain / Service - importado por orderService.js

import { databases, ID, Query } from "./appwriteClient.js"
import { CONFIG }               from "./config.js"

const { DB, COL } = CONFIG

// ─────────────────────────────────────────────────────────────────────────────
// VERIFICAR ESTOQUE
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Verifica se todos os itens do carrinho têm estoque suficiente.
 * Lança erro descritivo com o(s) produto(s) em falta.
 *
 * @param {Array<{ $id: string, name: string, qty: number }>} items
 * @throws {Error} com lista dos produtos sem estoque
 */
export async function checkStock(items) {
  const errors = []

  await Promise.all(items.map(async item => {
    let product
    try {
      product = await databases.getDocument(DB, COL.PRODUCTS, item.$id)
    } catch {
      errors.push(`Produto "${item.name}" não encontrado no catálogo.`)
      return
    }

    const available = Number(product.qtd ?? 0)
    const requested = Number(item.qty ?? 1)

    if (available < requested) {
      errors.push(
        `"${item.name}": estoque insuficiente - disponível ${available}, solicitado ${requested}.`
      )
    }
  }))

  if (errors.length) {
    throw new Error("Estoque insuficiente:\n" + errors.join("\n"))
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// BAIXAR ESTOQUE
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Deduz o estoque dos produtos vendidos e registra em stock_history.
 * Deve ser chamado APÓS checkStock() e APÓS salvar o pedido.
 *
 * @param {Array<{ $id: string, name: string, qty: number }>} items
 * @param {string} orderId  ID do pedido (referência no histórico)
 */
export async function deductStock(items, orderId) {
  await Promise.all(items.map(async item => {
    const product     = await databases.getDocument(DB, COL.PRODUCTS, item.$id)
    const stockBefore = Number(product.qtd ?? 0)
    const qty         = Number(item.qty ?? 1)
    const stockAfter  = Math.max(0, stockBefore - qty)

    // Atualiza estoque do produto
    await databases.updateDocument(DB, COL.PRODUCTS, item.$id, { qtd: stockAfter })

    // Registra movimentação
    await databases.createDocument(DB, COL.STOCK_HISTORY, ID.unique(), {
      productId:   item.$id,
      productName: item.name,
      qty:         -qty,            // negativo = saída
      type:        "venda",
      reference:   orderId,
      movedAt:     new Date().toISOString(),
      stockBefore,
      stockAfter,
    })
  }))
}

// ─────────────────────────────────────────────────────────────────────────────
// REVERTER ESTOQUE (CANCELAMENTO)
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Devolve o estoque dos itens de um pedido cancelado.
 * @param {Array<{ $id: string, name: string, qty: number }>} items
 * @param {string} orderId
 */
export async function revertStock(items, orderId) {
  await Promise.all(items.map(async item => {
    let product
    try {
      product = await databases.getDocument(DB, COL.PRODUCTS, item.$id)
    } catch {
      // Produto pode ter sido excluído - loga mas não bloqueia o cancelamento
      console.warn(`[StockService] Produto ${item.$id} não encontrado ao reverter estoque.`)
      return
    }

    const stockBefore = Number(product.qtd ?? 0)
    const qty         = Number(item.qty ?? 1)
    const stockAfter  = stockBefore + qty

    await databases.updateDocument(DB, COL.PRODUCTS, item.$id, { qtd: stockAfter })

    await databases.createDocument(DB, COL.STOCK_HISTORY, ID.unique(), {
      productId:   item.$id,
      productName: item.name,
      qty:         +qty,            // positivo = entrada (devolução)
      type:        "cancelamento",
      reference:   orderId,
      movedAt:     new Date().toISOString(),
      stockBefore,
      stockAfter,
    })
  }))
}

// ─────────────────────────────────────────────────────────────────────────────
// HISTÓRICO DE MOVIMENTAÇÕES
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Retorna o histórico de movimentações de um produto.
 * @param {string} productId
 * @param {number} [limit=30]
 * @returns {Promise<Array>}
 */
export async function getStockHistory(productId, limit = 30) {
  const res = await databases.listDocuments(DB, COL.STOCK_HISTORY, [
    Query.equal("productId", productId),
    Query.orderDesc("movedAt"),
    Query.limit(limit),
  ])
  return res.documents
}

// ─────────────────────────────────────────────────────────────────────────────
// US-36: VERIFICAR SE ESTOQUE É CRÍTICO (usa minStock individual ou STOCK_CRITICAL)
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Verifica se o estoque de um produto atingiu ou passou do nível mínimo.
 * Usa o campo minStock do produto; se ausente, usa CONFIG.STOCK_CRITICAL.
 *
 * @param {{ qtd: number, minStock?: number }} product
 * @returns {{ critical: boolean, current: number, minimum: number }}
 */
export function isStockCritical(product) {
  const current = Number(product.qtd ?? 0)
  // minStock é o nome real do atributo no Appwrite DB
  // fallback: CONFIG.STOCK_CRITICAL (padrão do sistema)
  const minimum = product.minStock != null
    ? Number(product.minStock)
    : (CONFIG.STOCK_CRITICAL ?? 5)
  return { critical: current < minimum, current, minimum }
}

/**
 * Retorna todos os produtos com estoque crítico.
 * @param {number} [limit=50]
 */
export async function getCriticalStockProducts(limit = 50) {
  const res = await databases.listDocuments(DB, COL.PRODUCTS, [
    Query.equal("isActive", true),
    Query.isNull("deletedAt"),
    Query.limit(200),
  ])
  return res.documents
    .filter(p => isStockCritical(p).critical)
    .slice(0, limit)
}

// ─────────────────────────────────────────────────────────────────────────────
// EXPORTAÇÃO AGRUPADA
// ─────────────────────────────────────────────────────────────────────────────

export const StockService = {
  checkStock,
  deductStock,
  revertStock,
  getStockHistory,
  isStockCritical,
  getCriticalStockProducts,
}
