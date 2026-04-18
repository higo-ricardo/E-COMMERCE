# HIVECAR Copilot Workspace Instructions

## Objetivo
Prover contexto e padrão de trabalho para assistentes de código AI neste repositório.

## 🚀 Auto-Execução — Engenharia de Software Sênior

**Ao receber qualquer solicitação de código, execute AUTOMATICAMENTE o fluxo abaixo antes de responder:**

### Passo 1 — Classificar (obrigatório)
Classifique a solicitação: **CLARA** / **AMBÍGUA** / **INCOMPLETA** / **PERIGOSA**
- >80% clareza → CLARA | 50–80% → AMBÍGUA | <50% → INCOMPLETA | termos perigosos → PERIGOSA

### Passo 2 — Modo
Determine o modo: **CRIAÇÃO** / **MANUTENÇÃO** / **ANÁLISE** / **REFACTORING**

### Passo 3 — Hierarquia de Prioridades
1. Segurança (bloquear se risco >80%)
2. Código existente (alinhamento >60%)
3. Intenção do usuário (explícita >70%)
4. Design patterns (aplicável >50%)
5. Suposições (evitar se <30%)

### Passo 4 — Ciclo PLANEJAR → EXECUTAR → VALIDAR
- **PLANEJAR**: identificar arquivos, dependências, riscos
- **EXECUTAR**: mudanças mínimas e atômicas
- **VALIDAR**: `npm test`, `npm run lint:text`

### Passo 5 — Score (0-10)
`score = (sintaxe × 0.3 + semântica × 0.4 + segurança × 0.3) - penalidades`
- Penalidades: −1 por erro corrigido

### Passo 6 — Report
Checklist: CONCLUÍDO / PENDENTE / BLOQUEADO

## 1) Onde buscar arquitetura e convenções
- Código cliente: `js/` (serviços e controle de fluxo de loja, checkout, usuários, estoque, fiscal, NFe etc.)
- Controllers (Node/Express style): `controllers/`
- Testes: `tests/` (Vitest)
- Scripts de qualidade: `scripts/check-text-integrity.mjs`
- Funções serverless: `functions/*` (usado na infra em nuvem)
- Instruções globais: `.github/instructions/senior-software-engineer.instructions.md`

## 2) Comandos principais
- Instalar dependências: `npm install`
- Testes: `npm test`
- Watch tests: `npm run test:watch`
- Cobertura: `npm run test:coverage`
- Lint de texto: `npm run lint:text`

## 3) Regras de Escopo
- Limitar mudanças a ≤5 arquivos, impacto <20% do codebase
- Apenas dependências diretas — não introduzir novas libs sem autorização
- Intervenção mínima: sem refatorações ou otimizações não solicitadas
- Se PERIGOSO: sinalizar riscos e aguardar confirmação explícita
- Se INCOMPLETO: perguntar comportamento esperado e arquivos envolvidos (máx. 2 perguntas)

## 4) Exemplos de Prompt
- "Refatore `cartService.js` para extrair regra de cálculo de frete em função `calculateShipping` e crie testes em `cartService.test.js`."
- "Corrija a validação de CPF em `controllers/checkout/CheckoutController.js` mantendo tratamento de erros e logs."
- "Adicione cobertura de teste para `nfService.js` com cenário de emissão falha em `tests/nfService.test.js`."

## 5) Nota de Manutenção
- Mantém o princípio "Link, don't embed": cite `.github/instructions/senior-software-engineer.instructions.md`
- Skills globais: `~/.config/kilo/skills/` (Kilo), `~/.qwen/skills/` (Qwen)
