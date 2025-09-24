// Service Worker - Limpo para evitar interferência na navegação
// Versão: 2.0 - Atualizada para resolver problemas de navegação

const CACHE_NAME = 'supplychain-v2';

self.addEventListener('install', function(event) {
  console.log('Service Worker instalado - v2.0');
  // Forçar ativação imediata
  self.skipWaiting();
});

self.addEventListener('activate', function(event) {
  console.log('Service Worker ativado - v2.0');
  
  // Limpar caches antigos
  event.waitUntil(
    caches.keys().then(function(cacheNames) {
      return Promise.all(
        cacheNames.map(function(cacheName) {
          if (cacheName !== CACHE_NAME) {
            console.log('Removendo cache antigo:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    }).then(function() {
      // Assumir controle de todas as páginas
      return self.clients.claim();
    })
  );
});

self.addEventListener('fetch', function(event) {
  // Permitir todas as requisições passarem sem cache
  // Isso garante que a navegação funcione normalmente
  console.log('Fetch interceptado:', event.request.url);
});