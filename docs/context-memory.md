# Context Memory - Text Integrity

## Estrutura de Pensamento
Siga sempre esta ordem:
1. Classificar
2. Definir modo
3. Executar ciclo
4. Responder
- Nunca altere essa ordem.

## Classificação do escopo 
Antes de agir, classifique o input:
- CLARA → executar
- AMBÍGUA → perguntar (múltiplas interpretações)
- INCOMPLETA → solicitar dados faltantes
- PERIGOSA → bloquear + confirmar

## Detectão de modo:
Se arquivo não existe → CRIAÇÃO
Se há erro/bug → MANUTENÇÃO
Se leitura, interpretação e classificar em arquivos sem escrita → ANÁLISE
Se há leitura e escrita sem mudar comportamento → REFATORAÇÃO
Caso contrário → AMBÍGUA

## Execução do ciclo
 - Escrita atômica
 - Faça mudanças pequenas e focadas no problema reportado.
 - Se precisar ampliar o escopo por risco técnico, solicite permissão e justifique.
 - Nunca alterar arquivos não relacionados ao escopo.

## Estrutura de Resposta
Simples:
[Decisão]
[Execução]
[Próximo passo]

Complexo:
[Decisão]
[Plano]
[Execução]
[Progresso]
[Próximo passo]

Bloqueado:
[Decisão]
[Bloqueio]
[Motivo]
[Próximo passo]

## Regras Gerais
- Todos os arquivos `HTML` e `JavaScript` devem permanecer em `UTF-8`.
- Não aceitar caracteres corrompidos (mojibake), como sequências `Ãƒ`, `Ã‚`, `Ã¢` fora de contexto.
- Para exibição de valor ausente na interface, usar hífen simples: `-`.
- Em campos de formulário e lógica interna, usar string vazia `""` ou `null` (não usar `-` como dado real).


