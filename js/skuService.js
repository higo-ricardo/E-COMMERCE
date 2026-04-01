// ─── HIVERCAR · skuService.js ────────────────────────────────────────────────
// Gerador de SKU inteligente para produtos com variações.
// 📦 Identificação única em inventário
// 🚚 Fácil leitura para logística
// 🎨 Suporte a variações (Motor)
//
// SKU Format: [BRAND(2-3)][PRODUCT(4)][MOTOR(2-3)][SERIAL(3)]
// Example: VWGOL16001 (Volkswagen Gol, 1.6 Motor, Serial #1)

/**
 * SKUService - Gera e valida SKUs para produtos com variações
 */
export const SKUService = {
  /**
   * Gera SKU baseado em produto + variações
   * @param {Object} product - Objeto produto {id, name, brand, category}
   * @param {Object} variations - {motor, transmissao, cor, ano, etc}
   * @param {number} serial - Número sequencial (ex: 001, 002) - opcional
   * @returns {string} SKU formatado
   */
  generate(product, variations = {}, serial = null) {
    if (!product || !product.name) {
      throw new Error("❌ Produto deve ter 'name'")
    }

    // 1️⃣ Código da Marca (2-3 letras)
    const brandCode = this._getBrandCode(product.brand || "GEN")
    
    // 2️⃣ Código do Produto (4 letras sintetizadas - ex: GOL, VEIG, AMOR)
    const productCode = this._simplify(product.name, 4)

    // 3️⃣ Código de Motor (ex: 16, 20, 10 para 1.6, 2.0, 1.0)
    const motorCode = this._getDriveCode(variations)

    // 4️⃣ Serial (sequencial ou hash curto)
    const serialPart = serial
      ? String(serial).padStart(3, "0")
      : this._generateShortHash(product.id || product.name)

    // 5️⃣ Monta SKU final (sem HV, sem hifens - formato compacto)
    const sku = [
      brandCode,
      productCode,
      motorCode,
      serialPart
    ]
      .filter(part => part && part.length > 0)
      .join("")
      .toUpperCase()

    return sku
  },

  /**
   * Gera SKU com sequencial automático (para lotes de produtos iguais)
   * @param {Object} product
   * @param {Object} variations
   * @param {number} quantidade - Quantos SKUs gerar?
   * @returns {Array<string>} Array de SKUs
   */
  generateBatch(product, variations = {}, quantidade = 1) {
    const skus = []
    for (let i = 1; i <= quantidade; i++) {
      skus.push(this.generate(product, variations, i))
    }
    return skus
  },

  /**
   * Valida formato de SKU
   * @param {string} sku
   * @returns {boolean}
   */
  isValid(sku) {
    if (!sku || typeof sku !== "string") return false

    // Padrão: [BRAND(2-4)][PRODUCT(4)][MOTOR(2-3)][SERIAL(3)] - sem hifens
    // Exemplo: VWGOL16001, FORDFIESTA20001
    const pattern = /^[A-Z0-9]{11,}$/
    return pattern.test(sku)
  },

  /**
   * Decodifica SKU em partes legíveis
   * @param {string} sku
   * @returns {Object} {brand, product, motor, serial}
   */
  decode(sku) {
    if (!this.isValid(sku)) {
      throw new Error(`❌ SKU inválido: ${sku}`)
    }

    // Formato: [BRAND(2-3)][PRODUCT(4)][MOTOR(2-3)][SERIAL(3)]
    // Extração: usar conhecimento - serial sempre 3 dígitos no final
    const serial = sku.slice(-3)  // Últimos 3 caracteres
    const remaining = sku.slice(0, -3)
    
    // Heurística: Brand = 2-3 chars, Product = 4 chars, Motor = restante
    let brand, product, motor
    
    if (remaining.length >= 9) {
      // Min: 2 (brand) + 4 (product) + 2 (motor) = 8
      brand = remaining.substring(0, 2)    // Ex: VW
      product = remaining.substring(2, 6)  // Ex: GOL
      motor = remaining.substring(6)       // Ex: 16
    } else {
      // Fallback
      brand = remaining.substring(0, 2)
      product = remaining.substring(2, 6)
      motor = remaining.substring(6)
    }

    return {
      brand,           // Marca (VW, FORD, etc)
      product,         // Produto (GOL, FIEST, etc)
      motor,           // Motor (16, 20, etc)
      serial,          // Serial (001, 002, etc)
      raw: sku
    }
  },

  /**
   * Gera código da marca (2-3 caracteres)
   * @private
   */
  _getBrandCode(brand) {
    if (!brand || typeof brand !== "string") return "GEN"

    const brandMap = {
      volkswagen: "VW",
      vw: "VW",
      ford: "FORD",
      chevrolet: "CHV",
      chevy: "CHV",
      fiat: "FIAT",
      renault: "RNL",
      hyundai: "HYO",
      kia: "KIA",
      toyota: "TOY",
      honda: "HON",
      bmw: "BMW",
      audi: "AUDI",
      mercedes: "MERC",
      peugeot: "PGT",
      citroen: "CTR",
      suzuki: "SUZK",
    }

    const lower = brand.toLowerCase().trim()
    return brandMap[lower] || this._simplify(brand, 3)
  },

  /**
   * Extrai código de variação (motor)
   * @private
   */
  _getDriveCode(variations) {
    if (!variations || !variations.motor) {
      return ""
    }

    // Motor: 1.6 → 16, 2.0 → 20, 1.0 → 10, etc
    const motorCode = String(variations.motor)
      .replace(/\./g, "")      // Remove ponto decimal
      .substring(0, 2)          // Pega primeiros 2 caracteres (ex: "16" de "16")
      .toUpperCase()
    
    return motorCode
  },

  /**
   * Simplifica texto para código (remove acentos, espacos, etc)
   * @private
   */
  _simplify(text, maxLen = 3) {
    if (!text) return ""

    return text
      .normalize("NFD")                          // Remove acentos
      .replace(/[\u0300-\u036f]/g, "")          // Remove componentes de acentuação
      .replace(/[^a-zA-Z0-9]/g, "")             // Remove caracteres especiais
      .substring(0, maxLen)
      .toUpperCase()
  },

  /**
   * Gera hash curto (3-4 dígitos) a partir de string
   * @private
   */
  _generateShortHash(str) {
    if (!str) return "000"

    let hash = 0
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i)
      hash = ((hash << 5) - hash) + char
      hash = hash & hash // Convert to 32-bit integer
    }

    const shortHash = Math.abs(hash) % 1000
    return String(shortHash).padStart(3, "0")
  },

  /**
   * Recomenda estrutura de variações para um tipo de produto
   * @param {string} productType - "veiculo", "peca", "acessorio", etc
   * @returns {Object} Template de variações
   */
  getVariationTemplate(productType) {
    const templates = {
      veiculo: {
        motor: "Ex: 1.0, 1.6, 2.0 (obrigatório)"
      },
      peca: {
        motor: "Ex: 1.6, 2.0 (aplicação do motor)"
      },
      acessorio: {
        motor: "Ex: 2.0 (compatibilidade motor)"
      }
    }

    return templates[productType] || templates.veiculo
  },

  /**
   * Gera exemplo completo de SKU
   * @param {string} productType - "veiculo", "peca", "acessorio"
   * @returns {Object} {sku, decoded, exemplo}
   */
  example(productType = "veiculo") {
    const examples = {
      veiculo: {
        product: { name: "Gol", brand: "Volkswagen", id: "prod-123" },
        variations: {
          motor: "1.6"
        }
      },
      peca: {
        product: { name: "Velas de Ignição", brand: "Bosch", id: "peca-456" },
        variations: {
          motor: "1.6"
        }
      },
      acessorio: {
        product: { name: "Amortecedor", brand: "Monroe", id: "acess-789" },
        variations: {
          motor: "2.0"
        }
      }
    }

    const example = examples[productType] || examples.veiculo
    const sku = this.generate(example.product, example.variations, 1)

    return {
      sku,
      decoded: this.decode(sku),
      exemplo: {
        product: example.product,
        variations: example.variations
      }
    }
  }
}

/**
 * Classe SKUBatch para gerar lotes de SKUs (ex: 100 unidades em estoque)
 */
export class SKUBatch {
  constructor(product, variations = {}, quantidadeInicial = 1) {
    this.product = product
    this.variations = variations
    this.counter = quantidadeInicial
    this.batch = []
  }

  /**
   * Gera próximo SKU do lote
   */
  next() {
    const sku = SKUService.generate(this.product, this.variations, this.counter)
    this.batch.push(sku)
    this.counter++
    return sku
  }

  /**
   * Gera N SKUs
   */
  nextBatch(quantidade) {
    const skus = []
    for (let i = 0; i < quantidade; i++) {
      skus.push(this.next())
    }
    return skus
  }

  /**
   * Retorna todos os SKUs gerados
   */
  getAll() {
    return [...this.batch]
  }

  /**
   * Retorna informações do lote
   */
  info() {
    return {
      produto: this.product.name,
      marca: this.product.brand,
      variações: this.variations,
      quantidade: this.batch.length,
      começouEm: this.batch[0] || null,
      terminouEm: this.batch[this.batch.length - 1] || null,
      proximoSerial: this.counter
    }
  }
}
