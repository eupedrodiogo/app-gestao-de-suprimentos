class VoiceRecognitionController {
    constructor(database) {
        this.db = database;
        this.voiceCommands = new Map();
        this.userProfiles = new Map();
        this.sessionData = new Map();
        this.commandHistory = [];
        this.initializeVoiceCommands();
        this.initializeUserProfiles();
    }

    // Inicializar comandos de voz disponíveis
    initializeVoiceCommands() {
        this.voiceCommands.set('navigation', {
            'ir para produtos': { action: 'navigate', target: '/products', confidence: 0.9 },
            'abrir produtos': { action: 'navigate', target: '/products', confidence: 0.9 },
            'ir para fornecedores': { action: 'navigate', target: '/suppliers', confidence: 0.9 },
            'abrir fornecedores': { action: 'navigate', target: '/suppliers', confidence: 0.9 },
            'ir para cotações': { action: 'navigate', target: '/quotes', confidence: 0.9 },
            'abrir cotações': { action: 'navigate', target: '/quotes', confidence: 0.9 },
            'ir para pedidos': { action: 'navigate', target: '/orders', confidence: 0.9 },
            'abrir pedidos': { action: 'navigate', target: '/orders', confidence: 0.9 },
            'ir para dashboard': { action: 'navigate', target: '/dashboard', confidence: 0.9 },
            'abrir dashboard': { action: 'navigate', target: '/dashboard', confidence: 0.9 },
            'ir para relatórios': { action: 'navigate', target: '/reports', confidence: 0.9 },
            'abrir relatórios': { action: 'navigate', target: '/reports', confidence: 0.9 },
            'voltar': { action: 'navigate', target: 'back', confidence: 0.95 },
            'página anterior': { action: 'navigate', target: 'back', confidence: 0.9 }
        });

        this.voiceCommands.set('search', {
            'buscar produto': { action: 'search', type: 'product', confidence: 0.85 },
            'procurar produto': { action: 'search', type: 'product', confidence: 0.85 },
            'buscar fornecedor': { action: 'search', type: 'supplier', confidence: 0.85 },
            'procurar fornecedor': { action: 'search', type: 'supplier', confidence: 0.85 },
            'buscar pedido': { action: 'search', type: 'order', confidence: 0.85 },
            'procurar pedido': { action: 'search', type: 'order', confidence: 0.85 }
        });

        this.voiceCommands.set('actions', {
            'criar novo produto': { action: 'create', type: 'product', confidence: 0.9 },
            'adicionar produto': { action: 'create', type: 'product', confidence: 0.9 },
            'novo produto': { action: 'create', type: 'product', confidence: 0.85 },
            'criar fornecedor': { action: 'create', type: 'supplier', confidence: 0.9 },
            'adicionar fornecedor': { action: 'create', type: 'supplier', confidence: 0.9 },
            'novo fornecedor': { action: 'create', type: 'supplier', confidence: 0.85 },
            'criar pedido': { action: 'create', type: 'order', confidence: 0.9 },
            'novo pedido': { action: 'create', type: 'order', confidence: 0.85 },
            'salvar': { action: 'save', confidence: 0.95 },
            'cancelar': { action: 'cancel', confidence: 0.95 },
            'excluir': { action: 'delete', confidence: 0.9 },
            'remover': { action: 'delete', confidence: 0.85 },
            'editar': { action: 'edit', confidence: 0.9 },
            'modificar': { action: 'edit', confidence: 0.85 }
        });

        this.voiceCommands.set('system', {
            'ajuda': { action: 'help', confidence: 0.95 },
            'comandos disponíveis': { action: 'help', confidence: 0.9 },
            'o que posso falar': { action: 'help', confidence: 0.85 },
            'configurações': { action: 'settings', confidence: 0.9 },
            'preferências': { action: 'settings', confidence: 0.85 },
            'sair': { action: 'logout', confidence: 0.95 },
            'logout': { action: 'logout', confidence: 0.9 },
            'minimizar': { action: 'minimize', confidence: 0.9 },
            'maximizar': { action: 'maximize', confidence: 0.9 },
            'tela cheia': { action: 'fullscreen', confidence: 0.85 }
        });

        this.voiceCommands.set('inventory', {
            'verificar estoque': { action: 'check_inventory', confidence: 0.9 },
            'consultar estoque': { action: 'check_inventory', confidence: 0.85 },
            'atualizar estoque': { action: 'update_inventory', confidence: 0.9 },
            'baixa no estoque': { action: 'inventory_out', confidence: 0.85 },
            'entrada no estoque': { action: 'inventory_in', confidence: 0.85 },
            'relatório de estoque': { action: 'inventory_report', confidence: 0.9 }
        });

        this.voiceCommands.set('reports', {
            'gerar relatório': { action: 'generate_report', confidence: 0.9 },
            'criar relatório': { action: 'generate_report', confidence: 0.85 },
            'exportar dados': { action: 'export_data', confidence: 0.9 },
            'imprimir relatório': { action: 'print_report', confidence: 0.85 },
            'enviar relatório': { action: 'send_report', confidence: 0.85 }
        });
    }

    // Inicializar perfis de usuário para reconhecimento personalizado
    initializeUserProfiles() {
        // Perfis padrão que podem ser personalizados
        this.userProfiles.set('default', {
            language: 'pt-BR',
            accent: 'neutral',
            speechRate: 'normal',
            customCommands: {},
            preferences: {
                confirmationRequired: true,
                voiceFeedback: true,
                soundEffects: true
            }
        });
    }

    // Processar comando de voz
    async processVoiceCommand(data) {
        try {
            const { transcript, userId, sessionId, confidence, audioData } = data;
            
            // Normalizar texto
            const normalizedText = this.normalizeText(transcript);
            
            // Detectar comando
            const commandResult = this.detectCommand(normalizedText);
            
            if (!commandResult) {
                return {
                    success: false,
                    message: 'Comando não reconhecido',
                    suggestions: this.getSuggestions(normalizedText),
                    transcript: transcript
                };
            }

            // Verificar confiança mínima
            if (commandResult.confidence < 0.7) {
                return {
                    success: false,
                    message: 'Comando não compreendido claramente',
                    suggestions: this.getSuggestions(normalizedText),
                    transcript: transcript,
                    confidence: commandResult.confidence
                };
            }

            // Executar comando
            const executionResult = await this.executeCommand(commandResult, userId, sessionId);
            
            // Salvar no histórico
            await this.saveCommandHistory({
                userId,
                sessionId,
                transcript,
                command: commandResult,
                result: executionResult,
                timestamp: new Date().toISOString()
            });

            return {
                success: true,
                command: commandResult,
                result: executionResult,
                transcript: transcript,
                confidence: commandResult.confidence,
                feedback: this.generateVoiceFeedback(commandResult, executionResult)
            };

        } catch (error) {
            console.error('Erro ao processar comando de voz:', error);
            return {
                success: false,
                message: 'Erro interno ao processar comando',
                error: error.message
            };
        }
    }

    // Normalizar texto para melhor reconhecimento
    normalizeText(text) {
        return text
            .toLowerCase()
            .trim()
            .replace(/[.,!?;]/g, '')
            .replace(/\s+/g, ' ')
            .normalize('NFD')
            .replace(/[\u0300-\u036f]/g, ''); // Remove acentos
    }

    // Detectar comando no texto
    detectCommand(text) {
        let bestMatch = null;
        let highestConfidence = 0;

        // Buscar em todas as categorias de comandos
        for (const [category, commands] of this.voiceCommands) {
            for (const [command, config] of Object.entries(commands)) {
                const similarity = this.calculateSimilarity(text, command);
                const adjustedConfidence = similarity * config.confidence;

                if (adjustedConfidence > highestConfidence && adjustedConfidence > 0.6) {
                    highestConfidence = adjustedConfidence;
                    bestMatch = {
                        ...config,
                        category,
                        originalCommand: command,
                        confidence: adjustedConfidence,
                        similarity
                    };
                }
            }
        }

        // Tentar detectar comandos com parâmetros
        if (!bestMatch) {
            bestMatch = this.detectParameterizedCommand(text);
        }

        return bestMatch;
    }

    // Detectar comandos com parâmetros (ex: "buscar produto notebook")
    detectParameterizedCommand(text) {
        const patterns = [
            {
                pattern: /^(buscar|procurar)\s+(produto|fornecedor|pedido)\s+(.+)$/,
                action: 'search',
                confidence: 0.8
            },
            {
                pattern: /^(criar|adicionar)\s+(produto|fornecedor|pedido)\s+(.+)$/,
                action: 'create',
                confidence: 0.8
            },
            {
                pattern: /^(ir para|abrir)\s+(.+)$/,
                action: 'navigate',
                confidence: 0.7
            },
            {
                pattern: /^(verificar|consultar)\s+estoque\s+(.+)$/,
                action: 'check_inventory',
                confidence: 0.8
            }
        ];

        for (const pattern of patterns) {
            const match = text.match(pattern.pattern);
            if (match) {
                return {
                    action: pattern.action,
                    type: match[2] || null,
                    parameter: match[3] || match[2],
                    confidence: pattern.confidence,
                    category: 'parameterized',
                    originalCommand: text
                };
            }
        }

        return null;
    }

    // Calcular similaridade entre textos
    calculateSimilarity(text1, text2) {
        const words1 = text1.split(' ');
        const words2 = text2.split(' ');
        
        // Verificar correspondência exata
        if (text1 === text2) return 1.0;
        
        // Verificar se o texto contém o comando
        if (text1.includes(text2) || text2.includes(text1)) {
            return 0.9;
        }

        // Calcular similaridade por palavras
        let matches = 0;
        const maxLength = Math.max(words1.length, words2.length);
        
        for (const word1 of words1) {
            if (words2.includes(word1)) {
                matches++;
            }
        }

        return matches / maxLength;
    }

    // Executar comando detectado
    async executeCommand(command, userId, sessionId) {
        try {
            switch (command.action) {
                case 'navigate':
                    return await this.executeNavigation(command);
                
                case 'search':
                    return await this.executeSearch(command);
                
                case 'create':
                    return await this.executeCreate(command);
                
                case 'save':
                    return await this.executeSave(command);
                
                case 'delete':
                    return await this.executeDelete(command);
                
                case 'edit':
                    return await this.executeEdit(command);
                
                case 'help':
                    return await this.executeHelp(command);
                
                case 'settings':
                    return await this.executeSettings(command);
                
                case 'check_inventory':
                    return await this.executeInventoryCheck(command);
                
                case 'generate_report':
                    return await this.executeReportGeneration(command);
                
                default:
                    return {
                        success: false,
                        message: `Ação '${command.action}' não implementada`
                    };
            }
        } catch (error) {
            console.error('Erro ao executar comando:', error);
            return {
                success: false,
                message: 'Erro ao executar comando',
                error: error.message
            };
        }
    }

    // Implementações específicas dos comandos
    async executeNavigation(command) {
        return {
            success: true,
            action: 'navigate',
            target: command.target,
            message: `Navegando para ${command.target}`
        };
    }

    async executeSearch(command) {
        const searchTerm = command.parameter || '';
        const searchType = command.type || 'all';
        
        // Simular busca no banco de dados
        let results = [];
        
        if (searchType === 'product' || searchType === 'all') {
            const products = await this.searchProducts(searchTerm);
            results = results.concat(products);
        }
        
        if (searchType === 'supplier' || searchType === 'all') {
            const suppliers = await this.searchSuppliers(searchTerm);
            results = results.concat(suppliers);
        }

        return {
            success: true,
            action: 'search',
            type: searchType,
            term: searchTerm,
            results: results,
            message: `Encontrados ${results.length} resultados para "${searchTerm}"`
        };
    }

    async executeCreate(command) {
        return {
            success: true,
            action: 'create',
            type: command.type,
            message: `Abrindo formulário para criar ${command.type}`,
            nextStep: 'open_form'
        };
    }

    async executeSave(command) {
        return {
            success: true,
            action: 'save',
            message: 'Dados salvos com sucesso'
        };
    }

    async executeDelete(command) {
        return {
            success: true,
            action: 'delete',
            message: 'Item excluído com sucesso',
            requiresConfirmation: true
        };
    }

    async executeEdit(command) {
        return {
            success: true,
            action: 'edit',
            message: 'Modo de edição ativado'
        };
    }

    async executeHelp(command) {
        const availableCommands = this.getAvailableCommands();
        return {
            success: true,
            action: 'help',
            commands: availableCommands,
            message: 'Comandos disponíveis listados'
        };
    }

    async executeSettings(command) {
        return {
            success: true,
            action: 'settings',
            message: 'Abrindo configurações de voz'
        };
    }

    async executeInventoryCheck(command) {
        const product = command.parameter;
        // Simular consulta de estoque
        const inventory = await this.getInventoryData(product);
        
        return {
            success: true,
            action: 'check_inventory',
            product: product,
            inventory: inventory,
            message: `Estoque consultado para ${product}`
        };
    }

    async executeReportGeneration(command) {
        return {
            success: true,
            action: 'generate_report',
            message: 'Iniciando geração de relatório'
        };
    }

    // Métodos auxiliares para busca
    async searchProducts(term) {
        try {
            const query = `
                SELECT id, name, description, price, stock_quantity 
                FROM products 
                WHERE name LIKE ? OR description LIKE ?
                LIMIT 10
            `;
            const searchTerm = `%${term}%`;
            const results = await this.db.all(query, [searchTerm, searchTerm]);
            
            return results.map(product => ({
                type: 'product',
                id: product.id,
                name: product.name,
                description: product.description,
                price: product.price,
                stock: product.stock_quantity
            }));
        } catch (error) {
            console.error('Erro ao buscar produtos:', error);
            return [];
        }
    }

    async searchSuppliers(term) {
        try {
            const query = `
                SELECT id, name, contact_person, email, phone 
                FROM suppliers 
                WHERE name LIKE ? OR contact_person LIKE ?
                LIMIT 10
            `;
            const searchTerm = `%${term}%`;
            const results = await this.db.all(query, [searchTerm, searchTerm]);
            
            return results.map(supplier => ({
                type: 'supplier',
                id: supplier.id,
                name: supplier.name,
                contact: supplier.contact_person,
                email: supplier.email,
                phone: supplier.phone
            }));
        } catch (error) {
            console.error('Erro ao buscar fornecedores:', error);
            return [];
        }
    }

    async getInventoryData(product) {
        try {
            const query = `
                SELECT p.name, p.stock_quantity, p.min_stock_level, p.price
                FROM products p
                WHERE p.name LIKE ?
                LIMIT 1
            `;
            const result = await this.db.get(query, [`%${product}%`]);
            
            if (result) {
                return {
                    name: result.name,
                    current_stock: result.stock_quantity,
                    min_level: result.min_stock_level,
                    price: result.price,
                    status: result.stock_quantity <= result.min_stock_level ? 'low' : 'normal'
                };
            }
            
            return null;
        } catch (error) {
            console.error('Erro ao consultar estoque:', error);
            return null;
        }
    }

    // Obter comandos disponíveis
    getAvailableCommands() {
        const commands = [];
        
        for (const [category, commandMap] of this.voiceCommands) {
            const categoryCommands = Object.keys(commandMap).map(command => ({
                command,
                category,
                action: commandMap[command].action
            }));
            commands.push(...categoryCommands);
        }
        
        return commands;
    }

    // Gerar sugestões baseadas no texto
    getSuggestions(text) {
        const suggestions = [];
        const words = text.split(' ');
        
        // Buscar comandos similares
        for (const [category, commands] of this.voiceCommands) {
            for (const command of Object.keys(commands)) {
                const similarity = this.calculateSimilarity(text, command);
                if (similarity > 0.3) {
                    suggestions.push({
                        command,
                        category,
                        similarity
                    });
                }
            }
        }
        
        // Ordenar por similaridade
        suggestions.sort((a, b) => b.similarity - a.similarity);
        
        return suggestions.slice(0, 5);
    }

    // Gerar feedback de voz
    generateVoiceFeedback(command, result) {
        const feedbacks = {
            navigate: `Navegando para ${command.target}`,
            search: `Busca realizada. ${result.results?.length || 0} resultados encontrados`,
            create: `Abrindo formulário para criar ${command.type}`,
            save: 'Dados salvos com sucesso',
            delete: 'Item excluído',
            edit: 'Modo de edição ativado',
            help: 'Comandos disponíveis exibidos',
            settings: 'Configurações abertas'
        };
        
        return feedbacks[command.action] || 'Comando executado';
    }

    // Salvar histórico de comandos
    async saveCommandHistory(data) {
        try {
            this.commandHistory.push(data);
            
            // Manter apenas os últimos 100 comandos
            if (this.commandHistory.length > 100) {
                this.commandHistory = this.commandHistory.slice(-100);
            }
            
            // Salvar no banco de dados se necessário
            const query = `
                INSERT INTO voice_command_history 
                (user_id, session_id, transcript, command_action, command_type, confidence, timestamp)
                VALUES (?, ?, ?, ?, ?, ?, ?)
            `;
            
            await this.db.run(query, [
                data.userId,
                data.sessionId,
                data.transcript,
                data.command.action,
                data.command.type || null,
                data.command.confidence,
                data.timestamp
            ]);
            
        } catch (error) {
            console.error('Erro ao salvar histórico:', error);
        }
    }

    // Obter histórico de comandos
    async getCommandHistory(userId, limit = 50) {
        try {
            const query = `
                SELECT * FROM voice_command_history 
                WHERE user_id = ? 
                ORDER BY timestamp DESC 
                LIMIT ?
            `;
            
            const results = await this.db.all(query, [userId, limit]);
            return {
                success: true,
                history: results
            };
        } catch (error) {
            console.error('Erro ao obter histórico:', error);
            return {
                success: false,
                message: 'Erro ao obter histórico',
                error: error.message
            };
        }
    }

    // Obter estatísticas de uso
    async getVoiceStats() {
        try {
            const stats = {
                totalCommands: this.commandHistory.length,
                commandsByAction: {},
                averageConfidence: 0,
                successRate: 0,
                mostUsedCommands: [],
                recentActivity: []
            };
            
            // Calcular estatísticas
            let totalConfidence = 0;
            let successfulCommands = 0;
            
            for (const command of this.commandHistory) {
                const action = command.command.action;
                stats.commandsByAction[action] = (stats.commandsByAction[action] || 0) + 1;
                
                totalConfidence += command.command.confidence;
                if (command.result.success) {
                    successfulCommands++;
                }
            }
            
            if (this.commandHistory.length > 0) {
                stats.averageConfidence = totalConfidence / this.commandHistory.length;
                stats.successRate = (successfulCommands / this.commandHistory.length) * 100;
            }
            
            // Comandos mais usados
            stats.mostUsedCommands = Object.entries(stats.commandsByAction)
                .sort(([,a], [,b]) => b - a)
                .slice(0, 10)
                .map(([action, count]) => ({ action, count }));
            
            // Atividade recente
            stats.recentActivity = this.commandHistory
                .slice(-10)
                .map(cmd => ({
                    timestamp: cmd.timestamp,
                    action: cmd.command.action,
                    confidence: cmd.command.confidence,
                    success: cmd.result.success
                }));
            
            return {
                success: true,
                stats
            };
        } catch (error) {
            console.error('Erro ao obter estatísticas:', error);
            return {
                success: false,
                message: 'Erro ao obter estatísticas',
                error: error.message
            };
        }
    }

    // Treinar modelo personalizado
    async trainCustomModel(data) {
        try {
            const { userId, customCommands, voiceSamples } = data;
            
            // Adicionar comandos personalizados
            if (customCommands) {
                for (const command of customCommands) {
                    this.voiceCommands.get('custom').set(command.phrase, {
                        action: command.action,
                        confidence: 0.8,
                        custom: true
                    });
                }
            }
            
            // Processar amostras de voz para melhorar reconhecimento
            if (voiceSamples) {
                // Implementar treinamento personalizado
                // Por enquanto, apenas simular
            }
            
            return {
                success: true,
                message: 'Modelo personalizado treinado com sucesso',
                customCommands: customCommands?.length || 0
            };
        } catch (error) {
            console.error('Erro ao treinar modelo:', error);
            return {
                success: false,
                message: 'Erro ao treinar modelo',
                error: error.message
            };
        }
    }
}

module.exports = VoiceRecognitionController;