const express = require('express');
const cors = require('cors');
const path = require('path');
const os = require('os');

const app = express();
const PORT = 8888;

// CORS ultra permissivo - aceita tudo
app.use(cors({
    origin: true,
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['*']
}));

// Middleware básico
app.use(express.json());
app.use(express.static(path.join(__dirname, 'frontend')));

// Função para obter IP local
function getLocalIP() {
    const interfaces = os.networkInterfaces();
    for (const name of Object.keys(interfaces)) {
        for (const iface of interfaces[name]) {
            if (iface.family === 'IPv4' && !iface.internal) {
                return iface.address;
            }
        }
    }
    return 'localhost';
}

// Rotas básicas para teste
app.get('/api/test', (req, res) => {
    res.json({ 
        message: '✅ Servidor funcionando!', 
        timestamp: new Date().toISOString(),
        ip: req.ip,
        userAgent: req.get('User-Agent')
    });
});

app.get('/api/mobile-check', (req, res) => {
    res.json({ 
        status: 'success',
        message: '📱 Acesso mobile funcionando!',
        server: 'mobile-simple',
        port: PORT,
        timestamp: new Date().toISOString()
    });
});

// Página de teste mobile
app.get('/mobile', (req, res) => {
    res.send(`
<!DOCTYPE html>
<html lang="pt-BR">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Teste Mobile - Simples</title>
    <style>
        body {
            font-family: Arial, sans-serif;
            padding: 20px;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
            min-height: 100vh;
            margin: 0;
        }
        .container {
            max-width: 400px;
            margin: 0 auto;
            text-align: center;
        }
        .card {
            background: rgba(255,255,255,0.1);
            padding: 20px;
            border-radius: 15px;
            margin: 20px 0;
            backdrop-filter: blur(10px);
        }
        button {
            background: #4CAF50;
            color: white;
            border: none;
            padding: 15px 30px;
            border-radius: 25px;
            font-size: 16px;
            cursor: pointer;
            margin: 10px;
            width: 100%;
        }
        button:hover {
            background: #45a049;
        }
        .result {
            margin-top: 20px;
            padding: 15px;
            background: rgba(255,255,255,0.2);
            border-radius: 10px;
            word-break: break-all;
        }
        .success { color: #4CAF50; }
        .error { color: #f44336; }
    </style>
</head>
<body>
    <div class="container">
        <h1>🚀 Teste Mobile Simples</h1>
        
        <div class="card">
            <h2>✅ Servidor Funcionando!</h2>
            <p>Se você está vendo esta página, o servidor está acessível do seu celular!</p>
        </div>

        <div class="card">
            <h3>🧪 Testes de API</h3>
            <button onclick="testAPI()">Testar API</button>
            <button onclick="testMobile()">Testar Mobile Check</button>
            <div id="result" class="result" style="display:none;"></div>
        </div>

        <div class="card">
            <h3>📱 Informações</h3>
            <p><strong>Porta:</strong> ${PORT}</p>
            <p><strong>Hora:</strong> ${new Date().toLocaleString('pt-BR')}</p>
            <p><strong>IP do Servidor:</strong> ${getLocalIP()}</p>
        </div>
    </div>

    <script>
        function showResult(message, isSuccess = true) {
            const result = document.getElementById('result');
            result.style.display = 'block';
            result.className = 'result ' + (isSuccess ? 'success' : 'error');
            result.innerHTML = message;
        }

        async function testAPI() {
            try {
                const response = await fetch('/api/test');
                const data = await response.json();
                showResult('✅ API funcionando!<br>' + JSON.stringify(data, null, 2), true);
            } catch (error) {
                showResult('❌ Erro na API: ' + error.message, false);
            }
        }

        async function testMobile() {
            try {
                const response = await fetch('/api/mobile-check');
                const data = await response.json();
                showResult('📱 Mobile check OK!<br>' + JSON.stringify(data, null, 2), true);
            } catch (error) {
                showResult('❌ Erro no mobile check: ' + error.message, false);
            }
        }

        // Teste automático ao carregar
        window.onload = function() {
            testAPI();
        }
    </script>
</body>
</html>
    `);
});

// Servir arquivo de teste específico
app.get('/TESTE-CELULAR.html', (req, res) => {
    res.sendFile(path.join(__dirname, 'TESTE-CELULAR.html'));
});

// Rota para a página mobile principal
app.get('/index-mobile.html', (req, res) => {
    res.sendFile(path.join(__dirname, 'index-mobile.html'));
});

// Rota alternativa para index mobile
app.get('/index', (req, res) => {
    res.sendFile(path.join(__dirname, 'index-mobile.html'));
});

app.get('/', (req, res) => {
    res.redirect('/mobile');
});

// Iniciar servidor
const localIP = getLocalIP();

app.listen(PORT, '0.0.0.0', () => {
    console.log('🚀 SERVIDOR MOBILE SIMPLES INICIADO!');
    console.log('=====================================');
    console.log(`📱 Acesso Mobile: http://${localIP}:${PORT}/mobile`);
    console.log(`🏠 Acesso Local: http://localhost:${PORT}/mobile`);
    console.log(`🌐 Frontend: http://${localIP}:${PORT}`);
    console.log('=====================================');
    console.log('✅ CORS configurado para aceitar TUDO');
    console.log('✅ Servidor escutando em todas as interfaces (0.0.0.0)');
    console.log('✅ Página de teste mobile disponível');
    console.log('');
    console.log('📋 INSTRUÇÕES PARA TESTE:');
    console.log('1. Conecte o celular na mesma rede Wi-Fi');
    console.log(`2. Acesse: http://${localIP}:${PORT}/mobile`);
    console.log('3. Se não funcionar, configure o firewall:');
    console.log(`   netsh advfirewall firewall add rule name="Mobile-${PORT}" dir=in action=allow protocol=TCP localport=${PORT}`);
});