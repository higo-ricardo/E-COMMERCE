// ─── HIVERCAR · appwriteClient.js ────────────────────────────────────────────
// Única instância Client/Databases/Account para todo o sistema.
// Camada: Infrastructure — importado pelos repositories e authService.

import { Client, Databases, Account, Query, ID, Permission, Role }
  from "https://cdn.jsdelivr.net/npm/appwrite@16.0.0/+esm"

import { CONFIG } from "./config.js"

const client = new Client()

client
  .setEndpoint(CONFIG.ENDPOINT)
  .setProject(CONFIG.PROJECT_ID)

export const databases = new Databases(client)
export const account   = new Account(client)
export { Query, ID, Permission, Role }

