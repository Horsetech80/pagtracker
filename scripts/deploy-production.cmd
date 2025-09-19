@echo off
REM ============================================
REM DEPLOY PAGTRACKER V4.0 - PRODUÇÃO
REM ============================================
REM Script para deploy completo com Docker

echo.
echo ========================================
echo   PAGTRACKER V4.0 - DEPLOY PRODUÇÃO
echo ========================================
echo.

REM Verificar se Docker está rodando
echo [1/8] Verificando Docker...
docker --version >nul 2>&1
if %errorlevel% neq 0 (
    echo ❌ Docker não está instalado ou não está rodando
    echo    Instale o Docker Desktop e tente novamente
    pause
    exit /b 1
)
echo ✅ Docker encontrado

REM Verificar arquivo de configuração
echo.
echo [2/8] Verificando configuração...
if not exist "docker.env" (
    echo ❌ Arquivo docker.env não encontrado
    echo    Execute este script da raiz do projeto
    pause
    exit /b 1
)
echo ✅ Configuração encontrada

REM Parar containers existentes
echo.
echo [3/8] Parando containers existentes...
docker-compose down --volumes --remove-orphans >nul 2>&1
echo ✅ Containers parados

REM Limpar imagens antigas (opcional)
echo.
echo [4/8] Limpando imagens antigas...
docker image prune -f >nul 2>&1
echo ✅ Limpeza concluída

REM Build da aplicação
echo.
echo [5/8] Construindo aplicação...
echo    Isso pode levar alguns minutos...
docker-compose build --no-cache app
if %errorlevel% neq 0 (
    echo ❌ Erro no build da aplicação
    pause
    exit /b 1
)
echo ✅ Build concluído

REM Iniciar Redis primeiro
echo.
echo [6/8] Iniciando Redis...
docker-compose --env-file docker.env up -d redis
echo ✅ Redis iniciado

REM Aguardar Redis estar pronto
echo    Aguardando Redis ficar pronto...
timeout /t 10 >nul
echo ✅ Redis pronto

REM Iniciar aplicação
echo.
echo [7/8] Iniciando aplicação...
docker-compose --env-file docker.env up -d app
if %errorlevel% neq 0 (
    echo ❌ Erro ao iniciar aplicação
    pause
    exit /b 1
)
echo ✅ Aplicação iniciada

REM Iniciar Nginx
echo.
echo [8/8] Iniciando Nginx...
docker-compose --env-file docker.env up -d nginx
echo ✅ Nginx iniciado

REM Verificar status
echo.
echo ========================================
echo           STATUS DOS SERVIÇOS
echo ========================================
docker-compose ps

echo.
echo ========================================
echo          DEPLOY CONCLUÍDO! 
echo ========================================
echo.
echo 🚀 PagTracker v4.0 está rodando:
echo    - Frontend: http://localhost
echo    - APIs: http://localhost/api
echo    - Webhooks: http://localhost/webhook
echo    - Redis Commander: http://localhost:8081
echo.
echo 📊 Para monitorar logs:
echo    docker-compose logs -f app
echo.
echo ⏹️ Para parar tudo:
echo    docker-compose down
echo.
pause
