/**
 * Serviço de Sincronização de Dados
 * Gerencia a sincronização de dados entre diferentes páginas e abas do sistema
 */
class DataSyncService {
    constructor() {
        this.listeners = new Map();
        this.lastUpdate = new Map();
        this.syncInterval = null;
        this.isActive = false;
        
        // Configurações
        this.config = {
            syncIntervalMs: 2000, // Sincronização a cada 2 segundos
            storagePrefix: 'supply_sync_',
            eventPrefix: 'supply_data_'
        };

        this.init();
    }

    /**
     * Inicializa o serviço de sincronização
     */
    init() {
        // Escuta eventos de storage para sincronização entre abas
        window.addEventListener('storage', (e) => {
            if (e.key && e.key.startsWith(this.config.storagePrefix)) {
                this.handleStorageChange(e);
            }
        });

        // Escuta eventos customizados para sincronização na mesma aba
        window.addEventListener('beforeunload', () => {
            this.cleanup();
        });

        this.isActive = true;
        console.log('🔄 DataSyncService inicializado');
    }

    /**
     * Registra um listener para um tipo de dados
     */
    registerListener(dataType, callback) {
        if (!this.listeners.has(dataType)) {
            this.listeners.set(dataType, new Set());
        }
        this.listeners.get(dataType).add(callback);
    }

    /**
     * Alias para registerListener (compatibilidade)
     */
    addListener(dataType, callback) {
        return this.registerListener(dataType, callback);
        
        console.log(`📡 Listener registrado para: ${dataType}`);
    }

    /**
     * Remove um listener
     */
    unregisterListener(dataType, callback) {
        if (this.listeners.has(dataType)) {
            this.listeners.get(dataType).delete(callback);
        }
    }

    /**
     * Notifica sobre mudanças nos dados
     */
    notifyDataChange(dataType, data, source = 'unknown') {
        const timestamp = Date.now();
        const changeEvent = {
            dataType,
            data,
            timestamp,
            source,
            id: this.generateId()
        };

        // Armazena no localStorage para sincronização entre abas
        const storageKey = `${this.config.storagePrefix}${dataType}`;
        localStorage.setItem(storageKey, JSON.stringify(changeEvent));

        // Atualiza timestamp local
        this.lastUpdate.set(dataType, timestamp);

        // Notifica listeners locais
        this.notifyLocalListeners(dataType, data, changeEvent);

        console.log(`🔄 Dados sincronizados: ${dataType}`, { source, timestamp });
    }

    /**
     * Notifica listeners locais
     */
    notifyLocalListeners(dataType, data, changeEvent) {
        if (this.listeners.has(dataType)) {
            this.listeners.get(dataType).forEach(callback => {
                try {
                    callback(data, changeEvent);
                } catch (error) {
                    console.error(`❌ Erro ao notificar listener para ${dataType}:`, error);
                }
            });
        }
    }

    /**
     * Manipula mudanças no storage (entre abas)
     */
    handleStorageChange(event) {
        try {
            const dataType = event.key.replace(this.config.storagePrefix, '');
            const changeEvent = JSON.parse(event.newValue);
            
            if (!changeEvent) return;

            // Verifica se é uma mudança mais recente
            const lastUpdate = this.lastUpdate.get(dataType) || 0;
            if (changeEvent.timestamp <= lastUpdate) {
                return; // Ignora mudanças antigas
            }

            // Atualiza timestamp local
            this.lastUpdate.set(dataType, changeEvent.timestamp);

            // Notifica listeners locais
            this.notifyLocalListeners(dataType, changeEvent.data, changeEvent);

            console.log(`🔄 Sincronização recebida de outra aba: ${dataType}`);
        } catch (error) {
            console.error('❌ Erro ao processar mudança de storage:', error);
        }
    }

    /**
     * Força sincronização de um tipo de dados
     */
    async forceSyncData(dataType) {
        try {
            let data = null;
            let endpoint = '';

            // Mapeia tipos de dados para endpoints
            switch (dataType) {
                case 'products':
                    endpoint = '/api/produtos';
                    break;
                case 'suppliers':
                    endpoint = '/api/fornecedores';
                    break;
                case 'quotes':
                    endpoint = '/api/cotacoes';
                    break;
                case 'orders':
                    endpoint = '/api/pedidos';
                    break;
                case 'dashboard':
                    // Para dashboard, busca todos os dados
                    await this.forceSyncData('products');
                    await this.forceSyncData('suppliers');
                    await this.forceSyncData('quotes');
                    await this.forceSyncData('orders');
                    return;
                default:
                    console.warn(`⚠️ Tipo de dados não reconhecido: ${dataType}`);
                    return;
            }

            // Busca dados da API
            const response = await fetch(`${endpoint}`);
            if (response.ok) {
                data = await response.json();
                this.notifyDataChange(dataType, data, 'force_sync');
            } else {
                console.error(`❌ Erro ao buscar dados: ${endpoint}`);
            }
        } catch (error) {
            console.error(`❌ Erro na sincronização forçada de ${dataType}:`, error);
        }
    }

    /**
     * Inicia sincronização automática
     */
    startAutoSync() {
        if (this.syncInterval) {
            clearInterval(this.syncInterval);
        }

        this.syncInterval = setInterval(async () => {
            try {
                // Verifica se há mudanças no servidor antes de sincronizar
                const shouldSync = await this.checkForUpdates();
                if (shouldSync) {
                    // Sincroniza dados principais
                    this.forceSyncData('products');
                    this.forceSyncData('suppliers');
                    this.forceSyncData('quotes');
                    this.forceSyncData('orders');
                }
            } catch (error) {
                console.error('❌ Erro na sincronização automática:', error);
                // Em caso de erro, força sincronização para garantir dados atualizados
                this.forceSyncData('products');
                this.forceSyncData('suppliers');
                this.forceSyncData('quotes');
                this.forceSyncData('orders');
            }
        }, this.config.syncIntervalMs);

        console.log('🔄 Sincronização automática iniciada');
    }

    /**
     * Verifica se há atualizações no servidor
     */
    async checkForUpdates() {
        try {
            const response = await fetch('/api/health');
            const healthData = await response.json();
            
            const serverTimestamp = new Date(healthData.timestamp).getTime();
            const lastCheck = this.lastUpdate.get('server_check') || 0;
            
            // Se o timestamp do servidor é mais recente que nossa última verificação
            if (serverTimestamp > lastCheck) {
                this.lastUpdate.set('server_check', serverTimestamp);
                return true;
            }
            
            return false;
        } catch (error) {
            console.error('❌ Erro ao verificar atualizações:', error);
            return true; // Em caso de erro, assume que há atualizações
        }
    }

    /**
     * Para sincronização automática
     */
    stopAutoSync() {
        if (this.syncInterval) {
            clearInterval(this.syncInterval);
            this.syncInterval = null;
        }
        console.log('⏹️ Sincronização automática parada');
    }

    /**
     * Obtém dados do cache local
     */
    getCachedData(dataType) {
        try {
            const storageKey = `${this.config.storagePrefix}${dataType}`;
            const cached = localStorage.getItem(storageKey);
            if (cached) {
                const changeEvent = JSON.parse(cached);
                return changeEvent.data;
            }
        } catch (error) {
            console.error(`❌ Erro ao obter dados em cache para ${dataType}:`, error);
        }
        return null;
    }

    /**
     * Limpa dados de sincronização
     */
    cleanup() {
        this.stopAutoSync();
        
        // Remove dados de sincronização do localStorage
        Object.keys(localStorage).forEach(key => {
            if (key.startsWith(this.config.storagePrefix)) {
                localStorage.removeItem(key);
            }
        });

        this.isActive = false;
        console.log('🧹 DataSyncService limpo');
    }

    /**
     * Gera ID único para eventos
     */
    generateId() {
        return `${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    }

    /**
     * Verifica se o serviço está ativo
     */
    isServiceActive() {
        return this.isActive;
    }

    /**
     * Obtém estatísticas de sincronização
     */
    getStats() {
        return {
            isActive: this.isActive,
            listenersCount: Array.from(this.listeners.values()).reduce((total, set) => total + set.size, 0),
            lastUpdates: Object.fromEntries(this.lastUpdate),
            autoSyncActive: !!this.syncInterval
        };
    }
}

// Instância global do serviço
window.DataSyncService = window.DataSyncService || new DataSyncService();

// Exporta para uso em módulos
if (typeof module !== 'undefined' && module.exports) {
    module.exports = DataSyncService;
}