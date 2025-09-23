/**
 * ModuleLoader - Sistema de carregamento dinâmico de módulos
 * Implementa code splitting e lazy loading para otimização de performance
 */
import log from './logger.js';

class ModuleLoader {
    constructor() {
        this.loadedModules = new Map();
        this.loadingPromises = new Map();
        this.cache = new Map();
        this.retryAttempts = 3;
        this.retryDelay = 1000;
        
        this.init();
    }

    init() {
        // Preload de módulos críticos
        this.preloadCriticalModules();
        
        // Setup de service worker para cache
        this.setupServiceWorker();
    }

    /**
     * Carrega um módulo dinamicamente
     */
    async loadModule(moduleName, options = {}) {
        const {
            cache = true,
            retry = true,
            timeout = 10000,
            fallback = null
        } = options;

        // Verifica se já está carregado
        if (this.loadedModules.has(moduleName)) {
            return this.loadedModules.get(moduleName);
        }

        // Verifica se já está sendo carregado
        if (this.loadingPromises.has(moduleName)) {
            return this.loadingPromises.get(moduleName);
        }

        // Cria promise de carregamento
        const loadingPromise = this.performLoad(moduleName, {
            cache,
            retry,
            timeout,
            fallback
        });

        this.loadingPromises.set(moduleName, loadingPromise);

        try {
            const module = await loadingPromise;
            this.loadedModules.set(moduleName, module);
            this.loadingPromises.delete(moduleName);
            return module;
        } catch (error) {
            log.error({
                message: error.message,
                stack: error.stack,
                component: 'module-loader-load',
                module: moduleName
            });
            this.loadingPromises.delete(moduleName);
            throw error;
        }
    }

    /**
     * Executa o carregamento do módulo
     */
    async performLoad(moduleName, options) {
        const { cache, retry, timeout, fallback } = options;
        let attempts = 0;
        let lastError;

        while (attempts < (retry ? this.retryAttempts : 1)) {
            try {
                return await Promise.race([
                    this.loadModuleScript(moduleName, cache),
                    this.createTimeoutPromise(timeout)
                ]);
            } catch (error) {
                lastError = error;
                attempts++;
                
                if (attempts < this.retryAttempts) {
                    await this.delay(this.retryDelay * attempts);
                }
            }
        }

        // Tenta fallback se disponível
        if (fallback) {
            try {
                return await this.loadModule(fallback, { ...options, fallback: null });
            } catch (fallbackError) {
                console.warn(`Fallback também falhou para ${moduleName}:`, fallbackError);
            }
        }

        throw new Error(`Falha ao carregar módulo ${moduleName} após ${attempts} tentativas: ${lastError.message}`);
    }

    /**
     * Carrega o script do módulo
     */
    async loadModuleScript(moduleName, useCache = true) {
        // Verifica cache primeiro
        if (useCache && this.cache.has(moduleName)) {
            return this.cache.get(moduleName);
        }

        const modulePath = this.getModulePath(moduleName);
        
        return new Promise((resolve, reject) => {
            const script = document.createElement('script');
            script.type = 'module';
            script.src = modulePath;
            
            script.onload = () => {
                // Assume que o módulo exporta uma classe ou função
                const moduleExport = window[this.getModuleGlobalName(moduleName)];
                
                if (moduleExport) {
                    if (useCache) {
                        this.cache.set(moduleName, moduleExport);
                    }
                    resolve(moduleExport);
                } else {
                    reject(new Error(`Módulo ${moduleName} não exportou corretamente`));
                }
                
                document.head.removeChild(script);
            };
            
            script.onerror = () => {
                document.head.removeChild(script);
                reject(new Error(`Erro ao carregar script ${modulePath}`));
            };
            
            document.head.appendChild(script);
        });
    }

    /**
     * Preload de módulos críticos
     */
    async preloadCriticalModules() {
        const criticalModules = [
            'ApiService',
            'NotificationService',
            'Modal'
        ];

        const preloadPromises = criticalModules.map(module => 
            this.preloadModule(module)
        );

        try {
            await Promise.allSettled(preloadPromises);
        } catch (error) {
            console.warn('Erro no preload de módulos críticos:', error);
        }
    }

    /**
     * Preload de um módulo (apenas download, não execução)
     */
    preloadModule(moduleName) {
        return new Promise((resolve, reject) => {
            const link = document.createElement('link');
            link.rel = 'modulepreload';
            link.href = this.getModulePath(moduleName);
            
            link.onload = resolve;
            link.onerror = reject;
            
            document.head.appendChild(link);
        });
    }

    /**
     * Carrega múltiplos módulos em paralelo
     */
    async loadModules(moduleNames, options = {}) {
        const loadPromises = moduleNames.map(name => 
            this.loadModule(name, options)
        );

        return Promise.all(loadPromises);
    }

    /**
     * Carrega módulos em sequência
     */
    async loadModulesSequential(moduleNames, options = {}) {
        const modules = [];
        
        for (const moduleName of moduleNames) {
            const module = await this.loadModule(moduleName, options);
            modules.push(module);
        }
        
        return modules;
    }

    /**
     * Remove módulo do cache
     */
    unloadModule(moduleName) {
        this.loadedModules.delete(moduleName);
        this.cache.delete(moduleName);
        this.loadingPromises.delete(moduleName);
    }

    /**
     * Limpa todo o cache
     */
    clearCache() {
        this.cache.clear();
        this.loadedModules.clear();
        this.loadingPromises.clear();
    }

    /**
     * Obtém estatísticas de carregamento
     */
    getStats() {
        return {
            loadedModules: this.loadedModules.size,
            cachedModules: this.cache.size,
            loadingModules: this.loadingPromises.size,
            moduleList: Array.from(this.loadedModules.keys())
        };
    }

    /**
     * Utilitários
     */
    getModulePath(moduleName) {
        const basePath = '/frontend/js';
        const moduleMap = {
            'ApiService': `${basePath}/services/ApiService.js`,
            'NotificationService': `${basePath}/services/NotificationService.js`,
            'Dashboard': `${basePath}/components/Dashboard.js`,
            'DataTable': `${basePath}/components/DataTable.js`,
            'Modal': `${basePath}/components/Modal.js`,
            'LazyLoader': `${basePath}/utils/LazyLoader.js`,
            'ComponentRegistry': `${basePath}/utils/ComponentRegistry.js`
        };

        return moduleMap[moduleName] || `${basePath}/components/${moduleName}.js`;
    }

    getModuleGlobalName(moduleName) {
        return moduleName;
    }

    createTimeoutPromise(timeout) {
        return new Promise((_, reject) => {
            setTimeout(() => {
                reject(new Error(`Timeout de ${timeout}ms excedido`));
            }, timeout);
        });
    }

    delay(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    /**
     * Setup do Service Worker para cache
     */
    async setupServiceWorker() {
        if ('serviceWorker' in navigator) {
            try {
                await navigator.serviceWorker.register('/sw.js');
            } catch (error) {
                console.warn('Service Worker não pôde ser registrado:', error);
            }
        }
    }

    /**
     * Carregamento baseado em rota
     */
    async loadRouteModules(route) {
        const routeModules = {
            'dashboard': ['Dashboard', 'ApiService'],
            'produtos': ['DataTable', 'Modal', 'ApiService'],
            'fornecedores': ['DataTable', 'Modal', 'ApiService'],
            'pedidos': ['DataTable', 'Modal', 'ApiService'],
            'cotacoes': ['DataTable', 'Modal', 'ApiService']
        };

        const modules = routeModules[route] || [];
        return this.loadModules(modules);
    }

    /**
     * Carregamento baseado em interação do usuário
     */
    async loadOnDemand(trigger, modules) {
        return new Promise((resolve) => {
            const handler = async () => {
                trigger.removeEventListener('click', handler);
                trigger.removeEventListener('mouseenter', handler);
                
                try {
                    const loadedModules = await this.loadModules(modules);
                    resolve(loadedModules);
                } catch (error) {
                    log.error({
                        message: error.message,
                        stack: error.stack,
                        component: 'module-loader-preload',
                        module: moduleName
                    });
                    resolve([]);
                }
            };

            trigger.addEventListener('click', handler, { once: true });
            trigger.addEventListener('mouseenter', handler, { once: true });
        });
    }
}

// Instância global
window.ModuleLoader = new ModuleLoader();

// Export para uso em módulos
if (typeof module !== 'undefined' && module.exports) {
    module.exports = ModuleLoader;
}