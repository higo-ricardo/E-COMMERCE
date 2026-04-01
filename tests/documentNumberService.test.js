import { describe, it, expect, beforeEach } from "vitest"
import { DocumentNumberService, generateOrderNumber } from "../js/documentNumberService.js"

describe("DocumentNumberService", () => {
  describe("order() - Números de Pedido", () => {
    it("deve gerar número com 18 dígitos", () => {
      const number = DocumentNumberService.order()
      const str = String(number)
      expect(str).toMatch(/^\d{18}$/)
    })

    it("deve gerar números diferentes (aleatório)", () => {
      const numbers = new Set()
      for (let i = 0; i < 10; i++) {
        numbers.add(DocumentNumberService.order())
      }
      expect(numbers.size).toBe(10) // Todos diferentes
    })

    it("deve começar com ano/mês/dia válido", () => {
      const number = String(DocumentNumberService.order())
      const yy = number.slice(0, 2)
      const mm = number.slice(2, 4)
      const dd = number.slice(4, 6)

      expect(parseInt(yy)).toBeGreaterThanOrEqual(0)
      expect(parseInt(yy)).toBeLessThan(100)
      expect(parseInt(mm)).toBeGreaterThanOrEqual(1)
      expect(parseInt(mm)).toBeLessThanOrEqual(12)
      expect(parseInt(dd)).toBeGreaterThanOrEqual(1)
      expect(parseInt(dd)).toBeLessThanOrEqual(31)
    })

    it("deve ser número inteiro", () => {
      const number = DocumentNumberService.order()
      expect(Number.isInteger(number)).toBe(true)
    })
  })

  describe("invoice() - Notas Fiscais", () => {
    it("deve gerar número com 17 caracteres", () => {
      const number = DocumentNumberService.invoice()
      expect(number).toMatch(/^\d{17}$/)
    })

    it("deve começar com data no formato YYYYMMDD", () => {
      const number = DocumentNumberService.invoice()
      const date = number.slice(0, 8)

      expect(date).toMatch(/^\d{8}$/)
      const yyyy = parseInt(date.slice(0, 4))
      const mm = parseInt(date.slice(4, 6))
      const dd = parseInt(date.slice(6, 8))

      expect(yyyy).toBeGreaterThanOrEqual(2000)
      expect(mm).toBeGreaterThanOrEqual(1)
      expect(mm).toBeLessThanOrEqual(12)
    })

    it("deve gerar números diferentes", () => {
      const inv1 = DocumentNumberService.invoice()
      const inv2 = DocumentNumberService.invoice()
      expect(inv1).not.toBe(inv2)
    })

    it("deve gerar número string (compatibilidade SEFAZ)", () => {
      const number = DocumentNumberService.invoice()
      expect(typeof number).toBe("string")
    })
  })

  describe("serviceOrder() - Ordens de Serviço", () => {
    it("deve gerar formato OS-YYMMDD-XXXXX", () => {
      const os = DocumentNumberService.serviceOrder()
      expect(os).toMatch(/^OS-\d{6}-[A-Z0-9]{5}$/)
    })

    it("deve conter prefixo OS", () => {
      const os = DocumentNumberService.serviceOrder()
      expect(os.startsWith("OS-")).toBe(true)
    })

    it("deve ter data válida no meio", () => {
      const os = DocumentNumberService.serviceOrder()
      const date = os.slice(3, 9) // OS-YYMMDD-...

      const yy = date.slice(0, 2)
      const mm = date.slice(2, 4)
      const dd = date.slice(4, 6)

      expect(parseInt(mm)).toBeGreaterThanOrEqual(1)
      expect(parseInt(mm)).toBeLessThanOrEqual(12)
      expect(parseInt(dd)).toBeGreaterThanOrEqual(1)
      expect(parseInt(dd)).toBeLessThanOrEqual(31)
    })

    it("deve gerar números legíveis e diferentes", () => {
      const os1 = DocumentNumberService.serviceOrder()
      const os2 = DocumentNumberService.serviceOrder()

      expect(os1).not.toBe(os2)
      // Deve ser fácil de ler/escrever
      expect(os1.length).toBeLessThanOrEqual(17)
    })
  })

  describe("boleto() - Boletos Bancários", () => {
    it("deve gerar número com 20 dígitos", () => {
      const boleto = DocumentNumberService.boleto()
      expect(String(boleto)).toMatch(/^\d{20}$/)
    })

    it("deve gerar números diferentes", () => {
      const b1 = DocumentNumberService.boleto()
      const b2 = DocumentNumberService.boleto()
      expect(b1).not.toBe(b2)
    })

    it("deve ser compatível com padrão FEBRABAN", () => {
      const boleto = String(DocumentNumberService.boleto())
      expect(boleto.length).toBe(20)
      expect(/^\d+$/.test(boleto)).toBe(true)
    })
  })

  describe("receipt() - Recibos", () => {
    it("deve gerar formato REC-YYYYMMDD-HHMMSS-XXXX", () => {
      const receipt = DocumentNumberService.receipt()
      expect(receipt).toMatch(/^REC-\d{8}-\d{6}-\d{4}$/)
    })

    it("deve conter data e hora válidas", () => {
      const receipt = DocumentNumberService.receipt()
      const date = receipt.slice(4, 12)
      const time = receipt.slice(13, 19)

      const yyyy = parseInt(date.slice(0, 4))
      const mm = parseInt(date.slice(4, 6))
      const dd = parseInt(date.slice(6, 8))

      expect(yyyy).toBeGreaterThanOrEqual(2000)
      expect(mm).toBeGreaterThanOrEqual(1)
      expect(mm).toBeLessThanOrEqual(12)

      const hh = parseInt(time.slice(0, 2))
      const min = parseInt(time.slice(2, 4))
      const ss = parseInt(time.slice(4, 6))

      expect(hh).toBeGreaterThanOrEqual(0)
      expect(hh).toBeLessThan(24)
      expect(min).toBeGreaterThanOrEqual(0)
      expect(min).toBeLessThan(60)
      expect(ss).toBeGreaterThanOrEqual(0)
      expect(ss).toBeLessThan(60)
    })

    it("deve gerar números diferentes", () => {
      const r1 = DocumentNumberService.receipt()
      const r2 = DocumentNumberService.receipt()
      expect(r1).not.toBe(r2)
    })
  })

  describe("quote() - Orçamentos", () => {
    it("deve gerar formato ORC-YYMMDD-XXXXX", () => {
      const quote = DocumentNumberService.quote()
      expect(quote).toMatch(/^ORC-\d{6}-[A-Z0-9]{5}$/)
    })

    it("deve conter prefixo ORC", () => {
      const quote = DocumentNumberService.quote()
      expect(quote.startsWith("ORC-")).toBe(true)
    })

    it("deve gerar números diferentes", () => {
      const q1 = DocumentNumberService.quote()
      const q2 = DocumentNumberService.quote()
      expect(q1).not.toBe(q2)
    })
  })

  describe("cte() - Conhecimento de Transporte", () => {
    it("deve gerar número com 17 dígitos", () => {
      const cte = DocumentNumberService.cte()
      expect(cte).toMatch(/^\d{17}$/)
    })

    it("deve ter formato compatível com SEFAZ", () => {
      const cte = DocumentNumberService.cte()
      // Mes ser similar ao invoice
      expect(cte).toMatch(/^\d{4}\d{2}\d{2}\d{8}$/)
    })
  })

  describe("nfse() - Notas de Serviço", () => {
    it("deve gerar formato NFSE-YYYYMMDD-XXXXXX", () => {
      const nfse = DocumentNumberService.nfse()
      expect(nfse).toMatch(/^NFSE-\d{8}-\d{6}$/)
    })

    it("deve conter prefixo NFSE", () => {
      const nfse = DocumentNumberService.nfse()
      expect(nfse.startsWith("NFSE-")).toBe(true)
    })
  })

  describe("isValid() - Validação", () => {
    it("deve validar pedido com 18 dígitos", () => {
      const order = DocumentNumberService.order()
      expect(DocumentNumberService.isValid("order", order)).toBe(true)
      expect(DocumentNumberService.isValid("order", "123")).toBe(false)
    })

    it("deve validar NF-e com 17 dígitos", () => {
      const invoice = DocumentNumberService.invoice()
      expect(DocumentNumberService.isValid("invoice", invoice)).toBe(true)
      expect(DocumentNumberService.isValid("invoice", "123")).toBe(false)
    })

    it("deve validar OS com formato correto", () => {
      const os = DocumentNumberService.serviceOrder()
      expect(DocumentNumberService.isValid("serviceorder", os)).toBe(true)
      expect(DocumentNumberService.isValid("serviceorder", "INVALID")).toBe(false)
    })

    it("deve validar boleto com 20 dígitos", () => {
      const boleto = DocumentNumberService.boleto()
      expect(DocumentNumberService.isValid("boleto", boleto)).toBe(true)
    })

    it("deve validar recibo com formato correto", () => {
      const receipt = DocumentNumberService.receipt()
      expect(DocumentNumberService.isValid("receipt", receipt)).toBe(true)
    })

    it("deve rejeitar tipo desconhecido", () => {
      expect(DocumentNumberService.isValid("unknown", "123")).toBe(false)
    })
  })

  describe("parse() - Parsing", () => {
    it("deve decompor número de pedido", () => {
      const order = DocumentNumberService.order()
      const parsed = DocumentNumberService.parse("order", order)

      expect(parsed).toHaveProperty("type", "Pedido")
      expect(parsed).toHaveProperty("number")
      expect(parsed).toHaveProperty("date")
      expect(parsed).toHaveProperty("time")
      expect(parsed.date).toMatch(/^\d{4}-\d{2}-\d{2}$/)
      expect(parsed.time).toMatch(/^\d{2}:\d{2}:\d{2}$/)
    })

    it("deve decompor número de NF-e", () => {
      const invoice = DocumentNumberService.invoice()
      const parsed = DocumentNumberService.parse("invoice", invoice)

      expect(parsed).toHaveProperty("type", "NF-E")
      expect(parsed).toHaveProperty("date")
      expect(parsed).toHaveProperty("sequence")
    })

    it("deve decompor OS", () => {
      const os = DocumentNumberService.serviceOrder()
      const parsed = DocumentNumberService.parse("serviceorder", os)

      expect(parsed).toHaveProperty("type", "Ordem de Serviço")
      expect(parsed).toHaveProperty("date")
      expect(parsed).toHaveProperty("code")
    })

    it("deve decompor recibo", () => {
      const receipt = DocumentNumberService.receipt()
      const parsed = DocumentNumberService.parse("receipt", receipt)

      expect(parsed).toHaveProperty("type", "Recibo")
      expect(parsed).toHaveProperty("date")
      expect(parsed).toHaveProperty("time")
      expect(parsed).toHaveProperty("code")
    })

    it("deve lançar erro para tipo inválido", () => {
      expect(() => {
        DocumentNumberService.parse("invalid", "123")
      }).toThrow()
    })

    it("deve lançar erro para número mal formado", () => {
      expect(() => {
        DocumentNumberService.parse("order", "123")
      }).toThrow()
    })
  })

  describe("getSupportedTypes()", () => {
    it("deve retornar lista de tipos", () => {
      const types = DocumentNumberService.getSupportedTypes()
      expect(types).toBeInstanceOf(Array)
      expect(types.length).toBeGreaterThan(0)
      expect(types).toContain("order")
      expect(types).toContain("invoice")
      expect(types).toContain("serviceOrder")
    })
  })

  describe("generateBatch() - Lotes", () => {
    it("deve gerar múltiplos números do mesmo tipo", () => {
      const numbers = DocumentNumberService.generateBatch("order", 5)
      expect(numbers).toHaveLength(5)
      expect(new Set(numbers).size).toBe(5) // Todos diferentes
    })

    it("deve gerar pedidos em lote", () => {
      const orders = DocumentNumberService.generateBatch("order", 3)
      orders.forEach(order => {
        expect(DocumentNumberService.isValid("order", order)).toBe(true)
      })
    })

    it("deve gerar OS em lote", () => {
      const oses = DocumentNumberService.generateBatch("serviceOrder", 3)
      oses.forEach(os => {
        expect(DocumentNumberService.isValid("serviceorder", os)).toBe(true)
      })
    })

    it("deve lançar erro para tipo inválido", () => {
      expect(() => {
        DocumentNumberService.generateBatch("invalid", 5)
      }).toThrow()
    })

    it("deve gerar 1 por padrão", () => {
      const numbers = DocumentNumberService.generateBatch("order")
      expect(numbers).toHaveLength(1)
    })
  })

  describe("examples()", () => {
    it("deve retornar exemplos de todos os tipos", () => {
      const examples = DocumentNumberService.examples()

      expect(examples).toHaveProperty("order")
      expect(examples).toHaveProperty("invoice")
      expect(examples).toHaveProperty("serviceOrder")
      expect(examples).toHaveProperty("boleto")
      expect(examples).toHaveProperty("receipt")
      expect(examples).toHaveProperty("quote")
      expect(examples).toHaveProperty("cte")
      expect(examples).toHaveProperty("nfse")
    })

    it("deve gerar exemplos válidos para cada tipo", () => {
      const examples = DocumentNumberService.examples()

      expect(DocumentNumberService.isValid("order", examples.order)).toBe(true)
      expect(DocumentNumberService.isValid("invoice", examples.invoice)).toBe(true)
      expect(DocumentNumberService.isValid("serviceorder", examples.serviceOrder)).toBe(true)
      expect(DocumentNumberService.isValid("boleto", examples.boleto)).toBe(true)
      expect(DocumentNumberService.isValid("receipt", examples.receipt)).toBe(true)
    })
  })

  describe("Retrocompatibilidade - generateOrderNumber()", () => {
    it("deve existir função deprecada generateOrderNumber()", () => {
      expect(typeof generateOrderNumber).toBe("function")
    })

    it("deve gerar número válido com função antiga", () => {
      const number = generateOrderNumber()
      expect(DocumentNumberService.isValid("order", number)).toBe(true)
    })

    it("deve ser idêntico a DocumentNumberService.order()", () => {
      // Não é possível comparar diretamente (random), mas formato deve ser igual
      const old = generateOrderNumber()
      const new_func = DocumentNumberService.order()

      expect(String(old)).toMatch(/^\d{18}$/)
      expect(String(new_func)).toMatch(/^\d{18}$/)
    })
  })
})
