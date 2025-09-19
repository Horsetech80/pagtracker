# Guia de Instalação do PagTracker

Este guia apresenta as instruções detalhadas para instalação e configuração do sistema PagTracker, desde o ambiente de desenvolvimento até a implantação em produção.

## Sumário

1. [Requisitos de Sistema](#requisitos-de-sistema)
2. [Ambiente de Desenvolvimento](#ambiente-de-desenvolvimento)
3. [Configuração do Supabase](#configuração-do-supabase)
4. [Configuração da Gerencianet](#configuração-da-gerencianet)
5. [Variáveis de Ambiente](#variáveis-de-ambiente)
6. [Implantação em Produção](#implantação-em-produção)
7. [Troubleshooting](#troubleshooting)

## Requisitos de Sistema

### Requisitos Mínimos

- **Node.js**: versão 18.x ou superior
- **NPM**: versão 8.x ou superior (ou Yarn 1.22+)
- **Git**: para gerenciamento de código
- **PostgreSQL**: 14.x ou superior (gerenciado via Supabase)
- **Acesso à Internet**: para APIs externas

### Requisitos Recomendados

- **Memória RAM**: 4GB ou mais para desenvolvimento
- **Espaço em Disco**: Mínimo de 2GB livres
- **Sistema Operacional**: Windows 10+, macOS 10.15+, ou Linux (Ubuntu 20.04+)
- **Docker**: para desenvolvimento com containers (opcional)

## Ambiente de Desenvolvimento

### Clonando o Repositório

```bash
# Clone o repositório do GitHub
git clone https://github.com/sua-org/pagtracker.git

# Acesse o diretório do projeto
cd pagtracker
```

### Instalação de Dependências

```bash
# Usando NPM
npm install

# Ou usando Yarn
yarn install
```

### Configuração Inicial

1. Crie um arquivo `.env.local` na raiz do projeto:

```bash
cp .env.example .env.local
```

2. Edite o arquivo `.env.local` com suas configurações (veja a seção [Variáveis de Ambiente](#variáveis-de-ambiente))

### Executando o Projeto

```bash
# Iniciar o servidor de desenvolvimento
npm run dev

# Ou com Yarn
yarn dev
```

O servidor estará disponível em http://localhost:3000 (ou outro porto, caso 3000 esteja em uso).

### Scripts Disponíveis

| Comando | Descrição |
|---------|-----------|
| `npm run dev` | Inicia servidor de desenvolvimento |
| `npm run build` | Compila o projeto para produção |
| `npm run start` | Inicia o servidor em modo produção |
| `npm run lint` | Executa verificação de código |
| `npm run test` | Executa testes unitários |
| `npm run test:coverage` | Executa testes com relatório de cobertura |

## Configuração do Supabase

O PagTracker utiliza o Supabase como backend para armazenamento de dados e autenticação.

### Criando um Projeto no Supabase

1. Acesse [https://supabase.com](https://supabase.com) e faça login ou crie uma conta
2. Crie um novo projeto
3. Defina um nome para o projeto e uma senha segura para o banco de dados
4. Selecione a região mais próxima da sua localização
5. Aguarde a criação do projeto (pode demorar alguns minutos)

### Configuração do Banco de Dados

1. No painel do Supabase, acesse "SQL Editor"
2. Copie o conteúdo do arquivo `supabase/schema.sql` do repositório
3. Cole no SQL Editor e execute o script para criar as tabelas necessárias

### Configuração de Autenticação

1. No painel do Supabase, acesse "Authentication" > "Providers"
2. Ative o provedor "Email" e configure as opções conforme necessário:
   - Recomendado: Ativar confirmação de email
   - Personalizar templates de email (opcional)
3. Para ambiente de desenvolvimento, é possível desativar a confirmação de email

### Obtendo Chaves de API

1. No painel do Supabase, acesse "Settings" > "API"
2. Copie a "URL" e a "anon key" (chave pública)
3. Copie também a "service_role key" (chave de serviço)
4. Adicione estas chaves ao seu arquivo `.env.local`

## Configuração da Gerencianet

A Gerencianet é utilizada como provedor para processamento de pagamentos PIX.

### Criando uma Conta

1. Acesse [https://gerencianet.com.br](https://gerencianet.com.br) e crie uma conta
2. Complete o cadastro com os dados necessários
3. Ative sua conta via email de confirmação

### Obtendo Credenciais

1. Faça login no painel da Gerencianet
2. Acesse "API" > "Minhas Aplicações"
3. Clique em "Nova Aplicação"
4. Preencha os dados solicitados:
   - Nome da aplicação: "PagTracker"
   - Descrição: "Gateway de Pagamento PIX"
   - Selecione os scopes: "Pix" (receber e enviar)
5. Após criar, anote o "Client ID" e "Client Secret"
6. Para ambiente de produção, você precisará gerar um certificado

### Configurando Chave PIX

1. No painel da Gerencianet, acesse "Pix" > "Minhas Chaves"
2. Cadastre uma chave PIX (email, telefone, CPF/CNPJ ou aleatória)
3. Esta chave será utilizada para receber os pagamentos
4. Adicione esta chave ao seu arquivo `.env.local`

### Configurando Webhook

1. No painel da Gerencianet, acesse "API" > "Webhooks Pix"
2. Clique em "Novo Webhook"
3. Configure:
   - Chave Pix: Selecione a chave cadastrada
   - URL: URL do seu servidor + `/api/webhooks/gerencianet`
   - Para ambiente de desenvolvimento, utilize uma ferramenta como Ngrok

## Variáveis de Ambiente

Crie um arquivo `.env.local` na raiz do projeto com as seguintes variáveis:

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

# Modo de desenvolvimento (opcional)
NODE_ENV=development
```

### Opções Adicionais

```
# Redis (para produção)
REDIS_URL=redis://user:password@localhost:6379

# Configurações de Email (opcional)
EMAIL_SERVER=smtp://user:password@smtp.example.com:587
EMAIL_FROM=notificacoes@pagtracker.com.br

# Logging (opcional)
LOG_LEVEL=info
```

## Implantação em Produção

### Implantação na Vercel

A forma mais simples de implantar o PagTracker é utilizando a Vercel:

1. Faça o fork do repositório no GitHub
2. Crie uma conta na [Vercel](https://vercel.com) se ainda não tiver
3. Clique em "New Project" e importe o repositório
4. Configure as variáveis de ambiente
5. Clique em "Deploy"

### Implantação na AWS

Para implantação na AWS, siga estes passos:

1. **EC2 ou ECS**:
   - Configure uma instância EC2 com Node.js ou um serviço ECS
   - Clone o repositório e instale as dependências
   - Configure o arquivo `.env` com as variáveis de ambiente
   - Execute `npm run build` e depois `npm run start`

2. **Banco de Dados**:
   - Continue utilizando o Supabase ou
   - Configure um RDS PostgreSQL

3. **Load Balancer e SSL**:
   - Configure um Application Load Balancer
   - Instale certificados SSL via AWS Certificate Manager

4. **CI/CD**:
   - Configure GitHub Actions ou AWS CodePipeline para automação

### Implantação com Docker

O projeto inclui configuração Docker para facilitar a implantação:

```bash
# Construir a imagem
docker build -t pagtracker .

# Executar o container
docker run -p 3000:3000 --env-file .env.production pagtracker
```

Para Docker Compose:

```bash
# Iniciar todos os serviços
docker-compose up -d
```

## Troubleshooting

### Problemas Comuns e Soluções

1. **Erro de conexão com Supabase**
   - Verifique se as URLs e chaves estão corretas
   - Teste a conexão com o banco de dados diretamente
   - Verifique se o IP não está bloqueado nas regras de segurança

2. **Erro no build do Next.js**
   - Limpe a pasta `.next`: `rm -rf .next`
   - Reinstale as dependências: `npm ci`
   - Atualize o Next.js: `npm update next`

3. **Problema com integração da Gerencianet**
   - Verifique se está usando o ambiente correto (sandbox/produção)
   - Confirme se as credenciais estão corretas
   - Verifique se a chave PIX está ativa

4. **Erro de hidratação no React**
   - Verifique se componentes client-side têm "use client" no topo
   - Verifique inconsistências entre renderização servidor/cliente
   - Usando setTimeout em effects pode ajudar em alguns casos

### Logs e Diagnóstico

Para diagnosticar problemas, verifique os logs:

```bash
# Logs do servidor Next.js
npm run dev

# Logs em produção
pm2 logs
# ou
docker logs container_id
```

### Contato para Suporte

Se os problemas persistirem, entre em contato:

- Email: suporte@pagtracker.com.br
- GitHub: Abra uma issue no repositório
- Documentação: Consulte FAQ em docs/troubleshooting.md 