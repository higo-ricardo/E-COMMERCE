# Sistema Multiagente Scrum

Este documento descreve o sistema multiagente implementado no Kilo para simular um processo Scrum completo, baseado nos arquivos originais em `ai-agents-scrum`.

## Visão Geral

O sistema orquestra agentes especializados para executar desenvolvimento ágil:
- **Scrum Orchestrator** (agente principal): Coordena o processo
- **Product Owner**: Cria Product Backlog
- **Scrum Master**: Planeja Sprint Backlog
- **Developer**: Implementa código
- **Reviewer**: Revisa qualidade e segurança
- **Tester**: Valida funcionalidade

## Processo

1. Recebe entrada do usuário (ex.: "Criar API de login")
2. Product Owner gera backlog com user stories
3. Scrum Master quebra em tarefas executáveis
4. Loop iterativo (máx. 3 tentativas):
   - Developer implementa código
   - Reviewer identifica problemas
   - Tester valida funcionalidade
   - Se falhar, feedback volta para Developer
5. Sucesso: Gera arquivos Markdown e aplica mudanças

## Agentes Criados

### scrum-orchestrator
- **Arquivo**: `.kilo/agent/scrum-orchestrator.md`
- **Modo**: primary
- **Função**: Coordena todo o processo usando Task tool

### product-owner
- **Arquivo**: `.kilo/agent/product-owner.md`
- **Modo**: subagent
- **Função**: Análise de requisitos e criação de backlog

### scrum-master
- **Arquivo**: `.kilo/agent/scrum-master.md`
- **Modo**: subagent
- **Função**: Planejamento e quebra de tarefas

### developer
- **Arquivo**: `.kilo/agent/developer.md`
- **Modo**: subagent
- **Função**: Implementação de código usando edit tool

### reviewer
- **Arquivo**: `.kilo/agent/reviewer.md`
- **Modo**: subagent
- **Função**: Revisão de código e qualidade

### tester
- **Arquivo**: `.kilo/agent/tester.md`
- **Modo**: subagent
- **Função**: Validação funcional através de testes simulados

## Uso

1. Ative o agente `scrum-orchestrator` no Kilo
2. Forneça uma descrição da tarefa
3. O sistema executará automaticamente o processo Scrum
4. Receba backlogs em Markdown e código implementado

## Diferenças da Implementação Original

- Adaptado para ferramentas do Kilo (Task, edit, codesearch)
- Usa contexto de conversa para memória (sem embeddings locais)
- Saídas em formato Markdown via write/edit
- Foco em projetos JavaScript/vanilla (adaptável)

## Arquivos Relacionados

- `AGENTS.md`: Lista de agentes disponíveis
- `docs/ARCHITECTURE.md`: Arquitetura do sistema HIVECAR
- `.kilo/agent/*.md`: Definições dos agentes