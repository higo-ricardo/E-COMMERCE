# Migração: Adicionar "DEVOLVIDO" ao Status dos Pedidos

## O que foi alterado

### 1. Frontend (admin-pedidos.html)
✅ Adicionado card "Enviados" nas métricas
✅ Adicionado botão "DEVOLVIDO" na coluna de ações
✅ Filtro de status atualizado para valores em MAIÚSCULAS

### 2. Backend (Appwrite)
⚠️ **REQUER AÇÃO MANUAL**: Adicionar "DEVOLVIDO" ao ENUM do campo `status`

---

## Como executar a migração

### Opção 1: Via Interface Web (Recomendado)

1. Abra o arquivo `migrate-status-devolvido.html` no navegador
2. Faça login com sua conta de admin do Appwrite
3. Clique no botão "⚡ Adicionar DEVOLVIDO"
4. Aguarde a confirmação de sucesso

### Opção 2: Via Appwrite Console

1. Acesse [Appwrite Console](https://tor.cloud.appwrite.io/)
2. Navegue até: **Database** → **orders** → **Attributes**
3. Encontre o atributo `status`
4. Clique em **Edit**
5. Adicione `DEVOLVIDO` à lista de valores ENUM
6. Salve as alterações

Valores ENUM completos:
```
NOVO
PAGO
EM SEPARAÇÃO
ENVIADO
ENTREGUE
CANCELADO
DEVOLVIDO  ← NOVO
```

### Opção 3: Via Script Node.js

```bash
# Defina a API key
export APPWRITE_API_KEY="sua-api-key-aqui"

# Execute o script
node scripts/add-devolvido-status.js
```

---

## Verificação

Após a migração, verifique:

1. ✅ O botão "DEVOLVIDO" aparece na coluna de ações
2. ✅ O filtro de status inclui "Devolvido"
3. ✅ O card "Enviados" exibe a contagem correta
4. ✅ Não há erros no console ao alterar status

---

## Rollback (se necessário)

Se precisar remover "DEVOLVIDO":

1. Acesse Appwrite Console
2. Database → orders → Attributes → status
3. Remova `DEVOLVIDO` da lista ENUM
4. Salve

**Nota**: Pedidos já marcados como "DEVOLVIDO" permanecerão com esse status, mas não será possível criar novos com esse status.

---

## Arquivos Criados

| Arquivo | Descrição |
|---------|-----------|
| `migrate-status-devolvido.html` | Interface web para migração (clique e execute) |
| `scripts/add-devolvido-status.js` | Script Node.js para migração automatizada |
| `docs/MIGRACAO-DEVOLVIDO.md` | Este arquivo de documentação |

---

## Suporte

Em caso de problemas:
1. Verifique o console do navegador para erros
2. Confirme que está autenticado como admin
3. Verifique as permissões da collection no Appwrite
