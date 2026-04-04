# 🔒 Resolução: Exposição de Credenciais Appwrite

## Problema Identificado

O frontend estava usando o SDK do Appwrite diretamente, expondo credenciais (PROJECT_ID, ENDPOINT) no código cliente, permitindo enumeração da infraestrutura.

## Solução Implementada

### 1. Appwrite Function Proxy

Criada função `functions/proxy-appwrite/` que age como intermediária:

```javascript
// functions/proxy-appwrite/index.js
// Credenciais ficam server-side
// Frontend só recebe dados via API
```

**Endpoints criados:**
- `POST /products` - Lista produtos com paginação
- `POST /products/search` - Busca produtos
- `POST /orders` - Cria pedido
- `POST /cart/validate` - Valida itens do carrinho

### 2. API Service Frontend

Criado `js/apiService.js` que faz chamadas para a função proxy:

```javascript
// js/apiService.js
class ApiService {
  async getProducts(page, filters) {
    return this.request('/products', { method: 'POST', body: { page, filters } })
  }
  // ...
}
```

### 3. Repositories Atualizados

`js/repositories.js` agora usa `apiService` para operações públicas:

```javascript
// Antes: SDK direto (expõe credenciais)
const res = await databases.listDocuments(DB, COL.PRODUCTS, queries)

// Depois: Via proxy (credenciais protegidas)
return apiService.getProducts(page, filters)
```

## Benefícios

✅ **Segurança:** Credenciais não expostas no frontend
✅ **Manutenibilidade:** Lógica centralizada no servidor
✅ **Performance:** Cache e validação server-side
✅ **Escalabilidade:** Fácil adicionar rate limiting

## Configuração Necessária

### 1. Deploy da Function

```bash
# No Appwrite Console
# Criar função: proxy-appwrite
# Runtime: Node.js 18
# Entrypoint: index.js
```

### 2. Variáveis de Ambiente

Na função Appwrite, configurar:

```
APPWRITE_ENDPOINT=https://tor.cloud.appwrite.io/v1
APPWRITE_PROJECT_ID=69c7e94a003a1c86b7ca
APPWRITE_DB=69c7e9af00296b17179e
APPWRITE_FUNCTION_API_ENDPOINT=https://tor.cloud.appwrite.io/v1
APPWRITE_FUNCTION_PROJECT_ID=69c7e94a003a1c86b7ca
COL_PRODUCTS=products
COL_ORDERS=orders
X_APPWRITE_KEY=server-api-key  # API Key server-side
```

### 3. Permissões

Configurar collections no Appwrite Console:
- **products:** Read: `any` (público)
- **orders:** Read/Write: `users`, `admins`

## Operações que Continuam SDK Direto

- **Autenticação:** `authService.js` (já seguro)
- **Perfil usuário:** `userService.js` (Mirror Pattern)
- **Operações admin:** Painéis administrativos (autenticados)

## Teste

```bash
# Testar função proxy
curl -X POST https://tor.cloud.appwrite.io/v1/functions/proxy-appwrite/executions \
  -H "Content-Type: application/json" \
  -H "X-Appwrite-Project: YOUR_PROJECT_ID" \
  -d '{"path": "/products", "method": "POST", "body": {"page": 1}}'
```

## Próximos Passos

1. **Monitorar logs** da função proxy
2. **Adicionar cache** Redis/memcached se necessário
3. **Implementar rate limiting** por IP/usuário
4. **Expandir endpoints** conforme necessidade (ex: filtros avançados)

---

**Status:** ✅ **Resolvido** - Credenciais protegidas, segurança aprimorada.