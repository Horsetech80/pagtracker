# 🛣️ ESTRUTURA DE ROTAS PAGTRACKER v4.0

## 📋 **RESUMO EXECUTIVO**

Este documento define a organização de rotas do PagTracker seguindo as **melhores práticas do Next.js App Router** e alinhada com a arquitetura existente do sistema.

---

## 🏗️ **ESTRUTURA DE ROTAS ORGANIZADA**

### **📁 Estrutura de Diretórios**

```
src/app/
├── (auth)/                    # Route Group - Autenticação
│   ├── login/
│   │   └── page.tsx          # /login
│   ├── register/
│   │   └── page.tsx          # /register
│   └── layout.tsx            # Layout para páginas de auth
│
├── (dashboard)/               # Route Group - Dashboard (Protegido)
│   ├── dashboard/
│   │   └── page.tsx          # /dashboard (Principal)
│   ├── vendas/
│   │   └── page.tsx          # /vendas
│   ├── cobrancas/
│   │   └── page.tsx          # /cobrancas
│   ├── clientes/
│   │   └── page.tsx          # /clientes
│   ├── carteira/
│   │   └── page.tsx          # /carteira
│   ├── split/
│   │   └── page.tsx          # /split
│   ├── checkout/
│   │   └── page.tsx          # /checkout
│   ├── webhooks/
│   │   └── page.tsx          # /webhooks
│   ├── relatorios/
│   │   └── page.tsx          # /relatorios
│   ├── configuracoes/
│   │   └── page.tsx          # /configuracoes
│   └── layout.tsx            # Layout do dashboard
│
├── (checkout)/                # Route Group - Checkout Público
│   ├── [id]/
│   │   └── page.tsx          # /checkout/[id] (Página de pagamento)
│   └── layout.tsx            # Layout do checkout
│
├── api/                       # API Routes
│   ├── health/
│   │   └── route.ts          # /api/health
│   ├── payments/
│   │   ├── route.ts          # /api/payments
│   │   └── [id]/route.ts     # /api/payments/[id]
│   ├── charges/
│   │   ├── route.ts          # /api/charges
│   │   └── [id]/route.ts     # /api/charges/[id]
│   ├── split/
│   │   ├── route.ts          # /api/split
│   │   ├── destinatarios/route.ts
│   │   ├── regras/route.ts
│   │   └── transacoes/route.ts
│   ├── webhooks/
│   │   ├── unified/route.ts  # /api/webhooks/unified
│   │   ├── efibank/route.ts  # /api/webhooks/efibank
│   │   └── stripe/route.ts   # /api/webhooks/stripe
│   └── dashboard/
│       └── metrics/route.ts  # /api/dashboard/metrics
│
├── select-tenant/
│   └── page.tsx              # /select-tenant
├── page.tsx                  # / (Landing Page)
├── layout.tsx                # Root Layout
├── error.tsx                 # Error Boundary
└── globals.css               # Estilos globais
```

---

## 🎯 **ROUTE GROUPS E ORGANIZAÇÃO**

### **1. (auth) - Autenticação**
- **Propósito:** Páginas de login e registro
- **Acesso:** Público
- **Layout:** Simples, focado na autenticação
- **Rotas:**
  - `/login` - Página de login
  - `/register` - Página de registro

### **2. (dashboard) - Dashboard Administrativo**
- **Propósito:** Interface administrativa completa
- **Acesso:** Protegido (requer autenticação)
- **Layout:** Sidebar com navegação completa
- **Rotas:**
  - `/dashboard` - Dashboard principal com métricas
  - `/vendas` - Gerenciamento de vendas
  - `/cobrancas` - Gerenciamento de cobranças
  - `/clientes` - Gestão de clientes
  - `/carteira` - Controle financeiro
  - `/split` - Configuração de split de pagamentos
  - `/checkout` - Configuração de checkouts
  - `/webhooks` - Configuração de webhooks
  - `/relatorios` - Relatórios e analytics
  - `/configuracoes` - Configurações gerais

### **3. (checkout) - Checkout Público**
- **Propósito:** Páginas de pagamento públicas
- **Acesso:** Público
- **Layout:** Focado na conversão
- **Rotas:**
  - `/checkout/[id]` - Página de pagamento específica

---

## 🌐 **MAPEAMENTO DE DOMÍNIOS**

### **Domínios Configurados:**
- `pagtracker.com` - Principal (Landing + Dashboard)
- `admin-hml.pagtracker.com` - Dashboard administrativo
- `api-hml.pagtracker.com` - APIs
- `checkout-hml.pagtracker.com` - Checkout público
- `docs-hml.pagtracker.com` - Documentação
- `webhook-hml.pagtracker.com` - Webhooks

### **Estrutura de URLs por Domínio:**

#### **pagtracker.com (Principal)**
```
/                    → Landing Page
/login               → Página de login
/register            → Página de registro
/select-tenant       → Seleção de tenant
/dashboard           → Dashboard principal
/vendas              → Gerenciamento de vendas
/cobrancas           → Gerenciamento de cobranças
/clientes            → Gestão de clientes
/carteira            → Controle financeiro
/split               → Split de pagamentos
/checkout            → Configuração de checkout
/webhooks            → Configuração de webhooks
/relatorios          → Relatórios
/configuracoes       → Configurações
```

#### **checkout-hml.pagtracker.com**
```
/                    → Página inicial do checkout
/[id]                → Página de pagamento específica
```

#### **api-hml.pagtracker.com**
```
/api/health          → Health check
/api/payments        → API de pagamentos
/api/charges         → API de cobranças
/api/split           → API de split
/api/webhooks        → Webhooks
/api/dashboard       → APIs do dashboard
```

---

## 🔐 **PROTEÇÃO DE ROTAS**

### **Middleware de Autenticação**
```typescript
// src/middleware.ts
export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  
  // Rotas públicas
  const publicRoutes = ['/', '/login', '/register', '/api/health'];
  if (publicRoutes.includes(pathname)) return NextResponse.next();
  
  // Rotas de checkout público
  if (pathname.startsWith('/checkout/')) return NextResponse.next();
  
  // Rotas protegidas (dashboard)
  if (pathname.startsWith('/dashboard') || 
      pathname.startsWith('/vendas') ||
      pathname.startsWith('/cobrancas') ||
      pathname.startsWith('/clientes') ||
      pathname.startsWith('/carteira') ||
      pathname.startsWith('/split') ||
      pathname.startsWith('/checkout') ||
      pathname.startsWith('/webhooks') ||
      pathname.startsWith('/relatorios') ||
      pathname.startsWith('/configuracoes')) {
    
    // Verificar autenticação
    const token = request.cookies.get('auth-token');
    if (!token) {
      return NextResponse.redirect(new URL('/login', request.url));
    }
  }
  
  return NextResponse.next();
}
```

---

## 📊 **APIS ORGANIZADAS**

### **Estrutura de APIs por Funcionalidade:**

#### **1. Pagamentos (/api/payments)**
```typescript
GET    /api/payments          → Listar pagamentos
POST   /api/payments          → Criar pagamento
GET    /api/payments/[id]     → Obter pagamento específico
PUT    /api/payments/[id]     → Atualizar pagamento
DELETE /api/payments/[id]     → Cancelar pagamento
```

#### **2. Cobranças (/api/charges)**
```typescript
GET    /api/charges           → Listar cobranças
POST   /api/charges           → Criar cobrança
GET    /api/charges/[id]      → Obter cobrança específica
POST   /api/charges/[id]/refund → Estornar cobrança
```

#### **3. Split (/api/split)**
```typescript
GET    /api/split/destinatarios → Listar destinatários
POST   /api/split/destinatarios → Criar destinatário
GET    /api/split/regras      → Listar regras
POST   /api/split/regras      → Criar regra
GET    /api/split/transacoes  → Listar transações
POST   /api/split/transacoes  → Criar transação
```

#### **4. Dashboard (/api/dashboard)**
```typescript
GET    /api/dashboard/metrics → Métricas do dashboard
GET    /api/dashboard/sales   → Dados de vendas
GET    /api/dashboard/revenue → Dados de receita
```

#### **5. Webhooks (/api/webhooks)**
```typescript
POST   /api/webhooks/unified  → Webhook unificado
POST   /api/webhooks/efibank  → Webhook Efi Bank
POST   /api/webhooks/stripe   → Webhook Stripe
```

---

## 🎨 **LAYOUTS E COMPONENTES**

### **1. Root Layout (layout.tsx)**
- Providers globais (Supabase, Toast, etc.)
- Meta tags e configurações SEO
- Estrutura HTML base

### **2. Dashboard Layout ((dashboard)/layout.tsx)**
- Sidebar com navegação
- Header com informações do usuário
- Breadcrumbs
- Responsivo (mobile/desktop)

### **3. Auth Layout ((auth)/layout.tsx)**
- Layout simples e limpo
- Foco na autenticação
- Redirecionamentos automáticos

### **4. Checkout Layout ((checkout)/layout.tsx)**
- Layout otimizado para conversão
- Sem sidebar
- Foco no pagamento

---

## 🔄 **FLUXO DE NAVEGAÇÃO**

### **Fluxo de Autenticação:**
```
/ → /login → /select-tenant → /dashboard
```

### **Fluxo de Checkout:**
```
/checkout/[id] → Processamento → Sucesso/Erro
```

### **Fluxo de Dashboard:**
```
/dashboard → Navegação lateral → Páginas específicas
```

---

## 📱 **RESPONSIVIDADE**

### **Breakpoints:**
- **Mobile:** < 768px (sidebar colapsada)
- **Tablet:** 768px - 1024px (sidebar compacta)
- **Desktop:** > 1024px (sidebar completa)

### **Adaptações:**
- Sidebar colapsável em mobile
- Navegação por hamburger menu
- Cards responsivos
- Tabelas com scroll horizontal

---

## 🚀 **MELHORIAS IMPLEMENTADAS**

### **1. Route Groups**
- ✅ Organização lógica por funcionalidade
- ✅ Layouts específicos por contexto
- ✅ URLs limpas e semânticas

### **2. Proteção de Rotas**
- ✅ Middleware de autenticação
- ✅ Redirecionamentos automáticos
- ✅ Verificação de permissões

### **3. APIs Organizadas**
- ✅ Estrutura RESTful
- ✅ Agrupamento por funcionalidade
- ✅ Versionamento preparado

### **4. Multi-tenancy**
- ✅ Suporte a múltiplos tenants
- ✅ Isolamento de dados
- ✅ Configurações por tenant

### **5. Performance**
- ✅ Lazy loading de componentes
- ✅ Code splitting automático
- ✅ Otimização de imagens

---

## 📋 **CHECKLIST DE IMPLEMENTAÇÃO**

### **✅ Concluído:**
- [x] Estrutura de Route Groups
- [x] Layout do Dashboard
- [x] Página principal do Dashboard
- [x] Página de Vendas
- [x] Página de Split
- [x] Navegação lateral
- [x] Responsividade básica

### **🔄 Em Andamento:**
- [ ] Páginas restantes do dashboard
- [ ] APIs específicas
- [ ] Middleware de autenticação
- [ ] Integração com Supabase

### **📝 Pendente:**
- [ ] Páginas de checkout público
- [ ] Documentação de APIs
- [ ] Testes automatizados
- [ ] Otimizações de performance

---

## 🎯 **PRÓXIMOS PASSOS**

### **1. Implementar Páginas Restantes**
- Cobranças
- Clientes
- Carteira
- Checkout (configuração)
- Webhooks
- Relatórios
- Configurações

### **2. Desenvolver APIs**
- Endpoints específicos para cada funcionalidade
- Integração com Supabase
- Validação de dados
- Tratamento de erros

### **3. Melhorar UX/UI**
- Componentes reutilizáveis
- Animações e transições
- Feedback visual
- Loading states

### **4. Implementar Funcionalidades Avançadas**
- Filtros avançados
- Exportação de dados
- Notificações em tempo real
- Analytics detalhados

---

## 📚 **REFERÊNCIAS**

- [Next.js App Router Documentation](https://nextjs.org/docs/app)
- [Next.js Route Groups](https://nextjs.org/docs/app/building-your-application/routing/route-groups)
- [Next.js Middleware](https://nextjs.org/docs/app/building-your-application/routing/middleware)
- [Next.js API Routes](https://nextjs.org/docs/app/building-your-application/routing/route-handlers)

---

**📅 Última atualização:** Janeiro 2025  
**🔄 Versão:** 4.0  
**👨‍💻 Responsável:** Equipe PagTracker 