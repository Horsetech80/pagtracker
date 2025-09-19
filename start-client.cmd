@echo off
echo ========================================
echo  PagTracker v4.0 - Painel Cliente
echo ========================================
echo.
echo Iniciando painel cliente na porta 3000...
echo.

REM Limpar cache se necessário
if exist ".next" (
    echo Limpando cache do cliente...
    rmdir /s /q ".next" 2>nul
)

REM Carregar variáveis de ambiente do arquivo .env.client
echo Carregando configurações do painel cliente...
for /f "usebackq tokens=1,2 delims==" %%a in (".env.client") do (
    if not "%%a"=="" if not "%%a:~0,1"=="#" set "%%a=%%b"
)

REM Definir variáveis de ambiente específicas do cliente (sobrescrever se necessário)
set PORT=3000
set NEXT_PUBLIC_ADMIN_MODE=false
set NEXT_BUILD_DIR=.next
set NODE_ENV=development

REM Iniciar o painel cliente
echo Compilando e iniciando...
npm run dev

pause