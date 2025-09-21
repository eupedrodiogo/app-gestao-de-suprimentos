const Database = require('../database/database');
require('dotenv').config();

async function healthCheck() {
    console.log('🏥 Verificação de Saúde do Sistema\n');
    
    const checks = {
        environment: false,
        database: false,
        tables: false,
        data: false
    };
    
    try {
        // 1. Verificar variáveis de ambiente
        console.log('1️⃣ Verificando configurações de ambiente...');
        const requiredEnvs = ['DB_SERVER', 'DB_DATABASE', 'PORT'];
        const missingEnvs = requiredEnvs.filter(env => !process.env[env]);
        
        if (missingEnvs.length > 0) {
            console.log(`❌ Variáveis de ambiente faltando: ${missingEnvs.join(', ')}`);
        } else {
            console.log('✅ Configurações de ambiente OK');
            checks.environment = true;
        }
        
        // 2. Verificar conexão com banco
        console.log('\n2️⃣ Verificando conexão com SQL Server...');
        const db = new Database();
        
        try {
            await db.connect();
            console.log('✅ Conexão com SQL Server estabelecida');
            checks.database = true;
            
            // 3. Verificar se as tabelas existem
            console.log('\n3️⃣ Verificando estrutura do banco...');
            const tables = await db.execute(`
                SELECT TABLE_NAME 
                FROM INFORMATION_SCHEMA.TABLES 
                WHERE TABLE_TYPE = 'BASE TABLE' 
                AND TABLE_CATALOG = '${process.env.DB_DATABASE}'
            `);
            
            const expectedTables = ['suppliers', 'products', 'quotes', 'quote_items', 'orders', 'order_items', 'inventory'];
            const existingTables = tables.map(t => t.TABLE_NAME);
            const missingTables = expectedTables.filter(table => !existingTables.includes(table));
            
            if (missingTables.length > 0) {
                console.log(`❌ Tabelas faltando: ${missingTables.join(', ')}`);
                console.log('💡 Execute: npm run migrate');
            } else {
                console.log('✅ Todas as tabelas estão presentes');
                checks.tables = true;
            }
            
            // 4. Verificar dados
            console.log('\n4️⃣ Verificando dados...');
            const stats = await db.execute(`
                SELECT 
                    (SELECT COUNT(*) FROM suppliers) as suppliers,
                    (SELECT COUNT(*) FROM products) as products,
                    (SELECT COUNT(*) FROM quotes) as quotes,
                    (SELECT COUNT(*) FROM orders) as orders
            `);
            
            const data = stats[0];
            console.log(`📊 Estatísticas:`);
            console.log(`   - Fornecedores: ${data.suppliers}`);
            console.log(`   - Produtos: ${data.products}`);
            console.log(`   - Cotações: ${data.quotes}`);
            console.log(`   - Pedidos: ${data.orders}`);
            
            if (data.suppliers > 0 && data.products > 0) {
                console.log('✅ Dados básicos presentes');
                checks.data = true;
            } else {
                console.log('⚠️  Poucos dados encontrados');
                console.log('💡 Execute: npm run seed');
            }
            
            await db.disconnect();
            
        } catch (dbError) {
            console.log('❌ Erro de conexão com banco:', dbError.message);
            
            if (dbError.message.includes('Login failed')) {
                console.log('💡 Verifique usuário e senha no arquivo .env');
            } else if (dbError.message.includes('server was not found')) {
                console.log('💡 Verifique se o SQL Server está rodando');
                console.log('💡 Confirme o nome do servidor no arquivo .env');
            } else if (dbError.message.includes('database') && dbError.message.includes('does not exist')) {
                console.log('💡 Execute: npm run migrate para criar o banco');
            }
        }
        
    } catch (error) {
        console.error('❌ Erro durante verificação:', error);
    }
    
    // Resumo final
    console.log('\n📋 Resumo da Verificação:');
    console.log(`   Ambiente: ${checks.environment ? '✅' : '❌'}`);
    console.log(`   Banco: ${checks.database ? '✅' : '❌'}`);
    console.log(`   Tabelas: ${checks.tables ? '✅' : '❌'}`);
    console.log(`   Dados: ${checks.data ? '✅' : '⚠️'}`);
    
    const allGood = checks.environment && checks.database && checks.tables;
    
    if (allGood) {
        console.log('\n🎉 Sistema está funcionando corretamente!');
        console.log('🚀 Execute "npm start" para iniciar o servidor');
    } else {
        console.log('\n⚠️  Sistema precisa de configuração');
        console.log('📖 Consulte o arquivo SETUP_SQLSERVER.md para instruções');
    }
    
    return allGood;
}

// Executar se chamado diretamente
if (require.main === module) {
    healthCheck();
}

module.exports = healthCheck;