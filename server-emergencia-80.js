const express = require('express');
const path = require('path');

const app = express();
const PORT = 80;

// Middleware básico
app.use(express.json());
app.use(express.static(__dirname));

// CORS simples
app.use((req, res, next) => {
    res.header('Access-Control-Allow-Origin', '*');
    res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept');
    if (req.method === 'OPTIONS') {
        res.sendStatus(200);
    } else {
        next();
    }
});

// Rota principal - SUPER SIMPLES
app.get('/', (req, res) => {
    res.send(`
        <!DOCTYPE html>
        <html>
        <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>FUNCIONOU!</title>
            <style>
                body {
                    font-family: Arial, sans-serif;
                    background: linear-gradient(45deg, #FF6B6B, #4ECDC4);
                    color: white;
                    text-align: center;
                    padding: 50px 20px;
                    margin: 0;
                    min-height: 100vh;
                    display: flex;
                    flex-direction: column;
                    justify-content: center;
                }
                .success {
                    font-size: 5em;
                    margin-bottom: 30px;
                    animation: bounce 1s infinite;
                }
                @keyframes bounce {
                    0%, 100% { transform: scale(1); }
                    50% { transform: scale(1.1); }
                }
                h1 {
                    font-size: 3em;
                    margin: 20px 0;
                    text-shadow: 2px 2px 4px rgba(0,0,0,0.5);
                }
                .info {
                    font-size: 1.5em;
                    background: rgba(0,0,0,0.3);
                    padding: 20px;
                    border-radius: 10px;
                    margin: 20px auto;
                    max-width: 400px;
                }
                .btn {
                    background: #4CAF50;
                    color: white;
                    padding: 20px 40px;
                    border: none;
                    border-radius: 10px;
                    font-size: 1.2em;
                    margin: 10px;
                    cursor: pointer;
                    text-decoration: none;
                    display: inline-block;
                }
            </style>
        </head>
        <body>
            <div class="success">🎉</div>
            <h1>CONECTIVIDADE MÓVEL FUNCIONANDO!</h1>
            <div class="info">
                <p><strong>Porta:</strong> 80 (HTTP Padrão)</p>
                <p><strong>IP:</strong> 192.168.1.6</p>
                <p><strong>Timestamp:</strong> ${new Date().toLocaleString('pt-BR')}</p>
            </div>
            <a href="/mobile" class="btn">📱 Ir para App</a>
            <a href="/test" class="btn">🧪 Testar API</a>
        </body>
        </html>
    `);
});

// Rota móvel simples
app.get('/mobile', (req, res) => {
    res.send(`
        <!DOCTYPE html>
        <html>
        <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>App Móvel</title>
            <style>
                body {
                    font-family: Arial, sans-serif;
                    background: #667eea;
                    color: white;
                    padding: 20px;
                    margin: 0;
                }
                .card {
                    background: rgba(255,255,255,0.1);
                    padding: 20px;
                    border-radius: 10px;
                    margin: 15px 0;
                    text-align: center;
                }
                .btn {
                    background: #4CAF50;
                    color: white;
                    padding: 15px 30px;
                    border: none;
                    border-radius: 5px;
                    font-size: 16px;
                    margin: 10px;
                    width: 100%;
                    cursor: pointer;
                }
            </style>
        </head>
        <body>
            <h1>📱 App Móvel - Gestão de Suprimentos</h1>
            <div class="card">
                <h2>✅ Conectividade OK!</h2>
                <p>Servidor funcionando na porta 80</p>
            </div>
            <div class="card">
                <h3>Módulos Disponíveis:</h3>
                <button class="btn">📦 Produtos</button>
                <button class="btn">📋 Pedidos</button>
                <button class="btn">🏢 Fornecedores</button>
                <button class="btn">📊 Relatórios</button>
            </div>
        </body>
        </html>
    `);
});

// API de teste
app.get('/test', (req, res) => {
    res.json({
        success: true,
        message: 'API funcionando na porta 80!',
        timestamp: new Date().toISOString(),
        port: PORT,
        ip: '192.168.1.6',
        userAgent: req.headers['user-agent']
    });
});

// Iniciar servidor
app.listen(PORT, '0.0.0.0', () => {
    console.log('🚀 SERVIDOR DE EMERGÊNCIA FUNCIONANDO NA PORTA 80!');
    console.log('✅ PORTA PADRÃO HTTP - MÁXIMA COMPATIBILIDADE!');
    console.log('');
    console.log('📱 URLs para teste no celular:');
    console.log(`   • http://192.168.1.6/ (SEM PORTA!)`);
    console.log(`   • http://192.168.1.6/mobile`);
    console.log(`   • http://192.168.1.6/test`);
    console.log('');
    console.log('📶 Conecte o celular na rede "Multilaser 5G"');
    console.log('🎯 TESTE ESTAS URLs - SEM NÚMERO DE PORTA!');
}).on('error', (err) => {
    if (err.code === 'EACCES') {
        console.log('❌ ERRO: Porta 80 requer privilégios de administrador');
        console.log('💡 Execute como administrador ou use outra porta');
    } else {
        console.log('❌ Erro:', err.message);
    }
});