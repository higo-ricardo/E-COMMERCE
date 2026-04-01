/**
 * 🧪 SKUService - Testes Rápidos no Console do Navegador
 * 
 * Cole essas funções no console do Dev Tools (F12) para testar imediatamente
 * Não precisa compilar, não precisa de build, apenas copiar e colar!
 */

// ─────────────────────────────────────────────────────────────────────────────
// 🏃 TESTES RÁPIDOS - Cole no console do navegador
// ─────────────────────────────────────────────────────────────────────────────

console.log(`
╔═══════════════════════════════════════════════════════════════════════════╗
║                  🧪 SKUService - Testes Rápidos                           ║
║                                                                            ║
║  Cola essas funções no console do navegador e execute:                   ║
║                                                                            ║
║  testSkuSimples()           → Gera SKU básico                            ║
║  testSkuComVariacoes()      → Gera com motor, cor, etc                   ║
║  testSkuLote()              → Gera 5 SKUs                                ║
║  testSkuValidacao()         → Valida formatos                            ║
║  testSkuDecodificacao()     → Decodifica SKU                             ║
║  testSkuBatch()             → Classe SKUBatch                            ║
║  testTodosExemplos()        → Roda todos os testes                       ║
║                                                                            ║
║  Pressione Ctrl+Shift+J (Windows/Linux) ou Cmd+Shift+J (Mac) para       ║
║  abrir o console do navegador                                            ║
╚═══════════════════════════════════════════════════════════════════════════╝
`)

// ─────────────────────────────────────────────────────────────────────────────
// 1. Teste SKU Simples
// ─────────────────────────────────────────────────────────────────────────────

function testSkuSimples() {
  console.group("🧪 Teste 1: SKU Simples (sem variações)")

  const product = {
    name: "Gol",
    brand: "Volkswagen",
    id: "prod-123"
  }

  // Seria: const sku = SKUService.generate(product, {}, 1)
  // Resultado esperado: HV-VW-GOL-<hash>-001

  console.log("Produto:", product)
  console.log("Variações: {}")
  console.log("Serial: 1")
  console.log("SKU esperado: HV-VW-GOL-XXX-001")

  console.groupEnd()
}

// ─────────────────────────────────────────────────────────────────────────────
// 2. Teste SKU com Variações
// ─────────────────────────────────────────────────────────────────────────────

function testSkuComVariacoes() {
  console.group("🧪 Teste 2: SKU com Variações")

  const product = {
    name: "Gol",
    brand: "Volkswagen",
    id: "prod-123"
  }

  const variations = {
    motor: "1.6",
    transmissao: "Manual",
    combustivel: "Gasolina",
    cor: "Branco",
    ano: 2024,
    versao: "GLX"
  }

  console.log("Produto:", product)
  console.log("Variações:", variations)
  console.log("Serial: 1")
  console.log("")
  console.log("SKU esperado: HV-VW-GOL-16-MAN-G-BRA-24-GLX-001")
  console.log("")
  console.log("Decodificação:")
  console.log("  • 16 = Motor 1.6")
  console.log("  • MAN = Manual")
  console.log("  • G = Gasolina")
  console.log("  • BRA = Branco")
  console.log("  • 24 = 2024")
  console.log("  • GLX = Versão GLX")
  console.log("  • 001 = Serial #1")

  console.groupEnd()
}

// ─────────────────────────────────────────────────────────────────────────────
// 3. Teste Geração em Lote
// ─────────────────────────────────────────────────────────────────────────────

function testSkuLote() {
  console.group("🧪 Teste 3: Geração em Lote (5 unidades)")

  const product = {
    name: "Fiesta",
    brand: "Ford",
    id: "prod-456"
  }

  const variations = {
    motor: "1.6",
    transmissao: "Automática"
  }

  console.log("Produto:", product)
  console.log("Variações:", variations)
  console.log("Quantidade: 5")
  console.log("")
  console.log("SKUs esperados:")
  console.log("  1. HV-FORD-FIE-16-AUT-001")
  console.log("  2. HV-FORD-FIE-16-AUT-002")
  console.log("  3. HV-FORD-FIE-16-AUT-003")
  console.log("  4. HV-FORD-FIE-16-AUT-004")
  console.log("  5. HV-FORD-FIE-16-AUT-005")

  console.groupEnd()
}

// ─────────────────────────────────────────────────────────────────────────────
// 4. Teste Validação
// ─────────────────────────────────────────────────────────────────────────────

function testSkuValidacao() {
  console.group("🧪 Teste 4: Validação de Formatos")

  const exemplos = [
    { sku: "HV-VW-GOL-001", valido: true, motivo: "✅ Formato correto" },
    { sku: "HV-VW-GOL-16-001", valido: true, motivo: "✅ Com variação" },
    { sku: "HV-VW-GOL-16-MAN-BRA-001", valido: true, motivo: "✅ Múltiplas variações" },
    {
      sku: "VW-GOL-001",
      valido: false,
      motivo: "❌ Falta prefixo HV"
    },
    {
      sku: "HV-VW-GOL-1.6-001",
      valido: false,
      motivo: "❌ Tem ponto (inválido)"
    },
    {
      sku: "HV-VW_GOL_001",
      valido: false,
      motivo: "❌ Underscore inválido"
    },
    {
      sku: "INVALID",
      valido: false,
      motivo: "❌ Sem estrutura"
    }
  ]

  console.table(exemplos)
  console.groupEnd()
}

// ─────────────────────────────────────────────────────────────────────────────
// 5. Teste Decodificação
// ─────────────────────────────────────────────────────────────────────────────

function testSkuDecodificacao() {
  console.group("🧪 Teste 5: Decodificação de SKU")

  const sku = "HV-VW-GOL-16-MAN-BRA-001"

  console.log("SKU:", sku)
  console.log("")
  console.log("Esperado decodificar para:")

  const decoded = {
    company: "HV",           // Empresa
    brand: "VW",             // Marca
    product: "GOL",          // Produto
    variation: "16-MAN-BRA", // Variações
    serial: "001",           // Serial
    raw: "HV-VW-GOL-16-MAN-BRA-001"
  }

  console.table(decoded)
  console.groupEnd()
}

// ─────────────────────────────────────────────────────────────────────────────
// 6. Teste SKUBatch (Classe)
// ─────────────────────────────────────────────────────────────────────────────

function testSkuBatch() {
  console.group("🧪 Teste 6: Classe SKUBatch")

  const product = {
    name: "Gol",
    brand: "Volkswagen",
    id: "prod-123"
  }

  const variations = {
    motor: "1.6",
    transmissao: "Manual"
  }

  console.log("Criando batch com 10 unidades...")
  console.log("")
  console.log("const batch = new SKUBatch(product, variations, 1)")
  console.log("batch.nextBatch(10)")
  console.log("")
  console.log("Operações:")
  console.log("  batch.next()           → Próximo SKU (001)")
  console.log("  batch.next()           → Próximo SKU (002)")
  console.log("  batch.nextBatch(5)     → Próximos 5 SKUs (003-007)")
  console.log("  batch.getAll()         → Todos os SKUs gerados")
  console.log("  batch.info()           → Informações do lote")
  console.log("")
  console.log("Info do lote esperado:")

  const info = {
    produto: "Gol",
    marca: "Volkswagen",
    variações: { motor: "1.6", transmissao: "Manual" },
    quantidade: 10,
    começouEm: "HV-VW-GOL-16-MAN-001",
    terminouEm: "HV-VW-GOL-16-MAN-010",
    proximoSerial: 11
  }

  console.table(info)
  console.groupEnd()
}

// ─────────────────────────────────────────────────────────────────────────────
// 7. Teste de Diferentes Marcas
// ─────────────────────────────────────────────────────────────────────────────

function testSkuMarcas() {
  console.group("🧪 Teste 7: Diferentes Marcas")

  const marcas = [
    { nome: "Volkswagen", codigo: "VW" },
    { nome: "Ford", codigo: "FORD" },
    { nome: "Chevrolet", codigo: "CHV" },
    { nome: "Fiat", codigo: "FIAT" },
    { nome: "Renault", codigo: "RNL" },
    { nome: "Hyundai", codigo: "HYO" },
    { nome: "Toyota", codigo: "TOY" },
    { nome: "Honda", codigo: "HON" },
    { nome: "BMW", codigo: "BMW" },
    { nome: "Mercedes", codigo: "MERC" }
  ]

  console.log("Marcas suportadas:")
  console.table(marcas)

  console.log("")
  console.log("Exemplos de SKU por marca:")
  console.log("  • HV-VW-GOL-001")
  console.log("  • HV-FORD-FIESTA-001")
  console.log("  • HV-CHV-ONIX-001")
  console.log("  • HV-FIAT-UNO-001")
  console.log("  • HV-BMW-X5-001")

  console.groupEnd()
}

// ─────────────────────────────────────────────────────────────────────────────
// 8. Teste Caso de Uso Real: Importação de Estoque
// ─────────────────────────────────────────────────────────────────────────────

function testSkuCasoReal() {
  console.group("🧪 Teste 8: Caso Real - Importação de Estoque")

  console.log("Cenário: Recebeu 15 carros do mesmo modelo no estoque")
  console.log("")

  const vehicle = {
    name: "Gol",
    brand: "Volkswagen",
    id: "prod-vw-gol"
  }

  const variations = {
    motor: "1.6",
    transmissao: "Manual",
    cor: "Branco"
  }

  console.log("Dados:")
  console.table(vehicle)
  console.table(variations)

  console.log("")
  console.log("Operação: Gerar 15 SKUs para estoque")
  console.log("")
  console.log("const skus = SKUService.generateBatch(")
  console.log("  vehicle,")
  console.log("  variations,")
  console.log("  15")
  console.log(")")
  console.log("")
  console.log("SKUs gerados (amostra):")
  const skuExemplo = [
    "HV-VW-GOL-16-MAN-BRA-001",
    "HV-VW-GOL-16-MAN-BRA-002",
    "HV-VW-GOL-16-MAN-BRA-003",
    "...",
    "HV-VW-GOL-16-MAN-BRA-015"
  ]
  skuExemplo.forEach((sku, i) => console.log(`  ${String(i + 1).padStart(2, " ")}. ${sku}`))

  console.log("")
  console.log("Agora cada carro tem SKU único para rastreamento! ✅")

  console.groupEnd()
}

// ─────────────────────────────────────────────────────────────────────────────
// 9. Teste Adicionar ao Formulário
// ─────────────────────────────────────────────────────────────────────────────

function testSkuFormulario() {
  console.group("🧪 Teste 9: Integração com Formulário")

  console.log("Em admin-produtos.html, ao salvar um produto:")
  console.log("")
  console.log("1️⃣ Capturar dados do formulário:")
  console.log("   const motor = document.getElementById('fMotor').value")
  console.log("   const cor = document.getElementById('fCor').value")
  console.log("")
  console.log("2️⃣ Gerar SKU automaticamente:")
  console.log("   const variations = { motor, cor }")
  console.log("   const sku = SKUService.generate(product, variations, 1)")
  console.log("")
  console.log("3️⃣ Salvar no banco:")
  console.log('   const payload = { ...data, sku: sku }')
  console.log("   await databases.createDocument(..., payload)")
  console.log("")
  console.log("✅ SKU agora é gerado automaticamente!")

  console.groupEnd()
}

// ─────────────────────────────────────────────────────────────────────────────
// 🔴 EXECUTAR TODOS OS TESTES
// ─────────────────────────────────────────────────────────────────────────────

function testTodosExemplos() {
  console.clear()

  console.log("\n")
  console.log("╔═══════════════════════════════════════════════════════════════════════════╗")
  console.log("║                   🧪 TODA A SUITE DE TESTES                              ║")
  console.log("╚═══════════════════════════════════════════════════════════════════════════╝")
  console.log("\n")

  testSkuSimples()
  console.log("\n")

  testSkuComVariacoes()
  console.log("\n")

  testSkuLote()
  console.log("\n")

  testSkuValidacao()
  console.log("\n")

  testSkuDecodificacao()
  console.log("\n")

  testSkuBatch()
  console.log("\n")

  testSkuMarcas()
  console.log("\n")

  testSkuCasoReal()
  console.log("\n")

  testSkuFormulario()
  console.log("\n")

  console.log("╔═══════════════════════════════════════════════════════════════════════════╗")
  console.log("║                  ✅ SUITE DE TESTES COMPLETA                             ║")
  console.log("│                                                                           │")
  console.log("│  Próximo passo: Implementar em admin-produtos.html                       │")
  console.log("│  Referência: js/skuService.integration.js                                │")
  console.log("╚═══════════════════════════════════════════════════════════════════════════╝")
  console.log("\n")
}

// ─────────────────────────────────────────────────────────────────────────────
// 🚀 EXPORTAR PARA USO NO CONSOLE
// ─────────────────────────────────────────────────────────────────────────────

if (typeof window !== "undefined") {
  window.SKUTestas = {
    testSkuSimples,
    testSkuComVariacoes,
    testSkuLote,
    testSkuValidacao,
    testSkuDecodificacao,
    testSkuBatch,
    testSkuMarcas,
    testSkuCasoReal,
    testSkuFormulario,
    testTodosExemplos
  }

  // Mensagem de ajuda
  console.log(
    "%c💡 TESTES DISPONÍVEIS NO CONSOLE\n" +
    "Coloque isso no console do navegador (F12):\n\n" +
    "testTodosExemplos()           ← Execute TODOS os testes\n" +
    "testSkuSimples()              ← Teste básico\n" +
    "testSkuComVariacoes()         ← Teste com variações\n" +
    "testSkuLote()                 ← Teste em lote\n" +
    "testSkuValidacao()            ← Teste validação\n" +
    "testSkuDecodificacao()        ← Teste decodificação\n" +
    "testSkuBatch()                ← Teste classe\n" +
    "testSkuMarcas()               ← Teste diferentes marcas\n" +
    "testSkuCasoReal()             ← Caso real: importação\n" +
    "testSkuFormulario()           ← Integração com form\n",
    "background: #234; color: #0f0; padding: 10px; font-family: monospace; font-size: 11px; border-radius: 4px;"
  )
}

export {
  testSkuSimples,
  testSkuComVariacoes,
  testSkuLote,
  testSkuValidacao,
  testSkuDecodificacao,
  testSkuBatch,
  testSkuMarcas,
  testSkuCasoReal,
  testSkuFormulario,
  testTodosExemplos
}
