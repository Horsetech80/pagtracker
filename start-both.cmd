@echo off
echo ========================================
echo  PagTracker v4.0 - Iniciar Ambos Painéis
echo ========================================
echo.
echo Iniciando painel cliente (porta 3000) e admin (porta 3001)...
echo.

REM Limpar caches
echo Limpando caches...
if exist ".next" rmdir /s /q ".next" 2>nul
if exist ".next-admin" rmdir /s /q ".next-admin" 2>nul

echo.
echo Abrindo terminais separados...
echo.

REM Iniciar painel cliente em novo terminal
start "PagTracker Cliente (3000)" cmd /k "set PORT=3000 && set NEXT_PUBLIC_ADMIN_MODE=false && set NEXT_BUILD_DIR=.next && npm run dev"

REM Aguardar 3 segundos
timeout /t 3 /nobreak >nul

REM Iniciar painel admin em novo terminal
start "PagTracker Admin (3001)" cmd /k "set PORT=3001 && set NEXT_PUBLIC_ADMIN_MODE=true && set NEXT_BUILD_DIR=.next-admin && npm run dev --config=package.admin.json"

echo.
echo Painéis iniciados em terminais separados:
echo - Cliente: http://localhost:3000
echo - Admin: http://localhost:3001/admin/painel
echo.
echo Pressione qualquer tecla para fechar este terminal...
pause >nul