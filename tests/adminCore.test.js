// tests/adminCore.test.js
// Testes para helpers do admin-core.js (sem AdminPage que depende de Appwrite CDN)

import {
  fmtBRL,
  fmtDate,
  fmtDateTime,
  esc,
  statusBadge,
  STATUS_LABELS,
  STATUS_COLORS,
  STATUS_CLS,
  renderStatusChart,
} from '../js/admin-core.js';

// ── Helpers ──────────────────────────────────────────────────────────────────
describe('admin-core helpers', () => {
  describe('fmtBRL', () => {
    test('formata valores corretamente', () => {
      expect(fmtBRL(10)).toBe('R$ 10,00');
      expect(fmtBRL(100.5)).toBe('R$ 100,50');
      expect(fmtBRL(0)).toBe('R$ 0,00');
      expect(fmtBRL(null)).toBe('R$ 0,00');
    });
  });

  describe('fmtDate', () => {
    test('formata data ISO', () => {
      const result = fmtDate('2026-04-03T10:00:00Z');
      expect(result).not.toBe('-');
    });

    test('retorna "-" para null', () => {
      expect(fmtDate(null)).toBe('-');
    });
  });

  describe('fmtDateTime', () => {
    test('formata data/hora ISO', () => {
      const result = fmtDateTime('2026-04-03T10:00:00Z');
      expect(result).not.toBe('-');
    });

    test('retorna "-" para null', () => {
      expect(fmtDateTime(null)).toBe('-');
    });
  });

  describe('esc', () => {
    test('escapa HTML corretamente', () => {
      expect(esc('<script>')).toBe('&lt;script&gt;');
      expect(esc('"test"')).toBe('&quot;test&quot;');
      expect(esc("'test'")).toBe('&#039;test&#039;');
    });

    test('retorna string vazia para null', () => {
      expect(esc(null)).toBe('');
    });
  });
});

// ── STATUS constants ─────────────────────────────────────────────────────────
describe('STATUS constants', () => {
  test('STATUS_LABELS tem todos os status', () => {
    expect(STATUS_LABELS).toHaveProperty('novo', 'Novo');
    expect(STATUS_LABELS).toHaveProperty('pago', 'Pago');
    expect(STATUS_LABELS).toHaveProperty('cancelado', 'Cancelado');
    expect(STATUS_LABELS).toHaveProperty('em_preparo', 'Em Preparo');
  });

  test('STATUS_CLS tem classes CSS', () => {
    expect(STATUS_CLS.novo).toBe('badge-green');
    expect(STATUS_CLS.cancelado).toBe('badge-red');
    expect(STATUS_CLS.em_preparo).toBe('badge-amber');
  });

  test('STATUS_COLORS tem cores hex', () => {
    expect(STATUS_COLORS.novo).toMatch(/^#[0-9a-f]{6}$/i);
    expect(STATUS_COLORS.cancelado).toMatch(/^#[0-9a-f]{6}$/i);
  });
});

// ── statusBadge ──────────────────────────────────────────────────────────────
describe('statusBadge', () => {
  test('gera badge HTML para status conhecido', () => {
    const badge = statusBadge('novo');
    expect(badge).toContain('badge-green');
    expect(badge).toContain('Novo');
  });

  test('usa badge-muted para status desconhecido', () => {
    const badge = statusBadge('desconhecido');
    expect(badge).toContain('badge-muted');
  });

  test('escapa HTML no label', () => {
    const badge = statusBadge('<script>');
    expect(badge).toContain('&lt;script&gt;');
  });

  test('retorna "-" para status null', () => {
    const badge = statusBadge(null);
    expect(badge).toContain('-');
  });
});

// ── renderStatusChart ────────────────────────────────────────────────────────
describe('renderStatusChart', () => {
  beforeEach(() => {
    document.body.innerHTML = '<div id="chart"></div>';
  });

  test('renderiza cards de status', () => {
    renderStatusChart('chart', { novo: 5, cancelado: 2 });
    const el = document.getElementById('chart');
    expect(el.innerHTML).toContain('5');
    expect(el.innerHTML).toContain('2');
    expect(el.innerHTML).toContain('Novo');
  });

  test('não renderiza se container não existir', () => {
    expect(() => renderStatusChart('nonexistent', {})).not.toThrow();
  });

  test('não renderiza se statusCount for null', () => {
    expect(() => renderStatusChart('chart', null)).not.toThrow();
  });

  test('renderiza vazio para objeto vazio', () => {
    renderStatusChart('chart', {});
    const el = document.getElementById('chart');
    expect(el.innerHTML).toBe('');
  });
});
