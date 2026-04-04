// tests/utils.test.js
// Testes para js/utils.js - utilitários compartilhados

import {
  maskCPF,
  maskCelular,
  maskCEP,
  formatBRL,
  formatDateBR,
  formatDateTimeBR,
  escapeHTML,
  esc,
  fmt,
} from '../js/utils.js';

// ── Máscara CPF ──────────────────────────────────────────────────────────────
describe('maskCPF', () => {
  test('formata CPF com 11 dígitos', () => {
    expect(maskCPF('12345678901')).toBe('123.456.789-01');
  });

  test('formata CPF parcialmente', () => {
    expect(maskCPF('123')).toBe('123');
    expect(maskCPF('123456')).toBe('123.456');
    expect(maskCPF('123456789')).toBe('123.456.789');
  });

  test('remove caracteres não numéricos', () => {
    expect(maskCPF('123.456.789-01')).toBe('123.456.789-01');
  });

  test('limita a 11 dígitos', () => {
    expect(maskCPF('123456789012345')).toBe('123.456.789-01');
  });

  test('retorna string vazia para entrada vazia', () => {
    expect(maskCPF('')).toBe('');
  });
});

// ── Máscara Celular ──────────────────────────────────────────────────────────
describe('maskCelular', () => {
  test('formata celular com 11 dígitos', () => {
    expect(maskCelular('98981168787')).toBe('(98) 98116-8787');
  });

  test('formata celular parcialmente', () => {
    expect(maskCelular('98')).toBe('98');
    expect(maskCelular('9898116')).toBe('(98) 9811-6');
    expect(maskCelular('9898116878')).toBe('(98) 98116-878');
  });

  test('remove caracteres não numéricos', () => {
    expect(maskCelular('(98) 98116-8787')).toBe('(98) 98116-8787');
  });

  test('limita a 11 dígitos', () => {
    expect(maskCelular('98981168787000')).toBe('(98) 98116-8787');
  });
});

// ── Máscara CEP ──────────────────────────────────────────────────────────────
describe('maskCEP', () => {
  test('formata CEP com 8 dígitos', () => {
    expect(maskCEP('65500000')).toBe('65500-000');
  });

  test('formata CEP parcialmente', () => {
    expect(maskCEP('65500')).toBe('65500');
    expect(maskCEP('655000')).toBe('65500-0');
  });

  test('remove caracteres não numéricos', () => {
    expect(maskCEP('65500-000')).toBe('65500-000');
  });

  test('limita a 8 dígitos', () => {
    expect(maskCEP('65500000123')).toBe('65500-000');
  });
});

// ── formatBRL ────────────────────────────────────────────────────────────────
describe('formatBRL', () => {
  test('formata número como moeda brasileira', () => {
    expect(formatBRL(10)).toBe('R$ 10,00');
    expect(formatBRL(10.5)).toBe('R$ 10,50');
    expect(formatBRL(1234.56)).toBe('R$ 1234,56');
  });

  test('formata zero', () => {
    expect(formatBRL(0)).toBe('R$ 0,00');
  });

  test('formata null/undefined como zero', () => {
    expect(formatBRL(null)).toBe('R$ 0,00');
    expect(formatBRL(undefined)).toBe('R$ 0,00');
  });

  test('formata string numérica', () => {
    expect(formatBRL('100')).toBe('R$ 100,00');
  });
});

// ── formatDateBR ─────────────────────────────────────────────────────────────
describe('formatDateBR', () => {
  test('formata data ISO para formato brasileiro', () => {
    const result = formatDateBR('2026-04-03T10:00:00Z');
    expect(result).toMatch(/\d{2}\/\d{2}\/\d{4}/);
  });

  test('retorna "-" para null/undefined', () => {
    expect(formatDateBR(null)).toBe('-');
    expect(formatDateBR(undefined)).toBe('-');
    expect(formatDateBR('')).toBe('-');
  });
});

// ── formatDateTimeBR ─────────────────────────────────────────────────────────
describe('formatDateTimeBR', () => {
  test('formata data/hora ISO para formato brasileiro', () => {
    const result = formatDateTimeBR('2026-04-03T10:00:00Z');
    expect(result).toMatch(/\d{2}\/\d{2}\/\d{4}/);
  });

  test('retorna "-" para null/undefined', () => {
    expect(formatDateTimeBR(null)).toBe('-');
    expect(formatDateTimeBR(undefined)).toBe('-');
  });
});

// ── escapeHTML / esc ────────────────────────────────────────────────────────
describe('escapeHTML', () => {
  test('escapa caracteres HTML', () => {
    expect(escapeHTML('<script>')).toBe('&lt;script&gt;');
    expect(escapeHTML('"quoted"')).toBe('&quot;quoted&quot;');
    expect(escapeHTML("it's")).toBe('it&#039;s');
    expect(escapeHTML('&amp;')).toBe('&amp;amp;');
  });

  test('retorna string para null/undefined', () => {
    expect(escapeHTML(null)).toBe('');
    expect(escapeHTML(undefined)).toBe('');
  });

  test('não modifica texto seguro', () => {
    expect(escapeHTML('Hello World')).toBe('Hello World');
  });
});

describe('esc (alias)', () => {
  test('é igual a escapeHTML', () => {
    expect(esc('<b>')).toBe(escapeHTML('<b>'));
  });
});

describe('fmt (alias)', () => {
  test('é igual a formatBRL', () => {
    expect(fmt(10)).toBe(formatBRL(10));
  });
});
