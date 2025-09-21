/**
 * Serviço de Notificações - Gerencia todas as notificações do sistema
 */

export class NotificationService {
    constructor() {
        this.container = null;
        this.notifications = new Map();
        this.defaultDuration = 5000; // 5 segundos
        this.maxNotifications = 5;
        this.position = 'top-right'; // top-right, top-left, bottom-right, bottom-left, top-center, bottom-center
        
        this.init();
    }

    /**
     * Inicializa o serviço de notificações
     */
    init() {
        this.createContainer();
        this.setupStyles();
    }

    /**
     * Cria o container das notificações
     */
    createContainer() {
        this.container = document.createElement('div');
        this.container.className = `notification-container notification-container--${this.position}`;
        this.container.setAttribute('aria-live', 'polite');
        this.container.setAttribute('aria-label', 'Notificações');
        document.body.appendChild(this.container);
    }

    /**
     * Adiciona estilos CSS necessários
     */
    setupStyles() {
        if (document.getElementById('notification-styles')) return;

        const style = document.createElement('style');
        style.id = 'notification-styles';
        style.textContent = `
            .notification-container {
                position: fixed;
                z-index: 9999;
                pointer-events: none;
                max-width: 400px;
                width: 100%;
            }

            .notification-container--top-right {
                top: var(--spacing-4, 1rem);
                right: var(--spacing-4, 1rem);
            }

            .notification-container--top-left {
                top: var(--spacing-4, 1rem);
                left: var(--spacing-4, 1rem);
            }

            .notification-container--bottom-right {
                bottom: var(--spacing-4, 1rem);
                right: var(--spacing-4, 1rem);
            }

            .notification-container--bottom-left {
                bottom: var(--spacing-4, 1rem);
                left: var(--spacing-4, 1rem);
            }

            .notification-container--top-center {
                top: var(--spacing-4, 1rem);
                left: 50%;
                transform: translateX(-50%);
            }

            .notification-container--bottom-center {
                bottom: var(--spacing-4, 1rem);
                left: 50%;
                transform: translateX(-50%);
            }

            .notification {
                pointer-events: auto;
                background: var(--color-surface, #ffffff);
                border: 1px solid var(--color-border, #e5e7eb);
                border-radius: var(--border-radius-lg, 8px);
                box-shadow: var(--shadow-lg, 0 10px 15px -3px rgba(0, 0, 0, 0.1));
                margin-bottom: var(--spacing-2, 0.5rem);
                padding: var(--spacing-4, 1rem);
                position: relative;
                transform: translateX(100%);
                transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
                max-width: 100%;
                word-wrap: break-word;
            }

            .notification--visible {
                transform: translateX(0);
            }

            .notification--success {
                border-left: 4px solid var(--color-success, #10b981);
                background-color: var(--color-success-light, #f0fdf4);
            }

            .notification--error {
                border-left: 4px solid var(--color-danger, #ef4444);
                background-color: var(--color-danger-light, #fef2f2);
            }

            .notification--warning {
                border-left: 4px solid var(--color-warning, #f59e0b);
                background-color: var(--color-warning-light, #fffbeb);
            }

            .notification--info {
                border-left: 4px solid var(--color-info, #3b82f6);
                background-color: var(--color-info-light, #eff6ff);
            }

            .notification__header {
                display: flex;
                align-items: flex-start;
                justify-content: space-between;
                margin-bottom: var(--spacing-2, 0.5rem);
            }

            .notification__icon {
                flex-shrink: 0;
                width: 20px;
                height: 20px;
                margin-right: var(--spacing-3, 0.75rem);
            }

            .notification__content {
                flex: 1;
                min-width: 0;
            }

            .notification__title {
                font-weight: 600;
                font-size: var(--font-size-sm, 0.875rem);
                line-height: 1.25;
                margin: 0 0 var(--spacing-1, 0.25rem) 0;
                color: var(--color-text-primary, #111827);
            }

            .notification__message {
                font-size: var(--font-size-sm, 0.875rem);
                line-height: 1.4;
                margin: 0;
                color: var(--color-text-secondary, #6b7280);
            }

            .notification__close {
                background: none;
                border: none;
                cursor: pointer;
                padding: var(--spacing-1, 0.25rem);
                margin: calc(var(--spacing-1, 0.25rem) * -1);
                border-radius: var(--border-radius, 4px);
                color: var(--color-text-tertiary, #9ca3af);
                transition: color 0.2s ease;
                flex-shrink: 0;
            }

            .notification__close:hover {
                color: var(--color-text-secondary, #6b7280);
            }

            .notification__close:focus {
                outline: 2px solid var(--color-primary, #3b82f6);
                outline-offset: 2px;
            }

            .notification__progress {
                position: absolute;
                bottom: 0;
                left: 0;
                height: 3px;
                background-color: var(--color-primary, #3b82f6);
                border-radius: 0 0 var(--border-radius-lg, 8px) var(--border-radius-lg, 8px);
                transition: width 0.1s linear;
            }

            .notification__actions {
                margin-top: var(--spacing-3, 0.75rem);
                display: flex;
                gap: var(--spacing-2, 0.5rem);
            }

            .notification__action {
                background: none;
                border: 1px solid var(--color-border, #e5e7eb);
                border-radius: var(--border-radius, 4px);
                padding: var(--spacing-1, 0.25rem) var(--spacing-3, 0.75rem);
                font-size: var(--font-size-xs, 0.75rem);
                font-weight: 500;
                cursor: pointer;
                transition: all 0.2s ease;
                color: var(--color-text-primary, #111827);
            }

            .notification__action:hover {
                background-color: var(--color-gray-50, #f9fafb);
            }

            .notification__action--primary {
                background-color: var(--color-primary, #3b82f6);
                border-color: var(--color-primary, #3b82f6);
                color: white;
            }

            .notification__action--primary:hover {
                background-color: var(--color-primary-dark, #2563eb);
            }

            /* Animações de entrada e saída */
            .notification-container--top-right .notification,
            .notification-container--bottom-right .notification {
                transform: translateX(100%);
            }

            .notification-container--top-left .notification,
            .notification-container--bottom-left .notification {
                transform: translateX(-100%);
            }

            .notification-container--top-center .notification,
            .notification-container--bottom-center .notification {
                transform: translateY(-100%);
            }

            .notification-container--bottom-center .notification {
                transform: translateY(100%);
            }

            /* Responsividade */
            @media (max-width: 640px) {
                .notification-container {
                    left: var(--spacing-4, 1rem) !important;
                    right: var(--spacing-4, 1rem) !important;
                    max-width: none;
                    transform: none !important;
                }

                .notification {
                    margin-bottom: var(--spacing-3, 0.75rem);
                }
            }

            /* Dark mode */
            @media (prefers-color-scheme: dark) {
                .notification {
                    background: var(--color-surface-dark, #1f2937);
                    border-color: var(--color-border-dark, #374151);
                    color: var(--color-text-primary-dark, #f9fafb);
                }

                .notification__title {
                    color: var(--color-text-primary-dark, #f9fafb);
                }

                .notification__message {
                    color: var(--color-text-secondary-dark, #d1d5db);
                }

                .notification__close {
                    color: var(--color-text-tertiary-dark, #9ca3af);
                }

                .notification__close:hover {
                    color: var(--color-text-secondary-dark, #d1d5db);
                }
            }

            /* Reduced motion */
            @media (prefers-reduced-motion: reduce) {
                .notification {
                    transition: none;
                }

                .notification__progress {
                    transition: none;
                }
            }
        `;
        document.head.appendChild(style);
    }

    /**
     * Mostra uma notificação
     */
    show(options = {}) {
        const {
            type = 'info',
            title,
            message,
            duration = this.defaultDuration,
            persistent = false,
            actions = [],
            icon,
            onClose,
            onClick
        } = options;

        // Validar parâmetros
        if (!title && !message) {
            console.warn('Notificação deve ter pelo menos um título ou mensagem');
            return null;
        }

        // Limitar número de notificações
        if (this.notifications.size >= this.maxNotifications) {
            const oldestId = this.notifications.keys().next().value;
            this.hide(oldestId);
        }

        // Criar ID único
        const id = `notification-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

        // Criar elemento da notificação
        const notification = this.createNotificationElement({
            id,
            type,
            title,
            message,
            actions,
            icon,
            persistent,
            onClose,
            onClick
        });

        // Adicionar ao container
        this.container.appendChild(notification);

        // Armazenar referência
        const notificationData = {
            id,
            element: notification,
            type,
            title,
            message,
            duration,
            persistent,
            onClose
        };

        this.notifications.set(id, notificationData);

        // Mostrar com animação
        requestAnimationFrame(() => {
            notification.classList.add('notification--visible');
        });

        // Configurar auto-hide se não for persistente
        if (!persistent && duration > 0) {
            this.setupAutoHide(id, duration);
        }

        // Emitir evento
        this.emit('show', notificationData);

        return id;
    }

    /**
     * Cria o elemento HTML da notificação
     */
    createNotificationElement(options) {
        const {
            id,
            type,
            title,
            message,
            actions,
            icon,
            persistent,
            onClose,
            onClick
        } = options;

        const notification = document.createElement('div');
        notification.className = `notification notification--${type}`;
        notification.setAttribute('role', 'alert');
        notification.setAttribute('aria-live', 'assertive');
        notification.id = id;

        // Adicionar click handler se fornecido
        if (onClick) {
            notification.style.cursor = 'pointer';
            notification.addEventListener('click', (e) => {
                if (!e.target.closest('.notification__close, .notification__action')) {
                    onClick(id);
                }
            });
        }

        let html = '<div class="notification__header">';

        // Ícone
        if (icon || this.getDefaultIcon(type)) {
            const iconSvg = icon || this.getDefaultIcon(type);
            html += `<div class="notification__icon">${iconSvg}</div>`;
        }

        // Conteúdo
        html += '<div class="notification__content">';
        
        if (title) {
            html += `<h4 class="notification__title">${this.escapeHtml(title)}</h4>`;
        }
        
        if (message) {
            html += `<p class="notification__message">${this.escapeHtml(message)}</p>`;
        }

        html += '</div>';

        // Botão de fechar
        html += `
            <button class="notification__close" aria-label="Fechar notificação" type="button">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <line x1="18" y1="6" x2="6" y2="18"></line>
                    <line x1="6" y1="6" x2="18" y2="18"></line>
                </svg>
            </button>
        `;

        html += '</div>';

        // Ações
        if (actions && actions.length > 0) {
            html += '<div class="notification__actions">';
            actions.forEach((action, index) => {
                const isPrimary = action.primary ? ' notification__action--primary' : '';
                html += `
                    <button class="notification__action${isPrimary}" data-action="${index}">
                        ${this.escapeHtml(action.label)}
                    </button>
                `;
            });
            html += '</div>';
        }

        // Barra de progresso para notificações temporárias
        if (!persistent) {
            html += '<div class="notification__progress"></div>';
        }

        notification.innerHTML = html;

        // Adicionar event listeners
        this.setupNotificationEvents(notification, id, actions, onClose);

        return notification;
    }

    /**
     * Configura eventos da notificação
     */
    setupNotificationEvents(notification, id, actions, onClose) {
        // Botão de fechar
        const closeBtn = notification.querySelector('.notification__close');
        closeBtn.addEventListener('click', () => {
            this.hide(id);
        });

        // Ações
        const actionBtns = notification.querySelectorAll('.notification__action');
        actionBtns.forEach((btn, index) => {
            btn.addEventListener('click', () => {
                const action = actions[index];
                if (action.handler) {
                    action.handler(id);
                }
                if (action.closeOnClick !== false) {
                    this.hide(id);
                }
            });
        });

        // Keyboard navigation
        notification.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') {
                this.hide(id);
            }
        });
    }

    /**
     * Configura auto-hide com barra de progresso
     */
    setupAutoHide(id, duration) {
        const notificationData = this.notifications.get(id);
        if (!notificationData) return;

        const progressBar = notificationData.element.querySelector('.notification__progress');
        let startTime = Date.now();
        let pausedTime = 0;
        let isPaused = false;

        const updateProgress = () => {
            if (!this.notifications.has(id)) return;

            const elapsed = Date.now() - startTime - pausedTime;
            const progress = Math.min((elapsed / duration) * 100, 100);

            if (progressBar) {
                progressBar.style.width = `${progress}%`;
            }

            if (progress >= 100) {
                this.hide(id);
            } else {
                requestAnimationFrame(updateProgress);
            }
        };

        // Pausar/retomar no hover
        notificationData.element.addEventListener('mouseenter', () => {
            if (!isPaused) {
                isPaused = true;
                pausedTime += Date.now() - startTime;
            }
        });

        notificationData.element.addEventListener('mouseleave', () => {
            if (isPaused) {
                isPaused = false;
                startTime = Date.now();
            }
        });

        requestAnimationFrame(updateProgress);
    }

    /**
     * Esconde uma notificação
     */
    hide(id) {
        const notificationData = this.notifications.get(id);
        if (!notificationData) return;

        const { element, onClose } = notificationData;

        // Remover classe de visibilidade
        element.classList.remove('notification--visible');

        // Aguardar animação e remover elemento
        setTimeout(() => {
            if (element.parentNode) {
                element.parentNode.removeChild(element);
            }
            this.notifications.delete(id);

            // Callback de fechamento
            if (onClose) {
                onClose(id);
            }

            // Emitir evento
            this.emit('hide', { id });
        }, 300);
    }

    /**
     * Métodos de conveniência para diferentes tipos
     */
    success(title, message, options = {}) {
        return this.show({ ...options, type: 'success', title, message });
    }

    error(title, message, options = {}) {
        return this.show({ ...options, type: 'error', title, message, persistent: true });
    }

    warning(title, message, options = {}) {
        return this.show({ ...options, type: 'warning', title, message });
    }

    info(title, message, options = {}) {
        return this.show({ ...options, type: 'info', title, message });
    }

    /**
     * Limpa todas as notificações
     */
    clear() {
        const ids = Array.from(this.notifications.keys());
        ids.forEach(id => this.hide(id));
    }

    /**
     * Obtém ícone padrão para cada tipo
     */
    getDefaultIcon(type) {
        const icons = {
            success: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M9 12l2 2 4-4"/>
                <circle cx="12" cy="12" r="10"/>
            </svg>`,
            error: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <circle cx="12" cy="12" r="10"/>
                <line x1="15" y1="9" x2="9" y2="15"/>
                <line x1="9" y1="9" x2="15" y2="15"/>
            </svg>`,
            warning: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/>
                <line x1="12" y1="9" x2="12" y2="13"/>
                <line x1="12" y1="17" x2="12.01" y2="17"/>
            </svg>`,
            info: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <circle cx="12" cy="12" r="10"/>
                <line x1="12" y1="16" x2="12" y2="12"/>
                <line x1="12" y1="8" x2="12.01" y2="8"/>
            </svg>`
        };

        return icons[type] || icons.info;
    }

    /**
     * Escapa HTML para prevenir XSS
     */
    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    /**
     * Sistema de eventos simples
     */
    emit(event, data) {
        const customEvent = new CustomEvent(`notification:${event}`, {
            detail: data
        });
        document.dispatchEvent(customEvent);
    }

    /**
     * Configura posição das notificações
     */
    setPosition(position) {
        const validPositions = [
            'top-right', 'top-left', 'bottom-right', 
            'bottom-left', 'top-center', 'bottom-center'
        ];

        if (!validPositions.includes(position)) {
            console.warn(`Posição inválida: ${position}`);
            return;
        }

        this.position = position;
        this.container.className = `notification-container notification-container--${position}`;
    }

    /**
     * Destruir serviço
     */
    destroy() {
        this.clear();
        if (this.container && this.container.parentNode) {
            this.container.parentNode.removeChild(this.container);
        }
        
        const styles = document.getElementById('notification-styles');
        if (styles) {
            styles.remove();
        }
    }
}