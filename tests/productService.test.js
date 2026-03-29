// ─── HIVERCAR · tests/productService.test.js ─────────────────────────────────
// US-26: Testes para ProductService (Domain/Service)
//   - list()            → paginação, usa cache
//   - search()          → busca com termo, usa cache
//   - getFilterOptions()→ categorias e marcas, usa cache
//   - invalidateCache() → limpa todo o cache
//   - cacheStats()      → inspeciona o cache

import { describe, it, expect, vi, beforeEach } from "vitest"

// ── Mock ProductRepository ───────────────────────────────────────────────────
vi.mock("../js/productRepository.js", () => ({
  ProductRepository: {
    list:             vi.fn(),
    search:           vi.fn(),
    getFilterOptions: vi.fn(),
  },
}))

// ── Mock config para TTL controlável ─────────────────────────────────────────
vi.mock("../js/config.js", () => ({
  CONFIG: {
    STORE: {
      PAGE_SIZE: 15,
      CACHE_TTL: 5000,    // 5s nos testes (ao invés de 5 min)
      CART_KEY:  "hiverCart",
    },
    TAX_RATE:   0.12,
    ENDPOINT:   "https://test.appwrite.io/v1",
    PROJECT_ID: "test-project",
    DB:         "test-db",
    COL: {
      PRODUCTS:      "produtos",
      ORDERS:        "orders",
      CUSTOMERS:     "customers",
      SERVICE_ORDERS:"service_orders",
      PROFILES:      "profiles",
      CATEGORIES:    "categories",
      USERS:         "users",
      ORDER_HISTORY: "order_history",
      STOCK_HISTORY: "stock_history",
      OS_HISTORY:    "os_history",
    },
    AUTH: {
      BLOCK_5: 1800000, BLOCK_10: 3600000,
      DISABLE_AT: 15,   UI_LOCK_MS: 900000,
    },
    ORDER_STATUS_FLOW: {
      novo: ["confirmado","cancelado"],
      confirmado: ["em_preparo","cancelado"],
      em_preparo: ["enviado"],
      enviado: ["entregue"],
      entregue: [], cancelado: [],
    },
    WHATSAPP: "5598981168787",
  },
}))

import { ProductService }    from "../js/productService.js"
import { ProductRepository } from "../js/productRepository.js"

// ── Dados de exemplo ──────────────────────────────────────────────────────────
const PAGE_RESULT = {
  products: [
    { $id: "p1", name: "Pastilha Brembo", category: "Freios", brand: "Brembo", price: 89.90, qtd: 10 },
    { $id: "p2", name: "Filtro Mann",     category: "Motor",  brand: "Mann",   price: 35.50, qtd: 3  },
  ],
  total: 2,
  pages: 1,
  page:  1,
}

const FILTER_OPTIONS = {
  categories: ["Freios", "Motor"],
  brands:     ["Brembo", "Mann"],
}

beforeEach(() => {
  vi.clearAllMocks()
  ProductService.invalidateCache()   // garante cache limpo entre testes
})

// ─────────────────────────────────────────────────────────────────────────────
describe("ProductService.list()", () => {

  it("chama ProductRepository.list na primeira requisição (cache miss)", async () => {
    ProductRepository.list.mockResolvedValue(PAGE_RESULT)

    const result = await ProductService.list(1, {})

    expect(ProductRepository.list).toHaveBeenCalledTimes(1)
    expect(ProductRepository.list).toHaveBeenCalledWith(1, {})
    expect(result.products).toHaveLength(2)
  })

  it("retorna resultado do cache na segunda requisição (cache hit)", async () => {
    ProductRepository.list.mockResolvedValue(PAGE_RESULT)

    await ProductService.list(1, {})  // popula cache
    await ProductService.list(1, {})  // deve usar cache

    // Repository chamado APENAS na primeira vez
    expect(ProductRepository.list).toHaveBeenCalledTimes(1)
  })

  it("chaves de cache distintas para páginas diferentes", async () => {
    const page2 = { ...PAGE_RESULT, page: 2 }
    ProductRepository.list
      .mockResolvedValueOnce(PAGE_RESULT)
      .mockResolvedValueOnce(page2)

    await ProductService.list(1, {})
    await ProductService.list(2, {})

    expect(ProductRepository.list).toHaveBeenCalledTimes(2)
    expect(ProductRepository.list).toHaveBeenNthCalledWith(1, 1, {})
    expect(ProductRepository.list).toHaveBeenNthCalledWith(2, 2, {})
  })

  it("chaves de cache distintas para filtros diferentes", async () => {
    ProductRepository.list.mockResolvedValue(PAGE_RESULT)

    await ProductService.list(1, { category: "Freios" })
    await ProductService.list(1, { brand: "Brembo" })

    // Filtros diferentes → duas chamadas ao repositório
    expect(ProductRepository.list).toHaveBeenCalledTimes(2)
  })

  it("propaga erros do repositório sem envolver no cache", async () => {
    ProductRepository.list.mockRejectedValue(new Error("DB offline"))

    await expect(ProductService.list()).rejects.toThrow("DB offline")

    // Cache deve continuar vazio após o erro
    const stats = ProductService.cacheStats()
    expect(stats.entries).toBe(0)
  })
})

// ─────────────────────────────────────────────────────────────────────────────
describe("ProductService.search()", () => {

  it("chama ProductRepository.search com o termo correto", async () => {
    ProductRepository.search.mockResolvedValue(PAGE_RESULT)

    await ProductService.search("brembo")

    expect(ProductRepository.search).toHaveBeenCalledWith("brembo", 1, {})
  })

  it("delega para list() quando o termo está vazio", async () => {
    ProductRepository.list.mockResolvedValue(PAGE_RESULT)

    await ProductService.search("")

    expect(ProductRepository.list).toHaveBeenCalledTimes(1)
    expect(ProductRepository.search).not.toHaveBeenCalled()
  })

  it("ignora espaços em branco no termo (trim)", async () => {
    ProductRepository.list.mockResolvedValue(PAGE_RESULT)

    await ProductService.search("   ")  // só espaços → lista normal

    expect(ProductRepository.list).toHaveBeenCalledTimes(1)
    expect(ProductRepository.search).not.toHaveBeenCalled()
  })

  it("armazena resultado no cache e reutiliza na mesma query", async () => {
    ProductRepository.search.mockResolvedValue(PAGE_RESULT)

    await ProductService.search("filtro", 1, {})
    await ProductService.search("filtro", 1, {})

    expect(ProductRepository.search).toHaveBeenCalledTimes(1)
  })

  it("chaves de cache distintas para termos diferentes", async () => {
    ProductRepository.search.mockResolvedValue(PAGE_RESULT)

    await ProductService.search("pastilha")
    await ProductService.search("filtro")

    expect(ProductRepository.search).toHaveBeenCalledTimes(2)
  })
})

// ─────────────────────────────────────────────────────────────────────────────
describe("ProductService.getFilterOptions()", () => {

  it("retorna categorias e marcas do repositório", async () => {
    ProductRepository.getFilterOptions.mockResolvedValue(FILTER_OPTIONS)

    const opts = await ProductService.getFilterOptions()

    expect(opts.categories).toEqual(["Freios", "Motor"])
    expect(opts.brands).toEqual(["Brembo", "Mann"])
    expect(ProductRepository.getFilterOptions).toHaveBeenCalledTimes(1)
  })

  it("armazena filtros no cache com chave própria", async () => {
    ProductRepository.getFilterOptions.mockResolvedValue(FILTER_OPTIONS)

    await ProductService.getFilterOptions()
    await ProductService.getFilterOptions()

    expect(ProductRepository.getFilterOptions).toHaveBeenCalledTimes(1)
  })
})

// ─────────────────────────────────────────────────────────────────────────────
describe("ProductService.invalidateCache()", () => {

  it("força nova requisição ao repositório após invalidação", async () => {
    ProductRepository.list.mockResolvedValue(PAGE_RESULT)

    await ProductService.list(1, {})           // popula cache
    ProductService.invalidateCache()           // limpa cache
    await ProductService.list(1, {})           // deve chamar repositório de novo

    expect(ProductRepository.list).toHaveBeenCalledTimes(2)
  })

  it("invalida entradas de search e filterOptions também", async () => {
    ProductRepository.search.mockResolvedValue(PAGE_RESULT)
    ProductRepository.getFilterOptions.mockResolvedValue(FILTER_OPTIONS)

    await ProductService.search("teste")
    await ProductService.getFilterOptions()

    ProductService.invalidateCache()

    await ProductService.search("teste")
    await ProductService.getFilterOptions()

    expect(ProductRepository.search).toHaveBeenCalledTimes(2)
    expect(ProductRepository.getFilterOptions).toHaveBeenCalledTimes(2)
  })

  it("não quebra quando o cache já está vazio", () => {
    expect(() => ProductService.invalidateCache()).not.toThrow()
  })
})

// ─────────────────────────────────────────────────────────────────────────────
describe("ProductService.cacheStats()", () => {

  it("retorna entries=0 com cache vazio", () => {
    const stats = ProductService.cacheStats()
    expect(stats.entries).toBe(0)
    expect(stats.keys).toEqual([])
  })

  it("reflete número correto de entradas no cache", async () => {
    ProductRepository.list.mockResolvedValue(PAGE_RESULT)
    ProductRepository.search.mockResolvedValue(PAGE_RESULT)

    await ProductService.list(1, {})
    await ProductService.search("filtro")

    const stats = ProductService.cacheStats()
    expect(stats.entries).toBe(2)
  })

  it("entries volta a 0 após invalidar", async () => {
    ProductRepository.list.mockResolvedValue(PAGE_RESULT)
    await ProductService.list(1, {})

    ProductService.invalidateCache()

    expect(ProductService.cacheStats().entries).toBe(0)
  })

  it("retorna debugOn como boolean", () => {
    const stats = ProductService.cacheStats()
    expect(typeof stats.debugOn).toBe("boolean")
  })
})

// ─────────────────────────────────────────────────────────────────────────────
describe("ProductService - comportamento de TTL do cache", () => {

  it("reusa cache dentro do TTL", async () => {
    ProductRepository.list.mockResolvedValue(PAGE_RESULT)

    await ProductService.list(1, {})
    await ProductService.list(1, {})  // dentro do TTL (5s do mock)

    expect(ProductRepository.list).toHaveBeenCalledTimes(1)
  })

  it("invalida e rebusca após TTL expirado (usando Date.now mock)", async () => {
    // Controla Date.now para simular passagem de tempo
    const now = Date.now()
    let fakeNow = now

    vi.spyOn(Date, "now").mockImplementation(() => fakeNow)
    ProductRepository.list.mockResolvedValue(PAGE_RESULT)

    await ProductService.list(1, {})        // popula cache no tempo T

    fakeNow = now + 10_000                  // avança 10s (> TTL de 5s)
    await ProductService.list(1, {})        // cache expirado → nova requisição

    expect(ProductRepository.list).toHaveBeenCalledTimes(2)

    vi.restoreAllMocks()
  })
})


