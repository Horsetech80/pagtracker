# 🚀 Deploy PagTracker v4.0: GitHub → VPS

## 📋 Status Atual

✅ **GitHub**: Nova versão enviada com sucesso
✅ **Página de Login**: Implementada
✅ **Scripts**: Criados e prontos
🔄 **VPS**: Aguardando deploy

## 🔑 Token GitHub

### 1. Criar Token de Acesso Pessoal

1. **GitHub.com** → Settings → Developer settings → Personal access tokens → Tokens (classic)
2. **Generate new token** → Generate new token (classic)
3. **Configurar permissões**:
   - ✅ `repo` (Full control of private repositories)
   - ✅ `workflow` (Update GitHub Action workflows)
4. **Copiar o token** (você só verá uma vez!)

### 2. Token Exemplo
```
ghp_[SEU_TOKEN_AQUI]
```

## 🚀 Processo de Deploy

### Passo 1: Preparar Script na VPS

Execute na VPS:

```bash
# 1. Navegar para o diretório
cd /opt/pagtracker

# 2. Criar script de deploy
cat > deploy-github.sh << 'EOF'
#!/bin/bash

echo "🚀 DEPLOY PAGTRACKER v4.0 - VIA GITHUB"
echo "======================================"

# CONFIGURAR AQUI SEU TOKEN
GITHUB_TOKEN="SEU_TOKEN_AQUI"
REPO_URL="https://github.com/Horsetech80/pagtracker.git"
BRANCH="main"
VPS_DIR="/opt/pagtracker"
BACKUP_DIR="/opt/backups"

# Verificar token
if [ -z "$GITHUB_TOKEN" ] || [ "$GITHUB_TOKEN" = "SEU_TOKEN_AQUI" ]; then
    echo "❌ Configure o GITHUB_TOKEN no script!"
    exit 1
fi

echo "📋 Configurações:"
echo "   Repositório: $REPO_URL"
echo "   Branch: $BRANCH"
echo ""

# Backup atual
echo "💾 Backup da versão atual..."
BACKUP_NAME="backup_$(date +%Y%m%d_%H%M%S)"
mkdir -p $BACKUP_DIR
tar -czf $BACKUP_DIR/${BACKUP_NAME}.tar.gz -C $VPS_DIR .
cp .env $BACKUP_DIR/${BACKUP_NAME}_env.txt
echo "✅ Backup criado"

# Parar containers
echo "🛑 Parando containers..."
docker-compose down

# Limpar e clonar
echo "📥 Clonando nova versão..."
find . -mindepth 1 -not -name '.env' -not -name 'backups' -not -path './backups/*' -delete
git clone --branch $BRANCH https://${GITHUB_TOKEN}@github.com/Horsetech80/pagtracker.git temp_pagtracker
cp -r temp_pagtracker/* .
cp -r temp_pagtracker/.* . 2>/dev/null || true
rm -rf temp_pagtracker

# Restaurar .env
cp $BACKUP_DIR/${BACKUP_NAME}_env.txt .env

# Configurar permissões
chmod +x scripts/*.sh
chmod +x *.sh

# Rebuild e deploy
echo "🔨 Rebuild e deploy..."
docker-compose build --no-cache pagtracker-app
docker-compose up -d pagtracker-app redis nginx

# Aguardar e testar
sleep 15
echo "📊 Status:"
docker-compose ps
echo "🌐 Testes:"
curl -s http://localhost:3000/api/health
curl -I http://localhost:3000/login 2>/dev/null | head -1

echo "✅ Deploy concluído!"
echo "🌍 URLs:"
echo "   - http://pagtracker.com"
echo "   - http://pagtracker.com/login"
EOF

# 3. Dar permissão
chmod +x deploy-github.sh
```

### Passo 2: Configurar Token

Edite o script e configure seu token:

```bash
# Editar o script
nano deploy-github.sh

# Substituir "SEU_TOKEN_AQUI" pelo seu token real
# Exemplo: GITHUB_TOKEN="ghp_[SEU_TOKEN_AQUI]"
```

### Passo 3: Executar Deploy

```bash
# Executar deploy
./deploy-github.sh
```

## 🔍 Verificação do Deploy

### 1. Status dos Containers
```bash
docker-compose ps
```

### 2. Testes de Conectividade
```bash
# Health check
curl http://192.241.150.238:3000/api/health

# Página principal
curl -I http://192.241.150.238

# Página de login
curl -I http://192.241.150.238/login
```

### 3. Logs
```bash
# Logs da aplicação
docker-compose logs pagtracker-app --tail=20

# Logs do nginx
docker-compose logs nginx --tail=10
```

## 🌐 URLs Finais

Após o deploy bem-sucedido:

- ✅ **http://pagtracker.com** (página principal)
- ✅ **http://pagtracker.com/login** (página de login)
- ✅ **http://192.241.150.238** (IP direto)
- ✅ **http://192.241.150.238:3000/api/health** (health check)

## 🔧 Troubleshooting

### Erro: Token inválido
```bash
# Verificar token
echo $GITHUB_TOKEN

# Testar clone manual
git clone https://SEU_TOKEN@github.com/Horsetech80/pagtracker.git test
```

### Erro: Build falhou
```bash
# Verificar logs
docker-compose logs pagtracker-app

# Rebuild manual
docker-compose build --no-cache pagtracker-app
```

### Erro: Container não inicia
```bash
# Verificar recursos
free -h
df -h

# Reiniciar Docker
systemctl restart docker
```

## 📊 Backup e Restore

### Backup Automático
O script cria backup automático em `/opt/backups/`

### Restore Manual
```bash
# Parar containers
docker-compose down

# Restaurar backup
tar -xzf /opt/backups/backup_YYYYMMDD_HHMMSS.tar.gz

# Restaurar .env
cp /opt/backups/backup_YYYYMMDD_HHMMSS_env.txt .env

# Reiniciar
docker-compose up -d
```

## 🎯 Resultado Esperado

Após o deploy:

1. **Página principal**: http://pagtracker.com ✅
2. **Página de login**: http://pagtracker.com/login ✅
3. **Health check**: Funcionando ✅
4. **Containers**: Todos ativos ✅
5. **Logs**: Sem erros críticos ✅

## 🚀 Comandos Rápidos

```bash
# Deploy completo
./deploy-github.sh

# Status
docker-compose ps

# Logs
docker-compose logs -f pagtracker-app

# Reiniciar
./restart.sh

# Monitoramento
./monitor.sh
```

---

**🎉 Após configurar o token e executar o script, o PagTracker v4.0 estará atualizado na VPS!**