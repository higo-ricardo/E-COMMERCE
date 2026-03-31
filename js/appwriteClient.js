// ─── HIVERCAR · appwriteClient.js ────────────────────────────────────────────
// Única instância Client/Databases/Account para todo o sistema.
// Camada: Infrastructure - importado pelos repositories e authService.

import { Client, Databases, Account, Query, ID, Permission, Role }
  from "https://cdn.jsdelivr.net/npm/appwrite@16.0.0/+esm"

import { CONFIG } from "./config.js"

if (!CONFIG || !CONFIG.FISCAL) {
  const msg = "CONFIG.FISCAL não encontrado. Verifique js/config.js e reinicie a aplicação."
  console.error("[HIVERCAR] ", msg)
  throw new Error(msg)
}

if (!CONFIG.ENDPOINT || !CONFIG.PROJECT_ID) {
  const msg = `Appwrite não configurado corretamente: ENDPOINT=${CONFIG.ENDPOINT} PROJECT_ID=${CONFIG.PROJECT_ID}`
  console.error("[HIVERCAR] ", msg)
  throw new Error("Nenhum projeto Appwrite foi especificado. Defina CONFIG.ENDPOINT e CONFIG.PROJECT_ID em js/config.js")
}

const client = new Client()

client
  .setEndpoint(CONFIG.ENDPOINT)
  .setProject(CONFIG.PROJECT_ID)

export const databases = new Databases(client)
export const account   = new Account(client)
export { Query, ID, Permission, Role }

