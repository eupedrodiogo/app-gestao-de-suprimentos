# Script para Configurar Acesso Mobile
# Execute como Administrador

Write-Host "Configurando Acesso Mobile para o Sistema de Gestao de Suprimentos" -ForegroundColor Cyan
Write-Host "Versao 2.0 - Suporte para portas 3000 e 8080" -ForegroundColor Yellow
Write-Host "=" * 70 -ForegroundColor Gray

# Verificar se esta executando como administrador
$isAdmin = ([Security.Principal.WindowsPrincipal] [Security.Principal.WindowsIdentity]::GetCurrent()).IsInRole([Security.Principal.WindowsBuiltInRole] "Administrator")

if (-not $isAdmin) {
    Write-Host "Este script precisa ser executado como Administrador!" -ForegroundColor Red
    Write-Host "Clique com o botao direito no PowerShell e selecione 'Executar como administrador'" -ForegroundColor Yellow
    Read-Host "Pressione Enter para sair"
    exit 1
}

Write-Host "Executando como Administrador" -ForegroundColor Green

# Obter IPs locais
Write-Host "Obtendo enderecos IP locais..." -ForegroundColor Yellow
$localIPs = Get-NetIPAddress -AddressFamily IPv4 | Where-Object {$_.IPAddress -like "192.168.*" -or $_.IPAddress -like "10.*"} | Select-Object -ExpandProperty IPAddress

Write-Host "IPs encontrados:" -ForegroundColor Cyan
foreach ($ip in $localIPs) {
    Write-Host "   - $ip" -ForegroundColor White
}

$localIP = $localIPs[0]
Write-Host "IP principal selecionado: $localIP" -ForegroundColor Green

# Configurar Firewall
Write-Host "Configurando Firewall do Windows..." -ForegroundColor Yellow

try {
    # Remover regras existentes
    netsh advfirewall firewall delete rule name="Gestao Suprimentos - Porta 3000" 2>$null
    netsh advfirewall firewall delete rule name="Gestao Suprimentos - Porta 8080" 2>$null
    
    # Adicionar novas regras
    netsh advfirewall firewall add rule name="Gestao Suprimentos - Porta 3000" dir=in action=allow protocol=TCP localport=3000
    netsh advfirewall firewall add rule name="Gestao Suprimentos - Porta 8080" dir=in action=allow protocol=TCP localport=8080
    
    Write-Host "Regras de firewall criadas para portas 3000 e 8080!" -ForegroundColor Green
} catch {
    Write-Host "Erro ao configurar firewall: $($_.Exception.Message)" -ForegroundColor Red
}

# Testar Conectividade
Write-Host "Testando conectividade..." -ForegroundColor Yellow

foreach ($ip in $localIPs) {
    # Testar porta 3000
    try {
        $response = Invoke-WebRequest -Uri "http://$ip:3000" -Method Head -TimeoutSec 5 -ErrorAction Stop
        Write-Host "http://$ip:3000 - Servidor principal acessivel" -ForegroundColor Green
    } catch {
        Write-Host "http://$ip:3000 - Servidor principal nao acessivel" -ForegroundColor Red
    }
    
    # Testar porta 8080
    try {
        $response = Invoke-WebRequest -Uri "http://$ip:8080" -Method Head -TimeoutSec 5 -ErrorAction Stop
        Write-Host "http://$ip:8080 - Servidor de teste mobile acessivel" -ForegroundColor Green
    } catch {
        Write-Host "http://$ip:8080 - Servidor de teste mobile nao acessivel" -ForegroundColor Yellow
    }
}

# Instrucoes Finais
Write-Host ""
Write-Host "INSTRUCOES PARA ACESSO MOBILE:" -ForegroundColor Cyan
Write-Host "=" * 50 -ForegroundColor Gray
Write-Host "1. Conecte seu celular na mesma rede Wi-Fi" -ForegroundColor White
Write-Host "2. Abra o navegador do celular" -ForegroundColor White
Write-Host "3. Teste os enderecos na seguinte ordem:" -ForegroundColor White

Write-Host ""
Write-Host "SERVIDOR PRINCIPAL (Porta 3000):" -ForegroundColor Green
foreach ($ip in $localIPs) {
    Write-Host "   http://$ip:3000" -ForegroundColor Green
}

Write-Host ""
Write-Host "SERVIDOR DE TESTE (Porta 8080 - CORS Totalmente Aberto):" -ForegroundColor Yellow
foreach ($ip in $localIPs) {
    Write-Host "   http://$ip:8080" -ForegroundColor Yellow
    Write-Host "   http://$ip:8080/mobile-test" -ForegroundColor Cyan
}

Write-Host ""
Write-Host "PAGINAS DE DIAGNOSTICO:" -ForegroundColor Magenta
Write-Host "   http://$localIP:3000/test-mobile.html" -ForegroundColor Cyan
Write-Host "   http://$localIP:3000/mobile-access.html" -ForegroundColor Cyan

Write-Host ""
Write-Host "ESTRATEGIA DE TESTE:" -ForegroundColor Yellow
Write-Host "   1. Primeiro teste o servidor na porta 8080 (mais permissivo)" -ForegroundColor White
Write-Host "   2. Se funcionar, teste o servidor principal na porta 3000" -ForegroundColor White
Write-Host "   3. Se nao funcionar, verifique firewall e antivirus" -ForegroundColor White

Write-Host ""
Write-Host "Se ainda nao funcionar:" -ForegroundColor Cyan
Write-Host "   - Verifique se o celular esta na mesma rede Wi-Fi" -ForegroundColor White
Write-Host "   - Reinicie o roteador" -ForegroundColor White
Write-Host "   - Desabilite temporariamente o antivirus" -ForegroundColor White
Write-Host "   - Tente usar dados moveis com hotspot" -ForegroundColor White

Write-Host ""
Write-Host "Configuracao concluida! Ambos os servidores configurados." -ForegroundColor Green
Read-Host "Pressione Enter para sair"