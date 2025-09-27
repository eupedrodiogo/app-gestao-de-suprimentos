const http = require('http');

const server = http.createServer((req, res) => {
    res.writeHead(200, {
        'Content-Type': 'text/html; charset=utf-8',
        'Access-Control-Allow-Origin': '*'
    });
    
    const html = `
        <!DOCTYPE html>
        <html>
        <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>Teste Móvel Simples</title>
            <style>
                body { 
                    font-family: Arial; 
                    text-align: center; 
                    padding: 50px; 
                    background: linear-gradient(45deg, #667eea, #764ba2);
                    color: white;
                    margin: 0;
                }
                .container {
                    background: rgba(255,255,255,0.1);
                    padding: 30px;
                    border-radius: 15px;
                    max-width: 400px;
                    margin: 0 auto;
                }
                h1 { font-size: 2em; margin-bottom: 20px; }
                .status { 
                    background: #4CAF50; 
                    padding: 15px; 
                    border-radius: 10px; 
                    margin: 20px 0;
                }
                .info { font-size: 14px; margin: 10px 0; }
                .btn {
                    background: #2196F3;
                    color: white;
                    padding: 15px 30px;
                    border: none;
                    border-radius: 10px;
                    font-size: 16px;
                    margin: 10px;
                    cursor: pointer;
                    text-decoration: none;
                    display: inline-block;
                }
            </style>
        </head>
        <body>
            <div class="container">
                <h1>🎉 FUNCIONANDO!</h1>
                <div class="status">
                    <h2>✅ Conectividade Móvel OK</h2>
                </div>
                <div class="info">
                    <p><strong>Servidor:</strong> Porta 9000</p>
                    <p><strong>IP:</strong> 192.168.1.6</p>
                    <p><strong>Timestamp:</strong> ${new Date().toLocaleString('pt-BR')}</p>
                    <p><strong>URL:</strong> ${req.url}</p>
                    <p><strong>User Agent:</strong> ${req.headers['user-agent'] || 'Unknown'}</p>
                </div>
                <a href="/test" class="btn">🧪 Testar API</a>
                <a href="/mobile" class="btn">📱 App Móvel</a>
            </div>
        </body>
        </html>
    `;
    
    res.end(html);
});

server.listen(9000, '0.0.0.0', () => {
    console.log('🟢 SERVIDOR TESTE RODANDO NA PORTA 9000');
    console.log('📱 URLs para teste no celular:');
    console.log('   • http://192.168.1.6:9000');
    console.log('   • http://192.168.56.1:9000');
    console.log('   • http://localhost:9000');
    console.log('');
    console.log('📶 Conecte seu celular na rede Wi-Fi: "Multilaser 5G"');
    console.log('🔗 Acesse qualquer uma das URLs acima no navegador do celular');
});