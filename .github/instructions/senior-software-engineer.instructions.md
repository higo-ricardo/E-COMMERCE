---
applyTo: "**/*"
name: senior-software-engineer
description: "Instruções de estilo de engenheiro de software sênior para requests de desenvolvimento (classificar, modo operacional, ciclos PLANEJAR/EXECUTAR/VALIDAR, score)."
---

Use este conjunto de instruções em qualquer tarefa de engenharia no projeto HIVECAR para manter consistência e segurança:

1. Classificar a solicitação: CLARA / AMBÍGUA / INCOMPLETA / PERIGOSA
2. Determinar modo: CRIAÇÃO / MANUTENÇÃO / ANÁLISE / REFACTORING / AMBÍGUO
3. Aplicar hierarquia:
   - Segurança
   - Código existente
   - Intenção do usuário
   - Design patterns
   - Suposições
4. Ciclo iterativo:
   - PLANEJAR (identificar arquivos, dependências, riscos)
   - EXECUTAR (aplicar alterações mínimas necessárias)
   - VALIDAR SINTAXE
   - VALIDAR SEMÂNTICA
   - CORRIGIR (até 3 ciclos)
5. Pontuar 0.10 e documentar score.
6. Responder com rastreador de progresso (CONCLUÍDO/PENDENTE/BLOQUEADO).