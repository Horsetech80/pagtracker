/**
 * EfiPay Settings Service
 * 
 * Implementa funcionalidades para consultar configurações da API EfiPay
 * através da API EfiPay.
 * 
 * Endpoints implementados:
 * - GET /v2/gn/settings - Consultar configurações da API
 * 
 * Escopos necessários:
 * - gn.settings.read - Consultar Configurações da API
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
 * Configurações PIX da conta
 */
export interface PixSettings {
  chavesPix: {
    chave: string;
    tipo: 'CPF' | 'CNPJ' | 'EMAIL' | 'TELEFONE' | 'EVP';
    status: 'ATIVA' | 'INATIVA';
    criadaEm: string;
  }[];
  limiteDiario: {
    valor: number;
    moeda: 'BRL';
  };
  limiteNoturno: {
    valor: number;
    moeda: 'BRL';
    horarioInicio: string; // HH:mm
    horarioFim: string; // HH:mm
  };
}

/**
 * Configurações de webhook
 */
export interface WebhookSettings {
  webhooks: {
    chave: string;
    url: string;
    status: 'ATIVO' | 'INATIVO';
    criadoEm: string;
  }[];
}

/**
 * Configurações da conta
 */
export interface AccountSettings {
  conta: {
    nome: string;
    documento: string;
    tipo: 'PF' | 'PJ';
    status: 'ATIVA' | 'INATIVA';
  };
  api: {
    clientId: string;
    escopos: string[];
    ambiente: 'PRODUCAO' | 'HOMOLOGACAO';
  };
}

/**
 * Response completa das configurações
 */
export interface EfiSettingsResponse {
  pix: PixSettings;
  webhooks: WebhookSettings;
  conta: AccountSettings;
  consultadoEm: string;
}

/**
 * Interface simplificada para PagTracker
 */
export interface PagTrackerSettingsRequest {
  tenantId: string;
  incluirChaves?: boolean;
  incluirWebhooks?: boolean;
  incluirConta?: boolean;
}

export interface PagTrackerSettingsResponse {
  success: boolean;
  data?: {
    configuracoes: EfiSettingsResponse;
    resumo: {
      totalChavesPix: number;
      totalWebhooks: number;
      escoposAtivos: number;
      statusConta: string;
    };
  };
  error?: string;
  details?: any;
}

// ================================================================
// SERVIÇO PRINCIPAL
// ================================================================

export class EfiPaySettingsService {
  private authService: EfiPayAuthService;
  private httpClient: AxiosInstance;
  private baseURL: string;

  constructor(authService: EfiPayAuthService) {
    this.authService = authService;
    const config = getCurrentEfiPayConfig();
    this.baseURL = config.BASE_URL;
    
    this.httpClient = axios.create({
      baseURL: this.baseURL,
      timeout: 15000,
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
   * Consultar configurações da API
   * GET /v2/gn/settings
   */
  async consultarConfiguracoes(): Promise<EfiSettingsResponse> {
    try {
      // Obter token de acesso
      const accessToken = await this.authService.getAccessToken();

      console.log('⚙️ [SETTINGS] Consultando configurações da API...');

      // Fazer requisição
      const response = await this.httpClient.get(
        '/v2/gn/settings',
        {
          headers: {
            'Authorization': `Bearer ${accessToken}`,
            'Accept': 'application/json'
          }
        }
      );

      console.log('✅ [SETTINGS] Configurações obtidas com sucesso');
      
      return response.data;
    } catch (error: any) {
      console.error('❌ [SETTINGS] Erro ao consultar configurações:', error);
      throw this.handleApiError(error);
    }
  }

  /**
   * Consultar apenas configurações PIX
   */
  async consultarConfiguracoesPix(): Promise<PixSettings> {
    try {
      const configuracoes = await this.consultarConfiguracoes();
      return configuracoes.pix;
    } catch (error: any) {
      console.error('❌ [SETTINGS] Erro ao consultar configurações PIX:', error);
      throw error;
    }
  }

  /**
   * Consultar apenas configurações de webhooks
   */
  async consultarConfiguracoesWebhooks(): Promise<WebhookSettings> {
    try {
      const configuracoes = await this.consultarConfiguracoes();
      return configuracoes.webhooks;
    } catch (error: any) {
      console.error('❌ [SETTINGS] Erro ao consultar configurações de webhooks:', error);
      throw error;
    }
  }

  /**
   * Consultar apenas configurações da conta
   */
  async consultarConfiguracoesConta(): Promise<AccountSettings> {
    try {
      const configuracoes = await this.consultarConfiguracoes();
      return configuracoes.conta;
    } catch (error: any) {
      console.error('❌ [SETTINGS] Erro ao consultar configurações da conta:', error);
      throw error;
    }
  }

  // ================================================================
  // MÉTODOS PAGTRACKER (INTERFACE SIMPLIFICADA)
  // ================================================================

  /**
   * Consultar configurações - Interface PagTracker
   */
  async consultarConfiguracoesPagTracker(
    request: PagTrackerSettingsRequest
  ): Promise<PagTrackerSettingsResponse> {
    try {
      console.log('⚙️ [PAGTRACKER-SETTINGS] Iniciando consulta:', request);

      // Consultar configurações via EfiPay
      const efiResponse = await this.consultarConfiguracoes();

      // Gerar resumo
      const resumo = {
        totalChavesPix: efiResponse.pix.chavesPix.length,
        totalWebhooks: efiResponse.webhooks.webhooks.length,
        escoposAtivos: efiResponse.conta.api.escopos.length,
        statusConta: efiResponse.conta.conta.status
      };

      // Filtrar dados conforme solicitado
      let configuracoesFiltradas = { ...efiResponse };
      
      if (request.incluirChaves === false) {
        configuracoesFiltradas.pix.chavesPix = [];
      }
      
      if (request.incluirWebhooks === false) {
        configuracoesFiltradas.webhooks.webhooks = [];
      }
      
      if (request.incluirConta === false) {
        configuracoesFiltradas.conta = {
          conta: { nome: '', documento: '', tipo: 'PF', status: 'ATIVA' },
          api: { clientId: '', escopos: [], ambiente: 'HOMOLOGACAO' }
        };
      }

      const response: PagTrackerSettingsResponse = {
        success: true,
        data: {
          configuracoes: configuracoesFiltradas,
          resumo
        }
      };

      console.log('✅ [PAGTRACKER-SETTINGS] Configurações processadas com sucesso');
      return response;
    } catch (error: any) {
      console.error('❌ [PAGTRACKER-SETTINGS] Erro:', error);
      
      return {
        success: false,
        error: error.message || 'Erro ao consultar configurações',
        details: error
      };
    }
  }

  // ================================================================
  // MÉTODOS AUXILIARES
  // ================================================================

  /**
   * Verificar se escopo está ativo
   */
  async verificarEscopo(escopo: string): Promise<boolean> {
    try {
      const configuracoes = await this.consultarConfiguracoesConta();
      return configuracoes.api.escopos.includes(escopo);
    } catch (error) {
      console.error('❌ [SETTINGS] Erro ao verificar escopo:', error);
      return false;
    }
  }

  /**
   * Listar escopos ativos
   */
  async listarEscoposAtivos(): Promise<string[]> {
    try {
      const configuracoes = await this.consultarConfiguracoesConta();
      return configuracoes.api.escopos;
    } catch (error) {
      console.error('❌ [SETTINGS] Erro ao listar escopos:', error);
      return [];
    }
  }

  /**
   * Verificar status da conta
   */
  async verificarStatusConta(): Promise<'ATIVA' | 'INATIVA'> {
    try {
      const configuracoes = await this.consultarConfiguracoesConta();
      return configuracoes.conta.status;
    } catch (error) {
      console.error('❌ [SETTINGS] Erro ao verificar status da conta:', error);
      return 'INATIVA';
    }
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
          return new Error('Acesso negado. Verifique as permissões do escopo gn.settings.read');
        case 404:
          return new Error('Configurações não encontradas');
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
  async healthCheck(): Promise<{ status: string; timestamp: string; escopos: string[] }> {
    try {
      // Verificar se consegue obter configurações
      const escopos = await this.listarEscoposAtivos();
      
      return {
        status: 'healthy',
        timestamp: new Date().toISOString(),
        escopos
      };
    } catch (error) {
      throw new Error(`Serviço indisponível: ${error}`);
    }
  }
}

// ================================================================
// EXPORT DEFAULT
// ================================================================

export default EfiPaySettingsService;