// ─── HIVERCAR · utils.js ─────────────────────────────────────────────────────
// Utilitários puros compartilhados entre ERP e Loja.
// Sem dependências de projeto — pode ser importado por qualquer módulo.
//
// US-47: Integração Sentry para monitoramento de erros em produção.
//   - initSentry(dsn, release?)  → inicializa o SDK via CDN
//   - captureError(err, context) → envia erro com contexto estruturado
//   - addSentryContext(user)     → associa usuário logado ao Sentry
//   - clearSentryContext()       → limpa contexto no logout

// ─────────────────────────────────────────────────────────────────────────────
// FORMATADORES
// ─────────────────────────────────────────────────────────────────────────────

/** Gera número sequencial único para pedido. Formato: YYMMDDHHmmss + 4 dígitos aleatórios.
 *  Exemplo: 26033014324501234
 *  Armazenado em `orders.number` como INTEGER.
 *  JUSTIFICATIVA: Função pura, sem dependências, reutilizável. Timestamp garante
 *  unicidade crescente + tail aleatório previne colisões em requisições simultâneas.
 */
export function generateOrderNumber() {
  const now = new Date()
  const yy  = now.getFullYear().toString().slice(-2)
  const mm  = String(now.getMonth() + 1).padStart(2, '0')
  const dd  = String(now.getDate()).padStart(2, '0')
  const hh  = String(now.getHours()).padStart(2, '0')
  const min = String(now.getMinutes()).padStart(2, '0')
  const ss  = String(now.getSeconds()).padStart(2, '0')
  const rnd = Math.floor(Math.random() * 10000).toString().padStart(4, '0')
  
  return parseInt(yy + mm + dd + hh + min + ss + rnd)
}

/** Formata valor numérico em BRL. */
export const fmt = v =>
  new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(v)

/** Placeholder de imagem com texto do produto. */
export const imgPlaceholder = name =>
  `https://placehold.co/400x400/111214/26fd71?text=${encodeURIComponent(name || "?")}`

/** Escapa HTML para evitar XSS em templates literais. */
export const esc = str =>
  String(str)
    .replace(/&/g,  "&amp;")
    .replace(/</g,  "&lt;")
    .replace(/>/g,  "&gt;")
    .replace(/"/g,  "&quot;")

// ─────────────────────────────────────────────────────────────────────────────
// PARTÍCULAS
// ─────────────────────────────────────────────────────────────────────────────

/** Partículas animadas em canvas — reutilizado em index, loja, login, cart. */
export function initParticles(canvasId = "canvas", count = 55) {
  const canvas = document.getElementById(canvasId)
  if (!canvas) return
  const ctx = canvas.getContext("2d")
  let W, H
  const resize = () => { W = canvas.width = innerWidth; H = canvas.height = innerHeight }
  resize()
  addEventListener("resize", resize)
  const pts = Array.from({ length: count }, () => ({
    x:  Math.random() * 2000,
    y:  Math.random() * 2000,
    vx: (Math.random() - .5) * .3,
    vy: (Math.random() - .5) * .3,
    r:  Math.random() * 1.4 + .4,
    a:  Math.random() * .5  + .1,
  }));
  (function loop() {
    ctx.clearRect(0, 0, W, H)
    pts.forEach(p => {
      p.x += p.vx; p.y += p.vy
      if (p.x < 0) p.x = W; if (p.x > W) p.x = 0
      if (p.y < 0) p.y = H; if (p.y > H) p.y = 0
      ctx.beginPath(); ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2)
      ctx.fillStyle = `rgba(38,253,113,${p.a})`; ctx.fill()
    })
    requestAnimationFrame(loop)
  })()
}

// ─────────────────────────────────────────────────────────────────────────────
// ANIMAÇÕES / UI
// ─────────────────────────────────────────────────────────────────────────────

/** Animação de contador numérico. */
export function animateCount(id, target, suffix = "+") {
  const el = document.getElementById(id)
  if (!el) return
  const dur   = 1400
  const start = performance.now();
  (function tick(now) {
    const p = Math.min((now - start) / dur, 1)
    el.textContent = Math.round(p * target)
    if (p < 1) requestAnimationFrame(tick)
    else el.textContent = target + suffix
  })(start)
}

/** Ripple de clique global. */
export function initRipple() {
  document.addEventListener("click", e => {
    const r = document.createElement("div")
    r.className = "ripple"
    r.style.left = e.clientX + "px"
    r.style.top  = e.clientY + "px"
    document.body.appendChild(r)
    setTimeout(() => r.remove(), 700)
  })
}

/** Toggle de menu mobile. */
export function initNavToggle(toggleId = "navToggle", menuId = "navMenu") {
  const btn  = document.getElementById(toggleId)
  const menu = document.getElementById(menuId)
  if (btn && menu) btn.onclick = () => menu.classList.toggle("open")
}

// ─────────────────────────────────────────────────────────────────────────────
// US-47 — SENTRY: MONITORAMENTO DE ERROS EM PRODUÇÃO
// ─────────────────────────────────────────────────────────────────────────────

let _sentryReady = false

/**
 * Inicializa o Sentry via CDN (sem bundler).
 * Chamar no topo do <script> de cada página principal.
 *
 * @param {string} dsn     — DSN do projeto Sentry
 * @param {string} release — Versão do app (padrão: "hivercar@3.0.0")
 *
 * @example
 * import { initSentry } from "./utils.js"
 * initSentry("https://SEU_DSN@sentry.io/ID", "hivercar@3.0.0")
 */
export function initSentry(dsn, release = "hivercar@3.0.0") {
  if (!dsn || _sentryReady) return

  const script = document.createElement("script")
  script.src   = "https://browser.sentry-cdn.com/7.99.0/bundle.min.js"
  script.crossOrigin = "anonymous"
  script.onload = () => {
    if (typeof Sentry === "undefined") return
    Sentry.init({
      dsn,
      release,
      environment: window.location.hostname === "localhost" ? "development" : "production",
      tracesSampleRate: 0.1,
      ignoreErrors: [
        "ResizeObserver loop limit exceeded",
        "Non-Error promise rejection",
        /^Script error/,
        /chrome-extension/,
        /moz-extension/,
      ],
      beforeSend(event) {
        // Remove dados sensíveis antes de enviar
        if (event.request?.data && typeof event.request.data === "object") {
          const d = event.request.data
          delete d.password; delete d.senha; delete d.token; delete d.cpf
        }
        return event
      },
    })
    _sentryReady = true
    // Captura rejeições de Promise não tratadas
    window.addEventListener("unhandledrejection", e => {
      Sentry.captureException(e.reason)
    })
    console.debug("[Sentry] Monitoramento ativo —", release)
  }
  script.onerror = () => console.warn("[Sentry] Falha ao carregar SDK.")
  document.head.appendChild(script)
}

/**
 * Captura um erro manualmente com contexto estruturado.
 * Seguro — fallback para console.error se Sentry não estiver disponível.
 *
 * @param {Error|any} err     — Erro capturado no catch
 * @param {string}    context — Ex: "OrderService.placeOrder"
 * @param {object}    extras  — Dados extras para debug
 *
 * @example
 * try { await OrderService.placeOrder(...) }
 * catch (err) { captureError(err, "checkout.confirmarPedido", { cartSize }) }
 */
export function captureError(err, context = "desconhecido", extras = {}) {
  const message = err?.message ?? String(err)
  console.error(`[HIVERCAR] ${context}:`, { message, code: err?.code, extras })
  if (!_sentryReady || typeof Sentry === "undefined") return
  Sentry.withScope(scope => {
    scope.setTag("context", context)
    scope.setLevel(err?.code >= 500 ? "fatal" : "error")
    Object.entries(extras).forEach(([k, v]) => scope.setExtra(k, v))
    if (err?.code) scope.setExtra("http_code", err.code)
    Sentry.captureException(err instanceof Error ? err : new Error(message))
  })
}

/**
 * Associa o usuário logado ao contexto do Sentry.
 * Chamar após login bem-sucedido passando dados do Mirror.
 *
 * @param {{ id: string, email: string, role: string, name?: string }} user
 *
 * @example
 * // Após login:
 * addSentryContext({ id: mirror.$id, email: mirror.email, role: mirror.role })
 */
export function addSentryContext(user) {
  if (!_sentryReady || typeof Sentry === "undefined") return
  if (!user) { Sentry.setUser(null); return }
  Sentry.setUser({ id: user.id || user.$id, email: user.email, role: user.role, name: user.name })
  Sentry.setTag("user.role", user.role || "unknown")
}

/**
 * Remove contexto do usuário (chamar no logout).
 */
export function clearSentryContext() {
  if (!_sentryReady || typeof Sentry === "undefined") return
  Sentry.setUser(null)
}

// ─────────────────────────────────────────────────────────────────────────────
// PAGINAÇÃO COM PRÉ-CARREGAMENTO
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Classe para gerenciar paginação com pré-carregamento da próxima página.
 * Útil para listas grandes como pedidos, produtos, etc.
 *
 * @example
 * const paginator = new Paginator(items, 15)
 * console.log(paginator.current()) // primeiros 15 itens
 * paginator.next()
 * console.log(paginator.current()) // próximos 15 itens
 */
export class Paginator {
  constructor(items = [], pageSize = 15) {
    this.items = items
    this.pageSize = pageSize
    this.currentPage = 0
    this.preloadedPage = null
  }

  /**
   * Define novo array de itens e reseta paginação.
   */
  setItems(items) {
    this.items = items
    this.currentPage = 0
    this.preloadedPage = null
  }

  /**
   * Retorna itens da página atual.
   */
  current() {
    const start = this.currentPage * this.pageSize
    return this.items.slice(start, start + this.pageSize)
  }

  /**
   * Pré-carrega próxima página em background e retorna página atual.
   */
  preloadNext() {
    if (this.currentPage + 1 < this.getTotalPages()) {
      const nextStart = (this.currentPage + 1) * this.pageSize
      this.preloadedPage = this.items.slice(nextStart, nextStart + this.pageSize)
    }
    return this.current()
  }

  /**
   * Avança para próxima página (usa pré-carregamento se disponível).
   */
  next() {
    if (this.currentPage + 1 < this.getTotalPages()) {
      this.currentPage++
      this.preloadedPage = null
      return this.current()
    }
    return this.current()
  }

  /**
   * Volta para página anterior.
   */
  prev() {
    if (this.currentPage > 0) {
      this.currentPage--
      this.preloadedPage = null
      return this.current()
    }
    return this.current()
  }

  /**
   * Salta para página específica (0-indexed).
   */
  goToPage(page) {
    if (page >= 0 && page < this.getTotalPages()) {
      this.currentPage = page
      this.preloadedPage = null
      return this.current()
    }
    return this.current()
  }

  /**
   * Retorna número total de páginas.
   */
  getTotalPages() {
    return Math.ceil(this.items.length / this.pageSize)
  }

  /**
   * Retorna número da página atual (1-indexed para exibição).
   */
  getCurrentPageNumber() {
    return this.currentPage + 1
  }

  /**
   * Retorna métrica de paginação: { current: 1, total: 5, showing: 15, totalItems: 75 }
   */
  getInfo() {
    return {
      current: this.getCurrentPageNumber(),
      total: this.getTotalPages(),
      showing: this.current().length,
      totalItems: this.items.length,
      hasNext: this.currentPage + 1 < this.getTotalPages(),
      hasPrev: this.currentPage > 0,
    }
  }
}
