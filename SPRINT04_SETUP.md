# SPRINT 04 — SETUP APPWRITE E INTEGRAÇÕES

Guia de configuração para colocar todas as US da Sprint 04 em funcionamento.

---

## 1. Appwrite Functions — novas functions

### `send-os-status` (US-39)

```
Runtime: Node.js 18
Entrypoint: index.js
Trigger: databases.[DB_ID].collections.os_history.documents.*.create
```

**Variáveis de ambiente:**
```
ZAPI_INSTANCE        → ID da instância Z-API
ZAPI_TOKEN           → Token Z-API
RESEND_API_KEY       → Chave Resend
EMAIL_FROM           → HIVERCAR AUTOPEÇAS <noreply@hivercar.com.br>
DB_ID                → 69a0ebc70034fa76feff
APPWRITE_API_KEY     → Server key (Settings → API Keys → criar com scope databases.read)
```

**Permissões da Function:**
- Adicionar a Server API Key com escopo: `databases.read`, `databases.documents.read`

---

## 2. Coleção `os_history` — verificar atributos

A coleção `os_history` precisa ter:

| Atributo      | Tipo    | Obrigatório |
|---------------|---------|-------------|
| osId          | String  | ✅ |
| statusAnterior| String  | ✅ |
| statusNovo    | String  | ✅ |
| changedBy     | String  | ✅ |
| changedAt     | String  | ✅ |
| note          | String  | ❌ |

**Índice necessário:**
- Atributo: `osId` — Tipo: Key

---

## 3. Coleção `service_orders` — adicionar campo `email`

Para a function `send-os-status` enviar e-mail ao cliente, a OS precisa do campo:

| Atributo | Tipo   | Obrigatório |
|----------|--------|-------------|
| email    | String | ❌ (opcional) |

Editar a collection no Appwrite Console e adicionar o atributo `email` (String, max 256).

Editar o formulário em `admin-os.html` para incluir campo de e-mail do cliente.

---

## 4. PIX — Mercado Pago (US-29)

### Passo a passo para produção:

1. Crie uma conta em https://mercadopago.com.br/developers
2. Crie um aplicativo e obtenha o **Access Token de produção**
3. Crie uma Appwrite Function chamada `create-pix-payment`:

```js
// functions/create-pix-payment/index.js
export default async ({ req, res }) => {
  const { total, orderId, email, description } = req.body
  
  const response = await fetch("https://api.mercadopago.com/v1/payments", {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${process.env.MP_ACCESS_TOKEN}`,
      "Content-Type": "application/json",
      "X-Idempotency-Key": orderId,
    },
    body: JSON.stringify({
      transaction_amount: total,
      description: description || `Pedido HIVERCAR #${orderId}`,
      payment_method_id: "pix",
      payer: { email },
    }),
  })
  
  const data = await response.json()
  return res.json(data)
}
```

4. Adicione a variável `MP_ACCESS_TOKEN` na Function
5. No `paymentService.js`, defina:
   ```js
   window.HIVERCAR_MP_ACCESS_TOKEN = "APP_USR-..." // qualquer valor não-mock
   ```
   e atualize `CONFIG.FUNCTIONS.CREATE_PIX` com o ID da function.

---

## 5. Frete Real — Melhor Envio (US-30)

Para substituir a tabela simulada por cálculo real:

1. Crie conta em https://melhorenvio.com.br
2. Gere um token OAuth
3. No `paymentService.js`, substitua `_calcFreteTabela` por:

```js
async function _calcFreteRealMelhorEnvio(cepOrigem, cepDestino, pesoKg, valorDeclarado) {
  const resp = await fetch("https://www.melhorenvio.com.br/api/v2/me/shipment/calculate", {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${window.MELHOR_ENVIO_TOKEN}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from: { postal_code: cepOrigem },
      to:   { postal_code: cepDestino },
      package: { weight: pesoKg, width: 20, height: 15, length: 30 },
      options: { receipt: false, own_hand: false, insurance_value: valorDeclarado },
      services: "1,2",  // SEDEX=1, PAC=2
    }),
  })
  const services = await resp.json()
  return services.map(s => ({
    id: s.id, tipo: s.name.toLowerCase(), nome: s.name,
    valor: s.price, prazo: s.delivery_time, descricao: s.company.name,
  }))
}
```

---

## 6. GitHub Actions — secrets necessários

No repositório: **Settings → Secrets and variables → Actions → New repository secret**

```
VERCEL_TOKEN        → Obtenha em https://vercel.com/account/tokens
VERCEL_ORG_ID       → Em .vercel/project.json após "vercel link"
VERCEL_PROJECT_ID   → Em .vercel/project.json após "vercel link"
```

**Setup inicial:**
```bash
npm i -g vercel
vercel login
vercel link  # vincula o repositório ao projeto Vercel
cat .vercel/project.json  # anote orgId e projectId
```

---

## 7. Sentry — US-47

1. Crie projeto em https://sentry.io (tipo: JavaScript)
2. Copie o DSN
3. Adicione ao topo de cada página principal:

```html
<script type="module">
import { initSentry } from "./utils.js"
initSentry("https://SEU_DSN@sentry.io/ID", "hivercar@3.0.0")
</script>
```

4. Após login do usuário:
```js
import { addSentryContext } from "./utils.js"
addSentryContext({ id: mirror.$id, email: mirror.email, role: mirror.role })
```

5. No logout:
```js
import { clearSentryContext } from "./utils.js"
clearSentryContext()
```

---

**Sprint 04 — checklist final:**

- [ ] Function `send-os-status` criada e configurada no Appwrite
- [ ] Campo `email` adicionado à collection `service_orders`
- [ ] Function `create-pix-payment` criada (opcional — mock funciona sem ela)
- [ ] Secrets do Vercel adicionados ao GitHub
- [ ] DSN do Sentry configurado nas páginas principais
- [ ] `npm test` passando (147 testes, cobertura ≥70%)
