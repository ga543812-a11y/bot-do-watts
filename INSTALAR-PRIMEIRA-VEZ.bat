@echo off
title Instalador - WhatsApp Bot
color 0B
cd /d "%~dp0"

echo.
echo  ╔══════════════════════════════════════╗
echo  ║     INSTALADOR - WHATSAPP BOT        ║
echo  ╚══════════════════════════════════════╝
echo.

:: Verifica Node.js
echo  [1/3] Verificando Node.js...
node -v > nul 2>&1
if errorlevel 1 (
    echo.
    echo  ERRO: Node.js nao encontrado!
    echo  Baixe em: https://nodejs.org
    echo  Instale e execute este arquivo novamente.
    echo.
    pause
    exit
)
echo  Node.js OK!

:: Verifica Git
echo  [2/3] Verificando Git...
git --version > nul 2>&1
if errorlevel 1 (
    echo.
    echo  ERRO: Git nao encontrado!
    echo  Baixe em: https://git-scm.com/download/win
    echo  Instale e execute este arquivo novamente.
    echo.
    pause
    exit
)
echo  Git OK!

:: Instala dependencias
echo  [3/3] Instalando dependencias do bot...
echo  Aguarde, pode demorar alguns minutos...
npm install
if errorlevel 1 (
    echo.
    echo  ERRO na instalacao. Tente executar como Administrador.
    pause
    exit
)

echo.
echo  ╔══════════════════════════════════════╗
echo  ║   INSTALACAO CONCLUIDA COM SUCESSO!  ║
echo  ║                                      ║
echo  ║   Agora use o arquivo:               ║
echo  ║   >> INICIAR-BOT.bat <<              ║
echo  ║   para ligar o bot!                  ║
echo  ╚══════════════════════════════════════╝
echo.
pause
