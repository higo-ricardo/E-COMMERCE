// tests/productService.test.js
// Testes para js/productService.js - serviço de produtos com cache

// Mock do repositório
jest.mock('../js/repositories.js', () => ({
  ProductRepository: {
    list: jest.fn(),
    search: jest.fn(),
    getFilterOptions: jest.fn(),
    searchByBarcode: jest.fn(),
    getCriticalStock: jest.fn(),
    softDelete: jest.fn(),
    restore: jest.fn(),
  },
}));

import { ProductService } from '../js/productService.js';
import { ProductRepository } from '../js/repositories.js';

describe('ProductService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    ProductService.invalidateCache();
  });

  // ── list ─────────────────────────────────────────────────────────────────
  describe('list', () => {
    test('chama repositório com página e filtros', async () => {
      ProductRepository.list.mockResolvedValue({ products: [], total: 0, pages: 0 });
      await ProductService.list(1, { category: 'Motor' });
      expect(ProductRepository.list).toHaveBeenCalledWith(1, { category: 'Motor' });
    });

    test('usa cache na segunda chamada', async () => {
      ProductRepository.list.mockResolvedValue({ products: [{ $id: 'p1' }], total: 1, pages: 1 });

      const r1 = await ProductService.list(1, {});
      const r2 = await ProductService.list(1, {});

      expect(ProductRepository.list).toHaveBeenCalledTimes(1);
      expect(r1).toEqual(r2);
    });
  });

  // ── search ───────────────────────────────────────────────────────────────
  describe('search', () => {
    test('chama repositório com termo e filtros', async () => {
      ProductRepository.search.mockResolvedValue({ products: [], total: 0, pages: 0 });
      await ProductService.search('Gol', 1, { brand: 'VW' });
      expect(ProductRepository.search).toHaveBeenCalledWith('Gol', 1, { brand: 'VW' });
    });

    test('redireciona para list se termo vazio', async () => {
      ProductRepository.list.mockResolvedValue({ products: [], total: 0 });
      await ProductService.search('', 1, {});
      expect(ProductRepository.list).toHaveBeenCalled();
      expect(ProductRepository.search).not.toHaveBeenCalled();
    });

    test('usa cache para mesma busca', async () => {
      ProductRepository.search.mockResolvedValue({ products: [{ name: 'Gol' }], total: 1 });

      const r1 = await ProductService.search('Gol');
      const r2 = await ProductService.search('Gol');

      expect(ProductRepository.search).toHaveBeenCalledTimes(1);
      expect(r1).toEqual(r2);
    });
  });

  // ── getFilterOptions ─────────────────────────────────────────────────────
  describe('getFilterOptions', () => {
    test('chama repositório e cacheia', async () => {
      ProductRepository.getFilterOptions.mockResolvedValue({ categories: ['Motor'], brands: ['VW'] });

      const r1 = await ProductService.getFilterOptions();
      const r2 = await ProductService.getFilterOptions();

      expect(ProductRepository.getFilterOptions).toHaveBeenCalledTimes(1);
      expect(r1).toEqual(r2);
    });
  });

  // ── invalidateCache ──────────────────────────────────────────────────────
  describe('invalidateCache', () => {
    test('limpa cache', async () => {
      ProductRepository.list.mockResolvedValue({ products: [{ $id: 'p1' }], total: 1, pages: 1 });

      await ProductService.list(1);
      ProductService.invalidateCache();
      await ProductService.list(1);

      expect(ProductRepository.list).toHaveBeenCalledTimes(2);
    });
  });

  // ── cacheStats ───────────────────────────────────────────────────────────
  describe('cacheStats', () => {
    test('retorna estatísticas do cache', () => {
      const stats = ProductService.cacheStats();
      expect(stats).toHaveProperty('entries');
      expect(stats).toHaveProperty('keys');
      expect(stats).toHaveProperty('debugOn');
    });
  });

  // ── searchByBarcode ──────────────────────────────────────────────────────
  describe('searchByBarcode', () => {
    test('chama repositório sem cache', async () => {
      ProductRepository.searchByBarcode.mockResolvedValue({ $id: 'p1', barcode: '7891234567890' });
      await ProductService.searchByBarcode('7891234567890');
      expect(ProductRepository.searchByBarcode).toHaveBeenCalledWith('7891234567890');
    });
  });

  // ── getCriticalStock ─────────────────────────────────────────────────────
  describe('getCriticalStock', () => {
    test('chama repositório sem cache', async () => {
      ProductRepository.getCriticalStock.mockResolvedValue([]);
      await ProductService.getCriticalStock(50);
      expect(ProductRepository.getCriticalStock).toHaveBeenCalledWith(50);
    });
  });

  // ── softDelete ───────────────────────────────────────────────────────────
  describe('softDelete', () => {
    test('deleta e invalida cache', async () => {
      ProductRepository.softDelete.mockResolvedValue({ $id: 'p1', deletedAt: new Date().toISOString() });

      // Preenche cache
      ProductRepository.list.mockResolvedValue({ products: [{ $id: 'p1' }], total: 1 });
      await ProductService.list(1);

      await ProductService.softDelete('p1');

      expect(ProductRepository.softDelete).toHaveBeenCalledWith('p1');
      // Cache foi invalidado, próxima chamada vai ao repositório
      ProductRepository.list.mockResolvedValue({ products: [], total: 0 });
      await ProductService.list(1);
      expect(ProductRepository.list).toHaveBeenCalledTimes(2);
    });
  });

  // ── restore ──────────────────────────────────────────────────────────────
  describe('restore', () => {
    test('restaura e invalida cache', async () => {
      ProductRepository.restore.mockResolvedValue({ $id: 'p1', deletedAt: null });
      await ProductService.restore('p1');
      expect(ProductRepository.restore).toHaveBeenCalledWith('p1');
    });
  });
});
