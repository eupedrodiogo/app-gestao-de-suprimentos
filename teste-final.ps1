# Script de Teste Final - Conectividade Mobile
# Execute como Administrador

Write-Host "=== TESTE FINAL DE CONECTIVIDADE MOBILE ===" -ForegroundColor Yellow
Write-Host ""

# Verificar se esta executando como administrador
$isAdmin = ([Security.Principal.WindowsPrincipal] [Security.Principal.WindowsIdentity]::GetCurrent()).IsInRole([Security.Principal.WindowsBuiltInRole] "Administrator")

if (-not $isAdmin) {
    Write-Host "ERRO: Execute este script como Administrador!" -ForegroundColor Red
    Write-Host "Clique com botao direito no PowerShell e selecione 'Executar como administrador'" -ForegroundColor Yellow
    pause
    exit 1
}

Write-Host "1. Verificando servidor local..." -ForegroundColor Green
try {
    $response = Invoke-WebRequest -Uri "http://localhost:3000/api/test" -UseBasicParsing -TimeoutSec 5
    Write-Host "   ✓ Servidor local funcionando (Status: $($response.StatusCode))" -ForegroundColor Green
} catch {
    Write-Host "   ✗ Servidor local nao esta funcionando!" -ForegroundColor Red
    Write-Host "   Execute: node server-universal.js" -ForegroundColor Yellow
    pause
    exit 1
}

Write-Host ""
Write-Host "2. Obtendo IPs da rede..." -ForegroundColor Green
$ips = @()
Get-NetIPAddress -AddressFamily IPv4 | Where-Object { $_.IPAddress -like "192.168.*" -and $_.PrefixOrigin -eq "Dhcp" } | ForEach-Object {
    $ips += $_.IPAddress
    Write-Host "   IP encontrado: $($_.IPAddress)" -ForegroundColor Cyan
}

if ($ips.Count -eq 0) {
    Write-Host "   ✗ Nenhum IP de rede local encontrado!" -ForegroundColor Red
    pause
    exit 1
}

Write-Host ""
Write-Host "3. DESABILITANDO FIREWALL TEMPORARIAMENTE..." -ForegroundColor Yellow
Write-Host "   (Sera reabilitado automaticamente ao final)" -ForegroundColor Gray

# Salvar estado atual do firewall
$firewallState = @{
    Domain = (Get-NetFirewallProfile -Profile Domain).Enabled
    Private = (Get-NetFirewallProfile -Profile Private).Enabled
    Public = (Get-NetFirewallProfile -Profile Public).Enabled
}

# Desabilitar firewall
Set-NetFirewallProfile -Profile Domain,Private,Public -Enabled False
Write-Host "   ✓ Firewall desabilitado temporariamente" -ForegroundColor Green

Write-Host ""
Write-Host "4. Testando conectividade de rede..." -ForegroundColor Green

$workingIPs = @()
foreach ($ip in $ips) {
    try {
        $response = Invoke-WebRequest -Uri "http://$ip:3000/api/test" -UseBasicParsing -TimeoutSec 3
        Write-Host "   ✓ $ip:3000 - FUNCIONANDO (Status: $($response.StatusCode))" -ForegroundColor Green
        $workingIPs += $ip
    } catch {
        Write-Host "   ✗ $ip:3000 - Nao acessivel" -ForegroundColor Red
    }
}

Write-Host ""
Write-Host "5. REABILITANDO FIREWALL..." -ForegroundColor Yellow
# Restaurar estado original do firewall
Set-NetFirewallProfile -Profile Domain -Enabled $firewallState.Domain
Set-NetFirewallProfile -Profile Private -Enabled $firewallState.Private
Set-NetFirewallProfile -Profile Public -Enabled $firewallState.Public
Write-Host "   ✓ Firewall reabilitado" -ForegroundColor Green

Write-Host ""
Write-Host "=== RESULTADOS ===" -ForegroundColor Yellow

if ($workingIPs.Count -gt 0) {
    Write-Host "✓ SUCESSO! IPs funcionando:" -ForegroundColor Green
    foreach ($ip in $workingIPs) {
        Write-Host "  • http://$ip:3000/test-mobile" -ForegroundColor Cyan
        Write-Host "  • http://$ip:3000/api/test" -ForegroundColor Cyan
    }
    
    Write-Host ""
    Write-Host "TESTE NO CELULAR:" -ForegroundColor Yellow
    Write-Host "1. Conecte o celular na mesma rede Wi-Fi (Multilaser 5G)" -ForegroundColor White
    Write-Host "2. Abra o navegador do celular" -ForegroundColor White
    Write-Host "3. Digite um dos IPs acima" -ForegroundColor White
    
    Write-Host ""
    Write-Host "Se ainda nao funcionar, o problema pode ser:" -ForegroundColor Yellow
    Write-Host "• Isolamento de cliente no roteador (AP Isolation)" -ForegroundColor Red
    Write-Host "• Configuracao de seguranca do roteador" -ForegroundColor Red
    Write-Host "• Antivirus de terceiros bloqueando" -ForegroundColor Red
    
} else {
    Write-Host "✗ PROBLEMA: Mesmo com firewall desabilitado, nao foi possivel acessar" -ForegroundColor Red
    Write-Host "Isso indica um problema mais profundo:" -ForegroundColor Yellow
    Write-Host "• Problema na configuracao de rede" -ForegroundColor Red
    Write-Host "• Antivirus de terceiros" -ForegroundColor Red
    Write-Host "• Configuracao do roteador" -ForegroundColor Red
}

Write-Host ""
Write-Host "Pressione qualquer tecla para continuar..."
$null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")