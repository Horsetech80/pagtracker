# ============================================
# VERIFY DNS - PAGTRACKER V4.0
# Script para verificar configuração DNS
# ============================================

Write-Host "============================================" -ForegroundColor Blue
Write-Host "  PAGTRACKER V4.0 - VERIFICAÇÃO DNS" -ForegroundColor Blue  
Write-Host "============================================" -ForegroundColor Blue
Write-Host ""

# Configurações
$domains = @(
    "pagtracker.com",
    "www.pagtracker.com", 
    "admin-hml.pagtracker.com",
    "api-hml.pagtracker.com",
    "checkout-hml.pagtracker.com",
    "docs-hml.pagtracker.com",
    "hml.pagtracker.com",
    "webhook-hml.pagtracker.com"
)

$expectedIP = "192.241.150.238"
$results = @()

# Função para log colorido
function Write-Status {
    param(
        [string]$Message,
        [string]$Status
    )
    
    switch ($Status) {
        "OK" { Write-Host "[OK] $Message" -ForegroundColor Green }
        "ERROR" { Write-Host "[ERROR] $Message" -ForegroundColor Red }
        "WARNING" { Write-Host "[WARNING] $Message" -ForegroundColor Yellow }
        "INFO" { Write-Host "[INFO] $Message" -ForegroundColor Cyan }
    }
}

# Verificar cada domínio
Write-Status "Verificando resolução DNS..." "INFO"
Write-Host ""

foreach ($domain in $domains) {
    try {
        $dnsResult = Resolve-DnsName -Name $domain -Type A -ErrorAction Stop
        $resolvedIP = $dnsResult.IPAddress
        
        if ($resolvedIP -eq $expectedIP) {
            Write-Status "$domain → $resolvedIP" "OK"
            $results += [PSCustomObject]@{
                Domain = $domain
                IP = $resolvedIP
                Status = "OK"
                Cloudflare = $null
            }
        } else {
            Write-Status "$domain → $resolvedIP (Expected: $expectedIP)" "WARNING"
            $results += [PSCustomObject]@{
                Domain = $domain
                IP = $resolvedIP  
                Status = "DIFFERENT_IP"
                Cloudflare = $null
            }
        }
    }
    catch {
        Write-Status "$domain → DNS RESOLUTION FAILED" "ERROR"
        $results += [PSCustomObject]@{
            Domain = $domain
            IP = "FAILED"
            Status = "ERROR"
            Cloudflare = $null
        }
    }
}

Write-Host ""
Write-Host "============================================" -ForegroundColor Blue
Write-Host "VERIFICAÇÃO DE CLOUDFLARE" -ForegroundColor Blue
Write-Host "============================================" -ForegroundColor Blue
Write-Host ""

# Verificar se está passando pelo Cloudflare
foreach ($domain in $domains) {
    try {
        Write-Status "Verificando $domain..." "INFO"
        
        # Fazer requisição HTTP para verificar headers do Cloudflare
        $response = Invoke-WebRequest -Uri "http://$domain" -Method Head -TimeoutSec 10 -ErrorAction Stop
        
        $cfRay = $response.Headers["CF-RAY"]
        $cfCache = $response.Headers["CF-CACHE-STATUS"] 
        $server = $response.Headers["Server"]
        
        if ($cfRay) {
            Write-Status "  Cloudflare ativo (CF-RAY: $cfRay)" "OK"
            $results | Where-Object { $_.Domain -eq $domain } | ForEach-Object { $_.Cloudflare = "ACTIVE" }
        } else {
            Write-Status "  Cloudflare não detectado" "WARNING"
            $results | Where-Object { $_.Domain -eq $domain } | ForEach-Object { $_.Cloudflare = "INACTIVE" }
        }
        
        if ($cfCache) {
            Write-Status "  Cache Status: $cfCache" "INFO"
        }
        
        if ($server -and $server -like "*cloudflare*") {
            Write-Status "  Server: $server" "INFO"
        }
    }
    catch {
        Write-Status "  Erro ao verificar $domain : $($_.Exception.Message)" "ERROR"
        $results | Where-Object { $_.Domain -eq $domain } | ForEach-Object { $_.Cloudflare = "ERROR" }
    }
    
    Write-Host ""
}

Write-Host "============================================" -ForegroundColor Blue
Write-Host "RESUMO DOS RESULTADOS" -ForegroundColor Blue
Write-Host "============================================" -ForegroundColor Blue
Write-Host ""

# Mostrar tabela resumo
$results | Format-Table -AutoSize Domain, IP, Status, Cloudflare

# Estatísticas
$totalDomains = $results.Count
$okDns = ($results | Where-Object { $_.Status -eq "OK" }).Count
$errorDns = ($results | Where-Object { $_.Status -eq "ERROR" }).Count
$differentIP = ($results | Where-Object { $_.Status -eq "DIFFERENT_IP" }).Count
$cloudflareActive = ($results | Where-Object { $_.Cloudflare -eq "ACTIVE" }).Count

Write-Host ""
Write-Host "ESTATISTICAS:" -ForegroundColor Blue
Write-Status "Total de domínios: $totalDomains" "INFO"
Write-Status "DNS OK: $okDns" "OK"
Write-Status "DNS com IP diferente: $differentIP" "WARNING"  
Write-Status "DNS com erro: $errorDns" "ERROR"
Write-Status "Cloudflare ativo: $cloudflareActive" "OK"

Write-Host ""
Write-Host "============================================" -ForegroundColor Blue
Write-Host "VERIFICAÇÃO DE PORTAS" -ForegroundColor Blue
Write-Host "============================================" -ForegroundColor Blue
Write-Host ""

# Verificar conectividade nas portas principais
$ports = @(80, 443)
foreach ($port in $ports) {
    try {
        $tcpClient = New-Object System.Net.Sockets.TcpClient
        $result = $tcpClient.BeginConnect($expectedIP, $port, $null, $null)
        $success = $result.AsyncWaitHandle.WaitOne(3000, $false)
        
        if ($success) {
            Write-Status "Porta $port aberta em $expectedIP" "OK"
        } else {
            Write-Status "Porta $port fechada em $expectedIP" "ERROR"
        }
        
        $tcpClient.Close()
    }
    catch {
        Write-Status "Erro ao testar porta $port : $($_.Exception.Message)" "ERROR"
    }
}

Write-Host ""
Write-Host "============================================" -ForegroundColor Blue
Write-Host "RECOMENDAÇÕES" -ForegroundColor Blue
Write-Host "============================================" -ForegroundColor Blue
Write-Host ""

if ($errorDns -gt 0) {
    Write-Status "Alguns domínios não estão resolvendo. Verifique a configuração DNS no Cloudflare." "WARNING"
}

if ($differentIP -gt 0) {
    Write-Status "Alguns domínios apontam para IP diferente. Verifique se é intencional." "WARNING"
}

if ($cloudflareActive -lt $totalDomains) {
    Write-Status "Nem todos os domínios estão passando pelo Cloudflare. Verifique o proxy status." "WARNING"
}

if ($okDns -eq $totalDomains -and $cloudflareActive -eq $totalDomains) {
    Write-Status "Configuração DNS perfeita! Todos os domínios funcionando." "OK"
}

Write-Host ""
Write-Status "Verificação concluída!" "INFO"

# Salvar resultados em arquivo
$results | Export-Csv -Path "logs/dns-verification-$(Get-Date -Format 'yyyyMMdd-HHmmss').csv" -NoTypeInformation
Write-Status "Resultados salvos em logs/dns-verification-*.csv" "INFO"
