// ===== VARIÁVEIS GLOBAIS =====
let currentSlide = 0;
const slides = document.querySelectorAll('.carousel-slide');
const totalSlides = slides.length;
let carouselInterval;

// ===== INICIALIZAÇÃO =====
document.addEventListener('DOMContentLoaded', function() {
    try {
        console.log("🏁 DOM carregado - Iniciando configurações...");
        
        // Inicializa componentes
        initCarousel();
        // initNavbar();
        // loadFeaturedProducts();
        initContactForm();
        initCookieBanner();
        updateCartCount();
        
        // Configura debug mode
        if (window.utils) {
            window.utils.setDebugMode(false); // Desativa debug por padrão
        }
        
        console.log("✅ Página principal inicializada com sucesso!");
        
    } catch (error) {
        console.error("❌ Erro na inicialização da página:", error);
    }
});

// ===== CAROUSEL AUTOMÁTICO =====
function initCarousel() {
    try {
        console.log("🎪 Inicializando carousel...");
        
        const prevBtn = document.querySelector('.carousel-prev');
        const nextBtn = document.querySelector('.carousel-next');
        const indicators = document.querySelectorAll('.indicator');
        
        // Configura botões
        if (prevBtn) {
            prevBtn.addEventListener('click', () => changeSlide(-1));
        }
        
        if (nextBtn) {
            nextBtn.addEventListener('click', () => changeSlide(1));
        }
        
        // Configura indicadores
        indicators.forEach((indicator, index) => {
            indicator.addEventListener('click', () => goToSlide(index));
        });
        
        // Inicia intervalo automático
        startCarouselInterval();
        
        // Pausa carousel quando mouse está sobre ele
        const carouselContainer = document.querySelector('.carousel-container');
        if (carouselContainer) {
            carouselContainer.addEventListener('mouseenter', pauseCarousel);
            carouselContainer.addEventListener('mouseleave', startCarouselInterval);
        }
        
        console.log("✅ Carousel inicializado!");
        
    } catch (error) {
        console.error("❌ Erro ao inicializar carousel:", error);
    }
}

function changeSlide(direction) {
    try {
        // Remove classe active do slide atual
        slides[currentSlide].classList.remove('active');
        
        // Atualiza slide atual
        currentSlide = (currentSlide + direction + totalSlides) % totalSlides;
        
        // Adiciona classe active ao novo slide
        slides[currentSlide].classList.add('active');
        
        // Atualiza indicadores
        updateIndicators();
        
        // Reinicia intervalo
        restartCarouselInterval();
        
        console.log(`🔄 Slide alterado para: ${currentSlide}`);
        
    } catch (error) {
        console.error("❌ Erro ao alterar slide:", error);
    }
}

function goToSlide(slideIndex) {
    try {
        if (slideIndex >= 0 && slideIndex < totalSlides) {
            slides[currentSlide].classList.remove('active');
            currentSlide = slideIndex;
            slides[currentSlide].classList.add('active');
            updateIndicators();
            restartCarouselInterval();
        }
    } catch (error) {
        console.error("❌ Erro ao ir para slide:", error);
    }
}

function updateIndicators() {
    try {
        const indicators = document.querySelectorAll('.indicator');
        indicators.forEach((indicator, index) => {
            if (index === currentSlide) {
                indicator.classList.add('active');
            } else {
                indicator.classList.remove('active');
            }
        });
    } catch (error) {
        console.error("❌ Erro ao atualizar indicadores:", error);
    }
}

function startCarouselInterval() {
    try {
        // Limpa intervalo existente
        if (carouselInterval) {
            clearInterval(carouselInterval);
        }
        
        // Inicia novo intervalo (muda a cada 5 segundos)
        carouselInterval = setInterval(() => {
            changeSlide(1);
        }, 5000);
        
    } catch (error) {
        console.error("❌ Erro ao iniciar intervalo do carousel:", error);
    }
}

function pauseCarousel() {
    try {
        if (carouselInterval) {
            clearInterval(carouselInterval);
            carouselInterval = null;
        }
    } catch (error) {
        console.error("❌ Erro ao pausar carousel:", error);
    }
}

function restartCarouselInterval() {
    pauseCarousel();
    startCarouselInterval();
}

// ===== FORMULÁRIO DE CONTATO/WHATSAPP =====
function initContactForm() {
    try {
        const whatsappButton = document.getElementById('whatsappButton');
        
        if (!whatsappButton) {
            console.warn("⚠️ Botão do WhatsApp não encontrado");
            return;
        }
        
        whatsappButton.addEventListener('click', handleWhatsAppRedirect);
        
        // Preenche número do WhatsApp
        const whatsappNumber = document.getElementById('whatsappNumber');
        if (whatsappNumber && window.data) {
            const empresaInfo = window.data.getEmpresaInfo();
            whatsappNumber.textContent = empresaInfo.whatsapp || '+55 (11) 99999-9999';
        }
        
        console.log("✅ Formulário de contato inicializado!");
        
    } catch (error) {
        console.error("❌ Erro ao inicializar formulário de contato:", error);
    }
}

function handleWhatsAppRedirect() {
    try {
        // Coleta dados do formulário
        const nome = document.getElementById('contatoNome').value.trim();
        const produto = document.getElementById('contatoProduto').value;
        const veiculo = document.getElementById('contatoVeiculo').value.trim();
        
        // Validação básica
        if (!nome || nome.length < 3) {
            alert("❌ Por favor, informe seu nome completo");
            document.getElementById('contatoNome').focus();
            return;
        }
        
        if (!produto) {
            alert("❌ Por favor, selecione um produto de interesse");
            document.getElementById('contatoProduto').focus();
            return;
        }
        
        if (!veiculo || veiculo.length < 2) {
            alert("❌ Por favor, informe o modelo do veículo");
            document.getElementById('contatoVeiculo').focus();
            return;
        }
        
        // Prepara dados
        const contactData = {
            nome: nome,
            produto: produto,
            veiculo: veiculo,
            data: new Date().toLocaleString('pt-BR')
        };
        
        // Salva lead no localStorage (para analytics)
        try {
            const leads = JSON.parse(localStorage.getItem('hivercar_leads')) || [];
            leads.push(contactData);
            localStorage.setItem('hivercar_leads', JSON.stringify(leads));
            console.log("📝 Lead salvo:", contactData);
        } catch (storageError) {
            console.warn("⚠️ Não foi possível salvar o lead:", storageError);
        }
        
        // Gera link do WhatsApp
        let whatsappLink;
        
        if (window.utils) {
            whatsappLink = window.utils.generateWhatsAppLink(contactData);
        } else {
            // Fallback
            const phone = '5511999999999';
            const message = `Olá HIVERCAR! 👋\n\nMeu nome é: ${nome}\nInteresse em: ${produto}\nVeículo: ${veiculo}\n\nPodem me ajudar? 🚗`;
            whatsappLink = `https://wa.me/${phone}?text=${encodeURIComponent(message)}`;
        }
        
        // Redireciona para WhatsApp
        console.log("📤 Redirecionando para WhatsApp...");
        window.open(whatsappLink, '_blank');
        
        // Feedback visual
        if (window.utils) {
            window.utils.showNotification('✅ Redirecionando para WhatsApp...', 'success');
        } else {
            alert('✅ Redirecionando para WhatsApp...');
        }
        
        // Limpa formulário (opcional)
        setTimeout(() => {
            document.getElementById('contatoNome').value = '';
            document.getElementById('contatoProduto').selectedIndex = 0;
            document.getElementById('contatoVeiculo').value = '';
        }, 1000);
        
    } catch (error) {
        console.error("❌ Erro ao processar formulário de contato:", error);
        alert("❌ Ocorreu um erro. Por favor, tente novamente.");
    }
}


// ===== FUNÇÕES DE DEBUG =====
function toggleDebugMode() {
    try {
        if (window.utils) {
            const currentMode = localStorage.getItem('hivercar_debug') === 'true';
            window.utils.setDebugMode(!currentMode);
            
            const newMode = !currentMode;
            alert(`🐛 Modo debug ${newMode ? 'ATIVADO' : 'DESATIVADO'}\n\nRecarregue a página para aplicar.`);
        } else {
            alert("⚠️ Utils.js não carregado. Debug não disponível.");
        }
    } catch (error) {
        console.error("❌ Erro ao alternar modo debug:", error);
    }
}

// ===== EXPORTAÇÃO PARA DEBUG =====
// Torna funções disponíveis no console para testes
window.indexPage = {
    initCarousel,
    changeSlide,
    // ===== loadFeaturedProducts,
    // ==== handleAddToCart,
    handleWhatsAppRedirect,
    toggleDebugMode
};

console.log("✅ index.js carregado com sucesso! Funções disponíveis em window.indexPage");