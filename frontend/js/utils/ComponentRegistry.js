/**
 * ComponentRegistry - Sistema de registro e gerenciamento de componentes reutilizáveis
 */

import log from './logger.js';

export class ComponentRegistry {
    constructor() {
        this.components = new Map();
        this.instances = new Map();
        this.config = {
            autoInit: true,
            autoDestroy: true,
            enableHotReload: false,
            debug: false
        };
        
        this.init();
    }

    /**
     * Inicializa o registro de componentes
     */
    init() {
        // Auto-inicializar componentes existentes no DOM
        if (this.config.autoInit) {
            this.initializeExistingComponents();
        }

        // Observar mudanças no DOM
        this.setupDOMObserver();
        
        // Configurar hot reload se habilitado
        if (this.config.enableHotReload) {
            this.setupHotReload();
        }
    }

    /**
     * Registra um componente
     */
    register(name, ComponentClass, options = {}) {
        if (this.components.has(name)) {
            this.log(`Componente '${name}' já registrado. Substituindo...`);
        }

        const componentConfig = {
            ComponentClass,
            selector: options.selector || `[data-component="${name}"]`,
            autoInit: options.autoInit !== false,
            singleton: options.singleton || false,
            dependencies: options.dependencies || [],
            props: options.props || {},
            ...options
        };

        this.components.set(name, componentConfig);
        this.log(`Componente '${name}' registrado`);

        // Auto-inicializar se configurado
        if (componentConfig.autoInit && this.config.autoInit) {
            this.initializeComponent(name);
        }

        return this;
    }

    /**
     * Remove registro de um componente
     */
    unregister(name) {
        if (!this.components.has(name)) {
            this.log(`Componente '${name}' não encontrado`);
            return this;
        }

        // Destruir instâncias existentes
        this.destroyInstances(name);
        
        // Remover do registro
        this.components.delete(name);
        this.log(`Componente '${name}' removido do registro`);

        return this;
    }

    /**
     * Inicializa um componente específico
     */
    async initializeComponent(name, container = document) {
        const config = this.components.get(name);
        if (!config) {
            throw new Error(`Componente '${name}' não registrado`);
        }

        // Verificar dependências
        await this.resolveDependencies(config.dependencies);

        // Encontrar elementos no DOM
        const elements = container.querySelectorAll(config.selector);
        
        for (const element of elements) {
            await this.createInstance(name, element, config);
        }

        return this;
    }

    /**
     * Cria uma instância de componente
     */
    async createInstance(name, element, config = null) {
        if (!config) {
            config = this.components.get(name);
            if (!config) {
                throw new Error(`Componente '${name}' não registrado`);
            }
        }

        // Verificar se já existe instância para este elemento
        const existingInstance = this.getInstance(element);
        if (existingInstance) {
            this.log(`Instância já existe para elemento:`, element);
            return existingInstance;
        }

        // Verificar singleton
        if (config.singleton) {
            const existingInstances = this.getInstances(name);
            if (existingInstances.length > 0) {
                this.log(`Componente '${name}' é singleton. Retornando instância existente.`);
                return existingInstances[0];
            }
        }

        try {
            // Extrair props do elemento
            const elementProps = this.extractElementProps(element);
            const mergedProps = { ...config.props, ...elementProps };

            // Criar instância
            const instance = new config.ComponentClass(element, mergedProps);
            
            // Armazenar referências
            const instanceId = this.generateInstanceId();
            const instanceData = {
                id: instanceId,
                name,
                instance,
                element,
                config,
                createdAt: Date.now()
            };

            this.instances.set(instanceId, instanceData);
            element._componentInstance = instanceData;
            element.dataset.componentId = instanceId;

            // Marcar como inicializado
            element.classList.add('component-initialized');
            element.classList.add(`component-${name}`);

            this.log(`Instância criada para '${name}':`, instanceId);

            // Emitir evento
            this.emit('componentCreated', { name, instance, element, instanceId });

            return instance;

        } catch (error) {
            log.error({
                message: error.message,
                stack: error.stack,
                component: 'component-registry',
                componentName: name
            });
            element.classList.add('component-error');
            throw error;
        }
    }

    /**
     * Destrói uma instância específica
     */
    destroyInstance(instanceId) {
        const instanceData = this.instances.get(instanceId);
        if (!instanceData) {
            this.log(`Instância '${instanceId}' não encontrada`);
            return this;
        }

        const { name, instance, element } = instanceData;

        try {
            // Chamar método destroy se existir
            if (instance && typeof instance.destroy === 'function') {
                instance.destroy();
            }

            // Limpar referências do elemento
            delete element._componentInstance;
            delete element.dataset.componentId;
            
            // Remover classes
            element.classList.remove('component-initialized');
            element.classList.remove(`component-${name}`);
            element.classList.remove('component-error');

            // Remover do registro
            this.instances.delete(instanceId);

            this.log(`Instância '${instanceId}' destruída`);

            // Emitir evento
            this.emit('componentDestroyed', { name, instanceId, element });

        } catch (error) {
            log.error({
                message: error.message,
                stack: error.stack,
                component: 'component-registry',
                instanceId: instanceId
            });
        }

        return this;
    }

    /**
     * Destrói todas as instâncias de um componente
     */
    destroyInstances(name) {
        const instances = this.getInstances(name);
        instances.forEach(instanceData => {
            this.destroyInstance(instanceData.id);
        });

        return this;
    }

    /**
     * Obtém instância por elemento
     */
    getInstance(element) {
        return element._componentInstance?.instance || null;
    }

    /**
     * Obtém todas as instâncias de um componente
     */
    getInstances(name) {
        return Array.from(this.instances.values()).filter(
            instanceData => instanceData.name === name
        );
    }

    /**
     * Obtém instância por ID
     */
    getInstanceById(instanceId) {
        const instanceData = this.instances.get(instanceId);
        return instanceData?.instance || null;
    }

    /**
     * Obtém dados da instância por ID
     */
    getInstanceData(instanceId) {
        return this.instances.get(instanceId) || null;
    }

    /**
     * Extrai props do elemento
     */
    extractElementProps(element) {
        const props = {};

        // Props via data attributes
        Object.keys(element.dataset).forEach(key => {
            if (key.startsWith('prop')) {
                const propName = key.replace('prop', '').toLowerCase();
                let value = element.dataset[key];

                // Tentar parsear como JSON
                try {
                    value = JSON.parse(value);
                } catch (e) {
                    // Manter como string se não for JSON válido
                }

                props[propName] = value;
            }
        });

        // Props via atributos específicos
        const configAttr = element.getAttribute('data-config');
        if (configAttr) {
            try {
                const config = JSON.parse(configAttr);
                Object.assign(props, config);
            } catch (e) {
                console.warn('Configuração inválida no elemento:', configAttr);
            }
        }

        return props;
    }

    /**
     * Resolve dependências de um componente
     */
    async resolveDependencies(dependencies) {
        if (!dependencies || dependencies.length === 0) return;

        const promises = dependencies.map(async (dep) => {
            if (typeof dep === 'string') {
                // Dependência simples - verificar se está registrada
                if (!this.components.has(dep)) {
                    throw new Error(`Dependência '${dep}' não registrada`);
                }
            } else if (typeof dep === 'object') {
                // Dependência com configuração
                const { name, url, global } = dep;
                
                if (url) {
                    // Carregar dependência externa
                    await this.loadExternalDependency(url, global);
                } else if (name && !this.components.has(name)) {
                    throw new Error(`Dependência '${name}' não registrada`);
                }
            }
        });

        await Promise.all(promises);
    }

    /**
     * Carrega dependência externa
     */
    async loadExternalDependency(url, globalName) {
        // Verificar se já foi carregada
        if (globalName && window[globalName]) {
            return window[globalName];
        }

        return new Promise((resolve, reject) => {
            const script = document.createElement('script');
            script.src = url;
            script.onload = () => {
                const result = globalName ? window[globalName] : true;
                resolve(result);
            };
            script.onerror = () => reject(new Error(`Falha ao carregar: ${url}`));
            
            document.head.appendChild(script);
        });
    }

    /**
     * Inicializa componentes existentes no DOM
     */
    initializeExistingComponents() {
        this.components.forEach((config, name) => {
            if (config.autoInit) {
                this.initializeComponent(name).catch(error => {
                    log.error({
                        message: error.message,
                        stack: error.stack,
                        component: 'component-registry',
                        componentName: name
                    });
                });
            }
        });
    }

    /**
     * Configura observador de mudanças no DOM
     */
    setupDOMObserver() {
        if (!('MutationObserver' in window)) return;

        this.domObserver = new MutationObserver((mutations) => {
            mutations.forEach((mutation) => {
                // Novos nós adicionados
                mutation.addedNodes.forEach((node) => {
                    if (node.nodeType === Node.ELEMENT_NODE) {
                        this.handleNewElement(node);
                    }
                });

                // Nós removidos
                if (this.config.autoDestroy) {
                    mutation.removedNodes.forEach((node) => {
                        if (node.nodeType === Node.ELEMENT_NODE) {
                            this.handleRemovedElement(node);
                        }
                    });
                }
            });
        });

        this.domObserver.observe(document.body, {
            childList: true,
            subtree: true
        });
    }

    /**
     * Manipula novos elementos adicionados ao DOM
     */
    handleNewElement(element) {
        // Verificar se o próprio elemento é um componente
        this.components.forEach((config, name) => {
            if (config.autoInit && element.matches(config.selector)) {
                this.createInstance(name, element, config).catch(error => {
                    log.error({
                        message: error.message,
                        stack: error.stack,
                        component: 'component-registry',
                        componentName: name
                    });
                });
            }
        });

        // Verificar elementos filhos
        this.components.forEach((config, name) => {
            if (config.autoInit) {
                const childElements = element.querySelectorAll(config.selector);
                childElements.forEach(childElement => {
                    this.createInstance(name, childElement, config).catch(error => {
                        log.error({
                            message: error.message,
                            stack: error.stack,
                            component: 'component-registry',
                            componentName: name
                        });
                    });
                });
            }
        });
    }

    /**
     * Manipula elementos removidos do DOM
     */
    handleRemovedElement(element) {
        // Verificar se o próprio elemento tinha componente
        if (element._componentInstance) {
            this.destroyInstance(element._componentInstance.id);
        }

        // Verificar elementos filhos
        const componentElements = element.querySelectorAll('[data-component-id]');
        componentElements.forEach(componentElement => {
            if (componentElement._componentInstance) {
                this.destroyInstance(componentElement._componentInstance.id);
            }
        });
    }

    /**
     * Configura hot reload para desenvolvimento
     */
    setupHotReload() {
        if (typeof module !== 'undefined' && module.hot) {
            module.hot.accept((error) => {
                if (error) {
                    log.error({
                        message: error.message,
                        stack: error.stack,
                        component: 'component-registry-hot-reload'
                    });
                } else {
                    this.reloadAllComponents();
                }
            });
        }
    }

    /**
     * Recarrega todos os componentes (hot reload)
     */
    reloadAllComponents() {
        this.log('Recarregando todos os componentes...');
        
        // Destruir todas as instâncias
        Array.from(this.instances.keys()).forEach(instanceId => {
            this.destroyInstance(instanceId);
        });

        // Reinicializar componentes
        setTimeout(() => {
            this.initializeExistingComponents();
        }, 100);
    }

    /**
     * Gera ID único para instância
     */
    generateInstanceId() {
        return `component_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    }

    /**
     * Sistema de eventos
     */
    emit(event, data) {
        const customEvent = new CustomEvent(`componentRegistry:${event}`, {
            detail: data
        });
        document.dispatchEvent(customEvent);
    }

    /**
     * Adiciona listener de evento
     */
    on(event, callback) {
        document.addEventListener(`componentRegistry:${event}`, callback);
    }

    /**
     * Remove listener de evento
     */
    off(event, callback) {
        document.removeEventListener(`componentRegistry:${event}`, callback);
    }

    /**
     * Log de debug
     */
    log(...args) {
        if (this.config.debug) {
            console.log('[ComponentRegistry]', ...args);
        }
    }

    /**
     * API pública
     */

    /**
     * Atualiza configuração
     */
    updateConfig(newConfig) {
        this.config = { ...this.config, ...newConfig };
        return this;
    }

    /**
     * Lista todos os componentes registrados
     */
    listComponents() {
        return Array.from(this.components.keys());
    }

    /**
     * Obtém configuração de um componente
     */
    getComponentConfig(name) {
        return this.components.get(name);
    }

    /**
     * Verifica se um componente está registrado
     */
    hasComponent(name) {
        return this.components.has(name);
    }

    /**
     * Obtém estatísticas do registro
     */
    getStats() {
        const componentStats = {};
        
        this.components.forEach((config, name) => {
            const instances = this.getInstances(name);
            componentStats[name] = {
                registered: true,
                instances: instances.length,
                autoInit: config.autoInit,
                singleton: config.singleton
            };
        });

        return {
            totalComponents: this.components.size,
            totalInstances: this.instances.size,
            components: componentStats
        };
    }

    /**
     * Força inicialização de todos os componentes
     */
    initializeAll(container = document) {
        const promises = Array.from(this.components.keys()).map(name => 
            this.initializeComponent(name, container)
        );
        
        return Promise.allSettled(promises);
    }

    /**
     * Destrói todas as instâncias
     */
    destroyAll() {
        Array.from(this.instances.keys()).forEach(instanceId => {
            this.destroyInstance(instanceId);
        });
        
        return this;
    }

    /**
     * Limpa o registro completamente
     */
    clear() {
        this.destroyAll();
        this.components.clear();
        
        if (this.domObserver) {
            this.domObserver.disconnect();
        }
        
        return this;
    }

    /**
     * Destrói o registro
     */
    destroy() {
        this.clear();
        this.emit('destroyed');
    }
}

// Instância global
const componentRegistry = new ComponentRegistry();

// Exportar instância e classe
export { componentRegistry };
export default ComponentRegistry;