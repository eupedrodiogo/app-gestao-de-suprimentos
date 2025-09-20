const Database = require('../database/database');
require('dotenv').config();

async function seedDatabase() {
    const db = new Database();
    
    try {
        console.log('🌱 Iniciando população do banco com dados de exemplo...');
        
        // Conectar ao banco
        await db.connect();
        console.log('✅ Conectado ao SQL Server');
        
        // Verificar se já existem dados
        const existingProducts = await db.execute('SELECT COUNT(*) as count FROM products');
        if (existingProducts[0].count > 0) {
            console.log('⚠️  Banco já contém dados. Use --force para sobrescrever.');
            if (!process.argv.includes('--force')) {
                return;
            }
            
            console.log('🗑️  Limpando dados existentes...');
            await db.execute('DELETE FROM order_items');
            await db.execute('DELETE FROM quote_items');
            await db.execute('DELETE FROM orders');
            await db.execute('DELETE FROM quotes');
            await db.execute('DELETE FROM inventory');
            await db.execute('DELETE FROM products');
            await db.execute('DELETE FROM suppliers');
        }
        
        // Popular com dados de exemplo
        await db.insertSampleData();
        console.log('✅ Dados de exemplo inseridos com sucesso');
        
        // Mostrar estatísticas
        const stats = await db.execute(`
            SELECT 
                (SELECT COUNT(*) FROM suppliers) as suppliers,
                (SELECT COUNT(*) FROM products) as products,
                (SELECT COUNT(*) FROM quotes) as quotes,
                (SELECT COUNT(*) FROM orders) as orders
        `);
        
        console.log('📊 Estatísticas do banco:');
        console.log(`   - Fornecedores: ${stats[0].suppliers}`);
        console.log(`   - Produtos: ${stats[0].products}`);
        console.log(`   - Cotações: ${stats[0].quotes}`);
        console.log(`   - Pedidos: ${stats[0].orders}`);
        
        console.log('🎉 População do banco concluída com sucesso!');
        
    } catch (error) {
        console.error('❌ Erro durante a população do banco:', error);
        process.exit(1);
    } finally {
        await db.disconnect();
    }
}

// Executar seed se chamado diretamente
if (require.main === module) {
    seedDatabase();
}

module.exports = seedDatabase;