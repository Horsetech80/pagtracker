# ===================================================================
# SCRIPT DE INICIALIZACAO SEPARADA - PAGTRACKER V4.0
# ===================================================================
# 
# Este script inicia o PagTracker v4.0 com paineis isolados:
# - Painel Cliente (Frontend + APIs): Porta 3000
# - Painel Admin (Frontend + APIs): Porta 3001 (ISOLADO)
# 
# IMPORTANTE: O painel admin usa configuracao isolada com:
# - next.config.admin.js
# - Variaveis de ambiente especificas
# ===================================================================

Write-Host "" -ForegroundColor Green
Write-Host "===================================================================" -ForegroundColor Green
Write-Host "           PAGTRACKER V4.0 - PAINEIS ISOLADOS" -ForegroundColor Green
Write-Host "===================================================================" -ForegroundColor Green
Write-Host "" -ForegroundColor Green
Write-Host "Arquitetura do Sistema:" -ForegroundColor Yellow
Write-Host "- Painel Cliente (Frontend + APIs): http://localhost:3000" -ForegroundColor White
Write-Host "- Painel Admin ISOLADO (Frontend + APIs): http://localhost:3001" -ForegroundColor White
Write-Host "" -ForegroundColor Green
Write-Host "NOTA: O painel admin usa configuracao completamente isolada." -ForegroundColor Cyan
Write-Host "      Cada painel tem seu proprio middleware e configuracao." -ForegroundColor Cyan
Write-Host "" -ForegroundColor Green

# Parar processos existentes
Write-Host "[INFO] Parando processos existentes..." -ForegroundColor Green
Get-Process | Where-Object {$_.ProcessName -eq 'node'} | Stop-Process -Force -ErrorAction SilentlyContinue
Get-Process | Where-Object {$_.MainWindowTitle -like '*Next.js*'} | Stop-Process -Force -ErrorAction SilentlyContinue

# Limpar portas
Write-Host "[INFO] Limpando portas 3000-3001..." -ForegroundColor Green
$ports = @(3000, 3001)
foreach ($port in $ports) {
    $processes = Get-NetTCPConnection -LocalPort $port -ErrorAction SilentlyContinue | Select-Object -ExpandProperty OwningProcess
    foreach ($processId in $processes) {
        Stop-Process -Id $processId -Force -ErrorAction SilentlyContinue
    }
}

Start-Sleep -Seconds 2

# 1. Painel Cliente (Frontend + APIs na porta 3000)
Write-Host "[INFO] 1/2 - Iniciando Painel Cliente (Frontend + APIs)..." -ForegroundColor Yellow
Write-Host "       Porta 3000: Next.js com APIs integradas" -ForegroundColor Gray
Start-Process cmd -ArgumentList '/k', 'cd /d D:\PagTracker && .\start-client.cmd' -WindowStyle Normal

Start-Sleep -Seconds 5

# 2. Painel Admin ISOLADO (Frontend + APIs na porta 3001)
Write-Host "[INFO] 2/2 - Iniciando Painel Admin ISOLADO (Frontend + APIs)..." -ForegroundColor Yellow
Write-Host "       Porta 3001: Next.js com APIs integradas (Configuracao Isolada)" -ForegroundColor Gray
Write-Host "[ADMIN] Configurando variaveis de ambiente para isolamento..." -ForegroundColor Cyan
Start-Process cmd -ArgumentList '/k', 'cd /d D:\PagTracker && .\start-admin.cmd' -WindowStyle Normal

Start-Sleep -Seconds 5

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "   PAINEIS INICIADOS COM SUCESSO!" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "ARQUITETURA ISOLADA:" -ForegroundColor Yellow
Write-Host "      - Painel Cliente: http://localhost:3000 (NEXT_PUBLIC_ADMIN_MODE=false)" -ForegroundColor Green
Write-Host "      - Painel Admin ISOLADO: http://localhost:3001 (NEXT_PUBLIC_ADMIN_MODE=true)" -ForegroundColor Cyan
Write-Host "      - Middleware Unificado com isolamento por porta e modo" -ForegroundColor Cyan
Write-Host "      Cada painel opera de forma completamente isolada." -ForegroundColor Cyan
Write-Host ""
Write-Host "Painel Cliente (Porta 3000):" -ForegroundColor Yellow
Write-Host "   Frontend: http://localhost:3000/dashboard" -ForegroundColor Cyan
Write-Host "   APIs:     http://localhost:3000/api/*" -ForegroundColor Cyan
Write-Host "   Login:    http://localhost:3000/login" -ForegroundColor Cyan
Write-Host ""
Write-Host "Painel Admin (Porta 3001):" -ForegroundColor Yellow
Write-Host "   Frontend: http://localhost:3001/admin/painel" -ForegroundColor Cyan
Write-Host "   APIs:     http://localhost:3001/api/*" -ForegroundColor Cyan
Write-Host "   Login:    http://localhost:3001/admin/login" -ForegroundColor Cyan
Write-Host ""
Write-Host "APIs Principais:" -ForegroundColor White
Write-Host "   /api/health        - Health check" -ForegroundColor Gray
Write-Host "   /api/auth/*        - Autenticacao" -ForegroundColor Gray
Write-Host "   /api/payments/*    - Pagamentos PIX" -ForegroundColor Gray
Write-Host "   /api/webhooks/*    - Webhooks EfiPay" -ForegroundColor Gray
Write-Host "   /api/admin/*       - APIs administrativas" -ForegroundColor Gray
Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "Aguardando 10 segundos antes de abrir navegadores..." -ForegroundColor Green
Start-Sleep -Seconds 10

# Abrir navegadores
Start-Process "http://localhost:3001/admin/painel"
Start-Process "http://localhost:3000/dashboard"

Write-Host "Paineis abertos no navegador!" -ForegroundColor Green
Write-Host "Para parar os servidores, feche as janelas do terminal." -ForegroundColor Yellow
Write-Host ""
Read-Host "Pressione Enter para continuar..."