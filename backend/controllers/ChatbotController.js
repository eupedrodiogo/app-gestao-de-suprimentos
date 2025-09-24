class ChatbotController {
    constructor(database) {
        this.db = database;
        this.conversationHistory = new Map();
        this.userSessions = new Map();
        this.knowledgeBase = this.initializeKnowledgeBase();
        this.intents = this.initializeIntents();
        this.entities = this.initializeEntities();
        this.responses = this.initializeResponses();
        this.contextManager = new Map();
    }

    // Inicializar base de conhecimento
    initializeKnowledgeBase() {
        return {
            products: {
                keywords: ['produto', 'item', 'mercadoria', 'artigo', 'estoque'],
                actions: ['buscar', 'encontrar', 'localizar', 'verificar', 'consultar']
            },
            suppliers: {
                keywords: ['fornecedor', 'supplier', 'vendedor', 'distribuidor'],
                actions: ['contatar', 'listar', 'avaliar', 'comparar']
            },
            orders: {
                keywords: ['pedido', 'order', 'compra', 'solicitação'],
                actions: ['criar', 'cancelar', 'rastrear', 'modificar', 'status']
            },
            inventory: {
                keywords: ['inventário', 'estoque', 'armazém', 'depósito'],
                actions: ['verificar', 'atualizar', 'contar', 'movimentar']
            },
            reports: {
                keywords: ['relatório', 'report', 'análise', 'dashboard'],
                actions: ['gerar', 'visualizar', 'exportar', 'agendar']
            },
            help: {
                keywords: ['ajuda', 'help', 'suporte', 'tutorial', 'como'],
                actions: ['explicar', 'ensinar', 'mostrar', 'guiar']
            }
        };
    }

    // Inicializar intenções
    initializeIntents() {
        return {
            greeting: {
                patterns: ['oi', 'olá', 'hello', 'bom dia', 'boa tarde', 'boa noite'],
                confidence: 0.9
            },
            product_search: {
                patterns: ['buscar produto', 'encontrar item', 'procurar', 'onde está'],
                confidence: 0.8
            },
            inventory_check: {
                patterns: ['verificar estoque', 'quantidade disponível', 'tem em estoque'],
                confidence: 0.8
            },
            order_status: {
                patterns: ['status do pedido', 'onde está meu pedido', 'rastrear'],
                confidence: 0.8
            },
            supplier_info: {
                patterns: ['informações do fornecedor', 'contato fornecedor', 'dados supplier'],
                confidence: 0.7
            },
            help_request: {
                patterns: ['ajuda', 'help', 'não sei', 'como fazer', 'tutorial'],
                confidence: 0.9
            },
            report_generation: {
                patterns: ['gerar relatório', 'criar report', 'análise', 'dashboard'],
                confidence: 0.7
            },
            goodbye: {
                patterns: ['tchau', 'bye', 'até logo', 'obrigado', 'valeu'],
                confidence: 0.9
            }
        };
    }

    // Inicializar entidades
    initializeEntities() {
        return {
            product_name: {
                patterns: /produto\s+([a-zA-Z0-9\s]+)/i,
                type: 'string'
            },
            product_id: {
                patterns: /id\s+(\d+)/i,
                type: 'number'
            },
            quantity: {
                patterns: /(\d+)\s*(unidades?|peças?|itens?)/i,
                type: 'number'
            },
            date: {
                patterns: /(\d{1,2}\/\d{1,2}\/\d{4}|\d{4}-\d{2}-\d{2})/i,
                type: 'date'
            },
            supplier_name: {
                patterns: /fornecedor\s+([a-zA-Z\s]+)/i,
                type: 'string'
            }
        };
    }

    // Inicializar respostas
    initializeResponses() {
        return {
            greeting: [
                "Olá! Sou o assistente virtual do sistema de gestão de suprimentos. Como posso ajudá-lo hoje?",
                "Oi! Estou aqui para ajudar com suas necessidades de gestão de estoque. O que você gostaria de fazer?",
                "Bem-vindo! Sou seu assistente para gestão de suprimentos. Em que posso ser útil?"
            ],
            product_search: [
                "Vou buscar informações sobre esse produto para você.",
                "Deixe-me procurar esse item no sistema.",
                "Consultando o banco de dados de produtos..."
            ],
            inventory_check: [
                "Verificando o estoque atual...",
                "Consultando a disponibilidade no inventário...",
                "Checando os níveis de estoque..."
            ],
            order_status: [
                "Vou verificar o status do seu pedido.",
                "Consultando informações do pedido...",
                "Buscando atualizações sobre seu pedido..."
            ],
            supplier_info: [
                "Buscando informações do fornecedor...",
                "Consultando dados do supplier...",
                "Verificando detalhes do fornecedor..."
            ],
            help_request: [
                "Claro! Estou aqui para ajudar. Sobre o que você gostaria de saber?",
                "Com prazer! Qual funcionalidade você gostaria de entender melhor?",
                "Posso explicar qualquer funcionalidade do sistema. O que você precisa?"
            ],
            report_generation: [
                "Vou preparar o relatório solicitado.",
                "Gerando análise dos dados...",
                "Compilando informações para o relatório..."
            ],
            goodbye: [
                "Foi um prazer ajudá-lo! Até a próxima!",
                "Obrigado por usar nosso sistema. Volte sempre!",
                "Tchau! Estarei aqui quando precisar de ajuda."
            ],
            not_understood: [
                "Desculpe, não entendi completamente. Pode reformular sua pergunta?",
                "Não consegui compreender. Pode ser mais específico?",
                "Hmm, não entendi bem. Pode explicar de outra forma?"
            ],
            error: [
                "Ops! Ocorreu um erro. Vou tentar novamente.",
                "Algo deu errado. Pode tentar reformular sua pergunta?",
                "Encontrei um problema. Vamos tentar de novo?"
            ]
        };
    }

    // Processar mensagem do usuário
    async processMessage(message, userId = 'anonymous', sessionId = null) {
        try {
            const timestamp = new Date().toISOString();
            
            // Criar ou recuperar sessão
            const session = this.getOrCreateSession(userId, sessionId);
            
            // Pré-processar mensagem
            const processedMessage = this.preprocessMessage(message);
            
            // Detectar intenção
            const intent = this.detectIntent(processedMessage);
            
            // Extrair entidades
            const entities = this.extractEntities(processedMessage);
            
            // Gerenciar contexto
            const context = this.manageContext(session, intent, entities);
            
            // Gerar resposta
            const response = await this.generateResponse(intent, entities, context, session);
            
            // Salvar na conversa
            this.saveConversation(session, {
                timestamp,
                userMessage: message,
                processedMessage,
                intent,
                entities,
                context,
                botResponse: response.text,
                confidence: response.confidence
            });
            
            return {
                success: true,
                response: response.text,
                intent: intent.name,
                confidence: response.confidence,
                entities,
                context,
                sessionId: session.id,
                suggestions: response.suggestions || [],
                actions: response.actions || []
            };
            
        } catch (error) {
            console.error('Erro ao processar mensagem:', error);
            return {
                success: false,
                response: this.getRandomResponse('error'),
                error: error.message
            };
        }
    }

    // Pré-processar mensagem
    preprocessMessage(message) {
        return message
            .toLowerCase()
            .trim()
            .replace(/[^\w\s\d]/g, ' ')
            .replace(/\s+/g, ' ');
    }

    // Detectar intenção
    detectIntent(message) {
        let bestMatch = { name: 'not_understood', confidence: 0 };
        
        for (const [intentName, intentData] of Object.entries(this.intents)) {
            for (const pattern of intentData.patterns) {
                if (message.includes(pattern)) {
                    const confidence = this.calculateConfidence(message, pattern, intentData.confidence);
                    if (confidence > bestMatch.confidence) {
                        bestMatch = { name: intentName, confidence };
                    }
                }
            }
        }
        
        return bestMatch;
    }

    // Calcular confiança
    calculateConfidence(message, pattern, baseConfidence) {
        const words = message.split(' ');
        const patternWords = pattern.split(' ');
        const matchCount = patternWords.filter(word => words.includes(word)).length;
        const matchRatio = matchCount / patternWords.length;
        
        return baseConfidence * matchRatio;
    }

    // Extrair entidades
    extractEntities(message) {
        const entities = {};
        
        for (const [entityName, entityData] of Object.entries(this.entities)) {
            const match = message.match(entityData.patterns);
            if (match) {
                entities[entityName] = {
                    value: match[1],
                    type: entityData.type,
                    raw: match[0]
                };
            }
        }
        
        return entities;
    }

    // Gerenciar contexto
    manageContext(session, intent, entities) {
        const context = this.contextManager.get(session.id) || {};
        
        // Atualizar contexto baseado na intenção
        switch (intent.name) {
            case 'product_search':
                context.lastAction = 'searching_product';
                context.searchType = 'product';
                break;
            case 'inventory_check':
                context.lastAction = 'checking_inventory';
                context.searchType = 'inventory';
                break;
            case 'order_status':
                context.lastAction = 'checking_order';
                context.searchType = 'order';
                break;
        }
        
        // Adicionar entidades ao contexto
        if (Object.keys(entities).length > 0) {
            context.entities = { ...context.entities, ...entities };
        }
        
        context.lastIntent = intent.name;
        context.timestamp = new Date().toISOString();
        
        this.contextManager.set(session.id, context);
        return context;
    }

    // Gerar resposta
    async generateResponse(intent, entities, context, session) {
        try {
            switch (intent.name) {
                case 'greeting':
                    return this.handleGreeting(session);
                
                case 'product_search':
                    return await this.handleProductSearch(entities, context);
                
                case 'inventory_check':
                    return await this.handleInventoryCheck(entities, context);
                
                case 'order_status':
                    return await this.handleOrderStatus(entities, context);
                
                case 'supplier_info':
                    return await this.handleSupplierInfo(entities, context);
                
                case 'help_request':
                    return this.handleHelpRequest(context);
                
                case 'report_generation':
                    return await this.handleReportGeneration(entities, context);
                
                case 'goodbye':
                    return this.handleGoodbye(session);
                
                default:
                    return this.handleNotUnderstood(context);
            }
        } catch (error) {
            console.error('Erro ao gerar resposta:', error);
            return {
                text: this.getRandomResponse('error'),
                confidence: 0.1
            };
        }
    }

    // Handlers específicos
    handleGreeting(session) {
        const response = this.getRandomResponse('greeting');
        return {
            text: response,
            confidence: 0.9,
            suggestions: [
                "Buscar produto",
                "Verificar estoque",
                "Status do pedido",
                "Gerar relatório"
            ]
        };
    }

    async handleProductSearch(entities, context) {
        const response = this.getRandomResponse('product_search');
        
        if (entities.product_name || entities.product_id) {
            try {
                const searchTerm = entities.product_name?.value || entities.product_id?.value;
                const products = await this.searchProducts(searchTerm);
                
                if (products.length > 0) {
                    const product = products[0];
                    return {
                        text: `Encontrei o produto: ${product.nome} (ID: ${product.id})\nPreço: R$ ${product.preco}\nEstoque: ${product.quantidade_estoque} unidades\nCategoria: ${product.categoria}`,
                        confidence: 0.9,
                        actions: [
                            { type: 'view_product', productId: product.id },
                            { type: 'check_stock', productId: product.id }
                        ]
                    };
                } else {
                    return {
                        text: `Não encontrei nenhum produto com "${searchTerm}". Pode verificar o nome ou ID?`,
                        confidence: 0.7,
                        suggestions: ["Listar todos os produtos", "Buscar por categoria"]
                    };
                }
            } catch (error) {
                return {
                    text: "Erro ao buscar produto. Tente novamente.",
                    confidence: 0.3
                };
            }
        } else {
            return {
                text: response + " Qual produto você está procurando?",
                confidence: 0.6,
                suggestions: ["Produto A", "Produto B", "Listar todos"]
            };
        }
    }

    async handleInventoryCheck(entities, context) {
        try {
            if (entities.product_name || entities.product_id) {
                const searchTerm = entities.product_name?.value || entities.product_id?.value;
                const products = await this.searchProducts(searchTerm);
                
                if (products.length > 0) {
                    const product = products[0];
                    const stockLevel = this.getStockLevel(product.quantidade_estoque);
                    
                    return {
                        text: `Estoque do ${product.nome}:\n• Quantidade: ${product.quantidade_estoque} unidades\n• Status: ${stockLevel.status}\n• Estoque mínimo: ${product.estoque_minimo || 10} unidades`,
                        confidence: 0.9,
                        actions: stockLevel.needsReorder ? [
                            { type: 'create_order', productId: product.id }
                        ] : []
                    };
                }
            } else {
                const lowStockProducts = await this.getLowStockProducts();
                if (lowStockProducts.length > 0) {
                    const list = lowStockProducts.map(p => `• ${p.nome}: ${p.quantidade_estoque} unidades`).join('\n');
                    return {
                        text: `Produtos com estoque baixo:\n${list}`,
                        confidence: 0.8,
                        actions: [{ type: 'view_inventory' }]
                    };
                } else {
                    return {
                        text: "Todos os produtos estão com estoque adequado! 👍",
                        confidence: 0.9
                    };
                }
            }
        } catch (error) {
            return {
                text: "Erro ao verificar estoque. Tente novamente.",
                confidence: 0.3
            };
        }
    }

    async handleOrderStatus(entities, context) {
        try {
            const orders = await this.getRecentOrders();
            if (orders.length > 0) {
                const orderList = orders.slice(0, 3).map(order => 
                    `• Pedido #${order.id}: ${order.status} - ${new Date(order.data_pedido).toLocaleDateString()}`
                ).join('\n');
                
                return {
                    text: `Seus pedidos recentes:\n${orderList}`,
                    confidence: 0.8,
                    actions: [{ type: 'view_orders' }]
                };
            } else {
                return {
                    text: "Não encontrei pedidos recentes.",
                    confidence: 0.7,
                    suggestions: ["Criar novo pedido", "Ver histórico completo"]
                };
            }
        } catch (error) {
            return {
                text: "Erro ao consultar pedidos. Tente novamente.",
                confidence: 0.3
            };
        }
    }

    async handleSupplierInfo(entities, context) {
        try {
            const suppliers = await this.getSuppliers();
            if (suppliers.length > 0) {
                const supplierList = suppliers.slice(0, 3).map(supplier => 
                    `• ${supplier.nome}: ${supplier.email} - Tel: ${supplier.telefone}`
                ).join('\n');
                
                return {
                    text: `Principais fornecedores:\n${supplierList}`,
                    confidence: 0.8,
                    actions: [{ type: 'view_suppliers' }]
                };
            } else {
                return {
                    text: "Nenhum fornecedor cadastrado no momento.",
                    confidence: 0.7,
                    suggestions: ["Cadastrar fornecedor"]
                };
            }
        } catch (error) {
            return {
                text: "Erro ao consultar fornecedores. Tente novamente.",
                confidence: 0.3
            };
        }
    }

    handleHelpRequest(context) {
        const helpTopics = [
            "🔍 Buscar produtos",
            "📦 Verificar estoque",
            "📋 Status de pedidos",
            "👥 Informações de fornecedores",
            "📊 Gerar relatórios",
            "⚙️ Configurações do sistema"
        ];
        
        return {
            text: `Posso ajudar com:\n${helpTopics.join('\n')}\n\nSobre qual tópico você gostaria de saber mais?`,
            confidence: 0.9,
            suggestions: ["Buscar produtos", "Verificar estoque", "Gerar relatórios"]
        };
    }

    async handleReportGeneration(entities, context) {
        const reportTypes = [
            "📈 Relatório de vendas",
            "📦 Relatório de estoque",
            "👥 Relatório de fornecedores",
            "💰 Análise financeira",
            "📊 Dashboard executivo"
        ];
        
        return {
            text: `Posso gerar os seguintes relatórios:\n${reportTypes.join('\n')}\n\nQual relatório você gostaria?`,
            confidence: 0.8,
            actions: [{ type: 'view_reports' }],
            suggestions: ["Relatório de vendas", "Relatório de estoque"]
        };
    }

    handleGoodbye(session) {
        return {
            text: this.getRandomResponse('goodbye'),
            confidence: 0.9
        };
    }

    handleNotUnderstood(context) {
        return {
            text: this.getRandomResponse('not_understood'),
            confidence: 0.3,
            suggestions: [
                "Buscar produto",
                "Verificar estoque",
                "Ajuda",
                "Status do pedido"
            ]
        };
    }

    // Métodos auxiliares
    getOrCreateSession(userId, sessionId) {
        const id = sessionId || `${userId}_${Date.now()}`;
        
        if (!this.userSessions.has(id)) {
            this.userSessions.set(id, {
                id,
                userId,
                startTime: new Date().toISOString(),
                lastActivity: new Date().toISOString(),
                messageCount: 0
            });
        }
        
        const session = this.userSessions.get(id);
        session.lastActivity = new Date().toISOString();
        session.messageCount++;
        
        return session;
    }

    saveConversation(session, conversationData) {
        if (!this.conversationHistory.has(session.id)) {
            this.conversationHistory.set(session.id, []);
        }
        
        this.conversationHistory.get(session.id).push(conversationData);
        
        // Manter apenas as últimas 50 mensagens por sessão
        const history = this.conversationHistory.get(session.id);
        if (history.length > 50) {
            this.conversationHistory.set(session.id, history.slice(-50));
        }
    }

    getRandomResponse(type) {
        const responses = this.responses[type] || this.responses.not_understood;
        return responses[Math.floor(Math.random() * responses.length)];
    }

    getStockLevel(quantity) {
        if (quantity <= 5) {
            return { status: 'Crítico', needsReorder: true };
        } else if (quantity <= 15) {
            return { status: 'Baixo', needsReorder: true };
        } else if (quantity <= 50) {
            return { status: 'Adequado', needsReorder: false };
        } else {
            return { status: 'Alto', needsReorder: false };
        }
    }

    // Métodos de banco de dados
    async searchProducts(searchTerm) {
        try {
            const query = `
                SELECT * FROM produtos 
                WHERE nome LIKE ? OR id = ? 
                LIMIT 5
            `;
            return await this.db.all(query, [`%${searchTerm}%`, searchTerm]);
        } catch (error) {
            console.error('Erro ao buscar produtos:', error);
            return [];
        }
    }

    async getLowStockProducts() {
        try {
            const query = `
                SELECT * FROM produtos 
                WHERE quantidade_estoque <= 15 
                ORDER BY quantidade_estoque ASC 
                LIMIT 10
            `;
            return await this.db.all(query);
        } catch (error) {
            console.error('Erro ao buscar produtos com estoque baixo:', error);
            return [];
        }
    }

    async getRecentOrders() {
        try {
            const query = `
                SELECT * FROM pedidos 
                ORDER BY data_pedido DESC 
                LIMIT 10
            `;
            return await this.db.all(query);
        } catch (error) {
            console.error('Erro ao buscar pedidos:', error);
            return [];
        }
    }

    async getSuppliers() {
        try {
            const query = `
                SELECT * FROM fornecedores 
                ORDER BY nome 
                LIMIT 10
            `;
            return await this.db.all(query);
        } catch (error) {
            console.error('Erro ao buscar fornecedores:', error);
            return [];
        }
    }

    // Métodos de análise
    async getConversationHistory(sessionId) {
        return this.conversationHistory.get(sessionId) || [];
    }

    async getSessionStats(userId) {
        const userSessions = Array.from(this.userSessions.values())
            .filter(session => session.userId === userId);
        
        return {
            totalSessions: userSessions.length,
            totalMessages: userSessions.reduce((sum, session) => sum + session.messageCount, 0),
            lastActivity: userSessions.length > 0 ? 
                Math.max(...userSessions.map(s => new Date(s.lastActivity).getTime())) : null
        };
    }

    async getChatbotStats() {
        const totalSessions = this.userSessions.size;
        const totalConversations = Array.from(this.conversationHistory.values())
            .reduce((sum, history) => sum + history.length, 0);
        
        const intentCounts = {};
        for (const history of this.conversationHistory.values()) {
            for (const conversation of history) {
                const intent = conversation.intent?.name || 'unknown';
                intentCounts[intent] = (intentCounts[intent] || 0) + 1;
            }
        }
        
        return {
            totalSessions,
            totalConversations,
            intentDistribution: intentCounts,
            averageConfidence: this.calculateAverageConfidence(),
            activeUsers: this.getActiveUsersCount()
        };
    }

    calculateAverageConfidence() {
        let totalConfidence = 0;
        let count = 0;
        
        for (const history of this.conversationHistory.values()) {
            for (const conversation of history) {
                if (conversation.confidence) {
                    totalConfidence += conversation.confidence;
                    count++;
                }
            }
        }
        
        return count > 0 ? totalConfidence / count : 0;
    }

    getActiveUsersCount() {
        const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
        return Array.from(this.userSessions.values())
            .filter(session => new Date(session.lastActivity) > oneDayAgo)
            .length;
    }
}

module.exports = ChatbotController;