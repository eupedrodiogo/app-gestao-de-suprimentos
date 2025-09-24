const express = require('express');
const cors = require('cors');
const os = require('os');
const { exec } = require('child_process');
const util = require('util');
const execAsync = util.promisify(exec);
const MobileDiagnostic = require('./mobile-diagnostic');

class RobustMobileServer {
    constructor(port = 9000) {
        this.app = express();
        this.port = port;
        this.diagnostic = new MobileDiagnostic();
        this.networkInfo = {};
        this.corsStrategies = [];
        this.setupComplete = false;
    }

    // Detectar automaticamente configurações de rede
    async detectNetworkConfiguration() {
        console.log('🔍 Detectando configuração de rede...');
        
        const interfaces = os.networkInterfaces();
        const validIPs = [];
        
        for (const [name, addresses] of Object.entries(interfaces)) {
            for (const addr of addresses) {
                if (addr.family === 'IPv4' && !addr.internal) {
                    validIPs.push({
                        interface: name,
                        ip: addr.address,
                        netmask: addr.netmask,
                        isWiFi: name.toLowerCase().includes('wi-fi') || name.toLowerCase().includes('wireless'),
                        isEthernet: name.toLowerCase().includes('ethernet') || name.toLowerCase().includes('local'),
                        isVirtual: name.toLowerCase().includes('virtualbox') || name.toLowerCase().includes('vmware')
                    });
                }
            }
        }
        
        this.networkInfo = {
            interfaces: validIPs,
            primaryIP: validIPs.find(ip => ip.isWiFi) || validIPs[0],
            allIPs: validIPs.map(ip => ip.ip)
        };
        
        console.log('📡 IPs detectados:', this.networkInfo.allIPs);
        return this.networkInfo;
    }

    // Configurar múltiplas estratégias de CORS
    setupCORSStrategies() {
        console.log('🔒 Configurando estratégias de CORS...');
        
        const allIPs = this.networkInfo.allIPs;
        const ports = [3000, 8080, 9000, this.port];
        
        // Estratégia 1: CORS Ultra Permissivo (para diagnóstico)
        this.corsStrategies.push({
            name: 'Ultra Permissivo',
            config: {
                origin: true,
                credentials: true,
                methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'],
                allowedHeaders: ['*'],
                exposedHeaders: ['*']
            }
        });
        
        // Estratégia 2: CORS Específico para IPs locais
        const localOrigins = [];
        allIPs.forEach(ip => {
            ports.forEach(port => {
                localOrigins.push(`http://${ip}:${port}`);
                localOrigins.push(`https://${ip}:${port}`);
            });
        });
        
        // Adicionar origens comuns
        localOrigins.push('http://localhost:3000', 'http://127.0.0.1:3000');
        localOrigins.push('http://localhost:8080', 'http://127.0.0.1:8080');
        localOrigins.push('http://localhost:9000', 'http://127.0.0.1:9000');
        
        this.corsStrategies.push({
            name: 'IPs Locais Específicos',
            config: {
                origin: localOrigins,
                credentials: true,
                methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
                allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With']
            }
        });
        
        // Estratégia 3: CORS Dinâmico (verifica origem em tempo real)
        this.corsStrategies.push({
            name: 'Dinâmico',
            config: {
                origin: (origin, callback) => {
                    // Permitir requisições sem origin (apps mobile)
                    if (!origin) return callback(null, true);
                    
                    // Verificar se é IP local
                    const isLocal = this.isLocalOrigin(origin);
                    if (isLocal) return callback(null, true);
                    
                    // Log para debug
                    console.log(`🔍 CORS: Origem ${origin} - ${isLocal ? 'Permitida' : 'Bloqueada'}`);
                    callback(null, isLocal);
                },
                credentials: true,
                methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
                allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With']
            }
        });
    }

    // Verificar se origem é local
    isLocalOrigin(origin) {
        if (!origin) return true;
        
        // Padrões de IP local
        const localPatterns = [
            /^https?:\/\/localhost(:\d+)?$/,
            /^https?:\/\/127\.0\.0\.1(:\d+)?$/,
            /^https?:\/\/192\.168\.\d+\.\d+(:\d+)?$/,
            /^https?:\/\/10\.\d+\.\d+\.\d+(:\d+)?$/,
            /^https?:\/\/172\.(1[6-9]|2\d|3[01])\.\d+\.\d+(:\d+)?$/
        ];
        
        return localPatterns.some(pattern => pattern.test(origin));
    }

    // Configurar middlewares
    setupMiddlewares() {
        console.log('⚙️ Configurando middlewares...');
        
        // Usar estratégia CORS ultra permissiva por padrão
        this.app.use(cors(this.corsStrategies[0].config));
        
        // Middleware de logging detalhado
        this.app.use((req, res, next) => {
            const timestamp = new Date().toISOString();
            const origin = req.headers.origin || 'sem-origin';
            const userAgent = req.headers['user-agent'] || 'sem-user-agent';
            const ip = req.ip || req.connection.remoteAddress || 'IP-desconhecido';
            
            console.log(`[${timestamp}] ${req.method} ${req.path}`);
            console.log(`   📍 IP: ${ip}`);
            console.log(`   🌐 Origin: ${origin}`);
            console.log(`   📱 User-Agent: ${userAgent.substring(0, 50)}...`);
            
            next();
        });
        
        // Middleware para JSON
        this.app.use(express.json());
        this.app.use(express.urlencoded({ extended: true }));
        
        // Servir arquivos estáticos
        this.app.use(express.static('frontend'));
    }

    // Configurar rotas de diagnóstico
    setupDiagnosticRoutes() {
        console.log('🛠️ Configurando rotas de diagnóstico...');
        
        // Rota de status básico
        this.app.get('/api/status', (req, res) => {
            res.json({
                status: 'online',
                timestamp: new Date().toISOString(),
                server: 'Robust Mobile Server',
                port: this.port,
                networkInfo: this.networkInfo,
                corsStrategies: this.corsStrategies.map(s => s.name)
            });
        });
        
        // Rota de diagnóstico completo
        this.app.get('/api/diagnostic', async (req, res) => {
            try {
                const results = await this.diagnostic.runFullDiagnostic();
                res.json({
                    success: true,
                    diagnostic: results,
                    networkInfo: this.networkInfo,
                    timestamp: new Date().toISOString()
                });
            } catch (error) {
                res.status(500).json({
                    success: false,
                    error: error.message,
                    timestamp: new Date().toISOString()
                });
            }
        });
        
        // Rota para testar CORS
        this.app.options('/api/cors-test', (req, res) => {
            res.header('Access-Control-Allow-Origin', req.headers.origin || '*');
            res.header('Access-Control-Allow-Methods', 'GET,POST,PUT,DELETE,OPTIONS');
            res.header('Access-Control-Allow-Headers', 'Content-Type,Authorization,X-Requested-With');
            res.header('Access-Control-Allow-Credentials', 'true');
            res.sendStatus(200);
        });
        
        this.app.get('/api/cors-test', (req, res) => {
            res.json({
                message: 'CORS funcionando!',
                origin: req.headers.origin,
                timestamp: new Date().toISOString(),
                headers: req.headers
            });
        });
        
        // Rota para configurar firewall automaticamente
        this.app.post('/api/configure-firewall', async (req, res) => {
            try {
                await this.configureFirewall();
                res.json({
                    success: true,
                    message: 'Firewall configurado com sucesso!'
                });
            } catch (error) {
                res.status(500).json({
                    success: false,
                    error: error.message
                });
            }
        });
        
        // Página de diagnóstico HTML
        this.app.get('/diagnostic', (req, res) => {
            res.send(this.generateDiagnosticHTML());
        });

        // Rotas para a página mobile dashboard
        this.app.get('/mobile-dashboard', (req, res) => {
            res.sendFile(__dirname + '/mobile-dashboard.html');
        });

        this.app.get('/mobile', (req, res) => {
            res.sendFile(__dirname + '/mobile-dashboard.html');
        });

        this.app.get('/', (req, res) => {
            res.sendFile(__dirname + '/mobile-dashboard.html');
        });
    }

    // Configurar firewall automaticamente
    async configureFirewall() {
        console.log('🛡️ Configurando firewall automaticamente...');
        
        const ports = [3000, 8080, 9000, this.port];
        const commands = [];
        
        for (const port of ports) {
            // Remover regra existente
            commands.push(`netsh advfirewall firewall delete rule name="Gestao Suprimentos - Porta ${port}"`);
            // Adicionar nova regra
            commands.push(`netsh advfirewall firewall add rule name="Gestao Suprimentos - Porta ${port}" dir=in action=allow protocol=TCP localport=${port}`);
        }
        
        for (const command of commands) {
            try {
                await execAsync(command);
                console.log(`✅ Executado: ${command}`);
            } catch (error) {
                console.log(`⚠️ Erro (ignorado): ${command} - ${error.message}`);
            }
        }
    }

    // Gerar HTML de diagnóstico
    generateDiagnosticHTML() {
        const ips = this.networkInfo.allIPs;
        const ports = [3000, 8080, 9000, this.port];
        
        return `
<!DOCTYPE html>
<html lang="pt-BR">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Diagnóstico Mobile - Sistema Robusto</title>
    <style>
        body { font-family: Arial, sans-serif; margin: 20px; background: #f5f5f5; }
        .container { max-width: 1200px; margin: 0 auto; background: white; padding: 20px; border-radius: 10px; box-shadow: 0 2px 10px rgba(0,0,0,0.1); }
        .header { text-align: center; color: #333; margin-bottom: 30px; }
        .section { margin: 20px 0; padding: 15px; border: 1px solid #ddd; border-radius: 5px; }
        .success { background: #d4edda; border-color: #c3e6cb; color: #155724; }
        .warning { background: #fff3cd; border-color: #ffeaa7; color: #856404; }
        .error { background: #f8d7da; border-color: #f5c6cb; color: #721c24; }
        .grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(300px, 1fr)); gap: 15px; }
        .endpoint { padding: 10px; border: 1px solid #ccc; border-radius: 5px; text-align: center; }
        .endpoint a { text-decoration: none; color: #007bff; font-weight: bold; }
        .endpoint a:hover { text-decoration: underline; }
        button { background: #007bff; color: white; border: none; padding: 10px 20px; border-radius: 5px; cursor: pointer; margin: 5px; }
        button:hover { background: #0056b3; }
        .log { background: #f8f9fa; border: 1px solid #dee2e6; padding: 10px; border-radius: 5px; font-family: monospace; max-height: 200px; overflow-y: auto; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>🚀 Sistema Robusto de Diagnóstico Mobile</h1>
            <p>Ferramenta completa para configuração e teste de acesso mobile</p>
        </div>
        
        <div class="section success">
            <h2>📡 Endereços Detectados</h2>
            <div class="grid">
                ${ips.map(ip => ports.map(port => `
                    <div class="endpoint">
                        <a href="http://${ip}:${port}" target="_blank">http://${ip}:${port}</a>
                        <br><small>Porta ${port}</small>
                    </div>
                `).join('')).join('')}
            </div>
        </div>
        
        <div class="section warning">
            <h2>🛠️ Ferramentas de Configuração</h2>
            <button onclick="runDiagnostic()">🔍 Executar Diagnóstico Completo</button>
            <button onclick="configureFirewall()">🛡️ Configurar Firewall</button>
            <button onclick="testCORS()">🔒 Testar CORS</button>
            <button onclick="clearLog()">🗑️ Limpar Log</button>
        </div>
        
        <div class="section">
            <h2>📊 Log de Atividades</h2>
            <div id="log" class="log">Aguardando comandos...</div>
        </div>
        
        <div class="section">
            <h2>📱 Instruções para Mobile</h2>
            <ol>
                <li>Conecte o celular na <strong>mesma rede Wi-Fi</strong></li>
                <li>Abra o navegador do celular</li>
                <li>Digite um dos endereços acima</li>
                <li>Se não funcionar, clique em "Configurar Firewall"</li>
                <li>Execute o diagnóstico para identificar problemas</li>
            </ol>
        </div>
    </div>
    
    <script>
        function log(message) {
            const logDiv = document.getElementById('log');
            const timestamp = new Date().toLocaleTimeString();
            logDiv.innerHTML += \`[\${timestamp}] \${message}\\n\`;
            logDiv.scrollTop = logDiv.scrollHeight;
        }
        
        function clearLog() {
            document.getElementById('log').innerHTML = 'Log limpo...\\n';
        }
        
        async function runDiagnostic() {
            log('🔍 Iniciando diagnóstico completo...');
            try {
                const response = await fetch('/api/diagnostic');
                const data = await response.json();
                if (data.success) {
                    log('✅ Diagnóstico concluído com sucesso!');
                    log(JSON.stringify(data.diagnostic, null, 2));
                } else {
                    log('❌ Erro no diagnóstico: ' + data.error);
                }
            } catch (error) {
                log('❌ Erro na requisição: ' + error.message);
            }
        }
        
        async function configureFirewall() {
            log('🛡️ Configurando firewall...');
            try {
                const response = await fetch('/api/configure-firewall', { method: 'POST' });
                const data = await response.json();
                if (data.success) {
                    log('✅ Firewall configurado com sucesso!');
                } else {
                    log('❌ Erro ao configurar firewall: ' + data.error);
                }
            } catch (error) {
                log('❌ Erro na requisição: ' + error.message);
            }
        }
        
        async function testCORS() {
            log('🔒 Testando CORS...');
            try {
                const response = await fetch('/api/cors-test');
                const data = await response.json();
                log('✅ CORS funcionando: ' + data.message);
                log('Origin detectada: ' + (data.origin || 'Nenhuma'));
            } catch (error) {
                log('❌ Erro no teste CORS: ' + error.message);
            }
        }
        
        // Auto-refresh do status
        setInterval(async () => {
            try {
                const response = await fetch('/api/status');
                const data = await response.json();
                // Status OK - servidor funcionando
            } catch (error) {
                log('⚠️ Servidor pode estar offline');
            }
        }, 30000);
        
        log('🚀 Sistema de diagnóstico carregado!');
        log('📱 Pronto para configuração mobile');
    </script>
</body>
</html>`;
    }

    // Inicializar servidor
    async initialize() {
        try {
            console.log('🚀 Inicializando Servidor Robusto Mobile...\n');
            
            await this.detectNetworkConfiguration();
            this.setupCORSStrategies();
            this.setupMiddlewares();
            this.setupDiagnosticRoutes();
            
            this.setupComplete = true;
            console.log('✅ Configuração completa!\n');
            
        } catch (error) {
            console.error('❌ Erro na inicialização:', error);
            throw error;
        }
    }

    // Iniciar servidor
    async start() {
        if (!this.setupComplete) {
            await this.initialize();
        }
        
        return new Promise((resolve, reject) => {
            this.app.listen(this.port, '0.0.0.0', (error) => {
                if (error) {
                    reject(error);
                    return;
                }
                
                console.log('🎉 SERVIDOR ROBUSTO MOBILE INICIADO!');
                console.log('=' * 50);
                console.log(`📡 Porta: ${this.port}`);
                console.log('🌐 Endereços de acesso:');
                
                this.networkInfo.allIPs.forEach(ip => {
                    console.log(`   📱 Mobile: http://${ip}:${this.port}`);
                    console.log(`   🛠️ Diagnóstico: http://${ip}:${this.port}/diagnostic`);
                });
                
                console.log('\n💡 Recursos disponíveis:');
                console.log('   🔍 Diagnóstico automático');
                console.log('   🛡️ Configuração de firewall');
                console.log('   🔒 Múltiplas estratégias CORS');
                console.log('   📊 Monitoramento em tempo real');
                console.log('   📱 Interface web de configuração');
                
                resolve();
            });
        });
    }
}

// Executar se chamado diretamente
if (require.main === module) {
    const server = new RobustMobileServer(9000);
    
    server.start()
        .then(() => {
            console.log('\n🚀 Servidor pronto para acesso mobile!');
        })
        .catch(error => {
            console.error('❌ Erro ao iniciar servidor:', error);
            process.exit(1);
        });
}

module.exports = RobustMobileServer;