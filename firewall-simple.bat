@echo off
echo ========================================
echo    CONFIGURACAO FIREWALL SIMPLES
echo ========================================
echo.

echo Configurando firewall para porta 8888...
netsh advfirewall firewall add rule name="Mobile-Simple-8888" dir=in action=allow protocol=TCP localport=8888

echo.
echo ✅ Firewall configurado!
echo.
echo 📱 TESTE NO CELULAR:
echo 1. Conecte na mesma rede Wi-Fi
echo 2. Acesse: http://192.168.1.6:8888/mobile
echo.
echo Se não souber o IP, execute: ipconfig
echo.
pause