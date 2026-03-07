/*
✅ LÓGICA DA PÁGINA DE CHECKOUT (checkout.html)
🎯 Sistema de finalização de compra em 3 etapas com validação
*/

console.log("✅ checkout.js carregado - Iniciando processo de finalização!");

// ===== VARIÁVEIS GLOBAIS =====
let checkoutData = {
    dadosPessoais: {},
    entrega: {},
    pagamento: {},
    pedido: null
};

let etapaAtual = 1;
let tempoRestante = 15 * 60; // 15 minutos em segundos
let timerInterval;
let metodoPagamento = 'pix';

// ===== INICIALIZAÇÃO =====
document.addEventListener('DOMContentLoaded', function() {
    try {
        console.log("🏁 DOM carregado - Iniciando checkout...");
        
        // Verifica se há pedido
        verificarPedido();
        
        // Inicializa componentes
        inicializarMascaras();
        inicializarEventListeners();
        inicializarEtapas();
        inicializarTimer();
        carregarResumo();
        carregarOpcoesEntrega();
        
        // Inicializa cookie banner
        if (window.utils) {
            window.utils.initCookieBanner();
            window.utils.updateCartCount();
        }
        
        console.log("✅ Checkout inicializado com sucesso!");
        
    } catch (error) {
        console.error("❌ Erro na inicialização do checkout:", error);
        mostrarErro("Erro ao carregar o checkout. Por favor, recarregue a página.");
    }
});

// ===== VERIFICAÇÃO DE PEDIDO =====
function verificarPedido() {
    try {
        // Tenta obter pedido da URL
        const urlParams = new URLSearchParams(window.location.search);
        const pedidoId = urlParams.get('pedido');
        
        if (pedidoId) {
            // Carrega pedido do localStorage
            const pedidos = JSON.parse(localStorage.getItem('hivercar_pedidos')) || [];
            checkoutData.pedido = pedidos.find(p => p.id === pedidoId);
            
            if (checkoutData.pedido) {
                console.log("📦 Pedido encontrado:", checkoutData.pedido.id);
                preencherDadosDoPedido();
            } else {
                console.warn("⚠️ Pedido não encontrado, redirecionando para carrinho");
                window.location.href = 'carrinho.html';
            }
        } else {
            // Se não tem pedido, verifica carrinho
            const carrinho = window.utils ? 
                window.utils.loadFromStorage('cart', []) : 
                JSON.parse(localStorage.getItem('hivercar_cart')) || [];
            
            if (carrinho.length === 0) {
                console.warn("⚠️ Carrinho vazio, redirecionando para loja");
                window.location.href = 'loja.html';
            }
        }
        
    } catch (error) {
        console.error("❌ Erro ao verificar pedido:", error);
        window.location.href = 'carrinho.html';
    }
}

function preencherDadosDoPedido() {
    try {
        if (!checkoutData.pedido) return;
        
        // Preenche resumo com dados do pedido
        atualizarResumoPedido();
        
        // Se já tem dados salvos, preenche formulários
        const dadosSalvos = window.utils ? 
            window.utils.loadFromStorage('checkout_data') : 
            JSON.parse(localStorage.getItem('hivercar_checkout_data'));
        
        if (dadosSalvos) {
            checkoutData = { ...checkoutData, ...dadosSalvos };
            preencherFormularios();
        }
        
    } catch (error) {
        console.error("❌ Erro ao preencher dados do pedido:", error);
    }
}

// ===== INICIALIZAÇÃO DE COMPONENTES =====
function inicializarMascaras() {
    try {
        if (typeof $ !== 'undefined' && $.fn.mask) {
            // CPF
            $('#cpf').mask('000.000.000-00');
            
            // CNPJ
            $('#cnpj').mask('00.000.000/0000-00');
            
            // Telefone
            $('#telefone').mask('(00) 00000-0000');
            
            // CEP
            $('#cep').mask('00000-000');
            
            // Cartão
            $('#numeroCartao').mask('0000 0000 0000 0000');
            $('#validadeCartao').mask('00/00');
            $('#cvvCartao').mask('0000');
            
            console.log("🎭 Máscaras inicializadas!");
        } else {
            console.warn("⚠️ jQuery Mask não carregado, máscaras desativadas");
        }
    } catch (error) {
        console.error("❌ Erro ao inicializar máscaras:", error);
    }
}

function inicializarEventListeners() {
    try {
        console.log("⚙️ Inicializando event listeners...");
        
        // Navegação entre etapas
        document.querySelectorAll('.btn-next').forEach(btn => {
            btn.addEventListener('click', function() {
                const nextStep = parseInt(this.dataset.next);
                avancarEtapa(nextStep);
            });
        });
        
        document.querySelectorAll('.btn-prev').forEach(btn => {
            btn.addEventListener('click', function() {
                const prevStep = parseInt(this.dataset.prev);
                voltarEtapa(prevStep);
            });
        });
        
        // Tipo de cliente
        document.querySelectorAll('input[name="tipoCliente"]').forEach(radio => {
            radio.addEventListener('change', function() {
                const isPJ = this.value === 'pessoa_juridica';
                document.getElementById('pjFields').style.display = isPJ ? 'block' : 'none';
                
                if (isPJ) {
                    document.getElementById('cnpj').required = true;
                    document.getElementById('razaoSocial').required = true;
                } else {
                    document.getElementById('cnpj').required = false;
                    document.getElementById('razaoSocial').required = false;
                }
            });
        });
        
        // Busca CEP
        const buscarCepBtn = document.getElementById('buscarCep');
        if (buscarCepBtn) {
            buscarCepBtn.addEventListener('click', buscarCEP);
        }
        
        const cepInput = document.getElementById('cep');
        if (cepInput) {
            cepInput.addEventListener('keypress', function(e) {
                if (e.key === 'Enter') {
                    e.preventDefault();
                    buscarCEP();
                }
            });
        }
        
        // Método de pagamento
        document.querySelectorAll('.payment-option').forEach(option => {
            option.addEventListener('click', function() {
                selecionarMetodoPagamento(this.dataset.method);
            });
        });
        
        // Confirmação de pedido
        const confirmarBtn = document.getElementById('confirmarPedido');
        if (confirmarBtn) {
            confirmarBtn.addEventListener('click', function(e) {
                e.preventDefault();
                confirmarPedido();
            });
        }
        
        // Modal actions
        const modalClose = document.querySelector('.modal-close');
        if (modalClose) {
            modalClose.addEventListener('click', fecharModal);
        }
        
        const voltarLojaBtn = document.getElementById('voltarLoja');
        if (voltarLojaBtn) {
            voltarLojaBtn.addEventListener('click', function() {
                window.location.href = 'loja.html';
            });
        }
        
        const imprimirBtn = document.getElementById('imprimirPedido');
        if (imprimirBtn) {
            imprimirBtn.addEventListener('click', imprimirPedido);
        }
        
        // Validação em tempo real
        inicializarValidacaoTempoReal();
        
        console.log("✅ Event listeners inicializados!");
        
    } catch (error) {
        console.error("❌ Erro ao inicializar event listeners:", error);
    }
}

function inicializarEtapas() {
    try {
        // Mostra primeira etapa
        mostrarEtapa(1);
        
        // Atualiza progress steps
        atualizarProgressSteps();
        
    } catch (error) {
        console.error("❌ Erro ao inicializar etapas:", error);
    }
}

function inicializarTimer() {
    try {
        // Inicia contador regressivo
        timerInterval = setInterval(() => {
            tempoRestante--;
            
            if (tempoRestante <= 0) {
                clearInterval(timerInterval);
                tempoExpirado();
                return;
            }
            
            // Atualiza display
            const minutos = Math.floor(tempoRestante / 60);
            const segundos = tempoRestante % 60;
            
            const timerDisplay = document.getElementById('checkoutTimer');
            if (timerDisplay) {
                const digits = timerDisplay.querySelectorAll('.timer-digit');
                if (digits.length >= 2) {
                    digits[0].textContent = minutos.toString().padStart(2, '0');
                    digits[1].textContent = segundos.toString().padStart(2, '0');
                }
            }
            
            // Alerta nos últimos 5 minutos
            if (tempoRestante === 5 * 60) {
                mostrarAlertaTempo('⚠️ Restam apenas 5 minutos para finalizar sua compra!');
            }
            
            // Alerta nos últimos 60 segundos
            if (tempoRestante === 60) {
                mostrarAlertaTempo('⏰ Último minuto! Complete sua compra agora!');
                const timerDisplay = document.getElementById('checkoutTimer');
                if (timerDisplay) {
                    timerDisplay.classList.add('warning');
                }
            }
            
        }, 1000);
        
        console.log("⏰ Timer inicializado: 15 minutos");
        
    } catch (error) {
        console.error("❌ Erro ao inicializar timer:", error);
    }
}

function carregarResumo() {
    try {
        if (!checkoutData.pedido) {
            // Cria pedido temporário baseado no carrinho
            const carrinho = window.utils ? 
                window.utils.loadFromStorage('cart', []) : 
                JSON.parse(localStorage.getItem('hivercar_cart')) || [];
            
            const subtotal = carrinho.reduce((total, item) => total + item.subtotal, 0);
            const impostos = subtotal * 0.12; // CBS 12%
            
            checkoutData.pedido = {
                id: `TEMP${Date.now()}`,
                itens: carrinho,
                subtotal: subtotal,
                impostos: impostos,
                frete: 0,
                desconto: 0,
                total: subtotal + impostos
            };
        }
        
        atualizarResumoPedido();
        
    } catch (error) {
        console.error("❌ Erro ao carregar resumo:", error);
    }
}

function carregarOpcoesEntrega() {
    try {
        const container = document.getElementById('deliveryOptions');
        if (!container) return;
        
        const opcoes = [
            {
                id: 'sedex',
                nome: 'Sedex',
                descricao: 'Entrega rápida',
                preco: 15.00,
                prazo: '3-5 dias úteis',
                icone: 'fas fa-shipping-fast'
            },
            {
                id: 'expresso',
                nome: 'Expresso',
                descricao: 'Entrega urgente',
                preco: 25.00,
                prazo: '1-2 dias úteis',
                icone: 'fas fa-rocket'
            },
            {
                id: 'retirada',
                nome: 'Retirar na Loja',
                descricao: 'Sem custo',
                preco: 0.00,
                prazo: 'Imediato',
                icone: 'fas fa-store'
            }
        ];
        
        container.innerHTML = '';
        
        opcoes.forEach(opcao => {
            const optionElement = document.createElement('div');
            optionElement.className = 'delivery-option';
            optionElement.dataset.id = opcao.id;
            
            optionElement.innerHTML = `
                <div class="delivery-icon">
                    <i class="${opcao.icone}"></i>
                </div>
                <div class="delivery-info">
                    <div class="delivery-name">${opcao.nome}</div>
                    <div class="delivery-details">${opcao.descricao}</div>
                    <div class="delivery-time">${opcao.prazo}</div>
                </div>
                <div class="delivery-price">
                    ${opcao.preco === 0 ? 'GRÁTIS' : `R$ ${opcao.preco.toFixed(2)}`}
                </div>
            `;
            
            optionElement.addEventListener('click', function() {
                selecionarOpcaoEntrega(opcao);
            });
            
            container.appendChild(optionElement);
        });
        
        // Seleciona primeira opção por padrão
        if (opcoes.length > 0) {
            selecionarOpcaoEntrega(opcoes[0]);
        }
        
    } catch (error) {
        console.error("❌ Erro ao carregar opções de entrega:", error);
    }
}

// ===== GESTÃO DE ETAPAS =====
function mostrarEtapa(numero) {
    try {
        // Esconde todas as etapas
        document.querySelectorAll('.form-step').forEach(step => {
            step.classList.remove('active');
        });
        
        // Mostra etapa atual
        const etapaElement = document.getElementById(`step${numero}`);
        if (etapaElement) {
            etapaElement.classList.add('active');
            etapaAtual = numero;
            
            // Atualiza progress steps
            atualizarProgressSteps();
            
            // Rola para o topo da etapa
            etapaElement.scrollIntoView({ behavior: 'smooth', block: 'start' });
            
            console.log(`📋 Mostrando etapa ${numero}`);
        }
        
    } catch (error) {
        console.error("❌ Erro ao mostrar etapa:", error);
    }
}

function avancarEtapa(proximaEtapa) {
    try {
        // Valida etapa atual antes de avançar
        if (!validarEtapaAtual()) {
            return;
        }
        
        // Salva dados da etapa atual
        salvarDadosEtapaAtual();
        
        // Mostra próxima etapa
        mostrarEtapa(proximaEtapa);
        
        // Atualiza resumo se necessário
        if (proximaEtapa === 3) {
            atualizarResumoCompleto();
        }
        
    } catch (error) {
        console.error("❌ Erro ao avançar etapa:", error);
    }
}

function voltarEtapa(etapaAnterior) {
    try {
        mostrarEtapa(etapaAnterior);
    } catch (error) {
        console.error("❌ Erro ao voltar etapa:", error);
    }
}

function atualizarProgressSteps() {
    try {
        document.querySelectorAll('.step').forEach(step => {
            const stepNum = parseInt(step.dataset.step);
            
            step.classList.remove('active', 'completed');
            
            if (stepNum === etapaAtual) {
                step.classList.add('active');
            } else if (stepNum < etapaAtual) {
                step.classList.add('completed');
            }
        });
        
    } catch (error) {
        console.error("❌ Erro ao atualizar progress steps:", error);
    }
}

// ===== VALIDAÇÃO =====
function inicializarValidacaoTempoReal() {
    try {
        // Validação de CPF
        const cpfInput = document.getElementById('cpf');
        if (cpfInput) {
            cpfInput.addEventListener('blur', validarCPF);
        }
        
        // Validação de Email
        const emailInput = document.getElementById('email');
        if (emailInput) {
            emailInput.addEventListener('blur', validarEmail);
        }
        
        // Validação de Telefone
        const telefoneInput = document.getElementById('telefone');
        if (telefoneInput) {
            telefoneInput.addEventListener('blur', validarTelefone);
        }
        
        // Validação de CEP
        const cepInput = document.getElementById('cep');
        if (cepInput) {
            cepInput.addEventListener('blur', validarCEP);
        }
        
        console.log("🔍 Validação em tempo real inicializada!");
        
    } catch (error) {
        console.error("❌ Erro ao inicializar validação:", error);
    }
}

function validarEtapaAtual() {
    try {
        switch (etapaAtual) {
            case 1:
                return validarDadosPessoais();
            case 2:
                return validarEntrega();
            case 3:
                return validarPagamento();
            default:
                return true;
        }
    } catch (error) {
        console.error("❌ Erro ao validar etapa:", error);
        return false;
    }
}

function validarDadosPessoais() {
    try {
        let valido = true;
        
        // Nome
        const nome = document.getElementById('nome');
        const errorNome = document.getElementById('errorNome');
        
        if (!nome.value.trim()) {
            mostrarErroCampo(nome, errorNome, 'Nome é obrigatório');
            valido = false;
        } else if (nome.value.trim().length < 3) {
            mostrarErroCampo(nome, errorNome, 'Nome deve ter pelo menos 3 caracteres');
            valido = false;
        } else {
            limparErroCampo(nome, errorNome);
        }
        
        // CPF
        const cpf = document.getElementById('cpf');
        const errorCpf = document.getElementById('errorCpf');
        
        if (!cpf.value.trim()) {
            mostrarErroCampo(cpf, errorCpf, 'CPF é obrigatório');
            valido = false;
        } else if (!validarCPF(cpf.value)) {
            mostrarErroCampo(cpf, errorCpf, 'CPF inválido');
            valido = false;
        } else {
            limparErroCampo(cpf, errorCpf);
        }
        
        // Email
        const email = document.getElementById('email');
        const errorEmail = document.getElementById('errorEmail');
        
        if (!email.value.trim()) {
            mostrarErroCampo(email, errorEmail, 'E-mail é obrigatório');
            valido = false;
        } else if (!validarEmail(email.value)) {
            mostrarErroCampo(email, errorEmail, 'E-mail inválido');
            valido = false;
        } else {
            limparErroCampo(email, errorEmail);
        }
        
        // Telefone
        const telefone = document.getElementById('telefone');
        const errorTelefone = document.getElementById('errorTelefone');
        
        if (!telefone.value.trim()) {
            mostrarErroCampo(telefone, errorTelefone, 'Telefone é obrigatório');
            valido = false;
        } else if (telefone.value.replace(/\D/g, '').length < 10) {
            mostrarErroCampo(telefone, errorTelefone, 'Telefone inválido');
            valido = false;
        } else {
            limparErroCampo(telefone, errorTelefone);
        }
        
        // Se for PJ, valida CNPJ e Razão Social
        const isPJ = document.querySelector('input[name="tipoCliente"]:checked').value === 'pessoa_juridica';
        
        if (isPJ) {
            const cnpj = document.getElementById('cnpj');
            const razaoSocial = document.getElementById('razaoSocial');
            
            if (!cnpj.value.trim()) {
                mostrarErroCampo(cnpj, null, 'CNPJ é obrigatório');
                valido = false;
            }
            
            if (!razaoSocial.value.trim()) {
                mostrarErroCampo(razaoSocial, null, 'Razão Social é obrigatória');
                valido = false;
            }
        }
        
        return valido;
        
    } catch (error) {
        console.error("❌ Erro ao validar dados pessoais:", error);
        return false;
    }
}

function validarEntrega() {
    try {
        let valido = true;
        
        // CEP
        const cep = document.getElementById('cep');
        const errorCep = document.getElementById('errorCep');
        
        if (!cep.value.trim()) {
            mostrarErroCampo(cep, errorCep, 'CEP é obrigatório');
            valido = false;
        } else if (cep.value.replace(/\D/g, '').length !== 8) {
            mostrarErroCampo(cep, errorCep, 'CEP inválido');
            valido = false;
        } else {
            limparErroCampo(cep, errorCep);
        }
        
        // Endereço
        const endereco = document.getElementById('endereco');
        const errorEndereco = document.getElementById('errorEndereco');
        
        if (!endereco.value.trim()) {
            mostrarErroCampo(endereco, errorEndereco, 'Endereço é obrigatório');
            valido = false;
        } else {
            limparErroCampo(endereco, errorEndereco);
        }
        
        // Número
        const numero = document.getElementById('numero');
        const errorNumero = document.getElementById('errorNumero');
        
        if (!numero.value.trim()) {
            mostrarErroCampo(numero, errorNumero, 'Número é obrigatório');
            valido = false;
        } else {
            limparErroCampo(numero, errorNumero);
        }
        
        // Bairro
        const bairro = document.getElementById('bairro');
        const errorBairro = document.getElementById('errorBairro');
        
        if (!bairro.value.trim()) {
            mostrarErroCampo(bairro, errorBairro, 'Bairro é obrigatório');
            valido = false;
        } else {
            limparErroCampo(bairro, errorBairro);
        }
        
        // Cidade
        const cidade = document.getElementById('cidade');
        const errorCidade = document.getElementById('errorCidade');
        
        if (!cidade.value.trim()) {
            mostrarErroCampo(cidade, errorCidade, 'Cidade é obrigatória');
            valido = false;
        } else {
            limparErroCampo(cidade, errorCidade);
        }
        
        // Estado
        const estado = document.getElementById('estado');
        const errorEstado = document.getElementById('errorEstado');
        
        if (!estado.value) {
            mostrarErroCampo(estado, errorEstado, 'Estado é obrigatório');
            valido = false;
        } else {
            limparErroCampo(estado, errorEstado);
        }
        
        return valido;
        
    } catch (error) {
        console.error("❌ Erro ao validar entrega:", error);
        return false;
    }
}

function validarPagamento() {
    try {
        let valido = true;
        
        // Termos e condições
        const aceitarTermos = document.getElementById('aceitarTermos');
        const errorTermos = document.getElementById('errorTermos');
        
        if (!aceitarTermos.checked) {
            mostrarErroCampo(aceitarTermos, errorTermos, 'Você deve aceitar os termos e condições');
            valido = false;
        } else {
            limparErroCampo(aceitarTermos, errorTermos);
        }
        
        // Validação específica por método de pagamento
        if (metodoPagamento === 'cartao') {
            // Número do cartão
            const numeroCartao = document.getElementById('numeroCartao');
            const errorNumeroCartao = document.getElementById('errorNumeroCartao');
            
            const numeroLimpo = numeroCartao.value.replace(/\D/g, '');
            if (numeroLimpo.length !== 16) {
                mostrarErroCampo(numeroCartao, errorNumeroCartao, 'Número do cartão inválido');
                valido = false;
            } else {
                limparErroCampo(numeroCartao, errorNumeroCartao);
            }
            
            // Nome no cartão
            const nomeCartao = document.getElementById('nomeCartao');
            const errorNomeCartao = document.getElementById('errorNomeCartao');
            
            if (!nomeCartao.value.trim()) {
                mostrarErroCampo(nomeCartao, errorNomeCartao, 'Nome no cartão é obrigatório');
                valido = false;
            } else {
                limparErroCampo(nomeCartao, errorNomeCartao);
            }
            
            // Validade
            const validadeCartao = document.getElementById('validadeCartao');
            const errorValidadeCartao = document.getElementById('errorValidadeCartao');
            
            const [mes, ano] = validadeCartao.value.split('/');
            const hoje = new Date();
            const mesAtual = hoje.getMonth() + 1;
            const anoAtual = hoje.getFullYear() % 100;
            
            if (!mes || !ano || mes < 1 || mes > 12 || 
                (parseInt(ano) < anoAtual) || 
                (parseInt(ano) === anoAtual && parseInt(mes) < mesAtual)) {
                mostrarErroCampo(validadeCartao, errorValidadeCartao, 'Validade inválida ou expirada');
                valido = false;
            } else {
                limparErroCampo(validadeCartao, errorValidadeCartao);
            }
            
            // CVV
            const cvvCartao = document.getElementById('cvvCartao');
            const errorCvvCartao = document.getElementById('errorCvvCartao');
            
            if (cvvCartao.value.length < 3 || cvvCartao.value.length > 4) {
                mostrarErroCampo(cvvCartao, errorCvvCartao, 'CVV inválido');
                valido = false;
            } else {
                limparErroCampo(cvvCartao, errorCvvCartao);
            }
        }
        
        return valido;
        
    } catch (error) {
        console.error("❌ Erro ao validar pagamento:", error);
        return false;
    }
}

// Funções de validação específicas
function validarCPF(cpf) {
    cpf = cpf.replace(/\D/g, '');
    
    if (cpf.length !== 11) return false;
    
    // Validação simples de CPF
    // Em produção, usar algoritmo completo
    return /^\d{11}$/.test(cpf);
}

function validarEmail(email) {
    const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return re.test(email);
}

function validarTelefone(telefone) {
    const numeros = telefone.replace(/\D/g, '');
    return numeros.length >= 10 && numeros.length <= 11;
}

function validarCEP(cep) {
    const numeros = cep.replace(/\D/g, '');
    return numeros.length === 8;
}

// ===== FUNÇÕES AUXILIARES DE VALIDAÇÃO =====
function mostrarErroCampo(campo, elementoErro, mensagem) {
    campo.classList.add('error');
    campo.classList.remove('valid');
    
    if (elementoErro) {
        elementoErro.textContent = mensagem;
    }
}

function limparErroCampo(campo, elementoErro) {
    campo.classList.remove('error');
    campo.classList.add('valid');
    
    if (elementoErro) {
        elementoErro.textContent = '';
    }
}

// ===== BUSCA CEP =====
function buscarCEP() {
    try {
        const cepInput = document.getElementById('cep');
        const cep = cepInput.value.replace(/\D/g, '');
        
        if (cep.length !== 8) {
            mostrarErroCampo(cepInput, document.getElementById('errorCep'), 'CEP inválido');
            return;
        }
        
        // Mostra loading
        cepInput.disabled = true;
        const buscarBtn = document.getElementById('buscarCep');
        if (buscarBtn) {
            buscarBtn.disabled = true;
            buscarBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i>';
        }
        
        // Simula busca na API ViaCEP
        setTimeout(() => {
            // Dados mockados para exemplo
            const enderecosMock = {
                '01001000': {
                    logradouro: 'Praça da Sé',
                    bairro: 'Sé',
                    localidade: 'São Paulo',
                    uf: 'SP'
                },
                '20040002': {
                    logradouro: 'Rua Primeiro de Março',
                    bairro: 'Centro',
                    localidade: 'Rio de Janeiro',
                    uf: 'RJ'
                },
                '30130005': {
                    logradouro: 'Rua da Bahia',
                    bairro: 'Centro',
                    localidade: 'Belo Horizonte',
                    uf: 'MG'
                }
            };
            
            const endereco = enderecosMock[cep] || null;
            
            if (endereco) {
                // Preenche campos automaticamente
                document.getElementById('endereco').value = endereco.logradouro;
                document.getElementById('bairro').value = endereco.bairro;
                document.getElementById('cidade').value = endereco.localidade;
                document.getElementById('estado').value = endereco.uf;
                
                // Foca no campo número
                document.getElementById('numero').focus();
                
                // Feedback positivo
                if (window.utils) {
                    window.utils.showNotification('✅ Endereço encontrado!', 'success');
                }
            } else {
                // CEP não encontrado
                mostrarErroCampo(cepInput, document.getElementById('errorCep'), 'CEP não encontrado');
                
                if (window.utils) {
                    window.utils.showNotification('❌ CEP não encontrado. Preencha manualmente.', 'error');
                }
            }
            
            // Restaura botão
            cepInput.disabled = false;
            if (buscarBtn) {
                buscarBtn.disabled = false;
                buscarBtn.innerHTML = '<i class="fas fa-search"></i> Buscar';
            }
            
        }, 1000); // Simula delay de rede
        
    } catch (error) {
        console.error("❌ Erro ao buscar CEP:", error);
        
        const cepInput = document.getElementById('cep');
        cepInput.disabled = false;
        
        const buscarBtn = document.getElementById('buscarCep');
        if (buscarBtn) {
            buscarBtn.disabled = false;
            buscarBtn.innerHTML = '<i class="fas fa-search"></i> Buscar';
        }
        
        if (window.utils) {
            window.utils.showNotification('❌ Erro ao buscar CEP', 'error');
        }
    }
}

// ===== SELEÇÃO DE OPÇÕES =====
function selecionarOpcaoEntrega(opcao) {
    try {
        // Remove seleção anterior
        document.querySelectorAll('.delivery-option').forEach(opt => {
            opt.classList.remove('selected');
        });
        
        // Adiciona seleção atual
        const optionElement = document.querySelector(`.delivery-option[data-id="${opcao.id}"]`);
        if (optionElement) {
            optionElement.classList.add('selected');
        }
        
        // Atualiza dados
        checkoutData.entrega.opcao = opcao;
        checkoutData.pedido.frete = opcao.preco;
        
        // Atualiza resumo
        atualizarResumoPedido();
        
        console.log(`🚚 Opção de entrega selecionada: ${opcao.nome} - R$ ${opcao.preco}`);
        
    } catch (error) {
        console.error("❌ Erro ao selecionar opção de entrega:", error);
    }
}

function selecionarMetodoPagamento(metodo) {
    try {
        // Remove seleção anterior
        document.querySelectorAll('.payment-option').forEach(opt => {
            opt.classList.remove('active');
        });
        
        // Adiciona seleção atual
        const optionElement = document.querySelector(`.payment-option[data-method="${metodo}"]`);
        if (optionElement) {
            optionElement.classList.add('active');
        }
        
        // Mostra/esconde campos específicos
        document.getElementById('cardFields').style.display = metodo === 'cartao' ? 'block' : 'none';
        document.getElementById('pixInfo').style.display = metodo === 'pix' ? 'block' : 'none';
        document.getElementById('boletoInfo').style.display = metodo === 'boleto' ? 'block' : 'none';
        
        // Atualiza variável global
        metodoPagamento = metodo;
        checkoutData.pagamento.metodo = metodo;
        
        console.log(`💳 Método de pagamento selecionado: ${metodo}`);
        
    } catch (error) {
        console.error("❌ Erro ao selecionar método de pagamento:", error);
    }
}

// ===== ATUALIZAÇÃO DE DADOS =====
function salvarDadosEtapaAtual() {
    try {
        switch (etapaAtual) {
            case 1:
                salvarDadosPessoais();
                break;
            case 2:
                salvarDadosEntrega();
                break;
            case 3:
                salvarDadosPagamento();
                break;
        }
        
        // Salva no localStorage
        if (window.utils) {
            window.utils.saveToStorage('checkout_data', checkoutData);
        } else {
            localStorage.setItem('hivercar_checkout_data', JSON.stringify(checkoutData));
        }
        
    } catch (error) {
        console.error("❌ Erro ao salvar dados da etapa:", error);
    }
}

function salvarDadosPessoais() {
    try {
        checkoutData.dadosPessoais = {
            nome: document.getElementById('nome').value,
            cpf: document.getElementById('cpf').value,
            email: document.getElementById('email').value,
            telefone: document.getElementById('telefone').value,
            tipoCliente: document.querySelector('input[name="tipoCliente"]:checked').value,
            cnpj: document.getElementById('cnpj').value,
            razaoSocial: document.getElementById('razaoSocial').value
        };
        
        console.log("💾 Dados pessoais salvos");
        
    } catch (error) {
        console.error("❌ Erro ao salvar dados pessoais:", error);
    }
}

function salvarDadosEntrega() {
    try {
        checkoutData.entrega = {
            cep: document.getElementById('cep').value,
            endereco: document.getElementById('endereco').value,
            numero: document.getElementById('numero').value,
            complemento: document.getElementById('complemento').value,
            bairro: document.getElementById('bairro').value,
            cidade: document.getElementById('cidade').value,
            estado: document.getElementById('estado').value,
            observacoes: document.getElementById('observacoes').value,
            opcao: checkoutData.entrega.opcao || null
        };
        
        console.log("💾 Dados de entrega salvos");
        
    } catch (error) {
        console.error("❌ Erro ao salvar dados de entrega:", error);
    }
}

function salvarDadosPagamento() {
    try {
        checkoutData.pagamento = {
            metodo: metodoPagamento,
            numeroCartao: document.getElementById('numeroCartao').value,
            nomeCartao: document.getElementById('nomeCartao').value,
            validadeCartao: document.getElementById('validadeCartao').value,
            cvvCartao: document.getElementById('cvvCartao').value,
            parcelas: document.getElementById('parcelas').value,
            aceitarTermos: document.getElementById('aceitarTermos').checked,
            receberOfertas: document.getElementById('receberOfertas').checked
        };
        
        console.log("💾 Dados de pagamento salvos");
        
    } catch (error) {
        console.error("❌ Erro ao salvar dados de pagamento:", error);
    }
}

function preencherFormularios() {
    try {
        // Dados Pessoais
        if (checkoutData.dadosPessoais) {
            const dp = checkoutData.dadosPessoais;
            document.getElementById('nome').value = dp.nome || '';
            document.getElementById('cpf').value = dp.cpf || '';
            document.getElementById('email').value = dp.email || '';
            document.getElementById('telefone').value = dp.telefone || '';
            
            if (dp.tipoCliente) {
                document.querySelector(`input[name="tipoCliente"][value="${dp.tipoCliente}"]`).checked = true;
                
                if (dp.tipoCliente === 'pessoa_juridica') {
                    document.getElementById('pjFields').style.display = 'block';
                    document.getElementById('cnpj').value = dp.cnpj || '';
                    document.getElementById('razaoSocial').value = dp.razaoSocial || '';
                }
            }
        }
        
        // Entrega
        if (checkoutData.entrega) {
            const ent = checkoutData.entrega;
            document.getElementById('cep').value = ent.cep || '';
            document.getElementById('endereco').value = ent.endereco || '';
            document.getElementById('numero').value = ent.numero || '';
            document.getElementById('complemento').value = ent.complemento || '';
            document.getElementById('bairro').value = ent.bairro || '';
            document.getElementById('cidade').value = ent.cidade || '';
            document.getElementById('estado').value = ent.estado || '';
            document.getElementById('observacoes').value = ent.observacoes || '';
            
            if (ent.opcao) {
                const optionElement = document.querySelector(`.delivery-option[data-id="${ent.opcao.id}"]`);
                if (optionElement) {
                    optionElement.classList.add('selected');
                }
            }
        }
        
        // Pagamento
        if (checkoutData.pagamento) {
            const pag = checkoutData.pagamento;
            
            if (pag.metodo) {
                selecionarMetodoPagamento(pag.metodo);
            }
            
            document.getElementById('numeroCartao').value = pag.numeroCartao || '';
            document.getElementById('nomeCartao').value = pag.nomeCartao || '';
            document.getElementById('validadeCartao').value = pag.validadeCartao || '';
            document.getElementById('cvvCartao').value = pag.cvvCartao || '';
            document.getElementById('parcelas').value = pag.parcelas || '1';
            document.getElementById('aceitarTermos').checked = pag.aceitarTermos || false;
            document.getElementById('receberOfertas').checked = pag.receberOfertas || false;
        }
        
        console.log("📝 Formulários preenchidos com dados salvos");
        
    } catch (error) {
        console.error("❌ Erro ao preencher formulários:", error);
    }
}

// ===== ATUALIZAÇÃO DO RESUMO =====
function atualizarResumoPedido() {
    try {
        if (!checkoutData.pedido) return;
        
        const pedido = checkoutData.pedido;
        
        // Atualiza valores
        document.getElementById('resumoSubtotal').textContent = 
            window.utils ? window.utils.formatCurrency(pedido.subtotal) : `R$ ${pedido.subtotal.toFixed(2)}`;
        
        document.getElementById('resumoImpostos').textContent = 
            window.utils ? window.utils.formatCurrency(pedido.impostos) : `R$ ${pedido.impostos.toFixed(2)}`;
        
        document.getElementById('resumoFrete').textContent = 
            window.utils ? window.utils.formatCurrency(pedido.frete) : `R$ ${pedido.frete.toFixed(2)}`;
        
        document.getElementById('resumoDescontos').textContent = 
            window.utils ? `- ${window.utils.formatCurrency(pedido.desconto)}` : `- R$ ${pedido.desconto.toFixed(2)}`;
        
        document.getElementById('resumoTotal').textContent = 
            window.utils ? window.utils.formatCurrency(pedido.total) : `R$ ${pedido.total.toFixed(2)}`;
        
        // Atualiza lista de itens
        atualizarListaItensResumo();
        
    } catch (error) {
        console.error("❌ Erro ao atualizar resumo do pedido:", error);
    }
}

function atualizarListaItensResumo() {
    try {
        const container = document.getElementById('resumoItens');
        if (!container || !checkoutData.pedido || !checkoutData.pedido.itens) return;
        
        container.innerHTML = '';
        
        checkoutData.pedido.itens.forEach(item => {
            const itemElement = document.createElement('div');
            itemElement.className = 'resumo-item';
            
            itemElement.innerHTML = `
                <div class="resumo-item-img">
                    <img src="${item.imagem || 'assets/images/produtos/default.jpg'}" 
                         alt="${item.nome}"
                         onerror="this.src='assets/images/produtos/default.jpg'">
                </div>
                <div class="resumo-item-info">
                    <div class="resumo-item-name">${item.nome}</div>
                    <div class="resumo-item-details">
                        <span>Qtd: ${item.quantidade}</span>
                        <span>Un: ${window.utils ? window.utils.formatCurrency(item.preco) : `R$ ${item.preco.toFixed(2)}`}</span>
                    </div>
                </div>
                <div class="resumo-item-price">
                    ${window.utils ? window.utils.formatCurrency(item.subtotal) : `R$ ${item.subtotal.toFixed(2)}`}
                </div>
            `;
            
            container.appendChild(itemElement);
        });
        
    } catch (error) {
        console.error("❌ Erro ao atualizar lista de itens do resumo:", error);
    }
}

function atualizarResumoCompleto() {
    try {
        // Recalcula totais com base nos dados atuais
        if (checkoutData.pedido && checkoutData.entrega.opcao) {
            checkoutData.pedido.frete = checkoutData.entrega.opcao.preco;
            checkoutData.pedido.total = checkoutData.pedido.subtotal + 
                                       checkoutData.pedido.impostos + 
                                       checkoutData.pedido.frete - 
                                       checkoutData.pedido.desconto;
            
            atualizarResumoPedido();
        }
        
    } catch (error) {
        console.error("❌ Erro ao atualizar resumo completo:", error);
    }
}

// ===== CONFIRMAÇÃO DO PEDIDO =====
function confirmarPedido() {
    try {
        console.log("🚀 Confirmando pedido...");
        
        // Valida etapa atual
        if (!validarPagamento()) {
            return;
        }
        
        // Salva dados da etapa atual
        salvarDadosEtapaAtual();
        
        // Mostra loading
        mostrarLoading();
        
        // Simula processamento
        setTimeout(() => {
            // Cria pedido final
            const pedidoFinal = criarPedidoFinal();
            
            // Salva pedido
            salvarPedidoFinal(pedidoFinal);
            
            // Limpa dados temporários
            limparDadosTemporarios();
            
            // Esconde loading
            esconderLoading();
            
            // Mostra confirmação
            mostrarConfirmacao(pedidoFinal);
            
            console.log("✅ Pedido confirmado:", pedidoFinal.id);
            
        }, 2000); // Simula delay de processamento
        
    } catch (error) {
        console.error("❌ Erro ao confirmar pedido:", error);
        esconderLoading();
        
        if (window.utils) {
            window.utils.showNotification('❌ Erro ao confirmar pedido', 'error');
        }
    }
}

function criarPedidoFinal() {
    try {
        const pedidoId = `PED${Date.now()}${Math.floor(Math.random() * 1000)}`;
        
        return {
            id: pedidoId,
            data: new Date().toISOString(),
            status: 'confirmado',
            dadosPessoais: { ...checkoutData.dadosPessoais },
            entrega: { ...checkoutData.entrega },
            pagamento: { ...checkoutData.pagamento },
            itens: [...checkoutData.pedido.itens],
            subtotal: checkoutData.pedido.subtotal,
            impostos: checkoutData.pedido.impostos,
            frete: checkoutData.pedido.frete,
            desconto: checkoutData.pedido.desconto,
            total: checkoutData.pedido.total,
            numeroPedido: gerarNumeroPedido()
        };
        
    } catch (error) {
        console.error("❌ Erro ao criar pedido final:", error);
        throw error;
    }
}

function gerarNumeroPedido() {
    const data = new Date();
    const ano = data.getFullYear().toString().slice(-2);
    const mes = (data.getMonth() + 1).toString().padStart(2, '0');
    const dia = data.getDate().toString().padStart(2, '0');
    const sequencial = Math.floor(Math.random() * 10000).toString().padStart(4, '0');
    
    return `HIV${ano}${mes}${dia}${sequencial}`;
}

function salvarPedidoFinal(pedido) {
    try {
        // Salva no histórico de pedidos
        const pedidos = JSON.parse(localStorage.getItem('hivercar_pedidos_finalizados')) || [];
        pedidos.push(pedido);
        localStorage.setItem('hivercar_pedidos_finalizados', JSON.stringify(pedidos));
        
        // Limpa carrinho
        if (window.utils) {
            window.utils.saveToStorage('cart', []);
            window.utils.updateCartCount();
        } else {
            localStorage.removeItem('hivercar_cart');
        }
        
        console.log("💾 Pedido final salvo:", pedido.id);
        
    } catch (error) {
        console.error("❌ Erro ao salvar pedido final:", error);
    }
}

function limparDadosTemporarios() {
    try {
        // Limpa dados de checkout
        if (window.utils) {
            window.utils.removeFromStorage('checkout_data');
        } else {
            localStorage.removeItem('hivercar_checkout_data');
        }
        
        // Limpa pedido temporário
        checkoutData.pedido = null;
        
        console.log("🧹 Dados temporários limpos");
        
    } catch (error) {
        console.error("❌ Erro ao limpar dados temporários:", error);
    }
}

// ===== MODAL DE CONFIRMAÇÃO =====
function mostrarConfirmacao(pedido) {
    try {
        // Preenche dados no modal
        document.getElementById('pedidoNumero').textContent = `Pedido #${pedido.numeroPedido}`;
        document.getElementById('confirmationEmail').textContent = pedido.dadosPessoais.email;
        
        // Previsão de entrega
        const prazo = pedido.entrega.opcao?.prazo || '3-5 dias úteis';
        document.getElementById('confirmationDelivery').textContent = prazo;
        
        // Forma de pagamento
        const metodo = pedido.pagamento.metodo === 'pix' ? 'PIX' :
                      pedido.pagamento.metodo === 'cartao' ? 'Cartão de Crédito' :
                      pedido.pagamento.metodo === 'boleto' ? 'Boleto Bancário' : 'Não informado';
        document.getElementById('confirmationPayment').textContent = metodo;
        
        // Configura link do WhatsApp
        const whatsappBtn = document.getElementById('whatsappAcompanhar');
        if (whatsappBtn) {
            const mensagem = `Olá HIVERCAR! 👋\nAcabei de fazer o pedido #${pedido.numeroPedido}\nValor: ${window.utils ? window.utils.formatCurrency(pedido.total) : `R$ ${pedido.total.toFixed(2)}`}\nPodem me ajudar com o acompanhamento?`;
            const phone = '5511999999999';
            whatsappBtn.href = `https://wa.me/${phone}?text=${encodeURIComponent(mensagem)}`;
        }
        
        // Mostra modal
        const modal = document.getElementById('confirmationModal');
        if (modal) {
            modal.classList.add('show');
            document.body.style.overflow = 'hidden';
        }
        
        // Para o timer
        clearInterval(timerInterval);
        
    } catch (error) {
        console.error("❌ Erro ao mostrar confirmação:", error);
    }
}

function fecharModal() {
    try {
        const modal = document.getElementById('confirmationModal');
        if (modal) {
            modal.classList.remove('show');
            document.body.style.overflow = 'auto';
        }
    } catch (error) {
        console.error("❌ Erro ao fechar modal:", error);
    }
}

function imprimirPedido() {
    try {
        window.print();
    } catch (error) {
        console.error("❌ Erro ao imprimir pedido:", error);
    }
}

// ===== FUNÇÕES AUXILIARES =====
function tempoExpirado() {
    try {
        console.log("⏰ Tempo expirado!");
        
        // Mostra alerta
        if (window.utils) {
            window.utils.showNotification('⏰ Tempo esgotado! Sua sessão expirou.', 'error');
        }
        
        // Redireciona após 3 segundos
        setTimeout(() => {
            window.location.href = 'carrinho.html';
        }, 3000);
        
    } catch (error) {
        console.error("❌ Erro ao processar tempo expirado:", error);
    }
}

function mostrarAlertaTempo(mensagem) {
    try {
        if (window.utils) {
            window.utils.showNotification(mensagem, 'warning');
        }
    } catch (error) {
        console.error("❌ Erro ao mostrar alerta de tempo:", error);
    }
}

function mostrarLoading() {
    try {
        let loadingOverlay = document.querySelector('.loading-overlay');
        
        if (!loadingOverlay) {
            loadingOverlay = document.createElement('div');
            loadingOverlay.className = 'loading-overlay';
            loadingOverlay.innerHTML = `
                <div class="loading"></div>
                <p>Processando seu pedido...</p>
            `;
            document.body.appendChild(loadingOverlay);
        }
        
        loadingOverlay.style.display = 'flex';
        
    } catch (error) {
        console.error("❌ Erro ao mostrar loading:", error);
    }
}

function esconderLoading() {
    try {
        const loadingOverlay = document.querySelector('.loading-overlay');
        if (loadingOverlay) {
            loadingOverlay.style.display = 'none';
        }
    } catch (error) {
        console.error("❌ Erro ao esconder loading:", error);
    }
}

function mostrarErro(mensagem) {
    try {
        const main = document.querySelector('.checkout-main');
        if (main) {
            const errorDiv = document.createElement('div');
            errorDiv.className = 'error-message';
            errorDiv.innerHTML = `
                <i class="fas fa-exclamation-triangle"></i>
                <strong>Erro:</strong> ${mensagem}
                <button onclick="location.reload()" class="btn btn-small btn-outline" style="margin-left: 10px;">
                    Recarregar
                </button>
            `;
            main.insertBefore(errorDiv, main.firstChild);
        }
    } catch (error) {
        console.error("❌ Erro ao mostrar mensagem de erro:", error);
    }
}

// ===== EXPORTAÇÃO PARA DEBUG =====
window.checkoutPage = {
    mostrarEtapa,
    avancarEtapa,
    voltarEtapa,
    validarEtapaAtual,
    buscarCEP,
    selecionarMetodoPagamento,
    confirmarPedido,
    getCheckoutData: () => checkoutData,
    getEtapaAtual: () => etapaAtual,
    getTempoRestante: () => tempoRestante
};

console.log("✅ checkout.js carregado com sucesso! Funções disponíveis em window.checkoutPage");