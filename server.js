const express = require('express');
const cors = require('cors');
const path = require('path');
const rateLimit = require('express-rate-limit');
const helmet = require('helmet');
const { body, validationResult } = require('express-validator');
const log = require('./backend/utils/logger');
require('dotenv').config();

const Database = require('./backend/database/database');
const ProductController = require('./backend/controllers/ProductController');
const SupplierController = require('./backend/controllers/SupplierController');
const QuoteController = require('./backend/controllers/QuoteController');
const OrderController = require('./backend/controllers/OrderController');
const InventoryController = require('./backend/controllers/InventoryController');

// Importar novos middlewares de segurança e validação
const SecurityMiddleware = require('./backend/middleware/security');
const ValidationMiddleware = require('./backend/middleware/validation');

// Adicionar o ReportController que estava faltando
class ReportController {
    static async getDashboardData(db) {
        // Implementação básica do dashboard
        return {
            totalProducts: 0,
            totalSuppliers: 0,
            pendingQuotes: 0,
            pendingOrders: 0
        };
    }
    
    static async generateReport(db, type, startDate, endDate) {
        // Implementação básica de relatórios
        return {
            type,
            startDate,
            endDate,
            data: []
        };
    }
}

const app = express();
const PORT = process.env.PORT || 3000;

// Aplicar middlewares de segurança integrados
const securityMiddlewares = SecurityMiddleware.applyAllProtections(app);
const rateLimiters = securityMiddlewares;

// Middleware de validação de payload
app.use(ValidationMiddleware.limitPayloadSize('10mb'));

// Middleware básico
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
// Servir arquivos estáticos da pasta frontend
app.use(express.static(path.join(__dirname, 'frontend')));

// Servir arquivos estáticos da raiz do projeto (para index.html, debug.html, etc.)
app.use(express.static(__dirname));

// Middleware de logging
app.use((req, res, next) => {
    log.info(`${req.method} ${req.path}`, { 
        ip: req.ip, 
        userAgent: req.get('User-Agent'),
        timestamp: new Date().toISOString()
    });
    next();
});

// Inicializar database
const db = new Database();

// Importar middleware de autenticação
const AuthMiddleware = require('./backend/middleware/auth');
const AuthController = require('./backend/controllers/AuthController');

// Inicializar controllers
const productController = new ProductController();
const supplierController = new SupplierController();
const quoteController = new QuoteController();
const orderController = new OrderController();
const inventoryController = new InventoryController();
const authController = new AuthController(db, securityMiddlewares.bruteForce);

// Rotas de autenticação (públicas)
app.post('/api/auth/login', 
    securityMiddlewares.bruteForce.checkBlocked,
    rateLimiters.login, 
    ValidationMiddleware.validateUser, 
    (req, res) => authController.login(req, res)
);

app.post('/api/auth/register', 
    rateLimiters.create,
    ValidationMiddleware.validateUser, 
    (req, res) => authController.register(req, res)
);

app.post('/api/auth/logout', 
    AuthMiddleware.authenticateToken, 
    (req, res) => authController.logout(req, res)
);

app.get('/api/auth/verify', 
    AuthMiddleware.authenticateToken, 
    (req, res) => authController.verifyToken(req, res)
);

// Middleware de autenticação para rotas protegidas
// Para desenvolvimento, usar autenticação opcional em algumas rotas
const useAuth = process.env.NODE_ENV === 'production';

// Error handling middleware
const handleValidationErrors = (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        log.validation('Erro de validação', {
            path: req.path,
            body: req.body,
            errors: errors.array(),
            ip: req.ip
        });
        return res.status(400).json({
            success: false,
            message: 'Validation errors',
            errors: errors.array()
        });
    }
    log.validation('Validação passou', { 
        path: req.path, 
        ip: req.ip 
    });
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

app.post('/api/products', 
    rateLimiters.create,
    ValidationMiddleware.validateProduct,
    async (req, res) => {
        try {
            const productController = new ProductController();
            await productController.createProduct(req, res);
        } catch (error) {
            res.status(500).json({ success: false, message: error.message });
        }
    }
);

app.put('/api/products/:id', 
    ValidationMiddleware.validateProduct,
    async (req, res) => {
        try {
            await ProductController.update(db, req.params.id, req.body);
            res.json({ success: true, message: 'Product updated successfully' });
        } catch (error) {
            res.status(500).json({ success: false, message: error.message });
        }
    }
);

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

app.post('/api/suppliers', 
    rateLimiters.create,
    ValidationMiddleware.validateSupplier,
    async (req, res) => {
        try {
            const supplierController = new SupplierController();
            await supplierController.createSupplier(req, res);
        } catch (error) {
            log.error('Erro em POST /api/suppliers', { 
                error: error.message, 
                stack: error.stack,
                ip: req.ip 
            });
            if (!res.headersSent) {
                res.status(500).json({ success: false, message: error.message });
            }
        }
    }
);

app.put('/api/suppliers/:id', 
    ValidationMiddleware.validateSupplier,
    async (req, res) => {
        try {
            const controller = new SupplierController(db);
            await controller.updateSupplier(req, res);
        } catch (error) {
            res.status(500).json({ success: false, message: error.message });
        }
    }
);

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
        // Ajustar os nomes dos campos para corresponder ao que o QuoteController espera
        const quoteData = {
            supplier_id: req.body.supplierId,
            delivery_date: req.body.deliveryDate,
            items: req.body.items,
            notes: req.body.notes || '',
            status: req.body.status || 'pendente'
        };
        const quoteId = await QuoteController.create(db, quoteData);
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

app.post('/api/orders', 
    rateLimiters.create,
    ValidationMiddleware.validateOrder,
    async (req, res) => {
        try {
            const orderId = await OrderController.create(db, req.body);
            res.status(201).json({ success: true, data: { id: orderId } });
        } catch (error) {
            res.status(500).json({ success: false, message: error.message });
        }
    }
);

app.put('/api/orders/:id/status', 
    ValidationMiddleware.validateOrderStatus,
    async (req, res) => {
        try {
            await OrderController.updateStatus(db, req.params.id, req.body.status);
            res.json({ success: true, message: 'Order status updated successfully' });
        } catch (error) {
            res.status(500).json({ success: false, message: error.message });
        }
    }
);

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

// Count endpoints
app.get('/api/products/count', async (req, res) => {
    try {
        const result = await db.query('SELECT COUNT(*) as count FROM products WHERE status = "ativo"');
        res.json({ success: true, count: result[0]?.count || 0 });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

app.get('/api/suppliers/count', async (req, res) => {
    try {
        const result = await db.query('SELECT COUNT(*) as count FROM suppliers WHERE status = "ativo"');
        res.json({ success: true, count: result[0]?.count || 0 });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

app.get('/api/quotes/count', async (req, res) => {
    try {
        const result = await db.query('SELECT COUNT(*) as count FROM quotes');
        res.json({ success: true, count: result[0]?.count || 0 });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

app.get('/api/orders/count', async (req, res) => {
    try {
        const result = await db.query('SELECT COUNT(*) as count FROM orders');
        res.json({ success: true, count: result[0]?.count || 0 });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

// Dashboard stats endpoint
app.get('/api/dashboard/stats', async (req, res) => {
    try {
        // Buscar estatísticas do dashboard
        const [products, suppliers, quotes, orders] = await Promise.all([
            db.query('SELECT COUNT(*) as count FROM products WHERE status = "ativo"'),
            db.query('SELECT COUNT(*) as count FROM suppliers WHERE status = "ativo"'),
            db.query('SELECT COUNT(*) as count FROM quotes'),
            db.query('SELECT COUNT(*) as count FROM orders')
        ]);

        // Buscar estatísticas adicionais
        const [lowStockProducts, pendingQuotes, pendingOrders, totalValue] = await Promise.all([
            db.query('SELECT COUNT(*) as count FROM products WHERE stock <= min_stock AND status = "ativo"'),
            db.query('SELECT COUNT(*) as count FROM quotes WHERE status = "pendente"'),
            db.query('SELECT COUNT(*) as count FROM orders WHERE status = "pendente"'),
            db.query('SELECT SUM(total_value) as total FROM orders WHERE status != "cancelado"')
        ]);

        const stats = {
            products: {
                total: products[0]?.count || 0,
                lowStock: lowStockProducts[0]?.count || 0
            },
            suppliers: {
                total: suppliers[0]?.count || 0
            },
            quotes: {
                total: quotes[0]?.count || 0,
                pending: pendingQuotes[0]?.count || 0
            },
            orders: {
                total: orders[0]?.count || 0,
                pending: pendingOrders[0]?.count || 0,
                totalValue: totalValue[0]?.total || 0
            }
        };

        res.json({ success: true, data: stats });
    } catch (error) {
        log.error('Erro ao buscar estatísticas do dashboard', { 
            error: error.message, 
            stack: error.stack,
            ip: req.ip 
        });
        res.status(500).json({ success: false, message: error.message });
    }
});



// Reports routes
app.post('/api/reports/orders', [
    body('startDate').isISO8601().withMessage('Valid start date is required'),
    body('endDate').isISO8601().withMessage('Valid end date is required')
], handleValidationErrors, async (req, res) => {
    try {
        const { startDate, endDate, status, supplierId } = req.body;
        
        // Simular geração de relatório PDF
        const reportData = await generateOrdersReportData(db, startDate, endDate, status, supplierId);
        const pdfBuffer = await generatePDFReport('Relatório de Pedidos', reportData);
        
        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', `attachment; filename="relatorio_pedidos_${startDate}_${endDate}.pdf"`);
        res.send(pdfBuffer);
    } catch (error) {
        log.error('Erro ao gerar relatório de pedidos', { 
            error: error.message, 
            stack: error.stack,
            ip: req.ip 
        });
        res.status(500).json({ success: false, message: error.message });
    }
});

app.post('/api/reports/suppliers', [
    body('startDate').isISO8601().withMessage('Valid start date is required'),
    body('endDate').isISO8601().withMessage('Valid end date is required')
], handleValidationErrors, async (req, res) => {
    try {
        const { startDate, endDate, status } = req.body;
        
        // Simular geração de relatório PDF
        const reportData = await generateSuppliersReportData(db, startDate, endDate, status);
        const pdfBuffer = await generatePDFReport('Relatório de Fornecedores', reportData);
        
        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', `attachment; filename="relatorio_fornecedores_${startDate}_${endDate}.pdf"`);
        res.send(pdfBuffer);
    } catch (error) {
        log.error('Erro ao gerar relatório de fornecedores', { 
            error: error.message, 
            stack: error.stack,
            ip: req.ip 
        });
        res.status(500).json({ success: false, message: error.message });
    }
});

app.post('/api/reports/financial', [
    body('startDate').isISO8601().withMessage('Valid start date is required'),
    body('endDate').isISO8601().withMessage('Valid end date is required')
], handleValidationErrors, async (req, res) => {
    try {
        log.info('Requisição de relatório financeiro recebida', { 
            body: req.body,
            ip: req.ip 
        });
        const { startDate, endDate, category } = req.body;
        log.info('Datas processadas para relatório financeiro', { 
            startDate, 
            endDate, 
            category,
            ip: req.ip 
        });
        
        // Gerar relatório financeiro PDF
        const reportData = await generateFinanceReportData(db, startDate, endDate, category);
        const pdfBuffer = await generatePDFReport('Relatório Financeiro', reportData);
        
        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', `attachment; filename="relatorio_financeiro_${startDate}_${endDate}.pdf"`);
        res.send(pdfBuffer);
    } catch (error) {
        log.error('Erro ao gerar relatório financeiro', { 
            error: error.message, 
            stack: error.stack,
            ip: req.ip 
        });
        res.status(500).json({ success: false, message: error.message });
    }
});

app.post('/api/reports/cotacoes', [
    body('startDate').isISO8601().withMessage('Valid start date is required'),
    body('endDate').isISO8601().withMessage('Valid end date is required')
], handleValidationErrors, async (req, res) => {
    try {
        const { startDate, endDate, status, supplierId } = req.body;
        
        // Gerar relatório de cotações PDF
        const reportData = await generateQuotesReportData(db, startDate, endDate, status, supplierId);
        const pdfBuffer = await generatePDFReport('Relatório de Cotações', reportData);
        
        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', `attachment; filename="relatorio_cotacoes_${startDate}_${endDate}.pdf"`);
        res.send(pdfBuffer);
    } catch (error) {
        log.error('Erro ao gerar relatório de cotações', { 
            error: error.message, 
            stack: error.stack,
            ip: req.ip 
        });
        res.status(500).json({ success: false, message: error.message });
    }
});

app.post('/api/reports/prazos', [
    body('startDate').isISO8601().withMessage('Valid start date is required'),
    body('endDate').isISO8601().withMessage('Valid end date is required')
], handleValidationErrors, async (req, res) => {
    try {
        const { startDate, endDate, status, urgency } = req.body;
        
        // Gerar relatório de prazos PDF
        const reportData = await generateDeadlinesReportData(db, startDate, endDate, status, urgency);
        const pdfBuffer = await generatePDFReport('Relatório de Prazos', reportData);
        
        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', `attachment; filename="relatorio_prazos_${startDate}_${endDate}.pdf"`);
        res.send(pdfBuffer);
    } catch (error) {
        log.error('Erro ao gerar relatório de prazos', { 
            error: error.message, 
            stack: error.stack,
            ip: req.ip 
        });
        res.status(500).json({ success: false, message: error.message });
    }
});

app.post('/api/reports/products', [
    body('startDate').isISO8601().withMessage('Valid start date is required'),
    body('endDate').isISO8601().withMessage('Valid end date is required')
], handleValidationErrors, async (req, res) => {
    try {
        const { startDate, endDate, category } = req.body;
        
        // Gerar relatório de produtos PDF
        const reportData = await generateProductsReportData(db, startDate, endDate, category);
        const pdfBuffer = await generatePDFReport('Relatório de Produtos', reportData);
        
        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', `attachment; filename="relatorio_produtos_${startDate}_${endDate}.pdf"`);
        res.send(pdfBuffer);
    } catch (error) {
        log.error('Erro ao gerar relatório de produtos', { 
            error: error.message, 
            stack: error.stack,
            ip: req.ip 
        });
        res.status(500).json({ success: false, message: error.message });
    }
});

// Serve the main application
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'frontend', 'index.html'));
});

// Rotas específicas para páginas HTML do frontend
app.get('/dashboard', (req, res) => {
    res.sendFile(path.join(__dirname, 'frontend', 'dashboard.html'));
});

app.get('/products', (req, res) => {
    res.sendFile(path.join(__dirname, 'frontend', 'products.html'));
});

app.get('/suppliers', (req, res) => {
    res.sendFile(path.join(__dirname, 'frontend', 'suppliers.html'));
});

app.get('/quotes', (req, res) => {
    res.sendFile(path.join(__dirname, 'frontend', 'quotes.html'));
});

app.get('/orders', (req, res) => {
    res.sendFile(path.join(__dirname, 'frontend', 'orders.html'));
});

app.get('/reports', (req, res) => {
    res.sendFile(path.join(__dirname, 'frontend', 'reports.html'));
});

// Rota para arquivos HTML diretamente (fallback)
app.get('*.html', (req, res) => {
    const fileName = path.basename(req.path);
    const filePath = path.join(__dirname, 'frontend', fileName);
    res.sendFile(filePath, (err) => {
        if (err) {
            res.status(404).send('Página não encontrada');
        }
    });
});

// 404 handler for API routes
app.use('/api/*', (req, res) => {
    res.status(404).json({ 
        success: false, 
        message: 'API endpoint not found' 
    });
});

// Report Generation Functions
async function generateOrdersReportData(db, startDate, endDate, status, supplierId) {
    try {
        let query = `
            SELECT o.*, s.name as supplier_name, s.email as supplier_email
            FROM orders o
            LEFT JOIN suppliers s ON o.supplier_id = s.id
            WHERE o.created_at BETWEEN ? AND ?
        `;
        const params = [startDate, endDate];
        
        if (status) {
            query += ' AND o.status = ?';
            params.push(status);
        }
        
        if (supplierId) {
            query += ' AND o.supplier_id = ?';
            params.push(supplierId);
        }
        
        query += ' ORDER BY o.created_at DESC';
        
        const orders = await db.all(query, params);
        
        // Calcular estatísticas
        const totalOrders = orders.length;
        const totalValue = orders.reduce((sum, order) => sum + (parseFloat(order.total_value) || 0), 0);
        const statusCounts = orders.reduce((acc, order) => {
            acc[order.status] = (acc[order.status] || 0) + 1;
            return acc;
        }, {});
        
        return {
            period: { startDate, endDate },
            summary: {
                totalOrders,
                totalValue,
                statusCounts
            },
            orders
        };
    } catch (error) {
        log.error('Erro ao gerar dados do relatório de pedidos', { 
            error: error.message, 
            stack: error.stack 
        });
        throw error;
    }
}

async function generateSuppliersReportData(db, startDate, endDate, status) {
    try {
        let query = `
            SELECT s.*, 
                   COUNT(o.id) as total_orders,
                   COALESCE(SUM(o.total_value), 0) as total_value,
                   AVG(o.total_value) as avg_order_value
            FROM suppliers s
            LEFT JOIN orders o ON s.id = o.supplier_id 
                AND o.created_at BETWEEN ? AND ?
            WHERE 1=1
        `;
        const params = [startDate, endDate];
        
        if (status) {
            query += ' AND s.status = ?';
            params.push(status);
        }
        
        query += ' GROUP BY s.id ORDER BY total_orders DESC';
        
        const suppliers = await db.all(query, params);
        
        // Calcular estatísticas
        const totalSuppliers = suppliers.length;
        const activeSuppliers = suppliers.filter(s => s.status === 'ativo').length;
        const totalOrdersValue = suppliers.reduce((sum, supplier) => sum + (parseFloat(supplier.total_value) || 0), 0);
        
        return {
            period: { startDate, endDate },
            summary: {
                totalSuppliers,
                activeSuppliers,
                totalOrdersValue
            },
            suppliers
        };
    } catch (error) {
        log.error('Erro ao gerar dados do relatório de fornecedores', { 
            error: error.message, 
            stack: error.stack 
        });
        throw error;
    }
}

async function generateFinanceReportData(db, startDate, endDate, category) {
    try {
        log.info('Iniciando geração de dados financeiros', { startDate, endDate, category });
        // Simular dados financeiros baseados em pedidos e produtos
        let query = `
            SELECT 
                o.id,
                o.total_value,
                o.status,
                o.created_at,
                s.name as supplier_name,
                'Compra' as transaction_type,
                'Saída' as category
            FROM orders o
            LEFT JOIN suppliers s ON o.supplier_id = s.id
            WHERE o.created_at BETWEEN ? AND ?
        `;
        const params = [startDate, endDate];
        log.debug('Query preparada para relatório financeiro', { query, params });
        
        if (category) {
            query += ' AND ? = ?';
            params.push(category, category);
        }
        
        query += ' ORDER BY o.created_at DESC';
        
        const transactions = await db.all(query, params);
        
        // Calcular estatísticas financeiras
        const totalTransactions = transactions.length;
        const totalExpenses = transactions.reduce((sum, t) => sum + (parseFloat(t.total_value) || 0), 0);
        const avgTransactionValue = totalTransactions > 0 ? totalExpenses / totalTransactions : 0;
        
        // Simular receitas (30% das despesas)
        const totalRevenue = totalExpenses * 0.3;
        const netProfit = totalRevenue - totalExpenses;
        
        return {
            period: { startDate, endDate },
            summary: {
                totalTransactions,
                totalExpenses,
                totalRevenue,
                netProfit,
                avgTransactionValue
            },
            transactions
        };
    } catch (error) {
        log.error('Erro ao gerar dados do relatório financeiro', { 
            error: error.message, 
            stack: error.stack 
        });
        throw error;
    }
}

async function generateQuotesReportData(db, startDate, endDate, status, supplierId) {
    try {
        // Simular dados de cotações baseados em produtos e fornecedores
        let query = `
            SELECT 
                p.id,
                p.name as product_name,
                p.price as quoted_price,
                s.name as supplier_name,
                s.email as supplier_email,
                'Pendente' as status,
                datetime('now', '-' || (ABS(RANDOM()) % 30) || ' days') as quote_date,
                datetime('now', '+' || (ABS(RANDOM()) % 15) || ' days') as expiry_date
            FROM products p
            CROSS JOIN suppliers s
            WHERE s.created_at BETWEEN ? AND ?
        `;
        const params = [startDate, endDate];
        
        if (status) {
            query += ' AND ? = ?';
            params.push(status, status);
        }
        
        if (supplierId) {
            query += ' AND s.id = ?';
            params.push(supplierId);
        }
        
        query += ' ORDER BY quote_date DESC LIMIT 50';
        
        const quotes = await db.all(query, params);
        
        // Calcular estatísticas
        const totalQuotes = quotes.length;
        const avgQuoteValue = quotes.reduce((sum, q) => sum + (parseFloat(q.quoted_price) || 0), 0) / totalQuotes || 0;
        const pendingQuotes = quotes.filter(q => q.status === 'Pendente').length;
        
        return {
            period: { startDate, endDate },
            summary: {
                totalQuotes,
                pendingQuotes,
                avgQuoteValue,
                suppliersCount: new Set(quotes.map(q => q.supplier_name)).size
            },
            quotes
        };
    } catch (error) {
        log.error('Erro ao gerar dados do relatório de cotações', { 
            error: error.message, 
            stack: error.stack 
        });
        throw error;
    }
}

async function generateDeadlinesReportData(db, startDate, endDate, status, urgency) {
    try {
        // Simular dados de prazos baseados em pedidos
        let query = `
            SELECT 
                o.id,
                o.status,
                o.created_at,
                o.total_value,
                s.name as supplier_name,
                datetime(o.created_at, '+' || (ABS(RANDOM()) % 30 + 5) || ' days') as deadline,
                CASE 
                    WHEN ABS(RANDOM()) % 3 = 0 THEN 'Alta'
                    WHEN ABS(RANDOM()) % 3 = 1 THEN 'Média'
                    ELSE 'Baixa'
                END as urgency_level,
                CASE 
                    WHEN datetime('now') > datetime(o.created_at, '+' || (ABS(RANDOM()) % 30 + 5) || ' days') THEN 'Atrasado'
                    WHEN datetime('now') > datetime(o.created_at, '+' || (ABS(RANDOM()) % 30 + 2) || ' days') THEN 'Próximo do Vencimento'
                    ELSE 'No Prazo'
                END as deadline_status
            FROM orders o
            LEFT JOIN suppliers s ON o.supplier_id = s.id
            WHERE o.created_at BETWEEN ? AND ?
        `;
        const params = [startDate, endDate];
        
        if (status) {
            query += ' AND o.status = ?';
            params.push(status);
        }
        
        if (urgency) {
            query += ' AND ? = ?';
            params.push(urgency, urgency);
        }
        
        query += ' ORDER BY deadline ASC';
        
        const deadlines = await db.all(query, params);
        
        // Calcular estatísticas
        const totalDeadlines = deadlines.length;
        const overdueCount = deadlines.filter(d => d.deadline_status === 'Atrasado').length;
        const nearDueCount = deadlines.filter(d => d.deadline_status === 'Próximo do Vencimento').length;
        const onTimeCount = deadlines.filter(d => d.deadline_status === 'No Prazo').length;
        
        return {
            period: { startDate, endDate },
            summary: {
                totalDeadlines,
                overdueCount,
                nearDueCount,
                onTimeCount,
                urgencyBreakdown: {
                    alta: deadlines.filter(d => d.urgency_level === 'Alta').length,
                    media: deadlines.filter(d => d.urgency_level === 'Média').length,
                    baixa: deadlines.filter(d => d.urgency_level === 'Baixa').length
                }
            },
            deadlines
        };
    } catch (error) {
        log.error('Erro ao gerar dados do relatório de prazos', { 
            error: error.message, 
            stack: error.stack 
        });
        throw error;
    }
}

async function generateProductsReportData(db, startDate, endDate, category) {
    try {
        // Query para buscar produtos com informações de estoque e movimentações
        let query = `
            SELECT 
                p.id,
                p.name,
                p.code,
                p.category,
                p.price,
                p.stock_quantity,
                p.min_stock,
                p.status,
                p.created_at,
                p.updated_at,
                CASE 
                    WHEN p.stock_quantity <= p.min_stock THEN 'Baixo Estoque'
                    WHEN p.stock_quantity = 0 THEN 'Sem Estoque'
                    ELSE 'Normal'
                END as stock_status,
                (p.price * p.stock_quantity) as total_value
            FROM products p
            WHERE p.created_at BETWEEN ? AND ?
        `;
        const params = [startDate, endDate];
        
        if (category) {
            query += ' AND p.category = ?';
            params.push(category);
        }
        
        query += ' ORDER BY p.name ASC';
        
        const products = await db.all(query, params);
        
        // Calcular estatísticas
        const totalProducts = products.length;
        const activeProducts = products.filter(p => p.status === 'ativo').length;
        const lowStockProducts = products.filter(p => p.stock_status === 'Baixo Estoque').length;
        const outOfStockProducts = products.filter(p => p.stock_status === 'Sem Estoque').length;
        const totalInventoryValue = products.reduce((sum, p) => sum + (parseFloat(p.total_value) || 0), 0);
        const avgProductPrice = products.length > 0 ? products.reduce((sum, p) => sum + (parseFloat(p.price) || 0), 0) / products.length : 0;
        
        // Agrupar por categoria
        const categoryBreakdown = products.reduce((acc, product) => {
            const cat = product.category || 'Sem Categoria';
            if (!acc[cat]) {
                acc[cat] = { count: 0, totalValue: 0 };
            }
            acc[cat].count++;
            acc[cat].totalValue += parseFloat(product.total_value) || 0;
            return acc;
        }, {});
        
        return {
            period: { startDate, endDate },
            summary: {
                totalProducts,
                activeProducts,
                lowStockProducts,
                outOfStockProducts,
                totalInventoryValue,
                avgProductPrice,
                categoryBreakdown
            },
            products
        };
    } catch (error) {
        log.error('Erro ao gerar dados do relatório de produtos', { 
            error: error.message, 
            stack: error.stack 
        });
        throw error;
    }
}

async function generatePDFReport(title, data) {
    const PDFDocument = require('pdfkit');
    
    return new Promise((resolve, reject) => {
        try {
            const doc = new PDFDocument({ margin: 50 });
            const buffers = [];
            
            // Cores corporativas
            const colors = {
                primary: '#1e3a8a',      // Azul corporativo
                secondary: '#64748b',     // Cinza azulado
                accent: '#0ea5e9',       // Azul claro
                text: '#1f2937',         // Cinza escuro
                light: '#f8fafc',        // Cinza muito claro
                success: '#059669',      // Verde
                warning: '#d97706'       // Laranja
            };
            
            // Capturar dados do PDF em buffers
            doc.on('data', buffers.push.bind(buffers));
            doc.on('end', () => {
                const pdfData = Buffer.concat(buffers);
                resolve(pdfData);
            });
            
            // CABEÇALHO CORPORATIVO
            const pageWidth = doc.page.width;
            const margin = doc.page.margins.left;
            
            // Faixa superior azul
            doc.rect(0, 0, pageWidth, 80)
               .fill(colors.primary);
            
            // Logo/Nome da empresa (lado esquerdo)
            doc.fillColor('white')
               .fontSize(24)
               .font('Helvetica-Bold')
               .text('GESTÃO DE SUPRIMENTOS', margin, 25);
            
            doc.fontSize(12)
               .font('Helvetica')
               .text('Sistema Integrado de Controle', margin, 50);
            
            // Data/hora (lado direito)
            const currentDate = new Date().toLocaleString('pt-BR');
            doc.fontSize(10)
               .text(`Gerado em: ${currentDate}`, pageWidth - 200, 30, { width: 150, align: 'right' });
            
            // Linha decorativa
            doc.rect(0, 80, pageWidth, 3)
               .fill(colors.accent);
            
            // Reset para conteúdo
            doc.fillColor(colors.text);
            let currentY = 120;
            
            // TÍTULO DO RELATÓRIO
            doc.fontSize(22)
               .font('Helvetica-Bold')
               .fillColor(colors.primary)
               .text(title, margin, currentY, { align: 'center' });
            
            currentY += 40;
            
            // PERÍODO
            doc.rect(margin, currentY, pageWidth - 2 * margin, 30)
               .fill(colors.light)
               .stroke(colors.secondary);
            
            doc.fontSize(14)
               .fillColor(colors.text)
               .font('Helvetica-Bold')
               .text(`Período: ${data.period.startDate} a ${data.period.endDate}`, 
                     margin + 15, currentY + 8);
            
            currentY += 50;
            
            // RESUMO EXECUTIVO
            if (data.summary) {
                doc.fontSize(16)
                   .font('Helvetica-Bold')
                   .fillColor(colors.primary)
                   .text('RESUMO EXECUTIVO', margin, currentY);
                
                currentY += 25;
                
                // Caixas de métricas
                const summaryEntries = Object.entries(data.summary);
                const boxWidth = (pageWidth - 2 * margin - 20) / Math.min(summaryEntries.length, 3);
                let boxX = margin;
                
                summaryEntries.slice(0, 3).forEach(([key, value]) => {
                    // Caixa da métrica
                    doc.rect(boxX, currentY, boxWidth, 60)
                       .fill(colors.light)
                       .stroke(colors.secondary);
                    
                    // Valor
                    doc.fontSize(20)
                       .font('Helvetica-Bold')
                       .fillColor(colors.primary)
                       .text(String(value), boxX + 10, currentY + 10, { width: boxWidth - 20, align: 'center' });
                    
                    // Label
                    const label = key.replace(/([A-Z])/g, ' $1')
                                    .replace(/^./, str => str.toUpperCase())
                                    .trim();
                    doc.fontSize(10)
                       .font('Helvetica')
                       .fillColor(colors.text)
                       .text(label, boxX + 10, currentY + 35, { width: boxWidth - 20, align: 'center' });
                    
                    boxX += boxWidth + 10;
                });
                
                currentY += 80;
            }
            
            // DADOS DETALHADOS
            const items = data.orders || data.suppliers || data.products || data.quotes || [];
            
            if (items.length > 0) {
                doc.fontSize(16)
                   .font('Helvetica-Bold')
                   .fillColor(colors.primary)
                   .text('DADOS DETALHADOS', margin, currentY);
                
                currentY += 30;
                
                // Cabeçalho da tabela
                const tableHeaders = getTableHeaders(items[0]);
                const colWidth = (pageWidth - 2 * margin) / tableHeaders.length;
                
                // Fundo do cabeçalho
                doc.rect(margin, currentY, pageWidth - 2 * margin, 25)
                   .fill(colors.primary);
                
                // Texto do cabeçalho
                doc.fontSize(10)
                   .font('Helvetica-Bold')
                   .fillColor('white');
                
                tableHeaders.forEach((header, index) => {
                    doc.text(header, margin + index * colWidth + 5, currentY + 7, 
                            { width: colWidth - 10, align: 'left' });
                });
                
                currentY += 25;
                
                // Linhas da tabela
                items.slice(0, 15).forEach((item, index) => {
                    const rowColor = index % 2 === 0 ? 'white' : colors.light;
                    
                    // Fundo da linha
                    doc.rect(margin, currentY, pageWidth - 2 * margin, 20)
                       .fill(rowColor)
                       .stroke(colors.secondary);
                    
                    // Dados da linha
                    doc.fontSize(9)
                       .font('Helvetica')
                       .fillColor(colors.text);
                    
                    tableHeaders.forEach((header, colIndex) => {
                        const value = getTableValue(item, header);
                        doc.text(String(value), margin + colIndex * colWidth + 5, currentY + 5,
                                { width: colWidth - 10, align: 'left' });
                    });
                    
                    currentY += 20;
                    
                    // Nova página se necessário
                    if (currentY > doc.page.height - 100) {
                        doc.addPage();
                        currentY = 50;
                    }
                });
                
                if (items.length > 15) {
                    currentY += 10;
                    doc.fontSize(10)
                       .font('Helvetica-Oblique')
                       .fillColor(colors.secondary)
                       .text(`... e mais ${items.length - 15} registros`, margin, currentY);
                }
            } else {
                doc.fontSize(14)
                   .font('Helvetica')
                   .fillColor(colors.secondary)
                   .text('Nenhum dado encontrado para o período selecionado.', margin, currentY, 
                         { align: 'center' });
            }
            
            // RODAPÉ CORPORATIVO
            const footerY = doc.page.height - 60;
            
            // Linha superior do rodapé
            doc.rect(0, footerY - 10, pageWidth, 1)
               .fill(colors.secondary);
            
            // Informações da empresa
            doc.fontSize(9)
               .font('Helvetica')
               .fillColor(colors.secondary)
               .text('Sistema de Gestão de Suprimentos | Email: contato@empresa.com | Tel: (11) 9999-9999', 
                     margin, footerY, { align: 'center' });
            
            doc.text(`Página 1 | Relatório confidencial - Uso interno`, 
                     margin, footerY + 15, { align: 'center' });
            
            // Finalizar o documento
            doc.end();
            
        } catch (error) {
            reject(error);
        }
    });
}

// Função auxiliar para obter cabeçalhos da tabela
function getTableHeaders(item) {
    if (!item) return [];
    
    const commonHeaders = ['ID', 'Nome/Descrição', 'Status', 'Data', 'Valor'];
    const keys = Object.keys(item);
    
    // Mapear campos comuns
    const headerMap = {
        'id': 'ID',
        'name': 'Nome',
        'description': 'Descrição',
        'status': 'Status',
        'created_at': 'Data',
        'updated_at': 'Atualizado',
        'total_value': 'Valor Total',
        'value': 'Valor',
        'price': 'Preço',
        'quantity': 'Quantidade',
        'supplier_name': 'Fornecedor',
        'product_name': 'Produto'
    };
    
    return keys.slice(0, 5).map(key => headerMap[key] || key.replace(/_/g, ' ').toUpperCase());
}

// Função auxiliar para obter valores da tabela
function getTableValue(item, header) {
    const key = Object.keys(item).find(k => {
        const mapped = k.replace(/_/g, ' ').toUpperCase();
        return mapped === header || header.includes(mapped.split(' ')[0]);
    });
    
    if (!key) return '';
    
    let value = item[key];
    
    // Formatação especial para diferentes tipos
    if (typeof value === 'number' && (key.includes('value') || key.includes('price'))) {
        return `R$ ${value.toFixed(2)}`;
    }
    
    if (key.includes('date') || key.includes('_at')) {
        return new Date(value).toLocaleDateString('pt-BR');
    }
    
    return String(value || '').substring(0, 30);
}

// Global error handler
app.use((error, req, res, next) => {
    log.error('Global error handler', { 
        error: error.message, 
        stack: error.stack,
        ip: req.ip,
        url: req.url,
        method: req.method 
    });
    res.status(500).json({
        success: false,
        message: 'Internal server error',
        ...(process.env.NODE_ENV === 'development' && { error: error.message })
    });
});

// Initialize database and start server
async function startServer() {
    try {
        // Inicializar banco SQLite
        await db.connect();
        log.info('Banco SQLite inicializado com sucesso');
        
        app.listen(PORT, '0.0.0.0', () => {
            const os = require('os');
            const networkInterfaces = os.networkInterfaces();
            let localIP = 'localhost';
            
            // Encontrar IP local (ignorar VirtualBox)
            for (const interfaceName in networkInterfaces) {
                const interfaces = networkInterfaces[interfaceName];
                for (const iface of interfaces) {
                    if (iface.family === 'IPv4' && !iface.internal && 
                        !iface.address.startsWith('192.168.56.') && // Ignorar VirtualBox
                        !interfaceName.toLowerCase().includes('virtualbox')) {
                        localIP = iface.address;
                        break;
                    }
                }
                if (localIP !== 'localhost') break;
            }
            
            log.info('Supply Management Server iniciado', {
                port: PORT,
                localUrl: `http://localhost:${PORT}`,
                mobileUrl: `http://${localIP}:${PORT}`,
                apiUrl: `http://${localIP}:${PORT}/api`,
                healthUrl: `http://${localIP}:${PORT}/api/health`
            });
        });
    } catch (error) {
        log.error('Falha ao iniciar servidor', { 
            error: error.message, 
            stack: error.stack 
        });
        process.exit(1);
    }
}

// Graceful shutdown
process.on('SIGINT', async () => {
    log.info('Desligando servidor graciosamente (SIGINT)');
    await db.close();
    process.exit(0);
});

process.on('SIGTERM', async () => {
    log.info('Desligando servidor graciosamente (SIGTERM)');
    await db.close();
    process.exit(0);
});

startServer();

module.exports = app;