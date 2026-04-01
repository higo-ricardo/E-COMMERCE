/**
 * 📋 DocumentNumberService - Guia de Integração e Uso
 *
 * Criado: 31 de Março de 2026
 * Projeto: HIVERCAR
 * Objetivo: Consolidar geração de números de documentos em um serviço centralizado
 */

// ─────────────────────────────────────────────────────────────────────────────
// 🚀 USO RÁPIDO
// ─────────────────────────────────────────────────────────────────────────────

import { DocumentNumberService } from "./js/documentNumberService.js"

// 1️⃣ Gerar pedido
const numeroPedido = DocumentNumberService.order()
console.log("Pedido:", numeroPedido)
// → 26033014235401234

// 2️⃣ Gerar NF-e
const numeroNFe = DocumentNumberService.invoice()
console.log("NF-e:", numeroNFe)
// → 20260331000001234

// 3️⃣ Gerar OS
const numeroOS = DocumentNumberService.serviceOrder()
console.log("OS:", numeroOS)
// → OS-260331-AB1C2

// 4️⃣ Gerar recibo
const numeroRecibo = DocumentNumberService.receipt()
console.log("Recibo:", numeroRecibo)
// → REC-20260331-142354-AB12

// ─────────────────────────────────────────────────────────────────────────────
// 📊 TIPOS SUPORTADOS
// ─────────────────────────────────────────────────────────────────────────────

// Pedidos de compra
DocumentNumberService.order()
// → 26033014235401234 (18 dígitos)

// Notas fiscais eletrônicas (NF-e)
DocumentNumberService.invoice()
// → 20260331000001234 (17 dígitos, compatível SEFAZ)

// Ordens de serviço
DocumentNumberService.serviceOrder()
// → OS-260331-AB1C2 (legível, com prefixo)

// Boletos bancários
DocumentNumberService.boleto()
// → 12345678901234567890 (20 dígitos)

// Recibos/Comprovantes
DocumentNumberService.receipt()
// → REC-20260331-142354-AB12

// Orçamentos
DocumentNumberService.quote()
// → ORC-260331-A1B2C

// Conhecimento de transporte (CT-e)
DocumentNumberService.cte()
// → 20260331000001234 (similar a NF-e)

// Nota de serviço eletrônica (NFSe)
DocumentNumberService.nfse()
// → NFSE-20260331-000001

// ─────────────────────────────────────────────────────────────────────────────
// ✅ VALIDAÇÃO
// ─────────────────────────────────────────────────────────────────────────────

const numero = DocumentNumberService.order()

if (DocumentNumberService.isValid("order", numero)) {
  console.log("✅ Número de pedido válido!")
}

// Validação de outros tipos
DocumentNumberService.isValid("invoice", "20260331000001234")      // true
DocumentNumberService.isValid("serviceorder", "OS-260331-AB1C2")   // true
DocumentNumberService.isValid("receipt", "REC-20260331-142354-AB12") // true
DocumentNumberService.isValid("boleto", "12345678901234567890")     // true

// ─────────────────────────────────────────────────────────────────────────────
// 🔍 PARSING - DECOMPOR NÚMERO EM PARTES
// ─────────────────────────────────────────────────────────────────────────────

const numero_pedido = "26033014235401234"
const parsed = DocumentNumberService.parse("order", numero_pedido)

console.log(parsed)
// {
//   type: "Pedido",
//   number: "26033014235401234",
//   date: "2026-03-30",
//   time: "14:25:34",
//   random: "0123",
//   timestamp: "260330142534"
// }

// Parse de NF-e
const parsed_nfe = DocumentNumberService.parse("invoice", "20260331000001234")
console.log(parsed_nfe)
// { type: "NF-E", number: "20260331000001234", date: "2026-03-31", sequence: "00000123" }

// Parse de OS
const parsed_os = DocumentNumberService.parse("serviceorder", "OS-260331-AB1C2")
console.log(parsed_os)
// { type: "Ordem de Serviço", number: "OS-260331-AB1C2", date: "2026-03-31", code: "AB1C2" }

// ─────────────────────────────────────────────────────────────────────────────
// 📦 LOTES - GERAR MÚLTIPLOS
// ─────────────────────────────────────────────────────────────────────────────

// Gerar 10 pedidos
const pedidos = DocumentNumberService.generateBatch("order", 10)
console.log(pedidos)
// [26033014235401234, 26033014235401235, 26033014235401236, ...]

// Gerar 5 ordens de serviço
const oses = DocumentNumberService.generateBatch("serviceOrder", 5)
console.log(oses)
// ["OS-260331-AB1C2", "OS-260331-XY9Z8", ...]

// ─────────────────────────────────────────────────────────────────────────────
// 🎓 INTEGRAÇÃO COM orderService.js
// ─────────────────────────────────────────────────────────────────────────────

// ✅ ANTES (orderService.js)
// import { generateOrderNumber } from "./utils.js"
// const order = { number: generateOrderNumber(), ... }

// ✅ DEPOIS (orderService.js)
// import { DocumentNumberService } from "./documentNumberService.js"
// const order = { number: DocumentNumberService.order(), ... }

// ─────────────────────────────────────────────────────────────────────────────
// 🎓 INTEGRAÇÃO COM nfService.js
// ─────────────────────────────────────────────────────────────────────────────

// ✅ ANTES (nfService.js)
// const numero = pedido.$id.slice(-8).toUpperCase()

// ✅ DEPOIS (nfService.js)
// const numero = DocumentNumberService.invoice()

// ─────────────────────────────────────────────────────────────────────────────
// 🎓 INTEGRAÇÃO COM admin-os.html
// ─────────────────────────────────────────────────────────────────────────────

// ✅ ANTES (admin-os.html)
// reference: "OS-" + osId.substring(0,8),

// ✅ DEPOIS (admin-os.html)
// import { DocumentNumberService } from "./js/documentNumberService.js"
// reference: DocumentNumberService.serviceOrder(),

// ─────────────────────────────────────────────────────────────────────────────
// 📋 CASOS DE USO REAIS
// ─────────────────────────────────────────────────────────────────────────────

// 1. Criar pedido com número único
async function criarPedido(userData) {
  const order = {
    number: DocumentNumberService.order(),
    user: userData.name,
    email: userData.email,
    total: 1500.00,
    // ... outros campos
  }
  await savePedidoNoBanco(order)
}

// 2. Emitir NF-e após pagamento
async function emitirNFe(pedido) {
  const nfPayload = {
    numero: DocumentNumberService.invoice(),
    pedidoNum: pedido.number,
    itens: pedido.items,
    valor: pedido.total,
    // ... outros campos
  }
  await enviarParaSefaz(nfPayload)
}

// 3. Criar OS no sistema de oficina
async function criarOS(cliente, veiculo) {
  const os = {
    numero: DocumentNumberService.serviceOrder(),
    cliente,
    veiculo,
    data: new Date().toISOString(),
    status: "ABERTA",
    // ... outros campos
  }
  await salvarOS(os)
}

// 4. Gerar lote de recibos para impressão
function gerarRecibosEmLote(quantidade) {
  const recibos = DocumentNumberService.generateBatch("receipt", quantidade)
  const html = recibos.map((rec, i) => `
    <div class="recibo">
      <h2>Recibo ${i + 1}</h2>
      <p>Número: ${rec}</p>
      <p>Data/Hora: ${DocumentNumberService.parse("receipt", rec).date} 
                    ${DocumentNumberService.parse("receipt", rec).time}</p>
    </div>
  `).join("")
  
  return imprimirHTML(html)
}

// ─────────────────────────────────────────────────────────────────────────────
// 🛠️ MÉTODOS UTILITÁRIOS
// ─────────────────────────────────────────────────────────────────────────────

// Listar tipos suportados
const tipos = DocumentNumberService.getSupportedTypes()
console.log(tipos)
// ["order", "invoice", "serviceOrder", "boleto", "receipt", "quote", "cte", "nfse"]

// Gerar exemplos de cada tipo
const exemplos = DocumentNumberService.examples()
console.log(exemplos)
// {
//   order: 26033014235401234,
//   invoice: "20260331000001234",
//   serviceOrder: "OS-260331-AB1C2",
//   boleto: "12345678901234567890",
//   receipt: "REC-20260331-142354-AB12",
//   quote: "ORC-260331-A1B2C",
//   cte: "20260331000001234",
//   nfse: "NFSE-20260331-000001"
// }

// ─────────────────────────────────────────────────────────────────────────────
// ⚙️ CONFIGURAÇÃO EM PRODUÇÃO
// ─────────────────────────────────────────────────────────────────────────────

/*
IMPORTANTE: Em produção, alguns tipos precisam de integração com provedores:

1. NF-e (invoice / cte / nfse):
   - Integrar com SEFAZ via provedor (NFe.io, Focus NF-e, Plugnotas)
   - Usar a sequência autorizada pelo SEFAZ
   - Não usar este gerador para números reais - apenas para teste

2. Boleto:
   - Integrar com banco
   - Calcular dígito verificador (Modulo 11)
   - Montar código de barras completo

3. Números sequenciais em banco:
   - Para alta concorrência, usar incremento atômico no banco
   - Appwrite não tem auto-increment nativo
   - Solução: usar documento separado como "counter"

EXEMPLO COM COUNTER:
async function getNextOrderNumber() {
  const counter = await databases.getDocument(
    CONFIG.DB, CONFIG.COL.COUNTERS, "orders"
  )
  
  const next = counter.value + 1
  await databases.updateDocument(
    CONFIG.DB, CONFIG.COL.COUNTERS, "orders", { value: next }
  )
  
  return next
}
*/

// ─────────────────────────────────────────────────────────────────────────────
// 🧪 TESTES
// ─────────────────────────────────────────────────────────────────────────────

// Rodar testes
// npm test -- documentNumberService.test.js

// Exemplos de teste:
import { describe, it, expect } from "vitest"

describe("DocumentNumberService", () => {
  it("deve gerar pedido com 18 dígitos", () => {
    const order = DocumentNumberService.order()
    expect(String(order)).toMatch(/^\d{18}$/)
  })

  it("deve validar NF-e com 17 dígitos", () => {
    const invoice = DocumentNumberService.invoice()
    expect(DocumentNumberService.isValid("invoice", invoice)).toBe(true)
  })

  it("deve gerar OS com prefixo", () => {
    const os = DocumentNumberService.serviceOrder()
    expect(os.startsWith("OS-")).toBe(true)
  })

  it("deve decompor pedido corretamente", () => {
    const order = DocumentNumberService.order()
    const parsed = DocumentNumberService.parse("order", order)
    expect(parsed).toHaveProperty("date")
    expect(parsed).toHaveProperty("time")
  })
})

// ─────────────────────────────────────────────────────────────────────────────
// 📞 RETROCOMPATIBILIDADE
// ─────────────────────────────────────────────────────────────────────────────

// A função antiga ainda funciona (deprecated):
import { generateOrderNumber } from "./js/documentNumberService.js"

const numero_antigo = generateOrderNumber()
// Equivalente a:
const numero_novo = DocumentNumberService.order()

// Ambas geram números válidos com o mesmo formato

// ─────────────────────────────────────────────────────────────────────────────
// 🎯 PRÓXIMAS MELHORIAS
// ─────────────────────────────────────────────────────────────────────────────

/*
1. Integração com contador no banco (para produção)
   - Evitar colisões em alta concorrência
   - Usar incremento atômico do Appwrite

2. Suporte a prefixos customizáveis
   - Permitir mudança de formato por config
   - Ex: OS-YYYYMMDD-XXX vs SEO-YYYYMMDD-XXX

3. Suporte a diferentes calendários
   - Calendário fiscal (por mês fiscal)
   - Calendários por loja/filial

4. Rastreamento de séries
   - Registro de quando cada série foi iniciada
   - Suporte a múltiplas séries simultâneas

5. Cache de números gerados
   - Pré-gerar lotes para performance
   - Útil em alta concorrência
*/

export { DocumentNumberService, generateOrderNumber }
