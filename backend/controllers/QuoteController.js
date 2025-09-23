const Database = require('../database/database');
const Joi = require('joi');
const log = require('../utils/logger');
const OrderController = require('./OrderController');

class QuoteController {
    constructor() {
        this.db = new Database();
    }

    // Schema de validação para cotações
    getQuoteSchema() {
        return Joi.object({
            supplier_id: Joi.number().integer().positive().required(),
            request_date: Joi.date().default(() => new Date()),
            expected_date: Joi.date().allow(null),
            notes: Joi.string().allow('', null),
            status: Joi.string().valid('pendente', 'enviada', 'recebida', 'aprovada', 'rejeitada', 'cancelada').default('pendente'),
            items: Joi.array().items(
                Joi.object({
                    product_id: Joi.number().integer().positive().required(),
                    quantity: Joi.number().integer().min(1).required(),
                    unit_price: Joi.number().min(0).allow(null),
                    notes: Joi.string().allow('', null)
                })
            ).min(1).required()
        });
    }

    async getAllQuotes(req, res) {
        try {
            await this.db.ensureConnection();
            
            const { page = 1, limit = 50, search, supplier_id, status, date_from, date_to } = req.query;
            const offset = (page - 1) * limit;
            
            let whereClause = 'WHERE 1=1';
            const params = [];
            
            if (search) {
                whereClause += ' AND (s.name LIKE ? OR q.notes LIKE ?)';
                const searchTerm = `%${search}%`;
                params.push(searchTerm, searchTerm);
            }
            
            if (supplier_id) {
                whereClause += ' AND q.supplier_id = ?';
                params.push(supplier_id);
            }
            
            if (status) {
                whereClause += ' AND q.status = ?';
                params.push(status);
            }
            
            if (date_from) {
                whereClause += ' AND q.request_date >= ?';
                params.push(date_from);
            }
            
            if (date_to) {
                whereClause += ' AND q.request_date <= ?';
                params.push(date_to);
            }

            const quotes = await this.db.all(`
                SELECT q.*, 
                       s.name as supplier_name,
                       s.contact_name as supplier_contact,
                       (SELECT COUNT(*) FROM quote_items WHERE quote_id = q.id) as items_count,
                       (SELECT SUM(quantity * IFNULL(unit_price, 0)) FROM quote_items WHERE quote_id = q.id) as total_value
                FROM quotes q 
                LEFT JOIN suppliers s ON q.supplier_id = s.id
                ${whereClause}
                ORDER BY q.created_at DESC
                LIMIT ? OFFSET ?
            `, [...params, parseInt(limit), offset]);

            // Contar total de registros
            const totalResult = await this.db.get(`
                SELECT COUNT(*) as total
                FROM quotes q 
                LEFT JOIN suppliers s ON q.supplier_id = s.id
                ${whereClause}
            `, params);

            const total = totalResult?.total || 0;

            res.json({
                data: quotes,
                pagination: {
                    page: parseInt(page),
                    limit: parseInt(limit),
                    total,
                    pages: Math.ceil(total / limit)
                }
            });
        } catch (error) {
            log.error('Erro ao buscar cotações', { 
                error: error.message, 
                stack: error.stack,
                ip: req.ip,
                userAgent: req.get('User-Agent')
            });
            res.status(500).json({ error: 'Erro interno do servidor' });
        }
    }

    static async getAll(db) {
        const sql = `
            SELECT q.*, s.name as supplier_name, s.contact_name as supplier_contact,
                   COUNT(qi.id) as item_count
            FROM quotes q 
            LEFT JOIN suppliers s ON q.supplier_id = s.id
            LEFT JOIN quote_items qi ON q.id = qi.quote_id
            GROUP BY q.id
            ORDER BY q.created_at DESC
        `;
        return await db.all(sql);
    }

    static async getById(db, id) {
        const sql = `
            SELECT q.*, s.name as supplier_name, s.contact_name as supplier_contact,
                   s.email as supplier_email, s.phone as supplier_phone
            FROM quotes q 
            LEFT JOIN suppliers s ON q.supplier_id = s.id
            WHERE q.id = ?
        `;
        const quote = await db.get(sql, [id]);
        
        if (quote) {
            // Get quote items
            const itemsSql = `
                SELECT qi.*, p.code as product_code, p.name as product_name, p.unit
                FROM quote_items qi
                LEFT JOIN products p ON qi.product_id = p.id
                WHERE qi.quote_id = ?
                ORDER BY qi.id
            `;
            quote.items = await db.all(itemsSql, [id]);
        }
        
        return quote;
    }

    static async getByNumber(db, number) {
        const sql = 'SELECT * FROM quotes WHERE number = ?';
        return await db.get(sql, [number]);
    }

    static async create(db, quoteData) {
        const {
            supplier_id,
            delivery_date,
            items,
            notes = '',
            status = 'pendente'
        } = quoteData;

        // Validate supplier exists
        const supplier = await db.get('SELECT id FROM suppliers WHERE id = ? AND status = "ativo"', [supplier_id]);
        if (!supplier) {
            throw new Error('Supplier not found or inactive');
        }

        // Validate items
        if (!items || !Array.isArray(items) || items.length === 0) {
            throw new Error('At least one item is required');
        }

        // Generate quote number
        const number = await this.generateQuoteNumber(db);

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
            // Insert quote
            const quoteSql = `
                INSERT INTO quotes (
                    number, supplier_id, delivery_date, total_value, status, notes
                ) VALUES (?, ?, ?, ?, ?, ?)
            `;

            const quoteResult = await db.run(quoteSql, [
                number, supplier_id, delivery_date, total_value, status, notes
            ]);

            const quoteId = quoteResult.lastID;

            // Insert quote items
            const itemSql = `
                INSERT INTO quote_items (
                    quote_id, product_id, quantity, unit_price, total_price
                ) VALUES (?, ?, ?, ?, ?)
            `;

            for (const item of items) {
                await db.run(itemSql, [
                    quoteId, item.product_id, item.quantity, item.unit_price, item.total_price
                ]);
            }

            return quoteId;

        } catch (error) {
            throw error;
        }
    }

    static async update(db, id, quoteData) {
        const {
            supplier_id,
            delivery_date,
            items,
            notes,
            status
        } = quoteData;

        // Check if quote exists
        const existingQuote = await this.getById(db, id);
        if (!existingQuote) {
            throw new Error('Quote not found');
        }

        // Check if quote can be updated (not approved or rejected)
        if (existingQuote.status === 'aprovada' || existingQuote.status === 'rejeitada') {
            throw new Error('Cannot update approved or rejected quotes');
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
            // Update quote
            const quoteSql = `
                UPDATE quotes SET 
                    supplier_id = ?, delivery_date = ?, total_value = ?, 
                    status = ?, notes = ?, updated_at = CURRENT_TIMESTAMP
                WHERE id = ?
            `;

            await db.run(quoteSql, [
                supplier_id, delivery_date, total_value, status, notes, id
            ]);

            // Delete existing items
            await db.run('DELETE FROM quote_items WHERE quote_id = ?', [id]);

            // Insert new items
            const itemSql = `
                INSERT INTO quote_items (
                    quote_id, product_id, quantity, unit_price, total_price
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
        const validStatuses = ['pendente', 'aprovada', 'rejeitada'];
        if (!validStatuses.includes(status)) {
            throw new Error('Invalid status');
        }

        // Check if quote exists
        const quote = await this.getById(db, id);
        if (!quote) {
            throw new Error('Quote not found');
        }

        const sql = 'UPDATE quotes SET status = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?';
        await db.run(sql, [status, id]);

        return true;
    }

    static async delete(db, id) {
        // Check if quote exists
        const quote = await this.getById(db, id);
        if (!quote) {
            throw new Error('Quote not found');
        }

        // Check if quote is approved (cannot delete approved quotes)
        if (quote.status === 'aprovada') {
            throw new Error('Cannot delete approved quotes');
        }

        // Check if quote has associated orders
        const orders = await db.get('SELECT COUNT(*) as count FROM orders WHERE quote_id = ?', [id]);
        if (orders.count > 0) {
            throw new Error('Cannot delete quote with associated orders');
        }

        try {
            await db.beginTransaction();

            // Delete quote items first (due to foreign key constraint)
            await db.run('DELETE FROM quote_items WHERE quote_id = ?', [id]);

            // Delete quote
            await db.run('DELETE FROM quotes WHERE id = ?', [id]);

            await db.commit();
            return true;

        } catch (error) {
            await db.rollback();
            throw error;
        }
    }

    static async getQuotesBySupplier(db, supplierId, limit = 50) {
        const sql = `
            SELECT q.*, COUNT(qi.id) as item_count
            FROM quotes q 
            LEFT JOIN quote_items qi ON q.id = qi.quote_id
            WHERE q.supplier_id = ? 
            GROUP BY q.id
            ORDER BY q.created_at DESC 
            LIMIT ?
        `;
        return await db.all(sql, [supplierId, limit]);
    }

    static async getQuotesByStatus(db, status) {
        const sql = `
            SELECT q.*, s.name as supplier_name, COUNT(qi.id) as item_count
            FROM quotes q 
            LEFT JOIN suppliers s ON q.supplier_id = s.id
            LEFT JOIN quote_items qi ON q.id = qi.quote_id
            WHERE q.status = ?
            GROUP BY q.id
            ORDER BY q.created_at DESC
        `;
        return await db.all(sql, [status]);
    }

    static async getPendingQuotes(db) {
        return await this.getQuotesByStatus(db, 'pendente');
    }

    static async getApprovedQuotes(db) {
        return await this.getQuotesByStatus(db, 'aprovada');
    }

    static async searchQuotes(db, searchTerm) {
        const sql = `
            SELECT q.*, s.name as supplier_name, COUNT(qi.id) as item_count
            FROM quotes q 
            LEFT JOIN suppliers s ON q.supplier_id = s.id
            LEFT JOIN quote_items qi ON q.id = qi.quote_id
            WHERE (q.number LIKE ? OR s.name LIKE ? OR q.notes LIKE ?)
            GROUP BY q.id
            ORDER BY q.created_at DESC
        `;
        const term = `%${searchTerm}%`;
        return await db.all(sql, [term, term, term]);
    }

    static async getQuoteStats(db) {
        const stats = {};
        
        // Total quotes
        const totalResult = await db.get('SELECT COUNT(*) as count FROM quotes');
        stats.total = totalResult.count;

        // Pending quotes
        const pendingResult = await db.get('SELECT COUNT(*) as count FROM quotes WHERE status = "pendente"');
        stats.pending = pendingResult.count;

        // Approved quotes
        const approvedResult = await db.get('SELECT COUNT(*) as count FROM quotes WHERE status = "aprovada"');
        stats.approved = approvedResult.count;

        // Rejected quotes
        const rejectedResult = await db.get('SELECT COUNT(*) as count FROM quotes WHERE status = "rejeitada"');
        stats.rejected = rejectedResult.count;

        // Total value of approved quotes
        const valueResult = await db.get('SELECT SUM(total_value) as value FROM quotes WHERE status = "aprovada"');
        stats.totalApprovedValue = valueResult.value || 0;

        // Average quote value
        const avgValueResult = await db.get('SELECT AVG(total_value) as avg FROM quotes');
        stats.averageValue = avgValueResult.avg || 0;

        return stats;
    }

    static async getQuotesByDateRange(db, startDate, endDate) {
        const sql = `
            SELECT q.*, s.name as supplier_name, COUNT(qi.id) as item_count
            FROM quotes q 
            LEFT JOIN suppliers s ON q.supplier_id = s.id
            LEFT JOIN quote_items qi ON q.id = qi.quote_id
            WHERE q.created_at BETWEEN ? AND ?
            GROUP BY q.id
            ORDER BY q.created_at DESC
        `;
        return await db.all(sql, [startDate, endDate]);
    }

    static async convertToOrder(db, quoteId) {
        const quote = await this.getById(db, quoteId);
        if (!quote) {
            throw new Error('Quote not found');
        }

        if (quote.status !== 'aprovada') {
            throw new Error('Only approved quotes can be converted to orders');
        }

        // Import OrderController to create order
        const OrderController = require('./OrderController');
        
        const orderData = {
            supplier_id: quote.supplier_id,
            quote_id: quoteId,
            delivery_date: quote.delivery_date,
            items: quote.items.map(item => ({
                product_id: item.product_id,
                quantity: item.quantity,
                unit_price: item.unit_price
            })),
            notes: `Converted from quote ${quote.number}`,
            status: 'pendente'
        };

        return await OrderController.create(db, orderData);
    }

    static async generateQuoteNumber(db) {
        const year = new Date().getFullYear();
        const prefix = `COT${year}`;
        
        // Get the last quote number for this year
        const lastQuote = await db.get(
            'SELECT number FROM quotes WHERE number LIKE ? ORDER BY number DESC LIMIT 1',
            [`${prefix}%`]
        );

        let nextNumber = 1;
        if (lastQuote) {
            const lastNumber = parseInt(lastQuote.number.replace(prefix, ''));
            nextNumber = lastNumber + 1;
        }

        return `${prefix}${nextNumber.toString().padStart(4, '0')}`;
    }

    static async getExpiringQuotes(db, days = 7) {
        const futureDate = new Date();
        futureDate.setDate(futureDate.getDate() + days);
        
        const sql = `
            SELECT q.*, s.name as supplier_name
            FROM quotes q 
            LEFT JOIN suppliers s ON q.supplier_id = s.id
            WHERE q.status = 'pendente' 
            AND q.delivery_date <= ?
            ORDER BY q.delivery_date ASC
        `;
        
        return await db.all(sql, [futureDate.toISOString()]);
    }

    async getQuoteById(req, res) {
        try {
            await this.db.ensureConnection();
            const quote = await QuoteController.getById(this.db, req.params.id);
            
            if (!quote) {
                return res.status(404).json({ error: 'Cotação não encontrada' });
            }
            
            res.json(quote);
        } catch (error) {
            log.error('Erro ao buscar cotação por ID', { 
                error: error.message, 
                stack: error.stack,
                quoteId: req.params.id,
                ip: req.ip,
                userAgent: req.get('User-Agent')
            });
            res.status(500).json({ error: 'Erro interno do servidor' });
        }
    }

    async createQuote(req, res) {
        try {
            await this.db.ensureConnection();
            
            const { error, value } = this.getQuoteSchema().validate(req.body);
            if (error) {
                return res.status(400).json({ 
                    error: 'Dados inválidos', 
                    details: error.details 
                });
            }
            
            const quoteId = await QuoteController.create(this.db, value);
            const quote = await QuoteController.getById(this.db, quoteId);
            
            res.status(201).json({ 
                success: true,
                data: quote 
            });
        } catch (error) {
            log.error('Erro ao criar cotação', { 
                error: error.message, 
                stack: error.stack,
                quoteData: req.body,
                ip: req.ip,
                userAgent: req.get('User-Agent')
            });
            res.status(500).json({ 
                success: false,
                error: 'Erro interno do servidor' 
            });
        }
    }

    async updateQuote(req, res) {
        try {
            await this.db.ensureConnection();
            
            const { error, value } = this.getQuoteSchema().validate(req.body);
            if (error) {
                return res.status(400).json({ 
                    error: 'Dados inválidos', 
                    details: error.details 
                });
            }
            
            await QuoteController.update(this.db, req.params.id, value);
            const quote = await QuoteController.getById(this.db, req.params.id);
            
            res.json({ 
                success: true,
                data: quote 
            });
        } catch (error) {
            log.error('Erro ao atualizar cotação', { 
                error: error.message, 
                stack: error.stack,
                quoteId: req.params.id,
                updateData: req.body,
                ip: req.ip,
                userAgent: req.get('User-Agent')
            });
            res.status(500).json({ error: 'Erro interno do servidor' });
        }
    }

    async deleteQuote(req, res) {
        try {
            await this.db.ensureConnection();
            await QuoteController.delete(this.db, req.params.id);
            
            res.json({ 
                success: true,
                message: 'Cotação excluída com sucesso' 
            });
        } catch (error) {
            log.error('Erro ao excluir cotação', { 
                error: error.message, 
                stack: error.stack,
                quoteId: req.params.id,
                ip: req.ip,
                userAgent: req.get('User-Agent')
            });
            res.status(500).json({ error: 'Erro interno do servidor' });
        }
    }

    async approveQuote(req, res) {
        try {
            await this.db.ensureConnection();
            await QuoteController.updateStatus(this.db, req.params.id, 'aprovada');
            
            res.json({ 
                success: true,
                message: 'Cotação aprovada com sucesso' 
            });
        } catch (error) {
            log.error('Erro ao aprovar cotação', { 
                error: error.message, 
                stack: error.stack,
                quoteId: req.params.id,
                ip: req.ip,
                userAgent: req.get('User-Agent')
            });
            res.status(500).json({ error: 'Erro interno do servidor' });
        }
    }

    async rejectQuote(req, res) {
        try {
            await this.db.ensureConnection();
            await QuoteController.updateStatus(this.db, req.params.id, 'rejeitada');
            
            res.json({ 
                success: true,
                message: 'Cotação rejeitada com sucesso' 
            });
        } catch (error) {
            log.error('Erro ao rejeitar cotação', { 
                error: error.message, 
                stack: error.stack,
                quoteId: req.params.id,
                ip: req.ip,
                userAgent: req.get('User-Agent')
            });
            res.status(500).json({ error: 'Erro interno do servidor' });
        }
    }

    async convertQuoteToOrder(req, res) {
        try {
            await this.db.ensureConnection();
            const orderId = await QuoteController.convertToOrder(this.db, req.params.id);
            
            res.json({ 
                success: true,
                message: 'Cotação convertida em pedido com sucesso',
                orderId 
            });
        } catch (error) {
            log.error('Erro ao converter cotação em pedido', { 
                error: error.message, 
                stack: error.stack,
                quoteId: req.params.id,
                orderData: req.body,
                ip: req.ip,
                userAgent: req.get('User-Agent')
            });
            res.status(500).json({ error: 'Erro interno do servidor' });
        }
    }
}

module.exports = QuoteController;