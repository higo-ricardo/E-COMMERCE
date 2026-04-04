// ─── HIVERCAR · db.js ─────────────────────────────────────────────────────────
// Ponto central de acesso ao Appwrite para serviços e páginas.
// Evita múltiplas instâncias e mantém versão única do SDK.

import {
  Client,
  Databases,
  Account,
  Storage,
  Query,
  ID,
  Permission,
  Role,
} from "https://cdn.jsdelivr.net/npm/appwrite@16.0.0/+esm"

import { CONFIG } from "./config.js"

// -- Validação de configuração (fail-fast com mensagem clara) ------------------
if (!CONFIG || !CONFIG.ENDPOINT || !CONFIG.PROJECT_ID) {
  const msg = `[HIVECAR] Appwrite não configurado. Verifique js/config.js.
  ENDPOINT=${CONFIG?.ENDPOINT ?? "indefinido"}
  PROJECT_ID=${CONFIG?.PROJECT_ID ?? "indefinido"}`
  console.error(msg)
  throw new Error(msg)
}

// -- Validação do DB e collections (avisos em warn, não bloqueia) -------------
if (!CONFIG || !CONFIG.DB) {
  console.warn("[HIVECAR] CONFIG.DB não definido. Operações de banco falharão.")
}

// -- Inicialização do cliente Appwrite ----------------------------------------
const client = new Client().setEndpoint(CONFIG.ENDPOINT).setProject(CONFIG.PROJECT_ID)
const databases = new Databases(client)
const account = new Account(client)
const storage = new Storage(client)

export {
  client,
  databases,
  account,
  storage,
  Query,
  ID,
  Permission,
  Role,
}
