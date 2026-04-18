import { ProductRepository, OrderRepository } from "../../js/repositories.js"
import { esc, fmt, imgPlaceholder } from "../../js/utils.js"
import { CONFIG } from "../../js/config.js"

export class HomeController {
  async init() {
    await this.loadProducts()
    await this.loadStats()
    this.initPromoBanner()
  }

  async loadStats() {
    try {
      // Carregar total de produtos
      const { total: totalProducts } = await ProductRepository.list(1, {})
      const statProdEl = document.getElementById('statProd')
      if (statProdEl) {
        statProdEl.textContent = totalProducts.toLocaleString('pt-BR')
      }

      // Carregar total de pedidos
      const { total: totalOrders } = await OrderRepository.list({})
      const statOrdersEl = document.getElementById('statOrders')
      if (statOrdersEl) {
        statOrdersEl.textContent = totalOrders.toLocaleString('pt-BR')
      }
    } catch (err) {
      console.error('[Home] Falha ao carregar estatísticas:', err)
      // Fallback: manter "Carregando..." ou definir valores padrão
      const statProdEl = document.getElementById('statProd')
      if (statProdEl && statProdEl.textContent === 'Carregando...') {
        statProdEl.textContent = 'N/A'
      }
      const statOrdersEl = document.getElementById('statOrders')
      if (statOrdersEl && statOrdersEl.textContent === 'Carregando...') {
        statOrdersEl.textContent = 'N/A'
      }
    }
  }

  initPromoBanner() {
    const promos = [
      { title: "OFERTA ESPECIAL", desc: "10% OFF em Freios - Apenas hoje!", icon: "fa-fire" },
      { title: "DESCONTO RELÂMPAGO", desc: "20% OFF em Óleos e Filtros!", icon: "fa-bolt" },
      { title: "PROMO MECÂNICO", desc: "15% OFF em Peças de Motor!", icon: "fa-cog" },
      { title: "FRETE GRÁTIS", desc: "Em compras acima de R$ 500!", icon: "fa-truck" }
    ];

    let currentIndex = 0;
    const titleEl = document.getElementById('promoTitle');
    const descEl = document.getElementById('promoDesc');
    const iconEl = document.querySelector('.promo-icon i');

    if (!titleEl || !descEl || !iconEl) return;

    const updatePromo = () => {
      const promo = promos[currentIndex];
      titleEl.textContent = promo.title;
      descEl.textContent = promo.desc;
      iconEl.className = `fas ${promo.icon}`;
      currentIndex = (currentIndex + 1) % promos.length;
    };

    // Rotate promos every 10 seconds
    updatePromo();
    setInterval(updatePromo, 10000);
  }

  async loadProducts() {
    const grid = document.getElementById("products")
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
        grid.innerHTML = `<div class="loading-state" style="grid-column:1/-1">Nenhum produto disponível.</div>`
        return
      }

      grid.innerHTML = products.slice(0, 8).map((p) => {
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
      console.error("[Home] Falha ao carregar produtos:", err)
    }
  }
}
