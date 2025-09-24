const Database = require('../database/database');

class AIAnalyticsController {
    constructor() {
        this.db = new Database();
    }
    
    async initialize() {
        await this.db.connect();
    }
    // Análise preditiva de demanda usando regressão linear simples
    async predictDemand(req, res) {
        try {
            const { productId, days = 30 } = req.query;
            
            // Buscar dados históricos de pedidos
            const query = `
                SELECT 
                    DATE(o.created_at) as date,
                    SUM(oi.quantity) as daily_demand,
                    p.name as product_name
                FROM orders o
                JOIN order_items oi ON o.id = oi.order_id
                JOIN products p ON oi.product_id = p.id
                WHERE oi.product_id = ? AND o.created_at >= date('now', '-90 days')
                GROUP BY DATE(o.created_at), p.name
                ORDER BY date ASC
            `;
            
            const historicalData = await new Promise((resolve, reject) => {
                this.db.db.all(query, [productId], (err, rows) => {
                    if (err) reject(err);
                    else resolve(rows);
                });
            });
            
            if (historicalData.length < 7) {
                return res.json({
                    success: false,
                    message: 'Dados insuficientes para análise preditiva',
                    prediction: null
                });
            }
            
            // Implementar regressão linear simples
            const prediction = this.linearRegression(historicalData, days);
            
            // Calcular métricas de confiança
            const confidence = this.calculateConfidence(historicalData);
            
            // Gerar recomendações inteligentes
            const recommendations = await this.generateRecommendations(productId, prediction);
            
            res.json({
                success: true,
                productName: historicalData[0]?.product_name || 'Produto',
                prediction: {
                    estimatedDemand: Math.round(prediction.futureValue),
                    trend: prediction.trend,
                    confidence: confidence,
                    timeframe: `${days} dias`,
                    algorithm: 'Linear Regression'
                },
                recommendations,
                historicalData: historicalData.slice(-30) // Últimos 30 dias
            });
            
        } catch (error) {
            console.error('Erro na análise preditiva:', error);
            res.status(500).json({
                success: false,
                message: 'Erro interno do servidor',
                error: error.message
            });
        }
    }
    
    // Implementação de regressão linear simples
    linearRegression(data, futureDays) {
        const n = data.length;
        let sumX = 0, sumY = 0, sumXY = 0, sumXX = 0;
        
        data.forEach((point, index) => {
            const x = index;
            const y = point.daily_demand;
            sumX += x;
            sumY += y;
            sumXY += x * y;
            sumXX += x * x;
        });
        
        const slope = (n * sumXY - sumX * sumY) / (n * sumXX - sumX * sumX);
        const intercept = (sumY - slope * sumX) / n;
        
        const futureValue = slope * (n + futureDays - 1) + intercept;
        
        return {
            slope,
            intercept,
            futureValue: Math.max(0, futureValue),
            trend: slope > 0 ? 'crescente' : slope < 0 ? 'decrescente' : 'estável'
        };
    }
    
    // Calcular nível de confiança da predição
    calculateConfidence(data) {
        if (data.length < 5) return 'baixa';
        
        const values = data.map(d => d.daily_demand);
        const mean = values.reduce((a, b) => a + b, 0) / values.length;
        const variance = values.reduce((a, b) => a + Math.pow(b - mean, 2), 0) / values.length;
        const stdDev = Math.sqrt(variance);
        const coefficientOfVariation = stdDev / mean;
        
        if (coefficientOfVariation < 0.3) return 'alta';
        if (coefficientOfVariation < 0.6) return 'média';
        return 'baixa';
    }
    
    // Gerar recomendações inteligentes
    async generateRecommendations(productId, prediction) {
        try {
            // Buscar informações do produto
            const productQuery = `
                SELECT p.*, 
                       COALESCE(SUM(oi.quantity), 0) as total_sold_last_30_days
                FROM products p
                LEFT JOIN order_items oi ON p.id = oi.product_id
                LEFT JOIN orders o ON oi.order_id = o.id AND o.created_at >= date('now', '-30 days')
                WHERE p.id = ?
                GROUP BY p.id
            `;
            
            const product = await new Promise((resolve, reject) => {
                this.db.db.get(productQuery, [productId], (err, row) => {
                    if (err) reject(err);
                    else resolve(row);
                });
            });
            
            const recommendations = [];
            
            if (product) {
                const currentStock = product.stock;
                const estimatedDemand = prediction.futureValue;
                const safetyStock = Math.ceil(estimatedDemand * 0.2); // 20% de estoque de segurança
                
                if (currentStock < estimatedDemand + safetyStock) {
                    recommendations.push({
                        type: 'restock',
                        priority: 'alta',
                        message: `Reabastecer estoque. Demanda prevista: ${Math.round(estimatedDemand)} unidades`,
                        suggestedQuantity: Math.ceil(estimatedDemand + safetyStock - currentStock),
                        icon: '📦'
                    });
                }
                
                if (prediction.trend === 'crescente') {
                    recommendations.push({
                        type: 'opportunity',
                        priority: 'média',
                        message: 'Tendência de crescimento detectada. Considere aumentar estoque estratégico',
                        icon: '📈'
                    });
                }
                
                if (currentStock > estimatedDemand * 3) {
                    recommendations.push({
                        type: 'optimization',
                        priority: 'baixa',
                        message: 'Estoque excessivo detectado. Considere promoções ou redistribuição',
                        icon: '⚠️'
                    });
                }
            }
            
            return recommendations;
            
        } catch (error) {
            console.error('Erro ao gerar recomendações:', error);
            return [];
        }
    }
    
    // Análise de padrões sazonais
    async seasonalAnalysis(req, res) {
        try {
            const query = `
                SELECT 
                    strftime('%m', o.created_at) as month,
                    strftime('%w', o.created_at) as day_of_week,
                    strftime('%H', o.created_at) as hour,
                    COUNT(*) as order_count,
                    SUM(o.total_amount) as total_revenue,
                    AVG(o.total_amount) as avg_order_value
                FROM orders o
                WHERE o.created_at >= date('now', '-365 days')
                GROUP BY month, day_of_week, hour
                ORDER BY month, day_of_week, hour
            `;
            
            const seasonalData = await new Promise((resolve, reject) => {
                this.db.db.all(query, [], (err, rows) => {
                    if (err) reject(err);
                    else resolve(rows);
                });
            });
            
            // Processar dados para identificar padrões
            const patterns = this.identifyPatterns(seasonalData);
            
            res.json({
                success: true,
                patterns,
                rawData: seasonalData,
                insights: this.generateSeasonalInsights(patterns)
            });
            
        } catch (error) {
            console.error('Erro na análise sazonal:', error);
            res.status(500).json({
                success: false,
                message: 'Erro interno do servidor'
            });
        }
    }
    
    // Identificar padrões nos dados
    identifyPatterns(data) {
        const monthlyPattern = {};
        const weeklyPattern = {};
        const hourlyPattern = {};
        
        data.forEach(row => {
            // Padrão mensal
            if (!monthlyPattern[row.month]) {
                monthlyPattern[row.month] = { orders: 0, revenue: 0 };
            }
            monthlyPattern[row.month].orders += parseInt(row.order_count);
            monthlyPattern[row.month].revenue += parseFloat(row.total_revenue);
            
            // Padrão semanal
            if (!weeklyPattern[row.day_of_week]) {
                weeklyPattern[row.day_of_week] = { orders: 0, revenue: 0 };
            }
            weeklyPattern[row.day_of_week].orders += parseInt(row.order_count);
            weeklyPattern[row.day_of_week].revenue += parseFloat(row.total_revenue);
            
            // Padrão horário
            if (!hourlyPattern[row.hour]) {
                hourlyPattern[row.hour] = { orders: 0, revenue: 0 };
            }
            hourlyPattern[row.hour].orders += parseInt(row.order_count);
            hourlyPattern[row.hour].revenue += parseFloat(row.total_revenue);
        });
        
        return {
            monthly: monthlyPattern,
            weekly: weeklyPattern,
            hourly: hourlyPattern
        };
    }
    
    // Gerar insights sazonais
    generateSeasonalInsights(patterns) {
        const insights = [];
        
        // Análise mensal
        const monthNames = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 
                           'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];
        const monthlyOrders = Object.entries(patterns.monthly)
            .map(([month, data]) => ({ month: monthNames[parseInt(month) - 1], orders: data.orders }))
            .sort((a, b) => b.orders - a.orders);
        
        if (monthlyOrders.length > 0) {
            insights.push({
                type: 'seasonal',
                title: 'Pico Sazonal',
                description: `${monthlyOrders[0].month} é o mês com maior demanda (${monthlyOrders[0].orders} pedidos)`,
                icon: '📅'
            });
        }
        
        // Análise semanal
        const dayNames = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];
        const weeklyOrders = Object.entries(patterns.weekly)
            .map(([day, data]) => ({ day: dayNames[parseInt(day)], orders: data.orders }))
            .sort((a, b) => b.orders - a.orders);
        
        if (weeklyOrders.length > 0) {
            insights.push({
                type: 'weekly',
                title: 'Dia da Semana',
                description: `${weeklyOrders[0].day} é o dia com maior movimento (${weeklyOrders[0].orders} pedidos)`,
                icon: '📊'
            });
        }
        
        return insights;
    }
    
    // Otimização inteligente de estoque
    async smartStockOptimization(req, res) {
        try {
            const query = `
                SELECT 
                    p.id,
                    p.name,
                    p.stock,
                    p.min_stock,
                    p.price,
                    COALESCE(SUM(oi.quantity), 0) as total_sold,
                    COALESCE(AVG(oi.quantity), 0) as avg_order_quantity,
                    COUNT(DISTINCT o.id) as order_frequency
                FROM products p
                LEFT JOIN order_items oi ON p.id = oi.product_id
                LEFT JOIN orders o ON oi.order_id = o.id AND o.created_at >= date('now', '-60 days')
                GROUP BY p.id, p.name, p.stock, p.min_stock, p.price
                ORDER BY total_sold DESC
            `;
            
            const products = await new Promise((resolve, reject) => {
                this.db.db.all(query, [], (err, rows) => {
                    if (err) reject(err);
                    else resolve(rows);
                });
            });
            
            const optimizations = products.map(product => {
                const velocity = product.total_sold / 60; // Vendas por dia
                const turnoverRate = product.stock > 0 ? velocity / product.stock : 0;
                const daysOfStock = velocity > 0 ? product.stock / velocity : Infinity;
                
                let status = 'optimal';
                let recommendation = 'Estoque em nível adequado';
                let priority = 'baixa';
                
                if (daysOfStock < 7) {
                    status = 'critical';
                    recommendation = 'Reabastecer urgentemente';
                    priority = 'alta';
                } else if (daysOfStock < 14) {
                    status = 'low';
                    recommendation = 'Planejar reabastecimento';
                    priority = 'média';
                } else if (daysOfStock > 90) {
                    status = 'excess';
                    recommendation = 'Considerar redução de estoque';
                    priority = 'baixa';
                }
                
                return {
                    ...product,
                    analytics: {
                        velocity: Math.round(velocity * 100) / 100,
                        turnoverRate: Math.round(turnoverRate * 100) / 100,
                        daysOfStock: Math.round(daysOfStock),
                        status,
                        recommendation,
                        priority
                    }
                };
            });
            
            res.json({
                success: true,
                optimizations,
                summary: {
                    total: optimizations.length,
                    critical: optimizations.filter(p => p.analytics.status === 'critical').length,
                    low: optimizations.filter(p => p.analytics.status === 'low').length,
                    excess: optimizations.filter(p => p.analytics.status === 'excess').length,
                    optimal: optimizations.filter(p => p.analytics.status === 'optimal').length
                }
            });
            
        } catch (error) {
            console.error('Erro na otimização de estoque:', error);
            res.status(500).json({
                success: false,
                message: 'Erro interno do servidor'
            });
        }
    }
}

module.exports = AIAnalyticsController;