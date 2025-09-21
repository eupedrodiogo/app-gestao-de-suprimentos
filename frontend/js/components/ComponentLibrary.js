/**
 * ComponentLibrary - Biblioteca de componentes reutilizáveis
 * Fornece componentes prontos para uso com acessibilidade e design system integrados
 */
class ComponentLibrary {
    constructor() {
        this.components = new Map();
        this.templates = new Map();
        this.instances = new WeakMap();
        
        this.init();
    }

    init() {
        this.registerDefaultComponents();
        this.setupEventDelegation();
        this.autoInitializeComponents();
    }

    /**
     * Registra componentes padrão
     */
    registerDefaultComponents() {
        // Botões
        this.register('button', {
            template: this.createButtonTemplate(),
            init: this.initButton.bind(this),
            destroy: this.destroyButton.bind(this)
        });

        // Cards
        this.register('card', {
            template: this.createCardTemplate(),
            init: this.initCard.bind(this),
            destroy: this.destroyCard.bind(this)
        });

        // Inputs
        this.register('input', {
            template: this.createInputTemplate(),
            init: this.initInput.bind(this),
            destroy: this.destroyInput.bind(this)
        });

        // Dropdowns
        this.register('dropdown', {
            template: this.createDropdownTemplate(),
            init: this.initDropdown.bind(this),
            destroy: this.destroyDropdown.bind(this)
        });

        // Tabs
        this.register('tabs', {
            template: this.createTabsTemplate(),
            init: this.initTabs.bind(this),
            destroy: this.destroyTabs.bind(this)
        });

        // Accordion
        this.register('accordion', {
            template: this.createAccordionTemplate(),
            init: this.initAccordion.bind(this),
            destroy: this.destroyAccordion.bind(this)
        });

        // Progress
        this.register('progress', {
            template: this.createProgressTemplate(),
            init: this.initProgress.bind(this),
            destroy: this.destroyProgress.bind(this)
        });

        // Badge
        this.register('badge', {
            template: this.createBadgeTemplate(),
            init: this.initBadge.bind(this),
            destroy: this.destroyBadge.bind(this)
        });

        // Toast
        this.register('toast', {
            template: this.createToastTemplate(),
            init: this.initToast.bind(this),
            destroy: this.destroyToast.bind(this)
        });
    }

    /**
     * Registra um novo componente
     */
    register(name, config) {
        this.components.set(name, {
            template: config.template,
            init: config.init || (() => {}),
            destroy: config.destroy || (() => {}),
            defaults: config.defaults || {}
        });
    }

    /**
     * Cria uma instância de componente
     */
    create(name, options = {}) {
        const component = this.components.get(name);
        if (!component) {
            throw new Error(`Componente '${name}' não encontrado`);
        }

        const config = { ...component.defaults, ...options };
        const element = this.createElementFromTemplate(component.template, config);
        
        // Inicializa o componente
        const instance = component.init(element, config);
        this.instances.set(element, { name, instance, config });

        return element;
    }

    /**
     * Destrói uma instância de componente
     */
    destroy(element) {
        const componentData = this.instances.get(element);
        if (componentData) {
            const component = this.components.get(componentData.name);
            if (component && component.destroy) {
                component.destroy(element, componentData.instance);
            }
            this.instances.delete(element);
        }
    }

    /**
     * Templates de componentes
     */
    createButtonTemplate() {
        return `
            <button 
                class="btn {{variant}} {{size}} {{className}}"
                type="{{type}}"
                {{#disabled}}disabled{{/disabled}}
                {{#ariaLabel}}aria-label="{{ariaLabel}}"{{/ariaLabel}}
                {{#ariaDescribedBy}}aria-describedby="{{ariaDescribedBy}}"{{/ariaDescribedBy}}
            >
                {{#icon}}<i class="{{icon}}" aria-hidden="true"></i>{{/icon}}
                {{#text}}<span>{{text}}</span>{{/text}}
                {{#loading}}<span class="btn__spinner" aria-hidden="true"></span>{{/loading}}
            </button>
        `;
    }

    createCardTemplate() {
        return `
            <div class="card {{variant}} {{className}}" {{#role}}role="{{role}}"{{/role}}>
                {{#header}}
                <div class="card__header">
                    {{#title}}<h3 class="card__title">{{title}}</h3>{{/title}}
                    {{#actions}}<div class="card__actions">{{actions}}</div>{{/actions}}
                </div>
                {{/header}}
                {{#image}}
                <div class="card__image">
                    <img src="{{image.src}}" alt="{{image.alt}}" loading="lazy">
                </div>
                {{/image}}
                <div class="card__content">
                    {{content}}
                </div>
                {{#footer}}
                <div class="card__footer">
                    {{footer}}
                </div>
                {{/footer}}
            </div>
        `;
    }

    createInputTemplate() {
        return `
            <div class="input-group {{className}}">
                {{#label}}
                <label for="{{id}}" class="input__label {{#required}}required{{/required}}">
                    {{label}}
                    {{#required}}<span aria-label="obrigatório">*</span>{{/required}}
                </label>
                {{/label}}
                <div class="input__wrapper">
                    {{#prefix}}<span class="input__prefix">{{prefix}}</span>{{/prefix}}
                    <input
                        id="{{id}}"
                        name="{{name}}"
                        type="{{type}}"
                        class="input {{size}} {{#error}}error{{/error}}"
                        placeholder="{{placeholder}}"
                        value="{{value}}"
                        {{#required}}required{{/required}}
                        {{#disabled}}disabled{{/disabled}}
                        {{#readonly}}readonly{{/readonly}}
                        {{#ariaDescribedBy}}aria-describedby="{{ariaDescribedBy}}"{{/ariaDescribedBy}}
                        {{#ariaInvalid}}aria-invalid="{{ariaInvalid}}"{{/ariaInvalid}}
                    >
                    {{#suffix}}<span class="input__suffix">{{suffix}}</span>{{/suffix}}
                </div>
                {{#help}}
                <div id="{{id}}-help" class="input__help">{{help}}</div>
                {{/help}}
                {{#error}}
                <div id="{{id}}-error" class="input__error" role="alert">{{error}}</div>
                {{/error}}
            </div>
        `;
    }

    createDropdownTemplate() {
        return `
            <div class="dropdown {{className}}" data-dropdown>
                <button
                    class="dropdown__trigger"
                    aria-expanded="false"
                    aria-haspopup="true"
                    {{#ariaLabel}}aria-label="{{ariaLabel}}"{{/ariaLabel}}
                >
                    {{trigger}}
                    <i class="dropdown__arrow" aria-hidden="true"></i>
                </button>
                <div class="dropdown__menu" role="menu" aria-hidden="true">
                    {{#items}}
                    <div class="dropdown__item" role="menuitem" tabindex="-1">
                        {{#href}}<a href="{{href}}">{{text}}</a>{{/href}}
                        {{^href}}{{text}}{{/href}}
                    </div>
                    {{/items}}
                </div>
            </div>
        `;
    }

    createTabsTemplate() {
        return `
            <div class="tabs {{className}}" data-tabs>
                <div class="tabs__list" role="tablist" aria-label="{{ariaLabel}}">
                    {{#tabs}}
                    <button
                        class="tabs__tab"
                        role="tab"
                        aria-selected="{{#active}}true{{/active}}{{^active}}false{{/active}}"
                        aria-controls="{{panelId}}"
                        id="{{tabId}}"
                        tabindex="{{#active}}0{{/active}}{{^active}}-1{{/active}}"
                    >
                        {{label}}
                    </button>
                    {{/tabs}}
                </div>
                {{#tabs}}
                <div
                    class="tabs__panel"
                    role="tabpanel"
                    aria-labelledby="{{tabId}}"
                    id="{{panelId}}"
                    {{^active}}hidden{{/active}}
                >
                    {{content}}
                </div>
                {{/tabs}}
            </div>
        `;
    }

    createAccordionTemplate() {
        return `
            <div class="accordion {{className}}" data-accordion>
                {{#items}}
                <div class="accordion__item">
                    <button
                        class="accordion__trigger"
                        aria-expanded="{{#expanded}}true{{/expanded}}{{^expanded}}false{{/expanded}}"
                        aria-controls="{{contentId}}"
                        id="{{triggerId}}"
                    >
                        {{title}}
                        <i class="accordion__icon" aria-hidden="true"></i>
                    </button>
                    <div
                        class="accordion__content"
                        role="region"
                        aria-labelledby="{{triggerId}}"
                        id="{{contentId}}"
                        {{^expanded}}hidden{{/expanded}}
                    >
                        {{content}}
                    </div>
                </div>
                {{/items}}
            </div>
        `;
    }

    createProgressTemplate() {
        return `
            <div class="progress {{className}}" role="progressbar" 
                 aria-valuenow="{{value}}" 
                 aria-valuemin="{{min}}" 
                 aria-valuemax="{{max}}"
                 {{#ariaLabel}}aria-label="{{ariaLabel}}"{{/ariaLabel}}>
                <div class="progress__track">
                    <div class="progress__fill" style="width: {{percentage}}%"></div>
                </div>
                {{#showValue}}
                <div class="progress__value">{{value}}{{#unit}}{{unit}}{{/unit}}</div>
                {{/showValue}}
            </div>
        `;
    }

    createBadgeTemplate() {
        return `
            <span class="badge {{variant}} {{size}} {{className}}" 
                  {{#role}}role="{{role}}"{{/role}}
                  {{#ariaLabel}}aria-label="{{ariaLabel}}"{{/ariaLabel}}>
                {{#icon}}<i class="{{icon}}" aria-hidden="true"></i>{{/icon}}
                {{text}}
                {{#dismissible}}
                <button class="badge__close" aria-label="Remover">
                    <i class="icon-close" aria-hidden="true"></i>
                </button>
                {{/dismissible}}
            </span>
        `;
    }

    createToastTemplate() {
        return `
            <div class="toast {{variant}} {{className}}" role="alert" aria-live="assertive">
                {{#icon}}<i class="{{icon}}" aria-hidden="true"></i>{{/icon}}
                <div class="toast__content">
                    {{#title}}<div class="toast__title">{{title}}</div>{{/title}}
                    <div class="toast__message">{{message}}</div>
                </div>
                {{#dismissible}}
                <button class="toast__close" aria-label="Fechar notificação">
                    <i class="icon-close" aria-hidden="true"></i>
                </button>
                {{/dismissible}}
            </div>
        `;
    }

    /**
     * Inicializadores de componentes
     */
    initButton(element, config) {
        const instance = {
            element,
            config,
            
            setLoading(loading) {
                element.classList.toggle('loading', loading);
                element.disabled = loading;
                
                const spinner = element.querySelector('.btn__spinner');
                if (loading && !spinner) {
                    const spinnerEl = document.createElement('span');
                    spinnerEl.className = 'btn__spinner';
                    spinnerEl.setAttribute('aria-hidden', 'true');
                    element.appendChild(spinnerEl);
                } else if (!loading && spinner) {
                    spinner.remove();
                }
            },
            
            setText(text) {
                const textEl = element.querySelector('span:not(.btn__spinner)');
                if (textEl) {
                    textEl.textContent = text;
                }
            }
        };

        // Event listeners
        if (config.onClick) {
            element.addEventListener('click', config.onClick);
        }

        return instance;
    }

    initCard(element, config) {
        const instance = {
            element,
            config,
            
            updateContent(content) {
                const contentEl = element.querySelector('.card__content');
                if (contentEl) {
                    contentEl.innerHTML = content;
                }
            }
        };

        return instance;
    }

    initInput(element, config) {
        const input = element.querySelector('input');
        const instance = {
            element,
            input,
            config,
            
            getValue() {
                return input.value;
            },
            
            setValue(value) {
                input.value = value;
                this.validate();
            },
            
            setError(error) {
                const errorEl = element.querySelector('.input__error');
                if (errorEl) {
                    errorEl.textContent = error;
                    input.setAttribute('aria-invalid', 'true');
                    input.setAttribute('aria-describedby', errorEl.id);
                }
                element.classList.add('has-error');
            },
            
            clearError() {
                const errorEl = element.querySelector('.input__error');
                if (errorEl) {
                    errorEl.textContent = '';
                    input.removeAttribute('aria-invalid');
                }
                element.classList.remove('has-error');
            },
            
            validate() {
                if (config.validator) {
                    const result = config.validator(input.value);
                    if (result.valid) {
                        this.clearError();
                    } else {
                        this.setError(result.message);
                    }
                    return result.valid;
                }
                return true;
            }
        };

        // Event listeners
        input.addEventListener('input', () => {
            instance.validate();
            if (config.onInput) {
                config.onInput(input.value);
            }
        });

        input.addEventListener('blur', () => {
            instance.validate();
            if (config.onBlur) {
                config.onBlur(input.value);
            }
        });

        return instance;
    }

    initDropdown(element, config) {
        const trigger = element.querySelector('.dropdown__trigger');
        const menu = element.querySelector('.dropdown__menu');
        const items = element.querySelectorAll('.dropdown__item');

        const instance = {
            element,
            trigger,
            menu,
            isOpen: false,
            
            open() {
                this.isOpen = true;
                trigger.setAttribute('aria-expanded', 'true');
                menu.setAttribute('aria-hidden', 'false');
                element.classList.add('is-open');
                
                // Foca no primeiro item
                const firstItem = items[0];
                if (firstItem) {
                    firstItem.focus();
                }
            },
            
            close() {
                this.isOpen = false;
                trigger.setAttribute('aria-expanded', 'false');
                menu.setAttribute('aria-hidden', 'true');
                element.classList.remove('is-open');
                trigger.focus();
            },
            
            toggle() {
                if (this.isOpen) {
                    this.close();
                } else {
                    this.open();
                }
            }
        };

        // Event listeners
        trigger.addEventListener('click', () => instance.toggle());
        
        // Navegação por teclado
        element.addEventListener('keydown', (event) => {
            if (event.key === 'Escape') {
                instance.close();
            } else if (event.key === 'ArrowDown' && !instance.isOpen) {
                instance.open();
            }
        });

        // Fecha ao clicar fora
        document.addEventListener('click', (event) => {
            if (!element.contains(event.target)) {
                instance.close();
            }
        });

        return instance;
    }

    initTabs(element, config) {
        const tabList = element.querySelector('.tabs__list');
        const tabs = element.querySelectorAll('.tabs__tab');
        const panels = element.querySelectorAll('.tabs__panel');

        const instance = {
            element,
            tabs: Array.from(tabs),
            panels: Array.from(panels),
            activeIndex: 0,
            
            setActiveTab(index) {
                // Remove active state from all tabs and panels
                this.tabs.forEach((tab, i) => {
                    tab.setAttribute('aria-selected', 'false');
                    tab.setAttribute('tabindex', '-1');
                    this.panels[i].hidden = true;
                });
                
                // Set active state
                this.tabs[index].setAttribute('aria-selected', 'true');
                this.tabs[index].setAttribute('tabindex', '0');
                this.panels[index].hidden = false;
                this.activeIndex = index;
                
                if (config.onTabChange) {
                    config.onTabChange(index);
                }
            }
        };

        // Event listeners
        tabs.forEach((tab, index) => {
            tab.addEventListener('click', () => {
                instance.setActiveTab(index);
                tab.focus();
            });
        });

        // Navegação por teclado
        tabList.addEventListener('keydown', (event) => {
            const { key } = event;
            let newIndex = instance.activeIndex;
            
            if (key === 'ArrowLeft') {
                newIndex = (instance.activeIndex - 1 + tabs.length) % tabs.length;
            } else if (key === 'ArrowRight') {
                newIndex = (instance.activeIndex + 1) % tabs.length;
            } else if (key === 'Home') {
                newIndex = 0;
            } else if (key === 'End') {
                newIndex = tabs.length - 1;
            }
            
            if (newIndex !== instance.activeIndex) {
                event.preventDefault();
                instance.setActiveTab(newIndex);
                tabs[newIndex].focus();
            }
        });

        return instance;
    }

    initAccordion(element, config) {
        const triggers = element.querySelectorAll('.accordion__trigger');
        const contents = element.querySelectorAll('.accordion__content');

        const instance = {
            element,
            triggers: Array.from(triggers),
            contents: Array.from(contents),
            
            toggle(index) {
                const trigger = this.triggers[index];
                const content = this.contents[index];
                const isExpanded = trigger.getAttribute('aria-expanded') === 'true';
                
                trigger.setAttribute('aria-expanded', !isExpanded);
                content.hidden = isExpanded;
                
                if (config.onToggle) {
                    config.onToggle(index, !isExpanded);
                }
            },
            
            expand(index) {
                const trigger = this.triggers[index];
                const content = this.contents[index];
                
                trigger.setAttribute('aria-expanded', 'true');
                content.hidden = false;
            },
            
            collapse(index) {
                const trigger = this.triggers[index];
                const content = this.contents[index];
                
                trigger.setAttribute('aria-expanded', 'false');
                content.hidden = true;
            }
        };

        // Event listeners
        triggers.forEach((trigger, index) => {
            trigger.addEventListener('click', () => {
                instance.toggle(index);
            });
        });

        return instance;
    }

    initProgress(element, config) {
        const fill = element.querySelector('.progress__fill');
        const valueEl = element.querySelector('.progress__value');

        const instance = {
            element,
            fill,
            valueEl,
            
            setValue(value) {
                const percentage = ((value - config.min) / (config.max - config.min)) * 100;
                
                element.setAttribute('aria-valuenow', value);
                fill.style.width = `${percentage}%`;
                
                if (valueEl) {
                    valueEl.textContent = `${value}${config.unit || ''}`;
                }
            }
        };

        return instance;
    }

    initBadge(element, config) {
        const closeBtn = element.querySelector('.badge__close');

        const instance = {
            element,
            
            remove() {
                element.remove();
                if (config.onRemove) {
                    config.onRemove();
                }
            }
        };

        if (closeBtn) {
            closeBtn.addEventListener('click', () => {
                instance.remove();
            });
        }

        return instance;
    }

    initToast(element, config) {
        const closeBtn = element.querySelector('.toast__close');

        const instance = {
            element,
            
            show() {
                element.classList.add('show');
                
                if (config.autoHide !== false) {
                    setTimeout(() => {
                        this.hide();
                    }, config.duration || 5000);
                }
            },
            
            hide() {
                element.classList.remove('show');
                setTimeout(() => {
                    element.remove();
                    if (config.onHide) {
                        config.onHide();
                    }
                }, 300);
            }
        };

        if (closeBtn) {
            closeBtn.addEventListener('click', () => {
                instance.hide();
            });
        }

        // Auto show
        setTimeout(() => instance.show(), 100);

        return instance;
    }

    /**
     * Utilitários
     */
    createElementFromTemplate(template, data) {
        const compiled = this.compileTemplate(template, data);
        const wrapper = document.createElement('div');
        wrapper.innerHTML = compiled.trim();
        return wrapper.firstChild;
    }

    compileTemplate(template, data) {
        return template.replace(/\{\{(.*?)\}\}/g, (match, key) => {
            const keys = key.trim().split('.');
            let value = data;
            
            for (const k of keys) {
                if (k.startsWith('#')) {
                    // Block helper
                    const prop = k.substring(1);
                    return data[prop] ? '' : '<!--';
                } else if (k.startsWith('/')) {
                    // End block
                    return '-->';
                } else if (k.startsWith('^')) {
                    // Inverted block
                    const prop = k.substring(1);
                    return !data[prop] ? '' : '<!--';
                } else {
                    value = value?.[k];
                }
            }
            
            return value || '';
        });
    }

    setupEventDelegation() {
        // Event delegation para componentes dinâmicos
        document.addEventListener('click', (event) => {
            const target = event.target.closest('[data-component]');
            if (target) {
                const componentName = target.dataset.component;
                const action = target.dataset.action;
                
                if (action && this.components.has(componentName)) {
                    this.handleComponentAction(target, componentName, action, event);
                }
            }
        });
    }

    handleComponentAction(element, componentName, action, event) {
        const componentData = this.instances.get(element);
        if (componentData && componentData.instance[action]) {
            componentData.instance[action](event);
        }
    }

    autoInitializeComponents() {
        // Auto-inicializa componentes com atributo data-component
        document.querySelectorAll('[data-component]').forEach(element => {
            const componentName = element.dataset.component;
            if (this.components.has(componentName) && !this.instances.has(element)) {
                const config = JSON.parse(element.dataset.config || '{}');
                const component = this.components.get(componentName);
                const instance = component.init(element, config);
                this.instances.set(element, { name: componentName, instance, config });
            }
        });
    }

    /**
     * Métodos de conveniência para criação rápida
     */
    button(text, options = {}) {
        return this.create('button', { text, ...options });
    }

    card(content, options = {}) {
        return this.create('card', { content, ...options });
    }

    input(type, options = {}) {
        return this.create('input', { type, ...options });
    }

    toast(message, options = {}) {
        const toast = this.create('toast', { message, ...options });
        document.body.appendChild(toast);
        return toast;
    }

    // Métodos de destruição
    destroyButton() {}
    destroyCard() {}
    destroyInput() {}
    destroyDropdown() {}
    destroyTabs() {}
    destroyAccordion() {}
    destroyProgress() {}
    destroyBadge() {}
    destroyToast() {}
}

// Instância global
window.ComponentLibrary = new ComponentLibrary();

// Export para uso em módulos
if (typeof module !== 'undefined' && module.exports) {
    module.exports = ComponentLibrary;
}