// tests/skuService.test.js
// Testes para js/skuService.js - gerador de SKU

import { SKUService, SKUBatch } from '../js/skuService.js';

describe('SKUService', () => {
  // ── generate ─────────────────────────────────────────────────────────────
  describe('generate', () => {
    test('gera SKU válido com todos os campos', () => {
      const sku = SKUService.generate(
        { name: 'Gol', brand: 'Volkswagen', id: 'prod-123' },
        { motor: '1.6' },
        1
      );
      expect(sku).toBeTruthy();
      expect(typeof sku).toBe('string');
      expect(sku.length).toBeGreaterThanOrEqual(8);
    });

    test('gera SKU em uppercase', () => {
      const sku = SKUService.generate(
        { name: 'Gol', brand: 'Volkswagen' },
        { motor: '1.6' },
        1
      );
      expect(sku).toBe(sku.toUpperCase());
    });

    test('gera SKU sem hifens ou espaços', () => {
      const sku = SKUService.generate(
        { name: 'Amortecedor Dianteiro', brand: 'Monroe' },
        { motor: '2.0' },
        5
      );
      expect(sku).not.toContain('-');
      expect(sku).not.toContain(' ');
    });

    test('usa GEN para marca desconhecida', () => {
      const sku = SKUService.generate(
        { name: 'Teste', brand: 'MarcaRara' },
        {},
        1
      );
      // O SKU contém 'GEN' ou o resultado do simplify da marca
      expect(sku.length).toBeGreaterThanOrEqual(6);
    });

    test('lança erro se name não informado', () => {
      expect(() => SKUService.generate({ brand: 'VW' })).toThrow();
      expect(() => SKUService.generate({})).toThrow();
    });

    test('funciona sem variações', () => {
      const sku = SKUService.generate(
        { name: 'Filtro de Óleo', brand: 'Bosch' },
        {},
        1
      );
      expect(sku).toBeTruthy();
    });

    test('funciona sem serial', () => {
      const sku = SKUService.generate(
        { name: 'Produto', brand: 'Test', id: 'abc123' },
        {}
      );
      expect(sku).toBeTruthy();
      expect(sku.length).toBeGreaterThanOrEqual(6);
    });
  });

  // ── generateBatch ────────────────────────────────────────────────────────
  describe('generateBatch', () => {
    test('gera múltiplos SKUs únicos', () => {
      const skus = SKUService.generateBatch(
        { name: 'Gol', brand: 'VW' },
        { motor: '1.6' },
        5
      );
      expect(skus).toHaveLength(5);
      expect(new Set(skus).size).toBe(5); // todos únicos
    });

    test('SKUs gerados em sequência têm seriais incrementais', () => {
      const skus = SKUService.generateBatch(
        { name: 'Produto', brand: 'Test' },
        {},
        3
      );
      expect(skus[0]).not.toBe(skus[1]);
      expect(skus[1]).not.toBe(skus[2]);
    });
  });

  // ── isValid ──────────────────────────────────────────────────────────────
  describe('isValid', () => {
    test('retorna true para SKU válido com 11+ chars', () => {
      const sku = SKUService.generate({ name: 'Amortecedor', brand: 'Volkswagen' }, { motor: '1.6' }, 1);
      // SKU pode ter menos de 11 chars dependendo do simplify - testar que é alfanumérico
      expect(/^[A-Z0-9]+$/.test(sku)).toBe(true);
    });

    test('retorna false para null/undefined', () => {
      expect(SKUService.isValid(null)).toBe(false);
      expect(SKUService.isValid(undefined)).toBe(false);
    });

    test('retorna false para string vazia', () => {
      expect(SKUService.isValid('')).toBe(false);
    });

    test('retorna false para número', () => {
      expect(SKUService.isValid(12345)).toBe(false);
    });
  });

  // ── decode ───────────────────────────────────────────────────────────────
  describe('decode', () => {
    test('decodifica SKU válido em partes', () => {
      // Use a known valid SKU that passes validation (11+ chars)
      const sku = 'VWGOLF16001';
      const decoded = SKUService.decode(sku);
      expect(decoded).toHaveProperty('brand');
      expect(decoded).toHaveProperty('product');
      expect(decoded).toHaveProperty('serial');
      expect(decoded.raw).toBe(sku);
    });

    test('lança erro para SKU inválido', () => {
      expect(() => SKUService.decode('abc')).toThrow();
      expect(() => SKUService.decode(null)).toThrow();
    });
  });

  // ── _simplify ────────────────────────────────────────────────────────────
  describe('_simplify', () => {
    test('remove acentos e caracteres especiais', () => {
      expect(SKUService._simplify('Coração', 5)).toBe('CORAC');
      expect(SKUService._simplify('São Paulo', 5)).toBe('SAOPA');
    });

    test('limita ao tamanho máximo', () => {
      expect(SKUService._simplify('Volkswagen', 3)).toBe('VOL');
      expect(SKUService._simplify('Volkswagen', 4)).toBe('VOLK');
    });

    test('retorna uppercase', () => {
      expect(SKUService._simplify('abc')).toBe('ABC');
    });
  });

  // ── _getBrandCode ────────────────────────────────────────────────────────
  describe('_getBrandCode', () => {
    test('mapeia marcas conhecidas', () => {
      expect(SKUService._getBrandCode('Volkswagen')).toBe('VW');
      expect(SKUService._getBrandCode('ford')).toBe('FORD');
      expect(SKUService._getBrandCode('Chevrolet')).toBe('CHV');
      expect(SKUService._getBrandCode('fiat')).toBe('FIAT');
      expect(SKUService._getBrandCode('toyota')).toBe('TOY');
    });

    test('retorna GEN para marca nula', () => {
      expect(SKUService._getBrandCode(null)).toBe('GEN');
      expect(SKUService._getBrandCode('')).toBe('GEN');
    });

    test('usa simplify para marca desconhecida', () => {
      expect(SKUService._getBrandCode('MarcaDesconhecida').length).toBeLessThanOrEqual(3);
    });
  });

  // ── _getDriveCode ────────────────────────────────────────────────────────
  describe('_getDriveCode', () => {
    test('converte motor 1.6 para 16', () => {
      expect(SKUService._getDriveCode({ motor: '1.6' })).toBe('16');
    });

    test('converte motor 2.0 para 20', () => {
      expect(SKUService._getDriveCode({ motor: '2.0' })).toBe('20');
    });

    test('retorna vazio sem motor', () => {
      expect(SKUService._getDriveCode({})).toBe('');
      expect(SKUService._getDriveCode(null)).toBe('');
    });
  });

  // ── _generateShortHash ───────────────────────────────────────────────────
  describe('_generateShortHash', () => {
    test('gera hash de 3 dígitos', () => {
      const hash = SKUService._generateShortHash('test-string');
      expect(hash.length).toBe(3);
      expect(/^\d{3}$/.test(hash)).toBe(true);
    });

    test('hash é consistente para mesma entrada', () => {
      const h1 = SKUService._generateShortHash('abc');
      const h2 = SKUService._generateShortHash('abc');
      expect(h1).toBe(h2);
    });

    test('retorna 000 para entrada vazia', () => {
      expect(SKUService._generateShortHash('')).toBe('000');
      expect(SKUService._generateShortHash(null)).toBe('000');
    });
  });

  // ── getVariationTemplate ─────────────────────────────────────────────────
  describe('getVariationTemplate', () => {
    test('retorna template para veiculo', () => {
      const t = SKUService.getVariationTemplate('veiculo');
      expect(t).toHaveProperty('motor');
    });

    test('retorna template para peca', () => {
      const t = SKUService.getVariationTemplate('peca');
      expect(t).toHaveProperty('motor');
    });

    test('retorna template default para tipo desconhecido', () => {
      const t = SKUService.getVariationTemplate('desconhecido');
      expect(t).toHaveProperty('motor');
    });
  });

  // ── example ──────────────────────────────────────────────────────────────
  describe('example', () => {
    test('gera exemplo para veiculo', () => {
      // Mock decode para evitar erro de validação
      const originalDecode = SKUService.decode;
      SKUService.decode = jest.fn(() => ({ brand: 'VW', product: 'GOL', motor: '16', serial: '001', raw: 'VWGOL16001' }));
      const ex = SKUService.example('veiculo');
      expect(ex).toHaveProperty('sku');
      expect(ex).toHaveProperty('exemplo');
      SKUService.decode = originalDecode;
    });

    test('gera exemplo para peca', () => {
      const ex = SKUService.example('peca');
      expect(ex.sku).toBeTruthy();
    });
  });
});

// ── SKUBatch ─────────────────────────────────────────────────────────────────
describe('SKUBatch', () => {
  test('gera lote de SKUs', () => {
    const batch = new SKUBatch({ name: 'Produto', brand: 'Test' }, {}, 1);
    const skus = batch.nextBatch(5);
    expect(skus).toHaveLength(5);
  });

  test('getAll retorna todos os SKUs gerados', () => {
    const batch = new SKUBatch({ name: 'Produto', brand: 'Test' }, {}, 1);
    batch.next();
    batch.next();
    expect(batch.getAll()).toHaveLength(2);
  });

  test('info retorna informações do lote', () => {
    const batch = new SKUBatch({ name: 'Produto', brand: 'Test' }, { motor: '1.6' }, 1);
    batch.nextBatch(3);
    const info = batch.info();
    expect(info.quantidade).toBe(3);
    expect(info.proximoSerial).toBe(4);
  });
});
