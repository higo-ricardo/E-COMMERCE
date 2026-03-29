// ─── HIVERCAR · tests/authService.test.js ────────────────────────────────────
// US-26 · Task 5: Testes para AuthService com mock completo do Appwrite SDK.
//   - getUser()
//   - login()
//   - logout()
//   - register()
//   - sendPasswordRecovery()

import { describe, it, expect, vi, beforeEach } from "vitest"

// ── Mock do appwriteClient ─────────────────────────────────────────────────────
// Intercepta o import ANTES de qualquer outro módulo usar o account real.
vi.mock("../js/appwriteClient.js", () => ({
  account: {
    get:                          vi.fn(),
    create:                       vi.fn(),
    createEmailPasswordSession:   vi.fn(),
    deleteSession:                vi.fn(),
    createRecovery:               vi.fn(),
  },
  databases: {
    listDocuments:  vi.fn(),
    getDocument:    vi.fn(),
    createDocument: vi.fn(),
    updateDocument: vi.fn(),
  },
  Query: { equal: vi.fn(), limit: vi.fn() },
  ID:    { unique: vi.fn(() => "test-unique-id") },
}))

import { AuthService } from "../js/authService.js"
import { account }     from "../js/appwriteClient.js"

// ── Limpa mocks antes de cada teste ──────────────────────────────────────────
beforeEach(() => {
  vi.clearAllMocks()
})

// ─────────────────────────────────────────────────────────────────────────────
describe("AuthService.getUser()", () => {

  it("retorna o usuário autenticado quando sessão é válida", async () => {
    const mockUser = { $id: "user-001", name: "Higo", email: "higo@hivercar.com" }
    account.get.mockResolvedValue(mockUser)

    const user = await AuthService.getUser()
    expect(user).toEqual(mockUser)
    expect(account.get).toHaveBeenCalledTimes(1)
  })

  it("retorna null quando não há sessão ativa (sem lançar erro)", async () => {
    account.get.mockRejectedValue(new Error("Unauthorized"))

    const user = await AuthService.getUser()
    expect(user).toBeNull()
    // Não deve propagar o erro - comportamento silencioso definido no serviço
  })

  it("retorna null para qualquer tipo de falha na API", async () => {
    account.get.mockRejectedValue({ code: 401, message: "Not authenticated" })
    expect(await AuthService.getUser()).toBeNull()
  })
})

// ─────────────────────────────────────────────────────────────────────────────
describe("AuthService.login()", () => {

  it("chama createEmailPasswordSession com os parâmetros corretos", async () => {
    const mockSession = { $id: "sess-001", userId: "user-001" }
    account.createEmailPasswordSession.mockResolvedValue(mockSession)

    const result = await AuthService.login("higo@hivercar.com", "Senha123")

    expect(account.createEmailPasswordSession).toHaveBeenCalledTimes(1)
    expect(account.createEmailPasswordSession).toHaveBeenCalledWith(
      "higo@hivercar.com",
      "Senha123"
    )
    expect(result).toEqual(mockSession)
  })

  it("propaga o erro quando credenciais estão incorretas", async () => {
    account.createEmailPasswordSession.mockRejectedValue(
      new Error("Invalid credentials")
    )
    await expect(
      AuthService.login("errado@mail.com", "senhaErrada")
    ).rejects.toThrow("Invalid credentials")
  })

  it("propaga o erro quando usuário não existe", async () => {
    account.createEmailPasswordSession.mockRejectedValue(
      new Error("User not found")
    )
    await expect(
      AuthService.login("naoexiste@mail.com", "qualquer123")
    ).rejects.toThrow()
  })
})

// ─────────────────────────────────────────────────────────────────────────────
describe("AuthService.logout()", () => {

  it("chama deleteSession('current') corretamente", async () => {
    account.deleteSession.mockResolvedValue(true)

    await AuthService.logout()

    expect(account.deleteSession).toHaveBeenCalledWith("current")
    expect(account.deleteSession).toHaveBeenCalledTimes(1)
  })

  it("não lança erro quando a sessão já expirou (falha silenciosa)", async () => {
    account.deleteSession.mockRejectedValue(new Error("Session not found"))

    // Deve resolver sem lançar (o catch interno do serviço silencia o erro)
    await expect(AuthService.logout()).resolves.toBeUndefined()
  })

  it("não lança erro quando a API retorna 401", async () => {
    account.deleteSession.mockRejectedValue({ code: 401 })
    await expect(AuthService.logout()).resolves.toBeUndefined()
  })
})

// ─────────────────────────────────────────────────────────────────────────────
describe("AuthService.register()", () => {

  it("chama account.create com authId, email, password, name", async () => {
    const mockUser = { $id: "auth-001", name: "Ana", email: "ana@mail.com" }
    account.create.mockResolvedValue(mockUser)

    const result = await AuthService.register(
      "auth-001",
      "Ana Silva",
      "ana@mail.com",
      "Senha456"
    )

    expect(account.create).toHaveBeenCalledWith(
      "auth-001",        // authId explícito (Auth Mirror Pattern)
      "ana@mail.com",
      "Senha456",
      "Ana Silva"
    )
    expect(result).toEqual(mockUser)
  })

  it("propaga erro quando e-mail já está em uso", async () => {
    account.create.mockRejectedValue(new Error("user_already_exists"))
    await expect(
      AuthService.register("new-id", "João", "existente@mail.com", "Pass123")
    ).rejects.toThrow("user_already_exists")
  })

  it("propaga erro quando senha não atende requisitos do Appwrite", async () => {
    account.create.mockRejectedValue(new Error("password_recently_used"))
    await expect(
      AuthService.register("new-id", "Pedro", "pedro@mail.com", "fraca")
    ).rejects.toThrow()
  })

  it("usa o authId fornecido (Auth Mirror Pattern - $id sincronizado)", async () => {
    account.create.mockResolvedValue({ $id: "custom-id-123" })

    await AuthService.register("custom-id-123", "Maria", "m@m.com", "Pass123")

    const call = account.create.mock.calls[0]
    // O primeiro argumento DEVE ser o authId - garante sincronização com Mirror
    expect(call[0]).toBe("custom-id-123")
  })
})

// ─────────────────────────────────────────────────────────────────────────────
describe("AuthService.sendPasswordRecovery()", () => {

  it("chama account.createRecovery com email e redirectUrl", async () => {
    account.createRecovery.mockResolvedValue({ $id: "recovery-token-001" })

    await AuthService.sendPasswordRecovery(
      "usuario@mail.com",
      "https://hivercar.com/reset"
    )

    expect(account.createRecovery).toHaveBeenCalledWith(
      "usuario@mail.com",
      "https://hivercar.com/reset"
    )
    expect(account.createRecovery).toHaveBeenCalledTimes(1)
  })

  it("retorna o token de recuperação", async () => {
    const mockToken = { $id: "tok-001", expire: "2024-12-31" }
    account.createRecovery.mockResolvedValue(mockToken)

    const result = await AuthService.sendPasswordRecovery("u@u.com", "https://x.com")
    expect(result).toEqual(mockToken)
  })

  it("propaga erro quando e-mail não está cadastrado", async () => {
    account.createRecovery.mockRejectedValue(
      new Error("user_not_found")
    )
    await expect(
      AuthService.sendPasswordRecovery("nao@existe.com", "https://x.com")
    ).rejects.toThrow("user_not_found")
  })

  it("propaga erro quando há rate limit do Appwrite", async () => {
    account.createRecovery.mockRejectedValue(new Error("rate_limit_exceeded"))
    await expect(
      AuthService.sendPasswordRecovery("u@u.com", "https://x.com")
    ).rejects.toThrow()
  })
})

// ─────────────────────────────────────────────────────────────────────────────
describe("AuthService - Fluxo de Auth Mirror Pattern", () => {

  it("register usa ID externo para sincronizar com Mirror", async () => {
    // Este teste documenta o contrato do Auth Mirror Pattern:
    // O authId deve ser gerado FORA do AuthService e passado explicitamente,
    // para que o Mirror e o Auth compartilhem o mesmo $id.
    account.create.mockResolvedValue({ $id: "sync-id-999" })

    const externalId = "sync-id-999"
    await AuthService.register(externalId, "Carlos", "c@c.com", "Pass789")

    expect(account.create.mock.calls[0][0]).toBe(externalId)
  })

  it("login retorna a sessão sem acessar dados do perfil", async () => {
    // getUser e getUserMirror não devem ser chamados durante o login -
    // o serviço só cria a sessão. Dados de perfil ficam em userService.
    const mockSession = { $id: "sess-abc", userId: "user-abc" }
    account.createEmailPasswordSession.mockResolvedValue(mockSession)

    const sess = await AuthService.login("a@a.com", "Pass123")

    // account.get NÃO deve ser chamado durante o login
    expect(account.get).not.toHaveBeenCalled()
    expect(sess.$id).toBe("sess-abc")
  })
})


