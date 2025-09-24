const os = require('os');
const { exec } = require('child_process');
const util = require('util');
const execAsync = util.promisify(exec);

class MobileDiagnostic {
    constructor() {
        this.results = {
            networkInterfaces: {},
            firewall: {},
            connectivity: {},
            cors: {},
            recommendations: []
        };
    }

    // Obter todas as interfaces de rede
    async getNetworkInterfaces() {
        console.log('🔍 Analisando interfaces de rede...');
        
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
                        isEthernet: name.toLowerCase().includes('ethernet') || name.toLowerCase().includes('local')
                    });
                }
            }
        }
        
        this.results.networkInterfaces = validIPs;
        return validIPs;
    }

    // Verificar status do firewall
    async checkFirewall() {
        console.log('🛡️ Verificando configurações de firewall...');
        
        try {
            // Verificar se as regras existem
            const { stdout: rules } = await execAsync('netsh advfirewall firewall show rule name="Gestao Suprimentos - Porta 3000"');
            this.results.firewall.port3000 = rules.includes('Enabled') ? 'Configurado' : 'Não configurado';
        } catch (error) {
            this.results.firewall.port3000 = 'Não configurado';
        }

        try {
            const { stdout: rules } = await execAsync('netsh advfirewall firewall show rule name="Gestao Suprimentos - Porta 8080"');
            this.results.firewall.port8080 = rules.includes('Enabled') ? 'Configurado' : 'Não configurado';
        } catch (error) {
            this.results.firewall.port8080 = 'Não configurado';
        }

        // Verificar status geral do firewall
        try {
            const { stdout: status } = await execAsync('netsh advfirewall show allprofiles state');
            this.results.firewall.status = status.includes('ON') ? 'Ativo' : 'Inativo';
        } catch (error) {
            this.results.firewall.status = 'Erro ao verificar';
        }
    }

    // Testar conectividade nas portas
    async testConnectivity() {
        console.log('🌐 Testando conectividade...');
        
        const validIPs = this.results.networkInterfaces;
        const ports = [3000, 8080];
        
        for (const ipInfo of validIPs) {
            for (const port of ports) {
                const url = `http://${ipInfo.ip}:${port}`;
                try {
                    const { stdout } = await execAsync(`powershell -Command "try { Invoke-WebRequest -Uri '${url}' -Method Head -TimeoutSec 3 -ErrorAction Stop; Write-Output 'SUCCESS' } catch { Write-Output 'FAILED' }"`);
                    
                    this.results.connectivity[`${ipInfo.ip}:${port}`] = {
                        status: stdout.trim() === 'SUCCESS' ? 'Acessível' : 'Inacessível',
                        interface: ipInfo.interface,
                        isWiFi: ipInfo.isWiFi
                    };
                } catch (error) {
                    this.results.connectivity[`${ipInfo.ip}:${port}`] = {
                        status: 'Erro',
                        interface: ipInfo.interface,
                        isWiFi: ipInfo.isWiFi,
                        error: error.message
                    };
                }
            }
        }
    }

    // Verificar configurações CORS
    async checkCORS() {
        console.log('🔒 Verificando configurações CORS...');
        
        try {
            // Testar CORS com requisição OPTIONS
            const validIPs = this.results.networkInterfaces;
            
            for (const ipInfo of validIPs) {
                const url = `http://${ipInfo.ip}:3000`;
                try {
                    const { stdout } = await execAsync(`powershell -Command "try { $response = Invoke-WebRequest -Uri '${url}/api/status' -Method Options -Headers @{'Origin'='http://mobile-test'} -TimeoutSec 3 -ErrorAction Stop; Write-Output $response.Headers['Access-Control-Allow-Origin'] } catch { Write-Output 'CORS_ERROR' }"`);
                    
                    this.results.cors[ipInfo.ip] = {
                        allowOrigin: stdout.trim(),
                        status: stdout.trim() !== 'CORS_ERROR' ? 'Configurado' : 'Erro'
                    };
                } catch (error) {
                    this.results.cors[ipInfo.ip] = {
                        status: 'Erro',
                        error: error.message
                    };
                }
            }
        } catch (error) {
            console.log('Erro ao verificar CORS:', error.message);
        }
    }

    // Gerar recomendações
    generateRecommendations() {
        console.log('💡 Gerando recomendações...');
        
        const recommendations = [];
        
        // Verificar firewall
        if (this.results.firewall.port3000 === 'Não configurado') {
            recommendations.push({
                priority: 'HIGH',
                issue: 'Firewall não configurado para porta 3000',
                solution: 'Execute: netsh advfirewall firewall add rule name="Gestao Suprimentos - Porta 3000" dir=in action=allow protocol=TCP localport=3000',
                category: 'Firewall'
            });
        }

        if (this.results.firewall.port8080 === 'Não configurado') {
            recommendations.push({
                priority: 'MEDIUM',
                issue: 'Firewall não configurado para porta 8080',
                solution: 'Execute: netsh advfirewall firewall add rule name="Gestao Suprimentos - Porta 8080" dir=in action=allow protocol=TCP localport=8080',
                category: 'Firewall'
            });
        }

        // Verificar conectividade
        const inaccessiblePorts = Object.entries(this.results.connectivity)
            .filter(([_, info]) => info.status === 'Inacessível')
            .map(([endpoint, _]) => endpoint);

        if (inaccessiblePorts.length > 0) {
            recommendations.push({
                priority: 'HIGH',
                issue: `Portas inacessíveis: ${inaccessiblePorts.join(', ')}`,
                solution: 'Verifique se os servidores estão rodando e configure o firewall',
                category: 'Conectividade'
            });
        }

        // Verificar interfaces Wi-Fi
        const wifiInterfaces = this.results.networkInterfaces.filter(ip => ip.isWiFi);
        if (wifiInterfaces.length === 0) {
            recommendations.push({
                priority: 'MEDIUM',
                issue: 'Nenhuma interface Wi-Fi detectada',
                solution: 'Conecte-se a uma rede Wi-Fi para facilitar o acesso mobile',
                category: 'Rede'
            });
        }

        this.results.recommendations = recommendations;
    }

    // Executar diagnóstico completo
    async runFullDiagnostic() {
        console.log('🚀 Iniciando diagnóstico completo...\n');
        
        try {
            await this.getNetworkInterfaces();
            await this.checkFirewall();
            await this.testConnectivity();
            await this.checkCORS();
            this.generateRecommendations();
            
            return this.results;
        } catch (error) {
            console.error('Erro durante diagnóstico:', error);
            throw error;
        }
    }

    // Gerar relatório formatado
    generateReport() {
        const report = [];
        
        report.push('📊 RELATÓRIO DE DIAGNÓSTICO MOBILE');
        report.push('=' * 50);
        report.push('');
        
        // Interfaces de rede
        report.push('🌐 INTERFACES DE REDE:');
        this.results.networkInterfaces.forEach(ip => {
            const type = ip.isWiFi ? '📶 Wi-Fi' : ip.isEthernet ? '🔌 Ethernet' : '🔗 Outro';
            report.push(`   ${type}: ${ip.ip} (${ip.interface})`);
        });
        report.push('');
        
        // Firewall
        report.push('🛡️ STATUS DO FIREWALL:');
        report.push(`   Status Geral: ${this.results.firewall.status}`);
        report.push(`   Porta 3000: ${this.results.firewall.port3000}`);
        report.push(`   Porta 8080: ${this.results.firewall.port8080}`);
        report.push('');
        
        // Conectividade
        report.push('🔗 TESTE DE CONECTIVIDADE:');
        Object.entries(this.results.connectivity).forEach(([endpoint, info]) => {
            const icon = info.status === 'Acessível' ? '✅' : '❌';
            const wifiIcon = info.isWiFi ? '📶' : '🔌';
            report.push(`   ${icon} ${wifiIcon} ${endpoint} - ${info.status}`);
        });
        report.push('');
        
        // Recomendações
        if (this.results.recommendations.length > 0) {
            report.push('💡 RECOMENDAÇÕES:');
            this.results.recommendations.forEach((rec, index) => {
                const priorityIcon = rec.priority === 'HIGH' ? '🔴' : rec.priority === 'MEDIUM' ? '🟡' : '🟢';
                report.push(`   ${priorityIcon} ${rec.category}: ${rec.issue}`);
                report.push(`      Solução: ${rec.solution}`);
                report.push('');
            });
        } else {
            report.push('✅ TUDO CONFIGURADO CORRETAMENTE!');
        }
        
        return report.join('\n');
    }
}

// Executar se chamado diretamente
if (require.main === module) {
    const diagnostic = new MobileDiagnostic();
    
    diagnostic.runFullDiagnostic()
        .then(() => {
            console.log('\n' + diagnostic.generateReport());
            
            // Salvar resultados em JSON
            const fs = require('fs');
            fs.writeFileSync('diagnostic-results.json', JSON.stringify(diagnostic.results, null, 2));
            console.log('\n📄 Resultados salvos em: diagnostic-results.json');
        })
        .catch(error => {
            console.error('❌ Erro no diagnóstico:', error);
            process.exit(1);
        });
}

module.exports = MobileDiagnostic;