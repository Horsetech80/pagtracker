import { EfiPayAuthService } from './EfiPayAuthService';
import { EfiPayWebhookService } from './EfiPayWebhookService';
import {
  PixDetailQRCodeRequest,
  PixDetailQRCodeResponse,
  PixPayQRCodeRequest,
  PixPayQRCodeResponse,
  PagTrackerDetailQRCodeRequest,
  PagTrackerDetailQRCodeResponse,
  PagTrackerPayQRCodeRequest,
  PagTrackerPayQRCodeResponse
} from '@/types/efipay';

/**
 * Serviço para operações de QR Code PIX da EfiPay
 * Implementa endpoints v2 para detalhar e pagar QR Code PIX
 */
export class EfiPayQRCodeService {
  private baseURL: string;
  private authService: EfiPayAuthService;
  private webhookService: EfiPayWebhookService;

  constructor(
    authService: EfiPayAuthService,
    webhookService: EfiPayWebhookService,
    isProduction: boolean = false
  ) {
    this.authService = authService;
    this.webhookService = webhookService;
    this.baseURL = isProduction 
      ? 'https://pix.api.efipay.com.br'
      : 'https://pix-h.api.efipay.com.br';
  }

  // ================================================================
  // MÉTODOS PRINCIPAIS - QR CODE PIX
  // ================================================================

  /**
   * Detalhar QR Code PIX
   * POST /v2/gn/qrcodes/detalhar
   * 
   * ATENÇÃO: Endpoint temporariamente indisponível para manutenção
   * Escopo gn.qrcodes.read está desativado
   */
  async detalharQRCode(request: PixDetailQRCodeRequest): Promise<PixDetailQRCodeResponse> {
    try {
      console.log('🔍 Detalhando QR Code PIX...');

      // Validar dados obrigatórios
      this.validateDetailQRCodeRequest(request);

      const accessToken = await this.authService.getAccessToken();
      
      const response = await fetch(`${this.baseURL}/v2/gn/qrcodes/detalhar`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(request)
      });

      const data = await response.json();

      if (!response.ok) {
        console.error('❌ Erro ao detalhar QR Code:', {
          status: response.status,
          error: data
        });
        
        // Tratar erros específicos
        if (response.status === 400) {
          throw new Error('Dados inválidos para detalhar QR Code');
        }
        if (response.status === 403) {
          throw new Error('Acesso negado - verifique as permissões do escopo gn.qrcodes.read');
        }
        if (response.status === 422) {
          throw new Error('QR Code inválido ou malformado');
        }
        if (response.status === 429) {
          throw new Error('Limite de requisições excedido - tente novamente em alguns segundos');
        }
        
        this.handleApiError(response.status, data.detail || data.message || 'Erro ao detalhar QR Code');
      }

      console.log('✅ QR Code detalhado com sucesso:', {
        tipoCob: data.tipoCob,
        txid: data.txid,
        status: data.status,
        valor: data.valor?.final
      });

      return data as PixDetailQRCodeResponse;
    } catch (error) {
      console.error('❌ Erro no service detalharQRCode:', error);
      throw error;
    }
  }

  /**
   * Pagar QR Code PIX
   * PUT /v2/gn/pix/:idEnvio/qrcode
   * 
   * IMPORTANTE: Requer webhook configurado para a chave do pagador
   */
  async pagarQRCode(
    idEnvio: string,
    request: PixPayQRCodeRequest
  ): Promise<PixPayQRCodeResponse> {
    try {
      console.log('💳 Pagando QR Code PIX:', { idEnvio });

      // Validar dados obrigatórios
      this.validatePayQRCodeRequest(idEnvio, request);

      // Configurar webhook para a chave do pagador (obrigatório)
      const chaveParaWebhook = request.pagador.chave;
      
      console.log('🤖 [QR-CODE-PAY] Configurando webhook obrigatório...');
      
      try {
        const webhookResult = await this.webhookService.configurarWebhookAutomatico(chaveParaWebhook);
        
        if (!webhookResult.success) {
          throw new Error(`Falha ao configurar webhook obrigatório: ${webhookResult.details}`);
        }
        
        console.log('✅ [QR-CODE-PAY] Webhook configurado:', webhookResult.webhookUrl);
      } catch (webhookError) {
        console.error('❌ [QR-CODE-PAY] Erro crítico ao configurar webhook:', webhookError);
        throw new Error('Webhook é obrigatório para pagamento de QR Code. Falha na configuração.');
      }

      const accessToken = await this.authService.getAccessToken();
      
      const response = await fetch(`${this.baseURL}/v2/gn/pix/${idEnvio}/qrcode`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(request)
      });

      const data = await response.json();

      if (!response.ok) {
        console.error('❌ Erro ao pagar QR Code:', {
          status: response.status,
          error: data
        });
        
        // Tratar erros específicos
        if (response.status === 400) {
          throw new Error('Dados inválidos para pagamento de QR Code');
        }
        if (response.status === 403) {
          throw new Error('Acesso negado - verifique as permissões do escopo gn.qrcodes.pay');
        }
        if (response.status === 422) {
          throw new Error('QR Code inválido, expirado ou já pago');
        }
        if (response.status === 429) {
          throw new Error('Limite de requisições excedido - tente novamente em alguns segundos');
        }
        
        this.handleApiError(response.status, data.detail || data.message || 'Erro ao pagar QR Code');
      }

      console.log('✅ QR Code pago com sucesso:', {
        idEnvio: data.idEnvio,
        e2eId: data.e2eId,
        status: data.status,
        valor: data.valor
      });

      return data as PixPayQRCodeResponse;
    } catch (error) {
      console.error('❌ Erro no service pagarQRCode:', error);
      throw error;
    }
  }

  // ================================================================
  // MÉTODOS PAGTRACKER - FORMATO SIMPLIFICADO
  // ================================================================

  /**
   * Detalhar QR Code PIX - formato PagTracker
   */
  async detalharQRCodePagTracker(
    request: PagTrackerDetailQRCodeRequest
  ): Promise<PagTrackerDetailQRCodeResponse> {
    try {
      // Converter formato PagTracker para EfiPay
      const efiRequest: PixDetailQRCodeRequest = {
        pixCopiaECola: request.qrCodeString
      };

      const response = await this.detalharQRCode(efiRequest);
      
      return this.convertDetailQRCodeToPagTrackerFormat(response, request);
    } catch (error) {
      console.error('❌ Erro ao detalhar QR Code PagTracker:', error);
      throw error;
    }
  }

  /**
   * Pagar QR Code PIX - formato PagTracker
   */
  async pagarQRCodePagTracker(
    request: PagTrackerPayQRCodeRequest
  ): Promise<PagTrackerPayQRCodeResponse> {
    try {
      // Converter formato PagTracker para EfiPay
      const efiRequest: PixPayQRCodeRequest = {
        pagador: {
          chave: request.payerPixKey,
          infoPagador: request.payerInfo
        },
        pixCopiaECola: request.pixCopiaECola
      };

      const response = await this.pagarQRCode(request.idEnvio, efiRequest);
      
      return this.convertPayQRCodeToPagTrackerFormat(response, request);
    } catch (error) {
      console.error('❌ Erro ao pagar QR Code PagTracker:', error);
      throw error;
    }
  }

  // ================================================================
  // MÉTODOS PRIVADOS DE CONVERSÃO E VALIDAÇÃO
  // ================================================================

  /**
   * Converter detalhamento de QR Code para formato PagTracker
   */
  private convertDetailQRCodeToPagTrackerFormat(
    response: PixDetailQRCodeResponse,
    request: PagTrackerDetailQRCodeRequest
  ): PagTrackerDetailQRCodeResponse {
    return {
      success: true,
      message: 'QR Code detalhado com sucesso',
      data: {
        chargeType: response.tipoCob,
        txid: response.txid,
        revision: response.revisao,
        createdAt: response.calendario.criacao,
        presentedAt: response.calendario.apresentacao,
        expirationTime: response.calendario.expiracao,
        status: response.status,
        payer: response.devedor ? {
          name: response.devedor.nome,
          document: response.devedor.cpf
        } : undefined,
        receiver: {
          name: response.recebedor.nome,
          document: response.recebedor.cpf
        },
        amount: Math.round(parseFloat(response.valor.final) * 100), // reais para centavos
        formattedAmount: `R$ ${parseFloat(response.valor.final).toFixed(2).replace('.', ',')}`,
        pixKey: response.chave,
        payerRequest: response.solicitacaoPagador,
        canBePaid: response.status === 'ATIVA',
        timeToExpire: response.status === 'ATIVA' ? response.calendario.expiracao : undefined
      }
    };
  }

  /**
   * Converter pagamento de QR Code para formato PagTracker
   */
  private convertPayQRCodeToPagTrackerFormat(
    response: PixPayQRCodeResponse,
    request: PagTrackerPayQRCodeRequest
  ): PagTrackerPayQRCodeResponse {
    return {
      success: true,
      data: {
        idEnvio: response.idEnvio,
        e2eId: response.e2eId,
        amount: Math.round(parseFloat(response.valor) * 100), // reais para centavos
        status: response.status,
        payerPixKey: request.payerPixKey,
        payerInfo: request.payerInfo,
        createdAt: response.horario.solicitacao,
        metadata: {
          description: request.metadata?.description,
          reference: request.metadata?.reference,
          tags: request.metadata?.tags
        }
      }
    };
  }

  /**
   * Validar request de detalhar QR Code
   */
  private validateDetailQRCodeRequest(request: PixDetailQRCodeRequest): void {
    const errors: string[] = [];

    // Validar pixCopiaECola
    if (!request.pixCopiaECola || typeof request.pixCopiaECola !== 'string') {
      errors.push('pixCopiaECola é obrigatório e deve ser uma string');
    } else {
      // Validar formato básico do QR Code PIX
      if (!request.pixCopiaECola.startsWith('00020101')) {
        errors.push('pixCopiaECola deve ser um QR Code PIX válido');
      }
      if (request.pixCopiaECola.length < 50) {
        errors.push('pixCopiaECola parece ser muito curto para um QR Code PIX válido');
      }
    }

    if (errors.length > 0) {
      throw new Error(`Dados inválidos para detalhar QR Code: ${errors.join(', ')}`);
    }
  }

  /**
   * Validar request de pagar QR Code
   */
  private validatePayQRCodeRequest(idEnvio: string, request: PixPayQRCodeRequest): void {
    const errors: string[] = [];

    // Validar idEnvio
    if (!idEnvio || typeof idEnvio !== 'string' || idEnvio.trim().length === 0) {
      errors.push('idEnvio é obrigatório');
    }

    // Validar pagador
    if (!request.pagador) {
      errors.push('pagador é obrigatório');
    } else {
      if (!request.pagador.chave || request.pagador.chave.length > 77) {
        errors.push('chave do pagador é obrigatória e deve ter no máximo 77 caracteres');
      }
      if (request.pagador.infoPagador && request.pagador.infoPagador.length > 140) {
        errors.push('infoPagador deve ter no máximo 140 caracteres');
      }
    }

    // Validar pixCopiaECola
    if (!request.pixCopiaECola || typeof request.pixCopiaECola !== 'string') {
      errors.push('pixCopiaECola é obrigatório e deve ser uma string');
    } else {
      // Validar formato básico do QR Code PIX
      if (!request.pixCopiaECola.startsWith('00020101')) {
        errors.push('pixCopiaECola deve ser um QR Code PIX válido');
      }
      if (request.pixCopiaECola.length < 50) {
        errors.push('pixCopiaECola parece ser muito curto para um QR Code PIX válido');
      }
    }

    if (errors.length > 0) {
      throw new Error(`Dados inválidos para pagar QR Code: ${errors.join(', ')}`);
    }
  }

  /**
   * Tratar erros da API EfiPay
   */
  private handleApiError(status: number, message: string): never {
    const errorMessage = `Erro ${status}: ${message}`;
    
    switch (status) {
      case 400:
        throw new Error(`Requisição inválida - ${message}`);
      case 401:
        throw new Error('Token de acesso inválido ou expirado');
      case 403:
        throw new Error(`Acesso negado - ${message}`);
      case 404:
        throw new Error('Recurso não encontrado');
      case 422:
        throw new Error(`Dados inválidos - ${message}`);
      case 429:
        throw new Error('Limite de requisições excedido');
      case 500:
        throw new Error('Erro interno do servidor EfiPay');
      default:
        throw new Error(errorMessage);
    }
  }
}

// Exportar instância singleton
let qrCodeServiceInstance: EfiPayQRCodeService | null = null;

export function getEfiPayQRCodeService(
  authService: EfiPayAuthService,
  webhookService: EfiPayWebhookService,
  isProduction: boolean = false
): EfiPayQRCodeService {
  if (!qrCodeServiceInstance) {
    qrCodeServiceInstance = new EfiPayQRCodeService(authService, webhookService, isProduction);
  }
  return qrCodeServiceInstance;
}