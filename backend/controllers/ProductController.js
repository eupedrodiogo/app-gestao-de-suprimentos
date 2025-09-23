const Database = require('../database/database');
const Joi = require('joi');
const log = require('../utils/logger');

class ProductController {
    constructor() {
        this.db = new Database();
    }

    // Schema de validação para produtos
    getProductSchema() {
        return Joi.object({
            code: Joi.string().max(50).required(),
            name: Joi.string().max(200).required(),
            description: Joi.string().allow('', null),
            category_id: Joi.number().integer().positive().allow(null),
            supplier_id: Joi.number().integer().positive().allow(null),
            price: Joi.number().min(0).required(),
            cost: Joi.number().min(0).allow(null),
            stock: Joi.number().integer().min(0).required(),
            min_stock: Joi.number().integer().min(0).default(0),
            max_stock: Joi.number().integer().min(0).allow(null),
            unit: Joi.string().max(20).default('UN'),
            barcode: Joi.string().max(50).allow('', null),
            location: Joi.string().max(100).allow('', null),
            status: Joi.string().valid('ativo', 'inativo', 'descontinuado').default('ativo')
        });
    }

    static async getAll(db) {
        const sql = `
            SELECT * FROM products 
            ORDER BY name
        `;
        return await db.all(sql);
    }

    async getAllProducts(req, res) {
        try {
            await this.db.ensureConnection();
            
            const { page = 1, limit = 50, search, category_id, supplier_id, status } = req.query;
            const offset = (page - 1) * limit;
            
            let whereClause = 'WHERE 1=1';
            const params = [];
            
            if (search) {
                whereClause += ' AND (name LIKE ? OR description LIKE ?)';
                const searchTerm = `%${search}%`;
                params.push(searchTerm, searchTerm);
            }
            
            if (status) {
                whereClause += ' AND status = ?';
                params.push(status);
            }

            const products = await this.db.all(`
                SELECT * FROM products
                ${whereClause}
                ORDER BY name
                LIMIT ? OFFSET ?
            `, [...params, parseInt(limit), offset]);

            // Contar total de registros
            const totalResult = await this.db.get(`
                SELECT COUNT(*) as total
                FROM products
                ${whereClause}
            `, params);

            const total = totalResult?.total || 0;

            res.json({
                data: products,
                pagination: {
                    page: parseInt(page),
                    limit: parseInt(limit),
                    total,
                    pages: Math.ceil(total / limit)
                }
            });
        } catch (error) {
            log.error('Erro ao buscar produtos', { 
                error: error.message, 
                stack: error.stack,
                ip: req.ip,
                userAgent: req.get('User-Agent')
            });
            res.status(500).json({ error: 'Erro interno do servidor' });
        }
    }

    static async getById(db, id) {
        const sql = `
            SELECT * FROM products 
            WHERE id = ?
        `;
        return await db.get(sql, [id]);
    }

    async getProductById(req, res) {
        try {
            await this.db.ensureConnection();
            const { id } = req.params;
            
            const product = await this.db.get(`
                SELECT p.*, 
                       s.name as supplier_name,
                       c.name as category_name
                FROM products p 
                LEFT JOIN suppliers s ON p.supplier_id = s.id 
                LEFT JOIN categories c ON p.category_id = c.id
                WHERE p.id = ?
            `, [id]);

            if (!product) {
                return res.status(404).json({ error: 'Produto não encontrado' });
            }

            res.json(product);
        } catch (error) {
            log.error('Erro ao buscar produto por ID', { 
                error: error.message, 
                stack: error.stack,
                productId: req.params.id,
                ip: req.ip,
                userAgent: req.get('User-Agent')
            });
            res.status(500).json({ error: 'Erro interno do servidor' });
        }
    }

    static async getByCode(db, code) {
        const sql = `
            SELECT p.*, s.name as supplier_name 
            FROM products p 
            LEFT JOIN suppliers s ON p.supplier_id = s.id 
            WHERE p.code = ?
        `;
        return await db.get(sql, [code]);
    }

    async createProduct(req, res) {
        try {
            await this.db.ensureConnection();
            
            const {
                code, name, description, category, unit, 
                price, stock, min_stock, status
            } = req.body;

            // Validação básica
            if (!name) {
                return res.status(400).json({ error: 'Nome do produto é obrigatório' });
            }

            if (!code) {
                return res.status(400).json({ error: 'Código do produto é obrigatório' });
            }

            // Verificar se o código já existe
            const existingProduct = await this.db.get('SELECT id FROM products WHERE code = ?', [code]);
            if (existingProduct) {
                return res.status(400).json({ error: 'Código do produto já existe' });
            }

            const result = await this.db.run(`
                INSERT INTO products (
                    code, name, description, category, unit, 
                    price, stock, min_stock, status
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
            `, [
                code,
                name, 
                description || '', 
                category || '', 
                unit || 'UN',
                price || 0,
                stock || 0, 
                min_stock || 0,
                status || 'ativo'
            ]);

            const newProductId = result.lastID;

            const newProduct = await this.db.get(`
                SELECT * FROM products WHERE id = ?
            `, [newProductId]);

            res.status(201).json({
                success: true,
                data: newProduct
            });
        } catch (error) {
            log.error('Erro ao criar produto', { 
                error: error.message, 
                stack: error.stack,
                productData: req.body,
                ip: req.ip,
                userAgent: req.get('User-Agent')
            });
            res.status(500).json({ 
                success: false,
                error: 'Erro interno do servidor' 
            });
        }
    }

    static async create(db, productData) {
        const {
            code,
            name,
            description,
            category,
            unit = 'UN',
            price,
            stock = 0,
            min_stock = 0,
            max_stock,
            supplier_id,
            status = 'ativo'
        } = productData;

        // Check if product code already exists
        const existingProduct = await this.getByCode(db, code);
        if (existingProduct) {
            throw new Error('Product code already exists');
        }

        const sql = `
            INSERT INTO products (
                code, name, description, category, unit, price, 
                stock, min_stock, max_stock, supplier_id, status
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `;

        const result = await db.run(sql, [
            code, name, description, category, unit, price,
            stock, min_stock, max_stock, supplier_id, status
        ]);

        // Log initial stock if greater than 0
        if (stock > 0) {
            await this.logInventoryMovement(db, result.id, 'entrada', stock, 0, stock, 'Estoque inicial', null, 'initial');
        }

        return result.id;
    }

    async updateProduct(req, res) {
        try {
            await this.db.ensureConnection();
            const { id } = req.params;

            // Verificar se o produto existe
            const existingProduct = await this.db.get('SELECT id, code FROM products WHERE id = ?', [id]);
            if (!existingProduct) {
                return res.status(404).json({ error: 'Produto não encontrado' });
            }

            // Validar dados de entrada
            const { error, value } = this.getProductSchema().validate(req.body);
            if (error) {
                return res.status(400).json({ 
                    error: 'Dados inválidos', 
                    details: error.details.map(d => d.message) 
                });
            }

            const {
                code, name, description, category_id, supplier_id, 
                price, cost, stock, min_stock, max_stock, unit, 
                barcode, location, status
            } = value;

            // Verificar se o código já existe em outro produto
            if (code !== existingProduct.code) {
                const duplicateProduct = await this.db.get('SELECT id FROM products WHERE code = ? AND id != ?', [code, id]);
                if (duplicateProduct) {
                    return res.status(400).json({ error: 'Código do produto já existe' });
                }
            }

            await this.db.run(`
                UPDATE products 
                SET code = ?, name = ?, description = ?, category_id = ?, supplier_id = ?,
                    price = ?, cost = ?, stock = ?, min_stock = ?, max_stock = ?, unit = ?,
                    barcode = ?, location = ?, status = ?, updated_at = CURRENT_TIMESTAMP
                WHERE id = ?
            `, [
                code, name, description, category_id, supplier_id,
                price, cost, stock, min_stock, max_stock, unit,
                barcode, location, status, id
            ]);

            const updatedProduct = await this.db.get(`
                SELECT p.*, 
                       s.name as supplier_name,
                       c.name as category_name
                FROM products p 
                LEFT JOIN suppliers s ON p.supplier_id = s.id 
                LEFT JOIN categories c ON p.category_id = c.id
                WHERE p.id = ?
            `, [id]);

            res.json(updatedProduct);
        } catch (error) {
            log.error('Erro ao atualizar produto', { 
                error: error.message, 
                stack: error.stack,
                productId: req.params.id,
                updateData: req.body,
                ip: req.ip,
                userAgent: req.get('User-Agent')
            });
            if (error.message.includes('UNIQUE') || error.message.includes('duplicate')) {
                res.status(400).json({ error: 'Código do produto já existe' });
            } else {
                res.status(500).json({ error: 'Erro interno do servidor' });
            }
        }
    }

    static async update(db, id, productData) {
        const {
            code,
            name,
            description,
            category,
            unit,
            price,
            stock,
            min_stock,
            max_stock,
            supplier_id,
            status
        } = productData;

        // Check if product exists
        const existingProduct = await this.getById(db, id);
        if (!existingProduct) {
            throw new Error('Product not found');
        }

        // Check if code is being changed and if new code already exists
        if (code !== existingProduct.code) {
            const codeExists = await this.getByCode(db, code);
            if (codeExists) {
                throw new Error('Product code already exists');
            }
        }

        const sql = `
            UPDATE products SET 
                code = ?, name = ?, description = ?, category = ?, unit = ?, 
                price = ?, stock = ?, min_stock = ?, max_stock = ?, 
                supplier_id = ?, status = ?, updated_at = CURRENT_TIMESTAMP
            WHERE id = ?
        `;

        await db.run(sql, [
            code, name, description, category, unit, price,
            stock, min_stock, max_stock, supplier_id, status, id
        ]);

        // Log stock adjustment if stock changed
        if (stock !== existingProduct.stock) {
            const difference = stock - existingProduct.stock;
            const type = difference > 0 ? 'entrada' : 'saida';
            const quantity = Math.abs(difference);
            
            await this.logInventoryMovement(
                db, id, type, quantity, existingProduct.stock, stock, 
                'Ajuste manual via edição de produto', null, 'manual'
            );
        }

        return true;
    }

    async deleteProduct(req, res) {
        try {
            await this.db.ensureConnection();
            const { id } = req.params;

            // Verificar se o produto existe
            const existingProduct = await this.db.get('SELECT id FROM products WHERE id = ?', [id]);
            if (!existingProduct) {
                return res.status(404).json({ error: 'Produto não encontrado' });
            }

            // Verificar se há dependências (cotações, pedidos, etc.)
            const dependencies = await this.db.all(`
                SELECT 'quote_items' as table_name, COUNT(*) as count FROM quote_items WHERE product_id = ?
                UNION ALL
                SELECT 'order_items' as table_name, COUNT(*) as count FROM order_items WHERE product_id = ?
                UNION ALL
                SELECT 'inventory_movements' as table_name, COUNT(*) as count FROM inventory_movements WHERE product_id = ?
            `, [id, id, id]);

            const hasDependencies = dependencies.some(dep => dep.count > 0);
            if (hasDependencies) {
                return res.status(400).json({ 
                    error: 'Não é possível excluir o produto pois ele possui movimentações associadas' 
                });
            }

            await this.db.run('DELETE FROM products WHERE id = ?', [id]);
            res.status(204).send();
        } catch (error) {
            log.error('Erro ao excluir produto', { 
                error: error.message, 
                stack: error.stack,
                productId: req.params.id,
                ip: req.ip,
                userAgent: req.get('User-Agent')
            });
            res.status(500).json({ error: 'Erro interno do servidor' });
        }
    }

    static async delete(db, id) {
        // Check if product exists
        const product = await this.getById(db, id);
        if (!product) {
            throw new Error('Product not found');
        }

        // Check if product is used in quotes or orders
        const quoteItems = await db.get('SELECT COUNT(*) as count FROM quote_items WHERE product_id = ?', [id]);
        const orderItems = await db.get('SELECT COUNT(*) as count FROM order_items WHERE product_id = ?', [id]);

        if (quoteItems.count > 0 || orderItems.count > 0) {
            // Instead of deleting, mark as inactive
            await db.run('UPDATE products SET status = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?', ['inativo', id]);
            return true;
        }

        // Safe to delete
        await db.run('DELETE FROM products WHERE id = ?', [id]);
        return true;
    }

    async getLowStockProducts(req, res) {
        try {
            await this.db.ensureConnection();
            
            const products = await this.db.execute(`
                SELECT p.*, 
                       s.name as supplier_name,
                       c.name as category_name,
                       (p.min_stock - p.stock) as deficit
                FROM products p 
                LEFT JOIN suppliers s ON p.supplier_id = s.id 
                LEFT JOIN categories c ON p.category_id = c.id
                WHERE p.stock <= p.min_stock AND p.status = 'ativo'
                ORDER BY deficit DESC, p.stock ASC
            `);
            
            res.json(products);
        } catch (error) {
            log.error('Erro ao buscar produtos com estoque baixo', { 
                error: error.message, 
                stack: error.stack,
                ip: req.ip,
                userAgent: req.get('User-Agent')
            });
            res.status(500).json({ error: 'Erro interno do servidor' });
        }
    }

    static async getLowStockProducts(db) {
        const sql = `
            SELECT p.*, s.name as supplier_name 
            FROM products p 
            LEFT JOIN suppliers s ON p.supplier_id = s.id 
            WHERE p.stock <= p.min_stock AND p.status = 'ativo'
            ORDER BY (p.stock - p.min_stock) ASC
        `;
        return await db.all(sql);
    }

    static async getProductsByCategory(db, category) {
        const sql = `
            SELECT p.*, s.name as supplier_name 
            FROM products p 
            LEFT JOIN suppliers s ON p.supplier_id = s.id 
            WHERE p.category = ? AND p.status = 'ativo'
            ORDER BY p.name
        `;
        return await db.all(sql, [category]);
    }

    static async getProductsBySupplier(db, supplierId) {
        const sql = `
            SELECT p.*, s.name as supplier_name 
            FROM products p 
            LEFT JOIN suppliers s ON p.supplier_id = s.id 
            WHERE p.supplier_id = ? AND p.status = 'ativo'
            ORDER BY p.name
        `;
        return await db.all(sql, [supplierId]);
    }

    async updateStock(req, res) {
        const transaction = await this.db.beginTransaction();
        
        try {
            const { id } = req.params;
            const { quantity, type, reason, unit_cost, reference_id, reference_type } = req.body;

            // Validação
            const schema = Joi.object({
                quantity: Joi.number().integer().required(),
                type: Joi.string().valid('entrada', 'saida', 'ajuste', 'transferencia').required(),
                reason: Joi.string().max(200).required(),
                unit_cost: Joi.number().min(0).allow(null),
                reference_id: Joi.number().integer().allow(null),
                reference_type: Joi.string().max(50).allow(null)
            });

            const { error, value } = schema.validate(req.body);
            if (error) {
                await this.db.rollbackTransaction(transaction);
                return res.status(400).json({ 
                    error: 'Dados inválidos', 
                    details: error.details.map(d => d.message) 
                });
            }

            // Obter produto atual
            const product = await this.db.get('SELECT * FROM products WHERE id = ?', [id]);
            if (!product) {
                await this.db.rollbackTransaction(transaction);
                return res.status(404).json({ error: 'Produto não encontrado' });
            }

            const previousStock = product.stock;
            let newStock;
            let movementQuantity = Math.abs(value.quantity);

            switch (value.type) {
                case 'entrada':
                    newStock = previousStock + movementQuantity;
                    break;
                case 'saida':
                    newStock = previousStock - movementQuantity;
                    if (newStock < 0) {
                        await this.db.rollbackTransaction(transaction);
                        return res.status(400).json({ error: 'Estoque insuficiente' });
                    }
                    movementQuantity = -movementQuantity; // Negativo para saída
                    break;
                case 'ajuste':
                    newStock = movementQuantity;
                    movementQuantity = newStock - previousStock;
                    break;
                case 'transferencia':
                    newStock = previousStock - movementQuantity;
                    if (newStock < 0) {
                        await this.db.rollbackTransaction(transaction);
                        return res.status(400).json({ error: 'Estoque insuficiente para transferência' });
                    }
                    movementQuantity = -movementQuantity; // Negativo para transferência
                    break;
            }

            // Atualizar estoque do produto
            await db.run(`
                UPDATE products 
                SET stock = ?, updated_at = datetime('now') 
                WHERE id = ?
            `, [newStock, id]);

            // Registrar movimentação de estoque
            const totalCost = value.unit_cost ? value.unit_cost * Math.abs(movementQuantity) : null;
            
            await db.run(`
                INSERT INTO inventory_movements (
                    product_id, type, quantity, previous_stock, new_stock, 
                    unit_cost, total_cost, reason, reference_id, reference_type, user_id
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            `, [
                id, value.type, movementQuantity, previousStock, newStock,
                value.unit_cost || null, totalCost, value.reason,
                value.reference_id || null, value.reference_type || null, 
                req.user?.id || 'system'
            ]);

            await this.db.commitTransaction(transaction);

            const updatedProduct = await this.db.get(`
                SELECT p.*, 
                       s.name as supplier_name,
                       c.name as category_name
                FROM products p 
                LEFT JOIN suppliers s ON p.supplier_id = s.id 
                LEFT JOIN categories c ON p.category_id = c.id
                WHERE p.id = ?
            `, [id]);

            res.json(updatedProduct);
        } catch (error) {
            await this.db.rollbackTransaction(transaction);
            log.error('Erro ao atualizar estoque', { 
                error: error.message, 
                stack: error.stack,
                productId: req.params.id,
                stockData: req.body,
                ip: req.ip,
                userAgent: req.get('User-Agent')
            });
            res.status(500).json({ error: 'Erro interno do servidor' });
        }
    }

    async getStockHistory(req, res) {
        try {
            await this.db.ensureConnection();
            const { id } = req.params;
            const { page = 1, limit = 20 } = req.query;
            const offset = (page - 1) * limit;

            const movements = await this.db.execute(`
                SELECT im.*, p.name as product_name, p.code as product_code
                FROM inventory_movements im
                JOIN products p ON im.product_id = p.id
                WHERE im.product_id = ?
                ORDER BY im.created_at DESC
                OFFSET ? ROWS FETCH NEXT ? ROWS ONLY
            `, [id, offset, parseInt(limit)]);

            const totalResult = await this.db.execute(`
                SELECT COUNT(*) as total
                FROM inventory_movements
                WHERE product_id = ?
            `, [id]);

            const total = totalResult[0]?.total || 0;

            res.json({
                data: movements,
                pagination: {
                    page: parseInt(page),
                    limit: parseInt(limit),
                    total,
                    pages: Math.ceil(total / limit)
                }
            });
        } catch (error) {
            log.error('Erro ao buscar histórico de estoque', { 
                error: error.message, 
                stack: error.stack,
                productId: req.params.id,
                ip: req.ip,
                userAgent: req.get('User-Agent')
            });
            res.status(500).json({ error: 'Erro interno do servidor' });
        }
    }

    static async updateStock(db, productId, newStock, reason, referenceId = null, referenceType = 'manual') {
        const product = await this.getById(db, productId);
        if (!product) {
            throw new Error('Product not found');
        }

        const previousStock = product.stock;
        const difference = newStock - previousStock;
        
        if (difference === 0) {
            return true; // No change needed
        }

        // Update product stock
        await db.run('UPDATE products SET stock = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?', [newStock, productId]);

        // Log inventory movement
        const type = difference > 0 ? 'entrada' : 'saida';
        const quantity = Math.abs(difference);
        
        await this.logInventoryMovement(
            db, productId, type, quantity, previousStock, newStock, 
            reason, referenceId, referenceType
        );

        return true;
    }

    static async logInventoryMovement(db, productId, type, quantity, previousStock, newStock, reason, referenceId = null, referenceType = 'manual', userId = null) {
        const sql = `
            INSERT INTO inventory_movements (
                product_id, type, quantity, previous_stock, new_stock, 
                reason, reference_id, reference_type, user_id
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
        `;

        await db.run(sql, [
            productId, type, quantity, previousStock, newStock,
            reason, referenceId, referenceType, userId
        ]);
    }

    static async getInventoryMovements(db, productId, limit = 50) {
        const sql = `
            SELECT * FROM inventory_movements 
            WHERE product_id = ? 
            ORDER BY created_at DESC 
            LIMIT ?
        `;
        return await db.all(sql, [productId, limit]);
    }

    static async searchProducts(db, searchTerm) {
        const sql = `
            SELECT p.*, s.name as supplier_name 
            FROM products p 
            LEFT JOIN suppliers s ON p.supplier_id = s.id 
            WHERE (p.code LIKE ? OR p.name LIKE ? OR p.description LIKE ?) 
            AND p.status = 'ativo'
            ORDER BY p.name
        `;
        const term = `%${searchTerm}%`;
        return await db.all(sql, [term, term, term]);
    }

    static async getCategories(db) {
        const sql = 'SELECT DISTINCT category FROM products WHERE status = "ativo" ORDER BY category';
        const result = await db.all(sql);
        return result.map(row => row.category);
    }

    static async getProductStats(db) {
        const stats = {};
        
        // Total products
        const totalResult = await db.get('SELECT COUNT(*) as count FROM products WHERE status = "ativo"');
        stats.total = totalResult.count;

        // Low stock products
        const lowStockResult = await db.get('SELECT COUNT(*) as count FROM products WHERE stock <= min_stock AND status = "ativo"');
        stats.lowStock = lowStockResult.count;

        // Out of stock products
        const outOfStockResult = await db.get('SELECT COUNT(*) as count FROM products WHERE stock = 0 AND status = "ativo"');
        stats.outOfStock = outOfStockResult.count;

        // Total inventory value
        const valueResult = await db.get('SELECT SUM(stock * price) as value FROM products WHERE status = "ativo"');
        stats.totalValue = valueResult.value || 0;

        return stats;
    }
}

module.exports = ProductController;