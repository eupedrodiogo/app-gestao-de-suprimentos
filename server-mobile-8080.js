const express = require('express');
const path = require('path');
const cors = require('cors');

const app = express();
const PORT = 8080; // Porta que funciona para acesso móvel

// Middleware
app.use(cors({
    origin: '*',
    methods: ['GET', 'POST', 'PUT', 'DELETE'],
    allowedHeaders: ['Content-Type', 'Authorization']
}));

app.use(express.json());
app.use(express.static(path.join(__dirname, 'frontend')));

// Rota de teste móvel
app.get('/api/test', (req, res) => {
    const userAgent = req.get('User-Agent') || '';
    const isMobile = /Mobile|Android|iPhone|iPad/.test(userAgent);
    
    res.json({
        success: true,
        message: 'Conexão móvel funcionando na porta 8080!',
        timestamp: new Date().toISOString(),
        ip: req.ip,
        device: isMobile ? 'mobile' : 'desktop',
        userAgent: userAgent,
        port: PORT
    });
});

// Página de teste móvel
app.get('/test-mobile', (req, res) => {
    res.send(`
    <!DOCTYPE html>
    <html lang="pt-BR">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Teste Móvel - Porta 8080</title>
        <style>
            body {
                font-family: Arial, sans-serif;
                margin: 20px;
                background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                color: white;
                min-height: 100vh;
            }
            .container {
                max-width: 600px;
                margin: 0 auto;
                padding: 20px;
                background: rgba(255,255,255,0.1);
                border-radius: 15px;
                backdrop-filter: blur(10px);
            }
            .success {
                background: #4CAF50;
                padding: 15px;
                border-radius: 10px;
                margin: 20px 0;
                text-align: center;
                font-size: 18px;
                font-weight: bold;
            }
            .info {
                background: rgba(255,255,255,0.2);
                padding: 15px;
                border-radius: 10px;
                margin: 10px 0;
            }
            .btn {
                background: #FF6B6B;
                color: white;
                padding: 15px 30px;
                border: none;
                border-radius: 25px;
                font-size: 16px;
                cursor: pointer;
                width: 100%;
                margin: 10px 0;
            }
            .btn:hover {
                background: #FF5252;
            }
        </style>
    </head>
    <body>
        <div class="container">
            <h1>🎉 Conexão Móvel Funcionando!</h1>
            <div class="success">
                ✅ Servidor acessível na porta 8080
            </div>
            
            <div class="info">
                <h3>📱 Informações do Dispositivo:</h3>
                <p><strong>IP:</strong> ${req.ip}</p>
                <p><strong>User-Agent:</strong> ${req.get('User-Agent')}</p>
                <p><strong>Timestamp:</strong> ${new Date().toLocaleString('pt-BR')}</p>
                <p><strong>Porta:</strong> ${PORT}</p>
            </div>
            
            <button class="btn" onclick="testAPI()">🔧 Testar API</button>
            <button class="btn" onclick="location.href='/mobile'">📱 Ir para App Mobile</button>
            <button class="btn" onclick="location.href='/'">🏠 Página Principal</button>
            
            <div id="result"></div>
        </div>
        
        <script>
            async function testAPI() {
                try {
                    const response = await fetch('/api/test');
                    const data = await response.json();
                    document.getElementById('result').innerHTML = 
                        '<div class="success">API funcionando: ' + data.message + '</div>';
                } catch (error) {
                    document.getElementById('result').innerHTML = 
                        '<div style="background: #f44336; padding: 15px; border-radius: 10px; margin: 20px 0;">Erro: ' + error.message + '</div>';
                }
            }
        </script>
    </body>
    </html>
    `);
});

// Rota para aplicação móvel
app.get('/mobile', (req, res) => {
    res.sendFile(path.join(__dirname, 'frontend', 'mobile-universal.html'));
});

// Rota principal
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'frontend', 'index.html'));
});

// Iniciar servidor
app.listen(PORT, '0.0.0.0', () => {
    console.log(`🚀 Servidor Mobile rodando na porta ${PORT}`);
    console.log(`📱 URLs para acesso móvel:`);
    console.log(`   • http://192.168.1.6:${PORT}/test-mobile`);
    console.log(`   • http://192.168.1.6:${PORT}/mobile`);
    console.log(`   • http://192.168.1.6:${PORT}/api/test`);
    console.log(`💡 Conecte o celular na rede Wi-Fi: Multilaser 5G`);
});