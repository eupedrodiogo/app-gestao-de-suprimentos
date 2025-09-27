const express = require('express');
const path = require('path');
const cors = require('cors');

const app = express();
const PORT = 3001;

// CORS muito simples - permite tudo
app.use(cors({
    origin: '*',
    credentials: false,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['*']
}));

// Middleware básico
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Servir arquivos estáticos
app.use(express.static(path.join(__dirname, 'frontend')));

// Dados de teste simples
const testData = {
    products: [
        { id: 1, name: 'Produto A', price: 100, stock: 50 },
        { id: 2, name: 'Produto B', price: 200, stock: 30 },
        { id: 3, name: 'Produto C', price: 150, stock: 25 }
    ],
    suppliers: [
        { id: 1, name: 'Fornecedor A', contact: 'contato@a.com' },
        { id: 2, name: 'Fornecedor B', contact: 'contato@b.com' }
    ],
    quotes: [
        { id: 1, product: 'Produto A', supplier: 'Fornecedor A', price: 95 },
        { id: 2, product: 'Produto B', supplier: 'Fornecedor B', price: 190 }
    ],
    orders: [
        { id: 1, product: 'Produto A', quantity: 10, status: 'Pendente' },
        { id: 2, product: 'Produto B', quantity: 5, status: 'Entregue' }
    ]
};

// APIs simples
app.get('/api/products', (req, res) => {
    console.log('📦 API Products chamada');
    res.json(testData.products);
});

app.get('/api/suppliers', (req, res) => {
    console.log('🏢 API Suppliers chamada');
    res.json(testData.suppliers);
});

app.get('/api/quotes', (req, res) => {
    console.log('💰 API Quotes chamada');
    res.json(testData.quotes);
});

app.get('/api/orders', (req, res) => {
    console.log('📋 API Orders chamada');
    res.json(testData.orders);
});

app.get('/api/health', (req, res) => {
    console.log('❤️ API Health chamada');
    res.json({ status: 'OK', timestamp: new Date().toISOString() });
});

// Rota principal
app.get('/', (req, res) => {
    console.log('🏠 Página principal acessada');
    res.sendFile(path.join(__dirname, 'frontend', 'index.html'));
});

// Rota para mobile
app.get('/mobile', (req, res) => {
    console.log('📱 Página mobile acessada');
    res.sendFile(path.join(__dirname, 'frontend', 'mobile-simples.html'));
});

// Middleware de erro simples
app.use((err, req, res, next) => {
    console.error('❌ Erro:', err.message);
    res.status(500).json({ error: 'Erro interno do servidor' });
});

// Iniciar servidor
app.listen(PORT, '0.0.0.0', () => {
    console.log('🚀 Servidor de teste iniciado!');
    console.log(`📍 Porta: ${PORT}`);
    console.log('🌐 URLs para teste:');
    console.log(`   Local: http://localhost:${PORT}`);
    console.log(`   Rede: http://192.168.1.6:${PORT}`);
    console.log(`   Mobile: http://192.168.1.6:${PORT}/mobile`);
    console.log('🔧 APIs disponíveis:');
    console.log(`   Products: http://192.168.1.6:${PORT}/api/products`);
    console.log(`   Suppliers: http://192.168.1.6:${PORT}/api/suppliers`);
    console.log(`   Quotes: http://192.168.1.6:${PORT}/api/quotes`);
    console.log(`   Orders: http://192.168.1.6:${PORT}/api/orders`);
    console.log(`   Health: http://192.168.1.6:${PORT}/api/health`);
    console.log('✅ Servidor sem middlewares de segurança - ideal para teste!');
});