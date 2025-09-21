/**
 * Componente Modal - Modal reutilizável com funcionalidades avançadas
 */

export class Modal {
    constructor(options = {}) {
        this.options = {
            // Configurações básicas
            title: '',
            content: '',
            size: 'medium', // small, medium, large, fullscreen
            
            // Comportamento
            backdrop: true, // true, false, 'static'
            keyboard: true, // Fechar com ESC
            focus: true, // Focar no modal ao abrir
            show: false, // Mostrar automaticamente
            
            // Botões
            showCloseButton: true,
            buttons: [], // Array de objetos { text, class, action, disabled }
            
            // Classes CSS
            modalClass: '',
            headerClass: '',
            bodyClass: '',
            footerClass: '',
            
            // Callbacks
            onShow: null,
            onShown: null,
            onHide: null,
            onHidden: null,
            
            // Configurações avançadas
            animation: true,
            centered: false,
            scrollable: false,
            
            ...options
        };

        this.state = {
            isVisible: false,
            isAnimating: false,
            previousActiveElement: null,
            focusableElements: []
        };

        this.modal = null;
        this.backdrop = null;
        
        this.init();
    }

    /**
     * Inicializa o modal
     */
    init() {
        this.createModal();
        this.setupEventListeners();
        
        if (this.options.show) {
            this.show();
        }
    }

    /**
     * Cria a estrutura do modal
     */
    createModal() {
        // Criar backdrop
        this.backdrop = document.createElement('div');
        this.backdrop.className = 'modal-backdrop';
        
        // Criar modal
        this.modal = document.createElement('div');
        this.modal.className = this.getModalClasses();
        this.modal.setAttribute('role', 'dialog');
        this.modal.setAttribute('aria-modal', 'true');
        this.modal.setAttribute('tabindex', '-1');
        
        if (this.options.title) {
            this.modal.setAttribute('aria-labelledby', 'modal-title');
        }
        
        this.modal.innerHTML = this.renderModal();
        
        // Adicionar ao DOM
        document.body.appendChild(this.backdrop);
        document.body.appendChild(this.modal);
        
        // Cachear elementos focáveis
        this.updateFocusableElements();
    }

    /**
     * Retorna as classes CSS do modal
     */
    getModalClasses() {
        const classes = ['modal'];
        
        if (this.options.size) {
            classes.push(`modal--${this.options.size}`);
        }
        
        if (this.options.centered) {
            classes.push('modal--centered');
        }
        
        if (this.options.scrollable) {
            classes.push('modal--scrollable');
        }
        
        if (this.options.animation) {
            classes.push('modal--animated');
        }
        
        if (this.options.modalClass) {
            classes.push(this.options.modalClass);
        }
        
        return classes.join(' ');
    }

    /**
     * Renderiza o conteúdo do modal
     */
    renderModal() {
        return `
            <div class="modal__dialog">
                <div class="modal__content">
                    ${this.renderHeader()}
                    ${this.renderBody()}
                    ${this.renderFooter()}
                </div>
            </div>
        `;
    }

    /**
     * Renderiza o cabeçalho do modal
     */
    renderHeader() {
        if (!this.options.title && !this.options.showCloseButton) {
            return '';
        }

        const headerClass = `modal__header ${this.options.headerClass || ''}`.trim();
        
        return `
            <div class="${headerClass}">
                ${this.options.title ? `
                    <h2 class="modal__title" id="modal-title">
                        ${this.options.title}
                    </h2>
                ` : ''}
                
                ${this.options.showCloseButton ? `
                    <button 
                        type="button" 
                        class="modal__close" 
                        aria-label="Fechar modal"
                        data-action="close"
                    >
                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <line x1="18" y1="6" x2="6" y2="18"></line>
                            <line x1="6" y1="6" x2="18" y2="18"></line>
                        </svg>
                    </button>
                ` : ''}
            </div>
        `;
    }

    /**
     * Renderiza o corpo do modal
     */
    renderBody() {
        const bodyClass = `modal__body ${this.options.bodyClass || ''}`.trim();
        
        return `
            <div class="${bodyClass}">
                ${this.options.content}
            </div>
        `;
    }

    /**
     * Renderiza o rodapé do modal
     */
    renderFooter() {
        if (!this.options.buttons || this.options.buttons.length === 0) {
            return '';
        }

        const footerClass = `modal__footer ${this.options.footerClass || ''}`.trim();
        
        const buttons = this.options.buttons.map(button => {
            const buttonClass = `btn ${button.class || 'btn--secondary'}`;
            const disabled = button.disabled ? 'disabled' : '';
            
            return `
                <button 
                    type="button" 
                    class="${buttonClass}" 
                    data-action="${button.action || 'custom'}"
                    data-button-key="${button.key || ''}"
                    ${disabled}
                >
                    ${button.text}
                </button>
            `;
        }).join('');

        return `
            <div class="${footerClass}">
                ${buttons}
            </div>
        `;
    }

    /**
     * Configura event listeners
     */
    setupEventListeners() {
        // Clique no backdrop
        this.backdrop.addEventListener('click', (e) => {
            if (this.options.backdrop === true) {
                this.hide();
            }
        });

        // Clique nos botões
        this.modal.addEventListener('click', (e) => {
            const button = e.target.closest('[data-action]');
            if (!button) return;

            const action = button.dataset.action;
            const buttonKey = button.dataset.buttonKey;

            switch (action) {
                case 'close':
                    this.hide();
                    break;
                case 'custom':
                    this.handleButtonClick(buttonKey, button);
                    break;
                default:
                    this.handleButtonClick(action, button);
                    break;
            }
        });

        // Teclas do teclado
        document.addEventListener('keydown', (e) => {
            if (!this.state.isVisible) return;

            switch (e.key) {
                case 'Escape':
                    if (this.options.keyboard) {
                        e.preventDefault();
                        this.hide();
                    }
                    break;
                case 'Tab':
                    this.handleTabKey(e);
                    break;
            }
        });

        // Redimensionamento da janela
        window.addEventListener('resize', () => {
            if (this.state.isVisible) {
                this.adjustPosition();
            }
        });
    }

    /**
     * Manipula clique em botões
     */
    handleButtonClick(action, button) {
        const buttonConfig = this.options.buttons.find(b => 
            b.key === action || b.action === action
        );

        if (buttonConfig && buttonConfig.handler) {
            const result = buttonConfig.handler(this);
            
            // Se o handler retornar false, não fecha o modal
            if (result !== false && buttonConfig.closeModal !== false) {
                this.hide();
            }
        }

        this.emit('buttonClick', { action, button, modal: this });
    }

    /**
     * Manipula navegação por Tab
     */
    handleTabKey(e) {
        if (this.state.focusableElements.length === 0) return;

        const firstElement = this.state.focusableElements[0];
        const lastElement = this.state.focusableElements[this.state.focusableElements.length - 1];

        if (e.shiftKey) {
            // Shift + Tab
            if (document.activeElement === firstElement) {
                e.preventDefault();
                lastElement.focus();
            }
        } else {
            // Tab
            if (document.activeElement === lastElement) {
                e.preventDefault();
                firstElement.focus();
            }
        }
    }

    /**
     * Atualiza elementos focáveis
     */
    updateFocusableElements() {
        const focusableSelectors = [
            'button:not([disabled])',
            'input:not([disabled])',
            'select:not([disabled])',
            'textarea:not([disabled])',
            'a[href]',
            '[tabindex]:not([tabindex="-1"])'
        ].join(', ');

        this.state.focusableElements = Array.from(
            this.modal.querySelectorAll(focusableSelectors)
        );
    }

    /**
     * Mostra o modal
     */
    show() {
        if (this.state.isVisible || this.state.isAnimating) return;

        this.state.isAnimating = true;
        
        // Callback antes de mostrar
        if (this.options.onShow) {
            this.options.onShow(this);
        }
        this.emit('show');

        // Salvar elemento ativo atual
        this.state.previousActiveElement = document.activeElement;

        // Adicionar classes para mostrar
        document.body.classList.add('modal-open');
        this.backdrop.classList.add('modal-backdrop--show');
        this.modal.classList.add('modal--show');

        // Focar no modal
        if (this.options.focus) {
            this.focusModal();
        }

        // Ajustar posição
        this.adjustPosition();

        // Aguardar animação
        const animationDuration = this.options.animation ? 300 : 0;
        
        setTimeout(() => {
            this.state.isVisible = true;
            this.state.isAnimating = false;
            
            // Callback após mostrar
            if (this.options.onShown) {
                this.options.onShown(this);
            }
            this.emit('shown');
        }, animationDuration);
    }

    /**
     * Esconde o modal
     */
    hide() {
        if (!this.state.isVisible || this.state.isAnimating) return;

        this.state.isAnimating = true;
        
        // Callback antes de esconder
        if (this.options.onHide) {
            this.options.onHide(this);
        }
        this.emit('hide');

        // Remover classes para esconder
        this.backdrop.classList.remove('modal-backdrop--show');
        this.modal.classList.remove('modal--show');

        // Aguardar animação
        const animationDuration = this.options.animation ? 300 : 0;
        
        setTimeout(() => {
            document.body.classList.remove('modal-open');
            this.state.isVisible = false;
            this.state.isAnimating = false;
            
            // Restaurar foco
            if (this.state.previousActiveElement) {
                this.state.previousActiveElement.focus();
                this.state.previousActiveElement = null;
            }
            
            // Callback após esconder
            if (this.options.onHidden) {
                this.options.onHidden(this);
            }
            this.emit('hidden');
        }, animationDuration);
    }

    /**
     * Alterna visibilidade do modal
     */
    toggle() {
        if (this.state.isVisible) {
            this.hide();
        } else {
            this.show();
        }
    }

    /**
     * Foca no modal
     */
    focusModal() {
        // Tentar focar no primeiro elemento focável
        if (this.state.focusableElements.length > 0) {
            this.state.focusableElements[0].focus();
        } else {
            // Se não houver elementos focáveis, focar no próprio modal
            this.modal.focus();
        }
    }

    /**
     * Ajusta posição do modal
     */
    adjustPosition() {
        if (!this.state.isVisible) return;

        // Resetar estilos
        this.modal.style.marginTop = '';
        this.modal.style.marginBottom = '';

        // Se não for centralizado, não fazer ajustes
        if (!this.options.centered) return;

        const modalHeight = this.modal.offsetHeight;
        const windowHeight = window.innerHeight;
        
        if (modalHeight < windowHeight) {
            const topMargin = (windowHeight - modalHeight) / 2;
            this.modal.style.marginTop = `${topMargin}px`;
            this.modal.style.marginBottom = `${topMargin}px`;
        }
    }

    /**
     * Atualiza o conteúdo do modal
     */
    setContent(content) {
        this.options.content = content;
        const bodyElement = this.modal.querySelector('.modal__body');
        if (bodyElement) {
            bodyElement.innerHTML = content;
            this.updateFocusableElements();
        }
    }

    /**
     * Atualiza o título do modal
     */
    setTitle(title) {
        this.options.title = title;
        const titleElement = this.modal.querySelector('.modal__title');
        if (titleElement) {
            titleElement.textContent = title;
        }
    }

    /**
     * Atualiza os botões do modal
     */
    setButtons(buttons) {
        this.options.buttons = buttons;
        const footerElement = this.modal.querySelector('.modal__footer');
        
        if (buttons && buttons.length > 0) {
            if (footerElement) {
                footerElement.innerHTML = this.renderFooter().match(/<div[^>]*>(.*)<\/div>/s)[1];
            } else {
                // Criar footer se não existir
                const contentElement = this.modal.querySelector('.modal__content');
                contentElement.insertAdjacentHTML('beforeend', this.renderFooter());
            }
        } else if (footerElement) {
            footerElement.remove();
        }
        
        this.updateFocusableElements();
    }

    /**
     * Adiciona um botão
     */
    addButton(button) {
        this.options.buttons.push(button);
        this.setButtons(this.options.buttons);
    }

    /**
     * Remove um botão
     */
    removeButton(key) {
        this.options.buttons = this.options.buttons.filter(b => b.key !== key);
        this.setButtons(this.options.buttons);
    }

    /**
     * Habilita/desabilita um botão
     */
    setButtonDisabled(key, disabled) {
        const button = this.modal.querySelector(`[data-button-key="${key}"]`);
        if (button) {
            button.disabled = disabled;
        }
    }

    /**
     * Define estado de carregamento
     */
    setLoading(loading, buttonKey = null) {
        if (buttonKey) {
            const button = this.modal.querySelector(`[data-button-key="${buttonKey}"]`);
            if (button) {
                if (loading) {
                    button.disabled = true;
                    button.innerHTML = `
                        <span class="loading-spinner loading-spinner--sm"></span>
                        Carregando...
                    `;
                } else {
                    button.disabled = false;
                    // Restaurar texto original do botão
                    const buttonConfig = this.options.buttons.find(b => b.key === buttonKey);
                    if (buttonConfig) {
                        button.textContent = buttonConfig.text;
                    }
                }
            }
        } else {
            // Loading geral do modal
            const bodyElement = this.modal.querySelector('.modal__body');
            if (loading) {
                bodyElement.innerHTML = `
                    <div class="modal__loading">
                        <div class="loading-spinner"></div>
                        <span>Carregando...</span>
                    </div>
                `;
            }
        }
    }

    /**
     * Sistema de eventos
     */
    emit(event, data = {}) {
        const customEvent = new CustomEvent(`modal:${event}`, {
            detail: { modal: this, ...data }
        });
        document.dispatchEvent(customEvent);
    }

    /**
     * Adiciona listener de evento
     */
    on(event, callback) {
        document.addEventListener(`modal:${event}`, callback);
    }

    /**
     * Remove listener de evento
     */
    off(event, callback) {
        document.removeEventListener(`modal:${event}`, callback);
    }

    /**
     * Destrói o modal
     */
    destroy() {
        if (this.state.isVisible) {
            this.hide();
        }

        // Aguardar animação antes de remover
        setTimeout(() => {
            if (this.modal && this.modal.parentNode) {
                this.modal.parentNode.removeChild(this.modal);
            }
            
            if (this.backdrop && this.backdrop.parentNode) {
                this.backdrop.parentNode.removeChild(this.backdrop);
            }
            
            document.body.classList.remove('modal-open');
            
            this.emit('destroyed');
        }, this.options.animation ? 300 : 0);
    }

    /**
     * Getters
     */
    get isVisible() {
        return this.state.isVisible;
    }

    get isAnimating() {
        return this.state.isAnimating;
    }
}

/**
 * Métodos estáticos para facilitar o uso
 */
Modal.alert = function(message, title = 'Alerta') {
    return new Modal({
        title,
        content: `<p>${message}</p>`,
        buttons: [
            {
                text: 'OK',
                class: 'btn--primary',
                key: 'ok',
                handler: () => true
            }
        ]
    }).show();
};

Modal.confirm = function(message, title = 'Confirmação') {
    return new Promise((resolve) => {
        new Modal({
            title,
            content: `<p>${message}</p>`,
            buttons: [
                {
                    text: 'Cancelar',
                    class: 'btn--secondary',
                    key: 'cancel',
                    handler: () => {
                        resolve(false);
                        return true;
                    }
                },
                {
                    text: 'Confirmar',
                    class: 'btn--primary',
                    key: 'confirm',
                    handler: () => {
                        resolve(true);
                        return true;
                    }
                }
            ],
            onHidden: () => resolve(false)
        }).show();
    });
};

Modal.prompt = function(message, defaultValue = '', title = 'Digite') {
    return new Promise((resolve) => {
        const inputId = 'modal-prompt-input';
        
        const modal = new Modal({
            title,
            content: `
                <div class="form-group">
                    <label class="form-label" for="${inputId}">${message}</label>
                    <input 
                        type="text" 
                        class="form-control" 
                        id="${inputId}"
                        value="${defaultValue}"
                        autocomplete="off"
                    >
                </div>
            `,
            buttons: [
                {
                    text: 'Cancelar',
                    class: 'btn--secondary',
                    key: 'cancel',
                    handler: () => {
                        resolve(null);
                        return true;
                    }
                },
                {
                    text: 'OK',
                    class: 'btn--primary',
                    key: 'ok',
                    handler: () => {
                        const input = document.getElementById(inputId);
                        resolve(input.value);
                        return true;
                    }
                }
            ],
            onShown: () => {
                const input = document.getElementById(inputId);
                input.focus();
                input.select();
            },
            onHidden: () => resolve(null)
        });
        
        modal.show();
    });
};

// Exportar como padrão
export default Modal;