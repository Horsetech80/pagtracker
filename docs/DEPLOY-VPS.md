# 🚀 PagTracker v4.0 - Deploy VPS

## 📋 Status do Deploy

✅ **Deploy Concluído com Sucesso**
- **IP**: 192.241.150.238
- **Versão**: 4.0.0
- **Data**: 20/06/2025
- **Status**: Produção

## 🏗️ Arquitetura Deployada

### Containers Ativos
- **pagtracker-app**: Next.js na porta 3000
- **pagtracker-redis**: Cache na porta 6379
- **pagtracker-nginx**: Proxy reverso (portas 80/443)

### Containers Pendentes
- **webhook-server**: Aguardando correção do pnpm-lock.yaml

## 🌐 URLs de Acesso

### Produção
- **Aplicação Principal**: http://192.241.150.238:3000
- **Health Check**: http://192.241.150.238:3000/api/health
- **Nginx HTTP**: http://192.241.150.238
- **Nginx HTTPS**: https://192.241.150.238

### Local (VPS)
- **Aplicação**: http://localhost:3000
- **Health**: http://localhost:3000/api/health

## 🛠️ Scripts de Gerenciamento

### Monitoramento
```bash
./monitor.sh
```
- Status dos containers
- Uso de recursos
- Logs recentes
- Health check

### Reinicialização
```bash
./restart.sh
```
- Para todos os serviços
- Reinicia aplicação, redis e nginx

### Backup
```bash
./scripts/backup-vps.sh
```
- Backup completo do sistema
- Inclui código, configurações, logs
- Mantém últimos 5 backups

### Verificação Final
```bash
./scripts/verificacao-final-vps.sh
```
- Diagnóstico completo
- Testes de conectividade
- Correção automática

## 📁 Estrutura de Diretórios

```
/opt/pagtracker/
├── .env                    # Variáveis de ambiente
├── docker-compose.yml      # Configuração Docker
├── monitor.sh             # Script de monitoramento
├── restart.sh             # Script de reinicialização
├── scripts/               # Scripts auxiliares
│   ├── backup-vps.sh
│   └── verificacao-final-vps.sh
└── backups/               # Backups automáticos
```

## 🔧 Comandos Úteis

### Status Geral
```bash
docker-compose ps
docker-compose logs -f [servico]
```

### Logs Específicos
```bash
docker-compose logs pagtracker-app --tail=50
docker-compose logs nginx --tail=20
docker-compose logs redis --tail=10
```

### Reiniciar Serviços
```bash
docker-compose restart pagtracker-app
docker-compose restart nginx
docker-compose restart redis
```

### Parar/Iniciar
```bash
docker-compose down
docker-compose up -d pagtracker-app redis nginx
```

## 🔍 Troubleshooting

### Problema: Nginx reiniciando
```bash
docker-compose logs nginx
docker exec pagtracker-nginx nginx -t
```

### Problema: Aplicação não responde
```bash
curl http://localhost:3000/api/health
docker-compose logs pagtracker-app --tail=20
```

### Problema: Redis não conecta
```bash
docker exec pagtracker-redis redis-cli ping
docker-compose logs redis
```

### Problema: Porta ocupada
```bash
netstat -tlnp | grep :3000
lsof -i :3000
```

## 📊 Monitoramento de Recursos

### Memória
- **Total**: 2GB
- **Usado**: ~487MB
- **Disponível**: ~1.4GB

### Disco
- **Total**: 25GB
- **Usado**: ~4.9GB
- **Disponível**: ~19GB

### Portas
- **3000**: Aplicação Next.js
- **6379**: Redis
- **80**: Nginx HTTP
- **443**: Nginx HTTPS

## 🔐 Segurança

### Firewall Configurado
```bash
ufw allow 22/tcp    # SSH
ufw allow 80/tcp    # HTTP
ufw allow 443/tcp   # HTTPS
ufw allow 3000/tcp  # Aplicação
```

### Variáveis de Ambiente
- Supabase configurado
- EfiPay configurado
- Secrets protegidos

## 🚀 Próximos Passos

### 1. Configurar Webhook Server
```bash
# Corrigir pnpm-lock.yaml
cd /opt/pagtracker
rm -f pnpm-lock.yaml
echo "lockfileVersion: '6.0'" > pnpm-lock.yaml
echo "dependencies: {}" >> pnpm-lock.yaml
echo "devDependencies: {}" >> pnpm-lock.yaml

# Deploy do webhook
docker-compose up -d webhook-server
```

### 2. Configurar SSL
```bash
# Instalar certbot
apt update && apt install certbot

# Gerar certificado
certbot --nginx -d seu-dominio.com
```

### 3. Configurar Backup Automático
```bash
# Adicionar ao crontab
crontab -e

# Backup diário às 2h
0 2 * * * /opt/pagtracker/scripts/backup-vps.sh
```

### 4. Monitoramento Avançado
```bash
# Instalar htop para monitoramento
apt install htop

# Monitorar recursos
htop
```

## 📞 Suporte

### Logs Importantes
- **Aplicação**: `/opt/pagtracker/logs/app.log`
- **Nginx**: `/var/log/nginx/`
- **Docker**: `docker-compose logs`

### Contatos
- **Desenvolvedor**: Horsetech80
- **Repositório**: https://github.com/Horsetech80/pagtracker
- **Branch**: migration-v4

## ✅ Checklist Final

- [x] Deploy da aplicação principal
- [x] Configuração do Redis
- [x] Configuração do Nginx
- [x] Health check funcionando
- [x] Scripts de monitoramento
- [x] Scripts de backup
- [x] Firewall configurado
- [x] Variáveis de ambiente
- [ ] Webhook server (pendente)
- [ ] SSL/HTTPS (pendente)
- [ ] Backup automático (pendente)

---

**🎉 PagTracker v4.0 está rodando em produção!** 