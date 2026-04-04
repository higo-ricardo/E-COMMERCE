// ─── HIVERCAR · functions/proxy-appwrite/index.js ───────────────────────────
// PROXY para operações Appwrite - evita exposição de credenciais no frontend
//
// TRIGGER: HTTP (chamadas do frontend)
// ENDPOINTS:
//   /products - lista produtos
//   /products/search - busca produtos
//   /products/:id - produto por ID
//   /orders - criar pedido
//   /cart/validate - validar carrinho
//
// VARIÁVEIS DE AMBIENTE:
//   APPWRITE_ENDPOINT
//   APPWRITE_PROJECT_ID
//   APPWRITE_DB
//   APPWRITE_FUNCTION_API_ENDPOINT
//   APPWRITE_FUNCTION_PROJECT_ID
//   X_APPWRITE_KEY (server-side API key)

import { Client, Databases, Query } from "node-appwrite"

export default async ({ req, res, log, error }) => {
  const client = new Client()
    .setEndpoint(process.env.APPWRITE_ENDPOINT)
    .setProject(process.env.APPWRITE_PROJECT_ID)
    .setKey(req.headers["x-appwrite-key"] ?? '')

  const db = new Databases(client)

  const { method, path, body } = req
  const segments = path.split('/').filter(Boolean)

  try {
    // ── /products - Lista produtos ──────────────────────
    if (segments[0] === 'products') {
      const page = Math.max(1, parseInt(body?.page) || 1)
      const filters = body?.filters || {}
      const search = body?.search || ''

      if (segments[1] === 'search' && search) {
        // Busca por termo
        const queries = [
          Query.limit(15),
          Query.offset((page - 1) * 15),
          Query.orderDesc("$createdAt"),
        ]

        if (filters.category) queries.push(Query.equal("category", filters.category))
        if (filters.brand) queries.push(Query.equal("brand", filters.brand))

        let result
        try {
          result = await db.listDocuments(process.env.APPWRITE_DB, process.env.COL_PRODUCTS || 'products', [
            Query.search("name", search),
            ...queries
          ])
        } catch {
          // Fallback para busca em memória
          const all = await db.listDocuments(process.env.APPWRITE_DB, process.env.COL_PRODUCTS || 'products', [
            Query.limit(500)
          ])
          const searchLower = search.toLowerCase()
          result = {
            ...all,
            documents: all.documents.filter(doc => {
              const name = (doc.name || "").toLowerCase()
              const brand = (doc.brand || "").toLowerCase()
              const category = (doc.category || "").toLowerCase()
              const description = (doc.description || "").toLowerCase()
              return name.includes(searchLower) ||
                     brand.includes(searchLower) ||
                     category.includes(searchLower) ||
                     description.includes(searchLower)
            }).slice((page - 1) * 15, page * 15)
          }
        }

        return res.json({
          products: result.documents,
          total: result.total,
          page,
          pages: Math.ceil(result.total / 15)
        })

      } else if (segments[1]) {
        // Produto por ID
        const product = await db.getDocument(
          process.env.APPWRITE_DB,
          process.env.COL_PRODUCTS || 'products',
          segments[1]
        )
        return res.json(product)

      } else {
        // Lista produtos
        const queries = [
          Query.limit(15),
          Query.offset((page - 1) * 15),
          Query.orderDesc("$createdAt"),
        ]

        if (filters.category) queries.push(Query.equal("category", filters.category))
        if (filters.brand) queries.push(Query.equal("brand", filters.brand))

        const result = await db.listDocuments(
          process.env.APPWRITE_DB,
          process.env.COL_PRODUCTS || 'products',
          queries
        )

        return res.json({
          products: result.documents,
          total: result.total,
          page,
          pages: Math.ceil(result.total / 15)
        })
      }
    }

    // ── /orders - Criar pedido ──────────────────────────
    if (segments[0] === 'orders' && method === 'POST') {
      const orderData = body

      // Validar dados obrigatórios
      if (!orderData.user || !orderData.email || !orderData.items) {
        return res.json({ error: "Dados obrigatórios faltando" }, 400)
      }

      // Criar pedido (assumindo permissões adequadas)
      const order = await db.createDocument(
        process.env.APPWRITE_DB,
        process.env.COL_ORDERS || 'orders',
        'unique()', // ID único
        orderData
      )

      return res.json(order)
    }

    // ── /cart/validate - Validar carrinho ───────────────
    if (segments[0] === 'cart' && segments[1] === 'validate' && method === 'POST') {
      const { items } = body || {}

      if (!Array.isArray(items)) {
        return res.json({ valid: false, error: "Items deve ser array" })
      }

      // Validar produtos existem e preços estão corretos
      const validations = []
      for (const item of items) {
        try {
          const product = await db.getDocument(
            process.env.APPWRITE_DB,
            process.env.COL_PRODUCTS || 'products',
            item.$id
          )

          const valid = product && product.price == item.price && product.isActive !== false
          validations.push({
            id: item.$id,
            valid,
            currentPrice: product?.price,
            name: product?.name
          })
        } catch {
          validations.push({
            id: item.$id,
            valid: false,
            error: "Produto não encontrado"
          })
        }
      }

      const allValid = validations.every(v => v.valid)
      return res.json({ valid: allValid, validations })
    }

    return res.json({ error: "Endpoint não encontrado" }, 404)

  } catch (err) {
    error(`[proxy-appwrite] Erro: ${err.message}`)
    return res.json({ error: err.message }, 500)
  }
}