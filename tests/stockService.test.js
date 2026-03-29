// â”€â”€â”€ HIVERCAR Â· tests/stockService.test.js â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
// Testes para stockService.js
//   - checkStock()  â†’ valida disponibilidade antes de vender
//   - deductStock() â†’ deduz estoque e registra em stock_history
//   - revertStock() â†’ devolve estoque ao cancelar pedido
//   - getStockHistory() â†’ consulta movimentaÃ§Ãµes

import { describe, it, expect, vi, beforeEach } from "vitest"

// â”€â”€ Mock completo do appwriteClient â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
vi.mock("../js/appwriteClient.js", () => ({
  databases: {
    getDocument:    vi.fn(),
    createDocument: vi.fn(),
    updateDocument: vi.fn(),
    listDocuments:  vi.fn(),
  },
  Query: {
    equal:     vi.fn((...a) => ["equal", ...a]),
    orderDesc: vi.fn(f => ["orderDesc", f]),
    limit:     vi.fn(n => ["limit", n]),
  },
  ID: { unique: vi.fn(() => "hist-mock-" + Math.random().toString(36).slice(2, 8)) },
}))

import {
  checkStock,
  deductStock,
  revertStock,
  getStockHistory,
} from "../js/stockService.js"

import { databases } from "../js/appwriteClient.js"

// â”€â”€ Helpers â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
function mockProduct(id, stock) {
  return { $id: id, name: `Produto-${id}`, stock, price: 50 }
}

beforeEach(() => vi.clearAllMocks())

// â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
describe("checkStock()", () => {

  it("nÃ£o lanÃ§a erro quando hÃ¡ estoque suficiente para todos os itens", async () => {
    databases.getDocument
      .mockResolvedValueOnce(mockProduct("pid-001", 10))
      .mockResolvedValueOnce(mockProduct("pid-002", 5))

    const items = [
      { $id: "pid-001", name: "Pastilha", qty: 3 },
      { $id: "pid-002", name: "Filtro",   qty: 5 },
    ]
    await expect(checkStock(items)).resolves.toBeUndefined()
  })

  it("lanÃ§a erro com mensagem descritiva quando estoque Ã© insuficiente", async () => {
    databases.getDocument.mockResolvedValue(mockProduct("pid-001", 2))

    const items = [{ $id: "pid-001", name: "Pastilha", qty: 5 }]

    await expect(checkStock(items)).rejects.toThrow(/pastilha/i)
    await expect(checkStock(items)).rejects.toThrow(/insuficiente/i)
  })

  it("menciona quantidade disponÃ­vel e solicitada na mensagem de erro", async () => {
    databases.getDocument.mockResolvedValue(mockProduct("pid-001", 3))

    const items = [{ $id: "pid-001", name: "Ã“leo", qty: 10 }]
    await expect(checkStock(items)).rejects.toThrow(/disponÃ­vel 3/i)
    await expect(checkStock(items)).rejects.toThrow(/solicitado 10/i)
  })

  it("lanÃ§a erro listando TODOS os produtos com estoque insuficiente", async () => {
    databases.getDocument
      .mockResolvedValueOnce(mockProduct("pid-001", 1))   // Pastilha: 1 disponÃ­vel, pede 5
      .mockResolvedValueOnce(mockProduct("pid-002", 0))   // Filtro: 0 disponÃ­vel, pede 2

    const items = [
      { $id: "pid-001", name: "Pastilha", qty: 5 },
      { $id: "pid-002", name: "Filtro",   qty: 2 },
    ]
    let err
    try { await checkStock(items) } catch (e) { err = e }
    expect(err.message).toMatch(/pastilha/i)
    expect(err.message).toMatch(/filtro/i)
  })

  it("lanÃ§a erro com mensagem de 'nÃ£o encontrado' quando produto nÃ£o existe no DB", async () => {
    databases.getDocument.mockRejectedValue(new Error("Document not found"))

    const items = [{ $id: "pid-inexistente", name: "PeÃ§a X", qty: 1 }]
    await expect(checkStock(items)).rejects.toThrow(/nÃ£o encontrado/i)
  })

  it("trata estoque null como 0 (estoque undefined Ã© zero)", async () => {
    databases.getDocument.mockResolvedValue({ $id: "p1", name: "P1", qtd: null })
    const items = [{ $id: "p1", name: "P1", qty: 1 }]
    await expect(checkStock(items)).rejects.toThrow(/insuficiente/i)
  })

  it("aceita quando qty nÃ£o Ã© informada (usa 1 como padrÃ£o)", async () => {
    databases.getDocument.mockResolvedValue(mockProduct("p1", 5))
    const items = [{ $id: "p1", name: "P1" }]   // qty undefined
    await expect(checkStock(items)).resolves.toBeUndefined()
  })
})

// â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
describe("deductStock()", () => {

  it("atualiza o estoque do produto com a quantidade correta", async () => {
    databases.getDocument.mockResolvedValue(mockProduct("p1", 10))
    databases.updateDocument.mockResolvedValue({})
    databases.createDocument.mockResolvedValue({})

    await deductStock([{ $id: "p1", name: "Pastilha", qty: 3 }], "ord-001")

    expect(databases.updateDocument).toHaveBeenCalledWith(
      expect.any(String), // DB
      expect.any(String), // COL.PRODUCTS
      "p1",
      { qtd: 7 }        // 10 - 3 = 7
    )
  })

  it("registra movimentaÃ§Ã£o negativa em stock_history (type='venda')", async () => {
    databases.getDocument.mockResolvedValue(mockProduct("p1", 10))
    databases.updateDocument.mockResolvedValue({})
    databases.createDocument.mockResolvedValue({})

    await deductStock([{ $id: "p1", name: "Pastilha", qty: 4 }], "ord-002")

    const histCall = databases.createDocument.mock.calls[0][3]
    expect(histCall.qty).toBe(-4)          // negativo = saÃ­da
    expect(histCall.type).toBe("venda")
    expect(histCall.stockBefore).toBe(10)
    expect(histCall.stockAfter).toBe(6)
    expect(histCall.reference).toBe("ord-002")
    expect(histCall.productId).toBe("p1")
  })

  it("nunca deixa estoque negativo (mÃ­nimo = 0)", async () => {
    databases.getDocument.mockResolvedValue(mockProduct("p1", 2))
    databases.updateDocument.mockResolvedValue({})
    databases.createDocument.mockResolvedValue({})

    await deductStock([{ $id: "p1", name: "Pastilha", qty: 10 }], "ord-003")

    const upCall = databases.updateDocument.mock.calls[0][3]
    expect(upCall.stock).toBe(0)           // Math.max(0, 2-10) = 0
  })

  it("processa mÃºltiplos itens em paralelo", async () => {
    databases.getDocument
      .mockResolvedValueOnce(mockProduct("p1", 10))
      .mockResolvedValueOnce(mockProduct("p2", 5))
    databases.updateDocument.mockResolvedValue({})
    databases.createDocument.mockResolvedValue({})

    await deductStock([
      { $id: "p1", name: "P1", qty: 2 },
      { $id: "p2", name: "P2", qty: 3 },
    ], "ord-004")

    expect(databases.updateDocument).toHaveBeenCalledTimes(2)
    expect(databases.createDocument).toHaveBeenCalledTimes(2)
  })

  it("inclui movedAt em formato ISO no histÃ³rico", async () => {
    databases.getDocument.mockResolvedValue(mockProduct("p1", 5))
    databases.updateDocument.mockResolvedValue({})
    databases.createDocument.mockResolvedValue({})

    await deductStock([{ $id: "p1", name: "P1", qty: 1 }], "ord-005")

    const histCall = databases.createDocument.mock.calls[0][3]
    expect(histCall.movedAt).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/)
  })
})

// â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
describe("revertStock()", () => {

  it("devolve o estoque ao produto corretamente", async () => {
    databases.getDocument.mockResolvedValue(mockProduct("p1", 3))
    databases.updateDocument.mockResolvedValue({})
    databases.createDocument.mockResolvedValue({})

    await revertStock([{ $id: "p1", name: "Pastilha", qty: 5 }], "ord-cancel-001")

    expect(databases.updateDocument).toHaveBeenCalledWith(
      expect.any(String),
      expect.any(String),
      "p1",
      { qtd: 8 }   // 3 + 5 = 8
    )
  })

  it("registra movimentaÃ§Ã£o positiva em stock_history (type='cancelamento')", async () => {
    databases.getDocument.mockResolvedValue(mockProduct("p1", 0))
    databases.updateDocument.mockResolvedValue({})
    databases.createDocument.mockResolvedValue({})

    await revertStock([{ $id: "p1", name: "Filtro", qty: 2 }], "ord-cancel-002")

    const histCall = databases.createDocument.mock.calls[0][3]
    expect(histCall.qty).toBe(2)               // positivo = entrada (devoluÃ§Ã£o)
    expect(histCall.type).toBe("cancelamento")
    expect(histCall.stockBefore).toBe(0)
    expect(histCall.stockAfter).toBe(2)
  })

  it("nÃ£o falha quando produto nÃ£o Ã© encontrado (produto excluÃ­do)", async () => {
    databases.getDocument.mockRejectedValue(new Error("Document not found"))

    // NÃ£o deve lanÃ§ar â€” comportamento documentado no serviÃ§o
    await expect(
      revertStock([{ $id: "pid-deleted", name: "X", qty: 1 }], "ord-x")
    ).resolves.toBeUndefined()
  })

  it("continua revertendo outros itens mesmo se um falhar", async () => {
    databases.getDocument
      .mockRejectedValueOnce(new Error("Produto deletado"))  // p1 falha
      .mockResolvedValueOnce(mockProduct("p2", 3))            // p2 ok
    databases.updateDocument.mockResolvedValue({})
    databases.createDocument.mockResolvedValue({})

    await revertStock([
      { $id: "p1", name: "P1", qty: 1 },
      { $id: "p2", name: "P2", qty: 2 },
    ], "ord-mix")

    // p2 deve ter sido atualizado mesmo com p1 falhando
    expect(databases.updateDocument).toHaveBeenCalledWith(
      expect.any(String), expect.any(String), "p2", { qtd: 5 }
    )
  })
})

// â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
describe("getStockHistory()", () => {

  it("consulta stock_history filtrando pelo productId", async () => {
    databases.listDocuments.mockResolvedValue({
      documents: [
        { productId:"p1", qty:-3, type:"venda",   movedAt:"2024-01-01T10:00:00Z" },
        { productId:"p1", qty:10, type:"reposicao",movedAt:"2024-01-02T09:00:00Z" },
      ],
      total: 2,
    })

    const result = await getStockHistory("p1")
    expect(result).toHaveLength(2)
    expect(databases.listDocuments).toHaveBeenCalledTimes(1)

    // Verifica que a query inclui o filtro por productId
    const queries = databases.listDocuments.mock.calls[0][2]
    const hasEqualFilter = queries.some(q => Array.isArray(q) && q.includes("p1"))
    expect(hasEqualFilter).toBe(true)
  })

  it("retorna array vazio quando nÃ£o hÃ¡ movimentaÃ§Ãµes", async () => {
    databases.listDocuments.mockResolvedValue({ documents: [], total: 0 })
    const result = await getStockHistory("p-sem-historico")
    expect(result).toEqual([])
  })

  it("usa limit=30 por padrÃ£o", async () => {
    databases.listDocuments.mockResolvedValue({ documents: [], total: 0 })
    await getStockHistory("p1")

    const queries = databases.listDocuments.mock.calls[0][2]
    const hasLimit30 = queries.some(q => Array.isArray(q) && q.includes(30))
    expect(hasLimit30).toBe(true)
  })

  it("aceita limit customizado", async () => {
    databases.listDocuments.mockResolvedValue({ documents: [], total: 0 })
    await getStockHistory("p1", 10)

    const queries = databases.listDocuments.mock.calls[0][2]
    const hasLimit10 = queries.some(q => Array.isArray(q) && q.includes(10))
    expect(hasLimit10).toBe(true)
  })
})


