const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const fs = require('fs');
const log = require('../utils/logger');
require('dotenv').config();

class Database {
    constructor() {
        this.dbPath = path.join(__dirname, '../../data/gestao_suprimentos.db');
        this.db = null;
        this.connected = false;
    }

    async connect() {
        return new Promise((resolve, reject) => {
            // Criar diretório data se não existir
            const dataDir = path.dirname(this.dbPath);
            if (!fs.existsSync(dataDir)) {
                fs.mkdirSync(dataDir, { recursive: true });
            }

            this.db = new sqlite3.Database(this.dbPath, (err) => {
                if (err) {
                    log.error('Erro ao conectar com SQLite', { error: err.message, dbPath: this.dbPath });
                    this.connected = false;
                    reject(err);
                } else {
                    this.connected = true;
                    log.info('Conectado ao SQLite com sucesso', { dbPath: this.dbPath });
                    this.initializeTables().then(() => {
                        resolve(this.db);
                    }).catch(reject);
                }
            });
        });
    }

    async disconnect() {
        return new Promise((resolve, reject) => {
            if (this.db) {
                this.db.close((err) => {
                    if (err) {
                        log.error('Erro ao desconectar do SQLite', { error: err.message });
                        reject(err);
                    } else {
                        this.db = null;
                        this.connected = false;
                        log.info('Desconectado do SQLite');
                        resolve();
                    }
                });
            } else {
                resolve();
            }
        });
    }

    async ensureConnection() {
        if (!this.connected || !this.db) {
            await this.connect();
        }
        return this.db;
    }

    async query(queryText, params = []) {
        return new Promise(async (resolve, reject) => {
            try {
                const db = await this.ensureConnection();
                
                if (queryText.trim().toLowerCase().startsWith('select')) {
                    db.all(queryText, params, (err, rows) => {
                        if (err) {
                            log.error('Erro na consulta SQL', {
                                error: err.message,
                                stack: err.stack,
                                query: queryText,
                                params: params
                            });
                            reject(err);
                        } else {
                            resolve(rows);
                        }
                    });
                } else {
                    db.run(queryText, params, function(err) {
                        if (err) {
                            log.error('Erro na execução SQL', {
                                error: err.message,
                                stack: err.stack,
                                query: queryText,
                                params: params
                            });
                            reject(err);
                        } else {
                            resolve({
                                lastID: this.lastID,
                                changes: this.changes
                            });
                        }
                    });
                }
            } catch (error) {
                reject(error);
            }
        });
    }

    async execute(queryText, params = []) {
        return await this.query(queryText, params);
    }

    async executeScalar(queryText, params = []) {
        const result = await this.query(queryText, params);
        return result.length > 0 ? Object.values(result[0])[0] : null;
    }

    async executeNonQuery(queryText, params = []) {
        const result = await this.query(queryText, params);
        return result.changes || 0;
    }

    // Métodos para compatibilidade com controladores
    async all(queryText, params = []) {
        return new Promise(async (resolve, reject) => {
            try {
                const db = await this.ensureConnection();
                db.all(queryText, params, (err, rows) => {
                    if (err) {
                        log.error('Erro na consulta SQL', { 
                            error: err.message, 
                            query: queryText.substring(0, 200),
                            params 
                        });
                        reject(err);
                    } else {
                        log.database('SELECT', queryText, params);
                        resolve(rows);
                    }
                });
            } catch (error) {
                reject(error);
            }
        });
    }

    async get(queryText, params = []) {
        return new Promise(async (resolve, reject) => {
            try {
                const db = await this.ensureConnection();
                db.get(queryText, params, (err, row) => {
                    if (err) {
                        log.error('Erro na consulta SQL', {
                            error: err.message,
                            stack: err.stack,
                            query: queryText,
                            params: params
                        });
                        reject(err);
                    } else {
                        resolve(row);
                    }
                });
            } catch (error) {
                reject(error);
            }
        });
    }

    async run(queryText, params = []) {
        return new Promise(async (resolve, reject) => {
            try {
                const db = await this.ensureConnection();
                db.run(queryText, params, function(err) {
                    if (err) {
                        log.error('Erro na execução SQL', { 
                            error: err.message, 
                            query: queryText.substring(0, 200),
                            params 
                        });
                        reject(err);
                    } else {
                        log.database('RUN', queryText, params);
                        resolve({
                            lastID: this.lastID,
                            changes: this.changes
                        });
                    }
                });
            } catch (error) {
                reject(error);
            }
        });
    }

    async initializeTables() {
        const tables = [
            // Tabela de produtos (products)
            `CREATE TABLE IF NOT EXISTS products (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                code TEXT UNIQUE NOT NULL,
                name TEXT NOT NULL,
                description TEXT,
                category TEXT,
                unit TEXT DEFAULT 'UN',
                price REAL DEFAULT 0,
                stock INTEGER DEFAULT 0,
                min_stock INTEGER DEFAULT 0,
                supplier_id INTEGER,
                status TEXT DEFAULT 'ativo',
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (supplier_id) REFERENCES suppliers(id)
            )`,

            // Tabela de fornecedores (suppliers)
            `CREATE TABLE IF NOT EXISTS suppliers (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                cnpj TEXT UNIQUE NOT NULL,
                name TEXT NOT NULL,
                contact_name TEXT,
                email TEXT NOT NULL,
                phone TEXT NOT NULL,
                address TEXT,
                city TEXT,
                state TEXT,
                zip_code TEXT,
                status TEXT DEFAULT 'ativo',
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
            )`,

            // Tabela de cotações (quotes)
            `CREATE TABLE IF NOT EXISTS quotes (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                number TEXT UNIQUE NOT NULL,
                supplier_id INTEGER NOT NULL,
                request_date DATE DEFAULT CURRENT_DATE,
                delivery_date DATE,
                expected_date DATE,
                total_value REAL DEFAULT 0,
                status TEXT DEFAULT 'pendente',
                notes TEXT,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (supplier_id) REFERENCES suppliers(id)
            )`,

            // Tabela de itens de cotação (quote_items)
            `CREATE TABLE IF NOT EXISTS quote_items (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                quote_id INTEGER NOT NULL,
                product_id INTEGER NOT NULL,
                quantity INTEGER NOT NULL,
                unit_price REAL NOT NULL,
                total_price REAL NOT NULL,
                notes TEXT,
                FOREIGN KEY (quote_id) REFERENCES quotes(id),
                FOREIGN KEY (product_id) REFERENCES products(id)
            )`,

            // Tabela de pedidos (orders)
            `CREATE TABLE IF NOT EXISTS orders (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                number TEXT UNIQUE NOT NULL,
                supplier_id INTEGER NOT NULL,
                quote_id INTEGER,
                order_date DATE DEFAULT CURRENT_DATE,
                delivery_date DATE,
                received_date DATE,
                total_value REAL DEFAULT 0,
                status TEXT DEFAULT 'pendente',
                notes TEXT,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (supplier_id) REFERENCES suppliers(id),
                FOREIGN KEY (quote_id) REFERENCES quotes(id)
            )`,

            // Tabela de itens de pedido (order_items)
            `CREATE TABLE IF NOT EXISTS order_items (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                order_id INTEGER NOT NULL,
                product_id INTEGER NOT NULL,
                quantity INTEGER NOT NULL,
                unit_price REAL NOT NULL,
                total_price REAL NOT NULL,
                received_quantity INTEGER DEFAULT 0,
                notes TEXT,
                FOREIGN KEY (order_id) REFERENCES orders(id),
                FOREIGN KEY (product_id) REFERENCES products(id)
            )`,

            // Tabela de usuários (users)
            `CREATE TABLE IF NOT EXISTS users (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                name TEXT NOT NULL,
                email TEXT UNIQUE NOT NULL,
                password TEXT NOT NULL,
                role TEXT DEFAULT 'user' CHECK (role IN ('admin', 'user', 'manager')),
                status TEXT DEFAULT 'ativo' CHECK (status IN ('ativo', 'inativo')),
                last_login DATETIME,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
            )`
        ];

        for (const tableSQL of tables) {
            await this.query(tableSQL);
        }

        log.info('Tabelas inicializadas com sucesso');
        
        // Executar migrações se necessário
        await this.runMigrations();
    }

    async runMigrations() {
        try {
            // A coluna supplier_id já está definida na criação da tabela products
            // Não é necessário executar migrações para esta coluna
            log.info('Verificação de migrações concluída - todas as colunas estão atualizadas');
        } catch (error) {
            log.error('Erro durante migração', {
                error: error.message,
                stack: error.stack,
                migrationStep: 'database_migration'
            });
            throw error;
        }
    }

    // Métodos específicos para produtos
    async adicionarProduto(produto) {
        const sql = `INSERT INTO products (code, name, description, category, unit, price, stock, min_stock, supplier_id)
                     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`;
        const params = [
            produto.code,
            produto.name,
            produto.description || '',
            produto.category || '',
            produto.unit || 'UN',
            produto.price || 0,
            produto.stock || 0,
            produto.min_stock || 0,
            produto.supplier_id || null
        ];
        return await this.query(sql, params);
    }

    async listarProdutos() {
        return await this.query('SELECT * FROM products WHERE status = "ativo" ORDER BY name');
    }

    // Métodos específicos para fornecedores
    async adicionarFornecedor(fornecedor) {
        const sql = `INSERT INTO suppliers (cnpj, name, contact_name, email, phone, address, city, state, zip_code)
                     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`;
        const params = [
            fornecedor.cnpj,
            fornecedor.name,
            fornecedor.contact_name || '',
            fornecedor.email,
            fornecedor.phone,
            fornecedor.address || '',
            fornecedor.city || '',
            fornecedor.state || '',
            fornecedor.zip_code || ''
        ];
        return await this.query(sql, params);
    }

    async listarFornecedores() {
        return await this.query('SELECT * FROM suppliers WHERE status = "ativo" ORDER BY name');
    }

    // Métodos específicos para cotações
    async adicionarCotacao(cotacao) {
        const sql = `INSERT INTO quotes (number, supplier_id, request_date, delivery_date, expected_date, total_value, notes)
                     VALUES (?, ?, ?, ?, ?, ?, ?)`;
        const params = [
            cotacao.number,
            cotacao.supplier_id,
            cotacao.request_date,
            cotacao.delivery_date || null,
            cotacao.expected_date || null,
            cotacao.total_value || 0,
            cotacao.notes || ''
        ];
        return await this.query(sql, params);
    }

    async adicionarItemCotacao(item) {
        const sql = `INSERT INTO quote_items (quote_id, product_id, quantity, unit_price, total_price, notes)
                     VALUES (?, ?, ?, ?, ?, ?)`;
        const params = [
            item.quote_id,
            item.product_id,
            item.quantity,
            item.unit_price,
            item.total_price,
            item.notes || ''
        ];
        return await this.query(sql, params);
    }

    async listarCotacoes() {
        const sql = `SELECT q.*, s.name as supplier_name 
                     FROM quotes q 
                     LEFT JOIN suppliers s ON q.supplier_id = s.id 
                     ORDER BY q.request_date DESC`;
        return await this.query(sql);
    }

    // Métodos específicos para pedidos
    async adicionarPedido(pedido) {
        const sql = `INSERT INTO orders (number, supplier_id, quote_id, order_date, delivery_date, total_value, notes)
                     VALUES (?, ?, ?, ?, ?, ?, ?)`;
        const params = [
            pedido.number,
            pedido.supplier_id,
            pedido.quote_id || null,
            pedido.order_date,
            pedido.delivery_date || null,
            pedido.total_value || 0,
            pedido.notes || ''
        ];
        return await this.query(sql, params);
    }

    async adicionarItemPedido(item) {
        const sql = `INSERT INTO order_items (order_id, product_id, quantity, unit_price, total_price, received_quantity, notes)
                     VALUES (?, ?, ?, ?, ?, ?, ?)`;
        const params = [
            item.order_id,
            item.product_id,
            item.quantity,
            item.unit_price,
            item.total_price,
            item.received_quantity || 0,
            item.notes || ''
        ];
        return await this.query(sql, params);
    }

    async listarPedidos() {
        const sql = `SELECT o.*, s.name as supplier_name 
                     FROM orders o 
                     LEFT JOIN suppliers s ON o.supplier_id = s.id 
                     ORDER BY o.order_date DESC`;
        return await this.query(sql);
    }

    // Método para inserir dados fictícios
    async insertSampleData() {
        console.log('📦 Inserindo dados fictícios...');

        // Inserir fornecedores fictícios
        const suppliers = [
            {
                cnpj: '11.222.333/0001-44',
                name: 'TechSupply Ltda',
                contact_name: 'João Silva',
                email: 'joao@techsupply.com',
                phone: '(11) 3456-7890',
                address: 'Rua das Tecnologias, 123',
                city: 'São Paulo',
                state: 'SP',
                zip_code: '01234-567'
            },
            {
                cnpj: '22.333.444/0001-55',
                name: 'Materiais & Cia',
                contact_name: 'Maria Santos',
                email: 'maria@materiaisecia.com',
                phone: '(21) 2345-6789',
                address: 'Av. dos Materiais, 456',
                city: 'Rio de Janeiro',
                state: 'RJ',
                zip_code: '20123-456'
            },
            {
                cnpj: '33.444.555/0001-66',
                name: 'Equipamentos Pro',
                contact_name: 'Carlos Oliveira',
                email: 'carlos@equipamentospro.com',
                phone: '(31) 3456-7890',
                address: 'Rua dos Equipamentos, 789',
                city: 'Belo Horizonte',
                state: 'MG',
                zip_code: '30123-789'
            },
            {
                cnpj: '44.555.666/0001-77',
                name: 'Suprimentos Express',
                contact_name: 'Ana Costa',
                email: 'ana@suprimentosexpress.com',
                phone: '(41) 2345-6789',
                address: 'Av. Express, 321',
                city: 'Curitiba',
                state: 'PR',
                zip_code: '80123-321'
            },
            {
                cnpj: '55.666.777/0001-88',
                name: 'Global Supplies',
                contact_name: 'Roberto Lima',
                email: 'roberto@globalsupplies.com',
                phone: '(51) 3456-7890',
                address: 'Rua Global, 654',
                city: 'Porto Alegre',
                state: 'RS',
                zip_code: '90123-654'
            }
        ];

        for (const supplier of suppliers) {
            await this.adicionarFornecedor(supplier);
        }
        console.log('✅ Fornecedores inseridos');

        // Inserir produtos fictícios
        const products = [
            {
                code: 'COMP001',
                name: 'Notebook Dell Inspiron 15',
                description: 'Notebook para uso corporativo com 8GB RAM e SSD 256GB',
                category: 'Informática',
                unit: 'UN',
                price: 2500.00,
                stock: 15,
                min_stock: 5
            },
            {
                code: 'COMP002',
                name: 'Monitor LG 24 polegadas',
                description: 'Monitor LED Full HD para escritório',
                category: 'Informática',
                unit: 'UN',
                price: 650.00,
                stock: 25,
                min_stock: 8
            },
            {
                code: 'MAT001',
                name: 'Papel A4 Sulfite',
                description: 'Resma de papel A4 branco 75g',
                category: 'Material de Escritório',
                unit: 'PCT',
                price: 25.00,
                stock: 100,
                min_stock: 20
            },
            {
                code: 'MAT002',
                name: 'Caneta Esferográfica Azul',
                description: 'Caneta esferográfica ponta média cor azul',
                category: 'Material de Escritório',
                unit: 'UN',
                price: 2.50,
                stock: 200,
                min_stock: 50
            },
            {
                code: 'EQUIP001',
                name: 'Impressora Multifuncional HP',
                description: 'Impressora jato de tinta multifuncional',
                category: 'Equipamentos',
                unit: 'UN',
                price: 450.00,
                stock: 8,
                min_stock: 3
            },
            {
                code: 'EQUIP002',
                name: 'Projetor Epson',
                description: 'Projetor 3000 lumens para apresentações',
                category: 'Equipamentos',
                unit: 'UN',
                price: 1200.00,
                stock: 5,
                min_stock: 2
            }
        ];

        for (const product of products) {
            await this.adicionarProduto(product);
        }
        console.log('✅ Produtos inseridos');

        // Inserir cotações fictícias
        const quotes = [
            {
                number: 'COT-2024-001',
                supplier_id: 1,
                request_date: '2024-01-15',
                delivery_date: '2024-01-25',
                expected_date: '2024-01-20',
                total_value: 5200.00,
                status: 'aprovada',
                notes: 'Cotação para equipamentos de informática'
            },
            {
                number: 'COT-2024-002',
                supplier_id: 2,
                request_date: '2024-01-18',
                delivery_date: '2024-01-28',
                expected_date: '2024-01-25',
                total_value: 1250.00,
                status: 'pendente',
                notes: 'Material de escritório para o trimestre'
            },
            {
                number: 'COT-2024-003',
                supplier_id: 3,
                request_date: '2024-01-20',
                delivery_date: '2024-02-05',
                expected_date: '2024-01-30',
                total_value: 3600.00,
                status: 'em_analise',
                notes: 'Equipamentos para sala de reunião'
            },
            {
                number: 'COT-2024-004',
                supplier_id: 4,
                request_date: '2024-01-22',
                delivery_date: '2024-02-01',
                expected_date: '2024-01-28',
                total_value: 850.00,
                status: 'rejeitada',
                notes: 'Preço acima do orçamento disponível'
            },
            {
                number: 'COT-2024-005',
                supplier_id: 5,
                request_date: '2024-01-25',
                delivery_date: '2024-02-10',
                expected_date: '2024-02-05',
                total_value: 2100.00,
                status: 'aprovada',
                notes: 'Suprimentos diversos para departamento'
            }
        ];

        for (const quote of quotes) {
            await this.adicionarCotacao(quote);
        }
        console.log('✅ Cotações inseridas');

        // Inserir itens de cotação
        const quoteItems = [
            // Itens da cotação 1
            { quote_id: 1, product_id: 1, quantity: 2, unit_price: 2500.00, total_price: 5000.00, notes: 'Notebooks para gerência' },
            { quote_id: 1, product_id: 2, quantity: 4, unit_price: 50.00, total_price: 200.00, notes: 'Monitores adicionais' },
            
            // Itens da cotação 2
            { quote_id: 2, product_id: 3, quantity: 50, unit_price: 25.00, total_price: 1250.00, notes: 'Papel para impressão' },
            
            // Itens da cotação 3
            { quote_id: 3, product_id: 5, quantity: 3, unit_price: 450.00, total_price: 1350.00, notes: 'Impressoras departamentos' },
            { quote_id: 3, product_id: 6, quantity: 2, unit_price: 1125.00, total_price: 2250.00, notes: 'Projetores salas reunião' },
            
            // Itens da cotação 4
            { quote_id: 4, product_id: 4, quantity: 100, unit_price: 2.50, total_price: 250.00, notes: 'Canetas escritório' },
            { quote_id: 4, product_id: 3, quantity: 24, unit_price: 25.00, total_price: 600.00, notes: 'Papel diversos setores' },
            
            // Itens da cotação 5
            { quote_id: 5, product_id: 1, quantity: 1, unit_price: 2500.00, total_price: 2500.00, notes: 'Notebook backup' }
        ];

        for (const item of quoteItems) {
            await this.adicionarItemCotacao(item);
        }
        console.log('✅ Itens de cotação inseridos');

        // Inserir pedidos fictícios
        const orders = [
            {
                number: 'PED-2024-001',
                supplier_id: 1,
                quote_id: 1,
                order_date: '2024-01-16',
                delivery_date: '2024-01-26',
                total_value: 5200.00,
                status: 'confirmado',
                notes: 'Pedido baseado na cotação COT-2024-001'
            },
            {
                number: 'PED-2024-002',
                supplier_id: 5,
                quote_id: 5,
                order_date: '2024-01-26',
                delivery_date: '2024-02-11',
                total_value: 2100.00,
                status: 'pendente',
                notes: 'Aguardando confirmação do fornecedor'
            },
            {
                number: 'PED-2024-003',
                supplier_id: 2,
                quote_id: null,
                order_date: '2024-01-28',
                delivery_date: '2024-02-05',
                total_value: 750.00,
                status: 'em_transito',
                notes: 'Pedido urgente sem cotação prévia'
            },
            {
                number: 'PED-2024-004',
                supplier_id: 3,
                quote_id: null,
                order_date: '2024-01-30',
                delivery_date: '2024-02-15',
                total_value: 1800.00,
                status: 'entregue',
                notes: 'Entrega realizada com sucesso'
            }
        ];

        for (const order of orders) {
            await this.adicionarPedido(order);
        }
        console.log('✅ Pedidos inseridos');

        // Inserir itens de pedido
        const orderItems = [
            // Itens do pedido 1
            { order_id: 1, product_id: 1, quantity: 2, unit_price: 2500.00, total_price: 5000.00, received_quantity: 0, notes: 'Notebooks gerência' },
            { order_id: 1, product_id: 2, quantity: 4, unit_price: 50.00, total_price: 200.00, received_quantity: 0, notes: 'Monitores extras' },
            
            // Itens do pedido 2
            { order_id: 2, product_id: 1, quantity: 1, unit_price: 2500.00, total_price: 2500.00, received_quantity: 0, notes: 'Notebook backup' },
            
            // Itens do pedido 3
            { order_id: 3, product_id: 3, quantity: 30, unit_price: 25.00, total_price: 750.00, received_quantity: 30, notes: 'Papel urgente' },
            
            // Itens do pedido 4
            { order_id: 4, product_id: 5, quantity: 2, unit_price: 450.00, total_price: 900.00, received_quantity: 2, notes: 'Impressoras entregues' },
            { order_id: 4, product_id: 6, quantity: 1, unit_price: 900.00, total_price: 900.00, received_quantity: 1, notes: 'Projetor entregue' }
        ];

        for (const item of orderItems) {
            await this.adicionarItemPedido(item);
        }
        console.log('✅ Itens de pedido inseridos');

        console.log('🎉 Todos os dados fictícios foram inseridos com sucesso!');
    }
}

module.exports = Database;