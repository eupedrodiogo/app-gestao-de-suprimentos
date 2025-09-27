@echo off
echo ========================================
echo    CONFIGURACAO DE FIREWALL - PORTA 3000
echo ========================================
echo.
echo Este script configura o firewall do Windows para permitir
echo acesso externo ao servidor na porta 3000.
echo.
echo IMPORTANTE: Execute como Administrador!
echo.
pause

echo Configurando regra de firewall...
netsh advfirewall firewall add rule name="Gestao Suprimentos - Porta 3000" dir=in action=allow protocol=TCP localport=3000

if %errorlevel% equ 0 (
    echo.
    echo ✅ Firewall configurado com sucesso!
    echo.
    echo ========================================
    echo    ACESSO MOVEL CONFIGURADO
    echo ========================================
    echo.
    echo Agora voce pode acessar o sistema pelo celular usando:
    echo.
    echo 📱 IP Principal: http://192.168.1.6:3000
    echo 📱 IP Alternativo: http://192.168.56.1:3000
    echo.
    echo Paginas disponiveis:
    echo 💻 Desktop: http://192.168.1.6:3000
    echo 📱 Mobile: http://192.168.1.6:3000/mobile
    echo 📱 Mobile Simples: http://192.168.1.6:3000/mobile-simples.html
    echo 🤖 Dashboard IA: http://192.168.1.6:3000/ai-dashboard
    echo 📷 Computer Vision: http://192.168.1.6:3000/computer-vision
    echo 💬 Chatbot IA: http://192.168.1.6:3000/chatbot
    echo 🎤 Reconhecimento de Voz: http://192.168.1.6:3000/voice-recognition
    echo 📊 Analise de Sentimento: http://192.168.1.6:3000/sentiment-analysis
    echo 🥽 Realidade Aumentada: http://192.168.1.6:3000/ar-inventory
    echo.
    echo DICA: Certifique-se de que o celular esta conectado
    echo       na mesma rede Wi-Fi que o computador.
    echo.
) else (
    echo.
    echo ❌ Erro ao configurar firewall!
    echo    Execute este script como Administrador.
    echo.
)

echo.
pause