# HIVERCAR AUTOPEÇAS — Sistema ERP + Loja Virtual

![CI](https://github.com/SEU_USUARIO/hivercar/actions/workflows/ci.yml/badge.svg)
![Coverage](https://img.shields.io/badge/coverage-≥70%25-26fd71)
![Sprint](https://img.shields.io/badge/sprint-05-f59e0b)
![Appwrite](https://img.shields.io/badge/backend-Appwrite_v13-fd366e)

Sistema completo de ERP + Loja Virtual para autopeças — Chapadinha, MA.

---

## Stack

| Camada | Tecnologia |
|---|---|
| Backend | Appwrite v13 (Auth, Database, Storage, Functions) |
| Frontend | Vanilla JS ES Modules — sem bundler |
| Testes | Vitest + jsdom |
| CI/CD | GitHub Actions + Vercel |
| E-mail | Resend |
| WhatsApp | Z-API |
| Monitoramento | Sentry |
| Fiscal | TaxEngine (EC 132/2023) + NFe.io / Focus / Plugnotas |

---

## Instalação e Testes

```bash
# Instalar dependências de desenvolvimento
npm install

# Rodar testes (≥190 testes, 10 arquivos)
npm test

# Testes com watch
npm run test:watch

# Relatório de cobertura (threshold ≥70%)
npm run test:coverage

# Interface visual dos testes
npm run test:ui
```

---

## Estrutura

```
hivercar/
├── .github/workflows/ci.yml        # CI/CD GitHub Actions (US-46)
├── functions/
│   ├── emit-nfe/                   # Emissão NFC-e via integrador (US-43)
│   ├── send-order-email/           # E-mail de confirmação de pedido
│   ├── send-status-email/          # E-mail de atualização de status
│   ├── send-stock-alert/           # Alerta de estoque crítico (US-20)
│   ├── send-verification-email/    # Verificação de e-mail no cadastro (US-33)
│   └── send-os-status/             # Notificação OS (WhatsApp + e-mail, US-39)
├── tests/                          # Testes unitários Vitest
│   ├── setup.js
│   ├── authService.test.js
│   ├── cartService.test.js
│   ├── nfService.test.js           # US-43 — Sprint 05
│   ├── orderHistoryService.test.js
│   ├── orderService.test.js
│   ├── productService.test.js
│   ├── stockService.test.js
│   ├── taxEngine.test.js           # US-44 — Sprint 05
│   └── userService.test.js
│
├── config.js                       # Fonte de verdade única (IDs, constantes, FISCAL)
├── appwriteClient.js               # Instância Appwrite compartilhada
├── utils.js                        # Utilitários + Sentry (US-47)
├── paymentService.js               # PIX + Frete (US-29, US-30)
├── taxEngine.js                    # Motor Tributário NCM (US-44) — Sprint 05
├── nfService.js                    # Emissão/cancelamento NF-e (US-43) — Sprint 05
├── fiscalReportService.js          # Relatórios fiscais + SPED (US-45) — Sprint 05
├── authService.js                  # Auth pura (login, logout, register)
├── userService.js                  # Auth Mirror Pattern
├── productService.js               # Cache + listagem de produtos
├── productRepository.js            # Acesso ao banco — produtos
├── orderService.js                 # Lógica de pedido (integra TaxEngine)
├── orderRepository.js              # Acesso ao banco — orders
├── orderHistoryService.js          # Audit log de status de pedido
├── stockService.js                 # Gestão de estoque
├── cartService.js                  # Carrinho (localStorage)
├── errorService.js                 # Erros centralizados
├── adminService.js                 # Métricas ERP
│
├── index.html                      # Landing page
├── loja.html                       # Catálogo de produtos
├── produto.html                    # Detalhe do produto (US-02)
├── cart.html                       # Carrinho
├── checkout.html                   # Checkout (PIX + Frete dinâmico)
├── login.html                      # Login
├── cadastro.html                   # Cadastro
├── minha-conta.html                # Área do cliente
│
├── dashboard.html                  # ERP — Dashboard admin
├── admin-produtos.html             # ERP — CRUD produtos
├── admin-estoque.html              # ERP — Gestão de estoque + importação CSV
├── admin-os.html                   # ERP — Ordens de serviço
├── admin-fiscal.html               # ERP — Dashboard Fiscal (US-45) — Sprint 05
├── customers.html                  # ERP — Gestão de clientes
└── painel-vendas.html              # ERP — Painel do vendedor
```

---

## Auth Mirror Pattern

O sistema usa o **Auth Mirror Pattern** como lei arquitetural:

- **Appwrite Auth** → gerencia apenas credenciais e sessões
- **Collection `users`** → fonte de verdade para perfil, role, bloqueios e auditoria
- Nenhuma página lê dados de usuário diretamente do Auth após login

```
Cadastro:   ID.unique() → createMirror() → Auth.create() (rollback se falhar)
Login:      Auth.login() → getMirrorByEmail() → recordSuccessLogin()
Bloqueio:   5 tentativas → 30min | 10 → 1h | 15 → isActive=false
```

---

## Módulo Fiscal (Sprint 05)

> ⚠ **Requer desbloqueadores legais** antes de usar em produção.

O `taxEngine.js` substitui o `TAX_RATE` fixo de 12% por cálculo real baseado em:

- **NCM do produto** (capítulo 87 TIPI — peças automotivas)
- **UF do comprador** (ICMS interestadual)
- **Regime tributário** (Simples Nacional / Lucro Presumido)
- **EC 132/2023** — suporte a CBS e IBS (Reforma Tributária)

```js
import { TaxEngine } from "./taxEngine.js"

const resultado = TaxEngine.calculate({
  ncm:       "8708.30.90",
  preco:     150.00,
  qty:       2,
  ufDestino: "SP",
  isB2B:     false,
})
// resultado.total, resultado.discriminado, resultado.aliquotaEfetiva
```

Ver `SPRINT05_SETUP.md` para configuração completa da NF-e.

---

## Configuração de Produção

### Sentry (US-47)

```js
import { initSentry, addSentryContext } from "./utils.js"
initSentry("https://SEU_DSN@sentry.io/ID", "hivercar@3.0.0")
// Após login:
addSentryContext({ id: mirror.$id, email: mirror.email, role: mirror.role })
```

### PIX — Mercado Pago (US-29)

Crie a Appwrite Function `create-pix-payment` com o `MP_ACCESS_TOKEN` no servidor.

### Frete — Melhor Envio (US-30)

Em `paymentService.js`, substitua `_calcFreteTabela` pela API do Melhor Envio.

### CI/CD (US-46)

Secrets no repositório (Settings → Secrets):
```
VERCEL_TOKEN · VERCEL_ORG_ID · VERCEL_PROJECT_ID
```

### NF-e (US-43)

Ver `SPRINT05_SETUP.md` — requer certificado A1 e conta no integrador.

---

## Sprints

| Sprint | Tema | Pts | Status |
|---|---|---|---|
| Sprint 01 | Fundação (Loja + Design System) | 34 | ✅ Concluída |
| Sprint 02 | Vendas, Clientes, Segurança | 47 | ✅ Concluída |
| Sprint 03 | ERP Admin + Testes | 39 | ✅ Concluída |
| Sprint 04 | Catálogo, PIX, Frete, Notificações | 72 | ✅ Concluída |
| Sprint 05 | Módulo Fiscal (NF-e, TaxEngine) | 42 | ✅ Implementada ⚠ Aguarda desbloqueadores |

**Velocity acumulado:** 234 pts entregues (S01–S05)

---

© 2026 HIVERCAR AUTOPEÇAS LTDA · Chapadinha, MA
