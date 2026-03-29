// ─── HIVERCAR · errorService.js ──────────────────────────────────────────────
// US-24: Tratamento de erros centralizado.
// Substitui todos os catch silenciosos por comportamento explícito.
//
// REGRAS:
//   1. NUNCA catch vazio — sempre chamar ErrorService.handle(err, contexto)
//   2. Toast para erros de UX (rede, validação, permissão)
//   3. console.error estruturado com contexto + código HTTP
//   4. Diferenciação 401 / 403 / 404 / rede na UI
//   5. Redireciona para page-error.html apenas em falhas críticas (5xx)
//
// USO:
//   try { ... }
//   catch (err) { ErrorService.handle(err, "OrderService.placeOrder") }

// ── Toast container (injetado uma vez no DOM) ─────────────────────────────────
function ensureToastContainer() {
  if (document.getElementById("hv-toast-root")) return
  const el = document.createElement("div")
  el.id = "hv-toast-root"
  el.style.cssText = `
    position:fixed; bottom:24px; right:24px; z-index:99999;
    display:flex; flex-direction:column-reverse; gap:10px;
    pointer-events:none;
  `
  document.body.appendChild(el)
}

/** Exibe um toast com nível visual definido. */
function showToast(message, level = "error", duration = 5000) {
  ensureToastContainer()
  const root = document.getElementById("hv-toast-root")

  const colors = {
    error:   { bg: "#1a0a0a", border: "#f87171", icon: "⛔" },
    warning: { bg: "#1a1500", border: "#facc15", icon: "⚠️" },
    info:    { bg: "#0a1a10", border: "#26fd71", icon: "ℹ️" },
    network: { bg: "#0d0d1a", border: "#818cf8", icon: "📡" },
  }
  const c = colors[level] ?? colors.error

  const toast = document.createElement("div")
  toast.style.cssText = `
    background:${c.bg};
    border:1px solid ${c.border};
    border-left:4px solid ${c.border};
    color:#f1f5f9;
    font-family:'Barlow',sans-serif;
    font-size:13px;
    padding:12px 16px;
    border-radius:6px;
    max-width:340px;
    pointer-events:all;
    box-shadow:0 4px 16px rgba(0,0,0,.4);
    animation:hvToastIn .25s ease;
    line-height:1.4;
  `
  // ✅ XSS FIX: Escapar message, usar textContent para conteúdo dinâmico
  const iconSpan = document.createElement("span")
  iconSpan.style.marginRight = "8px"
  iconSpan.textContent = c.icon
  const msgSpan = document.createElement("span")
  msgSpan.textContent = message
  toast.appendChild(iconSpan)
  toast.appendChild(msgSpan)

  // Animação inline
  if (!document.getElementById("hv-toast-style")) {
    const style = document.createElement("style")
    style.id = "hv-toast-style"
    style.textContent = `
      @keyframes hvToastIn  { from { opacity:0; transform:translateY(12px) } to { opacity:1; transform:none } }
      @keyframes hvToastOut { from { opacity:1 } to { opacity:0; transform:translateY(12px) } }
    `
    document.head.appendChild(style)
  }

  root.appendChild(toast)
  setTimeout(() => {
    toast.style.animation = "hvToastOut .25s ease forwards"
    setTimeout(() => toast.remove(), 260)
  }, duration)
}

// ── Inline field error ────────────────────────────────────────────────────────
/**
 * Marca um campo com erro inline (borda vermelha + mensagem).
 * @param {string|HTMLElement} fieldOrId  ID ou referência ao input
 * @param {string} message               Mensagem de erro
 */
export function fieldError(fieldOrId, message) {
  const el = typeof fieldOrId === "string" ? document.getElementById(fieldOrId) : fieldOrId
  if (!el) return
  el.style.borderColor = "var(--red, #f87171)"
  el.style.boxShadow   = "0 0 0 2px rgba(248,113,113,.25)"

  // Mensagem abaixo do campo
  let msg = el.parentElement?.querySelector(".hv-field-error")
  if (!msg) {
    msg = document.createElement("span")
    msg.className = "hv-field-error"
    msg.style.cssText = "color:#f87171;font-size:11px;display:block;margin-top:4px;font-family:'Barlow',sans-serif"
    el.insertAdjacentElement("afterend", msg)
  }
  msg.textContent = message

  // Remove ao digitar
  const clear = () => { clearFieldError(el); el.removeEventListener("input", clear) }
  el.addEventListener("input", clear)
}

/** Remove estilo de erro de um campo. */
export function clearFieldError(fieldOrId) {
  const el = typeof fieldOrId === "string" ? document.getElementById(fieldOrId) : fieldOrId
  if (!el) return
  el.style.borderColor = ""
  el.style.boxShadow   = ""
  el.parentElement?.querySelector(".hv-field-error")?.remove()
}

// ── Mensagem de erro de http ─────────────────────────────────────────────────
function httpMessage(code) {
  const msgs = {
    400: "Requisição inválida. Verifique os dados enviados.",
    401: "Sessão expirada. Faça login novamente.",
    403: "Você não tem permissão para realizar esta ação.",
    404: "Recurso não encontrado.",
    408: "Tempo de conexão esgotado. Tente novamente.",
    409: "Conflito: este registro já existe.",
    422: "Dados inválidos. Verifique os campos e tente novamente.",
    429: "Muitas requisições. Aguarde alguns instantes.",
    500: "Erro interno do servidor. Tente novamente mais tarde.",
    502: "Serviço temporariamente indisponível.",
    503: "Serviço em manutenção. Tente novamente em breve.",
  }
  return msgs[code] ?? `Erro inesperado (código ${code}).`
}

// ── Handler principal ─────────────────────────────────────────────────────────
/**
 * Trata um erro de forma explícita e consistente.
 *
 * @param {Error|any}  err       Erro capturado no catch
 * @param {string}     context   Nome do módulo/função (ex: "OrderService.placeOrder")
 * @param {object}     options
 *   @param {boolean}  options.silent    true → não exibe toast (apenas loga)
 *   @param {boolean}  options.critical  true → redireciona para page-error.html em 5xx
 *   @param {string}   options.fallback  Mensagem alternativa se não houver http code
 */
export function handleError(err, context = "desconhecido", options = {}) {
  const { silent = false, critical = false, fallback } = options

  // ── Extrair código HTTP ──────────────────────────────────────────────────
  const code = err?.code ?? err?.status ?? err?.response?.status ?? null

  // ── Log estruturado ──────────────────────────────────────────────────────
  console.error(`[HIVERCAR ERROR] ${context}`, {
    message: err?.message ?? String(err),
    code,
    type:    err?.type ?? typeof err,
    stack:   err?.stack ?? null,
    ts:      new Date().toISOString(),
  })

  if (silent) return

  // ── Mensagem para o usuário ──────────────────────────────────────────────
  let userMsg
  let toastLevel = "error"

  // Sem conexão
  if (!navigator.onLine || err instanceof TypeError && /fetch|network/i.test(err.message)) {
    userMsg    = "Sem conexão com a internet. Verifique sua rede."
    toastLevel = "network"
  }
  // Código HTTP reconhecido
  else if (code) {
    userMsg = httpMessage(code)
    if (code === 401) toastLevel = "warning"
    if (code === 403) toastLevel = "warning"
    if (code === 404) toastLevel = "info"
  }
  // Mensagem do erro (limpa — sem stack)
  else if (err?.message) {
    userMsg = fallback ?? err.message
  }
  else {
    userMsg = fallback ?? "Ocorreu um erro inesperado. Tente novamente."
  }

  showToast(userMsg, toastLevel)

  // ── Ação especial por código ─────────────────────────────────────────────
  if (code === 401) {
    setTimeout(() => { window.location.href = "login.html" }, 2500)
    return
  }
  if (critical && code >= 500) {
    setTimeout(() => {
      window.location.href = `page-error.html?code=${code}&ctx=${encodeURIComponent(context)}`
    }, 2500)
  }
}

// ── Atalhos de toast ─────────────────────────────────────────────────────────
/** Toast de sucesso verde. */
export const toastSuccess = (msg, dur = 4000) => showToast(msg, "info", dur)
/** Toast de aviso amarelo. */
export const toastWarn    = (msg, dur = 5000) => showToast(msg, "warning", dur)
/** Toast de erro vermelho. */
export const toastError   = (msg, dur = 5000) => showToast(msg, "error", dur)
/** Toast de rede roxo. */
export const toastNetwork = (msg, dur = 5000) => showToast(msg, "network", dur)

// ── Exportação agrupada ───────────────────────────────────────────────────────
export const ErrorService = {
  handle:         handleError,
  fieldError,
  clearFieldError,
  toastSuccess,
  toastWarn,
  toastError,
  toastNetwork,
}
