import { ProductService } from "../../js/productService.js"
import { CartService } from "../../js/cartService.js"
import { databases, Query } from "../../js/appwriteClient.js"
import { CONFIG } from "../../js/config.js"
import { esc, imgPlaceholder, fmt, initParticles, animateCount, initRipple, initNavToggle } from "../../js/utils.js"

export class HomeController {
  constructor() {
    this.badge = document.getElementById("cartBadge")
    this.grid = document.getElementById("products")
  }

  init() {
    if (this.badge) this.badge.textContent = CartService.count()

    initParticles()
    initRipple()
    initNavToggle()

    this.loadStats()
    this.loadDestaques()
  }

  async loadStats() {
    try {
      const [prods, orders] = await Promise.all([
        databases.listDocuments(CONFIG.DB, CONFIG.COL.PRODUCTS, [Query.limit(1)]),
        databases.listDocuments(CONFIG.DB, CONFIG.COL.ORDERS, [Query.limit(1)]),
      ])
      animateCount("statProd", prods.total)
      animateCount("statOrders", orders.total)
    } catch {}
  }

  async loadDestaques() {
    if (!this.grid) return

    try {
      const { products } = await ProductService.list(1)

      if (!products.length) {
        this.grid.innerHTML = `<div class="loading-state" style="grid-column:1/-1">Nenhum produto disponível no momento.</div>`
        return
      }

      this.grid.innerHTML = products.slice(0, 8).map(p => `
        <div class="product-card">
          <div class="product-img">
            <img src="${esc(p.image || imgPlaceholder(p.name))}" alt="${esc(p.name)}" loading="lazy" decoding="async">
            <span class="product-badge badge-red">Destaque</span>
          </div>
          <div class="product-body">
            <div class="product-name">${esc(p.name)}</div>
            <div class="product-price">${fmt(p.price)}</div>
            <button class="btn btn-primary btn-block add-btn"
              data-p='${JSON.stringify({ $id: p.$id, name: p.name, price: p.price, image: p.image || '-' })}'>
              <i class="fas fa-cart-plus"></i> Adicionar
            </button>
          </div>
        </div>`).join("")

      this.grid.onclick = e => {
        const button = e.target.closest(".add-btn")
        if (!button) return

        CartService.add(JSON.parse(button.dataset.p))
        if (this.badge) this.badge.textContent = CartService.count()

        button.innerHTML = "? Adicionado"
        button.disabled = true
        setTimeout(() => {
          button.innerHTML = '<i class="fas fa-cart-plus"></i> Adicionar'
          button.disabled = false
        }, 1200)
      }
    } catch {
      this.grid.innerHTML = `<div class="loading-state" style="grid-column:1/-1;color:var(--muted)">
        <i class="fas fa-circle-exclamation" style="color:var(--red)"></i> Não foi possível carregar os produtos.
      </div>`
    }
  }
}


