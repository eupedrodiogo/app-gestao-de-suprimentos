Write-Host "========================================"
Write-Host "    DIAGNOSTICO AVANCADO MOBILE"
Write-Host "========================================"
Write-Host ""

function Test-URL {
    param($url, $description)
    try {
        $response = Invoke-WebRequest -Uri $url -TimeoutSec 5 -UseBasicParsing
        Write-Host "OK - $description - Status: $($response.StatusCode)" -ForegroundColor Green
        return $true
    } catch {
        Write-Host "ERRO - $description - $($_.Exception.Message)" -ForegroundColor Red
        return $false
    }
}

Write-Host "1. Testando servidor local..."
$localOK = Test-URL "http://localhost:3000" "Localhost"
$localAPITest = Test-URL "http://localhost:3000/api/test" "API Test Local"
$localMobileTest = Test-URL "http://localhost:3000/test-mobile" "Pagina Test Mobile"

Write-Host ""
Write-Host "2. Testando IPs da rede..."
$ips = Get-NetIPAddress -AddressFamily IPv4 | Where-Object {$_.IPAddress -notlike "127.*" -and $_.IPAddress -notlike "169.*"}
$workingIPs = @()

foreach ($ip in $ips) {
    Write-Host "Testando IP: $($ip.IPAddress)" -ForegroundColor Cyan
    $ipOK = Test-URL "http://$($ip.IPAddress):3000" "Servidor no IP $($ip.IPAddress)"
    $apiOK = Test-URL "http://$($ip.IPAddress):3000/api/test" "API Test no IP $($ip.IPAddress)"
    $mobileOK = Test-URL "http://$($ip.IPAddress):3000/test-mobile" "Mobile Test no IP $($ip.IPAddress)"
    
    if ($ipOK -and $apiOK -and $mobileOK) {
        $workingIPs += $ip.IPAddress
        Write-Host "   IP $($ip.IPAddress) FUNCIONANDO COMPLETAMENTE" -ForegroundColor Green
    }
    Write-Host ""
}

Write-Host "3. Verificando firewall..."
$firewallRule = netsh advfirewall firewall show rule name="Gestao Suprimentos - Porta 3000" 2>$null
if ($firewallRule -match "Habilitado.*Sim") {
    Write-Host "OK - Firewall configurado corretamente" -ForegroundColor Green
} else {
    Write-Host "AVISO - Firewall pode estar bloqueando" -ForegroundColor Yellow
}

Write-Host ""
Write-Host "4. Verificando porta 3000..."
$portCheck = netstat -an | findstr ":3000.*LISTENING"
if ($portCheck) {
    Write-Host "OK - Porta 3000 em uso e escutando" -ForegroundColor Green
} else {
    Write-Host "ERRO - Porta 3000 nao esta escutando" -ForegroundColor Red
}

Write-Host ""
Write-Host "========================================"
Write-Host "    RESULTADO DO DIAGNOSTICO"
Write-Host "========================================"

if ($workingIPs.Count -gt 0) {
    Write-Host "SUCESSO! IPs funcionando:" -ForegroundColor Green
    foreach ($ip in $workingIPs) {
        Write-Host ""
        Write-Host "TESTE NO CELULAR:" -ForegroundColor Yellow
        Write-Host "   http://$ip`:3000/test-mobile" -ForegroundColor White
        Write-Host ""
        Write-Host "DASHBOARD PRINCIPAL:" -ForegroundColor Yellow
        Write-Host "   http://$ip`:3000" -ForegroundColor White
        Write-Host ""
    }
    
    Write-Host "PASSOS PARA TESTAR:" -ForegroundColor Cyan
    Write-Host "1. Conecte o celular na MESMA rede Wi-Fi"
    Write-Host "2. Abra o navegador do celular"
    Write-Host "3. Digite um dos enderecos acima"
    Write-Host "4. Se aparecer a pagina de teste, a conexao esta OK!"
    
} else {
    Write-Host "PROBLEMA DETECTADO!" -ForegroundColor Red
    Write-Host "Nenhum IP esta respondendo corretamente."
    Write-Host ""
    Write-Host "SOLUCOES:" -ForegroundColor Yellow
    Write-Host "1. Execute como Administrador: firewall-mobile-3000.bat"
    Write-Host "2. Verifique se o antivirus nao esta bloqueando"
    Write-Host "3. Reinicie o servidor"
}

Write-Host ""