        // Event delegation para controles dos itens
        document.addEventListener('click', function(e) {
            // Botões de quantidade
            if (e.target.closest('.quantidade-btn')) {
                const btn = e.target.closest('.quantidade-btn');
                const itemElement = btn.closest('.item-carrinho');
                const itemId = itemElement?.dataset.id;
                
                if (itemId) {
                    if (btn.classList.contains('increase')) {
                        alterarQuantidade(itemId, 1);
                    } else if (btn.classList.contains('decrease')) {
                        alterarQuantidade(itemId, -1);
                    }
                }
            }
            
            // Botão remover item
            if (e.target.closest('.item-remover')) {
                const btn = e.target.closest('.item-remover');
                const itemElement = btn.closest('.item-carrinho');
                const itemId = itemElement?.dataset.id;
                
                if (itemId) {
                    removerItem(itemId);
                }
            }
        });
        
        console.log("✅ Event listeners inicializados!");
        
    } catch (error) {
        console.error("❌ Erro ao inicializar event listeners:", error);
    }
}

function inicializarFrete() {
    try {
        const freteSelect = document.getElementById('freteSelect');
        const calcularBtn = document.getElementById('calcularFrete');
        
        if (freteSelect) {
            freteSelect.addEventListener('change', function() {
                frete = parseFloat(this.value) || 0;
                atualizarResumo();
            });
        }
        
        if (calcularBtn) {
            calcularBtn.addEventListener('click', function() {
                // Simula cálculo de frete baseado no subtotal
                const subtotal = calcularSubtotal();
                
                if (subtotal >= 300) {
                    frete = 0;
                    if (freteSelect) {
                        freteSelect.value = '0';
                        freteSelect.innerHTML = `
                            <option value="0" selected>Frete grátis (acima de R$ 300)</option>
                            <option value="15">Sedex: R$ 15,00 (3-5 dias)</option>
                            <option value="25">Expresso: R$ 25,00 (1-2 dias)</option>
                            <option value="0">Retirar na loja: Grátis</option>
                        `;
                    }
                    mostrarMensagemFrete('🎉 Parabéns! Você ganhou frete grátis!', 'success');
                } else {
                    if (freteSelect) {
                        freteSelect.value = '15';
                    }
                    frete = 15;
                    mostrarMensagemFrete(`Adicione mais R$ ${(300 - subtotal).toFixed(2)} para ganhar frete grátis! 🚚`, 'info');
                }
                
                atualizarResumo();
            });
        }
        
        // Calcula frete inicial
        if (calcularBtn) {
            calcularBtn.click();
        }
        
        console.log("✅ Sistema de frete inicializado!");
        
    } catch (error) {
        console.error("❌ Erro ao inicializar frete:", error);
    }
}

function inicializarCupom() {
    try {
        const cupomInput = document.getElementById('cupomInput');
        const aplicarBtn = document.getElementById('aplicarCupom');
        
        if (aplicarBtn) {
            aplicarBtn.addEventListener('click', aplicarCupom);
        }
        
        if (cupomInput) {
            cupomInput.addEventListener('keypress', function(e) {
                if (e.key === 'Enter') {
                    aplicarCupom();
                }
            });
        }
        
        console.log("✅ Sistema de cupom inicializado!");
        
    } catch (error) {
        console.error("❌ Erro ao inicializar cupom:", error);
    }
}

// ===== GESTÃO DO CARRINHO =====
function alterarQuantidade(itemId, alteracao) {
    try {
        console.log(`✏️ Alterando quantidade do item ${itemId}: ${alteracao}`);
        
        const itemIndex = carrinho.findIndex(item => item.id === itemId);
        
        if (itemIndex === -1) {
            console.error("❌ Item não encontrado no carrinho");
            return;
        }
        
        const item = carrinho[itemIndex];
        const novaQuantidade = item.quantidade + alteracao;
        
        // Valida quantidade mínima
        if (novaQuantidade < 1) {
            removerItem(itemId);
            return;
        }
        
        // Valida estoque
        const produto = window.data ? window.data.getProdutoById(itemId) : null;
        if (produto && novaQuantidade > produto.estoque) {
            if (window.utils) {
                window.utils.showNotification(`❌ Estoque máximo: ${produto.estoque} unidades`, 'error');
            } else {
                alert(`❌ Estoque máximo: ${produto.estoque} unidades`);
            }
            return;
        }
        
        // Atualiza quantidade
        item.quantidade = novaQuantidade;
        item.subtotal = item.preco * novaQuantidade;
        
        // Salva carrinho
        salvarCarrinho();
        
        // Atualiza interface
        atualizarItem(itemId);
        atualizarResumo();
        
        // Feedback visual
        const itemElement = document.querySelector(`.item-carrinho[data-id="${itemId}"]`);
        if (itemElement) {
            const quantidadeBtn = alteracao > 0 ? 
                itemElement.querySelector('.increase') : 
                itemElement.querySelector('.decrease');
            
            if (quantidadeBtn) {
                quantidadeBtn.classList.add(alteracao > 0 ? 'increasing' : 'decreasing');
                setTimeout(() => {
                    quantidadeBtn.classList.remove('increasing', 'decreasing');
                }, 300);
            }
            
            itemElement.classList.add('highlight');
            setTimeout(() => {
                itemElement.classList.remove('highlight');
            }, 1000);
        }
        
        console.log(`✅ Quantidade alterada: ${item.nome} → ${novaQuantidade}`);
        
    } catch (error) {
        console.error("❌ Erro ao alterar quantidade:", error);
        if (window.utils) {
            window.utils.showNotification('❌ Erro ao alterar quantidade', 'error');
        }
    }
}

function removerItem(itemId) {
    try {
        console.log(`🗑️ Removendo item ${itemId} do carrinho`);
        
        const itemIndex = carrinho.findIndex(item => item.id === itemId);
        
        if (itemIndex === -1) {
            console.error("❌ Item não encontrado no carrinho");
            return;
        }
        
        const item = carrinho[itemIndex];
        
        // Animação de remoção
        const itemElement = document.querySelector(`.item-carrinho[data-id="${itemId}"]`);
        if (itemElement) {
            itemElement.classList.add('removing');
            
            setTimeout(() => {
                // Remove do carrinho
                carrinho.splice(itemIndex, 1);
                
                // Salva carrinho
                salvarCarrinho();
                
                // Atualiza interface
                atualizarInterface();
                
                // Feedback
                if (window.utils) {
                    window.utils.showNotification(`🗑️ ${item.nome} removido do carrinho`, 'info');
                }
                
                console.log(`✅ Item removido: ${item.nome}`);
            }, 300);
        }
        
    } catch (error) {
        console.error("❌ Erro ao remover item:", error);
        if (window.utils) {
            window.utils.showNotification('❌ Erro ao remover item', 'error');
        }
    }
}

function limparCarrinho() {
    try {
        if (carrinho.length === 0) {
            if (window.utils) {
                window.utils.showNotification('🛒 Carrinho já está vazio', 'info');
            }
            return;
        }
        
        if (!confirm('⚠️ Tem certeza que deseja limpar todo o carrinho?')) {
            return;
        }
        
        console.log("🧹 Limpando carrinho...");
        
        // Animação de remoção de todos os itens
        const itens = document.querySelectorAll('.item-carrinho');
        itens.forEach((item, index) => {
            setTimeout(() => {
                item.classList.add('removing');
            }, index * 100);
        });
        
        setTimeout(() => {
            // Limpa carrinho
            carrinho = [];
            
            // Salva carrinho vazio
            salvarCarrinho();
            
            // Atualiza interface
            atualizarInterface();
            
            // Feedback
            if (window.utils) {
                window.utils.showNotification('🧹 Carrinho limpo com sucesso!', 'success');
            }
            
            console.log("✅ Carrinho limpo!");
        }, itens.length * 100);
        
    } catch (error) {
        console.error("❌ Erro ao limpar carrinho:", error);
        if (window.utils) {
            window.utils.showNotification('❌ Erro ao limpar carrinho', 'error');
        }
    }
}

// ===== CÁLCULOS =====
function calcularSubtotal() {
    return carrinho.reduce((total, item) => total + item.subtotal, 0);
}

function calcularImpostos(subtotal) {
    // CBS de 12% para produtos
    return subtotal * 0.12;
}

function calcularDescontoCupom(subtotal) {
    if (!cupomAtivo) return 0;
    
    const cupom = CUPONS_VALIDOS[cupomAtivo];
    
    switch (cupom.tipo) {
        case 'percentual':
            return subtotal * cupom.desconto;
        case 'fixo':
            return Math.min(cupom.desconto, subtotal); // Não pode dar desconto maior que o subtotal
        case 'frete_gratis':
            return 0; // O desconto é aplicado no frete
        default:
            return 0;
    }
}

function calcularTotal() {
    const subtotal = calcularSubtotal();
    const impostos = calcularImpostos(subtotal);
    const desconto = calcularDescontoCupom(subtotal);
    
    // Aplica desconto de frete se cupom for frete_gratis
    let freteFinal = frete;
    if (cupomAtivo && CUPONS_VALIDOS[cupomAtivo].tipo === 'frete_gratis') {
        freteFinal = 0;
    }
    
    return subtotal + impostos + freteFinal - desconto;
}

// ===== ATUALIZAÇÃO DA INTERFACE =====
function atualizarInterface() {
    try {
        console.log("🔄 Atualizando interface do carrinho...");
        
        // Atualiza contador na navbar
        if (window.utils) {
            window.utils.updateCartCount();
        } else {
            atualizarContadorCarrinhoFallback();
        }
        
        // Atualiza lista de itens
        atualizarListaItens();
        
        // Atualiza resumo
        atualizarResumo();
        
        // Atualiza produtos recomendados
        atualizarRecomendados();
        
        console.log("✅ Interface atualizada!");
        
    } catch (error) {
        console.error("❌ Erro ao atualizar interface:", error);
    }
}

function atualizarListaItens() {
    try {
        const listaContainer = document.getElementById('itensLista');
        const vazioContainer = document.getElementById('carrinhoVazio');
        const actionsContainer = document.getElementById('carrinhoActions');
        const itemCount = document.getElementById('itemCount');
        
        if (!listaContainer || !vazioContainer || !actionsContainer || !itemCount) return;
        
        // Atualiza contador de itens
        const totalItens = carrinho.reduce((total, item) => total + item.quantidade, 0);
        itemCount.textContent = `${totalItens} item${totalItens !== 1 ? 's' : ''}`;
        
        // Mostra/oculta seções baseado no carrinho
        if (carrinho.length === 0) {
            vazioContainer.style.display = 'block';
            listaContainer.style.display = 'none';
            actionsContainer.style.display = 'none';
            return;
        } else {
            vazioContainer.style.display = 'none';
            listaContainer.style.display = 'block';
            actionsContainer.style.display = 'block';
        }
        
        // Limpa lista
        listaContainer.innerHTML = '';
        
        // Adiciona cada item
        carrinho.forEach(item => {
            const itemElement = criarElementoItem(item);
            listaContainer.appendChild(itemElement);
        });
        
    } catch (error) {
        console.error("❌ Erro ao atualizar lista de itens:", error);
    }
}

function criarElementoItem(item) {
    const produto = window.data ? window.data.getProdutoById(item.id) : null;
    const categoria = produto && window.data ? window.data.getCategoriaById(produto.categoria) : null;
    
    const isLowStock = produto && produto.estoque < 5;
    const isOutOfStock = produto && produto.estoque === 0;
    
    const itemElement = document.createElement('div');
    itemElement.className = `item-carrinho ${isOutOfStock ? 'sem-estoque' : ''}`;
    itemElement.dataset.id = item.id;
    
    itemElement.innerHTML = `
        <div class="item-imagem">
            <img src="${item.imagem || 'assets/images/produtos/default.jpg'}" 
                 alt="${item.nome}"
                 onerror="this.src='assets/images/produtos/default.jpg'">
        </div>
        
        <div class="item-info">
            <div class="item-header">
                <h3 class="item-nome">${item.nome}</h3>
                <div class="item-codigo">Código: ${item.id}</div>
            </div>
            
            <div class="item-detalhes">
                ${categoria ? `<span class="item-categoria">${categoria.nome}</span>` : ''}
                <span class="item-estoque ${isLowStock ? 'baixo' : ''}">
                    <i class="fas fa-box"></i>
                    ${isOutOfStock ? 'ESGOTADO' : `Estoque: ${produto?.estoque || 'N/A'} unidades`}
                </span>
            </div>
        </div>
        
        <div class="item-controles">
            <div class="item-preco">
                <div class="preco-unitario">
                    ${window.utils ? window.utils.formatCurrency(item.preco) : `R$ ${item.preco.toFixed(2)}`} cada
                </div>
                <div class="preco-total">
                    ${window.utils ? window.utils.formatCurrency(item.subtotal) : `R$ ${item.subtotal.toFixed(2)}`}
                </div>
            </div>
            
            <div class="item-quantidade">
                <button class="quantidade-btn decrease" ${item.quantidade <= 1 ? 'disabled' : ''}>
                    <i class="fas fa-minus"></i>
                </button>
                <span class="quantidade-value">${item.quantidade}</span>
                <button class="quantidade-btn increase" ${isOutOfStock ? 'disabled' : ''}>
                    <i class="fas fa-plus"></i>
                </button>
            </div>
            
            <button class="item-remover" title="Remover item">
                <i class="fas fa-trash"></i> Remover
            </button>
        </div>
    `;
    
    return itemElement;
}

function atualizarItem(itemId) {
    try {
        const item = carrinho.find(item => item.id === itemId);
        if (!item) return;
        
        const itemElement = document.querySelector(`.item-carrinho[data-id="${itemId}"]`);
        if (!itemElement) return;
        
        // Atualiza quantidade
        const quantidadeValue = itemElement.querySelector('.quantidade-value');
        if (quantidadeValue) {
            quantidadeValue.textContent = item.quantidade;
        }
        
        // Atualiza botões de quantidade
        const decreaseBtn = itemElement.querySelector('.decrease');
        if (decreaseBtn) {
            decreaseBtn.disabled = item.quantidade <= 1;
        }
        
        // Atualiza preço total
        const precoTotal = itemElement.querySelector('.preco-total');
        if (precoTotal) {
            precoTotal.textContent = window.utils ? 
                window.utils.formatCurrency(item.subtotal) : 
                `R$ ${item.subtotal.toFixed(2)}`;
        }
        
    } catch (error) {
        console.error("❌ Erro ao atualizar item:", error);
    }
}

function atualizarResumo() {
    try {
        const subtotalElement = document.getElementById('subtotal');
        const impostosElement = document.getElementById('impostos');
        const descontosElement = document.getElementById('descontos');
        const totalElement = document.getElementById('total');
        const finalizarBtn = document.getElementById('finalizarCompra');
        
        if (!subtotalElement || !impostosElement || !descontosElement || !totalElement || !finalizarBtn) return;
        
        const subtotal = calcularSubtotal();
        const impostos = calcularImpostos(subtotal);
        const desconto = calcularDescontoCupom(subtotal);
        const total = calcularTotal();
        
        // Atualiza valores
        subtotalElement.textContent = window.utils ? 
            window.utils.formatCurrency(subtotal) : 
            `R$ ${subtotal.toFixed(2)}`;
        
        impostosElement.textContent = window.utils ? 
            window.utils.formatCurrency(impostos) : 
            `R$ ${impostos.toFixed(2)}`;
        
        descontosElement.textContent = window.utils ? 
            `- ${window.utils.formatCurrency(desconto)}` : 
            `- R$ ${desconto.toFixed(2)}`;
        
        totalElement.textContent = window.utils ? 
            window.utils.formatCurrency(total) : 
            `R$ ${total.toFixed(2)}`;
        
        // Habilita/desabilita botão finalizar
        finalizarBtn.disabled = carrinho.length === 0 || total <= 0;
        
        console.log("💰 Resumo atualizado:", { subtotal, impostos, desconto, total });
        
    } catch (error) {
        console.error("❌ Erro ao atualizar resumo:", error);
    }
}

function atualizarRecomendados() {
    try {
        const recomendadosSection = document.getElementById('recomendadosSection');
        const recomendadosGrid = document.getElementById('recomendadosGrid');
        
        if (!recomendadosSection || !recomendadosGrid || carrinho.length === 0) {
            if (recomendadosSection) {
                recomendadosSection.style.display = 'none';
            }
            return;
        }
        
        // Mostra seção
        recomendadosSection.style.display = 'block';
        
        // Obtém categorias dos produtos no carrinho
        const categoriasNoCarrinho = [...new Set(carrinho.map(item => item.categoria))];
        
        // Obtém produtos recomendados (da mesma categoria, mas não no carrinho)
        let produtosRecomendados = [];
        
        if (window.data) {
            const todosProdutos = window.data.getProdutos();
            
            produtosRecomendados = todosProdutos
                .filter(produto => 
                    categoriasNoCarrinho.includes(produto.categoria) &&
                    !carrinho.some(item => item.id === produto.id) &&
                    produto.estoque > 0
                )
                .sort((a, b) => b.estoque - a.estoque) // Prioriza produtos com mais estoque
                .slice(0, 4); // Limita a 4 produtos
        }
        
        // Limpa grid
        recomendadosGrid.innerHTML = '';
        
        // Adiciona produtos recomendados
        if (produtosRecomendados.length > 0) {
            produtosRecomendados.forEach(produto => {
                const productCard = window.utils ? 
                    window.utils.buildProductCard(produto) : 
                    criarCardProdutoFallback(produto);
                
                const col = document.createElement('div');
                col.className = 'col';
                col.appendChild(productCard);
                recomendadosGrid.appendChild(col);
            });
            
            // Adiciona event listeners aos botões "Adicionar ao Carrinho"
            setTimeout(() => {
                const addToCartButtons = recomendadosGrid.querySelectorAll('.add-to-cart');
                addToCartButtons.forEach(button => {
                    button.addEventListener('click', function() {
                        const productId = this.getAttribute('data-id');
                        const produto = window.data ? window.data.getProdutoById(productId) : null;
                        
                        if (produto && window.utils) {
                            const success = window.utils.addToCart(produto, 1);
                            if (success) {
                                // Feedback visual
                                this.innerHTML = '<i class="fas fa-check"></i> ADICIONADO!';
                                this.classList.add('btn-success');
                                this.classList.remove('btn-primary');
                                this.disabled = true;
                                
                                setTimeout(() => {
                                    this.innerHTML = '<i class="fas fa-cart-plus"></i> ADICIONAR AO CARRINHO';
                                    this.classList.remove('btn-success');
                                    this.classList.add('btn-primary');
                                    this.disabled = false;
                                }, 2000);
                            }
                        }
                    });
                });
            }, 100);
        } else {
            recomendadosGrid.innerHTML = `
                <div class="col" style="grid-column: 1 / -1; text-align: center; padding: 2rem;">
                    <p>Nenhuma recomendação no momento</p>
                </div>
            `;
        }
        
    } catch (error) {
        console.error("❌ Erro ao atualizar recomendados:", error);
    }
}

// ===== CUPOM =====
function aplicarCupom() {
    try {
        const cupomInput = document.getElementById('cupomInput');
        const cupomMessage = document.getElementById('cupomMessage');
        
        if (!cupomInput || !cupomMessage) return;
        
        const codigo = cupomInput.value.trim().toUpperCase();
        
        // Limpa mensagem anterior
        cupomMessage.textContent = '';
        cupomMessage.className = 'cupom-message';
        
        if (!codigo) {
            cupomMessage.textContent = 'Digite um código de cupom';
            cupomMessage.classList.add('error');
            return;
        }
        
        // Verifica se cupom é válido
        if (!CUPONS_VALIDOS[codigo]) {
            cupomMessage.textContent = 'Cupom inválido ou expirado';
            cupomMessage.classList.add('error');
            return;
        }
        
        // Verifica se já tem cupom ativo
        if (cupomAtivo) {
            if (cupomAtivo === codigo) {
                cupomMessage.textContent = 'Este cupom já está ativo';
                cupomMessage.classList.add('error');
                return;
            }
            
            if (!confirm('Já existe um cupom ativo. Deseja substituí-lo?')) {
                return;
            }
        }
        
        // Aplica cupom
        cupomAtivo = codigo;
        const cupom = CUPONS_VALIDOS[codigo];
        
        // Feedback
        cupomMessage.textContent = `🎉 Cupom aplicado: ${cupom.descricao}`;
        cupomMessage.classList.add('success');
        
        // Limpa input
        cupomInput.value = '';
        
        // Atualiza resumo
        atualizarResumo();
        
        console.log(`✅ Cupom aplicado: ${codigo} - ${cupom.descricao}`);
        
    } catch (error) {
        console.error("❌ Erro ao aplicar cupom:", error);
        const cupomMessage = document.getElementById('cupomMessage');
        if (cupomMessage) {
            cupomMessage.textContent = 'Erro ao aplicar cupom';
            cupomMessage.classList.add('error');
        }
    }
}

// ===== FINALIZAÇÃO DA COMPRA =====
function finalizarCompra() {
    try {
        if (carrinho.length === 0) {
            if (window.utils) {
                window.utils.showNotification('🛒 Carrinho vazio', 'error');
            }
            return;
        }
        
        console.log("🚀 Iniciando finalização da compra...");
        
        // Valida estoque novamente
        let estoqueInsuficiente = false;
        const produtosSemEstoque = [];
        
        carrinho.forEach(item => {
            const produto = window.data ? window.data.getProdutoById(item.id) : null;
            if (produto && item.quantidade > produto.estoque) {
                estoqueInsuficiente = true;
                produtosSemEstoque.push(produto.nome);
            }
        });
        
        if (estoqueInsuficiente) {
            const mensagem = `Estoque insuficiente para: ${produtosSemEstoque.join(', ')}`;
            if (window.utils) {
                window.utils.showNotification(`❌ ${mensagem}`, 'error');
            } else {
                alert(`❌ ${mensagem}`);
            }
            return;
        }
        
        // Mostra loading
        mostrarLoading();
        
        // Simula processamento
        setTimeout(() => {
            // Cria pedido
            const pedido = {
                id: `PED${Date.now()}`,
                data: new Date().toISOString(),
                itens: [...carrinho],
                subtotal: calcularSubtotal(),
                impostos: calcularImpostos(calcularSubtotal()),
                frete: frete,
                desconto: calcularDescontoCupom(calcularSubtotal()),
                total: calcularTotal(),
                cupom: cupomAtivo,
                status: 'pendente'
            };
            
            // Salva pedido no histórico
            salvarPedido(pedido);
            
            // Limpa carrinho
            carrinho = [];
            cupomAtivo = null;
            frete = 0;
            
            // Salva carrinho vazio
            salvarCarrinho();
            
            // Esconde loading
            esconderLoading();
            
            // Redireciona para checkout
            window.location.href = 'checkout.html?pedido=' + pedido.id;
            
            console.log("✅ Compra finalizada, redirecionando para checkout...");
            
        }, 1500);
        
    } catch (error) {
        console.error("❌ Erro ao finalizar compra:", error);
        esconderLoading();
        
        if (window.utils) {
            window.utils.showNotification('❌ Erro ao finalizar compra', 'error');
        }
    }
}

function salvarPedido(pedido) {
    try {
        // Salva pedido no localStorage (simulação)
        const pedidos = JSON.parse(localStorage.getItem('hivercar_pedidos')) || [];
        pedidos.push(pedido);
        localStorage.setItem('hivercar_pedidos', JSON.stringify(pedidos));
        
        console.log("📦 Pedido salvo:", pedido.id);
        
    } catch (error) {
        console.error("❌ Erro ao salvar pedido:", error);
    }
}

// ===== FUNÇÕES AUXILIARES =====
function mostrarMensagemFrete(mensagem, tipo = 'info') {
    try {
        // Cria elemento de mensagem
        let mensagemElement = document.querySelector('.frete-message');
        
        if (!mensagemElement) {
            mensagemElement = document.createElement('div');
            mensagemElement.className = 'frete-message';
            const freteItem = document.querySelector('.resumo-item:nth-child(3)');
            if (freteItem) {
                freteItem.appendChild(mensagemElement);
            }
        }
        
        mensagemElement.textContent = mensagem;
        mensagemElement.className = `frete-message ${tipo}`;
        mensagemElement.style.display = 'block';
        
        // Remove após 5 segundos
        setTimeout(() => {
            mensagemElement.style.display = 'none';
        }, 5000);
        
    } catch (error) {
        console.error("❌ Erro ao mostrar mensagem de frete:", error);
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
                <p>Processando sua compra...</p>
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
        const main = document.querySelector('.carrinho-main');
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

function criarCardProdutoFallback(produto) {
    // Fallback para card de produto
    const card = document.createElement('div');
    card.className = 'card';
    card.innerHTML = `
        <div class="product-image">
            <img src="${produto.imagem || 'assets/images/produtos/default.jpg'}" 
                 alt="${produto.nome}">
        </div>
        <div class="card-body">
            <h3 class="card-title">${produto.nome}</h3>
            <div class="product-price">
                <span class="price">R$ ${produto.preco.toFixed(2)}</span>
            </div>
        </div>
        <div class="card-footer">
            <button class="btn btn-primary btn-block add-to-cart" data-id="${produto.id}">
                <i class="fas fa-cart-plus"></i> ADICIONAR
            </button>
        </div>
    `;
    return card;
}

function atualizarContadorCarrinhoFallback() {
    try {
        const totalItems = carrinho.reduce((sum, item) => sum + item.quantidade, 0);
        
        const cartBadge = document.getElementById('cartCount');
        if (cartBadge) {
            cartBadge.textContent = totalItems;
        }
    } catch (error) {
        console.error("❌ Erro no fallback do contador:", error);
    }
}

// ===== EXPORTAÇÃO PARA DEBUG =====
window.carrinhoPage = {
    carregarCarrinho,
    salvarCarrinho,
    alterarQuantidade,
    removerItem,
    limparCarrinho,
    aplicarCupom,
    finalizarCompra,
    getCarrinho: () => carrinho,
    getCupomAtivo: () => cupomAtivo,
    getFrete: () => frete,
    calcularTotal
};

console.log("✅ carrinho.js carregado com sucesso! Funções disponíveis em window.carrinhoPage");