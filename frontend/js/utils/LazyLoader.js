/**
 * LazyLoader - Sistema de carregamento sob demanda para otimização de performance
 */
import log from './logger.js';

export class LazyLoader {
    constructor() {
        this.loadedModules = new Map();
        this.loadingPromises = new Map();
        this.observers = new Map();
        this.config = {
            // Configurações do Intersection Observer
            rootMargin: '50px',
            threshold: 0.1,
            
            // Configurações de retry
            maxRetries: 3,
            retryDelay: 1000,
            
            // Cache
            enableCache: true,
            cacheTimeout: 5 * 60 * 1000, // 5 minutos
            
            // Debug
            debug: false
        };
        
        this.init();
    }

    /**
     * Inicializa o lazy loader
     */
    init() {
        // Verificar suporte ao Intersection Observer
        if (!('IntersectionObserver' in window)) {
            console.warn('LazyLoader: Intersection Observer não suportado. Fallback para carregamento imediato.');
            this.fallbackMode = true;
        }

        // Configurar observer para imagens
        this.setupImageObserver();
        
        // Configurar observer para componentes
        this.setupComponentObserver();
        
        // Auto-inicializar elementos existentes
        this.scanExistingElements();
    }

    /**
     * Configura observer para imagens lazy
     */
    setupImageObserver() {
        if (this.fallbackMode) return;

        this.observers.set('images', new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    this.loadImage(entry.target);
                    this.observers.get('images').unobserve(entry.target);
                }
            });
        }, {
            rootMargin: this.config.rootMargin,
            threshold: this.config.threshold
        }));
    }

    /**
     * Configura observer para componentes lazy
     */
    setupComponentObserver() {
        if (this.fallbackMode) return;

        this.observers.set('components', new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    this.loadComponent(entry.target);
                    this.observers.get('components').unobserve(entry.target);
                }
            });
        }, {
            rootMargin: this.config.rootMargin,
            threshold: this.config.threshold
        }));
    }

    /**
     * Escaneia elementos existentes no DOM
     */
    scanExistingElements() {
        // Imagens lazy
        const lazyImages = document.querySelectorAll('[data-lazy-src]');
        lazyImages.forEach(img => this.observeImage(img));

        // Componentes lazy
        const lazyComponents = document.querySelectorAll('[data-lazy-component]');
        lazyComponents.forEach(element => this.observeComponent(element));

        // Scripts lazy
        const lazyScripts = document.querySelectorAll('[data-lazy-script]');
        lazyScripts.forEach(script => this.observeScript(script));
    }

    /**
     * Observa uma imagem para carregamento lazy
     */
    observeImage(img) {
        if (this.fallbackMode) {
            this.loadImage(img);
            return;
        }

        // Adicionar placeholder se não existir
        if (!img.src && !img.style.backgroundColor) {
            img.style.backgroundColor = '#f0f0f0';
            img.style.minHeight = '200px';
        }

        this.observers.get('images').observe(img);
    }

    /**
     * Observa um componente para carregamento lazy
     */
    observeComponent(element) {
        if (this.fallbackMode) {
            this.loadComponent(element);
            return;
        }

        // Adicionar indicador de carregamento
        if (!element.innerHTML.trim()) {
            element.innerHTML = this.createLoadingPlaceholder();
        }

        this.observers.get('components').observe(element);
    }

    /**
     * Observa um script para carregamento lazy
     */
    observeScript(script) {
        if (this.fallbackMode) {
            this.loadScript(script);
            return;
        }

        // Scripts são carregados quando necessário, não por visibilidade
        // Mas podemos preparar para carregamento sob demanda
        const trigger = script.dataset.lazyTrigger;
        if (trigger) {
            this.setupScriptTrigger(script, trigger);
        }
    }

    /**
     * Carrega uma imagem lazy
     */
    async loadImage(img) {
        const src = img.dataset.lazySrc;
        const srcset = img.dataset.lazySrcset;
        
        if (!src) return;

        try {
            // Mostrar indicador de carregamento
            img.classList.add('lazy-loading');
            
            // Pré-carregar imagem
            const tempImg = new Image();
            
            await new Promise((resolve, reject) => {
                tempImg.onload = resolve;
                tempImg.onerror = reject;
                
                if (srcset) {
                    tempImg.srcset = srcset;
                }
                tempImg.src = src;
            });

            // Aplicar imagem carregada
            if (srcset) {
                img.srcset = srcset;
            }
            img.src = src;
            
            // Remover atributos lazy
            delete img.dataset.lazySrc;
            delete img.dataset.lazySrcset;
            
            // Atualizar classes
            img.classList.remove('lazy-loading');
            img.classList.add('lazy-loaded');
            
            // Remover placeholder
            img.style.backgroundColor = '';
            img.style.minHeight = '';
            
            this.log('Imagem carregada:', src);
            
        } catch (error) {
            log.error({
                message: error.message,
                stack: error.stack,
                component: 'lazy-loader-load',
                src: src
            });
            img.classList.remove('lazy-loading');
            img.classList.add('lazy-error');
            
            // Mostrar imagem de erro se especificada
            const errorSrc = img.dataset.lazyError;
            if (errorSrc) {
                img.src = errorSrc;
            }
        }
    }

    /**
     * Carrega um componente lazy
     */
    async loadComponent(element) {
        const componentName = element.dataset.lazyComponent;
        const componentProps = element.dataset.lazyProps;
        
        if (!componentName) return;

        try {
            // Mostrar indicador de carregamento
            element.classList.add('lazy-loading');
            
            // Carregar módulo do componente
            const ComponentClass = await this.loadModule(componentName);
            
            // Parsear props se fornecidas
            let props = {};
            if (componentProps) {
                try {
                    props = JSON.parse(componentProps);
                } catch (e) {
                    console.warn('Props inválidas para componente:', componentName, componentProps);
                }
            }
            
            // Instanciar componente
            const component = new ComponentClass(element, props);
            
            // Remover atributos lazy
            delete element.dataset.lazyComponent;
            delete element.dataset.lazyProps;
            
            // Atualizar classes
            element.classList.remove('lazy-loading');
            element.classList.add('lazy-loaded');
            
            // Armazenar referência do componente
            element._lazyComponent = component;
            
            this.log('Componente carregado:', componentName);
            
        } catch (error) {
            log.error({
                message: error.message,
                stack: error.stack,
                component: 'lazy-loader-component',
                element: element.tagName,
                componentName: componentName
            });
            element.classList.remove('lazy-loading');
            element.classList.add('lazy-error');
            element.innerHTML = this.createErrorPlaceholder(componentName);
        }
    }

    /**
     * Carrega um script lazy
     */
    async loadScript(script) {
        const src = script.dataset.lazyScript;
        const module = script.dataset.lazyModule;
        
        if (!src) return;

        try {
            if (module) {
                // Carregar como módulo ES6
                await this.loadModule(src);
            } else {
                // Carregar como script tradicional
                await this.loadExternalScript(src);
            }
            
            script.classList.add('lazy-loaded');
            this.log('Script carregado:', src);
            
        } catch (error) {
            log.error({
                message: error.message,
                stack: error.stack,
                component: 'lazy-loader-script',
                src: src
            });
            script.classList.add('lazy-error');
        }
    }

    /**
     * Carrega um módulo JavaScript
     */
    async loadModule(modulePath, retryCount = 0) {
        // Verificar cache
        if (this.config.enableCache && this.loadedModules.has(modulePath)) {
            const cached = this.loadedModules.get(modulePath);
            
            // Verificar se o cache não expirou
            if (Date.now() - cached.timestamp < this.config.cacheTimeout) {
                this.log('Módulo carregado do cache:', modulePath);
                return cached.module;
            } else {
                this.loadedModules.delete(modulePath);
            }
        }

        // Verificar se já está carregando
        if (this.loadingPromises.has(modulePath)) {
            return this.loadingPromises.get(modulePath);
        }

        // Criar promise de carregamento
        const loadingPromise = this.doLoadModule(modulePath, retryCount);
        this.loadingPromises.set(modulePath, loadingPromise);

        try {
            const module = await loadingPromise;
            
            // Armazenar no cache
            if (this.config.enableCache) {
                this.loadedModules.set(modulePath, {
                    module,
                    timestamp: Date.now()
                });
            }
            
            return module;
            
        } finally {
            this.loadingPromises.delete(modulePath);
        }
    }

    /**
     * Executa o carregamento do módulo
     */
    async doLoadModule(modulePath, retryCount) {
        try {
            // Normalizar caminho do módulo
            const normalizedPath = this.normalizeModulePath(modulePath);
            
            // Importar módulo
            const module = await import(normalizedPath);
            
            // Retornar classe padrão ou nomeada
            return module.default || module[this.getModuleClassName(modulePath)];
            
        } catch (error) {
            // Tentar novamente se não excedeu o limite
            if (retryCount < this.config.maxRetries) {
                this.log(`Tentativa ${retryCount + 1} de carregar módulo:`, modulePath);
                
                await this.delay(this.config.retryDelay * (retryCount + 1));
                return this.doLoadModule(modulePath, retryCount + 1);
            }
            
            throw error;
        }
    }

    /**
     * Carrega script externo
     */
    loadExternalScript(src) {
        return new Promise((resolve, reject) => {
            // Verificar se já foi carregado
            const existingScript = document.querySelector(`script[src="${src}"]`);
            if (existingScript) {
                resolve();
                return;
            }

            const script = document.createElement('script');
            script.src = src;
            script.onload = resolve;
            script.onerror = reject;
            
            document.head.appendChild(script);
        });
    }

    /**
     * Configura trigger para carregamento de script
     */
    setupScriptTrigger(script, trigger) {
        switch (trigger) {
            case 'click':
                document.addEventListener('click', () => {
                    this.loadScript(script);
                }, { once: true });
                break;
                
            case 'scroll':
                window.addEventListener('scroll', () => {
                    this.loadScript(script);
                }, { once: true });
                break;
                
            case 'idle':
                if ('requestIdleCallback' in window) {
                    requestIdleCallback(() => this.loadScript(script));
                } else {
                    setTimeout(() => this.loadScript(script), 1000);
                }
                break;
                
            default:
                // Trigger customizado via evento
                document.addEventListener(trigger, () => {
                    this.loadScript(script);
                }, { once: true });
                break;
        }
    }

    /**
     * Normaliza caminho do módulo
     */
    normalizeModulePath(modulePath) {
        // Se for caminho relativo, adicionar prefixo
        if (!modulePath.startsWith('/') && !modulePath.startsWith('./') && !modulePath.startsWith('../')) {
            return `./js/components/${modulePath}.js`;
        }
        
        // Se não tiver extensão, adicionar .js
        if (!modulePath.endsWith('.js')) {
            return `${modulePath}.js`;
        }
        
        return modulePath;
    }

    /**
     * Obtém nome da classe do módulo
     */
    getModuleClassName(modulePath) {
        const fileName = modulePath.split('/').pop().replace('.js', '');
        return fileName.charAt(0).toUpperCase() + fileName.slice(1);
    }

    /**
     * Cria placeholder de carregamento
     */
    createLoadingPlaceholder() {
        return `
            <div class="lazy-placeholder lazy-placeholder--loading">
                <div class="loading-spinner"></div>
                <span>Carregando...</span>
            </div>
        `;
    }

    /**
     * Cria placeholder de erro
     */
    createErrorPlaceholder(componentName) {
        return `
            <div class="lazy-placeholder lazy-placeholder--error">
                <div class="lazy-placeholder__icon">
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <circle cx="12" cy="12" r="10"></circle>
                        <line x1="12" y1="8" x2="12" y2="12"></line>
                        <line x1="12" y1="16" x2="12.01" y2="16"></line>
                    </svg>
                </div>
                <span>Erro ao carregar ${componentName}</span>
                <button class="btn btn--sm btn--outline" onclick="location.reload()">
                    Tentar novamente
                </button>
            </div>
        `;
    }

    /**
     * Utilitário de delay
     */
    delay(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    /**
     * Log de debug
     */
    log(...args) {
        if (this.config.debug) {
            console.log('[LazyLoader]', ...args);
        }
    }

    /**
     * API pública
     */

    /**
     * Carrega um componente programaticamente
     */
    async loadComponentNow(element, componentName, props = {}) {
        element.dataset.lazyComponent = componentName;
        element.dataset.lazyProps = JSON.stringify(props);
        
        await this.loadComponent(element);
    }

    /**
     * Carrega uma imagem programaticamente
     */
    async loadImageNow(img, src, srcset = null) {
        img.dataset.lazySrc = src;
        if (srcset) {
            img.dataset.lazySrcset = srcset;
        }
        
        await this.loadImage(img);
    }

    /**
     * Pré-carrega módulos
     */
    async preloadModules(modules) {
        const promises = modules.map(module => this.loadModule(module));
        await Promise.allSettled(promises);
    }

    /**
     * Limpa cache de módulos
     */
    clearCache() {
        this.loadedModules.clear();
        this.log('Cache de módulos limpo');
    }

    /**
     * Atualiza configuração
     */
    updateConfig(newConfig) {
        this.config = { ...this.config, ...newConfig };
        
        // Recriar observers se necessário
        if (newConfig.rootMargin || newConfig.threshold) {
            this.destroyObservers();
            this.setupImageObserver();
            this.setupComponentObserver();
        }
    }

    /**
     * Destrói observers
     */
    destroyObservers() {
        this.observers.forEach(observer => observer.disconnect());
        this.observers.clear();
    }

    /**
     * Adiciona novos elementos para observação
     */
    observe(container = document) {
        // Imagens lazy
        const lazyImages = container.querySelectorAll('[data-lazy-src]');
        lazyImages.forEach(img => this.observeImage(img));

        // Componentes lazy
        const lazyComponents = container.querySelectorAll('[data-lazy-component]');
        lazyComponents.forEach(element => this.observeComponent(element));

        // Scripts lazy
        const lazyScripts = container.querySelectorAll('[data-lazy-script]');
        lazyScripts.forEach(script => this.observeScript(script));
    }

    /**
     * Remove observação de elementos
     */
    unobserve(element) {
        this.observers.forEach(observer => observer.unobserve(element));
    }

    /**
     * Obtém estatísticas de carregamento
     */
    getStats() {
        return {
            loadedModules: this.loadedModules.size,
            loadingPromises: this.loadingPromises.size,
            cacheHits: Array.from(this.loadedModules.values()).filter(
                item => Date.now() - item.timestamp < this.config.cacheTimeout
            ).length
        };
    }

    /**
     * Destrói o lazy loader
     */
    destroy() {
        this.destroyObservers();
        this.loadedModules.clear();
        this.loadingPromises.clear();
    }
}

// Instância global
const lazyLoader = new LazyLoader();

// Exportar instância e classe
export { lazyLoader };
export default LazyLoader;