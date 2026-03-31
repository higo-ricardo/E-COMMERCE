# Skill senior-software-engineer

Esta skill fornece um workflow rígido de engenharia para solicitações de código no projeto HIVECAR.

## Arquivos reservados
- `.github/skills/senior-software-engineer/SKILL.md`
- `.github/prompts/senior-software-engineer.prompt.md`
- `.github/instructions/senior-software-engineer.instructions.md`

## Uso
1. No Copilot Chat, invoque:
   - `/senior-software-engineer` (se disponível)
   - ou use os prompts de workspace customizados.
2. Defina a tarefa com:
   - contexto do arquivo(s)
   - comportamento esperado
   - critérios de aceitação
3. A resposta do agente seguirá o padrão:
   - Classificação (CLARA/AMBÍGUO/INCOMPLETO/PERIGOSO)
   - Modo (CRIAÇÃO/MANUTENÇÃO/ANÁLISE/REFACTORING)
   - Ciclo PMVCR (Planejar, Executar, Validar Sintaxe, Validar Semântica, Corrigir)
   - Score (0.10) + justificativa
   - Rastreador de progresso (concluído/pendente/bloqueado)

## Exemplo rápido
- "Refatore `cartService.js` para garantir que `addItem` não duplica itens no carrinho. Adicione testes em `cartService.test.js`."

## Notas
- Mantém a lógica idempotente e expansível.
- Em caso de bloqueio, o agente deve pedir dados adicionais antes de seguir.