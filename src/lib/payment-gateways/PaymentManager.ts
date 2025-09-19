import { PaymentGatewayInterface, CreatePaymentData, PaymentResponse, PaymentStatusResponse, WebhookResult } from './PaymentGatewayInterface';
import { EfiBankGateway } from './EfiBankGateway';

/**
 * Gerenciador central de gateways de pagamento
 * Segue o padrão Strategy para selecionar o gateway adequado
 */
export class PaymentManager {
  private gateways: Map<string, PaymentGatewayInterface> = new Map();
  private defaultGateway: string = 'efi_bank';

  constructor() {
    // Registra gateways disponíveis
    this.registerGateway(new EfiBankGateway());
    
    // Futuramente adicionar:
    // this.registerGateway(new StripeGateway());
    // this.registerGateway(new MercadoPagoGateway());
  }

  /**
   * Registra um novo gateway
   */
  private registerGateway(gateway: PaymentGatewayInterface): void {
    this.gateways.set(gateway.name, gateway);
  }

  /**
   * Obtém gateway por nome
   */
  getGateway(name?: string): PaymentGatewayInterface {
    const gatewayName = name || this.defaultGateway;
    const gateway = this.gateways.get(gatewayName);
    
    if (!gateway) {
      throw new Error(`Gateway '${gatewayName}' não encontrado`);
    }
    
    return gateway;
  }

  /**
   * Lista gateways disponíveis
   */
  getAvailableGateways(): Array<{name: string, methods: string[]}> {
    return Array.from(this.gateways.entries()).map(([name, gateway]) => ({
      name,
      methods: gateway.supportedMethods
    }));
  }

  /**
   * Seleciona o melhor gateway para um método de pagamento
   */
  selectGatewayForMethod(method: 'pix' | 'credit_card' | 'debit_card' | 'boleto'): PaymentGatewayInterface {
    // Lógica de seleção inteligente
    for (const [, gateway] of this.gateways) {
      if (gateway.supportedMethods.includes(method) && gateway.isConfigured()) {
        return gateway;
      }
    }
    
    throw new Error(`Nenhum gateway configurado suporta o método: ${method}`);
  }

  /**
   * Cria um pagamento usando o gateway apropriado
   */
  async createPayment(data: CreatePaymentData, gatewayName?: string): Promise<PaymentResponse> {
    const gateway = gatewayName ? 
      this.getGateway(gatewayName) : 
      this.selectGatewayForMethod(data.method);
    
    return gateway.createPayment(data);
  }

  /**
   * Consulta status de um pagamento
   */
  async getPaymentStatus(paymentId: string, gatewayName?: string): Promise<PaymentStatusResponse> {
    const gateway = this.getGateway(gatewayName);
    return gateway.getPaymentStatus(paymentId);
  }

  /**
   * Cancela um pagamento
   */
  async cancelPayment(paymentId: string, gatewayName?: string): Promise<boolean> {
    const gateway = this.getGateway(gatewayName);
    return gateway.cancelPayment(paymentId);
  }

  /**
   * Processa webhook de qualquer gateway
   */
  async processWebhook(payload: any, gatewayName: string): Promise<WebhookResult> {
    const gateway = this.getGateway(gatewayName);
    return gateway.processWebhook(payload);
  }

  /**
   * Configura um gateway específico
   */
  configureGateway(gatewayName: string, config: any): void {
    const gateway = this.getGateway(gatewayName);
    gateway.configure(config);
  }

  /**
   * Verifica se um gateway está configurado
   */
  isGatewayConfigured(gatewayName: string): boolean {
    try {
      const gateway = this.getGateway(gatewayName);
      return gateway.isConfigured();
    } catch {
      return false;
    }
  }
}

// Singleton para uso global
export const paymentManager = new PaymentManager(); 