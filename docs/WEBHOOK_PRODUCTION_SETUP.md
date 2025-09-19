# Configuração de Webhook EfiPay para Produção

Este documento descreve como configurar o webhook oficial da EfiPay para ambiente de produção, removendo workarounds temporários e implementando uma solução robusta e segura.

## 📋 Visão Geral

O webhook da EfiPay é o mecanismo oficial para receber notificações em tempo real sobre transações PIX. Em produção, é essencial configurar:

- ✅ URL HTTPS com certificado SSL válido
- ✅ Validação de assinatura HMAC
- ✅ Certificados mTLS para autenticação
- ✅ Logs estruturados e monitoramento
- ✅ Tratamento de erros robusto

## 🔧 Pré-requisitos

### 1. Certificados EfiPay
- Certificado de produção (`.pem`) baixado do painel EfiPay
- Certificado SSL do domínio para HTTPS
- Configuração mTLS (mutual TLS) se necessário

### 2. Domínio e DNS
- Domínio configurado (ex: `webhook.pagtracker.com`)
- Certificado SSL válido (Let's Encrypt, Cloudflare, etc.)
- DNS apontando para o servidor

### 3. Credenciais de Produção
- Client ID de produção
- Client Secret de produção
- Chave PIX de produção
- Secret do webhook (gerado pelo sistema)

## 🚀 Configuração Passo a Passo

### 1. Configurar Variáveis de Ambiente

Copie o arquivo de exemplo e configure:

```bash
cp .env.production.example .env.production
```

Configure as variáveis obrigatórias:

```env
# Ambiente
NODE_ENV=production
EFIPAY_ENVIRONMENT=production

# Credenciais EfiPay Produção
EFIPAY_PROD_CLIENT_ID=your-production-client-id
EFIPAY_PROD_CLIENT_SECRET=your-production-client-secret
EFIPAY_PROD_PIX_KEY=your-production-pix-key@domain.com

# Webhook Produção
EFIPAY_PROD_WEBHOOK_URL=https://webhook.pagtracker.com/api/webhook
EFIPAY_PROD_WEBHOOK_SECRET=your-secure-webhook-secret-production

# Certificados
EFIPAY_PROD_CERT_PATH=./certificates/producao-745954-Certificado.pem
DOMAIN_CERT_PATH=./certificates/webhook.pagtracker.com.crt
DOMAIN_KEY_PATH=./certificates/webhook.pagtracker.com.key

# Segurança
EFIPAY_REQUIRE_MTLS=true
EFIPAY_VALIDATE_HMAC=true
```

### 2. Configurar Certificados

#### Certificado EfiPay
1. Acesse o painel EfiPay
2. Baixe o certificado de produção
3. Salve em `./certificates/producao-745954-Certificado.pem`

#### Certificado SSL do Domínio
```bash
# Exemplo com Let's Encrypt
certbot certonly --standalone -d webhook.pagtracker.com

# Copiar certificados
cp /etc/letsencrypt/live/webhook.pagtracker.com/fullchain.pem ./certificates/webhook.pagtracker.com.crt
cp /etc/letsencrypt/live/webhook.pagtracker.com/privkey.pem ./certificates/webhook.pagtracker.com.key
```

### 3. Executar Script de Configuração

```bash
# Instalar dependências se necessário
npm install dotenv

# Executar configuração
node scripts/setup-production-webhook.js
```

O script irá:
- ✅ Validar todas as configurações
- ✅ Obter token de acesso da EfiPay
- ✅ Configurar o webhook na EfiPay
- ✅ Verificar se a configuração foi aplicada

### 4. Testar o Webhook

#### Teste Manual
```bash
# Criar uma cobrança PIX de teste
curl -X POST https://app.pagtracker.com/api/charges \\
  -H \"Content-Type: application/json\" \\
  -H \"Authorization: Bearer YOUR_TOKEN\" \\
  -d '{
    \"valor\": 1.00,
    \"descricao\": \"Teste webhook produção\"
  }'

# Pagar a cobrança e verificar se o webhook foi chamado
```

#### Monitorar Logs
```bash
# Logs do webhook
tail -f logs/webhook.log

# Logs da aplicação
docker logs -f pagtracker-app
```

## 🔒 Segurança

### Validação de Assinatura HMAC

O webhook valida automaticamente a assinatura HMAC:

```javascript
// Implementação no endpoint /api/webhook
const signature = request.headers.get('x-efipay-signature');
const isValid = validateWebhookSignature(body, signature, webhookSecret);
```

### Certificados mTLS

Para máxima segurança, configure mTLS:

```env
EFIPAY_REQUIRE_MTLS=true
EFIPAY_REJECT_UNAUTHORIZED=true
```

### Headers de Segurança

O webhook verifica headers obrigatórios:
- `Content-Type: application/json`
- `User-Agent: EfiPay/*`
- `X-EfiPay-Signature: sha256=...`

## 📊 Monitoramento

### Logs Estruturados

Todos os eventos são logados:

```
✅ [WEBHOOK] Assinatura validada com sucesso
📋 [WEBHOOK] Dados recebidos: {"pix": [...]}
🔄 [WEBHOOK] Processando transação: txid-123
✅ [WEBHOOK] Status atualizado: pendente → pago
```

### Métricas Importantes

- Taxa de sucesso do webhook
- Tempo de resposta
- Erros de validação
- Transações processadas

### Alertas

Configure alertas para:
- Falhas de validação de assinatura
- Erros de certificado
- Timeouts de processamento
- Volume anormal de webhooks

## 🚨 Troubleshooting

### Webhook não recebe notificações

1. **Verificar DNS e SSL**
   ```bash
   curl -I https://webhook.pagtracker.com/api/webhook
   # Deve retornar 200 OK
   ```

2. **Verificar configuração na EfiPay**
   ```bash
   node scripts/setup-production-webhook.js
   ```

3. **Verificar logs**
   ```bash
   grep \"WEBHOOK\" logs/app.log | tail -20
   ```

### Erro de assinatura inválida

1. **Verificar secret**
   ```env
   EFIPAY_PROD_WEBHOOK_SECRET=correct-secret-here
   ```

2. **Verificar headers**
   - Header `X-EfiPay-Signature` presente
   - Formato: `sha256=hash`

### Erro de certificado

1. **Verificar arquivo**
   ```bash
   openssl x509 -in ./certificates/producao-745954-Certificado.pem -text -noout
   ```

2. **Verificar permissões**
   ```bash
   chmod 600 ./certificates/*.pem
   ```

## 📈 Performance

### Otimizações

- Cache de configurações
- Pool de conexões HTTPS
- Processamento assíncrono
- Rate limiting

### Limites

- Timeout: 30 segundos
- Payload máximo: 1MB
- Rate limit: 1000 req/min

## 🔄 Migração do Workaround

### Remover Scripts Temporários

```bash
# Remover scripts de teste
rm test-webhook-public.js
rm scripts/test-webhook-*.js

# Limpar configurações temporárias
grep -v \"webhook.site\" .env.local > .env.local.new
mv .env.local.new .env.local
```

### Atualizar Configurações

1. **Remover URLs temporárias**
2. **Configurar URLs de produção**
3. **Ativar validações de segurança**
4. **Testar em homologação primeiro**

## ✅ Checklist de Produção

- [ ] Certificados EfiPay configurados
- [ ] Certificados SSL do domínio válidos
- [ ] Variáveis de ambiente configuradas
- [ ] Webhook configurado na EfiPay
- [ ] Validação HMAC ativa
- [ ] mTLS configurado (se necessário)
- [ ] Logs estruturados funcionando
- [ ] Monitoramento ativo
- [ ] Alertas configurados
- [ ] Testes de integração passando
- [ ] Scripts temporários removidos
- [ ] Documentação atualizada

## 📞 Suporte

### EfiPay
- Documentação: https://dev.efipay.com.br/docs/api-pix/webhooks
- Suporte: suporte@efipay.com.br

### PagTracker
- Logs: `logs/webhook.log`
- Monitoramento: Dashboard interno
- Alertas: Sistema de notificações

---

**⚠️ Importante**: Sempre teste em ambiente de homologação antes de aplicar em produção!