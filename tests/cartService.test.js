// tests/cartService.test.js
// Testes para js/cartService.js - serviço do carrinho

import { CartService } from '../js/cartService.js';

const CART_KEY = 'hiverCart';
const COUPON_KEY = 'hiverCart_coupon';

describe('CartService', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  // ── get / add / count / total ────────────────────────────────────────────
  describe('get, add, count, total', () => {
    test('retorna array vazio para carrinho vazio', () => {
      expect(CartService.get()).toEqual([]);
    });

    test('count retorna 0 para carrinho vazio', () => {
      expect(CartService.count()).toBe(0);
    });

    test('total retorna 0 para carrinho vazio', () => {
      expect(CartService.total()).toBe(0);
    });

    test('adiciona produto ao carrinho', () => {
      const product = { $id: 'prod1', name: 'Produto A', price: 100 };
      CartService.add(product);
      expect(CartService.count()).toBe(1);
      expect(CartService.total()).toBe(100);
    });

    test('incrementa quantidade ao adicionar mesmo produto', () => {
      const product = { $id: 'prod1', name: 'Produto A', price: 50 };
      CartService.add(product);
      CartService.add(product);
      expect(CartService.count()).toBe(2);
      expect(CartService.total()).toBe(100);
    });

    test('total calcula corretamente com múltiplos produtos', () => {
      CartService.add({ $id: 'p1', name: 'A', price: 10 });
      CartService.add({ $id: 'p2', name: 'B', price: 20 });
      CartService.add({ $id: 'p1', name: 'A', price: 10 });
      expect(CartService.total()).toBe(40); // 2x10 + 1x20
    });
  });

  // ── remove ───────────────────────────────────────────────────────────────
  describe('remove', () => {
    test('remove produto por índice', () => {
      CartService.add({ $id: 'p1', name: 'A', price: 10 });
      CartService.add({ $id: 'p2', name: 'B', price: 20 });
      CartService.remove(0);
      expect(CartService.count()).toBe(1);
      expect(CartService.get()[0].name).toBe('B');
    });
  });

  // ── setQty ───────────────────────────────────────────────────────────────
  describe('setQty', () => {
    test('altera quantidade de um item', () => {
      CartService.add({ $id: 'p1', name: 'A', price: 10 });
      CartService.setQty(0, 5);
      expect(CartService.count()).toBe(5);
      expect(CartService.total()).toBe(50);
    });

    test('não permite quantidade menor que 1', () => {
      CartService.add({ $id: 'p1', name: 'A', price: 10 });
      CartService.setQty(0, 0);
      expect(CartService.count()).toBe(1);
    });
  });

  // ── clear ────────────────────────────────────────────────────────────────
  describe('clear', () => {
    test('limpa carrinho e cupom', () => {
      CartService.add({ $id: 'p1', name: 'A', price: 10 });
      CartService.setCoupon({ code: 'TEST10', discount: 5 });
      CartService.clear();
      expect(CartService.count()).toBe(0);
      expect(CartService.getCoupon()).toBeNull();
    });
  });

  // ── Cupom ────────────────────────────────────────────────────────────────
  describe('cupom', () => {
    test('setCoupon salva cupom', () => {
      CartService.setCoupon({ code: 'SAVE10', discount: 10, message: 'Desconto 10%' });
      const coupon = CartService.getCoupon();
      expect(coupon.code).toBe('SAVE10');
      expect(coupon.discount).toBe(10);
    });

    test('clearCoupon remove cupom', () => {
      CartService.setCoupon({ code: 'TEST', discount: 5 });
      CartService.clearCoupon();
      expect(CartService.getCoupon()).toBeNull();
    });

    test('totalWithDiscount aplica desconto do cupom', () => {
      CartService.add({ $id: 'p1', name: 'A', price: 100 });
      CartService.setCoupon({ code: 'DISC', discount: 20 });
      expect(CartService.totalWithDiscount()).toBe(80);
    });

    test('totalWithDiscount sem cupom retorna total normal', () => {
      CartService.add({ $id: 'p1', name: 'A', price: 50 });
      expect(CartService.totalWithDiscount()).toBe(50);
    });

    test('desconto não excede o subtotal', () => {
      CartService.add({ $id: 'p1', name: 'A', price: 10 });
      CartService.setCoupon({ code: 'BIG', discount: 100 });
      expect(CartService.totalWithDiscount()).toBe(0);
    });
  });
});
