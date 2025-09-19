// Definindo PaymentStatus localmente por enquanto
export type PaymentStatus = 
  | 'pending'  // Aguardando pagamento
  | 'processing' // Processando
  | 'paid'     // Pago
  | 'failed'   // Falhou
  | 'cancelled' // Cancelado
  | 'refunded'; // Estornado

/**
 * Interface padrão para todos os gateways de pagamento
 * Abstrai Gerencianet, Stripe, Mercado Pago, etc.
 */
export interface PaymentGatewayInterface {
  readonly name: string;
  readonly supportedMethods: Array<'pix' | 'credit_card' | 'debit_card' | 'boleto'>;
  
  // Métodos principais que todo gateway deve implementar
  createPayment(data: CreatePaymentData): Promise<PaymentResponse>;
  getPaymentStatus(id: string): Promise<PaymentStatusResponse>;
  cancelPayment(id: string): Promise<boolean>;
  processWebhook(payload: any): Promise<WebhookResult>;
  
  // Configuração
  configure(config: GatewayConfig): void;
  isConfigured(): boolean;
}

/**
 * Dados para criar um pagamento (padrão para todos os gateways)
 */
export interface CreatePaymentData {
  amount: number; // em centavos
  description: string;
  customer: {
    email: string;
    name?: string;
    document?: string;
    phone?: string;
  };
  metadata?: Record<string, any>;
  expirationMinutes?: number;
  method: 'pix' | 'credit_card' | 'debit_card' | 'boleto';
}

/**
 * Resposta padrão de criação de pagamento
 */
export interface PaymentResponse {
  id: string;
  status: PaymentStatus;
  amount: number;
  method: string;
  
  // PIX específico
  pixCode?: string;
  pixQrCode?: string;
  
  // Cartão específico
  paymentLink?: string;
  
  // Dados do gateway original
  gatewayData: Record<string, any>;
  expiresAt?: Date;
}

/**
 * Resposta de status do pagamento
 */
export interface PaymentStatusResponse {
  id: string;
  status: PaymentStatus;
  paidAt?: Date;
  gatewayData: Record<string, any>;
}

/**
 * Resultado do processamento de webhook
 */
export interface WebhookResult {
  paymentId: string;
  status: PaymentStatus;
  eventType: string;
  processed: boolean;
}

/**
 * Configuração genérica do gateway
 */
export interface GatewayConfig {
  environment: 'sandbox' | 'production';
  credentials: Record<string, string>;
  webhookSecret?: string;
} 