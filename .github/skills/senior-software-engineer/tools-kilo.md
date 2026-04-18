# Ferramentas Disponíveis — Kilo Code

> Este arquivo mapeia todas as ferramentas internas e externas que o **Kilo Code** pode utilizar ao executar a skill `senior-software-engineer`.

---

## Ferramentas Internas (built-in)

| Ferramenta | Nome interno | Uso | Exemplo |
|---|---|---|---|
| **Leitura de arquivo** | `read_file` | Ler conteúdo de qualquer arquivo | `read_file("js/cartService.js")` |
| **Escrita de arquivo** | `write_file` | Criar ou sobrescrever arquivo | `write_file("js/utils.js", content)` |
| **Edição de arquivo** | `edit` | Substituir trecho específico de arquivo | `edit(file_path, old_string, new_string)` |
| **Busca por regex** | `grep_search` | Buscar padrão regex em múltiplos arquivos | `grep_search("pattern", path, glob)` |
| **Busca por glob** | `glob` | Listar arquivos por padrão de nome | `glob("**/*.test.js")` |
| **Listar diretório** | `list_directory` | Listar conteúdo de pasta | `list_directory("js/services")` |
| **Executar shell** | `run_shell_command` | Executar comando no terminal | `run_shell_command("npm test")` |
| **Agent (subagente)** | `agent` | Delegar tarefa a subagente especializado | `agent("Explore", "buscar padrões de risco")` |
| **Web fetch** | `web_fetch` | Buscar conteúdo de URL | `web_fetch(url, prompt)` |
| **Web search** | `web_search` | Pesquisar na web | `web_search("benchmark React 2026")` |
| **Perguntar ao usuário** | `ask_user_question` | Clarificar ambiguidade com o usuário | `ask_user_question(...)` |
| **Todo list** | `todo_write` | Gerenciar lista de tarefas | `todo_write([...])` |
| **Salvar memória** | `save_memory` | Salvar fato persistente | `save_memory(fact, scope)` |

---

## Ferramentas Externas (via shell)

| Ferramenta | Comando | Uso | Exemplo |
|---|---|---|---|
| **Testes unitários** | `npm test` | Executar suite Vitest | `run_shell_command("npm test")` |
| **Watch tests** | `npm run test:watch` | Rodar testes em modo watch | `run_shell_command("npm run test:watch")` |
| **Cobertura** | `npm run test:coverage` | Gerar relatório de cobertura | `run_shell_command("npm run test:coverage")` |
| **Lint de texto** | `npm run lint:text` | Verificar integridade de texto | `run_shell_command("npm run lint:text")` |
| **Instalar deps** | `npm install` | Instalar dependências | `run_shell_command("npm install")` |
| **Git status** | `git status` | Verificar estado do repositório | `run_shell_command("git status")` |
| **Git diff** | `git diff HEAD` | Revisar mudanças | `run_shell_command("git diff HEAD")` |
| **Git commit** | `git commit` | Commitar mudanças | `run_shell_command("git commit -m 'msg'")` |
| **Git log** | `git log -n 3` | Ver commits recentes | `run_shell_command("git log -n 3")` |
| **Docker** | `docker run` | Isolar execução em container | `run_shell_command("docker run ...")` |

---

## Mapeamento: Etapa da Skill → Ferramentas Kilo

| Etapa | Ferramentas Recomendadas |
|---|---|
| **1. Classificar** | `grep_search` (padrões de risco), `read_file` (contexto) |
| **2. Modo operacional** | `read_file`, `glob` (verificar estrutura) |
| **3. Hierarquia** | `grep_search` (verificar alinhamento), `read_file` |
| **4. Ciclos de ajuste** | `edit` (refatorar), `run_shell_command` (validar sintaxe), `read_file` |
| **5. Score** | `run_shell_command` (linter/testes), `grep_search` (cobertura) |
| **6. Rastreamento** | `todo_write` (checklist), `ask_user_question` (se ambíguo) |

---

## Regras de Uso no Kilo

1. **Sempre usar `read_file` antes de `edit`** — nunca assumir conteúdo de arquivo
2. **`grep_search` é a ferramenta primária de análise de risco** — usar antes de qualquer modificação
3. **`run_shell_command` para validação** — executar `npm test` e `npm run lint:text` após mudanças
4. **`edit` exige `old_string` exato** — incluir 3+ linhas de contexto antes e depois
5. **`agent` com subagent `Explore`** para buscas complexas no codebase
6. **Máximo 3 ciclos de `edit` → `run_shell_command`** por erro detectado
7. **`ask_user_question` para solicitações PERIGOSAS ou INCOMPLETAS** — máx. 2 perguntas/ciclo
