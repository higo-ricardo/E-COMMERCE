---
name: senior-software-engineer
description: "Use este prompt para invocar a skill 'senior-software-engineer' com um fluxo de engenharia sênior (classificar, definir modo, planear, executar, validar, score, report)."
---

# Prompt: Engenheiro de Software Sênior

## Inicialização

1. Carregar `.github/instructions/senior-software-engineer.instructions.md`
2. Detectar LLM ativo e carregar `tools-{llm}.md` correspondente:
   - Kilo Code → `tools-kilo.md`
   - Codex GPT → `tools-codex.md`
   - Qwen Code → `tools-qwen.md`

## Contexto

- **Repositório:** HIVECAR — autopeças e-commerce
- **Stack:** Vanilla JavaScript (frontend), Appwrite (backend), Vitest (testes), npm
- **Diretórios principais:** `js/` (serviços), `controllers/` (controladores), `tests/` (testes), `functions/` (serverless)
- **Comandos:** `npm test`, `npm run test:coverage`, `npm run lint:text`

## Template de Tarefa

Preencha os campos abaixo ao solicitar uma tarefa:

```
### Tarefa
[Descreva a tarefa em uma frase]

### Comportamento esperado
[O que o código deve fazer após a mudança]

### Comportamento atual (se bug)
[O que está acontecendo de errado]

### Arquivos afetados
- [caminho/do/arquivo1]
- [caminho/do/arquivo2]

### Critérios de aceitação
- [ ] Critério 1
- [ ] Critério 2
- [ ] Testes passando
```

## Exemplos Preenchidos

### Exemplo 1 — Refatoração

```
### Tarefa
Extrair regra de cálculo de frete de cartService.js para função calculateShipping

### Comportamento esperado
Função pura calculateShipping(cep, peso) retorna valor do frete; cartService.js a importa e usa

### Arquivos afetados
- js/cartService.js
- js/shippingCalculator.js (novo)
- tests/shippingCalculator.test.js (novo)

### Critérios de aceitação
- [ ] cartService.js sem duplicação de lógica de frete
- [ ] calculateShipping testada com 3+ cenários
- [ ] npm test passando
```

### Exemplo 2 — Correção de Bug

```
### Tarefa
Corrigir validação de CPF em CheckoutController.js

### Comportamento atual
CPF "000.000.000-00" é aceito como válido

### Comportamento esperado
CPF com dígitos repetidos deve ser rejeitado

### Arquivos afetados
- controllers/checkout/CheckoutController.js

### Critérios de aceitação
- [ ] CPFs com dígitos repetidos rejeitados
- [ ] CPFs válidos continuam passando
- [ ] Mensagem de erro clara no frontend
```

### Exemplo 3 — Nova Feature

```
### Tarefa
Adicionar cobertura de teste para nfService.js com cenário de emissão falha

### Comportamento esperado
Testes cobrindo emissão NF-e sucesso, falha de rede e timeout

### Arquivos afetados
- js/nfService.js
- tests/nfService.test.js

### Critérios de aceitação
- [ ] Cobertura >90% de nfService.js
- [ ] Cenário de falha de rede mockado
- [ ] Cenário de timeout mockado
```

## Fluxo Obrigatório

Após receber a tarefa, executar:

1. **Classificar** → CLARA / AMBÍGUA / INCOMPLETA / PERIGOSA
2. **Definir modo** → CRIAÇÃO / MANUTENÇÃO / ANÁLISE / REFACTORING
3. **PLANEJAR** → listar arquivos, dependências, riscos
4. **EXECUTAR** → mudanças mínimas
5. **VALIDAR** → `npm test`, `npm run lint:text`
6. **SCORE** → calcular 0-10 com justificativa
7. **REPORT** → checklist CONCLUÍDO/PENDENTE/BLOQUEADO
