# API Reference PagTracker

Este documento descreve a API REST do PagTracker, detalhando todos os endpoints disponíveis, parâmetros aceitos, formatos de resposta e exemplos de uso.

## Sumário

1. [Introdução](#introdução)
2. [Autenticação](#autenticação)
3. [Formato de Requisições e Respostas](#formato-de-requisições-e-respostas)
4. [Endpoints de Split](#endpoints-de-split)
5. [Endpoints de Webhook](#endpoints-de-webhook)
6. [Endpoints de Usuário](#endpoints-de-usuário)
7. [Códigos de Erro](#códigos-de-erro)
8. [Limites de Requisição](#limites-de-requisição)
9. [Versões da API](#versões-da-api)

## Introdução

A API PagTracker permite integrar o gateway de pagamento PIX em aplicações externas. Ela segue princípios RESTful e utiliza JSON para formato de dados.

### URL Base

- **Ambiente de Produção**: `https://api.pagtracker.com.br`
- **Ambiente de Sandbox**: `https://sandbox.api.pagtracker.com.br`

### Cabeçalhos Comuns

| Cabeçalho | Descrição |
|-----------|-----------|
| `Content-Type` | Sempre `application/json` |
| `Authorization` | Bearer token para autenticação |
| `X-API-Version` | Versão da API (opcional, padrão é a mais recente) |

## Autenticação

A API utiliza autenticação baseada em tokens JWT. Existem duas formas de obter um token:

### 1. Login por Email/Senha

**Endpoint**: `POST /api/auth/token`

**Corpo da Requisição**:
```json
{
  "email": "usuario@exemplo.com",
  "password": "senha123"
}
```

**Resposta**:
```json
{
  "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "expires_in": 3600,
  "token_type": "bearer"
}
```

### 2. Utilização de API Key

**Endpoint**: `POST /api/auth/token/api-key`

**Corpo da Requisição**:
```json
{
  "api_key": "sua_api_key_secreta"
}
```

**Resposta**: Similar à autenticação por email.

### Incluindo o Token nas Requisições

Após obter o token, inclua-o no cabeçalho `Authorization` de todas as requisições:

```
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

### Renovação de Token

**Endpoint**: `POST /api/auth/token/refresh`

**Corpo da Requisição**:
```json
{
  "refresh_token": "seu_refresh_token"
}
```

## Formato de Requisições e Respostas

Todas as requisições e respostas utilizam o formato JSON.

### Formato de Resposta Padrão

```json
{
  "data": {},  // Dados da resposta, varia conforme o endpoint
  "meta": {    // Metadados da resposta (opcional)
    "page": 1,
    "per_page": 20,
    "total": 50
  }
}
```

### Resposta de Erro

```json
{
  "error": {
    "code": "invalid_input",
    "message": "Descrição do erro",
    "details": {}  // Detalhes adicionais (opcional)
  }
}
```


    "per_page": 20,
    "total": 50
  }
}
```

### Obter Detalhes da Cobrança

**Endpoint**: `GET /api/charges/{id}`

**Resposta**:
```json
{
  "data": {
    "id": "uuid-da-transacao",
    "txid": "txid-da-gerencianet",
    "qr_code": "00020126360014BR.GOV.BCB.PIX...",
    "qr_code_image": "data:image/png;base64,...",
    "link_pagamento": "https://pix.pagtracker.com.br/abcde",
    "valor": 100.50,
    "descricao": "Pagamento do Pedido #12345",
    "status": "pago",
    "cliente": {
      "nome": "João Silva",
      "email": "joao@exemplo.com",
      "documento": "123.456.789-00",
      "telefone": "+5511987654321"
    },
    "metadata": {
      "pedido_id": "12345",
      "produto": "Assinatura Premium"
    },
    "created_at": "2023-04-01T10:00:00Z",
    "paid_at": "2023-04-01T10:05:30Z",
    "expires_at": "2023-04-01T11:00:00Z"
  }
}
```

### Cancelar Cobrança

**Endpoint**: `DELETE /api/charges/{id}`

**Resposta**:
```json
{
  "data": {
    "id": "uuid-da-transacao",
    "status": "cancelado",
    "cancelled_at": "2023-04-01T10:15:00Z"
  }
}
```

### Reembolsar Pagamento

**Endpoint**: `POST /api/charges/{id}/refund`

**Corpo da Requisição**:
```json
{
  "valor": 50.25,              // Valor a reembolsar (opcional, se não informado, reembolsa o valor total)
  "motivo": "Produto com defeito"  // Motivo do reembolso (opcional)
}
```

**Resposta**:
```json
{
  "data": {
    "id": "uuid-do-reembolso",
    "status": "DEVOLVIDO",      // Status retornado pela Gerencianet
    "valor": 50.25,             // Valor reembolsado
    "message": "Reembolso processado com sucesso"
  }
}
```



**Resposta**:
```json
{
  "data": {
    "id": "uuid-do-checkout",
    "deleted": true
  }
}
```

## Endpoints de Split

### Criar Regra de Split

**Endpoint**: `POST /api/splits`

**Corpo da Requisição**:
```json
{
  "nome": "Split Padrão",
  "descricao": "Regra de split para parceiros",
  "destinatarios": [
    {
      "nome": "Destinatário 1",
      "chave_pix": "email@exemplo.com",
      "tipo": "percentual",
      "valor": 80
    },
    {
      "nome": "Destinatário 2",
      "chave_pix": "00000000000",
      "tipo": "percentual",
      "valor": 20
    }
  ]
}
```

**Resposta**:
```json
{
  "data": {
    "id": "uuid-do-split",
    "nome": "Split Padrão",
    "descricao": "Regra de split para parceiros",
    "destinatarios": [
      {
        "id": "uuid-dest-1",
        "nome": "Destinatário 1",
        "chave_pix": "email@exemplo.com",
        "tipo": "percentual",
        "valor": 80
      },
      {
        "id": "uuid-dest-2",
        "nome": "Destinatário 2",
        "chave_pix": "00000000000",
        "tipo": "percentual",
        "valor": 20
      }
    ],
    "created_at": "2023-04-01T10:00:00Z"
  }
}
```

### Listar Regras de Split

**Endpoint**: `GET /api/splits`

**Parâmetros Query**:
- `page` (opcional): Número da página
- `per_page` (opcional): Itens por página (máx: 100)

**Resposta**:
```json
{
  "data": [
    {
      "id": "uuid-do-split-1",
      "nome": "Split Padrão",
      "descricao": "Regra de split para parceiros",
      "created_at": "2023-04-01T10:00:00Z"
    },
    {
      "id": "uuid-do-split-2",
      "nome": "Split Alternativo",
      "descricao": "Regra de split alternativa",
      "created_at": "2023-04-02T10:00:00Z"
    }
  ],
  "meta": {
    "page": 1,
    "per_page": 20,
    "total": 2
  }
}
```

### Obter Detalhes do Split

**Endpoint**: `GET /api/splits/{id}`

**Resposta**: Similar à resposta da criação.

### Atualizar Split

**Endpoint**: `PUT /api/splits/{id}`

**Corpo da Requisição**: Similar ao da criação.

**Resposta**: Similar à resposta da criação.

### Excluir Split

**Endpoint**: `DELETE /api/splits/{id}`

**Resposta**:
```json
{
  "data": {
    "id": "uuid-do-split",
    "deleted": true
  }
}
```

## Endpoints de Webhook

### Criar Configuração de Webhook

**Endpoint**: `POST /api/webhooks`

**Corpo da Requisição**:
```json
{
  "url": "https://seusite.com/webhook",
  "eventos": ["payment.created", "payment.confirmed", "payment.expired"],
  "segredo": "chave_secreta_para_assinatura",
  "ativo": true,
  "descricao": "Webhook para sistema de pedidos"
}
```

**Resposta**:
```json
{
  "data": {
    "id": "uuid-do-webhook",
    "url": "https://seusite.com/webhook",
    "eventos": ["payment.created", "payment.confirmed", "payment.expired"],
    "segredo": "chave_secreta_para_assinatura",
    "ativo": true,
    "descricao": "Webhook para sistema de pedidos",
    "created_at": "2023-04-01T10:00:00Z"
  }
}
```

### Listar Webhooks

**Endpoint**: `GET /api/webhooks`

**Parâmetros Query**:
- `page` (opcional): Número da página
- `per_page` (opcional): Itens por página (máx: 100)

**Resposta**:
```json
{
  "data": [
    {
      "id": "uuid-do-webhook-1",
      "url": "https://seusite.com/webhook",
      "eventos": ["payment.created", "payment.confirmed", "payment.expired"],
      "ativo": true,
      "descricao": "Webhook para sistema de pedidos",
      "created_at": "2023-04-01T10:00:00Z"
    },
    {
      "id": "uuid-do-webhook-2",
      "url": "https://outrosite.com/webhook",
      "eventos": ["payment.confirmed"],
      "ativo": true,
      "descricao": "Webhook para sistema de contabilidade",
      "created_at": "2023-04-02T10:00:00Z"
    }
  ],
  "meta": {
    "page": 1,
    "per_page": 20,
    "total": 2
  }
}
```

### Obter Detalhes do Webhook

**Endpoint**: `GET /api/webhooks/{id}`

**Resposta**: Similar à resposta da criação.

### Atualizar Webhook

**Endpoint**: `PUT /api/webhooks/{id}`

**Corpo da Requisição**: Similar ao da criação.

**Resposta**: Similar à resposta da criação.

### Excluir Webhook

**Endpoint**: `DELETE /api/webhooks/{id}`

**Resposta**:
```json
{
  "data": {
    "id": "uuid-do-webhook",
    "deleted": true
  }
}
```

### Testar Webhook

**Endpoint**: `POST /api/webhooks/{id}/test`

**Corpo da Requisição**:
```json
{
  "evento": "payment.confirmed"  // Evento a ser simulado
}
```

**Resposta**:
```json
{
  "data": {
    "id": "uuid-do-teste",
    "webhook_id": "uuid-do-webhook",
    "evento": "payment.confirmed",
    "resultado": "success",
    "codigo_http": 200,
    "tempo_resposta": 230,  // milissegundos
    "created_at": "2023-04-01T10:00:00Z"
  }
}
```

## Endpoints de Usuário

### Obter Dados do Usuário

**Endpoint**: `GET /api/users/me`

**Resposta**:
```json
{
  "data": {
    "id": "uuid-do-usuario",
    "email": "usuario@exemplo.com",
    "nome": "Nome do Usuário",
    "empresa": "Nome da Empresa",
    "created_at": "2023-03-01T10:00:00Z"
  }
}
```

### Atualizar Dados do Usuário

**Endpoint**: `PUT /api/users/me`

**Corpo da Requisição**:
```json
{
  "nome": "Novo Nome",
  "empresa": "Nova Empresa"
}
```

**Resposta**:
```json
{
  "data": {
    "id": "uuid-do-usuario",
    "email": "usuario@exemplo.com",
    "nome": "Novo Nome",
    "empresa": "Nova Empresa",
    "created_at": "2023-03-01T10:00:00Z",
    "updated_at": "2023-04-01T10:00:00Z"
  }
}
```

### Configurar Credenciais Gerencianet

**Endpoint**: `PUT /api/users/me/credentials/gerencianet`

**Corpo da Requisição**:
```json
{
  "client_id": "seu_client_id",
  "client_secret": "seu_client_secret",
  "pix_key": "sua_chave_pix",
  "certificate": "seu_certificado_base64",  // opcional, para produção
  "sandbox": false  // true para ambiente de testes
}
```

**Resposta**:
```json
{
  "data": {
    "success": true,
    "message": "Credenciais configuradas com sucesso"
  }
}
```

### Gerar Nova API Key

**Endpoint**: `POST /api/users/me/api-keys`

**Corpo da Requisição**:
```json
{
  "descricao": "API Key para integração com sistema X",
  "expiracao": 365  // dias, opcional
}
```

**Resposta**:
```json
{
  "data": {
    "id": "uuid-da-api-key",
    "api_key": "pt_live_abcdefghijklmnopqrstuvwxyz",  // exibida apenas uma vez
    "descricao": "API Key para integração com sistema X",
    "created_at": "2023-04-01T10:00:00Z",
    "expires_at": "2024-04-01T10:00:00Z"
  }
}
```

## Códigos de Erro

A API utiliza códigos HTTP padrão e códigos de erro específicos para indicar problemas.

### Códigos HTTP

- `200 OK`: Requisição bem-sucedida
- `201 Created`: Recurso criado com sucesso
- `400 Bad Request`: Requisição inválida
- `401 Unauthorized`: Autenticação necessária
- `403 Forbidden`: Não tem permissão para acessar
- `404 Not Found`: Recurso não encontrado
- `422 Unprocessable Entity`: Erros de validação
- `429 Too Many Requests`: Limite de requisições excedido
- `500 Internal Server Error`: Erro interno no servidor

### Códigos de Erro Específicos

| Código | Descrição |
|--------|-----------|
| `authentication_required` | Autenticação necessária |
| `invalid_credentials` | Credenciais inválidas |
| `invalid_input` | Dados de entrada inválidos |
| `resource_not_found` | Recurso não encontrado |
| `resource_already_exists` | Recurso já existe |
| `insufficient_funds` | Saldo insuficiente |
| `provider_error` | Erro no provedor de pagamento |
| `webhook_delivery_failed` | Falha na entrega do webhook |
| `rate_limit_exceeded` | Limite de requisições excedido |

## Limites de Requisição

Para garantir a disponibilidade do serviço, existem limites para o número de requisições:

- Plano Básico: 60 requisições por minuto
- Plano Profissional: 300 requisições por minuto
- Plano Empresarial: 1000 requisições por minuto

O cabeçalho de resposta `X-RateLimit-Remaining` indica o número de requisições restantes no período atual.

## Versões da API

A API do PagTracker utiliza versionamento semântico. A versão atual é especificada pelo cabeçalho `X-API-Version`.

- Versão padrão (mais recente): `v1`
- Versões suportadas: `v1`

Para garantir a compatibilidade, recomendamos especificar a versão da API em todas as requisições.

### Controle de Versão

- Mudanças nos parâmetros opcionais: Não incrementam versão
- Adição de novos endpoints: Não incrementam versão
- Mudanças nos parâmetros obrigatórios: Incrementam versão
- Alteração no formato de resposta: Incrementam versão