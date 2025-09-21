/**
 * SPA Router - Sistema de Roteamento para Single Page Application
 * Gerencia a navegação entre diferentes seções do sistema
 */

class SPARouter {
    constructor() {
        this.routes = {
            '': 'dashboard',
            'dashboard': 'dashboard',
            'products': 'products',
            'suppliers': 'suppliers',
            'quotes': 'quotes',
            'orders': 'orders',
            'reports': 'reports'
        };
        
        this.currentRoute = '';
        this.init();
    }

    init() {
        // Configurar event listeners
        this.setupEventListeners();
        
        // Carregar rota inicial
        this.loadInitialRoute();
        
        // Configurar interceptação de links
        this.interceptLinks();
    }

    setupEventListeners() {
        // Listener para mudanças no hash da URL
        window.addEventListener('hashchange', () => {
            this.handleRouteChange();
        });

        // Listener para botão voltar/avançar do navegador
        window.addEventListener('popstate', () => {
            this.handleRouteChange();
        });
    }

    loadInitialRoute() {
        const hash = window.location.hash.slice(1); // Remove o #
        const route = hash || 'dashboard';
        this.navigateTo(route, false);
    }

    handleRouteChange() {
        const hash = window.location.hash.slice(1);
        const route = hash || 'dashboard';
        this.showSection(route);
    }

    navigateTo(route, updateHistory = true) {
        if (!this.routes[route]) {
            console.warn(`Rota não encontrada: ${route}`);
            route = 'dashboard';
        }

        if (updateHistory) {
            window.location.hash = route;
        }

        this.showSection(route);
    }

    showSection(route) {
        // Esconder todas as seções
        const sections = document.querySelectorAll('.content-section');
        sections.forEach(section => {
            section.style.display = 'none';
        });

        // Mostrar seção atual
        const targetSection = document.getElementById(this.routes[route]);
        if (targetSection) {
            targetSection.style.display = 'block';
            this.currentRoute = route;
            
            // Atualizar navegação ativa
            this.updateActiveNavigation(route);
            
            // Atualizar título da página
            this.updatePageTitle(route);
            
            // Carregar dados da seção se necessário
            this.loadSectionData(route);
            
            // Scroll para o topo
            window.scrollTo(0, 0);
        }
    }

    updateActiveNavigation(route) {
        // Remover classe active de todos os links
        const navLinks = document.querySelectorAll('.nav-link');
        navLinks.forEach(link => {
            link.classList.remove('active');
        });

        // Adicionar classe active ao link atual
        const activeLink = document.querySelector(`[data-route="${route}"]`);
        if (activeLink) {
            activeLink.classList.add('active');
        }
    }

    updatePageTitle(route) {
        const titles = {
            'dashboard': 'Dashboard - Sistema de Gestão de Suprimentos',
            'products': 'Produtos - Sistema de Gestão de Suprimentos',
            'suppliers': 'Fornecedores - Sistema de Gestão de Suprimentos',
            'quotes': 'Cotações - Sistema de Gestão de Suprimentos',
            'orders': 'Pedidos - Sistema de Gestão de Suprimentos',
            'reports': 'Relatórios - Sistema de Gestão de Suprimentos'
        };

        document.title = titles[route] || 'Sistema de Gestão de Suprimentos';
    }

    loadSectionData(route) {
        // Carregar dados específicos para cada seção
        switch(route) {
            case 'dashboard':
                if (typeof loadDashboardData === 'function') {
                    loadDashboardData();
                }
                break;
            case 'products':
                if (typeof loadProducts === 'function') {
                    loadProducts();
                }
                break;
            case 'suppliers':
                if (typeof loadSuppliers === 'function') {
                    loadSuppliers();
                }
                break;
            case 'quotes':
                if (typeof loadQuotes === 'function') {
                    loadQuotes();
                }
                break;
            case 'orders':
                if (typeof loadOrders === 'function') {
                    loadOrders();
                }
                break;
            case 'reports':
                if (typeof loadReports === 'function') {
                    loadReports();
                }
                break;
        }
    }

    interceptLinks() {
        // Interceptar cliques em links de navegação
        document.addEventListener('click', (e) => {
            const link = e.target.closest('a[data-route]');
            if (link) {
                e.preventDefault();
                const route = link.getAttribute('data-route');
                this.navigateTo(route);
            }
        });
    }

    getCurrentRoute() {
        return this.currentRoute;
    }

    // Método para navegação programática
    goTo(route) {
        this.navigateTo(route);
    }

    // Método para voltar à página anterior
    goBack() {
        window.history.back();
    }

    // Método para recarregar a seção atual
    reload() {
        this.loadSectionData(this.currentRoute);
    }
}

// Funções utilitárias para navegação
function navigateTo(route) {
    if (window.spaRouter) {
        window.spaRouter.goTo(route);
    }
}

function getCurrentRoute() {
    return window.spaRouter ? window.spaRouter.getCurrentRoute() : '';
}

function reloadCurrentSection() {
    if (window.spaRouter) {
        window.spaRouter.reload();
    }
}

// Inicializar o router quando o DOM estiver carregado
document.addEventListener('DOMContentLoaded', () => {
    window.spaRouter = new SPARouter();
    console.log('SPA Router inicializado');
});

// Exportar para uso global
window.SPARouter = SPARouter;
window.navigateTo = navigateTo;
window.getCurrentRoute = getCurrentRoute;
window.reloadCurrentSection = reloadCurrentSection;