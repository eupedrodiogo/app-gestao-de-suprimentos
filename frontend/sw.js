// Service Worker - Placeholder para evitar erro 404
// Este arquivo foi criado para resolver erros de carregamento

self.addEventListener('install', function(event) {
  console.log('Service Worker instalado');
});

self.addEventListener('activate', function(event) {
  console.log('Service Worker ativado');
});

self.addEventListener('fetch', function(event) {
  // Não interceptar requisições por enquanto
});