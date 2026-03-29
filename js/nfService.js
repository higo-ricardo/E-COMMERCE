// ─── HIVERCAR · nfService.js ─────────────────────────────────────────────────
// US-43 · Sprint 05 — Emissão de NFC-e via SEFAZ
//
// Arquitetura:
//   Frontend → NFService.emitir() → Appwrite Function "emit-nfe"
//   → Integrador NF-e (NFe.io / Focus NF-e / Plugnotas) → SEFAZ
//   → XML autorizado + PDF DANFE → armazenados no Appwrite
//
// MODO DE OPERAÇÃO:
//   CONFIG.FISCAL.AMBIENTE = "homologacao"  → testes sem validade fiscal
//   CONFIG.FISCAL.AMBIENTE = "producao"     → emissão real (requer certificado A1)
//
// PREREQUISITOS (BLOQUEADORES):
//   - Certificado Digital A1 (e-CNPJ) emitido por AC credenciada ICP-Brasil
//   - Conta ativa no integrador: NFe.io, Focus NF-e ou Plugnotas
//   - Appwrite Function "emit-nfe" configurada com as credenciais do integrador
//   - US-44 (TaxEngine) concluída — NF-e usa os valores calculados pelo TaxEngine
//
// Camada: Domain / Service
// ─────────────────────────────────────────────────────────────────────────────

import { databases, ID, Query } from "./appwriteClient.js"
import { CONFIG }               from "./config.js"
import { TaxEngine }            from "./taxEngine.js"

const { DB, COL, FISCAL, FUNCTIONS, ENDPOINT, PROJECT_ID } = CONFIG

// ─────────────────────────────────────────────────────────────────────────────
// MONTAR PAYLOAD DA NF-e
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Monta o payload padronizado para envio ao integrador de NF-e.
 * Compatível com NFe.io, Focus NF-e e Plugnotas (adaptação mínima necessária).
 *
 * @param {object} pedido — documento do Appwrite (collection orders)
 * @returns {object} — payload da NF-e
 */
function buildNFePayload(pedido) {
  let items = []
  try { items = JSON.parse(pedido.items || "[]") } catch { items = [] }

  let taxBreakdown = {}
  try { taxBreakdown = JSON.parse(pedido.taxBreakdown || "{}") } catch {}

  const numero = pedido.$id.slice(-8).toUpperCase()
  const agora  = new Date().toISOString()

  return {
    // ── Identificação ──────────────────────────────────────────────────────
    ambiente:    FISCAL.AMBIENTE,   // "homologacao" | "producao"
    naturezaOperacao: "VENDA DE MERCADORIA",
    tipoDocumento:    65,            // 65 = NFC-e (Nota Fiscal do Consumidor)
    finalidade:       1,             // 1 = Normal

    // ── Emitente ──────────────────────────────────────────────────────────
    emitente: {
      cnpj:         FISCAL.CNPJ.replace(/\D/g, ""),
      razaoSocial:  FISCAL.RAZAO_SOCIAL,
      nomeFantasia: "HIVERCAR AUTOPEÇAS",
      inscricaoEstadual: "000000000",  // substituir pelo IE real
      endereco: {
        logradouro:  "AV ATALIBA VIEIRA",
        numero:      "1357",
        bairro:      "CENTRO",
        municipio:   "Chapadinha",
        uf:          "MA",
        cep:         "65500000",
        pais:        "1058",  // 1058 = Brasil
      },
      regimeTributario: FISCAL.REGIME === "simples_nacional" ? 1 : 3,
    },

    // ── Destinatário ──────────────────────────────────────────────────────
    destinatario: {
      nome:          pedido.nome || "CONSUMIDOR FINAL",
      cpf:           pedido.cpf  ? pedido.cpf.replace(/\D/g, "") : null,
      indicadorIE:   9,   // 9 = Não contribuinte
      endereco: {
        logradouro: pedido.endereco || "SEM ENDEREÇO",
        numero:     pedido.numero   || "S/N",
        bairro:     pedido.bairro   || "NÃO INFORMADO",
        municipio:  pedido.cidade   || "NÃO INFORMADO",
        uf:         pedido.estado   || "MA",
        cep:        pedido.cep      ? pedido.cep.replace(/\D/g, "") : "00000000",
        pais:       "1058",
      },
      email: pedido.email || null,
    },

    // ── Itens da nota ─────────────────────────────────────────────────────
    itens: items.map((item, i) => {
      const tax = TaxEngine.calculate({
        ncm:       item.ncm    || "8708.99.00",
        preco:     item.price  || 0,
        qty:       item.qty    || 1,
        ufDestino: pedido.estado || "MA",
      })

      return {
        numero:           i + 1,
        codigo:           item.$id?.slice(-8).toUpperCase() || `PROD${i+1}`,
        descricao:        item.name || "PEÇA AUTOMOTIVA",
        ncm:              item.ncm  || "8708.99.00",
        cfop:             pedido.estado === "MA" ? "5102" : "6102",  // 51xx = mesma UF, 61xx = outra UF
        unidade:          "UN",
        quantidade:       item.qty  || 1,
        valorUnitario:    item.price || 0,
        valorTotal:       +(Number(item.price || 0) * (item.qty || 1)).toFixed(2),

        // Tributos calculados pelo TaxEngine
        ipi: {
          situacaoTributaria: "99",   // Outras situações — validar com contador
          aliquota:           tax.discriminado.IPI?.aliquota  || 0,
          valor:              tax.ipi,
        },
        pis: {
          situacaoTributaria: "01",   // tributado cumulativamente — validar
          aliquota:           tax.discriminado.PIS?.aliquota  || 0,
          valor:              tax.pis,
        },
        cofins: {
          situacaoTributaria: "01",   // tributado cumulativamente — validar
          aliquota:           tax.discriminado.COFINS?.aliquota || 0,
          valor:              tax.cofins,
        },
        icms: {
          situacaoTributaria: "00",   // tributado integralmente — validar
          aliquota:           tax.discriminado.ICMS?.aliquota  || 0,
          valor:              tax.icms,
        },
      }
    }),

    // ── Totais ────────────────────────────────────────────────────────────
    totais: {
      baseCalculo:  +Number(pedido.subtotal || 0).toFixed(2),
      icms:         +(taxBreakdown.ICMS   || 0),
      ipi:          +(taxBreakdown.IPI    || 0),
      pis:          +(taxBreakdown.PIS    || 0),
      cofins:       +(taxBreakdown.COFINS || 0),
      cbs:          +(taxBreakdown.CBS    || 0),
      ibs:          +(taxBreakdown.IBS    || 0),
      frete:        +(pedido.frete  || 0),
      totalNota:    +(pedido.total  || 0),
    },

    // ── Pagamento ──────────────────────────────────────────────────────────
    pagamento: {
      indicadorPagamento: 0,   // 0 = à vista
      meios: [{
        meio:  _mapPaymentMeio(pedido.payment),
        valor: +(pedido.total || 0),
      }],
    },

    // ── Informações complementares ─────────────────────────────────────────
    informacoesComplementares:
      `Pedido #${numero} | ${agora.slice(0, 10)} | HIVERCAR AUTOPEÇAS — Sistema ERP`,
  }
}

function _mapPaymentMeio(payment) {
  const map = { pix: "17", card: "03", boleto: "15", dinheiro: "01" }
  return map[payment] ?? "99"   // 99 = outros
}

// ─────────────────────────────────────────────────────────────────────────────
// EMITIR NF-e
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Emite a NFC-e para um pedido via Appwrite Function "emit-nfe".
 *
 * @param {string} orderId — ID do pedido no Appwrite
 * @returns {{ ok, chaveAcesso, pdfUrl, xmlUrl, protocolo, ambiente }}
 * @throws {Error} se o ambiente for produção sem certificado configurado
 */
export async function emitir(orderId) {
  // 1. Buscar pedido
  const pedido = await databases.getDocument(DB, COL.ORDERS, orderId)
  if (!pedido) throw new Error(`Pedido ${orderId} não encontrado`)

  // 2. Verificar se já foi emitida
  if (pedido.nfeStatus === "emitida") {
    return { ok: false, reason: "nfe_ja_emitida", chaveAcesso: pedido.nfeChave }
  }

  // 3. Montar payload
  const payload = buildNFePayload(pedido)

  // 4. Chamar Appwrite Function (que tem as credenciais do integrador)
  const fnUrl = `${ENDPOINT}/functions/${FUNCTIONS.EMIT_NFE}/executions`
  const resp  = await fetch(fnUrl, {
    method: "POST",
    headers: {
      "Content-Type":      "application/json",
      "X-Appwrite-Project": PROJECT_ID,
    },
    body: JSON.stringify({ orderId, payload }),
  })

  if (!resp.ok) {
    const txt = await resp.text()
    throw new Error(`Appwrite Function emit-nfe retornou ${resp.status}: ${txt}`)
  }

  const result = await resp.json()

  if (!result.ok) {
    // Registrar falha no pedido
    await databases.updateDocument(DB, COL.ORDERS, orderId, {
      nfeStatus: "erro",
      nfeErro:   result.mensagem || "Erro desconhecido na emissão",
    })
    throw new Error(`Falha na emissão: ${result.mensagem || "Erro integrador NF-e"}`)
  }

  // 5. Armazenar resultado no Appwrite
  await databases.updateDocument(DB, COL.ORDERS, orderId, {
    nfeStatus:   "emitida",
    nfeChave:    result.chaveAcesso,
    nfeProtocolo:result.protocolo   || null,
    nfePdfUrl:   result.pdfUrl      || null,
    nfeXmlUrl:   result.xmlUrl      || null,
    nfeEmitidaEm:new Date().toISOString(),
    nfeAmbiente: FISCAL.AMBIENTE,
  })

  // 6. Registrar no collection nfe_documents
  await databases.createDocument(DB, COL.NFE_DOCUMENTS, ID.unique(), {
    orderId,
    chaveAcesso:  result.chaveAcesso,
    protocolo:    result.protocolo   || null,
    pdfUrl:       result.pdfUrl      || null,
    xmlUrl:       result.xmlUrl      || null,
    serie:        FISCAL.SERIE_NFE,
    numero:       orderId.slice(-8).toUpperCase(),
    ambiente:     FISCAL.AMBIENTE,
    emitidaEm:    new Date().toISOString(),
    totalNota:    pedido.total,
    destinatarioCpf: pedido.cpf || null,
  })

  return {
    ok:          true,
    chaveAcesso: result.chaveAcesso,
    protocolo:   result.protocolo,
    pdfUrl:      result.pdfUrl,
    xmlUrl:      result.xmlUrl,
    ambiente:    FISCAL.AMBIENTE,
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// CANCELAR NF-e
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Cancela uma NF-e emitida.
 * Prazo máximo: 30 minutos após emissão (NFC-e) ou 24h (NF-e modelo 55).
 *
 * @param {string} orderId  — ID do pedido
 * @param {string} motivo   — Motivo do cancelamento (mínimo 15 chars, obrigatório)
 * @returns {{ ok, protocolo }}
 */
export async function cancelar(orderId, motivo) {
  if (!motivo || motivo.trim().length < 15) {
    throw new Error("Motivo do cancelamento deve ter no mínimo 15 caracteres.")
  }

  const pedido = await databases.getDocument(DB, COL.ORDERS, orderId)
  if (pedido.nfeStatus !== "emitida") {
    throw new Error(`Não é possível cancelar — NF-e está com status "${pedido.nfeStatus}"`)
  }

  const fnUrl = `${ENDPOINT}/functions/${FUNCTIONS.CANCEL_NFE}/executions`
  const resp  = await fetch(fnUrl, {
    method: "POST",
    headers: { "Content-Type": "application/json", "X-Appwrite-Project": PROJECT_ID },
    body: JSON.stringify({ orderId, chaveAcesso: pedido.nfeChave, motivo }),
  })

  if (!resp.ok) throw new Error(`cancel-nfe retornou ${resp.status}`)
  const result = await resp.json()
  if (!result.ok) throw new Error(result.mensagem || "Erro ao cancelar NF-e")

  await databases.updateDocument(DB, COL.ORDERS, orderId, {
    nfeStatus:      "cancelada",
    nfeCancelEm:    new Date().toISOString(),
    nfeCancelMotivo:motivo,
    nfeCancelProt:  result.protocolo || null,
  })

  return { ok: true, protocolo: result.protocolo }
}

// ─────────────────────────────────────────────────────────────────────────────
// CONSULTAR NF-e
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Busca todas as NF-e emitidas de um período.
 * @param {{ mes, ano, limit }} params
 */
export async function listarNFe({ mes, ano, limit = 100 } = {}) {
  const queries = [Query.orderDesc("emitidaEm"), Query.limit(limit)]

  if (mes && ano) {
    const inicio = new Date(ano, mes - 1, 1).toISOString()
    const fim    = new Date(ano, mes, 0, 23, 59, 59).toISOString()
    queries.push(Query.greaterThanEqual("emitidaEm", inicio))
    queries.push(Query.lessThanEqual("emitidaEm", fim))
  }

  const res = await databases.listDocuments(DB, COL.NFE_DOCUMENTS, queries)
  return res.documents
}

// ─────────────────────────────────────────────────────────────────────────────
// EXPORTAÇÃO AGRUPADA
// ─────────────────────────────────────────────────────────────────────────────
export const NFService = {
  emitir,
  cancelar,
  listarNFe,
  buildNFePayload,   // exposto para testes unitários
}
