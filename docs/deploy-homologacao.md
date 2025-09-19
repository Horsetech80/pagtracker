# 🚀 Guia de Deploy - PagTracker Homologação

## 📋 **PRÉ-REQUISITOS**

### **Infraestrutura Necessária**
- ✅ **VPS Dedicada** (mínimo 2GB RAM, 2 vCPUs)
- ✅ **Domínio configurado** no Cloudflare
- ✅ **Certificados EfiPay** (homologação)
- ✅ **Projeto no GitHub** (branch main)

### **Software Necessário no Servidor**
```bash
# Ubuntu/Debian
sudo apt update && sudo apt install -y \
    docker.io \
    docker-compose \
    git \
    curl \
    nginx \
    certbot

# Iniciar Docker
sudo systemctl start docker
sudo systemctl enable docker
sudo usermod -aG docker $USER
```

---

## 🔧 **CONFIGURAÇÃO INICIAL**

### **1. Configurar Cloudflare**

#### **DNS Records**
```
Tipo    Nome                        Valor                 Proxy
A       homolog.pagtracker.com.br   IP_DO_SEU_VPS         ✅
A       webhooks.pagtracker.com.br  IP_DO_SEU_VPS         ✅
A       traefik.pagtracker.com.br   IP_DO_SEU_VPS         ✅
```

#### **API Token**
1. Vá em **Cloudflare Dashboard** → **My Profile** → **API Tokens**
2. Crie um token com permissões:
   - `Zone:Zone:Read`
   - `Zone:DNS:Edit`
3. Anote o token para usar no `.env`

### **2. Configurar VPS**

#### **Conectar via SSH**
```bash
ssh root@IP_DO_SEU_VPS
```

#### **Configurar Firewall**
```bash
# UFW (Ubuntu)
sudo ufw allow 22/tcp    # SSH
sudo ufw allow 80/tcp    # HTTP
sudo ufw allow 443/tcp   # HTTPS
sudo ufw allow 3000/tcp  # PagTracker App
sudo ufw allow 3001/tcp  # Webhooks
sudo ufw enable
```

---

## 📦 **DEPLOY PASSO A PASSO**

### **1. Clonar o Repositório**
```bash
cd /opt
sudo git clone https://github.com/Horsetech80/pagtracker.git
cd pagtracker
sudo chown -R $USER:$USER .
```

### **2. Configurar Variáveis de Ambiente**
```bash
# Copiar template
cp config/production.env .env

# Editar com suas credenciais
nano .env
```

#### **Configurações Obrigatórias**
```bash
# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://seu-projeto.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=sua-chave-anonima
SUPABASE_SERVICE_ROLE_KEY=sua-chave-service-role

# EfiPay
EFIPAY_CLIENT_ID=Client_Id_sua_chave_homologacao
EFIPAY_CLIENT_SECRET=Client_Secret_sua_chave_homologacao
EFIPAY_SANDBOX=true

# Cloudflare
CLOUDFLARE_EMAIL=seu-email@dominio.com
CLOUDFLARE_API_KEY=sua-api-key-global

# Domínio
NEXT_PUBLIC_APP_URL=https://homolog.pagtracker.com.br
```

### **3. Configurar Certificados EfiPay**
```bash
# Criar diretório
mkdir -p certificates

# Copiar certificado de homologação
# (via SCP, SFTP ou upload)
scp certificado-homologacao.p12 root@IP_VPS:/opt/pagtracker/certificates/homologacao.p12
```

### **4. Executar Deploy**
```bash
# Dar permissão aos scripts
chmod +x scripts/deploy-homologacao.sh
chmod +x scripts/monitor-homologacao.sh

# Executar deploy
./scripts/deploy-homologacao.sh
```

---

## 🔍 **VERIFICAÇÃO E MONITORAMENTO**

### **1. Verificar Status**
```bash
# Status dos containers
docker-compose ps

# Logs em tempo real
docker-compose logs -f pagtracker-app

# Monitor completo
./scripts/monitor-homologacao.sh
```

### **2. Testar Endpoints**

#### **Health Checks**
```bash
# App principal
curl -I http://localhost:3000/health

# Webhook server
curl -I http://localhost:3001/health

# Traefik dashboard
curl -I http://localhost:8080
```

#### **API de Pagamentos**
```bash
# Criar pagamento PIX
curl -X POST http://localhost:3000/api/payments \
  -H "Content-Type: application/json" \
  -H "X-Tenant-ID: homologacao" \
  -d '{
    "method": "pix",
    "amount": 1000,
    "customer": {
      "email": "teste@exemplo.com",
      "name": "Teste Homologação"
    }
  }'
```

### **3. URLs de Acesso**

| Serviço | URL Local | URL Produção |
|---------|-----------|--------------|
| **App Principal** | http://localhost:3000 | https://homolog.pagtracker.com.br |
| **Webhooks** | http://localhost:3001 | https://webhooks.pagtracker.com.br |
| **Traefik Dashboard** | http://localhost:8080 | https://traefik.pagtracker.com.br |
| **API Docs** | http://localhost:3000/api | https://homolog.pagtracker.com.br/api |

---

## 🔄 **ATUALIZAÇÕES E MANUTENÇÃO**

### **Atualizar Código**
```bash
cd /opt/pagtracker
git pull origin main
docker-compose up -d --build
```

### **Backup do Banco**
```bash
# Backup automático (configurar no cron)
docker-compose exec pagtracker-app npm run db:backup
```

### **Logs e Monitoramento**
```bash
# Ver logs específicos
docker-compose logs -f pagtracker-app | grep ERROR

# Monitoramento contínuo
./scripts/monitor-homologacao.sh --watch

# Limpar logs antigos
docker system prune -f
```

---

## 🚨 **TROUBLESHOOTING**

### **Problemas Comuns**

#### **Container não inicia**
```bash
# Verificar logs
docker-compose logs pagtracker-app

# Reiniciar container
docker-compose restart pagtracker-app

# Rebuild completo
docker-compose down
docker-compose up -d --build
```

#### **SSL não funciona**
```bash
# Verificar certificados Traefik
docker-compose logs traefik | grep -i certificate

# Forçar renovação
docker-compose restart traefik
```

#### **Webhook não recebe**
```bash
# Verificar URL no EfiPay
curl -X GET https://sandbox.efipay.com.br/v1/webhooks \
  -H "Authorization: Bearer SEU_TOKEN"

# Testar webhook manualmente
curl -X POST http://localhost:3001/webhook/efipay \
  -H "Content-Type: application/json" \
  -d '{"test": true}'
```

#### **Banco não conecta**
```bash
# Verificar configuração Supabase
docker-compose exec pagtracker-app npm run db:test

# Verificar variáveis
docker-compose exec pagtracker-app env | grep SUPABASE
```

---

## 📊 **MÉTRICAS E ALERTAS**

### **Configurar Monitoramento**
```bash
# Instalar ferramentas de monitoramento
sudo apt install -y htop iotop nethogs

# Configurar alertas por email (opcional)
sudo apt install -y mailutils
```

### **Métricas Importantes**
- **CPU**: < 80%
- **Memória**: < 85%
- **Disco**: < 90%
- **Response Time**: < 500ms
- **Uptime**: > 99.5%

---

## 🔐 **SEGURANÇA**

### **Configurações Recomendadas**
```bash
# Atualizar sistema
sudo apt update && sudo apt upgrade -y

# Configurar fail2ban
sudo apt install -y fail2ban

# Configurar backup automático
crontab -e
# Adicionar: 0 2 * * * /opt/pagtracker/scripts/backup.sh
```

### **Variáveis Sensíveis**
- ✅ Nunca commitar `.env` no Git
- ✅ Usar secrets do Docker Swarm (produção)
- ✅ Rotacionar chaves regularmente
- ✅ Monitorar logs de acesso

---

## 🎯 **PRÓXIMOS PASSOS**

### **Após Deploy Bem-sucedido**
1. **Configurar EfiPay** com URLs de webhook
2. **Testar fluxo completo** de pagamento
3. **Configurar monitoramento** automático
4. **Documentar** credenciais e acessos
5. **Treinar equipe** nos processos

### **Migração para Produção**
1. Configurar domínio de produção
2. Obter certificados EfiPay de produção
3. Configurar ambiente de produção
4. Executar testes de carga
5. Configurar backup e DR

---

## 📞 **SUPORTE**

### **Comandos de Emergência**
```bash
# Parar tudo
docker-compose down

# Reiniciar tudo
docker-compose up -d

# Logs de emergência
docker-compose logs --tail=100 pagtracker-app > emergency.log

# Status rápido
./scripts/monitor-homologacao.sh
```

### **Contatos**
- **Repositório**: https://github.com/Horsetech80/pagtracker
- **Documentação**: `/docs/`
- **Issues**: GitHub Issues

---

**✅ PagTracker está pronto para homologação! 🚀** 