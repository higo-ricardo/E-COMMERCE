// â”€â”€â”€ HIVERCAR Â· tests/userService.test.js â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
// US-26 Â· Task 2: Testes para userService.js
//   - checkBlocked()
//   - recordFailedLogin() (mock Appwrite databases)
//   - validatePassword() e validateEmail()
//
// EstratÃ©gia: importa funÃ§Ãµes puras diretamente. Para funÃ§Ãµes que chamam
// databases.updateDocument, o mÃ³dulo appwriteClient Ã© mockado via vi.mock().

import { describe, it, expect, vi, beforeEach } from "vitest"

// â”€â”€ Mock do appwriteClient â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
// vi.mock intercepta o import antes da execuÃ§Ã£o do mÃ³dulo testado.
vi.mock("../js/appwriteClient.js", () => ({
  databases: {
    listDocuments:   vi.fn(),
    getDocument:     vi.fn(),
    createDocument:  vi.fn(),
    updateDocument:  vi.fn(),
  },
  account: {
    get:    vi.fn(),
    create: vi.fn(),
    createEmailPasswordSession: vi.fn(),
    deleteSession: vi.fn(),
    createRecovery: vi.fn(),
  },
  Query: {
    equal:    vi.fn((...a) => a),
    limit:    vi.fn(n => n),
    orderDesc:vi.fn(f => f),
  },
  ID: { unique: vi.fn(() => "mock-id-" + Math.random().toString(36).slice(2,8)) },
}))

// â”€â”€ Importa apÃ³s o mock â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
import {
  checkBlocked,
  validateEmail,
  validatePassword,
  normalizeEmail,
  recordFailedLogin,
} from "../js/userService.js"

// â”€â”€ Importa o mock para configurar retornos por teste â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
import { databases } from "../js/appwriteClient.js"

// â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
describe("validateEmail()", () => {
  it("aceita e-mails vÃ¡lidos", () => {
    expect(validateEmail("teste@dominio.com")).toBe(true)
    expect(validateEmail("user.name+tag@sub.domain.org")).toBe(true)
    expect(validateEmail("higo@hivercar.com.br")).toBe(true)
  })

  it("rejeita e-mails invÃ¡lidos", () => {
    expect(validateEmail("")).toBe(false)
    expect(validateEmail("semArroba")).toBe(false)
    expect(validateEmail("@dominio.com")).toBe(false)
    expect(validateEmail("usuario@")).toBe(false)
    expect(validateEmail("usuario@dominio")).toBe(false)  // sem extensÃ£o
  })

  it("ignora espaÃ§os nas bordas", () => {
    expect(validateEmail("  teste@dominio.com  ")).toBe(true)
  })
})

// â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
describe("normalizeEmail()", () => {
  it("converte para lowercase e remove espaÃ§os", () => {
    expect(normalizeEmail("  TESTE@DOMINIO.COM  ")).toBe("teste@dominio.com")
  })
})

// â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
describe("validatePassword()", () => {
  it("aceita senhas fortes (â‰¥8 chars, letras + nÃºmeros)", () => {
    expect(validatePassword("Senha123").ok).toBe(true)
    expect(validatePassword("abcde123").ok).toBe(true)
    expect(validatePassword("PASS1234").ok).toBe(true)
  })

  it("rejeita senha curta (< 8 chars)", () => {
    const r = validatePassword("Ab1")
    expect(r.ok).toBe(false)
    expect(r.msg).toMatch(/8 caracteres/i)
  })

  it("rejeita senha sem letras", () => {
    const r = validatePassword("12345678")
    expect(r.ok).toBe(false)
    expect(r.msg).toMatch(/letras/i)
  })

  it("rejeita senha sem nÃºmeros", () => {
    const r = validatePassword("abcdefgh")
    expect(r.ok).toBe(false)
    expect(r.msg).toMatch(/nÃºmeros/i)
  })
})

// â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
describe("checkBlocked()", () => {

  it("retorna { blocked: false } para mirror null", () => {
    expect(checkBlocked(null)).toEqual({ blocked: false })
  })

  it("retorna { blocked: false } para usuÃ¡rio normal", () => {
    const mirror = { isActive: true, blockedUntil: null, failedLogin: 0 }
    expect(checkBlocked(mirror)).toEqual({ blocked: false })
  })

  it("bloqueia quando isActive === false", () => {
    const mirror = { isActive: false, blockedUntil: null }
    const result = checkBlocked(mirror)
    expect(result.blocked).toBe(true)
    expect(result.msg).toMatch(/suporte/i)
  })

  it("bloqueia quando blockedUntil Ã© no futuro", () => {
    const futuro = new Date(Date.now() + 30 * 60 * 1000).toISOString()
    const mirror = { isActive: true, blockedUntil: futuro }
    const result = checkBlocked(mirror)
    expect(result.blocked).toBe(true)
    expect(result.msg).toMatch(/minuto/i)
    expect(result.until).toBeInstanceOf(Date)
  })

  it("NÃƒO bloqueia quando blockedUntil Ã© no passado", () => {
    const passado = new Date(Date.now() - 60 * 1000).toISOString()
    const mirror  = { isActive: true, blockedUntil: passado }
    expect(checkBlocked(mirror)).toEqual({ blocked: false })
  })
})

// â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
describe("recordFailedLogin()", () => {
  beforeEach(() => vi.clearAllMocks())

  it("retorna null para mirror null", async () => {
    expect(await recordFailedLogin(null)).toBeNull()
  })

  it("incrementa failedLogin e persiste via Appwrite", async () => {
    const mirror = { $id: "uid-001", failedLogin: 2, isActive: true }
    databases.updateDocument.mockResolvedValue({ ...mirror, failedLogin: 3 })

    const result = await recordFailedLogin(mirror)

    expect(databases.updateDocument).toHaveBeenCalledWith(
      expect.any(String),   // DB
      expect.any(String),   // COL.USERS
      "uid-001",
      expect.objectContaining({ failedLogin: 3 })
    )
    expect(result.failedLogin).toBe(3)
  })

  it("aplica bloqueio de 30min na 5Âª tentativa", async () => {
    const mirror = { $id: "uid-002", failedLogin: 4, isActive: true }
    databases.updateDocument.mockResolvedValue({ ...mirror, failedLogin: 5 })

    await recordFailedLogin(mirror)

    const call = databases.updateDocument.mock.calls[0][3]
    expect(call.failedLogin).toBe(5)
    expect(call.blockedUntil).toBeDefined()
    // blockedUntil deve ser ~30 min no futuro
    const diff = new Date(call.blockedUntil) - Date.now()
    expect(diff).toBeGreaterThan(29 * 60 * 1000)
    expect(diff).toBeLessThan(31 * 60 * 1000)
  })

  it("aplica bloqueio de 1h na 10Âª tentativa", async () => {
    const mirror = { $id: "uid-003", failedLogin: 9, isActive: true }
    databases.updateDocument.mockResolvedValue({ ...mirror, failedLogin: 10 })

    await recordFailedLogin(mirror)

    const call = databases.updateDocument.mock.calls[0][3]
    const diff = new Date(call.blockedUntil) - Date.now()
    expect(diff).toBeGreaterThan(59 * 60 * 1000)
    expect(diff).toBeLessThan(61 * 60 * 1000)
  })

  it("desativa conta (isActive=false) na 15Âª tentativa", async () => {
    const mirror = { $id: "uid-004", failedLogin: 14, isActive: true }
    databases.updateDocument.mockResolvedValue({ ...mirror, failedLogin: 15, isActive: false })

    await recordFailedLogin(mirror)

    const call = databases.updateDocument.mock.calls[0][3]
    expect(call.isActive).toBe(false)
    expect(call.failedLogin).toBe(15)
  })

  it("retorna mirror original em caso de erro de rede", async () => {
    const mirror = { $id: "uid-005", failedLogin: 0, isActive: true }
    databases.updateDocument.mockRejectedValue(new Error("Network error"))

    const result = await recordFailedLogin(mirror)
    expect(result).toBe(mirror)  // retorna o mesmo objeto sem lanÃ§ar erro
  })
})


