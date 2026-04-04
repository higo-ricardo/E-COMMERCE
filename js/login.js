import { account } from "./db.js"
import { CONFIG } from "./config.js"
import {
  getMirrorByEmail,
  checkBlocked,
  recordFailedLogin as recordFail,
  recordSuccessLogin as recordSuccess,
  ensureMirrorForUser,
  redirectByRole,
} from "./userService.js"

// -- Partículas ----------------------------------------------------------------
;(function() {
  const cv = document.getElementById("canvas"); if (!cv) return
  const ctx = cv.getContext("2d"); let W, H
  const r = () => { W = cv.width = innerWidth; H = cv.height = innerHeight }
  r(); addEventListener("resize", r)
  const pts = Array.from({length:55}, () => ({
    x:Math.random()*2000, y:Math.random()*2000,
    vx:(Math.random()-.5)*.3, vy:(Math.random()-.5)*.3,
    r:Math.random()*1.4+.4, a:Math.random()*.5+.1
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
const btnLogin   = $("btnLogin")
const btnForgot  = $("btnForgot")
const eEmail     = $("email")
const ePass      = $("password")
const msgBox     = $("msgBox")
const cntdown    = $("countdown")
const stAuth     = $("statusAuth")
const stTry      = $("statusAttempts")
const dots       = [1,2,3,4,5].map(n => $("d"+n))

let busy = false
let uiTry = 0
let lockTimer = null

const setMsg = (txt, cls = "error") => {
  msgBox.textContent = txt
  msgBox.className = cls
}

function updateDots(n) {
  dots.forEach((d, i) => {
    d.className = "attempt-dot" + (i < n ? (n >= 5 ? " block" : " used") : "")
  })
  stTry.textContent = `[INFO] tentativas: ${n}/5`
}

function lockUI(ms) {
  btnLogin.disabled = true
  const until = Date.now() + ms
  clearInterval(lockTimer)

  lockTimer = setInterval(() => {
    const left = until - Date.now()
    if (left <= 0) {
      clearInterval(lockTimer)
      cntdown.textContent = ""
      btnLogin.disabled = false
      btnLogin.innerHTML = '<i class="fas fa-right-to-bracket"></i> ENTRAR'
      uiTry = 0
      updateDots(0)
      return
    }

    const m = Math.floor(left / 60000)
    const s = Math.floor((left % 60000) / 1000)
    cntdown.textContent = `Aguarde ${m}:${String(s).padStart(2, "0")}`
  }, 500)
}

// -- Auto-redirect se já logado ------------------------------------------------
;(async () => {
  try {
    const params = new URLSearchParams(window.location.search)
    const redirectUrl = params.get("redirect")
    const forceLogin = params.get("force") === "1"
    if (forceLogin) {
      await account.deleteSession("current").catch(() => {})
      stAuth.className = "warn"
      stAuth.textContent = "[INFO] sessao anterior encerrada"
      return
    }

    const user = await account.get()
    if (!user) return

    // Verifica se a sessão ainda é válida antes de redirecionar
    if (redirectUrl) {
      window.location.href = redirectUrl
      return
    }

    const mirror = await ensureMirrorForUser(user, await getMirrorByEmail(user.email))
    if (mirror && mirror.role) {
      redirectByRole(mirror.role)
    } else {
      // Sem mirror válido → limpa sessão e mostra formulário
      await account.deleteSession("current").catch(() => {})
      console.info("[LOGIN] Sessão sem mirror válido, exibindo formulário.")
    }
  } catch (err) {
    // Usuário não logado - comportamento esperado na página de login
    console.info("[LOGIN] Sessão não encontrada, exibindo formulário.")
  }
})()

// -- Login ---------------------------------------------------------------------
async function doLogin() {
  if (busy || btnLogin.disabled) return
  busy = true

  const email = eEmail.value.trim().toLowerCase()
  const pass = ePass.value

  setMsg("")
  cntdown.textContent = ""
  btnLogin.disabled = true

  if (!email || !pass) {
    setMsg("Preencha todos os campos.")
    btnLogin.disabled = false
    busy = false
    return
  }

  if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email)) {
    setMsg("E-mail com formato invalido.")
    btnLogin.disabled = false
    busy = false
    return
  }

  btnLogin.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Verificando...'

  const mirrorPre = await getMirrorByEmail(email)
  const blk = checkBlocked(mirrorPre)
  if (blk.blocked) {
    setMsg(blk.msg, "warning")
    btnLogin.innerHTML = '<i class="fas fa-lock"></i> BLOQUEADO'
    stAuth.className = "err"
    stAuth.textContent = "[BLOCK] conta: bloqueada"
    busy = false
    return
  }

  try {
    if (typeof account.createEmailPasswordSession === "function") {
      await account.createEmailPasswordSession(email, pass)
    } else {
      await account.createSession(email, pass)
    }

    const authUser = await account.get()
    const mirror = await ensureMirrorForUser(authUser, mirrorPre)
    await recordSuccess(authUser, mirror)

    stAuth.className = "ok"
    stAuth.textContent = "[OK] sessao: autenticada"
    setMsg("Acesso autorizado. Redirecionando...", "success")

    const params = new URLSearchParams(window.location.search)
    const redirectUrl = params.get("redirect")

    setTimeout(() => {
      if (redirectUrl) {
        window.location.href = redirectUrl
        return
      }

      if (mirror) redirectByRole(mirror.role)
      else window.location.href = "minha-conta.html"
    }, 700)
  } catch (err) {
    uiTry = Math.min(uiTry + 1, 5)
    updateDots(uiTry)

    stAuth.className = "err"
    stAuth.textContent = "[FAIL] autenticacao recusada"

    const updated = await recordFail(mirrorPre)
    const newBlk = checkBlocked(updated)

    if (newBlk.blocked) {
      setMsg(newBlk.msg, "warning")
      lockUI(CONFIG.AUTH?.UI_LOCK_MS ?? 15 * 60 * 1000)
    } else if (uiTry >= 5) {
      setMsg("Muitas tentativas. Aguarde 15 minutos.", "warning")
      lockUI(CONFIG.AUTH?.UI_LOCK_MS ?? 15 * 60 * 1000)
    } else {
      const failed = updated?.failedLogin ?? uiTry
      setMsg(err.code === 401
        ? `E-mail ou senha incorretos. (tentativa ${failed})`
        : "Erro: " + (err.message ?? "desconhecido"), "error")

      btnLogin.innerHTML = '<i class="fas fa-right-to-bracket"></i> ENTRAR'
      btnLogin.disabled = false
    }

    busy = false
  }
}

// -- Recuperação de senha ------------------------------------------------------
async function doForgotPassword(e) {
  e.preventDefault()
  const email = eEmail.value.trim().toLowerCase()

  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email)) {
    setMsg("Informe um e-mail valido no campo acima para recuperar a senha.", "warning")
    return
  }

  btnForgot.style.opacity = ".4"
  try {
    const redirectUrl = `${location.origin}/redefinir-senha.html`
    await account.createRecovery(email, redirectUrl)
    setMsg("E-mail de recuperacao enviado! Verifique sua caixa de entrada.", "success")
  } catch (err) {
    setMsg("Nao foi possivel enviar: " + (err.message ?? "erro desconhecido"), "error")
  } finally {
    btnForgot.style.opacity = "1"
  }
}

// -- Eventos -------------------------------------------------------------------
btnLogin.onclick = doLogin
btnForgot.onclick = doForgotPassword
ePass.onkeydown = e => { if (e.key === "Enter") doLogin() }
eEmail.onkeydown = e => { if (e.key === "Enter") ePass.focus() }

// -- Toggle visibilidade de senha -----------------------------------------------
document.querySelectorAll('.password-toggle').forEach(btn => {
  btn.addEventListener('click', () => {
    const input = document.getElementById(btn.dataset.target);
    if (!input) return;
    const isPassword = input.type === 'password';
    input.type = isPassword ? 'text' : 'password';
    const icon = btn.querySelector('i');
    icon.classList.toggle('fa-eye', !isPassword);
    icon.classList.toggle('fa-eye-slash', isPassword);
    btn.setAttribute('aria-label', isPassword ? 'Ocultar senha' : 'Mostrar senha');
  });
});
