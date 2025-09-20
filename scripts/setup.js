const runMigration = require('./migrate');
const seedDatabase = require('./seed');
require('dotenv').config();

async function setupDatabase() {
    try {
        console.log('🔧 Iniciando configuração completa do banco de dados...\n');
        
        // Executar migração
        await runMigration();
        console.log('');
        
        // Executar seed
        await seedDatabase();
        console.log('');
        
        console.log('🎉 Configuração completa do banco de dados finalizada!');
        console.log('');
        console.log('📋 Próximos passos:');
        console.log('   1. Configure suas variáveis de ambiente no arquivo .env');
        console.log('   2. Execute "npm start" para iniciar o servidor');
        console.log('   3. Acesse http://localhost:3000 para ver a aplicação');
        console.log('');
        console.log('🔗 Endpoints da API disponíveis:');
        console.log('   - GET /api/health - Status da aplicação');
        console.log('   - GET /api/products - Listar produtos');
        console.log('   - GET /api/suppliers - Listar fornecedores');
        console.log('   - GET /api/quotes - Listar cotações');
        console.log('   - GET /api/orders - Listar pedidos');
        
    } catch (error) {
        console.error('❌ Erro durante a configuração:', error);
        process.exit(1);
    }
}

// Executar setup se chamado diretamente
if (require.main === module) {
    setupDatabase();
}

module.exports = setupDatabase;