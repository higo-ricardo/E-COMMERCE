// â”€â”€â”€ HIVERCAR Â· tests/cartService.test.js â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
// US-26 Â· Task 3: Testes para CartService
//   - add(), remove(), setQty(), total(), count(), clear(), get()
//
// CartService usa localStorage â†’ ambiente jsdom via configuraÃ§Ã£o por arquivo.
// @vitest-environment jsdom

import { describe, it, expect, beforeEach } from "vitest"

// â”€â”€ Mock do config.js â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
// config.js usa CONFIG.STORE.CART_KEY para a chave do localStorage.
// NÃ£o precisamos mockar porque o jsdom jÃ¡ fornece localStorage.

import { CartService } from "../js/cartService.js"

// â”€â”€ Produto de exemplo â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
const prodA = { $id: "pid-001", name: "Pastilha Brembo", price: 89.90, category: "Freios" }
const prodB = { $id: "pid-002", name: "Filtro de Ar",    price: 35.50, category: "Motor"  }
const prodC = { $id: "pid-003", name: "Ã“leo 5W30",       price: 45.00, category: "Lubrificantes" }

// â”€â”€ Limpa o carrinho antes de cada teste â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
beforeEach(() => {
  CartService.clear()
})

// â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
describe("CartService.get()", () => {
  it("retorna array vazio quando o carrinho estÃ¡ limpo", () => {
    expect(CartService.get()).toEqual([])
  })

  it("retorna os itens apÃ³s adicionar produtos", () => {
    CartService.add(prodA)
    const cart = CartService.get()
    expect(cart).toHaveLength(1)
    expect(cart[0].$id).toBe("pid-001")
  })
})

// â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
describe("CartService.add()", () => {
  it("adiciona um produto novo com qty=1", () => {
    CartService.add(prodA)
    const cart = CartService.get()
    expect(cart).toHaveLength(1)
    expect(cart[0].qty).toBe(1)
    expect(cart[0].name).toBe("Pastilha Brembo")
  })

  it("incrementa qty quando produto jÃ¡ existe no carrinho", () => {
    CartService.add(prodA)
    CartService.add(prodA)
    CartService.add(prodA)
    const cart = CartService.get()
    expect(cart).toHaveLength(1)     // ainda 1 linha
    expect(cart[0].qty).toBe(3)      // qty = 3
  })

  it("adiciona mÃºltiplos produtos distintos", () => {
    CartService.add(prodA)
    CartService.add(prodB)
    CartService.add(prodC)
    expect(CartService.get()).toHaveLength(3)
  })

  it("nÃ£o muta o objeto original do produto", () => {
    const original = { ...prodA }
    CartService.add(prodA)
    expect(prodA.qty).toBeUndefined()  // original nÃ£o deve ter qty
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

// â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
describe("CartService.remove()", () => {
  it("remove o item pelo Ã­ndice correto", () => {
    CartService.add(prodA)
    CartService.add(prodB)
    CartService.add(prodC)

    CartService.remove(1)   // remove prodB (Ã­ndice 1)
    const cart = CartService.get()
    expect(cart).toHaveLength(2)
    expect(cart.find(i => i.$id === "pid-002")).toBeUndefined()
  })

  it("remove o Ãºnico item e deixa carrinho vazio", () => {
    CartService.add(prodA)
    CartService.remove(0)
    expect(CartService.get()).toHaveLength(0)
  })

  it("nÃ£o quebra ao remover Ã­ndice inexistente", () => {
    CartService.add(prodA)
    // splice com Ã­ndice alÃ©m do tamanho â†’ nÃ£o remove nada, nÃ£o lanÃ§a
    expect(() => CartService.remove(99)).not.toThrow()
    // O item original ainda existe (splice de 0 elementos nÃ£o remove)
    // comportamento de Array.splice â€” nÃ£o Ã© erro
  })
})

// â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
describe("CartService.setQty()", () => {
  it("atualiza a quantidade de um item pelo Ã­ndice", () => {
    CartService.add(prodA)
    CartService.setQty(0, 5)
    expect(CartService.get()[0].qty).toBe(5)
  })

  it("forÃ§a quantidade mÃ­nima de 1 (nÃ£o permite 0 ou negativo)", () => {
    CartService.add(prodA)
    CartService.setQty(0, 0)
    expect(CartService.get()[0].qty).toBe(1)

    CartService.setQty(0, -10)
    expect(CartService.get()[0].qty).toBe(1)
  })

  it("nÃ£o altera outros itens ao mudar qty de um", () => {
    CartService.add(prodA)
    CartService.add(prodB)
    CartService.setQty(0, 7)
    expect(CartService.get()[1].qty).toBe(1)  // prodB nÃ£o mudou
  })

  it("nÃ£o faz nada para Ã­ndice invÃ¡lido (sem exceÃ§Ã£o)", () => {
    CartService.add(prodA)
    expect(() => CartService.setQty(99, 5)).not.toThrow()
    expect(CartService.get()[0].qty).toBe(1)  // prodA inalterado
  })
})

// â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
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
    CartService.setQty(0, 3)  // 89.90 Ã— 3 = 269.70
    expect(CartService.total()).toBeCloseTo(269.70)
  })

  it("soma mÃºltiplos produtos com quantidades diferentes", () => {
    CartService.add(prodA)          // 89.90 Ã— 1
    CartService.add(prodB)          // 35.50 Ã— 1
    CartService.add(prodC)          // 45.00 Ã— 1
    CartService.setQty(0, 2)        // 89.90 Ã— 2 = 179.80
    // Total: 179.80 + 35.50 + 45.00 = 260.30
    expect(CartService.total()).toBeCloseTo(260.30)
  })
})

// â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
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

// â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
describe("CartService.clear()", () => {
  it("esvazia o carrinho completamente", () => {
    CartService.add(prodA)
    CartService.add(prodB)
    CartService.clear()
    expect(CartService.get()).toEqual([])
    expect(CartService.count()).toBe(0)
    expect(CartService.total()).toBe(0)
  })

  it("nÃ£o lanÃ§a erro quando o carrinho jÃ¡ estÃ¡ vazio", () => {
    expect(() => CartService.clear()).not.toThrow()
  })
})

// â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
describe("PersistÃªncia no localStorage", () => {
  it("mantÃ©m os dados apÃ³s recriar o serviÃ§o (simula reload)", () => {
    // Adiciona produto
    CartService.add(prodA)
    CartService.setQty(0, 3)

    // LÃª direto do localStorage (como se fosse um reload)
    const raw  = localStorage.getItem("hiverCart")
    const data = JSON.parse(raw)
    expect(data).toHaveLength(1)
    expect(data[0].qty).toBe(3)
    expect(data[0].$id).toBe("pid-001")
  })

  it("suporta JSON corrompido sem travar", () => {
    // Injeta valor invÃ¡lido no localStorage
    localStorage.setItem("hiverCart", "INVALIDO###")
    // CartService deve retornar array vazio ao invÃ©s de lanÃ§ar
    expect(CartService.get()).toEqual([])
  })
})


