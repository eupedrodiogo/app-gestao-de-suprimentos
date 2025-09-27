const express = require('express');
const path = require('path');
const fs = require('fs');

const app = express();
const PORT = 8081;

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// CORS para acesso móvel
app.use((req, res, next) => {
    res.header('Access-Control-Allow-Origin', '*');
    res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization');
    if (req.method === 'OPTIONS') {
        res.sendStatus(200);
    } else {
        next();
    }
});

// Servir arquivos estáticos
app.use(express.static(path.join(__dirname)));

// Rota de teste móvel
app.get('/test-mobile', (req, res) => {
    res.send(`
        <!DOCTYPE html>
        <html lang="pt-BR">
        <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>Teste Móvel - Gestão de Suprimentos</title>
            <style>
                body {
                    font-family: Arial, sans-serif;
                    margin: 0;
                    padding: 20px;
                    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                    color: white;
                    min-height: 100vh;
                }
                .container {
                    max-width: 400px;
                    margin: 0 auto;
                    text-align: center;
                }
                .status {
                    background: rgba(255,255,255,0.1);
                    padding: 20px;
                    border-radius: 10px;
                    margin: 20px 0;
                }
                .success {
                    background: rgba(76, 175, 80, 0.8);
                }
                .btn {
                    background: #4CAF50;
                    color: white;
                    padding: 15px 30px;
                    border: none;
                    border-radius: 5px;
                    font-size: 16px;
                    margin: 10px;
                    cursor: pointer;
                    text-decoration: none;
                    display: inline-block;
                }
                .btn:hover {
                    background: #45a049;
                }
                .info {
                    font-size: 14px;
                    margin: 10px 0;
                }
            </style>
        </head>
        <body>
            <div class="container">
                <h1>🎉 CONECTIVIDADE MÓVEL FUNCIONANDO!</h1>
                <div class="status success">
                    <h2>✅ Servidor Ativo</h2>
                    <p>Porta: 8081</p>
                    <p>IP: 192.168.1.6</p>
                    <p>Timestamp: ${new Date().toLocaleString('pt-BR')}</p>
                </div>
                
                <a href="/mobile" class="btn">📱 Acessar App Móvel</a>
                <a href="/api/test" class="btn">🔧 Testar API</a>
                
                <div class="info">
                    <p><strong>Rede Wi-Fi:</strong> Multilaser 5G</p>
                    <p><strong>User Agent:</strong> ${req.headers['user-agent']}</p>
                </div>
            </div>
        </body>
        </html>
    `);
});

// Rota da aplicação móvel
app.get('/mobile', (req, res) => {
    res.send(`
        <!DOCTYPE html>
        <html lang="pt-BR">
        <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>Gestão de Suprimentos - Mobile</title>
            <style>
                * {
                    margin: 0;
                    padding: 0;
                    box-sizing: border-box;
                }
                body {
                    font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
                    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                    min-height: 100vh;
                    color: white;
                }
                .header {
                    background: rgba(0,0,0,0.2);
                    padding: 20px;
                    text-align: center;
                }
                .container {
                    padding: 20px;
                    max-width: 500px;
                    margin: 0 auto;
                }
                .card {
                    background: rgba(255,255,255,0.1);
                    border-radius: 15px;
                    padding: 20px;
                    margin: 15px 0;
                    backdrop-filter: blur(10px);
                }
                .btn {
                    background: #4CAF50;
                    color: white;
                    padding: 15px;
                    border: none;
                    border-radius: 10px;
                    font-size: 16px;
                    width: 100%;
                    margin: 10px 0;
                    cursor: pointer;
                    transition: all 0.3s;
                }
                .btn:hover {
                    background: #45a049;
                    transform: translateY(-2px);
                }
                .status-indicator {
                    display: inline-block;
                    width: 10px;
                    height: 10px;
                    background: #4CAF50;
                    border-radius: 50%;
                    margin-right: 10px;
                    animation: pulse 2s infinite;
                }
                @keyframes pulse {
                    0% { opacity: 1; }
                    50% { opacity: 0.5; }
                    100% { opacity: 1; }
                }
            </style>
        </head>
        <body>
            <div class="header">
                <h1>📦 Gestão de Suprimentos</h1>
                <p><span class="status-indicator"></span>Sistema Online</p>
            </div>
            
            <div class="container">
                <div class="card">
                    <h2>🏠 Dashboard</h2>
                    <p>Bem-vindo ao sistema móvel de gestão de suprimentos</p>
                    <button class="btn" onclick="window.location.href='/'">🖥️ Versão Desktop</button>
                </div>
                
                <div class="card">
                    <h2>📊 Status do Sistema</h2>
                    <p><strong>Servidor:</strong> Ativo na porta 8081</p>
                    <p><strong>Conectividade:</strong> ✅ Funcionando</p>
                    <p><strong>Última atualização:</strong> ${new Date().toLocaleString('pt-BR')}</p>
                </div>
                
                <div class="card">
                    <h2>🔧 Testes</h2>
                    <button class="btn" onclick="testarAPI()">🧪 Testar API</button>
                    <button class="btn" onclick="window.location.href='/test-mobile'">📱 Página de Teste</button>
                </div>
            </div>
            
            <script>
                function testarAPI() {
                    fetch('/api/test')
                        .then(response => response.json())
                        .then(data => {
                            alert('API funcionando! ' + data.message);
                        })
                        .catch(error => {
                            alert('Erro na API: ' + error);
                        });
                }
            </script>
        </body>
        </html>
    `);
});

// API de teste
app.get('/api/test', (req, res) => {
    res.json({
        success: true,
        message: 'API funcionando perfeitamente!',
        timestamp: new Date().toISOString(),
        port: PORT,
        ip: req.ip,
        userAgent: req.headers['user-agent']
    });
});

// Rota principal
app.get('/', (req, res) => {
    // Verificar se existe index.html
    const indexPath = path.join(__dirname, 'index.html');
    if (fs.existsSync(indexPath)) {
        res.sendFile(indexPath);
    } else {
        res.redirect('/mobile');
    }
});

// Iniciar servidor
app.listen(PORT, '0.0.0.0', () => {
    console.log('🚀 SERVIDOR PRINCIPAL INICIADO COM SUCESSO!');
    console.log('📱 URLs para acesso móvel:');
    console.log(`   • http://192.168.1.6:${PORT}/mobile`);
    console.log(`   • http://192.168.1.6:${PORT}/test-mobile`);
    console.log(`   • http://192.168.1.6:${PORT}/api/test`);
    console.log(`   • http://192.168.56.1:${PORT}/mobile`);
    console.log('');
    console.log('📶 Conecte seu celular na rede Wi-Fi: "Multilaser 5G"');
    console.log('🔗 Acesse qualquer uma das URLs acima no navegador do celular');
});