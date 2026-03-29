// â”€â”€â”€ HIVERCAR Â· tests/authService.test.js â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
// US-26 Â· Task 5: Testes para AuthService com mock completo do Appwrite SDK.
//   - getUser()
//   - login()
//   - logout()
//   - register()
//   - sendPasswordRecovery()

import { describe, it, expect, vi, beforeEach } from "vitest"

// â”€â”€ Mock do appwriteClient â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
// Intercepta o import ANTES de qualquer outro mÃ³dulo usar o account real.
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

// â”€â”€ Limpa mocks antes de cada teste â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
beforeEach(() => {
  vi.clearAllMocks()
})

// â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
describe("AuthService.getUser()", () => {

  it("retorna o usuÃ¡rio autenticado quando sessÃ£o Ã© vÃ¡lida", async () => {
    const mockUser = { $id: "user-001", name: "Higo", email: "higo@hivercar.com" }
    account.get.mockResolvedValue(mockUser)

    const user = await AuthService.getUser()
    expect(user).toEqual(mockUser)
    expect(account.get).toHaveBeenCalledTimes(1)
  })

  it("retorna null quando nÃ£o hÃ¡ sessÃ£o ativa (sem lanÃ§ar erro)", async () => {
    account.get.mockRejectedValue(new Error("Unauthorized"))

    const user = await AuthService.getUser()
    expect(user).toBeNull()
    // NÃ£o deve propagar o erro â€” comportamento silencioso definido no serviÃ§o
  })

  it("retorna null para qualquer tipo de falha na API", async () => {
    account.get.mockRejectedValue({ code: 401, message: "Not authenticated" })
    expect(await AuthService.getUser()).toBeNull()
  })
})

// â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
describe("AuthService.login()", () => {

  it("chama createEmailPasswordSession com os parÃ¢metros corretos", async () => {
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

  it("propaga o erro quando credenciais estÃ£o incorretas", async () => {
    account.createEmailPasswordSession.mockRejectedValue(
      new Error("Invalid credentials")
    )
    await expect(
      AuthService.login("errado@mail.com", "senhaErrada")
    ).rejects.toThrow("Invalid credentials")
  })

  it("propaga o erro quando usuÃ¡rio nÃ£o existe", async () => {
    account.createEmailPasswordSession.mockRejectedValue(
      new Error("User not found")
    )
    await expect(
      AuthService.login("naoexiste@mail.com", "qualquer123")
    ).rejects.toThrow()
  })
})

// â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
describe("AuthService.logout()", () => {

  it("chama deleteSession('current') corretamente", async () => {
    account.deleteSession.mockResolvedValue(true)

    await AuthService.logout()

    expect(account.deleteSession).toHaveBeenCalledWith("current")
    expect(account.deleteSession).toHaveBeenCalledTimes(1)
  })

  it("nÃ£o lanÃ§a erro quando a sessÃ£o jÃ¡ expirou (falha silenciosa)", async () => {
    account.deleteSession.mockRejectedValue(new Error("Session not found"))

    // Deve resolver sem lanÃ§ar (o catch interno do serviÃ§o silencia o erro)
    await expect(AuthService.logout()).resolves.toBeUndefined()
  })

  it("nÃ£o lanÃ§a erro quando a API retorna 401", async () => {
    account.deleteSession.mockRejectedValue({ code: 401 })
    await expect(AuthService.logout()).resolves.toBeUndefined()
  })
})

// â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
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
      "auth-001",        // authId explÃ­cito (Auth Mirror Pattern)
      "ana@mail.com",
      "Senha456",
      "Ana Silva"
    )
    expect(result).toEqual(mockUser)
  })

  it("propaga erro quando e-mail jÃ¡ estÃ¡ em uso", async () => {
    account.create.mockRejectedValue(new Error("user_already_exists"))
    await expect(
      AuthService.register("new-id", "JoÃ£o", "existente@mail.com", "Pass123")
    ).rejects.toThrow("user_already_exists")
  })

  it("propaga erro quando senha nÃ£o atende requisitos do Appwrite", async () => {
    account.create.mockRejectedValue(new Error("password_recently_used"))
    await expect(
      AuthService.register("new-id", "Pedro", "pedro@mail.com", "fraca")
    ).rejects.toThrow()
  })

  it("usa o authId fornecido (Auth Mirror Pattern â€” $id sincronizado)", async () => {
    account.create.mockResolvedValue({ $id: "custom-id-123" })

    await AuthService.register("custom-id-123", "Maria", "m@m.com", "Pass123")

    const call = account.create.mock.calls[0]
    // O primeiro argumento DEVE ser o authId â€” garante sincronizaÃ§Ã£o com Mirror
    expect(call[0]).toBe("custom-id-123")
  })
})

// â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
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

  it("retorna o token de recuperaÃ§Ã£o", async () => {
    const mockToken = { $id: "tok-001", expire: "2024-12-31" }
    account.createRecovery.mockResolvedValue(mockToken)

    const result = await AuthService.sendPasswordRecovery("u@u.com", "https://x.com")
    expect(result).toEqual(mockToken)
  })

  it("propaga erro quando e-mail nÃ£o estÃ¡ cadastrado", async () => {
    account.createRecovery.mockRejectedValue(
      new Error("user_not_found")
    )
    await expect(
      AuthService.sendPasswordRecovery("nao@existe.com", "https://x.com")
    ).rejects.toThrow("user_not_found")
  })

  it("propaga erro quando hÃ¡ rate limit do Appwrite", async () => {
    account.createRecovery.mockRejectedValue(new Error("rate_limit_exceeded"))
    await expect(
      AuthService.sendPasswordRecovery("u@u.com", "https://x.com")
    ).rejects.toThrow()
  })
})

// â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
describe("AuthService â€” Fluxo de Auth Mirror Pattern", () => {

  it("register usa ID externo para sincronizar com Mirror", async () => {
    // Este teste documenta o contrato do Auth Mirror Pattern:
    // O authId deve ser gerado FORA do AuthService e passado explicitamente,
    // para que o Mirror e o Auth compartilhem o mesmo $id.
    account.create.mockResolvedValue({ $id: "sync-id-999" })

    const externalId = "sync-id-999"
    await AuthService.register(externalId, "Carlos", "c@c.com", "Pass789")

    expect(account.create.mock.calls[0][0]).toBe(externalId)
  })

  it("login retorna a sessÃ£o sem acessar dados do perfil", async () => {
    // getUser e getUserMirror nÃ£o devem ser chamados durante o login â€”
    // o serviÃ§o sÃ³ cria a sessÃ£o. Dados de perfil ficam em userService.
    const mockSession = { $id: "sess-abc", userId: "user-abc" }
    account.createEmailPasswordSession.mockResolvedValue(mockSession)

    const sess = await AuthService.login("a@a.com", "Pass123")

    // account.get NÃƒO deve ser chamado durante o login
    expect(account.get).not.toHaveBeenCalled()
    expect(sess.$id).toBe("sess-abc")
  })
})


