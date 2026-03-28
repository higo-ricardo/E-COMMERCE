import { Client, Account, Databases, ID } from "https://cdn.jsdelivr.net/npm/appwrite@13.0.0/+esm"
import { CONFIG } from "./config.js"

// -- Appwrite ------------------------------------------------------------------
const client    = new Client().setEndpoint(CONFIG.ENDPOINT).setProject(CONFIG.PROJECT_ID)
const account   = new Account(client)
const databases = new Databases(client)

// -- Partículas ----------------------------------------------------------------
;(function() {
  const cv = document.getElementById("canvas"); if (!cv) return
  const ctx = cv.getContext("2d"); let W, H
  const r = () => { W = cv.width = innerWidth; H = cv.height = innerHeight }
  r(); addEventListener("resize", r)
  const pts = Array.from({length:40}, () => ({
    x:Math.random()*2000, y:Math.random()*2000,
    vx:(Math.random()-.5)*.3, vy:(Math.random()-.5)*.3,
    r:Math.random()*1.2+.3, a:Math.random()*.4+.1
  }));
  (function loop() {
    ctx.clearRect(0,0,W,H)
    pts.forEach(p => {
      p.x+=p.vx; p.y+=p.vy
      if(p.x<0)p.x=W; if(p.x>W)p.x=0
      if(p.y<0)p.y=H; if(p.y>H)p.y=0
      ctx.beginPath(); ctx.arc(p.x,p.y,p.r,0,Math.PI*2)
      ctx.fillStyle=`rgba(38,253,113,${p.a})`; ctx.fill()
    }); requestAnimationFrame(loop)
  })()
})()

// -- DOM ------------------------------------------------------------------------
const $ = id => document.getElementById(id)
const msgBox = $("msgBox")

const setMsg = (txt, cls="error") => {
  msgBox.textContent = txt; msgBox.className = cls
  msgBox.scrollIntoView({ behavior: "smooth", block: "nearest" })
}

function messageForMirrorError(err) {
  const code = err?.code
  const msg  = String(err?.message || "")

  if (!navigator.onLine || /network|failed to fetch|cors/i.test(msg)) {
    return { text: "Sem conexão com o servidor. Verifique sua internet e tente novamente.", cls: "warning" }
  }
  if (code === 401 || code === 403) {
    return { text: "Sem permissão para salvar o perfil no banco. No Appwrite, libere CREATE na collection USERS para usuários autenticados (role:users), ou mova esse passo para uma Function.", cls: "error" }
  }
  if (code === 409) {
    return { text: "Já existe um perfil com este identificador. Tente novamente.", cls: "warning" }
  }
  if (/Unknown attribute/i.test(msg)) {
    return { text: "A estrutura da collection USERS está diferente do esperado. Ajuste o schema no Appwrite.", cls: "error" }
  }
  if (/invalid format/i.test(msg)) {
    return { text: "Um ou mais campos estão em formato inválido para a collection USERS.", cls: "error" }
  }
  if (code === 429) {
    return { text: "Muitas tentativas em sequência. Aguarde alguns segundos e tente novamente.", cls: "warning" }
  }
  return { text: "Não foi possível salvar os dados do perfil. Tente novamente.", cls: "error" }
}

function messageForAuthError(err) {
  const code = err?.code
  const msg  = String(err?.message || "")

  if (!navigator.onLine || /network|failed to fetch|cors/i.test(msg)) {
    return { text: "Sem conexão com o servidor de autenticação. Tente novamente.", cls: "warning" }
  }
  if (code === 409) {
    return { text: "Este e-mail já está registrado no sistema. Faça login ou recupere a senha.", cls: "warning" }
  }
  if (code === 400 && /password/i.test(msg)) {
    return { text: "A senha não atende às regras do Auth. Use ao menos 8 caracteres com letras e números.", cls: "error" }
  }
  if (code === 429) {
    return { text: "Muitas tentativas de cadastro. Aguarde um momento e tente novamente.", cls: "warning" }
  }
  if (code === 401 || code === 403) {
    return { text: "Projeto sem permissão para criar usuário no Auth. Verifique a configuração do Appwrite.", cls: "error" }
  }
  return { text: "Não foi possível criar sua conta de acesso. Tente novamente.", cls: "error" }
}

// -- Validadores ---------------------------------------------------------------
const isEmail = e  => /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(e)
const normEmail = e => e.trim().toLowerCase()

function validatePass(p) {
  if (p.length < 8)         return { ok:false, msg:"Mínimo 8 caracteres." }
  if (!/[a-zA-Z]/.test(p)) return { ok:false, msg:"Deve conter letras." }
  if (!/[0-9]/.test(p))    return { ok:false, msg:"Deve conter números." }
  return { ok:true }
}

function passStrength(p) {
  let score = 0
  if (p.length >= 8)  score++
  if (p.length >= 12) score++
  if (/[A-Z]/.test(p) && /[0-9]/.test(p)) score++
  if (/[^a-zA-Z0-9]/.test(p)) score++
  return score
}

// -- Barra de força ------------------------------------------------------------
$("password").addEventListener("input", () => {
  const val = $("password").value
  const score = passStrength(val)
  const labels = ["", "Fraca", "Razoável", "Boa", "Forte"]
  const cls    = ["", "weak",  "medium",   "strong", "strong"]
  const active = Math.min(score, 3)
  ;[1,2,3].forEach(i => {
    const seg = $("seg"+i)
    seg.className = "strength-seg" + (i <= active && val.length > 0 ? " " + cls[score] : "")
  })
  $("strengthTxt").textContent = val.length === 0 ? "Informe uma senha" : (labels[score] || "Fraca")
})

// -- Máscara CPF ----------------------------------------------------------------
$("cpf").addEventListener("input", e => {
  let v = e.target.value.replace(/\D/g,"").slice(0,11)
  if (v.length > 9) v = v.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/,"$1.$2.$3-$4")
  else if (v.length > 6) v = v.replace(/(\d{3})(\d{3})(\d+)/,"$1.$2.$3")
  else if (v.length > 3) v = v.replace(/(\d{3})(\d+)/,"$1.$2")
  e.target.value = v
})

// -- Máscara celular ------------------------------------------------------------
$("mobile").addEventListener("input", e => {
  let v = e.target.value.replace(/\D/g,"").slice(0,11)
  if (v.length > 7) v = v.replace(/(\d{2})(\d{5})(\d+)/,"($1) $2-$3")
  else if (v.length > 2) v = v.replace(/(\d{2})(\d+)/,"($1) $2")
  e.target.value = v
})

// -- Máscara CEP ----------------------------------------------------------------
$("cep").addEventListener("input", e => {
  let v = e.target.value.replace(/\D/g,"").slice(0,8)
  if (v.length > 5) v = v.replace(/(\d{5})(\d+)/,"$1-$2")
  e.target.value = v
})

async function createSessionForNewUser(email, password) {
  try {
    if (typeof account.createEmailPasswordSession === "function") {
      await account.createEmailPasswordSession(email, password)
      return
    }
    await account.createSession(email, password)
  } catch (err) {
    if (err?.code === 409) return
    throw err
  }
}

// -- Criação do Mirror com fallback para schema divergente ---------------------
async function createMirrorWithSchemaFallback(docId, payload) {
  const data = { ...payload }

  for (let i = 0; i < 10; i++) {
    try {
      return await databases.createDocument(CONFIG.DB, CONFIG.COL.USERS, docId, data)
    } catch (err) {
      const msg = String(err?.message || "")
      const m = msg.match(/Unknown attribute:\s*"([^"]+)"/i)
      if (m && Object.prototype.hasOwnProperty.call(data, m[1])) {
        console.warn(`[Cadastro] atributo não existe no schema e será removido: ${m[1]}`)
        delete data[m[1]]
        continue
      }
      if (/Attribute\s+"role"\s+has\s+invalid\s+format/i.test(msg) && Object.prototype.hasOwnProperty.call(data, "role")) {
        console.warn("[Cadastro] role inválido para este schema; ajustando para USERS")
        data.role = "USERS"
        continue
      }
      throw err
    }
  }

  throw new Error("Falha ao adaptar payload ao schema da collection USERS.")
}
// -- CADASTRO -------------------------------------------------------------------
let busy = false

async function doCadastro() {
  if (busy) return
  busy = true

  const btn = $("btnCadastrar")
  setMsg("")
  btn.disabled = true
  btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Processando...'

  // Coleta valores
  const name      = $("name").value.trim()
  const email     = normEmail($("email").value)
  const password  = $("password").value
  const confirm   = $("confirm").value
  const cpfRaw    = $("cpf").value.replace(/\D/g,"")
  const mobileRaw = $("mobile").value.replace(/\D/g,"")
  const dayBirth  = $("dayBirth").value || null
  const address   = $("address").value.trim() || null
  const number    = parseInt($("number").value) || null
  const district  = $("district").value.trim() || "CENTRO"
  const complement= $("complement").value.trim() || null
  const city      = $("city").value.trim() || "CHAPADINHA"
  const state     = $("state").value || "MA"
  const cepRaw    = $("cep").value.replace(/\D/g,"")
  const termos    = $("chkTermos").checked

  // -- Validações --------------------------------------------------------------
  if (!name) {
    setMsg("Nome é obrigatório."); reset(); return
  }
  if (!isEmail(email)) {
    setMsg("E-mail com formato inválido."); reset(); return
  }
  const passCheck = validatePass(password)
  if (!passCheck.ok) {
    setMsg("Senha inválida: " + passCheck.msg); reset(); return
  }
  if (password !== confirm) {
    setMsg("As senhas não coincidem."); reset(); return
  }
  if (!termos) {
    setMsg("Você deve aceitar os Termos de Uso."); reset(); return
  }

  // -- Gera ID compartilhado entre Auth e Mirror -------------------------------
  const authId = ID.unique()

  // -- PASSO 1: cria no Auth (fonte única para duplicidade de e-mail) ----------
  try {
    await account.create(authId, email, password, name)
  } catch (err) {
    console.error("Auth create error:", err)
    const m = messageForAuthError(err)
    setMsg(m.text, m.cls)
    reset(); return
  }

  // Necessário para CREATE no banco quando a collection USERS permite role:users.
  try {
    await createSessionForNewUser(email, password)
  } catch (err) {
    console.error("Session create error:", err)
    setMsg("Conta criada, mas não foi possível iniciar sessão para finalizar o perfil. Faça login e complete seu cadastro.", "warning")
    reset(); return
  }


  // -- PASSO 2: cria Mirror (perfil) -------------------------------------------
  try {
    await createMirrorWithSchemaFallback(authId, {
      name,
      email,
      cpf:          cpfRaw ? parseInt(cpfRaw) : null,
      mobile:       mobileRaw ? parseInt(mobileRaw) : null,
      dayBirth:     dayBirth ?? null,
      isActive:     true,
      isVerified:   false,
      role:         "USERS",
      company:      null,
      lastLogin:    null,
      loginCounter: 0,
      lastIP:       null,
      address,
      district,
      number,
      complement,
      city,
      state,
      country:      "BRASIL",
      cep:          cepRaw ? parseInt(cepRaw) : 65500000,
      failedLogin:  0,
      blockedUntil: null,
    })
  } catch (err) {
    console.error("Mirror create error:", err)
    // A conta no Auth foi criada; avisamos para login e suporte, evitando falso "e-mail já existe".
    setMsg("Conta criada no acesso, mas houve falha ao salvar seu perfil. Tente fazer login e, se necessário, contate o suporte.", "warning")
    reset(); return
  }

  // -- Sucesso ------------------------------------------------------------------
  setMsg("Conta criada com sucesso! Redirecionando para o login...", "success")
  btn.innerHTML = '<i class="fas fa-check"></i> CADASTRADO!'

  setTimeout(() => { window.location.href = "login.html" }, 1800)
}
function reset() {
  const btn = $("btnCadastrar")
  btn.disabled  = false
  btn.innerHTML = '<i class="fas fa-user-plus"></i> CRIAR CONTA'
  busy = false
}

$("btnCadastrar").onclick = doCadastro
$("confirm").onkeydown = e => { if (e.key === "Enter") doCadastro() }



