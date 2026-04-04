// tests/couponService.test.js
// Testes para js/couponService.js - serviço de cupons

import { CouponService, reasonMessage } from '../js/couponService.js';

// Mock dos repositórios
jest.mock('../js/repositories.js', () => ({
  CouponRepository: {
    create: jest.fn(),
    findByCode: jest.fn(),
    list: jest.fn(),
    incrementUsage: jest.fn(),
  },
  CouponUsageRepository: {
    findByCodeAndCpf: jest.fn(),
    increment: jest.fn(),
  },
}));

import { CouponRepository, CouponUsageRepository } from '../js/repositories.js';

describe('CouponService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  // ── create ───────────────────────────────────────────────────────────────
  describe('create', () => {
    test('cria cupom com dados mínimos', async () => {
      CouponRepository.create.mockResolvedValue({ $id: 'c1', code: 'TEST10', type: 'percentual', value: 10 });

      const result = await CouponService.create({ code: 'TEST10', type: 'percentual', value: 10 });

      expect(CouponRepository.create).toHaveBeenCalledWith(
        expect.objectContaining({
          code: 'TEST10',
          type: 'percentual',
          value: 10,
          isActive: true,
          minOrderValue: 50,
          timesUsed: 0,
        })
      );
    });

    test('lança erro se campos obrigatórios faltarem', async () => {
      await expect(CouponService.create({})).rejects.toThrow('code, type e value são obrigatórios');
      await expect(CouponService.create({ code: 'X' })).rejects.toThrow('code, type e value são obrigatórios');
    });

    test('lança erro se type inválido', async () => {
      await expect(CouponService.create({ code: 'X', type: 'invalid', value: 10 })).rejects.toThrow("type deve ser 'percentual' ou 'fixed'");
    });

    test('usa valores padrão para opcionais', async () => {
      CouponRepository.create.mockResolvedValue({});
      await CouponService.create({ code: 'X', type: 'fixed', value: 5 });
      expect(CouponRepository.create).toHaveBeenCalledWith(
        expect.objectContaining({
          maxDiscount: null,
          minOrderValue: 50,
          usageLimit: null,
          cpfLimit: null,
          isActive: true,
        })
      );
    });
  });

  // ── validate ─────────────────────────────────────────────────────────────
  describe('validate', () => {
    test('retorna ok para cupom válido', async () => {
      CouponRepository.findByCode.mockResolvedValue({
        code: 'SAVE10', isActive: true, type: 'percentual', value: 10, timesUsed: 0, usageLimit: null,
        minOrderValue: null, cpf: null, cpfLimit: null, expirationDate: null,
      });

      const result = await CouponService.validate('SAVE10', { cartTotal: 100 });

      expect(result.ok).toBe(true);
    });

    test('retorna erro para cupom não encontrado', async () => {
      CouponRepository.findByCode.mockResolvedValue(null);
      const result = await CouponService.validate('INVALID');
      expect(result.ok).toBe(false);
      expect(result.reason).toBe('coupon_not_found');
    });

    test('retorna erro para cupom inativo', async () => {
      CouponRepository.findByCode.mockResolvedValue({ code: 'X', isActive: false });
      const result = await CouponService.validate('X');
      expect(result.ok).toBe(false);
      expect(result.reason).toBe('coupon_inactive');
    });

    test('retorna erro para cupom expirado', async () => {
      CouponRepository.findByCode.mockResolvedValue({
        code: 'X', isActive: true, expirationDate: '2020-01-01',
        timesUsed: 0, usageLimit: null, minOrderValue: null, cpf: null, cpfLimit: null,
      });
      const result = await CouponService.validate('X');
      expect(result.ok).toBe(false);
      expect(result.reason).toBe('coupon_expired');
    });

    test('retorna erro para limite de uso atingido', async () => {
      CouponRepository.findByCode.mockResolvedValue({
        code: 'X', isActive: true, timesUsed: 10, usageLimit: 10,
        minOrderValue: null, cpf: null, cpfLimit: null, expirationDate: null,
      });
      const result = await CouponService.validate('X');
      expect(result.ok).toBe(false);
      expect(result.reason).toBe('coupon_usage_limit');
    });

    test('retorna erro para valor mínimo não atingido', async () => {
      CouponRepository.findByCode.mockResolvedValue({
        code: 'X', isActive: true, minOrderValue: 100,
        timesUsed: 0, usageLimit: null, cpf: null, cpfLimit: null, expirationDate: null,
      });
      const result = await CouponService.validate('X', { cartTotal: 50 });
      expect(result.ok).toBe(false);
      expect(result.reason).toBe('coupon_min_order');
    });

    test('retorna erro para CPF incompatível', async () => {
      CouponRepository.findByCode.mockResolvedValue({
        code: 'X', isActive: true, cpf: '12345678901',
        timesUsed: 0, usageLimit: null, minOrderValue: null, cpfLimit: null, expirationDate: null,
      });
      const result = await CouponService.validate('X', { cpf: '98765432100' });
      expect(result.ok).toBe(false);
      expect(result.reason).toBe('coupon_cpf_mismatch');
    });

    test('retorna erro para limite por CPF atingido', async () => {
      CouponRepository.findByCode.mockResolvedValue({
        code: 'X', isActive: true, cpfLimit: 2,
        timesUsed: 0, usageLimit: null, minOrderValue: null, cpf: null, expirationDate: null,
      });
      CouponUsageRepository.findByCodeAndCpf.mockResolvedValue({ code: 'X', cpf: '123', uses: 2 });
      const result = await CouponService.validate('X', { cpf: '123' });
      expect(result.ok).toBe(false);
      expect(result.reason).toBe('coupon_cpf_limit');
    });
  });

  // ── apply ────────────────────────────────────────────────────────────────
  describe('apply', () => {
    test('aplica cupom percentual corretamente', async () => {
      CouponRepository.findByCode.mockResolvedValue({
        code: 'PCT10', isActive: true, type: 'percentual', value: 10,
        timesUsed: 0, usageLimit: null, minOrderValue: null, cpf: null, cpfLimit: null,
        expirationDate: null, maxDiscount: null,
      });
      CouponRepository.incrementUsage.mockResolvedValue({});

      const result = await CouponService.apply('PCT10', { subtotal: 200 });

      expect(result.ok).toBe(true);
      expect(result.discount).toBe(20); // 10% de 200
      expect(result.subtotal).toBe(180);
    });

    test('aplica cupom fixed corretamente', async () => {
      CouponRepository.findByCode.mockResolvedValue({
        code: 'FIX50', isActive: true, type: 'fixed', value: 50,
        timesUsed: 0, usageLimit: null, minOrderValue: null, cpf: null, cpfLimit: null,
        expirationDate: null, maxDiscount: null,
      });
      CouponRepository.incrementUsage.mockResolvedValue({});

      const result = await CouponService.apply('FIX50', { subtotal: 200 });

      expect(result.discount).toBe(50);
      expect(result.subtotal).toBe(150);
    });

    test('respeita maxDiscount', async () => {
      CouponRepository.findByCode.mockResolvedValue({
        code: 'BIG', isActive: true, type: 'fixed', value: 500, maxDiscount: 100,
        timesUsed: 0, usageLimit: null, minOrderValue: null, cpf: null, cpfLimit: null,
        expirationDate: null,
      });
      CouponRepository.incrementUsage.mockResolvedValue({});

      const result = await CouponService.apply('BIG', { subtotal: 1000 });

      expect(result.discount).toBe(100);
    });

    test('retorna erro se desconto zero', async () => {
      CouponRepository.findByCode.mockResolvedValue({
        code: 'ZERO', isActive: true, type: 'fixed', value: 0,
        timesUsed: 0, usageLimit: null, minOrderValue: null, cpf: null, cpfLimit: null,
        expirationDate: null, maxDiscount: null,
      });

      const result = await CouponService.apply('ZERO', { subtotal: 100 });
      expect(result.ok).toBe(false);
      expect(result.reason).toBe('invalid_discount');
    });

    test('não excede 50% do pedido', async () => {
      CouponRepository.findByCode.mockResolvedValue({
        code: 'HALF', isActive: true, type: 'fixed', value: 999,
        timesUsed: 0, usageLimit: null, minOrderValue: null, cpf: null, cpfLimit: null,
        expirationDate: null, maxDiscount: null,
      });
      CouponRepository.incrementUsage.mockResolvedValue({});

      const result = await CouponService.apply('HALF', { subtotal: 100 });
      expect(result.discount).toBeLessThanOrEqual(50); // max 50% de 100
    });
  });

  // ── list / reset ─────────────────────────────────────────────────────────
  describe('list e reset', () => {
    test('list chama repositório', () => {
      CouponRepository.list.mockResolvedValue([]);
      CouponService.list();
      expect(CouponRepository.list).toHaveBeenCalled();
    });

    test('reset chama repositório', () => {
      CouponRepository.reset = jest.fn();
      CouponService.reset();
      expect(CouponRepository.reset).toHaveBeenCalled();
    });
  });
});

// ── reasonMessage ────────────────────────────────────────────────────────────
describe('reasonMessage', () => {
  test('retorna mensagem para reason conhecida', () => {
    expect(reasonMessage('coupon_not_found')).toContain('não encontrado');
    expect(reasonMessage('coupon_expired')).toContain('expirado');
    expect(reasonMessage('coupon_usage_limit')).toContain('Limite');
  });

  test('retorna mensagem default para reason desconhecida', () => {
    expect(reasonMessage('unknown')).toContain('inválido');
  });
});
