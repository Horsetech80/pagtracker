#!/bin/bash

echo "🚀 DEPLOY PAGTRACKER v4.0 - VPS DOCKER"
echo "======================================"

# Configurações
PROJECT_DIR="/opt/pagtracker"
GIT_REPO="https://github.com/Horsetech80/pagtracker.git"

# Cores para output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Função para log colorido
log_info() {
    echo -e "${GREEN}[INFO]${NC} $1"
}

log_warn() {
    echo -e "${YELLOW}[WARN]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Função para verificar se um comando existe
command_exists() {
    command -v "$1" >/dev/null 2>&1
}

# Verificar se estamos como root
if [ "$EUID" -ne 0 ]; then
    log_error "Este script deve ser executado como root"
    exit 1
fi

# Atualizar sistema
log_info "Atualizando sistema..."
apt update && apt upgrade -y

# Instalar dependências básicas
log_info "Instalando dependências..."
apt install -y curl wget git unzip software-properties-common apt-transport-https ca-certificates gnupg lsb-release

# Instalar Docker
if ! command_exists docker; then
    log_info "Instalando Docker..."
    curl -fsSL https://get.docker.com -o get-docker.sh
    sh get-docker.sh
    systemctl enable docker
    systemctl start docker
fi

# Instalar Docker Compose
if ! command_exists docker-compose; then
    log_info "Instalando Docker Compose..."
    curl -L "https://github.com/docker/compose/releases/download/v2.20.0/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
    chmod +x /usr/local/bin/docker-compose
fi

# Parar containers existentes
log_info "Parando containers existentes..."
docker-compose down 2>/dev/null || true
docker stop $(docker ps -aq) 2>/dev/null || true
docker rm $(docker ps -aq) 2>/dev/null || true

# Limpar imagens não utilizadas
log_info "Limpando imagens Docker..."
docker system prune -f

# Criar diretório do projeto
log_info "Criando diretório do projeto..."
mkdir -p $PROJECT_DIR
cd $PROJECT_DIR

# Clonar repositório
log_info "Clonando repositório..."
if [ -d ".git" ]; then
    log_info "Repositório já existe, atualizando..."
    git pull origin main
else
    git clone $GIT_REPO .
fi

# Verificar se .env existe
if [ ! -f ".env" ]; then
    log_warn "Arquivo .env não encontrado!"
    log_info "Copiando configuração de produção..."
    cp config/production.env .env
    log_warn "⚠️  IMPORTANTE: Configure as variáveis de ambiente em .env antes de continuar"
    log_info "   nano .env"
    log_info "   Principais variáveis a configurar:"
    log_info "   - NEXT_PUBLIC_SUPABASE_URL"
    log_info "   - NEXT_PUBLIC_SUPABASE_ANON_KEY"
    log_info "   - SUPABASE_SERVICE_ROLE_KEY"
    log_info "   - EFIPAY_CLIENT_ID"
    log_info "   - EFIPAY_CLIENT_SECRET"
    log_info "   - CLOUDFLARE_EMAIL"
    log_info "   - CLOUDFLARE_API_KEY"
    echo ""
    read -p "Pressione ENTER após configurar o .env para continuar..."
fi

# Criar diretórios necessários
log_info "Criando diretórios necessários..."
mkdir -p logs/nginx logs/webhooks certificates

# Configurar permissões
log_info "Configurando permissões..."
chmod +x scripts/*.sh 2>/dev/null || true

# Build e deploy com Docker Compose
log_info "Iniciando deploy com Docker Compose..."
docker-compose up -d --build

# Verificar status dos containers
log_info "Verificando status dos containers..."
sleep 10
docker-compose ps

# Verificar logs
log_info "Verificando logs dos containers..."
echo ""
log_info "Logs do PagTracker App:"
docker-compose logs --tail=20 pagtracker-app

echo ""
log_info "Logs do Nginx:"
docker-compose logs --tail=10 nginx

echo ""
log_info "Logs do Redis:"
docker-compose logs --tail=10 redis

# Verificar portas
log_info "Verificando portas abertas..."
netstat -tlnp | grep -E ':(80|443|3000|6379)'

# Configurar firewall (se necessário)
log_info "Configurando firewall..."
ufw allow 22/tcp
ufw allow 80/tcp
ufw allow 443/tcp
ufw allow 3000/tcp
ufw --force enable

# Criar script de monitoramento
cat > /opt/pagtracker/monitor.sh << 'EOF'
#!/bin/bash
echo "📊 STATUS PAGTRACKER v4.0"
echo "========================="
echo ""
echo "🔍 Containers:"
docker-compose ps
echo ""
echo "💾 Uso de memória:"
free -h
echo ""
echo "💿 Uso de disco:"
df -h
echo ""
echo "🌐 Portas abertas:"
netstat -tlnp | grep -E ':(80|443|3000|6379)'
echo ""
echo "📝 Logs recentes:"
docker-compose logs --tail=10 pagtracker-app
EOF

chmod +x /opt/pagtracker/monitor.sh

# Criar script de backup
cat > /opt/pagtracker/backup.sh << 'EOF'
#!/bin/bash
BACKUP_DIR="/opt/backups/pagtracker"
DATE=$(date +%Y%m%d_%H%M%S)

mkdir -p $BACKUP_DIR

echo "📦 Criando backup do PagTracker..."
tar -czf $BACKUP_DIR/pagtracker_$DATE.tar.gz \
    --exclude=node_modules \
    --exclude=.git \
    --exclude=.next \
    /opt/pagtracker

echo "✅ Backup criado: $BACKUP_DIR/pagtracker_$DATE.tar.gz"
EOF

chmod +x /opt/pagtracker/backup.sh

echo ""
echo "✅ DEPLOY CONCLUÍDO COM SUCESSO!"
echo "================================"
echo ""
echo "🌐 URLs de acesso:"
echo "   - App Principal: http://localhost:3000"
echo "   - Nginx: http://localhost:80"
echo "   - Traefik Dashboard: http://localhost:8080"
echo ""
echo "📊 Comandos úteis:"
echo "   - Status: cd /opt/pagtracker && ./monitor.sh"
echo "   - Logs: docker-compose logs -f pagtracker-app"
echo "   - Backup: cd /opt/pagtracker && ./backup.sh"
echo "   - Parar: docker-compose down"
echo "   - Reiniciar: docker-compose restart"
echo ""
echo "🔧 Próximos passos:"
echo "   1. Configure o domínio no Cloudflare"
echo "   2. Configure SSL automático"
echo "   3. Configure webhooks do EfiPay"
echo "   4. Teste as funcionalidades"
echo ""
echo "📈 Recursos da VPS:"
echo "   - RAM: 2GB (suficiente para todos os serviços)"
echo "   - Disco: 25GB (plenty de espaço)"
echo "   - CPU: Otimizado para carga moderada" 