const { spawn, exec } = require('child_process');
const fs = require('fs');
const path = require('path');
const os = require('os');

class NgrokManager {
    constructor() {
        this.ngrokProcess = null;
        this.tunnels = new Map();
        this.isRunning = false;
        this.configPath = path.join(os.homedir(), '.ngrok2', 'ngrok.yml');
        this.logFile = 'ngrok-manager.log';
    }

    // Verificar se ngrok está instalado
    async checkNgrokInstallation() {
        return new Promise((resolve) => {
            exec('ngrok version', (error, stdout, stderr) => {
                if (error) {
                    this.log('❌ ngrok não encontrado no sistema');
                    resolve(false);
                } else {
                    this.log(`✅ ngrok encontrado: ${stdout.trim()}`);
                    resolve(true);
                }
            });
        });
    }

    // Instalar ngrok automaticamente
    async installNgrok() {
        this.log('📦 Tentando instalar ngrok...');
        
        return new Promise((resolve) => {
            // Tentar Chocolatey primeiro
            exec('choco install ngrok -y', (error, stdout, stderr) => {
                if (!error) {
                    this.log('✅ ngrok instalado via Chocolatey');
                    resolve(true);
                    return;
                }
                
                // Tentar Scoop
                exec('scoop install ngrok', (error2, stdout2, stderr2) => {
                    if (!error2) {
                        this.log('✅ ngrok instalado via Scoop');
                        resolve(true);
                        return;
                    }
                    
                    this.log('❌ Falha ao instalar ngrok automaticamente');
                    this.log('💡 Instale manualmente: https://ngrok.com/download');
                    resolve(false);
                });
            });
        });
    }

    // Configurar ngrok
    async setupNgrok(authToken = null) {
        this.log('⚙️ Configurando ngrok...');
        
        if (authToken) {
            return new Promise((resolve) => {
                exec(`ngrok authtoken ${authToken}`, (error, stdout, stderr) => {
                    if (error) {
                        this.log(`❌ Erro ao configurar token: ${error.message}`);
                        resolve(false);
                    } else {
                        this.log('✅ Token de autenticação configurado');
                        resolve(true);
                    }
                });
            });
        } else {
            this.log('⚠️ Nenhum token fornecido - usando modo gratuito (limitado)');
            return true;
        }
    }

    // Criar túnel para uma porta específica
    async createTunnel(port, subdomain = null, protocol = 'http') {
        if (!await this.checkNgrokInstallation()) {
            throw new Error('ngrok não está instalado');
        }

        this.log(`🚀 Criando túnel para porta ${port}...`);
        
        return new Promise((resolve, reject) => {
            const args = [protocol, port];
            
            if (subdomain) {
                args.push('--subdomain', subdomain);
            }
            
            // Adicionar região (opcional)
            args.push('--region', 'us');
            
            const ngrokProcess = spawn('ngrok', args, {
                stdio: ['pipe', 'pipe', 'pipe']
            });
            
            let output = '';
            let errorOutput = '';
            
            ngrokProcess.stdout.on('data', (data) => {
                output += data.toString();
            });
            
            ngrokProcess.stderr.on('data', (data) => {
                errorOutput += data.toString();
            });
            
            // Aguardar um tempo para o túnel ser estabelecido
            setTimeout(async () => {
                try {
                    const tunnelInfo = await this.getTunnelInfo(port);
                    if (tunnelInfo) {
                        this.tunnels.set(port, {
                            process: ngrokProcess,
                            url: tunnelInfo.public_url,
                            port: port,
                            protocol: protocol
                        });
                        
                        this.log(`✅ Túnel criado: ${tunnelInfo.public_url} -> localhost:${port}`);
                        resolve(tunnelInfo);
                    } else {
                        ngrokProcess.kill();
                        reject(new Error('Falha ao obter informações do túnel'));
                    }
                } catch (error) {
                    ngrokProcess.kill();
                    reject(error);
                }
            }, 3000);
            
            ngrokProcess.on('error', (error) => {
                this.log(`❌ Erro no processo ngrok: ${error.message}`);
                reject(error);
            });
            
            ngrokProcess.on('exit', (code) => {
                if (code !== 0) {
                    this.log(`❌ ngrok saiu com código ${code}`);
                    this.log(`Erro: ${errorOutput}`);
                }
            });
        });
    }

    // Obter informações dos túneis ativos
    async getTunnelInfo(port = null) {
        return new Promise((resolve) => {
            exec('curl -s http://localhost:4040/api/tunnels', (error, stdout, stderr) => {
                if (error) {
                    resolve(null);
                    return;
                }
                
                try {
                    const data = JSON.parse(stdout);
                    const tunnels = data.tunnels || [];
                    
                    if (port) {
                        const tunnel = tunnels.find(t => 
                            t.config && t.config.addr && t.config.addr.includes(`:${port}`)
                        );
                        resolve(tunnel);
                    } else {
                        resolve(tunnels);
                    }
                } catch (parseError) {
                    resolve(null);
                }
            });
        });
    }

    // Criar múltiplos túneis
    async createMultipleTunnels(ports, baseSubdomain = null) {
        this.log(`🌐 Criando túneis para portas: ${ports.join(', ')}`);
        
        const results = [];
        
        for (let i = 0; i < ports.length; i++) {
            const port = ports[i];
            const subdomain = baseSubdomain ? `${baseSubdomain}-${port}` : null;
            
            try {
                const tunnel = await this.createTunnel(port, subdomain);
                results.push({
                    port: port,
                    success: true,
                    url: tunnel.public_url,
                    tunnel: tunnel
                });
                
                // Aguardar um pouco entre criações para evitar rate limiting
                await this.sleep(2000);
            } catch (error) {
                this.log(`❌ Falha ao criar túnel para porta ${port}: ${error.message}`);
                results.push({
                    port: port,
                    success: false,
                    error: error.message
                });
            }
        }
        
        return results;
    }

    // Parar todos os túneis
    async stopAllTunnels() {
        this.log('🛑 Parando todos os túneis...');
        
        for (const [port, tunnel] of this.tunnels) {
            try {
                tunnel.process.kill();
                this.log(`✅ Túnel da porta ${port} parado`);
            } catch (error) {
                this.log(`❌ Erro ao parar túnel da porta ${port}: ${error.message}`);
            }
        }
        
        this.tunnels.clear();
        this.isRunning = false;
    }

    // Obter status de todos os túneis
    async getStatus() {
        const status = {
            isRunning: this.isRunning,
            tunnelCount: this.tunnels.size,
            tunnels: [],
            ngrokInstalled: await this.checkNgrokInstallation()
        };
        
        for (const [port, tunnel] of this.tunnels) {
            status.tunnels.push({
                port: port,
                url: tunnel.url,
                protocol: tunnel.protocol,
                active: true
            });
        }
        
        return status;
    }

    // Gerar página HTML de status
    generateStatusHTML() {
        const tunnelsList = Array.from(this.tunnels.values()).map(tunnel => `
            <div class="tunnel-item">
                <h3>Porta ${tunnel.port}</h3>
                <p><strong>URL:</strong> <a href="${tunnel.url}" target="_blank">${tunnel.url}</a></p>
                <p><strong>Protocolo:</strong> ${tunnel.protocol}</p>
                <p><strong>Local:</strong> localhost:${tunnel.port}</p>
            </div>
        `).join('');
        
        return `
<!DOCTYPE html>
<html lang="pt-BR">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Ngrok Manager - Status dos Túneis</title>
    <style>
        body { font-family: Arial, sans-serif; margin: 20px; background: #f5f5f5; }
        .container { max-width: 800px; margin: 0 auto; background: white; padding: 20px; border-radius: 10px; box-shadow: 0 2px 10px rgba(0,0,0,0.1); }
        .header { text-align: center; color: #333; margin-bottom: 30px; }
        .status { padding: 15px; border-radius: 5px; margin: 10px 0; }
        .success { background: #d4edda; border: 1px solid #c3e6cb; color: #155724; }
        .warning { background: #fff3cd; border: 1px solid #ffeaa7; color: #856404; }
        .tunnel-item { border: 1px solid #ddd; padding: 15px; margin: 10px 0; border-radius: 5px; }
        .tunnel-item h3 { margin-top: 0; color: #007bff; }
        .tunnel-item a { color: #007bff; text-decoration: none; }
        .tunnel-item a:hover { text-decoration: underline; }
        button { background: #007bff; color: white; border: none; padding: 10px 20px; border-radius: 5px; cursor: pointer; margin: 5px; }
        button:hover { background: #0056b3; }
        .no-tunnels { text-align: center; color: #666; padding: 40px; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>🌐 Ngrok Manager</h1>
            <p>Gerenciador de Túneis para Acesso Externo</p>
        </div>
        
        <div class="status ${this.tunnels.size > 0 ? 'success' : 'warning'}">
            <h2>Status Atual</h2>
            <p><strong>Túneis Ativos:</strong> ${this.tunnels.size}</p>
            <p><strong>Status:</strong> ${this.isRunning ? 'Executando' : 'Parado'}</p>
            <p><strong>Timestamp:</strong> ${new Date().toLocaleString()}</p>
        </div>
        
        ${this.tunnels.size > 0 ? `
            <div class="tunnels">
                <h2>Túneis Ativos</h2>
                ${tunnelsList}
            </div>
        ` : `
            <div class="no-tunnels">
                <h2>Nenhum túnel ativo</h2>
                <p>Use a API para criar túneis ou execute o script de configuração</p>
            </div>
        `}
        
        <div class="actions">
            <h2>Ações</h2>
            <button onclick="refreshPage()">🔄 Atualizar</button>
            <button onclick="stopTunnels()">🛑 Parar Túneis</button>
            <button onclick="createTunnels()">🚀 Criar Túneis</button>
        </div>
    </div>
    
    <script>
        function refreshPage() {
            location.reload();
        }
        
        async function stopTunnels() {
            try {
                const response = await fetch('/api/ngrok/stop', { method: 'POST' });
                const result = await response.json();
                alert(result.message || 'Túneis parados');
                refreshPage();
            } catch (error) {
                alert('Erro ao parar túneis: ' + error.message);
            }
        }
        
        async function createTunnels() {
            const ports = prompt('Digite as portas separadas por vírgula (ex: 3000,8080,9000):');
            if (!ports) return;
            
            try {
                const response = await fetch('/api/ngrok/create', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ ports: ports.split(',').map(p => parseInt(p.trim())) })
                });
                const result = await response.json();
                alert('Túneis criados! Atualizando página...');
                setTimeout(refreshPage, 2000);
            } catch (error) {
                alert('Erro ao criar túneis: ' + error.message);
            }
        }
    </script>
</body>
</html>`;
    }

    // Utilitários
    sleep(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    log(message) {
        const timestamp = new Date().toISOString();
        const logMessage = `[${timestamp}] ${message}`;
        console.log(logMessage);
        
        // Salvar no arquivo de log
        fs.appendFileSync(this.logFile, logMessage + '\n');
    }
}

// Integração com Express
function addNgrokRoutes(app, ngrokManager) {
    // Status dos túneis
    app.get('/api/ngrok/status', async (req, res) => {
        try {
            const status = await ngrokManager.getStatus();
            res.json(status);
        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    });
    
    // Criar túneis
    app.post('/api/ngrok/create', async (req, res) => {
        try {
            const { ports, subdomain } = req.body;
            
            if (!ports || !Array.isArray(ports)) {
                return res.status(400).json({ error: 'Portas devem ser fornecidas como array' });
            }
            
            const results = await ngrokManager.createMultipleTunnels(ports, subdomain);
            res.json({
                success: true,
                results: results,
                message: `Túneis criados para ${ports.length} portas`
            });
        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    });
    
    // Parar túneis
    app.post('/api/ngrok/stop', async (req, res) => {
        try {
            await ngrokManager.stopAllTunnels();
            res.json({
                success: true,
                message: 'Todos os túneis foram parados'
            });
        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    });
    
    // Página de status HTML
    app.get('/ngrok', (req, res) => {
        res.send(ngrokManager.generateStatusHTML());
    });
}

module.exports = { NgrokManager, addNgrokRoutes };