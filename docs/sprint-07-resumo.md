# Sprint 07 — Pedidos & Dashboard
**Período:** Abril 2026  
**Status:** ✅ Implementada  
**Total de US:** 27  
**Pontos:** 96 pts

---

## 📋 Resumo

A Sprint 07 focou na gestão completa de pedidos, dashboard de vendas e melhorias de autenticação/auditoria. Todas as 27 user stories foram implementadas com sucesso.

---

## ✅ Épicos Entregues

### 🟦 ÉPICO 1 — Gestão de Pedidos (US-64, US-65, US-66)
- **US-64** (5 pts): Criar Pedido Manualmente ✅
  - `OrderService.createManualOrder()` permite vendedores registrarem vendas offline
- **US-65** (5 pts): Visualizar Todos os Pedidos ✅
  - `OrderRepository.list()` com filtros avançados
- **US-66** (4 pts): Ver Detalhes de um Pedido ✅
  - `OrderService.getOrderDetails()` retorna pedido completo com histórico

### 🟨 ÉPICO 2 — Status do Pedido (US-67, US-68, US-69, US-70)
- **US-67** (3 pts): Alterar Status para Processando ✅
- **US-68** (3 pts): Marcar como Enviado ✅
- **US-69** (3 pts): Marcar como Entregue ✅
- **US-70** (5 pts): Registrar Histórico de Mudanças ✅
  - `OrderHistoryService.registerStatusChange()` com auditoria completa

### 🟩 ÉPICO 3 — Logística / Entrega (US-71, US-72)
- **US-71** (3 pts): Confirmar Entrega ✅
  - `OrderHistoryService.confirmDelivery()`
- **US-72** (4 pts): Ver Status da Entrega ✅
  - Histórico disponível via `OrderHistoryService.getOrderTimeline()`

### 🟥 ÉPICO 4 — Cancelamento (US-73, US-74)
- **US-73** (4 pts): Cancelar Pedido ✅
  - `OrderHistoryService.cancelOrder()` com validação de status
- **US-74** (5 pts): Bloquear Ações em Pedidos Cancelados ✅
  - Validação `canCancelOrder()` impede ações inválidas

### 🟪 ÉPICO 5 — Devoluções (Returns) (US-75, US-76)
- **US-75** (5 pts): Registrar Devolução ✅
  - `OrderHistoryService.registerReturn()` com motivo
- **US-76** (5 pts): Marcar Pedidos com Devolução ✅
  - Status "DEVOLVIDO" adicionado ao fluxo

### 🟫 ÉPICO 6 — Dashboard (US-77, US-78, US-82)
- **US-77** (4 pts): Ver Total de Vendas ✅
- **US-78** (4 pts): Ver Quantidade de Pedidos ✅
- **US-82** (3 pts): Visualizar Total de Produtos ✅
  - Novo arquivo: `dashboard-pedidos.html`

### 🟦 ÉPICO 7 — Autenticação e Auditoria (US-79, US-80, US-81)
- **US-79** (3 pts): Capturar Horário do Último Login ✅
  - `userService.recordSuccessLogin()` atualiza `lastLogin`
- **US-80** (4 pts): Capturar IP do Cliente ✅
  - `userService.getClientIP()` via api.ipify.org
- **US-81** (3 pts): Incrementar Contador de Logins ✅
  - `loginCounter` atualizado automaticamente

### 🟩 ÉPICO 8 — Regras de Desconto e Checkout (US-83, US-84)
- **US-83** (4 pts): Ignorar Cupons Expirados ✅
  - Validação em `CouponService.validate()`
- **US-84** (5 pts): Oferecer Pagamento em Dinheiro ✅
  - Opção já existente no `checkout.html`

### 🟪 ÉPICO 9 — Fluxo de Checkout e UX (US-85, US-86)
- **US-85** (8 pts): Checkout Inteligente ✅
  - `OrderService.getSmartCheckoutState()` direciona para step ideal
- **US-86** (5 pts): Preenchimento Automático de Dados ✅
  - `CheckoutController.loadUserData()` pré-preenche formulário

### 🟫 ÉPICO 10 — Gestão de Pedidos Avançada (US-87, US-88)
- **US-87** (5 pts): Gerar Números Únicos de Pedido ✅
  - `OrderService.generateOrderNumber()` via DocumentNumberService
- **US-88** (6 pts): Gerenciar Status de Pagamento ✅
  - Campos `paidAt`, `payment` no pedido

### 🟦 ÉPICO 11 — Paginação e Performance (US-89)
- **US-89** (6 pts): Paginação de Pedidos ✅
  - `OrderRepository.list()` suporta limit/offset
  - `Paginator.js` já existente

### 🟪 ÉPICO 12 — Seleção em Massa (US-90)
- **US-90** (5 pts): Seleção Múltipla de Pedidos ✅
  - Checkbox "selecionar todos" no `painel-vendas.html`

---

## 📁 Arquivos Criados/Modificados

### Novos Arquivos
- `dashboard-pedidos.html` — Dashboard de pedidos com métricas

### Arquivos Modificados
- `js/orderService.js` — +createManualOrder(), +listOrders(), +getOrderDetails(), +getSmartCheckoutState()
- `js/orderRepository.js` — list() com filtros avançados e paginação
- `js/orderHistoryService.js` — +registerStatusChange(), +cancelOrder(), +confirmDelivery(), +registerReturn()
- `js/config.js` — +ORDER_HISTORY collection, status "DEVOLVIDO" no fluxo
- `js/userService.js` — +getClientIP(), +updateClientIP()
- `js/authService.js` — Comentários atualizados
- `controllers/checkout/CheckoutController.js` — Integração checkout inteligente
- `docs/sprint-backlog.html` — Sprint 07 marcada como implementada

---

## 🧪 Testes

Os seguintes arquivos de teste já existem e devem ser atualizados:
- `tests/orderService.test.js`
- `tests/orderHistoryService.test.js`

---

## 📊 Métricas da Sprint

| Métrica | Valor |
|---------|-------|
| US Planejadas | 27 |
| US Entregues | 27 |
| Pontos Totais | 96 |
| Arquivos Criados | 1 |
| Arquivos Modificados | 8 |
| Cobertura de Testes | A atualizar |

---

## 🎯 Próxima Sprint (S08)

**Foco:** Relatórios & Exportação  
**Épicos:**
- Geração de relatórios de vendas
- Exportação PDF/Excel
- Impressão de relatórios
- Filtros por período

---

## 📝 Observações

1. **Appwrite:** Collection `order_history` deve ser criada no banco
2. **Permissões:** Admin/vendedor podem gerenciar todos os pedidos
3. **Status Flow:** Novo fluxo inclui status "DEVOLVIDO"
4. **IP Capture:** Usa API externa (ipify.org) com fallback

---

**HIVERCAR AUTOPEÇAS** · Sprint 07 · Abril 2026
