// ─── HIVERCAR · fiscalReportService.js ───────────────────────────────────────
// US-45 · Sprint 05 - Relatórios Fiscais Mensais e Livro Fiscal (SPED)
//
// Responsabilidades:
//   - Apuração de ICMS/IBS por período
//   - Apuração de PIS/COFINS/CBS por período
//   - Exportação SPED Fiscal (arquivo TXT padrão SPED)
//   - Dashboard com impostos a recolher no mês
//   - Exportação PDF via window.print()
//
// PREREQUISITO: US-43 (NF-e emitidas) e US-44 (TaxEngine)
// VALIDAR: toda apuração deve ser conferida por contador antes de uso em produção
//
// Camada: Domain / Service
// ─────────────────────────────────────────────────────────────────────────────

import { databases, Query } from "./appwriteClient.js"
import { CONFIG }           from "./config.js"

const { DB, COL } = CONFIG

// ─────────────────────────────────────────────────────────────────────────────
// APURAÇÃO MENSAL
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Retorna o resumo fiscal de um mês/ano específico.
 *
 * @param {{ mes: number, ano: number }} params  (mes: 1-12)
 * @returns {Promise<object>} resumo com totais por imposto
 */
export async function apurarMes({ mes, ano }) {
  if (!mes || !ano) throw new Error("mes e ano são obrigatórios")

  const inicio = new Date(ano, mes - 1, 1).toISOString()
  const fim    = new Date(ano, mes, 0, 23, 59, 59).toISOString()

  // Buscar NF-e emitidas no período
  const nfeRes = await databases.listDocuments(DB, COL.NFE_DOCUMENTS, [
    Query.greaterThanEqual("emitidaEm", inicio),
    Query.lessThanEqual("emitidaEm", fim),
    Query.limit(500),
  ])

  // Buscar pedidos com breakdown fiscal no período
  const ordersRes = await databases.listDocuments(DB, COL.ORDERS, [
    Query.greaterThanEqual("createdAt", inicio),
    Query.lessThanEqual("createdAt", fim),
    Query.notEqual("status", "cancelado"),
    Query.limit(500),
  ])

  const orders = ordersRes.documents
  const nfes   = nfeRes.documents

  // Agregar totais por imposto
  const totais = {
    IPI:    0, ICMS: 0, PIS:  0,
    COFINS: 0, CBS:  0, IBS:  0,
  }
  let faturamentoBruto   = 0
  let totalImpostos      = 0
  let ticketMedioBase    = 0

  orders.forEach(order => {
    faturamentoBruto += Number(order.subtotal || 0)
    totalImpostos    += Number(order.taxes    || 0)

    let breakdown = {}
    try { breakdown = JSON.parse(order.taxBreakdown || "{}") } catch {}

    totais.IPI    += Number(breakdown.IPI    || 0)
    totais.ICMS   += Number(breakdown.ICMS   || 0)
    totais.PIS    += Number(breakdown.PIS    || 0)
    totais.COFINS += Number(breakdown.COFINS || 0)
    totais.CBS    += Number(breakdown.CBS    || 0)
    totais.IBS    += Number(breakdown.IBS    || 0)
  })

  // Arredondar tudo
  Object.keys(totais).forEach(k => { totais[k] = +totais[k].toFixed(2) })

  const qtdPedidos      = orders.length
  const ticketMedio     = qtdPedidos > 0 ? +(faturamentoBruto / qtdPedidos).toFixed(2) : 0
  const aliqEfetiva     = faturamentoBruto > 0
    ? +((totalImpostos / faturamentoBruto) * 100).toFixed(2)
    : 0

  return {
    periodo:         `${String(mes).padStart(2,"0")}/${ano}`,
    mes, ano,
    qtdPedidos,
    faturamentoBruto: +faturamentoBruto.toFixed(2),
    totalImpostos:    +totalImpostos.toFixed(2),
    aliquotaEfetiva:  aliqEfetiva,
    ticketMedio,
    qtdNFe:          nfes.length,
    impostos:        totais,
    geradoEm:        new Date().toISOString(),
    aviso:           "VALIDAR COM CONTADOR ANTES DE USAR EM APURAÇÃO OFICIAL",
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// COMPARATIVO MENSAL (últimos N meses)
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Retorna apuração dos últimos N meses para gráfico de evolução.
 * @param {number} meses - quantos meses retroativos (padrão: 6)
 */
export async function evolucaoMensal(meses = 6) {
  const resultados = []
  const agora      = new Date()

  for (let i = meses - 1; i >= 0; i--) {
    const d = new Date(agora.getFullYear(), agora.getMonth() - i, 1)
    try {
      const r = await apurarMes({ mes: d.getMonth() + 1, ano: d.getFullYear() })
      resultados.push(r)
    } catch {
      resultados.push({
        periodo: `${String(d.getMonth()+1).padStart(2,"0")}/${d.getFullYear()}`,
        faturamentoBruto: 0, totalImpostos: 0, qtdPedidos: 0,
      })
    }
  }

  return resultados
}

// ─────────────────────────────────────────────────────────────────────────────
// GERAR SPED FISCAL (TXT)
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Gera um arquivo TXT simplificado no padrão SPED Fiscal EFD (EFD ICMS/IPI).
 * ⚠ Esta é uma implementação de referência - DEVE ser validada por contador
 * e adequada ao regime tributário específico antes de uso em produção.
 *
 * @param {{ mes, ano }} params
 * @returns {string} - conteúdo do arquivo TXT no formato SPED
 */
export async function gerarSpedFiscal({ mes, ano }) {
  const apuracao = await apurarMes({ mes, ano })

  const inicio = new Date(ano, mes - 1, 1)
  const fim    = new Date(ano, mes, 0)
  const fmt    = d => d.toLocaleDateString("pt-BR").replace(/\//g, "")
  const fmtVal = v => Number(v || 0).toFixed(2).replace(".", "")

  // Buscar NF-e do período
  const nfes = await databases.listDocuments(DB, COL.NFE_DOCUMENTS, [
    Query.greaterThanEqual("emitidaEm", inicio.toISOString()),
    Query.lessThanEqual("emitidaEm",   fim.toISOString()),
    Query.limit(500),
  ])

  const linhas = []

  // Registro 0000 - Abertura do arquivo
  linhas.push(`|0000|013|0||${fmt(inicio)}|${fmt(fim)}|${CONFIG.FISCAL.RAZAO_SOCIAL}|${CONFIG.FISCAL.CNPJ.replace(/\D/g,"")}||MA|3|1|12|0|0|0||`)

  // Registro 0001 - Abertura do Bloco 0
  linhas.push(`|0001|0|`)

  // Registro 0100 - Dados do contador (obrigatório - preencher com dados reais)
  linhas.push(`|0100|CONTADOR RESPONSAVEL|000.000.000-00|CRC/UF-000000|||||||||`)

  // Registro 0990 - Encerramento do Bloco 0
  linhas.push(`|0990|${linhas.length + 1}|`)

  // Bloco C - Documentos Fiscais
  linhas.push(`|C001|0|`)

  nfes.documents.forEach((nfe, i) => {
    const dt = new Date(nfe.emitidaEm)
    // C100 - NF-e/NFC-e emitida
    linhas.push([
      "|C100",
      "1",                                          // ind_oper: 1 = saída
      "1",                                          // ind_emit: 1 = emissão própria
      nfe.destinatarioCpf?.replace(/\D/g,"") || '-',// cod_part
      "65",                                         // cod_mod: 65 = NFC-e
      "00",                                         // cod_sit: 00 = autorizada
      nfe.serie || "001",
      nfe.numero || String(i+1).padStart(9,"0"),
      nfe.chaveAcesso || '-',
      fmt(dt),
      fmt(dt),                                      // dt_e_s (entrada/saída)
      fmtVal(nfe.totalNota),
      "",                                           // ind_pgto
      "",                                           // val_desc
      fmtVal(0),                                    // val_abat_nt
      fmtVal(0),                                    // val_merc
      "1",                                          // ind_frt: 1 = sem frete
      fmtVal(0),                                    // val_frt
      fmtVal(0),                                    // val_seg
      fmtVal(0),                                    // val_out
      fmtVal(nfe.totalNota),                        // val_nf
      "|",
    ].join("|"))
  })

  linhas.push(`|C990|${linhas.filter(l => l.startsWith("|C")).length + 1}|`)

  // Bloco E - Apuração do ICMS
  linhas.push(`|E001|0|`)
  linhas.push(`|E100|${fmt(inicio)}|${fmt(fim)}|`)
  linhas.push(`|E110|${fmtVal(apuracao.faturamentoBruto)}|0|0|${fmtVal(apuracao.impostos.ICMS)}|0|0|${fmtVal(apuracao.impostos.ICMS)}|0|0|0|0|0|0|`)
  linhas.push(`|E990|3|`)

  // Bloco 9 - Controle e Encerramento
  linhas.push(`|9001|0|`)
  linhas.push(`|9900|0000|1|`)
  linhas.push(`|9900|0001|1|`)
  linhas.push(`|9900|C001|1|`)
  linhas.push(`|9900|E001|1|`)
  linhas.push(`|9900|9001|1|`)
  linhas.push(`|9990|${linhas.length + 2}|`)
  linhas.push(`|9999|${linhas.length + 1}|`)

  return linhas.join("\n")
}

// ─────────────────────────────────────────────────────────────────────────────
// EXPORTAÇÃO AGRUPADA
// ─────────────────────────────────────────────────────────────────────────────
export const FiscalReportService = {
  apurarMes,
  evolucaoMensal,
  gerarSpedFiscal,
}
