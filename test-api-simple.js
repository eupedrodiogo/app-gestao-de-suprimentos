const http = require('http');

console.log('🔍 Testando APIs de Relatórios Avançados...\n');

// Função para testar uma API
function testAPI(endpoint, name) {
    return new Promise((resolve) => {
        console.log(`Testando ${name}...`);
        
        const req = http.get(`http://localhost:3000${endpoint}`, (res) => {
            let data = '';
            
            res.on('data', chunk => {
                data += chunk;
            });
            
            res.on('end', () => {
                try {
                    const json = JSON.parse(data);
                    console.log(`✅ ${name} - Status: ${res.statusCode}`);
                    console.log(`   Dados: ${Object.keys(json).join(', ')}\n`);
                    resolve(true);
                } catch (e) {
                    console.log(`❌ ${name} - Erro no JSON: ${e.message}`);
                    console.log(`   Status: ${res.statusCode}`);
                    console.log(`   Dados brutos: ${data.substring(0, 100)}...\n`);
                    resolve(false);
                }
            });
        });
        
        req.on('error', (err) => {
            console.log(`❌ ${name} - Erro de conexão: ${err.message}\n`);
            resolve(false);
        });
        
        req.setTimeout(5000, () => {
            console.log(`⏰ ${name} - Timeout\n`);
            req.destroy();
            resolve(false);
        });
    });
}

// Executar testes
async function runTests() {
    const tests = [
        { endpoint: '/api/reports/advanced/executive-dashboard', name: 'Dashboard Executivo' },
        { endpoint: '/api/reports/advanced/stock-performance', name: 'Performance de Estoque' },
        { endpoint: '/api/reports/advanced/supplier-analysis', name: 'Análise de Fornecedores' },
        { endpoint: '/api/reports/advanced/order-trends', name: 'Tendências de Pedidos' }
    ];
    
    let passed = 0;
    
    for (const test of tests) {
        const result = await testAPI(test.endpoint, test.name);
        if (result) passed++;
    }
    
    console.log(`\n📊 Resultado: ${passed}/${tests.length} testes passaram`);
    
    if (passed === tests.length) {
        console.log('🎉 Todas as APIs estão funcionando corretamente!');
    } else {
        console.log('⚠️  Algumas APIs precisam de atenção.');
    }
}

runTests().catch(console.error);