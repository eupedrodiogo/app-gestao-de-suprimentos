const http = require('http');
const server = http.createServer((req, res) => {
    res.writeHead(200, {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
    });
    res.end(JSON.stringify({
        success: true,
        message: 'Servidor de teste funcionando!',
        timestamp: new Date().toISOString(),
        port: 8080
    }));
});
server.listen(8080, '0.0.0.0', () => {
    console.log('Servidor de teste rodando na porta 8080');
});
