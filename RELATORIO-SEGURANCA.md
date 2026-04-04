# 🔒 Relatório de Auditoria de Segurança - HIVECAR

**Data:** 2026-04-04  
**Projeto:** HIVECAR (E-commerce Autopeças)  
**Versão:** 1.0  

---

## Sumário Executivo

Este relatório documenta as vulnerabilidades de segurança identificadas durante a revisão de código do projeto HIVECAR. O sistema é uma aplicação web de e-commerce construído com Appwrite (backend) e JavaScript vanilla (frontend).

| Severidade | Quantidade |
|------------|------------|
| 🔴 Críticas | 2 |
| 🟠 Altas    | 4 |
| 🟡 Médias  | 3 |
| 🟢 Baixas  | 2 |

---

## Vulnerabilidades Identificadas

---

### 🔴 CRÍTICA #1: Credenciais Expostas no Frontend

**Localização:** `js/config.js:8-10`

```javascript
export const CONFIG = {
  ENDPOINT:   "https://tor.cloud.appwrite.io/v1",
  PROJECT_ID: "69c7e94a003a1c86b7ca",
  DB:         "69c7e9af00296b17179e",
  // ...
}
```

**Problema:** IDs de projeto e banco de dados do Appwrite estão expostos no código cliente. Embora não revelem segredos diretamente, permitem enumeração da infraestrutura.

**Impacto:**Enumeração de infraestrutura; potencial ataque a API

**Recomendação:** Utilizar proxy server-side para chamadas ao Appwrite, ou implementar严格的 regras de CORS no Appwrite Console.

---

### 🔴 CRÍTICA #2: Funções de Escape Incompletas (XSS)

**Localização:** `js/admin-core.js:203-209`

```javascript
export const esc = (s) =>
  String(s ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
```

**Problema:** A função não escapa backticks (`) e colchetes ([]), permitindo绕过filtros XSS em contextos HTML.

**Impacto:** Cross-Site Scripting (XSS) em painéis administrativos

**Recomendação:** Adicionar escape para caracteres adicionais:
```javascript
.replace(/`/g, "&#96;")
.replace(/\[/g, "&#91;")
.replace(/\]/g, "&#93;")
```

**Arquivos afetados:**
- `js/admin-core.js:203-209`
- `js/utils.js:122-129`

---

### 🟠 ALTA #3: Dados Renderizados sem Escape Adequado

**Localização:** `js/repositories.js:75-84`

```javascript
res.documents = res.documents.filter(doc => {
  const user = (doc.user || "").toLowerCase()
  const email = (doc.email || "").toLowerCase()
  // ...
  return user.includes(searchLower) || email.includes(searchLower)
})
```

**Problema:** Resultados de busca são filtrados em memória mas podem conter dados maliciosos que serão renderizados sem escape adicional.

**Impacto:** XSS através de dados envenenados no banco

**Recomendação:** Garantir que todos os dados renderizados na UI passem pela função `esc()` antes de serem inseridos no HTML.

**Arquivos afetados:**
- `js/repositories.js:75-84` (Orders)
- `js/repositories.js:200-211` (Products)

---

### 🟠 ALTA #4: Race Condition em Contadores

**Localização:** `js/repositories.js:355-362`

```javascript
async incrementUsage(code) {
  const coupon = await this.findByCode(code)
  if (!coupon) throw new Error(`Cupom "${code}" não encontrado`)
  
  const currentUsage = coupon.timesUsed || 0
  return databases.updateDocument(DB, COL.COUPONS, coupon.$id, {
    timesUsed: currentUsage + 1,
  })
}
```

**Problema:** Leitura + escrita não são atômicas. Usuários maliciosos podem explorar race conditions para aplicar cupons além do limite.

**Impacto:** Abuso de cupons, perda financeira

**Recomendação:** Implementar locking ou usar operações atômicas do Appwrite (ex: mutations).

**Arquivos afetados:**
- `js/repositories.js:355-362` (CouponRepository)
- `js/repositories.js:410-421` (CouponUsageRepository)

---

### 🟠 ALTA #5: Redirecionamento sem Validação

**Localização:** `js/login.js:284-287`

```javascript
if (redirectUrl) {
  window.location.href = redirectUrl
  return
}
```

**Problema:** Parâmetro `redirect` da URL é usado diretamente sem validação, permitindo open redirect.

**Impacto:** Phishing, redirecionamento malicioso

**Recomendação:** Validar que o redirect URL é interno (same-origin):
```javascript
const url = new URL(redirectUrl, location.origin)
if (url.origin !== location.origin) redirectUrl = "dashboard.html"
```

---

### 🟠 ALTA #6: Validação de CPF Fraca

**Localização:** `js/couponService.js:76-80`

```javascript
if (coupon.cpf) {
  if (!context.cpf || context.cpf !== coupon.cpf) {
    return { ok: false, reason: "coupon_cpf_mismatch" }
  }
}
```

**Problema:** Comparação direta sem normalização - "123.456.789-00" ≠ "12345678900".

**Impacto:** Bypass de validação de cupons CPF-restritos

**Recomendação:** Normalizar CPF antes da comparação:
```javascript
const normalize = cpf => cpf.replace(/\D/g, "")
if (normalize(context.cpf) !== normalize(coupon.cpf)) { ... }
```

---

### 🟡 MÉDIA #7: Rate Limiting Ausente em APIs Externas

**Localização:** `js/userService.js:249-265`

```javascript
export async function getClientIP() {
  try {
    const response = await fetch('https://api.ipify.org?format=json')
    // ...
  } catch {
    // Fallback: tenta outra API
    try {
      const response = await fetch('https://ipapi.co/json/')
```

**Problema:** Chamadas a APIs externas (ipify, ipapi.co) sem controle de rate limiting, vulnerável a abuse.

**Impacto:** Bloqueio por APIs externas, consumo excessivo de recursos

**Recomendação:** Implementar cache local e limites de requisições.

---

### 🟡 MÉDIA #8: Validação de Email Incompleta

**Localização:** `js/userService.js:27-28`

```javascript
export function validateEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email.trim())
}
```

**Problema:** Regex muito simples, não valida email real. Permite emails como `a@b.c` ou `test@domain`.

**Impacto:** Spam, usuários inválidos no sistema

**Recomendação:** Usar regex mais robusta ou biblioteca de validação.

---

### 🟡 MÉDIA #9: Tentativas de Login Controladas apenas no Cliente

**Localização:** `js/login.js:370-395`

```Problema:** Contador de tentativas (`uiTry`) é armazenado apenas no cliente - attacker pode limpar localStorage ou usar múltiplos browsers.

**Impacto:** Brute force attacks não mitigados adequadamente

**Recomendação:** Implementar limitação server-side no Appwrite via função custom ou políticas de segurança.

---

### 🟢 BAIXA #10: Input Type Number sem Validação Server-side

**Localização:** `cadastro.html:96`

```html
<input type="number" id="number" placeholder="123" min="1" max="99999">
```

**Problema:** Validação apenas via atributos HTML, bypassável via request direto.

**Impacto:** Dados inválidos no banco

**Recomendação:** Adicionar validação server-side nos endpoints de criação.

---

### 🟢 BAIXA #11: Variáveis de Ambiente Hardcoded nas Functions

**Localização:** `functions/emit-nfe/index.js:29-31`

```javascript
const PROVIDER  = process.env.NFE_PROVIDER  || "nfeio"
const API_KEY   = process.env.NFE_API_KEY   || ''
const COMPANY   = process.env.NFE_COMPANY_ID || ''
```

**Problema:** Fallback para strings vazias em produção (ausência de valor = string vazia, não undefined).

**Impacto:** Comportamento inconsistente em produção

**Recomendação:** Remover defaults e falhar explicitamente se variável ausente.

---

## Matriz de Riscos

| ID | Vulnerabilidade | Severidade | Probabilidade | Prioridade |
|----|------------------|------------|----------------|------------|
| #1 | Credenciais Expostas | 🔴 Crítica | Alta | P1 |
| #2 | XSS - Escape Incompleto | 🔴 Crítica | Alta | P1 |
| #3 | XSS - Dados sem Escape | 🟠 Alta | Média | P2 |
| #4 | Race Condition Cupons | 🟠 Alta | Média | P2 |
| #5 | Open Redirect | 🟠 Alta | Média | P2 |
| #6 | CPF Validation Bypass | 🟠 Alta | Alta | P2 |
| #7 | Rate Limiting Ausente | 🟡 Média | Média | P3 |
| #8 | Email Validation | 🟡 Média | Alta | P3 |
| #9 | Brute Force Client-only | 🟡 Média | Alta | P3 |
| #10 | Input Validation | 🟢 Baixa | Baixa | P4 |
| #11 | Env Vars Hardcoded | 🟢 Baixa | Baixa | P4 |

---

## Recomendações de Correção Prioritárias

### P1 (Imediato)
1. Corrigir função `esc()` para escapar backticks e colchetes
2. Revogar/changed IDs expostos no frontend (mudar PROJECT_ID)
3. Implementar proxy server-side para API Appwrite

### P2 (Esta Sprint)
4. Implementar escape consistente em todos os pontos de renderização
5. Corrigir race condition com locking ou operações atômicas
6. Validar URLs de redirect (same-origin only)
7. Normalizar CPF em comparações

### P3 (Próximas Sprints)
8. Implementar cache para APIs de IP
9. Adicionar validação server-side
10. Implementar rate limiting server-side

---

## Conclusão

O projeto apresenta boas práticas de segurança em várias áreas (autenticação via Appwrite, permissions granulares, sanitize de URLs). As vulnerabilidades críticas são o XSS por escape incompleto e a exposição de credenciais - ambas devem ser corrigidas imediatamente.

**Status geral:** ⚠️ Requer correções P1 antes de produção