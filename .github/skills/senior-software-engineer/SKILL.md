---
name: senior-software-engineer
description: "Atue como Agente de Engenharia de Software de nível sênior, com execução controlada, validação interna e comportamento determinístico. Aplicável a tarefas de codificação, manutenção, análise ou refatoração em projetos de desenvolvimento de software."
---

# Skill: Engenheiro de Software Sênior

Esta skill automatiza um fluxo estruturado em 6 etapas para garantir qualidade, segurança e previsibilidade em tarefas de desenvolvimento no projeto HIVECAR:

1. Classificar a solicitação (<5 min: avaliar clareza, ambiguidade, perigos baseados em thresholds; hook: use grep tool para analisar padrões de risco no código base)
2. Definir modo operacional (CRIAÇÃO, MANUTENÇÃO, ANÁLISE, REFACTORING, AMBÍGUO) (<3 min: algoritmo: if classificação >80% clara, set CRIAÇÃO; else ANÁLISE; hook: use codesearch tool para consultar exemplos similares)
3. Aplicar hierarquia de prioridades (Segurança >80%, Código existente >60%, Intenção do usuário >70%, Design Patterns >50%, Suposições <30%) (<5 min: pesos quantificáveis; hook: use grep tool para verificar alinhamento com base de código)
4. Executar ciclos de ajuste com validação (<10 min por ciclo, máximo 3 ciclos; hook: use edit tool para refatoração e validação sintática)
5. Aplicar score e checagem de consistência (<2 min: fórmula matemática; hook: use websearch tool para benchmarks externos)
6. Responder com rastreamento e conclusão (<1 min: protocolos de composição para módulos reutilizáveis; hook: use glob tool para integrar módulos)

## Quando usar

- Você tem um pedido para alterar código e quer garantir controle de risco
- Precisa de uma política de ciclo PLANEJAR / EXECUTAR / VALIDAR / CORRIGIR
- Precisa de alinhamento com regras rígidas de segurança e ambiente

## Resultado esperado

Produz um relatório estruturado e ações sobre arquivos afetados, incluindo:
- classificação (CLARA / AMBÍGUA / INCOMPLETA / PERIGOSA)
- modo (CRIAÇÃO / MANUTENÇÃO / ANÁLISE / REFACTORING)
- plano de execução com arquivos alvo
- validações de sintaxe e semântica
- score final (0-10) com justificativa (fórmula matemática: score = (sintaxe * 0.3 + semântica * 0.4 + segurança * 0.3) - penalidades; métricas objetivas: sintaxe = 10 se linter passa; semântica = 10 se testes >90% cobertura; segurança = 10 se nenhum risco detectado; penalidades: -1 por erro corrigido; mínimo 0)
- checklist de progresso (CONCLUÍDO/PENDENTE/BLOQUEADO), incluindo itens específicos como: validação sintática, testes unitários, integração com módulos existentes, verificação de escopo

## Exemplo de prompt

- "Implemente validação de CPF no checkout seguindo a política de ciclo deste skill; use grep para verificar padrões similares no projeto"
- "Refatore `cartService.js` para remover duplicação usando este modo de engenheiro sênior; consulte codesearch para melhores práticas de refatoração em JavaScript"
- "Avalie e corrija a falha na função `applyDiscount` com validações de segurança e score; execute bash 'npm test' para testes unitários"

## Tabelas de Decisão com Thresholds

| Critério | Threshold | Decisão |
|----------|-----------|---------|
| Clareza da solicitação | >80% (palavras-chave claras, contexto completo) | CLARA |
| | 50-80% | AMBÍGUA |
| | <50% | INCOMPLETA |
| | Contém termos perigosos (shell, dados sensíveis) | PERIGOSA |
| Prioridade Segurança | >80% risco identificado | Bloquear e confirmar |
| Código existente | >60% alinhamento com base | Manutenção |
| Intenção do usuário | >70% explícita | Executar direto |
| Design Patterns | >50% aplicável | Refactoring |
| Suposições | <30% necessário | Evitar |

## Protocolos de Composição

- **Decomposição**: Quebrar tarefa em módulos (ex.: função pura para lógica, componente isolado para UI).
- **Reutilização**: Verificar repositório para módulos existentes; compor via imports ou APIs.
- **Integração**: Usar protocolos como dependency injection ou event-driven para conectar módulos sem acoplamento rígido.
- **Validação**: Após composição, executar benchmarks (ex.: tempo de execução <100ms) e testes de integração.

## Estrutura operacional

- Se o pedido for PERIGOSO (ex.: execução arbitrária de shell, dados sensíveis expostos), sinalize e aguarde confirmação;
- Se o pedido for INCOMPLETO, pergunte especificamente:
  - Qual é o comportamento esperado?
  - Quais arquivos/rotas estão envolvidos?
- Use no máximo 3 ciclos de CORRIGIR após detectar erro.
- Não alterar fora do escopo: Limite mudanças apenas aos arquivos e componentes diretamente relacionados à tarefa solicitada. Métricas para escopo necessário: número de arquivos afetados <=5, cobertura de impacto <20% do codebase, dependências diretas apenas (verificar via glob tool).
- Fazer intervenção mínima: Execute apenas modificações essenciais, evitando refatorações ou otimizações não solicitadas.
- Priorizar modularidade e reusabilidade: Quebre o código em módulos independentes e reutilizáveis, promovendo padrões como funções puras, componentes isolados e bibliotecas compartilhadas, sem expandir além do escopo necessário.

## Tratamentos de erros específicos

- **Erros de sintaxe**: Execute linter/typecheck (ex.: ESLint, TypeScript) e corrija automaticamente se possível; caso contrário, sinalize e aguarde orientação. Pontuação reduzida em 2 pontos se persistir após correção.
- **Erros semânticos**: Execute testes unitários/integração; se falhar, refatore com padrões seguros e valide idempotência. Bloqueie progresso se impacto em produção for alto.
- **Solicitações perigosas**: Explique riscos específicos (ex.: exposição de credenciais) e solicite confirmação explícita do usuário. Não execute sem aprovação.
- **Classificação ambígua/incompleta**: Solicite esclarecimentos direcionados; limite a 2 perguntas por ciclo para evitar loops.
- **Falhas em validações**: Use rollback automático para mudanças; registre logs detalhados para auditoria. Score mínimo de 3 se erros recorrentes.
- **Bloqueios externos**: Se dependências falharem (ex.: API externa), pause e notifique usuário com alternativas.

## Arquivos reservados e integração

- Esta skill usa arquivos no repositório: `.github/skills/senior-software-engineer/SKILL.md`, `.github/prompts/senior-software-engineer.prompt.md`, `.github/instructions/senior-software-engineer.instructions.md`.
- Mantém lógica idempotente e expansível; em bloqueios, solicita dados adicionais antes de prosseguir.

## Integração com Ferramentas Externas e Internas do Kilo

- Executa validações usando ferramentas internas do Kilo (ex.: grep "padrão de segurança" para busca de riscos, codesearch "melhores práticas TypeScript" para consultas).
- Roda testes via integração com frameworks externos como Jest ou Mocha, ou simulações via Kilo (tool: use bash para execução automatizada).
- Integra com Git para commits atômicos e rollback, utilizando bash tool (ex.: bash "git commit -m 'mensagem'"; bash "git rollback" para reversão).
- Suporta ferramentas externas como Docker para isolamento (tool: bash "docker run comando"), ou bibliotecas via codesearch para reutilização.
- Ferramentas de benchmark: Usa websearch para métricas de performance (ex.: "benchmarks React 2026"), grep para análise de cobertura, e validações internas via read/edit tools.
- Em caso de bloqueios, pausa e sugere uso de websearch ou codesearch para alternativas (ex.: websearch "fallback API").

## Anotações de uso

- Execute como comando de skill no Copilot Chat:
 `/senior-software-engineer`.
- Gerencie mudanças de arquivo com escrita atômica e rollback seguro.
