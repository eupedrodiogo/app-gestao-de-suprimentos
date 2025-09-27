/**
 * Sistema de Notificações Premium
 * Gerencia alertas em tempo real para o sistema de gestão de suprimentos
 */

class NotificationSystem {
    constructor() {
        this.notifications = [];
        this.isVisible = false;
        this.updateInterval = null;
        this.container = null;
        this.panel = null;
        this.toggle = null;
        this.badge = null;
        
        this.init();
    }

    /**
     * Inicializa o sistema de notificações
     */
    init() {
        this.createNotificationUI();
        this.bindEvents();
        this.startAutoUpdate();
        this.loadNotifications();
    }

    /**
     * Cria a interface do sistema de notificações
     */
    createNotificationUI() {
        // Container principal
        this.container = document.createElement('div');
        this.container.className = 'notifications-container';
        this.container.innerHTML = `
            <button class="notification-toggle" id="notificationToggle">
                <i class="fas fa-bell"></i>
                <span class="notification-badge" id="notificationBadge" style="display: none;">0</span>
            </button>
            
            <div class="notifications-panel" id="notificationsPanel">
                <div class="notifications-header">
                    <h6 class="notifications-title">Notificações</h6>
                    <div class="notifications-summary" id="notificationsSummary">
                        <span class="severity-count critical" id="criticalCount" style="display: none;">
                            <i class="fas fa-exclamation-triangle"></i> 0
                        </span>
                        <span class="severity-count high" id="highCount" style="display: none;">
                            <i class="fas fa-exclamation-circle"></i> 0
                        </span>
                        <span class="severity-count medium" id="mediumCount" style="display: none;">
                            <i class="fas fa-info-circle"></i> 0
                        </span>
                        <span class="severity-count low" id="lowCount" style="display: none;">
                            <i class="fas fa-check-circle"></i> 0
                        </span>
                    </div>
                </div>
                
                <div class="notifications-list" id="notificationsList">
                    <div class="notifications-empty">
                        <div class="notifications-empty-icon">
                            <i class="fas fa-bell-slash"></i>
                        </div>
                        <p class="notifications-empty-text">Nenhuma notificação no momento</p>
                    </div>
                </div>
            </div>
        `;

        // Adiciona ao body
        document.body.appendChild(this.container);

        // Referências dos elementos
        this.toggle = document.getElementById('notificationToggle');
        this.panel = document.getElementById('notificationsPanel');
        this.badge = document.getElementById('notificationBadge');
        this.list = document.getElementById('notificationsList');
    }

    /**
     * Vincula eventos aos elementos
     */
    bindEvents() {
        // Toggle do painel
        this.toggle.addEventListener('click', (e) => {
            e.stopPropagation();
            this.togglePanel();
        });

        // Fechar ao clicar fora
        document.addEventListener('click', (e) => {
            if (!this.container.contains(e.target) && this.isVisible) {
                this.hidePanel();
            }
        });

        // Prevenir fechamento ao clicar no painel
        this.panel.addEventListener('click', (e) => {
            e.stopPropagation();
        });

        // Tecla ESC para fechar
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && this.isVisible) {
                this.hidePanel();
            }
        });
    }

    /**
     * Inicia atualização automática das notificações
     */
    startAutoUpdate() {
        // Atualiza a cada 30 segundos
        this.updateInterval = setInterval(() => {
            this.loadNotifications();
        }, 30000);
    }

    /**
     * Para a atualização automática
     */
    stopAutoUpdate() {
        if (this.updateInterval) {
            clearInterval(this.updateInterval);
            this.updateInterval = null;
        }
    }

    /**
     * Carrega notificações do servidor
     */
    async loadNotifications() {
        try {
            const response = await fetch('/api/notifications');
            if (!response.ok) {
                throw new Error('Erro ao carregar notificações');
            }

            const data = await response.json();
            this.notifications = data.notifications || [];
            this.updateUI();
            this.updateSummary(data.summary);
        } catch (error) {
            console.error('❌ Erro ao carregar notificações:', error);
        }
    }

    /**
     * Atualiza a interface com as notificações
     */
    updateUI() {
        const totalNotifications = this.notifications.length;
        
        // Atualiza badge
        if (totalNotifications > 0) {
            this.badge.textContent = totalNotifications > 99 ? '99+' : totalNotifications;
            this.badge.style.display = 'flex';
            this.toggle.classList.add('has-notifications');
        } else {
            this.badge.style.display = 'none';
            this.toggle.classList.remove('has-notifications');
        }

        // Atualiza lista
        this.renderNotifications();
    }

    /**
     * Renderiza as notificações na lista
     */
    renderNotifications() {
        if (this.notifications.length === 0) {
            this.list.innerHTML = `
                <div class="notifications-empty">
                    <div class="notifications-empty-icon">
                        <i class="fas fa-bell-slash"></i>
                    </div>
                    <p class="notifications-empty-text">Nenhuma notificação no momento</p>
                </div>
            `;
            return;
        }

        const notificationsHTML = this.notifications.map(notification => {
            const icon = this.getNotificationIcon(notification.type, notification.severity);
            const timeAgo = this.formatTimeAgo(notification.createdAt);
            const actionLink = this.getActionLink(notification.type);

            // Informações específicas para pedidos entregues
            let additionalInfo = '';
            if (notification.type === 'order_delivered' && notification.data) {
                const { deliveredDate, deliveredTime, totalValue, totalItems } = notification.data;
                additionalInfo = `
                    <div class="notification-delivery-info">
                        <small class="text-muted">
                            <i class="fas fa-calendar-check"></i> ${deliveredDate} às ${deliveredTime}
                            ${totalValue ? ` • <i class="fas fa-dollar-sign"></i> R$ ${parseFloat(totalValue).toLocaleString('pt-BR', {minimumFractionDigits: 2})}` : ''}
                            ${totalItems ? ` • <i class="fas fa-box"></i> ${totalItems} ${totalItems === 1 ? 'item' : 'itens'}` : ''}
                        </small>
                    </div>
                `;
            }

            return `
                <div class="notification-item ${notification.severity}" data-id="${notification.id}">
                    <div class="notification-content">
                        <div class="notification-icon ${notification.severity}">
                            <i class="${icon}"></i>
                        </div>
                        <div class="notification-body">
                            <h6 class="notification-title">${notification.title}</h6>
                            <p class="notification-message">${notification.message}</p>
                            ${additionalInfo}
                            <div class="notification-meta">
                                <span class="notification-time">${timeAgo}</span>
                                ${actionLink ? `<a href="${actionLink}" class="notification-action">Ver detalhes</a>` : ''}
                            </div>
                        </div>
                    </div>
                </div>
            `;
        }).join('');

        this.list.innerHTML = notificationsHTML;

        // Adiciona eventos de clique
        this.list.querySelectorAll('.notification-item').forEach(item => {
            item.addEventListener('click', (e) => {
                const notificationId = item.dataset.id;
                this.markAsRead(notificationId);
            });
        });
    }

    /**
     * Atualiza o resumo de notificações por severidade
     */
    updateSummary(summary) {
        if (!summary) return;

        const severities = ['critical', 'high', 'medium', 'low'];
        
        severities.forEach(severity => {
            const element = document.getElementById(`${severity}Count`);
            const count = summary[severity] || 0;
            
            if (count > 0) {
                element.innerHTML = element.querySelector('i').outerHTML + ` ${count}`;
                element.style.display = 'inline-flex';
            } else {
                element.style.display = 'none';
            }
        });
    }

    /**
     * Obtém o ícone apropriado para o tipo e severidade da notificação
     */
    getNotificationIcon(type, severity) {
        const icons = {
            'low_stock': 'fas fa-box',
            'order_delay': 'fas fa-clock',
            'pending_orders': 'fas fa-clock',
            'quote_expiring': 'fas fa-calendar-times',
            'supplier_inactive': 'fas fa-user-times',
            'order_delivered': 'fas fa-check-circle',
            'system': 'fas fa-cog'
        };

        return icons[type] || 'fas fa-info-circle';
    }

    /**
     * Obtém o link de ação para o tipo de notificação
     */
    getActionLink(type) {
        const links = {
            'low_stock': '/products.html',
            'order_delay': '/orders.html',
            'pending_orders': '/orders.html',
            'quote_expiring': '/quotes.html',
            'supplier_inactive': '/suppliers.html',
            'order_delivered': '/orders.html'
        };

        return links[type] || null;
    }

    /**
     * Formata o tempo decorrido desde a criação da notificação
     */
    formatTimeAgo(dateString) {
        try {
            // Verifica se dateString existe e não é nulo/undefined
            if (!dateString) {
                return 'Agora mesmo';
            }

            const now = new Date();
            let date;

            // Tenta diferentes formatos de data
            if (typeof dateString === 'string') {
                // Se for uma string ISO, usa diretamente
                date = new Date(dateString);
            } else if (typeof dateString === 'number') {
                // Se for timestamp
                date = new Date(dateString);
            } else {
                // Se for um objeto Date
                date = new Date(dateString);
            }
            
            // Verifica se a data é válida
            if (isNaN(date.getTime())) {
                console.warn('Data inválida recebida:', dateString);
                return 'Agora mesmo';
            }

            // Verifica se a data não é no futuro (com margem de 1 minuto)
            if (date.getTime() > now.getTime() + 60000) {
                console.warn('Data no futuro detectada:', dateString);
                return 'Agora mesmo';
            }
            
            const diffInSeconds = Math.floor((now - date) / 1000);

            // Se a diferença for negativa ou muito pequena
            if (diffInSeconds < 0 || diffInSeconds < 60) {
                return 'Agora mesmo';
            } else if (diffInSeconds < 3600) {
                const minutes = Math.floor(diffInSeconds / 60);
                return `${minutes} min atrás`;
            } else if (diffInSeconds < 86400) {
                const hours = Math.floor(diffInSeconds / 3600);
                return `${hours}h atrás`;
            } else if (diffInSeconds < 2592000) { // 30 dias
                const days = Math.floor(diffInSeconds / 86400);
                return `${days}d atrás`;
            } else {
                // Para datas muito antigas, mostra a data formatada
                return date.toLocaleDateString('pt-BR', {
                    day: '2-digit',
                    month: '2-digit',
                    year: 'numeric'
                });
            }
        } catch (error) {
            console.error('Erro ao formatar data:', error, 'Data recebida:', dateString);
            return 'Agora mesmo';
        }
    }

    /**
     * Marca uma notificação como lida
     */
    async markAsRead(notificationId) {
        try {
            const response = await fetch(`/api/notifications/${notificationId}/read`, {
                method: 'POST'
            });

            if (response.ok) {
                // Remove a notificação da lista local
                this.notifications = this.notifications.filter(n => n.id !== notificationId);
                this.updateUI();
            }
        } catch (error) {
            console.error('Erro ao marcar notificação como lida:', error);
        }
    }

    /**
     * Mostra o painel de notificações
     */
    showPanel() {
        this.isVisible = true;
        this.container.classList.add('active');
        this.panel.classList.add('show');
        
        // Foca no painel para acessibilidade
        this.panel.setAttribute('tabindex', '-1');
        this.panel.focus();
    }

    /**
     * Esconde o painel de notificações
     */
    hidePanel() {
        this.isVisible = false;
        this.container.classList.remove('active');
        this.panel.classList.remove('show');
        this.panel.removeAttribute('tabindex');
    }

    /**
     * Alterna a visibilidade do painel
     */
    togglePanel() {
        if (this.isVisible) {
            this.hidePanel();
        } else {
            this.showPanel();
        }
    }

    /**
     * Adiciona uma nova notificação (para uso em tempo real)
     */
    addNotification(notification) {
        // Adiciona animação de nova notificação
        notification.isNew = true;
        this.notifications.unshift(notification);
        this.updateUI();

        // Remove a classe de nova após a animação
        setTimeout(() => {
            const element = this.list.querySelector(`[data-id="${notification.id}"]`);
            if (element) {
                element.classList.remove('new');
            }
        }, 500);
    }

    /**
     * Limpa todas as notificações
     */
    clearAll() {
        this.notifications = [];
        this.updateUI();
    }

    /**
     * Destrói o sistema de notificações
     */
    destroy() {
        this.stopAutoUpdate();
        if (this.container && this.container.parentNode) {
            this.container.parentNode.removeChild(this.container);
        }
    }
}

// Inicializa o sistema quando o DOM estiver pronto
document.addEventListener('DOMContentLoaded', () => {
    // Verifica se estamos em uma página que deve ter notificações
    const pagesWithNotifications = ['index.html', 'dashboard.html', 'products.html', 'orders.html', 'quotes.html', 'suppliers.html'];
    let currentPage = window.location.pathname.split('/').pop() || 'index.html';
    
    // Se a página atual está vazia (página raiz), considera como index.html
    if (currentPage === '' || currentPage === '/') {
        currentPage = 'index.html';
    }
    
    if (pagesWithNotifications.includes(currentPage) || window.location.pathname === '/' || window.location.pathname === '') {
        try {
            window.notificationSystem = new NotificationSystem();
        } catch (error) {
            console.error('❌ Erro ao inicializar sistema de notificações:', error);
        }
    }
});

// Exporta para uso global
window.NotificationSystem = NotificationSystem;