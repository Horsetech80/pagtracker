import { PaymentService, Payment } from './PaymentService';
import { paymentManager } from '../../lib/payment-gateways/PaymentManager';
import { CreatePaymentData } from '../../lib/payment-gateways/PaymentGatewayInterface';
import { IRepository } from '../core/EntityService';
import { log } from '@/lib/logger';
import { createError } from '@/lib/errors';

/**
 * Serviço unificado que combina:
 * - PaymentService existente (persistência no banco)
 * - PaymentManager (abstração de gateways)
 */
export class UnifiedPaymentService extends PaymentService {
  
  constructor(
    repository: IRepository<Payment>,
    tenantId: string,
    userId: string
  ) {
    super(repository, tenantId, userId);
  }

  /**
   * Cria um pagamento usando gateway abstrato
   * Mantém compatibilidade com o método original
   */
  async createPaymentWithGateway(data: {
    checkout_id: string;
    amount: number; // em centavos
    description: string;
    customer: {
      name: string;
      email: string;
      document?: string;
      phone?: string;
    };
    method?: 'pix' | 'credit_card' | 'debit_card' | 'boleto';
    gatewayName?: string;
    expirationMinutes?: number;
  }): Promise<Payment & { gatewayData: any }> {
    
    // Valida dados básicos
    if (!data.checkout_id || !data.amount || data.amount <= 0) {
      throw new Error('Dados de pagamento inválidos');
    }

    // Prepara dados para o gateway
    const gatewayData: CreatePaymentData = {
      amount: data.amount,
      description: data.description,
      customer: data.customer,
      method: data.method || 'pix',
      expirationMinutes: data.expirationMinutes || 60
    };

    try {
      // Cria pagamento no gateway
      const gatewayResponse = await paymentManager.createPayment(gatewayData, data.gatewayName);
      
             // Mapeia método do gateway para o formato do banco
       let dbPaymentMethod: 'pix' | 'credit_card' | 'bank_slip';
       switch (data.method) {
         case 'debit_card':
         case 'credit_card':
           dbPaymentMethod = 'credit_card';
           break;
         case 'boleto':
           dbPaymentMethod = 'bank_slip';
           break;
         default:
           dbPaymentMethod = 'pix';
       }

       // Cria registro no banco usando o PaymentService original
       const paymentData = {
         checkout_id: data.checkout_id,
         amount: data.amount,
         currency: 'BRL',
         payment_method: dbPaymentMethod,
         customer: data.customer,
         metadata: {
           gateway_name: gatewayResponse.gatewayData?.gateway || 'efi_bank',
           gateway_payment_id: gatewayResponse.id,
           gateway_response: gatewayResponse.gatewayData,
           original_method: data.method || 'pix'
         }
       };

      // Para PIX, adiciona informações específicas
      if (data.method === 'pix' || !data.method) {
        Object.assign(paymentData, {
          pix_info: {
            qr_code: gatewayResponse.pixCode || '',
            qr_code_url: gatewayResponse.pixQrCode || '',
            expiration_date: gatewayResponse.expiresAt?.toISOString() || ''
          }
        });
      }

      const payment = await this.createPayment(paymentData);

      return {
        ...payment,
        gatewayData: gatewayResponse
      };

    } catch (error) {
      log.error('Erro ao criar pagamento unificado', {
        service: 'UnifiedPaymentService',
        method: 'createPaymentWithGateway',
        tenantId: this.tenantId,
        userId: this.userId,
        checkoutId: data.checkout_id,
        amount: data.amount,
        gatewayName: data.gatewayName,
        error: error instanceof Error ? error.message : String(error)
      });
      throw createError.internal('Falha ao processar pagamento', { 
        originalError: error instanceof Error ? error : new Error(String(error))
      });
    }
  }

  /**
   * Consulta status do pagamento diretamente no gateway
   */
  async syncPaymentStatus(paymentId: string): Promise<Payment> {
    // Busca pagamento no banco
    const payment = await this.findById(paymentId);
    if (!payment) {
      throw new Error('Pagamento não encontrado');
    }

    // Extrai dados do gateway dos metadados
    const gatewayName = payment.metadata?.gateway_name || 'efi_bank';
    const gatewayPaymentId = payment.metadata?.gateway_payment_id;

    if (!gatewayPaymentId) {
      throw new Error('ID do gateway não encontrado nos metadados');
    }

    try {
      // Consulta status no gateway
      const statusResponse = await paymentManager.getPaymentStatus(gatewayPaymentId, gatewayName);
      
      // Mapeia status do gateway para nosso padrão
      let newStatus: Payment['status'];
      switch (statusResponse.status) {
        case 'paid':
          newStatus = 'completed';
          break;
        case 'cancelled':
          newStatus = 'failed';
          break;
        case 'processing':
          newStatus = 'processing';
          break;
        default:
          newStatus = 'pending';
      }

      // Atualiza apenas se o status mudou
      if (payment.status !== newStatus) {
        return this.updateStatus(paymentId, newStatus, {
          last_gateway_sync: new Date().toISOString(),
          gateway_status_response: statusResponse.gatewayData
        });
      }

      return payment;

    } catch (error) {
      log.error('Erro ao sincronizar status do pagamento', {
        service: 'UnifiedPaymentService',
        method: 'syncPaymentStatus',
        tenantId: this.tenantId,
        userId: this.userId,
        paymentId,
        error: error instanceof Error ? error.message : String(error)
      });
      throw createError.internal('Falha ao sincronizar status do pagamento', { 
        originalError: error instanceof Error ? error : new Error(String(error))
      });
    }
  }

  /**
   * Processa webhook de qualquer gateway
   */
  async processGatewayWebhook(gatewayName: string, payload: any): Promise<boolean> {
    try {
      // Processa webhook usando o PaymentManager
      const webhookResult = await paymentManager.processWebhook(payload, gatewayName);
      
      if (!webhookResult.processed) {
        return false;
      }

      // Busca pagamento pelo ID do gateway
      const payments = await this.list({
        'metadata->gateway_payment_id': webhookResult.paymentId
      });

      if (payments.length === 0) {
        log.warn('Pagamento não encontrado para webhook', {
          service: 'UnifiedPaymentService',
          method: 'processGatewayWebhook',
          tenantId: this.tenantId,
          userId: this.userId,
          gatewayName,
          paymentId: webhookResult.paymentId
        });
        return false;
      }

      const payment = payments[0];

      // Mapeia status do webhook
      let newStatus: Payment['status'];
      switch (webhookResult.status) {
        case 'paid':
          newStatus = 'completed';
          break;
        case 'cancelled':
          newStatus = 'failed';
          break;
        case 'processing':
          newStatus = 'processing';
          break;
        default:
          newStatus = 'pending';
      }

      // Atualiza status se necessário
      if (payment.status !== newStatus) {
        await this.updateStatus(payment.id, newStatus, {
          webhook_processed_at: new Date().toISOString(),
          webhook_event_type: webhookResult.eventType
        });
      }

      return true;

    } catch (error) {
      log.error('Erro ao processar webhook', {
        service: 'UnifiedPaymentService',
        method: 'processGatewayWebhook',
        tenantId: this.tenantId,
        userId: this.userId,
        gatewayName,
        error: error instanceof Error ? error.message : String(error)
      });
      return false;
    }
  }

  /**
   * Lista gateways disponíveis
   */
  getAvailableGateways() {
    return paymentManager.getAvailableGateways();
  }

  /**
   * Verifica se um gateway está configurado
   */
  isGatewayConfigured(gatewayName: string): boolean {
    return paymentManager.isGatewayConfigured(gatewayName);
  }
}