@echo off
REM ============================================
REM START DEVELOPMENT - PAGTRACKER V4.0
REM ============================================
REM Script para desenvolvimento com Redis

echo.
echo ========================================
echo   PAGTRACKER V4.0 - DESENVOLVIMENTO
echo ========================================
echo.

REM Verificar Docker
echo [1/4] Verificando Docker...
docker --version >nul 2>&1
if %errorlevel% neq 0 (
    echo ❌ Docker não encontrado
    echo    Continuando sem Redis (fallback memory)
    goto :start_app
)
echo ✅ Docker encontrado

REM Iniciar apenas Redis para desenvolvimento
echo.
echo [2/4] Iniciando Redis para desenvolvimento...
docker-compose -f docker-compose.redis.yml up -d redis
if %errorlevel% neq 0 (
    echo ⚠️ Erro ao iniciar Redis, continuando sem cache
    goto :start_app
)
echo ✅ Redis iniciado

REM Aguardar Redis
echo    Aguardando Redis ficar pronto...
timeout /t 5 >nul

:start_app
REM Iniciar aplicação em modo desenvolvimento
echo.
echo [3/4] Iniciando aplicação em modo desenvolvimento...
echo    Cliente: http://localhost:3000
echo    Admin: http://localhost:3001
echo.
start cmd /k "title PagTracker Cliente && npm run dev"

echo.
echo [4/4] Aguardando inicialização...
timeout /t 3 >nul

echo.
echo ========================================
echo      DESENVOLVIMENTO INICIADO!
echo ========================================
echo.
echo 🚀 Serviços disponíveis:
echo    - Cliente: http://localhost:3000
echo    - Admin: http://localhost:3001
echo    - Redis Commander: http://localhost:8081
echo.
echo 📊 Para ver logs do Redis:
echo    docker logs pagtracker-redis -f
echo.
echo ⏹️ Para parar Redis:
echo    docker stop pagtracker-redis
echo.
pause
