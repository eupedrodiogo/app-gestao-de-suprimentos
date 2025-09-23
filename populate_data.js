const Database = require('./backend/database/database');

class DataPopulator {
    constructor() {
        this.db = new Database();
    }

    async populateAll() {
        try {
            console.log('🚀 Iniciando população do banco de dados...');
            
            await this.db.connect();
            
            // Limpar dados existentes
            await this.clearExistingData();
            
            // Popular dados em ordem de dependência
            const suppliers = await this.populateSuppliers();
            const products = await this.populateProducts();
            const quotes = await this.populateQuotes(suppliers, products);
            const orders = await this.populateOrders(suppliers, products, quotes);
            
            console.log('✅ População do banco de dados concluída com sucesso!');
            console.log(`📊 Dados criados:`);
            console.log(`   - ${suppliers.length} fornecedores`);
            console.log(`   - ${products.length} produtos`);
            console.log(`   - ${quotes.length} cotações`);
            console.log(`   - ${orders.length} pedidos`);
            
        } catch (error) {
            console.error('❌ Erro ao popular banco de dados:', error);
        } finally {
            if (this.db.db) {
                this.db.db.close();
            }
        }
    }

    async clearExistingData() {
        console.log('🧹 Limpando dados existentes...');
        
        const tables = ['order_items', 'orders', 'quote_items', 'quotes', 'products', 'suppliers'];
        
        for (const table of tables) {
            await this.db.query(`DELETE FROM ${table}`);
        }
        
        console.log('✅ Dados existentes removidos');
    }

    async populateSuppliers() {
        console.log('👥 Criando fornecedores...');
        
        const suppliers = [
            {
                cnpj: '12.345.678/0001-90',
                name: 'TechSupply Ltda',
                contact_name: 'João Silva',
                email: 'contato@techsupply.com.br',
                phone: '(11) 3456-7890',
                address: 'Rua das Tecnologias, 123',
                city: 'São Paulo',
                state: 'SP',
                zip_code: '01234-567',
                status: 'ativo'
            },
            {
                cnpj: '23.456.789/0001-01',
                name: 'Materiais Industriais S.A.',
                contact_name: 'Maria Santos',
                email: 'vendas@materiaisindustriais.com.br',
                phone: '(21) 2345-6789',
                address: 'Av. Industrial, 456',
                city: 'Rio de Janeiro',
                state: 'RJ',
                zip_code: '20123-456',
                status: 'ativo'
            },
            {
                cnpj: '34.567.890/0001-12',
                name: 'Equipamentos Pro',
                contact_name: 'Carlos Oliveira',
                email: 'carlos@equipamentospro.com.br',
                phone: '(31) 3456-7890',
                address: 'Rua dos Equipamentos, 789',
                city: 'Belo Horizonte',
                state: 'MG',
                zip_code: '30123-789',
                status: 'ativo'
            },
            {
                cnpj: '11.222.333/0001-81',
                name: 'Suprimentos Express',
                contact_name: 'Ana Costa',
                email: 'ana@suprimentosexpress.com.br',
                phone: '(41) 4567-8901',
                address: 'Av. Rápida, 321',
                city: 'Curitiba',
                state: 'PR',
                zip_code: '80123-321',
                status: 'ativo'
            },
            {
                cnpj: '11.444.777/0001-61',
                name: 'Global Parts',
                contact_name: 'Roberto Lima',
                email: 'roberto@globalparts.com.br',
                phone: '(51) 5678-9012',
                address: 'Rua Global, 654',
                city: 'Porto Alegre',
                state: 'RS',
                zip_code: '90123-654',
                status: 'ativo'
            },
            {
                cnpj: '11.555.777/0001-98',
                name: 'Fornecedor Inativo Ltda',
                contact_name: 'Pedro Inativo',
                email: 'contato@inativo.com.br',
                phone: '(11) 9999-9999',
                address: 'Rua Inativa, 999',
                city: 'São Paulo',
                state: 'SP',
                zip_code: '99999-999',
                status: 'inativo'
            }
        ];

        const createdSuppliers = [];
        
        for (const supplier of suppliers) {
            const sql = `INSERT INTO suppliers (cnpj, name, contact_name, email, phone, address, city, state, zip_code, status)
                         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`;
            const params = [
                supplier.cnpj, supplier.name, supplier.contact_name, supplier.email,
                supplier.phone, supplier.address, supplier.city, supplier.state,
                supplier.zip_code, supplier.status
            ];
            
            const result = await this.db.query(sql, params);
            createdSuppliers.push({ id: result.lastID, ...supplier });
        }
        
        console.log(`✅ ${createdSuppliers.length} fornecedores criados`);
        return createdSuppliers;
    }

    async populateProducts() {
        console.log('📦 Criando produtos...');
        
        const products = [
            // Categoria: Eletrônicos
            { code: 'ELE001', name: 'Notebook Dell Inspiron 15', description: 'Notebook para uso corporativo', category: 'Eletrônicos', unit: 'UN', price: 2500.00, stock: 15, min_stock: 5 },
            { code: 'ELE002', name: 'Monitor LG 24"', description: 'Monitor LED Full HD', category: 'Eletrônicos', unit: 'UN', price: 450.00, stock: 25, min_stock: 10 },
            { code: 'ELE003', name: 'Teclado Mecânico', description: 'Teclado mecânico RGB', category: 'Eletrônicos', unit: 'UN', price: 180.00, stock: 30, min_stock: 15 },
            { code: 'ELE004', name: 'Mouse Wireless', description: 'Mouse sem fio ergonômico', category: 'Eletrônicos', unit: 'UN', price: 75.00, stock: 50, min_stock: 20 },
            { code: 'ELE005', name: 'Impressora Multifuncional', description: 'Impressora laser colorida', category: 'Eletrônicos', unit: 'UN', price: 1200.00, stock: 8, min_stock: 3 },
            
            // Categoria: Material de Escritório
            { code: 'ESC001', name: 'Papel A4 500 folhas', description: 'Resma de papel sulfite', category: 'Material de Escritório', unit: 'PCT', price: 25.00, stock: 100, min_stock: 50 },
            { code: 'ESC002', name: 'Caneta Esferográfica Azul', description: 'Caneta esferográfica ponta média', category: 'Material de Escritório', unit: 'UN', price: 2.50, stock: 200, min_stock: 100 },
            { code: 'ESC003', name: 'Grampeador Grande', description: 'Grampeador para até 25 folhas', category: 'Material de Escritório', unit: 'UN', price: 35.00, stock: 20, min_stock: 10 },
            { code: 'ESC004', name: 'Pasta Suspensa', description: 'Pasta suspensa kraft', category: 'Material de Escritório', unit: 'UN', price: 8.50, stock: 150, min_stock: 75 },
            { code: 'ESC005', name: 'Marcador de Texto', description: 'Marcador fluorescente amarelo', category: 'Material de Escritório', unit: 'UN', price: 4.00, stock: 80, min_stock: 40 },
            
            // Categoria: Móveis
            { code: 'MOV001', name: 'Mesa de Escritório', description: 'Mesa de escritório 120x60cm', category: 'Móveis', unit: 'UN', price: 350.00, stock: 12, min_stock: 5 },
            { code: 'MOV002', name: 'Cadeira Ergonômica', description: 'Cadeira giratória com apoio lombar', category: 'Móveis', unit: 'UN', price: 280.00, stock: 18, min_stock: 8 },
            { code: 'MOV003', name: 'Armário Arquivo', description: 'Armário de aço 4 gavetas', category: 'Móveis', unit: 'UN', price: 450.00, stock: 6, min_stock: 2 },
            { code: 'MOV004', name: 'Estante Metálica', description: 'Estante de aço 5 prateleiras', category: 'Móveis', unit: 'UN', price: 220.00, stock: 10, min_stock: 4 },
            
            // Categoria: Limpeza
            { code: 'LMP001', name: 'Detergente Neutro 5L', description: 'Detergente neutro para limpeza geral', category: 'Limpeza', unit: 'UN', price: 18.00, stock: 40, min_stock: 20 },
            { code: 'LMP002', name: 'Papel Higiênico 12 rolos', description: 'Papel higiênico folha dupla', category: 'Limpeza', unit: 'PCT', price: 22.00, stock: 60, min_stock: 30 },
            { code: 'LMP003', name: 'Álcool Gel 500ml', description: 'Álcool em gel 70%', category: 'Limpeza', unit: 'UN', price: 12.00, stock: 80, min_stock: 40 },
            { code: 'LMP004', name: 'Pano de Limpeza', description: 'Pano microfibra multiuso', category: 'Limpeza', unit: 'UN', price: 8.50, stock: 45, min_stock: 25 },
            
            // Categoria: Ferramentas
            { code: 'FER001', name: 'Furadeira Elétrica', description: 'Furadeira de impacto 500W', category: 'Ferramentas', unit: 'UN', price: 180.00, stock: 8, min_stock: 3 },
            { code: 'FER002', name: 'Chave de Fenda Conjunto', description: 'Conjunto 6 chaves de fenda', category: 'Ferramentas', unit: 'KIT', price: 25.00, stock: 15, min_stock: 8 },
            { code: 'FER003', name: 'Martelo 500g', description: 'Martelo cabo de madeira', category: 'Ferramentas', unit: 'UN', price: 35.00, stock: 12, min_stock: 6 },
            { code: 'FER004', name: 'Alicate Universal', description: 'Alicate universal 8 polegadas', category: 'Ferramentas', unit: 'UN', price: 28.00, stock: 20, min_stock: 10 }
        ];

        const createdProducts = [];
        
        for (const product of products) {
            const sql = `INSERT INTO products (code, name, description, category, unit, price, stock, min_stock, status)
                         VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'ativo')`;
            const params = [
                product.code, product.name, product.description, product.category,
                product.unit, product.price, product.stock, product.min_stock
            ];
            
            const result = await this.db.query(sql, params);
            createdProducts.push({ id: result.lastID, ...product });
        }
        
        console.log(`✅ ${createdProducts.length} produtos criados`);
        return createdProducts;
    }

    async populateQuotes(suppliers, products) {
        console.log('💰 Criando cotações...');
        
        const activeSuppliers = suppliers.filter(s => s.status === 'ativo');
        const quotes = [];
        
        // Criar 15 cotações com diferentes status
        for (let i = 1; i <= 15; i++) {
            const supplier = activeSuppliers[Math.floor(Math.random() * activeSuppliers.length)];
            const requestDate = new Date();
            requestDate.setDate(requestDate.getDate() - Math.floor(Math.random() * 60)); // Últimos 60 dias
            
            const expectedDate = new Date(requestDate);
            expectedDate.setDate(expectedDate.getDate() + Math.floor(Math.random() * 30) + 7); // 7-37 dias após solicitação
            
            const status = this.getRandomStatus(['pendente', 'aprovado', 'rejeitado'], [0.4, 0.4, 0.2]);
            
            const quote = {
                number: `COT${String(i).padStart(4, '0')}`,
                supplier_id: supplier.id,
                request_date: requestDate.toISOString().split('T')[0],
                expected_date: expectedDate.toISOString().split('T')[0],
                status: status,
                notes: `Cotação ${i} - ${supplier.name}`
            };
            
            const sql = `INSERT INTO quotes (number, supplier_id, request_date, expected_date, total_value, status, notes)
                         VALUES (?, ?, ?, ?, 0, ?, ?)`;
            const params = [
                quote.number, quote.supplier_id, quote.request_date,
                quote.expected_date, quote.status, quote.notes
            ];
            
            const result = await this.db.query(sql, params);
            const quoteId = result.lastID;
            
            // Adicionar itens à cotação
            const numItems = Math.floor(Math.random() * 5) + 1; // 1-5 itens
            let totalValue = 0;
            
            for (let j = 0; j < numItems; j++) {
                const product = products[Math.floor(Math.random() * products.length)];
                const quantity = Math.floor(Math.random() * 10) + 1;
                const unitPrice = product.price * (0.8 + Math.random() * 0.4); // Variação de ±20%
                const totalPrice = quantity * unitPrice;
                totalValue += totalPrice;
                
                const itemSql = `INSERT INTO quote_items (quote_id, product_id, quantity, unit_price, total_price)
                                 VALUES (?, ?, ?, ?, ?)`;
                await this.db.query(itemSql, [quoteId, product.id, quantity, unitPrice, totalPrice]);
            }
            
            // Atualizar valor total da cotação
            await this.db.query('UPDATE quotes SET total_value = ? WHERE id = ?', [totalValue, quoteId]);
            
            quotes.push({ id: quoteId, ...quote, total_value: totalValue });
        }
        
        console.log(`✅ ${quotes.length} cotações criadas`);
        return quotes;
    }

    async populateOrders(suppliers, products, quotes) {
        console.log('🛒 Criando pedidos...');
        
        const activeSuppliers = suppliers.filter(s => s.status === 'ativo');
        const approvedQuotes = quotes.filter(q => q.status === 'aprovado');
        const orders = [];
        
        // Criar 12 pedidos
        for (let i = 1; i <= 12; i++) {
            const supplier = activeSuppliers[Math.floor(Math.random() * activeSuppliers.length)];
            const orderDate = new Date();
            orderDate.setDate(orderDate.getDate() - Math.floor(Math.random() * 45)); // Últimos 45 dias
            
            const deliveryDate = new Date(orderDate);
            deliveryDate.setDate(deliveryDate.getDate() + Math.floor(Math.random() * 21) + 7); // 7-28 dias após pedido
            
            const status = this.getRandomStatus(
                ['pendente', 'confirmado', 'em_producao', 'enviado', 'entregue', 'cancelado'],
                [0.2, 0.25, 0.2, 0.15, 0.15, 0.05]
            );
            
            // Alguns pedidos baseados em cotações aprovadas
            const quoteId = (i <= 8 && approvedQuotes.length > 0) ? 
                approvedQuotes[Math.floor(Math.random() * approvedQuotes.length)].id : null;
            
            const order = {
                number: `PED${String(i).padStart(4, '0')}`,
                supplier_id: supplier.id,
                quote_id: quoteId,
                order_date: orderDate.toISOString().split('T')[0],
                delivery_date: deliveryDate.toISOString().split('T')[0],
                status: status,
                notes: `Pedido ${i} - ${supplier.name}`
            };
            
            const sql = `INSERT INTO orders (number, supplier_id, quote_id, order_date, delivery_date, total_value, status, notes)
                         VALUES (?, ?, ?, ?, ?, 0, ?, ?)`;
            const params = [
                order.number, order.supplier_id, order.quote_id,
                order.order_date, order.delivery_date, order.status, order.notes
            ];
            
            const result = await this.db.query(sql, params);
            const orderId = result.lastID;
            
            // Adicionar itens ao pedido
            const numItems = Math.floor(Math.random() * 4) + 1; // 1-4 itens
            let totalValue = 0;
            
            for (let j = 0; j < numItems; j++) {
                const product = products[Math.floor(Math.random() * products.length)];
                const quantity = Math.floor(Math.random() * 8) + 1;
                const unitPrice = product.price * (0.85 + Math.random() * 0.3); // Variação de ±15%
                const totalPrice = quantity * unitPrice;
                const receivedQuantity = status === 'entregue' ? quantity : 
                                       (status === 'enviado' ? Math.floor(quantity * 0.8) : 0);
                totalValue += totalPrice;
                
                const itemSql = `INSERT INTO order_items (order_id, product_id, quantity, unit_price, total_price, received_quantity)
                                 VALUES (?, ?, ?, ?, ?, ?)`;
                await this.db.query(itemSql, [orderId, product.id, quantity, unitPrice, totalPrice, receivedQuantity]);
            }
            
            // Atualizar valor total do pedido
            await this.db.query('UPDATE orders SET total_value = ? WHERE id = ?', [totalValue, orderId]);
            
            orders.push({ id: orderId, ...order, total_value: totalValue });
        }
        
        console.log(`✅ ${orders.length} pedidos criados`);
        return orders;
    }

    getRandomStatus(statuses, weights) {
        const random = Math.random();
        let weightSum = 0;
        
        for (let i = 0; i < statuses.length; i++) {
            weightSum += weights[i];
            if (random <= weightSum) {
                return statuses[i];
            }
        }
        
        return statuses[statuses.length - 1];
    }
}

// Executar se chamado diretamente
if (require.main === module) {
    const populator = new DataPopulator();
    populator.populateAll();
}

module.exports = DataPopulator;