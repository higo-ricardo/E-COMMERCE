# HIVERCAR AUTOPEÇAS — Sistema ERP + Loja Virtual

![CI](https://github.com/SEU_USUARIO/hivercar/actions/workflows/ci.yml/badge.svg)
![Coverage](https://img.shields.io/badge/coverage-≥70%25-26fd71)
![Sprint](https://img.shields.io/badge/sprint-04-f59e0b)
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

---

## Instalação e Testes

```bash
# Instalar dependências de desenvolvimento
npm install

# Rodar testes (147 testes, 7 arquivos)
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
├── .github/workflows/ci.yml     # CI/CD GitHub Actions
├── functions/
│   ├── send-order-email/        # E-mail de confirmação de pedido
│   ├── send-status-email/       # E-mail de atualização de status
│   ├── send-stock-alert/        # Alerta de estoque crítico (e-mail + WhatsApp)
│   ├── send-verification-email/ # Verificação de e-mail no cadastro
│   └── send-os-status/          # Notificação de OS para o cliente (WhatsApp + e-mail)
├── tests/                       # Testes unitários Vitest
│   ├── setup.js
│   ├── authService.test.js
│   ├── cartService.test.js
│   ├── orderService.test.js
│   ├── orderHistoryService.test.js
│   ├── productService.test.js
│   ├── stockService.test.js
│   └── userService.test.js
├── config.js                    # Fonte de verdade única (IDs, constantes)
├── appwriteClient.js            # Instância Appwrite compartilhada
├── utils.js                     # Utilitários + Sentry (US-47)
├── paymentService.js            # PIX + Frete (US-29, US-30)
├── authService.js               # Auth pura (login, logout, register)
├── userService.js               # Auth Mirror Pattern
├── productService.js            # Cache + listagem de produtos
├── productRepository.js         # Acesso ao banco — produtos
├── orderService.js              # Lógica de pedido
├── orderRepository.js           # Acesso ao banco — orders
├── orderHistoryService.js       # Audit log de status de pedido
├── stockService.js              # Gestão de estoque
├── cartService.js               # Carrinho (localStorage)
├── errorService.js              # Erros centralizados
├── adminService.js              # Métricas ERP
│
├── index.html                   # Landing page
├── loja.html                    # Catálogo de produtos
├── produto.html                 # Detalhe do produto
├── cart.html                    # Carrinho
├── checkout.html                # Checkout
├── login.html                   # Login
├── cadastro.html                # Cadastro
├── minha-conta.html             # Área do cliente
│
├── dashboard.html               # ERP — Dashboard admin
├── admin-produtos.html          # ERP — CRUD produtos
├── admin-estoque.html           # ERP — Gestão de estoque
├── admin-os.html                # ERP — Ordens de serviço
├── customers.html               # ERP — Gestão de clientes
└── painel-vendas.html           # ERP — Painel do vendedor
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

## Configuração de Produção

### 1. Sentry (US-47)

```js
// Em cada página, antes de qualquer lógica:
import { initSentry, addSentryContext } from "./utils.js"
initSentry("https://SEU_DSN@sentry.io/ID", "hivercar@3.0.0")

// Após login:
addSentryContext({ id: mirror.$id, email: mirror.email, role: mirror.role })
```

### 2. PIX — Mercado Pago (US-29)

Crie uma Appwrite Function `create-pix-payment` com o access_token do Mercado Pago.
O frontend nunca deve ter acesso ao token — ele fica apenas no servidor.

```bash
# Variáveis da Function:
MP_ACCESS_TOKEN = "APP_USR-..."
```

### 3. Frete — Melhor Envio (US-30)

Em `paymentService.js`, substitua `_calcFreteTabela` por chamada à API:
```
https://melhorenvio.com.br/integracao/
```

### 4. CI/CD (US-46)

Adicione os secrets no repositório (Settings → Secrets):
```
VERCEL_TOKEN
VERCEL_ORG_ID
VERCEL_PROJECT_ID
```

---

## Sprints

| Sprint | Tema | Pts | Status |
|---|---|---|---|
| Sprint 01 | Fundação (Loja + Design System) | 34 | ✅ |
| Sprint 02 | Vendas, Clientes, Segurança | 47 | ✅ |
| Sprint 03 | ERP Admin + Testes (147) | 39 | ✅ |
| Sprint 04 | Catálogo, PIX, Frete, Notificações | ~79 | ◎ |
| Sprint 05 | Módulo Fiscal (NF-e) | ~42 | ⊘ Bloqueada |

---

© 2026 HIVERCAR AUTOPEÇAS LTDA · Chapadinha, MA
