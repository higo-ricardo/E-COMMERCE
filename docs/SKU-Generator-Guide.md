# 📦 SKUService - Gerador de SKU Inteligente

## 🎯 O que resolve?

### 1. **Inventário** → Identificar produto único
- Cada SKU = item único no estoque
- Controle por motor (veículos) ou tipo (peças/acessórios)
- Evita confusão de estoque

### 2. **Logística** → Fácil leitura e separação
- Funcionário bate o olho e entende
- Formato compacto: `MARCA+PRODUTO+MOTOR+SERIAL`
- Perfeito para código de barras

### 3. **Rastreabilidade** → Motor como identificador principal
- Carro + Motor 1.6 = SKU diferente
- Carro + Motor 2.0 = SKU diferente
- Peça para motor 1.6 identificável

---

## 📋 Novo Formato do SKU (Simplificado)

```
[MARCA(2-3)][PRODUTO(4)][MOTOR/TIPO(2-3)][SERIAL(3)]
│              │           │               │
│              │           │               └─ Serial: 001, 002, 003...
│              │           └─ Motor: 16, 20, etc
│              └─ Produto: GOL, VEIG, AMOR (4 letras)
└─ Marca: VW, FORD, CHV (2-3 letras)

Exemplo completo:
VWGOL16001
  └─ VW (Volkswagen) + GOL (Gol) + 16 (Motor 1.6) + 001 (Serial #1)
```

### Comparação com Formato Anterior

| Aspecto | Anterior | Novo |
|---------|----------|------|
| **Prefixo** | HV-VW-GOL-... | VWGOL... |
| **Hifens** | Sim (5 hifens) | Não |
| **Cor** | Incluída | Removida |
| **Variações** | Múltiplas | Apenas Motor |
| **Tamanho** | 25+ caracteres | 10-13 caracteres |
| **Legibilidade** | Legível | Muito legível |

---

## 🚀 Exemplo de Uso Rápido

```javascript
import { SKUService, SKUBatch } from "./js/skuService.js"

// ─── 1. Gerar SKU de produto simples ─────────────────────────────
const veiculo = {
  name: "Gol",
  brand: "Volkswagen",
  id: "prod-123"
}

const sku = SKUService.generate(veiculo, { motor: "1.6" }, 1)
// → VWGOL16001

// ─── 2. Gerar SKU de peça/acessório ─────────────────────────────
const velaIgnicao = {
  name: "Velas de Ignição",
  brand: "Bosch"
}

const skuVela = SKUService.generate(velaIgnicao, { motor: "1.6" }, 1)
// → BOSCVEIG16001

// ─── 3. Gerar SKU de amortecedor ────────────────────────────────
const amortecedor = {
  name: "Amortecedor",
  brand: "Monroe"
}

const skuAmor = SKUService.generate(amortecedor, { motor: "2.0" }, 1)
// → MONAMOR20001

// ─── 4. Gerar lote de 10 SKUs (ex: 10 carros iguais) ────────────
const skuLote = SKUService.generateBatch(veiculo, { motor: "1.6" }, 10)
// → [
//     "VWGOL16001",
//     "VWGOL16002",
//     ...
//     "VWGOL16010"
//   ]

// ─── 5. Validar SKU ──────────────────────────────────────────────
SKUService.isValid("VWGOL16001")  // → true
SKUService.isValid("HV-VW-GOL")   // → false (antigo formato)

// ─── 6. Decodificar SKU ──────────────────────────────────────────
const decoded = SKUService.decode("VWGOL16001")
// → {
//     brand: "VW",
//     product: "GOL",
//     motor: "16",
//     serial: "001",
//     raw: "VWGOL16001"
//   }

// ─── 7. Usar lote automático ────────────────────────────────────
const batch = new SKUBatch(veiculo, { motor: "1.6" }, 1)

batch.next()              // → "VWGOL16001"
batch.next()              // → "VWGOL16002"
batch.nextBatch(5)        // → ["VWGOL16003" ... "VWGOL16007"]

const info = batch.info()
// → {
//     produto: "Gol",
//     marca: "Volkswagen",
//     motor: "1.6",
//     quantidade: 7,
//     proximoSerial: 8
//   }
```

---

## 🛠️ Integração com Admin de Produtos

### Antes (manual, sem padrão):
```javascript
// admin-produtos.html - Usuário digitava qualquer coisa
{
  sku: "HV-00123", // ❌ Sem padrão
  fColor: "Branco" // ❌ Cor separada
}
```

### Depois (automático, compacto):
```javascript
// admin-produtos.html
import { SKUService } from "./js/skuService.js"

async function saveProduto() {
  const motor = document.getElementById("fMotor")?.value // Campo único
  
  const product = {
    name: document.getElementById("fNome").value,
    brand: document.getElementById("fMarca").value
  }

  // Gera SKU automaticamente
  const skuGerado = SKUService.generate(product, { motor }, 1)

  const payload = {
    name: product.name,
    sku: skuGerado, // ✅ Consistente: "VWGOL16001"
    // ... outros campos
  }

  const saved = await databases.createDocument(...)
  return saved
}
```

---

## 🎨 Exemplos por Categoria

### Para **Veículos**:
```javascript
const veiculo = { name: "Gol", brand: "Volkswagen" }
const variations = { motor: "1.6" } // ← Apenas motor

SKUService.generate(veiculo, variations, 1)
// → VWGOL16001

// Outro motor = outro SKU
SKUService.generate(veiculo, { motor: "2.0" }, 1)
// → VWGOL20001
```

### Para **Peças/Parts**:
```javascript
const velas = { name: "Velas de Ignição", brand: "Bosch" } // VEIG (4 letras)
const variations = { motor: "1.6" }

SKUService.generate(velas, variations, 1)
// → BOSCVEIG16001

// Peça para outro motor
SKUService.generate(velas, { motor: "2.0" }, 1)
// → BOSCVEIG20001
```

### Para **Acessórios**:
```javascript
const tapete = { name: "Tapete", brand: "Generic" } // TAPE (4 letras)
const variations = { motor: "universal" } // Motor genérico se aplicável

SKUService.generate(tapete, variations, 1)
// → GENERTAPE001  (se sem motor na variação)
// ou
// → GENERTAPE16001 (se especificar motor)
```

---

## 📊 Exemplo Real: Importar Estoque

```javascript
import { SKUService, SKUBatch } from "./js/skuService.js"

// Dados de importação CSV
const csvData = [
  { 
    nome: "Gol", 
    marca: "VW", 
    motor: "1.6", 
    quantidade: 5 
  },
  { 
    nome: "Fiesta", 
    marca: "Ford", 
    motor: "1.6", 
    quantidade: 3 
  },
]

// Processa cada linha
const productsComSKU = csvData.map(row => {
  const product = {
    name: row.nome,
    brand: row.marca
  }

  const variations = {
    motor: row.motor
  }

  // Gera SKUs para toda a quantidade
  const skus = new SKUBatch(product, variations, 1)
  const loteDeSkus = skus.nextBatch(row.quantidade)

  return {
    product,
    motor: row.motor,
    skus: loteDeSkus,
    info: skus.info()
  }
})

// Resultado:
// [
//   {
//     product: { name: "Gol", brand: "VW" },
//     motor: "1.6",
//     skus: ["VWGOL16001", "VWGOL16002", "VWGOL16003", "VWGOL16004", "VWGOL16005"],
//     info: { produto: "Gol", quantidade: 5, proximoSerial: 6 }
//   },
//   ...
// ]
```

---

## 🔍 Decodificar para Rastreabilidade

```javascript
// Quando recebe um SKU, consegue descompor:
const sku = "VWGOL16001"
const info = SKUService.decode(sku)

console.log(info)
// {
//   brand: "VW",          // Marca: Volkswagen
//   product: "GOL",       // Produto: Gol
//   motor: "16",          // Motor: 1.6
//   serial: "001",        // Serial: #1
//   raw: "VWGOL16001"     // Original
// }

// Agora consegue exibir na UI:
console.log(`${info.brand} ${info.product} - Motor ${info.motor}`)
     // → "VW GOL - Motor 16"
```

---

## ✅ Validação

```javascript
// Valida formato antes de salvar no banco
if (!SKUService.isValid(sku)) {
  console.error("❌ SKU inválido:", sku)
  return
}

// Padrão aceito (NOVO):
SKUService.isValid("VWGOL16001")        // ✅ true (novo formato)
SKUService.isValid("HV-VW-GOL-16-001")  // ❌ false (formato antigo)
SKUService.isValid("VW.GOL.16.001")     // ❌ false (pontos)
SKUService.isValid("VWGOL-16-001")      // ❌ false (hifens)
```

---

## 📚 API Completa

| Método | Descrição | Exemplo |
|--------|-----------|---------|
| `SKUService.generate(product, variations, serial)` | Gera um SKU | `SKUService.generate({name:"Gol", brand:"VW"}, {motor:"1.6"}, 1)` → `VWGOL16001` |
| `SKUService.generateBatch(product, variations, qty)` | Gera lote de SKUs | `SKUService.generateBatch({...}, {motor:"1.6"}, 10)` |
| `SKUService.isValid(sku)` | Valida formato | `SKUService.isValid("VWGOL16001")` → `true` |
| `SKUService.decode(sku)` | Decodifica SKU | `SKUService.decode("VWGOL16001")` |
| `new SKUBatch(product, variations, start)` | Cria lote automático | `new SKUBatch({...}, {motor:"1.6"}, 1)` |
| `batch.next()` | Próximo SKU do lote | `batch.next()` → `"VWGOL16001"` |
| `batch.nextBatch(qty)` | Próximos N SKUs | `batch.nextBatch(10)` |
| `batch.getAll()` | Retorna todos do lote | `batch.getAll()` |
| `batch.info()` | Info do lote | `batch.info()` |

---

## 🎓 Boas Práticas

### ✅ Fazer:
- Gerar SKU automaticamente ao criar produto
- Validar SKU antes de salvar no banco
- Usar motor como principal diferenciador
- Manter 4 letras para nome do produto
- Usar seriais sequenciais para lotes

### ❌ NÃO Fazer:
- Deixar usuário digitar SKU manualmente
- Incluir cor no SKU (remova do campo)
- Misturar formatos de SKU diferentes
- Reutilizar seriais para produtos diferentes
- Esquecer de validar antes de salvar

---

## 📝 Testes

Template de teste:
```javascript
import { SKUService } from "./js/skuService.js"

describe("SKUService", () => {
  it("deve gerar SKU válido no novo formato", () => {
    const sku = SKUService.generate(
      { name: "Gol", brand: "Volkswagen" },
      { motor: "1.6" },
      1
    )
    expect(sku).toBe("VWGOL16001")
    expect(SKUService.isValid(sku)).toBe(true)
  })

  it("deve decodificar corretamente", () => {
    const original = "VWGOL16001"
    const decoded = SKUService.decode(original)
    expect(decoded.brand).toBe("VW")
    expect(decoded.product).toBe("GOL")
    expect(decoded.motor).toBe("16")
    expect(decoded.serial).toBe("001")
  })

  it("deve rejeitar formato antigo com hifens", () => {
    expect(SKUService.isValid("HV-VW-GOL-16-001")).toBe(false)
  })
})
```

---

## 🔗 Integração com Appwrite

```javascript
import { SKUService } from "./js/skuService.js"
import { databases, ID } from "./js/appwriteClient.js"

async function saveProdutoComSKU(productData) {
  // Gera SKU automaticamente no novo formato
  const sku = SKUService.generate(
    { name: productData.name, brand: productData.brand },
    { motor: productData.motor || "" },
    1
  )

  // Valida antes de salvar
  if (!SKUService.isValid(sku)) {
    throw new Error(`SKU inválido gerado: ${sku}`)
  }

  const payload = {
    name: productData.name,
    brand: productData.brand,
    motor: productData.motor || null,
    sku: sku,  // ✅ Novo formato compacto
    // ... outros campos
  }

  // Salva no Appwrite
  const saved = await databases.createDocument(
    CONFIG.DB,
    CONFIG.COL.PRODUCTS,
    ID.unique(),
    payload
  )

  return saved
}
```

---

## 📊 Comparação de SKUs Diferentes

```
Produto          | Motor | SKU Gerado
─────────────────|───────|─────────────────
Gol VW           | 1.6   | VWGOL16001
Gol VW           | 2.0   | VWGOL20001
Fiesta Ford      | 1.6   | FIESTA16001  (ajustado)
Amortecedor      | 1.6   | AMOR16001    (aplicação)
Velas Bosch      | 1.6   | BOSCVEIG16001
Tapete           | -     | TAPE001      (sem motor)
```

---

## 🚨 Migração de SKUs Antigos

Se tem produtos com SKUs no formato antigo (HV-...), execute:

```javascript
async function migrarSKUsAntigos() {
  const allProducts = await databases.listDocuments(
    CONFIG.DB,
    CONFIG.COL.PRODUCTS
  )

  const migracao = allProducts.documents
    .filter(p => p.sku?.startsWith("HV-")) // Formato antigo
    .map(p => ({
      id: p.$id,
      skuAntigo: p.sku,
      novoSKU: SKUService.generate(
        { name: p.name, brand: p.brand },
        { motor: p.motor || "" },
        parseInt(p.sku.split("-").pop()) // Extrai serial
      )
    }))

  console.log("Produtos a migrar:", migracao)
  // Exporte para planilha e processe manualmente ou automatize
}
```

---

## 📞 Suporte

**Dúvida sobre O que mudou?**
→ Veja [Novo Formato do SKU](#📋-novo-formato-do-sku-simplificado)

**Não sabe como integrar?**
→ Veja [Integração com Admin de Produtos](#🛠️-integração-com-admin-de-produtos)

**Quer testar rápido?**
→ Execute: `npm test -- skuService.test.js`

**Qualidade dos SKUs?**
→ Use: `SKUService.isValid(sku)` antes de salvar
```
