@echo off
title WhatsApp Bot
color 0A

:: Vai para a pasta onde este .bat esta localizado (ESSENCIAL)
cd /d "%~dp0"

:: Confirma o diretorio no terminal para debug
echo.
echo  Pasta do bot: %~dp0
echo.
echo  ================================
echo   Iniciando WhatsApp Bot...
echo  ================================
echo.

:: Verifica se package.json existe (confirma que esta na pasta certa)
if not exist "package.json" (
    echo  ERRO: Nao encontrei o package.json nesta pasta!
    echo  Mova este arquivo para dentro da pasta do bot.
    echo.
    pause
    exit
)

:: Verifica se node_modules existe, se nao instala
if not exist "node_modules" (
    echo  Primeira execucao - instalando dependencias...
    echo  Aguarde, pode demorar alguns minutos...
    echo.
    npm install
    echo.
    echo  Instalacao concluida!
    echo.
)

echo  Bot iniciando...
echo.
echo  ================================
echo   PAINEL DE CONTROLE WEB:
echo   Abra no navegador:
echo   http://localhost:3000
echo  ================================
echo.
echo  O QR Code aparecera no painel web
echo  e tambem aqui no terminal.
echo.
echo  Para fechar o bot: pressione CTRL+C
echo  ================================
echo.

npm start

echo.
echo  Bot encerrado. Pressione qualquer tecla para fechar.
pause > nul
