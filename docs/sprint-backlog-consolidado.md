# 📊 HIVECAR — Sprint Backlog Consolidado

**Última atualização:** Abril 2026  
**Versão:** v10.0

---

## 📈 Visão Geral

| Sprint | Status | Período | Pontos | US | Épico Principal |
|--------|--------|---------|--------|-----|-----------------|
| S01 | ✅ Concluída | Jan–Fev 2026 | 34 pts | 4 | Fundação (Auth, Loja, Design) |
| S02 | ✅ Concluída | Fev–Mar 2026 | 47 pts | 8 | Vendas & Clientes |
| S03 | ✅ Concluída | Mar 2026 | 39 pts | 7 | Integrações & API |
| S04 | ✅ Concluída | Abr 2026 | 72 pts | 12 | Fiscal & TaxEngine |
| S05 | ⚡ Implementada | Mai 2026 | 58 pts | 9 | NF-e & Fiscal Completo |
| S06 | ✅ Implementada | Abril 2026 | 78 pts | 12+2 | Cupons de Desconto |
| S07 | ✅ Implementada | Abril 2026 | 96 pts | 27 | Pedidos & Dashboard |
| S08 | ✅ Implementada | Abril 2026 | 38 pts | 7 | Relatórios & Exportação |

**Total:** 462 pontos planejados | 446 pontos entregues | 82 US implementadas

---

## ✅ Sprints Concluídas

### Sprint 01 — Fundação (34 pts)
**Objetivo:** Colocar a loja no ar com autenticação real, design dark-tech e dashboard admin básico.

**Entregas:**
- US-01: Listagem de Produtos (8 pts) ✅
- US-05: Carrinho de Compras (5 pts) ✅
- US-11: Cadastro e Login — Auth Mirror Pattern (8 pts) ✅
- US-22: Design System — Dark Tech UI (5 pts) ✅
- US-25: Dashboard Admin ERP (8 pts) ✅

**Arquivos principais:** `loja.html`, `loja.js`, `productService.js`, `login.html`, `cadastro.html`, `dashboard.html`

---

### Sprint 02 — Vendas, Clientes e Segurança (47 pts)
**Objetivo:** Fechar o ciclo de compra com checkout completo, área do cliente, painel de vendas e segurança robusta.

**Entregas:**
- US-06: Checkout — 3 Steps + Validação Robusta (8 pts) ✅
- US-07: Integração com Gateways de Pagamento (8 pts) ✅
- US-08: Área do Cliente (Minha Conta) (5 pts) ✅
- US-09: Histórico de Pedidos do Cliente (5 pts) ✅
- US-10: Cancelamento de Pedido pelo Cliente (5 pts) ✅
- US-26: Painel de Vendas (8 pts) ✅
- US-27: Segurança — Rate Limiting & Bloqueio (8 pts) ✅

**Arquivos principais:** `checkout.html`, `cart.html`, `minha-conta.html`, `painel-vendas.html`

---

### Sprint 03 — Integrações e API (39 pts)
**Objetivo:** Expandir integrações e melhorar API para suporte a múltiplos canais.

**Entregas:**
- US-28: Busca Full-Text de Produtos (5 pts) ✅
- US-29: Filtros Avançados (Marca, Veículo, Ano) (5 pts) ✅
- US-30: Cache de Produtos (8 pts) ✅
- US-31: API de Produtos (REST) (8 pts) ✅
- US-32: API de Pedidos (REST) (8 pts) ✅
- US-33: Webhooks para Integrações (5 pts) ✅

**Arquivos principais:** `productService.js`, `orderService.js`, `api/`

---

### Sprint 04 — Estoque e Serviço (72 pts)
**Objetivo:** Implementar gestão completa de estoque e ordens de serviço.

**Entregas:**
- US-34: Controle de Estoque (8 pts) ✅
- US-35: Movimentação de Estoque (8 pts) ✅
- US-36: Inventário (6 pts) ✅
- US-37: Alerta de Estoque Baixo (5 pts) ✅
- US-38: Ordem de Serviço (OS) (10 pts) ✅
- US-39: Status de OS (5 pts) ✅
- US-40: Timeline de OS (5 pts) ✅
- US-41: Gestão de Clientes (CRM) (8 pts) ✅
- US-42: Exportação de Dados (8 pts) ✅
- US-43: Relatórios de Estoque (9 pts) ✅

**Arquivos principais:** `admin-estoque.html`, `admin-os.html`, `customers.html`, `stockService.js`

---

### Sprint 05 — Fiscal Completo (58 pts) ⚡
**Objetivo:** Implementar emissão de NF-e e integração fiscal completa.

**Status:** ✅ Código 100% implementado. Aguarda desbloqueio fiscal (EC 132/2023).

**Entregas:**
- US-44: TaxEngine — Cálculo de Impostos (8 pts) ✅
- US-45: Emissão de NF-e (10 pts) ✅
- US-46: Cancelamento de NF-e (8 pts) ✅
- US-47: DANFE (PDF) (8 pts) ✅
- US-48: Integração SEFAZ (10 pts) ✅
- US-49: Validação de Certificados (8 pts) ✅
- US-50+: Testes Unitários Fiscais (6 pts) ✅

**Arquivos principais:** `admin-fiscal.html`, `nfService.js`, `taxEngine.js`, `documentNumberService.js`

**Bloqueadores:**
- Certificado A1 necessário
- Homologação SEFAZ pendente
- Integrador NF-e contratado
- Alíquotas validadas por contador

---

### Sprint 06 — Cupons de Desconto (78 pts) ✅
**Objetivo:** Implementar sistema completo de cupons de desconto com regras de negócio.

**Entregas:**
- US-50: Criar Cupom (8 pts) ✅
- US-51: Limite de Uso Global (5 pts) ✅
- US-52: Limite de Uso por Usuário (5 pts) ✅
- US-53: Validar Cupom no Checkout (5 pts) ✅
- US-54: Verificar Expiração do Cupom (3 pts) ✅
- US-55: Verificar Limite de Uso (5 pts) ✅
- US-56: Aplicar Desconto no Carrinho (8 pts) ✅
- US-57: Evitar Total Negativo (3 pts) ✅
- US-58: Cupom por Produto (8 pts) 📋 **PENDENTE**
- US-59: Cupom por Categoria (8 pts) 📋 **PENDENTE**
- US-60: Bloquear Cupom Expirado (3 pts) ✅
- US-61: Bloquear Cupom Duplicado (3 pts) ✅
- US-62: Limitar Desconto Máximo (50%) (5 pts) ✅
- US-63: Bloquear Cumulatividade de Cupons (5 pts) ✅

**Arquivos principais:** `couponService.js`, `couponRepository.js`, `couponUsageRepository.js`, `dashboard-cupons.html`

---

### Sprint 07 — Pedidos & Dashboard (96 pts) ✅
**Objetivo:** Gestão completa de pedidos, status, logística e dashboard.

**Entregas:**
- **ÉPICO 1 — Gestão de Pedidos:** US-64, US-65, US-66 ✅
- **ÉPICO 2 — Status do Pedido:** US-67, US-68, US-69, US-70 ✅
- **ÉPICO 3 — Logística/Entrega:** US-71, US-72 ✅
- **ÉPICO 4 — Cancelamento:** US-73, US-74 ✅
- **ÉPICO 5 — Devoluções:** US-75, US-76 ✅
- **ÉPICO 6 — Dashboard:** US-77, US-78, US-82 ✅
- **ÉPICO 7 — Autenticação e Auditoria:** US-79, US-80, US-81 ✅
- **ÉPICO 8 — Regras de Desconto:** US-83, US-84 ✅
- **ÉPICO 9 — Checkout Inteligente:** US-85, US-86 ✅
- **ÉPICO 10 — Gestão Avançada:** US-87, US-88 ✅
- **ÉPICO 11 — Paginação:** US-89 ✅
- **ÉPICO 12 — Seleção em Massa:** US-90 ✅

**Arquivos principais:** `orderService.js`, `orderRepository.js`, `orderHistoryService.js`, `dashboard-pedidos.html`

---

## 📋 Sprints Implementadas

### Sprint 08 — Relatórios & Exportação (38 pts) ✅
**Objetivo:** Geração, exportação e impressão de relatórios.

**Entregas:**
- US-91: Gerar Relatório de Vendas (5 pts) ✅
- US-92: Relatório de Pedidos por Status (5 pts) ✅
- US-93: Produtos Mais Vendidos (6 pts) ✅
- US-94: Exportar Relatório em PDF (6 pts) ✅
- US-95: Exportar Relatório em Excel (6 pts) ✅
- US-96: Imprimir Relatório (4 pts) ✅
- US-97: Filtrar por Período (6 pts) ✅

**Arquivos principais:** `reportsService.js`, `dashboard-relatorios.html`, `reports.css`

---

## 📋 Próximas Sprints

**Não há sprints pendentes no backlog atual.**

O projeto HIVERCAR está com todas as 8 sprints planejadas implementadas (S05 aguarda apenas desbloqueio fiscal para go-live).

---

## 📊 Métricas do Projeto

| Métrica | Valor |
|---------|-------|
| **Sprints Implementadas** | 7 de 8 (87.5%) |
| **Pontos Entregues** | 446 de 462 (96.5%) |
| **US Implementadas** | 82 de 84 (97.6%) |
| **Arquivos Criados** | 80+ |
| **Testes Unitários** | 190+ |
| **Bloqueadores Ativos** | 1 (S05 Fiscal) |

---

## 🎯 Próximos Passos

1. **Sprint 05** — Aguardar desbloqueio fiscal para go-live (Certificado A1, SEFAZ, Integrador NF-e)
2. **US-58/59** — Implementar cupons por produto/categoria (débito técnico S06)
3. **Novas Sprints** — Definir backlog para próximas funcionalidades (ex: marketplace, mobile app, etc.)

---

**HIVERCAR AUTOPEÇAS** · Abril 2026
