@echo off
REM ============================================
REM DEPLOY PRODUCTION FULL - PAGTRACKER V4.0
REM Deploy completo com SSL e DNS
REM ============================================

echo.
echo ============================================
echo   PAGTRACKER V4.0 - DEPLOY PRODUCTION FULL
echo ============================================
echo.

REM Verificar Docker
echo [INFO] Verificando Docker...
docker --version >nul 2>&1
if %errorlevel% neq 0 (
    echo [ERROR] Docker nao encontrado! Instale o Docker primeiro.
    pause
    exit /b 1
)

REM Verificar Docker Compose
echo [INFO] Verificando Docker Compose...
docker-compose --version >nul 2>&1
if %errorlevel% neq 0 (
    echo [ERROR] Docker Compose nao encontrado!
    pause
    exit /b 1
)

REM Criar diretórios necessários
echo [INFO] Criando estrutura de diretorios...
if not exist "data" mkdir data
if not exist "data\redis" mkdir data\redis
if not exist "data\nginx-cache" mkdir data\nginx-cache
if not exist "logs" mkdir logs
if not exist "logs\app" mkdir logs\app
if not exist "logs\nginx" mkdir logs\nginx
if not exist "logs\redis" mkdir logs\redis
if not exist "logs\certbot" mkdir logs\certbot
if not exist "nginx\ssl" mkdir nginx\ssl
if not exist "certbot\conf" mkdir certbot\conf
if not exist "certbot\www" mkdir certbot\www

REM Verificar arquivo de ambiente
echo [INFO] Verificando configuracao...
if not exist "docker.env" (
    echo [ERROR] Arquivo docker.env nao encontrado!
    echo [INFO] Copie o arquivo docker.env.example e configure as variaveis.
    pause
    exit /b 1
)

REM Parar containers existentes
echo [INFO] Parando containers existentes...
docker-compose -f docker-compose.production.yml down

REM Limpar containers antigos
echo [INFO] Limpando containers antigos...
docker system prune -f

REM Menu de opções
echo.
echo Escolha o tipo de deploy:
echo [1] Deploy com certificados auto-assinados (DESENVOLVIMENTO)
echo [2] Deploy com Let's Encrypt (PRODUCAO)
echo [3] Deploy apenas aplicacao (sem SSL)
echo [4] Renovar certificados SSL
echo [5] Sair
echo.
set /p choice="Digite sua escolha [1-5]: "

if "%choice%"=="1" goto deploy_self_signed
if "%choice%"=="2" goto deploy_letsencrypt
if "%choice%"=="3" goto deploy_no_ssl
if "%choice%"=="4" goto renew_ssl
if "%choice%"=="5" goto end
echo [ERROR] Opcao invalida!
pause
exit /b 1

:deploy_self_signed
echo.
echo [INFO] Deploy com certificados auto-assinados...
echo [INFO] Gerando certificados temporarios...

REM Gerar certificados auto-assinados
echo [INFO] Gerando certificados auto-assinados...
if not exist "nginx\ssl\pagtracker.com.crt" (
    echo [INFO] Criando certificado para pagtracker.com...
    docker run --rm -v "%cd%\nginx\ssl:/certs" alpine/openssl req -x509 -nodes -days 365 -newkey rsa:2048 -keyout /certs/pagtracker.com.key -out /certs/pagtracker.com.crt -subj "/C=BR/ST=SP/L=SP/O=PagTracker/CN=pagtracker.com"
)

if not exist "nginx\ssl\pagtracker.com.br.crt" (
    echo [INFO] Criando certificado para pagtracker.com.br...
    docker run --rm -v "%cd%\nginx\ssl:/certs" alpine/openssl req -x509 -nodes -days 365 -newkey rsa:2048 -keyout /certs/pagtracker.com.br.key -out /certs/pagtracker.com.br.crt -subj "/C=BR/ST=SP/L=SP/O=PagTracker/CN=pagtracker.com.br"
)

echo [INFO] Iniciando stack completa...
docker-compose -f docker-compose.production.yml up -d

goto check_status

:deploy_letsencrypt
echo.
echo [INFO] Deploy com certificados Let's Encrypt...
echo [WARNING] Certifique-se de que os DNS estao apontando para este servidor!
echo.
set /p confirm="Continuar? [y/N]: "
if /i not "%confirm%"=="y" goto end

echo [INFO] Gerando certificados Let's Encrypt...
REM Usar script bash se disponível, senão usar método alternativo
bash scripts/setup-ssl.sh --letsencrypt 2>nul || (
    echo [INFO] Usando metodo alternativo para certificados...
    docker run --rm -v "%cd%\certbot\conf:/etc/letsencrypt" -v "%cd%\certbot\www:/var/www/certbot" -p 80:80 certbot/certbot certonly --standalone --email admin@pagtracker.com --agree-tos --no-eff-email -d pagtracker.com -d www.pagtracker.com -d admin-hml.pagtracker.com -d api-hml.pagtracker.com -d checkout-hml.pagtracker.com -d webhook-hml.pagtracker.com
    
    REM Copiar certificados
    copy "certbot\conf\live\pagtracker.com\fullchain.pem" "nginx\ssl\pagtracker.com.crt"
    copy "certbot\conf\live\pagtracker.com\privkey.pem" "nginx\ssl\pagtracker.com.key"
)

echo [INFO] Iniciando stack completa...
docker-compose -f docker-compose.production.yml up -d

goto check_status

:deploy_no_ssl
echo.
echo [INFO] Deploy sem SSL (HTTP apenas)...
docker-compose -f docker-compose.yml up -d app redis

goto check_status

:renew_ssl
echo.
echo [INFO] Renovando certificados SSL...
docker-compose -f docker-compose.production.yml exec certbot certbot renew
docker-compose -f docker-compose.production.yml exec nginx nginx -s reload
echo [INFO] Certificados renovados!
goto end

:check_status
echo.
echo [INFO] Verificando status dos servicos...
timeout /t 10 /nobreak >nul
docker-compose -f docker-compose.production.yml ps

echo.
echo [INFO] Verificando logs de inicializacao...
echo.
echo [REDIS]
docker-compose -f docker-compose.production.yml logs --tail=5 redis
echo.
echo [APP]
docker-compose -f docker-compose.production.yml logs --tail=5 app
echo.
echo [NGINX]
docker-compose -f docker-compose.production.yml logs --tail=5 nginx

echo.
echo ============================================
echo   DEPLOY CONCLUIDO!
echo ============================================
echo.
echo URLs disponiveis:
echo - HTTP:  http://pagtracker.com
echo - HTTPS: https://pagtracker.com
echo - Admin: https://admin-hml.pagtracker.com
echo - API:   https://api-hml.pagtracker.com
echo - Redis Commander: http://localhost:8081 (admin/pagtracker2025)
echo.
echo Comandos uteis:
echo - Ver logs: docker-compose -f docker-compose.production.yml logs -f [service]
echo - Parar: docker-compose -f docker-compose.production.yml down
echo - Restart: docker-compose -f docker-compose.production.yml restart [service]
echo.

:end
echo [INFO] Script finalizado.
pause
