/**
 * Sistema de Gestão de Suprimentos - Aplicação Principal
 * Arquivo principal que inicializa a aplicação SPA
 */

class App {
    constructor() {
        this.currentPage = '';
        this.isInitialized = false;
        this.components = new Map();
        this.services = new Map();
        
        // Bind methods
        this.init = this.init.bind(this);
        this.handleRouteChange = this.handleRouteChange.bind(this);
        this.handlePopState = this.handlePopState.bind(this);
    }

    /**
     * Inicializa a aplicação
     */
    async init() {
        try {
            console.log('🚀 Inicializando Sistema de Gestão de Suprimentos...');
            
            // Registrar serviços
            await this.registerServices();
            
            // Registrar componentes
            await this.registerComponents();
            
            // Configurar roteamento
            this.setupRouting();
            
            // Configurar eventos globais
            this.setupGlobalEvents();
            
            // Carregar página inicial
            await this.loadInitialPage();
            
            this.isInitialized = true;
            console.log('✅ Aplicação inicializada com sucesso!');
            
        } catch (error) {
            console.error('Erro ao inicializar aplicação:', error);
            this.showErrorPage('Erro ao inicializar aplicação');
        }
    }

    /**
     * Registra todos os serviços da aplicação
     */
    async registerServices() {
        try {
            // API Service
            const { ApiService } = await import('../services/ApiService.js');
            this.services.set('api', new ApiService());
            
            // Storage Service
            const { StorageService } = await import('../services/StorageService.js');
            this.services.set('storage', new StorageService());
            
            // Notification Service
            const { NotificationService } = await import('../services/NotificationService.js');
            this.services.set('notification', new NotificationService());
            
            // Theme Service
            const { ThemeService } = await import('../services/ThemeService.js');
            this.services.set('theme', new ThemeService());
            
            // Loading Service
            const { LoadingService } = await import('../services/LoadingService.js');
            this.services.set('loading', new LoadingService());
            
            console.log('📦 Serviços registrados:', Array.from(this.services.keys()));
            
        } catch (error) {
            console.error('Erro ao registrar serviços:', error);
            throw error;
        }
    }

    /**
     * Registra todos os componentes da aplicação
     */
    async registerComponents() {
        try {
            // Header Component
            const { HeaderComponent } = await import('../components/HeaderComponent.js');
            this.components.set('header', new HeaderComponent(this.services));
            
            // Navigation Component
            const { NavigationComponent } = await import('../components/NavigationComponent.js');
            this.components.set('navigation', new NavigationComponent(this.services));
            
            // Dashboard Component
            const { DashboardComponent } = await import('../components/DashboardComponent.js');
            this.components.set('dashboard', new DashboardComponent(this.services));
            
            // Products Component
            const { ProductsComponent } = await import('../components/ProductsComponent.js');
            this.components.set('products', new ProductsComponent(this.services));
            
            // Suppliers Component
            const { SuppliersComponent } = await import('../components/SuppliersComponent.js');
            this.components.set('suppliers', new SuppliersComponent(this.services));
            
            // Orders Component
            const { OrdersComponent } = await import('../components/OrdersComponent.js');
            this.components.set('orders', new OrdersComponent(this.services));
            
            console.log('🧩 Componentes registrados:', Array.from(this.components.keys()));
            
        } catch (error) {
            log.error('Erro ao registrar componentes', { 
                error: error.message, 
                stack: error.stack,
                component: 'component-registration'
            });
            throw error;
        }
    }

    /**
     * Configura o sistema de roteamento
     */
    setupRouting() {
        // Configurar rotas
        this.routes = {
            '/': 'dashboard',
            '/dashboard': 'dashboard',
            '/products': 'products',
            '/suppliers': 'suppliers',
            '/orders': 'orders'
        };

        // Event listeners para navegação
        window.addEventListener('popstate', this.handlePopState);
        
        // Interceptar cliques em links de navegação
        document.addEventListener('click', (e) => {
            const link = e.target.closest('[data-route]');
            if (link) {
                e.preventDefault();
                const route = link.getAttribute('data-route');
                this.navigateTo(route);
            }
        });
    }

    /**
     * Configura eventos globais da aplicação
     */
    setupGlobalEvents() {
        // Verificar conectividade
        window.addEventListener('online', () => {
            this.services.get('notification').show('Conexão restaurada', 'success');
        });

        window.addEventListener('offline', () => {
            this.services.get('notification').show('Sem conexão com a internet', 'warning');
        });

        // Atalhos de teclado
        document.addEventListener('keydown', (e) => {
            // Ctrl/Cmd + K para busca
            if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
                e.preventDefault();
                this.focusSearch();
            }
            
            // ESC para fechar modais
            if (e.key === 'Escape') {
                this.closeModals();
            }
        });

        // Redimensionamento da janela
        window.addEventListener('resize', this.debounce(() => {
            this.handleResize();
        }, 250));
    }

    /**
     * Carrega a página inicial baseada na URL atual
     */
    async loadInitialPage() {
        const path = window.location.pathname;
        const page = this.routes[path] || 'dashboard';
        await this.loadPage(page, false);
    }

    /**
     * Navega para uma nova página
     */
    async navigateTo(route) {
        if (!this.isInitialized) {
            console.warn('Aplicação ainda não foi inicializada');
            return;
        }

        const page = this.routes[route];
        if (!page) {
            log.error('Rota não encontrada', { 
                route: route,
                component: 'router'
            });
            this.showErrorPage('Página não encontrada');
            return;
        }

        // Atualizar URL
        window.history.pushState({ page }, '', route);
        
        // Carregar página
        await this.loadPage(page);
    }

    /**
     * Carrega uma página específica
     */
    async loadPage(pageName, updateHistory = true) {
        try {
            // Mostrar loading
            this.services.get('loading').show();
            
            // Limpar página atual
            if (this.currentPage) {
                await this.unloadCurrentPage();
            }

            // Carregar nova página
            const component = this.components.get(pageName);
            if (!component) {
                throw new Error(`Componente não encontrado: ${pageName}`);
            }

            // Renderizar componente
            await component.render();
            
            // Atualizar navegação ativa
            this.updateActiveNavigation(pageName);
            
            // Atualizar título da página
            this.updatePageTitle(pageName);
            
            this.currentPage = pageName;
            
            // Esconder loading
            this.services.get('loading').hide();
            
            console.log(`📄 Página carregada: ${pageName}`);
            
        } catch (error) {
            log.error('Erro ao carregar página', { 
                error: error.message, 
                stack: error.stack,
                page: page,
                component: 'page-loader'
            });
            this.showErrorPage('Erro ao carregar página');
            this.services.get('loading').hide();
            this.services.get('notification').show('Erro ao carregar página', 'error');
        }
    }

    /**
     * Descarrega a página atual
     */
    async unloadCurrentPage() {
        const component = this.components.get(this.currentPage);
        if (component && typeof component.destroy === 'function') {
            await component.destroy();
        }
    }

    /**
     * Atualiza a navegação ativa
     */
    updateActiveNavigation(pageName) {
        // Remover classe ativa de todos os links
        document.querySelectorAll('[data-route]').forEach(link => {
            link.classList.remove('nav__link--active');
        });

        // Adicionar classe ativa ao link atual
        const activeLink = document.querySelector(`[data-route="/${pageName}"]`);
        if (activeLink) {
            activeLink.classList.add('nav__link--active');
        }
    }

    /**
     * Atualiza o título da página
     */
    updatePageTitle(pageName) {
        const titles = {
            dashboard: 'Dashboard',
            products: 'Produtos',
            suppliers: 'Fornecedores',
            orders: 'Pedidos'
        };

        const title = titles[pageName] || 'Sistema de Gestão';
        document.title = `${title} - Gestão de Suprimentos`;
    }

    /**
     * Manipula mudanças de rota via botão voltar/avançar
     */
    handlePopState(event) {
        const path = window.location.pathname;
        const page = this.routes[path] || 'dashboard';
        this.loadPage(page, false);
    }

    /**
     * Foca no campo de busca
     */
    focusSearch() {
        const searchInput = document.querySelector('.header__search-input');
        if (searchInput) {
            searchInput.focus();
        }
    }

    /**
     * Fecha todos os modais abertos
     */
    closeModals() {
        document.querySelectorAll('.modal--open').forEach(modal => {
            modal.classList.remove('modal--open');
        });
    }

    /**
     * Manipula redimensionamento da janela
     */
    handleResize() {
        // Atualizar layout responsivo
        const isMobile = window.innerWidth <= 768;
        document.body.classList.toggle('is-mobile', isMobile);
        
        // Notificar componentes sobre mudança de tamanho
        this.components.forEach(component => {
            if (typeof component.handleResize === 'function') {
                component.handleResize();
            }
        });
    }

    /**
     * Mostra página de erro
     */
    showErrorPage(error) {
        const mainContent = document.getElementById('main-content');
        if (mainContent) {
            mainContent.innerHTML = `
                <div class="error-state">
                    <div class="error-state__icon">⚠️</div>
                    <h2 class="error-state__title">Erro na Aplicação</h2>
                    <p class="error-state__description">
                        Ocorreu um erro inesperado. Por favor, recarregue a página.
                    </p>
                    <div class="error-state__actions">
                        <button class="btn btn--primary" onclick="window.location.reload()">
                            Recarregar Página
                        </button>
                    </div>
                </div>
            `;
        }
    }

    /**
     * Utilitário para debounce
     */
    debounce(func, wait) {
        let timeout;
        return function executedFunction(...args) {
            const later = () => {
                clearTimeout(timeout);
                func(...args);
            };
            clearTimeout(timeout);
            timeout = setTimeout(later, wait);
        };
    }

    /**
     * Obtém um serviço registrado
     */
    getService(name) {
        return this.services.get(name);
    }

    /**
     * Obtém um componente registrado
     */
    getComponent(name) {
        return this.components.get(name);
    }

    /**
     * Destrói a aplicação
     */
    async destroy() {
        // Remover event listeners
        window.removeEventListener('popstate', this.handlePopState);
        
        // Destruir componentes
        for (const component of this.components.values()) {
            if (typeof component.destroy === 'function') {
                await component.destroy();
            }
        }
        
        // Limpar serviços
        for (const service of this.services.values()) {
            if (typeof service.destroy === 'function') {
                await service.destroy();
            }
        }
        
        this.components.clear();
        this.services.clear();
        this.isInitialized = false;
        
        console.log('🗑️ Aplicação destruída');
    }
}

// Instância global da aplicação
window.App = new App();

// Inicializar quando o DOM estiver pronto
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        window.App.init();
    });
} else {
    window.App.init();
}

// Exportar para uso em módulos
if (typeof module !== 'undefined' && module.exports) {
    module.exports = App;
}