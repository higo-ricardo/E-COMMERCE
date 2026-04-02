// ─── HIVERCAR · reportsService.js ──────────────────────────────────────────────
// Service responsável por geração de relatórios e análises.
// Sprint 08 - US-91, US-92, US-93, US-97: Relatórios e Filtros
//
// Funcionalidades:
//   - Relatório de Vendas (faturamento)
//   - Relatório de Pedidos por Status
//   - Produtos Mais Vendidos
//   - Filtros por período

import { OrderRepository } from "./orderRepository.js"
import { ProductService } from "./productService.js"

export const ReportsService = {

  // ─── US-91: RELATÓRIO DE VENDAS ─────────────────────────────────────────────
  /**
   * Gera relatório de vendas/faturamento.
   * @param {Object} filters - Filtros do relatório
   * @param {string} [filters.dateFrom] - Data inicial (YYYY-MM-DD)
   * @param {string} [filters.dateTo] - Data final (YYYY-MM-DD)
   * @param {string} [filters.status] - Filtrar por status (opcional)
   * @returns {Promise<Object>} Relatório de vendas
   */
  async getSalesReport(filters = {}) {
    const orders = await OrderRepository.list(filters)
    
    // Filtra por período
    let filteredOrders = orders
    if (filters.dateFrom || filters.dateTo) {
      const from = filters.dateFrom ? new Date(filters.dateFrom + "T00:00:00") : null
      const to = filters.dateTo ? new Date(filters.dateTo + "T23:59:59") : null
      
      filteredOrders = orders.filter(o => {
        const t = new Date(o.$createdAt)
        if (from && t < from) return false
        if (to && t > to) return false
        return true
      })
    }

    // Calcula métricas
    const totalVendas = filteredOrders.reduce((s, o) => s + Number(o.total || 0), 0)
    const totalPedidos = filteredOrders.length
    const ticketMedio = totalPedidos > 0 ? totalVendas / totalPedidos : 0
    
    // Agrupa por dia
    const vendasPorDia = {}
    filteredOrders.forEach(o => {
      const dia = new Date(o.$createdAt).toISOString().split('T')[0]
      if (!vendasPorDia[dia]) {
        vendasPorDia[dia] = { total: 0, pedidos: 0 }
      }
      vendasPorDia[dia].total += Number(o.total || 0)
      vendasPorDia[dia].pedidos += 1
    })

    // Agrupa por mês
    const vendasPorMes = {}
    filteredOrders.forEach(o => {
      const mes = new Date(o.$createdAt).toISOString().slice(0, 7) // YYYY-MM
      if (!vendasPorMes[mes]) {
        vendasPorMes[mes] = { total: 0, pedidos: 0 }
      }
      vendasPorMes[mes].total += Number(o.total || 0)
      vendasPorMes[mes].pedidos += 1
    })

    // Agrupa por forma de pagamento
    const vendasPorPagamento = {}
    filteredOrders.forEach(o => {
      const pagamento = o.payment || "OUTROS"
      if (!vendasPorPagamento[pagamento]) {
        vendasPorPagamento[pagamento] = { total: 0, pedidos: 0 }
      }
      vendasPorPagamento[pagamento].total += Number(o.total || 0)
      vendasPorPagamento[pagamento].pedidos += 1
    })

    return {
      periodo: {
        de: filters.dateFrom || "início",
        ate: filters.dateTo || "atual",
      },
      resumo: {
        totalVendas: +totalVendas.toFixed(2),
        totalPedidos,
        ticketMedio: +ticketMedio.toFixed(2),
      },
      vendasPorDia: Object.entries(vendasPorDia).map(([data, dados]) => ({
        data,
        total: +dados.total.toFixed(2),
        pedidos: dados.pedidos,
      })),
      vendasPorMes: Object.entries(vendasPorMes).map(([mes, dados]) => ({
        mes,
        total: +dados.total.toFixed(2),
        pedidos: dados.pedidos,
      })),
      vendasPorPagamento: Object.entries(vendasPorPagamento).map(([pagamento, dados]) => ({
        pagamento,
        total: +dados.total.toFixed(2),
        pedidos: dados.pedidos,
      })),
      pedidos: filteredOrders,
    }
  },

  // ─── US-92: RELATÓRIO DE PEDIDOS POR STATUS ─────────────────────────────────
  /**
   * Gera relatório de pedidos agrupados por status.
   * @param {Object} filters - Filtros do relatório
   * @returns {Promise<Object>} Relatório por status
   */
  async getOrdersByStatusReport(filters = {}) {
    const orders = await OrderRepository.list(filters)
    
    // Filtra por período
    let filteredOrders = orders
    if (filters.dateFrom || filters.dateTo) {
      const from = filters.dateFrom ? new Date(filters.dateFrom + "T00:00:00") : null
      const to = filters.dateTo ? new Date(filters.dateTo + "T23:59:59") : null
      
      filteredOrders = orders.filter(o => {
        const t = new Date(o.$createdAt)
        if (from && t < from) return false
        if (to && t > to) return false
        return true
      })
    }

    // Agrupa por status
    const porStatus = {}
    filteredOrders.forEach(o => {
      const status = o.status || "DESCONHECIDO"
      if (!porStatus[status]) {
        porStatus[status] = {
          quantidade: 0,
          total: 0,
          pedidos: [],
        }
      }
      porStatus[status].quantidade += 1
      porStatus[status].total += Number(o.total || 0)
      porStatus[status].pedidos.push({
        numero: o.number,
        cliente: o.user,
        total: Number(o.total || 0),
        data: o.$createdAt,
      })
    })

    // Converte para array ordenado
    const resultado = Object.entries(porStatus).map(([status, dados]) => ({
      status,
      quantidade: dados.quantidade,
      total: +dados.total.toFixed(2),
      percentual: filteredOrders.length > 0 
        ? +(dados.quantidade / filteredOrders.length * 100).toFixed(1) 
        : 0,
      pedidos: dados.pedidos,
    })).sort((a, b) => b.quantidade - a.quantidade)

    return {
      periodo: {
        de: filters.dateFrom || "início",
        ate: filters.dateTo || "atual",
      },
      totalGeral: filteredOrders.length,
      porStatus: resultado,
    }
  },

  // ─── US-93: PRODUTOS MAIS VENDIDOS ──────────────────────────────────────────
  /**
   * Gera relatório de produtos mais vendidos.
   * @param {Object} filters - Filtros do relatório
   * @param {number} [filters.limit] - Limite de produtos (padrão: 20)
   * @returns {Promise<Object>} Relatório de produtos mais vendidos
   */
  async getTopProductsReport(filters = {}) {
    const orders = await OrderRepository.list(filters)
    
    // Filtra por período
    let filteredOrders = orders
    if (filters.dateFrom || filters.dateTo) {
      const from = filters.dateFrom ? new Date(filters.dateFrom + "T00:00:00") : null
      const to = filters.dateTo ? new Date(filters.dateTo + "T23:59:59") : null
      
      filteredOrders = orders.filter(o => {
        const t = new Date(o.$createdAt)
        if (from && t < from) return false
        if (to && t > to) return false
        return true
      })
    }

    // Extrai todos os itens dos pedidos
    const produtosVendidos = {}
    filteredOrders.forEach(o => {
      let items = []
      try {
        items = typeof o.items === 'string' ? JSON.parse(o.items) : o.items
      } catch (e) {
        items = []
      }

      items.forEach(item => {
        const key = item.$id || item.name || item.sku || JSON.stringify(item)
        if (!produtosVendidos[key]) {
          produtosVendidos[key] = {
            id: item.$id || key,
            nome: item.name || "Produto sem nome",
            sku: item.sku || "-",
            preco: Number(item.price || 0),
            quantidade: 0,
            total: 0,
          }
        }
        const qty = Number(item.qty || 1)
        produtosVendidos[key].quantidade += qty
        produtosVendidos[key].total += qty * Number(item.price || 0)
      })
    })

    // Converte para array e ordena
    const topProdutos = Object.values(produtosVendidos)
      .sort((a, b) => b.quantidade - a.quantidade)
      .slice(0, filters.limit || 20)
      .map((p, index) => ({
        ...p,
        posicao: index + 1,
        total: +p.total.toFixed(2),
      }))

    return {
      periodo: {
        de: filters.dateFrom || "início",
        ate: filters.dateTo || "atual",
      },
      totalPedidosAnalisados: filteredOrders.length,
      topProdutos,
    }
  },

  // ─── US-97: FILTROS DE PERÍODO ──────────────────────────────────────────────
  /**
   * Valida e normaliza filtros de data.
   * @param {Object} filters - Filtros informados
   * @returns {Object} Filtros validados
   */
  validateDateFilters(filters) {
    const result = { ...filters }
    
    // Valida dateFrom
    if (result.dateFrom) {
      const date = new Date(result.dateFrom)
      if (isNaN(date.getTime())) {
        result.dateFrom = null
      } else {
        result.dateFrom = date.toISOString().split('T')[0]
      }
    }
    
    // Valida dateTo
    if (result.dateTo) {
      const date = new Date(result.dateTo)
      if (isNaN(date.getTime())) {
        result.dateTo = null
      } else {
        result.dateTo = date.toISOString().split('T')[0]
      }
    }
    
    // Garante que dateTo >= dateFrom
    if (result.dateFrom && result.dateTo && result.dateTo < result.dateFrom) {
      result.dateTo = result.dateFrom
    }
    
    return result
  },

  // ─── EXPORTAÇÃO DE DADOS ────────────────────────────────────────────────────
  /**
   * Converte dados para formato CSV.
   * @param {Array} data - Array de objetos
   * @param {Array} columns - Colunas a exportar
   * @returns {string} CSV formatado
   */
  exportToCSV(data, columns) {
    if (!data || data.length === 0) return ""
    
    const header = columns.join(";")
    const rows = data.map(row => 
      columns.map(col => {
        const value = row[col] ?? ""
        // Escapa ponto e vírgula e quebras de linha
        const escaped = String(value).replace(/;/g, ",").replace(/\n/g, " ")
        return `"${escaped}"`
      }).join(";")
    )
    
    return [header, ...rows].join("\n")
  },

  /**
   * Prepara dados para impressão.
   * @param {string} title - Título do relatório
   * @param {Object} data - Dados do relatório
   * @returns {string} HTML formatado para impressão
   */
  preparePrintHTML(title, data) {
    const timestamp = new Date().toLocaleString("pt-BR")
    
    let content = ""
    if (data.resumo) {
      content += `
        <div style="margin-bottom:20px">
          <h3>Resumo</h3>
          <table style="width:100%;border-collapse:collapse">
            <tr>
              <td style="padding:8px;border:1px solid #ddd"><strong>Total Vendas</strong></td>
              <td style="padding:8px;border:1px solid #ddd">R$ ${data.resumo.totalVendas?.toFixed(2) || "0,00"}</td>
            </tr>
            <tr>
              <td style="padding:8px;border:1px solid #ddd"><strong>Total Pedidos</strong></td>
              <td style="padding:8px;border:1px solid #ddd">${data.resumo.totalPedidos || 0}</td>
            </tr>
            <tr>
              <td style="padding:8px;border:1px solid #ddd"><strong>Ticket Médio</strong></td>
              <td style="padding:8px;border:1px solid #ddd">R$ ${data.resumo.ticketMedio?.toFixed(2) || "0,00"}</td>
            </tr>
          </table>
        </div>
      `
    }
    
    if (data.vendasPorMes?.length) {
      content += `
        <div style="margin-top:20px">
          <h3>Vendas por Mês</h3>
          <table style="width:100%;border-collapse:collapse">
            <thead>
              <tr style="background:#f0f0f0">
                <th style="padding:8px;border:1px solid #ddd;text-align:left">Mês</th>
                <th style="padding:8px;border:1px solid #ddd;text-align:right">Total</th>
                <th style="padding:8px;border:1px solid #ddd;text-align:right">Pedidos</th>
              </tr>
            </thead>
            <tbody>
              ${data.vendasPorMes.map(m => `
                <tr>
                  <td style="padding:8px;border:1px solid #ddd">${m.mes}</td>
                  <td style="padding:8px;border:1px solid #ddd;text-align:right">R$ ${m.total.toFixed(2)}</td>
                  <td style="padding:8px;border:1px solid #ddd;text-align:right">${m.pedidos}</td>
                </tr>
              `).join("")}
            </tbody>
          </table>
        </div>
      `
    }
    
    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8">
        <title>${title}</title>
        <style>
          body { font-family: Arial, sans-serif; padding: 20px; }
          h1 { color: #26fd71; }
          h3 { color: #333; margin-top: 20px; }
          table { width: 100%; border-collapse: collapse; margin-bottom: 20px; }
          th, td { padding: 8px; border: 1px solid #ddd; }
          th { background: #1a1a1a; color: #fff; }
          .timestamp { color: #666; font-size: 12px; }
        </style>
      </head>
      <body>
        <h1>${title}</h1>
        <p class="timestamp">Gerado em: ${timestamp}</p>
        ${content}
        <script>window.onload = () => window.print()</script>
      </body>
      </html>
    `
  },
}
