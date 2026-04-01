import { describe, it, expect, beforeEach } from "vitest"
import { SKUService, SKUBatch } from "../js/skuService.js"

describe("SKUService - Novo Formato (sem HV, sem hifens, apenas motor)", () => {
  let productVW, productFord, productGenerico

  beforeEach(() => {
    productVW = {
      id: "prod-vw-gol-001",
      name: "Gol",
      brand: "Volkswagen",
      category: "Veículos"
    }

    productFord = {
      id: "prod-ford-fiesta-001",
      name: "Fiesta",
      brand: "Ford",
      category: "Veículos"
    }

    productGenerico = {
      id: "prod-gen-001",
      name: "Tapete",
      brand: "Genérico"
    }
  })

  describe("generate() - Geração de SKU com novo formato", () => {
    it("deve gerar SKU sem HV e sem hifens", () => {
      const sku = SKUService.generate(productVW)
      expect(sku).toMatch(/^[A-Z0-9]+$/) // Sem hifens
      expect(sku).not.toContain("HV") // Sem prefixo HV
      expect(SKUService.isValid(sku)).toBe(true)
    })

    it("deve gerar SKU com motor (1.6 → 16)", () => {
      const variations = { motor: "1.6" }
      const sku = SKUService.generate(productVW, variations, 1)
      expect(sku).toMatch(/VWGOL16/)
      expect(sku).toEndWith("001")
      expect(sku).not.toContain("-") // Sem hifens
      expect(sku).not.toContain("HV") // Sem HV
    })

    it("deve gerar SKU com motor 2.0 → 20", () => {
      const variations = { motor: "2.0" }
      const sku = SKUService.generate(productVW, variations, 5)
      expect(sku).toMatch(/VWGOL20/)
      expect(sku).toEndWith("005")
    })

    it("deve usar 4 letras para o produto (GOL de Gol)", () => {
      const variations = { motor: "1.6" }
      const sku = SKUService.generate(productVW, variations, 1)
      const decoded = SKUService.decode(sku)
      expect(decoded.product).toBe("GOL")
    })

    it("deve gerar SKU diferente para marcas diferentes", () => {
      const variations = { motor: "1.6" }
      const skuVW = SKUService.generate(productVW, variations, 1)
      const skuFord = SKUService.generate(productFord, variations, 1)

      expect(skuVW).toContain("VW")
      expect(skuFord).toContain("FOR")
      expect(skuVW).not.toBe(skuFord)
    })

    it("deve fazer uppercase automático", () => {
      const variations = { motor: "1.6" }
      const sku = SKUService.generate(productVW, variations, 1)
      expect(sku).toBe(sku.toUpperCase())
    })

    it("deve remover acentos e caracteres especiais", () => {
      const productAcentuado = {
        id: "prod-acentuado",
        name: "Válvula",
        brand: "Brasildorf"
      }
      const variations = { motor: "2.0" }
      const sku = SKUService.generate(productAcentuado, variations, 1)
      expect(sku).not.toContain("á")
      expect(sku).not.toContain("ô")
    })

    it("deve ignorar variações que não sejam motor", () => {
      const variations = {
        motor: "1.6",
        transmissao: "Manual",    // ignorado
        cor: "Branco",             // removido
        combustivel: "Gasolina",   // ignorado
        ano: 2024,                 // ignorado
        versao: "GLX"              // ignorado
      }
      const sku = SKUService.generate(productVW, variations, 1)
      expect(sku).not.toContain("MAN")    // Sem transmissão
      expect(sku).not.toContain("BRA")    // Sem cor
      expect(sku).not.toContain("G")      // Sem combustível
      expect(sku).toContain("16")         // Com motor
    })

    it("deve manter formato compacto: BRANDPRODMOTORSERIAL", () => {
      const variations = { motor: "1.6" }
      const sku = SKUService.generate(productVW, variations, 1)
      expect(sku).toMatch(/^[A-Z0-9]{11,}$/)
    })

    it("deve gerar SKU sequencial com serial", () => {
      const variations = { motor: "2.0" }
      const sku1 = SKUService.generate(productFord, variations, 1)
      const sku2 = SKUService.generate(productFord, variations, 2)
      const sku3 = SKUService.generate(productFord, variations, 100)

      expect(sku1).toEndWith("001")
      expect(sku2).toEndWith("002")
      expect(sku3).toEndWith("100")
    })

    it("deve lançar erro se produto não tiver name", () => {
      expect(() => {
        SKUService.generate({ brand: "VW" })
      }).toThrow()
    })
  })

  describe("generateBatch() - Lote de SKUs", () => {
    it("deve gerar lote de 5 SKUs", () => {
      const variations = { motor: "1.6" }
      const skus = SKUService.generateBatch(productVW, variations, 5)

      expect(skus).toHaveLength(5)
      expect(skus[0]).toEndWith("001")
      expect(skus[4]).toEndWith("005")
    })

    it("cada SKU do lote deve ser válido", () => {
      const variations = { motor: "2.0" }
      const skus = SKUService.generateBatch(productFord, variations, 10)

      skus.forEach(sku => {
        expect(SKUService.isValid(sku)).toBe(true)
        expect(sku).not.toContain("-")
        expect(sku).not.toContain("HV")
      })
    })

    it("deve gerar SKUs únicos em lote", () => {
      const variations = { motor: "1.6" }
      const skus = SKUService.generateBatch(productVW, variations, 10)

      const uniqueSkus = new Set(skus)
      expect(uniqueSkus.size).toBe(skus.length)
    })

    it("deve suportar quantidade zero", () => {
      const skus = SKUService.generateBatch(productVW, {}, 0)
      expect(skus).toHaveLength(0)
    })
  })

  describe("isValid() - Validação de formato", () => {
    it("deve aceitar SKU no novo formato", () => {
      expect(SKUService.isValid("VWGOL16001")).toBe(true)
      expect(SKUService.isValid("FORFIESTA20001")).toBe(true)
    })

    it("deve rejeitar SKU com formato antigo (com HV)", () => {
      expect(SKUService.isValid("HV-VW-GOL-16-001")).toBe(false)
    })

    it("deve rejeitar SKU com hifens", () => {
      expect(SKUService.isValid("VW-GOL-16-001")).toBe(false)
    })

    it("deve rejeitar SKU vazio", () => {
      expect(SKUService.isValid("")).toBe(false)
      expect(SKUService.isValid(null)).toBe(false)
      expect(SKUService.isValid(undefined)).toBe(false)
    })

    it("deve rejeitar SKU muito curto", () => {
      expect(SKUService.isValid("ABC")).toBe(false)
    })

    it("deve rejeitar tipo não-string", () => {
      expect(SKUService.isValid(123)).toBe(false)
      expect(SKUService.isValid({})).toBe(false)
    })
  })

  describe("decode() - Decodificação e extração de componentes", () => {
    it("deve decodificar brand (2-3 letras)", () => {
      const sku = "VWGOL16001"
      const decoded = SKUService.decode(sku)
      expect(decoded.brand).toBe("VW")
    })

    it("deve decodificar product (4 letras)", () => {
      const sku = "VWGOL16001"
      const decoded = SKUService.decode(sku)
      expect(decoded.product).toBe("GOL")
    })

    it("deve decodificar motor", () => {
      const sku = "VWGOL16001"
      const decoded = SKUService.decode(sku)
      expect(decoded.motor).toBe("16")
    })

    it("deve decodificar serial (últimos 3 dígitos)", () => {
      const sku = "VWGOL16001"
      const decoded = SKUService.decode(sku)
      expect(decoded.serial).toBe("001")
    })

    it("deve preservar raw SKU", () => {
      const skuOriginal = "FORFIESTA20045"
      const decoded = SKUService.decode(skuOriginal)
      expect(decoded.raw).toBe(skuOriginal)
    })

    it("deve rejeitar SKU inválido", () => {
      expect(() => SKUService.decode("HV-VW-GOL-16-001")).toThrow()
      expect(() => SKUService.decode("ABC")).toThrow()
    })

    it("deve decodificar com brand de 3 letras", () => {
      const sku = "FORFIESTA20001"
      const decoded = SKUService.decode(sku)
      expect(decoded.brand).toBe("FOR")
      expect(decoded.product).toBe("FIES")
    })
  })

  describe("getVariationTemplate() - Templates atualizados", () => {
    it("deve retornar template apenas com motor para veículo", () => {
      const template = SKUService.getVariationTemplate("veiculo")
      expect(template).toHaveProperty("motor")
      expect(template).not.toHaveProperty("transmissao")
      expect(template).not.toHaveProperty("cor")
    })

    it("deve retornar template com motor para peça", () => {
      const template = SKUService.getVariationTemplate("peca")
      expect(template).toHaveProperty("motor")
    })

    it("deve retornar template com motor para acessório", () => {
      const template = SKUService.getVariationTemplate("acessorio")
      expect(template).toHaveProperty("motor")
    })

    it("deve retornar template padrão para tipo desconhecido", () => {
      const template = SKUService.getVariationTemplate("unknown")
      expect(template).toHaveProperty("motor")
    })
  })

  describe("example() - Exemplos do novo formato", () => {
    it("deve gerar exemplo válido de veículo", () => {
      const example = SKUService.example("veiculo")
      expect(SKUService.isValid(example.sku)).toBe(true)
      expect(example.sku).not.toContain("HV")
      expect(example.sku).not.toContain("-")
      expect(example.decoded).toHaveProperty("motor")
    })

    it("deve gerar exemplo válido de peça", () => {
      const example = SKUService.example("peca")
      expect(SKUService.isValid(example.sku)).toBe(true)
      expect(example.exemplo.product.name).toContain("Velas")
    })

    it("deve gerar exemplo válido de acessório", () => {
      const example = SKUService.example("acessorio")
      expect(SKUService.isValid(example.sku)).toBe(true)
      expect(example.exemplo.product.name).toContain("Amortecedor")
    })
  })
})

describe("SKUBatch - Gerenciamento de lotes", () => {
  let product, variations

  beforeEach(() => {
    product = {
      id: "prod-123",
      name: "Gol",
      brand: "Volkswagen"
    }
    variations = { motor: "1.6" }
  })

  it("deve criar instância de lote", () => {
    const batch = new SKUBatch(product, variations)
    expect(batch.product).toBe(product)
    expect(batch.variations).toBe(variations)
  })

  it("deve gerar próximo SKU do lote", () => {
    const batch = new SKUBatch(product, variations, 1)
    const sku1 = batch.next()
    const sku2 = batch.next()

    expect(sku1).toEndWith("001")
    expect(sku2).toEndWith("002")
    expect(batch.batch).toHaveLength(2)
  })

  it("deve gerar lote de N SKUs", () => {
    const batch = new SKUBatch(product, variations, 1)
    const skus = batch.nextBatch(10)

    expect(skus).toHaveLength(10)
    expect(skus[0]).toEndWith("001")
    expect(skus[9]).toEndWith("010")
    expect(batch.batch).toHaveLength(10)
  })

  it("deve retornar todos os SKUs do lote", () => {
    const batch = new SKUBatch(product, variations, 1)
    batch.nextBatch(3)

    const all = batch.getAll()
    expect(all).toHaveLength(3)
    expect(all[0]).toEndWith("001")
  })

  it("deve fornecer informações do lote", () => {
    const batch = new SKUBatch(product, variations, 5)
    batch.nextBatch(3)

    const info = batch.info()
    expect(info).toHaveProperty("total")
    expect(info.total).toBe(3)
    expect(info).toHaveProperty("startSerial")
    expect(info.startSerial).toBe(5)
  })

  it("deve começar do serial informado", () => {
    const batch = new SKUBatch(product, variations, 100)
    const firstSku = batch.next()

    expect(firstSku).toEndWith("100")
  })

  it("deve manter sequência contínua entre batches", () => {
    const batch = new SKUBatch(product, variations, 1)

    batch.nextBatch(3)
    const moreSkus = batch.nextBatch(2)

    expect(moreSkus[0]).toEndWith("004")
    expect(moreSkus[1]).toEndWith("005")
  })
})

describe("Casos de uso reais", () => {
  it("caso: velas de ignição (VELA) com motor 1.6", () => {
    const product = { name: "Velas de Ignição", brand: "Bosch" }
    const variations = { motor: "1.6" }
    const sku = SKUService.generate(product, variations, 1)

    const decoded = SKUService.decode(sku)
    expect(decoded.product).toBe("VELA") // 4 primeiras letras
    expect(decoded.motor).toBe("16")
    expect(SKUService.isValid(sku)).toBe(true)
    expect(sku).not.toContain("-")
  })

  it("caso: amortecedor (AMOR) com motor 2.0", () => {
    const product = { name: "Amortecedor", brand: "Monroe" }
    const variations = { motor: "2.0" }
    const sku = SKUService.generate(product, variations, 1)

    const decoded = SKUService.decode(sku)
    expect(decoded.product).toBe("AMOR") // 4 primeiras letras
    expect(decoded.motor).toBe("20")
  })

  it("caso: importação de 100 unidades de um produto", () => {
    const product = { name: "Gol", brand: "Volkswagen" }
    const variations = { motor: "1.6" }
    const skus = SKUService.generateBatch(product, variations, 100)

    expect(skus).toHaveLength(100)
    const uniqueSkus = new Set(skus)
    expect(uniqueSkus.size).toBe(100) // Todos únicos

    expect(skus[0]).toEndWith("001")
    expect(skus[99]).toEndWith("100")
  })

  it("caso: produtos sem motor explícito (uso padrão)", () => {
    const product = { name: "Parafuso", brand: "Genérico" }
    const variations = { motor: "Universal" }
    const sku = SKUService.generate(product, variations, 1)

    expect(SKUService.isValid(sku)).toBe(true)
    expect(sku).not.toContain("-")
    expect(sku).not.toContain("HV")
  })
})
