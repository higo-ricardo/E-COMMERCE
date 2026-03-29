// ─── HIVERCAR · config.js ────────────────────────────────────────────────────
// Configuração centralizada do sistema - ÚNICA FONTE DE VERDADE
// Importado por: appwriteClient.js, services, repositories, funções
// Usado também em HTML via import ou window.CONFIG

export const CONFIG = {
  // ── Appwrite (Infraestrutura) ─────────────────────────────────────────────
  ENDPOINT:   "https://tor.cloud.appwrite.io/v1",
  PROJECT_ID: "69c7e94a003a1c86b7ca",
  DB:         "69c7e9af00296b17179e",
  BUCKET_ID:  "69c81199001d31ce7f6b",

  // ── Collections ───────────────────────────────────────────────────────────
  COL: {
    PRODUCTS:        "products",
    USERS:           "users",
    ORDERS:          "orders",
    NFE:             "nfe_documents",
    STOCK_HISTORY:   "stock_history",
    SERVICE_ORDERS:  "service_orders",
  },

  STORE: {
    PAGE_SIZE: 15,
    CACHE_TTL: 5 * 60 * 1000,
    CART_KEY:  "hiverCart",
  },

  TAX_RATE: 0.12,

  WHATSAPP: "5598981168787",

  // ── Estoque ───────────────────────────────────────────────────────────────
  // STOCK_CRITICAL: fallback quando produto não tem minQTT definido
  
  STOCK_CRITICAL: 5,

  // ── Busca full-text ───────────────────────────────────────────────────────
  // US-28: campos indexados no Appwrite para busca
  SEARCH_FIELDS: ["name", "ncm", "brand", "category", "description"],  

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
    entregue:    [],   // estado terminal - nenhuma transição permitida
    cancelado:   [],   // estado terminal
  },
}
