import { ProductRepository } from "../../js/repositories.js"
import { esc, fmt, imgPlaceholder } from "../../js/utils.js"
import { CONFIG } from "../../js/config.js"

export class StoreController {
  async init() {
    await this.load()
  }

  async load() {
    const grid = document.getElementById("storeProducts") || document.getElementById("products")
    if (!grid) return
    const resolveImage = (p) => {
      // Compatibilidade: tenta todos os campos possíveis (legado + atual)
      const fileId = p.imageURL || p.imageUrl || p.imageId || p.image || p.fileId
      if (!fileId) return null
      // Se já é URL completa, retorna como está
      if (String(fileId).startsWith("http")) return fileId
      // Se é fileId puro, monta URL com /preview (funciona sem auth)
      return `${CONFIG.ENDPOINT}/storage/buckets/${CONFIG.BUCKET_ID}/files/${fileId}/preview?project=${CONFIG.PROJECT_ID}`
    }

    try {
      const { products = [] } = await ProductRepository.list(1, {})
      if (!products.length) {
        grid.innerHTML = `<div class="loading-state" style="grid-column:1/-1">Nenhum produto encontrado.</div>`
        return
      }
      grid.innerHTML = products.map((p) => {
        const img = resolveImage(p)
        const src = img || imgPlaceholder(p.name)
        const price = fmt(p.price ?? p.salePrice ?? 0)
        const fallback = imgPlaceholder(p.name)
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
    } catch (err) {
      grid.innerHTML = `<div class="loading-state" style="grid-column:1/-1">Erro ao carregar produtos: ${esc(err?.message || err)}</div>`
      console.error("[Loja] Falha ao carregar produtos:", err)
    }
  }
}
