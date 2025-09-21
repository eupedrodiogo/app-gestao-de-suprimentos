class InventoryController {
    static async getAll(db) {
        const sql = `
            SELECT p.*, s.name as supplier_name,
                   CASE 
                       WHEN p.stock <= 0 THEN 'out_of_stock'
                       WHEN p.stock <= p.min_stock THEN 'low_stock'
                       WHEN p.max_stock IS NOT NULL AND p.stock >= p.max_stock THEN 'overstock'
                       ELSE 'normal'
                   END as stock_status,
                   (p.stock * p.price) as stock_value
            FROM products p 
            LEFT JOIN suppliers s ON p.supplier_id = s.id
            WHERE p.status = 'ativo'
            ORDER BY p.name
        `;
        return await db.all(sql);
    }

    static async getById(db, productId) {
        const sql = `
            SELECT p.*, s.name as supplier_name,
                   CASE 
                       WHEN p.stock <= 0 THEN 'out_of_stock'
                       WHEN p.stock <= p.min_stock THEN 'low_stock'
                       WHEN p.max_stock IS NOT NULL AND p.stock >= p.max_stock THEN 'overstock'
                       ELSE 'normal'
                   END as stock_status,
                   (p.stock * p.price) as stock_value
            FROM products p 
            LEFT JOIN suppliers s ON p.supplier_id = s.id
            WHERE p.id = ? AND p.status = 'ativo'
        `;
        return await db.get(sql, [productId]);
    }

    static async adjustStock(db, adjustmentData) {
        const {
            product_id,
            type, // 'entrada', 'saida', 'ajuste'
            quantity,
            reason,
            reference_id = null,
            reference_type = 'manual',
            user_id = null
        } = adjustmentData;

        const validTypes = ['entrada', 'saida', 'ajuste'];
        if (!validTypes.includes(type)) {
            throw new Error('Invalid adjustment type');
        }

        if (quantity <= 0) {
            throw new Error('Quantity must be positive');
        }

        // Get current product stock
        const product = await db.get('SELECT * FROM products WHERE id = ? AND status = "ativo"', [product_id]);
        if (!product) {
            throw new Error('Product not found or inactive');
        }

        const previousStock = product.stock;
        let newStock;

        switch (type) {
            case 'entrada':
                newStock = previousStock + quantity;
                break;
            case 'saida':
                newStock = previousStock - quantity;
                if (newStock < 0) {
                    throw new Error('Insufficient stock for withdrawal');
                }
                break;
            case 'ajuste':
                newStock = quantity; // For adjustments, quantity is the new stock level
                break;
        }

        try {
            await db.beginTransaction();

            // Update product stock
            await db.run(
                'UPDATE products SET stock = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
                [newStock, product_id]
            );

            // Log inventory movement
            const movementSql = `
                INSERT INTO inventory_movements (
                    product_id, type, quantity, previous_stock, new_stock, 
                    reason, reference_id, reference_type, user_id
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
            `;

            const actualQuantity = type === 'ajuste' ? Math.abs(newStock - previousStock) : quantity;
            const actualType = type === 'ajuste' ? (newStock > previousStock ? 'entrada' : 'saida') : type;

            await db.run(movementSql, [
                product_id, actualType, actualQuantity, previousStock, newStock,
                reason, reference_id, reference_type, user_id
            ]);

            await db.commit();
            return true;

        } catch (error) {
            await db.rollback();
            throw error;
        }
    }

    static async getMovements(db, productId = null, limit = 100) {
        let sql = `
            SELECT im.*, p.code as product_code, p.name as product_name
            FROM inventory_movements im
            LEFT JOIN products p ON im.product_id = p.id
        `;
        let params = [];

        if (productId) {
            sql += ' WHERE im.product_id = ?';
            params.push(productId);
        }

        sql += ' ORDER BY im.created_at DESC LIMIT ?';
        params.push(limit);

        return await db.all(sql, params);
    }

    static async getMovementsByDateRange(db, startDate, endDate, productId = null) {
        let sql = `
            SELECT im.*, p.code as product_code, p.name as product_name
            FROM inventory_movements im
            LEFT JOIN products p ON im.product_id = p.id
            WHERE im.created_at BETWEEN ? AND ?
        `;
        let params = [startDate, endDate];

        if (productId) {
            sql += ' AND im.product_id = ?';
            params.push(productId);
        }

        sql += ' ORDER BY im.created_at DESC';

        return await db.all(sql, params);
    }

    static async getLowStockProducts(db) {
        const sql = `
            SELECT p.*, s.name as supplier_name,
                   (p.min_stock - p.stock) as shortage_quantity,
                   (p.stock * p.price) as stock_value
            FROM products p 
            LEFT JOIN suppliers s ON p.supplier_id = s.id
            WHERE p.stock <= p.min_stock AND p.status = 'ativo'
            ORDER BY (p.stock - p.min_stock) ASC
        `;
        return await db.all(sql);
    }

    static async getOutOfStockProducts(db) {
        const sql = `
            SELECT p.*, s.name as supplier_name
            FROM products p 
            LEFT JOIN suppliers s ON p.supplier_id = s.id
            WHERE p.stock = 0 AND p.status = 'ativo'
            ORDER BY p.name
        `;
        return await db.all(sql);
    }

    static async getOverstockProducts(db) {
        const sql = `
            SELECT p.*, s.name as supplier_name,
                   (p.stock - p.max_stock) as excess_quantity,
                   (p.stock * p.price) as stock_value
            FROM products p 
            LEFT JOIN suppliers s ON p.supplier_id = s.id
            WHERE p.max_stock IS NOT NULL AND p.stock > p.max_stock AND p.status = 'ativo'
            ORDER BY (p.stock - p.max_stock) DESC
        `;
        return await db.all(sql);
    }

    static async getInventoryValue(db) {
        const sql = `
            SELECT 
                SUM(stock * price) as total_value,
                COUNT(*) as total_products,
                SUM(stock) as total_units
            FROM products 
            WHERE status = 'ativo'
        `;
        return await db.get(sql);
    }

    static async getInventoryValueByCategory(db) {
        const sql = `
            SELECT 
                category,
                SUM(stock * price) as total_value,
                COUNT(*) as product_count,
                SUM(stock) as total_units
            FROM products 
            WHERE status = 'ativo'
            GROUP BY category
            ORDER BY total_value DESC
        `;
        return await db.all(sql);
    }

    static async getInventoryValueBySupplier(db) {
        const sql = `
            SELECT 
                s.name as supplier_name,
                s.id as supplier_id,
                SUM(p.stock * p.price) as total_value,
                COUNT(p.id) as product_count,
                SUM(p.stock) as total_units
            FROM products p
            LEFT JOIN suppliers s ON p.supplier_id = s.id
            WHERE p.status = 'ativo'
            GROUP BY s.id, s.name
            ORDER BY total_value DESC
        `;
        return await db.all(sql);
    }

    static async getInventoryTurnover(db, startDate, endDate) {
        const sql = `
            SELECT 
                p.id,
                p.code,
                p.name,
                p.stock as current_stock,
                p.price,
                SUM(CASE WHEN im.type = 'saida' THEN im.quantity ELSE 0 END) as total_out,
                SUM(CASE WHEN im.type = 'entrada' THEN im.quantity ELSE 0 END) as total_in,
                AVG(p.stock) as avg_stock,
                CASE 
                    WHEN AVG(p.stock) > 0 
                    THEN SUM(CASE WHEN im.type = 'saida' THEN im.quantity ELSE 0 END) / AVG(p.stock)
                    ELSE 0 
                END as turnover_ratio
            FROM products p
            LEFT JOIN inventory_movements im ON p.id = im.product_id 
                AND im.created_at BETWEEN ? AND ?
            WHERE p.status = 'ativo'
            GROUP BY p.id, p.code, p.name, p.stock, p.price
            ORDER BY turnover_ratio DESC
        `;
        return await db.all(sql, [startDate, endDate]);
    }

    static async getSlowMovingProducts(db, days = 90) {
        const cutoffDate = new Date();
        cutoffDate.setDate(cutoffDate.getDate() - days);
        
        const sql = `
            SELECT p.*, s.name as supplier_name,
                   (p.stock * p.price) as stock_value,
                   MAX(im.created_at) as last_movement
            FROM products p
            LEFT JOIN suppliers s ON p.supplier_id = s.id
            LEFT JOIN inventory_movements im ON p.id = im.product_id
            WHERE p.status = 'ativo' AND p.stock > 0
            GROUP BY p.id
            HAVING last_movement IS NULL OR last_movement < ?
            ORDER BY stock_value DESC
        `;
        return await db.all(sql, [cutoffDate.toISOString()]);
    }

    static async getFastMovingProducts(db, days = 30, limit = 20) {
        const cutoffDate = new Date();
        cutoffDate.setDate(cutoffDate.getDate() - days);
        
        const sql = `
            SELECT p.*, s.name as supplier_name,
                   SUM(CASE WHEN im.type = 'saida' THEN im.quantity ELSE 0 END) as total_out,
                   COUNT(CASE WHEN im.type = 'saida' THEN 1 END) as movement_count,
                   (p.stock * p.price) as stock_value
            FROM products p
            LEFT JOIN suppliers s ON p.supplier_id = s.id
            LEFT JOIN inventory_movements im ON p.id = im.product_id 
                AND im.created_at >= ? AND im.type = 'saida'
            WHERE p.status = 'ativo'
            GROUP BY p.id
            HAVING total_out > 0
            ORDER BY total_out DESC, movement_count DESC
            LIMIT ?
        `;
        return await db.all(sql, [cutoffDate.toISOString(), limit]);
    }

    static async getInventoryStats(db) {
        const stats = {};
        
        // Total products
        const totalResult = await db.get('SELECT COUNT(*) as count FROM products WHERE status = "ativo"');
        stats.totalProducts = totalResult.count;

        // Low stock products
        const lowStockResult = await db.get('SELECT COUNT(*) as count FROM products WHERE stock <= min_stock AND status = "ativo"');
        stats.lowStockProducts = lowStockResult.count;

        // Out of stock products
        const outOfStockResult = await db.get('SELECT COUNT(*) as count FROM products WHERE stock = 0 AND status = "ativo"');
        stats.outOfStockProducts = outOfStockResult.count;

        // Overstock products
        const overstockResult = await db.get('SELECT COUNT(*) as count FROM products WHERE max_stock IS NOT NULL AND stock > max_stock AND status = "ativo"');
        stats.overstockProducts = overstockResult.count;

        // Total inventory value
        const valueResult = await db.get('SELECT SUM(stock * price) as value FROM products WHERE status = "ativo"');
        stats.totalValue = valueResult.value || 0;

        // Total units in stock
        const unitsResult = await db.get('SELECT SUM(stock) as units FROM products WHERE status = "ativo"');
        stats.totalUnits = unitsResult.units || 0;

        // Recent movements (last 7 days)
        const sevenDaysAgo = new Date();
        sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
        
        const recentMovementsResult = await db.get(
            'SELECT COUNT(*) as count FROM inventory_movements WHERE created_at >= ?',
            [sevenDaysAgo.toISOString()]
        );
        stats.recentMovements = recentMovementsResult.count;

        return stats;
    }

    static async getStockAlerts(db) {
        const alerts = [];

        // Low stock alerts
        const lowStock = await this.getLowStockProducts(db);
        for (const product of lowStock) {
            alerts.push({
                type: 'low_stock',
                severity: 'warning',
                product_id: product.id,
                product_code: product.code,
                product_name: product.name,
                current_stock: product.stock,
                min_stock: product.min_stock,
                message: `Estoque baixo: ${product.name} (${product.stock} unidades)`
            });
        }

        // Out of stock alerts
        const outOfStock = await this.getOutOfStockProducts(db);
        for (const product of outOfStock) {
            alerts.push({
                type: 'out_of_stock',
                severity: 'critical',
                product_id: product.id,
                product_code: product.code,
                product_name: product.name,
                current_stock: 0,
                min_stock: product.min_stock,
                message: `Produto em falta: ${product.name}`
            });
        }

        // Overstock alerts
        const overstock = await this.getOverstockProducts(db);
        for (const product of overstock) {
            alerts.push({
                type: 'overstock',
                severity: 'info',
                product_id: product.id,
                product_code: product.code,
                product_name: product.name,
                current_stock: product.stock,
                max_stock: product.max_stock,
                excess_quantity: product.excess_quantity,
                message: `Excesso de estoque: ${product.name} (${product.excess_quantity} unidades acima do máximo)`
            });
        }

        return alerts.sort((a, b) => {
            const severityOrder = { critical: 3, warning: 2, info: 1 };
            return severityOrder[b.severity] - severityOrder[a.severity];
        });
    }

    static async generateStockReport(db, startDate = null, endDate = null) {
        const report = {
            generated_at: new Date().toISOString(),
            period: { start: startDate, end: endDate },
            summary: {},
            details: {}
        };

        // Get inventory stats
        report.summary = await this.getInventoryStats(db);

        // Get inventory value by category
        report.details.valueByCategory = await this.getInventoryValueByCategory(db);

        // Get inventory value by supplier
        report.details.valueBySupplier = await this.getInventoryValueBySupplier(db);

        // Get stock alerts
        report.details.alerts = await this.getStockAlerts(db);

        // Get movements if date range provided
        if (startDate && endDate) {
            report.details.movements = await this.getMovementsByDateRange(db, startDate, endDate);
            report.details.turnover = await this.getInventoryTurnover(db, startDate, endDate);
        }

        return report;
    }

    static async performStockCount(db, stockCountData) {
        const { counts, user_id = null, notes = '' } = stockCountData;
        
        if (!counts || !Array.isArray(counts) || counts.length === 0) {
            throw new Error('Stock count data is required');
        }

        const adjustments = [];

        try {
            await db.beginTransaction();

            for (const count of counts) {
                const { product_id, counted_quantity } = count;
                
                // Get current stock
                const product = await db.get('SELECT * FROM products WHERE id = ? AND status = "ativo"', [product_id]);
                if (!product) {
                    throw new Error(`Product with ID ${product_id} not found`);
                }

                const difference = counted_quantity - product.stock;
                
                if (difference !== 0) {
                    // Adjust stock
                    await this.adjustStock(db, {
                        product_id,
                        type: 'ajuste',
                        quantity: counted_quantity,
                        reason: `Contagem de estoque - ${notes}`,
                        reference_type: 'stock_count',
                        user_id
                    });

                    adjustments.push({
                        product_id,
                        product_code: product.code,
                        product_name: product.name,
                        previous_stock: product.stock,
                        counted_stock: counted_quantity,
                        difference
                    });
                }
            }

            await db.commit();
            return adjustments;

        } catch (error) {
            await db.rollback();
            throw error;
        }
    }
}

module.exports = InventoryController;