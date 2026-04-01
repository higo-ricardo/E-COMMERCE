/**
 * 📦 SKUService - Exemplo de Integração com admin-produtos.html
 * 
 * Este arquivo mostra como integrar o SKUService no fluxo de criação/edição
 * de produtos no admin de produtos.
 * 
 * ANTES:
 * - Usuário digitava SKU manualmente: "HV-00123"
 * - Sem padrão, sem validação
 * 
 * DEPOIS:
 * - SKU gerado automaticamente: "HV-VW-GOL-16-MAN-BRA-001"
 * - Consistente, legível, code-de-barras ready
 */

// ─────────────────────────────────────────────────────────────────────────────
// 📋 PASSO 1: Importar SKUService
// ─────────────────────────────────────────────────────────────────────────────

import { SKUService, SKUBatch } from "./js/skuService.js"

// ─────────────────────────────────────────────────────────────────────────────
// 🎨 PASSO 2: Adicionar campos de variação no formulário
// ─────────────────────────────────────────────────────────────────────────────

/*
HTML a adicionar em admin-produtos.html:

<div class="form-group">
  <label>Variações do Produto</label>
  
  <div class="variation-section">
    <label>Motor (ex: 1.0, 1.6, 2.0)</label>
    <input type="text" id="fMotor" placeholder="1.6">
  </div>

  <div class="variation-section">
    <label>Transmissão</label>
    <select id="fTransmissao">
      <option value="">Nenhuma</option>
      <option value="Manual">Manual</option>
      <option value="Automática">Automática</option>
    </select>
  </div>

  <div class="variation-section">
    <label>Combustível</label>
    <select id="fCombustivel">
      <option value="">Nenhuma</option>
      <option value="Gasolina">Gasolina</option>
      <option value="Diesel">Diesel</option>
      <option value="Flexível">Flexível</option>
    </select>
  </div>

  <div class="variation-section">
    <label>Cor</label>
    <input type="text" id="fCor" placeholder="Branco">
  </div>

  <div class="variation-section">
    <label>Ano</label>
    <input type="number" id="fAno" placeholder="2024">
  </div>

  <div class="variation-section">
    <label>Versão/Trim</label>
    <input type="text" id="fVersao" placeholder="GLX, GLS">
  </div>
</div>

<!-- Botão para gerar/visualizar SKU -->
<div class="form-group">
  <button type="button" onclick="previewSKU()" class="btn btn-secondary">
    👁️ Visualizar SKU
  </button>
  <div id="skuPreview" style="margin-top: 8px; padding: 10px; background: #f0f0f0; 
                              border-radius: 4px; display: none;">
    <strong>SKU:</strong> <code id="skuPreviewValue"></code>
  </div>
</div>
*/

// ─────────────────────────────────────────────────────────────────────────────
// 🔧 PASSO 3: Funções para gerar e visualizar SKU
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Coleta variações do formulário
 */
function getVariationsFromForm() {
  return {
    motor: document.getElementById("fMotor")?.value?.trim() || null,
    transmissao: document.getElementById("fTransmissao")?.value?.trim() || null,
    combustivel: document.getElementById("fCombustivel")?.value?.trim() || null,
    cor: document.getElementById("fCor")?.value?.trim() || null,
    ano: document.getElementById("fAno")?.value?.trim() || null,
    versao: document.getElementById("fVersao")?.value?.trim() || null,
  }
}

/**
 * Filtra variações nulas ou vazias
 */
function cleanVariations(variations) {
  return Object.fromEntries(
    Object.entries(variations).filter(([_, v]) => v !== null && v !== "")
  )
}

/**
 * Visualiza o SKU que será gerado
 */
function previewSKU() {
  const name = document.getElementById("fNome")?.value
  const brand = document.getElementById("fMarca")?.value

  if (!name || !brand) {
    alert("❌ Preencha Nome e Marca do produto primeiro")
    return
  }

  const product = {
    name: name.trim(),
    brand: brand.trim(),
    id: `temp-${Date.now()}` // ID temporário para preview
  }

  const variations = cleanVariations(getVariationsFromForm())

  try {
    const sku = SKUService.generate(product, variations, 1)

    // Mostra preview
    const preview = document.getElementById("skuPreview")
    const value = document.getElementById("skuPreviewValue")

    value.textContent = sku
    preview.style.display = "block"

    console.log("✅ SKU preview:", sku)
  } catch (err) {
    alert(`❌ Erro ao gerar SKU: ${err.message}`)
    console.error(err)
  }
}

/**
 * Gera SKU automaticamente ao salvar
 */
function generateSKUForSave(productName, productBrand, productId) {
  const product = {
    name: productName,
    brand: productBrand,
    id: productId
  }

  const variations = cleanVariations(getVariationsFromForm())

  try {
    const sku = SKUService.generate(product, variations, 1)

    // Valida antes de retornar
    if (!SKUService.isValid(sku)) {
      throw new Error(`SKU gerado inválido: ${sku}`)
    }

    console.log("✅ SKU gerado com sucesso:", sku)
    return sku
  } catch (err) {
    console.error("❌ Erro ao gerar SKU:", err)
    throw err
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// 💾 PASSO 4: Integrar com função saveProduto() existente
// ─────────────────────────────────────────────────────────────────────────────

/*
Modificar a função saveProduto() existente em admin-produtos.html:

async function saveProduto() {
  // ... validações existentes ...

  const data = {
    name: document.getElementById("fNome").value,
    brand: document.getElementById("fMarca").value,
    category: document.getElementById("fCategoria").value,
    // ... outros campos ...
  }

  // 🔴 ANTES (manual):
  // data.sku = document.getElementById("fSku").value

  // 🟢 DEPOIS (automático com SKUService):
  try {
    data.sku = generateSKUForSave(
      data.name,
      data.brand,
      editId || "novo"
    )
  } catch (err) {
    toast("❌ Erro ao gerar SKU: " + err.message, "error")
    return
  }

  // ... rest da função ...
}
*/

// ─────────────────────────────────────────────────────────────────────────────
// 📂 PASSO 5: Gerar lote de SKUs (para importação em massa)
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Gera lote de SKUs para importação
 * Exemplo: Recebeu 10 Gols iguais, gera SKU para cada um
 */
function generateSkuBatch(productName, productBrand, productId, quantidade) {
  const product = {
    name: productName,
    brand: productBrand,
    id: productId
  }

  const variations = cleanVariations(getVariationsFromForm())

  try {
    const skus = SKUService.generateBatch(product, variations, quantidade)

    console.log(`✅ ${quantidade} SKUs gerados:`)
    console.table(skus)

    return skus
  } catch (err) {
    console.error("❌ Erro ao gerar lote:", err)
    throw err
  }
}

/**
 * Alternativa: Usar SKUBatch para mais controle
 */
function generateSkuBatchAdvanced(productName, productBrand, productId, quantidade) {
  const product = {
    name: productName,
    brand: productBrand,
    id: productId
  }

  const variations = cleanVariations(getVariationsFromForm())

  try {
    const batch = new SKUBatch(product, variations, 1)
    const skus = batch.nextBatch(quantidade)

    const info = batch.info()
    console.log("✅ Lote gerado:")
    console.log(info)
    console.table(skus)

    return { skus, info }
  } catch (err) {
    console.error("❌ Erro ao gerar lote:", err)
    throw err
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// 📊 PASSO 6: Validar SKU antes de salvar
// ─────────────────────────────────────────────────────────────────────────────

function validateSKU(sku) {
  if (!sku) {
    console.warn("⚠️ SKU vazio")
    return false
  }

  if (!SKUService.isValid(sku)) {
    console.error(`❌ SKU inválido: ${sku}`)
    return false
  }

  console.log(`✅ SKU válido: ${sku}`)
  return true
}

// ─────────────────────────────────────────────────────────────────────────────
// 🔍 PASSO 7: Decodificar SKU para exibição
// ─────────────────────────────────────────────────────────────────────────────

function displaySkuInfo(sku) {
  if (!SKUService.isValid(sku)) {
    console.error("❌ SKU inválido")
    return
  }

  const decoded = SKUService.decode(sku)

  console.log("📦 Informações do SKU:")
  console.log(`  Empresa: ${decoded.company}`)
  console.log(`  Marca: ${decoded.brand}`)
  console.log(`  Produto: ${decoded.product}`)
  console.log(`  Variação: ${decoded.variation || "Nenhuma"}`)
  console.log(`  Serial: ${decoded.serial || "N/A"}`)

  return decoded
}

// ─────────────────────────────────────────────────────────────────────────────
// ✅ PASSO 8: Exemplos de Uso
// ─────────────────────────────────────────────────────────────────────────────

// Exemplo 1: Criar um produto simples
function exemplo1() {
  const sku = SKUService.generate(
    { name: "Gol", brand: "Volkswagen", id: "prod-123" },
    { motor: "1.6", transmissao: "Manual" },
    1
  )
  console.log("✅ Exemplo 1 - SKU simples:", sku)
}

// Exemplo 2: Gerar lote
function exemplo2() {
  const skus = SKUService.generateBatch(
    { name: "Gol", brand: "Volkswagen", id: "prod-123" },
    { motor: "1.6", transmissao: "Manual" },
    5
  )
  console.log("✅ Exemplo 2 - Lote de SKUs:", skus)
}

// Exemplo 3: Validar
function exemplo3() {
  const sku = "HV-VW-GOL-16-001"
  if (SKUService.isValid(sku)) {
    const decoded = SKUService.decode(sku)
    console.log("✅ Exemplo 3 - SKU decodificado:", decoded)
  }
}

// Exportar para uso em console
if (typeof window !== "undefined") {
  window.SKUExamples = {
    exemplo1,
    exemplo2,
    exemplo3,
    previewSKU,
    generateSKUForSave,
    generateSkuBatch,
    displaySkuInfo,
    validateSKU
  }

  console.log(
    "💡 Dica: Use window.SKUExamples.exemplo1() para testar nos console"
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// 📈 Roadmap: Próximos passos
// ─────────────────────────────────────────────────────────────────────────────

/*
1. Integrar SKUService no admin-produtos.html
   - Adicionar campos de variação
   - Gerar SKU automaticamente ao salvar
   - Exibir preview do SKU

2. Integração com Appwrite
   - Salvar SKU no banco de dados
   - Criar índice em SKU para buscas rápidas

3. Interface de código de barras
   - Exibir QR code do SKU
   - Permitir scaneamento

4. Relatórios
   - Histórico de SKUs gerados
   - Validação em massa de SKUs existentes

5. Sincronização
   - Gerar SKUs para produtos existentes (migração)
   - Validar SKUs duplicados
*/

export {
  getVariationsFromForm,
  cleanVariations,
  previewSKU,
  generateSKUForSave,
  generateSkuBatch,
  generateSkuBatchAdvanced,
  validateSKU,
  displaySkuInfo,
  exemplo1,
  exemplo2,
  exemplo3
}
