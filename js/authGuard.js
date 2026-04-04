// ─── HIVERCAR · authGuard.js ──────────────────────────────────────────────────
// Centraliza checagens de autenticação fora dos fluxos de login/cadastro.

import { account } from "./db.js"

/**
 * Garante que o usuário esteja autenticado. Redireciona para login.html se
 * redirect for true. Lança erro para permitir tratamento em chamadas async.
 */
export async function requireAuth(redirect = true) {
  try {
    return await account.get()
  } catch (err) {
    if (redirect && typeof window !== "undefined") {
      window.location.href = "login.html"
    }
    throw err
  }
}

/**
 * Obtém usuário autenticado ou null sem redirecionar.
 */
export async function getCurrentUser() {
  try {
    return await account.get()
  } catch {
    return null
  }
}
