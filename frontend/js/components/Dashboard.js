/**
 * Componente Dashboard - Gerencia a página principal do sistema
 */

import { ApiService } from '../services/ApiService.js';
import { NotificationService } from '../services/NotificationService.js';
import log from '../utils/logger.js';

export class Dashboard {
    constructor(container, options = {}) {
        this.container = container;
        this.options = {
            autoRefresh: true,
            refreshInterval: 30000, // 30 segundos
            ...options
        };

        this.apiService = new ApiService();
        this.notificationService = new NotificationService();
        
        this.data = {
            stats: {},
            systemHealth: {},
            recentActivities: []
        };

        this.refreshTimer = null;
        this.isLoading = false;
        this.isDestroyed = false;

        this.init();
    }

    /**
     * Inicializa o componente
     */
    async init() {
        try {
            this.render();
            await this.loadData();
            this.setupEventListeners();
            
            if (this.options.autoRefresh) {
                this.startAutoRefresh();
            }

            this.emit('ready');
        } catch (error) {
            log.error({
                message: error.message,
                stack: error.stack,
                component: 'dashboard-init'
            });
            this.showError('Erro ao carregar dashboard');
        }
    }

    /**
     * Renderiza a estrutura do dashboard
     */
    render() {
        this.container.innerHTML = `
            <div class="dashboard">
                <!-- Cabeçalho -->
                <div class="dashboard__header">
                    <div class="dashboard__title">
                        <h1 class="text--h1">Dashboard</h1>
                        <p class="text--body-secondary">Visão geral do sistema de gestão de suprimentos</p>
                    </div>
                    <div class="dashboard__actions">
                        <button class="btn btn--outline btn--sm" id="refresh-btn" aria-label="Atualizar dados">
                            <svg class="btn__icon" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                <polyline points="23 4 23 10 17 10"></polyline>
                                <polyline points="1 20 1 14 7 14"></polyline>
                                <path d="M20.49 9A9 9 0 0 0 5.64 5.64L1 10m22 4l-4.64 4.36A9 9 0 0 1 3.51 15"></path>
                            </svg>
                            Atualizar
                        </button>
                    </div>
                </div>

                <!-- Status do Sistema -->
                <div class="dashboard__system-status" id="system-status">
                    <div class="card card--loading">
                        <div class="card__body">
                            <div class="loading-spinner"></div>
                            <span>Verificando status do sistema...</span>
                        </div>
                    </div>
                </div>

                <!-- Estatísticas Principais -->
                <div class="dashboard__stats" id="stats-grid">
                    <div class="stats-grid">
                        <div class="card card--stats card--loading">
                            <div class="card__body">
                                <div class="loading-skeleton loading-skeleton--text"></div>
                                <div class="loading-skeleton loading-skeleton--number"></div>
                            </div>
                        </div>
                        <div class="card card--stats card--loading">
                            <div class="card__body">
                                <div class="loading-skeleton loading-skeleton--text"></div>
                                <div class="loading-skeleton loading-skeleton--number"></div>
                            </div>
                        </div>
                        <div class="card card--stats card--loading">
                            <div class="card__body">
                                <div class="loading-skeleton loading-skeleton--text"></div>
                                <div class="loading-skeleton loading-skeleton--number"></div>
                            </div>
                        </div>
                        <div class="card card--stats card--loading">
                            <div class="card__body">
                                <div class="loading-skeleton loading-skeleton--text"></div>
                                <div class="loading-skeleton loading-skeleton--number"></div>
                            </div>
                        </div>
                    </div>
                </div>

                <!-- Gráficos e Métricas -->
                <div class="dashboard__charts">
                    <div class="dashboard__row">
                        <div class="dashboard__col dashboard__col--8">
                            <div class="card">
                                <div class="card__header">
                                    <h3 class="card__title">Pedidos por Período</h3>
                                    <div class="card__actions">
                                        <select class="form-control form-control--sm" id="chart-period">
                                            <option value="7">Últimos 7 dias</option>
                                            <option value="30" selected>Últimos 30 dias</option>
                                            <option value="90">Últimos 90 dias</option>
                                        </select>
                                    </div>
                                </div>
                                <div class="card__body">
                                    <div id="orders-chart" class="chart-container">
                                        <div class="chart-placeholder">
                                            <div class="loading-spinner"></div>
                                            <span>Carregando gráfico...</span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                        <div class="dashboard__col dashboard__col--4">
                            <div class="card">
                                <div class="card__header">
                                    <h3 class="card__title">Atividades Recentes</h3>
                                </div>
                                <div class="card__body">
                                    <div id="recent-activities" class="activities-list">
                                        <div class="activities-list__loading">
                                            <div class="loading-spinner"></div>
                                            <span>Carregando atividades...</span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                <!-- Alertas e Notificações -->
                <div class="dashboard__alerts" id="alerts-section">
                    <!-- Alertas serão carregados dinamicamente -->
                </div>
            </div>
        `;
    }

    /**
     * Carrega todos os dados do dashboard
     */
    async loadData() {
        if (this.isLoading) return;
        
        this.isLoading = true;
        this.showLoadingState();

        try {
            // Carregar dados em paralelo
            const [statsResult, healthResult] = await Promise.allSettled([
                this.loadStats(),
                this.loadSystemHealth()
            ]);

            // Processar resultados
            if (statsResult.status === 'fulfilled') {
                this.data.stats = statsResult.value;
                this.renderStats();
            } else {
                log.error({
                    message: statsResult.reason?.message || 'Erro ao carregar estatísticas',
                    stack: statsResult.reason?.stack,
                    component: 'dashboard-stats'
                });
            }

            if (healthResult.status === 'fulfilled') {
                this.data.systemHealth = healthResult.value;
                this.renderSystemHealth();
            } else {
                log.error({
                    message: healthResult.reason?.message || 'Erro ao carregar status do sistema',
                    stack: healthResult.reason?.stack,
                    component: 'dashboard-health'
                });
            }

            // Carregar atividades recentes
            await this.loadRecentActivities();

            this.hideLoadingState();
            this.emit('dataLoaded', this.data);

        } catch (error) {
            log.error({
                message: error.message,
                stack: error.stack,
                component: 'dashboard-load-data'
            });
            this.showError('Erro ao carregar dados do dashboard');
        } finally {
            this.isLoading = false;
        }
    }

    /**
     * Carrega estatísticas principais
     */
    async loadStats() {
        try {
            const response = await this.apiService.getDashboardStats();
            return response.data;
        } catch (error) {
            log.error({
                message: error.message,
                stack: error.stack,
                component: 'dashboard-stats-load'
            });
            throw error;
        }
    }

    /**
     * Carrega status do sistema
     */
    async loadSystemHealth() {
        try {
            const response = await this.apiService.getSystemHealth();
            return response.data;
        } catch (error) {
            log.error({
                message: error.message,
                stack: error.stack,
                component: 'dashboard-health-load'
            });
            throw error;
        }
    }

    /**
     * Carrega atividades recentes
     */
    async loadRecentActivities() {
        try {
            // Simular carregamento de atividades (implementar endpoint específico)
            const activities = [
                {
                    id: 1,
                    type: 'order',
                    message: 'Novo pedido #1234 criado',
                    timestamp: new Date(Date.now() - 5 * 60 * 1000),
                    user: 'João Silva'
                },
                {
                    id: 2,
                    type: 'supplier',
                    message: 'Fornecedor ABC Ltda atualizado',
                    timestamp: new Date(Date.now() - 15 * 60 * 1000),
                    user: 'Maria Santos'
                },
                {
                    id: 3,
                    type: 'product',
                    message: 'Produto XYZ adicionado ao catálogo',
                    timestamp: new Date(Date.now() - 30 * 60 * 1000),
                    user: 'Pedro Costa'
                }
            ];

            this.data.recentActivities = activities;
            this.renderRecentActivities();
        } catch (error) {
            log.error({
                message: error.message,
                stack: error.stack,
                component: 'dashboard-activities'
            });
        }
    }

    /**
     * Renderiza as estatísticas
     */
    renderStats() {
        const statsGrid = this.container.querySelector('#stats-grid');
        const stats = this.data.stats;

        const statsCards = [
            {
                title: 'Total de Produtos',
                value: stats.totalProducts || 0,
                icon: 'package',
                trend: stats.productsTrend || 0,
                color: 'primary'
            },
            {
                title: 'Fornecedores Ativos',
                value: stats.activeSuppliers || 0,
                icon: 'users',
                trend: stats.suppliersTrend || 0,
                color: 'success'
            },
            {
                title: 'Pedidos Pendentes',
                value: stats.pendingOrders || 0,
                icon: 'clock',
                trend: stats.ordersTrend || 0,
                color: 'warning'
            },
            {
                title: 'Cotações Abertas',
                value: stats.openQuotes || 0,
                icon: 'file-text',
                trend: stats.quotesTrend || 0,
                color: 'info'
            }
        ];

        statsGrid.innerHTML = `
            <div class="stats-grid">
                ${statsCards.map(card => this.renderStatCard(card)).join('')}
            </div>
        `;
    }

    /**
     * Renderiza um card de estatística
     */
    renderStatCard(card) {
        const trendIcon = card.trend > 0 ? 'trending-up' : card.trend < 0 ? 'trending-down' : 'minus';
        const trendClass = card.trend > 0 ? 'positive' : card.trend < 0 ? 'negative' : 'neutral';
        const trendText = card.trend > 0 ? `+${card.trend}%` : `${card.trend}%`;

        return `
            <div class="card card--stats card--${card.color}">
                <div class="card__body">
                    <div class="stats-card">
                        <div class="stats-card__icon">
                            ${this.getIcon(card.icon)}
                        </div>
                        <div class="stats-card__content">
                            <div class="stats-card__title">${card.title}</div>
                            <div class="stats-card__value">${this.formatNumber(card.value)}</div>
                            <div class="stats-card__trend stats-card__trend--${trendClass}">
                                ${this.getIcon(trendIcon)}
                                <span>${trendText}</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        `;
    }

    /**
     * Renderiza o status do sistema
     */
    renderSystemHealth() {
        const statusContainer = this.container.querySelector('#system-status');
        const health = this.data.systemHealth;

        const isHealthy = health.database && health.api;
        const statusClass = isHealthy ? 'success' : 'error';
        const statusText = isHealthy ? 'Sistema Operacional' : 'Sistema com Problemas';

        statusContainer.innerHTML = `
            <div class="card card--${statusClass}">
                <div class="card__body">
                    <div class="system-status">
                        <div class="system-status__icon">
                            ${isHealthy ? this.getIcon('check-circle') : this.getIcon('alert-circle')}
                        </div>
                        <div class="system-status__content">
                            <h3 class="system-status__title">${statusText}</h3>
                            <div class="system-status__details">
                                <div class="status-item">
                                    <span class="status-item__label">API:</span>
                                    <span class="status-item__value status-item__value--${health.api ? 'success' : 'error'}">
                                        ${health.api ? 'Online' : 'Offline'}
                                    </span>
                                </div>
                                <div class="status-item">
                                    <span class="status-item__label">Banco de Dados:</span>
                                    <span class="status-item__value status-item__value--${health.database ? 'success' : 'error'}">
                                        ${health.database ? 'Conectado' : 'Desconectado'}
                                    </span>
                                </div>
                                <div class="status-item">
                                    <span class="status-item__label">Última Verificação:</span>
                                    <span class="status-item__value">
                                        ${this.formatTime(new Date())}
                                    </span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        `;
    }

    /**
     * Renderiza atividades recentes
     */
    renderRecentActivities() {
        const activitiesContainer = this.container.querySelector('#recent-activities');
        const activities = this.data.recentActivities;

        if (!activities || activities.length === 0) {
            activitiesContainer.innerHTML = `
                <div class="empty-state">
                    <div class="empty-state__icon">${this.getIcon('inbox')}</div>
                    <div class="empty-state__title">Nenhuma atividade recente</div>
                    <div class="empty-state__description">As atividades aparecerão aqui conforme forem realizadas</div>
                </div>
            `;
            return;
        }

        activitiesContainer.innerHTML = `
            <div class="activities-list">
                ${activities.map(activity => this.renderActivity(activity)).join('')}
            </div>
        `;
    }

    /**
     * Renderiza uma atividade
     */
    renderActivity(activity) {
        const typeIcon = this.getActivityIcon(activity.type);
        const timeAgo = this.getTimeAgo(activity.timestamp);

        return `
            <div class="activity-item">
                <div class="activity-item__icon activity-item__icon--${activity.type}">
                    ${typeIcon}
                </div>
                <div class="activity-item__content">
                    <div class="activity-item__message">${activity.message}</div>
                    <div class="activity-item__meta">
                        <span class="activity-item__user">${activity.user}</span>
                        <span class="activity-item__time">${timeAgo}</span>
                    </div>
                </div>
            </div>
        `;
    }

    /**
     * Configura event listeners
     */
    setupEventListeners() {
        // Botão de atualizar
        const refreshBtn = this.container.querySelector('#refresh-btn');
        refreshBtn?.addEventListener('click', () => {
            this.refresh();
        });

        // Seletor de período do gráfico
        const chartPeriod = this.container.querySelector('#chart-period');
        chartPeriod?.addEventListener('change', (e) => {
            this.updateChartPeriod(e.target.value);
        });

        // Keyboard shortcuts
        document.addEventListener('keydown', (e) => {
            if (e.ctrlKey && e.key === 'r') {
                e.preventDefault();
                this.refresh();
            }
        });
    }

    /**
     * Atualiza dados do dashboard
     */
    async refresh() {
        if (this.isLoading) return;

        try {
            await this.loadData();
            this.notificationService.success('Dashboard atualizado', 'Dados atualizados com sucesso');
        } catch (error) {
            this.notificationService.error('Erro ao atualizar', 'Não foi possível atualizar os dados');
        }
    }

    /**
     * Inicia atualização automática
     */
    startAutoRefresh() {
        if (this.refreshTimer) {
            clearInterval(this.refreshTimer);
        }

        this.refreshTimer = setInterval(() => {
            if (!this.isDestroyed && !document.hidden) {
                this.loadData();
            }
        }, this.options.refreshInterval);
    }

    /**
     * Para atualização automática
     */
    stopAutoRefresh() {
        if (this.refreshTimer) {
            clearInterval(this.refreshTimer);
            this.refreshTimer = null;
        }
    }

    /**
     * Mostra estado de carregamento
     */
    showLoadingState() {
        const refreshBtn = this.container.querySelector('#refresh-btn');
        if (refreshBtn) {
            refreshBtn.disabled = true;
            refreshBtn.classList.add('btn--loading');
        }
    }

    /**
     * Esconde estado de carregamento
     */
    hideLoadingState() {
        const refreshBtn = this.container.querySelector('#refresh-btn');
        if (refreshBtn) {
            refreshBtn.disabled = false;
            refreshBtn.classList.remove('btn--loading');
        }
    }

    /**
     * Mostra erro
     */
    showError(message) {
        this.notificationService.error('Erro', message);
    }

    /**
     * Métodos utilitários
     */
    formatNumber(num) {
        return new Intl.NumberFormat('pt-BR').format(num);
    }

    formatTime(date) {
        return new Intl.DateTimeFormat('pt-BR', {
            hour: '2-digit',
            minute: '2-digit'
        }).format(date);
    }

    getTimeAgo(date) {
        const now = new Date();
        const diff = now - date;
        const minutes = Math.floor(diff / 60000);
        
        if (minutes < 1) return 'agora';
        if (minutes < 60) return `${minutes}m atrás`;
        
        const hours = Math.floor(minutes / 60);
        if (hours < 24) return `${hours}h atrás`;
        
        const days = Math.floor(hours / 24);
        return `${days}d atrás`;
    }

    getActivityIcon(type) {
        const icons = {
            order: 'shopping-cart',
            supplier: 'users',
            product: 'package',
            quote: 'file-text'
        };
        return this.getIcon(icons[type] || 'activity');
    }

    getIcon(name) {
        const icons = {
            'package': '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="16.5" y1="9.4" x2="7.5" y2="4.21"></line><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"></path><polyline points="3.27 6.96 12 12.01 20.73 6.96"></polyline><line x1="12" y1="22.08" x2="12" y2="12"></line></svg>',
            'users': '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path><circle cx="9" cy="7" r="4"></circle><path d="M23 21v-2a4 4 0 0 0-3-3.87"></path><path d="M16 3.13a4 4 0 0 1 0 7.75"></path></svg>',
            'clock': '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"></circle><polyline points="12,6 12,12 16,14"></polyline></svg>',
            'file-text': '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><polyline points="14,2 14,8 20,8"></polyline><line x1="16" y1="13" x2="8" y2="13"></line><line x1="16" y1="17" x2="8" y2="17"></line><polyline points="10,9 9,9 8,9"></polyline></svg>',
            'trending-up': '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="23 6 13.5 15.5 8.5 10.5 1 18"></polyline><polyline points="17 6 23 6 23 12"></polyline></svg>',
            'trending-down': '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="23 18 13.5 8.5 8.5 13.5 1 6"></polyline><polyline points="17 18 23 18 23 12"></polyline></svg>',
            'minus': '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="5" y1="12" x2="19" y2="12"></line></svg>',
            'check-circle': '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M9 12l2 2 4-4"></path><circle cx="12" cy="12" r="10"></circle></svg>',
            'alert-circle': '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="8" x2="12" y2="12"></line><line x1="12" y1="16" x2="12.01" y2="16"></line></svg>',
            'inbox': '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="22 12 18 12 15 21 9 21 6 12 2 12"></polyline><path d="M5.45 5.11L2 12v6a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-6l-3.45-6.89A2 2 0 0 0 16.76 4H7.24a2 2 0 0 0-1.79 1.11z"></path></svg>',
            'shopping-cart': '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="9" cy="21" r="1"></circle><circle cx="20" cy="21" r="1"></circle><path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"></path></svg>',
            'activity': '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="22 12 18 12 15 21 9 21 6 12 2 12"></polyline></svg>'
        };

        return icons[name] || icons.activity;
    }

    /**
     * Sistema de eventos
     */
    emit(event, data) {
        const customEvent = new CustomEvent(`dashboard:${event}`, {
            detail: { dashboard: this, data }
        });
        this.container.dispatchEvent(customEvent);
    }

    /**
     * Destruir componente
     */
    destroy() {
        this.isDestroyed = true;
        this.stopAutoRefresh();
        
        // Remover event listeners
        document.removeEventListener('keydown', this.handleKeydown);
        
        // Limpar container
        if (this.container) {
            this.container.innerHTML = '';
        }

        this.emit('destroyed');
    }
}