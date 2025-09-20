const sql = require('mssql');
const path = require('path');
require('dotenv').config();

class Database {
    constructor() {
        this.config = {
            server: process.env.DB_SERVER || 'localhost',
            port: parseInt(process.env.DB_PORT) || 1433,
            database: process.env.DB_DATABASE || 'GestaoSuprimentos',
            user: process.env.DB_USER || 'sa',
            password: process.env.DB_PASSWORD || '',
            options: {
                encrypt: process.env.DB_ENCRYPT === 'true',
                trustServerCertificate: process.env.DB_TRUST_SERVER_CERTIFICATE === 'true',
                enableArithAbort: true,
                requestTimeout: 30000,
                connectionTimeout: 30000
            },
            pool: {
                max: 10,
                min: 0,
                idleTimeoutMillis: 30000
            }
        };
        
        this.pool = null;
        this.connected = false;
    }

    async connect() {
        try {
            if (this.pool) {
                await this.pool.close();
            }
            
            this.pool = await sql.connect(this.config);
            this.connected = true;
            console.log('✅ Conectado ao SQL Server com sucesso!');
            return this.pool;
        } catch (error) {
            console.error('❌ Erro ao conectar com SQL Server:', error.message);
            this.connected = false;
            throw error;
        }
    }

    async disconnect() {
        try {
            if (this.pool) {
                await this.pool.close();
                this.pool = null;
                this.connected = false;
                console.log('✅ Desconectado do SQL Server');
            }
        } catch (error) {
            console.error('❌ Erro ao desconectar do SQL Server:', error.message);
            throw error;
        }
    }

    async ensureConnection() {
        if (!this.connected || !this.pool) {
            await this.connect();
        }
        return this.pool;
    }

    async query(queryText, params = []) {
        try {
            const pool = await this.ensureConnection();
            const request = pool.request();
            
            // Adicionar parâmetros se fornecidos
            if (params && params.length > 0) {
                params.forEach((param, index) => {
                    request.input(`param${index}`, param);
                });
                
                // Substituir ? por @param0, @param1, etc.
                let paramIndex = 0;
                queryText = queryText.replace(/\?/g, () => `@param${paramIndex++}`);
            }
            
            const result = await request.query(queryText);
            return result;
        } catch (error) {
            console.error('❌ Erro na consulta SQL:', error.message);
            console.error('Query:', queryText);
            console.error('Params:', params);
            throw error;
        }
    }

    async execute(queryText, params = []) {
        const result = await this.query(queryText, params);
        return result.recordset;
    }

    async executeScalar(queryText, params = []) {
        const result = await this.query(queryText, params);
        return result.recordset[0] ? Object.values(result.recordset[0])[0] : null;
    }

    async executeNonQuery(queryText, params = []) {
        const result = await this.query(queryText, params);
        return result.rowsAffected[0];
    }

    async beginTransaction() {
        const pool = await this.ensureConnection();
        const transaction = new sql.Transaction(pool);
        await transaction.begin();
        return transaction;
    }

    async commitTransaction(transaction) {
        await transaction.commit();
    }

    async rollbackTransaction(transaction) {
        await transaction.rollback();
    }

    async createDatabase() {
        try {
            // Conectar ao master para criar o banco
            const masterConfig = { ...this.config, database: 'master' };
            const masterPool = await sql.connect(masterConfig);
            
            const checkDbQuery = `
                SELECT database_id 
                FROM sys.databases 
                WHERE name = '${this.config.database}'
            `;
            
            const dbExists = await masterPool.request().query(checkDbQuery);
            
            if (dbExists.recordset.length === 0) {
                const createDbQuery = `
                    CREATE DATABASE [${this.config.database}]
                    COLLATE SQL_Latin1_General_CP1_CI_AS
                `;
                
                await masterPool.request().query(createDbQuery);
                console.log(`✅ Banco de dados '${this.config.database}' criado com sucesso!`);
            } else {
                console.log(`ℹ️ Banco de dados '${this.config.database}' já existe.`);
            }
            
            await masterPool.close();
            
            // Reconectar ao banco criado
            await this.connect();
            
        } catch (error) {
            console.error('❌ Erro ao criar banco de dados:', error.message);
            throw error;
        }
    }

    async createTables() {
        try {
            console.log('📋 Criando tabelas...');

            // Tabela de Categorias
            await this.executeNonQuery(`
                IF NOT EXISTS (SELECT * FROM sysobjects WHERE name='categories' AND xtype='U')
                CREATE TABLE categories (
                    id INT IDENTITY(1,1) PRIMARY KEY,
                    name NVARCHAR(100) NOT NULL UNIQUE,
                    description NVARCHAR(500),
                    status NVARCHAR(20) DEFAULT 'ativo' CHECK (status IN ('ativo', 'inativo')),
                    created_at DATETIME2 DEFAULT GETDATE(),
                    updated_at DATETIME2 DEFAULT GETDATE()
                )
            `);

            // Tabela de Fornecedores
            await this.executeNonQuery(`
                IF NOT EXISTS (SELECT * FROM sysobjects WHERE name='suppliers' AND xtype='U')
                CREATE TABLE suppliers (
                    id INT IDENTITY(1,1) PRIMARY KEY,
                    name NVARCHAR(200) NOT NULL,
                    cnpj NVARCHAR(18) UNIQUE,
                    email NVARCHAR(150),
                    phone NVARCHAR(20),
                    address NVARCHAR(500),
                    city NVARCHAR(100),
                    state NVARCHAR(2),
                    zip_code NVARCHAR(10),
                    contact_person NVARCHAR(150),
                    rating DECIMAL(3,2) DEFAULT 0.00 CHECK (rating >= 0 AND rating <= 5),
                    status NVARCHAR(20) DEFAULT 'ativo' CHECK (status IN ('ativo', 'inativo', 'bloqueado')),
                    notes NVARCHAR(MAX),
                    created_at DATETIME2 DEFAULT GETDATE(),
                    updated_at DATETIME2 DEFAULT GETDATE()
                )
            `);

            // Tabela de Produtos
            await this.executeNonQuery(`
                IF NOT EXISTS (SELECT * FROM sysobjects WHERE name='products' AND xtype='U')
                CREATE TABLE products (
                    id INT IDENTITY(1,1) PRIMARY KEY,
                    code NVARCHAR(50) NOT NULL UNIQUE,
                    name NVARCHAR(200) NOT NULL,
                    description NVARCHAR(MAX),
                    category_id INT,
                    supplier_id INT,
                    price DECIMAL(15,2) NOT NULL DEFAULT 0.00,
                    cost DECIMAL(15,2) DEFAULT 0.00,
                    stock INT NOT NULL DEFAULT 0,
                    min_stock INT DEFAULT 0,
                    max_stock INT,
                    unit NVARCHAR(20) DEFAULT 'UN',
                    barcode NVARCHAR(50),
                    location NVARCHAR(100),
                    status NVARCHAR(20) DEFAULT 'ativo' CHECK (status IN ('ativo', 'inativo', 'descontinuado')),
                    created_at DATETIME2 DEFAULT GETDATE(),
                    updated_at DATETIME2 DEFAULT GETDATE(),
                    FOREIGN KEY (category_id) REFERENCES categories(id),
                    FOREIGN KEY (supplier_id) REFERENCES suppliers(id)
                )
            `);

            // Tabela de Cotações
            await this.executeNonQuery(`
                IF NOT EXISTS (SELECT * FROM sysobjects WHERE name='quotes' AND xtype='U')
                CREATE TABLE quotes (
                    id INT IDENTITY(1,1) PRIMARY KEY,
                    quote_number NVARCHAR(50) NOT NULL UNIQUE,
                    supplier_id INT NOT NULL,
                    request_date DATETIME2 DEFAULT GETDATE(),
                    response_date DATETIME2,
                    valid_until DATETIME2,
                    total_amount DECIMAL(15,2) DEFAULT 0.00,
                    status NVARCHAR(20) DEFAULT 'pendente' CHECK (status IN ('pendente', 'respondida', 'aceita', 'rejeitada', 'expirada')),
                    notes NVARCHAR(MAX),
                    created_by NVARCHAR(100),
                    created_at DATETIME2 DEFAULT GETDATE(),
                    updated_at DATETIME2 DEFAULT GETDATE(),
                    FOREIGN KEY (supplier_id) REFERENCES suppliers(id)
                )
            `);

            // Tabela de Itens de Cotação
            await this.executeNonQuery(`
                IF NOT EXISTS (SELECT * FROM sysobjects WHERE name='quote_items' AND xtype='U')
                CREATE TABLE quote_items (
                    id INT IDENTITY(1,1) PRIMARY KEY,
                    quote_id INT NOT NULL,
                    product_id INT NOT NULL,
                    quantity INT NOT NULL,
                    unit_price DECIMAL(15,2) DEFAULT 0.00,
                    total_price DECIMAL(15,2) DEFAULT 0.00,
                    delivery_time INT, -- dias
                    notes NVARCHAR(500),
                    created_at DATETIME2 DEFAULT GETDATE(),
                    FOREIGN KEY (quote_id) REFERENCES quotes(id) ON DELETE CASCADE,
                    FOREIGN KEY (product_id) REFERENCES products(id)
                )
            `);

            // Tabela de Pedidos
            await this.executeNonQuery(`
                IF NOT EXISTS (SELECT * FROM sysobjects WHERE name='orders' AND xtype='U')
                CREATE TABLE orders (
                    id INT IDENTITY(1,1) PRIMARY KEY,
                    order_number NVARCHAR(50) NOT NULL UNIQUE,
                    supplier_id INT NOT NULL,
                    quote_id INT,
                    order_date DATETIME2 DEFAULT GETDATE(),
                    expected_delivery DATETIME2,
                    actual_delivery DATETIME2,
                    total_amount DECIMAL(15,2) DEFAULT 0.00,
                    status NVARCHAR(20) DEFAULT 'pendente' CHECK (status IN ('pendente', 'confirmado', 'em_transito', 'entregue', 'cancelado')),
                    payment_status NVARCHAR(20) DEFAULT 'pendente' CHECK (payment_status IN ('pendente', 'pago', 'parcial', 'atrasado')),
                    payment_terms NVARCHAR(100),
                    notes NVARCHAR(MAX),
                    created_by NVARCHAR(100),
                    created_at DATETIME2 DEFAULT GETDATE(),
                    updated_at DATETIME2 DEFAULT GETDATE(),
                    FOREIGN KEY (supplier_id) REFERENCES suppliers(id),
                    FOREIGN KEY (quote_id) REFERENCES quotes(id)
                )
            `);

            // Tabela de Itens de Pedido
            await this.executeNonQuery(`
                IF NOT EXISTS (SELECT * FROM sysobjects WHERE name='order_items' AND xtype='U')
                CREATE TABLE order_items (
                    id INT IDENTITY(1,1) PRIMARY KEY,
                    order_id INT NOT NULL,
                    product_id INT NOT NULL,
                    quantity_ordered INT NOT NULL,
                    quantity_received INT DEFAULT 0,
                    unit_price DECIMAL(15,2) NOT NULL,
                    total_price DECIMAL(15,2) NOT NULL,
                    delivery_date DATETIME2,
                    notes NVARCHAR(500),
                    created_at DATETIME2 DEFAULT GETDATE(),
                    FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE,
                    FOREIGN KEY (product_id) REFERENCES products(id)
                )
            `);

            // Tabela de Movimentações de Estoque
            await this.executeNonQuery(`
                IF NOT EXISTS (SELECT * FROM sysobjects WHERE name='inventory_movements' AND xtype='U')
                CREATE TABLE inventory_movements (
                    id INT IDENTITY(1,1) PRIMARY KEY,
                    product_id INT NOT NULL,
                    type NVARCHAR(20) NOT NULL CHECK (type IN ('entrada', 'saida', 'ajuste', 'transferencia')),
                    quantity INT NOT NULL,
                    previous_stock INT NOT NULL,
                    new_stock INT NOT NULL,
                    unit_cost DECIMAL(15,2),
                    total_cost DECIMAL(15,2),
                    reason NVARCHAR(200),
                    reference_id INT,
                    reference_type NVARCHAR(50), -- 'order', 'adjustment', 'transfer', etc.
                    user_id NVARCHAR(100),
                    created_at DATETIME2 DEFAULT GETDATE(),
                    FOREIGN KEY (product_id) REFERENCES products(id)
                )
            `);

            console.log('✅ Tabelas criadas com sucesso!');

        } catch (error) {
            console.error('❌ Erro ao criar tabelas:', error.message);
            throw error;
        }
    }

    async createIndexes() {
        try {
            console.log('📊 Criando índices...');

            const indexes = [
                // Produtos
                "CREATE NONCLUSTERED INDEX IX_products_code ON products(code)",
                "CREATE NONCLUSTERED INDEX IX_products_name ON products(name)",
                "CREATE NONCLUSTERED INDEX IX_products_category ON products(category_id)",
                "CREATE NONCLUSTERED INDEX IX_products_supplier ON products(supplier_id)",
                "CREATE NONCLUSTERED INDEX IX_products_status ON products(status)",
                
                // Fornecedores
                "CREATE NONCLUSTERED INDEX IX_suppliers_cnpj ON suppliers(cnpj)",
                "CREATE NONCLUSTERED INDEX IX_suppliers_name ON suppliers(name)",
                "CREATE NONCLUSTERED INDEX IX_suppliers_status ON suppliers(status)",
                
                // Cotações
                "CREATE NONCLUSTERED INDEX IX_quotes_number ON quotes(quote_number)",
                "CREATE NONCLUSTERED INDEX IX_quotes_supplier ON quotes(supplier_id)",
                "CREATE NONCLUSTERED INDEX IX_quotes_status ON quotes(status)",
                "CREATE NONCLUSTERED INDEX IX_quotes_date ON quotes(request_date)",
                
                // Pedidos
                "CREATE NONCLUSTERED INDEX IX_orders_number ON orders(order_number)",
                "CREATE NONCLUSTERED INDEX IX_orders_supplier ON orders(supplier_id)",
                "CREATE NONCLUSTERED INDEX IX_orders_status ON orders(status)",
                "CREATE NONCLUSTERED INDEX IX_orders_date ON orders(order_date)",
                
                // Movimentações
                "CREATE NONCLUSTERED INDEX IX_inventory_product ON inventory_movements(product_id)",
                "CREATE NONCLUSTERED INDEX IX_inventory_type ON inventory_movements(type)",
                "CREATE NONCLUSTERED INDEX IX_inventory_date ON inventory_movements(created_at)",
                "CREATE NONCLUSTERED INDEX IX_inventory_reference ON inventory_movements(reference_type, reference_id)"
            ];

            for (const indexSql of indexes) {
                try {
                    await this.executeNonQuery(indexSql);
                } catch (error) {
                    // Ignorar erro se índice já existir
                    if (!error.message.includes('already exists')) {
                        console.warn('⚠️ Aviso ao criar índice:', error.message);
                    }
                }
            }

            console.log('✅ Índices criados com sucesso!');

        } catch (error) {
            console.error('❌ Erro ao criar índices:', error.message);
            throw error;
        }
    }

    async insertSampleData() {
        try {
            console.log('📝 Inserindo dados de exemplo...');

            // Verificar se já existem dados
            const categoryCount = await this.executeScalar('SELECT COUNT(*) FROM categories');
            if (categoryCount > 0) {
                console.log('ℹ️ Dados de exemplo já existem, pulando inserção.');
                return;
            }

            // Inserir categorias
            await this.executeNonQuery(`
                INSERT INTO categories (name, description) VALUES
                ('Eletrônicos', 'Equipamentos eletrônicos e informática'),
                ('Escritório', 'Material de escritório e papelaria'),
                ('Limpeza', 'Produtos de limpeza e higiene'),
                ('Móveis', 'Móveis e equipamentos'),
                ('Ferramentas', 'Ferramentas e equipamentos técnicos')
            `);

            // Inserir fornecedores
            await this.executeNonQuery(`
                INSERT INTO suppliers (name, cnpj, email, phone, address, city, state, contact_person, rating) VALUES
                ('TechSupply Ltda', '12.345.678/0001-90', 'contato@techsupply.com', '(11) 9999-8888', 'Rua da Tecnologia, 123', 'São Paulo', 'SP', 'João Silva', 4.5),
                ('Office Solutions', '98.765.432/0001-10', 'vendas@officesolutions.com', '(11) 8888-7777', 'Av. Escritório, 456', 'São Paulo', 'SP', 'Maria Santos', 4.2),
                ('CleanPro Distribuidora', '11.222.333/0001-44', 'pedidos@cleanpro.com', '(11) 7777-6666', 'Rua Limpeza, 789', 'Guarulhos', 'SP', 'Carlos Oliveira', 4.0)
            `);

            // Inserir produtos
            await this.executeNonQuery(`
                INSERT INTO products (code, name, description, category_id, supplier_id, price, cost, stock, min_stock, max_stock, unit) VALUES
                ('PROD-001', 'Notebook Dell Inspiron', 'Notebook Dell Inspiron 15 3000', 1, 1, 2500.00, 2000.00, 15, 5, 50, 'UN'),
                ('PROD-002', 'Mouse Logitech', 'Mouse óptico Logitech M100', 1, 1, 45.00, 30.00, 50, 10, 100, 'UN'),
                ('PROD-003', 'Cadeira Ergonômica', 'Cadeira de escritório ergonômica', 4, 2, 450.00, 300.00, 8, 3, 20, 'UN'),
                ('PROD-004', 'Papel A4 500 folhas', 'Resma de papel A4 branco 500 folhas', 2, 2, 25.00, 18.00, 150, 50, 500, 'UN'),
                ('PROD-005', 'Detergente Multiuso', 'Detergente multiuso 500ml', 3, 3, 8.50, 5.00, 200, 50, 1000, 'UN')
            `);

            console.log('✅ Dados de exemplo inseridos com sucesso!');

        } catch (error) {
            console.error('❌ Erro ao inserir dados de exemplo:', error.message);
            throw error;
        }
    }

    async init() {
        try {
            console.log('🚀 Inicializando banco de dados SQL Server...');
            
            await this.createDatabase();
            await this.createTables();
            await this.createIndexes();
            await this.insertSampleData();
            
            console.log('✅ Banco de dados inicializado com sucesso!');
            
        } catch (error) {
            console.error('❌ Erro na inicialização do banco:', error.message);
            throw error;
        }
    }

    // Métodos de conveniência para compatibilidade
    async get(query, params = []) {
        const result = await this.execute(query, params);
        return result[0] || null;
    }

    async all(query, params = []) {
        return await this.execute(query, params);
    }

    async run(query, params = []) {
        return await this.executeNonQuery(query, params);
    }

    async close() {
        await this.disconnect();
    }
}

module.exports = Database;