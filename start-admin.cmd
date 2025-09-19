@echo off
echo ========================================
echo  PagTracker v4.0 - Painel Admin
echo ========================================
echo.
echo Iniciando painel administrativo na porta 3001...
echo.

REM Limpar cache se necessário
if exist ".next-admin" (
    echo Limpando cache do admin...
    rmdir /s /q ".next-admin" 2>nul
)

REM Carregar variáveis de ambiente do arquivo .env.admin
echo Carregando configurações do painel admin...
for /f "usebackq tokens=1,2 delims==" %%a in (".env.admin") do (
    if not "%%a"=="" if not "%%a:~0,1"=="#" set "%%a=%%b"
)

REM Definir variáveis de ambiente específicas do admin (sobrescrever se necessário)
set PORT=3001
set NEXT_PUBLIC_ADMIN_MODE=true
set NEXT_BUILD_DIR=.next-admin
set NODE_ENV=development
set NEXT_CONFIG_FILE=next.config.admin.js

REM Iniciar o painel admin usando o package.admin.json
echo Compilando e iniciando...
npm run dev --config=package.admin.json

pause