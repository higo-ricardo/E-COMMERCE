import { ProductService } from "../../js/productService.js"
import { esc, fmt, imgPlaceholder } from "../../js/utils.js"
import { CONFIG } from "../../js/config.js"

export class StoreController {
  constructor() {
    this.currentPage = 1
    this.currentFilters = { category: "", brand: "", vehicle: "" }
    this.currentSearch = ""
    this.currentSort = "created-desc" // Ordenação padrão
    this.debounceTimer = null
    this.totalProducts = 0
    this.totalPages = 1
    this.requestToken = 0 // Token para evitar race condition
  }

  async init() {
    await this.loadFilterOptions()
    await this.loadProducts()
    this.bindEvents()
  }

  // ── Bind de eventos ──────────────────────────────────────────────────────
  bindEvents() {
    const searchInput = document.getElementById("searchInput")
    const searchBtn = document.getElementById("searchBtn")
    const filterCategory = document.getElementById("filterCategory")
    const filterBrand = document.getElementById("filterBrand")
    const filterVehicle = document.getElementById("filterVehicle")
    const sortOrder = document.getElementById("sortOrder")
    const clearFilters = document.getElementById("clearFilters")

    // Busca com debounce
    if (searchInput) {
      searchInput.addEventListener("input", (e) => {
        clearTimeout(this.debounceTimer)
        this.debounceTimer = setTimeout(() => {
          this.currentSearch = e.target.value
          this.applyFilter()
        }, 300)
      })

      searchInput.addEventListener("keypress", (e) => {
        if (e.key === "Enter") {
          clearTimeout(this.debounceTimer)
          this.currentSearch = e.target.value
          this.applyFilter()
        }
      })
    }

    if (searchBtn) {
      searchBtn.addEventListener("click", () => {
        clearTimeout(this.debounceTimer)
        this.currentSearch = searchInput?.value || ""
        this.applyFilter()
      })
    }

    // Filtros
    if (filterCategory) {
      filterCategory.addEventListener("change", (e) => {
        this.currentFilters.category = e.target.value
        this.applyFilter()
      })
    }

    if (filterBrand) {
      filterBrand.addEventListener("change", (e) => {
        this.currentFilters.brand = e.target.value
        this.applyFilter()
      })
    }

    if (filterVehicle) {
      filterVehicle.addEventListener("input", (e) => {
        clearTimeout(this.debounceTimer)
        this.debounceTimer = setTimeout(() => {
          this.currentFilters.vehicle = e.target.value
          this.applyFilter()
        }, 300)
      })
    }

    if (sortOrder) {
      sortOrder.addEventListener("change", (e) => {
        this.currentSort = e.target.value
        this.applyFilter()
      })
    }

    // Limpar filtros
    if (clearFilters) {
      clearFilters.addEventListener("click", () => {
        this.clearAllFilters()
      })
    }
  }

  // ── Aplicar filtro (reseta página e recarrega) ──────────────────────────
  applyFilter() {
    this.currentPage = 1
    this.loadProducts()
  }

  // ── Limpar todos os filtros ──────────────────────────────────────────────
  clearAllFilters() {
    this.currentFilters = { category: "", brand: "", vehicle: "" }
    this.currentSearch = ""
    this.currentSort = "created-desc"
    this.currentPage = 1

    const searchInput = document.getElementById("searchInput")
    const filterCategory = document.getElementById("filterCategory")
    const filterBrand = document.getElementById("filterBrand")
    const filterVehicle = document.getElementById("filterVehicle")
    const sortOrder = document.getElementById("sortOrder")

    if (searchInput) searchInput.value = ""
    if (filterCategory) filterCategory.value = ""
    if (filterBrand) filterBrand.value = ""
    if (filterVehicle) filterVehicle.value = ""
    if (sortOrder) sortOrder.value = "created-desc"

    this.loadProducts()
  }

  // ── Carregar opções de filtros ───────────────────────────────────────────
  async loadFilterOptions() {
    try {
      const { categories = [], brands = [] } = await ProductService.getFilterOptions()

      const filterCategory = document.getElementById("filterCategory")
      const filterBrand = document.getElementById("filterBrand")

      if (filterCategory) {
        filterCategory.innerHTML = `<option value="">Todas as Categorias</option>` +
          categories.map(cat => `<option value="${esc(cat)}">${esc(cat)}</option>`).join("")
      }

      if (filterBrand) {
        filterBrand.innerHTML = `<option value="">Todas as Marcas</option>` +
          brands.map(brand => `<option value="${esc(brand)}">${esc(brand)}</option>`).join("")
      }
    } catch (err) {
      console.warn("[Loja] Falha ao carregar opções de filtros:", err)
    }
  }

  // ── Carregar produtos ────────────────────────────────────────────────────
  async loadProducts() {
    const grid = document.getElementById("products")
    const productCount = document.getElementById("productCount")
    const pagination = document.getElementById("pagination")

    if (!grid) return

    // Token da requisição atual (evita race condition)
    const token = ++this.requestToken

    // Mostra estado de carregamento
    grid.innerHTML = `<div class="loading-state" style="grid-column:1/-1">
      <div class="spinner"></div> Carregando produtos...
    </div>`

    try {
      let result
      const hasActiveFilters = this.currentFilters.category || this.currentFilters.brand || this.currentFilters.vehicle

      if (this.currentSearch.trim()) {
        result = await ProductService.search(this.currentSearch, this.currentPage, this.currentFilters, this.currentSort)
      } else if (hasActiveFilters) {
        result = await ProductService.list(this.currentPage, this.currentFilters, this.currentSort)
      } else {
        result = await ProductService.list(this.currentPage, {}, this.currentSort)
      }

      // Se token mudou, ignora resultado antigo
      if (token !== this.requestToken) return

      this.totalProducts = result.total
      this.totalPages = Math.min(result.pages, 100) // Limita a 100 páginas

      // Atualiza contador
      if (productCount) {
        const hasSearchOrFilters = this.currentSearch.trim() || hasActiveFilters
        if (hasSearchOrFilters) {
          productCount.textContent = `${result.total} produto${result.total !== 1 ? "s" : ""} encontrado${result.total !== 1 ? "s" : ""}`
        } else {
          productCount.textContent = `${result.total} produto${result.total !== 1 ? "s" : ""} disponívei${result.total !== 1 ? "s" : ""}`
        }
      }

      // Renderiza produtos
      if (!result.products.length) {
        grid.innerHTML = `<div class="loading-state" style="grid-column:1/-1">
          <i class="fas fa-box-open" style="font-size:3rem;opacity:0.5"></i>
          <p>Nenhum produto encontrado.</p>
        </div>`
        if (pagination) pagination.innerHTML = ""
        return
      }

      grid.innerHTML = result.products.map((p) => {
        const img = this.resolveImage(p)
        const src = img || imgPlaceholder(p.name)
        const price = fmt(p.price ?? p.salePrice ?? 0)
        const fallback = esc(imgPlaceholder(p.name)) // XSS fix

        return `
          <article class="product-card">
            <div class="product-thumb" style="min-height:180px;display:flex;align-items:center;justify-content:center;background:#0f172a;">
              <img src="${esc(src)}" alt="${esc(p.name || "Produto")}" loading="lazy"
                   onerror="this.onerror=null;this.src='${fallback}';"
                   style="max-height:170px;max-width:100%;object-fit:contain;display:block;">
            </div>
            <div class="product-info">
              <h3>${esc(p.name || "-")}</h3>
              <div class="product-price">${price}</div>
              <a class="btn btn-primary btn-sm" href="produto.html?id=${esc(p.$id || "")}">Ver detalhes</a>
            </div>
          </article>
        `
      }).join("")

      // Renderiza paginação
      this.renderPagination(pagination)

    } catch (err) {
      // Se token mudou, ignora erro de requisição antiga
      if (token !== this.requestToken) return

      grid.innerHTML = `<div class="loading-state" style="grid-column:1/-1">
        <i class="fas fa-triangle-exclamation" style="font-size:3rem;color:#f87171"></i>
        <p>Erro ao carregar produtos.</p>
      </div>`
      console.error("[Loja] Falha ao carregar produtos:", err)
    }
  }

  // ── Renderizar paginação ─────────────────────────────────────────────────
  renderPagination(container) {
    if (!container) return
    if (this.totalPages <= 1) {
      container.innerHTML = ""
      return
    }

    let html = `<div class="pagination-controls">`

    // Botão anterior
    if (this.currentPage > 1) {
      html += `<button class="page-btn" data-page="${this.currentPage - 1}"><i class="fas fa-chevron-left"></i></button>`
    }

    // Páginas
    const maxVisible = 5
    let startPage = Math.max(1, this.currentPage - Math.floor(maxVisible / 2))
    let endPage = Math.min(this.totalPages, startPage + maxVisible - 1)

    if (endPage - startPage < maxVisible - 1) {
      startPage = Math.max(1, endPage - maxVisible + 1)
    }

    if (startPage > 1) {
      html += `<button class="page-btn" data-page="1">1</button>`
      if (startPage > 2) html += `<span class="page-ellipsis">...</span>`
    }

    for (let i = startPage; i <= endPage; i++) {
      const active = i === this.currentPage ? " active" : ""
      html += `<button class="page-btn${active}" data-page="${i}">${i}</button>`
    }

    if (endPage < this.totalPages) {
      if (endPage < this.totalPages - 1) html += `<span class="page-ellipsis">...</span>`
      html += `<button class="page-btn" data-page="${this.totalPages}">${this.totalPages}</button>`
    }

    // Botão próximo
    if (this.currentPage < this.totalPages) {
      html += `<button class="page-btn" data-page="${this.currentPage + 1}"><i class="fas fa-chevron-right"></i></button>`
    }

    html += `</div>`
    container.innerHTML = html

    // Bind de eventos nos botões
    container.querySelectorAll(".page-btn").forEach(btn => {
      btn.addEventListener("click", (e) => {
        const page = parseInt(e.currentTarget.dataset.page)
        if (page && page !== this.currentPage) {
          this.currentPage = page
          this.loadProducts()
          // Scroll para o topo
          document.querySelector(".store-wrap")?.scrollIntoView({ behavior: "smooth" })
        }
      })
    })
  }

  // ── Resolver URL da imagem ───────────────────────────────────────────────
  resolveImage(p) {
    const fileId = p.imageURL || p.imageUrl || p.imageId || p.image || p.fileId
    if (!fileId) return null
    if (String(fileId).startsWith("http")) return fileId
    return `${CONFIG.ENDPOINT}/storage/buckets/${CONFIG.BUCKET_ID}/files/${fileId}/preview?project=${CONFIG.PROJECT_ID}`
  }
}
