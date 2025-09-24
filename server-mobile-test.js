const express = require('express');
const cors = require('cors');
const path = require('path');

const app = express();
const PORT = 8080; // Porta diferente para não conflitar

console.log('🚀 Iniciando servidor de teste mobile...');

// CORS totalmente permissivo para teste
app.use(cors({
    origin: true, // Permite qualquer origem
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With']
}));

// Middleware básico
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Servir arquivos estáticos
app.use(express.static(path.join(__dirname, 'frontend')));
app.use(express.static(__dirname));

// Middleware de logging
app.use((req, res, next) => {
    const timestamp = new Date().toISOString();
    console.log(`[${timestamp}] ${req.method} ${req.path} - IP: ${req.ip}`);
    next();
});

// Rota de teste específica para mobile
app.get('/api/mobile-test', (req, res) => {
    res.json({
        success: true,
        message: 'Acesso mobile funcionando!',
        timestamp: new Date().toISOString(),
        clientIP: req.ip,
        userAgent: req.get('User-Agent'),
        headers: req.headers
    });
});

// Rota de status do servidor
app.get('/api/status', (req, res) => {
    res.json({
        status: 'online',
        server: 'mobile-test',
        port: PORT,
        timestamp: new Date().toISOString(),
        message: 'Servidor de teste mobile ativo'
    });
});

// Página de teste mobile específica
app.get('/mobile-test', (req, res) => {
    res.send(`
<!DOCTYPE html>
<html lang="pt-BR">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Teste Mobile - Servidor Alternativo</title>
    <style>
        body {
            font-family: Arial, sans-serif;
            margin: 0;
            padding: 20px;
            background: linear-gradient(135deg, #28a745 0%, #20c997 100%);
            color: white;
            min-height: 100vh;
            text-align: center;
        }
        .container {
            max-width: 400px;
            margin: 0 auto;
        }
        .status {
            background: rgba(255,255,255,0.2);
            padding: 20px;
            border-radius: 10px;
            margin: 20px 0;
        }
        .btn {
            background: #fff;
            color: #28a745;
            padding: 15px 30px;
            border: none;
            border-radius: 5px;
            font-size: 16px;
            cursor: pointer;
            margin: 10px;
            text-decoration: none;
            display: inline-block;
            font-weight: bold;
        }
        .btn:hover {
            background: #f8f9fa;
        }
        .info {
            background: rgba(255,255,255,0.1);
            padding: 15px;
            border-radius: 5px;
            margin: 10px 0;
            text-align: left;
        }
        .success {
            color: #28a745;
            font-size: 3em;
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="success">✅</div>
        <h1>Teste Mobile Bem-Sucedido!</h1>
        
        <div class="status">
            <h2>Servidor Alternativo Funcionando</h2>
            <p>Este é o servidor de teste na porta 8080</p>
            <p>CORS está totalmente permissivo</p>
        </div>

        <button class="btn" onclick="testAPI()">🧪 Testar API</button>
        <a href="/" class="btn">🏠 Sistema Principal</a>

        <div class="info">
            <h3>📋 Informações:</h3>
            <p><strong>Porta:</strong> 8080</p>
            <p><strong>CORS:</strong> Totalmente permissivo</p>
            <p><strong>Status:</strong> <span id="status">Verificando...</span></p>
        </div>

        <div id="result" class="info" style="display:none;">
            <h3>🔍 Resultado do Teste:</h3>
            <pre id="apiResult"></pre>
        </div>
    </div>

    <script>
        // Testar status do servidor
        fetch('/api/status')
            .then(response => response.json())
            .then(data => {
                document.getElementById('status').textContent = data.status.toUpperCase();
                console.log('Status do servidor:', data);
            })
            .catch(error => {
                document.getElementById('status').textContent = 'ERRO';
                console.error('Erro ao verificar status:', error);
            });

        // Função para testar API
        function testAPI() {
            fetch('/api/mobile-test')
                .then(response => response.json())
                .then(data => {
                    document.getElementById('result').style.display = 'block';
                    document.getElementById('apiResult').textContent = JSON.stringify(data, null, 2);
                    console.log('Teste da API:', data);
                })
                .catch(error => {
                    document.getElementById('result').style.display = 'block';
                    document.getElementById('apiResult').textContent = 'Erro: ' + error.message;
                    console.error('Erro no teste da API:', error);
                });
        }

        console.log('Página de teste mobile carregada com sucesso!');
    </script>
</body>
</html>
    `);
});

// Rota catch-all para SPA
app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, 'frontend', 'index.html'));
});

// Iniciar servidor
app.listen(PORT, '0.0.0.0', () => {
    const os = require('os');
    const networkInterfaces = os.networkInterfaces();
    let localIPs = [];
    
    // Encontrar todos os IPs locais
    for (const interfaceName in networkInterfaces) {
        const interfaces = networkInterfaces[interfaceName];
        for (const iface of interfaces) {
            if (iface.family === 'IPv4' && !iface.internal) {
                localIPs.push(iface.address);
            }
        }
    }
    
    console.log('🎉 Servidor de teste mobile iniciado com sucesso!');
    console.log('📍 Endereços de acesso:');
    console.log(`   - Local: http://localhost:${PORT}`);
    
    localIPs.forEach(ip => {
        console.log(`   - Mobile: http://${ip}:${PORT}`);
        console.log(`   - Teste: http://${ip}:${PORT}/mobile-test`);
    });
    
    console.log('');
    console.log('🔧 Configurações:');
    console.log('   - CORS: Totalmente permissivo');
    console.log('   - Firewall: Pode precisar de configuração');
    console.log('   - Rede: Certifique-se que o celular está na mesma Wi-Fi');
    console.log('');
    console.log('📱 Para testar no celular:');
    console.log('   1. Conecte o celular na mesma rede Wi-Fi');
    console.log('   2. Abra o navegador do celular');
    console.log(`   3. Digite: http://${localIPs[0] || 'SEU_IP'}:${PORT}/mobile-test`);
});

// Tratamento de erros
process.on('uncaughtException', (error) => {
    console.error('❌ Erro não capturado:', error);
});

process.on('unhandledRejection', (reason, promise) => {
    console.error('❌ Promise rejeitada:', reason);
});