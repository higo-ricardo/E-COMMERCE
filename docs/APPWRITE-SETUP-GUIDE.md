# 📋 Guia de Configuração - Integração SKU com Appwrite

**Data**: 31 de março de 2026  
**Projeto**: HIVERCAR  
**Status**: ✅ Código implementado, aguardando configurações no Appwrite

---

## 🎯 O que foi feito no código

✅ Validação de SKU duplicado em `verificarSkuDuplicado()`  
✅ Auto-geração de SKU ao salvar produto (novo formato: VWGOL16001)  
✅ Verificação de duplicatas antes de salvar  
✅ Relatório visual de duplicatas no admin-produtos.html  
✅ Suporte para campo MOTOR (única variação necessária)  

---

## 📝 Passos que VOCÊ precisa fazer no Appwrite Console

### PASSO 1: Criar Índice UNIQUE para SKU

**Por quê?** Para garantir que não existam dois produtos com o mesmo SKU no banco de dados.

**Como fazer:**

1. Acesse: https://cloud.appwrite.io
2. Faça login com suas credenciais
3. Selecione projeto: **HIVERCAR**
4. Vá em **Databases** → Selecione a database: `69c7e9af00296b17179e`
5. Clique na collection: **products**
6. Vá em **Attributes** (segunda aba)
7. Vá em **Indexes** (terceira aba)
8. Clique em **Create Index**

**Configure assim:**
- **Name (Nome)**: `sku_unique`
- **Type (Tipo)**: `UNIQUE` (dropdown, não marque "Orders")
- **Attributes**: Selecione `sku`

9. Clique em **Create**

✅ **Resultado**: Um índice que impede SKUs duplicados

---

### PASSO 2: Adicionar Campo Motor na Collection

**Por quê?** Para armazenar o motor do produto que é usado para gerar o SKU.

**Como fazer:**

1. Na mesma collection **products**, vá em **Attributes**
2. Clique em **Create Attribute**
3. Adicione **1 atributo** com esta configuração:

#### Motor
- **Key**: `motor`
- **Type**: VARCHAR
- **Required**: ❌ (deixe desmarcado)
- **Default Value**: (deixe em branco)
- **Min Length**: 0
- **Max Length**: 10

✅ **Resultado**: Campo para armazenar motor do produto (ex: "1.6", "2.0", "universal")

---

## 🧪 Como Testar a Integração

### Teste 1: Gerar SKU Automaticamente ✅

1. Acesse: http://localhost/admin-produtos.html (ou seu domínio)
2. Clique em **+ Novo Produto**
3. Preencha:
   - Nome: `Gol`
   - Marca: `VW`
   - Motor: `1.6` (único campo de variação)
   - Preço: `50000`
   - Preço de Custo: `40000`
   - Estoque: `10`
4. Note que o campo **SKU** se preencheu automaticamente: `VWGOL16001`
5. Clique em **SALVAR PRODUTO**

✅ **Esperado**: Produto salvo com SKU gerado no novo formato (sem HV, sem hifens): `VWGOL16001`

---

### Teste 2: Validar Duplicata ❌

1. Tente criar **outro produto com o mesmo SKU**:
   - Clique em **+ Novo Produto**
   - Preencha os mesmos dados do teste anterior (Gol, VW, Motor 1.6)
   - Note que o SKU será idêntico: `VWGOL16001`
2. Clique em **SALVAR PRODUTO**

❌ **Esperado**: Mensagem de erro: `"SKU 'VWGOL16001' já existe no sistema!"`

---

### Teste 3: Motor Diferente = SKU Diferente ✅

1. Clique em **+ Novo Produto**
2. Preencha:
   - Nome: `Gol`
   - Marca: `VW`
   - Motor: `2.0` (diferente do teste 1)
   - Preço: `55000`
   - Preço de Custo: `45000`
   - Estoque: `5`
3. Note que o SKU é diferente: `VWGOL20001`
4. Clique em **SALVAR PRODUTO**

✅ **Esperado**: SKU diferente criado com sucesso (motor 2.0 vs 1.6)

---

### Teste 4: Gerar Novo SKU Manualmente ✅

1. Clique em **+ Novo Produto**
2. Preencha:
   - Nome: `Amortecedor`
   - Marca: `Monroe`
   - Motor: `1.6`
3. Notará que o SKU está vazio (readonly, campo preparado)
4. Clique no botão **🎲 Gerar** ao lado do SKU
5. O SKU se preencheu: `MONAMOR16001` (4 letras de AMORTECEDOR)

✅ **Esperado**: SKU gerado manualmente no novo formato compacto

---

### Teste 5: Relatório de Duplicatas 📊

1. Acesse admin-produtos.html
2. Clique no botão **⚠️ Duplicatas** (novo botão na barra superior)
3. Aguarde o relatório ser gerado

📊 **Esperado**: Modal com estatísticas:
- Total de produtos
- Produtos com SKU
- Produtos sem SKU
- Lista de SKUs duplicados (se houver)

---

## 📌 Resumo da Integração

| Item | Status | Feito em |
|------|--------|----------|
| Validação de duplicata no código | ✅ | admin-produtos.html |
| Auto-geração de SKU (novo formato) | ✅ | admin-produtos.html |
| Campo MOTOR no form | ✅ | admin-produtos.html |
| Botão "Gerar SKU" manualmente | ✅ | admin-produtos.html |
| Relatório de duplicatas | ✅ | admin-produtos.html |
| Índice UNIQUE no banco | ⏳ VOCÊ | Appwrite Console |
| Campo MOTOR no Appwrite | ⏳ VOCÊ | Appwrite Console |

---

## 🔗 Referências Úteis

- Documentação Appwrite Indexes: https://appwrite.io/docs/databases#indexes
- Documentação Appwrite Attributes: https://appwrite.io/docs/databases#attributes
- SKU Service: `docs/SKU-Generator-Guide.md`
- Admin Produtos: `admin-produtos.html`

---

## ⚠️ Importante!

### Se ainda não fez os passos no Appwrite Console:

🔴 **VALIDAÇÃO DE DUPLICATA NÃO FUNCIONARÁ COMPLETAMENTE** até você criar o índice UNIQUE.

O código está pronto, mas sem o índice no banco, é possível (teoricamente) ter duplicatas se:
- Dois usuários salvarem ao mesmo tempo
- Houver tentativa de modificação direta do banco

**Siga os PASSOS 1 e 2 acima para completar a integração!**

---

## 📞 Próximos Passos

Após completar os passos do Appwrite:

1. ✅ Execute os testes acima
2. 📝 Documente qualquer problema encontrado
3. 🚀 Integre com o checkout/fluxo de venda
4. 📊 Configure relatórios de SKU em estoque/fiscal

---

**Criado em:** 31 de março de 2026  
**Projeto:** HIVERCAR - Integração SKU com Appwrite  
**Versão:** 1.0
