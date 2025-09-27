# Script para adicionar excecoes temporarias no Windows Defender
# Execute como Administrador

Write-Host "========================================"
Write-Host "    CONFIGURANDO EXCECOES DEFENDER"
Write-Host "========================================"
Write-Host ""

# Verificar se esta executando como administrador
if (-NOT ([Security.Principal.WindowsPrincipal] [Security.Principal.WindowsIdentity]::GetCurrent()).IsInRole([Security.Principal.WindowsBuiltInRole] "Administrator")) {
    Write-Host "ERRO: Execute este script como Administrador!" -ForegroundColor Red
    Write-Host "Clique com botao direito no PowerShell e selecione 'Executar como administrador'" -ForegroundColor Yellow
    pause
    exit 1
}

Write-Host "1. Adicionando excecao para Node.js..." -ForegroundColor Cyan
try {
    # Adicionar excecao para o processo Node.js
    Add-MpPreference -ExclusionProcess "node.exe"
    Write-Host "OK - Excecao para node.exe adicionada" -ForegroundColor Green
} catch {
    Write-Host "AVISO - Excecao para node.exe ja existe ou erro: $($_.Exception.Message)" -ForegroundColor Yellow
}

Write-Host ""
Write-Host "2. Adicionando excecao para a pasta do projeto..." -ForegroundColor Cyan
try {
    $projectPath = Get-Location
    Add-MpPreference -ExclusionPath $projectPath
    Write-Host "OK - Excecao para pasta $projectPath adicionada" -ForegroundColor Green
} catch {
    Write-Host "AVISO - Excecao para pasta ja existe ou erro: $($_.Exception.Message)" -ForegroundColor Yellow
}

Write-Host ""
Write-Host "3. Verificando configuracoes atuais..." -ForegroundColor Cyan
$preferences = Get-MpPreference
Write-Host "Processos excluidos:" -ForegroundColor White
$preferences.ExclusionProcess | ForEach-Object { Write-Host "  - $_" }
Write-Host "Pastas excluidas:" -ForegroundColor White
$preferences.ExclusionPath | ForEach-Object { Write-Host "  - $_" }

Write-Host ""
Write-Host "4. Testando conectividade apos configuracao..." -ForegroundColor Cyan
Start-Sleep -Seconds 2

# Testar conectividade
try {
    $response = Invoke-WebRequest -Uri "http://localhost:3000/api/test" -TimeoutSec 5
    Write-Host "OK - Servidor respondendo: Status $($response.StatusCode)" -ForegroundColor Green
} catch {
    Write-Host "ERRO - Servidor nao responde: $($_.Exception.Message)" -ForegroundColor Red
}

Write-Host ""
Write-Host "========================================"
Write-Host "    CONFIGURACAO CONCLUIDA"
Write-Host "========================================"
Write-Host ""
Write-Host "PROXIMOS PASSOS:" -ForegroundColor Yellow
Write-Host "1. Teste novamente o acesso movel"
Write-Host "2. Se ainda nao funcionar, execute: .\firewall-advanced.ps1"
Write-Host "3. Verifique se o celular esta na mesma rede Wi-Fi"
Write-Host ""
Write-Host "Para remover as excecoes depois:" -ForegroundColor Cyan
Write-Host "Remove-MpPreference -ExclusionProcess 'node.exe'"
Write-Host "Remove-MpPreference -ExclusionPath '$((Get-Location).Path)'"
Write-Host ""