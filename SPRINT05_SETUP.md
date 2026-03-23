# SPRINT 05 — SETUP: MÓDULO FISCAL

Guia de configuração para colocar o módulo fiscal em funcionamento.

> ⚠ **Atenção legal**: Operar sem NF-e após o período de adequação é ilegal no Brasil (EC 132/2023).
> Todos os 4 desbloqueadores abaixo precisam estar resolvidos **antes** de usar este módulo em produção.

---

## Checklist de Desbloqueio (obrigatório)

- [ ] **Certificado Digital A1 (e-CNPJ)** — emitido por AC credenciada ICP-Brasil
- [ ] **Credenciais SEFAZ Homologação** — acesso ao ambiente de testes da SEFAZ-MA
- [ ] **Integrador NF-e contratado** — NFe.io, Focus NF-e ou Plugnotas com créditos ativos
- [ ] **Contador responsável** — validou alíquotas NCM cap. 87 e regime tributário

---

## 1. Collections Appwrite — Novas (Sprint 05)

### `tax_rules`
| Atributo   | Tipo    | Obrigatório | Descrição                                 |
|------------|---------|-------------|-------------------------------------------|
| ncm        | String  | ✅          | NCM no formato 8708.30 ou 8708.30.90      |
| imposto    | String  | ✅          | IPI, ICMS, PIS, COFINS, CBS, IBS          |
| aliquota   | Float   | ✅          | Valor em percentual (ex: 5.0)             |
| vigencia   | String  | ✅          | ISO 8601 — data de início da vigência     |
| uf         | String  | ❌          | null = nacional, "SP" = específico de UF  |
| descricao  | String  | ❌          | Descrição da regra                        |

**Índice:** `ncm` (key) para busca eficiente.

### `nfe_documents`
| Atributo        | Tipo    | Obrigatório | Descrição                            |
|-----------------|---------|-------------|--------------------------------------|
| orderId         | String  | ✅          | ID do pedido relacionado             |
| chaveAcesso     | String  | ✅          | 44 dígitos — chave da NF-e           |
| protocolo       | String  | ❌          | Número do protocolo SEFAZ            |
| serie           | String  | ✅          | Série da NF-e (ex: "001")            |
| numero          | String  | ✅          | Número sequencial                    |
| pdfUrl          | String  | ❌          | URL do DANFE em PDF                  |
| xmlUrl          | String  | ❌          | URL do XML autorizado                |
| ambiente        | String  | ✅          | "homologacao" ou "producao"          |
| emitidaEm       | String  | ✅          | ISO 8601                             |
| totalNota       | Float   | ✅          | Valor total da nota                  |
| destinatarioCpf | String  | ❌          | CPF do destinatário (mascarado)      |

**Índices:** `orderId` (key), `emitidaEm` (para filtros por período), `chaveAcesso` (key único).

### `fiscal_reports`
| Atributo      | Tipo    | Obrigatório |
|---------------|---------|-------------|
| periodo       | String  | ✅          | "MM/AAAA"   |
| totalNFe      | Integer | ✅          |
| faturamento   | Float   | ✅          |
| totalImpostos | Float   | ✅          |
| impostos      | String  | ✅          | JSON com breakdown por imposto |
| geradoEm      | String  | ✅          | ISO 8601 |

---

## 2. Collection `orders` — novos campos (Sprint 05)

Adicionar estes atributos à collection existente:

| Atributo         | Tipo    | Padrão      | Descrição                              |
|------------------|---------|-------------|----------------------------------------|
| taxBreakdown     | String  | null        | JSON: { IPI, ICMS, PIS, COFINS, CBS, IBS } |
| taxRate          | Float   | 0           | Alíquota efetiva real (%)              |
| nfeStatus        | String  | "pendente"  | pendente \| emitida \| cancelada \| erro |
| nfeChave         | String  | null        | Chave de acesso NF-e (44 dígitos)      |
| nfeProtocolo     | String  | null        | Protocolo de autorização SEFAZ         |
| nfePdfUrl        | String  | null        | URL do DANFE PDF                       |
| nfeXmlUrl        | String  | null        | URL do XML autorizado                  |
| nfeEmitidaEm     | String  | null        | ISO 8601                               |
| nfeAmbiente      | String  | null        | "homologacao" ou "producao"            |
| nfeErro          | String  | null        | Mensagem de erro (se nfeStatus=erro)   |
| nfeCancelEm      | String  | null        | ISO 8601 do cancelamento               |
| nfeCancelMotivo  | String  | null        | Motivo do cancelamento                 |
| nfeCancelProt    | String  | null        | Protocolo de cancelamento SEFAZ        |

---

## 3. Collection `produtos` — campo NCM (Sprint 04, mas essencial para 05)

O campo `ncm` deve estar presente na collection `produtos`:

| Atributo | Tipo   | Obrigatório | Descrição                |
|----------|--------|-------------|--------------------------|
| ncm      | String | ❌          | Ex: "8708.30.90"         |

Índice: `ncm` (fulltext) para pesquisa fiscal.

---

## 4. Appwrite Function: `emit-nfe`

```
Runtime:     Node.js 18
Entrypoint:  index.js
Caminho:     functions/emit-nfe/
Trigger:     HTTP (chamada do nfService.js)
```

### Variáveis de Ambiente

```bash
NFE_PROVIDER       = "nfeio"          # nfeio | focus | plugnotas
NFE_API_KEY        = "sk_live_..."    # API key do integrador
NFE_COMPANY_ID     = "abc123"         # ID da empresa (NFe.io e Plugnotas)
NFE_AMBIENTE       = "homologacao"    # homologacao | producao
RESEND_API_KEY     = "re_..."
EMAIL_FROM         = "HIVERCAR AUTOPEÇAS <noreply@hivercar.com.br>"
APPWRITE_DB        = "69a0ebc70034fa76feff"
```

### Contratação dos Integradores

| Integrador  | Site                       | Plano mínimo  |
|-------------|----------------------------|---------------|
| NFe.io      | https://nfe.io             | Start R$99/mês|
| Focus NF-e  | https://focusnfe.com.br    | Pay-as-you-go |
| Plugnotas   | https://plugnotas.com.br   | Start gratuito|

### Configuração do Certificado A1

1. Obtenha o certificado `.pfx` junto à autoridade certificadora
2. Faça upload do `.pfx` no painel do integrador escolhido
3. Informe a senha do certificado no integrador
4. Teste a emissão em **homologação** antes de ativar produção

---

## 5. config.js — Atualizar dados da empresa

Em `config.js`, atualize o bloco `FISCAL` com os dados reais:

```js
FISCAL: {
  REGIME:       "lucro_presumido",    // simples_nacional | lucro_presumido | lucro_real
  UF_ORIGEM:    "MA",                 // UF da empresa emissora
  CNPJ:         "XX.XXX.XXX/0001-XX", // CNPJ real
  RAZAO_SOCIAL: "HIVERCAR AUTOPEÇAS LTDA",
  SERIE_NFE:    "001",
  AMBIENTE:     "homologacao",        // → "producao" após testes
},
```

---

## 6. TaxEngine — Validação das Alíquotas

O arquivo `taxEngine.js` contém alíquotas de **referência** para o cap. 87 da TIPI.
**Antes de usar em produção**, o contador deve revisar e assinar:

- Tabela `NCM_TAX_RULES` — alíquotas IPI, PIS, COFINS, CBS, IBS por NCM
- Tabela `ICMS_UF` — alíquotas interestaduais por UF
- Constante `TRANSICAO_2026` — redução gradual PIS/COFINS (EC 132/2023)
- Alíquota IBS — ainda **estimativa** aguardando LC de regulamentação

---

## 7. SPED Fiscal — Observações

O `fiscalReportService.js` gera um arquivo EFD ICMS/IPI simplificado.
O arquivo gerado é uma **implementação de referência** e exige revisão antes de transmissão:

- Preencher Inscrição Estadual real no registro 0000
- Revisar CFOPs por tipo de operação
- Revisar CST (Código de Situação Tributária) por produto
- Verificar obrigatoriedade de transmissão conforme regime tributário

---

## 8. Executar os testes

```bash
# Todos os testes (10 arquivos, ≥190 testes)
npm test

# Com cobertura
npm run test:coverage

# Apenas os novos testes da Sprint 05
npx vitest run tests/taxEngine.test.js
npx vitest run tests/nfService.test.js
```

---

## 9. Sprint 05 — Checklist final de Go-Live

- [ ] 4 desbloqueadores resolvidos (ver topo)
- [ ] Certificado A1 cadastrado no integrador NF-e
- [ ] Variáveis de ambiente da Function `emit-nfe` preenchidas
- [ ] Alíquotas validadas e assinadas pelo contador
- [ ] NF-e emitida com sucesso em **homologação** (testar 3+ pedidos)
- [ ] `CONFIG.FISCAL.AMBIENTE` alterado para `"producao"`
- [ ] `npm test` passando (cobertura ≥70%)
- [ ] admin-fiscal.html acessível e mostrando apuração correta
