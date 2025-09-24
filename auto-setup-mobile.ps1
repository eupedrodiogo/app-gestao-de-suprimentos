# Script de Configuração Automática para Acesso Mobile
# Sistema Robusto de Gestão de Suprimentos
# Versão: 2.0 - Detecção Automática de Ambiente

param(
    [switch]$Force,
    [switch]$Diagnostic,
    [switch]$InstallNgrok,
    [int]$Port = 9000
)

# Configurações
$ErrorActionPreference = "Continue"
$ProgressPreference = "SilentlyContinue"

# Cores para output
function Write-ColorOutput {
    param([string]$Message, [string]$Color = "White")
    
    $colors = @{
        "Red" = [ConsoleColor]::Red
        "Green" = [ConsoleColor]::Green
        "Yellow" = [ConsoleColor]::Yellow
        "Blue" = [ConsoleColor]::Blue
        "Cyan" = [ConsoleColor]::Cyan
        "Magenta" = [ConsoleColor]::Magenta
        "White" = [ConsoleColor]::White
    }
    
    Write-Host $Message -ForegroundColor $colors[$Color]
}

# Banner
function Show-Banner {
    Clear-Host
    Write-ColorOutput "=" * 60 "Cyan"
    Write-ColorOutput "🚀 CONFIGURAÇÃO AUTOMÁTICA PARA ACESSO MOBILE" "Cyan"
    Write-ColorOutput "   Sistema Robusto de Gestão de Suprimentos v2.0" "White"
    Write-ColorOutput "=" * 60 "Cyan"
    Write-ColorOutput ""
}

# Verificar privilégios de administrador
function Test-Administrator {
    $currentUser = [Security.Principal.WindowsIdentity]::GetCurrent()
    $principal = New-Object Security.Principal.WindowsPrincipal($currentUser)
    return $principal.IsInRole([Security.Principal.WindowsBuiltInRole]::Administrator)
}

# Detectar ambiente de rede
function Get-NetworkEnvironment {
    Write-ColorOutput "🔍 Detectando ambiente de rede..." "Yellow"
    
    $networkInfo = @{
        Interfaces = @()
        PrimaryIP = $null
        AllIPs = @()
        IsWiFiConnected = $false
        IsEthernetConnected = $false
        NetworkType = "Unknown"
    }
    
    try {
        $adapters = Get-NetAdapter | Where-Object { $_.Status -eq "Up" }
        
        foreach ($adapter in $adapters) {
            $ipConfig = Get-NetIPAddress -InterfaceIndex $adapter.InterfaceIndex -AddressFamily IPv4 -ErrorAction SilentlyContinue
            
            foreach ($ip in $ipConfig) {
                if ($ip.IPAddress -notlike "127.*" -and $ip.IPAddress -notlike "169.254.*") {
                    $interfaceInfo = @{
                        Name = $adapter.Name
                        Description = $adapter.InterfaceDescription
                        IP = $ip.IPAddress
                        PrefixLength = $ip.PrefixLength
                        IsWiFi = $adapter.Name -like "*Wi-Fi*" -or $adapter.InterfaceDescription -like "*Wireless*"
                        IsEthernet = $adapter.Name -like "*Ethernet*" -or $adapter.InterfaceDescription -like "*Ethernet*"
                        IsVirtual = $adapter.InterfaceDescription -like "*Virtual*" -or $adapter.InterfaceDescription -like "*VMware*"
                    }
                    
                    $networkInfo.Interfaces += $interfaceInfo
                    $networkInfo.AllIPs += $ip.IPAddress
                    
                    if ($interfaceInfo.IsWiFi) {
                        $networkInfo.IsWiFiConnected = $true
                        if (-not $networkInfo.PrimaryIP) {
                            $networkInfo.PrimaryIP = $ip.IPAddress
                            $networkInfo.NetworkType = "WiFi"
                        }
                    }
                    
                    if ($interfaceInfo.IsEthernet) {
                        $networkInfo.IsEthernetConnected = $true
                        if (-not $networkInfo.PrimaryIP -or $networkInfo.NetworkType -eq "Unknown") {
                            $networkInfo.PrimaryIP = $ip.IPAddress
                            $networkInfo.NetworkType = "Ethernet"
                        }
                    }
                }
            }
        }
        
        Write-ColorOutput "✅ Ambiente detectado:" "Green"
        Write-ColorOutput "   📡 Tipo de rede: $($networkInfo.NetworkType)" "White"
        Write-ColorOutput "   🌐 IP principal: $($networkInfo.PrimaryIP)" "White"
        Write-ColorOutput "   📊 Total de IPs: $($networkInfo.AllIPs.Count)" "White"
        
        return $networkInfo
    }
    catch {
        Write-ColorOutput "❌ Erro ao detectar rede: $($_.Exception.Message)" "Red"
        return $networkInfo
    }
}

# Verificar status do firewall
function Test-FirewallStatus {
    Write-ColorOutput "🛡️ Verificando status do firewall..." "Yellow"
    
    try {
        $firewallProfiles = Get-NetFirewallProfile
        $results = @{
            Enabled = $false
            Profiles = @()
            Rules = @()
        }
        
        foreach ($profile in $firewallProfiles) {
            $profileInfo = @{
                Name = $profile.Name
                Enabled = $profile.Enabled
            }
            $results.Profiles += $profileInfo
            
            if ($profile.Enabled) {
                $results.Enabled = $true
            }
        }
        
        # Verificar regras existentes para nossas portas
        $ports = @(3000, 8080, 9000, $Port)
        foreach ($port in $ports) {
            $rule = Get-NetFirewallRule -DisplayName "*$port*" -ErrorAction SilentlyContinue
            if ($rule) {
                $results.Rules += @{
                    Port = $port
                    Exists = $true
                    Rule = $rule.DisplayName
                }
            } else {
                $results.Rules += @{
                    Port = $port
                    Exists = $false
                    Rule = $null
                }
            }
        }
        
        Write-ColorOutput "✅ Status do firewall verificado" "Green"
        return $results
    }
    catch {
        Write-ColorOutput "❌ Erro ao verificar firewall: $($_.Exception.Message)" "Red"
        return @{ Enabled = $false; Profiles = @(); Rules = @() }
    }
}

# Configurar regras de firewall
function Set-FirewallRules {
    param([array]$Ports, [bool]$Force = $false)
    
    Write-ColorOutput "🔧 Configurando regras de firewall..." "Yellow"
    
    if (-not (Test-Administrator)) {
        Write-ColorOutput "❌ Privilégios de administrador necessários para configurar firewall!" "Red"
        Write-ColorOutput "💡 Execute o script como administrador ou use a opção -Force" "Yellow"
        return $false
    }
    
    $success = $true
    
    foreach ($port in $Ports) {
        try {
            # Remover regra existente
            $existingRule = Get-NetFirewallRule -DisplayName "Gestao Suprimentos - Porta $port" -ErrorAction SilentlyContinue
            if ($existingRule) {
                Remove-NetFirewallRule -DisplayName "Gestao Suprimentos - Porta $port" -ErrorAction SilentlyContinue
                Write-ColorOutput "   🗑️ Regra existente removida para porta $port" "Yellow"
            }
            
            # Criar nova regra
            New-NetFirewallRule -DisplayName "Gestao Suprimentos - Porta $port" -Direction Inbound -Protocol TCP -LocalPort $port -Action Allow -Profile Any | Out-Null
            Write-ColorOutput "   ✅ Regra criada para porta $port" "Green"
        }
        catch {
            Write-ColorOutput "   ❌ Erro ao configurar porta $port`: $($_.Exception.Message)" "Red"
            $success = $false
        }
    }
    
    return $success
}

# Testar conectividade
function Test-Connectivity {
    param([array]$IPs, [array]$Ports)
    
    Write-ColorOutput "🔌 Testando conectividade..." "Yellow"
    
    $results = @()
    
    foreach ($ip in $IPs) {
        foreach ($port in $Ports) {
            try {
                $tcpClient = New-Object System.Net.Sockets.TcpClient
                $connect = $tcpClient.BeginConnect($ip, $port, $null, $null)
                $wait = $connect.AsyncWaitHandle.WaitOne(3000, $false)
                
                if ($wait) {
                    $tcpClient.EndConnect($connect)
                    $results += @{
                        IP = $ip
                        Port = $port
                        Status = "Conectado"
                        Success = $true
                    }
                    Write-ColorOutput "   ✅ $ip`:$port - Conectado" "Green"
                } else {
                    $results += @{
                        IP = $ip
                        Port = $port
                        Status = "Timeout"
                        Success = $false
                    }
                    Write-ColorOutput "   ⏱️ $ip`:$port - Timeout" "Yellow"
                }
                
                $tcpClient.Close()
            }
            catch {
                $results += @{
                    IP = $ip
                    Port = $port
                    Status = "Erro: $($_.Exception.Message)"
                    Success = $false
                }
                Write-ColorOutput "   ❌ $ip`:$port - Erro" "Red"
            }
        }
    }
    
    return $results
}

# Verificar Node.js e dependências
function Test-NodeEnvironment {
    Write-ColorOutput "📦 Verificando ambiente Node.js..." "Yellow"
    
    $nodeInfo = @{
        NodeInstalled = $false
        NodeVersion = $null
        NpmInstalled = $false
        NpmVersion = $null
        ProjectDependencies = $false
    }
    
    try {
        $nodeVersion = node --version 2>$null
        if ($nodeVersion) {
            $nodeInfo.NodeInstalled = $true
            $nodeInfo.NodeVersion = $nodeVersion
            Write-ColorOutput "   ✅ Node.js: $nodeVersion" "Green"
        }
    }
    catch {
        Write-ColorOutput "   ❌ Node.js não encontrado" "Red"
    }
    
    try {
        $npmVersion = npm --version 2>$null
        if ($npmVersion) {
            $nodeInfo.NpmInstalled = $true
            $nodeInfo.NpmVersion = $npmVersion
            Write-ColorOutput "   ✅ NPM: $npmVersion" "Green"
        }
    }
    catch {
        Write-ColorOutput "   ❌ NPM não encontrado" "Red"
    }
    
    if (Test-Path "package.json") {
        if (Test-Path "node_modules") {
            $nodeInfo.ProjectDependencies = $true
            Write-ColorOutput "   ✅ Dependências do projeto instaladas" "Green"
        } else {
            Write-ColorOutput "   ⚠️ Dependências não instaladas - execute 'npm install'" "Yellow"
        }
    }
    
    return $nodeInfo
}

# Instalar ngrok
function Install-Ngrok {
    Write-ColorOutput "🌐 Instalando ngrok..." "Yellow"
    
    try {
        # Verificar se ngrok já está instalado
        $ngrokPath = Get-Command ngrok -ErrorAction SilentlyContinue
        if ($ngrokPath) {
            Write-ColorOutput "   ✅ ngrok já está instalado" "Green"
            return $true
        }
        
        # Tentar instalar via Chocolatey
        $chocoPath = Get-Command choco -ErrorAction SilentlyContinue
        if ($chocoPath) {
            Write-ColorOutput "   📦 Instalando via Chocolatey..." "Yellow"
            choco install ngrok -y
            return $true
        }
        
        # Tentar instalar via Scoop
        $scoopPath = Get-Command scoop -ErrorAction SilentlyContinue
        if ($scoopPath) {
            Write-ColorOutput "   📦 Instalando via Scoop..." "Yellow"
            scoop install ngrok
            return $true
        }
        
        # Download manual
        Write-ColorOutput "   📥 Fazendo download manual..." "Yellow"
        $ngrokUrl = "https://bin.equinox.io/c/4VmDzA7iaHb/ngrok-stable-windows-amd64.zip"
        $tempPath = "$env:TEMP\ngrok.zip"
        $extractPath = "$env:USERPROFILE\ngrok"
        
        Invoke-WebRequest -Uri $ngrokUrl -OutFile $tempPath
        Expand-Archive -Path $tempPath -DestinationPath $extractPath -Force
        
        # Adicionar ao PATH
        $currentPath = [Environment]::GetEnvironmentVariable("PATH", "User")
        if ($currentPath -notlike "*$extractPath*") {
            [Environment]::SetEnvironmentVariable("PATH", "$currentPath;$extractPath", "User")
        }
        
        Write-ColorOutput "   ✅ ngrok instalado com sucesso" "Green"
        Write-ColorOutput "   💡 Reinicie o terminal para usar o ngrok" "Yellow"
        return $true
    }
    catch {
        Write-ColorOutput "   ❌ Erro ao instalar ngrok: $($_.Exception.Message)" "Red"
        return $false
    }
}

# Executar diagnóstico completo
function Start-FullDiagnostic {
    Write-ColorOutput "🔍 EXECUTANDO DIAGNÓSTICO COMPLETO" "Cyan"
    Write-ColorOutput "=" * 50 "Cyan"
    
    $diagnostic = @{
        Timestamp = Get-Date
        Administrator = Test-Administrator
        Network = Get-NetworkEnvironment
        Firewall = Test-FirewallStatus
        Node = Test-NodeEnvironment
        Connectivity = @()
        Recommendations = @()
    }
    
    # Testar conectividade se temos IPs
    if ($diagnostic.Network.AllIPs.Count -gt 0) {
        $ports = @(3000, 8080, 9000, $Port)
        $diagnostic.Connectivity = Test-Connectivity -IPs $diagnostic.Network.AllIPs -Ports $ports
    }
    
    # Gerar recomendações
    if (-not $diagnostic.Administrator) {
        $diagnostic.Recommendations += "Execute como administrador para configurar firewall"
    }
    
    if (-not $diagnostic.Node.NodeInstalled) {
        $diagnostic.Recommendations += "Instale Node.js para executar o servidor"
    }
    
    if (-not $diagnostic.Node.ProjectDependencies) {
        $diagnostic.Recommendations += "Execute 'npm install' para instalar dependências"
    }
    
    if ($diagnostic.Firewall.Enabled) {
        $portsWithoutRules = $diagnostic.Firewall.Rules | Where-Object { -not $_.Exists }
        if ($portsWithoutRules.Count -gt 0) {
            $diagnostic.Recommendations += "Configure regras de firewall para as portas: $($portsWithoutRules.Port -join ', ')"
        }
    }
    
    # Salvar diagnóstico
    $diagnosticJson = $diagnostic | ConvertTo-Json -Depth 10
    $diagnosticPath = "diagnostic-$(Get-Date -Format 'yyyyMMdd-HHmmss').json"
    $diagnosticJson | Out-File -FilePath $diagnosticPath -Encoding UTF8
    
    Write-ColorOutput "📊 RESUMO DO DIAGNÓSTICO" "Cyan"
    Write-ColorOutput "=" * 30 "Cyan"
    Write-ColorOutput "🔐 Administrador: $(if($diagnostic.Administrator){'✅ Sim'}else{'❌ Não'})" "White"
    Write-ColorOutput "🌐 IPs detectados: $($diagnostic.Network.AllIPs.Count)" "White"
    Write-ColorOutput "🛡️ Firewall ativo: $(if($diagnostic.Firewall.Enabled){'✅ Sim'}else{'❌ Não'})" "White"
    Write-ColorOutput "📦 Node.js: $(if($diagnostic.Node.NodeInstalled){'✅ Instalado'}else{'❌ Não instalado'})" "White"
    Write-ColorOutput "🔌 Testes de conectividade: $($diagnostic.Connectivity.Count)" "White"
    Write-ColorOutput ""
    
    if ($diagnostic.Recommendations.Count -gt 0) {
        Write-ColorOutput "💡 RECOMENDAÇÕES:" "Yellow"
        foreach ($rec in $diagnostic.Recommendations) {
            Write-ColorOutput "   • $rec" "Yellow"
        }
        Write-ColorOutput ""
    }
    
    Write-ColorOutput "💾 Diagnóstico salvo em: $diagnosticPath" "Green"
    
    return $diagnostic
}

# Configuração automática completa
function Start-AutoConfiguration {
    param([bool]$Force = $false)
    
    Write-ColorOutput "⚙️ INICIANDO CONFIGURAÇÃO AUTOMÁTICA" "Cyan"
    Write-ColorOutput "=" * 50 "Cyan"
    
    $config = @{
        Success = $true
        Steps = @()
        Errors = @()
    }
    
    # Passo 1: Detectar ambiente
    Write-ColorOutput "1️⃣ Detectando ambiente..." "Blue"
    $network = Get-NetworkEnvironment
    $config.Steps += "Ambiente detectado"
    
    if ($network.AllIPs.Count -eq 0) {
        $config.Success = $false
        $config.Errors += "Nenhum IP válido detectado"
        Write-ColorOutput "❌ Nenhum IP válido detectado!" "Red"
        return $config
    }
    
    # Passo 2: Verificar Node.js
    Write-ColorOutput "2️⃣ Verificando Node.js..." "Blue"
    $node = Test-NodeEnvironment
    if (-not $node.NodeInstalled) {
        $config.Success = $false
        $config.Errors += "Node.js não instalado"
        Write-ColorOutput "❌ Node.js não encontrado! Instale Node.js primeiro." "Red"
        return $config
    }
    $config.Steps += "Node.js verificado"
    
    # Passo 3: Instalar dependências se necessário
    if (-not $node.ProjectDependencies -and (Test-Path "package.json")) {
        Write-ColorOutput "3️⃣ Instalando dependências..." "Blue"
        try {
            npm install
            $config.Steps += "Dependências instaladas"
        }
        catch {
            $config.Errors += "Erro ao instalar dependências: $($_.Exception.Message)"
        }
    }
    
    # Passo 4: Configurar firewall
    Write-ColorOutput "4️⃣ Configurando firewall..." "Blue"
    $ports = @(3000, 8080, 9000, $Port)
    
    if (Test-Administrator) {
        $firewallSuccess = Set-FirewallRules -Ports $ports -Force $Force
        if ($firewallSuccess) {
            $config.Steps += "Firewall configurado"
        } else {
            $config.Errors += "Erro ao configurar firewall"
        }
    } else {
        Write-ColorOutput "⚠️ Sem privilégios de administrador - firewall não configurado" "Yellow"
        $config.Errors += "Firewall não configurado (sem privilégios de admin)"
    }
    
    # Passo 5: Testar conectividade
    Write-ColorOutput "5️⃣ Testando conectividade..." "Blue"
    $connectivity = Test-Connectivity -IPs $network.AllIPs -Ports $ports
    $successfulTests = ($connectivity | Where-Object { $_.Success }).Count
    $config.Steps += "Conectividade testada ($successfulTests/$($connectivity.Count) sucessos)"
    
    Write-ColorOutput "✅ CONFIGURAÇÃO CONCLUÍDA" "Green"
    Write-ColorOutput "📊 Passos executados: $($config.Steps.Count)" "White"
    Write-ColorOutput "❌ Erros encontrados: $($config.Errors.Count)" "White"
    
    return $config
}

# Gerar instruções finais
function Show-FinalInstructions {
    param($NetworkInfo)
    
    Write-ColorOutput "📱 INSTRUÇÕES PARA ACESSO MOBILE" "Cyan"
    Write-ColorOutput "=" * 50 "Cyan"
    
    Write-ColorOutput "1️⃣ CONECTAR O CELULAR" "Yellow"
    Write-ColorOutput "   • Conecte o celular na mesma rede Wi-Fi" "White"
    Write-ColorOutput "   • Rede atual: $($NetworkInfo.NetworkType)" "White"
    Write-ColorOutput ""
    
    Write-ColorOutput "2️⃣ ENDEREÇOS PARA TESTAR" "Yellow"
    foreach ($ip in $NetworkInfo.AllIPs) {
        Write-ColorOutput "   🌐 Servidor Principal: http://$ip`:3000" "Green"
        Write-ColorOutput "   🧪 Servidor Teste: http://$ip`:8080" "Green"
        Write-ColorOutput "   🚀 Servidor Robusto: http://$ip`:$Port" "Green"
        Write-ColorOutput "   🛠️ Diagnóstico: http://$ip`:$Port/diagnostic" "Cyan"
        Write-ColorOutput ""
    }
    
    Write-ColorOutput "3️⃣ INICIAR SERVIDORES" "Yellow"
    Write-ColorOutput "   • Terminal 1: node server.js" "White"
    Write-ColorOutput "   • Terminal 2: node server-mobile-test.js" "White"
    Write-ColorOutput "   • Terminal 3: node server-robust-mobile.js" "White"
    Write-ColorOutput ""
    
    Write-ColorOutput "4️⃣ SOLUÇÃO DE PROBLEMAS" "Yellow"
    Write-ColorOutput "   • Se não conectar, execute como administrador" "White"
    Write-ColorOutput "   • Use a interface de diagnóstico para identificar problemas" "White"
    Write-ColorOutput "   • Execute: .\auto-setup-mobile.ps1 -Diagnostic" "White"
    Write-ColorOutput ""
    
    Write-ColorOutput "💡 DICAS EXTRAS" "Magenta"
    Write-ColorOutput "   • Use o servidor robusto (porta $Port) para melhor experiência" "White"
    Write-ColorOutput "   • A interface de diagnóstico tem ferramentas automáticas" "White"
    Write-ColorOutput "   • Para acesso externo, use: .\auto-setup-mobile.ps1 -InstallNgrok" "White"
}

# Função principal
function Main {
    Show-Banner
    
    if ($Diagnostic) {
        $diagnosticResult = Start-FullDiagnostic
        return
    }
    
    if ($InstallNgrok) {
        Install-Ngrok
        return
    }
    
    # Configuração automática
    $network = Get-NetworkEnvironment
    
    if ($network.AllIPs.Count -eq 0) {
        Write-ColorOutput "❌ Nenhuma interface de rede válida detectada!" "Red"
        Write-ColorOutput "💡 Verifique sua conexão de rede e tente novamente." "Yellow"
        return
    }
    
    $config = Start-AutoConfiguration -Force $Force
    
    Show-FinalInstructions -NetworkInfo $network
    
    Write-ColorOutput "🎉 CONFIGURAÇÃO AUTOMÁTICA CONCLUÍDA!" "Green"
    Write-ColorOutput "📱 Seu sistema está pronto para acesso mobile!" "Green"
}

# Executar função principal
Main