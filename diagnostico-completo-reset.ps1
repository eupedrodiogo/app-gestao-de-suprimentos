# DIAGNÓSTICO COMPLETO - RESET TOTAL
# Script para identificar e resolver problemas de acesso móvel

Write-Host "🔄 DIAGNÓSTICO COMPLETO - RESET TOTAL" -ForegroundColor Cyan
Write-Host "=" * 50 -ForegroundColor Cyan

# 1. INFORMAÇÕES DA REDE
Write-Host "`n📡 1. INFORMAÇÕES DA REDE Wi-Fi" -ForegroundColor Yellow
$wifi = netsh wlan show profiles | Select-String "Perfil de Todos os Usuários"
if ($wifi) {
    $wifiName = ($wifi[0] -split ":")[1].Trim()
    Write-Host "   ✅ Rede Wi-Fi: $wifiName" -ForegroundColor Green
    
    # Detalhes da conexão
    $wifiDetails = netsh wlan show profile name="$wifiName" key=clear
    $ssid = ($wifiDetails | Select-String "SSID" | Select-Object -First 1) -replace ".*: ", ""
    Write-Host "   📶 SSID: $ssid" -ForegroundColor Green
} else {
    Write-Host "   ❌ Nenhuma rede Wi-Fi conectada" -ForegroundColor Red
}

# 2. IPs DISPONÍVEIS
Write-Host "`n🌐 2. ENDEREÇOS IP DISPONÍVEIS" -ForegroundColor Yellow
$ips = Get-NetIPAddress -AddressFamily IPv4 | Where-Object { $_.IPAddress -notlike "127.*" -and $_.IPAddress -notlike "169.*" }
foreach ($ip in $ips) {
    Write-Host "   📍 IP: $($ip.IPAddress) - Interface: $($ip.InterfaceAlias)" -ForegroundColor Green
}

# 3. GATEWAY E CONECTIVIDADE
Write-Host "`n🚪 3. GATEWAY E CONECTIVIDADE" -ForegroundColor Yellow
$gateway = (Get-NetRoute -DestinationPrefix "0.0.0.0/0").NextHop | Select-Object -First 1
if ($gateway) {
    Write-Host "   🚪 Gateway: $gateway" -ForegroundColor Green
    $pingResult = Test-Connection -ComputerName $gateway -Count 2 -Quiet
    if ($pingResult) {
        Write-Host "   ✅ Ping para gateway: SUCESSO" -ForegroundColor Green
    } else {
        Write-Host "   ❌ Ping para gateway: FALHOU" -ForegroundColor Red
    }
}

# 4. STATUS DO FIREWALL
Write-Host "`n🔥 4. STATUS DO FIREWALL" -ForegroundColor Yellow
$firewallProfiles = Get-NetFirewallProfile
foreach ($profile in $firewallProfiles) {
    $status = if ($profile.Enabled) { "ATIVO" } else { "INATIVO" }
    $color = if ($profile.Enabled) { "Red" } else { "Green" }
    Write-Host "   🛡️  $($profile.Name): $status" -ForegroundColor $color
}

# 5. PORTAS EM USO
Write-Host "`n🔌 5. PORTAS EM USO (3000-8080)" -ForegroundColor Yellow
$ports = @(3000, 8080, 8081, 8082)
foreach ($port in $ports) {
    $connection = Get-NetTCPConnection -LocalPort $port -ErrorAction SilentlyContinue
    if ($connection) {
        Write-Host "   🔴 Porta $port: EM USO" -ForegroundColor Red
    } else {
        Write-Host "   🟢 Porta $port: LIVRE" -ForegroundColor Green
    }
}

# 6. REGRAS DE FIREWALL EXISTENTES
Write-Host "`n📋 6. REGRAS DE FIREWALL PARA GESTÃO SUPRIMENTOS" -ForegroundColor Yellow
try {
    $rules = Get-NetFirewallRule -DisplayName "*Gestao*" -ErrorAction SilentlyContinue
    if ($rules) {
        foreach ($rule in $rules) {
            Write-Host "   📜 $($rule.DisplayName) - $($rule.Direction) - $($rule.Action)" -ForegroundColor Cyan
        }
    } else {
        Write-Host "   ℹ️  Nenhuma regra específica encontrada" -ForegroundColor Yellow
    }
} catch {
    Write-Host "   ⚠️  Sem permissão para verificar regras" -ForegroundColor Yellow
}

# 7. TESTE DE CONECTIVIDADE EXTERNA
Write-Host "`n🌍 7. TESTE DE CONECTIVIDADE EXTERNA" -ForegroundColor Yellow
$externalTest = Test-Connection -ComputerName "8.8.8.8" -Count 2 -Quiet
if ($externalTest) {
    Write-Host "   ✅ Conectividade externa: FUNCIONANDO" -ForegroundColor Green
} else {
    Write-Host "   ❌ Conectividade externa: PROBLEMA" -ForegroundColor Red
}

# 8. CRIAÇÃO DE SERVIDOR DE TESTE SIMPLES
Write-Host "`n🧪 8. CRIANDO SERVIDOR DE TESTE MULTI-PORTA" -ForegroundColor Yellow

# Servidor para porta 8081
$serverContent8081 = @"
const http = require('http');
const server = http.createServer((req, res) => {
    res.writeHead(200, {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
    });
    res.end(JSON.stringify({
        success: true,
        message: 'Servidor teste funcionando na porta 8081!',
        timestamp: new Date().toISOString(),
        port: 8081,
        path: req.url
    }));
});
server.listen(8081, '0.0.0.0', () => {
    console.log('🟢 Servidor teste rodando na porta 8081');
});
"@

$serverContent8081 | Out-File -FilePath "test-server-8081.js" -Encoding UTF8
Write-Host "   ✅ Servidor 8081 criado: test-server-8081.js" -ForegroundColor Green

# Servidor para porta 8082
$serverContent8082 = @"
const http = require('http');
const server = http.createServer((req, res) => {
    res.writeHead(200, {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
    });
    res.end(JSON.stringify({
        success: true,
        message: 'Servidor teste funcionando na porta 8082!',
        timestamp: new Date().toISOString(),
        port: 8082,
        path: req.url
    }));
});
server.listen(8082, '0.0.0.0', () => {
    console.log('🟢 Servidor teste rodando na porta 8082');
});
"@

$serverContent8082 | Out-File -FilePath "test-server-8082.js" -Encoding UTF8
Write-Host "   ✅ Servidor 8082 criado: test-server-8082.js" -ForegroundColor Green

# 9. RESUMO E PRÓXIMOS PASSOS
Write-Host "`n📋 9. RESUMO E PRÓXIMOS PASSOS" -ForegroundColor Yellow
Write-Host "   1️⃣  Execute: node test-server-8081.js" -ForegroundColor Cyan
Write-Host "   2️⃣  Execute: node test-server-8082.js" -ForegroundColor Cyan
Write-Host "   3️⃣  Teste no celular (conectado na mesma rede Wi-Fi):" -ForegroundColor Cyan

foreach ($ip in $ips) {
    if ($ip.IPAddress -like "192.168.*") {
        Write-Host "      📱 http://$($ip.IPAddress):8081" -ForegroundColor Green
        Write-Host "      📱 http://$($ip.IPAddress):8082" -ForegroundColor Green
    }
}

Write-Host "`n🔧 COMANDOS PARA EXECUTAR:" -ForegroundColor Yellow
Write-Host "   • Iniciar servidor 8081: node test-server-8081.js" -ForegroundColor White
Write-Host "   • Iniciar servidor 8082: node test-server-8082.js" -ForegroundColor White
Write-Host "   • Testar local 8081: Invoke-WebRequest http://localhost:8081" -ForegroundColor White
Write-Host "   • Testar local 8082: Invoke-WebRequest http://localhost:8082" -ForegroundColor White

Write-Host "`n✅ DIAGNÓSTICO COMPLETO FINALIZADO!" -ForegroundColor Green
Write-Host "=" * 50 -ForegroundColor Cyan