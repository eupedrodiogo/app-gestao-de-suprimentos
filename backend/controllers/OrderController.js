const Database = require('../database/database');
const Joi = require('joi');

class OrderController {
    constructor() {
        this.db = new Database();
    }

    // Schema de validação para pedidos
    getOrderSchema() {
        return Joi.object({
            supplier_id: Joi.number().integer().positive().required(),
            quote_id: Joi.number().integer().positive().allow(null),
            order_date: Joi.date().default(() => new Date()),
            expected_delivery: Joi.date().allow(null),
            delivery_address: Joi.string().required(),
            notes: Joi.string().allow('', null),
            status: Joi.string().valid('pendente', 'confirmado', 'em_producao', 'enviado', 'entregue', 'cancelado').default('pendente'),
            payment_terms: Joi.string().allow('', null),
            items: Joi.array().items(
                Joi.object({
                    product_id: Joi.number().integer().positive().required(),
                    quantity: Joi.number().integer().min(1).required(),
                    unit_price: Joi.number().min(0).required(),
                    notes: Joi.string().allow('', null)
                })
            ).min(1).required()
        });
    }

    async getAllOrders(req, res) {
        try {
            await this.db.ensureConnection();
            
            const { page = 1, limit = 50, search, supplier_id, status, date_from, date_to } = req.query;
            const offset = (page - 1) * limit;
            
            let whereClause = 'WHERE 1=1';
            const params = [];
            
            if (search) {
                whereClause += ' AND (s.name LIKE ? OR o.notes LIKE ? OR o.delivery_address LIKE ?)';
                const searchTerm = `%${search}%`;
                params.push(searchTerm, searchTerm, searchTerm);
            }
            
            if (supplier_id) {
                whereClause += ' AND o.supplier_id = ?';
                params.push(supplier_id);
            }
            
            if (status) {
                whereClause += ' AND o.status = ?';
                params.push(status);
            }
            
            if (date_from) {
                whereClause += ' AND o.order_date >= ?';
                params.push(date_from);
            }
            
            if (date_to) {
                whereClause += ' AND o.order_date <= ?';
                params.push(date_to);
            }

            const orders = await this.db.all(`
                SELECT o.*, 
                       s.name as supplier_name,
                       s.contact_name as supplier_contact,
                       (SELECT COUNT(*) FROM order_items WHERE order_id = o.id) as items_count,
                       (SELECT SUM(quantity * unit_price) FROM order_items WHERE order_id = o.id) as total_value
                FROM orders o 
                LEFT JOIN suppliers s ON o.supplier_id = s.id
                ${whereClause}
                ORDER BY o.created_at DESC
                LIMIT ? OFFSET ?
            `, [...params, parseInt(limit), offset]);

            // Contar total de registros
            const totalResult = await this.db.get(`
                SELECT COUNT(*) as total
                FROM orders o 
                LEFT JOIN suppliers s ON o.supplier_id = s.id
                ${whereClause}
            `, params);

            const total = totalResult?.total || 0;

            res.json({
                data: orders,
                pagination: {
                    page: parseInt(page),
                    limit: parseInt(limit),
                    total,
                    pages: Math.ceil(total / limit)
                }
            });
        } catch (error) {
            console.error('Error fetching orders:', error);
            res.status(500).json({ error: 'Erro interno do servidor' });
        }
    }
    static async getAll(db) {
        const sql = `
            SELECT o.*, s.name as supplier_name, s.contact_name as supplier_contact,
                   COUNT(oi.id) as item_count,
                   SUM(oi.received_quantity) as total_received,
                   SUM(oi.quantity) as total_ordered
            FROM orders o 
            LEFT JOIN suppliers s ON o.supplier_id = s.id
            LEFT JOIN order_items oi ON o.id = oi.order_id
            GROUP BY o.id
            ORDER BY o.created_at DESC
        `;
        return await db.all(sql);
    }

    static async getById(db, id) {
        const sql = `
            SELECT o.*, s.name as supplier_name, s.contact_name as supplier_contact,
                   s.email as supplier_email, s.phone as supplier_phone,
                   q.number as quote_number
            FROM orders o 
            LEFT JOIN suppliers s ON o.supplier_id = s.id
            LEFT JOIN quotes q ON o.quote_id = q.id
            WHERE o.id = ?
        `;
        const order = await db.get(sql, [id]);
        
        if (order) {
            // Get order items
            const itemsSql = `
                SELECT oi.*, p.code as product_code, p.name as product_name, p.unit
                FROM order_items oi
                LEFT JOIN products p ON oi.product_id = p.id
                WHERE oi.order_id = ?
                ORDER BY oi.id
            `;
            order.items = await db.all(itemsSql, [id]);
        }
        
        return order;
    }

    static async getByNumber(db, number) {
        const sql = 'SELECT * FROM orders WHERE number = ?';
        return await db.get(sql, [number]);
    }

    static async create(db, orderData) {
        const {
            supplier_id,
            quote_id = null,
            delivery_date,
            items,
            notes = '',
            status = 'pendente'
        } = orderData;

        // Validate supplier exists
        const supplier = await db.get('SELECT id FROM suppliers WHERE id = ? AND status = "ativo"', [supplier_id]);
        if (!supplier) {
            throw new Error('Supplier not found or inactive');
        }

        // Validate quote if provided
        if (quote_id) {
            const quote = await db.get('SELECT id, status FROM quotes WHERE id = ?', [quote_id]);
            if (!quote) {
                throw new Error('Quote not found');
            }
            if (quote.status !== 'aprovada') {
                throw new Error('Quote must be approved to create order');
            }
        }

        // Validate items
        if (!items || !Array.isArray(items) || items.length === 0) {
            throw new Error('At least one item is required');
        }

        // Generate order number
        const number = await this.generateOrderNumber(db);

        // Calculate total value
        let total_value = 0;
        for (const item of items) {
            if (!item.product_id || !item.quantity || !item.unit_price) {
                throw new Error('Invalid item data');
            }
            
            // Validate product exists
            const product = await db.get('SELECT id FROM products WHERE id = ? AND status = "ativo"', [item.product_id]);
            if (!product) {
                throw new Error(`Product with ID ${item.product_id} not found or inactive`);
            }
            
            item.total_price = item.quantity * item.unit_price;
            total_value += item.total_price;
        }

        try {
            // Insert order
            const orderSql = `
                INSERT INTO orders (
                    number, supplier_id, quote_id, delivery_date, total_value, status, notes
                ) VALUES (?, ?, ?, ?, ?, ?, ?)
            `;

            const orderResult = await db.run(orderSql, [
                number, supplier_id, quote_id, delivery_date, total_value, status, notes
            ]);

            const orderId = orderResult.lastID;

            // Insert order items
            const itemSql = `
                INSERT INTO order_items (
                    order_id, product_id, quantity, unit_price, total_price
                ) VALUES (?, ?, ?, ?, ?)
            `;

            for (const item of items) {
                await db.run(itemSql, [
                    orderId, item.product_id, item.quantity, item.unit_price, item.total_price
                ]);
            }

            return orderId;

        } catch (error) {
            throw error;
        }
    }

    static async update(db, id, orderData) {
        const {
            supplier_id,
            delivery_date,
            items,
            notes,
            status
        } = orderData;

        // Check if order exists
        const existingOrder = await this.getById(db, id);
        if (!existingOrder) {
            throw new Error('Order not found');
        }

        // Check if order can be updated (not delivered or cancelled)
        if (existingOrder.status === 'entregue' || existingOrder.status === 'cancelado') {
            throw new Error('Cannot update delivered or cancelled orders');
        }

        // Validate supplier exists
        const supplier = await db.get('SELECT id FROM suppliers WHERE id = ? AND status = "ativo"', [supplier_id]);
        if (!supplier) {
            throw new Error('Supplier not found or inactive');
        }

        // Validate items
        if (!items || !Array.isArray(items) || items.length === 0) {
            throw new Error('At least one item is required');
        }

        // Calculate total value
        let total_value = 0;
        for (const item of items) {
            if (!item.product_id || !item.quantity || !item.unit_price) {
                throw new Error('Invalid item data');
            }
            
            // Validate product exists
            const product = await db.get('SELECT id FROM products WHERE id = ? AND status = "ativo"', [item.product_id]);
            if (!product) {
                throw new Error(`Product with ID ${item.product_id} not found or inactive`);
            }
            
            item.total_price = item.quantity * item.unit_price;
            total_value += item.total_price;
        }

        try {
            // Update order
            const orderSql = `
                UPDATE orders SET 
                    supplier_id = ?, delivery_date = ?, total_value = ?, 
                    status = ?, notes = ?, updated_at = CURRENT_TIMESTAMP
                WHERE id = ?
            `;

            await db.run(orderSql, [
                supplier_id, delivery_date, total_value, status, notes, id
            ]);

            // Delete existing items
            await db.run('DELETE FROM order_items WHERE order_id = ?', [id]);

            // Insert new items
            const itemSql = `
                INSERT INTO order_items (
                    order_id, product_id, quantity, unit_price, total_price
                ) VALUES (?, ?, ?, ?, ?)
            `;

            for (const item of items) {
                await db.run(itemSql, [
                    id, item.product_id, item.quantity, item.unit_price, item.total_price
                ]);
            }

            return true;

        } catch (error) {
            throw error;
        }
    }

    static async updateStatus(db, id, status) {
        const validStatuses = ['pendente', 'aprovado', 'em_transito', 'entregue', 'cancelado'];
        if (!validStatuses.includes(status)) {
            throw new Error('Invalid status');
        }

        // Check if order exists
        const order = await this.getById(db, id);
        if (!order) {
            throw new Error('Order not found');
        }

        // If changing to delivered, update inventory
        if (status === 'entregue' && order.status !== 'entregue') {
            await this.processDelivery(db, id);
        }

        const sql = 'UPDATE orders SET status = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?';
        await db.run(sql, [status, id]);

        return true;
    }

    static async processDelivery(db, orderId) {
        const order = await this.getById(db, orderId);
        if (!order) {
            throw new Error('Order not found');
        }

        try {
            await db.beginTransaction();

            // Import ProductController for stock updates
            const ProductController = require('./ProductController');

            // Update stock for each item
            for (const item of order.items) {
                const receivedQty = item.received_quantity || item.quantity;
                
                // Get current product stock
                const product = await db.get('SELECT stock FROM products WHERE id = ?', [item.product_id]);
                const newStock = product.stock + receivedQty;
                
                // Update product stock
                await ProductController.updateStock(
                    db, 
                    item.product_id, 
                    newStock, 
                    `Recebimento do pedido ${order.number}`,
                    orderId,
                    'order'
                );
            }

            await db.commit();

        } catch (error) {
            await db.rollback();
            throw error;
        }
    }

    static async updateItemReceived(db, orderId, productId, receivedQuantity) {
        // Validate order and product
        const order = await this.getById(db, orderId);
        if (!order) {
            throw new Error('Order not found');
        }

        const item = order.items.find(i => i.product_id === productId);
        if (!item) {
            throw new Error('Product not found in order');
        }

        if (receivedQuantity > item.quantity) {
            throw new Error('Received quantity cannot exceed ordered quantity');
        }

        const sql = `
            UPDATE order_items 
            SET received_quantity = ? 
            WHERE order_id = ? AND product_id = ?
        `;
        
        await db.run(sql, [receivedQuantity, orderId, productId]);

        // Check if all items are fully received
        const allItemsReceived = await this.checkAllItemsReceived(db, orderId);
        if (allItemsReceived) {
            await this.updateStatus(db, orderId, 'entregue');
        }

        return true;
    }

    static async checkAllItemsReceived(db, orderId) {
        const sql = `
            SELECT COUNT(*) as total,
                   COUNT(CASE WHEN received_quantity >= quantity THEN 1 END) as received
            FROM order_items 
            WHERE order_id = ?
        `;
        
        const result = await db.get(sql, [orderId]);
        return result.total === result.received;
    }

    static async delete(db, id) {
        // Check if order exists
        const order = await this.getById(db, id);
        if (!order) {
            throw new Error('Order not found');
        }

        // Check if order can be deleted (only pending orders)
        if (order.status !== 'pendente') {
            throw new Error('Only pending orders can be deleted');
        }

        try {
            await db.beginTransaction();

            // Delete order items first (due to foreign key constraint)
            await db.run('DELETE FROM order_items WHERE order_id = ?', [id]);

            // Delete order
            await db.run('DELETE FROM orders WHERE id = ?', [id]);

            await db.commit();
            return true;

        } catch (error) {
            await db.rollback();
            throw error;
        }
    }

    static async getOrdersBySupplier(db, supplierId, limit = 50) {
        const sql = `
            SELECT o.*, COUNT(oi.id) as item_count
            FROM orders o 
            LEFT JOIN order_items oi ON o.id = oi.order_id
            WHERE o.supplier_id = ? 
            GROUP BY o.id
            ORDER BY o.created_at DESC 
            LIMIT ?
        `;
        return await db.all(sql, [supplierId, limit]);
    }

    static async getOrdersByStatus(db, status) {
        const sql = `
            SELECT o.*, s.name as supplier_name, COUNT(oi.id) as item_count
            FROM orders o 
            LEFT JOIN suppliers s ON o.supplier_id = s.id
            LEFT JOIN order_items oi ON o.id = oi.order_id
            WHERE o.status = ?
            GROUP BY o.id
            ORDER BY o.created_at DESC
        `;
        return await db.all(sql, [status]);
    }

    static async getPendingOrders(db) {
        return await this.getOrdersByStatus(db, 'pendente');
    }

    static async getInTransitOrders(db) {
        return await this.getOrdersByStatus(db, 'em_transito');
    }

    static async getOverdueOrders(db) {
        const today = new Date().toISOString().split('T')[0];
        const sql = `
            SELECT o.*, s.name as supplier_name, COUNT(oi.id) as item_count
            FROM orders o 
            LEFT JOIN suppliers s ON o.supplier_id = s.id
            LEFT JOIN order_items oi ON o.id = oi.order_id
            WHERE o.delivery_date < ? AND o.status NOT IN ('entregue', 'cancelado')
            GROUP BY o.id
            ORDER BY o.delivery_date ASC
        `;
        return await db.all(sql, [today]);
    }

    static async searchOrders(db, searchTerm) {
        const sql = `
            SELECT o.*, s.name as supplier_name, COUNT(oi.id) as item_count
            FROM orders o 
            LEFT JOIN suppliers s ON o.supplier_id = s.id
            LEFT JOIN order_items oi ON o.id = oi.order_id
            WHERE (o.number LIKE ? OR s.name LIKE ? OR o.notes LIKE ?)
            GROUP BY o.id
            ORDER BY o.created_at DESC
        `;
        const term = `%${searchTerm}%`;
        return await db.all(sql, [term, term, term]);
    }

    static async getOrderStats(db) {
        const stats = {};
        
        // Total orders
        const totalResult = await db.get('SELECT COUNT(*) as count FROM orders');
        stats.total = totalResult.count;

        // Pending orders
        const pendingResult = await db.get('SELECT COUNT(*) as count FROM orders WHERE status = "pendente"');
        stats.pending = pendingResult.count;

        // In transit orders
        const inTransitResult = await db.get('SELECT COUNT(*) as count FROM orders WHERE status = "em_transito"');
        stats.inTransit = inTransitResult.count;

        // Delivered orders
        const deliveredResult = await db.get('SELECT COUNT(*) as count FROM orders WHERE status = "entregue"');
        stats.delivered = deliveredResult.count;

        // Cancelled orders
        const cancelledResult = await db.get('SELECT COUNT(*) as count FROM orders WHERE status = "cancelado"');
        stats.cancelled = cancelledResult.count;

        // Overdue orders
        const today = new Date().toISOString().split('T')[0];
        const overdueResult = await db.get(`
            SELECT COUNT(*) as count FROM orders 
            WHERE delivery_date < ? AND status NOT IN ('entregue', 'cancelado')
        `, [today]);
        stats.overdue = overdueResult.count;

        // Total value of orders
        const valueResult = await db.get('SELECT SUM(total_value) as value FROM orders');
        stats.totalValue = valueResult.value || 0;

        // Average order value
        const avgValueResult = await db.get('SELECT AVG(total_value) as avg FROM orders');
        stats.averageValue = avgValueResult.avg || 0;

        return stats;
    }

    static async getOrdersByDateRange(db, startDate, endDate) {
        const sql = `
            SELECT o.*, s.name as supplier_name, COUNT(oi.id) as item_count
            FROM orders o 
            LEFT JOIN suppliers s ON o.supplier_id = s.id
            LEFT JOIN order_items oi ON o.id = oi.order_id
            WHERE o.created_at BETWEEN ? AND ?
            GROUP BY o.id
            ORDER BY o.created_at DESC
        `;
        return await db.all(sql, [startDate, endDate]);
    }

    static async generateOrderNumber(db) {
        const year = new Date().getFullYear();
        const prefix = `PED${year}`;
        
        // Get the last order number for this year
        const lastOrder = await db.get(
            'SELECT number FROM orders WHERE number LIKE ? ORDER BY number DESC LIMIT 1',
            [`${prefix}%`]
        );

        let nextNumber = 1;
        if (lastOrder) {
            const lastNumber = parseInt(lastOrder.number.replace(prefix, ''));
            nextNumber = lastNumber + 1;
        }

        return `${prefix}${nextNumber.toString().padStart(4, '0')}`;
    }

    static async getUpcomingDeliveries(db, days = 7) {
        const futureDate = new Date();
        futureDate.setDate(futureDate.getDate() + days);
        
        const sql = `
            SELECT o.*, s.name as supplier_name
            FROM orders o 
            LEFT JOIN suppliers s ON o.supplier_id = s.id
            WHERE o.status IN ('aprovado', 'em_transito') 
            AND o.delivery_date <= ?
            ORDER BY o.delivery_date ASC
        `;
        
        return await db.all(sql, [futureDate.toISOString()]);
    }

    static async getOrderPerformance(db, startDate = null, endDate = null) {
        let dateFilter = '';
        let params = [];

        if (startDate && endDate) {
            dateFilter = 'WHERE o.created_at BETWEEN ? AND ?';
            params.push(startDate, endDate);
        }

        const sql = `
            SELECT 
                COUNT(o.id) as total_orders,
                SUM(o.total_value) as total_value,
                AVG(o.total_value) as avg_order_value,
                COUNT(CASE WHEN o.status = 'entregue' THEN 1 END) as delivered_orders,
                COUNT(CASE WHEN o.status = 'cancelado' THEN 1 END) as cancelled_orders,
                COUNT(CASE WHEN o.delivery_date < date('now') AND o.status NOT IN ('entregue', 'cancelado') THEN 1 END) as overdue_orders,
                AVG(CASE 
                    WHEN o.status = 'entregue' 
                    THEN julianday(o.updated_at) - julianday(o.order_date) 
                END) as avg_delivery_days
            FROM orders o
            ${dateFilter}
        `;

        return await db.get(sql, params);
    }
}

module.exports = OrderController;