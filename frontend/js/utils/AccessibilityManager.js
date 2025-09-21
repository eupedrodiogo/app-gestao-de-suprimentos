/**
 * AccessibilityManager - Gerenciador de acessibilidade
 * Implementa recursos de acessibilidade para melhorar a experiência de usuários com necessidades especiais
 */
class AccessibilityManager {
    constructor() {
        this.announcer = null;
        this.focusManager = null;
        this.keyboardNavigation = null;
        this.preferences = {
            reducedMotion: false,
            highContrast: false,
            largeText: false,
            screenReader: false
        };
        
        this.init();
    }

    init() {
        this.detectUserPreferences();
        this.createScreenReaderAnnouncer();
        this.setupFocusManagement();
        this.setupKeyboardNavigation();
        this.setupARIAEnhancements();
        this.setupColorContrastHelpers();
        this.setupMotionControls();
        this.setupTextSizeControls();
        this.monitorAccessibilityViolations();
    }

    /**
     * Detecta preferências do usuário
     */
    detectUserPreferences() {
        // Movimento reduzido
        if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
            this.preferences.reducedMotion = true;
            document.documentElement.classList.add('reduce-motion');
        }

        // Alto contraste
        if (window.matchMedia('(prefers-contrast: high)').matches) {
            this.preferences.highContrast = true;
            document.documentElement.classList.add('high-contrast');
        }

        // Detecta leitor de tela
        this.detectScreenReader();

        // Monitora mudanças nas preferências
        this.watchPreferenceChanges();
    }

    /**
     * Detecta se há leitor de tela ativo
     */
    detectScreenReader() {
        // Técnica para detectar leitores de tela
        const testElement = document.createElement('div');
        testElement.setAttribute('aria-hidden', 'true');
        testElement.style.position = 'absolute';
        testElement.style.left = '-10000px';
        testElement.textContent = 'Screen reader test';
        
        document.body.appendChild(testElement);
        
        setTimeout(() => {
            const hasScreenReader = testElement.offsetHeight > 0;
            this.preferences.screenReader = hasScreenReader;
            
            if (hasScreenReader) {
                document.documentElement.classList.add('screen-reader-active');
            }
            
            document.body.removeChild(testElement);
        }, 100);
    }

    /**
     * Monitora mudanças nas preferências
     */
    watchPreferenceChanges() {
        // Movimento reduzido
        window.matchMedia('(prefers-reduced-motion: reduce)').addEventListener('change', (e) => {
            this.preferences.reducedMotion = e.matches;
            document.documentElement.classList.toggle('reduce-motion', e.matches);
            this.announce('Preferência de movimento atualizada');
        });

        // Alto contraste
        window.matchMedia('(prefers-contrast: high)').addEventListener('change', (e) => {
            this.preferences.highContrast = e.matches;
            document.documentElement.classList.toggle('high-contrast', e.matches);
            this.announce('Preferência de contraste atualizada');
        });
    }

    /**
     * Cria anunciador para leitores de tela
     */
    createScreenReaderAnnouncer() {
        // Região de anúncios educados
        const politeAnnouncer = document.createElement('div');
        politeAnnouncer.setAttribute('aria-live', 'polite');
        politeAnnouncer.setAttribute('aria-atomic', 'true');
        politeAnnouncer.className = 'sr-only';
        politeAnnouncer.id = 'polite-announcer';

        // Região de anúncios assertivos
        const assertiveAnnouncer = document.createElement('div');
        assertiveAnnouncer.setAttribute('aria-live', 'assertive');
        assertiveAnnouncer.setAttribute('aria-atomic', 'true');
        assertiveAnnouncer.className = 'sr-only';
        assertiveAnnouncer.id = 'assertive-announcer';

        document.body.appendChild(politeAnnouncer);
        document.body.appendChild(assertiveAnnouncer);

        this.announcer = {
            polite: politeAnnouncer,
            assertive: assertiveAnnouncer
        };
    }

    /**
     * Anuncia mensagem para leitores de tela
     */
    announce(message, priority = 'polite') {
        if (!this.announcer) return;

        const announcer = this.announcer[priority] || this.announcer.polite;
        
        // Limpa o conteúdo anterior
        announcer.textContent = '';
        
        // Adiciona nova mensagem após um pequeno delay
        setTimeout(() => {
            announcer.textContent = message;
        }, 100);

        // Limpa após 5 segundos
        setTimeout(() => {
            if (announcer.textContent === message) {
                announcer.textContent = '';
            }
        }, 5000);
    }

    /**
     * Gerenciamento de foco
     */
    setupFocusManagement() {
        this.focusManager = {
            focusHistory: [],
            trapStack: [],
            
            // Salva foco atual
            saveFocus() {
                const activeElement = document.activeElement;
                if (activeElement && activeElement !== document.body) {
                    this.focusHistory.push(activeElement);
                }
            },

            // Restaura foco anterior
            restoreFocus() {
                const lastFocused = this.focusHistory.pop();
                if (lastFocused && typeof lastFocused.focus === 'function') {
                    lastFocused.focus();
                }
            },

            // Armadilha de foco para modais
            trapFocus(container) {
                const focusableElements = this.getFocusableElements(container);
                if (focusableElements.length === 0) return;

                const firstElement = focusableElements[0];
                const lastElement = focusableElements[focusableElements.length - 1];

                const trapHandler = (event) => {
                    if (event.key === 'Tab') {
                        if (event.shiftKey) {
                            if (document.activeElement === firstElement) {
                                event.preventDefault();
                                lastElement.focus();
                            }
                        } else {
                            if (document.activeElement === lastElement) {
                                event.preventDefault();
                                firstElement.focus();
                            }
                        }
                    }
                };

                container.addEventListener('keydown', trapHandler);
                this.trapStack.push({ container, handler: trapHandler });
                
                // Foca no primeiro elemento
                firstElement.focus();
            },

            // Remove armadilha de foco
            releaseFocus() {
                const trap = this.trapStack.pop();
                if (trap) {
                    trap.container.removeEventListener('keydown', trap.handler);
                }
            },

            // Obtém elementos focáveis
            getFocusableElements(container) {
                const selector = [
                    'a[href]',
                    'button:not([disabled])',
                    'input:not([disabled])',
                    'select:not([disabled])',
                    'textarea:not([disabled])',
                    '[tabindex]:not([tabindex="-1"])',
                    '[contenteditable="true"]'
                ].join(', ');

                return Array.from(container.querySelectorAll(selector))
                    .filter(element => {
                        return element.offsetWidth > 0 && 
                               element.offsetHeight > 0 && 
                               !element.hasAttribute('aria-hidden');
                    });
            }
        };
    }

    /**
     * Navegação por teclado
     */
    setupKeyboardNavigation() {
        this.keyboardNavigation = {
            isKeyboardUser: false,
            
            init() {
                // Detecta uso do teclado
                document.addEventListener('keydown', (event) => {
                    if (event.key === 'Tab') {
                        this.isKeyboardUser = true;
                        document.body.classList.add('keyboard-navigation');
                    }
                });

                // Remove indicação quando usa mouse
                document.addEventListener('mousedown', () => {
                    this.isKeyboardUser = false;
                    document.body.classList.remove('keyboard-navigation');
                });

                // Navegação por setas em listas
                this.setupArrowNavigation();
                
                // Atalhos de teclado
                this.setupKeyboardShortcuts();
            },

            setupArrowNavigation() {
                document.addEventListener('keydown', (event) => {
                    const { key, target } = event;
                    
                    if (!['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(key)) {
                        return;
                    }

                    // Navegação em menus e listas
                    if (target.closest('[role="menu"], [role="listbox"], [role="tablist"]')) {
                        event.preventDefault();
                        this.handleArrowNavigation(event);
                    }
                });
            },

            handleArrowNavigation(event) {
                const { key, target } = event;
                const container = target.closest('[role="menu"], [role="listbox"], [role="tablist"]');
                const items = Array.from(container.querySelectorAll('[role="menuitem"], [role="option"], [role="tab"]'));
                const currentIndex = items.indexOf(target);

                let nextIndex;
                
                if (key === 'ArrowDown' || key === 'ArrowRight') {
                    nextIndex = (currentIndex + 1) % items.length;
                } else {
                    nextIndex = (currentIndex - 1 + items.length) % items.length;
                }

                items[nextIndex].focus();
            },

            setupKeyboardShortcuts() {
                document.addEventListener('keydown', (event) => {
                    // Alt + M: Menu principal
                    if (event.altKey && event.key === 'm') {
                        event.preventDefault();
                        const mainMenu = document.querySelector('[role="navigation"]');
                        if (mainMenu) {
                            const firstLink = mainMenu.querySelector('a, button');
                            if (firstLink) firstLink.focus();
                        }
                    }

                    // Alt + S: Busca
                    if (event.altKey && event.key === 's') {
                        event.preventDefault();
                        const searchInput = document.querySelector('input[type="search"], input[placeholder*="busca"]');
                        if (searchInput) searchInput.focus();
                    }

                    // Escape: Fechar modais/dropdowns
                    if (event.key === 'Escape') {
                        this.handleEscapeKey();
                    }
                });
            },

            handleEscapeKey() {
                // Fecha modais abertos
                const openModal = document.querySelector('.modal.is-active, [role="dialog"][aria-hidden="false"]');
                if (openModal) {
                    const closeButton = openModal.querySelector('[data-dismiss="modal"], .modal__close');
                    if (closeButton) {
                        closeButton.click();
                    }
                    return;
                }

                // Fecha dropdowns abertos
                const openDropdown = document.querySelector('.dropdown.is-active, [aria-expanded="true"]');
                if (openDropdown) {
                    const trigger = openDropdown.querySelector('[aria-expanded="true"]');
                    if (trigger) {
                        trigger.click();
                    }
                }
            }
        };

        this.keyboardNavigation.init();
    }

    /**
     * Melhorias de ARIA
     */
    setupARIAEnhancements() {
        // Adiciona labels automáticos
        this.addAutomaticLabels();
        
        // Melhora descrições
        this.enhanceDescriptions();
        
        // Adiciona landmarks
        this.addLandmarks();
        
        // Melhora estados
        this.enhanceStates();
    }

    addAutomaticLabels() {
        // Inputs sem label
        const unlabeledInputs = document.querySelectorAll('input:not([aria-label]):not([aria-labelledby])');
        unlabeledInputs.forEach(input => {
            const placeholder = input.getAttribute('placeholder');
            const name = input.getAttribute('name');
            
            if (placeholder) {
                input.setAttribute('aria-label', placeholder);
            } else if (name) {
                input.setAttribute('aria-label', name.replace(/[_-]/g, ' '));
            }
        });

        // Botões sem texto
        const unlabeledButtons = document.querySelectorAll('button:not([aria-label]):not([aria-labelledby]):empty');
        unlabeledButtons.forEach(button => {
            const icon = button.querySelector('i[class*="icon"]');
            if (icon) {
                const iconClass = icon.className;
                const label = this.getIconLabel(iconClass);
                if (label) {
                    button.setAttribute('aria-label', label);
                }
            }
        });
    }

    getIconLabel(iconClass) {
        const iconMap = {
            'icon-search': 'Buscar',
            'icon-close': 'Fechar',
            'icon-menu': 'Menu',
            'icon-edit': 'Editar',
            'icon-delete': 'Excluir',
            'icon-save': 'Salvar',
            'icon-add': 'Adicionar',
            'icon-remove': 'Remover',
            'icon-download': 'Baixar',
            'icon-upload': 'Enviar',
            'icon-print': 'Imprimir',
            'icon-settings': 'Configurações'
        };

        for (const [iconName, label] of Object.entries(iconMap)) {
            if (iconClass.includes(iconName)) {
                return label;
            }
        }

        return null;
    }

    enhanceDescriptions() {
        // Adiciona descrições para elementos complexos
        const complexElements = document.querySelectorAll('.chart, .graph, .data-table');
        complexElements.forEach(element => {
            if (!element.hasAttribute('aria-describedby')) {
                const description = this.generateDescription(element);
                if (description) {
                    const descId = `desc-${Math.random().toString(36).substr(2, 9)}`;
                    const descElement = document.createElement('div');
                    descElement.id = descId;
                    descElement.className = 'sr-only';
                    descElement.textContent = description;
                    
                    element.parentNode.insertBefore(descElement, element.nextSibling);
                    element.setAttribute('aria-describedby', descId);
                }
            }
        });
    }

    generateDescription(element) {
        if (element.classList.contains('data-table')) {
            const rows = element.querySelectorAll('tbody tr').length;
            const cols = element.querySelectorAll('thead th').length;
            return `Tabela com ${rows} linhas e ${cols} colunas`;
        }
        
        if (element.classList.contains('chart')) {
            return 'Gráfico com dados visuais. Use as teclas de seta para navegar pelos pontos de dados.';
        }
        
        return null;
    }

    addLandmarks() {
        // Adiciona landmarks se não existirem
        if (!document.querySelector('main')) {
            const mainContent = document.querySelector('.main-content, #main, .content');
            if (mainContent) {
                mainContent.setAttribute('role', 'main');
            }
        }

        if (!document.querySelector('nav')) {
            const navigation = document.querySelector('.navigation, .nav, .menu');
            if (navigation) {
                navigation.setAttribute('role', 'navigation');
                navigation.setAttribute('aria-label', 'Navegação principal');
            }
        }
    }

    enhanceStates() {
        // Melhora estados de loading
        const loadingElements = document.querySelectorAll('.loading, .spinner');
        loadingElements.forEach(element => {
            element.setAttribute('aria-live', 'polite');
            element.setAttribute('aria-label', 'Carregando...');
        });

        // Melhora estados de erro
        const errorElements = document.querySelectorAll('.error, .alert-error');
        errorElements.forEach(element => {
            element.setAttribute('role', 'alert');
            element.setAttribute('aria-live', 'assertive');
        });
    }

    /**
     * Helpers de contraste de cor
     */
    setupColorContrastHelpers() {
        this.contrastChecker = {
            // Calcula contraste entre duas cores
            calculateContrast(color1, color2) {
                const luminance1 = this.getLuminance(color1);
                const luminance2 = this.getLuminance(color2);
                
                const lighter = Math.max(luminance1, luminance2);
                const darker = Math.min(luminance1, luminance2);
                
                return (lighter + 0.05) / (darker + 0.05);
            },

            // Calcula luminância de uma cor
            getLuminance(color) {
                const rgb = this.hexToRgb(color);
                if (!rgb) return 0;
                const [r, g, b] = rgb.map(c => {
                    c = c / 255;
                    return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
                });
                
                return 0.2126 * r + 0.7152 * g + 0.0722 * b;
            },

            // Converte hex para RGB
            hexToRgb(hex) {
                const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
                return result ? [
                    parseInt(result[1], 16),
                    parseInt(result[2], 16),
                    parseInt(result[3], 16)
                ] : null;
            },

            // Verifica se o contraste atende aos padrões WCAG
            meetsWCAG(contrast, level = 'AA') {
                const thresholds = {
                    'AA': 4.5,
                    'AAA': 7
                };
                
                return contrast >= thresholds[level];
            }
        };
    }

    /**
     * Controles de movimento
     */
    setupMotionControls() {
        // Botão para alternar movimento reduzido
        this.createMotionToggle();
        
        // Pausa animações quando necessário
        this.pauseAnimationsOnRequest();
    }

    createMotionToggle() {
        const toggle = document.createElement('button');
        toggle.className = 'motion-toggle';
        toggle.setAttribute('aria-label', 'Alternar animações');
        toggle.textContent = this.preferences.reducedMotion ? 'Ativar animações' : 'Reduzir animações';
        
        toggle.addEventListener('click', () => {
            this.preferences.reducedMotion = !this.preferences.reducedMotion;
            document.documentElement.classList.toggle('reduce-motion', this.preferences.reducedMotion);
            toggle.textContent = this.preferences.reducedMotion ? 'Ativar animações' : 'Reduzir animações';
            this.announce(`Animações ${this.preferences.reducedMotion ? 'reduzidas' : 'ativadas'}`);
        });

        // Adiciona ao painel de acessibilidade se existir
        const accessibilityPanel = document.querySelector('.accessibility-panel');
        if (accessibilityPanel) {
            accessibilityPanel.appendChild(toggle);
        }
    }

    pauseAnimationsOnRequest() {
        document.addEventListener('keydown', (event) => {
            // Ctrl + Shift + P: Pausa/resume animações
            if (event.ctrlKey && event.shiftKey && event.key === 'P') {
                event.preventDefault();
                this.toggleAnimations();
            }
        });
    }

    toggleAnimations() {
        const isPaused = document.documentElement.classList.contains('animations-paused');
        document.documentElement.classList.toggle('animations-paused', !isPaused);
        this.announce(`Animações ${isPaused ? 'retomadas' : 'pausadas'}`);
    }

    /**
     * Controles de tamanho de texto
     */
    setupTextSizeControls() {
        this.textSizeManager = {
            currentSize: 100,
            minSize: 75,
            maxSize: 200,
            step: 25,

            increase() {
                if (this.currentSize < this.maxSize) {
                    this.currentSize += this.step;
                    this.apply();
                }
            },

            decrease() {
                if (this.currentSize > this.minSize) {
                    this.currentSize -= this.step;
                    this.apply();
                }
            },

            reset() {
                this.currentSize = 100;
                this.apply();
            },

            apply() {
                document.documentElement.style.fontSize = `${this.currentSize}%`;
                window.AccessibilityManager.announce(`Tamanho do texto: ${this.currentSize}%`);
            }
        };

        // Atalhos de teclado para tamanho de texto
        document.addEventListener('keydown', (event) => {
            if (event.ctrlKey) {
                if (event.key === '+' || event.key === '=') {
                    event.preventDefault();
                    this.textSizeManager.increase();
                } else if (event.key === '-') {
                    event.preventDefault();
                    this.textSizeManager.decrease();
                } else if (event.key === '0') {
                    event.preventDefault();
                    this.textSizeManager.reset();
                }
            }
        });
    }

    /**
     * Monitora violações de acessibilidade
     */
    monitorAccessibilityViolations() {
        if (typeof window.axe !== 'undefined') {
            // Usa axe-core se disponível
            this.runAxeAudit();
        } else {
            // Verificações básicas próprias
            this.runBasicAudit();
        }
    }

    runBasicAudit() {
        const violations = [];

        // Verifica imagens sem alt
        const imagesWithoutAlt = document.querySelectorAll('img:not([alt])');
        if (imagesWithoutAlt.length > 0) {
            violations.push(`${imagesWithoutAlt.length} imagens sem texto alternativo`);
        }

        // Verifica inputs sem label
        const inputsWithoutLabel = document.querySelectorAll('input:not([aria-label]):not([aria-labelledby])');
        if (inputsWithoutLabel.length > 0) {
            violations.push(`${inputsWithoutLabel.length} campos sem rótulo`);
        }

        // Verifica contraste baixo (simplificado)
        const lowContrastElements = this.findLowContrastElements();
        if (lowContrastElements.length > 0) {
            violations.push(`${lowContrastElements.length} elementos com contraste baixo`);
        }

        if (violations.length > 0) {
            console.warn('Violações de acessibilidade encontradas:', violations);
        }
    }

    findLowContrastElements() {
        const elements = document.querySelectorAll('*');
        const lowContrast = [];

        elements.forEach(element => {
            const styles = window.getComputedStyle(element);
            const color = styles.color;
            const backgroundColor = styles.backgroundColor;

            if (color && backgroundColor && color !== 'rgba(0, 0, 0, 0)' && backgroundColor !== 'rgba(0, 0, 0, 0)') {
                // Verificação simplificada - em produção, usar biblioteca especializada
                const contrast = this.contrastChecker.calculateContrast(color, backgroundColor);
                if (!this.contrastChecker.meetsWCAG(contrast)) {
                    lowContrast.push(element);
                }
            }
        });

        return lowContrast;
    }

    /**
     * Utilitários públicos
     */
    
    // Foca em elemento com anúncio
    focusWithAnnouncement(element, message) {
        if (typeof element === 'string') {
            element = document.querySelector(element);
        }
        
        if (element) {
            element.focus();
            if (message) {
                this.announce(message);
            }
        }
    }

    // Cria região de status
    createStatusRegion(id, live = 'polite') {
        const region = document.createElement('div');
        region.id = id;
        region.setAttribute('aria-live', live);
        region.setAttribute('aria-atomic', 'true');
        region.className = 'sr-only';
        document.body.appendChild(region);
        return region;
    }

    // Atualiza região de status
    updateStatus(regionId, message) {
        const region = document.getElementById(regionId);
        if (region) {
            region.textContent = message;
        }
    }

    // Obtém preferências do usuário
    getPreferences() {
        return { ...this.preferences };
    }

    // Define preferência
    setPreference(key, value) {
        if (key in this.preferences) {
            this.preferences[key] = value;
            this.applyPreference(key, value);
        }
    }

    applyPreference(key, value) {
        switch (key) {
            case 'reducedMotion':
                document.documentElement.classList.toggle('reduce-motion', value);
                break;
            case 'highContrast':
                document.documentElement.classList.toggle('high-contrast', value);
                break;
            case 'largeText':
                document.documentElement.classList.toggle('large-text', value);
                break;
        }
    }
}

// Instância global
window.AccessibilityManager = new AccessibilityManager();

// Export para uso em módulos
if (typeof module !== 'undefined' && module.exports) {
    module.exports = AccessibilityManager;
}