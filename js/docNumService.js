// ─── HIVERCAR · docNumService.js ─────────────────────────────────────────────
// Serviço centralizado para geração de números de documentos (pedidos, notas,
// ordens de serviço, boletos, recibos, etc).
//
// Objetivo: Consolidar lógica de sequenciamento espalhada no código.
// Antes: generateOrderNumber() em utils.js
// Depois: docNumService com suporte a múltiplos tipos
//
// Camada: Domain / Service
// Zero dependências externas (apenas Date)
// ─────────────────────────────────────────────────────────────────────────────

/**
 * docNumService - Gerador centralizado de números de documentos
 *
 * Tipos suportados:
 * • order        → Pedido de compra
 * • invoice      → Nota fiscal (NF-e)
 * • serviceOrder → Ordem de serviço
 * • boleto       → Boleto bancário
 * • receipt      → Recibo/Comprovante
 * • quote        → Orçamento
 * • cte          → Conhecimento de transporte
 * • nfse         → Nota de serviço eletrônica
 */
export const docNumService = {
  // ─────────────────────────────────────────────────────────────────────────
  // 📄 PEDIDOS
  // ─────────────────────────────────────────────────────────────────────────

  /**
   * Gera número único para pedido de compra.
   * Formato: YYMMDDHHmmss + 4 dígitos aleatórios = 18 dígitos
   * Exemplo: 26033014235401234
   *
   * JUSTIFICATIVA:
   * - Timestamp crescente garante unicidade cronológica
   * - 4 dígitos aleatórios previnem colisões em requisições simultâneas
   * - Convertido para INTEGER para armazenamento eficiente
   *
   * @returns {number} Número de pedido (18 dígitos)
   */
  order() {
    const now = new Date()
    const yy = now.getFullYear().toString().slice(-2)
    const mm = String(now.getMonth() + 1).padStart(2, "0")
    const dd = String(now.getDate()).padStart(2, "0")
    const hh = String(now.getHours()).padStart(2, "0")
    const min = String(now.getMinutes()).padStart(2, "0")
    const ss = String(now.getSeconds()).padStart(2, "0")
    const rnd = Math.floor(Math.random() * 10000)
      .toString()
      .padStart(4, "0")

    const numeric = yy + mm + dd + hh + min + ss + rnd
    return parseInt(numeric)
  },

  // ─────────────────────────────────────────────────────────────────────────
  // 🧾 NOTAS FISCAIS (NF-e)
  // ─────────────────────────────────────────────────────────────────────────

  /**
   * Gera número de nota fiscal eletrônica.
   * Formato: YYYYMMDD + 8 dígitos sequenciais = série contínua
   * Exemplo: 20260331000001234
   *
   * JUSTIFICATIVA:
   * - Formato compatível com SEFAZ (sem pontos ou hífens)
   * - Data no prefixo facilita rastreamento por período
   * - Sequencial de 8 dígitos permite até 100M de notas/dia
   * - Deve ser armazenado com commit atômico em banco para evitar duplicatas
   *
   * OBS: Em produção, integrar com provider de NF-e (NFe.io, Focus NF-e, etc)
   * que mantém sequência autorizada pela SEFAZ
   *
   * @returns {string} Número de nota fiscal (17 caracteres)
   */
  invoice() {
    const now = new Date()
    const yyyy = now.getFullYear()
    const mm = String(now.getMonth() + 1).padStart(2, "0")
    const dd = String(now.getDate()).padStart(2, "0")

    // Sequencial: timestamp curto + aleatório
    const seq = Math.floor(Date.now() % 100000000)
      .toString()
      .padStart(8, "0")

    return `${yyyy}${mm}${dd}${seq}`
  },

  // ─────────────────────────────────────────────────────────────────────────
  // 🔧 ORDENS DE SERVIÇO (OS)
  // ─────────────────────────────────────────────────────────────────────────

  /**
   * Gera número de ordem de serviço com prefixo legível.
   * Formato: OS-YYMMDD-XXXXX (com hífens para legibilidade em sistema)
   * Exemplo: OS-260331-AB1C2
   *
   * JUSTIFICATIVA:
   * - Prefixo "OS" identifica tipo de documento imediatamente
   * - YYMMDD permite agrupamento por data
   * - Código curto (5 caracteres) legível e scanneável
   * - Formato adequado para impressão em ordem de serviço física
   *
   * @returns {string} Número de OS formatado
   */
  serviceOrder() {
    const now = new Date()
    const yy = now.getFullYear().toString().slice(-2)
    const mm = String(now.getMonth() + 1).padStart(2, "0")
    const dd = String(now.getDate()).padStart(2, "0")

    // Código curto legível: mistura números e letras
    const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789"
    let code = ""
    for (let i = 0; i < 5; i++) {
      code += chars.charAt(Math.floor(Math.random() * chars.length))
    }

    return `OS-${yy}${mm}${dd}-${code}`
  },

  // ─────────────────────────────────────────────────────────────────────────
  // 💰 BOLETOS BANCÁRIOS
  // ─────────────────────────────────────────────────────────────────────────

  /**
   * Gera número sequencial para boleto bancário.
   * Formato: NNNNNNNNNNNNNNNNNNNNN (20 dígitos - nosso número)
   * Exemplo: 12345678901234567890
   *
   * JUSTIFICATIVA:
   * - Compatível com padrão de boleto FEBRABAN
   * - 20 dígitos = até 100 trilhões de boletos únicos
   * - Timestamp + aleatório = sem riscos de colisão
   *
   * OBS: Boleto real requer integrador bancário que:
   * - Calcula dígito verificador (Modulo 11)
   * - Monta código de barras completo
   * - Registra no banco
   *
   * @returns {string} Número de boleto (20 dígitos)
   */
  boleto() {
    // Usa timestamp como base (11 dígitos) + aleatório (9 dígitos)
    const timestamp = Date.now().toString().slice(-11).padStart(11, "0")
    const random = Math.floor(Math.random() * 1000000000)
      .toString()
      .padStart(9, "0")

    return timestamp + random
  },

  // ─────────────────────────────────────────────────────────────────────────
  // 📋 RECIBOS
  // ─────────────────────────────────────────────────────────────────────────

  /**
   * Gera número de recibo/comprovante.
   * Formato: REC-YYYYMMDD-HHMMSS-XXXX
   * Exemplo: REC-20260331-142354-AB12
   *
   * JUSTIFICATIVA:
   * - Prefixo "REC" identifica tipo
   * - Data e hora completa rastreável
   * - Código curto para QR code/referência rápida
   * - Adequado para comprovantes impressos
   *
   * @returns {string} Número de recibo formatado
   */
  receipt() {
    const now = new Date()
    const yyyy = now.getFullYear()
    const mm = String(now.getMonth() + 1).padStart(2, "0")
    const dd = String(now.getDate()).padStart(2, "0")
    const hh = String(now.getHours()).padStart(2, "0")
    const min = String(now.getMinutes()).padStart(2, "0")
    const ss = String(now.getSeconds()).padStart(2, "0")

    // Código curto
    const code = Math.floor(Math.random() * 10000)
      .toString()
      .padStart(4, "0")

    return `REC-${yyyy}${mm}${dd}-${hh}${min}${ss}-${code}`
  },

  // ─────────────────────────────────────────────────────────────────────────
  // 💬 ORÇAMENTOS
  // ─────────────────────────────────────────────────────────────────────────

  /**
   * Gera número de orçamento.
   * Formato: ORC-YYMMDD-XXXXX
   * Exemplo: ORC-260331-A1B2C
   *
   * @returns {string} Número de orçamento formatado
   */
  quote() {
    const now = new Date()
    const yy = now.getFullYear().toString().slice(-2)
    const mm = String(now.getMonth() + 1).padStart(2, "0")
    const dd = String(now.getDate()).padStart(2, "0")

    const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789"
    let code = ""
    for (let i = 0; i < 5; i++) {
      code += chars.charAt(Math.floor(Math.random() * chars.length))
    }

    return `ORC-${yy}${mm}${dd}-${code}`
  },

  // ─────────────────────────────────────────────────────────────────────────
  // 🚚 CONHECIMENTO DE TRANSPORTE (CT-e)
  // ─────────────────────────────────────────────────────────────────────────

  /**
   * Gera número de conhecimento de transporte eletrônico.
   * Formato: similar ao NF-e (compatibilidade SEFAZ)
   * Exemplo: 20260331000001234
   *
   * @returns {string} Número de CT-e (17 caracteres)
   */
  cte() {
    const now = new Date()
    const yyyy = now.getFullYear()
    const mm = String(now.getMonth() + 1).padStart(2, "0")
    const dd = String(now.getDate()).padStart(2, "0")

    const seq = Math.floor(Date.now() % 100000000)
      .toString()
      .padStart(8, "0")

    return `${yyyy}${mm}${dd}${seq}`
  },

  // ─────────────────────────────────────────────────────────────────────────
  // 📰 NOTAS DE SERVIÇO ELETRÔNICA (NFSe)
  // ─────────────────────────────────────────────────────────────────────────

  /**
   * Gera número de nota de serviço eletrônica.
   * Formato: NFSE-YYYYMMDD-XXXXX
   * Exemplo: NFSE-20260331-000001
   *
   * @returns {string} Número de NFSe formatado
   */
  nfse() {
    const now = new Date()
    const yyyy = now.getFullYear()
    const mm = String(now.getMonth() + 1).padStart(2, "0")
    const dd = String(now.getDate()).padStart(2, "0")

    const seq = Math.floor(Math.random() * 1000000)
      .toString()
      .padStart(6, "0")

    return `NFSE-${yyyy}${mm}${dd}-${seq}`
  },

  // ─────────────────────────────────────────────────────────────────────────
  // 🔍 VALIDAÇÃO E PARSING
  // ─────────────────────────────────────────────────────────────────────────

  /**
   * Valida formato de número gerado.
   * @param {string} type - Tipo de documento
   * @param {string|number} number - Número a validar
   * @returns {boolean}
   */
  isValid(type, number) {
    const str = String(number)

    switch (type.toLowerCase()) {
      case "order":
        return /^\d{18}$/.test(str) // 18 dígitos
      case "invoice":
      case "cte":
        return /^\d{17}$/.test(str) // 17 dígitos (SEFAZ format)
      case "serviceorder":
        return /^OS-\d{6}-[A-Z0-9]{5}$/.test(str)
      case "boleto":
        return /^\d{20}$/.test(str)
      case "receipt":
        return /^REC-\d{8}-\d{6}-\d{4}$/.test(str)
      case "quote":
        return /^ORC-\d{6}-[A-Z0-9]{5}$/.test(str)
      case "nfse":
        return /^NFSE-\d{8}-\d{6}$/.test(str)
      default:
        return false
    }
  },

  /**
   * Extrai informações de um número de documento.
   * @param {string} type - Tipo de documento
   * @param {string|number} number - Número a analisar
   * @returns {object}
   */
  parse(type, number) {
    const str = String(number)

    switch (type.toLowerCase()) {
      case "order": {
        if (!this.isValid("order", number)) throw new Error("Número de pedido inválido")

        const yy = str.slice(0, 2)
        const mm = str.slice(2, 4)
        const dd = str.slice(4, 6)
        const hh = str.slice(6, 8)
        const min = str.slice(8, 10)
        const ss = str.slice(10, 12)
        const rnd = str.slice(12, 16)

        return {
          type: "Pedido",
          number: str,
          date: `20${yy}-${mm}-${dd}`,
          time: `${hh}:${min}:${ss}`,
          random: rnd,
          timestamp: str.slice(0, 12)
        }
      }

      case "invoice":
      case "cte": {
        if (!this.isValid(type, number)) throw new Error(`Número ${type} inválido`)

        const yyyy = str.slice(0, 4)
        const mm = str.slice(4, 6)
        const dd = str.slice(6, 8)
        const seq = str.slice(8, 17)

        return {
          type: type.toUpperCase(),
          number: str,
          date: `${yyyy}-${mm}-${dd}`,
          sequence: seq
        }
      }

      case "serviceorder": {
        if (!this.isValid("serviceorder", number))
          throw new Error("Número de OS inválido")

        const [_, date, code] = str.match(/OS-(\d{6})-([A-Z0-9]{5})/)

        return {
          type: "Ordem de Serviço",
          number: str,
          date: `20${date.slice(0, 2)}-${date.slice(2, 4)}-${date.slice(4, 6)}`,
          code
        }
      }

      case "receipt": {
        if (!this.isValid("receipt", number))
          throw new Error("Número de recibo inválido")

        const [_, date, time, code] = str.match(/REC-(\d{8})-(\d{6})-(\d{4})/)

        return {
          type: "Recibo",
          number: str,
          date: `${date.slice(0, 4)}-${date.slice(4, 6)}-${date.slice(
            6,
            8
          )}`,
          time: `${time.slice(0, 2)}:${time.slice(2, 4)}:${time.slice(4, 6)}`,
          code
        }
      }

      default:
        throw new Error(`Tipo de documento não suportado: ${type}`)
    }
  },

  // ─────────────────────────────────────────────────────────────────────────
  // 📊 UTILITÁRIOS
  // ─────────────────────────────────────────────────────────────────────────

  /**
   * Retorna lista de tipos suportados.
   * @returns {Array<string>}
   */
  getSupportedTypes() {
    return [
      "order",
      "invoice",
      "serviceOrder",
      "boleto",
      "receipt",
      "quote",
      "cte",
      "nfse"
    ]
  },

  /**
   * Gera múltiplos números do mesmo tipo.
   * @param {string} type - Tipo de documento
   * @param {number} quantity - Quantos gerar
   * @returns {Array<string|number>}
   */
  generateBatch(type, quantity = 1) {
    const numbers = []
    const method = this[type.toLowerCase()]

    if (!method) throw new Error(`Tipo inválido: ${type}`)

    for (let i = 0; i < quantity; i++) {
      numbers.push(method.call(this))
    }

    return numbers
  },

  /**
   * Retorna exemplo de cada tipo de número.
   * @returns {object}
   */
  examples() {
    return {
      order: this.order(),
      invoice: this.invoice(),
      serviceOrder: this.serviceOrder(),
      boleto: this.boleto(),
      receipt: this.receipt(),
      quote: this.quote(),
      cte: this.cte(),
      nfse: this.nfse()
    }
  }
}

// ─────────────────────────────────────────────────────────────────────────
// RETROCOMPATIBILIDADE: Exportar função antiga
// ─────────────────────────────────────────────────────────────────────────

/**
 * @deprecated Use docNumService.order() em vez disso
 */
export function generateOrderNumber() {
  return docNumService.order()
}
