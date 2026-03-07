/*🔧 Utilitários para todo o sistema HIVERCAR */

console.log("🛠️ utils.js carregado - Sistema de utilitários ativo!");

// ===== SISTEMA DE LOG (DEBUG CONTROLADO) =====
const DEBUG_MODE = localStorage.getItem('hivercar_debug') === 'true';

/**
 * Log apenas se debug mode estiver ativo
 * @param {string} context - Contexto da mensagem
 * @param {string} message - Mensagem principal
 * @param {any} data - Dados adicionais (opcional)
 */
function logDev(context, message, data = null) {
    if (DEBUG_MODE) {
        console.log(`🔍 [${context}] ${message}`, data || '');
    }
}

/**
 * Ativa/desativa modo debug
 * @param {boolean} enable - true para ativar
 */
function setDebugMode(enable) {
    if (enable) {
        localStorage.setItem('hivercar_debug', 'true');
        console.log("🐛 DEBUG MODE ATIVADO - Todos os logs serão mostrados");
    } else {
        localStorage.removeItem('hivercar_debug');
        console.log("🐛 DEBUG MODE DESATIVADO");
    }
}

// ===== MANIPULAÇÃO DE DOM =====

/**
 * Cria elemento HTML com atributos
 * @param {string} tag - Tag do elemento
 * @param {Object} attributes - Atributos do elemento
 * @param {string|HTMLElement} content - Conteúdo do elemento
 * @returns {HTMLElement} Elemento criado
 */
function createElement(tag, attributes = {}, content = '') {
    try {
        const element = document.createElement(tag);
        
        // Adiciona atributos
        Object.entries(attributes).forEach(([key, value]) => {
            if (key === 'className') {
                element.className = value;
            } else if (key === 'dataset') {
                Object.entries(value).forEach(([dataKey, dataValue]) => {
                    element.dataset[dataKey] = dataValue;
                });
            } else {
                element.setAttribute(key, value);
            }
        });
        
        // Adiciona conteúdo
        if (typeof content === 'string') {
            element.innerHTML = sanitizeHTML(content);
        } else if (content instanceof HTMLElement) {
            element.appendChild(content);
        } else if (Array.isArray(content)) {
            content.forEach(child => {
                if (child instanceof HTMLElement) {
                    element.appendChild(child);
                }
            });
        }
        
        return element;
    } catch (error) {
        console.error('❌ Erro ao criar elemento:', error);
        return document.createElement('div');
    }
}

/**
 * Sanitiza HTML para prevenir XSS
 * @param {string} html - HTML a ser sanitizado
 * @returns {string} HTML seguro
 */
function sanitizeHTML(html) {
    if (!html) return '';
    
    const temp = document.createElement('div');
    temp.textContent = html;
    return temp.innerHTML;
}

/**
 * Formata número como moeda brasileira
 * @param {number} value - Valor a ser formatado
 * @returns {string} Valor formatado (R$ 1.234,56)
 */
function formatCurrency(value) {
    return new Intl.NumberFormat('pt-BR', {
        style: 'currency',
        currency: 'BRL'
    }).format(value || 0);
}

/**
 * Formata número com separadores
 * @param {number} value - Valor a ser formatado
 * @returns {string} Valor formatado (1.234,56)
 */
function formatNumber(value) {
    return new Intl.NumberFormat('pt-BR').format(value || 0);
}

// ===== MANIPULAÇÃO DE DADOS =====

/**
 * Calcula impostos (CBS para produtos, ISS para serviços)
 * @param {number} value - Valor base
 * @param {string} type - Tipo (produto|servico)
 * @returns {Object} { base, imposto, total }
 */
function calculateTax(value, type = 'produto') {
    const taxRate = type === 'servico' ? 0.05 : 0.12; // ISS 5% ou CBS 12%
    const tax = value * taxRate;
    const total = value + tax;
    
    return {
        base: value,
        imposto: tax,
        total: total,
        taxa: taxRate * 100,
        tipo: type === 'servico' ? 'ISS' : 'CBS'
    };
}

/**
 * Valida email
 * @param {string} email - Email a ser validado
 * @returns {boolean} true se válido
 */
function isValidEmail(email) {
    const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return re.test(email);
}

/**
 * Valida CPF (formato básico)
 * @param {string} cpf - CPF a ser validado
 * @returns {boolean} true se formato válido
 */
function isValidCPF(cpf) {
    cpf = cpf.replace(/\D/g, '');
    return cpf.length === 11;
}

// ===== LOCALSTORAGE HELPERS =====

/**
 * Salva dados no localStorage com tratamento de erro
 * @param {string} key - Chave
 * @param {any} data - Dados a serem salvos
 */
function saveToStorage(key, data) {
    try {
        localStorage.setItem(`hivercar_${key}`, JSON.stringify(data));
        logDev('STORAGE', `✅ Dados salvos em ${key}`, data);
    } catch (error) {
        console.error('❌ Erro ao salvar no localStorage:', error);
        // Fallback para sessionStorage se localStorage falhar
        try {
            sessionStorage.setItem(`hivercar_${key}`, JSON.stringify(data));
        } catch (e) {
            console.error('❌ Erro ao salvar no sessionStorage:', e);
        }
    }
}

/**
 * Carrega dados do localStorage
 * @param {string} key - Chave
 * @param {any} defaultValue - Valor padrão se não existir
 * @returns {any} Dados carregados
 */
function loadFromStorage(key, defaultValue = null) {
    try {
        const data = localStorage.getItem(`hivercar_${key}`);
        return data ? JSON.parse(data) : defaultValue;
    } catch (error) {
        console.error('❌ Erro ao carregar do localStorage:', error);
        return defaultValue;
    }
}

/**
 * Remove dados do localStorage
 * @param {string} key - Chave
 */
function removeFromStorage(key) {
    try {
        localStorage.removeItem(`hivercar_${key}`);
        logDev('STORAGE', `🗑️ Dados removidos de ${key}`);
    } catch (error) {
        console.error('❌ Erro ao remover do localStorage:', error);
    }
}

// ===== TEMPLATE BUILDERS =====

/**
 * Cria card de produto
 * @param {Object} produto - Dados do produto
 * @returns {HTMLElement} Card HTML
 */
function buildProductCard(produto) {
    const isLowStock = produto.estoque < 5;
    const isOutOfStock = produto.estoque === 0;
    
    const stockBadge = isOutOfStock 
        ? '<span class="badge badge-secondary">ESGOTADO 😢</span>'
        : isLowStock 
            ? `<span class="badge badge-warning">ÚLTIMAS ${produto.estoque}!</span>`
            : `<span class="badge badge-success">EM ESTOQUE 📦</span>`;
    
    const card = createElement('div', {
        className: 'card product-card',
        'data-id': produto.id,
        'data-category': produto.categoria
    }, `
        <div class="card-header">
            ${stockBadge}
        </div>
        <div class="product-image">
            <img src="${produto.imagem || 'assets/images/produtos/default.jpg'}" 
                 alt="${produto.nome || 'Produto'} - HIVERCAR"
                 onerror="this.src='assets/images/produtos/default.jpg'">
        </div>
        <div class="card-body">
            <h3 class="card-title">${sanitizeHTML(produto.nome)}</h3>
            <p class="product-description">${sanitizeHTML(produto.descricao || '')}</p>
            <div class="product-price">
                <span class="price">${formatCurrency(produto.preco)}</span>
                ${produto.preco_original ? `<span class="original-price">${formatCurrency(produto.preco_original)}</span>` : ''}
            </div>
            <div class="product-stock ${isLowStock ? 'stock-low' : ''} ${isOutOfStock ? 'stock-out' : ''}">
                <i class="fas fa-box"></i> Estoque: ${produto.estoque} unidades
            </div>
        </div>
        <div class="card-footer">
            <button class="btn btn-primary btn-block add-to-cart" 
                    ${isOutOfStock ? 'disabled' : ''}
                    data-id="${produto.id}">
                <i class="fas fa-cart-plus"></i>
                ${isOutOfStock ? 'ESGOTADO' : 'ADICIONAR AO CARRINHO'}
            </button>
        </div>
    `);
    
    return card;
}

/**
 * Cria linha de tabela para admin
 * @param {Object} data - Dados da linha
 * @param {Array} headers - Cabeçalhos da tabela
 * @param {string} type - Tipo de dados (vendedor|produto|servico)
 * @returns {HTMLElement} Linha da tabela
 */
function buildTableRow(data, headers, type) {
    const row = createElement('tr', {
        'data-id': data.id
    });
    
    headers.forEach(header => {
        const cell = createElement('td');
        
        if (header.key === 'acoes') {
            cell.innerHTML = `
                <button class="btn btn-small btn-outline edit-btn" data-id="${data.id}">
                    <i class="fas fa-edit"></i>
                </button>
                <button class="btn btn-small btn-secondary delete-btn" data-id="${data.id}">
                    <i class="fas fa-trash"></i>
                </button>
            `;
        } else if (header.key === 'preco' || header.key === 'valor') {
            cell.textContent = formatCurrency(data[header.key]);
        } else if (header.key === 'estoque') {
            const isLow = data.estoque_minimo && data[header.key] <= data.estoque_minimo;
            cell.innerHTML = `
                <span class="${isLow ? 'text-warning' : ''}">
                    ${data[header.key]}
                    ${isLow ? ' ⚠️' : ''}
                </span>
            `;
        } else {
            cell.textContent = data[header.key] || '-';
        }
        
        row.appendChild(cell);
    });
    
    return row;
}

// ===== VALIDAÇÃO DE FORMULÁRIOS =====

/**
 * Valida formulário de contato
 * @param {Object} formData - Dados do formulário
 * @returns {Object} { isValid: boolean, errors: Array }
 */
function validateContactForm(formData) {
    const errors = [];
    
    if (!formData.nome || formData.nome.trim().length < 3) {
        errors.push('Nome deve ter pelo menos 3 caracteres');
    }
    
    if (!formData.produto) {
        errors.push('Selecione um produto de interesse');
    }
    
    if (!formData.veiculo || formData.veiculo.trim().length < 2) {
        errors.push('Informe o modelo do veículo');
    }
    
    return {
        isValid: errors.length === 0,
        errors: errors
    };
}

// ===== WHATSAPP INTEGRATION =====

/**
 * Gera link do WhatsApp com mensagem pré-preenchida
 * @param {Object} data - Dados do contato
 * @returns {string} Link do WhatsApp
 */
function generateWhatsAppLink(data) {
    const phone = '5511999999999'; // Número da HIVERCAR
    const message = `Olá HIVERCAR! 👋\n\nMeu nome é: ${data.nome}\nInteresse em: ${data.produto}\nVeículo: ${data.veiculo}\n\nPodem me ajudar? 🚗`;
    
    const encodedMessage = encodeURIComponent(message);
    return `https://wa.me/${phone}?text=${encodedMessage}`;
}

// ===== CARRINHO HELPERS =====

/**
 * Atualiza contador do carrinho na navbar
 */
function updateCartCount() {
    try {
        const cart = loadFromStorage('cart', []);
        const count = cart.reduce((total, item) => total + item.quantidade, 0);
        
        const cartBadge = document.getElementById('cartCount');
        if (cartBadge) {
            cartBadge.textContent = count;
            if (count > 0) {
                cartBadge.classList.add('added');
                setTimeout(() => cartBadge.classList.remove('added'), 500);
            }
        }
        
        logDev('CART', `🛒 Carrinho atualizado: ${count} itens`);
    } catch (error) {
        console.error('❌ Erro ao atualizar contador do carrinho:', error);
    }
}

/**
 * Adiciona produto ao carrinho com validação
 * @param {Object} produto - Produto a ser adicionado
 * @param {number} quantidade - Quantidade (padrão: 1)
 * @returns {boolean} true se adicionado com sucesso
 */
function addToCart(produto, quantidade = 1) {
    try {
        if (!produto || !produto.id) {
            throw new Error('Produto inválido');
        }
        
        // Valida estoque
        if (produto.estoque < quantidade) {
            alert(`❌ Estoque insuficiente! Disponível: ${produto.estoque} unidades`);
            return false;
        }
        
        // Carrega carrinho atual
        const cart = loadFromStorage('cart', []);
        
        // Verifica se produto já está no carrinho
        const existingIndex = cart.findIndex(item => item.id === produto.id);
        
        if (existingIndex > -1) {
            // Atualiza quantidade
            const newQuantity = cart[existingIndex].quantidade + quantidade;
            
            if (newQuantity > produto.estoque) {
                alert(`❌ Estoque insuficiente! Máximo: ${produto.estoque} unidades`);
                return false;
            }
            
            cart[existingIndex].quantidade = newQuantity;
            cart[existingIndex].subtotal = cart[existingIndex].preco * newQuantity;
        } else {
            // Adiciona novo item
            cart.push({
                id: produto.id,
                nome: produto.nome,
                preco: produto.preco,
                imagem: produto.imagem,
                quantidade: quantidade,
                subtotal: produto.preco * quantidade,
                estoque: produto.estoque,
                categoria: produto.categoria
            });
        }
        
        // Salva carrinho
        saveToStorage('cart', cart);
        
        // Atualiza contador
        updateCartCount();
        
        // Feedback visual
        showNotification('✅ Produto adicionado ao carrinho!', 'success');
        
        logDev('CART', `➕ Produto adicionado: ${produto.nome}`, produto);
        return true;
        
    } catch (error) {
        console.error('❌ Erro ao adicionar ao carrinho:', error);
        showNotification('❌ Erro ao adicionar produto', 'error');
        return false;
    }
}

/**
 * Remove produto do carrinho
 * @param {string} productId - ID do produto
 */
function removeFromCart(productId) {
    try {
        const cart = loadFromStorage('cart', []);
        const newCart = cart.filter(item => item.id !== productId);
        saveToStorage('cart', newCart);
        updateCartCount();
        showNotification('🗑️ Produto removido do carrinho', 'info');
        logDev('CART', `➖ Produto removido: ${productId}`);
    } catch (error) {
        console.error('❌ Erro ao remover do carrinho:', error);
    }
}

/**
 * Atualiza quantidade no carrinho
 * @param {string} productId - ID do produto
 * @param {number} newQuantity - Nova quantidade
 */
function updateCartQuantity(productId, newQuantity) {
    try {
        if (newQuantity < 1) {
            removeFromCart(productId);
            return;
        }
        
        const cart = loadFromStorage('cart', []);
        const itemIndex = cart.findIndex(item => item.id === productId);
        
        if (itemIndex > -1) {
            // Valida estoque máximo
            const produto = cart[itemIndex];
            if (newQuantity > produto.estoque) {
                alert(`❌ Estoque máximo: ${produto.estoque} unidades`);
                return;
            }
            
            cart[itemIndex].quantidade = newQuantity;
            cart[itemIndex].subtotal = cart[itemIndex].preco * newQuantity;
            saveToStorage('cart', cart);
            updateCartCount();
            logDev('CART', `✏️ Quantidade atualizada: ${productId} → ${newQuantity}`);
        }
    } catch (error) {
        console.error('❌ Erro ao atualizar quantidade:', error);
    }
}

// ===== NOTIFICAÇÕES =====

/**
 * Mostra notificação temporária
 * @param {string} message - Mensagem
 * @param {string} type - Tipo (success|error|info|warning)
 */
function showNotification(message, type = 'info') {
    try {
        // Remove notificação anterior se existir
        const existing = document.querySelector('.notification');
        if (existing) existing.remove();
        
        // Cria nova notificação
        const notification = createElement('div', {
            className: `notification notification-${type}`
        }, message);
        
        // Adiciona ao body
        document.body.appendChild(notification);
        
        // Mostra
        setTimeout(() => notification.classList.add('show'), 10);
        
        // Remove após 3 segundos
        setTimeout(() => {
            notification.classList.remove('show');
            setTimeout(() => notification.remove(), 300);
        }, 3000);
        
    } catch (error) {
        console.error('❌ Erro ao mostrar notificação:', error);
    }
}

// ===== COOKIE MANAGEMENT =====

/**
 * Gerencia banner de cookies
 */
function initCookieBanner() {
    try {
        const cookiePrefs = loadFromStorage('cookie_prefs');
        
        // Se já tem preferência salva, não mostra banner
        if (cookiePrefs) {
            return;
        }
        
        // Mostra banner após 1 segundo
        setTimeout(() => {
            const banner = document.getElementById('cookieBanner');
            if (banner) {
                banner.classList.add('show');
            }
        }, 1000);
        
        // Configura botões
        const acceptBtn = document.getElementById('acceptCookies');
        const rejectBtn = document.getElementById('rejectCookies');
        
        if (acceptBtn) {
            acceptBtn.addEventListener('click', () => {
                saveToStorage('cookie_prefs', {
                    accepted: true,
                    date: new Date().toISOString(),
                    essential: true,
                    analytics: true,
                    marketing: false
                });
                document.getElementById('cookieBanner').classList.remove('show');
                showNotification('🍪 Preferências de cookies salvas!', 'success');
            });
        }
        
        if (rejectBtn) {
            rejectBtn.addEventListener('click', () => {
                saveToStorage('cookie_prefs', {
                    accepted: false,
                    date: new Date().toISOString(),
                    essential: true, // Cookies essenciais sempre ativos
                    analytics: false,
                    marketing: false
                });
                document.getElementById('cookieBanner').classList.remove('show');
                showNotification('🍪 Cookies não essenciais desativados', 'info');
            });
        }
        
        logDev('COOKIES', 'Banner de cookies inicializado');
        
    } catch (error) {
        console.error('❌ Erro ao inicializar banner de cookies:', error);
    }
}

// ===== EXPORTAÇÃO DAS FUNÇÕES =====
// Torna funções disponíveis globalmente
window.utils = {
    logDev,
    setDebugMode,
    createElement,
    sanitizeHTML,
    formatCurrency,
    formatNumber,
    calculateTax,
    isValidEmail,
    isValidCPF,
    saveToStorage,
    loadFromStorage,
    removeFromStorage,
    buildProductCard,
    buildTableRow,
    validateContactForm,
    generateWhatsAppLink,
    updateCartCount,
    addToCart,
    removeFromCart,
    updateCartQuantity,
    showNotification,
    initCookieBanner
};

console.log("✅ Utils.js carregado com sucesso! Funções disponíveis em window.utils");