# Teste Detalhado de Rede - Conectividade Mobile
Write-Host "=== TESTE DETALHADO DE REDE ===" -ForegroundColor Yellow
Write-Host ""

# 1. Verificar servidor local
Write-Host "1. Testando servidor local..." -ForegroundColor Green
try {
    $response = Invoke-WebRequest -Uri "http://localhost:3000/api/test" -UseBasicParsing -TimeoutSec 5
    Write-Host "   OK - Servidor local funcionando (Status: $($response.StatusCode))" -ForegroundColor Green
} catch {
    Write-Host "   ERRO - Servidor local falhou!" -ForegroundColor Red
    exit 1
}

# 2. Obter IPs da rede
Write-Host ""
Write-Host "2. Obtendo IPs de rede..." -ForegroundColor Green
$ips = Get-NetIPAddress -AddressFamily IPv4 | Where-Object { $_.IPAddress -like "192.168.*" }
foreach ($ip in $ips) {
    Write-Host "   IP encontrado: $($ip.IPAddress)" -ForegroundColor Cyan
}

# 3. Testar IPs especificos
Write-Host ""
Write-Host "3. Testando IPs especificos..." -ForegroundColor Green
$testIPs = @("192.168.1.6", "192.168.56.1")

foreach ($testIP in $testIPs) {
    Write-Host "   Testando $testIP..." -ForegroundColor Yellow
    
    # Teste de ping
    $pingResult = Test-Connection -ComputerName $testIP -Count 1 -Quiet -ErrorAction SilentlyContinue
    if ($pingResult) {
        Write-Host "     OK - Ping funcionando" -ForegroundColor Green
    } else {
        Write-Host "     ERRO - Ping falhou" -ForegroundColor Red
    }
    
    # Teste HTTP
    try {
        $response = Invoke-WebRequest -Uri "http://$testIP:3000/api/test" -UseBasicParsing -TimeoutSec 5
        Write-Host "     OK - HTTP funcionando (Status: $($response.StatusCode))" -ForegroundColor Green
    } catch {
        Write-Host "     ERRO - HTTP falhou: $($_.Exception.Message)" -ForegroundColor Red
    }
    
    Write-Host ""
}

# 4. Verificar firewall
Write-Host "4. Status do Firewall..." -ForegroundColor Green
$profiles = Get-NetFirewallProfile
foreach ($profile in $profiles) {
    $status = if ($profile.Enabled) { "ATIVO" } else { "INATIVO" }
    $color = if ($profile.Enabled) { "Red" } else { "Green" }
    Write-Host "   $($profile.Name): $status" -ForegroundColor $color
}

# 5. Verificar porta 3000
Write-Host ""
Write-Host "5. Verificando porta 3000..." -ForegroundColor Green
$portCheck = netstat -an | Select-String ":3000"
if ($portCheck) {
    Write-Host "   OK - Porta 3000 esta em uso" -ForegroundColor Green
    Write-Host "   $portCheck" -ForegroundColor Cyan
} else {
    Write-Host "   ERRO - Porta 3000 nao encontrada" -ForegroundColor Red
}

# 6. Rede Wi-Fi atual
Write-Host ""
Write-Host "6. Rede Wi-Fi atual..." -ForegroundColor Green
$wifiInfo = netsh wlan show interfaces | Select-String "SSID|Estado"
foreach ($line in $wifiInfo) {
    Write-Host "   $line" -ForegroundColor Cyan
}

Write-Host ""
Write-Host "=== URLS PARA TESTAR NO CELULAR ===" -ForegroundColor Yellow
Write-Host "http://192.168.1.6:3000/test-mobile" -ForegroundColor Green
Write-Host "http://192.168.56.1:3000/test-mobile" -ForegroundColor Green
Write-Host ""
Write-Host "Certifique-se de que o celular esta na mesma rede Wi-Fi!" -ForegroundColor Yellow

Write-Host ""
Write-Host "Pressione qualquer tecla para continuar..."
$null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")