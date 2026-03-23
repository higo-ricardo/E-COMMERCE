# SPRINT 03 — SETUP GUIDE
## US-19 · US-20 · US-21 · US-26

---

## STATUS DAS ENTREGAS

| US    | Tarefa                                         | Arquivo                                    | Status |
|-------|------------------------------------------------|--------------------------------------------|--------|
| US-19 | CRUD de produtos + paginação + busca           | admin-produtos.html                        | ✅     |
| US-19 | Formulário completo (nome, cat, marca, NCM…)   | admin-produtos.html                        | ✅     |
| US-19 | Upload de imagem → Appwrite Storage            | admin-produtos.html                        | ✅     |
| US-19 | Toggle ativo/inativo (soft delete)             | admin-produtos.html                        | ✅     |
| US-19 | Confirmação de exclusão definitiva             | admin-produtos.html                        | ✅     |
| US-19 | Invalidar cache após CRUD                      | admin-produtos.html                        | ✅     |
| US-20 | Formulário de reposição manual                 | admin-estoque.html                         | ✅     |
| US-20 | Listagem de movimentações por produto          | admin-estoque.html                         | ✅     |
| US-20 | Alerta visual estoque crítico < 5              | admin-estoque.html + dashboard.html        | ✅     |
| US-20 | Trigger e-mail+WhatsApp estoque < 3            | functions/send-stock-alert/index.js        | ✅     |
| US-21 | Vincular veículo (placa, modelo, ano)          | admin-os.html                              | ✅     |
| US-21 | Vincular peças → deduz estoque                 | admin-os.html                              | ✅     |
| US-21 | Exportar OS em PDF (window.print)              | admin-os.html                              | ✅     |
| US-21 | Histórico de status com data/hora/usuário      | admin-os.html + collection os_history      | ✅     |
| US-26 | Setup Vitest + jsdom + coverage                | package.json + vitest.config.js            | ✅     |
| US-26 | Testes userService                             | tests/userService.test.js (19 testes)      | ✅     |
| US-26 | Testes CartService                             | tests/cartService.test.js (24 testes)      | ✅     |
| US-26 | Testes OrderService (subtotal/taxes/total)     | tests/orderService.test.js (20 testes)     | ✅     |
| US-26 | Testes authService (mock Appwrite SDK)         | tests/authService.test.js (19 testes)      | ✅     |
| US-26 | Testes stockService                            | tests/stockService.test.js (20 testes)     | ✅     |
| US-26 | Testes productService (cache hit/miss/TTL)     | tests/productService.test.js (18 testes)   | ✅     |
| US-26 | Testes orderHistoryService (canTransition…)    | tests/orderHistoryService.test.js (28 tes) | ✅     |
| US-26 | Coverage ≥ 70% + script npm test               | vitest.config.js + package.json            | ✅     |

**Total: ~148 testes** em 7 arquivos.

---

## 1. Appwrite Storage — Bucket de Imagens (US-19)

Criar bucket no Appwrite Console → Storage:

| Campo         | Valor              |
|---------------|--------------------|
| Bucket ID     | `produtos_imgs`    |
| Max File Size | 5 MB               |
| Extensions    | jpg, jpeg, png, webp, avif |
| Permissions   | Read: any · Write: users |

---

## 2. Collection `produtos` — Atributos Novos (US-19)

| Atributo     | Tipo    | Required | Default |
|--------------|---------|----------|---------|
| `imageId`    | string  | false    | —       |
| `imageUrl`   | string  | false    | —       |
| `ncm`        | string  | false    | —       |
| `vehicles`   | string  | false    | —       |
| `isActive`   | boolean | false    | true    |
| `description`| string  | false    | —       |

**Index fulltext:** atributo `name` → tipo `Fulltext`

---

## 3. Collection `stock_history` (US-20 — já existe, confirmar)

| Atributo      | Tipo    | Required |
|---------------|---------|----------|
| `productId`   | string  | ✅       |
| `productName` | string  | ✅       |
| `qty`         | integer | ✅       |
| `type`        | string  | ✅       |
| `reference`   | string  | ✅       |
| `movedAt`     | string  | ✅       |
| `stockBefore` | integer | ✅       |
| `stockAfter`  | integer | ✅       |

---

## 4. Collection `service_orders` — Atributos Novos (US-21)

| Atributo      | Tipo    | Required |
|---------------|---------|----------|
| `clienteName` | string  | ✅       |
| `telefone`    | string  | false    |
| `placa`       | string  | ✅       |
| `modelo`      | string  | ✅       |
| `ano`         | integer | false    |
| `cor`         | string  | false    |
| `km`          | integer | false    |
| `tecnico`     | string  | ✅       |
| `descricao`   | string  | ✅       |
| `maoObra`     | float   | false    |
| `pecas`       | string  | false    |
| `status`      | string  | ✅       |

**Valores de status:** `aberta` · `em_andamento` · `aguardando_pecas` · `concluida` · `cancelada`

---

## 5. Collection `os_history` — NOVA (US-21 Task 4)

| Campo         | Valor        |
|---------------|--------------|
| Collection ID | `os_history` |

| Atributo        | Tipo   | Required |
|-----------------|--------|----------|
| `osId`          | string | ✅       |
| `statusAnterior`| string | false    |
| `statusNovo`    | string | ✅       |
| `changedBy`     | string | false    |
| `changedAt`     | string | ✅       |

**Index:** `osId` → tipo `Key`

---

## 6. Appwrite Function — send-stock-alert (US-20 Task 4)

Criar em Appwrite Console → Functions:

| Campo       | Valor                                  |
|-------------|----------------------------------------|
| Runtime     | Node.js 18                             |
| Entrypoint  | index.js                               |
| Build cmd   | npm install                            |
| Pasta       | functions/send-stock-alert/            |

**Trigger:**
```
databases.[DB_ID].collections.[produtos_COL_ID].documents.*.update
```

**Variáveis de ambiente:**

| Variável          | Descrição                          |
|-------------------|------------------------------------|
| `RESEND_API_KEY`  | Chave da API Resend                |
| `ALERT_EMAIL_TO`  | E-mail do responsável pelo estoque |
| `ALERT_EMAIL_FROM`| noreply@hivercar.com.br            |
| `WHATSAPP_NUMBER` | 5598981168787                      |
| `ZAPI_INSTANCE`   | ID da instância Z-API (opcional)   |
| `ZAPI_TOKEN`      | Token Z-API (opcional)             |
| `STOCK_THRESHOLD` | 3 (padrão)                         |

---

## 7. Rodar os Testes (US-26)

```bash
# Instalar dependências (uma vez)
npm install

# Rodar todos os testes
npm test

# Com relatório de cobertura (HTML em ./coverage/)
npm run test:coverage

# Modo watch (recarrega ao salvar)
npm run test:watch

# Interface visual no browser
npm run test:ui
```

### Estrutura final de testes

```
tests/
  setup.js                       # limpa localStorage antes de cada teste
  userService.test.js            # 19 testes: checkBlocked, recordFail, validatePass
  cartService.test.js            # 24 testes: add, remove, setQty, total, localStorage
  orderService.test.js           # 20 testes: subtotal, taxes, total, placeOrder
  authService.test.js            # 19 testes: mock Appwrite SDK completo
  stockService.test.js           # 20 testes: checkStock, deduct, revert, history
  productService.test.js         # 18 testes: cache hit/miss/TTL/invalidação
  orderHistoryService.test.js    # 28 testes: canTransition, changeStatus, timeline
```

**Total: ~148 testes | Threshold: ≥ 70% lines/functions/branches/statements**
