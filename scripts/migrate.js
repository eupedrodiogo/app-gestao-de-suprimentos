const Database = require('../database/database');
require('dotenv').config();

async function runMigration() {
    const db = new Database();
    
    try {
        console.log('🚀 Iniciando migração do banco de dados SQL Server...');
        
        // Conectar ao banco
        await db.connect();
        console.log('✅ Conectado ao SQL Server');
        
        // Criar banco de dados se não existir
        await db.createDatabase();
        console.log('✅ Banco de dados verificado/criado');
        
        // Reconectar ao banco específico
        await db.disconnect();
        await db.connect();
        
        // Criar tabelas
        await db.createTables();
        console.log('✅ Tabelas criadas com sucesso');
        
        // Criar índices
        await db.createIndexes();
        console.log('✅ Índices criados com sucesso');
        
        console.log('🎉 Migração concluída com sucesso!');
        
    } catch (error) {
        console.error('❌ Erro durante a migração:', error);
        process.exit(1);
    } finally {
        await db.disconnect();
    }
}

// Executar migração se chamado diretamente
if (require.main === module) {
    runMigration();
}

module.exports = runMigration;