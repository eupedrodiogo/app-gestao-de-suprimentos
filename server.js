const express = require('express');
const cors = require('cors');
const path = require('path');
const rateLimit = require('express-rate-limit');
const helmet = require('helmet');
require('dotenv').config();

const Database = require('./database/database');
const ProductController = require('./controllers/productController');
const SupplierController = require('./controllers/supplierController');
const QuoteController = require('./controllers/quoteController');
const OrderController = require('./controllers/orderController');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware de segurança
app.use(helmet());

// Rate limiting
const limiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutos
    max: 100, // máximo 100 requests por IP por janela de tempo
    message: 'Muitas requisições deste IP, tente novamente em 15 minutos.'
});
app.use('/api/', limiter);

// Middleware básico
app.use(cors({
    origin: process.env.CORS_ORIGIN || '*',
    credentials: true
}));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use(express.static(path.join(__dirname, 'public')));

// Middleware de logging
app.use((req, res, next) => {
    console.log(`${new Date().toISOString()} - ${req.method} ${req.path}`);
    next();
});

// Inicializar controllers
const productController = new ProductController();
const supplierController = new SupplierController();
const quoteController = new QuoteController();
const orderController = new OrderController();

// Middleware de autenticação simulado (para desenvolvimento)
app.use((req, res, next) => {
    req.user = { id: 'system', name: 'Sistema' };
    next();
});

// Error handling middleware
const handleValidationErrors = (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({
            success: false,
            message: 'Validation errors',
            errors: errors.array()
        });
    }
    next();
};

// API Routes

// Products Routes
app.get('/api/products', async (req, res) => {
    try {
        const products = await ProductController.getAll(db);
        res.json({ success: true, data: products });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

app.get('/api/products/:id', async (req, res) => {
    try {
        const product = await ProductController.getById(db, req.params.id);
        if (!product) {
            return res.status(404).json({ success: false, message: 'Product not found' });
        }
        res.json({ success: true, data: product });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

app.post('/api/products', [
    body('code').notEmpty().withMessage('Product code is required'),
    body('name').notEmpty().withMessage('Product name is required'),
    body('category').notEmpty().withMessage('Category is required'),
    body('price').isFloat({ min: 0 }).withMessage('Price must be a positive number'),
    body('stock').isInt({ min: 0 }).withMessage('Stock must be a non-negative integer'),
    body('minStock').isInt({ min: 0 }).withMessage('Minimum stock must be a non-negative integer')
], handleValidationErrors, async (req, res) => {
    try {
        const productId = await ProductController.create(db, req.body);
        res.status(201).json({ success: true, data: { id: productId } });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

app.put('/api/products/:id', [
    body('code').notEmpty().withMessage('Product code is required'),
    body('name').notEmpty().withMessage('Product name is required'),
    body('category').notEmpty().withMessage('Category is required'),
    body('price').isFloat({ min: 0 }).withMessage('Price must be a positive number'),
    body('stock').isInt({ min: 0 }).withMessage('Stock must be a non-negative integer'),
    body('minStock').isInt({ min: 0 }).withMessage('Minimum stock must be a non-negative integer')
], handleValidationErrors, async (req, res) => {
    try {
        await ProductController.update(db, req.params.id, req.body);
        res.json({ success: true, message: 'Product updated successfully' });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

app.delete('/api/products/:id', async (req, res) => {
    try {
        await ProductController.delete(db, req.params.id);
        res.json({ success: true, message: 'Product deleted successfully' });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

// Suppliers Routes
app.get('/api/suppliers', async (req, res) => {
    try {
        const suppliers = await SupplierController.getAll(db);
        res.json({ success: true, data: suppliers });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

app.get('/api/suppliers/:id', async (req, res) => {
    try {
        const supplier = await SupplierController.getById(db, req.params.id);
        if (!supplier) {
            return res.status(404).json({ success: false, message: 'Supplier not found' });
        }
        res.json({ success: true, data: supplier });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

app.post('/api/suppliers', [
    body('cnpj').notEmpty().withMessage('CNPJ is required'),
    body('name').notEmpty().withMessage('Supplier name is required'),
    body('contact').notEmpty().withMessage('Contact is required'),
    body('email').isEmail().withMessage('Valid email is required'),
    body('phone').notEmpty().withMessage('Phone is required')
], handleValidationErrors, async (req, res) => {
    try {
        const supplierId = await SupplierController.create(db, req.body);
        res.status(201).json({ success: true, data: { id: supplierId } });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

app.put('/api/suppliers/:id', [
    body('cnpj').notEmpty().withMessage('CNPJ is required'),
    body('name').notEmpty().withMessage('Supplier name is required'),
    body('contact').notEmpty().withMessage('Contact is required'),
    body('email').isEmail().withMessage('Valid email is required'),
    body('phone').notEmpty().withMessage('Phone is required')
], handleValidationErrors, async (req, res) => {
    try {
        await SupplierController.update(db, req.params.id, req.body);
        res.json({ success: true, message: 'Supplier updated successfully' });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

app.delete('/api/suppliers/:id', async (req, res) => {
    try {
        await SupplierController.delete(db, req.params.id);
        res.json({ success: true, message: 'Supplier deleted successfully' });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

// Quotes Routes
app.get('/api/quotes', async (req, res) => {
    try {
        const quotes = await QuoteController.getAll(db);
        res.json({ success: true, data: quotes });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

app.get('/api/quotes/:id', async (req, res) => {
    try {
        const quote = await QuoteController.getById(db, req.params.id);
        if (!quote) {
            return res.status(404).json({ success: false, message: 'Quote not found' });
        }
        res.json({ success: true, data: quote });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

app.post('/api/quotes', [
    body('supplierId').notEmpty().withMessage('Supplier ID is required'),
    body('deliveryDate').isISO8601().withMessage('Valid delivery date is required'),
    body('items').isArray({ min: 1 }).withMessage('At least one item is required'),
    body('totalValue').isFloat({ min: 0 }).withMessage('Total value must be a positive number')
], handleValidationErrors, async (req, res) => {
    try {
        const quoteId = await QuoteController.create(db, req.body);
        res.status(201).json({ success: true, data: { id: quoteId } });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

app.put('/api/quotes/:id/status', [
    body('status').isIn(['pendente', 'aprovada', 'rejeitada']).withMessage('Invalid status')
], handleValidationErrors, async (req, res) => {
    try {
        await QuoteController.updateStatus(db, req.params.id, req.body.status);
        res.json({ success: true, message: 'Quote status updated successfully' });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

app.delete('/api/quotes/:id', async (req, res) => {
    try {
        await QuoteController.delete(db, req.params.id);
        res.json({ success: true, message: 'Quote deleted successfully' });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

// Orders Routes
app.get('/api/orders', async (req, res) => {
    try {
        const orders = await OrderController.getAll(db);
        res.json({ success: true, data: orders });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

app.get('/api/orders/:id', async (req, res) => {
    try {
        const order = await OrderController.getById(db, req.params.id);
        if (!order) {
            return res.status(404).json({ success: false, message: 'Order not found' });
        }
        res.json({ success: true, data: order });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

app.post('/api/orders', [
    body('supplierId').notEmpty().withMessage('Supplier ID is required'),
    body('deliveryDate').isISO8601().withMessage('Valid delivery date is required'),
    body('items').isArray({ min: 1 }).withMessage('At least one item is required'),
    body('totalValue').isFloat({ min: 0 }).withMessage('Total value must be a positive number')
], handleValidationErrors, async (req, res) => {
    try {
        const orderId = await OrderController.create(db, req.body);
        res.status(201).json({ success: true, data: { id: orderId } });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

app.put('/api/orders/:id/status', [
    body('status').isIn(['pendente', 'aprovado', 'em_transito', 'entregue', 'cancelado']).withMessage('Invalid status')
], handleValidationErrors, async (req, res) => {
    try {
        await OrderController.updateStatus(db, req.params.id, req.body.status);
        res.json({ success: true, message: 'Order status updated successfully' });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

app.delete('/api/orders/:id', async (req, res) => {
    try {
        await OrderController.delete(db, req.params.id);
        res.json({ success: true, message: 'Order deleted successfully' });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

// Inventory Routes
app.get('/api/inventory', async (req, res) => {
    try {
        const inventory = await InventoryController.getAll(db);
        res.json({ success: true, data: inventory });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

app.post('/api/inventory/adjust', [
    body('productId').notEmpty().withMessage('Product ID is required'),
    body('type').isIn(['entrada', 'saida', 'ajuste']).withMessage('Invalid adjustment type'),
    body('quantity').isInt({ min: 1 }).withMessage('Quantity must be a positive integer'),
    body('reason').notEmpty().withMessage('Reason is required')
], handleValidationErrors, async (req, res) => {
    try {
        await InventoryController.adjustStock(db, req.body);
        res.json({ success: true, message: 'Inventory adjusted successfully' });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

// Reports Routes
app.get('/api/reports/dashboard', async (req, res) => {
    try {
        const dashboardData = await ReportController.getDashboardData(db);
        res.json({ success: true, data: dashboardData });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

app.get('/api/reports/:type', async (req, res) => {
    try {
        const { startDate, endDate } = req.query;
        const report = await ReportController.generateReport(db, req.params.type, startDate, endDate);
        res.json({ success: true, data: report });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

// Health check endpoint
app.get('/api/health', (req, res) => {
    res.json({ 
        success: true, 
        message: 'Supply Management API is running',
        timestamp: new Date().toISOString(),
        version: '1.0.0'
    });
});

// Serve the main application
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

// 404 handler for API routes
app.use('/api/*', (req, res) => {
    res.status(404).json({ 
        success: false, 
        message: 'API endpoint not found' 
    });
});

// Global error handler
app.use((error, req, res, next) => {
    console.error('Global error handler:', error);
    res.status(500).json({
        success: false,
        message: 'Internal server error',
        ...(process.env.NODE_ENV === 'development' && { error: error.message })
    });
});

// Initialize database and start server
async function startServer() {
    try {
        await db.initialize();
        console.log('Database initialized successfully');
        
        app.listen(PORT, () => {
            console.log(`Supply Management Server running on port ${PORT}`);
            console.log(`Frontend: http://localhost:${PORT}`);
            console.log(`API: http://localhost:${PORT}/api`);
            console.log(`Health Check: http://localhost:${PORT}/api/health`);
        });
    } catch (error) {
        console.error('Failed to start server:', error);
        process.exit(1);
    }
}

// Graceful shutdown
process.on('SIGINT', async () => {
    console.log('Shutting down gracefully...');
    await db.close();
    process.exit(0);
});

process.on('SIGTERM', async () => {
    console.log('Shutting down gracefully...');
    await db.close();
    process.exit(0);
});

startServer();

module.exports = app;