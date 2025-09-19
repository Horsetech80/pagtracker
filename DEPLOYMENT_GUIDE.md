# 🚀 GUIA DE DEPLOY - PAGTRACKER V4.0 COM REDIS

## ✅ **O QUE FOI IMPLEMENTADO**

### 🏗️ **INFRAESTRUTURA COMPLETA**
- ✅ **Dockerfile** otimizado para produção
- ✅ **Docker Compose** completo (App + Redis + Nginx)
- ✅ **Redis** configurado para cache distribuído multitenant
- ✅ **Nginx** como reverse proxy com rate limiting
- ✅ **Scripts de deploy** automatizados

### 🔧 **REDIS IMPLEMENTATION**
- ✅ **Connection Manager** com fallback automático
- ✅ **Cache Multitenant** isolado por tenant
- ✅ **Dashboard Cache** para APIs principais
- ✅ **Health Checks** e monitoramento
- ✅ **Memory Fallback** quando Redis indisponível

---

## 🎯 **COMO USAR - COMANDOS PRÁTICOS**

### **1. DESENVOLVIMENTO LOCAL (Com Redis)**
```cmd
# Iniciar Redis + App desenvolvimento
.\scripts\start-development.cmd
```

### **2. PRODUÇÃO COMPLETA (Docker)**
```cmd
# Deploy completo com containers
.\scripts\deploy-production.cmd
```

### **3. APENAS REDIS (Para desenvolvimento)**
```cmd
# Só Redis para testar cache
docker-compose -f docker-compose.redis.yml up -d redis

# Verificar status
docker ps
docker logs pagtracker-redis

# Parar Redis
docker stop pagtracker-redis
```

### **4. STACK COMPLETA MANUAL**
```cmd
# 1. Iniciar Redis
docker-compose --env-file docker.env up -d redis

# 2. Iniciar App
docker-compose --env-file docker.env up -d app

# 3. Iniciar Nginx
docker-compose --env-file docker.env up -d nginx

# 4. Verificar tudo
docker-compose ps
```

---

## 🌍 **DEPLOY EM VPS/SERVIDOR**

### **PREPARAÇÃO DO SERVIDOR**
```bash
# 1. Instalar Docker
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh

# 2. Instalar Docker Compose
sudo curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
sudo chmod +x /usr/local/bin/docker-compose

# 3. Clonar projeto
git clone <seu-repositorio>
cd PagTracker
```

### **CONFIGURAÇÃO VPS**
```bash
# 1. Configurar variáveis de ambiente
cp docker.env .env
nano .env  # Ajustar URLs e senhas

# 2. Configurar domínio no Nginx
nano nginx/conf.d/pagtracker.conf  # Mudar server_name

# 3. Deploy
chmod +x scripts/deploy-production.sh
./scripts/deploy-production.sh
```

---

## 📊 **MONITORAMENTO**

### **URLs DISPONÍVEIS**
- **Frontend**: http://localhost (Nginx)
- **API**: http://localhost/api (Proxy para App)
- **Webhooks**: http://localhost/webhook (Proxy para App:3001)
- **Redis Commander**: http://localhost:8081 (Interface web)
- **Health Check**: http://localhost/health

### **LOGS IMPORTANTES**
```cmd
# Logs da aplicação
docker logs pagtracker-app -f

# Logs do Redis
docker logs pagtracker-redis -f

# Logs do Nginx
docker logs pagtracker-nginx -f

# Logs de todos os serviços
docker-compose logs -f
```

### **VERIFICAÇÕES DE SAÚDE**
```cmd
# Status dos containers
docker-compose ps

# Health checks
curl http://localhost/health
curl http://localhost/api/health

# Status do Redis
docker exec pagtracker-redis redis-cli ping
```

---

## 🔧 **ESTRUTURA DE ARQUIVOS**

```
PagTracker/
├── 📁 data/                    # Dados persistentes
│   ├── redis/                  # Dados do Redis
│   └── uploads/                # Uploads da aplicação
├── 📁 logs/                    # Logs dos serviços
│   └── nginx/                  # Logs do Nginx
├── 📁 nginx/                   # Configurações Nginx
│   └── conf.d/                 # Configurações de sites
├── 📁 scripts/                 # Scripts de deploy
├── 📁 src/lib/redis/           # Implementação Redis
│   ├── connection.ts           # Manager de conexão
│   ├── cache.ts               # Cache multitenant
│   └── dashboard-cache.ts      # Cache do dashboard
├── 🐳 Dockerfile              # Build da aplicação
├── 🐳 docker-compose.yml      # Stack completa
├── 🐳 docker-compose.redis.yml # Apenas Redis
├── ⚙️ docker.env              # Configuração produção
└── ⚙️ redis.conf              # Configuração Redis
```

---

## 🚨 **TROUBLESHOOTING**

### **PROBLEMA: Redis não conecta**
```cmd
# Verificar se está rodando
docker ps | grep redis

# Verificar logs
docker logs pagtracker-redis

# Testar conexão manual
docker exec pagtracker-redis redis-cli ping
```

### **PROBLEMA: App não acessa Redis**
```cmd
# Verificar network
docker network ls
docker network inspect pagtracker_pagtracker-network

# Verificar variáveis de ambiente
docker exec pagtracker-app env | grep REDIS
```

### **PROBLEMA: Nginx não proxy**
```cmd
# Verificar configuração
docker exec pagtracker-nginx nginx -t

# Verificar logs
docker logs pagtracker-nginx -f

# Recarregar configuração
docker exec pagtracker-nginx nginx -s reload
```

---

## 🎯 **PRÓXIMOS PASSOS**

### **EM DESENVOLVIMENTO**
- [❌] Rate Limiting distribuído
- [❌] Session management via Redis
- [❌] Webhook deduplication
- [❌] Monitoramento avançado

### **PARA PRODUÇÃO**
- [ ] SSL/HTTPS com Let's Encrypt
- [ ] Backup automático do Redis
- [ ] Monitoring com Prometheus
- [ ] Logs centralizados
- [ ] CI/CD pipeline

---

## 🚀 **STATUS ATUAL**

✅ **REDIS FUNCIONANDO**: Cache distribuído ativo
✅ **DOCKER FUNCIONANDO**: Containers rodando
✅ **APP FUNCIONANDO**: PagTracker com Redis
✅ **NGINX CONFIGURADO**: Proxy reverso pronto
✅ **SCRIPTS PRONTOS**: Deploy automatizado

**🎉 PRONTO PARA HOMOLOGAÇÃO E PRODUÇÃO!**
