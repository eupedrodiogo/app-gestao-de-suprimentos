@echo off
echo Configurando firewall para porta 4000...
echo.

REM Adicionar regra para entrada na porta 4000
netsh advfirewall firewall add rule name="Gestao Suprimentos Mobile 4000" dir=in action=allow protocol=TCP localport=4000

echo.
echo Regra de firewall criada com sucesso!
echo A porta 4000 agora está liberada para acesso mobile.
echo.
echo URLs para teste:
echo Local: http://localhost:4000/test
echo Mobile: http://192.168.1.6:4000/test
echo.
pause