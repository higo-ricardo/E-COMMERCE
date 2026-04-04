// ─── HIVERCAR · admin-core.js ────────────────────────────────────────────────
// Camada: Controller Base + Data Access + Helpers
// ─────────────────────────────────────────────────────────────────────────────

import { account, databases, Query } from "./db.js";
import { requireAuth } from "./authGuard.js";

// ═════════════════════════════════════════════════════════════════════════════
// ═════════════════════════════════════════════════════════════════════════════

const APPWRITE = { account, databases };

// ═════════════════════════════════════════════════════════════════════════════
// 2. ABSTRACT BASE CLASS — AdminPage (Controller Layer)
// ═════════════════════════════════════════════════════════════════════════════

export class AdminPage {
  #toastTimer;
  #isLoaded = false;
  #isDestroyed = false;

  get app() { return APPWRITE; }
  get isLoaded() { return this.#isLoaded; }
  get isDestroyed() { return this.#isDestroyed; }

  // ── Template Method: init() define o fluxo, subclasses sobrescrevem onInit()
  async init() {
    try {
      await this.setupAuth();
      this.setupSidebar();
      this.setupLogout();
      this.initTheme();
      this.onInit();
      this.#isLoaded = true;
    } catch (err) {
      console.error(`[${this.constructor.name}] Erro na inicialização:`, err);
      this.toast("Erro ao carregar a página.", "err");
    }
  }

  // ── Auth Guard (obrigatório para todas as páginas) ──────────────────────
  async setupAuth() {
    try {
      // requireAuth(true) já redireciona para login.html se não autenticado
      const user = await requireAuth(true);
      const nameEl = document.getElementById("userName");
      if (nameEl) nameEl.textContent = user.name || "Usuário";

      // Opcional: exibir role na sidebar
      const roleEl = document.getElementById("userRole");
      if (roleEl && user.prefs?.role) {
        roleEl.textContent = user.prefs.role;
      }
    } catch {
      // requireAuth já fez o redirect; não faz double-redirect
    }
  }

  // ── Sidebar Toggle (padronizado) ────────────────────────────────────────
  setupSidebar() {
    const toggle = document.getElementById("sidebarToggle");
    const sidebar = document.getElementById("sidebar");
    const overlay = document.getElementById("sidebarOverlay");

    if (toggle && sidebar) {
      toggle.addEventListener("click", () => {
        sidebar.classList.toggle("open");
        overlay?.classList.toggle("active");
      });
    }
    if (overlay) {
      overlay.addEventListener("click", () => {
        sidebar?.classList.remove("open");
        overlay.classList.remove("active");
      });
    }
  }

  // ── Logout Handler (único, herdados por todas as páginas) ───────────────
  setupLogout() {
    const btn = document.getElementById("logoutBtn");
    if (!btn) return;

    btn.addEventListener("click", async (e) => {
      e.preventDefault();
      try {
        await this.app.account.deleteSession("current");
      } catch {
        // Sessão já pode ter expirado, ignorar
      }
      window.location.href = "login.html";
    });
  }

  // ── Theme (anti-FOUC + toggle) ─────────────────────────────────────────
  initTheme() {
    const saved = localStorage.getItem("hivercar-theme");
    if (saved === "light") document.body.classList.add("light-mode");

    const toggle = document.getElementById("themeToggle");
    if (!toggle) return;
    const icon = toggle.querySelector("i");

    if (saved === "light" && icon) {
      icon.classList.remove("fa-moon");
      icon.classList.add("fa-sun");
    }

    toggle.addEventListener("click", () => {
      const isLight = document.body.classList.toggle("light-mode");
      localStorage.setItem("hivercar-theme", isLight ? "light" : "dark");
      if (icon) {
        icon.classList.toggle("fa-moon", !isLight);
        icon.classList.toggle("fa-sun", isLight);
      }
    });
  }

  // ── Toast com acessibilidade ────────────────────────────────────────────
  toast(msg, type = "") {
    const el = document.getElementById("toast");
    if (!el) return;

    el.textContent = msg;
    el.className = "toast show" + (type ? " " + type : "");
    el.setAttribute("role", "status");
    el.setAttribute("aria-live", "polite");
    clearTimeout(this.#toastTimer);
    this.#toastTimer = setTimeout(() => {
      el.classList.remove("show");
      el.removeAttribute("role");
      el.removeAttribute("aria-live");
    }, 3500);
  }

  // ── Loading State em Botões ─────────────────────────────────────────────
  setLoading(btn, loading, originalHTML = "") {
    if (!btn) return;

    if (loading) {
      btn.dataset.original = originalHTML || btn.innerHTML;
      btn.disabled = true;
      btn.innerHTML = '<span class="spinner"></span> Processando…';
    } else {
      btn.disabled = false;
      btn.innerHTML = btn.dataset.original || originalHTML;
    }
  }

  // ── Renderização Genérica de Tabelas ────────────────────────────────────
  renderTable(tbody, items, rowFn) {
    if (!tbody) return;

    tbody.innerHTML = items.length
      ? items.map(rowFn).join("")
      : `<tr><td colspan="10" style="color:var(--muted)">Nenhum registro encontrado.</td></tr>`;
  }

  // ── Export CSV ──────────────────────────────────────────────────────────
  exportCSV(data, filename) {
    try {
      const blob = new Blob([data], { type: "text/csv;charset=utf-8;" });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = filename;
      link.click();
      URL.revokeObjectURL(url);
      this.toast("Arquivo exportado com sucesso!", "ok");
    } catch (err) {
      console.error(`[${this.constructor.name}] Erro ao exportar CSV:`, err);
      this.toast("Erro ao exportar arquivo.", "err");
    }
  }

  // ── Cleanup (evita memory leaks) ────────────────────────────────────────
  destroy() {
    this.#isDestroyed = true;
    clearTimeout(this.#toastTimer);
  }

  // ── Método Abstrato: subclasses DEVEM sobrescrever ──────────────────────
  onInit() {
    throw new Error(
      `Classe ${this.constructor.name} deve implementar o método onInit()`
    );
  }
}

// ═════════════════════════════════════════════════════════════════════════════
// 3. HELPERS — Funções utilitárias compartilhadas
// ═════════════════════════════════════════════════════════════════════════════

export const fmtBRL = (v) =>
  "R$ " + Number(v || 0).toFixed(2).replace(".", ",");

export const fmtDate = (iso) =>
  iso ? new Date(iso).toLocaleDateString("pt-BR") : "-";

export const fmtDateTime = (iso) =>
  iso ? new Date(iso).toLocaleString("pt-BR") : "-";

export const esc = (s) =>
  String(s ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");

// ── Status de Pedidos (centralizado) ──────────────────────────────────────

export const STATUS_LABELS = {
  novo: "Novo",
  pago: "Pago",
  confirmado: "Confirmado",
  em_preparo: "Em Preparo",
  enviado: "Enviado",
  entregue: "Entregue",
  cancelado: "Cancelado",
  devolvido: "Devolvido",
  aberta: "Aberta",
  em_andamento: "Em Andamento",
  concluida: "Concluída",
  aguardando_pecas: "Aguardando Peças",
};

export const STATUS_COLORS = {
  novo: "#26fd71",
  pago: "#26fd71",
  confirmado: "#26fd71",
  em_preparo: "#f59e0b",
  enviado: "#6b7280",
  entregue: "#6b7280",
  cancelado: "#fb1230",
  devolvido: "#fb1230",
};

export const STATUS_CLS = {
  novo: "badge-green",
  pago: "badge-green",
  confirmado: "badge-green",
  em_preparo: "badge-amber",
  enviado: "badge-muted",
  entregue: "badge-muted",
  cancelado: "badge-red",
  devolvido: "badge-red",
};

export function statusBadge(s) {
  const label = STATUS_LABELS[s] || s || "-";
  const cls = STATUS_CLS[s] || "badge-muted";
  return `<span class="badge ${cls}">${esc(label)}</span>`;
}

// ── Status Chart Renderer ─────────────────────────────────────────────────

export function renderStatusChart(container, statusCount, colors = STATUS_COLORS) {
  const el = typeof container === "string" ? document.getElementById(container) : container;
  if (!el || !statusCount) return;

  el.innerHTML = Object.entries(STATUS_LABELS)
    .filter(([key]) => statusCount[key] > 0)
    .map(([key, label]) => {
      const count = statusCount[key] || 0;
      const color = colors[key] || "#6b7280";
      return `
        <div style="background:rgba(255,255,255,.02);border:1px solid var(--border);padding:16px;border-radius:4px;text-align:center">
          <div style="font-size:28px;font-family:'Bebas Neue';color:${color};margin-bottom:4px">${count}</div>
          <div style="font-size:9px;font-weight:700;letter-spacing:.15em;text-transform:uppercase;color:var(--muted);margin-bottom:4px">${esc(label)}</div>
        </div>`;
    }).join("");
}

// ── Expor Query para uso nas subclasses (evita import duplicado) ──────────
export { Query };

