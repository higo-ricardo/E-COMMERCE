// ─── HIVERCAR · utils.js ──────────────────────────────────────────────────────
// Utilitários compartilhados entre todas as páginas
// ──────────────────────────────────────────────────────────────────────────────

// -- Partículas animadas no canvas -----------------------------------------------
export function initParticles(canvasId = "canvas", color = "38,253,113", count = 55) {
  const cv = document.getElementById(canvasId);
  if (!cv) return;
  const ctx = cv.getContext("2d");
  let W, H;
  const resize = () => { W = cv.width = innerWidth; H = cv.height = innerHeight };
  resize();
  addEventListener("resize", resize);

  const pts = Array.from({ length: count }, () => ({
    x: Math.random() * 2000,
    y: Math.random() * 2000,
    vx: (Math.random() - 0.5) * 0.3,
    vy: (Math.random() - 0.5) * 0.3,
    r: Math.random() * 1.4 + 0.4,
    a: Math.random() * 0.5 + 0.1,
  }));

  (function loop() {
    ctx.clearRect(0, 0, W, H);
    pts.forEach(p => {
      p.x += p.vx;
      p.y += p.vy;
      if (p.x < 0) p.x = W;
      if (p.x > W) p.x = 0;
      if (p.y < 0) p.y = H;
      if (p.y > H) p.y = 0;
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(${color},${p.a})`;
      ctx.fill();
    });
    requestAnimationFrame(loop);
  })();
}

// -- Toast com acessibilidade ---------------------------------------------------
let _toastTimer = null;
export function showToast(message, type = "", container) {
  const el = container || document.getElementById("toast");
  if (!el) return;
  el.textContent = message;
  el.className = "toast show" + (type ? " " + type : "");
  el.setAttribute("role", "status");
  el.setAttribute("aria-live", "polite");
  clearTimeout(_toastTimer);
  _toastTimer = setTimeout(() => {
    el.classList.remove("show");
    el.removeAttribute("role");
    el.removeAttribute("aria-live");
  }, 3500);
}

// ─── Theme Toggle (centralizado) ─────────────────────────────────────────────
export function initThemeToggle() {
  const toggle = document.getElementById('themeToggle');
  if (!toggle) return;
  const icon = toggle.querySelector('i');
  const saved = localStorage.getItem('hivercar-theme');

  // Aplicar tema salvo imediatamente (previne FOUC)
  if (saved === 'light') {
    document.body.classList.add('light-mode');
    if (icon) { icon.classList.remove('fa-moon'); icon.classList.add('fa-sun'); }
  }

  toggle.addEventListener('click', () => {
    const isLight = document.body.classList.toggle('light-mode');
    localStorage.setItem('hivercar-theme', isLight ? 'light' : 'dark');
    if (icon) {
      icon.classList.toggle('fa-moon', !isLight);
      icon.classList.toggle('fa-sun', isLight);
    }
  });
}

// -- Máscaras de input ----------------------------------------------------------
export function maskCPF(value) {
  let v = value.replace(/\D/g, "").slice(0, 11);
  if (v.length > 9) v = v.replace(/(\d{3})(\d{3})(\d{3})(\d{0,2})/, "$1.$2.$3-$4");
  else if (v.length > 6) v = v.replace(/(\d{3})(\d{3})(\d{0,3})/, "$1.$2.$3");
  else if (v.length > 3) v = v.replace(/(\d{3})(\d{0,3})/, "$1.$2");
  return v;
}

export function maskCelular(value) {
  let v = value.replace(/\D/g, "").slice(0, 11);
  if (v.length > 8) v = v.replace(/(\d{2})(\d{5})(\d{0,4})/, "($1) $2-$3");
  else if (v.length > 6) v = v.replace(/(\d{2})(\d{4})(\d{0,4})/, "($1) $2-$3");
  else if (v.length > 2) v = v.replace(/(\d{2})(\d{0,5})/, "($1) $2");
  return v;
}

export function maskCEP(value) {
  let v = value.replace(/\D/g, "").slice(0, 8);
  if (v.length > 5) v = v.replace(/(\d{5})(\d{0,3})/, "$1-$2");
  return v;
}

// -- Utilitários gerais ---------------------------------------------------------
export const $ = (id) => document.getElementById(id);

export function formatBRL(value) {
  return `R$ ${Number(value || 0).toFixed(2).replace(".", ",")}`;
}

export function formatDateBR(iso) {
  return iso ? new Date(iso).toLocaleDateString("pt-BR") : "-";
}

export function formatDateTimeBR(iso) {
  return iso ? new Date(iso).toLocaleString("pt-BR") : "-";
}

export function escapeHTML(str) {
  return String(str || "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

// -- Atalhos usados pelos controllers -------------------------------------------
export const esc = escapeHTML;

export const fmt = formatBRL;

// -- Placeholder SVG para imagens de produtos -----------------------------------
export function imgPlaceholder(name = "") {
  const label = encodeURIComponent((name || "Produto").slice(0, 20));
  return `data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='400' height='300' viewBox='0 0 400 300'%3E%3Crect width='400' height='300' fill='%231a1a2e'/%3E%3Ctext x='50%25' y='50%25' dominant-baseline='middle' text-anchor='middle' fill='%23555' font-family='sans-serif' font-size='18'%3E${label}%3C/text%3E%3C/svg%3E`;
}

// -- Animação de contagem numérica ----------------------------------------------
export function animateCount(elementId, target, duration = 800) {
  const el = document.getElementById(elementId);
  if (!el) return;
  const start = performance.now();
  const from = 0;
  const step = (now) => {
    const elapsed = now - start;
    const progress = Math.min(elapsed / duration, 1);
    // ease-out
    const eased = 1 - Math.pow(1 - progress, 3);
    el.textContent = Math.round(from + (target - from) * eased).toLocaleString("pt-BR");
    if (progress < 1) requestAnimationFrame(step);
  };
  requestAnimationFrame(step);
}

// -- Efeito ripple em botões ----------------------------------------------------
export function initRipple() {
  document.querySelectorAll(".btn, .add-btn").forEach(btn => {
    if (btn.dataset.ripple) return;
    btn.dataset.ripple = "1";
    btn.style.position = btn.style.position || "relative";
    btn.style.overflow = "hidden";
    btn.addEventListener("pointerdown", e => {
      const rect = btn.getBoundingClientRect();
      const ripple = document.createElement("span");
      const size = Math.max(rect.width, rect.height);
      Object.assign(ripple.style, {
        position: "absolute",
        borderRadius: "50%",
        background: "rgba(255,255,255,0.35)",
        transform: "scale(0)",
        animation: "ripple-anim 500ms ease-out",
        width: size + "px",
        height: size + "px",
        left: (e.clientX - rect.left - size / 2) + "px",
        top: (e.clientY - rect.top - size / 2) + "px",
        pointerEvents: "none",
      });
      btn.appendChild(ripple);
      ripple.addEventListener("animationend", () => ripple.remove());
    });
  });

  // Injeta keyframe se ainda não existe
  if (!document.getElementById("ripple-keyframe")) {
    const style = document.createElement("style");
    style.id = "ripple-keyframe";
    style.textContent = "@keyframes ripple-anim{to{transform:scale(2.5);opacity:0}}";
    document.head.appendChild(style);
  }
}

// -- Toggle do menu de navegação mobile -----------------------------------------
export function initNavToggle() {
  const toggle = document.getElementById("navToggle");
  const menu = document.getElementById("navMenu");
  if (!toggle || !menu) return;

  toggle.addEventListener("click", () => {
    const isOpen = menu.classList.toggle("open");
    toggle.setAttribute("aria-expanded", String(isOpen));
  });

  // Fecha menu ao clicar em link
  menu.querySelectorAll("a.nav-link, a.nav-cart").forEach(link => {
    link.addEventListener("click", () => {
      menu.classList.remove("open");
      toggle.setAttribute("aria-expanded", "false");
    });
  });
}
