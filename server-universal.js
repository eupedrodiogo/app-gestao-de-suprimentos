const express = require('express');
const cors = require('cors');
const path = require('path');
const fs = require('fs');
require('dotenv').config();

// Importar o servidor principal para reutilizar as APIs
const Database = require('./backend/database/database');
const ProductController = require('./backend/controllers/ProductController');
const SupplierController = require('./backend/controllers/SupplierController');
const QuoteController = require('./backend/controllers/QuoteController');
const OrderController = require('./backend/controllers/OrderController');
const InventoryController = require('./backend/controllers/InventoryController');

const app = express();
const PORT = process.env.PORT || 4000;

// Configuração de CORS mais permissiva
app.use(cors({
    origin: '*',
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'Cache-Control'],
    credentials: false
}));

// Middleware para parsing
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Servir arquivos estáticos
app.use(express.static(path.join(__dirname, 'frontend')));
app.use(express.static(__dirname));

// Função para detectar tipo de dispositivo com mais precisão
function detectDevice(userAgent, headers = {}) {
    const ua = userAgent.toLowerCase();
    
    // Verificar se é tablet primeiro (mais específico)
    if (/ipad/i.test(userAgent) || 
        (/android/i.test(userAgent) && !/mobile/i.test(userAgent)) ||
        /tablet/i.test(userAgent)) {
        return 'tablet';
    }
    
    // Verificar se é mobile
    if (/android|webos|iphone|ipod|blackberry|iemobile|opera mini|mobile|phone/i.test(userAgent) ||
        /mobi/i.test(userAgent) ||
        headers['sec-ch-ua-mobile'] === '?1') {
        return 'mobile';
    }
    
    // Verificar por tamanho de tela se disponível
    const screenWidth = headers['sec-ch-viewport-width'];
    if (screenWidth && parseInt(screenWidth) <= 768) {
        return 'mobile';
    }
    
    return 'desktop';
}

// Middleware para adicionar informações de dispositivo
function deviceDetectionMiddleware(req, res, next) {
    const userAgent = req.get('User-Agent') || '';
    const device = detectDevice(userAgent, req.headers);
    
    req.device = {
        type: device,
        userAgent: userAgent,
        isMobile: device === 'mobile',
        isTablet: device === 'tablet',
        isDesktop: device === 'desktop'
    };
    
    next();
}

// Função para detectar dispositivo mobile (compatibilidade)
function isMobileDevice(userAgent) {
    return detectDevice(userAgent) === 'mobile';
}

// Função para detectar se é tablet (compatibilidade)
function isTabletDevice(userAgent) {
    return detectDevice(userAgent) === 'tablet';
}

// Middleware de segurança básico
app.use((req, res, next) => {
    res.header('X-Content-Type-Options', 'nosniff');
    res.header('X-Frame-Options', 'DENY');
    res.header('X-XSS-Protection', '1; mode=block');
    next();
});

// Aplicar middleware de detecção de dispositivo
app.use(deviceDetectionMiddleware);

// Inicializar database e controllers
const db = new Database();
const productController = new ProductController();
const supplierController = new SupplierController();
const quoteController = new QuoteController();
const orderController = new OrderController();
const inventoryController = new InventoryController();

// Função para inicializar o banco de dados
async function initializeDatabase() {
    try {
        console.log('🔄 Conectando ao banco de dados...');
        await db.connect();
        console.log('✅ Banco de dados conectado com sucesso!');
        
        // Verificar se já existem dados
        const products = await db.listarProdutos();
        if (products.length === 0) {
            console.log('📦 Banco vazio detectado. Inserindo dados de exemplo...');
            await db.insertSampleData();
            console.log('🎉 Dados de exemplo inseridos com sucesso!');
        } else {
            console.log(`📊 Banco já possui ${products.length} produtos. Dados existentes mantidos.`);
        }
        
        return true;
    } catch (error) {
        console.error('❌ Erro ao inicializar banco de dados:', error);
        return false;
    }
}

// ===== ROTAS DE API (Reutilizadas do servidor principal) =====

// Health check
app.get('/api/health', (req, res) => {
    res.json({
        status: 'OK',
        timestamp: new Date().toISOString(),
        server: 'Universal Server',
        device: req.device.type,
        userAgent: req.device.userAgent,
        deviceInfo: {
            isMobile: req.device.isMobile,
            isTablet: req.device.isTablet,
            isDesktop: req.device.isDesktop
        }
    });
});

// Database health check
app.get('/api/health/database', async (req, res) => {
    try {
        await db.ensureConnection();
        // Teste simples de consulta para verificar se o BD está funcionando
        const testQuery = await db.listarProdutos();
        res.json({
            status: 'OK',
            database: 'connected',
            timestamp: new Date().toISOString(),
            message: 'Database connection successful'
        });
    } catch (error) {
        console.error('Database health check failed:', error);
        res.status(500).json({
            status: 'ERROR',
            database: 'disconnected',
            timestamp: new Date().toISOString(),
            message: 'Database connection failed',
            error: error.message
        });
    }
});

// Produtos
app.get('/api/products', async (req, res) => {
    try {
        await db.ensureConnection();
        const products = await db.listarProdutos();
        res.json(products);
    } catch (error) {
        console.error('Erro ao buscar produtos:', error);
        res.status(500).json({ error: error.message });
    }
});

// Criar produto
app.post('/api/products', async (req, res) => {
    try {
        console.log('📦 Recebida requisição POST /api/products');
        console.log('📋 Dados recebidos:', req.body);
        
        await db.ensureConnection();
        
        const { name, price, category, description, unit, initial_stock, minimum_stock } = req.body;
        
        // Validação básica
        if (!name || !price || !category) {
            console.log('❌ Validação falhou: campos obrigatórios ausentes');
            return res.status(400).json({
                success: false,
                message: 'Nome, preço e categoria são obrigatórios'
            });
        }
        
        console.log('✅ Validação passou, chamando controller...');
        
        // Criar produto usando o controller
        const result = await productController.createProduct(req, res);
        console.log('📝 Resultado do controller:', result);
        
    } catch (error) {
        console.error('❌ Erro ao criar produto:', error);
        res.status(500).json({ 
            success: false, 
            message: 'Erro interno do servidor',
            error: error.message 
        });
    }
});

app.get('/api/products/count', async (req, res) => {
    try {
        await db.ensureConnection();
        const products = await db.listarProdutos();
        res.json({ count: products.length });
    } catch (error) {
        console.error('Erro ao contar produtos:', error);
        res.status(500).json({ count: 0 });
    }
});

// Fornecedores
app.get('/api/suppliers', async (req, res) => {
    try {
        await db.ensureConnection();
        const suppliers = await db.listarFornecedores();
        res.json(suppliers);
    } catch (error) {
        console.error('Erro ao buscar fornecedores:', error);
        res.status(500).json({ error: error.message });
    }
});

app.get('/api/suppliers/count', async (req, res) => {
    try {
        await db.ensureConnection();
        const suppliers = await db.listarFornecedores();
        res.json({ count: suppliers.length });
    } catch (error) {
        console.error('Erro ao contar fornecedores:', error);
        res.status(500).json({ count: 0 });
    }
});

// Cotações
app.get('/api/quotes', async (req, res) => {
    try {
        await db.ensureConnection();
        const quotes = await db.listarCotacoes();
        res.json(quotes);
    } catch (error) {
        console.error('Erro ao buscar cotações:', error);
        res.status(500).json({ error: error.message });
    }
});

app.get('/api/quotes/count', async (req, res) => {
    try {
        await db.ensureConnection();
        const quotes = await db.listarCotacoes();
        res.json({ count: quotes.length });
    } catch (error) {
        console.error('Erro ao contar cotações:', error);
        res.status(500).json({ count: 0 });
    }
});

// Pedidos
app.get('/api/orders', async (req, res) => {
    try {
        await db.ensureConnection();
        const orders = await db.listarPedidos();
        res.json(orders);
    } catch (error) {
        console.error('Erro ao buscar pedidos:', error);
        res.status(500).json({ error: error.message });
    }
});

app.get('/api/orders/count', async (req, res) => {
    try {
        await db.ensureConnection();
        const orders = await db.listarPedidos();
        res.json({ count: orders.length });
    } catch (error) {
        console.error('Erro ao contar pedidos:', error);
        res.status(500).json({ count: 0 });
    }
});

// Criar pedido
app.post('/api/orders', async (req, res) => {
    try {
        console.log('📦 Recebida requisição POST /api/orders');
        console.log('📋 Dados recebidos:', req.body);
        
        await db.ensureConnection();
        
        // Transformar os dados para o formato esperado pelo OrderController
        const orderData = {
            supplier_id: parseInt(req.body.supplier_id),
            delivery_date: req.body.delivery_date,
            items: req.body.items.map(item => ({
                product_id: parseInt(item.product_id),
                quantity: parseInt(item.quantity),
                unit_price: parseFloat(item.unit_price)
            })),
            notes: req.body.notes || '',
            status: req.body.status || 'pendente'
        };
        
        // Criar pedido usando o método estático
        const orderId = await OrderController.create(db, orderData);
        console.log('📝 Pedido criado com ID:', orderId);
        
        res.status(201).json({ 
            success: true, 
            message: 'Pedido criado com sucesso',
            orderId: orderId
        });
        
    } catch (error) {
        console.error('❌ Erro ao criar pedido:', error);
        res.status(500).json({ 
            success: false, 
            message: 'Erro interno do servidor',
            error: error.message 
        });
    }
});

// Buscar pedido específico por ID
app.get('/api/orders/:id', async (req, res) => {
    try {
        console.log('🔧 DEBUG: Buscando pedido ID:', req.params.id);
        await db.ensureConnection();
        console.log('🔧 DEBUG: Conexão com banco estabelecida');
        
        const order = await OrderController.getById(db, req.params.id);
        console.log('🔧 DEBUG: Resultado da consulta:', order);
        
        if (!order) {
            console.log('🔧 DEBUG: Pedido não encontrado para ID:', req.params.id);
            return res.status(404).json({ success: false, message: 'Pedido não encontrado' });
        }
        
        console.log('🔧 DEBUG: Pedido encontrado, enviando resposta');
        res.json({ success: true, data: order });
    } catch (error) {
        console.error('❌ Erro ao buscar pedido:', error);
        res.status(500).json({ success: false, message: 'Erro interno do servidor' });
    }
});

// Atualizar pedido
app.put('/api/orders/:id', async (req, res) => {
    try {
        await db.ensureConnection();
        
        // Transformar dados da requisição para o formato esperado pelo OrderController
        const orderData = {
            supplier_id: req.body.supplier_id,
            status: req.body.status || 'Pendente',
            priority: req.body.priority || 'Média',
            observations: req.body.observations || '',
            items: req.body.items || []
        };

        console.log('📝 Atualizando pedido ID:', req.params.id, 'com dados:', orderData);
        
        await OrderController.update(db, req.params.id, orderData);
        
        res.json({ 
            success: true, 
            message: 'Pedido atualizado com sucesso'
        });
        
    } catch (error) {
        console.error('❌ Erro ao atualizar pedido:', error);
        res.status(500).json({ 
            success: false, 
            message: 'Erro interno do servidor',
            error: error.message 
        });
    }
});

// Dashboard stats
app.get('/api/dashboard/stats', async (req, res) => {
    try {
        await db.ensureConnection();
        const [products, suppliers, quotes, orders] = await Promise.all([
            db.listarProdutos(),
            db.listarFornecedores(),
            db.listarCotacoes(),
            db.listarPedidos()
        ]);

        res.json({
            products: products.length,
            suppliers: suppliers.length,
            quotes: quotes.length,
            orders: orders.length,
            timestamp: new Date().toISOString()
        });
    } catch (error) {
        console.error('Erro ao buscar estatísticas:', error);
        res.status(500).json({
            products: 0,
            suppliers: 0,
            quotes: 0,
            orders: 0,
            error: error.message
        });
    }
});

// ===== ROTAS DE INTERFACE =====

// Rotas de interface - redirecionamento inteligente
app.get('/', (req, res) => {
    console.log(`[${new Date().toISOString()}] Acesso à página inicial - Device: ${req.device.type}`);
    
    if (req.device.isMobile || req.device.isTablet) {
        res.sendFile(path.join(__dirname, 'frontend', 'mobile-universal.html'));
    } else {
        res.sendFile(path.join(__dirname, 'frontend', 'index.html'));
    }
});

app.get('/mobile', (req, res) => {
    console.log(`[${new Date().toISOString()}] Acesso à página mobile - Device: ${req.device.type}`);
    res.sendFile(path.join(__dirname, 'frontend', 'mobile-universal.html'));
});

app.get('/desktop', (req, res) => {
    console.log(`[${new Date().toISOString()}] Acesso à página desktop - Device: ${req.device.type}`);
    res.sendFile(path.join(__dirname, 'frontend', 'index.html'));
});

app.get('/dashboard', (req, res) => {
    console.log(`[${new Date().toISOString()}] Acesso ao dashboard - Device: ${req.device.type}`);
    // Dashboard sempre serve dashboard.html independente do dispositivo
    res.sendFile(path.join(__dirname, 'frontend', 'dashboard.html'));
});

app.get('/products', (req, res) => {
    if (req.device.isMobile || req.device.isTablet) {
        res.sendFile(path.join(__dirname, 'frontend', 'mobile-universal.html'));
    } else {
        res.sendFile(path.join(__dirname, 'frontend', 'products.html'));
    }
});

app.get('/suppliers', (req, res) => {
    if (req.device.isMobile || req.device.isTablet) {
        res.sendFile(path.join(__dirname, 'frontend', 'mobile-universal.html'));
    } else {
        res.sendFile(path.join(__dirname, 'frontend', 'suppliers.html'));
    }
});

app.get('/quotes', (req, res) => {
    if (req.device.isMobile || req.device.isTablet) {
        res.sendFile(path.join(__dirname, 'frontend', 'mobile-universal.html'));
    } else {
        res.sendFile(path.join(__dirname, 'frontend', 'quotes.html'));
    }
});

app.get('/orders', (req, res) => {
    if (req.device.isMobile || req.device.isTablet) {
        res.sendFile(path.join(__dirname, 'frontend', 'mobile-universal.html'));
    } else {
        res.sendFile(path.join(__dirname, 'frontend', 'orders.html'));
    }
});

app.get('/reports', (req, res) => {
    if (req.device.isMobile || req.device.isTablet) {
        res.sendFile(path.join(__dirname, 'frontend', 'mobile-universal.html'));
    } else {
        res.sendFile(path.join(__dirname, 'frontend', 'reports.html'));
    }
});

// Rota para arquivos HTML específicos
app.get('*.html', (req, res) => {
    const filePath = path.join(__dirname, 'frontend', req.path);
    if (fs.existsSync(filePath)) {
        res.sendFile(filePath);
    } else {
        res.status(404).send('Página não encontrada');
    }
});

// Middleware de erro
app.use((err, req, res, next) => {
    console.error('Erro no servidor:', err);
    res.status(500).json({ 
        error: 'Erro interno do servidor',
        device: req.isMobile ? 'mobile' : req.isTablet ? 'tablet' : 'desktop'
    });
});

// Iniciar servidor com inicialização do banco de dados
async function startServer() {
    try {
        // Inicializar banco de dados primeiro
        const dbInitialized = await initializeDatabase();
        
        if (!dbInitialized) {
            console.error('❌ Falha ao inicializar banco de dados. Servidor não será iniciado.');
            process.exit(1);
        }
        
        // Iniciar servidor
        app.listen(PORT, '0.0.0.0', () => {
            console.log(`🚀 Servidor Universal rodando na porta ${PORT}`);
            console.log(`📱 Acesso Mobile: http://192.168.1.6:${PORT}/mobile`);
            console.log(`💻 Acesso Desktop: http://192.168.1.6:${PORT}`);
            console.log(`🔍 Detecção automática de dispositivo ativada`);
            console.log(`💾 Banco de dados SQLite conectado e funcionando`);
        });
        
    } catch (error) {
        console.error('❌ Erro ao iniciar servidor:', error);
        process.exit(1);
    }
}

// Iniciar o servidor
startServer();

module.exports = app;