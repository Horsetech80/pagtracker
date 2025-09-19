#!/bin/bash
# ============================================
# SETUP SSL CERTIFICATES - PAGTRACKER V4.0
# Script para configurar certificados SSL
# ============================================

set -e

# Cores para output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configurações
EMAIL="admin@pagtracker.com"
NGINX_CONTAINER="pagtracker-nginx"
CERTBOT_CONTAINER="pagtracker-certbot"

# Domínios principais - apenas pagtracker.com
DOMAINS=(
    "pagtracker.com"
    "www.pagtracker.com"
    "admin-hml.pagtracker.com"
    "api-hml.pagtracker.com"
    "checkout-hml.pagtracker.com"
    "docs-hml.pagtracker.com" 
    "hml.pagtracker.com"
    "webhook-hml.pagtracker.com"
)

echo -e "${BLUE}============================================${NC}"
echo -e "${BLUE}  PAGTRACKER V4.0 - SSL SETUP${NC}"
echo -e "${BLUE}============================================${NC}"

# Função para logging
log() {
    echo -e "${GREEN}[$(date +'%Y-%m-%d %H:%M:%S')] $1${NC}"
}

error() {
    echo -e "${RED}[$(date +'%Y-%m-%d %H:%M:%S')] ERROR: $1${NC}"
}

warning() {
    echo -e "${YELLOW}[$(date +'%Y-%m-%d %H:%M:%S')] WARNING: $1${NC}"
}

# Verificar se Docker está rodando
check_docker() {
    log "Verificando Docker..."
    if ! docker ps >/dev/null 2>&1; then
        error "Docker não está rodando!"
        exit 1
    fi
    log "✅ Docker está funcionando"
}

# Criar diretórios necessários
create_directories() {
    log "Criando diretórios SSL..."
    
    # Certificados
    mkdir -p nginx/ssl/live
    mkdir -p nginx/ssl/archive
    mkdir -p certbot/conf
    mkdir -p certbot/www
    
    # Logs
    mkdir -p logs/certbot
    
    log "✅ Diretórios criados"
}

# Gerar certificado auto-assinado temporário
generate_self_signed() {
    log "Gerando certificados auto-assinados temporários..."
    
    for domain in "${DOMAINS[@]}"; do
        if [[ "$domain" == *".pagtracker.com.br" ]]; then
            cert_name="pagtracker.com.br"
        else
            cert_name="pagtracker.com"
        fi
        
        if [ ! -f "nginx/ssl/${cert_name}.crt" ]; then
            log "Gerando certificado para ${cert_name}..."
            
            openssl req -x509 -nodes -days 365 -newkey rsa:2048 \
                -keyout "nginx/ssl/${cert_name}.key" \
                -out "nginx/ssl/${cert_name}.crt" \
                -subj "/C=BR/ST=Sao Paulo/L=Sao Paulo/O=PagTracker/OU=IT/CN=${cert_name}"
            
            log "✅ Certificado auto-assinado criado para ${cert_name}"
        fi
    done
}

# Função para obter certificado Let's Encrypt
get_letsencrypt_cert() {
    local domains_list=""
    for domain in "${DOMAINS[@]}"; do
        domains_list="$domains_list -d $domain"
    done
    
    log "Obtendo certificados Let's Encrypt..."
    log "Domínios: ${domains_list}"
    
    # Parar nginx temporariamente
    docker-compose stop nginx || true
    
    # Obter certificado
    docker run --rm \
        -v "$(pwd)/certbot/conf:/etc/letsencrypt" \
        -v "$(pwd)/certbot/www:/var/www/certbot" \
        -p 80:80 \
        certbot/certbot \
        certonly --standalone \
        --email "$EMAIL" \
        --agree-tos \
        --no-eff-email \
        --force-renewal \
        $domains_list
    
    if [ $? -eq 0 ]; then
        log "✅ Certificados Let's Encrypt obtidos com sucesso!"
        
        # Copiar certificados para nginx/ssl
        cp "certbot/conf/live/pagtracker.com/fullchain.pem" "nginx/ssl/pagtracker.com.crt"
        cp "certbot/conf/live/pagtracker.com/privkey.pem" "nginx/ssl/pagtracker.com.key"
        
        # Se tiver domínio .com.br
        if [ -d "certbot/conf/live/pagtracker.com.br" ]; then
            cp "certbot/conf/live/pagtracker.com.br/fullchain.pem" "nginx/ssl/pagtracker.com.br.crt"
            cp "certbot/conf/live/pagtracker.com.br/privkey.pem" "nginx/ssl/pagtracker.com.br.key"
        fi
        
        log "✅ Certificados copiados para nginx/ssl"
    else
        error "Falha ao obter certificados Let's Encrypt"
        warning "Usando certificados auto-assinados"
    fi
    
    # Reiniciar nginx
    docker-compose start nginx
}

# Função para renovar certificados
renew_certificates() {
    log "Renovando certificados..."
    
    docker run --rm \
        -v "$(pwd)/certbot/conf:/etc/letsencrypt" \
        -v "$(pwd)/certbot/www:/var/www/certbot" \
        certbot/certbot \
        renew --webroot --webroot-path=/var/www/certbot
    
    if [ $? -eq 0 ]; then
        log "✅ Certificados renovados com sucesso!"
        
        # Recarregar nginx
        docker-compose exec nginx nginx -s reload
        log "✅ Nginx recarregado"
    else
        error "Falha ao renovar certificados"
    fi
}

# Função para verificar certificados
check_certificates() {
    log "Verificando certificados..."
    
    for domain in "${DOMAINS[@]}"; do
        if openssl s_client -connect "${domain}:443" -servername "$domain" </dev/null 2>/dev/null | openssl x509 -noout -dates 2>/dev/null; then
            log "✅ Certificado válido para ${domain}"
        else
            warning "⚠️  Problema com certificado para ${domain}"
        fi
    done
}

# Menu principal
show_menu() {
    echo
    echo -e "${BLUE}Escolha uma opção:${NC}"
    echo "1) Configuração inicial (certificados auto-assinados)"
    echo "2) Obter certificados Let's Encrypt"
    echo "3) Renovar certificados"
    echo "4) Verificar certificados"
    echo "5) Sair"
    echo
}

# Função principal
main() {
    check_docker
    create_directories
    
    if [ "$1" = "--auto" ]; then
        log "Modo automático - configuração inicial"
        generate_self_signed
        exit 0
    fi
    
    if [ "$1" = "--letsencrypt" ]; then
        log "Modo automático - Let's Encrypt"
        get_letsencrypt_cert
        exit 0
    fi
    
    if [ "$1" = "--renew" ]; then
        log "Modo automático - renovação"
        renew_certificates
        exit 0
    fi
    
    while true; do
        show_menu
        read -p "Digite sua escolha [1-5]: " choice
        
        case $choice in
            1)
                generate_self_signed
                ;;
            2)
                get_letsencrypt_cert
                ;;
            3)
                renew_certificates
                ;;
            4)
                check_certificates
                ;;
            5)
                log "Saindo..."
                exit 0
                ;;
            *)
                error "Opção inválida"
                ;;
        esac
        
        echo
        read -p "Pressione Enter para continuar..."
    done
}

# Executar
main "$@"
