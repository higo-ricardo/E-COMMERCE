// â”€â”€â”€ HIVERCAR Â· tests/orderHistoryService.test.js â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
// US-26: Testes para orderHistoryService.js (Domain/Service)
//   - canTransition()      â†’ valida regras de ORDER_STATUS_FLOW
//   - changeOrderStatus()  â†’ audit log + update de pedido (mock Appwrite)
//   - getOrderTimeline()   â†’ leitura do histÃ³rico de um pedido

import { describe, it, expect, vi, beforeEach } from "vitest"

// â”€â”€ Mock appwriteClient â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
vi.mock("../js/appwriteClient.js", () => ({
  databases: {
    listDocuments:  vi.fn(),
    createDocument: vi.fn(),
    updateDocument: vi.fn(),
    getDocument:    vi.fn(),
  },
  Query: {
    equal:    vi.fn((...a) => ["equal", ...a]),
    orderAsc: vi.fn(f => ["orderAsc", f]),
    limit:    vi.fn(n => ["limit", n]),
  },
  ID: { unique: vi.fn(() => "hist-id-" + Math.random().toString(36).slice(2, 8)) },
}))

import {
  canTransition,
  changeOrderStatus,
  getOrderTimeline,
  OrderHistoryService,
} from "../js/orderHistoryService.js"

import { databases } from "../js/appwriteClient.js"

beforeEach(() => vi.clearAllMocks())

// â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
describe("canTransition()", () => {

  // â”€â”€ TransiÃ§Ãµes VÃLIDAS definidas em ORDER_STATUS_FLOW â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  const validTransitions = [
    ["novo",       "confirmado"],
    ["novo",       "cancelado"],
    ["confirmado", "em_preparo"],
    ["confirmado", "cancelado"],
    ["em_preparo", "enviado"],
    ["enviado",    "entregue"],
  ]

  validTransitions.forEach(([from, to]) => {
    it(`permite transiÃ§Ã£o vÃ¡lida: "${from}" â†’ "${to}"`, () => {
      const result = canTransition(from, to)
      expect(result.ok).toBe(true)
      expect(result.reason).toBeUndefined()
    })
  })

  // â”€â”€ TransiÃ§Ãµes INVÃLIDAS â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  const invalidTransitions = [
    ["novo",       "em_preparo", "salto de etapa"],
    ["novo",       "entregue",   "salto de etapa"],
    ["confirmado", "entregue",   "salto de etapa"],
    ["entregue",   "novo",       "status terminal"],
    ["entregue",   "cancelado",  "status terminal"],
    ["cancelado",  "novo",       "status terminal"],
    ["cancelado",  "confirmado", "status terminal"],
  ]

  invalidTransitions.forEach(([from, to, reason]) => {
    it(`bloqueia transiÃ§Ã£o invÃ¡lida: "${from}" â†’ "${to}" (${reason})`, () => {
      const result = canTransition(from, to)
      expect(result.ok).toBe(false)
      expect(result.reason).toBeTruthy()
      expect(typeof result.reason).toBe("string")
    })
  })

  it("retorna ok=false quando status de origem Ã© desconhecido", () => {
    const result = canTransition("status_inventado", "confirmado")
    expect(result.ok).toBe(false)
    expect(result.reason).toMatch(/desconhecido/i)
  })

  it("retorna ok=false quando tenta manter o mesmo status", () => {
    const result = canTransition("novo", "novo")
    expect(result.ok).toBe(false)
    expect(result.reason).toMatch(/jÃ¡ estÃ¡/i)
  })

  it("mensagem de erro lista os status permitidos para transiÃ§Ãµes invÃ¡lidas", () => {
    // "novo" permite apenas "confirmado" e "cancelado"
    const result = canTransition("novo", "em_preparo")
    expect(result.reason).toMatch(/confirmado/i)
    expect(result.reason).toMatch(/cancelado/i)
  })

  it("status terminal 'entregue' retorna mensagem 'terminal'", () => {
    const result = canTransition("entregue", "novo")
    expect(result.ok).toBe(false)
    expect(result.reason).toMatch(/terminal/i)
  })

  it("status terminal 'cancelado' retorna mensagem 'terminal'", () => {
    const result = canTransition("cancelado", "novo")
    expect(result.ok).toBe(false)
    expect(result.reason).toMatch(/terminal/i)
  })
})

// â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
describe("changeOrderStatus()", () => {

  const HIST_DOC  = { $id: "hist-001", orderId: "ord-001", oldStatus: "novo", newStatus: "confirmado" }
  const ORDER_DOC = { $id: "ord-001", status: "confirmado" }

  beforeEach(() => {
    databases.createDocument.mockResolvedValue(HIST_DOC)
    databases.updateDocument.mockResolvedValue(ORDER_DOC)
  })

  it("lanÃ§a erro para transiÃ§Ã£o invÃ¡lida sem chamar o banco", async () => {
    await expect(
      changeOrderStatus("ord-001", "entregue", "novo", "user-001")
    ).rejects.toThrow()

    expect(databases.createDocument).not.toHaveBeenCalled()
    expect(databases.updateDocument).not.toHaveBeenCalled()
  })

  it("cria documento na collection order_history para transiÃ§Ã£o vÃ¡lida", async () => {
    await changeOrderStatus("ord-001", "novo", "confirmado", "user-001")

    expect(databases.createDocument).toHaveBeenCalledTimes(1)
    const [, col, , payload] = databases.createDocument.mock.calls[0]
    expect(col).toMatch(/order_history/)
    expect(payload.orderId).toBe("ord-001")
    expect(payload.oldStatus).toBe("novo")
    expect(payload.newStatus).toBe("confirmado")
    expect(payload.changedBy).toBe("user-001")
  })

  it("atualiza o documento do pedido com o novo status", async () => {
    await changeOrderStatus("ord-001", "novo", "confirmado", "user-001")

    expect(databases.updateDocument).toHaveBeenCalledTimes(1)
    const [, col, id, payload] = databases.updateDocument.mock.calls[0]
    expect(col).toMatch(/orders/)
    expect(id).toBe("ord-001")
    expect(payload.status).toBe("confirmado")
  })

  it("registra changedAt como string ISO 8601", async () => {
    await changeOrderStatus("ord-001", "novo", "cancelado", "sistema")

    const payload = databases.createDocument.mock.calls[0][3]
    expect(payload.changedAt).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/)
  })

  it("usa 'sistema' como changedBy padrÃ£o quando nÃ£o informado", async () => {
    await changeOrderStatus("ord-001", "novo", "confirmado")

    const payload = databases.createDocument.mock.calls[0][3]
    expect(payload.changedBy).toBe("sistema")
  })

  it("persiste a nota opcional no histÃ³rico", async () => {
    await changeOrderStatus("ord-001", "novo", "cancelado", "admin", "Cancelado a pedido do cliente")

    const payload = databases.createDocument.mock.calls[0][3]
    expect(payload.note).toBe("Cancelado a pedido do cliente")
  })

  it("armazena null na nota quando ela nÃ£o Ã© fornecida", async () => {
    await changeOrderStatus("ord-001", "novo", "confirmado", "user")

    const payload = databases.createDocument.mock.calls[0][3]
    expect(payload.note).toBeNull()
  })

  it("retorna { historyDoc, orderDoc } com os documentos salvos", async () => {
    const result = await changeOrderStatus("ord-001", "novo", "confirmado", "user")

    expect(result).toHaveProperty("historyDoc")
    expect(result).toHaveProperty("orderDoc")
    expect(result.historyDoc.$id).toBe("hist-001")
    expect(result.orderDoc.$id).toBe("ord-001")
  })

  it("propaga erro quando createDocument falha", async () => {
    databases.createDocument.mockRejectedValue(new Error("DB write error"))

    await expect(
      changeOrderStatus("ord-001", "novo", "confirmado", "user")
    ).rejects.toThrow("DB write error")

    // updateDocument NÃƒO deve ser chamado se o histÃ³rico falhou
    expect(databases.updateDocument).not.toHaveBeenCalled()
  })

  it("propaga erro quando updateDocument falha", async () => {
    databases.updateDocument.mockRejectedValue(new Error("Update failed"))

    await expect(
      changeOrderStatus("ord-001", "novo", "confirmado", "user")
    ).rejects.toThrow("Update failed")
  })
})

// â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
describe("getOrderTimeline()", () => {

  it("consulta order_history filtrando pelo orderId", async () => {
    databases.listDocuments.mockResolvedValue({
      documents: [
        { $id: "h1", orderId: "ord-001", oldStatus: "novo",      newStatus: "confirmado", changedAt: "2024-01-01T10:00:00Z" },
        { $id: "h2", orderId: "ord-001", oldStatus: "confirmado",newStatus: "em_preparo", changedAt: "2024-01-01T12:00:00Z" },
      ],
      total: 2,
    })

    const timeline = await getOrderTimeline("ord-001")

    expect(timeline).toHaveLength(2)
    expect(databases.listDocuments).toHaveBeenCalledTimes(1)

    // Verifica que a query inclui o filtro por orderId
    const queries = databases.listDocuments.mock.calls[0][2]
    const hasFilter = queries.some(q => Array.isArray(q) && q.includes("ord-001"))
    expect(hasFilter).toBe(true)
  })

  it("retorna array vazio para pedido sem histÃ³rico", async () => {
    databases.listDocuments.mockResolvedValue({ documents: [], total: 0 })

    const result = await getOrderTimeline("ord-sem-historico")
    expect(result).toEqual([])
  })

  it("retorna documentos em ordem cronolÃ³gica (orderAsc)", async () => {
    databases.listDocuments.mockResolvedValue({
      documents: [
        { $id: "h1", changedAt: "2024-01-01T08:00:00Z" },
        { $id: "h2", changedAt: "2024-01-01T10:00:00Z" },
        { $id: "h3", changedAt: "2024-01-01T14:00:00Z" },
      ],
      total: 3,
    })

    const result = await getOrderTimeline("ord-001")
    expect(result[0].$id).toBe("h1")
    expect(result[2].$id).toBe("h3")
  })

  it("aplica limit=50 na query", async () => {
    databases.listDocuments.mockResolvedValue({ documents: [], total: 0 })

    await getOrderTimeline("ord-001")

    const queries = databases.listDocuments.mock.calls[0][2]
    const hasLimit50 = queries.some(q => Array.isArray(q) && q.includes(50))
    expect(hasLimit50).toBe(true)
  })
})

// â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
describe("OrderHistoryService (export agrupado)", () => {

  it("expÃµe canTransition, changeOrderStatus, getOrderTimeline", () => {
    expect(typeof OrderHistoryService.canTransition).toBe("function")
    expect(typeof OrderHistoryService.changeOrderStatus).toBe("function")
    expect(typeof OrderHistoryService.getOrderTimeline).toBe("function")
  })

  it("canTransition via namespace retorna mesmo resultado que import direto", () => {
    const direct    = canTransition("novo", "confirmado")
    const namespace = OrderHistoryService.canTransition("novo", "confirmado")
    expect(direct).toEqual(namespace)
  })
})

// â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
describe("Cobertura de todas as transiÃ§Ãµes do fluxo", () => {
  // Garante que todos os 6 status do fluxo sÃ£o cobertos

  const FLOW = {
    novo:        ["confirmado", "cancelado"],
    confirmado:  ["em_preparo", "cancelado"],
    em_preparo:  ["enviado"],
    enviado:     ["entregue"],
    entregue:    [],
    cancelado:   [],
  }

  Object.entries(FLOW).forEach(([from, allowedList]) => {
    if (allowedList.length === 0) {
      it(`"${from}" Ã© terminal (nenhuma transiÃ§Ã£o permitida)`, () => {
        const result = canTransition(from, "novo")
        expect(result.ok).toBe(false)
      })
    } else {
      allowedList.forEach(to => {
        it(`flow completo: "${from}" â†’ "${to}" Ã© permitido`, () => {
          expect(canTransition(from, to).ok).toBe(true)
        })
      })
    }
  })
})


