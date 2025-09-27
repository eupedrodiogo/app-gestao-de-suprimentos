const express = require('express');
const cors = require('cors');
const path = require('path');
require('dotenv').config();

const Database = require('./backend/database/database');
const ProductController = require('./backend/controllers/ProductController');
const SupplierController = require('./backend/controllers/SupplierController');
const QuoteController = require('./backend/controllers/QuoteController');
const OrderController = require('./backend/controllers/OrderController');
const InventoryController = require('./backend/controllers/InventoryController');

const app = express();
const PORT = 80; // Porta HTTP padrão

// Configurar CORS para permitir acesso de qualquer origem
app.use(cors({
    origin: '*',
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization']
}));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Servir arquivos estáticos
app.use(express.static(path.join(__dirname, 'frontend')));

// Inicializar banco de dados
const db = new Database();

// Rotas da API
app.get('/api/products', async (req, res) => {
    try {
        const result = await ProductController.getAllProducts(db, req.query);
        res.json(result);
    } catch (error) {
        console.error('Erro ao buscar produtos:', error);
        res.status(500).json({ error: 'Erro interno do servidor' });
    }
});

app.get('/api/suppliers', async (req, res) => {
    try {
        const result = await SupplierController.getAllSuppliers(db, req.query);
        res.json(result);
    } catch (error) {
        console.error('Erro ao buscar fornecedores:', error);
        res.status(500).json({ error: 'Erro interno do servidor' });
    }
});

app.get('/api/quotes', async (req, res) => {
    try {
        const result = await QuoteController.getAllQuotes(db, req.query);
        res.json(result);
    } catch (error) {
        console.error('Erro ao buscar cotações:', error);
        res.status(500).json({ error: 'Erro interno do servidor' });
    }
});

app.get('/api/orders', async (req, res) => {
    try {
        const result = await OrderController.getAllOrders(db, req.query);
        res.json(result);
    } catch (error) {
        console.error('Erro ao buscar pedidos:', error);
        res.status(500).json({ error: 'Erro interno do servidor' });
    }
});

// Rota para servir as páginas HTML
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'frontend', 'index.html'));
});

app.get('/quotes', (req, res) => {
    res.sendFile(path.join(__dirname, 'frontend', 'quotes.html'));
});

app.get('/orders', (req, res) => {
    res.sendFile(path.join(__dirname, 'frontend', 'orders.html'));
});

app.get('/products', (req, res) => {
    res.sendFile(path.join(__dirname, 'frontend', 'products.html'));
});

app.get('/suppliers', (req, res) => {
    res.sendFile(path.join(__dirname, 'frontend', 'suppliers.html'));
});

// Inicializar servidor
app.listen(PORT, '0.0.0.0', () => {
    console.log(`🚀 Servidor rodando na porta ${PORT}`);
    console.log(`📱 Acesso mobile: http://192.168.1.6:${PORT}`);
    console.log(`💻 Acesso local: http://localhost:${PORT}`);
});