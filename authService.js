// ─── HIVERCAR · authService.js ───────────────────────────────────────────────
// Autenticação pura: login, logout, registro, recuperação de senha.
// Camada: Domain / Service — usado por login.html e cadastro.html.
//
// REGRA DO AUTH MIRROR PATTERN:
//   - Auth é responsável por credenciais e sessão.
//   - Dados do usuário (role, company, bloqueios) → sempre via userService.js
//   - Este serviço NÃO lê perfil do usuário. Use getMirrorByEmail() para isso.

import { account, ID } from "./appwriteClient.js"

export const AuthService = {

  /** Retorna usuário logado (Auth) ou null — nunca lança. */
  async getUser() {
    try   { return await account.get() }
    catch { return null }
  },

  /**
   * Cria sessão por e-mail + senha.
   * Após chamar login(), sempre chame recordSuccessLogin() do userService.
   */
  async login(email, password) {
    // Compatibilidade SDK v14+/v16
    if (typeof account.createEmailPasswordSession === 'function') {
      return account.createEmailPasswordSession(email, password)
    }
    return account.createSession(email, password)
  },

  /** Encerra a sessão atual. */
  async logout() {
    try   { return await account.deleteSession("current") }
    catch { /* sessão já expirada — ignora */ }
  },

  /**
   * Cria conta no Auth com ID explícito.
   * O ID deve ser gerado externamente (ID.unique()) e compartilhado
   * com createMirror() do userService para manter $id sincronizado.
   *
   * Fluxo correto no cadastro:
   *   1. const authId = ID.unique()
   *   2. await createMirror(data, authId)   ← salva USERS primeiro
   *   3. await AuthService.register(authId, name, email, password)
   */
  async register(authId, name, email, password) {
    return account.create(authId, email, password, name)
  },

  /**
   * Envia e-mail de recuperação de senha.
   * redirectUrl deve apontar para a página de redefinição.
   */
  async sendPasswordRecovery(email, redirectUrl) {
    return account.createRecovery(email, redirectUrl)
  },
}
