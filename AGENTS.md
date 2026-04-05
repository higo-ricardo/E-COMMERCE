# HIVECAR AUTOPEÇAS

An e-commerce platform for automotive parts with a complete admin panel. Built with vanilla JavaScript and Appwrite as the backend.

## Quick Reference

- **Package Manager:** npm
- **Build:** Not required (vanilla JavaScript)
- **Test:** `npm test`
- **Typecheck:** Not applicable
- **Lint:** `npm run lint:text` (text integrity check)

## Agents

This project includes specialized Kilo agents for development tasks. The Scrum multiagent system is also available globally for use in other projects.

### Project-Specific Agents
- **hivercar**: Primary agent for HIVECAR-specific tasks (frontend, backend, testing).

### Global Scrum Multiagent System
Available in `~/.config/kilo/agent/` for all projects:
- **scrum-orchestrator**: Multiagent orchestrator simulating Scrum process (Product Owner → Scrum Master → Developer → Reviewer → Tester).
- **product-owner**: Subagent for creating Product Backlogs.
- **scrum-master**: Subagent for planning Sprint Backlogs.
- **developer**: Subagent for code implementation.
- **reviewer**: Subagent for code review.
- **tester**: Subagent for testing validation.

## Detailed Instructions

For specific guidelines, see:
- [Architecture](docs/ARCHITECTURE.md)
- [Testing](README.md#testing)
- [Configuration](README.md#configuration)
- [Agents](AGENTS.md#agents)