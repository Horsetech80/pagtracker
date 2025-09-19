# 🌐 GUIA DE CONFIGURAÇÃO DNS - PAGTRACKER V4.0

## 📋 STATUS ATUAL DOS DOMÍNIOS

### ✅ Configurados Corretamente:
- `pagtracker.com` - Apontando para VPS (DNS Only)
- `admin-hml.pagtracker.com` - OK
- `api-hml.pagtracker.com` - OK
- `checkout-hml.pagtracker.com` - OK
- `docs-hml.pagtracker.com` - OK
- `hml.pagtracker.com` - OK
- `webhook-hml.pagtracker.com` - OK

### ⚠️ Requer Atenção:
- `www.pagtracker.com` - Cloudflare Proxy ATIVO (correto)
- `homolog.pagtracker.com.br` - DNS não resolve
- `traefik.pagtracker.com.br` - DNS não resolve
- `webhooks.pagtracker.com.br` - DNS não resolve

## 🎯 CONFIGURAÇÃO CLOUDFLARE RECOMENDADA

### 1. Registros DNS Principais:

| Tipo | Nome | Conteúdo | Proxy Status | TTL |
|------|------|----------|--------------|-----|
| A | pagtracker.com | 192.241.150.238 | 🟠 DNS Only | Auto |
| CNAME | www | pagtracker.com | 🟠 Proxied | Auto |
| A | admin-hml | 192.241.150.238 | 🟠 DNS Only | Auto |
| A | api-hml | 192.241.150.238 | 🟠 DNS Only | Auto |
| A | checkout-hml | 192.241.150.238 | 🟠 DNS Only | Auto |
| A | webhook-hml | 192.241.150.238 | 🟠 DNS Only | Auto |

### 2. Proxy Status Explicado:

**🟠 DNS Only (Orange Cloud OFF):**
- Melhor para subdomínios de desenvolvimento
- Exposição direta do IP do servidor
- SSL gerenciado pelo próprio servidor (Let's Encrypt)

**🟠 Proxied (Orange Cloud ON):**
- Recomendado apenas para www.pagtracker.com
- Cloudflare gerencia SSL automaticamente
- Cache e proteção DDoS

## 🚀 PRÓXIMOS PASSOS

### 1. **Deploy da Aplicação no VPS:**
```bash
# Na VPS (192.241.150.238)
git clone https://github.com/seu-repo/pagtracker.git
cd pagtracker
./scripts/deploy-production-full.cmd
```

### 2. **Configurar SSL com Let's Encrypt:**
```bash
# Automaticamente via script
./scripts/setup-ssl.sh --letsencrypt
```

### 3. **Verificar Funcionamento:**
```bash
# Testar localmente
./scripts/verify-dns.ps1
```

## 🛠️ CONFIGURAÇÃO NGINX

### Nginx está configurado para:
- ✅ Multi-domain support
- ✅ SSL termination
- ✅ Cloudflare real IP detection
- ✅ Rate limiting por domínio
- ✅ Cache optimization

### Estrutura de Subdomínios:
- `pagtracker.com` → App principal (porta 3000)
- `admin-hml.pagtracker.com` → Admin panel (porta 3001)
- `api-hml.pagtracker.com` → API endpoints
- `checkout-hml.pagtracker.com` → Checkout pages
- `webhook-hml.pagtracker.com` → Webhook handler

## 🔒 CONFIGURAÇÃO SSL

### Certificados Suportados:
- **Let's Encrypt** (Recomendado para produção)
- **Cloudflare Origin Certificates** (Para proxy mode)
- **Auto-signed** (Apenas desenvolvimento)

### Comando para SSL:
```bash
# Certificados automáticos
./scripts/setup-ssl.sh --letsencrypt

# Renovação automática (cron)
0 12 * * * /path/to/setup-ssl.sh --renew
```

## 📊 MONITORAMENTO

### Health Checks Configurados:
- `GET /health` - Status da aplicação
- `GET /api/health` - Status das APIs
- Redis health check automático

### Logs Centralizados:
- `logs/nginx/` - Nginx access/error logs
- `logs/app/` - Application logs
- `logs/redis/` - Redis logs

## 🌍 DOMÍNIOS .COM.BR

### Status Atual:
Os domínios `.com.br` não estão resolvendo. Isso pode indicar:

1. **Registros não criados no Cloudflare**
2. **Zona DNS separada para .com.br**
3. **Configuração pendente**

### Ação Recomendada:
- Verificar se `pagtracker.com.br` está na mesma zona DNS
- Criar registros A para os subdomínios .com.br
- Ou remover da configuração se não necessários

## 🎯 RESULTADO ESPERADO

Após o deploy completo, todos os domínios devem:
- ✅ Resolver DNS corretamente
- ✅ Responder HTTP/HTTPS
- ✅ Ter certificados SSL válidos
- ✅ Passar pelos health checks
- ✅ Estar protegidos por rate limiting

### URLs Finais:
- https://pagtracker.com - Aplicação principal
- https://www.pagtracker.com - Redirected via Cloudflare
- https://admin-hml.pagtracker.com - Painel administrativo
- https://api-hml.pagtracker.com - API endpoints
- https://checkout-hml.pagtracker.com - Checkout flows
- https://webhook-hml.pagtracker.com - Webhook processing
