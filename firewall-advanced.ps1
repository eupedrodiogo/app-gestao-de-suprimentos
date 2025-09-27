# Script avancado de firewall para acesso movel
# Execute como Administrador

Write-Host "========================================"
Write-Host "    FIREWALL AVANCADO PARA MOBILE"
Write-Host "========================================"
Write-Host ""

# Verificar se esta executando como administrador
if (-NOT ([Security.Principal.WindowsPrincipal] [Security.Principal.WindowsIdentity]::GetCurrent()).IsInRole([Security.Principal.WindowsBuiltInRole] "Administrator")) {
    Write-Host "ERRO: Execute este script como Administrador!" -ForegroundColor Red
    pause
    exit 1
}

Write-Host "1. Removendo regras antigas..." -ForegroundColor Cyan
netsh advfirewall firewall delete rule name="Gestao Suprimentos - Porta 3000" >$null 2>&1
netsh advfirewall firewall delete rule name="Node.js Server" >$null 2>&1
netsh advfirewall firewall delete rule name="Gestao Suprimentos - Node.js" >$null 2>&1

Write-Host "2. Adicionando regra especifica para Node.js..." -ForegroundColor Cyan
$nodePath = (Get-Command node -ErrorAction SilentlyContinue).Source
if ($nodePath) {
    netsh advfirewall firewall add rule name="Gestao Suprimentos - Node.js" dir=in action=allow program="$nodePath" enable=yes profile=any
    Write-Host "OK - Regra para Node.js: $nodePath" -ForegroundColor Green
} else {
    Write-Host "AVISO - Node.js nao encontrado no PATH" -ForegroundColor Yellow
}

Write-Host "3. Adicionando regra para porta 3000 (TCP)..." -ForegroundColor Cyan
netsh advfirewall firewall add rule name="Gestao Suprimentos - Porta 3000 TCP" dir=in action=allow protocol=TCP localport=3000 enable=yes profile=any
Write-Host "OK - Regra TCP porta 3000 adicionada" -ForegroundColor Green

Write-Host "4. Adicionando regra para porta 3000 (UDP)..." -ForegroundColor Cyan
netsh advfirewall firewall add rule name="Gestao Suprimentos - Porta 3000 UDP" dir=in action=allow protocol=UDP localport=3000 enable=yes profile=any
Write-Host "OK - Regra UDP porta 3000 adicionada" -ForegroundColor Green

Write-Host "5. Configurando regras para redes locais..." -ForegroundColor Cyan
netsh advfirewall firewall add rule name="Gestao Suprimentos - Rede Local 192.168" dir=in action=allow protocol=TCP localport=3000 remoteip=192.168.0.0/16 enable=yes profile=any
Write-Host "OK - Regra para rede 192.168.x.x adicionada" -ForegroundColor Green

Write-Host "6. Verificando regras criadas..." -ForegroundColor Cyan
$rules = netsh advfirewall firewall show rule name="Gestao Suprimentos*"
if ($rules -match "Habilitado.*Sim") {
    Write-Host "OK - Regras do firewall configuradas corretamente" -ForegroundColor Green
} else {
    Write-Host "AVISO - Verifique as regras manualmente" -ForegroundColor Yellow
}

Write-Host ""
Write-Host "7. Testando conectividade..." -ForegroundColor Cyan
Start-Sleep -Seconds 2
try {
    $response = Invoke-WebRequest -Uri "http://localhost:3000/api/test" -TimeoutSec 5
    Write-Host "OK - Servidor local funcionando: Status $($response.StatusCode)" -ForegroundColor Green
} catch {
    Write-Host "ERRO - Servidor local nao responde" -ForegroundColor Red
}

# Testar IPs da rede
$ips = Get-NetIPAddress -AddressFamily IPv4 | Where-Object {$_.IPAddress -like "192.168.*"}
foreach ($ip in $ips) {
    try {
        $response = Invoke-WebRequest -Uri "http://$($ip.IPAddress):3000/api/test" -TimeoutSec 3
        Write-Host "OK - IP $($ip.IPAddress) funcionando" -ForegroundColor Green
    } catch {
        Write-Host "ERRO - IP $($ip.IPAddress) nao acessivel" -ForegroundColor Red
    }
}

Write-Host ""
Write-Host "========================================"
Write-Host "    CONFIGURACAO AVANCADA CONCLUIDA"
Write-Host "========================================"
Write-Host ""
Write-Host "TESTE AGORA NO CELULAR:" -ForegroundColor Yellow
$workingIPs = Get-NetIPAddress -AddressFamily IPv4 | Where-Object {$_.IPAddress -like "192.168.*"}
foreach ($ip in $workingIPs) {
    Write-Host "http://$($ip.IPAddress):3000/test-mobile" -ForegroundColor White
}
Write-Host ""
Write-Host "Se ainda nao funcionar:" -ForegroundColor Cyan
Write-Host "1. Reinicie o roteador Wi-Fi"
Write-Host "2. Verifique se o celular esta na mesma rede"
Write-Host "3. Teste com outro dispositivo movel"
Write-Host ""