# HIVECAR AUTOPEÇAS

An e-commerce platform for automotive parts with a complete admin panel. Built with vanilla JavaScript and Appwrite as the backend.

## Quick Start

### Prerequisites

- Node.js 18+ (for running tests)
- An [Appwrite](https://appwrite.io) cloud account

### Installation

```bash
git clone https://github.com/your-org/hivercar.git
cd hivercar
npm install
```

### Running

Open `index.html` in your browser — no build step required.

### Running Tests

```bash
npm test              # Run all tests
npm test -- --coverage # With coverage report
```

**127 tests, 125 passed, 2 failed.**

## Features

| Area | Capabilities |
|------|-------------|
| **Storefront** | Product catalog, search & filters, cart, checkout, order tracking, warranty & shipping info |
| **Admin Panel** | Products (CRUD, image upload, SKU), stock management, order dashboard, service orders (OS), fiscal/invoicing, reports, coupons, customer management |
| **Theme System** | Dark/light mode with localStorage persistence, FOUC prevention |
| **Accessibility** | ARIA labels, keyboard navigation, semantic HTML, screen reader support |
| **Testing** | 127 Jest unit tests across 6 suites |
| **Architecture** | OOP with inheritance (`AdminPage` base class), service layer isolation, singleton pattern |

## Multiagent Scrum System

This project includes a Kilo-based multiagent system that simulates a complete Scrum development process. See [docs/SCRUM-MULTIAGENT.md](docs/SCRUM-MULTIAGENT.md) for details on the orchestrator and specialized agents.

## Project Structure

```
├── index.html              # Landing page
├── loja.html               # Product catalog
├── cart.html               # Shopping cart
├── checkout.html           # Checkout flow
├── login.html / cadastro.html  # Auth pages
├── minha-conta.html        # User account
│
├── dashboard.html          # Admin dashboard
├── admin-produtos.html     # Product management
├── admin-estoque.html      # Stock management
├── admin-pedidos.html      # Order dashboard
├── admin-os.html           # Service orders
├── admin-fiscal.html       # Tax & invoicing
├── admin-relatorios.html   # Reports
├── admin-cupons.html       # Coupon management
├── painel-vendas.html      # Sales panel
├── customers.html          # Customer management
│
├── js/
│   ├── admin-core.js       # OOP base class + helpers (AdminPage)
│   ├── config.js           # Centralized configuration
│   ├── utils.js            # Shared utilities (masks, formatting, particles)
│   ├── cartService.js      # Cart logic (localStorage)
│   ├── productService.js   # Product listing + cache
│   ├── couponService.js    # Coupon validation
│   ├── skuService.js       # SKU generation
│   └── ...                 # Other services
│
├── css/
│   ├── loja.css            # Base styles + theme system
│   ├── index.css           # Landing page styles
│   └── ...                 # Page-specific styles
│
├── tests/                  # Jest unit tests (6 suites, 127 tests)
└── docs/                   # Architecture documentation
```

## Architecture

### Layered Design

```
Presentation (HTML + CSS)
    ↓
Controllers (AdminPage subclasses — 10 pages)
    ↓
Services (cartService, productService, etc.)
    ↓
Repositories (Appwrite API)
    ↓
Appwrite Cloud (Database, Storage, Auth)
```

### OOP Pattern

All admin pages extend `AdminPage` from `js/admin-core.js`:

```javascript
import { AdminPage } from './js/admin-core.js';

class PedidosPage extends AdminPage {
  onInit() {
    this.bindEvents();
    this.loadOrders();
  }
}

const page = new PedidosPage();
page.init();
```

The base class automatically handles:
- **Authentication** — Redirects to login if not authenticated
- **Sidebar** — Mobile toggle navigation
- **Theme** — Dark/light toggle with persistence
- **Toast** — Accessible notifications
- **Tables** — Generic rendering with empty state
- **Loading** — Button spinner states during async ops
- **CSV Export** — File download helper

### Design Patterns

| Pattern | Where |
|---------|-------|
| **Singleton** | `AppwriteClient` — single DB connection |
| **Template Method** | `AdminPage.init()` calls abstract `onInit()` |
| **Service Layer** | All `*Service.js` files |
| **Repository** | `repositories.js` for data access |

## Services Reference

### CartService (`js/cartService.js`)

Cart operations using `localStorage`. No server calls.

```javascript
CartService.add({ $id: 'p1', name: 'Brake Pad', price: 89.90 });
CartService.count();           // 1
CartService.total();           // 89.90
CartService.setCoupon({ code: 'SAVE10', discount: 10 });
CartService.totalWithDiscount(); // 79.90
```

### ProductService (`js/productService.js`)

Product listing with in-memory cache (5 min TTL).

```javascript
const result = await ProductService.search('brake', 1, { brand: 'Bosch' });
// result: { products: [...], total: 5, pages: 1 }
ProductService.invalidateCache(); // Clear after CRUD
```

### CouponService (`js/couponService.js`)

Coupon validation and application with Appwrite integration.

```javascript
const result = await CouponService.apply('SAVE10', { subtotal: 200, cpf: '12345678901' });
if (result.ok) {
  console.log(result.discount); // 20 (10% of 200)
}
```

### SKUService (`js/skuService.js`)

Generates SKU codes in format `[BRAND][PRODUCT][MOTOR][SERIAL]`.

```javascript
SKUService.generate(
  { name: 'Gol', brand: 'Volkswagen' },
  { motor: '1.6' },
  1
); // → "VWGOL16001"
```

### Utils (`js/utils.js`)

Shared utilities available across all pages.

| Function | Purpose | Example |
|----------|---------|---------|
| `maskCPF(value)` | CPF formatting | `'12345678901'` → `'123.456.789-01'` |
| `maskCelular(value)` | Phone formatting | `'98981168787'` → `'(98) 98116-8787'` |
| `maskCEP(value)` | CEP formatting | `'65500000'` → `'65500-000'` |
| `formatBRL(value)` | Currency formatting | `1234.56` → `'R$ 1.234,56'` |
| `escapeHTML(str)` | XSS prevention | `'<script>'` → `'&lt;script&gt;'` |
| `initParticles()` | Canvas animation | Background particle effect |
| `initThemeToggle()` | Theme toggle | Dark/light mode switch |

See [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md) for full architectural details.

## Configuration

### Appwrite Setup

Edit `js/config.js` with your credentials:

```javascript
export const CONFIG = {
  ENDPOINT: "https://your-endpoint.appwrite.io/v1",
  PROJECT_ID: "your-project-id",
  DB: "your-database-id",
  COL: {
    PRODUCTS: "products",
    USERS: "users",
    ORDERS: "orders",
    // ... other collections
  },
};
```

### Collections Required

| Collection | Purpose | Key Fields |
|-----------|---------|------------|
| `products` | Product catalog | name, price, qtd, sku, brand, category, imageURL |
| `users` | User profiles | name, email, role, cpf, mobile, address |
| `orders` | Customer orders | user, total, status, payment, items |
| `stock_history` | Stock movements | productId, qty, type, movedAt |
| `service_orders` | Service orders (OS) | clienteName, placa, status, pecas |
| `coupons` | Discount coupons | code, type, value, isActive, expirationDate |

## Testing

```bash
npm test              # Run all 127 tests
npm test -- --watch   # Watch mode
npx jest --coverage   # Coverage report
```

| Test Suite | Tests | Covers |
|-----------|-------|--------|
| `utils.test.js` | 25 | Masks, formatting, HTML escaping |
| `cartService.test.js` | 16 | Add, remove, coupons, clear |
| `skuService.test.js` | 24 | Generation, validation, decoding |
| `couponService.test.js` | 23 | Create, validate, apply, limits |
| `productService.test.js` | 16 | List, search, cache, CRUD |
| `adminCore.test.js` | 23 | Helpers, status badges, rendering |

## Troubleshooting

### Tests fail with "Cannot find module"

```bash
npm install --save-dev jest-environment-jsdom
npx jest --clearCache
```

### Appwrite connection errors

1. Verify `ENDPOINT` and `PROJECT_ID` in `js/config.js`
2. Ensure collections exist in your Appwrite project
3. Check permissions are set for `role:users`

### Theme not persisting

Theme is stored in `localStorage`. Reset with:
```javascript
localStorage.removeItem('hivercar-theme');
```

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | HTML5, CSS3, JavaScript (ES6+) |
| Backend | Appwrite (BaaS) |
| Testing | Jest + jsdom |
| Fonts | Bebas Neue, Barlow |
| Icons | Font Awesome |

## License

MIT
