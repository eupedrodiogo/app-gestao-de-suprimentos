/**
 * Service Worker para cache e otimização de performance
 * Implementa estratégias de cache para diferentes tipos de recursos
 */

const CACHE_NAME = 'gestao-suprimentos-v1';
const STATIC_CACHE = 'static-v1';
const DYNAMIC_CACHE = 'dynamic-v1';
const API_CACHE = 'api-v1';

// Recursos para cache estático
const STATIC_ASSETS = [
    '/',
    '/frontend/css/main.css',
    '/frontend/js/core/app.js',
    '/frontend/js/services/ApiService.js',
    '/frontend/js/services/NotificationService.js',
    '/frontend/js/utils/LazyLoader.js',
    '/frontend/js/utils/ComponentRegistry.js',
    '/frontend/js/utils/ModuleLoader.js',
    '/frontend/js/utils/PerformanceMonitor.js'
];

// Recursos para cache dinâmico
const DYNAMIC_PATTERNS = [
    /\/frontend\/js\/components\/.+\.js$/,
    /\/frontend\/css\/components\/.+\.css$/,
    /\/frontend\/images\/.+\.(jpg|jpeg|png|gif|webp|svg)$/,
    /\/frontend\/fonts\/.+\.(woff|woff2|ttf|eot)$/
];

// APIs para cache
const API_PATTERNS = [
    /\/api\/dashboard/,
    /\/api\/produtos/,
    /\/api\/fornecedores/,
    /\/api\/pedidos/,
    /\/api\/cotacoes/
];

// Configurações de cache
const CACHE_CONFIG = {
    maxAge: {
        static: 7 * 24 * 60 * 60 * 1000, // 7 dias
        dynamic: 24 * 60 * 60 * 1000,    // 1 dia
        api: 5 * 60 * 1000               // 5 minutos
    },
    maxEntries: {
        dynamic: 100,
        api: 50
    }
};

/**
 * Instalação do Service Worker
 */
self.addEventListener('install', (event) => {
    console.log('Service Worker: Instalando...');
    
    event.waitUntil(
        caches.open(STATIC_CACHE)
            .then((cache) => {
                console.log('Service Worker: Cache estático criado');
                return cache.addAll(STATIC_ASSETS);
            })
            .then(() => {
                console.log('Service Worker: Recursos estáticos em cache');
                return self.skipWaiting();
            })
            .catch((error) => {
                console.error('Service Worker: Erro na instalação:', error);
            })
    );
});

/**
 * Ativação do Service Worker
 */
self.addEventListener('activate', (event) => {
    console.log('Service Worker: Ativando...');
    
    event.waitUntil(
        Promise.all([
            // Limpa caches antigos
            cleanOldCaches(),
            // Assume controle imediato
            self.clients.claim()
        ])
    );
});

/**
 * Interceptação de requisições
 */
self.addEventListener('fetch', (event) => {
    const { request } = event;
    const url = new URL(request.url);
    
    // Ignora requisições não-HTTP
    if (!request.url.startsWith('http')) {
        return;
    }
    
    // Estratégia baseada no tipo de recurso
    if (isStaticAsset(request)) {
        event.respondWith(handleStaticAsset(request));
    } else if (isDynamicAsset(request)) {
        event.respondWith(handleDynamicAsset(request));
    } else if (isApiRequest(request)) {
        event.respondWith(handleApiRequest(request));
    } else {
        event.respondWith(handleDefault(request));
    }
});

/**
 * Verifica se é um recurso estático
 */
function isStaticAsset(request) {
    return STATIC_ASSETS.some(asset => request.url.includes(asset));
}

/**
 * Verifica se é um recurso dinâmico
 */
function isDynamicAsset(request) {
    return DYNAMIC_PATTERNS.some(pattern => pattern.test(request.url));
}

/**
 * Verifica se é uma requisição de API
 */
function isApiRequest(request) {
    return API_PATTERNS.some(pattern => pattern.test(request.url));
}

/**
 * Manipula recursos estáticos (Cache First)
 */
async function handleStaticAsset(request) {
    try {
        const cachedResponse = await caches.match(request);
        
        if (cachedResponse) {
            // Verifica se o cache não expirou
            const cacheTime = await getCacheTime(request.url, STATIC_CACHE);
            if (cacheTime && (Date.now() - cacheTime) < CACHE_CONFIG.maxAge.static) {
                return cachedResponse;
            }
        }
        
        // Busca na rede e atualiza cache
        const networkResponse = await fetch(request);
        
        if (networkResponse.ok) {
            const cache = await caches.open(STATIC_CACHE);
            await cache.put(request, networkResponse.clone());
            await setCacheTime(request.url, STATIC_CACHE);
        }
        
        return networkResponse;
    } catch (error) {
        console.error('Erro ao buscar recurso estático:', error);
        
        // Fallback para cache mesmo expirado
        const cachedResponse = await caches.match(request);
        if (cachedResponse) {
            return cachedResponse;
        }
        
        throw error;
    }
}

/**
 * Manipula recursos dinâmicos (Stale While Revalidate)
 */
async function handleDynamicAsset(request) {
    try {
        const cache = await caches.open(DYNAMIC_CACHE);
        const cachedResponse = await cache.match(request);
        
        // Busca na rede em paralelo
        const networkPromise = fetch(request)
            .then(async (response) => {
                if (response.ok) {
                    await cache.put(request, response.clone());
                    await setCacheTime(request.url, DYNAMIC_CACHE);
                    await limitCacheSize(DYNAMIC_CACHE, CACHE_CONFIG.maxEntries.dynamic);
                }
                return response;
            })
            .catch(() => null);
        
        // Retorna cache imediatamente se disponível
        if (cachedResponse) {
            // Atualiza em background
            networkPromise.catch(() => {});
            return cachedResponse;
        }
        
        // Aguarda rede se não há cache
        return await networkPromise || new Response('Offline', { status: 503 });
    } catch (error) {
        console.error('Erro ao buscar recurso dinâmico:', error);
        return new Response('Erro interno', { status: 500 });
    }
}

/**
 * Manipula requisições de API (Network First)
 */
async function handleApiRequest(request) {
    try {
        // Tenta rede primeiro
        const networkResponse = await fetch(request);
        
        if (networkResponse.ok) {
            // Cache apenas GET requests
            if (request.method === 'GET') {
                const cache = await caches.open(API_CACHE);
                await cache.put(request, networkResponse.clone());
                await setCacheTime(request.url, API_CACHE);
                await limitCacheSize(API_CACHE, CACHE_CONFIG.maxEntries.api);
            }
        }
        
        return networkResponse;
    } catch (error) {
        console.error('Erro na requisição de API:', error);
        
        // Fallback para cache se disponível
        if (request.method === 'GET') {
            const cachedResponse = await caches.match(request);
            if (cachedResponse) {
                // Verifica se não expirou
                const cacheTime = await getCacheTime(request.url, API_CACHE);
                if (cacheTime && (Date.now() - cacheTime) < CACHE_CONFIG.maxAge.api) {
                    return cachedResponse;
                }
            }
        }
        
        return new Response(
            JSON.stringify({ error: 'Sem conexão com a internet' }),
            {
                status: 503,
                headers: { 'Content-Type': 'application/json' }
            }
        );
    }
}

/**
 * Manipula outras requisições
 */
async function handleDefault(request) {
    try {
        return await fetch(request);
    } catch (error) {
        console.error('Erro na requisição padrão:', error);
        
        // Fallback para página offline se for navegação
        if (request.mode === 'navigate') {
            return new Response(`
                <!DOCTYPE html>
                <html>
                <head>
                    <title>Offline - Gestão de Suprimentos</title>
                    <meta charset="utf-8">
                    <meta name="viewport" content="width=device-width, initial-scale=1">
                    <style>
                        body { font-family: Arial, sans-serif; text-align: center; padding: 50px; }
                        .offline { color: #666; }
                        .retry { margin-top: 20px; }
                        button { padding: 10px 20px; background: #007bff; color: white; border: none; border-radius: 4px; cursor: pointer; }
                    </style>
                </head>
                <body>
                    <div class="offline">
                        <h1>Você está offline</h1>
                        <p>Verifique sua conexão com a internet e tente novamente.</p>
                        <div class="retry">
                            <button onclick="location.reload()">Tentar novamente</button>
                        </div>
                    </div>
                </body>
                </html>
            `, {
                headers: { 'Content-Type': 'text/html' }
            });
        }
        
        throw error;
    }
}

/**
 * Limpa caches antigos
 */
async function cleanOldCaches() {
    const cacheNames = await caches.keys();
    const validCaches = [STATIC_CACHE, DYNAMIC_CACHE, API_CACHE];
    
    const deletePromises = cacheNames
        .filter(name => !validCaches.includes(name))
        .map(name => caches.delete(name));
    
    await Promise.all(deletePromises);
    console.log('Service Worker: Caches antigos removidos');
}

/**
 * Limita o tamanho do cache
 */
async function limitCacheSize(cacheName, maxEntries) {
    const cache = await caches.open(cacheName);
    const keys = await cache.keys();
    
    if (keys.length > maxEntries) {
        const deleteCount = keys.length - maxEntries;
        const deletePromises = keys
            .slice(0, deleteCount)
            .map(key => cache.delete(key));
        
        await Promise.all(deletePromises);
    }
}

/**
 * Define timestamp do cache
 */
async function setCacheTime(url, cacheName) {
    const timeCache = await caches.open(`${cacheName}-time`);
    const response = new Response(Date.now().toString());
    await timeCache.put(url, response);
}

/**
 * Obtém timestamp do cache
 */
async function getCacheTime(url, cacheName) {
    try {
        const timeCache = await caches.open(`${cacheName}-time`);
        const response = await timeCache.match(url);
        
        if (response) {
            const timeText = await response.text();
            return parseInt(timeText, 10);
        }
    } catch (error) {
        console.error('Erro ao obter tempo do cache:', error);
    }
    
    return null;
}

/**
 * Manipula mensagens do cliente
 */
self.addEventListener('message', (event) => {
    const { type, payload } = event.data;
    
    switch (type) {
        case 'SKIP_WAITING':
            self.skipWaiting();
            break;
            
        case 'CLEAR_CACHE':
            clearAllCaches().then(() => {
                event.ports[0].postMessage({ success: true });
            });
            break;
            
        case 'GET_CACHE_STATUS':
            getCacheStatus().then((status) => {
                event.ports[0].postMessage(status);
            });
            break;
    }
});

/**
 * Limpa todos os caches
 */
async function clearAllCaches() {
    const cacheNames = await caches.keys();
    const deletePromises = cacheNames.map(name => caches.delete(name));
    await Promise.all(deletePromises);
    console.log('Service Worker: Todos os caches limpos');
}

/**
 * Obtém status dos caches
 */
async function getCacheStatus() {
    const cacheNames = await caches.keys();
    const status = {};
    
    for (const name of cacheNames) {
        const cache = await caches.open(name);
        const keys = await cache.keys();
        status[name] = {
            entries: keys.length,
            urls: keys.map(key => key.url)
        };
    }
    
    return status;
}