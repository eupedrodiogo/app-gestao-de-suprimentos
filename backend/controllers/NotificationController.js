const Database = require('../database/database');

class NotificationController {
    constructor() {
        this.db = null;
    }

    async initialize(database) {
        this.db = database;
        console.log('🔔 NotificationController inicializado');
    }

    // Buscar todas as notificações ativas
    async getNotifications(req, res) {
        try {
            const notifications = [];

            // 1. Verificar produtos com estoque baixo
            const lowStockQuery = `
                SELECT 
                    p.id,
                    p.name,
                    p.stock,
                    p.min_stock,
                    p.category
                FROM products p 
                WHERE p.stock <= p.min_stock 
                AND p.status = 'ativo'
                ORDER BY (p.stock / NULLIF(p.min_stock, 0)) ASC
            `;

            const lowStockResult = await this.db.query(lowStockQuery);
            
            if (lowStockResult.recordset && lowStockResult.recordset.length > 0) {
                lowStockResult.recordset.forEach(product => {
                    const ratio = product.min_stock > 0 ? product.stock / product.min_stock : 0;
                    let severity = 'low';
                    
                    if (ratio === 0) severity = 'critical';
                    else if (ratio <= 0.2) severity = 'high';
                    else if (ratio <= 0.5) severity = 'medium';
                    
                    notifications.push({
                        id: `low-stock-${product.id}`,
                        type: 'low_stock',
                        severity,
                        title: `Estoque baixo: ${product.name}`,
                        message: `Produto com estoque de ${product.stock} unidades (mínimo: ${product.min_stock})`,
                        data: {
                            productId: product.id,
                            productName: product.name,
                            currentStock: product.stock,
                            minStock: product.min_stock,
                            category: product.category
                        },
                        actionUrl: `/products/${product.id}`,
                        createdAt: new Date().toISOString()
                    });
                });
            }

            // 2. Verificar pedidos pendentes há mais de 7 dias
            const pendingOrdersQuery = `
                SELECT 
                    o.id,
                    o.order_date,
                    o.delivery_date,
                    o.total_value,
                    s.name as supplier_name,
                    julianday('now') - julianday(o.order_date) as days_pending
                FROM orders o
                INNER JOIN suppliers s ON o.supplier_id = s.id
                WHERE o.status IN ('pendente', 'processando')
                AND julianday('now') - julianday(o.order_date) > 7
                ORDER BY o.order_date ASC
            `;

            const pendingOrders = await this.db.query(pendingOrdersQuery);
            
            pendingOrders.forEach(order => {
                const severity = order.days_pending > 14 ? 'high' : 'medium';
                
                notifications.push({
                    id: `order-${order.id}`,
                    type: 'order_delay',
                    severity: severity,
                    title: 'Pedido Pendente',
                    message: `Pedido #${order.id} - ${order.supplier_name} (${Math.floor(order.days_pending)} dias)`,
                    data: {
                        orderId: order.id,
                        supplierName: order.supplier_name,
                        totalValue: order.total_value,
                        daysPending: Math.floor(order.days_pending)
                    },
                    actionUrl: `/orders/${order.id}`,
                    createdAt: new Date().toISOString()
                });
            });

            // 3. Verificar cotações próximas do vencimento
            const expiringQuotesQuery = `
                SELECT 
                    q.id,
                    q.request_date,
                    q.expected_date,
                    q.total_value,
                    s.name as supplier_name,
                    julianday(q.expected_date) - julianday('now') as days_until_expiry
                FROM quotes q
                INNER JOIN suppliers s ON q.supplier_id = s.id
                WHERE q.status = 'pendente'
                AND q.expected_date >= date('now')
                AND julianday(q.expected_date) - julianday('now') <= 3
                ORDER BY q.expected_date ASC
            `;

            const expiringQuotes = await this.db.query(expiringQuotesQuery);
            
            expiringQuotes.forEach(quote => {
                const severity = quote.days_until_expiry <= 1 ? 'high' : 'medium';
                
                notifications.push({
                    id: `quote-${quote.id}`,
                    type: 'quote_expiring',
                    severity: severity,
                    title: 'Cotação Vencendo',
                    message: `Cotação #${quote.id} - ${quote.supplier_name} (${Math.floor(quote.days_until_expiry)} dias)`,
                    data: {
                        quoteId: quote.id,
                        supplierName: quote.supplier_name,
                        totalValue: quote.total_value,
                        daysUntilExpiry: Math.floor(quote.days_until_expiry)
                    },
                    actionUrl: `/quotes/${quote.id}`,
                    createdAt: new Date().toISOString()
                });
            });

            // 4. Verificar fornecedores inativos com pedidos recentes
            const inactiveSuppliersQuery = `
                SELECT DISTINCT
                    s.id,
                    s.name,
                    s.status,
                    COUNT(o.id) as recent_orders
                FROM suppliers s
                INNER JOIN orders o ON s.id = o.supplier_id
                WHERE s.status = 'inativo'
                AND o.order_date >= date('now', '-3 months')
                GROUP BY s.id, s.name, s.status
                HAVING COUNT(o.id) > 0
            `;

            const inactiveSuppliers = await this.db.query(inactiveSuppliersQuery);
            
            inactiveSuppliers.forEach(supplier => {
                notifications.push({
                    id: `supplier-${supplier.id}`,
                    type: 'supplier_inactive',
                    severity: 'medium',
                    title: 'Fornecedor Inativo',
                    message: `${supplier.name} está inativo mas tem ${supplier.recent_orders} pedidos recentes`,
                    data: {
                        supplierId: supplier.id,
                        supplierName: supplier.name,
                        recentOrders: supplier.recent_orders
                    },
                    actionUrl: `/suppliers/${supplier.id}`,
                    createdAt: new Date().toISOString()
                });
            });

            // Ordenar notificações por severidade e timestamp
            const severityOrder = { 'critical': 0, 'high': 1, 'medium': 2, 'low': 3 };
            notifications.sort((a, b) => {
                if (severityOrder[a.severity] !== severityOrder[b.severity]) {
                    return severityOrder[a.severity] - severityOrder[b.severity];
                }
                return new Date(b.createdAt) - new Date(a.createdAt);
            });

            res.json({
                success: true,
                notifications: notifications,
                summary: {
                    total: notifications.length,
                    critical: notifications.filter(n => n.severity === 'critical').length,
                    high: notifications.filter(n => n.severity === 'high').length,
                    medium: notifications.filter(n => n.severity === 'medium').length,
                    low: notifications.filter(n => n.severity === 'low').length
                }
            });

        } catch (error) {
            console.error('❌ Erro ao buscar notificações:', error);
            res.status(500).json({
                success: false,
                message: 'Erro interno do servidor',
                error: error.message
            });
        }
    }

    // Marcar notificação como lida (para futuras implementações)
    async markAsRead(req, res) {
        try {
            const { notificationId } = req.params;
            
            // Por enquanto, apenas retorna sucesso
            // Em uma implementação futura, isso seria salvo no banco
            res.json({
                success: true,
                message: 'Notificação marcada como lida',
                notificationId: notificationId
            });

        } catch (error) {
            console.error('❌ Erro ao marcar notificação como lida:', error);
            res.status(500).json({
                success: false,
                message: 'Erro interno do servidor',
                error: error.message
            });
        }
    }

    // Buscar resumo de notificações para o dashboard
    async getNotificationSummary(req, res) {
        try {
            // Reutilizar a lógica do getNotifications mas retornar apenas o resumo
            const fullResponse = await new Promise((resolve, reject) => {
                const mockRes = {
                    json: (data) => resolve(data),
                    status: (code) => ({ json: (data) => reject(data) })
                };
                this.getNotifications(req, mockRes);
            });

            res.json({
                success: true,
                summary: fullResponse.summary,
                hasNotifications: fullResponse.notifications.length > 0,
                urgentCount: fullResponse.notifications.filter(n => 
                    n.severity === 'critical' || n.severity === 'high'
                ).length
            });

        } catch (error) {
            console.error('❌ Erro ao buscar resumo de notificações:', error);
            res.status(500).json({
                success: false,
                message: 'Erro interno do servidor',
                error: error.message
            });
        }
    }
}

module.exports = NotificationController;