// ─── HIVERCAR · config.js ────────────────────────────────────────────────────
// Fonte de verdade única. Todos os módulos importam daqui.
//
// Sprint 02–04 — alterações:
//   US-09: + COL.ORDER_HISTORY   ("order_history")
//   US-20: + COL.STOCK_HISTORY   ("stock_history")
//   US-21: + COL.OS_HISTORY       ("os_history")
//   US-36: + STOCK_MIN_DEFAULT, + STORE.SEARCH_FULLTEXT_FIELDS
//
// Sprint 05 — alterações:
//   US-44: + COL.TAX_RULES, + COL.NFE_DOCUMENTS, TAX_RATE → LEGADO (usar TaxEngine)
//   US-43: + FUNCTIONS.EMIT_NFE, FUNCTIONS.CANCEL_NFE
//   US-45: + COL.FISCAL_REPORTS

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
    TAX_RULES:      "tax_rules",       // ← US-44: regras tributárias por NCM
    NFE_DOCUMENTS:  "nfe_documents",   // ← US-43: NF-e emitidas (chave, XML, PDF)
    FISCAL_REPORTS: "fiscal_reports",  // ← US-45: relatórios fiscais mensais
  },

  STORE: {
    PAGE_SIZE: 15,
    CACHE_TTL: 5 * 60 * 1000,
    CART_KEY:  "hiverCart",
  },

  // ── TAX_RATE legado ────────────────────────────────────────────────────────
  // ATENÇÃO: TAX_RATE (12% fixo) foi substituído pelo TaxEngine (US-44).
  // Mantido aqui apenas para compatibilidade com testes antigos.
  // NÃO usar em novos módulos — importar TaxEngine.calculate() em vez disso.
  TAX_RATE: 0.12,   // @deprecated — use TaxEngine.calculate()

  WHATSAPP: "5598981168787",

  // ── Appwrite Functions ────────────────────────────────────────────────────
  // US-43: IDs das functions de NF-e (preencher após criar no Appwrite Console)
  FUNCTIONS: {
    EMIT_NFE:   "emit-nfe",           // ← function de emissão de NFC-e
    CANCEL_NFE: "cancel-nfe",         // ← function de cancelamento de NF-e
    CREATE_PIX: "create-pix-payment", // ← US-29: pagamento PIX
    CHECK_PIX:  "check-payment-status",
  },

  // ── Fiscal ────────────────────────────────────────────────────────────────
  // US-44: configurações do módulo fiscal
  FISCAL: {
    REGIME:      "lucro_presumido",   // simples_nacional | lucro_presumido | lucro_real
    UF_ORIGEM:   "MA",               // UF da empresa emissora
    CNPJ:        "00.000.000/0001-00", // substituir pelo CNPJ real
    RAZAO_SOCIAL:"HIVERCAR AUTOPEÇAS LTDA",
    SERIE_NFE:   "001",              // série da NF-e
    AMBIENTE:    "homologacao",       // homologacao | producao
  },

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
