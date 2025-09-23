/**
 * Mobile Menu JavaScript
 */

class MobileMenuController {
    constructor() {
        this.menuBtn = null;
        this.navMenu = null;
        this.navOverlay = null;
        this.navClose = null;
        this.navLinks = null;
        
        this.init();
    }
    
    init() {
        // Aguarda o DOM estar pronto
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', () => this.setupMenu());
        } else {
            this.setupMenu();
        }
    }
    
    setupMenu() {
        try {
            // Seleciona elementos do menu
            this.menuBtn = document.getElementById('mobileMenuBtn');
            this.navMenu = document.getElementById('navMenu');
            this.navOverlay = document.getElementById('navOverlay');
            this.navClose = document.getElementById('navClose');
            this.navLinks = document.querySelectorAll('.nav-link');
            
            if (!this.menuBtn || !this.navMenu) {
                console.warn('Mobile menu elements not found');
                return;
            }
            
            this.bindEvents();
            console.log('Mobile menu initialized successfully');
            
        } catch (error) {
            log.error({
                message: error.message,
                stack: error.stack,
                component: 'mobile-menu-init'
            });
        }
    }
    
    addTouchAndClickEvent(element, callback) {
        let touchStarted = false;
        
        // Touch events para dispositivos móveis
        element.addEventListener('touchstart', (e) => {
            touchStarted = true;
            callback(e);
        }, { passive: false });
        
        // Click event como fallback para desktop
        element.addEventListener('click', (e) => {
            // Evita duplo disparo em dispositivos que suportam tanto touch quanto click
            if (!touchStarted) {
                callback(e);
            }
            touchStarted = false;
        });
        
        // Reset do flag após um tempo
        element.addEventListener('touchend', () => {
            setTimeout(() => {
                touchStarted = false;
            }, 300);
        });
    }

    bindEvents() {
        // Evento para abrir o menu (suporte a touch e click)
        this.addTouchAndClickEvent(this.menuBtn, (e) => {
            e.preventDefault();
            e.stopPropagation();
            this.toggleMenu();
        });
        
        // Evento para fechar o menu (botão X)
        if (this.navClose) {
            this.addTouchAndClickEvent(this.navClose, (e) => {
                e.preventDefault();
                e.stopPropagation();
                this.closeMenu();
            });
        }
        
        // Evento para fechar o menu (clique no overlay)
        if (this.navOverlay) {
            this.addTouchAndClickEvent(this.navOverlay, (e) => {
                e.preventDefault();
                this.closeMenu();
            });
        }
        
        // Evento para fechar o menu ao clicar em links
        this.navLinks.forEach(link => {
            this.addTouchAndClickEvent(link, () => {
                // Pequeno delay para permitir a navegação
                setTimeout(() => {
                    this.closeMenu();
                }, 100);
            });
        });
        
        // Evento para fechar com ESC
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && this.isMenuOpen) {
                this.closeMenu();
            }
        });
        
        // Evento para fechar ao redimensionar a tela
        window.addEventListener('resize', () => {
            if (window.innerWidth >= 768 && this.isMenuOpen) {
                this.closeMenu();
            }
        });
        
        // Previne scroll do body quando menu está aberto
        this.navMenu.addEventListener('touchmove', (e) => {
            if (this.isMenuOpen) {
                e.preventDefault();
            }
        }, { passive: false });
    }
    
    toggleMenu() {
        if (this.navMenu.classList.contains('active')) {
            this.closeMenu();
        } else {
            this.openMenu();
        }
    }
    
    openMenu() {
        this.navMenu.classList.add('active');
        if (this.navOverlay) {
            this.navOverlay.classList.add('active');
        }
        
        // Previne scroll do body
        document.body.style.overflow = 'hidden';
        
        // Foca no primeiro link para acessibilidade
        const firstLink = this.navMenu.querySelector('.nav-link');
        if (firstLink) {
            firstLink.focus();
        }
    }
    
    closeMenu() {
        try {
            this.isMenuOpen = false;
            
            // Remove classes ativas
            this.menuBtn.classList.remove('active');
            this.navMenu.classList.remove('active');
            
            // Restaura scroll do body
            document.body.style.overflow = '';
            
            console.log('Menu closed');
            
        } catch (error) {
            log.error({
                message: error.message,
                stack: error.stack,
                component: 'mobile-menu-toggle'
            });
        }
    }
    
    // Método público para controle externo
    destroy() {
        // Remove event listeners se necessário
        if (this.menuBtn) {
            this.menuBtn.removeEventListener('click', this.toggleMenu);
        }
        console.log('Mobile menu destroyed');
    }
}

// Inicializa o controlador do menu
let mobileMenuController;

// Função de inicialização global
function initMobileMenu() {
    if (!mobileMenuController) {
        mobileMenuController = new MobileMenuController();
    }
}

// Auto-inicialização
initMobileMenu();

// Fallback para garantir inicialização
setTimeout(() => {
    if (!mobileMenuController) {
        console.log('Fallback: Initializing mobile menu...');
        initMobileMenu();
    }
}, 1000);

// Exporta para uso global se necessário
window.MobileMenuController = MobileMenuController;
window.mobileMenuController = mobileMenuController;