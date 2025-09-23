const log = require('../utils/logger');

class ReportController {
    static async getInventoryReport(req, res) {
        try {
            const db = req.app.locals.db;
            
            const query = `
                SELECT 
                    p.id,
                    p.name,
                    p.description,
                    p.category,
                    p.unit_price,
                    COALESCE(SUM(i.quantity), 0) as current_stock,
                    p.minimum_stock,
                    CASE 
                        WHEN COALESCE(SUM(i.quantity), 0) <= p.minimum_stock THEN 'Baixo'
                        WHEN COALESCE(SUM(i.quantity), 0) <= p.minimum_stock * 2 THEN 'Médio'
                        ELSE 'Alto'
                    END as stock_level
                FROM products p
                LEFT JOIN inventory i ON p.id = i.product_id
                GROUP BY p.id, p.name, p.description, p.category, p.unit_price, p.minimum_stock
                ORDER BY p.name
            `;
            
            const result = await db.request().query(query);
            
            res.json({
                success: true,
                data: result
            });
        } catch (error) {
            log.error('Erro ao gerar relatório de inventário', { 
                error: error.message, 
                stack: error.stack,
                ip: req.ip,
                userAgent: req.get('User-Agent')
            });
            res.status(500).json({ error: 'Erro interno do servidor' });
        }
    }

    static async getSalesReport(req, res) {
        try {
            const db = req.app.locals.db;
            const { startDate, endDate } = req.query;
            
            let query = `
                SELECT 
                    o.id,
                    o.order_number,
                    o.order_date,
                    o.status,
                    o.total_amount,
                    s.name as supplier_name,
                    COUNT(oi.id) as total_items
                FROM orders o
                LEFT JOIN suppliers s ON o.supplier_id = s.id
                LEFT JOIN order_items oi ON o.id = oi.order_id
            `;
            
            const conditions = [];
            if (startDate) conditions.push(`o.order_date >= '${startDate}'`);
            if (endDate) conditions.push(`o.order_date <= '${endDate}'`);
            
            if (conditions.length > 0) {
                query += ` WHERE ${conditions.join(' AND ')}`;
            }
            
            query += `
                GROUP BY o.id, o.order_number, o.order_date, o.status, o.total_amount, s.name
                ORDER BY o.order_date DESC
            `;
            
            const result = await db.request().query(query);
            
            res.json({
                success: true,
                data: result.recordset
            });
        } catch (error) {
            log.error('Erro ao gerar relatório de vendas', { 
                error: error.message, 
                stack: error.stack,
                startDate: req.query.start_date,
                endDate: req.query.end_date,
                ip: req.ip,
                userAgent: req.get('User-Agent')
            });
            res.status(500).json({ error: 'Erro interno do servidor' });
        }
    }

    static async getSupplierReport(req, res) {
        try {
            const db = req.app.locals.db;
            
            const query = `
                SELECT 
                    s.id,
                    s.name,
                    s.email,
                    s.phone,
                    s.address,
                    COUNT(DISTINCT o.id) as total_orders,
                    COALESCE(SUM(o.total_amount), 0) as total_amount,
                    COUNT(DISTINCT p.id) as total_products
                FROM suppliers s
                LEFT JOIN orders o ON s.id = o.supplier_id
                LEFT JOIN products p ON s.id = p.supplier_id
                GROUP BY s.id, s.name, s.email, s.phone, s.address
                ORDER BY total_amount DESC
            `;
            
            const result = await db.request().query(query);
            
            res.json({
                success: true,
                data: result.recordset
            });
        } catch (error) {
            log.error('Erro ao gerar relatório de fornecedores', { 
                error: error.message, 
                stack: error.stack,
                ip: req.ip,
                userAgent: req.get('User-Agent')
            });
            res.status(500).json({ error: 'Erro interno do servidor' });
        }
    }

    static async getQuoteReport(req, res) {
        try {
            const db = req.app.locals.db;
            const { status } = req.query;
            
            let query = `
                SELECT 
                    q.id,
                    q.quote_number,
                    q.quote_date,
                    q.expiry_date,
                    q.status,
                    q.total_amount,
                    s.name as supplier_name,
                    COUNT(qi.id) as total_items
                FROM quotes q
                LEFT JOIN suppliers s ON q.supplier_id = s.id
                LEFT JOIN quote_items qi ON q.id = qi.quote_id
            `;
            
            const params = [];
            if (status) {
                query += ` WHERE q.status = ?`;
                params.push(status);
            }
            
            query += `
                GROUP BY q.id, q.quote_number, q.quote_date, q.expiry_date, q.status, q.total_amount, s.name
                ORDER BY q.quote_date DESC
            `;
            
            const result = await db.all(query, params);
            
            res.json({
                success: true,
                data: result.recordset
            });
        } catch (error) {
            log.error('Erro ao gerar relatório de cotações', { 
                error: error.message, 
                stack: error.stack,
                ip: req.ip,
                userAgent: req.get('User-Agent')
            });
            res.status(500).json({ error: 'Erro interno do servidor' });
        }
    }

    static async getDashboardData(req, res) {
        try {
            const db = req.app.locals.db;
            
            // Buscar dados do dashboard
            const totalProductsQuery = 'SELECT COUNT(*) as total FROM products';
            const totalSuppliersQuery = 'SELECT COUNT(*) as total FROM suppliers';
            const totalOrdersQuery = 'SELECT COUNT(*) as total FROM orders';
            const lowStockQuery = `
                SELECT COUNT(*) as total 
                FROM products p
                LEFT JOIN inventory i ON p.id = i.product_id
                GROUP BY p.id, p.minimum_stock
                HAVING COALESCE(SUM(i.quantity), 0) <= p.minimum_stock
            `;
            
            const [totalProducts, totalSuppliers, totalOrders, lowStock] = await Promise.all([
                db.request().query(totalProductsQuery),
                db.request().query(totalSuppliersQuery),
                db.request().query(totalOrdersQuery),
                db.request().query(lowStockQuery)
            ]);
            
            res.json({
                success: true,
                data: {
                    totalProducts: totalProducts.recordset[0].total,
                    totalSuppliers: totalSuppliers.recordset[0].total,
                    totalOrders: totalOrders.recordset[0].total,
                    lowStockItems: lowStock.recordset.length
                }
            });
        } catch (error) {
            log.error('Erro ao buscar dados do dashboard', { 
                error: error.message, 
                stack: error.stack,
                ip: req.ip,
                userAgent: req.get('User-Agent')
            });
            res.status(500).json({ error: 'Erro interno do servidor' });
        }
    }
}

module.exports = ReportController;