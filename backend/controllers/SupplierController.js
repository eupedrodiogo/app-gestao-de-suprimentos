const Database = require('../database/database');
const Joi = require('joi');

class SupplierController {
    constructor() {
        this.db = new Database();
    }

    // Schema de validação para fornecedores
    getSupplierSchema() {
        return Joi.object({
            name: Joi.string().max(200).required(),
            contact_name: Joi.string().max(100).allow('', null),
            email: Joi.string().email().max(100).required(),
            phone: Joi.string().max(20).required(),
            mobile: Joi.string().max(20).allow('', null),
            address: Joi.string().max(200).allow('', null),
            city: Joi.string().max(100).allow('', null),
            state: Joi.string().max(50).allow('', null),
            zip_code: Joi.string().max(20).allow('', null),
            country: Joi.string().max(50).default('Brasil'),
            cnpj: Joi.string().max(18).allow('', null),
            ie: Joi.string().max(20).allow('', null),
            website: Joi.string().uri().allow('', null),
            notes: Joi.string().allow('', null),
            status: Joi.string().valid('ativo', 'inativo', 'bloqueado').default('ativo'),
            payment_terms: Joi.string().max(100).allow('', null),
            credit_limit: Joi.number().min(0).allow(null),
            discount_percentage: Joi.number().min(0).max(100).allow(null)
        });
    }

    static async getAll(db) {
        const sql = `
            SELECT * FROM suppliers 
            ORDER BY name
        `;
        return await db.all(sql);
    }

    async getAllSuppliers(req, res) {
        try {
            await this.db.ensureConnection();
            
            const { page = 1, limit = 50, search, status, city, state } = req.query;
            const offset = (page - 1) * limit;
            
            let whereClause = 'WHERE 1=1';
            const params = [];
            
            if (search) {
                whereClause += ' AND (name LIKE ? OR contact_name LIKE ? OR email LIKE ? OR cnpj LIKE ?)';
                const searchTerm = `%${search}%`;
                params.push(searchTerm, searchTerm, searchTerm, searchTerm);
            }
            
            if (status) {
                whereClause += ' AND status = ?';
                params.push(status);
            }
            
            if (city) {
                whereClause += ' AND city = ?';
                params.push(city);
            }
            
            if (state) {
                whereClause += ' AND state = ?';
                params.push(state);
            }

            const suppliers = await this.db.all(`
                SELECT s.*, 
                       (SELECT COUNT(*) FROM products WHERE supplier_id = s.id) as products_count,
                       (SELECT COUNT(*) FROM quotes WHERE supplier_id = s.id) as quotes_count
                FROM suppliers s 
                ${whereClause}
                ORDER BY s.name
                LIMIT ? OFFSET ?
            `, [...params, parseInt(limit), offset]);

            // Contar total de registros
            const totalResult = await this.db.get(`
                SELECT COUNT(*) as total
                FROM suppliers s 
                ${whereClause}
            `, params);

            const total = totalResult?.total || 0;

            res.json({
                data: suppliers,
                pagination: {
                    page: parseInt(page),
                    limit: parseInt(limit),
                    total,
                    pages: Math.ceil(total / limit)
                }
            });
        } catch (error) {
            console.error('Error fetching suppliers:', error);
            res.status(500).json({ error: 'Erro interno do servidor' });
        }
    }

    static async getById(db, id) {
        const sql = `
            SELECT s.*, 
                   COUNT(p.id) as product_count,
                   COUNT(CASE WHEN o.status = 'pendente' THEN 1 END) as pending_orders
            FROM suppliers s 
            LEFT JOIN products p ON s.id = p.supplier_id AND p.status = 'ativo'
            LEFT JOIN orders o ON s.id = o.supplier_id AND o.status = 'pendente'
            WHERE s.id = ?
            GROUP BY s.id
        `;
        return await db.get(sql, [id]);
    }

    async getSupplierById(req, res) {
        try {
            await this.db.ensureConnection();
            const { id } = req.params;
            
            const supplier = await this.db.get(`
                SELECT s.*, 
                       (SELECT COUNT(*) FROM products WHERE supplier_id = s.id) as products_count,
                       (SELECT COUNT(*) FROM quotes WHERE supplier_id = s.id) as quotes_count,
                       (SELECT COUNT(*) FROM orders WHERE supplier_id = s.id) as orders_count
                FROM suppliers s 
                WHERE s.id = ?
            `, [id]);

            if (!supplier) {
                return res.status(404).json({ error: 'Fornecedor não encontrado' });
            }

            res.json(supplier);
        } catch (error) {
            console.error('Error fetching supplier:', error);
            res.status(500).json({ error: 'Erro interno do servidor' });
        }
    }

    static async getByCnpj(db, cnpj) {
        const sql = 'SELECT * FROM suppliers WHERE cnpj = ?';
        return await db.get(sql, [cnpj]);
    }

    static async create(db, supplierData) {
        const {
            cnpj,
            name,
            contact,
            email,
            phone,
            address,
            city,
            state,
            zip_code,
            rating = 0,
            status = 'ativo'
        } = supplierData;

        // Validate CNPJ format (basic validation)
        if (!this.isValidCnpj(cnpj)) {
            throw new Error('Invalid CNPJ format');
        }

        // Check if CNPJ already exists
        const existingSupplier = await this.getByCnpj(db, cnpj);
        if (existingSupplier) {
            throw new Error('CNPJ already exists');
        }

        // Validate email format
        if (!this.isValidEmail(email)) {
            throw new Error('Invalid email format');
        }

        const sql = `
            INSERT INTO suppliers (
                cnpj, name, contact, email, phone, address, 
                city, state, zip_code, rating, status
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `;

        const result = await db.run(sql, [
            cnpj, name, contact, email, phone, address,
            city, state, zip_code, rating, status
        ]);

        return result.id;
    }

    async createSupplier(req, res) {
        try {
            await this.db.ensureConnection();
            
            // Validar dados de entrada
            const { error, value } = this.getSupplierSchema().validate(req.body);
            if (error) {
                return res.status(400).json({ 
                    error: 'Dados inválidos', 
                    details: error.details.map(d => d.message) 
                });
            }

            const {
                name, contact_name, email, phone, mobile, address, city, state, 
                zip_code, country, cnpj, ie, website, notes, status, 
                payment_terms, credit_limit, discount_percentage
            } = value;

            // Validação básica
            if (!name) {
                return res.status(400).json({ error: 'Nome do fornecedor é obrigatório' });
            }
            if (!email) {
                return res.status(400).json({ error: 'Email é obrigatório' });
            }

            const result = await this.db.run(`
                INSERT INTO suppliers (
                    cnpj, name, contact_name, email, phone, address, city, state, 
                    zip_code, status
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            `, [
                cnpj || '', name, contact_name || '', email, phone || '', address || '', city || '', state || '',
                zip_code || '', status || 'ativo'
            ]);

            const newSupplierId = result.lastID;
            const newSupplier = await this.db.get('SELECT * FROM suppliers WHERE id = ?', [newSupplierId]);
            
            res.status(201).json(newSupplier);
        } catch (error) {
            console.error('Error creating supplier:', error);
            if (error.message.includes('UNIQUE') || error.message.includes('duplicate')) {
                res.status(400).json({ error: 'Email ou CNPJ já existe' });
            } else {
                res.status(500).json({ error: 'Erro interno do servidor' });
            }
        }
    }

    static async update(db, id, supplierData) {
        const {
            cnpj,
            name,
            contact,
            email,
            phone,
            address,
            city,
            state,
            zip_code,
            rating,
            status
        } = supplierData;

        // Check if supplier exists
        const existingSupplier = await this.getById(db, id);
        if (!existingSupplier) {
            throw new Error('Supplier not found');
        }

        // Validate CNPJ format
        if (!this.isValidCnpj(cnpj)) {
            throw new Error('Invalid CNPJ format');
        }

        // Check if CNPJ is being changed and if new CNPJ already exists
        if (cnpj !== existingSupplier.cnpj) {
            const cnpjExists = await this.getByCnpj(db, cnpj);
            if (cnpjExists) {
                throw new Error('CNPJ already exists');
            }
        }

        // Validate email format
        if (!this.isValidEmail(email)) {
            throw new Error('Invalid email format');
        }

        const sql = `
            UPDATE suppliers SET 
                cnpj = ?, name = ?, contact = ?, email = ?, phone = ?, 
                address = ?, city = ?, state = ?, zip_code = ?, 
                rating = ?, status = ?, updated_at = CURRENT_TIMESTAMP
            WHERE id = ?
        `;

        await db.run(sql, [
            cnpj, name, contact, email, phone, address,
            city, state, zip_code, rating, status, id
        ]);

        return true;
    }

    static async delete(db, id) {
        // Check if supplier exists
        const supplier = await this.getById(db, id);
        if (!supplier) {
            throw new Error('Supplier not found');
        }

        // Check if supplier has products, quotes, or orders
        const products = await db.get('SELECT COUNT(*) as count FROM products WHERE supplier_id = ?', [id]);
        const quotes = await db.get('SELECT COUNT(*) as count FROM quotes WHERE supplier_id = ?', [id]);
        const orders = await db.get('SELECT COUNT(*) as count FROM orders WHERE supplier_id = ?', [id]);

        if (products.count > 0 || quotes.count > 0 || orders.count > 0) {
            // Instead of deleting, mark as inactive
            await db.run('UPDATE suppliers SET status = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?', ['inativo', id]);
            return true;
        }

        // Safe to delete
        await db.run('DELETE FROM suppliers WHERE id = ?', [id]);
        return true;
    }

    static async getSupplierProducts(db, supplierId) {
        const sql = `
            SELECT * FROM products 
            WHERE supplier_id = ? AND status = 'ativo'
            ORDER BY name
        `;
        return await db.all(sql, [supplierId]);
    }

    async getSupplierProducts(req, res) {
        try {
            await this.db.ensureConnection();
            const { id } = req.params;
            const { page = 1, limit = 20 } = req.query;
            const offset = (page - 1) * limit;

            // Verificar se o fornecedor existe
            const supplier = await this.db.get('SELECT id, name FROM suppliers WHERE id = ?', [id]);
            if (!supplier) {
                return res.status(404).json({ error: 'Fornecedor não encontrado' });
            }

            const products = await this.db.all(`
                SELECT p.*, c.name as category_name
                FROM products p 
                LEFT JOIN categories c ON p.category_id = c.id
                WHERE p.supplier_id = ? 
                ORDER BY p.name
                LIMIT ? OFFSET ?
            `, [id, parseInt(limit), offset]);

            const totalResult = await this.db.get(`
                SELECT COUNT(*) as total
                FROM products 
                WHERE supplier_id = ?
            `, [id]);

            const total = totalResult?.total || 0;

            res.json({
                supplier,
                products: {
                    data: products,
                    pagination: {
                        page: parseInt(page),
                        limit: parseInt(limit),
                        total,
                        pages: Math.ceil(total / limit)
                    }
                }
            });
        } catch (error) {
            console.error('Error fetching supplier products:', error);
            res.status(500).json({ error: 'Erro interno do servidor' });
        }
    }

    async updateSupplier(req, res) {
        try {
            await this.db.ensureConnection();
            const { id } = req.params;

            // Verificar se o fornecedor existe
            const existingSupplier = await this.db.get('SELECT id, email, cnpj FROM suppliers WHERE id = ?', [id]);
            if (!existingSupplier) {
                return res.status(404).json({ error: 'Fornecedor não encontrado' });
            }

            // Validar dados de entrada
            const { error, value } = this.getSupplierSchema().validate(req.body);
            if (error) {
                return res.status(400).json({ 
                    error: 'Dados inválidos', 
                    details: error.details.map(d => d.message) 
                });
            }

            const {
                name, contact_name, email, phone, mobile, address, city, state, 
                zip_code, country, cnpj, ie, website, notes, status, 
                payment_terms, credit_limit, discount_percentage
            } = value;

            // Verificar se o email já existe em outro fornecedor
            if (email !== existingSupplier.email) {
                const duplicateEmail = await this.db.get('SELECT id FROM suppliers WHERE email = ? AND id != ?', [email, id]);
                if (duplicateEmail) {
                    return res.status(400).json({ error: 'Email já está em uso' });
                }
            }

            // Verificar se o CNPJ já existe em outro fornecedor
            if (cnpj && cnpj !== existingSupplier.cnpj) {
                const duplicateCnpj = await this.db.get('SELECT id FROM suppliers WHERE cnpj = ? AND id != ?', [cnpj, id]);
                if (duplicateCnpj) {
                    return res.status(400).json({ error: 'CNPJ já está em uso' });
                }
            }

            await this.db.executeNonQuery(`
                UPDATE suppliers 
                SET name = ?, contact_name = ?, email = ?, phone = ?, mobile = ?, 
                    address = ?, city = ?, state = ?, zip_code = ?, country = ?, 
                    cnpj = ?, ie = ?, website = ?, notes = ?, status = ?, 
                    payment_terms = ?, credit_limit = ?, discount_percentage = ?, 
                    updated_at = GETDATE()
                WHERE id = ?
            `, [
                name, contact_name, email, phone, mobile, address, city, state,
                zip_code, country, cnpj, ie, website, notes, status,
                payment_terms, credit_limit, discount_percentage, id
            ]);

            const updatedSupplier = await this.db.get('SELECT * FROM suppliers WHERE id = ?', [id]);
            res.json(updatedSupplier);
        } catch (error) {
            console.error('Error updating supplier:', error);
            if (error.message.includes('UNIQUE') || error.message.includes('duplicate')) {
                res.status(400).json({ error: 'Email ou CNPJ já existe' });
            } else {
                res.status(500).json({ error: 'Erro interno do servidor' });
            }
        }
    }

    async deleteSupplier(req, res) {
        try {
            await this.db.ensureConnection();
            const { id } = req.params;

            // Verificar se o fornecedor existe
            const existingSupplier = await this.db.get('SELECT id FROM suppliers WHERE id = ?', [id]);
            if (!existingSupplier) {
                return res.status(404).json({ error: 'Fornecedor não encontrado' });
            }

            // Verificar se há dependências
            const dependencies = await this.db.execute(`
                SELECT 'products' as table_name, COUNT(*) as count FROM products WHERE supplier_id = ?
                UNION ALL
                SELECT 'quotes' as table_name, COUNT(*) as count FROM quotes WHERE supplier_id = ?
                UNION ALL
                SELECT 'orders' as table_name, COUNT(*) as count FROM orders WHERE supplier_id = ?
            `, [id, id, id]);

            const hasDependencies = dependencies.some(dep => dep.count > 0);
            if (hasDependencies) {
                return res.status(400).json({ 
                    error: 'Não é possível excluir o fornecedor pois ele possui registros associados' 
                });
            }

            await this.db.executeNonQuery('DELETE FROM suppliers WHERE id = ?', [id]);
            res.status(204).send();
        } catch (error) {
            console.error('Error deleting supplier:', error);
            res.status(500).json({ error: 'Erro interno do servidor' });
        }
    }

    async getSupplierQuotes(req, res) {
        try {
            await this.db.ensureConnection();
            const { id } = req.params;
            const { page = 1, limit = 20, status } = req.query;
            const offset = (page - 1) * limit;

            // Verificar se o fornecedor existe
            const supplier = await this.db.get('SELECT id, name FROM suppliers WHERE id = ?', [id]);
            if (!supplier) {
                return res.status(404).json({ error: 'Fornecedor não encontrado' });
            }

            let whereClause = 'WHERE q.supplier_id = ?';
            const params = [id];

            if (status) {
                whereClause += ' AND q.status = ?';
                params.push(status);
            }

            const quotes = await this.db.execute(`
                SELECT q.*, 
                       (SELECT COUNT(*) FROM quote_items WHERE quote_id = q.id) as items_count,
                       (SELECT SUM(quantity * unit_price) FROM quote_items WHERE quote_id = q.id) as total_value
                FROM quotes q 
                ${whereClause}
                ORDER BY q.created_at DESC
                OFFSET ? ROWS FETCH NEXT ? ROWS ONLY
            `, [...params, offset, parseInt(limit)]);

            const totalResult = await this.db.execute(`
                SELECT COUNT(*) as total
                FROM quotes q 
                ${whereClause}
            `, params);

            const total = totalResult[0]?.total || 0;

            res.json({
                supplier,
                quotes: {
                    data: quotes,
                    pagination: {
                        page: parseInt(page),
                        limit: parseInt(limit),
                        total,
                        pages: Math.ceil(total / limit)
                    }
                }
            });
        } catch (error) {
            console.error('Error fetching supplier quotes:', error);
            res.status(500).json({ error: 'Erro interno do servidor' });
        }
    }

    async getSupplierStatistics(req, res) {
        try {
            await this.db.ensureConnection();
            const { id } = req.params;

            // Verificar se o fornecedor existe
            const supplier = await this.db.get('SELECT id, name FROM suppliers WHERE id = ?', [id]);
            if (!supplier) {
                return res.status(404).json({ error: 'Fornecedor não encontrado' });
            }

            const stats = await this.db.execute(`
                SELECT 
                    (SELECT COUNT(*) FROM products WHERE supplier_id = ?) as total_products,
                    (SELECT COUNT(*) FROM quotes WHERE supplier_id = ?) as total_quotes,
                    (SELECT COUNT(*) FROM orders WHERE supplier_id = ?) as total_orders,
                    (SELECT COALESCE(SUM(total_amount), 0) FROM orders WHERE supplier_id = ? AND status = 'concluido') as total_purchased,
                    (SELECT COUNT(*) FROM quotes WHERE supplier_id = ? AND status = 'pendente') as pending_quotes,
                    (SELECT COUNT(*) FROM orders WHERE supplier_id = ? AND status IN ('pendente', 'processando')) as active_orders
            `, [id, id, id, id, id, id]);

            res.json({
                supplier,
                statistics: stats[0] || {}
            });
        } catch (error) {
            console.error('Error fetching supplier statistics:', error);
            res.status(500).json({ error: 'Erro interno do servidor' });
        }
    }

    static async getSupplierQuotes(db, supplierId, limit = 50) {
        const sql = `
            SELECT * FROM quotes 
            WHERE supplier_id = ? 
            ORDER BY created_at DESC 
            LIMIT ?
        `;
        return await db.all(sql, [supplierId, limit]);
    }

    static async getSupplierOrders(db, supplierId, limit = 50) {
        const sql = `
            SELECT * FROM orders 
            WHERE supplier_id = ? 
            ORDER BY created_at DESC 
            LIMIT ?
        `;
        return await db.all(sql, [supplierId, limit]);
    }

    static async updateRating(db, supplierId, rating) {
        if (rating < 0 || rating > 5) {
            throw new Error('Rating must be between 0 and 5');
        }

        const sql = 'UPDATE suppliers SET rating = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?';
        await db.run(sql, [rating, supplierId]);
        return true;
    }

    static async searchSuppliers(db, searchTerm) {
        const sql = `
            SELECT s.*, 
                   COUNT(p.id) as product_count,
                   COUNT(CASE WHEN o.status = 'pendente' THEN 1 END) as pending_orders
            FROM suppliers s 
            LEFT JOIN products p ON s.id = p.supplier_id AND p.status = 'ativo'
            LEFT JOIN orders o ON s.id = o.supplier_id AND o.status = 'pendente'
            WHERE (s.cnpj LIKE ? OR s.name LIKE ? OR s.contact LIKE ? OR s.email LIKE ?) 
            AND s.status = 'ativo'
            GROUP BY s.id
            ORDER BY s.name
        `;
        const term = `%${searchTerm}%`;
        return await db.all(sql, [term, term, term, term]);
    }

    static async getTopSuppliers(db, limit = 10) {
        const sql = `
            SELECT s.*, 
                   COUNT(o.id) as order_count,
                   SUM(o.total_value) as total_orders_value,
                   AVG(o.total_value) as avg_order_value
            FROM suppliers s 
            LEFT JOIN orders o ON s.id = o.supplier_id 
            WHERE s.status = 'ativo'
            GROUP BY s.id
            ORDER BY total_orders_value DESC, order_count DESC
            LIMIT ?
        `;
        return await db.all(sql, [limit]);
    }

    static async getSupplierStats(db) {
        const stats = {};
        
        // Total suppliers
        const totalResult = await db.get('SELECT COUNT(*) as count FROM suppliers WHERE status = "ativo"');
        stats.total = totalResult.count;

        // Suppliers with pending orders
        const pendingOrdersResult = await db.get(`
            SELECT COUNT(DISTINCT supplier_id) as count 
            FROM orders 
            WHERE status = 'pendente'
        `);
        stats.withPendingOrders = pendingOrdersResult.count;

        // Average rating
        const avgRatingResult = await db.get('SELECT AVG(rating) as avg FROM suppliers WHERE status = "ativo" AND rating > 0');
        stats.averageRating = avgRatingResult.avg || 0;

        // Suppliers by state
        const stateResult = await db.all(`
            SELECT state, COUNT(*) as count 
            FROM suppliers 
            WHERE status = 'ativo' AND state IS NOT NULL 
            GROUP BY state 
            ORDER BY count DESC
        `);
        stats.byState = stateResult;

        return stats;
    }

    static async getSupplierPerformance(db, supplierId, startDate = null, endDate = null) {
        let dateFilter = '';
        let params = [supplierId];

        if (startDate && endDate) {
            dateFilter = 'AND o.created_at BETWEEN ? AND ?';
            params.push(startDate, endDate);
        }

        const sql = `
            SELECT 
                COUNT(o.id) as total_orders,
                SUM(o.total_value) as total_value,
                AVG(o.total_value) as avg_order_value,
                COUNT(CASE WHEN o.status = 'entregue' THEN 1 END) as delivered_orders,
                COUNT(CASE WHEN o.status = 'cancelado' THEN 1 END) as cancelled_orders,
                AVG(CASE 
                    WHEN o.status = 'entregue' 
                    THEN julianday(o.updated_at) - julianday(o.order_date) 
                END) as avg_delivery_days
            FROM orders o
            WHERE o.supplier_id = ? ${dateFilter}
        `;

        return await db.get(sql, params);
    }

    // Utility methods
    static isValidCnpj(cnpj) {
        // Remove non-numeric characters
        const cleanCnpj = cnpj.replace(/[^\d]/g, '');
        
        // Check if has 14 digits
        if (cleanCnpj.length !== 14) {
            return false;
        }

        // Check if all digits are the same
        if (/^(\d)\1{13}$/.test(cleanCnpj)) {
            return false;
        }

        // Validate CNPJ algorithm
        let sum = 0;
        let weight = 2;
        
        // First verification digit
        for (let i = 11; i >= 0; i--) {
            sum += parseInt(cleanCnpj.charAt(i)) * weight;
            weight = weight === 9 ? 2 : weight + 1;
        }
        
        let digit1 = sum % 11 < 2 ? 0 : 11 - (sum % 11);
        
        if (parseInt(cleanCnpj.charAt(12)) !== digit1) {
            return false;
        }
        
        // Second verification digit
        sum = 0;
        weight = 2;
        
        for (let i = 12; i >= 0; i--) {
            sum += parseInt(cleanCnpj.charAt(i)) * weight;
            weight = weight === 9 ? 2 : weight + 1;
        }
        
        let digit2 = sum % 11 < 2 ? 0 : 11 - (sum % 11);
        
        return parseInt(cleanCnpj.charAt(13)) === digit2;
    }

    static isValidEmail(email) {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return emailRegex.test(email);
    }

    static formatCnpj(cnpj) {
        const cleanCnpj = cnpj.replace(/[^\d]/g, '');
        return cleanCnpj.replace(/^(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})$/, '$1.$2.$3/$4-$5');
    }

    static formatPhone(phone) {
        const cleanPhone = phone.replace(/[^\d]/g, '');
        if (cleanPhone.length === 11) {
            return cleanPhone.replace(/^(\d{2})(\d{5})(\d{4})$/, '($1) $2-$3');
        } else if (cleanPhone.length === 10) {
            return cleanPhone.replace(/^(\d{2})(\d{4})(\d{4})$/, '($1) $2-$3');
        }
        return phone;
    }
}

module.exports = SupplierController;