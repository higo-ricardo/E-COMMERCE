// ─── HIVERCAR · userService.js ───────────────────────────────────────────────
// Auth Mirror Pattern: a collection USERS é o espelho dos dados do Auth.
// REGRA: o sistema NUNCA lê dados do usuário direto do Auth após o login —
//        usa SEMPRE o Mirror (collection USERS).
//
// Fluxo de Cadastro:  validar → salvar USERS → Auth.createUser()
// Fluxo de Login:     Auth.createSession() → Mirror.update(lastLogin, lastIP, loginCounter)
// Fluxo de Bloqueio:  5 tentativas → 30min | 10 → 1h | 15 → isActive=false
//
// Camada: Domain / Service — importado por login.html e cadastro.html

import { databases, Query, ID } from "./appwriteClient.js"
import { CONFIG }               from "./config.js"

const { DB, COL, AUTH } = CONFIG

// ─────────────────────────────────────────────────────────────────────────────
// VALIDADORES
// ─────────────────────────────────────────────────────────────────────────────

/** Valida formato de e-mail. */
export function validateEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email.trim())
}

/** Valida força da senha: mínimo 8 chars, pelo menos 1 letra e 1 número. */
export function validatePassword(password) {
  if (password.length < 8) return { ok: false, msg: "Senha deve ter no mínimo 8 caracteres." }
  if (!/[a-zA-Z]/.test(password)) return { ok: false, msg: "Senha deve conter letras." }
  if (!/[0-9]/.test(password))    return { ok: false, msg: "Senha deve conter números." }
  return { ok: true }
}

/** Normaliza e-mail para lowercase e sem espaços. */
export function normalizeEmail(email) {
  return email.trim().toLowerCase()
}

// ─────────────────────────────────────────────────────────────────────────────
// MIRROR — LEITURA
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Busca o Mirror do usuário pelo e-mail.
 * Retorna o documento USERS ou null.
 */
export async function getMirrorByEmail(email) {
  try {
    const res = await databases.listDocuments(DB, COL.USERS, [
      Query.equal("email", normalizeEmail(email)),
      Query.limit(1),
    ])
    return res.documents[0] ?? null
  } catch {
    return null
  }
}

/**
 * Busca o Mirror pelo $id do documento (usado internamente após login).
 */
export async function getMirrorById(docId) {
  try {
    return await databases.getDocument(DB, COL.USERS, docId)
  } catch {
    return null
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// MIRROR — BLOQUEIO
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Verifica se o usuário está bloqueado.
 * Retorna { blocked: true, msg, until } ou { blocked: false }.
 */
export function checkBlocked(mirror) {
  if (!mirror) return { blocked: false }

  // Conta desativada permanentemente
  if (mirror.isActive === false) {
    return { blocked: true, msg: "Conta bloqueada temporariamente! Entre em contato com o suporte." }
  }

  // Bloqueio temporário por blockedUntil
  if (mirror.blockedUntil) {
    const until = new Date(mirror.blockedUntil)
    if (until > new Date()) {
      const mins = Math.ceil((until - new Date()) / 60000)
      return {
        blocked: true,
        msg: `Conta bloqueada temporariamente! Tente novamente em ${mins} minuto(s).`,
        until,
      }
    }
  }

  return { blocked: false }
}

// ─────────────────────────────────────────────────────────────────────────────
// MIRROR — ATUALIZAÇÃO PÓS-LOGIN FALHO
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Registra tentativa de login falha.
 * Aplica as regras de bloqueio progressivo e retorna o mirror atualizado.
 *
 * Regras:
 *   ≥  5 tentativas → blockedUntil = agora + 30min
 *   ≥ 10 tentativas → blockedUntil = agora + 1h
 *   ≥ 15 tentativas → isActive = false (bloqueio permanente)
 */
export async function recordFailedLogin(mirror) {
  if (!mirror) return null

  const failed = (mirror.failedLogin ?? 0) + 1
  const patch  = { failedLogin: failed }

  if (failed >= AUTH.DISABLE_AT) {
    // Bloqueio permanente — admin precisa reativar
    patch.isActive     = false
    patch.blockedUntil = new Date(Date.now() + 99 * 365 * 24 * 3600000).toISOString()
  } else if (failed >= 10) {
    patch.blockedUntil = new Date(Date.now() + AUTH.BLOCK_10).toISOString()
  } else if (failed >= 5) {
    patch.blockedUntil = new Date(Date.now() + AUTH.BLOCK_5).toISOString()
  }

  try {
    return await databases.updateDocument(DB, COL.USERS, mirror.$id, patch)
  } catch {
    return mirror
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// MIRROR — ATUALIZAÇÃO PÓS-LOGIN BEM-SUCEDIDO
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Atualiza lastLogin, lastIP, loginCounter e reseta failedLogin/blockedUntil.
 * Chamado SEMPRE após Auth.createSession() bem-sucedido.
 */
export async function recordSuccessLogin(docId, ip = "unknown") {
  try {
    const mirror = await getMirrorById(docId)
    if (!mirror) return null

    return await databases.updateDocument(DB, COL.USERS, docId, {
      lastLogin:    new Date().toISOString(),
      lastIP:       ip,
      loginCounter: (mirror.loginCounter ?? 0) + 1,
      failedLogin:  0,
      blockedUntil: null,
    })
  } catch {
    return null
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// MIRROR — CRIAÇÃO (Cadastro)
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Cria o documento Mirror na collection USERS.
 * Deve ser chamado ANTES de Auth.create() no fluxo de cadastro.
 *
 * @param {object} data  Dados do formulário já validados.
 * @param {string} authId  ID gerado para o Auth (ID.unique()).
 */
export async function createMirror(data, authId) {
  return databases.createDocument(DB, COL.USERS, authId, {
    name:         data.name.trim(),
    email:        normalizeEmail(data.email),
    cpf:          data.cpf    ?? null,
    mobile:       data.mobile ?? null,
    dayBirth:     data.dayBirth ?? null,
    passwordHash: "(managed-by-auth)",   // hash real fica no Appwrite Auth
    isActive:     true,
    isVerified:   false,
    role:         data.role    ?? "cliente",
    company:      data.company ?? null,
    lastLogin:    null,
    loginCounter: 0,
    lastIP:       null,
    address:      data.address    ?? null,
    district:     data.district   ?? "CENTRO",
    number:       data.number     ?? null,
    complement:   data.complement ?? null,
    city:         data.city       ?? "CHAPADINHA",
    state:        data.state      ?? "MA",
    country:      data.country    ?? "BRASIL",
    cep:          data.cep        ?? 65500000,
    failedLogin:  0,
    blockedUntil: null,
    createdAt:    new Date().toISOString(),
  })
}

// ─────────────────────────────────────────────────────────────────────────────
// HELPERS DE REDIRECIONAMENTO
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Redireciona o usuário conforme seu role.
 * admin    → dashboard.html
 * vendedor → painel-vendas.html
 * cliente  → minha-conta.html  (fallback: loja.html)
 */
export function redirectByRole(role) {
  const map = {
    admin:    "dashboard.html",
    vendedor: "painel-vendas.html",
    cliente:  "minha-conta.html",
  }
  window.location.href = map[role] ?? "loja.html"
}
