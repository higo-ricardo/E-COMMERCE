# Mapeamento de Funções Sem Acesso ao Banco de Dados

Critério usado: função sem chamada direta a operações de banco (`listDocuments`, `getDocument`, `createDocument`, `updateDocument`, `deleteDocument`), excluindo as funções já mapeadas em `docs/mapeamento-funcoes-banco.md`.

## admin-estoque.html
- `esc` — Implementa lógica local do módulo sem chamada direta ao banco de dados.
- `fmtDate` — Implementa lógica local do módulo sem chamada direta ao banco de dados.
- `init` — Inicializa o fluxo do módulo sem operação de banco.
- `movBadge` — Implementa lógica local do módulo sem chamada direta ao banco de dados.
- `parseCSV` — Executa tratamento/validação de dados em memória, sem persistência.
- `renderImpTable` — Controla carregamento e estado de interface sem acesso ao banco.
- `renderInventario` — Controla carregamento e estado de interface sem acesso ao banco.
- `toast` — Implementa lógica local do módulo sem chamada direta ao banco de dados.

## admin-fiscal.html
- `esc` — Implementa lógica local do módulo sem chamada direta ao banco de dados.
- `exportarNFeCSV` — Implementa lógica local do módulo sem chamada direta ao banco de dados.
- `fmtBRL` — Implementa lógica local do módulo sem chamada direta ao banco de dados.
- `fmtDate` — Implementa lógica local do módulo sem chamada direta ao banco de dados.
- `gerarSped` — Implementa lógica local do módulo sem chamada direta ao banco de dados.
- `init` — Inicializa o fluxo do módulo sem operação de banco.
- `renderNFe` — Controla carregamento e estado de interface sem acesso ao banco.
- `toast` — Implementa lógica local do módulo sem chamada direta ao banco de dados.

## admin-os.html
- `addPecaLinha` — Implementa lógica local do módulo sem chamada direta ao banco de dados.
- `calcTotal` — Executa transformação e composição de dados sem consulta/gravação no banco.
- `coletarPecas` — Implementa lógica local do módulo sem chamada direta ao banco de dados.
- `esc` — Implementa lógica local do módulo sem chamada direta ao banco de dados.
- `fmtBRL` — Implementa lógica local do módulo sem chamada direta ao banco de dados.
- `fmtDate` — Implementa lógica local do módulo sem chamada direta ao banco de dados.
- `init` — Inicializa o fluxo do módulo sem operação de banco.
- `openDetalhe` — Controla carregamento e estado de interface sem acesso ao banco.
- `openEditModal` — Controla carregamento e estado de interface sem acesso ao banco.
- `openNewModal` — Controla carregamento e estado de interface sem acesso ao banco.
- `printOS` — Implementa lógica local do módulo sem chamada direta ao banco de dados.
- `productOptions` — Implementa lógica local do módulo sem chamada direta ao banco de dados.
- `renderTable` — Controla carregamento e estado de interface sem acesso ao banco.
- `statusBadge` — Implementa lógica local do módulo sem chamada direta ao banco de dados.
- `toast` — Implementa lógica local do módulo sem chamada direta ao banco de dados.

## admin-produtos.html
- `cacheGet` — Implementa lógica local do módulo sem chamada direta ao banco de dados.
- `cacheKey` — Implementa lógica local do módulo sem chamada direta ao banco de dados.
- `cacheSet` — Implementa lógica local do módulo sem chamada direta ao banco de dados.
- `clearForm` — Implementa lógica local do módulo sem chamada direta ao banco de dados.
- `closeConfirm` — Controla carregamento e estado de interface sem acesso ao banco.
- `closeModal` — Controla carregamento e estado de interface sem acesso ao banco.
- `esc` — Implementa lógica local do módulo sem chamada direta ao banco de dados.
- `handleSave` — Trata eventos e orquestra ações locais sem chamada ao banco.
- `init` — Inicializa o fluxo do módulo sem operação de banco.
- `invalidateCache` — Implementa lógica local do módulo sem chamada direta ao banco de dados.
- `load` — Controla carregamento e estado de interface sem acesso ao banco.
- `openConfirm` — Controla carregamento e estado de interface sem acesso ao banco.
- `openModal` — Controla carregamento e estado de interface sem acesso ao banco.
- `renderPagination` — Controla carregamento e estado de interface sem acesso ao banco.
- `renderTable` — Controla carregamento e estado de interface sem acesso ao banco.
- `toast` — Implementa lógica local do módulo sem chamada direta ao banco de dados.

## cart.html
- `render` — Controla carregamento e estado de interface sem acesso ao banco.
- `updateTotals` — Implementa lógica local do módulo sem chamada direta ao banco de dados.

## controllers/checkout/CheckoutController.js
- `bindBuscarCep` — Trata eventos e orquestra ações locais sem chamada ao banco.
- `bindCalcularFrete` — Trata eventos e orquestra ações locais sem chamada ao banco.
- `bindConfirmarPedido` — Trata eventos e orquestra ações locais sem chamada ao banco.
- `bindFreteOptions` — Trata eventos e orquestra ações locais sem chamada ao banco.
- `bindMasks` — Trata eventos e orquestra ações locais sem chamada ao banco.
- `bindPaymentOptions` — Trata eventos e orquestra ações locais sem chamada ao banco.
- `bindPixActions` — Trata eventos e orquestra ações locais sem chamada ao banco.
- `clear` — Implementa lógica local do módulo sem chamada direta ao banco de dados.
- `clearError` — Implementa lógica local do módulo sem chamada direta ao banco de dados.
- `fmtBRL` — Implementa lógica local do módulo sem chamada direta ao banco de dados.
- `getValue` — Executa transformação e composição de dados sem consulta/gravação no banco.
- `goStep` — Implementa lógica local do módulo sem chamada direta ao banco de dados.
- `iniciarPollingPix` — Implementa lógica local do módulo sem chamada direta ao banco de dados.
- `init` — Inicializa o fluxo do módulo sem operação de banco.
- `initTimer` — Inicializa o fluxo do módulo sem operação de banco.
- `renderResumo` — Controla carregamento e estado de interface sem acesso ao banco.
- `set` — Executa transformação e composição de dados sem consulta/gravação no banco.
- `setError` — Executa transformação e composição de dados sem consulta/gravação no banco.
- `syncConfirmarBtn` — Implementa lógica local do módulo sem chamada direta ao banco de dados.
- `validateStep1` — Executa tratamento/validação de dados em memória, sem persistência.
- `validateStep2` — Executa tratamento/validação de dados em memória, sem persistência.
- `validateStep3` — Executa tratamento/validação de dados em memória, sem persistência.

## controllers/checkout/CheckoutValidator.js
- `isCpfValid` — Implementa lógica local do módulo sem chamada direta ao banco de dados.
- `isEmailValid` — Implementa lógica local do módulo sem chamada direta ao banco de dados.
- `isNomeValid` — Implementa lógica local do módulo sem chamada direta ao banco de dados.

## controllers/home/HomeController.js
- `init` — Inicializa o fluxo do módulo sem operação de banco.
- `loadDestaques` — Controla carregamento e estado de interface sem acesso ao banco.

## controllers/store/StoreController.js
- `bindEvents` — Trata eventos e orquestra ações locais sem chamada ao banco.
- `highlight` — Implementa lógica local do módulo sem chamada direta ao banco de dados.
- `init` — Inicializa o fluxo do módulo sem operação de banco.
- `load` — Controla carregamento e estado de interface sem acesso ao banco.
- `loadFilterOptions` — Controla carregamento e estado de interface sem acesso ao banco.
- `renderGrid` — Controla carregamento e estado de interface sem acesso ao banco.
- `renderPagination` — Controla carregamento e estado de interface sem acesso ao banco.
- `resolveImageSrc` — Implementa lógica local do módulo sem chamada direta ao banco de dados.
- `showToast` — Controla carregamento e estado de interface sem acesso ao banco.

## customers.html
- `applyFilter` — Implementa lógica local do módulo sem chamada direta ao banco de dados.
- `esc` — Implementa lógica local do módulo sem chamada direta ao banco de dados.
- `fmtDate` — Implementa lógica local do módulo sem chamada direta ao banco de dados.
- `fmtDateTime` — Implementa lógica local do módulo sem chamada direta ao banco de dados.
- `init` — Inicializa o fluxo do módulo sem operação de banco.
- `openDetalhe` — Controla carregamento e estado de interface sem acesso ao banco.
- `renderPage` — Controla carregamento e estado de interface sem acesso ao banco.
- `renderPagination` — Controla carregamento e estado de interface sem acesso ao banco.
- `toast` — Implementa lógica local do módulo sem chamada direta ao banco de dados.

## dashboard.html
- `fmtDate` — Implementa lógica local do módulo sem chamada direta ao banco de dados.
- `load` — Controla carregamento e estado de interface sem acesso ao banco.
- `statusBadge` — Implementa lógica local do módulo sem chamada direta ao banco de dados.

## frete.html
- `draw` — Implementa lógica local do módulo sem chamada direta ao banco de dados.
- `loop` — Implementa lógica local do módulo sem chamada direta ao banco de dados.
- `resize` — Implementa lógica local do módulo sem chamada direta ao banco de dados.
- `update` — Implementa lógica local do módulo sem chamada direta ao banco de dados.

## functions/emit-nfe/index.js
- `emitirFocus` — Implementa lógica local do módulo sem chamada direta ao banco de dados.
- `emitirNFeIo` — Implementa lógica local do módulo sem chamada direta ao banco de dados.
- `emitirPlugnotas` — Implementa lógica local do módulo sem chamada direta ao banco de dados.
- `enviarEmailNFe` — Implementa lógica local do módulo sem chamada direta ao banco de dados.

## functions/send-os-status/index.js
- `sendEmail` — Implementa lógica local do módulo sem chamada direta ao banco de dados.
- `sendWhatsApp` — Implementa lógica local do módulo sem chamada direta ao banco de dados.

## functions/send-stock-alert/index.js
- `sendEmail` — Implementa lógica local do módulo sem chamada direta ao banco de dados.
- `sendWhatsApp` — Implementa lógica local do módulo sem chamada direta ao banco de dados.

## functions/send-verification-email/index.js
- `buildVerificationEmail` — Executa transformação e composição de dados sem consulta/gravação no banco.

## js/adminService.js
- `getCustomers` — Executa transformação e composição de dados sem consulta/gravação no banco.

## js/authService.js
- `getUser` — Executa transformação e composição de dados sem consulta/gravação no banco.
- `login` — Implementa lógica local do módulo sem chamada direta ao banco de dados.
- `logout` — Implementa lógica local do módulo sem chamada direta ao banco de dados.
- `register` — Implementa lógica local do módulo sem chamada direta ao banco de dados.
- `sendPasswordRecovery` — Implementa lógica local do módulo sem chamada direta ao banco de dados.

## js/cadastro.js
- `calcDigit` — Executa transformação e composição de dados sem consulta/gravação no banco.
- `createSessionForNewUser` — Executa transformação e composição de dados sem consulta/gravação no banco.
- `doCadastro` — Implementa lógica local do módulo sem chamada direta ao banco de dados.
- `isValidCpf` — Implementa lógica local do módulo sem chamada direta ao banco de dados.
- `isValidMobile` — Implementa lógica local do módulo sem chamada direta ao banco de dados.
- `messageForAuthError` — Implementa lógica local do módulo sem chamada direta ao banco de dados.
- `messageForMirrorError` — Implementa lógica local do módulo sem chamada direta ao banco de dados.
- `parseAddressNumberOrThrow` — Executa tratamento/validação de dados em memória, sem persistência.
- `passStrength` — Implementa lógica local do módulo sem chamada direta ao banco de dados.
- `r` — Implementa lógica local do módulo sem chamada direta ao banco de dados.
- `reset` — Implementa lógica local do módulo sem chamada direta ao banco de dados.
- `setMsg` — Executa transformação e composição de dados sem consulta/gravação no banco.
- `validatePass` — Executa tratamento/validação de dados em memória, sem persistência.

## js/cartService.js
- `add` — Implementa lógica local do módulo sem chamada direta ao banco de dados.
- `clear` — Implementa lógica local do módulo sem chamada direta ao banco de dados.
- `count` — Implementa lógica local do módulo sem chamada direta ao banco de dados.
- `get` — Executa transformação e composição de dados sem consulta/gravação no banco.
- `load` — Controla carregamento e estado de interface sem acesso ao banco.
- `remove` — Implementa lógica local do módulo sem chamada direta ao banco de dados.
- `setQty` — Executa transformação e composição de dados sem consulta/gravação no banco.
- `total` — Implementa lógica local do módulo sem chamada direta ao banco de dados.

## js/errorService.js
- `clear` — Implementa lógica local do módulo sem chamada direta ao banco de dados.
- `clearFieldError` — Implementa lógica local do módulo sem chamada direta ao banco de dados.
- `ensureToastContainer` — Implementa lógica local do módulo sem chamada direta ao banco de dados.
- `fieldError` — Implementa lógica local do módulo sem chamada direta ao banco de dados.
- `handleError` — Trata eventos e orquestra ações locais sem chamada ao banco.
- `httpMessage` — Implementa lógica local do módulo sem chamada direta ao banco de dados.
- `showToast` — Controla carregamento e estado de interface sem acesso ao banco.

## js/fiscalReportService.js
- `evolucaoMensal` — Implementa lógica local do módulo sem chamada direta ao banco de dados.

## js/main.js
- `buildConfirmationEmail` — Executa transformação e composição de dados sem consulta/gravação no banco.
- `fmtBRL` — Implementa lógica local do módulo sem chamada direta ao banco de dados.

## js/minha-conta.js
- `calcDigit` — Executa transformação e composição de dados sem consulta/gravação no banco.
- `digitsOnly` — Implementa lógica local do módulo sem chamada direta ao banco de dados.
- `doLogout` — Implementa lógica local do módulo sem chamada direta ao banco de dados.
- `ensureMirrorForCurrentUser` — Implementa lógica local do módulo sem chamada direta ao banco de dados.
- `esc` — Implementa lógica local do módulo sem chamada direta ao banco de dados.
- `fillFormFromMirror` — Implementa lógica local do módulo sem chamada direta ao banco de dados.
- `fmtBRL` — Implementa lógica local do módulo sem chamada direta ao banco de dados.
- `fmtDate` — Implementa lógica local do módulo sem chamada direta ao banco de dados.
- `init` — Inicializa o fluxo do módulo sem operação de banco.
- `isValidCpf` — Implementa lógica local do módulo sem chamada direta ao banco de dados.
- `isValidMobile` — Implementa lógica local do módulo sem chamada direta ao banco de dados.
- `maskCep` — Executa tratamento/validação de dados em memória, sem persistência.
- `maskCpf` — Executa tratamento/validação de dados em memória, sem persistência.
- `maskPhone` — Executa tratamento/validação de dados em memória, sem persistência.
- `normalizeRole` — Executa tratamento/validação de dados em memória, sem persistência.
- `parseAddressNumberOrThrow` — Executa tratamento/validação de dados em memória, sem persistência.
- `redirectByRole` — Implementa lógica local do módulo sem chamada direta ao banco de dados.
- `setProfileError` — Executa transformação e composição de dados sem consulta/gravação no banco.
- `stClass` — Implementa lógica local do módulo sem chamada direta ao banco de dados.
- `toast` — Implementa lógica local do módulo sem chamada direta ao banco de dados.

## js/nfService.js
- `_mapPaymentMeio` — Implementa lógica local do módulo sem chamada direta ao banco de dados.
- `buildNFePayload` — Executa transformação e composição de dados sem consulta/gravação no banco.

## js/orderHistoryService.js
- `canTransition` — Implementa lógica local do módulo sem chamada direta ao banco de dados.

## js/orderService.js
- `placeOrder` — Implementa lógica local do módulo sem chamada direta ao banco de dados.

## js/paymentService.js
- `_calcFreteTabela` — Implementa lógica local do módulo sem chamada direta ao banco de dados.
- `_mockPixPayment` — Implementa lógica local do módulo sem chamada direta ao banco de dados.
- `calcularFrete` — Executa transformação e composição de dados sem consulta/gravação no banco.
- `checkPaymentStatus` — Implementa lógica local do módulo sem chamada direta ao banco de dados.
- `createPixPayment` — Executa transformação e composição de dados sem consulta/gravação no banco.
- `isMock` — Implementa lógica local do módulo sem chamada direta ao banco de dados.

## js/productService.js
- `cacheGet` — Implementa lógica local do módulo sem chamada direta ao banco de dados.
- `cacheKey` — Implementa lógica local do módulo sem chamada direta ao banco de dados.
- `cacheSet` — Implementa lógica local do módulo sem chamada direta ao banco de dados.
- `cacheStats` — Implementa lógica local do módulo sem chamada direta ao banco de dados.
- `DEBUG` — Implementa lógica local do módulo sem chamada direta ao banco de dados.
- `getCriticalStock` — Executa transformação e composição de dados sem consulta/gravação no banco.
- `getFilterOptions` — Executa transformação e composição de dados sem consulta/gravação no banco.
- `invalidateCache` — Implementa lógica local do módulo sem chamada direta ao banco de dados.
- `invalidateCacheKey` — Implementa lógica local do módulo sem chamada direta ao banco de dados.
- `list` — Implementa lógica local do módulo sem chamada direta ao banco de dados.
- `log` — Implementa lógica local do módulo sem chamada direta ao banco de dados.
- `restore` — Implementa lógica local do módulo sem chamada direta ao banco de dados.
- `search` — Implementa lógica local do módulo sem chamada direta ao banco de dados.
- `searchByBarcode` — Implementa lógica local do módulo sem chamada direta ao banco de dados.
- `softDelete` — Implementa lógica local do módulo sem chamada direta ao banco de dados.

## js/stockService.js
- `isStockCritical` — Implementa lógica local do módulo sem chamada direta ao banco de dados.

## js/taxEngine.js
- `calculate` — Executa transformação e composição de dados sem consulta/gravação no banco.
- `calculateCart` — Executa transformação e composição de dados sem consulta/gravação no banco.
- `formatDiscriminado` — Executa tratamento/validação de dados em memória, sem persistência.
- `lookupNcm` — Implementa lógica local do módulo sem chamada direta ao banco de dados.

## js/userService.js
- `checkBlocked` — Implementa lógica local do módulo sem chamada direta ao banco de dados.
- `normalizeEmail` — Executa tratamento/validação de dados em memória, sem persistência.
- `redirectByRole` — Implementa lógica local do módulo sem chamada direta ao banco de dados.
- `validateEmail` — Executa tratamento/validação de dados em memória, sem persistência.
- `validatePassword` — Executa tratamento/validação de dados em memória, sem persistência.

## js/utils.js
- `addSentryContext` — Implementa lógica local do módulo sem chamada direta ao banco de dados.
- `animateCount` — Implementa lógica local do módulo sem chamada direta ao banco de dados.
- `beforeSend` — Implementa lógica local do módulo sem chamada direta ao banco de dados.
- `captureError` — Implementa lógica local do módulo sem chamada direta ao banco de dados.
- `clearSentryContext` — Implementa lógica local do módulo sem chamada direta ao banco de dados.
- `initNavToggle` — Inicializa o fluxo do módulo sem operação de banco.
- `initParticles` — Inicializa o fluxo do módulo sem operação de banco.
- `initRipple` — Inicializa o fluxo do módulo sem operação de banco.
- `initSentry` — Inicializa o fluxo do módulo sem operação de banco.
- `resize` — Implementa lógica local do módulo sem chamada direta ao banco de dados.

## login.html
- `checkBlocked` — Implementa lógica local do módulo sem chamada direta ao banco de dados.
- `doLogin` — Implementa lógica local do módulo sem chamada direta ao banco de dados.
- `getClientIp` — Executa transformação e composição de dados sem consulta/gravação no banco.
- `isValidIp` — Implementa lógica local do módulo sem chamada direta ao banco de dados.
- `lockUI` — Implementa lógica local do módulo sem chamada direta ao banco de dados.
- `redirectByRole` — Implementa lógica local do módulo sem chamada direta ao banco de dados.
- `resize` — Implementa lógica local do módulo sem chamada direta ao banco de dados.
- `setMsg` — Executa transformação e composição de dados sem consulta/gravação no banco.
- `tryFetchText` — Implementa lógica local do módulo sem chamada direta ao banco de dados.
- `updateDots` — Implementa lógica local do módulo sem chamada direta ao banco de dados.

## page-error.html
- `resize` — Implementa lógica local do módulo sem chamada direta ao banco de dados.
- `updateNet` — Implementa lógica local do módulo sem chamada direta ao banco de dados.

## painel-vendas.html
- `addItemRow` — Implementa lógica local do módulo sem chamada direta ao banco de dados.
- `calc` — Executa transformação e composição de dados sem consulta/gravação no banco.
- `calcTotais` — Executa transformação e composição de dados sem consulta/gravação no banco.
- `esc` — Implementa lógica local do módulo sem chamada direta ao banco de dados.
- `fmtBRL` — Implementa lógica local do módulo sem chamada direta ao banco de dados.
- `fmtDate` — Implementa lógica local do módulo sem chamada direta ao banco de dados.
- `init` — Inicializa o fluxo do módulo sem operação de banco.
- `statusBadge` — Implementa lógica local do módulo sem chamada direta ao banco de dados.
- `toast` — Implementa lógica local do módulo sem chamada direta ao banco de dados.

## produto.html
- `toast` — Implementa lógica local do módulo sem chamada direta ao banco de dados.

## tests/stockService.test.js
- `mockProduct` — Implementa lógica local do módulo sem chamada direta ao banco de dados.


