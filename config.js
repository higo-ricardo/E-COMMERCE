// ─── HIVERCAR · config.js ────────────────────────────────────────────────────
// Fonte de verdade única. Todos os módulos importam daqui.
//
// Sprint 02–04 — alterações:
//   US-09: + COL.ORDER_HISTORY   ("order_history")
//   US-20: + COL.STOCK_HISTORY   ("stock_history")
//   US-21: + COL.OS_HISTORY       ("os_history")
//   US-36: + STOCK_MIN_DEFAULT, + STORE.SEARCH_FULLTEXT_FIELDS

export const CONFIG = {
  ENDPOINT:   "https://nyc.cloud.appwrite.io/v1",
  PROJECT_ID: "69a0c93200084defefe1",
  DB:         "69a0ebc70034fa76feff",

  COL: {
    PRODUCTS:       "produtos",
    ORDERS:         "orders",
    CUSTOMERS:      "customers",
    SERVICE_ORDERS: "service_orders",
    PROFILES:       "profiles",
    CATEGORIES:     "categories",
    USERS:          "users",           // ← Mirror collection (Auth Mirror Pattern)
    ORDER_HISTORY:  "order_history",   // ← US-09: audit log de status de pedidos
    STOCK_HISTORY:  "stock_history",   // ← US-20: movimentações de estoque
    OS_HISTORY:     "os_history",      // ← US-21: histórico de status das OS
  },

  STORE: {
    PAGE_SIZE: 15,
    CACHE_TTL: 5 * 60 * 1000,
    CART_KEY:  "hiverCart",
  },

  TAX_RATE: 0.12,

  WHATSAPP: "5598981168787",

  // ── Estoque ───────────────────────────────────────────────────────────────
  // US-36: valor padrão de stockMin quando o produto não tem um definido
  STOCK_MIN_DEFAULT: 5,
  STOCK_CRITICAL:    3,   // dispara o alerta de função (send-stock-alert)

  // ── Busca full-text ───────────────────────────────────────────────────────
  // US-28: campos indexados no Appwrite para busca
  SEARCH_FIELDS: ["name", "vehicles", "ncm"],

  // ── Limites de bloqueio de login ─────────────────────────────────────────
  AUTH: {
    BLOCK_5:    30 * 60 * 1000,  //  5 tentativas → 30 min
    BLOCK_10:   60 * 60 * 1000,  // 10 tentativas → 1 hora
    DISABLE_AT: 15,              // 15 tentativas → isActive = false
    UI_LOCK_MS: 15 * 60 * 1000, // lock do botão na UI (15 min)
  },

  // ── Regras de transição de status de pedido ──────────────────────────────
  // US-09: Transições inválidas são bloqueadas no OrderHistoryService.
  ORDER_STATUS_FLOW: {
    novo:        ["confirmado", "cancelado"],
    confirmado:  ["em_preparo", "cancelado"],
    em_preparo:  ["enviado"],
    enviado:     ["entregue"],
    entregue:    [],   // estado terminal — nenhuma transição permitida
    cancelado:   [],   // estado terminal
  },
}
