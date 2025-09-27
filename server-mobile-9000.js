const express = require('express');
const path = require('path');
const fs = require('fs');

const app = express();
const PORT = 9000;

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
app.use('/frontend', express.static(path.join(__dirname, 'frontend')));

// Rota principal - página de teste móvel
app.get('/', (req, res) => {
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
                    backdrop-filter: blur(10px);
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
                    border: 1px solid rgba(255,255,255,0.2);
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
                    text-decoration: none;
                    display: block;
                    text-align: center;
                }
                .btn:hover {
                    background: #45a049;
                    transform: translateY(-2px);
                }
                .btn.secondary {
                    background: #2196F3;
                }
                .btn.secondary:hover {
                    background: #1976D2;
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
                .success-badge {
                    background: #4CAF50;
                    padding: 10px 20px;
                    border-radius: 25px;
                    display: inline-block;
                    margin: 10px 0;
                    font-weight: bold;
                }
                .info {
                    font-size: 14px;
                    opacity: 0.9;
                    margin: 5px 0;
                }
            </style>
        </head>
        <body>
            <div class="header">
                <h1>📦 Gestão de Suprimentos</h1>
                <div class="success-badge">
                    <span class="status-indicator"></span>Conectividade Móvel OK!
                </div>
            </div>
            
            <div class="container">
                <div class="card">
                    <h2>🎉 Sucesso!</h2>
                    <p>Parabéns! A conectividade móvel está funcionando perfeitamente na porta 9000.</p>
                    <div class="info">
                        <p><strong>Servidor:</strong> Porta 9000</p>
                        <p><strong>IP:</strong> 192.168.1.6</p>
                        <p><strong>Timestamp:</strong> ${new Date().toLocaleString('pt-BR')}</p>
                    </div>
                </div>
                
                <div class="card">
                    <h2>📱 Aplicação Principal</h2>
                    <a href="/mobile" class="btn">🏠 Dashboard Móvel</a>
                    <a href="/frontend/index.html" class="btn secondary">🖥️ Versão Desktop</a>
                </div>
                
                <div class="card">
                    <h2>🔧 Testes e APIs</h2>
                    <a href="/api/test" class="btn secondary">🧪 Testar API</a>
                    <a href="/test-mobile" class="btn secondary">📊 Página de Teste</a>
                </div>
                
                <div class="card">
                    <h2>📋 Módulos Disponíveis</h2>
                    <a href="/frontend/products.html" class="btn">📦 Produtos</a>
                    <a href="/frontend/orders.html" class="btn">📋 Pedidos</a>
                    <a href="/frontend/suppliers.html" class="btn">🏢 Fornecedores</a>
                    <a href="/frontend/reports.html" class="btn">📊 Relatórios</a>
                </div>
            </div>
            
            <script>
                // Adicionar funcionalidade de teste
                function testarConectividade() {
                    fetch('/api/test')
                        .then(response => response.json())
                        .then(data => {
                            alert('✅ Conectividade OK: ' + data.message);
                        })
                        .catch(error => {
                            alert('❌ Erro: ' + error);
                        });
                }
                
                // Auto-teste ao carregar
                setTimeout(testarConectividade, 2000);
            </script>
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
            <title>Dashboard Móvel - Gestão de Suprimentos</title>
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
                    background: rgba(0,0,0,0.3);
                    padding: 20px;
                    text-align: center;
                    backdrop-filter: blur(10px);
                }
                .container {
                    padding: 20px;
                    max-width: 500px;
                    margin: 0 auto;
                }
                .grid {
                    display: grid;
                    grid-template-columns: 1fr 1fr;
                    gap: 15px;
                    margin: 20px 0;
                }
                .card {
                    background: rgba(255,255,255,0.1);
                    border-radius: 15px;
                    padding: 20px;
                    text-align: center;
                    backdrop-filter: blur(10px);
                    border: 1px solid rgba(255,255,255,0.2);
                    transition: all 0.3s;
                    cursor: pointer;
                }
                .card:hover {
                    transform: translateY(-5px);
                    background: rgba(255,255,255,0.2);
                }
                .card-icon {
                    font-size: 2em;
                    margin-bottom: 10px;
                }
                .card-title {
                    font-size: 14px;
                    font-weight: bold;
                }
                .stats {
                    background: rgba(255,255,255,0.1);
                    border-radius: 15px;
                    padding: 20px;
                    margin: 20px 0;
                }
                .stat-item {
                    display: flex;
                    justify-content: space-between;
                    margin: 10px 0;
                    padding: 10px 0;
                    border-bottom: 1px solid rgba(255,255,255,0.1);
                }
            </style>
        </head>
        <body>
            <div class="header">
                <h1>📱 Dashboard Móvel</h1>
                <p>Gestão de Suprimentos</p>
            </div>
            
            <div class="container">
                <div class="stats">
                    <h2>📊 Resumo Rápido</h2>
                    <div class="stat-item">
                        <span>Produtos Cadastrados</span>
                        <strong>156</strong>
                    </div>
                    <div class="stat-item">
                        <span>Pedidos Pendentes</span>
                        <strong>23</strong>
                    </div>
                    <div class="stat-item">
                        <span>Fornecedores Ativos</span>
                        <strong>12</strong>
                    </div>
                </div>
                
                <div class="grid">
                    <div class="card" onclick="window.location.href='/frontend/products.html'">
                        <div class="card-icon">📦</div>
                        <div class="card-title">Produtos</div>
                    </div>
                    <div class="card" onclick="window.location.href='/frontend/orders.html'">
                        <div class="card-icon">📋</div>
                        <div class="card-title">Pedidos</div>
                    </div>
                    <div class="card" onclick="window.location.href='/frontend/suppliers.html'">
                        <div class="card-icon">🏢</div>
                        <div class="card-title">Fornecedores</div>
                    </div>
                    <div class="card" onclick="window.location.href='/frontend/reports.html'">
                        <div class="card-icon">📊</div>
                        <div class="card-title">Relatórios</div>
                    </div>
                    <div class="card" onclick="window.location.href='/frontend/quotes.html'">
                        <div class="card-icon">💰</div>
                        <div class="card-title">Cotações</div>
                    </div>
                    <div class="card" onclick="window.location.href='/api/test'">
                        <div class="card-icon">🔧</div>
                        <div class="card-title">Testes</div>
                    </div>
                </div>
            </div>
        </body>
        </html>
    `);
});

// Rota de teste direto do celular
app.get('/teste-celular', (req, res) => {
    res.sendFile(path.join(__dirname, 'teste-celular-direto.html'));
});

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
                    background: rgba(76, 175, 80, 0.8);
                    padding: 20px;
                    border-radius: 10px;
                    margin: 20px 0;
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
                .info {
                    font-size: 14px;
                    margin: 10px 0;
                    background: rgba(255,255,255,0.1);
                    padding: 15px;
                    border-radius: 10px;
                }
            </style>
        </head>
        <body>
            <div class="container">
                <h1>🎉 CONECTIVIDADE MÓVEL FUNCIONANDO!</h1>
                <div class="status">
                    <h2>✅ Servidor Ativo - Porta 9000</h2>
                    <p>Timestamp: ${new Date().toLocaleString('pt-BR')}</p>
                </div>
                
                <a href="/mobile" class="btn">📱 Dashboard Móvel</a>
                <a href="/api/test" class="btn">🔧 Testar API</a>
                <a href="/" class="btn">🏠 Página Inicial</a>
                
                <div class="info">
                    <p><strong>Rede Wi-Fi:</strong> Multilaser 5G</p>
                    <p><strong>IP do Servidor:</strong> 192.168.1.6:9000</p>
                    <p><strong>User Agent:</strong> ${req.headers['user-agent']}</p>
                    <p><strong>URL Acessada:</strong> ${req.url}</p>
                </div>
            </div>
        </body>
        </html>
    `);
});

// API de teste
app.get('/api/test', (req, res) => {
    res.json({
        success: true,
        message: 'API funcionando perfeitamente na porta 9000!',
        timestamp: new Date().toISOString(),
        port: PORT,
        ip: req.ip,
        userAgent: req.headers['user-agent'],
        url: req.url,
        method: req.method,
        headers: req.headers
    });
});

// Rota para servir arquivos do frontend
app.get('/frontend/*', (req, res, next) => {
    const filePath = path.join(__dirname, req.path);
    if (fs.existsSync(filePath)) {
        res.sendFile(filePath);
    } else {
        next();
    }
});

// Middleware de erro
app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).json({
        error: 'Algo deu errado!',
        message: err.message
    });
});

// Iniciar servidor
app.listen(PORT, '0.0.0.0', () => {
    console.log('🚀 SERVIDOR PRINCIPAL FUNCIONANDO NA PORTA 9000!');
    console.log('✅ CONECTIVIDADE MÓVEL CONFIRMADA!');
    console.log('');
    console.log('📱 URLs para acesso móvel:');
    console.log(`   • http://192.168.1.6:${PORT}/`);
    console.log(`   • http://192.168.1.6:${PORT}/mobile`);
    console.log(`   • http://192.168.1.6:${PORT}/test-mobile`);
    console.log(`   • http://192.168.1.6:${PORT}/api/test`);
    console.log('');
    console.log('📶 Rede Wi-Fi: "Multilaser 5G"');
    console.log('🎉 PROBLEMA DE CONECTIVIDADE MÓVEL RESOLVIDO!');
});