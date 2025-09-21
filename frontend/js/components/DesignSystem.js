/**
 * DesignSystem - Sistema de componentes reutilizáveis
 * Implementa componentes baseados nos design tokens para consistência visual
 */
class DesignSystem {
    constructor() {
        this.components = new Map();
        this.themes = new Map();
        this.currentTheme = 'light';
        
        this.init();
    }

    init() {
        this.registerDefaultComponents();
        this.setupThemeSystem();
        this.setupResponsiveHelpers();
        this.setupAccessibilityFeatures();
    }

    /**
     * Registra componentes padrão do sistema
     */
    registerDefaultComponents() {
        // Botões
        this.registerComponent('button', {
            template: this.createButtonTemplate(),
            styles: this.createButtonStyles(),
            variants: ['primary', 'secondary', 'success', 'warning', 'error', 'ghost', 'outline'],
            sizes: ['sm', 'base', 'lg', 'xl']
        });

        // Cards
        this.registerComponent('card', {
            template: this.createCardTemplate(),
            styles: this.createCardStyles(),
            variants: ['default', 'elevated', 'outlined', 'filled'],
            sizes: ['sm', 'base', 'lg']
        });

        // Inputs
        this.registerComponent('input', {
            template: this.createInputTemplate(),
            styles: this.createInputStyles(),
            variants: ['default', 'filled', 'outlined'],
            sizes: ['sm', 'base', 'lg'],
            states: ['default', 'focus', 'error', 'disabled']
        });

        // Badges
        this.registerComponent('badge', {
            template: this.createBadgeTemplate(),
            styles: this.createBadgeStyles(),
            variants: ['primary', 'secondary', 'success', 'warning', 'error', 'info'],
            sizes: ['sm', 'base', 'lg']
        });

        // Alerts
        this.registerComponent('alert', {
            template: this.createAlertTemplate(),
            styles: this.createAlertStyles(),
            variants: ['success', 'warning', 'error', 'info'],
            dismissible: true
        });

        // Loading
        this.registerComponent('loading', {
            template: this.createLoadingTemplate(),
            styles: this.createLoadingStyles(),
            variants: ['spinner', 'dots', 'pulse', 'skeleton'],
            sizes: ['sm', 'base', 'lg']
        });
    }

    /**
     * Registra um componente no sistema
     */
    registerComponent(name, config) {
        this.components.set(name, {
            ...config,
            name,
            instances: new Set()
        });
    }

    /**
     * Cria uma instância de componente
     */
    createComponent(name, options = {}) {
        const component = this.components.get(name);
        if (!component) {
            throw new Error(`Componente '${name}' não encontrado`);
        }

        const instance = new ComponentInstance(component, options);
        component.instances.add(instance);
        
        return instance;
    }

    /**
     * Templates de componentes
     */
    createButtonTemplate() {
        return `
            <button class="ds-button" type="{{type}}" {{#if disabled}}disabled{{/if}}>
                {{#if icon}}<i class="ds-button__icon {{icon}}"></i>{{/if}}
                {{#if text}}<span class="ds-button__text">{{text}}</span>{{/if}}
                {{#if loading}}<span class="ds-button__loading"></span>{{/if}}
            </button>
        `;
    }

    createCardTemplate() {
        return `
            <div class="ds-card">
                {{#if header}}
                <div class="ds-card__header">
                    {{#if title}}<h3 class="ds-card__title">{{title}}</h3>{{/if}}
                    {{#if subtitle}}<p class="ds-card__subtitle">{{subtitle}}</p>{{/if}}
                    {{#if actions}}<div class="ds-card__actions">{{actions}}</div>{{/if}}
                </div>
                {{/if}}
                {{#if image}}
                <div class="ds-card__image">
                    <img src="{{image.src}}" alt="{{image.alt}}" loading="lazy">
                </div>
                {{/if}}
                <div class="ds-card__body">
                    {{content}}
                </div>
                {{#if footer}}
                <div class="ds-card__footer">
                    {{footer}}
                </div>
                {{/if}}
            </div>
        `;
    }

    createInputTemplate() {
        return `
            <div class="ds-input-group">
                {{#if label}}
                <label class="ds-input__label" for="{{id}}">
                    {{label}}
                    {{#if required}}<span class="ds-input__required">*</span>{{/if}}
                </label>
                {{/if}}
                <div class="ds-input__wrapper">
                    {{#if prefix}}<span class="ds-input__prefix">{{prefix}}</span>{{/if}}
                    <input 
                        class="ds-input" 
                        type="{{type}}" 
                        id="{{id}}"
                        name="{{name}}"
                        placeholder="{{placeholder}}"
                        value="{{value}}"
                        {{#if disabled}}disabled{{/if}}
                        {{#if readonly}}readonly{{/if}}
                        {{#if required}}required{{/if}}
                    >
                    {{#if suffix}}<span class="ds-input__suffix">{{suffix}}</span>{{/if}}
                </div>
                {{#if helper}}<p class="ds-input__helper">{{helper}}</p>{{/if}}
                {{#if error}}<p class="ds-input__error">{{error}}</p>{{/if}}
            </div>
        `;
    }

    createBadgeTemplate() {
        return `
            <span class="ds-badge">
                {{#if icon}}<i class="ds-badge__icon {{icon}}"></i>{{/if}}
                {{text}}
                {{#if dismissible}}<button class="ds-badge__close" aria-label="Remover">×</button>{{/if}}
            </span>
        `;
    }

    createAlertTemplate() {
        return `
            <div class="ds-alert" role="alert">
                {{#if icon}}<i class="ds-alert__icon {{icon}}"></i>{{/if}}
                <div class="ds-alert__content">
                    {{#if title}}<h4 class="ds-alert__title">{{title}}</h4>{{/if}}
                    <p class="ds-alert__message">{{message}}</p>
                    {{#if actions}}<div class="ds-alert__actions">{{actions}}</div>{{/if}}
                </div>
                {{#if dismissible}}
                <button class="ds-alert__close" aria-label="Fechar alerta">
                    <i class="icon-close"></i>
                </button>
                {{/if}}
            </div>
        `;
    }

    createLoadingTemplate() {
        return `
            <div class="ds-loading" aria-label="Carregando...">
                {{#if variant === 'spinner'}}
                <div class="ds-loading__spinner"></div>
                {{/if}}
                {{#if variant === 'dots'}}
                <div class="ds-loading__dots">
                    <span></span><span></span><span></span>
                </div>
                {{/if}}
                {{#if variant === 'pulse'}}
                <div class="ds-loading__pulse"></div>
                {{/if}}
                {{#if variant === 'skeleton'}}
                <div class="ds-loading__skeleton">
                    <div class="ds-loading__skeleton-line"></div>
                    <div class="ds-loading__skeleton-line"></div>
                    <div class="ds-loading__skeleton-line"></div>
                </div>
                {{/if}}
                {{#if text}}<span class="ds-loading__text">{{text}}</span>{{/if}}
            </div>
        `;
    }

    /**
     * Estilos de componentes
     */
    createButtonStyles() {
        return `
            .ds-button {
                display: inline-flex;
                align-items: center;
                justify-content: center;
                gap: var(--space-2);
                padding: var(--space-2) var(--space-4);
                border: var(--border-width-1) solid transparent;
                border-radius: var(--border-radius-md);
                font-family: var(--font-family-sans);
                font-size: var(--font-size-sm);
                font-weight: var(--font-weight-medium);
                line-height: var(--line-height-none);
                text-decoration: none;
                cursor: pointer;
                transition: var(--transition-colors);
                user-select: none;
                white-space: nowrap;
            }

            .ds-button:focus {
                outline: 2px solid var(--color-primary-500);
                outline-offset: 2px;
            }

            .ds-button:disabled {
                opacity: 0.5;
                cursor: not-allowed;
            }

            /* Variantes */
            .ds-button--primary {
                background-color: var(--color-primary-500);
                color: var(--color-white);
            }

            .ds-button--primary:hover:not(:disabled) {
                background-color: var(--color-primary-600);
            }

            .ds-button--secondary {
                background-color: var(--color-secondary-100);
                color: var(--color-secondary-900);
            }

            .ds-button--secondary:hover:not(:disabled) {
                background-color: var(--color-secondary-200);
            }

            /* Tamanhos */
            .ds-button--sm {
                height: var(--button-height-sm);
                padding: var(--space-1) var(--space-3);
                font-size: var(--font-size-xs);
            }

            .ds-button--lg {
                height: var(--button-height-lg);
                padding: var(--space-3) var(--space-6);
                font-size: var(--font-size-base);
            }
        `;
    }

    createCardStyles() {
        return `
            .ds-card {
                background-color: var(--color-bg-primary);
                border: var(--border-width-1) solid var(--color-border-primary);
                border-radius: var(--border-radius-lg);
                overflow: hidden;
                transition: var(--transition-shadow);
            }

            .ds-card--elevated {
                box-shadow: var(--shadow-md);
            }

            .ds-card--elevated:hover {
                box-shadow: var(--shadow-lg);
            }

            .ds-card__header {
                padding: var(--card-padding-base);
                border-bottom: var(--border-width-1) solid var(--color-border-primary);
            }

            .ds-card__title {
                margin: 0;
                font-size: var(--font-size-lg);
                font-weight: var(--font-weight-semibold);
                color: var(--color-text-primary);
            }

            .ds-card__body {
                padding: var(--card-padding-base);
            }

            .ds-card__footer {
                padding: var(--card-padding-base);
                border-top: var(--border-width-1) solid var(--color-border-primary);
                background-color: var(--color-bg-secondary);
            }
        `;
    }

    createInputStyles() {
        return `
            .ds-input-group {
                display: flex;
                flex-direction: column;
                gap: var(--space-1);
            }

            .ds-input__label {
                font-size: var(--font-size-sm);
                font-weight: var(--font-weight-medium);
                color: var(--color-text-primary);
            }

            .ds-input__required {
                color: var(--color-error-500);
            }

            .ds-input {
                width: 100%;
                height: var(--input-height-base);
                padding: var(--space-2) var(--space-3);
                border: var(--border-width-1) solid var(--color-border-primary);
                border-radius: var(--border-radius-md);
                font-family: var(--font-family-sans);
                font-size: var(--font-size-sm);
                background-color: var(--color-bg-primary);
                color: var(--color-text-primary);
                transition: var(--transition-colors);
            }

            .ds-input:focus {
                outline: none;
                border-color: var(--color-primary-500);
                box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
            }

            .ds-input--error {
                border-color: var(--color-error-500);
            }

            .ds-input__error {
                font-size: var(--font-size-xs);
                color: var(--color-error-600);
                margin: 0;
            }
        `;
    }

    createBadgeStyles() {
        return `
            .ds-badge {
                display: inline-flex;
                align-items: center;
                gap: var(--space-1);
                padding: var(--space-1) var(--space-2);
                border-radius: var(--border-radius-full);
                font-size: var(--font-size-xs);
                font-weight: var(--font-weight-medium);
                line-height: var(--line-height-none);
            }

            .ds-badge--primary {
                background-color: var(--color-primary-100);
                color: var(--color-primary-800);
            }

            .ds-badge--success {
                background-color: var(--color-success-100);
                color: var(--color-success-800);
            }
        `;
    }

    createAlertStyles() {
        return `
            .ds-alert {
                display: flex;
                gap: var(--space-3);
                padding: var(--space-4);
                border-radius: var(--border-radius-md);
                border: var(--border-width-1) solid;
            }

            .ds-alert--success {
                background-color: var(--color-success-50);
                border-color: var(--color-success-200);
                color: var(--color-success-800);
            }

            .ds-alert--error {
                background-color: var(--color-error-50);
                border-color: var(--color-error-200);
                color: var(--color-error-800);
            }
        `;
    }

    createLoadingStyles() {
        return `
            .ds-loading {
                display: flex;
                align-items: center;
                justify-content: center;
                gap: var(--space-2);
            }

            .ds-loading__spinner {
                width: 1rem;
                height: 1rem;
                border: 2px solid var(--color-border-primary);
                border-top-color: var(--color-primary-500);
                border-radius: 50%;
                animation: spin 1s linear infinite;
            }

            @keyframes spin {
                to { transform: rotate(360deg); }
            }
        `;
    }

    /**
     * Sistema de temas
     */
    setupThemeSystem() {
        this.registerTheme('light', {
            name: 'Claro',
            colors: {
                background: 'var(--color-white)',
                surface: 'var(--color-secondary-50)',
                text: 'var(--color-secondary-900)'
            }
        });

        this.registerTheme('dark', {
            name: 'Escuro',
            colors: {
                background: 'var(--color-secondary-900)',
                surface: 'var(--color-secondary-800)',
                text: 'var(--color-white)'
            }
        });
    }

    registerTheme(name, config) {
        this.themes.set(name, config);
    }

    setTheme(themeName) {
        if (!this.themes.has(themeName)) {
            throw new Error(`Tema '${themeName}' não encontrado`);
        }

        this.currentTheme = themeName;
        document.documentElement.setAttribute('data-theme', themeName);
        
        // Dispara evento de mudança de tema
        window.dispatchEvent(new CustomEvent('themechange', {
            detail: { theme: themeName }
        }));
    }

    /**
     * Helpers responsivos
     */
    setupResponsiveHelpers() {
        this.breakpoints = {
            sm: 640,
            md: 768,
            lg: 1024,
            xl: 1280,
            '2xl': 1536
        };
    }

    /**
     * Recursos de acessibilidade
     */
    setupAccessibilityFeatures() {
        // Detecta preferências do usuário
        this.detectUserPreferences();
        
        // Setup de navegação por teclado
        this.setupKeyboardNavigation();
        
        // Setup de anúncios para leitores de tela
        this.setupScreenReaderAnnouncements();
    }

    detectUserPreferences() {
        // Tema preferido
        if (window.matchMedia('(prefers-color-scheme: dark)').matches) {
            this.setTheme('dark');
        }

        // Movimento reduzido
        if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
            document.documentElement.classList.add('reduce-motion');
        }

        // Alto contraste
        if (window.matchMedia('(prefers-contrast: high)').matches) {
            document.documentElement.classList.add('high-contrast');
        }
    }

    setupKeyboardNavigation() {
        document.addEventListener('keydown', (event) => {
            // Navegação por Tab melhorada
            if (event.key === 'Tab') {
                document.body.classList.add('keyboard-navigation');
            }
        });

        document.addEventListener('mousedown', () => {
            document.body.classList.remove('keyboard-navigation');
        });
    }

    setupScreenReaderAnnouncements() {
        // Cria região para anúncios
        const announcer = document.createElement('div');
        announcer.setAttribute('aria-live', 'polite');
        announcer.setAttribute('aria-atomic', 'true');
        announcer.className = 'sr-only';
        document.body.appendChild(announcer);

        this.announcer = announcer;
    }

    announce(message) {
        if (this.announcer) {
            this.announcer.textContent = message;
        }
    }

    /**
     * Utilitários
     */
    injectStyles() {
        const styleId = 'design-system-styles';
        
        if (document.getElementById(styleId)) {
            return;
        }

        const style = document.createElement('style');
        style.id = styleId;
        
        let css = '';
        this.components.forEach(component => {
            css += component.styles;
        });

        // Adiciona estilos de acessibilidade
        css += `
            .sr-only {
                position: absolute;
                width: 1px;
                height: 1px;
                padding: 0;
                margin: -1px;
                overflow: hidden;
                clip: rect(0, 0, 0, 0);
                white-space: nowrap;
                border: 0;
            }

            .keyboard-navigation *:focus {
                outline: 2px solid var(--color-primary-500);
                outline-offset: 2px;
            }

            @media (prefers-reduced-motion: reduce) {
                *, *::before, *::after {
                    animation-duration: 0.01ms !important;
                    animation-iteration-count: 1 !important;
                    transition-duration: 0.01ms !important;
                }
            }
        `;

        style.textContent = css;
        document.head.appendChild(style);
    }
}

/**
 * Instância de componente
 */
class ComponentInstance {
    constructor(component, options) {
        this.component = component;
        this.options = options;
        this.element = null;
        this.mounted = false;
        
        this.render();
    }

    render() {
        const template = this.component.template;
        const html = this.interpolateTemplate(template, this.options);
        
        const wrapper = document.createElement('div');
        wrapper.innerHTML = html;
        this.element = wrapper.firstElementChild;
        
        this.applyClasses();
        this.bindEvents();
    }

    interpolateTemplate(template, data) {
        return template.replace(/\{\{([^}]+)\}\}/g, (match, key) => {
            const value = this.getNestedValue(data, key.trim());
            return value !== undefined ? value : '';
        });
    }

    getNestedValue(obj, path) {
        return path.split('.').reduce((current, key) => {
            return current && current[key] !== undefined ? current[key] : undefined;
        }, obj);
    }

    applyClasses() {
        const { variant, size, state } = this.options;
        const baseName = `ds-${this.component.name}`;
        
        if (variant) {
            this.element.classList.add(`${baseName}--${variant}`);
        }
        
        if (size) {
            this.element.classList.add(`${baseName}--${size}`);
        }
        
        if (state) {
            this.element.classList.add(`${baseName}--${state}`);
        }
    }

    bindEvents() {
        const { onClick, onChange, onSubmit } = this.options;
        
        if (onClick) {
            this.element.addEventListener('click', onClick);
        }
        
        if (onChange) {
            this.element.addEventListener('change', onChange);
        }
        
        if (onSubmit) {
            this.element.addEventListener('submit', onSubmit);
        }
    }

    mount(container) {
        if (typeof container === 'string') {
            container = document.querySelector(container);
        }
        
        if (container) {
            container.appendChild(this.element);
            this.mounted = true;
        }
    }

    unmount() {
        if (this.element && this.element.parentNode) {
            this.element.parentNode.removeChild(this.element);
            this.mounted = false;
        }
    }

    update(newOptions) {
        this.options = { ...this.options, ...newOptions };
        this.render();
    }
}

// Instância global
window.DesignSystem = new DesignSystem();

// Export para uso em módulos
if (typeof module !== 'undefined' && module.exports) {
    module.exports = DesignSystem;
}