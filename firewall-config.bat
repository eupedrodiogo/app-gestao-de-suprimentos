@echo off
echo Configurando Firewall para Acesso Mobile
echo ========================================

echo Removendo regras antigas...
netsh advfirewall firewall delete rule name="Gestao Suprimentos - Porta 3000" >nul 2>&1
netsh advfirewall firewall delete rule name="Gestao Suprimentos - Porta 8080" >nul 2>&1

echo Adicionando regra para porta 3000...
netsh advfirewall firewall add rule name="Gestao Suprimentos - Porta 3000" dir=in action=allow protocol=TCP localport=3000

echo Adicionando regra para porta 8080...
netsh advfirewall firewall add rule name="Gestao Suprimentos - Porta 8080" dir=in action=allow protocol=TCP localport=8080

echo.
echo Configuracao concluida!
echo.
echo ENDERECOS PARA TESTAR NO CELULAR:
echo ================================
echo Servidor Principal: http://192.168.1.6:3000
echo Servidor de Teste:  http://192.168.1.6:8080
echo Pagina de Teste:    http://192.168.1.6:8080/mobile-test
echo.
echo IMPORTANTE: Conecte o celular na mesma rede Wi-Fi!
echo.
pause