// ─── HIVERCAR · userService.js ───────────────────────────────────────────────
// Auth Mirror Pattern: a collection USERS é o espelho dos dados do Auth.
// REGRA: o sistema NUNCA lê dados do usuário direto do Auth após o login -
//        usa SEMPRE o Mirror (collection USERS).
//
// Fluxo de Cadastro:  validar → salvar USERS → Auth.createUser()
// Fluxo de Login:     Auth.createSession() → Mirror.update(lastLogin, lastIP, loginCounter)
// Fluxo de Bloqueio:  5 tentativas → 30min | 10 → 1h | 15 → isActive=false
//
// Sprint 07 - US-79, US-80, US-81:
//   + lastLogin    → capturado em recordSuccessLogin()
//   + lastIP       → capturado via getClientIP()
//   + loginCounter → incrementado em recordSuccessLogin()
//
// Camada: Domain / Service - importado por login.html e cadastro.html

import { databases, Query, ID, Permission, Role } from "./db.js"
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
// MIRROR - LEITURA
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
// MIRROR - BLOQUEIO
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
// MIRROR - ATUALIZAÇÃO PÓS-LOGIN FALHO
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
    // Bloqueio permanente - admin precisa reativar
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
// MIRROR - CRIAÇÃO (Cadastro)
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Cria o documento Mirror na collection USERS.
 * Deve ser chamado ANTES de Auth.create() no fluxo de cadastro.
 *
 * @param {object} data  Dados do formulário já validados.
 * @param {string} authId  ID gerado para o Auth (ID.unique()).
 */
export async function createMirror(data, authId) {
  const perms = [
    Permission.read(Role.user(authId)),
    Permission.update(Role.user(authId)),
    Permission.delete(Role.user(authId)),
    Permission.read(Role.team("admins")),
    Permission.update(Role.team("admins")),
    Permission.delete(Role.team("admins")),
  ]
  return databases.createDocument(DB, COL.USERS, authId, {
    name:         data.name.trim(),
    email:        normalizeEmail(data.email),
    cpf:          data.cpf    ?? null,
    mobile:       data.mobile ?? null,
    dayBirth:     data.dayBirth ?? null,
    passwordHash: "(managed-by-auth)",   // hash real fica no Appwrite Auth
    isActive:     true,
    isVerified:   false,
    role:         data.role    ?? "USERS",
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
  }, perms)
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
  const normalized = String(role ?? '').trim().toUpperCase()
  const map = {
    ADMIN:    "dashboard.html",
    SELLER:   "painel-vendas.html",
    USERS:    "minha-conta.html",
    // Compatibilidade legado
    admin:    "dashboard.html",
    vendedor: "painel-vendas.html",
    cliente:  "minha-conta.html",
  }
  window.location.href = map[normalized] ?? map[role] ?? "loja.html"
}

// ─────────────────────────────────────────────────────────────────────────────
// SPRINT 07 — US-80: CAPTURAR IP DO CLIENTE
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Captura o IP do cliente para auditoria (US-80).
 * Usa API externa para obter IP público do usuário.
 * @returns {Promise<string>} IP do cliente
 */
export async function getClientIP() {
  const isValidIp = (value) => {
    const v = String(value ?? '').trim()
    const ipv4 = /^(25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)(\.(25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)){3}$/
    const ipv6 = /^[a-fA-F0-9:]+$/
    return ipv4.test(v) || ipv6.test(v)
  }

  const tryFetchText = async (url, timeoutMs = 2500) => {
    const controller = new AbortController()
    const timer = setTimeout(() => controller.abort(), timeoutMs)
    try {
      const res = await fetch(url, { signal: controller.signal, cache: "no-store" })
      if (!res.ok) return null
      const text = (await res.text()).trim()
      return isValidIp(text) ? text : null
    } catch {
      return null
    } finally {
      clearTimeout(timer)
    }
  }

  return (
    (await tryFetchText("https://api64.ipify.org")) ||
    (await tryFetchText("https://ipapi.co/ip/")) ||
    "unknown"
  )
}

/**
 * Garante que o usuário autenticado tem um Mirror no banco.
 * Se não existir, cria automaticamente (autorepair).
 * @param {Object} authUser - Usuário do Appwrite Auth
 * @param {Object} mirrorHint - Mirror já existente (opcional)
 * @returns {Promise<Object>} Mirror do usuário
 */
export async function ensureMirrorForUser(authUser, mirrorHint = null) {
  if (!authUser) return null
  if (mirrorHint) return mirrorHint

  const email = String(authUser.email || '').toLowerCase().trim()
  let mirror = await getMirrorByEmail(email)
  if (mirror) return mirror

  const fallbackName = String(authUser.name || email.split("@")[0] || "Usuario")

  try {
    const perms = [
      Permission.read(Role.user(authUser.$id)),
      Permission.update(Role.user(authUser.$id)),
      Permission.delete(Role.user(authUser.$id)),
      Permission.read(Role.team("admins")),
      Permission.update(Role.team("admins")),
      Permission.delete(Role.team("admins")),
    ]
    await databases.createDocument(DB, COL.USERS, authUser.$id, {
      name: fallbackName,
      email,
      cpf: null,
      mobile: null,
      dayBirth: null,
      isActive: true,
      isVerified: !!authUser.emailVerification,
      role: "USERS",
      lastLogin: null,
      loginCounter: 0,
      lastIP: null,
      failedLogin: 0,
      blockedUntil: null,
      address: null,
      district: "CENTRO",
      number: null,
      complement: null,
      city: "CHAPADINHA",
      state: "MA",
      cep: 65500000,
    }, perms)
  } catch (err) {
    console.warn("[USER] não foi possível criar Mirror:", err?.message || err)
  }

  mirror = await getMirrorByEmail(email)
  return mirror ?? null
}

/**
 * Registra login bem-sucedido: atualiza lastLogin, lastIP, loginCounter.
 * @param {Object} authUser - Usuário do Auth
 * @param {Object} mirrorHint - Mirror já obtido (opcional)
 * @returns {Promise<boolean>} Sucesso
 */
export async function recordSuccessLogin(authUser, mirrorHint = null) {
  const timestamp = new Date().toISOString()
  const clientIp = await getClientIP()
  const candidateDocIds = []
  if (mirrorHint?.$id) candidateDocIds.push(mirrorHint.$id)
  if (authUser?.$id && !candidateDocIds.includes(authUser.$id)) {
    candidateDocIds.push(authUser.$id)
  }

  for (const docId of candidateDocIds) {
    try {
      const mirror = await getMirrorById(docId)
      await databases.updateDocument(DB, COL.USERS, docId, {
        lastLogin: timestamp,
        lastIP: clientIp,
        loginCounter: (mirror?.loginCounter ?? 0) + 1,
        failedLogin: 0,
        blockedUntil: null,
      })
      return true
    } catch (err) {
      console.warn("[USER] falha ao atualizar lastLogin por docId:", docId, err?.message || err)
    }
  }

  try {
    const mirrorByEmail = await getMirrorByEmail(authUser?.email || '-')
    if (!mirrorByEmail?.$id) return false
    await databases.updateDocument(DB, COL.USERS, mirrorByEmail.$id, {
      lastLogin: timestamp,
      lastIP: clientIp,
      loginCounter: (mirrorByEmail?.loginCounter ?? 0) + 1,
      failedLogin: 0,
      blockedUntil: null,
    })
    return true
  } catch (err) {
    console.warn("[USER] falha final ao atualizar lastLogin:", err?.message || err)
    return false
  }
}

/**
 * Atualiza o IP do usuário no mirror.
 * @param {string} docId - ID do documento do usuário
 * @param {string} ip - IP do cliente
 */
export async function updateClientIP(docId, ip) {
  try {
    return await databases.updateDocument(DB, COL.USERS, docId, {
      lastIP: ip,
    })
  } catch {
    return null
  }
}
