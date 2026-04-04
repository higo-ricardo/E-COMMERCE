// ─── HIVERCAR · apiService.js ────────────────────────────────────────────────
// PROXY API - Evita exposição de credenciais Appwrite no frontend
//
// Usa Appwrite Functions como proxy para operações que antes usavam SDK direto.
// Credenciais ficam server-side, frontend só recebe dados.

import { CONFIG } from "./config.js"

class ApiService {
  constructor() {
    this.baseUrl = `${CONFIG.ENDPOINT}/functions/proxy-appwrite/executions`
    this.headers = {
      "Content-Type": "application/json",
      "X-Appwrite-Project": CONFIG.PROJECT_ID,
      // Adicionar auth token se necessário
    }
  }

  async request(endpoint, options = {}) {
    const url = this.baseUrl
    const body = {
      path: endpoint,
      method: options.method || 'GET',
      body: options.body || {},
      ...options
    }

    try {
      const response = await fetch(url, {
        method: 'POST',
        headers: this.headers,
        body: JSON.stringify(body)
      })

      if (!response.ok) {
        const error = await response.json().catch(() => ({ error: 'Network error' }))
        throw new Error(error.error || `HTTP ${response.status}`)
      }

      return await response.json()
    } catch (error) {
      console.error(`[ApiService] ${endpoint}:`, error)
      throw error
    }
  }

  // ── Produtos ──────────────────────────────────────────────────────────────
  async getProducts(page = 1, filters = {}) {
    return this.request('/products', {
      method: 'POST',
      body: { page, filters }
    })
  }

  async searchProducts(term, page = 1, filters = {}) {
    return this.request('/products/search', {
      method: 'POST',
      body: { search: term, page, filters }
    })
  }

  async getProduct(id) {
    return this.request(`/products/${id}`)
  }

  // ── Pedidos ──────────────────────────────────────────────────────────────
  async createOrder(orderData) {
    return this.request('/orders', {
      method: 'POST',
      body: orderData
    })
  }

  // ── Carrinho ─────────────────────────────────────────────────────────────
  async validateCart(items) {
    return this.request('/cart/validate', {
      method: 'POST',
      body: { items }
    })
  }
}

export const apiService = new ApiService()