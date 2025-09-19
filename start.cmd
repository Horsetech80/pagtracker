@echo off
setlocal EnableDelayedExpansion

echo.
echo ===============================================
echo   PagTracker v4.0 - Launcher Principal
echo ===============================================
echo.
echo Escolha uma opcao:
echo.
echo [1] Iniciar apenas Painel Cliente (porta 3000)
echo [2] Iniciar apenas Painel Admin (porta 3001)
echo [3] Iniciar ambos os paineis (isolados)
echo [4] Sair
echo.
set /p choice="Digite sua opcao (1-4): "

if "%choice%"=="1" goto :client
if "%choice%"=="2" goto :admin
if "%choice%"=="3" goto :both
if "%choice%"=="4" goto :exit

echo [ERRO] Opcao invalida!
pause
goto :start

:client
echo.
echo [INFO] Iniciando Painel Cliente...
start "PagTracker v4.0 - Cliente" cmd /k "start-client-isolated.cmd"
goto :end

:admin
echo.
echo [INFO] Iniciando Painel Administrativo...
start "PagTracker v4.0 - Admin" cmd /k "start-admin-isolated.cmd"
goto :end

:both
echo.
echo [INFO] Iniciando ambos os paineis de forma isolada...
echo.
echo [CLIENTE] Iniciando na porta 3000...
start "PagTracker v4.0 - Cliente" cmd /k "start-client-isolated.cmd"

echo [ADMIN] Aguardando 3 segundos...
timeout /t 3 /nobreak >nul
echo [ADMIN] Iniciando na porta 3001...
start "PagTracker v4.0 - Admin" cmd /k "start-admin-isolated.cmd"

echo.
echo ===============================================
echo   Ambos os paineis foram iniciados!
echo ===============================================
echo.
echo [CLIENTE] http://localhost:3000/dashboard
echo [ADMIN]   http://localhost:3001/admin/painel
echo.
goto :end

:exit
echo.
echo [INFO] Saindo...
exit /b 0

:end
echo.
echo [INFO] Scripts de inicializacao executados.
echo [INFO] Verifique as janelas abertas para acompanhar o progresso.
echo.
pause