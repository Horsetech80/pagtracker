#!/usr/bin/env pwsh
<#
.SYNOPSIS
    Script PowerShell para executar testes de autenticacao admin do PagTracker v4.0

.DESCRIPTION
    Este script:
    - Verifica e instala dependencias Node.js necessarias
    - Configura o ambiente de teste
    - Executa o script de teste de autenticacao
    - Gera relatorio detalhado

.EXAMPLE
    .\run-admin-auth-test.ps1
    .\run-admin-auth-test.ps1 -Verbose
#>

param(
    [switch]$Verbose,
    [switch]$InstallDeps = $true
)

# Configuracoes
$ErrorActionPreference = "Stop"
$ProgressPreference = "SilentlyContinue"

# Cores para output
function Write-ColorOutput {
    param(
        [string]$Message,
        [string]$Color = "White"
    )
    
    $colors = @{
        "Red" = [ConsoleColor]::Red
        "Green" = [ConsoleColor]::Green
        "Yellow" = [ConsoleColor]::Yellow
        "Blue" = [ConsoleColor]::Blue
        "Magenta" = [ConsoleColor]::Magenta
        "Cyan" = [ConsoleColor]::Cyan
        "White" = [ConsoleColor]::White
    }
    
    Write-Host $Message -ForegroundColor $colors[$Color]
}

function Write-Header {
    param([string]$Title)
    
    Write-Host ""
    Write-ColorOutput ("=" * 70) "Cyan"
    Write-ColorOutput $Title "Cyan"
    Write-ColorOutput ("=" * 70) "Cyan"
}

function Write-Success {
    param([string]$Message)
    Write-ColorOutput "✅ $Message" "Green"
}

function Write-Error-Custom {
    param([string]$Message)
    Write-ColorOutput "❌ $Message" "Red"
}

function Write-Warning-Custom {
    param([string]$Message)
    Write-ColorOutput "⚠️  $Message" "Yellow"
}

function Write-Info {
    param([string]$Message)
    Write-ColorOutput "ℹ️  $Message" "Blue"
}

# Verificar se estamos no diretorio correto
function Test-ProjectDirectory {
    Write-Header "VERIFICACAO DO DIRETORIO DO PROJETO"
    
    $currentDir = Get-Location
    Write-Info "Diretorio atual: $currentDir"
    
    # Verificar arquivos essenciais
    $essentialFiles = @(
        "package.json",
        ".env.admin",
        "test-admin-auth.js"
    )
    
    $missingFiles = @()
    foreach ($file in $essentialFiles) {
        if (-not (Test-Path $file)) {
            $missingFiles += $file
        }
    }
    
    if ($missingFiles.Count -gt 0) {
        Write-Error-Custom "Arquivos essenciais nao encontrados: $($missingFiles -join ', ')"
        Write-Warning-Custom "Certifique-se de estar no diretorio raiz do PagTracker"
        return $false
    }
    
    Write-Success "Diretorio do projeto verificado com sucesso"
    return $true
}

# Verificar Node.js e npm
function Test-NodeEnvironment {
    Write-Header "VERIFICACAO DO AMBIENTE NODE.JS"
    
    try {
        $nodeVersion = node --version 2>$null
        if ($nodeVersion) {
            Write-Success "Node.js encontrado: $nodeVersion"
        } else {
            Write-Error-Custom "Node.js nao encontrado"
            return $false
        }
        
        $npmVersion = npm --version 2>$null
        if ($npmVersion) {
            Write-Success "npm encontrado: $npmVersion"
        } else {
            Write-Error-Custom "npm nao encontrado"
            return $false
        }
        
        return $true
    } catch {
        Write-Error-Custom "Erro ao verificar ambiente Node.js: $($_.Exception.Message)"
        return $false
    }
}

# Instalar dependencias necessarias
function Install-TestDependencies {
    Write-Header "INSTALACAO DE DEPENDENCIAS DE TESTE"
    
    if (-not $InstallDeps) {
        Write-Info "Instalacao de dependencias pulada (parametro -InstallDeps false)"
        return $true
    }
    
    try {
        # Verificar se @supabase/supabase-js esta instalado
        $packageJson = Get-Content "package.json" | ConvertFrom-Json
        $hasSupabase = $packageJson.dependencies."@supabase/supabase-js" -or $packageJson.devDependencies."@supabase/supabase-js"
        
        if (-not $hasSupabase) {
            Write-Info "Instalando @supabase/supabase-js..."
            npm install @supabase/supabase-js --save
            if ($LASTEXITCODE -ne 0) {
                Write-Error-Custom "Falha ao instalar @supabase/supabase-js"
                return $false
            }
        }
        
        # Verificar se dotenv esta instalado
        $hasDotenv = $packageJson.dependencies."dotenv" -or $packageJson.devDependencies."dotenv"
        
        if (-not $hasDotenv) {
            Write-Info "Instalando dotenv..."
            npm install dotenv --save-dev
            if ($LASTEXITCODE -ne 0) {
                Write-Error-Custom "Falha ao instalar dotenv"
                return $false
            }
        }
        
        Write-Success "Dependencias verificadas/instaladas com sucesso"
        return $true
    } catch {
        Write-Error-Custom "Erro ao instalar dependencias: $($_.Exception.Message)"
        return $false
    }
}

# Verificar configuracoes do ambiente
function Test-EnvironmentConfig {
    Write-Header "VERIFICACAO DAS CONFIGURACOES DO AMBIENTE"
    
    try {
        if (-not (Test-Path ".env.admin")) {
            Write-Error-Custom "Arquivo .env.admin nao encontrado"
            return $false
        }
        
        $envContent = Get-Content ".env.admin"
        $requiredVars = @(
            "NEXT_PUBLIC_ADMIN_SUPABASE_URL",
            "NEXT_PUBLIC_ADMIN_SUPABASE_ANON_KEY"
        )
        
        $missingVars = @()
        foreach ($var in $requiredVars) {
            $found = $envContent | Where-Object { $_ -match "^$var=" }
            if (-not $found) {
                $missingVars += $var
            }
        }
        
        if ($missingVars.Count -gt 0) {
            Write-Error-Custom "Variaveis de ambiente ausentes: $($missingVars -join ', ')"
            return $false
        }
        
        Write-Success "Configuracoes do ambiente verificadas"
        return $true
    } catch {
        Write-Error-Custom "Erro ao verificar configuracoes: $($_.Exception.Message)"
        return $false
    }
}

# Executar o teste de autenticacao
function Invoke-AuthTest {
    Write-Header "EXECUCAO DO TESTE DE AUTENTICACAO ADMIN"
    
    try {
        Write-Info "Iniciando teste de autenticacao..."
        Write-Info "Arquivo de teste: test-admin-auth.js"
        
        # Executar o script de teste
        node test-admin-auth.js
        $exitCode = $LASTEXITCODE
        
        if ($exitCode -eq 0) {
            Write-Success "Teste de autenticacao concluido com sucesso"
            return $true
        } else {
            Write-Error-Custom "Teste de autenticacao falhou (codigo de saida: $exitCode)"
            return $false
        }
    } catch {
        Write-Error-Custom "Erro ao executar teste: $($_.Exception.Message)"
        return $false
    }
}

# Gerar relatorio de resumo
function Write-TestSummary {
    param(
        [bool]$ProjectDirOk,
        [bool]$NodeEnvOk,
        [bool]$DepsOk,
        [bool]$ConfigOk,
        [bool]$TestOk
    )
    
    Write-Header "RELATORIO FINAL DO TESTE DE AUTENTICACAO ADMIN"
    
    $tests = @(
        @{ Name = "Diretorio do Projeto"; Result = $ProjectDirOk },
        @{ Name = "Ambiente Node.js"; Result = $NodeEnvOk },
        @{ Name = "Dependencias"; Result = $DepsOk },
        @{ Name = "Configuracoes"; Result = $ConfigOk },
        @{ Name = "Teste de Autenticacao"; Result = $TestOk }
    )
    
    $passedCount = 0
    foreach ($test in $tests) {
        if ($test.Result) {
            Write-Success "$($test.Name): PASSOU"
            $passedCount++
        } else {
            Write-Error-Custom "$($test.Name): FALHOU"
        }
    }
    
    Write-Host ""
    if ($passedCount -eq $tests.Count) {
        Write-Success "🎉 TODOS OS TESTES PASSARAM! ($passedCount/$($tests.Count))"
        Write-Success "Sistema de autenticacao admin esta funcionando corretamente."
    } else {
        Write-Warning-Custom "⚠️ $($tests.Count - $passedCount) teste(s) falharam. ($passedCount/$($tests.Count))"
        Write-Warning-Custom "Verifique as configuracoes e dependencias."
    }
}

# Funcao principal
function Main {
    Write-Header "SCRIPT DE TESTE DE AUTENTICACAO ADMIN - PAGTRACKER V4.0"
    Write-Info "Iniciando verificacoes e testes..."
    
    # Executar verificacoes sequenciais
    $projectDirOk = Test-ProjectDirectory
    if (-not $projectDirOk) {
        Write-Error-Custom "Falha na verificacao do diretorio. Abortando."
        exit 1
    }
    
    $nodeEnvOk = Test-NodeEnvironment
    if (-not $nodeEnvOk) {
        Write-Error-Custom "Falha na verificacao do ambiente Node.js. Abortando."
        exit 1
    }
    
    $depsOk = Install-TestDependencies
    if (-not $depsOk) {
        Write-Error-Custom "Falha na instalacao de dependencias. Abortando."
        exit 1
    }
    
    $configOk = Test-EnvironmentConfig
    if (-not $configOk) {
        Write-Error-Custom "Falha na verificacao de configuracoes. Abortando."
        exit 1
    }
    
    $testOk = Invoke-AuthTest
    
    # Gerar relatorio final
    Write-TestSummary -ProjectDirOk $projectDirOk -NodeEnvOk $nodeEnvOk -DepsOk $depsOk -ConfigOk $configOk -TestOk $testOk
    
    if ($testOk) {
        exit 0
    } else {
        exit 1
    }
}

# Executar script principal
try {
    Main
} catch {
    Write-Error-Custom "Erro fatal: $($_.Exception.Message)"
    exit 1
}