// ─── HIVERCAR · loja.js ──────────────────────────────────────────────────────
// Controlador da página loja.html. Apenas UI — zero lógica de negócio.
// Implementa: listagem, busca e filtros por nome, marca, categoria e veículo.
// Camada: Presentation.

import { ProductService }  from "./productService.js"
import { CartService }     from "./cartService.js"
import { esc, imgPlaceholder, fmt, initParticles, initNavToggle }
  from "./utils.js"

// ── ESTADO ────────────────────────────────────────────────────────────────────
let curPage    = 1
let curTerm    = ""
let curFilters = { category: "", brand: "", vehicle: "" }

// ── REFS ──────────────────────────────────────────────────────────────────────
const badge        = document.getElementById("cartBadge")
const grid         = document.getElementById("products")
const paginationEl = document.getElementById("pagination")
const countEl      = document.getElementById("productCount")
const searchInput  = document.getElementById("searchInput")
const searchBtn    = document.getElementById("searchBtn")
const filterCat    = document.getElementById("filterCategory")
const filterBrand  = document.getElementById("filterBrand")
const filterVeh    = document.getElementById("filterVehicle")
const clearFilters = document.getElementById("clearFilters")
const toast        = document.getElementById("toast")

if (badge) badge.textContent = CartService.count()

// ── TOAST ─────────────────────────────────────────────────────────────────────
function showToast(msg) {
  if (!toast) return
  toast.textContent = msg
  toast.classList.add("show")
  setTimeout(() => toast.classList.remove("show"), 2000)
}

// ── FILTROS: popula selects ───────────────────────────────────────────────────
async function loadFilterOptions() {
  try {
    const { categories, brands } = await ProductService.getFilterOptions()

    if (filterCat) {
      filterCat.innerHTML = `<option value="">Todas as Categorias</option>` +
        categories.map(c => `<option value="${esc(c)}">${esc(c)}</option>`).join("")
    }
    if (filterBrand) {
      filterBrand.innerHTML = `<option value="">Todas as Marcas</option>` +
        brands.map(b => `<option value="${esc(b)}">${esc(b)}</option>`).join("")
    }
  } catch { /* filtros ficam vazios — não impede o carregamento */ }
}

// ── US-28: HIGHLIGHT DO TERMO BUSCADO ─────────────────────────────────────────
function highlight(text, term) {
  if (!term || !text) return esc(text || "")
  const safe  = term.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")
  const regex = new RegExp(`(${safe})`, "gi")
  return esc(text).replace(regex, '<mark style="background:rgba(38,253,113,.25);color:var(--green);padding:0 2px">$1</mark>')
}

// ── RENDER GRID ───────────────────────────────────────────────────────────────
function renderGrid(products) {
  if (!grid) return
  if (!products.length) {
    grid.innerHTML = `<div class="loading-state" style="grid-column:1/-1">Nenhum produto encontrado para os filtros aplicados.</div>`
    return
  }
  grid.innerHTML = products.map(p => `
    <div class="product-card">
      <div class="product-img">
        <img src="${esc(p.image || imgPlaceholder(p.name))}" alt="${esc(p.name)}" loading="lazy" decoding="async">
        ${p.brand ? `<span class="product-badge badge-muted">${esc(p.brand)}</span>` : ""}
      </div>
      <div class="product-body">
        <div class="product-name">${highlight(p.name, curTerm)}</div>
        ${p.category ? `<div class="product-meta"><i class="fas fa-tag"></i> ${highlight(p.category, curTerm)}</div>` : ""}
        ${p.vehicles  ? `<div class="product-meta"><i class="fas fa-car"></i> ${highlight(p.vehicles, curTerm)}</div>`  : ""}
        ${p.ncm && curTerm ? `<div class="product-meta" style="font-size:10px"><i class="fas fa-barcode"></i> NCM: ${highlight(p.ncm, curTerm)}</div>` : ""}
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
    showToast("✓ Produto adicionado ao carrinho!")
    b.innerHTML = "✓ Adicionado"; b.disabled = true
    setTimeout(() => { b.innerHTML = '<i class="fas fa-cart-plus"></i> Adicionar'; b.disabled = false }, 1200)
  }
}

// ── RENDER PAGINAÇÃO ──────────────────────────────────────────────────────────
function renderPagination({ page, pages }) {
  if (!paginationEl) return
  if (pages <= 1) { paginationEl.innerHTML = ""; return }
  paginationEl.innerHTML = Array.from({ length: pages }, (_, i) => i + 1)
    .map(n => `<button class="page-btn${n === page ? " active" : ""}" data-page="${n}">${n}</button>`)
    .join("")
  paginationEl.onclick = e => {
    const b = e.target.closest(".page-btn")
    if (b) load(Number(b.dataset.page))
  }
}

// ── LOAD PRINCIPAL ────────────────────────────────────────────────────────────
async function load(page = 1) {
  curPage = page
  if (grid) grid.innerHTML = `<div class="loading-state" style="grid-column:1/-1"><div class="spinner"></div> Carregando...</div>`

  try {
    const result = curTerm
      ? await ProductService.search(curTerm, page, curFilters)
      : await ProductService.list(page, curFilters)

    if (countEl) countEl.textContent = `${result.total} produto${result.total !== 1 ? "s" : ""}`
    renderGrid(result.products)
    renderPagination(result)
  } catch (e) {
    if (grid) grid.innerHTML = `<div class="loading-state" style="grid-column:1/-1;color:var(--red)">
      <i class="fas fa-circle-exclamation"></i> Erro ao carregar: ${esc(e.message)}
    </div>`
  }
}

// ── EVENTOS ───────────────────────────────────────────────────────────────────
if (searchBtn) searchBtn.onclick = () => {
  curTerm = searchInput?.value.trim() || ""
  load(1)
}

if (searchInput) searchInput.onkeydown = e => {
  if (e.key === "Enter") { curTerm = e.target.value.trim(); load(1) }
}

if (filterCat) filterCat.onchange = () => {
  curFilters.category = filterCat.value; load(1)
}

if (filterBrand) filterBrand.onchange = () => {
  curFilters.brand = filterBrand.value; load(1)
}

if (filterVeh) {
  let debounce
  filterVeh.oninput = () => {
    clearTimeout(debounce)
    debounce = setTimeout(() => { curFilters.vehicle = filterVeh.value.trim(); load(1) }, 400)
  }
}

if (clearFilters) clearFilters.onclick = () => {
  curTerm = ""; curFilters = { category: "", brand: "", vehicle: "" }
  if (searchInput)  searchInput.value  = ""
  if (filterCat)    filterCat.value    = ""
  if (filterBrand)  filterBrand.value  = ""
  if (filterVeh)    filterVeh.value    = ""
  load(1)
}

// ── INIT ──────────────────────────────────────────────────────────────────────
initParticles()
initNavToggle()
loadFilterOptions()
load()
