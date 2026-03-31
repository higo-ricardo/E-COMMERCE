# HIVECAR Copilot Workspace Instructions

## Objetivo
Prover contexto e padrão de trabalho para assistentes de código AI neste repositório.

## 1) Localização rápida de regras de estilo do projeto
- Já existe uma instrução de estilo principal:
  - `.github/instructions/senior-software-engineer.instructions.md`
- Use sempre esse arquivo para validação de PLANEJAR/EXECUTAR/VALIDAR + classificação de tarefa.

## 2) Onde buscar arquitetura e convenções
- Código cliente: `js/` (serviços e controle de fluxo de loja, checkout, usuários, estoque, fiscal, NFe etc.)
- Controllers (Node/Express style): `controllers/`
- Testes: `tests/` (Vitest)
- Scripts de qualidade: `scripts/check-text-integrity.mjs`
- Funções serverless: `functions/*` (usado na infra em nuvem)

## 3) Comandos principais
- Instalar dependências (não há lock no repositório mas padrão Node): `npm install`
- Testes: `npm test`
- Watch tests: `npm run test:watch`
- Cobertura: `npm run test:coverage`
- Lint de texto custom: `npm run lint:text`

## 4) Procedimento de PR/código
1. Classificar pedido (CLARA/AMBÍGUA/INCOMPLETA/PERIGOSA)
2. Definir modo (CRIAÇÃO/MANUTENÇÃO/ANÁLISE/REFACTORING/AMBÍGUO)
3. Seguir ciclo:
   - PLANEJAR: Identificar arquivos e itens de risco
   - EXECUTAR: Mudanças mínimas e teste local
   - VALIDAR: `npm test`, `npm run lint:text`; checar manualmente fluxos críticos (checkout, carrinho, estoque)
4. Comentar a solução em PR/commit com resultado e score (`0..10`) se aplicável.

## 5) Seção de exemplos de prompt (para usar localmente)
- "Refatore `cartService.js` para extrair regra de cálculo de frete em função `calculateShipping` e crie testes em `cartService.test.js`."
- "Corrija a validação de CPF em `controllers/checkout/CheckoutController.js` mantendo tratamento de erros e logs."
- "Adicione cobertura de teste para `nfService.js` com cenário de emissão falha em `tests/nfService.test.js`."

## 6) Nota de manutenção
- Se adicionar outra skill ou personalização, documentar em `.github/AGENTS.md` (opcional).
- Mantém o princípio "Link, don't embed": cite este arquivo e `.github/instructions/senior-software-engineer.instructions.md`.
