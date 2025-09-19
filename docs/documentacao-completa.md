# Documentação Completa do PagTracker

## Sumário

1. [Introdução](#introdução)
2. [Arquitetura do Sistema](#arquitetura-do-sistema)
3. [Banco de Dados](#banco-de-dados)
4. [Integração com Gerencianet](#integração-com-gerencianet)
5. [Fluxo de Pagamento PIX](#fluxo-de-pagamento-pix)
6. [Webhooks](#webhooks)
7. [Split de Pagamentos](#split-de-pagamentos)
8. [Dashboard e Métricas](#dashboard-e-métricas)
9. [API Reference](#api-reference)
10. [Componentes UI](#componentes-ui)
11. [Autenticação e Segurança](#autenticação-e-segurança)
12. [Implantação](#implantação)
13. [FAQ e Troubleshooting](#faq-e-troubleshooting)

## Introdução

O PagTracker é uma plataforma completa de gateway de pagamentos focada exclusivamente em transações PIX. Desenvolvido para oferecer uma solução robusta e fácil de usar, o sistema permite que empresas e indivíduos recebam pagamentos PIX de forma rápida, segura e altamente personalizável.

### Principais Funcionalidades

- Geração de QR Codes PIX estáticos e dinâmicos
- Dashboard completo para visualização de métricas e transações
- Sistema de checkout transparente para integração em sites
- Divisão automática de pagamentos (split)
- Webhooks para notificação em tempo real
- API RESTful para integração com outros sistemas
- Painel administrativo para gerenciamento de cobranças

### Tecnologias Utilizadas

- **Frontend**: Next.js 14 (App Router), React, TailwindCSS, ShadcnUI
- **Backend**: Next.js API Routes, Supabase
- **Banco de Dados**: PostgreSQL (via Supabase)
- **Autenticação**: Supabase Auth
- **Integração PIX**: Gerencianet
- **Cache e Performance**: SQLite (local), Redis (produção)
- **Infraestrutura**: Vercel/AWS

## Arquitetura do Sistema

O PagTracker segue uma arquitetura moderna baseada em microsserviços e API-first, permitindo escalabilidade e flexibilidade.

### Estrutura de Diretórios

```
src/
├── app/                    # Rotas e páginas (Next.js App Router)
│   ├── (auth)/             # Páginas de autenticação
│   ├── (dashboard)/        # Layout e páginas do painel
│   │   ├── dashboard/      # Página principal do dashboard
│   │   ├── vendas/         # Gerenciamento de vendas
│   │   ├── carteira/       # Controle financeiro
│   │   ├── clientes/       # Gestão de clientes
│   │   ├── checkout/       # Configuração de checkouts
│   │   ├── webhooks/       # Configuração de webhooks
│   │   ├── split/          # Configuração de split de pagamentos
│   │   └── perfil/         # Configurações de perfil
│   ├── api/                # Rotas de API
│   │   ├── webhooks/       # Endpoints para webhooks
│   │   │   ├── gerencianet/  # Webhooks da Gerencianet
│   │   │   └── pix/          # Webhooks PIX genéricos
│   │   ├── transactions/   # API de transações
│   │   └── checkout/       # API de checkout
│   ├── checkout/           # Páginas públicas de checkout
│   └── docs/               # Documentação do sistema
├── components/             # Componentes reutilizáveis
│   ├── ui/                 # Componentes de UI genéricos
│   ├── checkout/           # Componentes específicos de checkout
│   └── checkout-config/    # Componentes de configuração de checkout
├── lib/                    # Biblioteca de utilitários
│   ├── api/                # Funções de API
│   ├── db/                 # Funções de banco de dados
│   ├── gerencianet/        # Integração com Gerencianet
│   ├── hooks/              # React hooks customizados
│   ├── queue/              # Sistema de fila para processamento assíncrono
│   ├── supabase/           # Cliente e utilitários do Supabase
│   └── utils/              # Funções utilitárias diversas
├── types/                  # Definições de tipos TypeScript
└── workers/                # Workers para processamento em background
```

### Fluxo de Dados

1. O usuário solicita uma cobrança PIX via frontend ou API
2. O sistema se comunica com a Gerencianet para gerar o QR Code
3. O QR Code é apresentado ao cliente final para pagamento
4. Quando o pagamento é realizado, a Gerencianet envia um webhook
5. O sistema processa o webhook e atualiza o status da transação
6. Se configurado, o split de pagamentos é processado
7. Notificações são enviadas via webhook para o sistema do cliente

## Banco de Dados

O PagTracker utiliza o PostgreSQL como banco de dados principal, gerenciado pelo Supabase. A estrutura principal do banco inclui:

### Tabela de Usuários (users)

```sql
CREATE TABLE IF NOT EXISTS public.users (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  nome TEXT,
  api_key_gerencianet TEXT,
  client_id_gerencianet TEXT,
  client_secret_gerencianet TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
```

### Tabela de Cobranças (charges)

```sql
CREATE TABLE IF NOT EXISTS public.charges (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  valor DECIMAL NOT NULL CHECK (valor > 0),
  descricao TEXT,
  status TEXT NOT NULL CHECK (status IN ('pendente', 'pago', 'expirado')),
  txid TEXT NOT NULL UNIQUE,
  qr_code TEXT NOT NULL,
  qr_code_image TEXT NOT NULL,
  link_pagamento TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ,
  expires_at TIMESTAMPTZ
);
```

### Políticas de Segurança (RLS)

O Supabase utiliza Row Level Security (RLS) para garantir que os usuários só possam acessar seus próprios dados:

```sql
-- Política para usuários verem apenas suas próprias cobranças
CREATE POLICY "Usuários podem ver suas próprias cobranças" 
ON public.charges FOR SELECT 
USING (auth.uid() = user_id);

-- Política para usuários criarem suas próprias cobranças
CREATE POLICY "Usuários podem criar suas próprias cobranças" 
ON public.charges FOR INSERT 
WITH CHECK (auth.uid() = user_id);

-- Política para usuários atualizarem suas próprias cobranças
CREATE POLICY "Usuários podem atualizar suas próprias cobranças" 
ON public.charges FOR UPDATE 
USING (auth.uid() = user_id);
```

### Cache Local (SQLite)

Para otimização de performance, o sistema utiliza SQLite como cache local:

```sql
CREATE TABLE IF NOT EXISTS cache_charges (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  valor REAL NOT NULL,
  descricao TEXT,
  status TEXT NOT NULL,
  txid TEXT NOT NULL,
  qr_code TEXT NOT NULL,
  qr_code_image TEXT NOT NULL,
  link_pagamento TEXT NOT NULL,
  created_at TEXT NOT NULL,
  updated_at TEXT,
  expires_at TEXT,
  data TEXT NOT NULL
);
```

## Integração com Gerencianet

A Gerencianet é a provedora principal para processamento de pagamentos PIX. A integração é feita via API REST.

### Configuração da Integração

Para conectar sua conta, o usuário precisa fornecer:

1. Client ID
2. Client Secret
3. Chave PIX
4. Certificado (em ambiente de produção)

### Fluxo de Autenticação

```typescript
private async authenticate(): Promise<string> {
  // Verificar se já temos um token válido
  if (this.accessToken && this.tokenExpires && this.tokenExpires > new Date()) {
    return this.accessToken;
  }
  
  try {
    // Credenciais para autenticação
    const credentials = Buffer.from(
      `${this.clientId}:${this.clientSecret}`
    ).toString('base64');
    
    // Solicitar token de acesso
    const response = await axios.post(
      `${this.baseUrl}/oauth/token`,
      { grant_type: 'client_credentials' },
      {
        headers: {
          'Authorization': `Basic ${credentials}`,
          'Content-Type': 'application/json'
        }
      }
    );
    
    // Armazenar token e data de expiração
    this.accessToken = response.data.access_token;
    this.tokenExpires = new Date(Date.now() + response.data.expires_in * 1000);
    
    return this.accessToken;
  } catch (error) {
    console.error('Erro de autenticação na Gerencianet:', error);
    throw new Error('Falha na autenticação com a Gerencianet');
  }
}
```

### Criação de Cobranças PIX

```typescript
public async createCharge(params: CreateChargeParams): Promise<QrCodeData> {
  try {
    const token = await this.authenticate();
    
    // Dados da cobrança
    const chargeData = {
      calendario: {
        expiracao: params.expiracao || 3600, // 1 hora por padrão
      },
      valor: {
        original: params.valor.toFixed(2),
      },
      chave: this.apiKey, // Chave Pix do recebedor
      solicitacaoPagador: params.descricao || 'Pagamento PagTracker',
    };
    
    // Cria a cobrança
    const response = await axios.post(
      `${this.baseUrl}/v2/cob`,
      chargeData,
      {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      }
    );
    
    const txid = response.data.txid;
    
    // Gera o QR Code
    const qrCodeResponse = await axios.get(
      `${this.baseUrl}/v2/loc/${response.data.loc.id}/qrcode`,
      {
        headers: {
          'Authorization': `Bearer ${token}`,
        }
      }
    );
    
    return {
      qrCode: qrCodeResponse.data.qrcode,
      imagemQrCode: qrCodeResponse.data.imagemQrcode,
      txid,
      linkPagamento: `https://pix.gerencianet.com.br/${txid}`
    };
  } catch (error) {
    console.error('Erro ao criar cobrança Pix:', error);
    throw new Error('Falha ao criar cobrança Pix na Gerencianet');
  }
}
```

### Ambiente de Desenvolvimento (Mock)

Para facilitar o desenvolvimento sem depender da API real da Gerencianet, o sistema possui um modo de mock para ambiente de desenvolvimento:

```typescript
// Gerar respostas mockadas para ambiente de desenvolvimento
private getMockResponse(endpoint: string, data?: any): any {
  // Gerar um ID aleatório para simular txid, loc, etc
  const randomId = Math.random().toString(36).substring(2, 15);
  
  // Resposta padrão para criação de cobrança
  if (endpoint.includes('/cob')) {
    return {
      txid: data?.txid || `mock-${randomId}`,
      status: 'ATIVA',
      loc: {
        id: randomId,
        location: `https://exemplo.com/qr/${randomId}`
      }
    };
  }
  
  // Resposta padrão para QR Code
  if (endpoint.includes('/qrcode')) {
    return {
      qrcode: '00020126360014BR.GOV.BCB.PIX0136a629532e-7693-4846-b028-23461c7d30e5520400005303986540510.005802BR5909PAGTRACKER6009SAO PAULO62240520mpqrinter15871328316304E4E1',
      imagemQrcode: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAMgAAADIAQAAAACFI5MzAAABYUlEQVR42u2YQY7DIAxFLZZZ9gpZZm9whZwsR8gNCGfJqqnUqNNqFjMzm1jKKpIl8p4/QGyMo/3XxFyHLvRmjsf8OGfmQqgIeifxfd1MVAQpCLLOd8YLgpUF1RXHmA+3tiBf+5dkYfR2EYSF0SqDKbKwBIlH+lsYmipxQjJpPDlbSBxfNUFJ5nFy1qokGmL3KyZmhMk8Dcd1t93ugiRB0Jh+n2+4GkLDETlhIwomKmK1iZqL65O52kXMMJJoDYm4vFUSS0/UNecY1dPHElZBUsJuQ+Pp7bGNOCwk0+RcPnXTJUE90dDRmb3KIuLfL8U1vCQPEcfYV0mQfmIjz4p7BJ5/OhYS5MfnbBFRk1VFNJAl0afY60L0OfvlVkXU/U8e+4/J+rMuBNkQTXR7iLq5Hg9Rn7NJQlVZfIhGpTn2xkVE9zdBmwT7s+/dHqIGOtMptoiYCUOhbBXx+1nE8X5Z6D//AAAA//9AnXXO'
    };
  }
  
  // Resposta genérica
  return {
    mock: true,
    endpoint,
    data
  };
}
```

## Fluxo de Pagamento PIX

O sistema segue um fluxo padrão para processamento de pagamentos PIX:

### 1. Criação da Cobrança

1. O usuário solicita uma nova cobrança via frontend ou API
2. O sistema valida os dados (valor, descrição, etc.)
3. O sistema chama a API da Gerencianet para criar a cobrança
4. A Gerencianet retorna o txid e o QR Code
5. O sistema armazena os dados no banco e apresenta o QR Code ao usuário

### 2. Pagamento

1. O cliente final escaneia o QR Code com seu aplicativo bancário
2. O cliente confirma o pagamento
3. O banco do cliente processa a transação PIX
4. O PIX é creditado na conta vinculada ao PagTracker

### 3. Confirmação

1. A Gerencianet recebe a confirmação do pagamento
2. A Gerencianet envia um webhook para o PagTracker
3. O PagTracker processa o webhook e atualiza o status da transação
4. O sistema envia uma notificação ao usuário
5. Se configurado, o sistema realiza o split de pagamento
6. O sistema envia um webhook para o sistema do cliente

### 4. Gerenciamento

1. O usuário pode visualizar todas as transações no dashboard
2. O usuário pode visualizar métricas e relatórios
3. O usuário pode baixar comprovantes e extratos

## Webhooks

O sistema oferece duas formas de webhooks:

### 1. Webhooks de Entrada (Recebimento)

Endpoints para receber notificações de provedores de pagamento:

- `/api/webhooks/gerencianet`: Recebe notificações da Gerencianet
- `/api/webhooks/pix`: Endpoint genérico para outros provedores PIX

### 2. Webhooks de Saída (Envio)

Configuração para enviar notificações para sistemas de terceiros:

1. O usuário configura URLs de webhook no painel
2. O usuário seleciona os eventos que deseja notificar
3. Quando um evento ocorre, o sistema envia um POST para as URLs configuradas

### Formato de Payload de Saída

```json
{
  "event": "payment.confirmed",
  "data": {
    "id": "uuid-da-transacao",
    "txid": "txid-da-gerencianet",
    "valor": 100.00,
    "descricao": "Descrição do pagamento",
    "status": "pago",
    "created_at": "2023-04-01T10:00:00Z",
    "paid_at": "2023-04-01T10:05:30Z"
  },
  "timestamp": "2023-04-01T10:05:32Z"
}
```

### Testador de Webhooks

O sistema inclui um testador de webhooks que permite:

1. Enviar webhooks de teste para as URLs configuradas
2. Simular diferentes eventos e payloads
3. Verificar histórico de envios e respostas

## Split de Pagamentos

O sistema permite configurar divisão automática de pagamentos entre diferentes destinatários.

### Tipos de Split

1. **Split Fixo**: Valores fixos são enviados para cada destinatário
2. **Split Percentual**: Percentuais do valor total são enviados para cada destinatário
3. **Split por Regras**: Combinação de regras baseadas em valores, percentuais e condições

### Configuração de Split

1. O usuário configura os destinatários (chaves PIX)
2. O usuário define as regras de divisão
3. O usuário associa as regras a checkouts específicos ou a todos os checkouts

### Processamento de Split

1. Quando um pagamento é confirmado, o sistema verifica se há regras de split
2. Se houver, o sistema calcula os valores para cada destinatário
3. O sistema envia os pagamentos conforme a configuração
4. O sistema registra todas as operações para auditoria

## Dashboard e Métricas

O dashboard oferece uma visão completa do negócio com métricas e gráficos:

### Métricas Principais

- **Volume de Transações**: Total e média diária/mensal
- **Valor Total**: Soma de todos os pagamentos
- **Taxa de Conversão**: Porcentagem de cobranças pagas
- **Tempo Médio de Pagamento**: Tempo entre criação e pagamento

### Gráficos e Visualizações

- **Transações por Período**: Gráfico de linha mostrando evolução
- **Distribuição por Valor**: Gráfico de barras por faixas de valor
- **Mapa de Calor**: Visualização dos horários com mais pagamentos
- **Status de Transações**: Gráfico de pizza mostrando percentuais

### Relatórios

- **Relatório Diário/Semanal/Mensal**: Resumo de transações
- **Relatório de Split**: Detalhamento de divisões realizadas
- **Relatório de Clientes**: Análise de comportamento de clientes

## API Reference

O PagTracker oferece uma API RESTful completa para integração com outros sistemas:

### Autenticação

```
POST /api/auth/token
```

Parâmetros:
- `email`: Email do usuário
- `password`: Senha do usuário

Resposta:
```json
{
  "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "expires_in": 3600
}
```

### Cobranças

```
POST /api/charges
```

Parâmetros:
- `valor`: Valor em centavos
- `descricao`: Descrição da cobrança
- `expiracao`: Tempo de expiração em segundos (opcional)
- `cliente`: Dados do cliente (opcional)

Resposta:
```json
{
  "id": "uuid-da-transacao",
  "txid": "txid-da-gerencianet",
  "qr_code": "00020126360014BR.GOV.BCB.PIX...",
  "qr_code_image": "data:image/png;base64,...",
  "link_pagamento": "https://pix.link/abcde",
  "valor": 100.00,
  "status": "pendente",
  "created_at": "2023-04-01T10:00:00Z",
  "expires_at": "2023-04-01T11:00:00Z"
}
```


  "valor": 100.00,
  "status": "pendente",
  "created_at": "2023-04-01T10:00:00Z",
  "updated_at": null,
  "expires_at": "2023-04-01T11:00:00Z"
}
```

### Webhooks

```
POST /api/webhooks
```

Parâmetros:
- `url`: URL para envio de webhooks
- `eventos`: Array de eventos para notificar
- `secret`: Chave secreta para assinatura (opcional)

Resposta:
```json
{
  "id": "uuid-do-webhook",
  "url": "https://meusite.com/webhook",
  "eventos": ["payment.created", "payment.confirmed"],
  "created_at": "2023-04-01T10:00:00Z"
}
```

```
GET /api/webhooks
```

```
DELETE /api/webhooks/:id
```

### Split de Pagamentos

```
POST /api/splits
```

Parâmetros:
- `nome`: Nome da regra de split
- `destinatarios`: Array de destinatários
  - `chave_pix`: Chave PIX do destinatário
  - `nome`: Nome do destinatário
  - `tipo`: Tipo de split ("fixo" ou "percentual")
  - `valor`: Valor fixo ou percentual

Resposta:
```json
{
  "id": "uuid-do-split",
  "nome": "Split Padrão",
  "destinatarios": [
    {
      "id": "uuid-dest-1",
      "chave_pix": "email@exemplo.com",
      "nome": "Destinatário 1",
      "tipo": "percentual",
      "valor": 80
    },
    {
      "id": "uuid-dest-2",
      "chave_pix": "00000000000",
      "nome": "Destinatário 2",
      "tipo": "percentual",
      "valor": 20
    }
  ],
  "created_at": "2023-04-01T10:00:00Z"
}
```

## Componentes UI

O PagTracker utiliza componentes UI padronizados para manter consistência visual:

### Componentes Principais

1. **ChargeForm**: Formulário para criação de cobranças
2. **QRCodeDisplay**: Exibição do QR Code e instruções
3. **TransactionList**: Lista de transações com filtros
4. **TransactionDetails**: Detalhes completos de uma transação
5. **CheckoutConfigurator**: Interface para configuração de checkout
6. **WebhookManager**: Interface para gerenciamento de webhooks
7. **SplitConfigurator**: Interface para configuração de split
8. **Dashboard**: Conjunto de gráficos e métricas

### Temas e Personalização

O sistema suporta temas claro e escuro, além de personalização de cores e logos para o checkout.

## Autenticação e Segurança

### Métodos de Autenticação

1. **Email/Senha**: Autenticação padrão via Supabase Auth
2. **OAuth**: Suporte para login via Google, GitHub e outros provedores
3. **API Keys**: Chaves de API para integração programática

### Segurança

1. **HTTPS**: Todas as comunicações são feitas via HTTPS
2. **JWT**: Tokens JWT para autenticação de API
3. **CORS**: Configuração apropriada de CORS para API
4. **Rate Limiting**: Limitação de requisições para evitar abusos
5. **Audit Logs**: Registro detalhado de todas as operações sensíveis

### Permissões

O sistema implementa um modelo de permissões baseado em funções (RBAC):

1. **Admin**: Acesso completo a todas as funcionalidades
2. **Gestor**: Acesso a transações e relatórios, mas não configurações
3. **Visualizador**: Acesso somente leitura a transações
4. **API**: Acesso programático limitado a endpoints específicos

## Implantação

### Requisitos de Sistema

- Node.js 18.x ou superior
- PostgreSQL 14.x ou superior (via Supabase)
- Redis (opcional, para cache em produção)

### Ambiente de Desenvolvimento

```bash
# Clone o repositório
git clone https://github.com/sua-org/pagtracker.git
cd pagtracker

# Instale as dependências
npm install

# Configure as variáveis de ambiente
cp .env.example .env.local
# Edite .env.local com suas configurações

# Inicie o servidor de desenvolvimento
npm run dev
```

### Variáveis de Ambiente

```
# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://seu-projeto.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=sua-chave-anonima
SUPABASE_SERVICE_KEY=sua-chave-servico

# Gerencianet
GERENCIANET_CLIENT_ID=seu-client-id
GERENCIANET_CLIENT_SECRET=seu-client-secret
GERENCIANET_PIX_KEY=sua-chave-pix
GERENCIANET_CERTIFICATE=seu-certificado-base64

# API e URLs
NEXT_PUBLIC_SITE_URL=http://localhost:3000
```

### Implantação em Produção (Vercel)

1. Faça o fork do repositório no GitHub
2. Conecte o repositório ao Vercel
3. Configure as variáveis de ambiente no painel do Vercel
4. Implante o projeto

### Implantação em Produção (AWS)

1. Configure uma instância EC2 ou um serviço ECS
2. Configure o banco de dados RDS PostgreSQL ou use Supabase
3. Configure um pipeline de CI/CD com GitHub Actions
4. Configure o balanceador de carga e certificados SSL

## FAQ e Troubleshooting

### Problemas Comuns

1. **Erro de conexão com Supabase**
   - Verifique se as variáveis de ambiente estão configuradas corretamente
   - Verifique se o projeto Supabase está ativo

2. **Erro na geração do QR Code**
   - Verifique as credenciais da Gerencianet
   - Verifique se a chave PIX está configurada corretamente

3. **Webhook não está sendo recebido**
   - Verifique se a URL do webhook está acessível publicamente
   - Verifique se a API da Gerencianet está configurada para enviar webhooks

4. **Problema de hidratação React**
   - Verifique se os componentes client-side estão marcados com "use client"
   - Verifique se não há inconsistências entre o SSR e o CSR

### Contato e Suporte

Para suporte e dúvidas, entre em contato pelo email suporte@pagtracker.com.br ou abra uma issue no repositório do projeto.

---

## Histórico de Atualizações

- **1.0.0** (01/04/2023) - Lançamento inicial
- **1.1.0** (15/04/2023) - Adição de split de pagamentos
- **1.2.0** (01/05/2023) - Melhorias no dashboard e relatórios
- **1.3.0** (15/05/2023) - Integração com múltiplas PSPs
- **1.4.0** (01/06/2023) - Sistema de notificações por e-mail e SMS