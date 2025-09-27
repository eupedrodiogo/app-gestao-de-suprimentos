# Solucao Definitiva - Firewall para Conectividade Mobile
# Execute como Administrador

Write-Host "=== SOLUCAO DEFINITIVA - FIREWALL ===" -ForegroundColor Yellow
Write-Host ""

# Verificar se esta executando como administrador
$isAdmin = ([Security.Principal.WindowsPrincipal] [Security.Principal.WindowsIdentity]::GetCurrent()).IsInRole([Security.Principal.WindowsBuiltInRole] "Administrator")

if (-not $isAdmin) {
    Write-Host "ERRO: Execute este script como Administrador!" -ForegroundColor Red
    Write-Host ""
    Write-Host "Como executar como administrador:" -ForegroundColor Yellow
    Write-Host "1. Abra o PowerShell como Administrador" -ForegroundColor White
    Write-Host "2. Navegue ate a pasta do projeto" -ForegroundColor White
    Write-Host "3. Execute: .\solucao-firewall.ps1" -ForegroundColor White
    Write-Host ""
    pause
    exit 1
}

Write-Host "Executando como administrador... OK" -ForegroundColor Green
Write-Host ""

# 1. Remover regras antigas se existirem
Write-Host "1. Removendo regras antigas..." -ForegroundColor Green
try {
    Remove-NetFirewallRule -DisplayName "Gestao Suprimentos*" -ErrorAction SilentlyContinue
    Write-Host "   Regras antigas removidas" -ForegroundColor Gray
} catch {
    Write-Host "   Nenhuma regra antiga encontrada" -ForegroundColor Gray
}

# 2. Criar regras especificas para a porta 3000
Write-Host ""
Write-Host "2. Criando regras de firewall..." -ForegroundColor Green

# Regra para TCP
try {
    New-NetFirewallRule -DisplayName "Gestao Suprimentos - TCP 3000" -Direction Inbound -Protocol TCP -LocalPort 3000 -Action Allow -Profile Any
    Write-Host "   ✓ Regra TCP criada" -ForegroundColor Green
} catch {
    Write-Host "   ✗ Erro ao criar regra TCP: $($_.Exception.Message)" -ForegroundColor Red
}

# Regra para UDP (caso necessario)
try {
    New-NetFirewallRule -DisplayName "Gestao Suprimentos - UDP 3000" -Direction Inbound -Protocol UDP -LocalPort 3000 -Action Allow -Profile Any
    Write-Host "   ✓ Regra UDP criada" -ForegroundColor Green
} catch {
    Write-Host "   ✗ Erro ao criar regra UDP: $($_.Exception.Message)" -ForegroundColor Red
}

# 3. Verificar se as regras foram criadas
Write-Host ""
Write-Host "3. Verificando regras criadas..." -ForegroundColor Green
$rules = Get-NetFirewallRule -DisplayName "Gestao Suprimentos*"
if ($rules.Count -gt 0) {
    Write-Host "   ✓ $($rules.Count) regras criadas com sucesso" -ForegroundColor Green
    foreach ($rule in $rules) {
        Write-Host "     - $($rule.DisplayName): $($rule.Enabled)" -ForegroundColor Cyan
    }
} else {
    Write-Host "   ✗ Nenhuma regra foi criada!" -ForegroundColor Red
}

# 4. Testar conectividade
Write-Host ""
Write-Host "4. Testando conectividade..." -ForegroundColor Green

# Verificar se o servidor esta rodando
try {
    $response = Invoke-WebRequest -Uri "http://localhost:3000/api/test" -UseBasicParsing -TimeoutSec 5
    Write-Host "   ✓ Servidor local funcionando" -ForegroundColor Green
} catch {
    Write-Host "   ✗ Servidor local nao esta funcionando!" -ForegroundColor Red
    Write-Host "   Execute: node server-universal.js" -ForegroundColor Yellow
}

# Testar IPs de rede
$testIPs = @("192.168.1.6", "192.168.56.1")
foreach ($ip in $testIPs) {
    try {
        $response = Invoke-WebRequest -Uri "http://$ip:3000/api/test" -UseBasicParsing -TimeoutSec 5
        Write-Host "   ✓ $ip:3000 - FUNCIONANDO!" -ForegroundColor Green
    } catch {
        Write-Host "   ✗ $ip:3000 - Ainda bloqueado" -ForegroundColor Red
    }
}

Write-Host ""
Write-Host "=== RESULTADO FINAL ===" -ForegroundColor Yellow
Write-Host ""
Write-Host "URLs para testar no celular:" -ForegroundColor Green
Write-Host "http://192.168.1.6:3000/test-mobile" -ForegroundColor Cyan
Write-Host "http://192.168.56.1:3000/test-mobile" -ForegroundColor Cyan
Write-Host ""
Write-Host "Instrucoes:" -ForegroundColor Yellow
Write-Host "1. Conecte o celular na rede Wi-Fi: Multilaser 5G" -ForegroundColor White
Write-Host "2. Abra o navegador do celular" -ForegroundColor White
Write-Host "3. Digite uma das URLs acima" -ForegroundColor White
Write-Host "4. Deve aparecer a pagina de teste de conectividade" -ForegroundColor White
Write-Host ""

if ($rules.Count -gt 0) {
    Write-Host "✓ Firewall configurado com sucesso!" -ForegroundColor Green
    Write-Host "Se ainda nao funcionar, verifique:" -ForegroundColor Yellow
    Write-Host "• Roteador com isolamento de cliente (AP Isolation)" -ForegroundColor Red
    Write-Host "• Antivirus de terceiros" -ForegroundColor Red
} else {
    Write-Host "✗ Falha na configuracao do firewall!" -ForegroundColor Red
    Write-Host "Tente executar novamente como administrador" -ForegroundColor Yellow
}

Write-Host ""
Write-Host "Pressione qualquer tecla para continuar..."
$null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")