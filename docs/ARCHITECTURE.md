# Architecture — HIVECAR v3

## System Overview

```
┌─────────────────────────────────────────────────────────────┐
│                      Browser (Client)                        │
│  ┌──────────┐ ┌──────────┐ ┌────────── ┌────────────    │
│  │  HTML    │ │   CSS    │ │   JS     │ │  Tests     │    │
│  │  Pages   │ │  Styles  │ │  Modules │ │  (Jest)    │    │
│  └──────────┘ └──────────┘ └──────────┘ └────────────    │
└─────────────────────────┬───────────────────────────────────┘
                          │ HTTPS
                          ↓
┌─────────────────────────────────────────────────────────────┐
│                     Appwrite Cloud                           │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────────┐  │
│  │ Database │ │ Storage  │ │   Auth   │ │  Functions   │  │
│  │ 10 cols  │ │ 1 bucket │ │ sessions │ │  (optional)  │  │
│  └────────── └──────────┘ ──────────┘ └──────────────┘  │
└─────────────────────────────────────────────────────────────┘
```

## Project Structure

```
HIVECAR/
├── controllers/              # MVC controllers (auto-architected)
│   ├── home/                 # Landing page controller
│   │   └── HomeController.js
│   ├── store/                # Store/catalog controller
│   │   └── StoreController.js
│   └── checkout/             # Checkout flow controller
│       └── CheckoutController.js
├── js/                       # Core services & utilities
│   ├── admin-core.js         # AdminPage base class + Appwrite singleton
│   ├── authService.js        # Auth operations (login, logout, register)
│   ├── userService.js        # Auth Mirror Pattern (users collection)
│   ├── cartService.js        # Cart operations (localStorage)
│   ├── couponService.js      # Coupon validation & application
│   ├── errorService.js       # Centralized error handling + Sentry
│   ├── repositories.js       # Data access layer (Appwrite CRUD)
│   ├── config.js             # Central configuration
│   ├── db.js                 # Appwrite SDK initialization
│   ├── utils.js              # Shared utilities (esc, fmt, masks, etc.)
│   ├── loja.js               # Store page logic
│   ├── login.js              # Login page logic
│   ├── cadastro.js           # Registration page logic
│   └── minha-conta.js        # User account page logic
├── tests/                    # Jest test suite
│   ├── setup.js              # Test configuration
│   ├── __mocks__/            # Appwrite mocks
│   └── *.test.js
├── functions/                # Appwrite Cloud Functions (optional)
│   ├── emit-nfe/
│   ├── send-os-status/
│   ├── send-stock-alert/
│   └── send-verification-email/
├── css/                      # Stylesheets
│   ├── loja.css              # Store front styles
│   ├── design-system.css     # Design tokens + DS components
│   ├── checkout.css          # Checkout-specific styles
│   ├── admin-*.css           # Admin panel styles
│   └── cadastro.css          # Registration form styles
├── *.html                    # Page files (17 pages)
├── babel.config.js           # Babel configuration
├── jest.config.js            # Jest configuration
└── docs/
    ├── ARCHITECTURE.md       # This file
    └── SCRUM-MULTIAGENT.md   # Development methodology
```

## Layers

### 1. Presentation Layer (HTML + CSS)

Each page is a standalone HTML file with module script imports.

| Page | Purpose | CSS |
|------|---------|-----|
| `index.html` | Landing page | `loja.css`, `design-system.css` |
| `loja.html` | Product catalog | `loja.css`, `design-system.css` |
| `cart.html` | Shopping cart | `loja.css`, `cart.css` |
| `checkout.html` | 3-step checkout | `loja.css`, `design-system.css`, `checkout.css` |
| `produto.html` | Product detail | `loja.css` |
| `dashboard.html` | Admin overview | `loja.css`, `design-system.css` |
| `admin-produtos.html` | Product management | `loja.css`, `design-system.css`, `admin-produtos.css` |
| `admin-pedidos.html` | Order management | `loja.css`, `design-system.css`, `painel-vendas.css` |
| `admin-estoque.html` | Stock management | `loja.css`, `design-system.css`, `admin-estoque.css` |
| `admin-os.html` | Service orders | `loja.css`, `design-system.css`, `admin-os.css` |
| `admin-fiscal.html` | Tax reports | `loja.css`, `design-system.css`, `admin-fiscal.css` |
| `admin-relatorios.html` | Reports | `loja.css`, `design-system.css`, `reports.css` |
| `admin-cupons.html` | Coupon management | `loja.css`, `design-system.css`, `dashboard-cupons.css` |
| `customers.html` | Customer management | `loja.css`, `design-system.css`, `customers.css` |
| `painel-vendas.html` | Sales panel | `loja.css`, `design-system.css`, `painel-vendas.css` |
| `minha-conta.html` | User account | `loja.css` |
| `login.html` / `cadastro.html` | Auth pages | `loja.css`, `cadastro.css` |

**Theme System:** Dark/light theme via `light-mode` class on `<body>`, persisted in `localStorage`. Anti-FOUC via inline script in `<head>`.

### 2. Controller Layer

**Admin Controllers:** All admin pages extend `AdminPage` from `js/admin-core.js`:

```
AdminPage (abstract base)
├── DashboardPage          (dashboard.html)
├── PedidosPage            (admin-pedidos.html)
├── ProdutosPage           (admin-produtos.html)
├── EstoquePage            (admin-estoque.html)
├── OSPage                 (admin-os.html)
├── FiscalPage             (admin-fiscal.html)
├── RelatoriosPage         (admin-relatorios.html)
├── CuponsPage             (admin-cupons.html)
├── PainelVendasPage       (painel-vendas.html)
└── CustomersPage          (customers.html)
```

`AdminPage` provides: auth guard, sidebar toggle, logout, theme toggle, toast notifications, button loading states, CSV export, cleanup lifecycle.

**Storefront Controllers** (auto-architected ES modules):

| Controller | File | Purpose |
|-----------|------|---------|
| `HomeController` | `controllers/home/HomeController.js` | Landing page product grid |
| `StoreController` | `controllers/store/StoreController.js` | Store catalog with filters |
| `CheckoutController` | `controllers/checkout/CheckoutController.js` | 3-step checkout flow |

Each controller follows: `init() → setupDOM() → bindEvents() → load/render`.

### 3. Service Layer

Services encapsulate business logic, completely UI-independent.

| Service | Responsibility | State |
|---------|---------------|-------|
| `CartService` | Cart CRUD, totals, discount (localStorage) | localStorage |
| `CouponService` | Coupon validation, application, counters | None |
| `SKUService` | SKU generation & uniqueness validation | None |
| `AdminService` | Admin dashboard metrics | None |
| `ReportsService` | Report generation | None |
| `FiscalReportService` | Tax reports & SPED exports | None |
| `OrderHistoryService` | Order status change history | None |
| `DocNumService` | Unique document number generation | None |

### 4. Repository Layer

`js/repositories.js` — unified data access for Appwrite:

| Repository | Methods |
|-----------|---------|
| `OrderRepository` | `create`, `getById`, `list`, `update`, `delete` |
| `ProductRepository` | `create`, `getById`, `list`, `search`, `getFilterOptions`, `searchByBarcode`, `getCriticalStock`, `softDelete`, `restore`, `update`, `delete` |
| `CouponRepository` | `create`, `findByCode`, `update`, `incrementUsage`, `listActive`, `list` |
| `CouponUsageRepository` | `create`, `findByCodeAndCpf`, `increment` |

### 5. Data Access (Appwrite SDK)

`js/db.js` — Appwrite SDK initialization (Client, Databases, Account, Storage, Query, ID, Permission, Role).

**Auth Mirror Pattern:** User data lives in `users` collection (mirror), never read directly from Auth after login.

| Flow | Steps |
|------|-------|
| **Registration** | Validate → `createMirror()` → `AuthService.register()` |
| **Login** | `AuthService.login()` → `getMirrorByEmail()` → `checkBlocked()` → `recordSuccessLogin()` |
| **Profile** | Always read from `users` collection via `getMirrorByEmail()` |

### 6. Error Handling

`js/errorService.js` — centralized error handling:

- **Toast system:** Auto-injects container, supports error/warning/info/network levels
- **Field errors:** Inline red border + message below input, cleared on type
- **HTTP mapping:** 401→redirect login, 403→permission denied, 404→not found, 5xx→critical
- **Sentry integration:** Optional production monitoring via CDN

## Appwrite Database Schema

| Collection | Purpose | Key Fields |
|-----------|---------|------------|
| `products` | Product catalog | name, price, costPrice, stock, minStock, sku, ncm, barcode, brand, category, imageURL, isActive, deletedAt |
| `orders` | Customer orders | number, user, email, mobile, address, items (JSON), subtotal, taxes, frete, discountAmount, total, payment, status, modalFrete, couponCode |
| `users` | Auth mirror | name, email, cpf, mobile, role, isActive, isVerified, lastLogin, loginCounter, lastIP, address, cep, failedLogin, blockedUntil |
| `order_history` | Order status changes | orderId, oldStatus, newStatus, changedBy, changedAt, note |
| `coupons` | Discount coupons | code, type, value, minOrderValue, maxDiscount, expirationDate, usageLimit, cpfLimit, cpf, isActive, timesUsed |
| `coupon_usage` | Coupon usage tracking | code, cpf, uses, lastUsedAt, createdAt |
| `stock_history` | Stock movement log | productId, oldStock, newStock, reason, changedBy, changedAt |
| `service_orders` | Service orders | clienteName, placa, modelo, tecnico, descricao, status, maoObra, pecas |
| `nfe_documents` | NF-e records | (fiscal documents) |
| `categories` | Product categories | name, description |

## Design Patterns

| Pattern | Where Used |
|---------|-----------|
| **Singleton** | `db.js` (Appwrite client), `AdminPage.app` getter |
| **Template Method** | `AdminPage.init()` calls `onInit()` |
| **Service Layer** | All `*Service.js` files |
| **Repository** | `repositories.js` — single source of truth for DB access |
| **Auth Mirror** | `userService.js` — decouples Auth from user data |
| **Factory** | Each page instantiates its own controller |
| **Strategy** | Theme toggle (dark/light), Payment methods |

## Security Model

| Concern | Solution |
|---------|----------|
| **Authentication** | Appwrite session tokens, `authGuard.js` redirects on expiry |
| **Authorization** | Role-based: `ADMIN`, `SELLER`, `USERS` via user prefs |
| **XSS Prevention** | `esc()` escapes all user input before rendering |
| **CSRF** | Appwrite session tokens include CSRF protection |
| **CORS** | Appwrite handles CORS configuration |
| **Brute Force** | Progressive blocking: 5 attempts→30min, 10→1h, 15→permanent |
| **Coupon Abuse** | Global `usageLimit` + per-CPF `cpfLimit` (blocking), CPF-restricted coupons |
| **Sensitive Data** | CPF stored in `coupon_usage` (admin-only read), password hash never exposed |

## Configuration

`js/config.js` — single source of truth:

```javascript
CONFIG = {
  ENDPOINT: "https://tor.cloud.appwrite.io/v1",
  PROJECT_ID: "...",
  DB: "...",
  BUCKET_ID: "...",
  COL: { PRODUCTS, USERS, ORDERS, ORDER_HISTORY, NFE, STOCK_HISTORY, SERVICE_ORDERS, COUPONS, COUPON_USAGE },
  STORE: { PAGE_SIZE: 15, CACHE_TTL: 5min, CART_KEY: "hiverCart" },
  AUTH: { BLOCK_5: 30min, BLOCK_10: 1h, DISABLE_AT: 15, UI_LOCK_MS: 15min },
  FISCAL: { AMBIENTE, REGIME, UF_ORIGEM, CNPJ, RAZAO_SOCIAL, SERIE_NFE },
  COUPON: { MAX_DISCOUNT_PERCENT: 0.5 },
  ORDER_STATUS_FLOW: { novo→[confirmado,cancelado], confirmado→[em_preparo,cancelado], ... }
}
```

## Testing

Jest + Babel for ESM support.

```bash
npm test              # Run all tests
npm test -- --watch   # Watch mode
npm run coverage      # Coverage report
```

Test files mirror source structure: `tests/cartService.test.js`, `tests/couponService.test.js`, etc.

Appwrite SDK mocked via `tests/__mocks__/appwrite.js`.

## Key Decisions

### Why separate controllers instead of inline HTML scripts?
- Testable business logic (no DOM dependency)
- Reusable across pages
- Clear separation of concerns
- Easier to mock in tests

### Why localStorage for cart?
- Zero server round-trips
- Survives page refresh
- Guest checkout support (no auth required)
- Simple key-value API

### Why Auth Mirror Pattern?
- Appwrite Auth doesn't support custom fields
- Mirror collection allows: role, CPF, address, login tracking, block management
- Single source of truth for user data across the app

### Why unified `repositories.js`?
- Was 4 separate files (order, product, coupon, couponUsage repositories)
- Consolidated for maintainability
- Same interface preserved — zero breaking changes
