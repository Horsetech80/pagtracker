# 🚀 ROADMAP DE IMPLEMENTAÇÃO - APIs CRÍTICAS
## PagTracker v4.0 - Plano de Ação Imediato

---

## 🎯 **OBJETIVO**
Implementar as **3 APIs críticas** que bloqueiam o funcionamento completo do sistema:
1. **API de Carteira** (`/api/wallet/*`)
2. **API de Clientes** (`/api/customers/*`) 
3. **API de Vendas** (`/api/sales/*`)

---

## 📋 **FASE 1: API DE CARTEIRA (PRIORIDADE MÁXIMA)**

### **Funcionalidades Necessárias**
- **Saldo Disponível**: Valor que pode ser sacado
- **Em Processamento**: Valor aguardando liberação 
- **Total Recebido**: Receita do mês atual
- **Histórico**: Lista de transações da carteira

### **Endpoints a Implementar**
```typescript
GET  /api/wallet/balance      // Saldos e resumo
GET  /api/wallet/transactions // Histórico paginado
POST /api/wallet/withdraw     // Solicitar saque
GET  /api/wallet/withdraws    // Histórico de saques
```

### **Estrutura de Dados**
```typescript
interface WalletBalance {
  available: number;        // Saldo disponível (centavos)
  processing: number;       // Em processamento (centavos) 
  total_received_month: number; // Recebido no mês (centavos)
  last_updated: string;     // Última atualização
}

interface WalletTransaction {
  id: string;
  type: 'payment' | 'withdraw' | 'fee' | 'adjustment';
  amount: number;           // Valor (centavos)
  description: string;
  status: 'completed' | 'processing' | 'failed';
  created_at: string;
  payment_id?: string;      // Referência ao pagamento
}
```

### **Implementação**
1. **Serviço**: `WalletService extends EntityService`
2. **Repositório**: Usar tabela `wallet_transactions` no Supabase
3. **Cálculos**: Agregações em tempo real dos pagamentos
4. **Cache**: Redis para saldos (performance)

---

## 📋 **FASE 2: API DE CLIENTES**

### **Funcionalidades Necessárias**
- **Lista de Clientes**: Paginada com busca
- **CRUD Completo**: Criar, editar, visualizar, deletar
- **Analytics**: Total, novos no mês, ativos, valor médio
- **Histórico**: Pagamentos por cliente



### **Estrutura de Dados**
```typescript
interface Customer {
  id: string;
  name: string;
  email: string;
  document?: string;        // CPF/CNPJ
  phone?: string;
  address?: {
    street: string;
    city: string;
    state: string;
    zip_code: string;
  };
  status: 'active' | 'inactive';
  total_spent: number;      // Total gasto (centavos)
  payments_count: number;   // Número de pagamentos
  first_payment: string;    // Data do primeiro pagamento
  last_payment?: string;    // Data do último pagamento
  created_at: string;
  updated_at: string;
}
```

---



### **Estrutura de Dados**
```typescript
interface Sale {
  id: string;
  customer_id: string;
  product_name: string;
  description?: string;
  amount: number;           // Valor (centavos)
  payment_method: 'pix' | 'credit_card' | 'bank_slip';
  status: 'pending' | 'paid' | 'cancelled' | 'refunded';
  due_date?: string;        // Data de vencimento
  paid_at?: string;         // Data do pagamento
  split_config?: {          // Configuração de split
    enabled: boolean;
    rules: SplitRule[];
  };
  payment_id?: string;      // ID do pagamento gerado
  created_at: string;
  updated_at: string;
}
```

---

## 🔧 **ARQUITETURA DE IMPLEMENTAÇÃO**

### **1. Services Pattern**
```typescript
// src/services/wallet/WalletService.ts
export class WalletService extends EntityService<WalletTransaction> {
  async getBalance(userId: string): Promise<WalletBalance> { ... }
  async createTransaction(data: CreateTransactionData): Promise<WalletTransaction> { ... }
  async requestWithdraw(amount: number): Promise<WithdrawRequest> { ... }
}

// src/services/customer/CustomerService.ts  
export class CustomerService extends EntityService<Customer> {
  async getAnalytics(): Promise<CustomerAnalytics> { ... }
  async getPaymentHistory(customerId: string): Promise<Payment[]> { ... }
}

// src/services/sales/SalesService.ts
export class SalesService extends EntityService<Sale> {
  async getSummary(): Promise<SalesSummary> { ... }
  async createSaleWithPayment(data: CreateSaleData): Promise<Sale> { ... }
}
```

### **2. Database Schema**
```sql
-- Carteira
CREATE TABLE wallet_transactions (
  id UUID PRIMARY KEY,
  tenant_id VARCHAR NOT NULL,
  user_id UUID NOT NULL,
  type VARCHAR NOT NULL,
  amount BIGINT NOT NULL,
  description TEXT NOT NULL,
  status VARCHAR NOT NULL,
  payment_id UUID REFERENCES payments(id),
  created_at TIMESTAMP DEFAULT NOW()
);

-- Clientes
CREATE TABLE customers (
  id UUID PRIMARY KEY,
  tenant_id VARCHAR NOT NULL,
  name VARCHAR NOT NULL,
  email VARCHAR NOT NULL,
  document VARCHAR,
  phone VARCHAR,
  address JSONB,
  status VARCHAR DEFAULT 'active',
  total_spent BIGINT DEFAULT 0,
  payments_count INTEGER DEFAULT 0,
  first_payment TIMESTAMP,
  last_payment TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Vendas
CREATE TABLE sales (
  id UUID PRIMARY KEY,
  tenant_id VARCHAR NOT NULL,
  user_id UUID NOT NULL,
  customer_id UUID REFERENCES customers(id),
  product_name VARCHAR NOT NULL,
  description TEXT,
  amount BIGINT NOT NULL,
  payment_method VARCHAR NOT NULL,
  status VARCHAR DEFAULT 'pending',
  due_date TIMESTAMP,
  paid_at TIMESTAMP,
  split_config JSONB,
  payment_id UUID REFERENCES payments(id),
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
```

### **3. API Endpoints Structure**
```typescript
// src/app/api/wallet/balance/route.ts
export const GET = withTenantAuth(async (req, tenantInfo) => {
  const walletService = WalletService.createWithSupabase(
    tenantInfo.tenantId, 
    tenantInfo.userId
  );
  
  const balance = await walletService.getBalance(tenantInfo.userId);
  
  return NextResponse.json({
    success: true,
    data: balance
  });
});
```

---

## ⚡ **CRONOGRAMA DE EXECUÇÃO**

### **Semana 1: API de Carteira**
- **Dias 1-2**: Criar WalletService e schema
- **Dias 3-4**: Implementar endpoints de carteira
- **Dia 5**: Testes e integração frontend

### **Semana 2: API de Clientes**
- **Dias 1-2**: Criar CustomerService e schema
- **Dias 3-4**: Implementar CRUD completo
- **Dia 5**: Analytics e integração frontend

### **Semana 3: API de Vendas**
- **Dias 1-2**: Criar SalesService e schema
- **Dias 3-4**: Implementar criação de vendas
- **Dia 5**: Integração com split e frontend

### **Semana 4: Testes e Otimização**
- **Dias 1-2**: Testes de integração completos
- **Dias 3-4**: Otimização de performance
- **Dia 5**: Deploy e validação em homologação

---

## 🔥 **AÇÕES IMEDIATAS**

### **HOJE (Próximas 2 horas)**
1. Criar migrations das tabelas no Supabase
2. Implementar WalletService básico
3. Criar endpoint `/api/wallet/balance`

### **HOJE (Próximas 4 horas)**
1. Implementar `/api/wallet/transactions`
2. Conectar frontend da carteira com APIs
3. Testar funcionalidade completa

### **AMANHÃ**
1. Iniciar CustomerService 
2. Implementar CRUD de clientes
3. Conectar página de clientes

---

## ✅ **CRITÉRIOS DE SUCESSO**

### **API de Carteira**
- ✅ Saldos são calculados corretamente
- ✅ Histórico mostra todas as transações
- ✅ Frontend exibe dados reais (não R$ 0,00)

### **API de Clientes**
- ✅ CRUD completo funcional
- ✅ Analytics mostram dados corretos
- ✅ Busca e paginação funcionam

### **API de Vendas**
- ✅ Criar venda gera pagamento PIX
- ✅ Split de pagamento funciona
- ✅ Analytics de vendas corretos

---

## 🎯 **RESULTADO ESPERADO**

Após 3-4 semanas:
- ✅ **Sistema 100% funcional** com dados reais
- ✅ **Todas as páginas do frontend** operacionais
- ✅ **15/15 APIs implementadas** (100% de completude)
- ✅ **Pronto para produção** sem dados mockados
- ✅ **Arquitetura escalável** para novos recursos

**Status Final:** **PRODUCTION COMPLETE** 🚀