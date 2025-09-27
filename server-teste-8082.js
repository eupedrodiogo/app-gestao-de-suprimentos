const http = require('http');

const server = http.createServer((req, res) => {
    // Headers CORS
    res.writeHead(200, {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE',
        'Access-Control-Allow-Headers': 'Content-Type'
    });
    
    // Resposta JSON
    const response = {
        success: true,
        message: 'SERVIDOR 8082 FUNCIONANDO!',
        port: 8082,
        timestamp: new Date().toISOString(),
        ip: req.connection.remoteAddress,
        userAgent: req.headers['user-agent'] || 'Unknown',
        url: req.url
    };
    
    res.end(JSON.stringify(response, null, 2));
});

server.listen(8082, '0.0.0.0', () => {
    console.log('🟢 SERVIDOR TESTE RODANDO NA PORTA 8082');
    console.log('📱 URLs para teste:');
    console.log('   • http://192.168.1.6:8082');
    console.log('   • http://192.168.56.1:8082');
    console.log('   • http://localhost:8082');
});