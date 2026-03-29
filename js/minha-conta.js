import { CONFIG } from "./config.js"
import { Client, Databases, Account, Query } from "https://cdn.jsdelivr.net/npm/appwrite@13.0.0/+esm"

const CFG = {
  DB: CONFIG.DB,
  USERS: CONFIG.COL.USERS,
  ORDERS: CONFIG.COL.ORDERS,
  RECOVERY_URL: window.location.origin + "/login.html",
}

const client = new Client().setEndpoint(CONFIG.ENDPOINT).setProject(CONFIG.PROJECT_ID)
const databases = new Databases(client)
const account = new Account(client)

let mirror = null
let authUser = null

function normalizeRole(role) {
  return String(role ?? "").trim().toUpperCase()
}

function redirectByRole(role) {
  const normalized = normalizeRole(role)
  const map = {
    ADMIN: "dashboard.html",
    SELLER: "painel-vendas.html",
    USERS: "minha-conta.html",
    admin: "dashboard.html",
    vendedor: "painel-vendas.html",
    cliente: "minha-conta.html",
  }
  const target = map[normalized] ?? map[role] ?? "loja.html"
  if (target !== "minha-conta.html") {
    window.location.href = target
    return true
  }
  return false
}

async function getMirrorById(docId) {
  if (!docId) return null
  try {
    return await databases.getDocument(CFG.DB, CFG.USERS, docId)
  } catch {
    return null
  }
}

async function getMirrorByEmail(email) {
  if (!email) return null
  try {
    const res = await databases.listDocuments(CFG.DB, CFG.USERS, [
      Query.equal("email", email.toLowerCase()),
      Query.limit(1),
    ])
    return res.documents?.[0] ?? null
  } catch {
    return null
  }
}

async function createMirrorForUser(user) {
  if (!user?.$id || !user?.email) return null
  const payload = {
    name: user.name || "",
    email: String(user.email).toLowerCase(),
    role: "USERS",
    isActive: true,
    isVerified: Boolean(user.emailVerification),
    loginCounter: 0,
    failedLogin: 0,
    district: "CENTRO",
    city: "CHAPADINHA",
    state: "MA",
    cep: 65500000,
  }
  try {
    return await databases.createDocument(CFG.DB, CFG.USERS, user.$id, payload)
  } catch (err) {
    console.warn("[Minha Conta] Nao foi possivel criar mirror automaticamente:", err?.message || err)
    return null
  }
}

async function ensureMirrorForCurrentUser() {
  const byId = await getMirrorById(authUser?.$id)
  if (byId) return byId

  const byEmail = await getMirrorByEmail(authUser?.email)
  if (byEmail) return byEmail

  return createMirrorForUser(authUser)
}

function esc(s) {
  return String(s ?? "").replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;")
}

let toastT
function toast(msg, type = "") {
  const el = document.getElementById("toast")
  el.textContent = msg
  el.className = "toast show" + (type ? " " + type : "")
  clearTimeout(toastT)
  toastT = setTimeout(() => el.classList.remove("show"), 3500)
}

function fmtDate(iso) {
  return iso ? new Date(iso).toLocaleDateString("pt-BR") : "-"
}

function fmtBRL(v) {
  return "R$ " + Number(v || 0).toFixed(2).replace(".", ",")
}

function maskCpf(v) {
  return v
    .replace(/\D/g, "")
    .replace(/(\d{3})(\d)/, "$1.$2")
    .replace(/(\d{3})(\d)/, "$1.$2")
    .replace(/(\d{3})(\d{1,2})$/, "$1-$2")
}

function maskPhone(v) {
  return v
    .replace(/\D/g, "")
    .replace(/^(\d{3})(\d)/, "($1) $2")
    .replace(/(\d{5})(\d)/, "$1-$2")
    .slice(0, 16)
}

function maskCep(v) {
  return v.replace(/\D/g, "").replace(/(\d{5})(\d)/, "$1-$2").slice(0, 9)
}

function digitsOnly(v) {
  return String(v ?? "").replace(/\D/g, "")
}

function parseAddressNumberOrThrow(value) {
  const raw = String(value ?? "").trim()
  if (!raw) return null
  if (!/^\d+$/.test(raw)) {
    throw new Error("Numero do endereco invalido. Use apenas digitos inteiros.")
  }
  const parsed = Number.parseInt(raw, 10)
  if (parsed < 0 || parsed > 10000) {
    throw new Error("Numero do endereco deve estar entre 0 e 10000.")
  }
  return parsed
}

function isValidCpf(cpf) {
  const d = digitsOnly(cpf)
  if (!/^\d{11}$/.test(d)) return false
  if (/^(\d)\1{10}$/.test(d)) return false

  const calcDigit = (base, factor) => {
    let total = 0
    for (let i = 0; i < base.length; i += 1) {
      total += Number(base[i]) * (factor - i)
    }
    const rest = (total * 10) % 11
    return rest === 10 ? 0 : rest
  }

  const d1 = calcDigit(d.slice(0, 9), 10)
  const d2 = calcDigit(d.slice(0, 10), 11)
  return d1 === Number(d[9]) && d2 === Number(d[10])
}

function isValidMobile(mobile) {
  const d = digitsOnly(mobile)
  return /^\d{12}$/.test(d)
}

function fillFormFromMirror() {
  const source = mirror ?? {}
  document.getElementById("pNome").value = source.name || authUser?.name || ""
  document.getElementById("pEmail").value = source.email || authUser?.email || ""
  document.getElementById("pCpf").value = source.cpf ? maskCpf(String(source.cpf)) : ""
  document.getElementById("pCelular").value = source.mobile || ""

  document.getElementById("eAddress").value = source.address || ""
  document.getElementById("eNumber").value = source.number ?? ""
  document.getElementById("eComplement").value = source.complement || ""
  document.getElementById("eDistrict").value = source.district || ""
  document.getElementById("eCep").value = source.cep ? String(source.cep).replace(/(\d{5})(\d)/, "$1-$2") : ""
  document.getElementById("eCity").value = source.city || ""
  document.getElementById("eState").value = source.state || ""
  document.getElementById("sEmail").value = source.email || authUser?.email || ""
  document.getElementById("statLogins").textContent = source.loginCounter || 0
}

function setProfileError(msg, targetId = "perfilError") {
  const el = document.getElementById(targetId)
  el.textContent = msg
  el.style.display = msg ? "block" : "none"
}

;(async () => {
  try {
    authUser = await account.get()
  } catch {
    window.location.href = "login.html"
    return
  }

  mirror = await ensureMirrorForCurrentUser()
  if (mirror && redirectByRole(mirror.role)) return

  if (!mirror) {
    toast("Perfil local indisponivel. Tente sair e entrar novamente.", "error")
  }

  init()
})()

async function init() {
  const nome = mirror?.name || authUser?.name || "CLIENTE"
  document.getElementById("heroNome").textContent = nome.split(" ")[0].toUpperCase()
  document.getElementById("heroSub").textContent =
    (mirror?.email || authUser?.email || "") + (mirror?.city ? " - " + mirror.city : "")

  document.querySelectorAll(".tab").forEach((tab) => {
    tab.addEventListener("click", () => {
      document.querySelectorAll(".tab").forEach((t) => t.classList.remove("active"))
      document.querySelectorAll(".tab-panel").forEach((p) => {
        p.style.display = "none"
      })
      tab.classList.add("active")
      const id = "tab-" + tab.dataset.tab
      document.getElementById(id).style.display = "block"
      if (tab.dataset.tab === "pedidos") loadPedidos()
    })
  })

  const doLogout = async () => {
    await account.deleteSession("current").catch(() => {})
    window.location.href = "login.html"
  }
  document.getElementById("logoutBtn").addEventListener("click", (e) => {
    e.preventDefault()
    doLogout()
  })
  document.getElementById("btnLogout").addEventListener("click", doLogout)

  fillFormFromMirror()

  document.getElementById("pCpf").addEventListener("input", (e) => {
    e.target.value = maskCpf(e.target.value)
  })
  document.getElementById("pCelular").addEventListener("input", (e) => {
    e.target.value = maskPhone(e.target.value)
  })
  document.getElementById("eCep").addEventListener("input", (e) => {
    e.target.value = maskCep(e.target.value)
  })

  document.getElementById("btnSalvarPerfil").addEventListener("click", async () => {
    setProfileError("")
    mirror = mirror ?? (await ensureMirrorForCurrentUser())
    if (!mirror) {
      setProfileError("Nao foi possivel localizar seu perfil no banco. Saia e entre novamente.")
      return
    }

    const btn = document.getElementById("btnSalvarPerfil")
    btn.disabled = true
    btn.innerHTML =
      '<span style="width:14px;height:14px;border:2px solid var(--black);border-top-color:transparent;border-radius:50%;animation:spin .6s linear infinite;display:inline-block"></span>'

    try {
      const inputEmail = document.getElementById("pEmail").value.trim().toLowerCase()
      const currentEmail = String(authUser?.email || "").toLowerCase()

      if (inputEmail && inputEmail !== currentEmail) {
        const password = window.prompt("Para alterar e-mail, confirme sua senha atual:")
        if (!password) {
          throw new Error("Senha obrigatoria para alterar o e-mail.")
        }
        await account.updateEmail(inputEmail, password)
        authUser = await account.get()
      }

      const cpfDigits = digitsOnly(document.getElementById("pCpf").value)
      if (cpfDigits && !isValidCpf(cpfDigits)) {
        throw new Error("CPF invalido. Verifique os 11 digitos.")
      }
      const mobileDigits = digitsOnly(document.getElementById("pCelular").value)
      if (mobileDigits && !isValidMobile(mobileDigits)) {
        throw new Error("Celular invalido. Use DDD de 3 digitos + telefone de 9 digitos (12 no total).")
      }

      mirror = await databases.updateDocument(CFG.DB, CFG.USERS, mirror.$id, {
        name: document.getElementById("pNome").value.trim(),
        email: (document.getElementById("pEmail").value.trim() || authUser.email).toLowerCase(),
        cpf: cpfDigits || null,
        mobile: mobileDigits || null,
      })
      fillFormFromMirror()
      toast("Perfil atualizado com sucesso.")
    } catch (e) {
      setProfileError(e.message)
    } finally {
      btn.disabled = false
      btn.innerHTML = "<i class='fas fa-floppy-disk'></i> Salvar Alteracoes"
    }
  })

  document.getElementById("btnSalvarEndereco").addEventListener("click", async () => {
    setProfileError("", "enderecoError")
    mirror = mirror ?? (await ensureMirrorForCurrentUser())
    if (!mirror) {
      setProfileError("Nao foi possivel localizar seu endereco no banco.", "enderecoError")
      return
    }

    const btn = document.getElementById("btnSalvarEndereco")
    btn.disabled = true
    btn.innerHTML =
      '<span style="width:14px;height:14px;border:2px solid var(--black);border-top-color:transparent;border-radius:50%;animation:spin .6s linear infinite;display:inline-block"></span>'
    try {
      const cepRaw = document.getElementById("eCep").value.replace(/\D/g, "")
      const addressNumber = parseAddressNumberOrThrow(document.getElementById("eNumber").value)
      mirror = await databases.updateDocument(CFG.DB, CFG.USERS, mirror.$id, {
        address: document.getElementById("eAddress").value.trim() || null,
        number: addressNumber,
        complement: document.getElementById("eComplement").value.trim() || null,
        district: document.getElementById("eDistrict").value.trim() || null,
        cep: cepRaw ? +cepRaw : null,
        city: document.getElementById("eCity").value.trim() || null,
        state: document.getElementById("eState").value.trim().toUpperCase() || null,
      })
      fillFormFromMirror()
      toast("Endereco salvo com sucesso.")
    } catch (e) {
      setProfileError(e.message, "enderecoError")
    } finally {
      btn.disabled = false
      btn.innerHTML = "<i class='fas fa-floppy-disk'></i> Salvar Endereco"
    }
  })

  document.getElementById("btnResetSenha").addEventListener("click", async () => {
    const email = mirror?.email || authUser?.email
    if (!email) return
    try {
      await account.createRecovery(email, CFG.RECOVERY_URL)
      const el = document.getElementById("senhaMsg")
      el.textContent = "Link enviado para " + email + ". Verifique sua caixa de entrada."
      el.style.color = "var(--green)"
      el.style.display = "block"
    } catch (e) {
      const el = document.getElementById("senhaMsg")
      el.textContent = "Erro: " + e.message
      el.style.color = "var(--red)"
      el.style.display = "block"
    }
  })

  loadPedidos()
}

async function loadPedidos() {
  const container = document.getElementById("pedidosList")
  try {
    const email = mirror?.email || authUser?.email
    const queries = [Query.orderDesc("$createdAt"), Query.limit(20)]
    if (email) queries.push(Query.equal("email", email))

    const res = await databases.listDocuments(CFG.DB, CFG.ORDERS, queries)
    const orders = res.documents

    const totalGasto = orders.reduce((sum, order) => sum + Number(order.total || 0), 0)
    document.getElementById("statPedidos").textContent = orders.length
    document.getElementById("statTotal").textContent = fmtBRL(totalGasto)
    document.getElementById("heroStats").style.display = "flex"

    if (!orders.length) {
      container.innerHTML = `<div style="color:var(--muted);padding:40px;text-align:center">
        <i class="fas fa-box-open" style="font-size:32px;display:block;margin-bottom:12px;color:var(--border)"></i>
        Voce ainda nao fez nenhum pedido.
        <div style="margin-top:16px"><a href="loja.html" class="btn btn-primary" style="display:inline-flex">
          <i class="fas fa-store"></i> Ver Produtos
        </a></div>
      </div>`
      return
    }

    const stClass = (s) => {
      if (s === "cancelado") return "st-cancelado"
      if (s === "entregue") return "st-entregue"
      if (s === "novo") return "st-novo"
      return "st-default"
    }

    container.innerHTML = orders
      .map((o) => {
        let items = []
        try {
          items = JSON.parse(o.items || "[]")
        } catch {}
        return `<div class="accordion" id="acc-${o.$id}">
        <div class="accordion-head" onclick="toggleAcc('${o.$id}')">
          <div>
            <div style="font-weight:600;font-size:14px">Pedido #${o.$id.slice(-6).toUpperCase()}</div>
            <div style="font-size:12px;color:var(--muted)">${fmtDate(o.$createdAt)} - ${fmtBRL(o.total)}</div>
          </div>
          <div style="display:flex;align-items:center;gap:12px">
            <span class="order-status ${stClass(o.status)}">${o.status || "novo"}</span>
            <i class="fas fa-chevron-down acc-icon"></i>
          </div>
        </div>
        <div class="accordion-body">
          ${
            items.length
              ? `<table style="width:100%;border-collapse:collapse;font-size:13px;margin-bottom:12px">
            <thead><tr>
              <th style="text-align:left;padding:6px 0;font-size:10px;letter-spacing:.15em;text-transform:uppercase;color:var(--muted);border-bottom:1px solid var(--border)">Produto</th>
              <th style="text-align:right;padding:6px 0;font-size:10px;letter-spacing:.15em;text-transform:uppercase;color:var(--muted);border-bottom:1px solid var(--border)">Qtd</th>
              <th style="text-align:right;padding:6px 0;font-size:10px;letter-spacing:.15em;text-transform:uppercase;color:var(--muted);border-bottom:1px solid var(--border)">Subtotal</th>
            </tr></thead>
            <tbody>${items
              .map(
                (i) => `<tr>
              <td style="padding:8px 0;border-bottom:1px solid rgba(255,255,255,.04)">${esc(i.name || "-")}</td>
              <td style="text-align:right;padding:8px 0;border-bottom:1px solid rgba(255,255,255,.04);color:var(--muted)">${i.qty || 1}</td>
              <td style="text-align:right;padding:8px 0;border-bottom:1px solid rgba(255,255,255,.04);color:var(--green)">${fmtBRL((i.price || 0) * (i.qty || 1))}</td>
            </tr>`
              )
              .join("")}</tbody>
          </table>`
              : ""
          }
          <div style="display:flex;justify-content:flex-end;gap:24px;font-size:12px;color:var(--muted)">
            <span>Subtotal: ${fmtBRL(o.subtotal)}</span>
            <span>Impostos: ${fmtBRL(o.taxes)}</span>
            <span>Frete: ${fmtBRL(o.frete)}</span>
            <span style="color:var(--green);font-weight:700;font-size:14px">Total: ${fmtBRL(o.total)}</span>
          </div>
        </div>
      </div>`
      })
      .join("")
  } catch (e) {
    container.innerHTML = `<div style="color:var(--red);padding:20px">Erro ao carregar pedidos: ${e.message}</div>`
  }
}

window.toggleAcc = (id) => {
  const el = document.getElementById("acc-" + id)
  el?.classList.toggle("open")
}

