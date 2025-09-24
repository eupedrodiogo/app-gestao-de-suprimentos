# 📱 Guia de Acesso Mobile - Sistema de Gestão de Suprimentos

## 🚀 Solução Rápida

### Passo 1: Execute o Script Automático
1. **Abra o PowerShell como Administrador**
   - Clique com botão direito no menu Iniciar
   - Selecione "Windows PowerShell (Administrador)"

2. **Execute o script de configuração:**
   ```powershell
   cd "C:\Users\pedro\OneDrive\Documentos\Project Site\gestão de suprimentos"
   .\setup-mobile-access.ps1
   ```

### Passo 2: Teste o Acesso
1. **No seu celular:**
   - Conecte na mesma rede Wi-Fi do computador
   - Abra o navegador
   - Digite: `http://192.168.1.6:3000/test-mobile.html`

2. **Se a página de teste carregar:**
   - ✅ Acesso mobile funcionando!
   - Use: `http://192.168.1.6:3000` para acessar o sistema

---

## 🔧 Solução Manual (se o script não funcionar)

### 1. Verificar se o Servidor Está Rodando
```powershell
netstat -an | findstr :3000
```
- Deve mostrar `LISTENING` na porta 3000

### 2. Configurar Firewall Manualmente
```powershell
# Execute como Administrador
New-NetFirewallRule -DisplayName "Node.js Server Port 3000" -Direction Inbound -Protocol TCP -LocalPort 3000 -Action Allow -Profile Any
```

### 3. Obter IP Local
```powershell
Get-NetIPAddress -AddressFamily IPv4 | Where-Object {$_.IPAddress -like "192.168.*"}
```

### 4. Testar Conectividade
```powershell
Invoke-WebRequest -Uri "http://SEU_IP:3000" -Method Head
```

---

## 📋 Endereços de Acesso Disponíveis

### IPs Identificados:
- **Principal:** `http://192.168.1.6:3000`
- **Alternativo:** `http://192.168.56.1:3000`

### Páginas de Teste:
- **Teste Mobile:** `http://192.168.1.6:3000/test-mobile.html`
- **Sistema Principal:** `http://192.168.1.6:3000`
- **Dashboard:** `http://192.168.1.6:3000/dashboard.html`

---

## 🛠️ Solução de Problemas

### Problema: "Não consegue conectar"
**Soluções:**
1. ✅ Verificar se celular está na mesma rede Wi-Fi
2. ✅ Executar script como administrador
3. ✅ Reiniciar o roteador
4. ✅ Desabilitar temporariamente antivírus/firewall
5. ✅ Tentar IP alternativo: `192.168.56.1:3000`

### Problema: "Página não carrega"
**Soluções:**
1. ✅ Verificar se servidor está rodando: `node server.js`
2. ✅ Limpar cache do navegador mobile
3. ✅ Tentar modo anônimo/privado
4. ✅ Verificar se não há proxy configurado

### Problema: "Conexão lenta"
**Soluções:**
1. ✅ Aproximar celular do roteador
2. ✅ Fechar outros apps que usam internet
3. ✅ Reiniciar Wi-Fi do celular
4. ✅ Usar dados móveis com hotspot

---

## 🔍 Diagnóstico Avançado

### Verificar Status do Servidor:
```powershell
# Verificar se está escutando em todas as interfaces
netstat -an | findstr :3000

# Testar acesso local
Invoke-WebRequest -Uri "http://localhost:3000" -Method Head
```

### Verificar Firewall:
```powershell
# Listar regras da porta 3000
Get-NetFirewallRule | Where-Object {$_.DisplayName -like "*3000*"}

# Verificar status do firewall
netsh advfirewall show allprofiles state
```

### Verificar Rede:
```powershell
# Listar interfaces de rede ativas
Get-NetIPAddress -AddressFamily IPv4

# Testar conectividade
Test-NetConnection -ComputerName 192.168.1.6 -Port 3000
```

---

## 📱 Recursos Mobile Implementados

### ✅ Otimizações Implementadas:
- **Meta Tags Mobile:** Viewport, PWA, tema
- **Menu Mobile:** Touch-friendly, responsivo
- **Performance:** Otimizada para dispositivos móveis
- **Touch Events:** Suporte completo a gestos
- **CSS Responsivo:** Layout adaptativo

### ✅ Funcionalidades PWA:
- **Adicionar à Tela Inicial:** Como um app nativo
- **Tema Personalizado:** Cores otimizadas
- **Offline Ready:** Cache inteligente

---

## 📞 Suporte

Se ainda tiver problemas:

1. **Execute o diagnóstico:**
   ```powershell
   .\setup-mobile-access.ps1
   ```

2. **Verifique os logs do servidor** no terminal onde está rodando `node server.js`

3. **Teste a página de diagnóstico:** `http://192.168.1.6:3000/test-mobile.html`

4. **Contate o suporte técnico** com as informações do diagnóstico

---

## 🎯 Status da Implementação

- ✅ Servidor configurado para aceitar conexões externas
- ✅ Meta tags mobile otimizadas
- ✅ Menu mobile responsivo
- ✅ Performance mobile otimizada
- ✅ Touch events implementados
- ✅ PWA configurado
- ✅ Firewall configurado
- ✅ Página de teste criada
- ✅ Script de configuração automática

**Sistema 100% pronto para acesso mobile!** 🚀