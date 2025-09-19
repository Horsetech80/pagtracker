import { EntityService, IRepository } from '../core/EntityService';
import { MemoryRepository } from '../core/MemoryRepository';
import { SupabaseFactory } from '../core/SupabaseFactory';
import { generateTenantResourceId } from '@/middleware/tenant/info';

/**
 * Interface para pagamentos
 */
export interface Payment {
  id: string;
  tenant_id: string;
  user_id: string;
  checkout_id: string;
  amount: number;
  currency: string;
  status: 'pending' | 'processing' | 'completed' | 'failed' | 'refunded';
  payment_method: 'pix' | 'credit_card' | 'bank_slip';
  reference: string;
  customer: {
    name: string;
    email: string;
    document?: string;
    phone?: string;
  };
  pix_info?: {
    qr_code: string;
    qr_code_url: string;
    expiration_date: string;
  };
  metadata?: Record<string, any>;
  created_at: string;
  updated_at: string;
  completed_at?: string;
}

/**
 * Serviço para gerenciamento de pagamentos
 */
export class PaymentService extends EntityService<Payment> {
  /**
   * @param repository Repositório de pagamentos
   * @param tenantId ID do tenant
   * @param userId ID do usuário
   */
  constructor(
    repository: IRepository<Payment>,
    tenantId: string,
    userId: string
  ) {
    super(repository, tenantId, userId);
  }
  
  /**
   * Cria um novo pagamento
   */
  async createPayment(data: Omit<Partial<Payment>, 'id' | 'tenant_id' | 'user_id' | 'status' | 'created_at' | 'updated_at'>): Promise<Payment> {
    // Validar campos obrigatórios
    if (!data.checkout_id) {
      throw new Error('ID do checkout é obrigatório');
    }
    
    if (!data.amount || data.amount <= 0) {
      throw new Error('Valor deve ser maior que zero');
    }
    
    if (!data.customer?.name || !data.customer?.email) {
      throw new Error('Nome e email do cliente são obrigatórios');
    }
    
    // Gerar ID único para o pagamento
    const paymentId = generateTenantResourceId('pay', this.tenantId, { shortTenantId: true });
    
    // Gerar referência única
    const reference = `REF${Math.floor(Math.random() * 1000000).toString().padStart(6, '0')}`;
    
    // Criar o objeto de pagamento
    const now = new Date().toISOString();
    const payment: Partial<Payment> = {
      id: paymentId,
      reference,
      status: 'pending',
      currency: data.currency || 'BRL',
      payment_method: data.payment_method || 'pix',
      ...data
    };
    
    // Adicionar informações de PIX para pagamentos PIX
    if (payment.payment_method === 'pix') {
      // Em uma implementação real, essas informações viriam de uma API de pagamento
      const pixExpiration = new Date();
      pixExpiration.setHours(pixExpiration.getHours() + 1); // Expira em 1 hora
      
      payment.pix_info = {
        qr_code: 'QRCODE_SIMULADO_PIX_' + paymentId,
        qr_code_url: `https://api.pagtracker.com.br/pix/qrcode/${paymentId}`,
        expiration_date: pixExpiration.toISOString()
      };
    }
    
    // Criar o pagamento no repositório
    return this.create(payment);
  }
  
  /**
   * Busca pagamentos por status
   */
  async findByStatus(status: Payment['status'] | 'all'): Promise<Payment[]> {
    const query = status !== 'all' ? { status } : {};
    return this.list(query, { orderBy: { field: 'created_at', direction: 'desc' } });
  }
  
  /**
   * Atualiza o status de um pagamento
   */
  async updateStatus(id: string, status: Payment['status'], metadata?: Record<string, any>): Promise<Payment> {
    // Verificar se o pagamento existe e pertence ao tenant
    const payment = await this.findById(id);
    if (!payment) {
      throw new Error('Pagamento não encontrado');
    }
    
    const updates: Partial<Payment> = { status };
    
    // Adicionar metadata se fornecido
    if (metadata) {
      updates.metadata = {
        ...payment.metadata,
        ...metadata
      };
    }
    
    // Registrar data de conclusão para pagamentos completados
    if (status === 'completed' && payment.status !== 'completed') {
      updates.completed_at = new Date().toISOString();
    }
    
    return this.update(id, updates);
  }
  
  /**
   * Processa um reembolso
   */
  async refundPayment(id: string, reason?: string): Promise<Payment> {
    // Verificar se o pagamento existe e pertence ao tenant
    const payment = await this.findById(id);
    if (!payment) {
      throw new Error('Pagamento não encontrado');
    }
    
    // Verificar se o pagamento pode ser reembolsado
    if (payment.status !== 'completed') {
      throw new Error('Apenas pagamentos concluídos podem ser reembolsados');
    }
    
    // Atualizar o status e adicionar informações do reembolso
    return this.updateStatus(id, 'refunded', {
      refund_date: new Date().toISOString(),
      refund_reason: reason || 'Solicitação do cliente'
    });
  }
  
  /**
   * Busca pagamentos por checkout
   */
  async findByCheckoutId(checkoutId: string): Promise<Payment[]> {
    return this.list({ checkout_id: checkoutId });
  }
  
  /**
   * Remove dados sensíveis
   */
  protected sanitizeOutput<T>(data: T): Partial<T> {
    // Cria uma cópia para não modificar o objeto original
    const sanitized = { ...data } as any;
    
    // Oculta parte do documento do cliente para privacidade
    if (sanitized.customer?.document) {
      const doc = sanitized.customer.document;
      sanitized.customer = {
        ...sanitized.customer,
        document: doc.length > 4 ? `${doc.slice(0, 3)}****${doc.slice(-4)}` : doc
      };
    }
    
    return sanitized;
  }
  
  /**
   * Cria uma instância do serviço com um repositório em memória
   */
  static createWithMemoryRepo(
    tenantId: string,
    userId: string,
    initialData: Payment[] = []
  ): PaymentService {
    const repository = new MemoryRepository<Payment>(initialData);
    return new PaymentService(repository, tenantId, userId);
  }
  
  /**
   * Cria uma instância do serviço com um repositório Supabase
   */
  static createWithSupabase(
    tenantId: string,
    userId: string
  ): PaymentService {
    const repository = SupabaseFactory.getInstance().payments();
    return new PaymentService(repository, tenantId, userId);
  }
} 