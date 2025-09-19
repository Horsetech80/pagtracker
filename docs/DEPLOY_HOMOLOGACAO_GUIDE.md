# 🚀 Guia de Deploy - Ambiente de Homologação PagTracker v4.0

> **Guia completo para configurar ambiente de homologação com URLs HTTPS públicas**

## 📋 **VISÃO GERAL**

Este guia detalha como configurar um ambiente de homologação completo para o PagTracker v4.0, resolvendo definitivamente o problema de webhooks PIX que exigem URLs HTTPS públicas.

### **🎯 Objetivos**
- ✅ Resolver erro 500 na API PIX Envio
- ✅ Configurar URLs HTTPS públicas para webhooks
- ✅ Estabelecer ambiente pré-produção estável
- ✅ Implementar conformidade total com EfiPay

---

## 🌐 **ESTRUTURA DE SUBDOMÍNIOS**

### **Ambiente de Homologação**
```
├── hml.pagtracker.com              # 🎯 Dashboard Principal
├── checkout-hml.pagtracker.com     # 💳 Checkout/Pagamento  
├── api-hml.pagtracker.com          # 🔌 API Gateway
├── webhook-hml.pagtracker.com      # 🔔 Webhooks PIX/mTLS
├── docs-hml.pagtracker.com         # 📚 Documentação
└── admin-hml.pagtracker.com        # 👨‍💼 Painel Admin
```

### **Mapeamento de Portas**
| Subdomínio | Porta Local | Descrição |
|------------|-------------|-----------|
| `hml.pagtracker.com` | 3000 | Dashboard principal |
| `checkout-hml.pagtracker.com` | 3000 | Interface de checkout |
| `api-hml.pagtracker.com` | 3000 | APIs REST |
| `webhook-hml.pagtracker.com` | 3001 | Webhooks mTLS |
| `admin-hml.pagtracker.com` | 3000 | Painel administrativo |
| `docs-hml.pagtracker.com` | 3000 | Documentação |

---

## 🔧 **PASSO 1: CONFIGURAÇÃO CLOUDFLARE DNS**

### **1.1 Obter Credenciais Cloudflare**

1. Acesse [Cloudflare Dashboard](https://dash.cloudflare.com)
2. Selecione o domínio `pagtracker.com`
3. Vá em **Overview** → copie o **Zone ID**
4. Vá em **API Tokens** → **Create Token**
5. Use template **Custom Token** com:
   - **Permissions**: `Zone:Zone:Read`, `Zone:DNS:Edit`
   - **Zone Resources**: `Include Specific Zone: pagtracker.com`

### **1.2 Configurar Variáveis de Ambiente**

Crie arquivo `.env.cloudflare`:
```bash
# Configurações Cloudflare
CLOUDFLARE_ZONE_ID=seu_zone_id_aqui
CLOUDFLARE_API_TOKEN=seu_api_token_aqui
CLOUDFLARE_EMAIL=admin@pagtracker.com

# IPs dos Servidores
HML_SERVER_IP=45.33.32.156  # Substitua pelo IP real
PROD_SERVER_IP=139.177.185.89  # Para futuro uso
```

### **1.3 Executar Configuração DNS**

```bash
# Carregar variáveis de ambiente
source .env.cloudflare

# Executar script de configuração DNS
node scripts/setup-cloudflare-dns.js
```

**Resultado esperado:**
```
🚀 INICIANDO CONFIGURAÇÃO DNS PAGTRACKER.COM
===============================================
🔒 Configurando SSL/TLS Universal...
✅ SSL/TLS configurado com sucesso

🏗️ AMBIENTE DE HOMOLOGAÇÃO:
🌐 Criando registro A: hml.pagtracker.com → 45.33.32.156
✅ Registro criado: hml.pagtracker.com
🌐 Criando registro A: checkout-hml.pagtracker.com → 45.33.32.156
✅ Registro criado: checkout-hml.pagtracker.com
...
✅ CONFIGURAÇÃO DNS CONCLUÍDA!
```

---

## 🖥️ **PASSO 2: CONFIGURAÇÃO DO SERVIDOR**

### **2.1 Requisitos do Servidor**

**Especificações mínimas:**
- **CPU**: 2 vCPUs
- **RAM**: 4GB
- **Storage**: 40GB SSD
- **OS**: Ubuntu 20.04 LTS ou superior
- **Banda**: 100 Mbps

**Provedores recomendados:**
- [Linode](https://www.linode.com) - $24/mês
- [DigitalOcean](https://www.digitalocean.com) - $24/mês  
- [Vultr](https://www.vultr.com) - $24/mês

### **2.2 Instalação Inicial do Servidor**

```bash
# Conectar ao servidor
ssh root@45.33.32.156

# Atualizar sistema
apt update && apt upgrade -y

# Instalar dependências essenciais
apt install -y curl wget git nginx certbot python3-certbot-nginx nodejs npm

# Instalar Node.js 18 (LTS)
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
apt install -y nodejs

# Instalar pnpm
npm install -g pnpm

# Verificar instalação
node --version  # v18.x.x
npm --version   # 9.x.x
pnpm --version  # 8.x.x
```

### **2.3 Configurar Firewall**

```bash
# Configurar UFW
ufw allow OpenSSH
ufw allow 'Nginx Full'
ufw allow 80
ufw allow 443
ufw allow 3000
ufw allow 3001
ufw --force enable

# Verificar status
ufw status
```

---

## 🌐 **PASSO 3: CONFIGURAÇÃO NGINX**

### **3.1 Gerar Configurações Nginx**

No seu ambiente local:
```bash
# Gerar configurações Nginx
node scripts/setup-nginx-config.js

# Verificar arquivos gerados
ls -la nginx-configs/homologacao/
```

### **3.2 Copiar Configurações para Servidor**

```bash
# Copiar configurações para servidor
scp -r nginx-configs/ root@45.33.32.156:/tmp/

# No servidor, mover configurações
ssh root@45.33.32.156
mv /tmp/nginx-configs/nginx.conf /etc/nginx/nginx.conf
mv /tmp/nginx-configs/homologacao/*.conf /etc/nginx/sites-available/

# Criar links simbólicos
cd /etc/nginx/sites-enabled
for conf in /etc/nginx/sites-available/*.conf; do
    ln -sf "$conf" .
done

# Remover configuração padrão
rm -f default

# Testar configuração
nginx -t
```

### **3.3 Instalar Certificados SSL**

```bash
# Executar script de SSL
chmod +x /tmp/nginx-configs/homologacao/install-ssl-homologacao.sh
/tmp/nginx-configs/homologacao/install-ssl-homologacao.sh
```

**Processo esperado:**
```
🔒 Instalando certificados SSL para PagTracker...
📦 Instalando Certbot...
🌐 Obtendo certificado SSL para hml.pagtracker.com...
✅ Certificado obtido para hml.pagtracker.com
🌐 Obtendo certificado SSL para checkout-hml.pagtracker.com...
✅ Certificado obtido para checkout-hml.pagtracker.com
...
🔄 Configurando renovação automática...
✅ Configuração SSL concluída!
```

---

## 📦 **PASSO 4: DEPLOY DA APLICAÇÃO**

### **4.1 Clonar Repositório no Servidor**

```bash
# Criar usuário para aplicação
adduser --system --group --home /home/pagtracker pagtracker

# Clonar repositório
su - pagtracker
git clone https://github.com/seu-usuario/PagTracker.git
cd PagTracker

# Instalar dependências
pnpm install
```

### **4.2 Configurar Variáveis de Ambiente**

```bash
# Criar arquivo de ambiente para homologação
cat > .env.local << 'EOF'
# PagTracker v4.0 - Homologação
NODE_ENV=homologacao

# URLs de Webhook
WEBHOOK_URL=https://webhook-hml.pagtracker.com/webhook

# URLs Base
NEXT_PUBLIC_APP_URL=https://hml.pagtracker.com
NEXT_PUBLIC_API_URL=https://api-hml.pagtracker.com

# Configurações EfiPay (Homologação)
EFIPAY_CLIENT_ID=seu_client_id_homologacao
EFIPAY_CLIENT_SECRET=seu_client_secret_homologacao
EFIPAY_PIX_KEY=teste@efipay.com.br
EFIPAY_CERTIFICATE_PATH=./certificates/homologacao-certificate.p12

# Configurações Supabase
NEXT_PUBLIC_SUPABASE_URL=https://tqcxbiofslypocltpxmb.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=seu_anon_key
SUPABASE_SERVICE_ROLE_KEY=seu_service_role_key

# Configurações de Segurança
JWT_SECRET=seu_jwt_secret_homologacao
ENCRYPTION_KEY=seu_encryption_key_homologacao
EOF
```

### **4.3 Build e Inicialização**

```bash
# Build da aplicação
pnpm build

# Testar aplicação
pnpm start &

# Verificar se está rodando
curl http://localhost:3000/api/health
```

### **4.4 Configurar PM2 (Process Manager)**

```bash
# Instalar PM2
npm install -g pm2

# Criar configuração PM2
cat > ecosystem.config.js << 'EOF'
module.exports = {
  apps: [
    {
      name: 'pagtracker-main',
      script: 'npm',
      args: 'start',
      cwd: '/home/pagtracker/PagTracker',
      instances: 1,
      exec_mode: 'fork',
      env: {
        NODE_ENV: 'homologacao',
        PORT: 3000
      },
      error_file: '/var/log/pm2/pagtracker-main-error.log',
      out_file: '/var/log/pm2/pagtracker-main-out.log',
      log_file: '/var/log/pm2/pagtracker-main.log',
    },
    {
      name: 'pagtracker-webhook',
      script: 'node',
      args: 'scripts/start-webhook-server.js',
      cwd: '/home/pagtracker/PagTracker',
      instances: 1,
      exec_mode: 'fork',
      env: {
        NODE_ENV: 'homologacao',
        PORT: 3001
      },
      error_file: '/var/log/pm2/pagtracker-webhook-error.log',
      out_file: '/var/log/pm2/pagtracker-webhook-out.log',
      log_file: '/var/log/pm2/pagtracker-webhook.log',
    }
  ]
};
EOF

# Criar diretório de logs
mkdir -p /var/log/pm2

# Iniciar aplicações
pm2 start ecosystem.config.js

# Configurar para iniciar no boot
pm2 startup
pm2 save
```

---

## 🔧 **PASSO 5: ATUALIZAR CÓDIGO PARA HTTPS**

### **5.1 Executar Script de Atualização**

No seu ambiente local:
```bash
# Atualizar sistema para URLs HTTPS
node scripts/update-webhook-service.js
```

### **5.2 Verificar Alterações**

**EfiPayWebhookServiceSimple.ts** agora usa:
```typescript
// URLs por ambiente
const urls = {
  development: 'http://localhost:3001/webhook',
  homologacao: 'https://webhook-hml.pagtracker.com/webhook',
  production: 'https://webhook.pagtracker.com/webhook'
};
```

### **5.3 Deploy das Alterações**

```bash
# Commit e push das alterações
git add .
git commit -m "feat: configurar URLs HTTPS para webhooks PIX"
git push origin main

# No servidor, atualizar código
ssh pagtracker@45.33.32.156
cd PagTracker
git pull origin main
pnpm install
pnpm build

# Reiniciar aplicações
pm2 restart all
```

---

## 🧪 **PASSO 6: TESTES E VALIDAÇÃO**

### **6.1 Verificar Conectividade**

```bash
# Testar todos os subdomínios
curl -I https://hml.pagtracker.com
curl -I https://checkout-hml.pagtracker.com
curl -I https://api-hml.pagtracker.com
curl -I https://webhook-hml.pagtracker.com
curl -I https://admin-hml.pagtracker.com
curl -I https://docs-hml.pagtracker.com
```

**Resposta esperada:**
```
HTTP/2 200
server: nginx
content-type: text/html
...
```

### **6.2 Testar API PIX Envio**

```bash
# Testar endpoint de PIX envio
curl -X POST https://api-hml.pagtracker.com/api/efipay/pix-envio \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer seu_token" \
  -d '{
    "valor": 1000,
    "destinatario": {
      "nome": "Teste",
      "email": "teste@exemplo.com"
    }
  }'
```

### **6.3 Validar Webhook PIX**

1. Acesse: `https://hml.pagtracker.com/pix-envio`
2. Preencha formulário de envio PIX
3. Verifique logs do webhook:

```bash
# No servidor, verificar logs
pm2 logs pagtracker-webhook
```

**Log esperado:**
```
✅ [WEBHOOK-AUTO] URL Webhook: https://webhook-hml.pagtracker.com/webhook
✅ [WEBHOOK] Webhook configurado com sucesso
✅ [PIX-ENVIO] PIX enviado com sucesso
```

---

## 📊 **PASSO 7: MONITORAMENTO**

### **7.1 Configurar Logs Centralizados**

```bash
# Instalar Logrotate
apt install -y logrotate

# Configurar rotação de logs
cat > /etc/logrotate.d/pagtracker << 'EOF'
/var/log/pm2/*.log {
    daily
    missingok
    rotate 30
    compress
    delaycompress
    notifempty
    copytruncate
}
EOF
```

### **7.2 Script de Monitoramento**

```bash
# Criar script de health check
cat > /home/pagtracker/health-check.sh << 'EOF'
#!/bin/bash

echo "🏥 PagTracker Health Check - $(date)"
echo "=================================="

# Verificar processos PM2
echo "📊 Status PM2:"
pm2 status

# Verificar conectividade
echo -e "\n🌐 Conectividade:"
for url in "https://hml.pagtracker.com" "https://webhook-hml.pagtracker.com"; do
    status=$(curl -s -o /dev/null -w "%{http_code}" "$url")
    if [ "$status" = "200" ]; then
        echo "✅ $url - OK"
    else
        echo "❌ $url - ERRO ($status)"
    fi
done

# Verificar certificados SSL
echo -e "\n🔒 Certificados SSL:"
for domain in "hml.pagtracker.com" "webhook-hml.pagtracker.com"; do
    expiry=$(echo | openssl s_client -servername "$domain" -connect "$domain:443" 2>/dev/null | openssl x509 -noout -dates | grep notAfter | cut -d= -f2)
    echo "📅 $domain - Expira: $expiry"
done

echo -e "\n✅ Health check concluído!"
EOF

chmod +x /home/pagtracker/health-check.sh

# Configurar cron para executar a cada hora
echo "0 * * * * /home/pagtracker/health-check.sh >> /var/log/pagtracker-health.log 2>&1" | crontab -
```

---

## 🎯 **RESULTADO ESPERADO**

Após completar todos os passos, você terá:

### **✅ URLs Funcionais**
- 🎯 **Dashboard**: https://hml.pagtracker.com
- 💳 **Checkout**: https://checkout-hml.pagtracker.com  
- 🔌 **API**: https://api-hml.pagtracker.com
- 🔔 **Webhook**: https://webhook-hml.pagtracker.com
- 👨‍💼 **Admin**: https://admin-hml.pagtracker.com
- 📚 **Docs**: https://docs-hml.pagtracker.com

### **✅ Problema Resolvido**
- ❌ **Antes**: `Erro 500 - URL localhost rejeitada pelo EfiPay`
- ✅ **Depois**: `Webhook PIX funcionando com URL HTTPS pública`

### **✅ Conformidade EfiPay**
- 🔒 **mTLS**: Configurado e funcionando
- 🌐 **URL Pública**: HTTPS válida
- 📋 **Documentação**: 100% conforme oficial
- 🧪 **Testes**: Validados e aprovados

---

## 🚨 **TROUBLESHOOTING**

### **Problema: DNS não propagou**
```bash
# Verificar propagação DNS
dig +short hml.pagtracker.com
nslookup hml.pagtracker.com 8.8.8.8
```

### **Problema: Certificado SSL não instalado**
```bash
# Verificar certificados
certbot certificates
ls -la /etc/letsencrypt/live/
```

### **Problema: Aplicação não responde**
```bash
# Verificar processos
pm2 status
pm2 logs pagtracker-main
netstat -tlnp | grep :3000
```

### **Problema: Webhook PIX ainda falhando**
```bash
# Verificar configuração
curl -v https://webhook-hml.pagtracker.com/health
pm2 logs pagtracker-webhook
```

---

## 📞 **SUPORTE**

Para dúvidas ou problemas:

1. **Verificar logs**: `pm2 logs`
2. **Health check**: `/home/pagtracker/health-check.sh`
3. **Documentação**: https://docs-hml.pagtracker.com
4. **Issues**: GitHub Issues do projeto

---

**🎉 Com este ambiente de homologação, o erro 500 na API PIX Envio será completamente resolvido, permitindo webhooks PIX funcionais com URLs HTTPS públicas conforme exigido pelo EfiPay!** 