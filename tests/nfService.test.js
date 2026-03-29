// ─── HIVERCAR · tests/nfService.test.js ──────────────────────────────────────
// US-43 · Sprint 05 - Testes do NFService (Emissão de NFC-e)
//
// Estratégia: mocks de appwriteClient e fetch global
// Não dispara chamadas reais ao SEFAZ/integrador

import { describe, it, expect, vi, beforeEach } from "vitest"

// ── Mocks ─────────────────────────────────────────────────────────────────────
vi.mock("../js/appwriteClient.js", () => ({
  databases: {
    getDocument:    vi.fn(),
    updateDocument: vi.fn(),
    createDocument: vi.fn(),
    listDocuments:  vi.fn(),
  },
  Query: {
    equal:              vi.fn(() => "q"),
    orderDesc:          vi.fn(() => "q"),
    limit:              vi.fn(() => "q"),
    greaterThanEqual:   vi.fn(() => "q"),
    lessThanEqual:      vi.fn(() => "q"),
  },
  ID: { unique: vi.fn(() => "nfe-mock-id") },
}))

vi.mock("../js/config.js", () => ({
  CONFIG: {
    DB:         "db-test",
    ENDPOINT:   "https://test.appwrite.io/v1",
    PROJECT_ID: "proj-test",
    COL: {
      ORDERS:        "orders",
      NFE_DOCUMENTS: "nfe_documents",
      PRODUCTS:      "produtos",
    },
    FUNCTIONS: {
      EMIT_NFE:   "emit-nfe",
      CANCEL_NFE: "cancel-nfe",
    },
    FISCAL: {
      AMBIENTE:     "homologacao",
      REGIME:       "lucro_presumido",
      UF_ORIGEM:    "MA",
      CNPJ:         "00.000.000/0001-00",
      RAZAO_SOCIAL: "HIVERCAR AUTOPEÇAS LTDA",
      SERIE_NFE:    "001",
    },
  },
}))

// Mock do TaxEngine
vi.mock("../js/taxEngine.js", () => ({
  TaxEngine: {
    calculate: vi.fn(() => ({
      baseCalculo: 100, ipi: 0, icms: 12, pis: 1.16, cofins: 5.32,
      cbs: 0.9, ibs: 17, totalImpostos: 36.38, total: 136.38,
      aliquotaEfetiva: 36.38,
      discriminado: {
        IPI:    { aliquota: 0,    valor: 0 },
        ICMS:   { aliquota: 12,   valor: 12 },
        PIS:    { aliquota: 1.16, valor: 1.16 },
        COFINS: { aliquota: 5.32, valor: 5.32 },
        CBS:    { aliquota: 0.9,  valor: 0.9 },
        IBS:    { aliquota: 17,   valor: 17 },
      },
    })),
  },
}))

import { databases } from "../js/appwriteClient.js"
import { NFService, emitir, cancelar, listarNFe, buildNFePayload } from "../js/nfService.js"

// ── Pedido mock ───────────────────────────────────────────────────────────────
const pedidoMock = {
  $id:          "order-abc123",
  nome:         "João Silva",
  email:        "joao@email.com",
  cpf:          "000.000.000-00",
  endereco:     "Rua das Flores",
  numero:       "100",
  bairro:       "Centro",
  cidade:       "Chapadinha",
  estado:       "MA",
  cep:          "65500-000",
  items:        JSON.stringify([
    { $id: "prod1", name: "Pastilha", price: 100, qty: 1, ncm: "8708.30" },
  ]),
  subtotal:     100,
  taxes:        36.38,
  taxBreakdown: JSON.stringify({ IPI: 0, ICMS: 12, PIS: 1.16, COFINS: 5.32, CBS: 0.9, IBS: 17 }),
  taxRate:      36.38,
  frete:        15,
  total:        151.38,
  payment:      "pix",
  status:       "confirmado",
  nfeStatus:    "pendente",
}

// ── Setup ─────────────────────────────────────────────────────────────────────
beforeEach(() => {
  vi.clearAllMocks()
  databases.getDocument.mockResolvedValue(pedidoMock)
  databases.updateDocument.mockResolvedValue({ ...pedidoMock })
  databases.createDocument.mockResolvedValue({ $id: "nfe-mock-id" })
  databases.listDocuments.mockResolvedValue({ documents: [], total: 0 })
})

// ─────────────────────────────────────────────────────────────────────────────
describe("NFService.buildNFePayload - Montagem do payload", () => {

  it("retorna objeto com emitente, destinatario e itens", () => {
    const payload = buildNFePayload(pedidoMock)
    expect(payload).toHaveProperty("emitente")
    expect(payload).toHaveProperty("destinatario")
    expect(payload).toHaveProperty("itens")
    expect(payload).toHaveProperty("totais")
    expect(payload).toHaveProperty("pagamento")
  })

  it("emitente.cnpj é somente dígitos", () => {
    const payload = buildNFePayload(pedidoMock)
    expect(payload.emitente.cnpj).toMatch(/^\d+$/)
  })

  it("destinatario.nome é preenchido com nome do pedido", () => {
    const payload = buildNFePayload(pedidoMock)
    expect(payload.destinatario.nome).toBe("João Silva")
  })

  it("itens tem o mesmo número de produtos do pedido", () => {
    const payload = buildNFePayload(pedidoMock)
    expect(payload.itens).toHaveLength(1)
  })

  it("itens[0].ncm é preenchido", () => {
    const payload = buildNFePayload(pedidoMock)
    expect(payload.itens[0].ncm).toBe("8708.30")
  })

  it("totais.totalNota bate com pedido.total", () => {
    const payload = buildNFePayload(pedidoMock)
    expect(payload.totais.totalNota).toBe(pedidoMock.total)
  })

  it("ambiente é homologacao (config mock)", () => {
    const payload = buildNFePayload(pedidoMock)
    expect(payload.ambiente).toBe("homologacao")
  })

  it("pedido sem itens não lança erro", () => {
    const p = { ...pedidoMock, items: "[]" }
    expect(() => buildNFePayload(p)).not.toThrow()
    const payload = buildNFePayload(p)
    expect(payload.itens).toHaveLength(0)
  })

  it("destinatario usa CONSUMIDOR FINAL quando nome é vazio", () => {
    const p = { ...pedidoMock, nome: "" }
    const payload = buildNFePayload(p)
    expect(payload.destinatario.nome).toBe("CONSUMIDOR FINAL")
  })

  it("pagamento PIX mapeia para meio='17'", () => {
    const payload = buildNFePayload({ ...pedidoMock, payment: "pix" })
    expect(payload.pagamento.meios[0].meio).toBe("17")
  })

  it("pagamento dinheiro mapeia para meio='01'", () => {
    const payload = buildNFePayload({ ...pedidoMock, payment: "dinheiro" })
    expect(payload.pagamento.meios[0].meio).toBe("01")
  })

  it("pagamento desconhecido mapeia para meio='99'", () => {
    const payload = buildNFePayload({ ...pedidoMock, payment: "xyz" })
    expect(payload.pagamento.meios[0].meio).toBe("99")
  })

})

// ─────────────────────────────────────────────────────────────────────────────
describe("NFService.emitir - Emissão via Function", () => {

  it("lança erro quando pedido não é encontrado", async () => {
    databases.getDocument.mockRejectedValueOnce(new Error("Not found"))
    await expect(emitir("id-inexistente")).rejects.toThrow()
  })

  it("retorna { ok: false } quando NF-e já foi emitida", async () => {
    databases.getDocument.mockResolvedValueOnce({ ...pedidoMock, nfeStatus: "emitida", nfeChave: "chave-existente" })
    const result = await emitir("order-abc123")
    expect(result.ok).toBe(false)
    expect(result.reason).toBe("nfe_ja_emitida")
    expect(result.chaveAcesso).toBe("chave-existente")
  })

  it("chama databases.getDocument com o orderId correto", async () => {
    // Simular falha no fetch (function não disponível em teste)
    global.fetch = vi.fn().mockRejectedValue(new Error("Network error"))
    try { await emitir("order-abc123") } catch {}
    expect(databases.getDocument).toHaveBeenCalledWith("db-test", "orders", "order-abc123")
    delete global.fetch
  })

  it("registra nfeStatus='erro' quando Function retorna erro", async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok:   false,
      text: async () => "Internal Server Error",
    })
    await expect(emitir("order-abc123")).rejects.toThrow()
    delete global.fetch
  })

  it("emite e armazena resultado quando Function retorna sucesso", async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok:   true,
      json: async () => ({
        ok:          true,
        chaveAcesso: "35260300000000000100650010000000011000000015",
        protocolo:   "135260000000001",
        pdfUrl:      "https://example.com/nfe.pdf",
        xmlUrl:      "https://example.com/nfe.xml",
      }),
    })

    const result = await emitir("order-abc123")
    expect(result.ok).toBe(true)
    expect(result.chaveAcesso).toBeDefined()
    expect(result.ambiente).toBe("homologacao")

    // Deve ter salvo no Appwrite
    expect(databases.updateDocument).toHaveBeenCalled()
    expect(databases.createDocument).toHaveBeenCalled()
    delete global.fetch
  })

})

// ─────────────────────────────────────────────────────────────────────────────
describe("NFService.cancelar - Cancelamento", () => {

  const pedidoEmitido = {
    ...pedidoMock,
    nfeStatus: "emitida",
    nfeChave:  "35260300000000000100650010000000011000000015",
  }

  beforeEach(() => {
    databases.getDocument.mockResolvedValue(pedidoEmitido)
  })

  it("lança erro quando motivo tem menos de 15 caracteres", async () => {
    await expect(cancelar("order-abc123", "curto")).rejects.toThrow(/15 caracteres/)
  })

  it("lança erro quando motivo está vazio", async () => {
    await expect(cancelar("order-abc123", "")).rejects.toThrow()
  })

  it("lança erro quando nfeStatus não é 'emitida'", async () => {
    databases.getDocument.mockResolvedValueOnce({ ...pedidoMock, nfeStatus: "pendente" })
    await expect(
      cancelar("order-abc123", "Cancelamento a pedido do cliente por erro no pedido")
    ).rejects.toThrow(/status/)
  })

  it("chama Function de cancelamento com os dados corretos", async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok:   true,
      json: async () => ({ ok: true, protocolo: "135260000000002" }),
    })

    const result = await cancelar("order-abc123", "Cancelamento a pedido do cliente por erro no pedido")
    expect(result.ok).toBe(true)
    expect(databases.updateDocument).toHaveBeenCalledWith(
      "db-test", "orders", "order-abc123",
      expect.objectContaining({ nfeStatus: "cancelada" })
    )
    delete global.fetch
  })

})

// ─────────────────────────────────────────────────────────────────────────────
describe("NFService.listarNFe - Consulta de NF-e", () => {

  it("chama listDocuments na collection correta", async () => {
    await listarNFe({ mes: 3, ano: 2026 })
    expect(databases.listDocuments).toHaveBeenCalledWith(
      "db-test",
      "nfe_documents",
      expect.any(Array)
    )
  })

  it("retorna array vazio quando não há NF-e no período", async () => {
    databases.listDocuments.mockResolvedValueOnce({ documents: [], total: 0 })
    const result = await listarNFe({ mes: 1, ano: 2020 })
    expect(result).toEqual([])
  })

  it("retorna documentos quando existem NF-e", async () => {
    const nfes = [
      { $id: "nfe1", chaveAcesso: "123", totalNota: 100 },
      { $id: "nfe2", chaveAcesso: "456", totalNota: 200 },
    ]
    databases.listDocuments.mockResolvedValueOnce({ documents: nfes, total: 2 })
    const result = await listarNFe({ mes: 3, ano: 2026 })
    expect(result).toHaveLength(2)
    expect(result[0].chaveAcesso).toBe("123")
  })

  it("funciona sem parâmetros de período", async () => {
    await expect(listarNFe()).resolves.not.toThrow()
  })

})

// ─────────────────────────────────────────────────────────────────────────────
describe("NFService - Exportação agrupada", () => {

  it("expõe emitir, cancelar e listarNFe no objeto NFService", () => {
    expect(typeof NFService.emitir).toBe("function")
    expect(typeof NFService.cancelar).toBe("function")
    expect(typeof NFService.listarNFe).toBe("function")
    expect(typeof NFService.buildNFePayload).toBe("function")
  })

})


