# Architecture

HIVECAR uses a **layered architecture** with object-oriented patterns for the admin panel and service-layer isolation for business logic.

## System Overview

```
┌─────────────────────────────────────────────────────────────┐
│                      Browser (Client)                        │
│  ┌───────────┐ ┌───────────┐ ┌───────────┐ ┌─────────────┐ │
│  │  HTML     │ │   CSS     │ │   JS      │ │   Tests     │ │
│  │  Pages    │ │  Styles   │ │  Modules  │ │   (Jest)    │ │
│  └───────────┘ └───────────┘ └───────────┘ └─────────────┘ │
└─────────────────────────┬───────────────────────────────────┘
                          │ HTTPS
                          ↓
┌─────────────────────────────────────────────────────────────┐
│                     Appwrite Cloud                           │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌────────────────┐ │
│  │Database  │ │ Storage  │ │   Auth   │ │  Functions     │ │
│  │(10 cols) │ │(1 bucket)│ │(sessions)│ │  (optional)    │ │
│  └──────────┘ └──────────┘ └──────────┘ └────────────────┘ │
└─────────────────────────────────────────────────────────────┘
```

## Layers

### 1. Presentation Layer (HTML + CSS)

Each page is a standalone HTML file with its own CSS imports.

| Page | Purpose | CSS Files |
|------|---------|-----------|
| `index.html` | Landing page | `loja.css`, `index.css` |
| `loja.html` | Product catalog | `loja.css` |
| `cart.html` | Shopping cart | `loja.css`, `cart.css` |
| `checkout.html` | Checkout flow | `loja.css`, `checkout.css` |
| `dashboard.html` | Admin overview | `loja.css`, `dashboard.css` |
| `admin-*.html` | Admin modules | `loja.css`, `dashboard.css` |

**Theme System:** The dark/light theme is controlled by the `light-mode` class on `<body>`, persisted in `localStorage`.

### 2. Controller Layer (AdminPage subclasses)

All admin pages extend the `AdminPage` base class from `js/admin-core.js`:

```
AdminPage (abstract)
├── DashboardPage       (dashboard.html)
├── PedidosPage         (admin-pedidos.html)
├── ProdutosPage        (admin-produtos.html)
├── EstoquePage         (admin-estoque.html)
├── OSPage              (admin-os.html)
├── FiscalPage          (admin-fiscal.html)
├── RelatoriosPage      (admin-relatorios.html)
├── CuponsPage          (admin-cupons.html)
├── PainelVendasPage    (painel-vendas.html)
└── CustomersPage       (customers.html)
```

The base class provides:
- **`setupAuth()`** — Authentication guard with redirect to login
- **`setupSidebar()`** — Mobile sidebar toggle
- **`setupLogout()`** — Session termination
- **`initTheme()`** — Dark/light theme toggle
- **`toast(msg, type)`** — Accessible notifications
- **`setLoading(btn, loading)`** — Button loading states
- **`renderTable(tbody, items, rowFn)`** — Generic table rendering
- **`exportCSV(data, filename)`** — CSV file export
- **`destroy()`** — Cleanup to prevent memory leaks

**Initialization pattern:**

```javascript
class MyPage extends AdminPage {
  onInit() {
    this.bindEvents();
    this.loadData();
  }
}

const page = new MyPage();
page.init();
```

### 3. Service Layer

Services encapsulate business logic and are completely UI-independent.

| Service | Responsibility | State |
|---------|---------------|-------|
| `CartService` | Cart operations (localStorage) | None |
| `ProductService` | Product listing with cache | In-memory Map |
| `CouponService` | Coupon validation & application | None |
| `SKUService` | SKU generation & validation | None |
| `AdminService` | Admin dashboard metrics | None |
| `ReportsService` | Report generation | None |
| `FiscalReportService` | Tax reports & SPED | None |

### 4. Repository Layer

`js/repositories.js` provides the data access layer for Appwrite:

```javascript
// Example: ProductRepository
export const ProductRepository = {
  async list(page, filters) { /* ... */ },
  async search(term, page, filters) { /* ... */ },
  async create(data) { /* ... */ },
  async update(id, data) { /* ... */ },
  async delete(id) { /* ... */ },
};
```

### 5. Data Access (Appwrite SDK)

The `AppwriteClient` singleton in `admin-core.js` provides a single point of access:

```javascript
class AppwriteClient {
  static #instance;
  client;
  databases;
  account;

  static getInstance() {
    return new AppwriteClient();
  }
}
```

Pages access it through `this.app`:

```javascript
class MyPage extends AdminPage {
  async loadData() {
    const result = await this.app.databases.listDocuments(
      CONFIG.DB,
      CONFIG.COL.PRODUCTS,
      [Query.limit(100)]
    );
  }
}
```

## Design Patterns

| Pattern | Where Used |
|---------|-----------|
| **Singleton** | `AppwriteClient` — single database connection |
| **Template Method** | `AdminPage.init()` calls abstract `onInit()` |
| **Service Layer** | All `*Service.js` files |
| **Repository** | `repositories.js` |
| **Factory** | Implicit — each page instantiates its own controller |
| **Strategy** | Theme toggle (dark/light strategies) |

## Key Decisions

### Why not consolidate admin pages?

The 10 admin pages total ~4,200 lines. Consolidating would create a single ~3,300-line file with:
- Higher risk of merge conflicts
- Increased memory footprint (all modules loaded at once)
- Harder testing and debugging

**Decision:** Keep separate pages, share code through `AdminPage` inheritance.

### Why localStorage for cart?

- Zero server round-trips for cart operations
- Survives page refresh
- No auth required for guest checkout
- Simple key-value API (get/set/remove)

### Why Jest over Vitest?

- Better ESM module resolution with `moduleNameMapper`
- More mature ecosystem and CI integrations
- `jest.mock()` works reliably with CDN imports via mocks

## Security Model

| Concern | Solution |
|---------|----------|
| **Authentication** | Appwrite session tokens, auto-redirect on expiry |
| **Authorization** | Role-based access via Appwrite user prefs |
| **XSS Prevention** | `esc()` function escapes all user input before rendering |
| **CORS** | Appwrite handles CORS configuration |
| **CSRF** | Appwrite session tokens include CSRF protection |
