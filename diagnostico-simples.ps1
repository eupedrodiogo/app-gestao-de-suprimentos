# Diagnostico Simples de Conectividade Movel
Write-Host "DIAGNOSTICO DE CONECTIVIDADE MOVEL" -ForegroundColor Cyan
Write-Host "=================================" -ForegroundColor Cyan

# 1. Informacoes da Rede
Write-Host "`nINFORMACOES DA REDE WI-FI:" -ForegroundColor Yellow
netsh wlan show interfaces

# 2. IPs da maquina
Write-Host "`nIPS DISPONIVEIS:" -ForegroundColor Yellow
Get-NetIPAddress -AddressFamily IPv4 | Where-Object { $_.IPAddress -ne "127.0.0.1" } | ForEach-Object {
    Write-Host "  $($_.IPAddress)" -ForegroundColor Green
}

# 3. Teste de conectividade local
Write-Host "`nTESTE DE CONECTIVIDADE LOCAL:" -ForegroundColor Yellow
$ips = @("192.168.1.6", "192.168.56.1")
foreach ($ip in $ips) {
    Write-Host "Testando $ip..." -NoNewline
    try {
        $response = Invoke-WebRequest -Uri "http://$ip:3000/api/test" -UseBasicParsing -TimeoutSec 5
        Write-Host " OK (Status: $($response.StatusCode))" -ForegroundColor Green
    } catch {
        Write-Host " FALHOU" -ForegroundColor Red
    }
}

# 4. Status do Firewall
Write-Host "`nSTATUS DO FIREWALL:" -ForegroundColor Yellow
Get-NetFirewallProfile | ForEach-Object {
    $status = if ($_.Enabled) { "ATIVO" } else { "INATIVO" }
    Write-Host "  $($_.Name): $status" -ForegroundColor White
}

# 5. Gateway
Write-Host "`nTESTE DE GATEWAY:" -ForegroundColor Yellow
$gateway = (Get-NetRoute -DestinationPrefix "0.0.0.0/0").NextHop | Select-Object -First 1
Write-Host "Gateway: $gateway"
$pingResult = Test-Connection -ComputerName $gateway -Count 2 -Quiet
if ($pingResult) {
    Write-Host "Ping para gateway: OK" -ForegroundColor Green
} else {
    Write-Host "Ping para gateway: FALHOU" -ForegroundColor Red
}

# 6. Criar servidor de teste
Write-Host "`nCRIANDO SERVIDOR DE TESTE:" -ForegroundColor Yellow
$testServer = @"
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

$testServer | Out-File -FilePath "test-server-8080.js" -Encoding UTF8
Write-Host "Arquivo test-server-8080.js criado" -ForegroundColor Green

# 7. URLs para teste
Write-Host "`nURLS PARA TESTE NO CELULAR:" -ForegroundColor Cyan
Write-Host "Conecte o celular na rede: Multilaser 5G" -ForegroundColor White
Write-Host ""
Write-Host "URLs principais (porta 3000):" -ForegroundColor Yellow
Write-Host "  http://192.168.1.6:3000/test-mobile" -ForegroundColor Green
Write-Host "  http://192.168.1.6:3000/api/test" -ForegroundColor Green
Write-Host ""
Write-Host "URLs de teste (execute: node test-server-8080.js):" -ForegroundColor Yellow
Write-Host "  http://192.168.1.6:8080" -ForegroundColor Green
Write-Host "  http://192.168.56.1:8080" -ForegroundColor Green

Write-Host "`nDIAGNOSTICO CONCLUIDO!" -ForegroundColor Green