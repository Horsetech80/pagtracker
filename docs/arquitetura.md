# Arquitetura do Sistema PagTracker

Este documento descreve a arquitetura técnica do PagTracker, explicando os componentes, fluxos de dados e decisões de design do sistema.

## Sumário

1. [Visão Geral da Arquitetura](#visão-geral-da-arquitetura)
2. [Componentes do Sistema](#componentes-do-sistema)
3. [Fluxo de Dados](#fluxo-de-dados)
4. [Arquitetura de Software](#arquitetura-de-software)
5. [Banco de Dados](#banco-de-dados)
6. [Segurança](#segurança)
7. [Escalabilidade](#escalabilidade)
8. [Decisões Técnicas](#decisões-técnicas)

## Visão Geral da Arquitetura

O PagTracker segue uma arquitetura moderna baseada em microsserviços e API-first, usando o padrão de camadas para separação de responsabilidades. A arquitetura foi projetada para ser:

- **Escalável**: Permitir crescimento horizontal conforme aumenta a demanda
- **Manutenível**: Fácil de manter e evoluir, com componentes desacoplados
- **Segura**: Implementando as melhores práticas de segurança
- **Resiliente**: Capaz de lidar com falhas e se recuperar adequadamente

### Diagrama de Alto Nível

```
┌─────────────────┐      ┌─────────────────┐      ┌─────────────────┐
│                 │      │                 │      │                 │
│    Frontend     │◄────►│   API Layer     │◄────►│  Database Layer │
│   (Next.js)     │      │  (Next.js API)  │      │   (Supabase)    │
│                 │      │                 │      │                 │
└─────────────────┘      └────────┬────────┘      └─────────────────┘
                                   │
                                   ▼
                         ┌─────────────────┐      ┌─────────────────┐
                         │                 │      │                 │
                         │  External APIs  │◄────►│   Gerencianet   │
                         │   & Services    │      │   PIX Service   │
                         │                 │      │                 │
                         └─────────────────┘      └─────────────────┘
```

## Componentes do Sistema

O PagTracker é composto pelos seguintes componentes principais:

### Frontend (Camada de Apresentação)

- **Next.js App Router**: Framework React para renderização do frontend
- **TailwindCSS**: Framework CSS para estilização
- **ShadcnUI**: Biblioteca de componentes UI
- **React Hooks personalizados**: Para gerenciamento de estado e lógica reutilizável

### Backend (Camada de API)

- **Next.js API Routes**: Endpoints REST para comunicação com o frontend
- **Controladores**: Lógica de negócios para processamento de requisições
- **Serviços**: Encapsulamento da lógica de negócios
- **Middleware**: Para autenticação, logging e tratamento de erros

### Banco de Dados (Camada de Persistência)

- **PostgreSQL**: Banco de dados relacional (via Supabase)
- **Supabase**: Plataforma de backend-as-a-service para persistência e autenticação
- **Cache**: SQLite para cache local, Redis para produção

### Serviços Externos

- **Gerencianet API**: Para processamento de pagamentos PIX
- **Serviço de Email**: Para notificações de usuários
- **Webhooks**: Para integração com sistemas de terceiros

### Workers (Processamento Assíncrono)

- **Queue Workers**: Para processamento assíncrono de tarefas
- **Task Scheduler**: Para execução de tarefas agendadas

## Fluxo de Dados

### Fluxo de Pagamento PIX

1. **Criação da Cobrança**:
   - O usuário solicita a criação de uma cobrança através do frontend
   - O frontend envia uma requisição para o endpoint `/api/charges`
   - O controlador de cobranças valida os dados
   - O serviço de cobranças se comunica com a API da Gerencianet
   - A Gerencianet retorna o QR Code e detalhes da cobrança
   - Os dados são armazenados no banco de dados
   - O QR Code é exibido para o usuário

2. **Pagamento e Confirmação**:
   - O cliente final escaneia o QR Code e realiza o pagamento
   - A Gerencianet processa o pagamento e envia um webhook
   - O endpoint `/api/webhooks/gerencianet` recebe a notificação
   - O serviço de webhooks valida e processa a notificação
   - O status da transação é atualizado no banco de dados
   - Notificações são enviadas aos interessados
   - Se configurado, o split de pagamento é processado

### Fluxo de Split de Pagamento

1. **Configuração de Split**:
   - O usuário configura regras de split no dashboard
   - As regras são armazenadas no banco de dados

2. **Processamento de Split**:
   - Quando um pagamento é confirmado, o worker de split é acionado
   - O worker calcula os valores para cada destinatário
   - Para cada destinatário, um pagamento PIX é iniciado
   - Os registros de split são armazenados para auditoria

## Arquitetura de Software

### Padrões de Design

O PagTracker implementa diversos padrões de design para garantir a qualidade do código:

- **MVC (Model-View-Controller)**: Separação das responsabilidades
- **Repository Pattern**: Abstração do acesso ao banco de dados
- **Service Layer**: Encapsulamento da lógica de negócios
- **Factory Pattern**: Para criação de objetos complexos
- **Singleton**: Para instâncias únicas (como conexões de banco)
- **Observer Pattern**: Para processamento de eventos e webhooks

### Estrutura de Diretórios

A estrutura de diretórios segue uma organização por funcionalidade e responsabilidade:

```
src/
├── app/                    # Rotas e páginas (Next.js App Router)
│   ├── (auth)/             # Páginas de autenticação
│   ├── (dashboard)/        # Layout e páginas do painel
│   ├── api/                # Rotas de API
│   │   ├── webhooks/       # Endpoints para webhooks
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

## Banco de Dados

### Modelo de Dados

O modelo de dados do PagTracker é composto pelas seguintes entidades principais:

#### Usuários (users)

Armazena informações sobre os usuários do sistema.

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

#### Cobranças (charges)

Armazena informações sobre as cobranças PIX.

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

#### Webhooks (webhooks)

Armazena configurações de webhooks de saída.

```sql
CREATE TABLE IF NOT EXISTS public.webhooks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  url TEXT NOT NULL,
  eventos JSONB NOT NULL,
  segredo TEXT,
  ativo BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
```

#### Regras de Split (split_rules)

Armazena regras para divisão de pagamentos.

```sql
CREATE TABLE IF NOT EXISTS public.split_rules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  nome TEXT NOT NULL,
  ativo BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
```

#### Destinatários de Split (split_recipients)

Armazena os destinatários para divisão de pagamentos.

```sql
CREATE TABLE IF NOT EXISTS public.split_recipients (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  rule_id UUID NOT NULL REFERENCES public.split_rules(id) ON DELETE CASCADE,
  nome TEXT NOT NULL,
  chave_pix TEXT NOT NULL,
  tipo TEXT NOT NULL CHECK (tipo IN ('fixo', 'percentual')),
  valor DECIMAL NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
```

### Relacionamentos

- Um usuário pode ter várias cobranças (1:N)
- Um usuário pode ter várias regras de split (1:N)
- Uma regra de split pode ter vários destinatários (1:N)
- Um usuário pode ter vários webhooks configurados (1:N)

### Índices

Para otimizar a performance, os seguintes índices são criados:

```sql
CREATE INDEX IF NOT EXISTS idx_charges_user_id ON public.charges(user_id);
CREATE INDEX IF NOT EXISTS idx_charges_status ON public.charges(status);
CREATE INDEX IF NOT EXISTS idx_charges_created_at ON public.charges(created_at);
CREATE INDEX IF NOT EXISTS idx_split_rules_user_id ON public.split_rules(user_id);
CREATE INDEX IF NOT EXISTS idx_split_recipients_rule_id ON public.split_recipients(rule_id);
CREATE INDEX IF NOT EXISTS idx_webhooks_user_id ON public.webhooks(user_id);
```

### Row Level Security (RLS)

O Supabase implementa políticas de Row Level Security para garantir que os usuários só possam acessar seus próprios dados:

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

## Segurança

### Autenticação e Autorização

- **Supabase Auth**: Gerenciamento de autenticação de usuários
- **JWT**: Tokens JWT para autenticação de API
- **RBAC**: Controle de acesso baseado em funções
- **API Keys**: Chaves de API para integrações programáticas

### Proteção de Dados

- **HTTPS**: Todas as comunicações são criptografadas via HTTPS
- **Dados Sensíveis**: Informações sensíveis são armazenadas de forma segura
- **Row Level Security**: Garantia de isolamento de dados entre usuários

### Prevenção contra Ataques

- **CSRF Protection**: Proteção contra Cross-Site Request Forgery
- **Rate Limiting**: Limitação de requisições para evitar abusos
- **Input Validation**: Validação rigorosa de entradas para prevenir injeções
- **Logging e Auditoria**: Registro detalhado de ações sensíveis

## Escalabilidade

### Estratégias de Escalabilidade

- **Escalabilidade Horizontal**: Adição de mais instâncias do aplicativo
- **Caching**: Utilização de cache em múltiplos níveis
- **CDN**: Entrega de conteúdo estático via CDN
- **Serverless**: Funções serverless para processamento de picos de demanda

### Cache

- **Client-side**: Cache no navegador para recursos estáticos
- **Server-side**: Cache de respostas de API
- **Database**: Cache de consultas frequentes
- **Redis**: Para cache distribuído em produção

## Decisões Técnicas

### Por que Next.js

O Next.js foi escolhido como framework principal porque:

1. **Renderização Híbrida**: Permite combinar SSR, SSG e CSR conforme necessário
2. **API Routes**: Facilita a criação de endpoints de API no mesmo projeto
3. **App Router**: Oferece roteamento baseado em sistema de arquivos e layouts
4. **Performance**: Otimizações automáticas para carregamento e renderização
5. **TypeScript**: Suporte nativo para desenvolvimento com tipagem estática

### Por que Supabase

O Supabase foi escolhido como plataforma de backend porque:

1. **PostgreSQL**: Banco de dados robusto e completo
2. **Autenticação**: Sistema de autenticação pronto para uso
3. **Row Level Security**: Políticas de segurança no nível do banco de dados
4. **Realtime**: Suporte a atualizações em tempo real
5. **Edge Functions**: Funções serverless para lógica personalizada

### Por que TypeScript

O TypeScript foi adotado porque:

1. **Segurança de Tipos**: Reduz erros em tempo de execução
2. **Documentação Integrada**: Tipos servem como documentação
3. **Refatoração Segura**: Facilita mudanças no código
4. **IDE Support**: Melhor suporte em editores e ferramentas
5. **Escalabilidade**: Mais adequado para projetos em equipe

### Escolhas de Design

- **Arquitetura Modular**: Componentes independentes e reutilizáveis
- **API RESTful**: Interface padronizada para integração
- **Design Responsivo**: Interface adaptável a diferentes dispositivos
- **Acessibilidade**: Seguindo diretrizes WCAG para inclusão
- **Dark Mode**: Suporte a temas claro e escuro

## Considerações Futuras

Para o crescimento do sistema, as seguintes áreas estão planejadas:

1. **Microserviços**: Decomposição em serviços mais especializados
2. **GraphQL**: API GraphQL para consultas mais flexíveis
3. **Internacionalização**: Suporte a múltiplos idiomas
4. **PWA**: Transformação em Progressive Web App
5. **Mobile App**: Aplicativo nativo para iOS e Android

---

Este documento de arquitetura é um documento vivo e será atualizado conforme o sistema evolui. Dúvidas específicas sobre a arquitetura devem ser direcionadas à equipe de desenvolvimento através do email arquitetura@pagtracker.com.br. 