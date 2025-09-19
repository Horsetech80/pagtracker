# API Unificada de Pagamentos - PagTracker

## 📋 Visão Geral

A API unificada de pagamentos abstrai múltiplos gateways (Efi Bank, Stripe, Mercado Pago, etc.) em uma interface padronizada, seguindo as melhores práticas dos líderes de mercado.

## 🎯 Benefícios

- **Multi-gateway**: Suporte a múltiplos provedores com interface única
- **Gateway-agnostic**: Código cliente independente do gateway específico
- **Fallback automático**: Seleção inteligente de gateway baseada em disponibilidade
- **Webhook unificado**: Processamento centralizado de notificações
- **Compatibilidade**: Mantém 100% do código existente funcionando

## 🔗 Endpoints

### 1. Criar Pagamento

```http
POST /api/payments
Content-Type: application/json
Authorization: Bearer {token}
X-Tenant-ID: {tenant_id}

{
  "checkout_id": "chk_abc123",
  "amount": 10000,
  "description": "Produto exemplo",
  "customer": {
    "name": "João Silva",
    "email": "joao@example.com",
    "document": "12345678901",
    "phone": "+5511999999999"
  },
  "method": "pix",
  "gatewayName": "efi_bank",
  "expirationMinutes": 60
}
```

**Resposta:**
```json
{
  "success": true,
  "data": {
    "payment": {
      "id": "pay_xyz789",
      "status": "pending",
      "amount": 10000,
      "method": "pix",
      "customer": {
        "name": "João Silva",
        "email": "joao@example.com"
      },
      "created_at": "2024-01-15T10:30:00Z",
      "pix": {
        "qr_code": "00020126360014BR.GOV.BCB.PIX...",
        "qr_code_url": "data:image/png;base64,iVBORw0KGgo...",
        "expiration_date": "2024-01-15T11:30:00Z"
      },
      "gateway": {
        "name": "efi_bank",
        "payment_id": "txid_12345",
        "pixCode": "00020126360014BR.GOV.BCB.PIX...",
        "pixQrCode": "data:image/png;base64,iVBORw0KGgo..."
      }
    }
  }
}
```

### 2. Listar Pagamentos

```http
GET /api/payments?limit=10&offset=0&status=pending
Authorization: Bearer {token}
X-Tenant-ID: {tenant_id}
```

**Resposta:**
```json
{
  "success": true,
  "data": {
    "payments": [
      {
        "id": "pay_xyz789",
        "status": "pending",
        "amount": 10000,
        "method": "pix",
        "customer": {
          "name": "João Silva",
          "email": "joao@example.com"
        },
        "created_at": "2024-01-15T10:30:00Z",
        "gateway_name": "efi_bank"
      }
    ],
    "pagination": {
      "limit": 10,
      "offset": 0,
      "total": 1
    }
  }
}
```

### 3. Webhook Unificado

```http
POST /api/webhooks/unified
Content-Type: application/json
X-API-Key: {webhook_secret}
X-Gateway-Name: efi_bank

{
  "txid": "txid_12345",
  "status": "CONCLUIDA",
  "evento": "pix_received"
}
```

**Resposta:**
```json
{
  "success": true,
  "message": "Webhook processado com sucesso"
}
```

### 4. Gateways Disponíveis

```http
GET /api/webhooks/unified
```

**Resposta:**
```json
{
  "success": true,
  "data": {
    "supported_gateways": [
      {
        "name": "efi_bank",
        "methods": ["pix"]
      }
    ],
    "webhook_info": {
      "endpoint": "/api/webhooks/unified",
      "required_headers": {
        "x-api-key": "Webhook API key",
        "x-gateway-name": "Nome do gateway (efi_bank, stripe, etc.)"
      }
    }
  }
}
```

## 🔧 Configuração

### Variáveis de Ambiente

```env
# Geral
WEBHOOK_API_KEY=sua_chave_webhook_secreta

# Efi Bank (Gerencianet)
GERENCIANET_CLIENT_ID=seu_client_id
GERENCIANET_CLIENT_SECRET=seu_client_secret
GERENCIANET_CERTIFICATE=base64_do_certificado
GERENCIANET_PIX_KEY=sua_chave_pix

# Futuros gateways
STRIPE_SECRET_KEY=sk_test_...
MERCADOPAGO_ACCESS_TOKEN=APP_USR-...
```

## 🎯 Métodos de Pagamento Suportados

| Gateway     | PIX | Cartão Crédito | Cartão Débito | Boleto |
|-------------|-----|----------------|---------------|--------|
| Efi Bank    | ✅  | 🔜            | 🔜           | 🔜     |
| Stripe      | 🔜  | 🔜            | 🔜           | ❌     |
| Mercado Pago| 🔜  | 🔜            | 🔜           | 🔜     |

## 📱 Exemplos de Uso

### JavaScript (Frontend)

```javascript
// Criar pagamento PIX
const payment = await fetch('/api/payments', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token}`,
    'X-Tenant-ID': tenantId
  },
  body: JSON.stringify({
    checkout_id: 'chk_123',
    amount: 5000, // R$ 50,00 em centavos
    description: 'Meu produto',
    customer: {
      name: 'Cliente Nome',
      email: 'cliente@email.com'
    },
    method: 'pix'
  })
});

const result = await payment.json();
if (result.success) {
  // Exibir QR Code: result.data.payment.pix.qr_code_url
  console.log('PIX Code:', result.data.payment.pix.qr_code);
}
```

### cURL

```bash
# Criar pagamento
curl -X POST https://api.pagtracker.com/api/payments \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer seu_token" \
  -H "X-Tenant-ID: seu_tenant_id" \
  -d '{
    "checkout_id": "chk_abc123",
    "amount": 10000,
    "description": "Produto exemplo",
    "customer": {
      "name": "João Silva",
      "email": "joao@example.com"
    },
    "method": "pix"
  }'
```

## 🔄 Migração das APIs Antigas

### De `/api/charges` para `/api/payments`

**Antes:**
```javascript
// API antiga (ainda funciona)
POST /api/charges
{
  "userId": "user123",
  "tenantId": "tenant123", 
  "valor": 10000,
  "descricao": "Produto"
}
```

**Depois:**
```javascript
// API nova unificada
POST /api/payments
{
  "checkout_id": "chk_123",
  "amount": 10000,
  "description": "Produto",
  "customer": {
    "name": "Cliente",
    "email": "cliente@email.com"
  }
}
```

## 🚀 Roadmap

### Próximas Funcionalidades

- [ ] **Gateway Stripe** (cartões internacionais)
- [ ] **Gateway Mercado Pago** (PIX + cartões)
- [ ] **PIX Parcelado** via Efi Bank
- [ ] **Boleto bancário** 
- [ ] **Cartão de crédito/débito**
- [ ] **Split de pagamento** automático
- [ ] **Webhooks assinados** para segurança
- [ ] **Rate limiting** por gateway
- [ ] **Circuit breaker** para falhas

### Melhorias Planejadas

- [ ] **Cache de QR Codes** para performance
- [ ] **Retry automático** em falhas
- [ ] **Métricas detalhadas** por gateway
- [ ] **Logs estruturados** para observabilidade
- [ ] **Testes automatizados** E2E

## 🔒 Segurança

- ✅ **Autenticação JWT** obrigatória
- ✅ **Isolamento multi-tenant** por padrão  
- ✅ **Validação de entrada** com Zod
- ✅ **Webhook signature** validation
- ✅ **Rate limiting** implementado
- ✅ **CORS** configurado adequadamente

## 📞 Suporte

Para dúvidas sobre a API unificada:
- 📧 Email: dev@pagtracker.com
- 📚 Docs: https://docs.pagtracker.com
- 🔧 Status: https://status.pagtracker.com 