// ─── HIVERCAR · config-provider.js ────────────────────────────────────────
// Provedor de configuração para HTML com <script type="module">
// USO em HTML:
//   import { CONFIG, COLLECTIONS, AUTH_CONFIG } from "./config-provider.js"
//
// Centraliza tudo de config.js com interface amigável para HTML

import { CONFIG as cfg } from "./config.js"

// ── Re-export com aliases amigáveis ─────────────────────────────────────────
export const CONFIG = {
  ENDPOINT:   cfg.ENDPOINT,
  PROJECT_ID: cfg.PROJECT_ID,
  DB:         cfg.DB,
  WHATSAPP:   cfg.WHATSAPP,
}

export const COLLECTIONS = {
  PRODUCTS:      cfg.COL.PRODUCTS,
  USERS:         cfg.COL.USERS,
  ORDERS:        cfg.COL.ORDERS,
  NFE:           cfg.COL.NFE,
  STOCK_HISTORY: cfg.COL.STOCK_HISTORY,
  SERVICE_ORDERS:cfg.COL.SERVICE_ORDERS,
}

export const AUTH_CONFIG = {
  BLOCK_5:    cfg.AUTH.BLOCK_5,
  BLOCK_10:   cfg.AUTH.BLOCK_10,
  DISABLE_AT: cfg.AUTH.DISABLE_AT,
  UI_LOCK_MS: cfg.AUTH.UI_LOCK_MS,
}

export const STORE_CONFIG = cfg.STORE

export const FISCAL_CONFIG = {
  TAX_RATE: cfg.TAX_RATE,
}

// ── Também exportar CONFIG completo para compatibilidade total ──────────────
export const CONFIG_COMPLETE = cfg
