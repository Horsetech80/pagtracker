# Deploy PagTracker no Vercel - Homologação

## 📋 Pré-requisitos

1. Conta no Vercel configurada
2. Repositório GitHub com o código
3. Variáveis de ambiente configuradas

## 🔧 Configuração das Variáveis de Ambiente no Vercel

### 1. Acesse o painel do Vercel
- Vá para https://vercel.com/dashboard
- Selecione seu projeto ou crie um novo

### 2. Configure as seguintes variáveis de ambiente:

#### **Ambiente e Configuração Geral**
```
NODE_ENV=production
NEXT_TELEMETRY_DISABLED=1
VERCEL=1
```

#### **Supabase (Produção)**
```
NEXT_PUBLIC_SUPABASE_URL=https://ixqhqjqjqjqjqjqjqjqj.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
SUPABASE_JWT_SECRET=your-jwt-secret-here
```

#### **EfiPay (Sandbox para Homologação)**
```
EFIPAY_ENVIRONMENT=development
EFIPAY_CLIENT_ID=Client_Id_a1ccb462495bfe3089ebd31bba6e3323e088e54b
EFIPAY_CLIENT_SECRET=Client_Secret_924964e30453e94c33fc14bdff624420f69828c2
EFIPAY_SKIP_MTLS=true
EFIPAY_PIX_KEY=efipay@sejaefi.com.br
EFIPAY_WEBHOOK_SECRET=pagtracker-efipay-webhook-secret-2024
```

#### **Domínios e URLs**
```
NEXT_PUBLIC_APP_URL=https://pagtracker-homolog.vercel.app
NEXT_PUBLIC_API_URL=https://pagtracker-homolog.vercel.app/api
WEBHOOK_BASE_URL=https://pagtracker-homolog.vercel.app
```

#### **Multi-tenancy**
```
MULTI_TENANT_ENABLED=true
DEFAULT_TENANT_ID=pagtracker
TENANT_HEADER_NAME=X-Tenant-ID
```

#### **Webhooks**
```
WEBHOOK_SECRET=pagtracker-webhook-secret-homolog-2024
WEBHOOK_TIMEOUT=30000
WEBHOOK_RETRY_ATTEMPTS=3
```

#### **Segurança**
```
JWT_SECRET=your-super-secret-jwt-key-for-homolog-2024
ENCRYPTION_KEY=your-32-char-encryption-key-here
API_SECRET_KEY=your-api-secret-key-homolog-2024
CORS_ORIGIN=https://pagtracker-homolog.vercel.app
```

#### **Redis (Upstash para Vercel)**
```
REDIS_URL=redis://default:password@redis-url:port
REDIS_TOKEN=your-redis-token
CACHE_TTL=3600
```

#### **Rate Limiting**
```
RATE_LIMIT_ENABLED=true
RATE_LIMIT_MAX_REQUESTS=100
RATE_LIMIT_WINDOW_MS=900000
```

#### **Logs e Monitoramento**
```
LOG_LEVEL=info
ENABLE_REQUEST_LOGGING=true
SENTRY_DSN=your-sentry-dsn-here
```

#### **Configurações Específicas do Vercel**
```
VERCEL_ENV=preview
VERCEL_REGION=gru1
```

## 🚀 Comandos de Deploy

### 1. Deploy via CLI do Vercel
```bash
# Instalar Vercel CLI
npm i -g vercel

# Login no Vercel
vercel login

# Deploy para preview
vercel

# Deploy para produção
vercel --prod
```

### 2. Deploy via GitHub (Recomendado)
1. Conecte seu repositório GitHub ao Vercel
2. Configure as variáveis de ambiente no painel
3. Cada push na branch main fará deploy automático

## 📁 Arquivos de Configuração Criados

- `vercel.json` - Configuração principal do Vercel
- `next.config.vercel.js` - Configuração Next.js otimizada
- `.vercelignore` - Arquivos a serem ignorados no deploy
- `.env.homologacao` - Variáveis de ambiente locais

## 🔍 Verificações Pós-Deploy

### 1. Endpoints para testar:
```
GET https://pagtracker-homolog.vercel.app/health
GET https://pagtracker-homolog.vercel.app/api/health
POST https://pagtracker-homolog.vercel.app/api/webhooks/efipay
```

### 2. Funcionalidades críticas:
- [ ] Login/Autenticação
- [ ] Criação de cobranças PIX
- [ ] Recebimento de webhooks
- [ ] Dashboard principal
- [ ] Multi-tenancy

## 🛠️ Troubleshooting

### Problemas Comuns:

1. **Erro de certificado EfiPay**
   - Verificar se `EFIPAY_SKIP_MTLS=true`
   - Confirmar ambiente `development`

2. **Erro de conexão Supabase**
   - Verificar URLs e chaves
   - Confirmar configurações de CORS

3. **Timeout em funções**
   - Verificar configuração `maxDuration` no vercel.json
   - Otimizar queries do banco

4. **Erro de CORS**
   - Verificar headers no next.config.vercel.js
   - Confirmar `CORS_ORIGIN`

## 📞 Suporte

Em caso de problemas:
1. Verificar logs no painel do Vercel
2. Testar endpoints individualmente
3. Validar variáveis de ambiente
4. Consultar documentação do Vercel

---

**Última atualização:** 2025-01-27
**Ambiente:** Homologação
**Plataforma:** Vercel