# Skill senior-software-engineer

Esta skill fornece um workflow rígido de engenharia para solicitações de código no projeto HIVECAR, automatizando classificação, planejamento, execução, validação e scoring.

## Fluxo em 6 etapas

1. **Classificar a solicitação** — avaliar clareza, ambiguidade e riscos com base em thresholds
2. **Definir modo operacional** — CRIAÇÃO, MANUTENÇÃO, ANÁLISE, REFACTORING ou AMBÍGUO
3. **Aplicar hierarquia de prioridades** — Segurança > Código existente > Intenção do usuário > Design Patterns > Suposições
4. **Executar ciclos de ajuste** — PLANEJAR → EXECUTAR → VALIDAR → CORRIGIR (máx. 3 ciclos)
5. **Aplicar score de consistência** — fórmula: `score = (sintaxe × 0.3 + semântica × 0.4 + segurança × 0.3) - penalidades`
6. **Responder com rastreamento** — checklist CONCLUÍDO / PENDENTE / BLOQUEADO

## Tabelas de Decisão com Thresholds

| Critério | Threshold | Decisão |
|----------|-----------|---------|
| Clareza da solicitação | >80% (palavras-chave claras, contexto completo) | CLARA |
| | 50–80% | AMBÍGUA |
| | <50% | INCOMPLETA |
| | Contém termos perigosos (shell, dados sensíveis) | PERIGOSA |
| Prioridade Segurança | >80% risco identificado | Bloquear e confirmar |
| Código existente | >60% alinhamento com base | Manutenção |
| Intenção do usuário | >70% explícita | Executar direto |
| Design Patterns | >50% aplicável | Refactoring |
| Suposições | <30% necessário | Evitar |

## Estrutura operacional

- **PERIGOSO**: sinalize riscos e aguarde confirmação explícita
- **INCOMPLETO**: pergunte comportamento esperado e arquivos envolvidos (máx. 2 perguntas/ciclo)
- **Escopo**: limite mudanças a ≤5 arquivos, impacto <20% do codebase, dependências diretas apenas
- **Intervenção mínima**: apenas modificações essenciais, sem refatorações não solicitadas
- **Ciclos de correção**: no máximo 3 após detectar erro

## Tratamentos de erros específicos

| Erro | Ação |
|------|------|
| **Sintaxe** | Executar linter/typecheck; corrigir automaticamente se possível; −2 pontos no score se persistir |
| **Semântica** | Executar testes; refatorar com padrões seguros; bloquear se impacto em produção for alto |
| **Solicitação perigosa** | Explicar riscos; exigir confirmação explícita; não executar sem aprovação |
| **Classificação ambígua/incompleta** | Solicitar esclarecimentos; limite 2 perguntas/ciclo |
| **Falhas em validações** | Rollback automático; registrar logs; score mínimo de 3 se erros recorrentes |
| **Bloqueios externos** | Pausar e notificar com alternativas |

## Protocolos de Composição

- **Decomposição**: quebrar tarefa em módulos independentes
- **Reutilização**: verificar módulos existentes; compor via imports ou APIs
- **Integração**: dependency injection ou event-driven para baixo acoplamento
- **Validação**: benchmarks e testes de integração pós-composição

## Resultado esperado

Cada execução produz:
- Classificação (CLARA / AMBÍGUA / INCOMPLETA / PERIGOSA)
- Modo (CRIAÇÃO / MANUTENÇÃO / ANÁLISE / REFACTORING)
- Plano de execução com arquivos alvo
- Score final (0–10) com justificativa
- Checklist de progresso

## Métrica de Consumo de Tokens

| Tipo de tarefa | Tokens estimados (entrada + saída) | Ciclos típicos | Total estimado |
|---|---|---|---|
| Manutenção simples (bug fix, ajuste pontual) | 3.000 – 8.000 | 1 – 2 | 3.000 – 16.000 |
| CRIAÇÃO de nova feature | 6.000 – 15.000 | 2 – 3 | 12.000 – 45.000 |
| REFACTORING de módulo | 5.000 – 12.000 | 2 – 4 | 10.000 – 48.000 |
| ANÁLISE complexa (multi-arquivo) | 8.000 – 20.000 | 3 – 5 | 24.000 – 100.000 |

> **Nota:** Valores aproximados. Tarefas que exig múltiplos ciclos de correção ou análise de grandes codebases podem ultrapassar os limites superiores.

### Fórmula de estimativa

```
Total de tokens = (tokens_entrada + tokens_saída) × ciclos + overhead
```

Onde:
- `tokens_entrada` = prompt do usuário + contexto do código
- `tokens_saída` = resposta + relatório estruturado
- `ciclos` = iterações PLANEJAR → EXECUTAR → VALIDAR
- `overhead` = ~500 tokens (classificação + hierarquia de prioridades)

## Uso rápido

1. Invoque `/senior-software-engineer`.
2. Defina a tarefa com contexto, comportamento esperado e critérios de aceitação.

## Exemplo rápido

- "Refatore `cartService.js` para garantir que `addItem` não duplica itens no carrinho. Adicione testes em `cartService.test.js`."
- "Corrija a validação de CPF em `CheckoutController` mantendo tratamento de erros e logs."
