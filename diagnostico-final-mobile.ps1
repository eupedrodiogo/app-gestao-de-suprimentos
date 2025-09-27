# Diagnóstico Final - Conectividade Móvel
Write-Host "🔍 DIAGNÓSTICO FINAL DE CONECTIVIDADE MÓVEL" -ForegroundColor Cyan
Write-Host "=" * 60

# 1. Verificar IPs disponíveis
Write-Host "`n📡 1. ENDEREÇOS IP DISPONÍVEIS:" -ForegroundColor Yellow
$ips = Get-NetIPAddress -AddressFamily IPv4 | Where-Object { $_.IPAddress -notlike "127.*" -and $_.IPAddress -notlike "169.*" }
foreach ($ip in $ips) {
    Write-Host "   • $($ip.IPAddress) - $($ip.InterfaceAlias)" -ForegroundColor Green
}

# 2. Status da rede Wi-Fi
Write-Host "`n📶 2. STATUS DA REDE WI-FI:" -ForegroundColor Yellow
$wifi = netsh wlan show interfaces
Write-Host $wifi

# 3. Verificar portas em uso
Write-Host "`n🔌 3. PORTAS EM USO:" -ForegroundColor Yellow
$ports = @(3000, 8080, 8081, 8082)
foreach ($port in $ports) {
    $connection = Get-NetTCPConnection -LocalPort $port -ErrorAction SilentlyContinue
    if ($connection) {
        Write-Host "   • Porta $port: EM USO (PID: $($connection.OwningProcess))" -ForegroundColor Green
    } else {
        Write-Host "   • Porta $port: LIVRE" -ForegroundColor Red
    }
}

# 4. Testar conectividade local
Write-Host "`n🧪 4. TESTE DE CONECTIVIDADE LOCAL:" -ForegroundColor Yellow
$testUrls = @(
    "http://192.168.1.6:8081/test-mobile",
    "http://192.168.1.6:8081/api/test",
    "http://localhost:8081/test-mobile"
)

foreach ($url in $testUrls) {
    try {
        $response = Invoke-WebRequest -Uri $url -UseBasicParsing -TimeoutSec 5
        Write-Host "   ✅ $url - Status: $($response.StatusCode)" -ForegroundColor Green
    } catch {
        Write-Host "   ❌ $url - ERRO: $($_.Exception.Message)" -ForegroundColor Red
    }
}

# 5. Verificar firewall
Write-Host "`n🛡️ 5. STATUS DO FIREWALL:" -ForegroundColor Yellow
$firewallStatus = Get-NetFirewallProfile | Select-Object Name, Enabled
foreach ($profile in $firewallStatus) {
    $status = if ($profile.Enabled) { "ATIVO" } else { "INATIVO" }
    $color = if ($profile.Enabled) { "Red" } else { "Green" }
    Write-Host "   • $($profile.Name): $status" -ForegroundColor $color
}

# 6. Verificar regras de firewall para as portas
Write-Host "`n🔥 6. REGRAS DE FIREWALL:" -ForegroundColor Yellow
$ports = @(8081, 8082)
foreach ($port in $ports) {
    $rules = Get-NetFirewallRule | Where-Object { $_.DisplayName -like "*$port*" -or $_.DisplayName -like "*Gestao*" }
    if ($rules) {
        foreach ($rule in $rules) {
            Write-Host "   • $($rule.DisplayName) - $($rule.Enabled) - $($rule.Action)" -ForegroundColor Cyan
        }
    } else {
        Write-Host "   • Nenhuma regra encontrada para porta $port" -ForegroundColor Yellow
    }
}

# 7. Criar servidor de teste simples
Write-Host "`n🚀 7. CRIANDO SERVIDOR DE TESTE SIMPLES:" -ForegroundColor Yellow

$serverCode = @"
const http = require('http');
const server = http.createServer((req, res) => {
    res.writeHead(200, {
        'Content-Type': 'text/html; charset=utf-8',
        'Access-Control-Allow-Origin': '*'
    });
    res.end(`
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
                    <p><strong>Timestamp:</strong> `$ + new Date().toLocaleString('pt-BR') + `$</p>
                    <p><strong>URL:</strong> `$ + req.url + `$</p>
                </div>
            </div>
        </body>
        </html>
    `);
});

server.listen(9000, '0.0.0.0', () => {
    console.log('🟢 SERVIDOR TESTE RODANDO NA PORTA 9000');
    console.log('📱 URLs para teste no celular:');
    console.log('   • http://192.168.1.6:9000');
    console.log('   • http://192.168.56.1:9000');
});
"@

$serverCode | Out-File -FilePath "server-teste-9000.js" -Encoding UTF8

Write-Host "   ✅ Arquivo server-teste-9000.js criado" -ForegroundColor Green

# 8. Instruções finais
Write-Host "`n📋 8. INSTRUÇÕES PARA TESTE:" -ForegroundColor Yellow
Write-Host "   1. Execute: node server-teste-9000.js" -ForegroundColor Cyan
Write-Host "   2. Conecte o celular na rede 'Multilaser 5G'" -ForegroundColor Cyan
Write-Host "   3. Acesse: http://192.168.1.6:9000" -ForegroundColor Cyan
Write-Host "   4. Se não funcionar, tente: http://192.168.56.1:9000" -ForegroundColor Cyan

Write-Host "`n🔍 DIAGNÓSTICO CONCLUÍDO!" -ForegroundColor Green
Write-Host "=" * 60