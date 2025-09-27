# RESET COMPLETO DO FIREWALL PARA ACESSO MOBILE
# Execute como Administrador

Write-Host "RESET COMPLETO DO FIREWALL" -ForegroundColor Red

# 1. Remover regras existentes
Write-Host "`nRemovendo regras existentes..." -ForegroundColor Yellow
try {
    Remove-NetFirewallRule -DisplayName "*Gestao*" -ErrorAction SilentlyContinue
    Remove-NetFirewallRule -DisplayName "*Suprimentos*" -ErrorAction SilentlyContinue
    Write-Host "Regras antigas removidas" -ForegroundColor Green
} catch {
    Write-Host "Nenhuma regra anterior encontrada" -ForegroundColor Yellow
}

# 2. Criar regras para múltiplas portas
$ports = @(3000, 8080, 8081, 8082)
foreach ($port in $ports) {
    # Regra de entrada TCP
    New-NetFirewallRule -DisplayName "Mobile Access TCP $port" -Direction Inbound -Protocol TCP -LocalPort $port -Action Allow -Profile Any
    
    # Regra de saída TCP
    New-NetFirewallRule -DisplayName "Mobile Access TCP Out $port" -Direction Outbound -Protocol TCP -LocalPort $port -Action Allow -Profile Any
    
    Write-Host "Regras criadas para porta $port" -ForegroundColor Green
}

# 3. Verificar regras criadas
Write-Host "`nRegras criadas:" -ForegroundColor Yellow
Get-NetFirewallRule -DisplayName "*Mobile Access*" | Select-Object DisplayName, Direction, Action

Write-Host "`nFirewall configurado para acesso mobile!" -ForegroundColor Green