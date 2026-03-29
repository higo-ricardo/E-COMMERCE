// ─── HIVERCAR · tests/orderService.test.js ───────────────────────────────────
// US-26 · Task 4: Testes para OrderService
//   - Cálculo de subtotal, taxes (TAX_RATE=12%), total com frete
//   - placeOrder() - mock CartService + OrderRepository
//
// @vitest-environment jsdom

import { describe, it, expect, vi, beforeEach } from "vitest"

// ── Mocks ─────────────────────────────────────────────────────────────────────

// Mock appwriteClient (necessário para orderRepository.js)
vi.mock("../js/appwriteClient.js", () => ({
  databases: {
    listDocuments:   vi.fn(),
    getDocument:     vi.fn(),
    createDocument:  vi.fn(),
    updateDocument:  vi.fn(),
  },
  Query: { equal: vi.fn(), limit: vi.fn(), offset: vi.fn(), orderDesc: vi.fn() },
  ID:    { unique: vi.fn(() => "order-mock-id") },
}))

// Mock OrderRepository - isola o serviço do banco de dados
vi.mock("../js/orderRepository.js", () => ({
  OrderRepository: {
    create: vi.fn(async (data) => ({ $id: "order-mock-id", ...data })),
  },
}))

import { CartService }     from "../js/cartService.js"
import { OrderService }    from "../js/orderService.js"
import { OrderRepository } from "../js/orderRepository.js"

// ── Produtos de exemplo ───────────────────────────────────────────────────────
const prodA = { $id: "pid-001", name: "Pastilha",  price: 100.00 }
const prodB = { $id: "pid-002", name: "Filtro",    price: 50.00  }

// ── Setup: limpa carrinho antes de cada teste ─────────────────────────────────
beforeEach(() => {
  CartService.clear()
  vi.clearAllMocks()
  OrderRepository.create.mockResolvedValue({ $id: "order-mock-id" })
})

// ─────────────────────────────────────────────────────────────────────────────
describe("OrderService - Cálculo de valores", () => {

  it("calcula subtotal corretamente para 1 item qty=1", async () => {
    CartService.add(prodA)   // R$ 100.00
    const customerData = { name: "João", cpf: "000.000.000-00", email: "j@j.com" }

    await OrderService.placeOrder(customerData, 0, "pix")

    const call = OrderRepository.create.mock.calls[0][0]
    expect(call.subtotal).toBeCloseTo(100.00)
  })

  it("calcula subtotal para múltiplos itens e quantidades", async () => {
    CartService.add(prodA)          // 100.00 Ã- 1
    CartService.add(prodB)          // 50.00  Ã- 1
    CartService.setQty(0, 2)        // prodA qty=2 → 200.00
    // subtotal = 200.00 + 50.00 = 250.00

    await OrderService.placeOrder({}, 0, "pix")

    const call = OrderRepository.create.mock.calls[0][0]
    expect(call.subtotal).toBeCloseTo(250.00)
  })

  it("calcula taxes como 12% do subtotal (CONFIG.TAX_RATE)", async () => {
    CartService.add(prodA)   // R$ 100.00
    await OrderService.placeOrder({}, 0, "pix")

    const call = OrderRepository.create.mock.calls[0][0]
    // taxes = 100.00 Ã- 0.12 = 12.00
    expect(call.taxes).toBeCloseTo(12.00)
  })

  it("total = subtotal + taxes + frete", async () => {
    CartService.add(prodA)   // subtotal 100.00
    // taxes   = 100.00 Ã- 0.12 = 12.00
    // frete   = 15.00
    // total   = 100.00 + 12.00 + 15.00 = 127.00
    await OrderService.placeOrder({}, 15, "pix")

    const call = OrderRepository.create.mock.calls[0][0]
    expect(call.total).toBeCloseTo(127.00)
  })

  it("total sem frete = subtotal + taxes", async () => {
    CartService.add(prodB)   // 50.00
    // taxes = 50.00 Ã- 0.12 = 6.00
    // total = 50.00 + 6.00 = 56.00
    await OrderService.placeOrder({}, 0, "pix")

    const call = OrderRepository.create.mock.calls[0][0]
    expect(call.total).toBeCloseTo(56.00)
  })

  it("arredonda taxes e total para 2 casas decimais", async () => {
    // 3 Ã- R$33.33 = 99.99
    const prodX = { $id: "pid-x", name: "X", price: 33.33 }
    CartService.add(prodX)
    CartService.setQty(0, 3)   // subtotal = 99.99

    await OrderService.placeOrder({}, 0, "pix")

    const call = OrderRepository.create.mock.calls[0][0]
    // taxes = 99.99 Ã- 0.12 = 11.9988 → 12.00 (2 casas)
    // total deve ter no máximo 2 casas decimais
    const decimalCases = (String(call.total).split(".")[1] || '-').length
    expect(decimalCases).toBeLessThanOrEqual(2)
  })

  it("status inicial do pedido é sempre 'novo'", async () => {
    CartService.add(prodA)
    await OrderService.placeOrder({}, 0, "pix")

    const call = OrderRepository.create.mock.calls[0][0]
    expect(call.status).toBe("novo")
  })

  it("registra o método de pagamento corretamente", async () => {
    CartService.add(prodA)
    await OrderService.placeOrder({}, 0, "cartao")

    const call = OrderRepository.create.mock.calls[0][0]
    expect(call.payment).toBe("cartao")
  })

  it("serializa os itens do carrinho como JSON string", async () => {
    CartService.add(prodA)
    await OrderService.placeOrder({}, 0, "pix")

    const call = OrderRepository.create.mock.calls[0][0]
    expect(typeof call.items).toBe("string")
    const parsed = JSON.parse(call.items)
    expect(parsed).toBeInstanceOf(Array)
    expect(parsed[0].$id).toBe("pid-001")
  })
})

// ─────────────────────────────────────────────────────────────────────────────
describe("OrderService.placeOrder() - comportamento", () => {

  it("lança Error quando o carrinho está vazio", async () => {
    // Carrinho vazio (beforeEach já chamou clear())
    await expect(
      OrderService.placeOrder({ name: "Ana" }, 0, "pix")
    ).rejects.toThrow(/carrinho vazio/i)
  })

  it("limpa o carrinho após criar o pedido com sucesso", async () => {
    CartService.add(prodA)
    expect(CartService.count()).toBe(1)

    await OrderService.placeOrder({}, 0, "pix")

    expect(CartService.count()).toBe(0)
    expect(CartService.get()).toEqual([])
  })

  it("inclui customerData no payload do pedido", async () => {
    CartService.add(prodA)
    const customer = {
      name:    "Maria Silva",
      cpf:     "123.456.789-00",
      email:   "maria@mail.com",
      address: "Rua das Flores, 100",
    }

    await OrderService.placeOrder(customer, 0, "boleto")

    const call = OrderRepository.create.mock.calls[0][0]
    expect(call.name).toBe("Maria Silva")
    expect(call.cpf).toBe("123.456.789-00")
    expect(call.email).toBe("maria@mail.com")
    expect(call.payment).toBe("boleto")
  })

  it("chama OrderRepository.create exatamente uma vez", async () => {
    CartService.add(prodA)
    await OrderService.placeOrder({}, 0, "pix")
    expect(OrderRepository.create).toHaveBeenCalledTimes(1)
  })

  it("retorna o objeto do pedido salvo pelo repository", async () => {
    CartService.add(prodA)
    const result = await OrderService.placeOrder({}, 0, "pix")
    expect(result.$id).toBe("order-mock-id")
  })

  it("não limpa o carrinho se o repository falhar", async () => {
    CartService.add(prodA)
    OrderRepository.create.mockRejectedValueOnce(new Error("DB offline"))

    await expect(OrderService.placeOrder({}, 0, "pix")).rejects.toThrow("DB offline")

    // Carrinho NÃO deve ser limpo em caso de erro
    expect(CartService.count()).toBe(1)
  })

  it("registra o frete corretamente no payload", async () => {
    CartService.add(prodA)
    await OrderService.placeOrder({}, 29.90, "pix")

    const call = OrderRepository.create.mock.calls[0][0]
    expect(call.frete).toBe(29.90)
  })

  it("usa frete=0 por padrão quando não informado", async () => {
    CartService.add(prodA)
    await OrderService.placeOrder({})  // sem frete e sem payment

    const call = OrderRepository.create.mock.calls[0][0]
    expect(call.frete).toBe(0)
  })
})

// ─────────────────────────────────────────────────────────────────────────────
describe("OrderService - Cálculos com valores extremos", () => {

  it("funciona com produtos de preço zero", async () => {
    const prodGratis = { $id: "pid-gratis", name: "Brinde", price: 0 }
    CartService.add(prodGratis)

    const result = await OrderService.placeOrder({}, 0, "pix")
    const call   = OrderRepository.create.mock.calls[0][0]

    expect(call.subtotal).toBe(0)
    expect(call.taxes).toBe(0)
    expect(call.total).toBe(0)
  })

  it("funciona com quantidade muito alta (100 itens)", async () => {
    CartService.add(prodA)
    CartService.setQty(0, 100)  // 100 Ã- 100.00 = 10.000

    await OrderService.placeOrder({}, 0, "pix")

    const call = OrderRepository.create.mock.calls[0][0]
    expect(call.subtotal).toBeCloseTo(10000.00)
    expect(call.taxes).toBeCloseTo(1200.00)
    expect(call.total).toBeCloseTo(11200.00)
  })
})


