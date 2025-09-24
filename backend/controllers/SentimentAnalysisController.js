class SentimentAnalysisController {
    constructor(database) {
        this.db = database;
        this.sentimentModels = this.initializeSentimentModels();
        this.realTimeAnalysis = new Map();
        this.sentimentHistory = new Map();
        this.alertThresholds = {
            negative: -0.6,
            positive: 0.6,
            volatility: 0.4
        };
        this.analysisQueue = [];
        this.isProcessing = false;
    }

    // Inicializar modelos de análise de sentimento
    initializeSentimentModels() {
        return {
            // Modelo baseado em palavras-chave em português
            keywords: {
                positive: [
                    'excelente', 'otimo', 'bom', 'satisfeito', 'recomendo', 'qualidade',
                    'rapido', 'eficiente', 'confiavel', 'profissional', 'pontual',
                    'atencioso', 'prestativo', 'competente', 'responsavel', 'dedicado',
                    'inovador', 'criativo', 'flexivel', 'transparente', 'honesto',
                    'cumprimento', 'prazo', 'entrega', 'sucesso', 'parceria',
                    'colaboracao', 'suporte', 'ajuda', 'solucao', 'melhoria'
                ],
                negative: [
                'ruim', 'pessimo', 'pessima', 'terrivel', 'insatisfeito', 'insatisfeita', 'problema', 'defeito',
                'atraso', 'lento', 'lenta', 'ineficiente', 'nao confiavel', 'amador', 'amadora', 'desorganizado', 'desorganizada',
                'irresponsavel', 'negligente', 'incompetente', 'desonesto', 'desonesta', 'caro', 'cara', 'superfaturado', 'superfaturada',
                'fraude', 'enganacao', 'descumprimento', 'falha', 'erro', 'reclamacao',
                'insatisfacao', 'cancelamento', 'rescisao', 'multa', 'prejuizo', 'perda', 'horrivel', 'horroroso', 'horrorosa'
            ],
                neutral: [
                    'normal', 'padrao', 'comum', 'regular', 'medio', 'aceitavel',
                    'dentro', 'esperado', 'conforme', 'acordo', 'contrato',
                    'especificacao', 'requisito', 'procedimento', 'processo'
                ]
            },
            
            // Pesos para diferentes tipos de feedback
            weights: {
                review: 1.0,
                complaint: 1.5,
                compliment: 1.2,
                contract_feedback: 0.8,
                delivery_feedback: 1.3,
                quality_feedback: 1.4,
                price_feedback: 0.9,
                service_feedback: 1.1
            },
            
            // Modificadores contextuais
            modifiers: {
                intensifiers: {
                    'muito': 1.5,
                    'extremamente': 2.0,
                    'super': 1.8,
                    'bastante': 1.3,
                    'bem': 1.2,
                    'totalmente': 1.7,
                    'completamente': 1.8
                },
                diminishers: {
                    'pouco': 0.7,
                    'meio': 0.8,
                    'um pouco': 0.6,
                    'levemente': 0.5,
                    'ligeiramente': 0.5,
                    'relativamente': 0.8
                },
                negators: {
                    'não': -1.0,
                    'nunca': -1.2,
                    'jamais': -1.3,
                    'nada': -1.1,
                    'nenhum': -1.0,
                    'sem': -0.8
                }
            }
        };
    }

    // Analisar sentimento de texto
    async analyzeSentiment(text, context = {}) {
        try {
            if (!text || typeof text !== 'string') {
                return {
                    score: 0,
                    sentiment: 'neutral',
                    confidence: 0,
                    details: { error: 'Texto inválido' }
                };
            }

            const normalizedText = this.normalizeText(text);
            const tokens = this.tokenizeText(normalizedText);
            
            // Análise baseada em palavras-chave
            const keywordAnalysis = this.analyzeKeywords(tokens);
            
            // Análise contextual
            const contextualAnalysis = this.analyzeContext(tokens, context);
            
            // Análise de padrões
            const patternAnalysis = this.analyzePatterns(normalizedText);
            
            // Combinar análises
            const combinedScore = this.combineAnalyses([
                { analysis: keywordAnalysis, weight: 0.4 },
                { analysis: contextualAnalysis, weight: 0.3 },
                { analysis: patternAnalysis, weight: 0.3 }
            ]);

            const sentiment = this.classifySentiment(combinedScore.score);
            
            return {
                score: combinedScore.score,
                sentiment: sentiment,
                confidence: combinedScore.confidence,
                details: {
                    keyword_analysis: keywordAnalysis,
                    contextual_analysis: contextualAnalysis,
                    pattern_analysis: patternAnalysis,
                    text_length: text.length,
                    token_count: tokens.length
                }
            };

        } catch (error) {
            console.error('Erro na análise de sentimento:', error);
            return {
                score: 0,
                sentiment: 'neutral',
                confidence: 0,
                details: { error: error.message }
            };
        }
    }

    // Normalizar texto
    normalizeText(text) {
        // Normalizar acentos e caracteres especiais
        const normalized = text
            .toLowerCase()
            .normalize('NFD')
            .replace(/[\u0300-\u036f]/g, '') // Remove diacríticos
            .replace(/[^a-z0-9\s]/g, ' ') // Remove apenas pontuação, mantém letras e números
            .replace(/\s+/g, ' ')
            .trim();
        
        return normalized;
    }

    // Tokenizar texto
    tokenizeText(text) {
        return text.split(' ').filter(token => token.length > 2);
    }

    // Verificar se uma palavra está negada
    isNegated(tokens, index) {
        const { negators } = this.sentimentModels.modifiers;
        
        // Verificar as 2 palavras anteriores
        for (let i = Math.max(0, index - 2); i < index; i++) {
            if (negators[tokens[i]]) {
                return true;
            }
        }
        return false;
    }

    // Obter modificador de intensidade
    getIntensityModifier(tokens, index) {
        const { intensifiers, diminishers } = this.sentimentModels.modifiers;
        let modifier = 1.0;
        
        // Verificar as 2 palavras anteriores
        for (let i = Math.max(0, index - 2); i < index; i++) {
            const token = tokens[i];
            if (intensifiers[token]) {
                modifier *= intensifiers[token];
            } else if (diminishers[token]) {
                modifier *= diminishers[token];
            }
        }
        
        return modifier;
    }

    // Análise baseada em palavras-chave
    analyzeKeywords(tokens) {
        const { positive, negative, neutral } = this.sentimentModels.keywords;
        const { intensifiers, diminishers, negators } = this.sentimentModels.modifiers;
        
        let positiveScore = 0;
        let negativeScore = 0;
        let neutralScore = 0;
        let totalMatches = 0;
        let positiveMatches = 0;
        let negativeMatches = 0;
        let neutralMatches = 0;

        for (let i = 0; i < tokens.length; i++) {
            const token = tokens[i];
            const isNegated = this.isNegated(tokens, i);
            const modifier = this.getIntensityModifier(tokens, i);

            if (positive.includes(token)) {
                const score = isNegated ? -1 * modifier : 1 * modifier;
                positiveScore += score;
                totalMatches++;
                positiveMatches++;
            } else if (negative.includes(token)) {
                const score = isNegated ? 1 * modifier : -1 * modifier;
                negativeScore += score;
                totalMatches++;
                negativeMatches++;
            } else if (neutral.includes(token)) {
                neutralScore += 0.1 * modifier;
                totalMatches++;
                neutralMatches++;
            }
        }
        
        const finalScore = (positiveScore + negativeScore) / Math.max(totalMatches, 1);
        const confidence = Math.min(totalMatches / tokens.length, 1.0);
        
        return {
            score: finalScore,
            confidence: confidence,
            matches: {
                positive: positiveMatches,
                negative: negativeMatches,
                neutral: neutralMatches,
                total: totalMatches
            }
        };
    }

    // Análise contextual
    analyzeContext(tokens, context) {
        const { weights } = this.sentimentModels;
        let contextScore = 0;
        let contextWeight = 1.0;
        
        // Aplicar peso baseado no tipo de feedback
        if (context.type && weights[context.type]) {
            contextWeight = weights[context.type];
        }
        
        // Análise de contexto específico do fornecedor
        if (context.supplier_history) {
            const history = context.supplier_history;
            if (history.avg_rating < 3) contextScore -= 0.2;
            if (history.complaint_rate > 0.3) contextScore -= 0.3;
            if (history.on_time_delivery < 0.8) contextScore -= 0.2;
        }
        
        // Análise temporal
        if (context.timestamp) {
            const age = Date.now() - new Date(context.timestamp).getTime();
            const daysSinceEvent = age / (1000 * 60 * 60 * 24);
            
            // Feedback mais recente tem mais peso
            if (daysSinceEvent < 7) contextWeight *= 1.2;
            else if (daysSinceEvent > 30) contextWeight *= 0.8;
        }
        
        return {
            score: contextScore,
            confidence: contextWeight,
            weight_applied: contextWeight,
            context_factors: context
        };
    }

    // Análise de padrões
    analyzePatterns(text) {
        let patternScore = 0;
        let confidence = 0.5;
        
        // Padrões de pontuação
        const exclamationCount = (text.match(/!/g) || []).length;
        const questionCount = (text.match(/\?/g) || []).length;
        const capsCount = (text.match(/[A-Z]/g) || []).length;
        
        // Exclamações podem indicar emoção forte
        if (exclamationCount > 0) {
            patternScore += exclamationCount * 0.1;
            confidence += 0.1;
        }
        
        // Muitas maiúsculas podem indicar frustração
        if (capsCount > text.length * 0.3) {
            patternScore -= 0.2;
            confidence += 0.1;
        }
        
        // Padrões de repetição
        const repeatedWords = this.findRepeatedWords(text);
        if (repeatedWords.length > 0) {
            patternScore += repeatedWords.length * 0.05;
            confidence += 0.1;
        }
        
        // Comprimento do texto
        if (text.length > 500) {
            confidence += 0.1; // Textos longos geralmente são mais informativos
        }
        
        return {
            score: Math.max(-1, Math.min(1, patternScore)),
            confidence: Math.min(confidence, 1.0),
            patterns: {
                exclamations: exclamationCount,
                questions: questionCount,
                caps_ratio: capsCount / text.length,
                repeated_words: repeatedWords.length,
                text_length: text.length
            }
        };
    }

    // Encontrar palavras repetidas
    findRepeatedWords(text) {
        const words = text.toLowerCase().split(/\s+/);
        const wordCount = {};
        const repeated = [];
        
        words.forEach(word => {
            wordCount[word] = (wordCount[word] || 0) + 1;
        });
        
        Object.entries(wordCount).forEach(([word, count]) => {
            if (count > 1 && word.length > 3) {
                repeated.push({ word, count });
            }
        });
        
        return repeated;
    }

    // Combinar análises
    combineAnalyses(analyses) {
        let totalScore = 0;
        let totalWeight = 0;
        let totalConfidence = 0;
        
        analyses.forEach(({ analysis, weight }) => {
            totalScore += analysis.score * weight * analysis.confidence;
            totalWeight += weight * analysis.confidence;
            totalConfidence += analysis.confidence;
        });
        
        const finalScore = totalWeight > 0 ? totalScore / totalWeight : 0;
        const finalConfidence = totalConfidence / analyses.length;
        
        return {
            score: Math.max(-1, Math.min(1, finalScore)),
            confidence: Math.max(0, Math.min(1, finalConfidence))
        };
    }

    // Classificar sentimento
    classifySentiment(score) {
        if (score >= 0.3) return 'positive';
        if (score <= -0.3) return 'negative';
        return 'neutral';
    }

    // Analisar sentimento de fornecedor em tempo real
    async analyzeSupplierSentiment(supplierId, feedbackData) {
        try {
            const analysis = await this.analyzeSentiment(feedbackData.text, {
                type: feedbackData.type || 'review',
                supplier_id: supplierId,
                timestamp: feedbackData.timestamp || new Date().toISOString(),
                supplier_history: await this.getSupplierHistory(supplierId)
            });

            // Salvar análise no banco
            await this.saveSentimentAnalysis(supplierId, feedbackData, analysis);
            
            // Atualizar análise em tempo real
            this.updateRealTimeAnalysis(supplierId, analysis);
            
            // Verificar alertas
            await this.checkSentimentAlerts(supplierId, analysis);
            
            // Atualizar métricas do fornecedor
            await this.updateSupplierMetrics(supplierId);
            
            return {
                success: true,
                analysis: analysis,
                supplier_id: supplierId,
                real_time_score: this.realTimeAnalysis.get(supplierId)
            };

        } catch (error) {
            console.error('Erro na análise de sentimento do fornecedor:', error);
            return {
                success: false,
                error: error.message
            };
        }
    }

    // Obter histórico do fornecedor
    async getSupplierHistory(supplierId) {
        try {
            const query = `
                SELECT 
                    AVG(rating) as avg_rating,
                    COUNT(CASE WHEN type = 'complaint' THEN 1 END) * 1.0 / COUNT(*) as complaint_rate,
                    COUNT(CASE WHEN delivery_status = 'on_time' THEN 1 END) * 1.0 / COUNT(*) as on_time_delivery,
                    COUNT(*) as total_interactions
                FROM supplier_feedback 
                WHERE supplier_id = ? 
                AND created_at >= datetime('now', '-6 months')
            `;
            
            const result = await this.db.get(query, [supplierId]);
            return result || {
                avg_rating: 3,
                complaint_rate: 0,
                on_time_delivery: 1,
                total_interactions: 0
            };
        } catch (error) {
            console.error('Erro ao obter histórico do fornecedor:', error);
            return {
                avg_rating: 3,
                complaint_rate: 0,
                on_time_delivery: 1,
                total_interactions: 0
            };
        }
    }

    // Salvar análise de sentimento
    async saveSentimentAnalysis(supplierId, feedbackData, analysis) {
        try {
            const query = `
                INSERT INTO sentiment_analysis (
                    supplier_id, text, feedback_type, sentiment_score,
                    sentiment_label, confidence, keywords, metadata
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
            `;
            
            const result = await this.db.run(query, [
                supplierId,
                feedbackData.feedback_text || feedbackData.text,
                feedbackData.category || feedbackData.type || 'review',
                analysis.score,
                analysis.sentiment,
                analysis.confidence,
                JSON.stringify(analysis.keywords || []),
                JSON.stringify(analysis.details || analysis)
            ]);
            
            return {
                success: true,
                analysisId: result.lastID
            };
            
        } catch (error) {
            console.error('Erro ao salvar análise de sentimento:', error);
            return {
                success: false,
                error: error.message
            };
        }
    }

    // Atualizar análise em tempo real
    updateRealTimeAnalysis(supplierId, analysis) {
        const current = this.realTimeAnalysis.get(supplierId) || {
            scores: [],
            average: 0,
            trend: 'stable',
            last_updated: new Date()
        };
        
        // Adicionar nova pontuação
        current.scores.push({
            score: analysis.score,
            confidence: analysis.confidence,
            timestamp: new Date()
        });
        
        // Manter apenas as últimas 50 análises
        if (current.scores.length > 50) {
            current.scores = current.scores.slice(-50);
        }
        
        // Calcular média ponderada
        const weightedSum = current.scores.reduce((sum, item) => 
            sum + (item.score * item.confidence), 0);
        const totalWeight = current.scores.reduce((sum, item) => 
            sum + item.confidence, 0);
        
        current.average = totalWeight > 0 ? weightedSum / totalWeight : 0;
        
        // Calcular tendência
        current.trend = this.calculateTrend(current.scores);
        current.last_updated = new Date();
        
        this.realTimeAnalysis.set(supplierId, current);
    }

    // Calcular tendência
    calculateTrend(scores) {
        if (scores.length < 5) return 'stable';
        
        const recent = scores.slice(-5);
        const older = scores.slice(-10, -5);
        
        if (older.length === 0) return 'stable';
        
        const recentAvg = recent.reduce((sum, item) => sum + item.score, 0) / recent.length;
        const olderAvg = older.reduce((sum, item) => sum + item.score, 0) / older.length;
        
        const difference = recentAvg - olderAvg;
        
        if (difference > 0.2) return 'improving';
        if (difference < -0.2) return 'declining';
        return 'stable';
    }

    // Verificar alertas de sentimento
    async checkSentimentAlerts(supplierId, analysis) {
        try {
            const realTimeData = this.realTimeAnalysis.get(supplierId);
            if (!realTimeData) return;
            
            const alerts = [];
            
            // Alerta de sentimento muito negativo
            if (analysis.score <= this.alertThresholds.negative) {
                alerts.push({
                    type: 'negative_sentiment',
                    severity: 'high',
                    message: `Sentimento muito negativo detectado para fornecedor ${supplierId}`,
                    score: analysis.score,
                    confidence: analysis.confidence
                });
            }
            
            // Alerta de tendência declinante
            if (realTimeData.trend === 'declining' && realTimeData.average < -0.3) {
                alerts.push({
                    type: 'declining_trend',
                    severity: 'medium',
                    message: `Tendência de declínio no sentimento do fornecedor ${supplierId}`,
                    trend: realTimeData.trend,
                    average: realTimeData.average
                });
            }
            
            // Alerta de volatilidade alta
            const volatility = this.calculateVolatility(realTimeData.scores);
            if (volatility > this.alertThresholds.volatility) {
                alerts.push({
                    type: 'high_volatility',
                    severity: 'medium',
                    message: `Alta volatilidade no sentimento do fornecedor ${supplierId}`,
                    volatility: volatility
                });
            }
            
            // Enviar alertas
            for (const alert of alerts) {
                await this.sendSentimentAlert(supplierId, alert);
            }
            
        } catch (error) {
            console.error('Erro ao verificar alertas:', error);
        }
    }

    // Calcular volatilidade
    calculateVolatility(scores) {
        if (scores.length < 3) return 0;
        
        const values = scores.map(s => s.score);
        const mean = values.reduce((sum, val) => sum + val, 0) / values.length;
        const variance = values.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / values.length;
        
        return Math.sqrt(variance);
    }

    // Enviar alerta de sentimento
    async sendSentimentAlert(supplierId, alert) {
        try {
            // Salvar alerta no banco
            const query = `
                INSERT INTO sentiment_alerts (
                    supplier_id, alert_type, severity, message, 
                    alert_data, created_at, status
                ) VALUES (?, ?, ?, ?, ?, datetime('now'), 'active')
            `;
            
            await this.db.run(query, [
                supplierId,
                alert.type,
                alert.severity,
                alert.message,
                JSON.stringify(alert)
            ]);
            
            // Aqui você pode integrar com sistema de notificações
            console.log(`🚨 Alerta de Sentimento: ${alert.message}`);
            
        } catch (error) {
            console.error('Erro ao enviar alerta:', error);
        }
    }

    // Atualizar métricas do fornecedor
    async updateSupplierMetrics(supplierId) {
        try {
            const realTimeData = this.realTimeAnalysis.get(supplierId);
            if (!realTimeData) return;
            
            const query = `
                UPDATE suppliers 
                SET 
                    sentiment_score = ?,
                    sentiment_trend = ?,
                    last_sentiment_update = datetime('now')
                WHERE id = ?
            `;
            
            await this.db.run(query, [
                realTimeData.average,
                realTimeData.trend,
                supplierId
            ]);
            
        } catch (error) {
            console.error('Erro ao atualizar métricas do fornecedor:', error);
        }
    }

    // Obter análise de sentimento em tempo real
    async getRealTimeSentiment(supplierId) {
        try {
            const realTimeData = this.realTimeAnalysis.get(supplierId);
            
            if (!realTimeData) {
                // Carregar dados do banco se não estiver em memória
                await this.loadSupplierSentimentData(supplierId);
                return this.realTimeAnalysis.get(supplierId) || null;
            }
            
            return realTimeData;
            
        } catch (error) {
            console.error('Erro ao obter sentimento em tempo real:', error);
            return null;
        }
    }

    // Carregar dados de sentimento do fornecedor
    async loadSupplierSentimentData(supplierId) {
        try {
            const query = `
                SELECT sentiment_score, confidence, created_at
                FROM sentiment_analysis 
                WHERE supplier_id = ? 
                ORDER BY created_at DESC 
                LIMIT 50
            `;
            
            const results = await this.db.all(query, [supplierId]);
            
            if (results.length > 0) {
                const scores = results.map(row => ({
                    score: row.sentiment_score,
                    confidence: row.confidence,
                    timestamp: new Date(row.created_at)
                }));
                
                const weightedSum = scores.reduce((sum, item) => 
                    sum + (item.score * item.confidence), 0);
                const totalWeight = scores.reduce((sum, item) => 
                    sum + item.confidence, 0);
                
                const realTimeData = {
                    scores: scores,
                    average: totalWeight > 0 ? weightedSum / totalWeight : 0,
                    trend: this.calculateTrend(scores),
                    last_updated: new Date()
                };
                
                this.realTimeAnalysis.set(supplierId, realTimeData);
            }
            
        } catch (error) {
            console.error('Erro ao carregar dados de sentimento:', error);
        }
    }

    // Obter relatório de sentimento
    async getSentimentReport(filters = {}) {
        try {
            let query = `
                SELECT 
                    s.id,
                    s.name,
                    s.sentiment_score,
                    s.sentiment_trend,
                    COUNT(sa.id) as total_analyses,
                    AVG(sa.sentiment_score) as avg_sentiment,
                    AVG(sa.confidence) as avg_confidence,
                    COUNT(CASE WHEN sa.sentiment_class = 'positive' THEN 1 END) as positive_count,
                    COUNT(CASE WHEN sa.sentiment_class = 'negative' THEN 1 END) as negative_count,
                    COUNT(CASE WHEN sa.sentiment_class = 'neutral' THEN 1 END) as neutral_count
                FROM suppliers s
                LEFT JOIN sentiment_analysis sa ON s.id = sa.supplier_id
            `;
            
            const params = [];
            const conditions = [];
            
            if (filters.supplier_id) {
                conditions.push('s.id = ?');
                params.push(filters.supplier_id);
            }
            
            if (filters.date_from) {
                conditions.push('sa.created_at >= ?');
                params.push(filters.date_from);
            }
            
            if (filters.date_to) {
                conditions.push('sa.created_at <= ?');
                params.push(filters.date_to);
            }
            
            if (conditions.length > 0) {
                query += ' WHERE ' + conditions.join(' AND ');
            }
            
            query += ' GROUP BY s.id, s.name ORDER BY avg_sentiment DESC';
            
            const results = await this.db.all(query, params);
            
            return {
                success: true,
                suppliers: results,
                summary: this.calculateReportSummary(results),
                generated_at: new Date().toISOString()
            };
            
        } catch (error) {
            console.error('Erro ao gerar relatório de sentimento:', error);
            return {
                success: false,
                error: error.message
            };
        }
    }

    // Calcular resumo do relatório
    calculateReportSummary(results) {
        if (results.length === 0) {
            return {
                total_suppliers: 0,
                avg_sentiment: 0,
                positive_suppliers: 0,
                negative_suppliers: 0,
                neutral_suppliers: 0
            };
        }
        
        const totalSentiment = results.reduce((sum, r) => sum + (r.avg_sentiment || 0), 0);
        const avgSentiment = totalSentiment / results.length;
        
        return {
            total_suppliers: results.length,
            avg_sentiment: avgSentiment,
            positive_suppliers: results.filter(r => (r.avg_sentiment || 0) > 0.3).length,
            negative_suppliers: results.filter(r => (r.avg_sentiment || 0) < -0.3).length,
            neutral_suppliers: results.filter(r => Math.abs(r.avg_sentiment || 0) <= 0.3).length,
            most_positive: results[0],
            most_negative: results[results.length - 1]
        };
    }

    // Processar feedback em lote
    async processBatchFeedback(feedbackList) {
        try {
            const results = [];
            
            for (const feedback of feedbackList) {
                const result = await this.analyzeSupplierSentiment(
                    feedback.supplier_id,
                    feedback
                );
                results.push(result);
            }
            
            return {
                success: true,
                processed: results.length,
                results: results
            };
            
        } catch (error) {
            console.error('Erro no processamento em lote:', error);
            return {
                success: false,
                error: error.message
            };
        }
    }

    // Obter alertas ativos
    async getActiveAlerts(filters = {}) {
        try {
            let query = `
                SELECT 
                    sa.*,
                    s.name as supplier_name
                FROM sentiment_alerts sa
                JOIN suppliers s ON sa.supplier_id = s.id
                WHERE sa.status = 'active'
            `;
            
            const params = [];
            
            if (filters.severity) {
                query += ' AND sa.severity = ?';
                params.push(filters.severity);
            }
            
            if (filters.alert_type) {
                query += ' AND sa.alert_type = ?';
                params.push(filters.alert_type);
            }
            
            query += ' ORDER BY sa.created_at DESC';
            
            const alerts = await this.db.all(query, params);
            
            return {
                success: true,
                alerts: alerts,
                count: alerts.length
            };
            
        } catch (error) {
            console.error('Erro ao obter alertas:', error);
            return {
                success: false,
                error: error.message
            };
        }
    }

    // Marcar alerta como resolvido
    async resolveAlert(alertId) {
        try {
            const query = `
                UPDATE sentiment_alerts 
                SET status = 'resolved', resolved_at = datetime('now')
                WHERE id = ?
            `;
            
            await this.db.run(query, [alertId]);
            
            return {
                success: true,
                message: 'Alerta marcado como resolvido'
            };
            
        } catch (error) {
            console.error('Erro ao resolver alerta:', error);
            return {
                success: false,
                error: error.message
            };
        }
    }

    // Obter fornecedores em tendência baseado no sentimento
    async getTrendingSuppliers(period = '7d') {
        try {
            let dateFilter = '';
            switch (period) {
                case '24h':
                    dateFilter = "AND sa.created_at >= datetime('now', '-1 day')";
                    break;
                case '7d':
                    dateFilter = "AND sa.created_at >= datetime('now', '-7 days')";
                    break;
                case '30d':
                    dateFilter = "AND sa.created_at >= datetime('now', '-30 days')";
                    break;
                default:
                    dateFilter = "AND sa.created_at >= datetime('now', '-7 days')";
            }

            const query = `
                SELECT 
                    s.id,
                    s.name,
                    s.email,
                    s.phone,
                    AVG(sa.sentiment_score) as avg_sentiment,
                COUNT(sa.id) as feedback_count,
                SUM(CASE WHEN sa.sentiment_score >= 0.7 THEN 1 ELSE 0 END) as positive_count,
                SUM(CASE WHEN sa.sentiment_score <= 0.3 THEN 1 ELSE 0 END) as negative_count
                FROM suppliers s
                LEFT JOIN sentiment_analysis sa ON s.id = sa.supplier_id
                WHERE 1=1 ${dateFilter}
                GROUP BY s.id, s.name, s.email, s.phone
                HAVING feedback_count > 0
                ORDER BY avg_sentiment DESC, feedback_count DESC
                LIMIT 10
            `;

            const suppliers = await this.db.all(query);
            
            return {
                success: true,
                data: suppliers.map(supplier => ({
                    ...supplier,
                    sentiment_trend: supplier.avg_sentiment >= 0.7 ? 'positive' : 
                                   supplier.avg_sentiment <= 0.3 ? 'negative' : 'neutral'
                }))
            };

        } catch (error) {
            console.error('Erro ao obter fornecedores em tendência:', error);
            return {
                success: false,
                error: error.message,
                data: []
            };
        }
    }

    // Obter fornecedores com dados de sentimento
    async getSuppliersWithSentiment() {
        try {
            const query = `
                SELECT 
                    s.id,
                    s.name,
                    s.email,
                    s.phone,
                    s.status,
                    AVG(sa.sentiment_score) as avg_sentiment,
                COUNT(sa.id) as feedback_count,
                MAX(sa.created_at) as last_feedback,
                SUM(CASE WHEN sa.sentiment_score >= 0.7 THEN 1 ELSE 0 END) as positive_feedback,
                SUM(CASE WHEN sa.sentiment_score <= 0.3 THEN 1 ELSE 0 END) as negative_feedback
                FROM suppliers s
                LEFT JOIN sentiment_analysis sa ON s.id = sa.supplier_id
                GROUP BY s.id, s.name, s.email, s.phone, s.status
                ORDER BY s.name
            `;

            const suppliers = await this.db.all(query);
            
            return {
                success: true,
                data: suppliers.map(supplier => ({
                    ...supplier,
                    sentiment_status: supplier.avg_sentiment ? 
                        (supplier.avg_sentiment >= 0.7 ? 'excellent' :
                         supplier.avg_sentiment >= 0.5 ? 'good' :
                         supplier.avg_sentiment >= 0.3 ? 'fair' : 'poor') : 'no_data'
                }))
            };

        } catch (error) {
            console.error('Erro ao obter fornecedores com sentimento:', error);
            return {
                success: false,
                error: error.message,
                data: []
            };
        }
    }

    // Obter dados para gráficos
    async getChartData(range = '30d') {
        try {
            let dateFilter = '';
            let groupBy = '';
            
            switch (range) {
                case '7d':
                    dateFilter = "WHERE sa.created_at >= datetime('now', '-7 days')";
                    groupBy = "DATE(sa.created_at)";
                    break;
                case '30d':
                    dateFilter = "WHERE sa.created_at >= datetime('now', '-30 days')";
                    groupBy = "DATE(sa.created_at)";
                    break;
                case '90d':
                    dateFilter = "WHERE sa.created_at >= datetime('now', '-90 days')";
                    groupBy = "strftime('%Y-%W', sa.created_at)";
                    break;
                default:
                    dateFilter = "WHERE sa.created_at >= datetime('now', '-30 days')";
                    groupBy = "DATE(sa.created_at)";
            }

            // Dados de tendência de sentimento ao longo do tempo
            const trendQuery = `
                SELECT 
                    ${groupBy} as period,
                    AVG(sa.sentiment_score) as avg_sentiment,
                COUNT(sa.id) as feedback_count,
                SUM(CASE WHEN sa.sentiment_score >= 0.7 THEN 1 ELSE 0 END) as positive_count,
                SUM(CASE WHEN sa.sentiment_score <= 0.3 THEN 1 ELSE 0 END) as negative_count
                FROM sentiment_analysis sa
                ${dateFilter}
                GROUP BY ${groupBy}
                ORDER BY period
            `;

            // Distribuição de sentimentos por fornecedor
            const distributionQuery = `
                SELECT 
                    s.name as supplier_name,
                    AVG(sa.sentiment_score) as avg_sentiment,
                    COUNT(sa.id) as feedback_count
                FROM suppliers s
                LEFT JOIN sentiment_analysis sa ON s.id = sa.supplier_id
                ${dateFilter.replace('WHERE', 'WHERE sa.id IS NOT NULL AND')}
                GROUP BY s.id, s.name
                HAVING feedback_count > 0
                ORDER BY avg_sentiment DESC
                LIMIT 10
            `;

            const [trendData, distributionData] = await Promise.all([
                this.db.all(trendQuery),
                this.db.all(distributionQuery)
            ]);

            return {
                success: true,
                data: {
                    trend: trendData,
                    distribution: distributionData,
                    summary: {
                        total_feedback: trendData.reduce((sum, item) => sum + item.feedback_count, 0),
                        avg_sentiment: trendData.length > 0 ? 
                            trendData.reduce((sum, item) => sum + item.avg_sentiment, 0) / trendData.length : 0
                    }
                }
            };

        } catch (error) {
            console.error('Erro ao obter dados do gráfico:', error);
            return {
                success: false,
                error: error.message,
                data: { trend: [], distribution: [], summary: {} }
            };
        }
    }

    // Processar feedback do usuário
    async processFeedback(feedbackData) {
        try {
            const { supplier_id, feedback_text, rating, category, user_id } = feedbackData;

            // Analisar sentimento do feedback
            const analysis = await this.analyzeSentiment(feedback_text, {
                category: category || 'general',
                rating: rating
            });

            // Salvar análise no banco
            const result = await this.saveSentimentAnalysis(supplier_id, {
                feedback_text,
                rating,
                category,
                user_id
            }, analysis);

            if (result.success) {
                // Verificar alertas
                await this.checkSentimentAlerts(supplier_id, analysis);
                
                // Atualizar métricas do fornecedor
                await this.updateSupplierMetrics(supplier_id);
            }

            return {
                success: true,
                data: {
                    analysis_id: result.analysisId,
                    sentiment_score: analysis.score,
            sentiment_label: analysis.score >= 0.7 ? 'positive' :
                           analysis.score <= 0.3 ? 'negative' : 'neutral',
                    emotions: analysis.emotions
                }
            };

        } catch (error) {
            console.error('Erro ao processar feedback:', error);
            return {
                success: false,
                error: error.message
            };
        }
    }

    // Gerar relatório de sentimento
    async generateSentimentReport(filters = {}) {
        try {
            const { 
                supplier_id, 
                start_date, 
                end_date, 
                sentiment_threshold = 0.5,
                include_details = false 
            } = filters;

            let whereConditions = ['1=1'];
            let params = [];

            if (supplier_id) {
                whereConditions.push('sa.supplier_id = ?');
                params.push(supplier_id);
            }

            if (start_date) {
                whereConditions.push('sa.created_at >= ?');
                params.push(start_date);
            }

            if (end_date) {
                whereConditions.push('sa.created_at <= ?');
                params.push(end_date);
            }

            const whereClause = whereConditions.join(' AND ');

            // Consulta principal do relatório
            const reportQuery = `
                SELECT 
                    s.id as supplier_id,
                    s.name as supplier_name,
                    COUNT(sa.id) as total_feedback,
                    AVG(sa.sentiment_score) as avg_sentiment,
                MIN(sa.sentiment_score) as min_sentiment,
                MAX(sa.sentiment_score) as max_sentiment,
                SUM(CASE WHEN sa.sentiment_score >= 0.7 THEN 1 ELSE 0 END) as positive_count,
                SUM(CASE WHEN sa.sentiment_score BETWEEN 0.3 AND 0.7 THEN 1 ELSE 0 END) as neutral_count,
                SUM(CASE WHEN sa.sentiment_score <= 0.3 THEN 1 ELSE 0 END) as negative_count,
                    MIN(sa.created_at) as first_feedback,
                    MAX(sa.created_at) as last_feedback
                FROM suppliers s
                LEFT JOIN sentiment_analysis sa ON s.id = sa.supplier_id
                WHERE ${whereClause}
                GROUP BY s.id, s.name
                HAVING total_feedback > 0
                ORDER BY avg_sentiment DESC
            `;

            const reportData = await this.db.all(reportQuery, params);

            let detailsData = [];
            if (include_details) {
                const detailsQuery = `
                    SELECT 
                        sa.id,
                        sa.supplier_id,
                        s.name as supplier_name,
                        sa.feedback_text,
                        sa.sentiment_score,
                        sa.emotions,
                        sa.category,
                        sa.created_at
                    FROM sentiment_analysis sa
                    JOIN suppliers s ON sa.supplier_id = s.id
                    WHERE ${whereClause}
                    ORDER BY sa.created_at DESC
                `;
                
                detailsData = await this.db.all(detailsQuery, params);
            }

            // Estatísticas gerais
            const totalFeedback = reportData.reduce((sum, item) => sum + item.total_feedback, 0);
            const overallAvgSentiment = reportData.length > 0 ? 
                reportData.reduce((sum, item) => sum + item.avg_sentiment, 0) / reportData.length : 0;

            return {
                success: true,
                data: {
                    summary: {
                        total_suppliers: reportData.length,
                        total_feedback: totalFeedback,
                        overall_avg_sentiment: overallAvgSentiment,
                        report_period: {
                            start_date: start_date || 'início',
                            end_date: end_date || 'agora'
                        }
                    },
                    suppliers: reportData,
                    details: include_details ? detailsData : null,
                    generated_at: new Date().toISOString()
                }
            };

        } catch (error) {
            console.error('Erro ao gerar relatório de sentimento:', error);
            return {
                success: false,
                error: error.message,
                data: null
            };
        }
    }
}

module.exports = SentimentAnalysisController;