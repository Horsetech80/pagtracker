/**
 * EfiPay Receipts Service
 * 
 * Implementa funcionalidades para baixar comprovantes PIX
 * através da API EfiPay.
 * 
 * Endpoints implementados:
 * - GET /v2/gn/pix/:e2eId/receipt - Baixar comprovante PIX
 * 
 * Escopos necessários:
 * - gn.receipts.read - Baixar comprovante Pix
 * 
 * @author PagTracker Team
 * @version 1.0.0
 */

import { EfiPayAuthService } from './EfiPayAuthService';
import axios, { AxiosInstance } from 'axios';
import { getCurrentEfiPayConfig } from '../../config/efipay';

// ================================================================
// INTERFACES E TIPOS
// ================================================================

/**
 * Request para baixar comprovante PIX
 */
export interface PixReceiptRequest {
  e2eId: string; // ID end-to-end do PIX
}

/**
 * Response do comprovante PIX
 */
export interface PixReceiptResponse {
  comprovante: string; // Base64 do PDF do comprovante
  formato: 'PDF';
  tamanho: number; // Tamanho em bytes
  geradoEm: string; // ISO 8601
}

/**
 * Interface simplificada para PagTracker
 */
export interface PagTrackerReceiptRequest {
  e2eId: string;
  tenantId: string;
}

export interface PagTrackerReceiptResponse {
  success: boolean;
  data?: {
    comprovante: string; // Base64 do PDF
    formato: string;
    tamanho: number;
    geradoEm: string;
    downloadUrl?: string; // URL temporária para download
  };
  error?: string;
  details?: any;
}

// ================================================================
// SERVIÇO PRINCIPAL
// ================================================================

export class EfiPayReceiptsService {
  private authService: EfiPayAuthService;
  private httpClient: AxiosInstance;
  private baseURL: string;

  constructor(authService: EfiPayAuthService) {
    this.authService = authService;
    const config = getCurrentEfiPayConfig();
    this.baseURL = config.BASE_URL;
    
    this.httpClient = axios.create({
      baseURL: this.baseURL,
      timeout: 30000, // 30s para downloads
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      }
    });
  }

  // ================================================================
  // MÉTODOS CORE EFI PAY
  // ================================================================

  /**
   * Baixar comprovante PIX
   * GET /v2/gn/pix/:e2eId/receipt
   */
  async baixarComprovantePix(e2eId: string): Promise<PixReceiptResponse> {
    try {
      // Validar e2eId
      this.validateE2eId(e2eId);

      // Obter token de acesso
      const accessToken = await this.authService.getAccessToken();

      console.log('🧾 [RECEIPTS] Baixando comprovante PIX:', e2eId);

      // Fazer requisição
      const response = await this.httpClient.get(
        `/v2/gn/pix/${e2eId}/receipt`,
        {
          headers: {
            'Authorization': `Bearer ${accessToken}`,
            'Accept': 'application/json'
          }
        }
      );

      console.log('✅ [RECEIPTS] Comprovante baixado com sucesso');
      
      return response.data;
    } catch (error: any) {
      console.error('❌ [RECEIPTS] Erro ao baixar comprovante:', error);
      throw this.handleApiError(error);
    }
  }

  // ================================================================
  // MÉTODOS PAGTRACKER (INTERFACE SIMPLIFICADA)
  // ================================================================

  /**
   * Baixar comprovante PIX - Interface PagTracker
   */
  async baixarComprovantePagTracker(
    request: PagTrackerReceiptRequest
  ): Promise<PagTrackerReceiptResponse> {
    try {
      console.log('🧾 [PAGTRACKER-RECEIPTS] Iniciando download:', request);

      // Baixar comprovante via EfiPay
      const efiResponse = await this.baixarComprovantePix(request.e2eId);

      // Converter para formato PagTracker
      const response: PagTrackerReceiptResponse = {
        success: true,
        data: {
          comprovante: efiResponse.comprovante,
          formato: efiResponse.formato,
          tamanho: efiResponse.tamanho,
          geradoEm: efiResponse.geradoEm,
          downloadUrl: this.generateDownloadUrl(request.e2eId, request.tenantId)
        }
      };

      console.log('✅ [PAGTRACKER-RECEIPTS] Comprovante processado com sucesso');
      return response;
    } catch (error: any) {
      console.error('❌ [PAGTRACKER-RECEIPTS] Erro:', error);
      
      return {
        success: false,
        error: error.message || 'Erro ao baixar comprovante PIX',
        details: error
      };
    }
  }

  // ================================================================
  // MÉTODOS AUXILIARES
  // ================================================================

  /**
   * Validar ID end-to-end
   */
  private validateE2eId(e2eId: string): void {
    if (!e2eId || typeof e2eId !== 'string') {
      throw new Error('ID end-to-end é obrigatório');
    }

    // E2eId deve ter 32 caracteres
    if (e2eId.length !== 32) {
      throw new Error('ID end-to-end deve ter 32 caracteres');
    }

    // Validar formato (apenas letras e números)
    if (!/^[A-Za-z0-9]+$/.test(e2eId)) {
      throw new Error('ID end-to-end deve conter apenas letras e números');
    }
  }

  /**
   * Gerar URL temporária para download
   */
  private generateDownloadUrl(e2eId: string, tenantId: string): string {
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
    return `${baseUrl}/api/efipay/receipts/${e2eId}?tenant=${tenantId}`;
  }

  /**
   * Tratar erros da API
   */
  private handleApiError(error: any): Error {
    if (error.response) {
      const status = error.response.status;
      const data = error.response.data;
      
      switch (status) {
        case 400:
          return new Error(`Dados inválidos: ${data.mensagem || 'Verifique os parâmetros'}`);
        case 401:
          return new Error('Token de acesso inválido ou expirado');
        case 403:
          return new Error('Acesso negado. Verifique as permissões do escopo gn.receipts.read');
        case 404:
          return new Error('Comprovante não encontrado para este PIX');
        case 422:
          return new Error(`Erro de validação: ${data.mensagem || 'Dados inválidos'}`);
        case 429:
          return new Error('Muitas requisições. Tente novamente em alguns segundos');
        case 500:
          return new Error('Erro interno da EfiPay. Tente novamente mais tarde');
        default:
          return new Error(`Erro HTTP ${status}: ${data.mensagem || 'Erro desconhecido'}`);
      }
    }
    
    if (error.code === 'ECONNABORTED') {
      return new Error('Timeout na requisição. Tente novamente');
    }
    
    return new Error(error.message || 'Erro de conexão com a EfiPay');
  }

  /**
   * Health check do serviço
   */
  async healthCheck(): Promise<{ status: string; timestamp: string }> {
    try {
      // Verificar se consegue obter token
      await this.authService.getAccessToken();
      
      return {
        status: 'healthy',
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      throw new Error(`Serviço indisponível: ${error}`);
    }
  }
}

// ================================================================
// EXPORT DEFAULT
// ================================================================

export default EfiPayReceiptsService;