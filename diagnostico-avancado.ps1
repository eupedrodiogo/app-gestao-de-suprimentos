# Diagnóstico Avançado de Conectividade Móvel
Write-Host "🔍 DIAGNÓSTICO AVANÇADO DE CONECTIVIDADE MÓVEL" -ForegroundColor Cyan
Write-Host "=" * 60 -ForegroundColor Cyan

# 1. Informações da Rede Atual
Write-Host "`n📡 INFORMAÇÕES DA REDE WI-FI:" -ForegroundColor Yellow
netsh wlan show interfaces

# 2. Obter todos os IPs da máquina
Write-Host "`n🌐 IPs DISPONÍVEIS NESTA MÁQUINA:" -ForegroundColor Yellow
Get-NetIPAddress -AddressFamily IPv4 | Where-Object { $_.IPAddress -ne "127.0.0.1" } | ForEach-Object {
    $adapterName = (Get-NetAdapter -InterfaceIndex $_.InterfaceIndex).Name
    Write-Host "  • $($_.IPAddress) - $adapterName" -ForegroundColor Green
}

# 3. Teste de Conectividade Local
Write-Host "`n🔧 TESTE DE CONECTIVIDADE LOCAL:" -ForegroundColor Yellow
$localIPs = @("192.168.1.6", "192.168.56.1")
foreach ($ip in $localIPs) {
    Write-Host "  Testando $ip..." -NoNewline
    try {
        $response = Invoke-WebRequest -Uri "http://$ip:3000/api/test" -UseBasicParsing -TimeoutSec 5
        Write-Host " ✅ OK (Status: $($response.StatusCode))" -ForegroundColor Green
    } catch {
        Write-Host " ❌ FALHOU" -ForegroundColor Red
        Write-Host "    Erro: $($_.Exception.Message)" -ForegroundColor Red
    }
}

# 4. Verificar Portas em Uso
Write-Host "`n🔌 PORTAS EM USO (3000-3010):" -ForegroundColor Yellow
for ($port = 3000; $port -le 3010; $port++) {
    $connection = netstat -ano | findstr ":$port "
    if ($connection) {
        Write-Host "  Porta $port em uso:" -ForegroundColor Green
        Write-Host "    $connection" -ForegroundColor Gray
    }
}

# 5. Teste de Ping para Gateway
Write-Host "`n🏠 TESTE DE CONECTIVIDADE COM GATEWAY:" -ForegroundColor Yellow
$gateway = (Get-NetRoute -DestinationPrefix "0.0.0.0/0").NextHop | Select-Object -First 1
Write-Host "  Gateway: $gateway"
$pingResult = Test-Connection -ComputerName $gateway -Count 2 -Quiet
if ($pingResult) {
    Write-Host "  ✅ Ping para gateway OK" -ForegroundColor Green
} else {
    Write-Host "  ❌ Ping para gateway FALHOU" -ForegroundColor Red
}

# 6. Verificar Firewall
Write-Host "`n🛡️ STATUS DO FIREWALL:" -ForegroundColor Yellow
Get-NetFirewallProfile | ForEach-Object {
    $status = if ($_.Enabled) { "ATIVO" } else { "INATIVO" }
    $color = if ($_.Enabled) { "Red" } else { "Green" }
    Write-Host "  $($_.Name): $status" -ForegroundColor $color
}

# 7. Criar arquivo de servidor de teste
Write-Host "`n🧪 CRIANDO SERVIDOR DE TESTE:" -ForegroundColor Yellow
$testServerContent = @"
const http = require('http');
const server = http.createServer((req, res) => {
    res.writeHead(200, {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
    });
    res.end(JSON.stringify({
        success: true,
        message: 'Servidor de teste funcionando!',
        timestamp: new Date().toISOString(),
        port: 8080
    }));
});
server.listen(8080, '0.0.0.0', () => {
    console.log('Servidor de teste rodando na porta 8080');
});
"@

$testServerContent | Out-File -FilePath "test-server-8080.js" -Encoding UTF8
Write-Host "  ✅ Arquivo test-server-8080.js criado" -ForegroundColor Green

# 8. URLs para Teste
Write-Host "`n📱 URLS PARA TESTE NO CELULAR:" -ForegroundColor Cyan
Write-Host "=" * 40 -ForegroundColor Cyan
Write-Host "Conecte o celular na rede Wi-Fi: Multilaser 5G" -ForegroundColor White
Write-Host ""
Write-Host "URLs principais (porta 3000):" -ForegroundColor Yellow
Write-Host "  • http://192.168.1.6:3000/test-mobile" -ForegroundColor Green
Write-Host "  • http://192.168.1.6:3000/api/test" -ForegroundColor Green
Write-Host ""
Write-Host "URLs de teste (porta 8080 - execute: node test-server-8080.js):" -ForegroundColor Yellow
Write-Host "  • http://192.168.1.6:8080" -ForegroundColor Green
Write-Host "  • http://192.168.56.1:8080" -ForegroundColor Green

# 9. Instruções para Solução
Write-Host "`n🔧 POSSÍVEIS SOLUÇÕES:" -ForegroundColor Cyan
Write-Host "=" * 30 -ForegroundColor Cyan
Write-Host "1. Se o celular não conseguir acessar:" -ForegroundColor White
Write-Host "   • Verifique se está na mesma rede Wi-Fi" -ForegroundColor Gray
Write-Host "   • Roteador pode ter AP Isolation ativado" -ForegroundColor Gray
Write-Host "   • Tente acessar as configurações do roteador" -ForegroundColor Gray
Write-Host ""
Write-Host "2. Para testar AP Isolation:" -ForegroundColor White
Write-Host "   • Execute: node test-server-8080.js" -ForegroundColor Gray
Write-Host "   • Teste no celular: http://192.168.1.6:8080" -ForegroundColor Gray
Write-Host ""
Write-Host "3. Alternativa com ngrok:" -ForegroundColor White
Write-Host "   • Instale ngrok: npm install -g ngrok" -ForegroundColor Gray
Write-Host "   • Execute: ngrok http 3000" -ForegroundColor Gray
Write-Host "   • Use a URL pública gerada" -ForegroundColor Gray

Write-Host "`n✅ DIAGNÓSTICO CONCLUÍDO!" -ForegroundColor Green