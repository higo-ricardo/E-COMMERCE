import { ProductService } from "../../js/productService.js"
import { CartService } from "../../js/cartService.js"
import { esc, imgPlaceholder, fmt, initParticles, initNavToggle } from "../../js/utils.js"

export class StoreController {
  constructor() {
    this.curPage = 1
    this.curTerm = ""
    this.curFilters = { category: "", brand: "", vehicle: "" }

    this.badge = document.getElementById("cartBadge")
    this.grid = document.getElementById("products")
    this.paginationEl = document.getElementById("pagination")
    this.countEl = document.getElementById("productCount")
    this.searchInput = document.getElementById("searchInput")
    this.searchBtn = document.getElementById("searchBtn")
    this.filterCat = document.getElementById("filterCategory")
    this.filterBrand = document.getElementById("filterBrand")
    this.filterVeh = document.getElementById("filterVehicle")
    this.clearFiltersBtn = document.getElementById("clearFilters")
    this.toast = document.getElementById("toast")
  }

  init() {
    if (this.badge) this.badge.textContent = CartService.count()

    initParticles()
    initNavToggle()

    this.bindEvents()
    this.loadFilterOptions()
    this.load(1)
  }

  bindEvents() {
    if (this.searchBtn) {
      this.searchBtn.onclick = () => {
        this.curTerm = this.searchInput?.value.trim() || ""
        this.load(1)
      }
    }

    if (this.searchInput) {
      this.searchInput.onkeydown = e => {
        if (e.key === "Enter") {
          this.curTerm = e.target.value.trim()
          this.load(1)
        }
      }
    }

    if (this.filterCat) {
      this.filterCat.onchange = () => {
        this.curFilters.category = this.filterCat.value
        this.load(1)
      }
    }

    if (this.filterBrand) {
      this.filterBrand.onchange = () => {
        this.curFilters.brand = this.filterBrand.value
        this.load(1)
      }
    }

    if (this.filterVeh) {
      let debounce
      this.filterVeh.oninput = () => {
        clearTimeout(debounce)
        debounce = setTimeout(() => {
          this.curFilters.vehicle = this.filterVeh.value.trim()
          this.load(1)
        }, 400)
      }
    }

    if (this.clearFiltersBtn) {
      this.clearFiltersBtn.onclick = () => {
        this.curTerm = ""
        this.curFilters = { category: "", brand: "", vehicle: "" }
        if (this.searchInput) this.searchInput.value = ""
        if (this.filterCat) this.filterCat.value = ""
        if (this.filterBrand) this.filterBrand.value = ""
        if (this.filterVeh) this.filterVeh.value = ""
        this.load(1)
      }
    }
  }

  showToast(msg) {
    if (!this.toast) return
    this.toast.textContent = msg
    this.toast.classList.add("show")
    setTimeout(() => this.toast.classList.remove("show"), 2000)
  }

  highlight(text, term) {
    if (!term || !text) return esc(text || "")
    const safe = term.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")
    const regex = new RegExp(`(${safe})`, "gi")
    return esc(text).replace(
      regex,
      '<mark style="background:rgba(38,253,113,.25);color:var(--green);padding:0 2px">$1</mark>',
    )
  }

  async loadFilterOptions() {
    try {
      const { categories, brands } = await ProductService.getFilterOptions()

      if (this.filterCat) {
        this.filterCat.innerHTML = `<option value="">Todas as Categorias</option>` +
          categories.map(c => `<option value="${esc(c)}">${esc(c)}</option>`).join("")
      }

      if (this.filterBrand) {
        this.filterBrand.innerHTML = `<option value="">Todas as Marcas</option>` +
          brands.map(b => `<option value="${esc(b)}">${esc(b)}</option>`).join("")
      }
    } catch {}
  }

  renderGrid(products) {
    if (!this.grid) return

    if (!products.length) {
      this.grid.innerHTML = `<div class="loading-state" style="grid-column:1/-1">Nenhum produto encontrado para os filtros aplicados.</div>`
      return
    }

    this.grid.innerHTML = products.map(p => `
      <div class="product-card">
        <div class="product-img">
          <img src="${esc(p.imageURL || imgPlaceholder(p.name))}" alt="${esc(p.name)}" loading="lazy" decoding="async">
          ${p.brand ? `<span class="product-badge badge-muted">${esc(p.brand)}</span>` : ""}
        </div>
        <div class="product-body">
          <div class="product-name">${this.highlight(p.name, this.curTerm)}</div>
          ${p.category ? `<div class="product-meta"><i class="fas fa-tag"></i> ${this.highlight(p.category, this.curTerm)}</div>` : ""}
          ${p.ncm && this.curTerm ? `<div class="product-meta" style="font-size:10px"><i class="fas fa-barcode"></i> NCM: ${this.highlight(p.ncm, this.curTerm)}</div>` : ""}
          <div class="product-price">${fmt(p.price)}</div>
          <button class="btn btn-primary btn-block add-btn"
            data-p='${JSON.stringify({ $id: p.$id, name: p.name, price: p.price, image: p.imageURL || "" })}'>
            <i class="fas fa-cart-plus"></i> Adicionar
          </button>
        </div>
      </div>`).join("")

    this.grid.onclick = e => {
      const button = e.target.closest(".add-btn")
      if (!button) return

      CartService.add(JSON.parse(button.dataset.p))
      if (this.badge) this.badge.textContent = CartService.count()

      this.showToast("? Produto adicionado ao carrinho!")
      button.innerHTML = "? Adicionado"
      button.disabled = true

      setTimeout(() => {
        button.innerHTML = '<i class="fas fa-cart-plus"></i> Adicionar'
        button.disabled = false
      }, 1200)
    }
  }

  renderPagination({ page, pages }) {
    if (!this.paginationEl) return

    if (pages <= 1) {
      this.paginationEl.innerHTML = ""
      return
    }

    this.paginationEl.innerHTML = Array.from({ length: pages }, (_, i) => i + 1)
      .map(n => `<button class="page-btn${n === page ? " active" : ""}" data-page="${n}">${n}</button>`)
      .join("")

    this.paginationEl.onclick = e => {
      const button = e.target.closest(".page-btn")
      if (button) this.load(Number(button.dataset.page))
    }
  }

  async load(page = 1) {
    this.curPage = page

    if (this.grid) {
      this.grid.innerHTML = `<div class="loading-state" style="grid-column:1/-1"><div class="spinner"></div> Carregando...</div>`
    }

    try {
      const result = this.curTerm
        ? await ProductService.search(this.curTerm, page, this.curFilters)
        : await ProductService.list(page, this.curFilters)

      if (this.countEl) {
        this.countEl.textContent = `${result.total} produto${result.total !== 1 ? "s" : ""}`
      }

      this.renderGrid(result.products)
      this.renderPagination(result)
    } catch (err) {
      if (this.grid) {
        this.grid.innerHTML = `<div class="loading-state" style="grid-column:1/-1;color:var(--red)">
          <i class="fas fa-circle-exclamation"></i> Erro ao carregar: ${esc(err.message)}
        </div>`
      }
    }
  }
}


