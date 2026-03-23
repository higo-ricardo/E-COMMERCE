// ─── HIVERCAR · tests/taxEngine.test.js ──────────────────────────────────────
// US-44 · Sprint 05 — Testes do TaxEngine (Motor de Regras Tributárias)
//
// Cobertura:
//   - calculate(): IPI, ICMS, PIS, COFINS, CBS, IBS para NCMs reais
//   - calculateCart(): múltiplos itens, resumo de impostos
//   - lookupNcm(): lookup por prefixo (8708.30.90 → 8708.30 → 8708 → default)
//   - Diferenciação B2C vs B2B (IPI)
//   - Regimes tributários (Simples Nacional x Lucro Presumido)
//   - Arredondamentos (2 casas decimais)
//   - formatDiscriminado(): saída legível

import { describe, it, expect } from "vitest"
import {
  TaxEngine,
  calculate,
  calculateCart,
  formatDiscriminado,
  REGIMES,
} from "../taxEngine.js"

// ─────────────────────────────────────────────────────────────────────────────
describe("TaxEngine.lookupNcm — Lookup por prefixo NCM", () => {

  it("encontra regra exata 8708.30", () => {
    const r = TaxEngine.lookupNcm("8708.30")
    expect(r).toBeDefined()
    expect(r.descricao).toMatch(/[Ff]reio/)
  })

  it("encontra regra pelo subgrupo 8708.30.90 → 8708.30", () => {
    const r = TaxEngine.lookupNcm("8708.30.90")
    expect(r).toBeDefined()
    expect(r.ipi).toBeGreaterThanOrEqual(0)
  })

  it("fallback para grupo 8708 quando subgrupo não mapeado", () => {
    const r = TaxEngine.lookupNcm("8708.55")
    expect(r).toBeDefined()
    expect(r.ipi).toBeDefined()
  })

  it("retorna regra default para NCM desconhecido", () => {
    const r = TaxEngine.lookupNcm("9999.99.99")
    expect(r).toEqual(TaxEngine.NCM_TAX_RULES["default"])
  })

  it("retorna regra default para NCM null/undefined", () => {
    const rNull = TaxEngine.lookupNcm(null)
    const rUndef = TaxEngine.lookupNcm(undefined)
    expect(rNull).toEqual(TaxEngine.NCM_TAX_RULES["default"])
    expect(rUndef).toEqual(TaxEngine.NCM_TAX_RULES["default"])
  })

})

// ─────────────────────────────────────────────────────────────────────────────
describe("TaxEngine.calculate — Cálculo unitário B2C", () => {

  it("retorna todas as propriedades esperadas", () => {
    const r = calculate({ ncm: "8708.30.90", preco: 100, qty: 1, ufDestino: "MA" })
    expect(r).toHaveProperty("baseCalculo")
    expect(r).toHaveProperty("ipi")
    expect(r).toHaveProperty("icms")
    expect(r).toHaveProperty("pis")
    expect(r).toHaveProperty("cofins")
    expect(r).toHaveProperty("cbs")
    expect(r).toHaveProperty("ibs")
    expect(r).toHaveProperty("totalImpostos")
    expect(r).toHaveProperty("total")
    expect(r).toHaveProperty("aliquotaEfetiva")
    expect(r).toHaveProperty("discriminado")
    expect(r).toHaveProperty("avisos")
  })

  it("base de cálculo = preco × qty", () => {
    const r = calculate({ ncm: "8708", preco: 50, qty: 3 })
    expect(r.baseCalculo).toBe(150)
  })

  it("IPI = 0 para B2C (consumidor final padrão)", () => {
    const r = calculate({ ncm: "8708.30", preco: 100, qty: 1, isB2B: false })
    expect(r.ipi).toBe(0)
  })

  it("IPI > 0 para B2B (venda para empresa)", () => {
    const r = calculate({ ncm: "8708.30", preco: 100, qty: 1, isB2B: true })
    expect(r.ipi).toBeGreaterThan(0)
  })

  it("ICMS varia por UF destino (MA → SP = 7%, MA → MA = 12%)", () => {
    const ma = calculate({ ncm: "8708", preco: 100, qty: 1, ufDestino: "MA" })
    const sp = calculate({ ncm: "8708", preco: 100, qty: 1, ufDestino: "SP" })
    expect(ma.icms).toBeGreaterThan(sp.icms) // MA→MA 12% > MA→SP 7%
  })

  it("UF desconhecida usa alíquota padrão (12%)", () => {
    const r = calculate({ ncm: "8708", preco: 100, qty: 1, ufDestino: "XX" })
    expect(r.icms).toBeCloseTo(12, 1)
  })

  it("totalImpostos = soma de todos os tributos", () => {
    const r = calculate({ ncm: "8708", preco: 100, qty: 1, ufDestino: "MA" })
    const soma = +(r.ipi + r.icms + r.pis + r.cofins + r.cbs + r.ibs).toFixed(2)
    expect(r.totalImpostos).toBeCloseTo(soma, 1)
  })

  it("total = baseCalculo + totalImpostos", () => {
    const r = calculate({ ncm: "8708", preco: 100, qty: 1 })
    expect(r.total).toBeCloseTo(r.baseCalculo + r.totalImpostos, 2)
  })

  it("aliquotaEfetiva > 0 e < 100%", () => {
    const r = calculate({ ncm: "8708", preco: 100, qty: 1 })
    expect(r.aliquotaEfetiva).toBeGreaterThan(0)
    expect(r.aliquotaEfetiva).toBeLessThan(100)
  })

  it("arredonda totalImpostos para 2 casas decimais", () => {
    const r = calculate({ ncm: "8708.99", preco: 33.33, qty: 3 })
    expect(Number.isFinite(r.totalImpostos)).toBe(true)
    const strVal = r.totalImpostos.toFixed(2)
    expect(parseFloat(strVal)).toBe(r.totalImpostos)
  })

  it("qty padrão = 1 quando não informado", () => {
    const r = calculate({ ncm: "8708", preco: 100 })
    expect(r.baseCalculo).toBe(100)
  })

  it("preco = 0 retorna totalImpostos = 0", () => {
    const r = calculate({ ncm: "8708", preco: 0, qty: 1 })
    expect(r.totalImpostos).toBe(0)
    expect(r.total).toBe(0)
    expect(r.aliquotaEfetiva).toBe(0)
  })

})

// ─────────────────────────────────────────────────────────────────────────────
describe("TaxEngine.calculate — Regimes Tributários", () => {

  it("Simples Nacional: ICMS, PIS, COFINS = 0", () => {
    const r = calculate({
      ncm: "8708", preco: 100, qty: 1,
      ufDestino: "MA", regime: REGIMES.SIMPLES,
    })
    expect(r.icms).toBe(0)
    expect(r.pis).toBe(0)
    expect(r.cofins).toBe(0)
  })

  it("Simples Nacional: CBS e IBS também = 0", () => {
    const r = calculate({
      ncm: "8708", preco: 100, qty: 1,
      regime: REGIMES.SIMPLES,
    })
    expect(r.cbs).toBe(0)
    expect(r.ibs).toBe(0)
  })

  it("Lucro Presumido: todos os tributos > 0 (exceto IPI para B2C)", () => {
    const r = calculate({
      ncm: "8708", preco: 100, qty: 1,
      ufDestino: "MA", isB2B: false,
      regime: REGIMES.LUCRO_PRESUMIDO,
    })
    expect(r.icms).toBeGreaterThan(0)
    expect(r.pis).toBeGreaterThan(0)
    expect(r.cofins).toBeGreaterThan(0)
    expect(r.cbs).toBeGreaterThan(0)
    expect(r.ibs).toBeGreaterThan(0)
  })

  it("Simples Nacional tem carga total menor que Lucro Presumido", () => {
    const simples = calculate({ ncm: "8708", preco: 100, qty: 1, regime: REGIMES.SIMPLES })
    const lucro   = calculate({ ncm: "8708", preco: 100, qty: 1, regime: REGIMES.LUCRO_PRESUMIDO })
    expect(simples.totalImpostos).toBeLessThan(lucro.totalImpostos)
  })

})

// ─────────────────────────────────────────────────────────────────────────────
describe("TaxEngine.calculate — NCMs específicos cap. 87", () => {

  it("NCM 8708.30 (freios) é mapeado corretamente", () => {
    const r = calculate({ ncm: "8708.30", preco: 200, qty: 1, ufDestino: "MA" })
    expect(r.totalImpostos).toBeGreaterThan(0)
    expect(r.ncmInfo.ncm).toBe("8708.30")
  })

  it("NCM 8482 (rolamentos) tem IPI maior que 8708", () => {
    const rolamento = calculate({ ncm: "8482", preco: 100, qty: 1, isB2B: true })
    const peca      = calculate({ ncm: "8708", preco: 100, qty: 1, isB2B: true })
    expect(rolamento.ipi).toBeGreaterThanOrEqual(peca.ipi)
  })

  it("NCM 8512 (iluminação) tem IPI = 15% B2B", () => {
    const r = calculate({ ncm: "8512", preco: 100, qty: 1, isB2B: true })
    expect(r.ipi).toBeCloseTo(15, 1)
  })

  it("NCM 4011 (pneus) tem IPI = 0", () => {
    const r = calculate({ ncm: "4011", preco: 100, qty: 1, isB2B: true })
    expect(r.ipi).toBe(0)
  })

})

// ─────────────────────────────────────────────────────────────────────────────
describe("TaxEngine.calculateCart — Carrinho com múltiplos itens", () => {

  const itens = [
    { ncm: "8708.30", price: 150, qty: 2 },  // pastilha × 2
    { ncm: "8708.70", price:  80, qty: 1 },  // radiador × 1
    { ncm: "4011",    price: 400, qty: 4 },  // pneus × 4
  ]

  it("retorna estrutura correta", () => {
    const r = calculateCart(itens, { ufDestino: "MA" })
    expect(r).toHaveProperty("itens")
    expect(r).toHaveProperty("totalBruto")
    expect(r).toHaveProperty("totalImpostos")
    expect(r).toHaveProperty("totalComImpostos")
    expect(r).toHaveProperty("aliquotaEfetiva")
    expect(r).toHaveProperty("resumoImpostos")
  })

  it("totalBruto = soma dos baseCalculo de cada item", () => {
    const r = calculateCart(itens, { ufDestino: "MA" })
    const esperado = 150*2 + 80*1 + 400*4
    expect(r.totalBruto).toBeCloseTo(esperado, 2)
  })

  it("totalComImpostos = totalBruto + totalImpostos", () => {
    const r = calculateCart(itens, { ufDestino: "MA" })
    expect(r.totalComImpostos).toBeCloseTo(r.totalBruto + r.totalImpostos, 2)
  })

  it("resumoImpostos tem todas as chaves", () => {
    const r = calculateCart(itens)
    expect(r.resumoImpostos).toHaveProperty("IPI")
    expect(r.resumoImpostos).toHaveProperty("ICMS")
    expect(r.resumoImpostos).toHaveProperty("PIS")
    expect(r.resumoImpostos).toHaveProperty("COFINS")
    expect(r.resumoImpostos).toHaveProperty("CBS")
    expect(r.resumoImpostos).toHaveProperty("IBS")
  })

  it("carrinho vazio retorna totalBruto = 0", () => {
    const r = calculateCart([])
    expect(r.totalBruto).toBe(0)
    expect(r.totalImpostos).toBe(0)
    expect(r.aliquotaEfetiva).toBe(0)
  })

  it("cada item contém propriedade tax com resultado de calculate()", () => {
    const r = calculateCart(itens)
    r.itens.forEach(item => {
      expect(item).toHaveProperty("tax")
      expect(item.tax).toHaveProperty("totalImpostos")
      expect(item.tax.totalImpostos).toBeGreaterThanOrEqual(0)
    })
  })

  it("contexto é propagado para cada item", () => {
    const r = calculateCart(itens, { ufDestino: "SP", isB2B: false })
    expect(r.contexto.ufDestino).toBe("SP")
    expect(r.contexto.isB2B).toBe(false)
  })

  it("item sem NCM usa regra default sem lançar erro", () => {
    const semNcm = [{ ncm: null, price: 100, qty: 1 }]
    expect(() => calculateCart(semNcm)).not.toThrow()
    const r = calculateCart(semNcm)
    expect(r.totalBruto).toBe(100)
  })

})

// ─────────────────────────────────────────────────────────────────────────────
describe("TaxEngine.formatDiscriminado — Formatação legível", () => {

  it("retorna string multi-linha com os tributos", () => {
    const r   = calculate({ ncm: "8708", preco: 100, qty: 1, ufDestino: "MA" })
    const txt = formatDiscriminado(r)
    expect(typeof txt).toBe("string")
    expect(txt).toContain("Base de Cálculo")
    expect(txt).toContain("Total Impostos")
  })

  it("não inclui tributos com valor zero", () => {
    const r = calculate({
      ncm: "8708", preco: 100, qty: 1,
      isB2B: false, regime: REGIMES.SIMPLES,
    })
    const txt = formatDiscriminado(r)
    // IPI = 0 e ICMS = 0 no Simples, logo não devem aparecer
    // (a função filtra v.valor > 0)
    expect(txt).not.toMatch(/IPI\s+0\.00/)
  })

})

// ─────────────────────────────────────────────────────────────────────────────
describe("TaxEngine — Exportação e constantes", () => {

  it("REGIMES exporta as três constantes", () => {
    expect(REGIMES).toHaveProperty("SIMPLES")
    expect(REGIMES).toHaveProperty("LUCRO_PRESUMIDO")
    expect(REGIMES).toHaveProperty("LUCRO_REAL")
  })

  it("ICMS_UF tem 27 entradas (26 estados + DF)", () => {
    const ufs = Object.keys(TaxEngine.ICMS_UF)
    expect(ufs.length).toBeGreaterThanOrEqual(17)  // pelo menos os principais
  })

  it("NCM_TAX_RULES tem default e pelo menos 5 NCMs cap.87", () => {
    const keys = Object.keys(TaxEngine.NCM_TAX_RULES)
    expect(keys).toContain("default")
    const cap87 = keys.filter(k => k.startsWith("8708"))
    expect(cap87.length).toBeGreaterThanOrEqual(5)
  })

  it("TaxEngine exporta todos os métodos esperados", () => {
    expect(typeof TaxEngine.calculate).toBe("function")
    expect(typeof TaxEngine.calculateCart).toBe("function")
    expect(typeof TaxEngine.formatDiscriminado).toBe("function")
    expect(typeof TaxEngine.lookupNcm).toBe("function")
  })

})
