// ─── HIVERCAR · index.js ─────────────────────────────────────────────────────
// Controlador da página inicial (index.html). Apenas UI — zero lógica de negócio.
// Camada: Presentation.

import { ProductService }              from "./productService.js"
import { CartService }                 from "./cartService.js"
import { databases, Query }            from "./appwriteClient.js"
import { CONFIG }                      from "./config.js"
import { esc, imgPlaceholder, fmt, initParticles, animateCount, initRipple, initNavToggle }
  from "./utils.js"

// ── BADGE ─────────────────────────────────────────────────────────────────────
const badge = document.getElementById("cartBadge")
if (badge) badge.textContent = CartService.count()

// ── STATS HERO ────────────────────────────────────────────────────────────────
async function loadStats() {
  try {
    const [prods, orders] = await Promise.all([
      databases.listDocuments(CONFIG.DB, CONFIG.COL.PRODUCTS, [Query.limit(1)]),
      databases.listDocuments(CONFIG.DB, CONFIG.COL.ORDERS,   [Query.limit(1)]),
    ])
    animateCount("statProd",   prods.total)
    animateCount("statOrders", orders.total)
  } catch { /* silencioso — não quebra a página */ }
}

// ── DESTAQUES ─────────────────────────────────────────────────────────────────
async function loadDestaques() {
  const grid = document.getElementById("products")
  if (!grid) return
  try {
    const { products } = await ProductService.list(1)
    if (!products.length) {
      grid.innerHTML = `<div class="loading-state" style="grid-column:1/-1">Nenhum produto disponível no momento.</div>`
      return
    }
    grid.innerHTML = products.slice(0, 8).map(p => `
      <div class="product-card">
        <div class="product-img">
          <img src="${esc(p.image || imgPlaceholder(p.name))}" alt="${esc(p.name)}" loading="lazy" decoding="async">
          <span class="product-badge badge-red">Destaque</span>
        </div>
        <div class="product-body">
          <div class="product-name">${esc(p.name)}</div>
          <div class="product-price">${fmt(p.price)}</div>
          <button class="btn btn-primary btn-block add-btn"
            data-p='${JSON.stringify({ $id: p.$id, name: p.name, price: p.price, image: p.image || "" })}'>
            <i class="fas fa-cart-plus"></i> Adicionar
          </button>
        </div>
      </div>`).join("")

    grid.onclick = e => {
      const b = e.target.closest(".add-btn")
      if (!b) return
      CartService.add(JSON.parse(b.dataset.p))
      if (badge) badge.textContent = CartService.count()
      b.innerHTML = "✓ Adicionado"; b.disabled = true
      setTimeout(() => { b.innerHTML = '<i class="fas fa-cart-plus"></i> Adicionar'; b.disabled = false }, 1200)
    }
  } catch {
    grid.innerHTML = `<div class="loading-state" style="grid-column:1/-1;color:var(--muted)">
      <i class="fas fa-circle-exclamation" style="color:var(--red)"></i> Não foi possível carregar os produtos.
    </div>`
  }
}

// ── INIT ──────────────────────────────────────────────────────────────────────
initParticles()
initRipple()
initNavToggle()
loadStats()
loadDestaques()
