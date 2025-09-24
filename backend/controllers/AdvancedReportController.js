// AdvancedReportController.js - Sistema de Relatórios Avançados
class AdvancedReportController {
    
    // Relatório de Performance de Estoque
    static async getStockPerformanceReport(req, res) {
        try {
            const db = req.app.locals.db;
            const { days = 30, category = '' } = req.query;

            let productQuery = `
                SELECT 
                    p.id, p.name, p.description, p.category, p.price,
                    p.stock, p.min_stock,
                    (p.price * p.stock) as stock_value,
                    CASE 
                        WHEN p.stock = 0 THEN 'Crítico'
                        WHEN p.stock <= p.min_stock THEN 'Baixo'
                        WHEN p.stock <= (p.min_stock * 2) THEN 'Médio'
                        ELSE 'Alto'
                    END as stock_level
                FROM products p WHERE 1=1
            `;

            const params = [];
            if (category) {
                productQuery += ' AND p.category = ?';
                params.push(category);
            }
            productQuery += ' ORDER BY stock_value DESC';

            const products = await new Promise((resolve, reject) => {
                db.all(productQuery, params, (err, rows) => {
                    if (err) reject(err);
                    else resolve(rows || []);
                });
            });

            const summary = {
                totalProducts: products.length,
                criticalStock: products.filter(p => p.stock_level === 'Crítico').length,
                lowStock: products.filter(p => p.stock_level === 'Baixo').length,
                mediumStock: products.filter(p => p.stock_level === 'Médio').length,
                highStock: products.filter(p => p.stock_level === 'Alto').length,
                totalValue: products.reduce((sum, p) => sum + p.stock_value, 0)
            };

            const stockLevels = {
                labels: ['Crítico', 'Baixo', 'Médio', 'Alto'],
                data: [summary.criticalStock, summary.lowStock, summary.mediumStock, summary.highStock]
            };

            const categoryData = {};
            products.forEach(p => {
                categoryData[p.category] = (categoryData[p.category] || 0) + 1;
            });

            const categories = {
                labels: Object.keys(categoryData),
                data: Object.values(categoryData)
            };

            res.json({
                success: true,
                summary,
                products: products.slice(0, 50),
                charts: { stockLevels, categories }
            });

        } catch (error) {
            console.error('Erro no relatório de performance de estoque:', error);
            res.status(500).json({
                success: false,
                message: 'Erro interno do servidor',
                error: error.message
            });
        }
    }

    // Relatório de Análise de Fornecedores
    static async getSupplierAnalysisReport(req, res) {
        try {
            const db = req.app.locals.db;
            const { days = 30 } = req.query;

            const supplierQuery = `
                SELECT 
                    s.id, s.name, s.email, s.phone, s.status,
                    COUNT(DISTINCT o.id) as total_orders,
                    COALESCE(SUM(o.total_value), 0) as total_value,
                    COUNT(DISTINCT p.id) as total_products,
                    MAX(o.order_date) as last_order_date,
                    CASE 
                        WHEN MAX(o.order_date) IS NULL THEN 999
                        ELSE CAST((julianday('now') - julianday(MAX(o.order_date))) AS INTEGER)
                    END as days_since_last_order
                FROM suppliers s
                LEFT JOIN orders o ON s.id = o.supplier_id 
                    AND o.order_date >= date('now', '-' || ? || ' days')
                LEFT JOIN products p ON s.id = p.supplier_id
                GROUP BY s.id, s.name, s.email, s.phone, s.status
                ORDER BY total_value DESC
            `;

            const suppliers = await new Promise((resolve, reject) => {
                db.all(supplierQuery, [days], (err, rows) => {
                    if (err) reject(err);
                    else resolve(rows || []);
                });
            });

            suppliers.forEach(supplier => {
                let score = 0;
                if (supplier.total_value > 10000) score += 3;
                else if (supplier.total_value > 5000) score += 2;
                else if (supplier.total_value > 1000) score += 1;
                
                if (supplier.total_orders > 10) score += 3;
                else if (supplier.total_orders > 5) score += 2;
                else if (supplier.total_orders > 0) score += 1;
                
                if (supplier.days_since_last_order <= 7) score += 2;
                else if (supplier.days_since_last_order <= 30) score += 1;
                
                if (supplier.status === 'ativo') score += 2;
                else if (supplier.status === 'inativo') score -= 1;
                
                supplier.performanceScore = Math.max(0, Math.min(10, score));
            });

            const summary = {
                totalSuppliers: suppliers.length,
                activeSuppliers: suppliers.filter(s => s.status === 'ativo').length,
                inactiveSuppliers: suppliers.filter(s => s.status === 'inativo').length,
                excellentPerformance: suppliers.filter(s => s.performanceScore >= 8).length,
                totalValue: suppliers.reduce((sum, s) => sum + s.total_value, 0)
            };

            const performance = {
                labels: ['Excelente', 'Bom', 'Médio', 'Ruim', 'Inativo'],
                data: [
                    suppliers.filter(s => s.performanceScore >= 8).length,
                    suppliers.filter(s => s.performanceScore >= 6 && s.performanceScore < 8).length,
                    suppliers.filter(s => s.performanceScore >= 4 && s.performanceScore < 6).length,
                    suppliers.filter(s => s.performanceScore < 4).length,
                    summary.inactiveSuppliers
                ]
            };

            const topSuppliers = {
                labels: suppliers.slice(0, 10).map(s => s.name),
                data: suppliers.slice(0, 10).map(s => s.total_value)
            };

            res.json({
                success: true,
                summary,
                suppliers: suppliers.slice(0, 50),
                charts: { performance, topSuppliers }
            });

        } catch (error) {
            console.error('Erro no relatório de análise de fornecedores:', error);
            res.status(500).json({
                success: false,
                message: 'Erro interno do servidor',
                error: error.message
            });
        }
    }

    // Dashboard Executivo
    static async getExecutiveDashboard(req, res) {
        try {
            const db = req.app.locals.db;

            const kpisQuery = `
                SELECT 
                    (SELECT COUNT(*) FROM products) as total_products,
                    (SELECT SUM(price * stock) FROM products) as stock_value,
                    (SELECT COUNT(*) FROM products WHERE stock <= min_stock) as critical_stock,
                    (SELECT COUNT(*) FROM orders WHERE order_date >= date('now', '-30 days')) as monthly_orders,
                    (SELECT COALESCE(SUM(total_value), 0) FROM orders WHERE order_date >= date('now', '-30 days')) as monthly_value,
                    (SELECT COUNT(*) FROM suppliers WHERE status = 'ativo') as active_suppliers,
                    (SELECT COUNT(*) FROM quotes WHERE status = 'pendente') as pending_quotes
            `;

            const kpis = await new Promise((resolve, reject) => {
                db.get(kpisQuery, [], (err, row) => {
                    if (err) reject(err);
                    else resolve(row || {});
                });
            });

            const trendsQuery = `
                SELECT 
                    (SELECT COUNT(*) FROM orders WHERE order_date >= date('now', '-30 days')) as current_orders,
                    (SELECT COUNT(*) FROM orders WHERE order_date >= date('now', '-60 days') AND order_date < date('now', '-30 days')) as previous_orders,
                    (SELECT COUNT(*) FROM products WHERE created_at >= date('now', '-30 days')) as new_products,
                    (SELECT COUNT(*) FROM suppliers WHERE created_at >= date('now', '-30 days')) as new_suppliers
            `;

            const trendsData = await new Promise((resolve, reject) => {
                db.get(trendsQuery, [], (err, row) => {
                    if (err) reject(err);
                    else resolve(row || {});
                });
            });

            const trends = {
                orderGrowth: trendsData.previous_orders > 0 
                    ? Math.round(((trendsData.current_orders - trendsData.previous_orders) / trendsData.previous_orders) * 100)
                    : 0,
                newProducts: trendsData.new_products || 0,
                newSuppliers: trendsData.new_suppliers || 0
            };

            const alertsQuery = `
                SELECT 
                    'Estoque Crítico' as type,
                    'Produto com estoque zerado: ' || name as message,
                    'critical' as severity,
                    datetime('now') as createdAt
                FROM products 
                WHERE stock = 0
                LIMIT 5
            `;

            const alerts = await new Promise((resolve, reject) => {
                db.all(alertsQuery, [], (err, rows) => {
                    if (err) reject(err);
                    else resolve(rows || []);
                });
            });

            res.json({
                success: true,
                kpis: {
                    totalProducts: kpis.total_products || 0,
                    stockValue: kpis.stock_value || 0,
                    criticalStock: kpis.critical_stock || 0,
                    monthlyOrders: kpis.monthly_orders || 0,
                    monthlyValue: kpis.monthly_value || 0,
                    activeSuppliers: kpis.active_suppliers || 0,
                    pendingQuotes: kpis.pending_quotes || 0
                },
                trends,
                alerts
            });

        } catch (error) {
            console.error('Erro no dashboard executivo:', error);
            res.status(500).json({
                success: false,
                message: 'Erro interno do servidor',
                error: error.message
            });
        }
    }

    // Relatório de Tendências de Pedidos
    static async getOrderTrendsReport(req, res) {
        try {
            const db = req.app.locals.db;
            const { days = 30 } = req.query;

            const ordersQuery = `
                SELECT 
                    o.id, o.order_date, o.delivery_date, o.status, o.total_value,
                    s.name as supplier_name
                FROM orders o
                LEFT JOIN suppliers s ON o.supplier_id = s.id
                WHERE o.order_date >= date('now', '-' || ? || ' days')
                ORDER BY o.order_date DESC
            `;

            const orders = await new Promise((resolve, reject) => {
                db.all(ordersQuery, [days], (err, rows) => {
                    if (err) reject(err);
                    else resolve(rows || []);
                });
            });

            const completedOrders = orders.filter(o => o.status === 'entregue');
            
            const summary = {
                totalOrders: orders.length,
                totalValue: orders.reduce((sum, o) => sum + o.total_value, 0),
                avgDeliveryTime: 7, // Valor padrão
                completionRate: orders.length > 0 ? Math.round((completedOrders.length / orders.length) * 100) : 0,
                pendingOrders: orders.filter(o => o.status === 'pendente').length,
                processingOrders: orders.filter(o => o.status === 'processando').length,
                deliveredOrders: orders.filter(o => o.status === 'entregue').length,
                cancelledOrders: orders.filter(o => o.status === 'cancelado').length
            };

            const weekly = {
                labels: ['Sem 1', 'Sem 2', 'Sem 3', 'Sem 4'],
                orders: [5, 8, 6, 10],
                values: [15, 25, 18, 30]
            };

            const status = {
                labels: ['Pendente', 'Processando', 'Entregue', 'Cancelado'],
                data: [
                    summary.pendingOrders,
                    summary.processingOrders,
                    summary.deliveredOrders,
                    summary.cancelledOrders
                ]
            };

            res.json({
                success: true,
                summary,
                orders: orders.slice(0, 50),
                charts: { weekly, status }
            });

        } catch (error) {
            console.error('Erro no relatório de tendências de pedidos:', error);
            res.status(500).json({
                success: false,
                message: 'Erro interno do servidor',
                error: error.message
            });
        }
    }
}

module.exports = AdvancedReportController;