// Sistema ERP - JavaScript Principal
// Versão: 3.0.0

// === CONFIGURAÇÕES GLOBAIS ===
const CONFIG = {
  API_BASE_URL: '/api',
  CACHE_DURATION: 5 * 60 * 1000, // 5 minutos
  ANIMATION_DURATION: 300,
  DEBOUNCE_DELAY: 300,
  MAX_RETRIES: 3,
  RETRY_DELAY: 1000
};

// === ESTADO GLOBAL ===
const AppState = {
  user: null,
  theme: localStorage.getItem('theme') || 'light',
  language: localStorage.getItem('language') || 'pt-BR',
  notifications: [],
  cache: new Map(),
  isLoading: false,
  currentPage: window.location.pathname,
  sidebarOpen: false
};

// === UTILITÁRIOS ===
const Utils = {
  // Debounce function
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
  },

  // Throttle function
  throttle(func, limit) {
    let inThrottle;
    return function() {
      const args = arguments;
      const context = this;
      if (!inThrottle) {
        func.apply(context, args);
        inThrottle = true;
        setTimeout(() => inThrottle = false, limit);
      }
    };
  },

  // Format currency
  formatCurrency(value, currency = 'BRL') {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: currency
    }).format(value);
  },

  // Format date
  formatDate(date, options = {}) {
    const defaultOptions = {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    };
    return new Intl.DateTimeFormat('pt-BR', { ...defaultOptions, ...options }).format(new Date(date));
  },

  // Generate unique ID
  generateId() {
    return Date.now().toString(36) + Math.random().toString(36).substr(2);
  },

  // Sanitize HTML
  sanitizeHTML(str) {
    const temp = document.createElement('div');
    temp.textContent = str;
    return temp.innerHTML;
  },

  // Deep clone object
  deepClone(obj) {
    return JSON.parse(JSON.stringify(obj));
  },

  // Check if element is in viewport
  isInViewport(element) {
    const rect = element.getBoundingClientRect();
    return (
      rect.top >= 0 &&
      rect.left >= 0 &&
      rect.bottom <= (window.innerHeight || document.documentElement.clientHeight) &&
      rect.right <= (window.innerWidth || document.documentElement.clientWidth)
    );
  }
};

// === GERENCIADOR DE CACHE ===
const CacheManager = {
  set(key, data, duration = CONFIG.CACHE_DURATION) {
    const item = {
      data,
      timestamp: Date.now(),
      duration
    };
    AppState.cache.set(key, item);
  },

  get(key) {
    const item = AppState.cache.get(key);
    if (!item) return null;

    if (Date.now() - item.timestamp > item.duration) {
      AppState.cache.delete(key);
      return null;
    }

    return item.data;
  },

  clear() {
    AppState.cache.clear();
  },

  remove(key) {
    AppState.cache.delete(key);
  }
};

// === GERENCIADOR DE API ===
const ApiManager = {
  async request(endpoint, options = {}) {
    const url = `${CONFIG.API_BASE_URL}${endpoint}`;
    const defaultOptions = {
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      }
    };

    const config = { ...defaultOptions, ...options };

    try {
      const response = await fetch(url, config);
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      return { success: true, data };
    } catch (error) {
      console.error('API Request failed:', error);
      return { success: false, error: error.message };
    }
  },

  async get(endpoint, useCache = true) {
    if (useCache) {
      const cached = CacheManager.get(endpoint);
      if (cached) return { success: true, data: cached };
    }

    const result = await this.request(endpoint);
    if (result.success && useCache) {
      CacheManager.set(endpoint, result.data);
    }
    return result;
  },

  async post(endpoint, data) {
    return this.request(endpoint, {
      method: 'POST',
      body: JSON.stringify(data)
    });
  },

  async put(endpoint, data) {
    return this.request(endpoint, {
      method: 'PUT',
      body: JSON.stringify(data)
    });
  },

  async delete(endpoint) {
    return this.request(endpoint, {
      method: 'DELETE'
    });
  }
};

// === GERENCIADOR DE NOTIFICAÇÕES ===
const NotificationManager = {
  show(message, type = 'info', duration = 5000) {
    const notification = {
      id: Utils.generateId(),
      message: Utils.sanitizeHTML(message),
      type,
      timestamp: Date.now()
    };

    AppState.notifications.push(notification);
    this.render(notification);

    if (duration > 0) {
      setTimeout(() => this.remove(notification.id), duration);
    }

    return notification.id;
  },

  render(notification) {
    const container = this.getContainer();
    const element = document.createElement('div');
    element.className = `notification notification--${notification.type}`;
    element.setAttribute('data-id', notification.id);
    element.innerHTML = `
      <div class="notification__content">
        <span class="notification__message">${notification.message}</span>
        <button class="notification__close" onclick="NotificationManager.remove('${notification.id}')">
          <span aria-hidden="true">&times;</span>
        </button>
      </div>
    `;

    container.appendChild(element);
    
    // Trigger animation
    requestAnimationFrame(() => {
      element.classList.add('notification--show');
    });
  },

  remove(id) {
    const element = document.querySelector(`[data-id="${id}"]`);
    if (element) {
      element.classList.add('notification--hide');
      setTimeout(() => {
        element.remove();
      }, CONFIG.ANIMATION_DURATION);
    }

    AppState.notifications = AppState.notifications.filter(n => n.id !== id);
  },

  getContainer() {
    let container = document.getElementById('notification-container');
    if (!container) {
      container = document.createElement('div');
      container.id = 'notification-container';
      container.className = 'notification-container';
      document.body.appendChild(container);
    }
    return container;
  },

  success(message, duration) {
    return this.show(message, 'success', duration);
  },

  error(message, duration) {
    return this.show(message, 'error', duration);
  },

  warning(message, duration) {
    return this.show(message, 'warning', duration);
  },

  info(message, duration) {
    return this.show(message, 'info', duration);
  }
};

// === GERENCIADOR DE LOADING ===
const LoadingManager = {
  show(target = document.body) {
    AppState.isLoading = true;
    
    if (typeof target === 'string') {
      target = document.querySelector(target);
    }

    if (!target) return;

    const existing = target.querySelector('.loading-overlay');
    if (existing) return;

    const overlay = document.createElement('div');
    overlay.className = 'loading-overlay';
    overlay.innerHTML = `
      <div class="loading-spinner"></div>
      <div class="loading-text">Carregando...</div>
    `;

    target.style.position = 'relative';
    target.appendChild(overlay);
  },

  hide(target = document.body) {
    AppState.isLoading = false;
    
    if (typeof target === 'string') {
      target = document.querySelector(target);
    }

    if (!target) return;

    const overlay = target.querySelector('.loading-overlay');
    if (overlay) {
      overlay.remove();
    }
  }
};

// === GERENCIADOR DE SIDEBAR ===
const SidebarManager = {
  init() {
    this.setupToggle();
    this.setupResponsive();
    this.setupNavigation();
  },

  setupToggle() {
    const toggle = document.querySelector('.sidebar-toggle');
    const sidebar = document.querySelector('.sidebar');
    
    if (toggle && sidebar) {
      toggle.addEventListener('click', () => {
        this.toggle();
      });
    }
  },

  toggle() {
    const sidebar = document.querySelector('.sidebar');
    if (sidebar) {
      sidebar.classList.toggle('open');
      AppState.sidebarOpen = sidebar.classList.contains('open');
    }
  },

  close() {
    const sidebar = document.querySelector('.sidebar');
    if (sidebar) {
      sidebar.classList.remove('open');
      AppState.sidebarOpen = false;
    }
  },

  setupResponsive() {
    // Fechar sidebar ao clicar fora em dispositivos móveis
    document.addEventListener('click', (e) => {
      const sidebar = document.querySelector('.sidebar');
      const toggle = document.querySelector('.sidebar-toggle');
      
      if (window.innerWidth <= 1024 && 
          sidebar && 
          AppState.sidebarOpen && 
          !sidebar.contains(e.target) && 
          !toggle.contains(e.target)) {
        this.close();
      }
    });

    // Fechar sidebar ao redimensionar para desktop
    window.addEventListener('resize', () => {
      if (window.innerWidth > 1024) {
        this.close();
      }
    });
  },

  setupNavigation() {
    const navLinks = document.querySelectorAll('.nav-link');
    navLinks.forEach(link => {
      link.addEventListener('click', (e) => {
        // Remove active class from all links
        navLinks.forEach(l => l.classList.remove('active'));
        // Add active class to clicked link
        link.classList.add('active');
        
        // Fechar sidebar em mobile após clicar
        if (window.innerWidth <= 1024) {
          this.close();
        }
      });
    });

    // Highlight current page
    this.highlightCurrentPage();
  },

  highlightCurrentPage() {
    const currentPath = window.location.pathname;
    const navLinks = document.querySelectorAll('.nav-link');
    
    navLinks.forEach(link => {
      if (link.getAttribute('href') === currentPath) {
        link.classList.add('active');
      }
    });
  }
};

// === GERENCIADOR DE BUSCA ===
const SearchManager = {
  init() {
    this.setupSearch();
  },

  setupSearch() {
    const searchInput = document.querySelector('.search-box input');
    if (searchInput) {
      const debouncedSearch = Utils.debounce(this.performSearch.bind(this), CONFIG.DEBOUNCE_DELAY);
      searchInput.addEventListener('input', debouncedSearch);
    }
  },

  async performSearch(e) {
    const query = e.target.value.trim();
    if (query.length < 2) return;

    try {
      const result = await ApiManager.get(`/search?q=${encodeURIComponent(query)}`);
      if (result.success) {
        this.showResults(result.data);
      }
    } catch (error) {
      console.error('Search error:', error);
    }
  },

  showResults(results) {
    // Implementar exibição dos resultados
    console.log('Search results:', results);
  }
};

// === GERENCIADOR DE DASHBOARD ===
const DashboardManager = {
  async init() {
    await this.loadKPIs();
    await this.loadCharts();
    await this.loadActivities();
    this.setupRefresh();
    this.setupKPIAnimations();
  },

  async loadKPIs() {
    try {
      // Simular dados de KPI para demonstração
      const mockData = {
        totalSupplies: { value: 1247, change: 12.5, trend: 'up' },
        pendingOrders: { value: 23, change: -8.2, trend: 'down' },
        monthlySpent: { value: 45678.90, change: 5.3, trend: 'up' },
        suppliers: { value: 156, change: 2.1, trend: 'up' }
      };
      
      this.renderKPIs(mockData);
    } catch (error) {
      console.error('Error loading KPIs:', error);
      NotificationManager.error('Erro ao carregar KPIs');
    }
  },

  renderKPIs(data) {
    // Atualizar valores dos KPIs
    const kpiCards = document.querySelectorAll('.kpi-card');
    
    kpiCards.forEach((card, index) => {
      const valueElement = card.querySelector('.kpi-card__value');
      const changeElement = card.querySelector('.kpi-card__change');
      
      if (valueElement && changeElement) {
        // Animar contadores
        this.animateCounter(valueElement, 0, this.getKPIValue(data, index), 1000);
      }
    });
  },

  getKPIValue(data, index) {
    const values = [
      data.totalSupplies.value,
      data.pendingOrders.value,
      data.monthlySpent.value,
      data.suppliers.value
    ];
    return values[index] || 0;
  },

  animateCounter(element, start, end, duration) {
    const startTime = performance.now();
    const isMonetary = element.textContent.includes('R$');
    
    const animate = (currentTime) => {
      const elapsed = currentTime - startTime;
      const progress = Math.min(elapsed / duration, 1);
      
      const current = start + (end - start) * progress;
      
      if (isMonetary) {
        element.textContent = Utils.formatCurrency(current);
      } else {
        element.textContent = Math.floor(current).toLocaleString('pt-BR');
      }
      
      if (progress < 1) {
        requestAnimationFrame(animate);
      }
    };
    
    requestAnimationFrame(animate);
  },

  async loadCharts() {
    try {
      // Simular carregamento de gráficos
      const chartPlaceholders = document.querySelectorAll('.chart-placeholder');
      chartPlaceholders.forEach(placeholder => {
        placeholder.innerHTML = `
          <div style="text-align: center; color: var(--color-neutral-500);">
            <div style="font-size: 48px; margin-bottom: 16px;">📊</div>
            <div>Gráfico será carregado aqui</div>
          </div>
        `;
      });
    } catch (error) {
      console.error('Error loading charts:', error);
    }
  },

  async loadActivities() {
    try {
      // Simular dados de atividades
      const mockActivities = [
        {
          icon: '✅',
          text: 'Pedido #1234 foi aprovado',
          time: '2 minutos atrás',
          type: 'success'
        },
        {
          icon: '⚠️',
          text: 'Estoque baixo para item ABC123',
          time: '15 minutos atrás',
          type: 'warning'
        },
        {
          icon: 'ℹ️',
          text: 'Novo fornecedor cadastrado',
          time: '1 hora atrás',
          type: 'info'
        }
      ];
      
      this.renderActivities(mockActivities);
    } catch (error) {
      console.error('Error loading activities:', error);
    }
  },

  renderActivities(activities) {
    const activityList = document.querySelector('.activity-list');
    if (!activityList) return;

    activityList.innerHTML = activities.map(activity => `
      <div class="activity-item">
        <div class="activity-item__icon activity-item__icon--${activity.type}">
          ${activity.icon}
        </div>
        <div class="activity-item__content">
          <p class="activity-item__text">${activity.text}</p>
          <span class="activity-item__time">${activity.time}</span>
        </div>
      </div>
    `).join('');
  },

  setupKPIAnimations() {
    const kpiCards = document.querySelectorAll('.kpi-card');
    
    // Adicionar animação de entrada escalonada
    kpiCards.forEach((card, index) => {
      card.style.animationDelay = `${index * 100}ms`;
      card.classList.add('animate-fade-in-up');
    });
  },

  setupRefresh() {
    const refreshBtn = document.querySelector('[data-refresh]');
    if (refreshBtn) {
      refreshBtn.addEventListener('click', () => {
        this.refresh();
      });
    }

    // Auto refresh a cada 5 minutos
    setInterval(() => {
      this.refresh();
    }, 5 * 60 * 1000);
  },

  async refresh() {
    CacheManager.clear();
    await this.init();
    NotificationManager.success('Dashboard atualizado');
  }
};

// === INICIALIZAÇÃO ===
document.addEventListener('DOMContentLoaded', async () => {
  try {
    // Inicializar ícones Lucide
    if (typeof lucide !== 'undefined') {
      lucide.createIcons();
    }
    
    // Inicializar gerenciadores
    SidebarManager.init();
    SearchManager.init();
    
    // Verificar se estamos na página do dashboard
    if (document.querySelector('.dashboard-grid')) {
      await DashboardManager.init();
    }

    // Setup global event listeners
    setupGlobalEventListeners();
    
    console.log('Sistema ERP inicializado com sucesso');
  } catch (error) {
    console.error('Erro na inicialização:', error);
    NotificationManager.error('Erro na inicialização do sistema');
  }
});

// === EVENT LISTENERS GLOBAIS ===
function setupGlobalEventListeners() {
  // Handle action buttons
  document.addEventListener('click', async (e) => {
    const element = e.target.closest('[data-action]');
    if (!element) return;
    
    const action = element.getAttribute('data-action');
    const target = element.getAttribute('data-target');
    
    switch (action) {
      case 'refresh':
        if (window.DashboardManager) {
          await DashboardManager.refresh();
        }
        break;
      case 'export':
        handleExport(target);
        break;
      case 'print':
        window.print();
        break;
    }
  });

  // Handle notification actions
  document.addEventListener('click', (e) => {
    if (e.target.matches('.action-btn')) {
      // Simular ação de notificação
      const badge = e.target.querySelector('.notification-badge');
      if (badge) {
        badge.style.display = 'none';
      }
    }
  });
}

// === HANDLERS ===
function handleExport(format) {
  NotificationManager.info(`Exportando dados em formato ${format}...`);
  // Implementar lógica de exportação
}

// === EXPORT PARA TESTES ===
if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    Utils,
    CacheManager,
    ApiManager,
    NotificationManager,
    LoadingManager,
    SidebarManager,
    SearchManager,
    DashboardManager
  };
}