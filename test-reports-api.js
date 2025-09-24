const http = require('http');

function testAPI(endpoint, description) {
    return new Promise((resolve, reject) => {
        const options = {
            hostname: 'localhost',
            port: 3000,
            path: endpoint,
            method: 'GET',
            headers: {
                'Content-Type': 'application/json'
            }
        };

        const req = http.request(options, (res) => {
            let data = '';
            
            res.on('data', (chunk) => {
                data += chunk;
            });
            
            res.on('end', () => {
                console.log(`\n=== ${description} ===`);
                console.log(`Status: ${res.statusCode}`);
                console.log(`Response:`, JSON.stringify(JSON.parse(data), null, 2));
                resolve(data);
            });
        });

        req.on('error', (error) => {
            console.error(`Erro ao testar ${description}:`, error.message);
            reject(error);
        });

        req.end();
    });
}

async function runTests() {
    console.log('🧪 Iniciando testes das APIs de Relatórios Avançados...\n');
    
    try {
        // Teste 1: Dashboard Executivo
        await testAPI('/api/reports/advanced/executive-dashboard', 'Dashboard Executivo');
        
        // Teste 2: Performance de Estoque
        await testAPI('/api/reports/advanced/stock-performance', 'Performance de Estoque');
        
        // Teste 3: Análise de Fornecedores
        await testAPI('/api/reports/advanced/supplier-analysis', 'Análise de Fornecedores');
        
        // Teste 4: Tendências de Pedidos
        await testAPI('/api/reports/advanced/order-trends', 'Tendências de Pedidos');
        
        console.log('\n✅ Todos os testes concluídos com sucesso!');
        
    } catch (error) {
        console.error('\n❌ Erro durante os testes:', error.message);
    }
}

runTests();