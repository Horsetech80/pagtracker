#!/bin/bash

# Script de Deploy Automatizado para VPS
# PagTracker v4.0

set -e

echo "🚀 Iniciando deploy do PagTracker v4.0..."

# Configurações
REPO_URL="https://github.com/Horsetech80/pagtracker.git"
DEPLOY_DIR="/opt/pagtracker"
BACKUP_ENV="/root/.env.pagtracker.bkp"

# Cores para output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Função para log colorido
log() {
    echo -e "${GREEN}[$(date +'%Y-%m-%d %H:%M:%S')] $1${NC}"
}

warn() {
    echo -e "${YELLOW}[$(date +'%Y-%m-%d %H:%M:%S')] WARNING: $1${NC}"
}

error() {
    echo -e "${RED}[$(date +'%Y-%m-%d %H:%M:%S')] ERROR: $1${NC}"
}

# 1. Parar containers existentes
log "🛑 Parando containers existentes..."
cd $DEPLOY_DIR 2>/dev/null || true
docker-compose down 2>/dev/null || true

# 2. Limpeza do Docker
log "🧹 Limpando cache do Docker..."
docker system prune -a --volumes -f

# 3. Backup do .env se existir
if [ -f "$DEPLOY_DIR/.env" ]; then
    log "💾 Fazendo backup do .env..."
    cp "$DEPLOY_DIR/.env" "$BACKUP_ENV"
fi

# 4. Limpeza completa do diretório
log "🗑️ Limpando diretório de deploy..."
rm -rf "$DEPLOY_DIR"/* 2>/dev/null || true
rm -rf "$DEPLOY_DIR"/.[^.]* 2>/dev/null || true

# 5. Clone do repositório
log "📥 Clonando repositório..."
git clone "$REPO_URL" "$DEPLOY_DIR"
cd "$DEPLOY_DIR"

# 6. Restaurar .env se existir backup
if [ -f "$BACKUP_ENV" ]; then
    log "🔄 Restaurando .env..."
    cp "$BACKUP_ENV" "$DEPLOY_DIR/.env"
fi

# 7. Corrigir dependências
log "📦 Corrigindo dependências..."
npm install

# 8. Dar permissões aos scripts
log "🔐 Configurando permissões..."
chmod +x scripts/*.sh 2>/dev/null || true
chmod +x *.sh 2>/dev/null || true

# 9. Build da aplicação
log "🔨 Fazendo build da aplicação..."
docker-compose build --no-cache pagtracker-app

# 10. Subir containers
log "⬆️ Subindo containers..."
docker-compose up -d pagtracker-app redis nginx

# 11. Aguardar inicialização
log "⏳ Aguardando inicialização..."
sleep 10

# 12. Verificar status
log "📊 Verificando status dos containers..."
docker-compose ps

# 13. Testar conectividade
log "🌐 Testando conectividade..."
sleep 5

# Health check
if curl -s http://localhost:3000/api/health > /dev/null; then
    log "✅ Health check: OK"
else
    warn "⚠️ Health check: Falhou"
fi

# Página principal
if curl -s -o /dev/null -w "%{http_code}" http://localhost | grep -q "200"; then
    log "✅ Página principal: OK"
else
    warn "⚠️ Página principal: Falhou"
fi

# Página de login
if curl -s -o /dev/null -w "%{http_code}" http://localhost/login | grep -q "200"; then
    log "✅ Página de login: OK"
else
    warn "⚠️ Página de login: Falhou"
fi

# 14. Mostrar URLs finais
log "🌍 URLs finais:"
echo "   - Principal: http://$(hostname -I | awk '{print $1}')"
echo "   - Login: http://$(hostname -I | awk '{print $1}')/login"
echo "   - Health: http://$(hostname -I | awk '{print $1}'):3000/api/health"

# 15. Mostrar logs se houver erro
if ! docker-compose ps | grep -q "Up"; then
    error "❌ Alguns containers não estão rodando!"
    log "📋 Últimos logs da aplicação:"
    docker-compose logs --tail=20 pagtracker-app
else
    log "🎉 Deploy concluído com sucesso!"
fi

echo ""
log "💡 Para ver logs em tempo real: docker-compose logs -f"
log "💡 Para reiniciar: docker-compose restart"
log "💡 Para parar: docker-compose down"