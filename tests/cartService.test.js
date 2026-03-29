// ─── HIVERCAR · tests/cartService.test.js ────────────────────────────────────
// US-26 · Task 3: Testes para CartService
//   - add(), remove(), setQty(), total(), count(), clear(), get()
//
// CartService usa localStorage → ambiente jsdom via configuração por arquivo.
// @vitest-environment jsdom

import { describe, it, expect, beforeEach } from "vitest"

// ── Mock do config.js ─────────────────────────────────────────────────────────
// config.js usa CONFIG.STORE.CART_KEY para a chave do localStorage.
// Não precisamos mockar porque o jsdom já fornece localStorage.

import { CartService } from "../js/cartService.js"

// ── Produto de exemplo ────────────────────────────────────────────────────────
const prodA = { $id: "pid-001", name: "Pastilha Brembo", price: 89.90, category: "Freios" }
const prodB = { $id: "pid-002", name: "Filtro de Ar",    price: 35.50, category: "Motor"  }
const prodC = { $id: "pid-003", name: "Óleo 5W30",       price: 45.00, category: "Lubrificantes" }

// ── Limpa o carrinho antes de cada teste ──────────────────────────────────────
beforeEach(() => {
  CartService.clear()
})

// ─────────────────────────────────────────────────────────────────────────────
describe("CartService.get()", () => {
  it("retorna array vazio quando o carrinho está limpo", () => {
    expect(CartService.get()).toEqual([])
  })

  it("retorna os itens após adicionar produtos", () => {
    CartService.add(prodA)
    const cart = CartService.get()
    expect(cart).toHaveLength(1)
    expect(cart[0].$id).toBe("pid-001")
  })
})

// ─────────────────────────────────────────────────────────────────────────────
describe("CartService.add()", () => {
  it("adiciona um produto novo com qty=1", () => {
    CartService.add(prodA)
    const cart = CartService.get()
    expect(cart).toHaveLength(1)
    expect(cart[0].qty).toBe(1)
    expect(cart[0].name).toBe("Pastilha Brembo")
  })

  it("incrementa qty quando produto já existe no carrinho", () => {
    CartService.add(prodA)
    CartService.add(prodA)
    CartService.add(prodA)
    const cart = CartService.get()
    expect(cart).toHaveLength(1)     // ainda 1 linha
    expect(cart[0].qty).toBe(3)      // qty = 3
  })

  it("adiciona múltiplos produtos distintos", () => {
    CartService.add(prodA)
    CartService.add(prodB)
    CartService.add(prodC)
    expect(CartService.get()).toHaveLength(3)
  })

  it("não muta o objeto original do produto", () => {
    const original = { ...prodA }
    CartService.add(prodA)
    expect(prodA.qty).toBeUndefined()  // original não deve ter qty
    expect(prodA).toEqual(original)
  })

  it("preserva todos os campos do produto ao adicionar", () => {
    CartService.add(prodA)
    const item = CartService.get()[0]
    expect(item.$id).toBe(prodA.$id)
    expect(item.name).toBe(prodA.name)
    expect(item.price).toBe(prodA.price)
    expect(item.category).toBe(prodA.category)
  })
})

// ─────────────────────────────────────────────────────────────────────────────
describe("CartService.remove()", () => {
  it("remove o item pelo índice correto", () => {
    CartService.add(prodA)
    CartService.add(prodB)
    CartService.add(prodC)

    CartService.remove(1)   // remove prodB (índice 1)
    const cart = CartService.get()
    expect(cart).toHaveLength(2)
    expect(cart.find(i => i.$id === "pid-002")).toBeUndefined()
  })

  it("remove o único item e deixa carrinho vazio", () => {
    CartService.add(prodA)
    CartService.remove(0)
    expect(CartService.get()).toHaveLength(0)
  })

  it("não quebra ao remover índice inexistente", () => {
    CartService.add(prodA)
    // splice com índice além do tamanho → não remove nada, não lança
    expect(() => CartService.remove(99)).not.toThrow()
    // O item original ainda existe (splice de 0 elementos não remove)
    // comportamento de Array.splice - não é erro
  })
})

// ─────────────────────────────────────────────────────────────────────────────
describe("CartService.setQty()", () => {
  it("atualiza a quantidade de um item pelo índice", () => {
    CartService.add(prodA)
    CartService.setQty(0, 5)
    expect(CartService.get()[0].qty).toBe(5)
  })

  it("força quantidade mínima de 1 (não permite 0 ou negativo)", () => {
    CartService.add(prodA)
    CartService.setQty(0, 0)
    expect(CartService.get()[0].qty).toBe(1)

    CartService.setQty(0, -10)
    expect(CartService.get()[0].qty).toBe(1)
  })

  it("não altera outros itens ao mudar qty de um", () => {
    CartService.add(prodA)
    CartService.add(prodB)
    CartService.setQty(0, 7)
    expect(CartService.get()[1].qty).toBe(1)  // prodB não mudou
  })

  it("não faz nada para índice inválido (sem exceção)", () => {
    CartService.add(prodA)
    expect(() => CartService.setQty(99, 5)).not.toThrow()
    expect(CartService.get()[0].qty).toBe(1)  // prodA inalterado
  })
})

// ─────────────────────────────────────────────────────────────────────────────
describe("CartService.total()", () => {
  it("retorna 0 para carrinho vazio", () => {
    expect(CartService.total()).toBe(0)
  })

  it("calcula total correto com um produto qty=1", () => {
    CartService.add(prodA)   // 89.90
    expect(CartService.total()).toBeCloseTo(89.90)
  })

  it("calcula total considerando qty > 1", () => {
    CartService.add(prodA)
    CartService.setQty(0, 3)  // 89.90 Ã- 3 = 269.70
    expect(CartService.total()).toBeCloseTo(269.70)
  })

  it("soma múltiplos produtos com quantidades diferentes", () => {
    CartService.add(prodA)          // 89.90 Ã- 1
    CartService.add(prodB)          // 35.50 Ã- 1
    CartService.add(prodC)          // 45.00 Ã- 1
    CartService.setQty(0, 2)        // 89.90 Ã- 2 = 179.80
    // Total: 179.80 + 35.50 + 45.00 = 260.30
    expect(CartService.total()).toBeCloseTo(260.30)
  })
})

// ─────────────────────────────────────────────────────────────────────────────
describe("CartService.count()", () => {
  it("retorna 0 para carrinho vazio", () => {
    expect(CartService.count()).toBe(0)
  })

  it("retorna quantidade total de itens (somando qty)", () => {
    CartService.add(prodA)           // qty=1
    CartService.add(prodB)           // qty=1
    CartService.setQty(0, 4)         // prodA qty=4
    expect(CartService.count()).toBe(5)  // 4 + 1
  })
})

// ─────────────────────────────────────────────────────────────────────────────
describe("CartService.clear()", () => {
  it("esvazia o carrinho completamente", () => {
    CartService.add(prodA)
    CartService.add(prodB)
    CartService.clear()
    expect(CartService.get()).toEqual([])
    expect(CartService.count()).toBe(0)
    expect(CartService.total()).toBe(0)
  })

  it("não lança erro quando o carrinho já está vazio", () => {
    expect(() => CartService.clear()).not.toThrow()
  })
})

// ─────────────────────────────────────────────────────────────────────────────
describe("Persistência no localStorage", () => {
  it("mantém os dados após recriar o serviço (simula reload)", () => {
    // Adiciona produto
    CartService.add(prodA)
    CartService.setQty(0, 3)

    // Lê direto do localStorage (como se fosse um reload)
    const raw  = localStorage.getItem("hiverCart")
    const data = JSON.parse(raw)
    expect(data).toHaveLength(1)
    expect(data[0].qty).toBe(3)
    expect(data[0].$id).toBe("pid-001")
  })

  it("suporta JSON corrompido sem travar", () => {
    // Injeta valor inválido no localStorage
    localStorage.setItem("hiverCart", "INVALIDO###")
    // CartService deve retornar array vazio ao invés de lançar
    expect(CartService.get()).toEqual([])
  })
})


