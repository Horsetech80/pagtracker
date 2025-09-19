# 🔧 Solução: ERR_CONNECTION_REFUSED - pagtracker.com

## 🚨 Problema Identificado

O erro `ERR_CONNECTION_REFUSED` ao acessar `pagtracker.com` indica que:

1. **O domínio `pagtracker.com` não existe ou não está configurado**
2. **O DNS não está apontando para o IP correto (192.241.150.238)**
3. **O Nginx pode estar com problemas de configuração**

## 🚀 Solução Imediata

### Opção 1: Usar IP Direto (Recomendado)
```
http://192.241.150.238:3000
```

### Opção 2: Usar IP via Nginx
```
http://192.241.150.238
```

## 🔍 Diagnóstico Completo

Execute na VPS:

```bash
# 1. Diagnóstico de domínio
chmod +x scripts/diagnostico-dominio.sh
./scripts/diagnostico-dominio.sh

# 2. Corrigir Nginx
chmod +x scripts/corrigir-nginx.sh
./scripts/corrigir-nginx.sh
```

## 📋 Passos de Correção

### 1. Verificar Status Atual
```bash
# Status dos containers
docker-compose ps

# Logs do Nginx
docker-compose logs nginx --tail=20

# Teste local
curl http://localhost:3000/api/health
```

### 2. Corrigir Nginx (se necessário)
```bash
# Parar Nginx
docker-compose stop nginx

# Verificar configuração
docker exec pagtracker-nginx nginx -t

# Reiniciar
docker-compose up -d nginx
```

### 3. Verificar Firewall
```bash
# Status do firewall
ufw status

# Permitir portas necessárias
ufw allow 80/tcp
ufw allow 443/tcp
ufw allow 3000/tcp
```

### 4. Testar Conectividade
```bash
# Teste local
curl http://localhost:3000/api/health
curl http://localhost:80

# Teste externo (do seu computador)
curl http://192.241.150.238:3000/api/health
curl http://192.241.150.238
```

## 🌐 Configuração de Domínio

### Se você tem o domínio `pagtracker.com`:

1. **Configure o DNS** para apontar para `192.241.150.238`
2. **Aguarde propagação** (pode levar até 24h)
3. **Teste**: `nslookup pagtracker.com`

### Se você NÃO tem o domínio:

**Use apenas o IP**: `http://192.241.150.238:3000`

## 🔧 Configuração Nginx Corrigida

O script `corrigir-nginx.sh` cria uma configuração que:

- ✅ Aceita qualquer domínio/IP
- ✅ Redireciona para a aplicação Next.js
- ✅ Suporta HTTP e HTTPS
- ✅ Configura headers corretos

## 📊 URLs de Teste

### Funcionando (use estas):
- **Aplicação**: http://192.241.150.238:3000
- **Health**: http://192.241.150.238:3000/api/health
- **Via Nginx**: http://192.241.150.238

### Não funcionando (até configurar domínio):
- ❌ http://pagtracker.com
- ❌ https://pagtracker.com

## 🛠️ Comandos de Emergência

```bash
# Reiniciar tudo
docker-compose down
docker-compose up -d pagtracker-app redis nginx

# Ver logs em tempo real
docker-compose logs -f

# Testar aplicação
curl -f http://localhost:3000/api/health

# Verificar portas
netstat -tlnp | grep -E ':(80|443|3000)'
```

## ✅ Checklist de Verificação

- [ ] Aplicação roda em http://192.241.150.238:3000
- [ ] Health check responde
- [ ] Nginx está funcionando
- [ ] Firewall permite portas 80, 443, 3000
- [ ] Containers estão ativos
- [ ] Logs não mostram erros críticos

## 🎯 Resultado Esperado

Após executar os scripts:

1. **Aplicação acessível**: http://192.241.150.238:3000
2. **Nginx funcionando**: http://192.241.150.238
3. **Health check OK**: http://192.241.150.238:3000/api/health
4. **Logs limpos**: Sem erros de conexão

## 📞 Próximos Passos

1. **Teste o IP direto** primeiro
2. **Execute os scripts** de diagnóstico
3. **Configure o domínio** se necessário
4. **Configure SSL** para HTTPS

---

**💡 Dica**: Use sempre o IP `192.241.150.238` até configurar corretamente o domínio `pagtracker.com`. 