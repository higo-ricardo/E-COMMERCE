// ─── HIVERCAR · taxEngine.js ─────────────────────────────────────────────────
// US-44 · Sprint 05 - Motor de Regras Tributárias por NCM
//
// Substitui o TAX_RATE fixo de 12% por cálculo real baseado em:
//   - NCM do produto (capítulo 87 da TIPI - peças automotivas)
//   - UF do comprador (ICMS interestadual)
//   - Regime tributário da empresa (Simples Nacional vs Lucro Presumido)
//   - EC 132/2023 - Reforma Tributária: CBS substitui PIS/COFINS, IBS substitui ICMS
//
// IMPORTANTE: As alíquotas desta implementação são REFERÊNCIAS baseadas na
// legislação vigente em Março 2026. DEVEM ser validadas por contador
// responsável antes de uso em produção.
//
// Camada: Domain / Service
//
// USO:
//   import { TaxEngine } from "./taxEngine.js"
//
//   const resultado = TaxEngine.calculate({
//     ncm:       "8708.30.90",   // NCM do produto
//     preco:     150.00,         // preço unitário
//     qty:       2,              // quantidade
//     ufDestino: "SP",           // UF do comprador
//     isB2B:     false,          // false = consumidor final, true = CNPJ
//   })
//   // resultado.total, resultado.discriminado, resultado.aliquotaEfetiva
// ─────────────────────────────────────────────────────────────────────────────

// ─────────────────────────────────────────────────────────────────────────────
// TABELA ICMS INTERESTADUAL - UF ORIGEM: MA (Maranhão)
// Alíquotas padrão conforme Convênio ICMS 142/2018 e Resoluções do Senado
// Validar com SEFAZ-MA antes de uso em produção
// ─────────────────────────────────────────────────────────────────────────────
const ICMS_UF = {
  // Norte / Nordeste - 12% (operação interestadual entre estados do mesmo grupo)
  MA: 12, PA: 12, PI: 12, CE: 12, RN: 12, PB: 12,
  PE: 12, AL: 12, SE: 12, BA: 12, AM: 12, RR: 12,
  AP: 12, AC: 12, TO: 12, RO: 12,

  // Centro-Oeste - 12%
  DF: 12, GO: 12, MT: 12, MS: 12,

  // Sudeste/Sul - 7% (MA → SP/RJ/MG/ES/PR/SC/RS: alíquota reduzida)
  SP:  7, RJ:  7, MG:  7, ES:  7,
  PR:  7, SC:  7, RS:  7,
}

// ─────────────────────────────────────────────────────────────────────────────
// TABELA NCM → IMPOSTOS
// Capítulo 87 TIPI - Veículos automóveis, tratores, etc.
// Posição 8708 - Partes e acessórios para automóveis
//
// EC 132/2023 - Transição 2026-2033:
//   - CBS (Contribuição sobre Bens e Serviços) substitui PIS/COFINS
//   - IBS (Imposto sobre Bens e Serviços) substitui ICMS/ISS
//   - Alíquota de referência CBS+IBS = 26,5% (estimativa RFB)
//   - Durante transição, mantém-se PIS/COFINS e ICMS (reduções graduais)
//
// ATENÇÃO: Alíquotas abaixo são ESTIMATIVAS para peças automotivas.
// Validar com contador e TIPI atualizada antes de produção.
// ─────────────────────────────────────────────────────────────────────────────
const NCM_TAX_RULES = {
  // ── 8708 - Partes e acessórios de automóveis ──────────────────────────────
  "8708":    { ipi: 5,   pis: 1.65, cofins: 7.6,  cbs: 0.9, ibs: 17.0, descricao: "Partes e acessórios de automóveis" },
  "8708.10": { ipi: 5,   pis: 1.65, cofins: 7.6,  cbs: 0.9, ibs: 17.0, descricao: "Para-choques" },
  "8708.21": { ipi: 5,   pis: 1.65, cofins: 7.6,  cbs: 0.9, ibs: 17.0, descricao: "Cintos de segurança" },
  "8708.29": { ipi: 5,   pis: 1.65, cofins: 7.6,  cbs: 0.9, ibs: 17.0, descricao: "Outras partes de carroçaria" },
  "8708.30": { ipi: 5,   pis: 1.65, cofins: 7.6,  cbs: 0.9, ibs: 17.0, descricao: "Freios e servos de freio" },
  "8708.40": { ipi: 5,   pis: 1.65, cofins: 7.6,  cbs: 0.9, ibs: 17.0, descricao: "Caixas de câmbio" },
  "8708.50": { ipi: 5,   pis: 1.65, cofins: 7.6,  cbs: 0.9, ibs: 17.0, descricao: "Eixos com diferencial" },
  "8708.60": { ipi: 5,   pis: 1.65, cofins: 7.6,  cbs: 0.9, ibs: 17.0, descricao: "Rodas e respectivas partes" },
  "8708.70": { ipi: 5,   pis: 1.65, cofins: 7.6,  cbs: 0.9, ibs: 17.0, descricao: "Radiadores" },
  "8708.80": { ipi: 5,   pis: 1.65, cofins: 7.6,  cbs: 0.9, ibs: 17.0, descricao: "Silenciosos e tubos de escape" },
  "8708.91": { ipi: 5,   pis: 1.65, cofins: 7.6,  cbs: 0.9, ibs: 17.0, descricao: "Radiadores e defletores" },
  "8708.92": { ipi: 5,   pis: 1.65, cofins: 7.6,  cbs: 0.9, ibs: 17.0, descricao: "Silenciosos e tubos de escape" },
  "8708.93": { ipi: 5,   pis: 1.65, cofins: 7.6,  cbs: 0.9, ibs: 17.0, descricao: "Embreagens" },
  "8708.94": { ipi: 5,   pis: 1.65, cofins: 7.6,  cbs: 0.9, ibs: 17.0, descricao: "Volantes, colunas e caixas de direção" },
  "8708.99": { ipi: 5,   pis: 1.65, cofins: 7.6,  cbs: 0.9, ibs: 17.0, descricao: "Outras partes e acessórios" },

  // ── 8482 - Rolamentos ─────────────────────────────────────────────────────
  "8482":    { ipi: 10,  pis: 1.65, cofins: 7.6,  cbs: 0.9, ibs: 17.0, descricao: "Rolamentos" },

  // ── 8512 - Aparelhos elétricos de iluminação ─────────────────────────────
  "8512":    { ipi: 15,  pis: 1.65, cofins: 7.6,  cbs: 0.9, ibs: 17.0, descricao: "Aparelhos de iluminação veicular" },

  // ── 4011 - Pneus novos ────────────────────────────────────────────────────
  "4011":    { ipi: 0,   pis: 1.65, cofins: 7.6,  cbs: 0.9, ibs: 17.0, descricao: "Pneus novos" },

  // ── 3403 - Óleos lubrificantes ────────────────────────────────────────────
  "3403":    { ipi: 0,   pis: 1.65, cofins: 7.6,  cbs: 0.9, ibs: 17.0, descricao: "Óleos lubrificantes" },

  // ── DEFAULT - regra genérica para NCMs não mapeados ───────────────────────
  "default": { ipi: 5,   pis: 1.65, cofins: 7.6,  cbs: 0.9, ibs: 17.0, descricao: "Peça automotiva genérica" },
}

// ─────────────────────────────────────────────────────────────────────────────
// REGIMES TRIBUTÁRIOS
// ─────────────────────────────────────────────────────────────────────────────
const REGIMES = {
  SIMPLES:          "simples_nacional",   // MEI e ME - PIS/COFINS incluídos no DAS
  LUCRO_PRESUMIDO:  "lucro_presumido",
  LUCRO_REAL:       "lucro_real",
}

// Alíquota vigente durante período de transição 2026 (EC 132/2023)
// CBS plena: 0.9% | IBS plena: estimativa 17%
// Coexistência com PIS/COFINS (redução de 30% por ano a partir de 2027)
const TRANSICAO_2026 = {
  pisReducao:    0.3,   // 30% da alíquota original em 2026
  cofinsReducao: 0.3,
  cbsVigor:      true,
  ibsVigor:      true,
}

// ─────────────────────────────────────────────────────────────────────────────
// FUNÇÃO AUXILIAR - LOOKUP NCM
// Busca pela mais específica disponível (8708.30.90 → 8708.30 → 8708 → default)
// ─────────────────────────────────────────────────────────────────────────────
function lookupNcm(ncm) {
  if (!ncm) return NCM_TAX_RULES["default"]
  const clean = ncm.replace(/\s/g, "")

  // Tenta do mais específico ao mais genérico
  const prefixos = [
    clean,                              // 8708.30.90
    clean.slice(0, 7),                  // 8708.30
    clean.slice(0, 4),                  // 8708
    clean.slice(0, 2),                  // 87
  ]

  for (const p of prefixos) {
    if (NCM_TAX_RULES[p]) return NCM_TAX_RULES[p]
  }

  return NCM_TAX_RULES["default"]
}

// ─────────────────────────────────────────────────────────────────────────────
// MOTOR PRINCIPAL
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Calcula todos os tributos para um item de venda.
 *
 * @param {{
 *   ncm:        string,   NCM do produto (ex: "8708.30.90")
 *   preco:      number,   Preço unitário
 *   qty:        number,   Quantidade (padrão: 1)
 *   ufDestino:  string,   UF do comprador (ex: "SP")
 *   isB2B:      boolean,  true = empresa (CNPJ), false = consumidor final (default)
 *   regime:     string,   Regime tributário (default: lucro_presumido)
 * }} params
 *
 * @returns {{
 *   baseCalculo:      number,   Preço total antes dos impostos
 *   ipi:              number,   Valor do IPI
 *   pis:              number,   Valor do PIS (transição EC 132/2023)
 *   cofins:           number,   Valor do COFINS (transição EC 132/2023)
 *   cbs:              number,   Valor da CBS (EC 132/2023)
 *   ibs:              number,   Valor do IBS (EC 132/2023 - estimativa)
 *   icms:             number,   Valor do ICMS (interestadual)
 *   totalImpostos:    number,   Soma de todos os tributos
 *   total:            number,   baseCalculo + totalImpostos
 *   aliquotaEfetiva:  number,   % real sobre o preço
 *   discriminado:     object,   Detalhamento completo
 *   ncmInfo:          object,   Regras do NCM aplicadas
 *   avisos:           string[], Avisos de validação
 * }}
 */
function calculate({
  ncm,
  preco,
  qty = 1,
  ufDestino = "MA",
  isB2B = false,
  regime = REGIMES.LUCRO_PRESUMIDO,
}) {
  const avisos = []
  const base   = +(Number(preco) * Number(qty)).toFixed(2)

  if (!ncm) avisos.push("NCM não informado - aplicando regra genérica. Validar com contador.")
  if (!NCM_TAX_RULES[ncm?.slice(0, 7)] && !NCM_TAX_RULES[ncm?.slice(0, 4)]) {
    avisos.push(`NCM "${ncm}" não mapeado explicitamente - usando regra padrão cap. 87.`)
  }

  const regra = lookupNcm(ncm)

  // ── IPI (sobre base de cálculo = preço + ICMS) ────────────────────────────
  const icmsAliq = ICMS_UF[ufDestino] ?? 12
  const ipiAliq  = isB2B ? regra.ipi : 0   // IPI só incide em operações B2B / saída de indústria
  // Para varejo B2C, IPI já está embutido no preço de custo da distribuidora
  const ipi = +(base * (ipiAliq / 100)).toFixed(2)

  // ── ICMS interestadual ─────────────────────────────────────────────────────
  // Diferencial de Alíquota (DIFAL) → EC 87/2015
  // Origem MA (12%) → destino: alíquota interna do destino - alíquota interestadual
  // NOTA: para Simples Nacional, ICMS já incluso no DAS
  const icms = regime === REGIMES.SIMPLES
    ? 0
    : +(base * (icmsAliq / 100)).toFixed(2)

  // ── PIS / COFINS (em transição - redução 30% em 2026) ────────────────────
  // A partir de 2027 a alíquota diminui gradualmente até zero em 2033
  const pisAliq    = regime === REGIMES.SIMPLES ? 0 : regra.pis * (1 - TRANSICAO_2026.pisReducao)
  const cofinsAliq = regime === REGIMES.SIMPLES ? 0 : regra.cofins * (1 - TRANSICAO_2026.cofinsReducao)
  const pis    = +(base * (pisAliq    / 100)).toFixed(2)
  const cofins = +(base * (cofinsAliq / 100)).toFixed(2)

  // ── CBS - Contribuição sobre Bens e Serviços (EC 132/2023) ───────────────
  const cbsAliq = TRANSICAO_2026.cbsVigor && regime !== REGIMES.SIMPLES ? regra.cbs : 0
  const cbs     = +(base * (cbsAliq / 100)).toFixed(2)

  // ── IBS - Imposto sobre Bens e Serviços (EC 132/2023) ────────────────────
  // Alíquota de referência estimada 17% a ser fixada por Lei Complementar
  // Neste período de transição (2026-2033) ainda há coexistência com ICMS
  const ibsAliq = TRANSICAO_2026.ibsVigor && regime !== REGIMES.SIMPLES ? regra.ibs : 0
  avisos.push("IBS: alíquota de referência estimada. Aguardando LC de regulamentação da EC 132/2023.")
  const ibs = +(base * (ibsAliq / 100)).toFixed(2)

  const totalImpostos = +(ipi + icms + pis + cofins + cbs + ibs).toFixed(2)
  const total         = +(base + totalImpostos).toFixed(2)
  const aliqEfetiva   = base > 0 ? +((totalImpostos / base) * 100).toFixed(2) : 0

  return {
    baseCalculo:     base,
    ipi,
    pis,
    cofins,
    cbs,
    ibs,
    icms,
    totalImpostos,
    total,
    aliquotaEfetiva: aliqEfetiva,
    discriminado: {
      "IPI":    { aliquota: ipiAliq,    valor: ipi    },
      "ICMS":   { aliquota: icmsAliq,   valor: icms   },
      "PIS":    { aliquota: pisAliq,    valor: pis    },
      "COFINS": { aliquota: cofinsAliq, valor: cofins },
      "CBS":    { aliquota: cbsAliq,    valor: cbs    },
      "IBS":    { aliquota: ibsAliq,    valor: ibs    },
    },
    ncmInfo:  { ncm, ...regra },
    ufDestino,
    regime,
    avisos,
  }
}

/**
 * Calcula impostos para um carrinho completo.
 * @param {Array<{ ncm, price, qty }>} items
 * @param {{ ufDestino, isB2B, regime }} context
 * @returns {{ itens, totalImpostos, totalBruto, aliquotaEfetiva, resumoImpostos }}
 */
function calculateCart(items, context = {}) {
  const { ufDestino = "MA", isB2B = false, regime = REGIMES.LUCRO_PRESUMIDO } = context

  const itens = items.map(item => ({
    ...item,
    tax: calculate({ ncm: item.ncm, preco: item.price, qty: item.qty ?? 1, ufDestino, isB2B, regime }),
  }))

  const totalBruto    = +itens.reduce((s, i) => s + i.tax.baseCalculo, 0).toFixed(2)
  const totalImpostos = +itens.reduce((s, i) => s + i.tax.totalImpostos, 0).toFixed(2)

  const resumoImpostos = {
    IPI:    +itens.reduce((s, i) => s + i.tax.ipi,    0).toFixed(2),
    ICMS:   +itens.reduce((s, i) => s + i.tax.icms,   0).toFixed(2),
    PIS:    +itens.reduce((s, i) => s + i.tax.pis,    0).toFixed(2),
    COFINS: +itens.reduce((s, i) => s + i.tax.cofins, 0).toFixed(2),
    CBS:    +itens.reduce((s, i) => s + i.tax.cbs,    0).toFixed(2),
    IBS:    +itens.reduce((s, i) => s + i.tax.ibs,    0).toFixed(2),
  }

  return {
    itens,
    totalBruto,
    totalImpostos,
    totalComImpostos: +(totalBruto + totalImpostos).toFixed(2),
    aliquotaEfetiva:  totalBruto > 0 ? +((totalImpostos / totalBruto) * 100).toFixed(2) : 0,
    resumoImpostos,
    contexto: { ufDestino, isB2B, regime },
  }
}

/**
 * Retorna o breakdown formatado para exibição no checkout ou NF-e.
 * @param {object} resultado - retorno de calculate()
 * @returns {string} - texto formatado
 */
function formatDiscriminado(resultado) {
  const { discriminado, baseCalculo, totalImpostos, aliquotaEfetiva, avisos } = resultado
  const linhas = [
    `Base de Cálculo: R$ ${baseCalculo.toFixed(2)}`,
    `─────────────────────────────`,
    ...Object.entries(discriminado)
      .filter(([, v]) => v.valor > 0)
      .map(([k, v]) => `${k.padEnd(8)} ${v.aliquota.toFixed(2).padStart(5)}%   R$ ${v.valor.toFixed(2)}`),
    `─────────────────────────────`,
    `Total Impostos: R$ ${totalImpostos.toFixed(2)} (${aliquotaEfetiva}%)`,
  ]
  return linhas.join("\n")
}

// ─────────────────────────────────────────────────────────────────────────────
// EXPORTAÇÃO
// ─────────────────────────────────────────────────────────────────────────────
export const TaxEngine = {
  calculate,
  calculateCart,
  formatDiscriminado,
  lookupNcm,
  REGIMES,
  NCM_TAX_RULES,
  ICMS_UF,
}

export { calculate, calculateCart, formatDiscriminado, REGIMES }
