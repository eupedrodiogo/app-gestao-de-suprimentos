/**
 * Serviço de API - Centraliza todas as requisições HTTP
 */

export class ApiService {
    constructor() {
        this.baseURL = 'http://localhost:3000/api';
        this.timeout = 10000; // 10 segundos
        this.defaultHeaders = {
            'Content-Type': 'application/json',
            'Accept': 'application/json'
        };
        
        // Cache para requisições
        this.cache = new Map();
        this.cacheTimeout = 5 * 60 * 1000; // 5 minutos
        
        // Interceptors
        this.requestInterceptors = [];
        this.responseInterceptors = [];
        
        this.setupInterceptors();
    }

    /**
     * Configura interceptors padrão
     */
    setupInterceptors() {
        // Request interceptor para adicionar token de autenticação
        this.addRequestInterceptor((config) => {
            const token = localStorage.getItem('auth_token');
            if (token) {
                config.headers.Authorization = `Bearer ${token}`;
            }
            return config;
        });

        // Response interceptor para tratar erros globais
        this.addResponseInterceptor(
            (response) => response,
            (error) => {
                if (error.status === 401) {
                    // Token expirado ou inválido
                    localStorage.removeItem('auth_token');
                    window.location.href = '/login';
                }
                return Promise.reject(error);
            }
        );
    }

    /**
     * Adiciona interceptor de requisição
     */
    addRequestInterceptor(interceptor) {
        this.requestInterceptors.push(interceptor);
    }

    /**
     * Adiciona interceptor de resposta
     */
    addResponseInterceptor(onSuccess, onError) {
        this.responseInterceptors.push({ onSuccess, onError });
    }

    /**
     * Executa interceptors de requisição
     */
    async executeRequestInterceptors(config) {
        let processedConfig = { ...config };
        
        for (const interceptor of this.requestInterceptors) {
            try {
                processedConfig = await interceptor(processedConfig);
            } catch (error) {
                console.error('Erro no interceptor de requisição:', error);
            }
        }
        
        return processedConfig;
    }

    /**
     * Executa interceptors de resposta
     */
    async executeResponseInterceptors(response, error = null) {
        for (const interceptor of this.responseInterceptors) {
            try {
                if (error && interceptor.onError) {
                    error = await interceptor.onError(error);
                } else if (!error && interceptor.onSuccess) {
                    response = await interceptor.onSuccess(response);
                }
            } catch (interceptorError) {
                console.error('Erro no interceptor de resposta:', interceptorError);
            }
        }
        
        return error || response;
    }

    /**
     * Método principal para fazer requisições HTTP
     */
    async request(config) {
        try {
            // Aplicar configurações padrão
            const finalConfig = {
                method: 'GET',
                headers: { ...this.defaultHeaders },
                timeout: this.timeout,
                ...config,
                url: config.url.startsWith('http') ? config.url : `${this.baseURL}${config.url}`
            };

            // Executar interceptors de requisição
            const processedConfig = await this.executeRequestInterceptors(finalConfig);

            // Verificar cache para requisições GET
            if (processedConfig.method === 'GET' && processedConfig.cache !== false) {
                const cached = this.getFromCache(processedConfig.url);
                if (cached) {
                    return cached;
                }
            }

            // Fazer a requisição
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), processedConfig.timeout);

            const response = await fetch(processedConfig.url, {
                method: processedConfig.method,
                headers: processedConfig.headers,
                body: processedConfig.data ? JSON.stringify(processedConfig.data) : undefined,
                signal: controller.signal
            });

            clearTimeout(timeoutId);

            // Verificar se a resposta foi bem-sucedida
            if (!response.ok) {
                const error = new Error(`HTTP Error: ${response.status}`);
                error.status = response.status;
                error.statusText = response.statusText;
                
                try {
                    error.data = await response.json();
                } catch {
                    error.data = await response.text();
                }
                
                throw error;
            }

            // Processar resposta
            let data;
            const contentType = response.headers.get('content-type');
            
            if (contentType && contentType.includes('application/json')) {
                data = await response.json();
            } else {
                data = await response.text();
            }

            const result = {
                data,
                status: response.status,
                statusText: response.statusText,
                headers: response.headers,
                config: processedConfig
            };

            // Cachear resposta para requisições GET
            if (processedConfig.method === 'GET' && processedConfig.cache !== false) {
                this.setCache(processedConfig.url, result);
            }

            // Executar interceptors de resposta
            return await this.executeResponseInterceptors(result);

        } catch (error) {
            // Tratar diferentes tipos de erro
            if (error.name === 'AbortError') {
                error.message = 'Requisição cancelada por timeout';
                error.code = 'TIMEOUT';
            } else if (!navigator.onLine) {
                error.message = 'Sem conexão com a internet';
                error.code = 'NETWORK_ERROR';
            }

            // Executar interceptors de erro
            const processedError = await this.executeResponseInterceptors(null, error);
            throw processedError;
        }
    }

    /**
     * Métodos de conveniência para diferentes tipos de requisição
     */
    async get(url, config = {}) {
        return this.request({ ...config, method: 'GET', url });
    }

    async post(url, data, config = {}) {
        return this.request({ ...config, method: 'POST', url, data });
    }

    async put(url, data, config = {}) {
        return this.request({ ...config, method: 'PUT', url, data });
    }

    async patch(url, data, config = {}) {
        return this.request({ ...config, method: 'PATCH', url, data });
    }

    async delete(url, config = {}) {
        return this.request({ ...config, method: 'DELETE', url });
    }

    /**
     * Métodos específicos da API do sistema
     */

    // Dashboard
    async getDashboardStats() {
        return this.get('/dashboard/stats');
    }

    async getSystemHealth() {
        return this.get('/health');
    }

    // Produtos
    async getProducts(params = {}) {
        const queryString = new URLSearchParams(params).toString();
        return this.get(`/products${queryString ? `?${queryString}` : ''}`);
    }

    async getProduct(id) {
        return this.get(`/products/${id}`);
    }

    async createProduct(productData) {
        return this.post('/products', productData);
    }

    async updateProduct(id, productData) {
        return this.put(`/products/${id}`, productData);
    }

    async deleteProduct(id) {
        return this.delete(`/products/${id}`);
    }

    // Fornecedores
    async getSuppliers(params = {}) {
        const queryString = new URLSearchParams(params).toString();
        return this.get(`/suppliers${queryString ? `?${queryString}` : ''}`);
    }

    async getSupplier(id) {
        return this.get(`/suppliers/${id}`);
    }

    async createSupplier(supplierData) {
        return this.post('/suppliers', supplierData);
    }

    async updateSupplier(id, supplierData) {
        return this.put(`/suppliers/${id}`, supplierData);
    }

    async deleteSupplier(id) {
        return this.delete(`/suppliers/${id}`);
    }

    // Pedidos
    async getOrders(params = {}) {
        const queryString = new URLSearchParams(params).toString();
        return this.get(`/orders${queryString ? `?${queryString}` : ''}`);
    }

    async getOrder(id) {
        return this.get(`/orders/${id}`);
    }

    async createOrder(orderData) {
        return this.post('/orders', orderData);
    }

    async updateOrder(id, orderData) {
        return this.put(`/orders/${id}`, orderData);
    }

    async deleteOrder(id) {
        return this.delete(`/orders/${id}`);
    }

    async updateOrderStatus(id, status) {
        return this.patch(`/orders/${id}/status`, { status });
    }

    // Cotações
    async getQuotes(params = {}) {
        const queryString = new URLSearchParams(params).toString();
        return this.get(`/quotes${queryString ? `?${queryString}` : ''}`);
    }

    async createQuote(quoteData) {
        return this.post('/quotes', quoteData);
    }

    async updateQuote(id, quoteData) {
        return this.put(`/quotes/${id}`, quoteData);
    }

    async deleteQuote(id) {
        return this.delete(`/quotes/${id}`);
    }

    /**
     * Métodos de cache
     */
    getFromCache(url) {
        const cached = this.cache.get(url);
        if (cached && Date.now() - cached.timestamp < this.cacheTimeout) {
            return cached.data;
        }
        this.cache.delete(url);
        return null;
    }

    setCache(url, data) {
        this.cache.set(url, {
            data,
            timestamp: Date.now()
        });
    }

    clearCache() {
        this.cache.clear();
    }

    /**
     * Métodos utilitários
     */
    isOnline() {
        return navigator.onLine;
    }

    async testConnection() {
        try {
            await this.get('/health', { timeout: 5000 });
            return true;
        } catch {
            return false;
        }
    }

    /**
     * Upload de arquivos
     */
    async uploadFile(file, onProgress = null) {
        const formData = new FormData();
        formData.append('file', file);

        return new Promise((resolve, reject) => {
            const xhr = new XMLHttpRequest();

            // Configurar progresso
            if (onProgress) {
                xhr.upload.addEventListener('progress', (e) => {
                    if (e.lengthComputable) {
                        const percentComplete = (e.loaded / e.total) * 100;
                        onProgress(percentComplete);
                    }
                });
            }

            xhr.addEventListener('load', () => {
                if (xhr.status >= 200 && xhr.status < 300) {
                    try {
                        const response = JSON.parse(xhr.responseText);
                        resolve(response);
                    } catch {
                        resolve(xhr.responseText);
                    }
                } else {
                    reject(new Error(`Upload failed: ${xhr.status}`));
                }
            });

            xhr.addEventListener('error', () => {
                reject(new Error('Upload failed'));
            });

            xhr.open('POST', `${this.baseURL}/upload`);
            
            // Adicionar headers de autenticação
            const token = localStorage.getItem('auth_token');
            if (token) {
                xhr.setRequestHeader('Authorization', `Bearer ${token}`);
            }

            xhr.send(formData);
        });
    }

    /**
     * Destruir serviço
     */
    destroy() {
        this.clearCache();
        this.requestInterceptors = [];
        this.responseInterceptors = [];
    }
}