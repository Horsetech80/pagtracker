# Documentação de Webhooks do PagTracker

Este documento descreve o sistema de webhooks do PagTracker, utilizado para notificar sistemas externos sobre eventos que ocorrem na plataforma.

## Sumário

1. [Introdução aos Webhooks](#introdução-aos-webhooks)
2. [Tipos de Eventos](#tipos-de-eventos)
3. [Formato de Payload](#formato-de-payload)
4. [Recebendo Webhooks](#recebendo-webhooks)
5. [Segurança e Autenticação](#segurança-e-autenticação)
6. [Configuração de Webhooks](#configuração-de-webhooks)
7. [Testando Webhooks](#testando-webhooks)
8. [Solução de Problemas](#solução-de-problemas)
9. [Melhores Práticas](#melhores-práticas)

## Introdução aos Webhooks

Webhooks são notificações HTTP automáticas enviadas pelo PagTracker para um URL configurado sempre que um evento específico ocorre. Isso permite que sua aplicação receba atualizações em tempo real sobre pagamentos, sem precisar fazer consultas periódicas à API.

### Benefícios dos Webhooks

- **Atualizações em tempo real**: Receba notificações imediatas quando um pagamento for confirmado
- **Eficiência**: Elimina a necessidade de consultas periódicas (polling)
- **Automação**: Permite automatizar processos com base em eventos
- **Confiabilidade**: Sistema com retentativas automáticas em caso de falhas

## Tipos de Eventos

O PagTracker suporta os seguintes tipos de eventos:

| Evento | Descrição |
|--------|-----------|
| `payment.created` | Uma nova cobrança PIX foi criada |
| `payment.confirmed` | Um pagamento foi confirmado |
| `payment.expired` | Uma cobrança expirou sem ser paga |
| `payment.canceled` | Uma cobrança foi cancelada manualmente |
| `payment.refunded` | Um pagamento foi reembolsado |
| `split.processed` | Um split de pagamento foi processado |
| `split.failed` | Ocorreu um erro no processamento de split |
| `checkout.completed` | Um checkout foi finalizado com sucesso |
| `checkout.abandoned` | Um checkout foi abandonado pelo cliente |

## Formato de Payload

Todos os webhooks são enviados como requisições HTTP POST com um corpo JSON. Abaixo está um exemplo do formato padrão:

```json
{
  "event": "payment.confirmed",
  "data": {
    "id": "uuid-da-transacao",
    "txid": "txid-da-gerencianet",
    "valor": 100.50,
    "descricao": "Pagamento do Pedido #12345",
    "status": "pago",
    "cliente": {
      "nome": "João Silva",
      "email": "joao@exemplo.com"
    },
    "metadata": {
      "pedido_id": "12345"
    },
    "created_at": "2023-04-01T10:00:00Z",
    "paid_at": "2023-04-01T10:05:30Z"
  },
  "timestamp": "2023-04-01T10:05:32Z",
  "signature": "assinatura-hmac-sha256"
}
```

### Detalhes do Payload por Evento

#### payment.created

```json
{
  "event": "payment.created",
  "data": {
    "id": "uuid-da-transacao",
    "txid": "txid-da-gerencianet",
    "valor": 100.50,
    "descricao": "Pagamento do Pedido #12345",
    "status": "pendente",
    "qr_code": "00020126360014BR.GOV.BCB.PIX...",
    "link_pagamento": "https://pix.pagtracker.com.br/abcde",
    "created_at": "2023-04-01T10:00:00Z",
    "expires_at": "2023-04-01T11:00:00Z"
  },
  "timestamp": "2023-04-01T10:00:02Z",
  "signature": "assinatura-hmac-sha256"
}
```

#### payment.confirmed

```json
{
  "event": "payment.confirmed",
  "data": {
    "id": "uuid-da-transacao",
    "txid": "txid-da-gerencianet",
    "valor": 100.50,
    "descricao": "Pagamento do Pedido #12345",
    "status": "pago",
    "created_at": "2023-04-01T10:00:00Z",
    "paid_at": "2023-04-01T10:05:30Z"
  },
  "timestamp": "2023-04-01T10:05:32Z",
  "signature": "assinatura-hmac-sha256"
}
```

#### split.processed

```json
{
  "event": "split.processed",
  "data": {
    "payment_id": "uuid-da-transacao",
    "split_id": "uuid-do-split",
    "valor_total": 100.50,
    "destinatarios": [
      {
        "id": "uuid-dest-1",
        "nome": "Destinatário 1",
        "valor": 80.40,
        "status": "processado",
        "txid": "txid-da-transferencia-1"
      },
      {
        "id": "uuid-dest-2",
        "nome": "Destinatário 2",
        "valor": 20.10,
        "status": "processado",
        "txid": "txid-da-transferencia-2"
      }
    ],
    "processed_at": "2023-04-01T10:06:00Z"
  },
  "timestamp": "2023-04-01T10:06:02Z",
  "signature": "assinatura-hmac-sha256"
}
```

## Recebendo Webhooks

Para receber webhooks do PagTracker, você precisa:

1. Implementar um endpoint HTTP em sua aplicação
2. Configurar este endpoint no painel do PagTracker
3. Processar as notificações recebidas

### Exemplos de Implementação

#### Node.js (Express)

```javascript
const express = require('express');
const crypto = require('crypto');
const app = express();

app.use(express.json());

app.post('/webhook', (req, res) => {
  // Verificar assinatura (detalhado na seção de segurança)
  const payload = req.body;
  const signature = req.headers['x-pagtracker-signature'];
  const webhookSecret = 'seu_segredo_webhook';
  
  const calculatedSignature = crypto
    .createHmac('sha256', webhookSecret)
    .update(JSON.stringify(req.body))
    .digest('hex');
  
  if (calculatedSignature !== signature) {
    return res.status(401).send('Assinatura inválida');
  }
  
  // Processar o evento baseado no tipo
  const eventType = payload.event;
  
  switch (eventType) {
    case 'payment.confirmed':
      // Atualizar status do pedido no seu sistema
      console.log(`Pagamento confirmado: ${payload.data.id}`);
      break;
    case 'payment.expired':
      // Notificar cliente ou atualizar status
      console.log(`Pagamento expirado: ${payload.data.id}`);
      break;
    // Outros casos
  }
  
  // Sempre retornar 200 para confirmar recebimento
  return res.status(200).send('OK');
});

app.listen(3000, () => {
  console.log('Servidor rodando na porta 3000');
});
```

#### PHP

```php
<?php
// Receber o payload
$payload = file_get_contents('php://input');
$event = json_decode($payload, true);
$signature = $_SERVER['HTTP_X_PAGTRACKER_SIGNATURE'] ?? '';
$webhookSecret = 'seu_segredo_webhook';

// Verificar assinatura
$calculatedSignature = hash_hmac('sha256', $payload, $webhookSecret);
if ($calculatedSignature !== $signature) {
  http_response_code(401);
  echo 'Assinatura inválida';
  exit;
}

// Processar o evento
$eventType = $event['event'];

switch ($eventType) {
  case 'payment.confirmed':
    // Atualizar status do pedido
    $paymentId = $event['data']['id'];
    $orderId = $event['data']['metadata']['pedido_id'] ?? null;
    
    // Lógica para atualizar o pedido no seu sistema
    break;
  
  case 'payment.expired':
    // Lógica para lidar com pagamentos expirados
    break;
  
  // Outros casos
}

// Responder com 200 para confirmar recebimento
http_response_code(200);
echo 'OK';
```

## Segurança e Autenticação

### Verificação de Assinatura

Cada webhook inclui um cabeçalho `X-PagTracker-Signature` que contém uma assinatura HMAC-SHA256 do corpo da requisição, calculada usando a chave secreta do webhook. Você deve validar esta assinatura para garantir que a notificação realmente veio do PagTracker.

#### Como verificar a assinatura:

1. Obtenha o corpo da requisição como string
2. Obtenha o valor do cabeçalho `X-PagTracker-Signature`
3. Calcule o HMAC-SHA256 do corpo usando seu segredo de webhook
4. Compare o resultado com o valor do cabeçalho

### Práticas de Segurança Recomendadas

- Use HTTPS para receber webhooks
- Mantenha seu segredo de webhook em um lugar seguro (variáveis de ambiente, cofre de senhas)
- Não compartilhe seu segredo de webhook em repositórios públicos
- Valide sempre a assinatura antes de processar o webhook
- Implemente limites de taxa e proteção contra ataques DoS
- Registre todas as notificações recebidas para auditoria

## Configuração de Webhooks

### No Painel do PagTracker

1. Acesse o painel do PagTracker
2. Navegue até "Configurações" > "Webhooks"
3. Clique em "Adicionar Webhook"
4. Preencha:
   - URL do endpoint (ex: https://seusistema.com/webhooks/pagtracker)
   - Selecione os eventos que deseja receber
   - Defina um segredo para assinatura (recomendado: pelo menos 32 caracteres aleatórios)
   - Descrição (opcional)
5. Clique em "Salvar"

### Via API

Também é possível configurar webhooks programaticamente usando a API:

```
POST /api/webhooks
```

Corpo da requisição:
```json
{
  "url": "https://seusistema.com/webhooks/pagtracker",
  "eventos": ["payment.created", "payment.confirmed", "payment.expired"],
  "segredo": "seu_segredo_webhook_muito_seguro",
  "descricao": "Webhook para sistema de pedidos"
}
```

## Testando Webhooks

### Testador de Webhooks

O PagTracker oferece uma ferramenta de teste de webhooks no painel administrativo, que permite:

1. Enviar eventos de teste para seu endpoint
2. Verificar se seu servidor está processando corretamente
3. Ver o histórico de entrega e respostas

### Ambiente de Desenvolvimento

Para testar webhooks localmente:

1. Use uma ferramenta como [ngrok](https://ngrok.com/) ou [localtunnel](https://github.com/localtunnel/localtunnel) para expor seu servidor local à internet
2. Configure o URL fornecido por essas ferramentas como seu endpoint de webhook
3. Utilize o testador de webhooks para enviar eventos de teste

### Exemplo com ngrok

```bash
# Expor servidor local na porta 3000
ngrok http 3000

# Você receberá um URL como https://a1b2c3d4.ngrok.io
# Configure este URL + rota do webhook no painel do PagTracker
# Por exemplo: https://a1b2c3d4.ngrok.io/webhook
```

## Solução de Problemas

### Problemas Comuns

1. **Webhook não está sendo recebido**
   - Verifique se o URL está correto e acessível publicamente
   - Verifique se há firewalls ou restrições de IP
   - Confirme se o webhook está ativo no painel

2. **Erro de validação de assinatura**
   - Confirme se está usando o segredo correto
   - Verifique se não há modificação do payload antes da verificação
   - Certifique-se de usar o algoritmo correto (HMAC-SHA256)

3. **Tempo limite de resposta excedido**
   - Seu servidor deve responder em até 5 segundos
   - Processe tarefas demoradas de forma assíncrona
   - Responda com 200 imediatamente e faça o processamento depois

### Logs e Monitoramento

O PagTracker mantém um histórico detalhado de tentativas de entrega:

- Horário da tentativa
- Código de status HTTP retornado
- Tempo de resposta
- Corpo da resposta (se houver)
- Detalhes de erro (se houver)

Você pode ver este histórico no painel administrativo.

## Melhores Práticas

### Processamento de Webhooks

1. **Responda rapidamente**: Retorne um código 200 o mais rápido possível (menos de 5 segundos)
2. **Idempotência**: Trate o mesmo evento apenas uma vez, mesmo que receba múltiplas notificações
3. **Processamento assíncrono**: Para tarefas demoradas, use filas ou jobs em background
4. **Verificação de ordem**: Não assuma que os webhooks chegarão em ordem cronológica
5. **Redundância**: Não dependa exclusivamente de webhooks; consulte a API se necessário

### Redundância e Resiliência

O PagTracker implementa um sistema de retentativas com backoff exponencial:

- 1ª retentativa: 5 minutos após falha
- 2ª retentativa: 15 minutos após falha
- 3ª retentativa: 30 minutos após falha
- 4ª retentativa: 1 hora após falha
- 5ª retentativa: 3 horas após falha
- 6ª retentativa: 6 horas após falha

Após 6 tentativas sem sucesso, o webhook é marcado como falho e não será mais reenviado automaticamente.

---

## Histórico de Atualizações da Documentação

- **1.0.0** (01/04/2023) - Lançamento inicial da documentação
- **1.1.0** (15/05/2023) - Adicionados novos eventos (split.processed, split.failed)
- **1.2.0** (01/06/2023) - Melhorias na documentação de segurança 