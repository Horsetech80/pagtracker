import axios, { AxiosInstance } from 'axios';
import { EfiPayAuthService } from './EfiPayAuthService';
import {
  WebhookPixRequest,
  WebhookPixResponse,
  WebhookPixDetailsResponse,
  ListWebhooksPixFilters,
  ListWebhooksPixResponse,
  WebhookRecRequest,
  WebhookRecResponse,
  WebhookMtlsConfig,
  WebhookHeaders,
  WebhookPixNotification,
  PagTrackerWebhookPixRequest,
  PagTrackerWebhookPixResponse,
  PagTrackerWebhookRecRequest,
  PagTrackerWebhookRecResponse,
  WebhookPixError,
  WebhookValidationStatus,
  WebhookAuditLog,
  MtlsValidationConfig
} from '../../types/efipay';
import { BaseService } from '../core/BaseService';
import { log } from '@/lib/logger';
import { createError } from '@/lib/errors';
import { createServiceClient } from '@/lib/supabase/server';

/**
 * INTERFACES WEBHOOK CONFORME DOCUMENTAÇÃO OFICIAL EFIPAY
 * ======================================================
 */

export interface WebhookConfigRequest {
  webhookUrl: string;
}

export interface WebhookConfigResponse {
  webhookUrl: string;
  chave: string;
  criacao: string;
}

export interface WebhookListResponse {
  parametros: {
    inicio: string;
    fim: string;
    paginacao: {
      paginaAtual: number;
      itensPorPagina: number;
      quantidadeDePaginas: number;
      quantidadeTotalDeItens: number;
    };
  };
  webhooks: WebhookConfigResponse[];
}

export interface WebhookResendRequest {
  tipo: 'PIX_RECEBIDO' | 'PIX_ENVIADO' | 'DEVOLUCAO_RECEBIDA' | 'DEVOLUCAO_ENVIADA';
  e2eids: string[];
}

/**
 * EFIPAY WEBHOOK SERVICE
 * ======================
 * 
 * Gerencia webhooks PIX conforme documentação oficial:
 * https://dev.efipay.com.br/docs/api-pix/webhooks
 */
export class EfiPayWebhookService extends BaseService {
  private authService: EfiPayAuthService;
  private httpClient: AxiosInstance;
  private baseURL: string;
  private mtlsConfig: MtlsValidationConfig;

  constructor(tenantId: string, userId: string) {
    super(tenantId, userId);
    this.authService = new EfiPayAuthService(tenantId, userId);
    
    // Configurar cliente HTTP
    this.baseURL = process.env.EFIPAY_BASE_URL || 'https://api-pix.efipay.com.br';
    this.httpClient = axios.create({
      baseURL: this.baseURL,
      timeout: 30000,
      headers: {
        'Content-Type': 'application/json',
        'User-Agent': 'PagTracker-v4.0'
      }
    });

    // Configurações mTLS conforme BCB
    this.mtlsConfig = this.loadMtlsConfig();
  }

  /**
   * Remove dados sensíveis antes de retornar para o cliente
   */
  protected sanitizeOutput<T>(data: T): Partial<T> {
    return data;
  }

  /**
   * Configurar webhook para chave PIX
   * PUT /v2/webhook/:chave
   */
  async configurarWebhook(
    chavePixKey: string, 
    webhookUrl: string,
    skipMtls: boolean = true
  ): Promise<WebhookConfigResponse> {
    try {
      log.info('Configurando webhook para chave PIX', {
        service: 'EfiPayWebhookService',
        method: 'configurarWebhook',
        tenantId: this.tenantId,
        userId: this.userId,
        chavePixKey,
        webhookUrl,
        skipMtls
      });

      // Usar cliente autenticado com certificado
      const authenticatedClient = await this.authService.createAuthenticatedAxios();
      
      const request: WebhookConfigRequest = {
        webhookUrl
      };

      const headers: any = {};
      if (skipMtls) {
        headers['x-skip-mtls-checking'] = 'true';
      }

      const response = await authenticatedClient.put(
        `/v2/webhook/${encodeURIComponent(chavePixKey)}`, 
        request,
        { headers }
      );

      log.info('Webhook configurado com sucesso', {
        service: 'EfiPayWebhookService',
        method: 'configurarWebhook',
        tenantId: this.tenantId,
        userId: this.userId,
        chavePixKey,
        webhookUrl: response.data.webhookUrl
      });
      return response.data;

    } catch (error: any) {
      log.error('Erro ao configurar webhook', {
        service: 'EfiPayWebhookService',
        method: 'configurarWebhook',
        tenantId: this.tenantId,
        userId: this.userId,
        chavePixKey,
        webhookUrl,
        error
      });
      throw createError.efipay('Erro ao configurar webhook EfiPay', undefined, undefined, { chavePixKey, webhookUrl, originalError: error });
    }
  }

  /**
   * Obter informações do webhook
   * GET /v2/webhook/:chave
   */
  async obterWebhook(chavePixKey: string): Promise<WebhookConfigResponse> {
    try {
      const authenticatedClient = await this.authService.createAuthenticatedAxios();
      
      const response = await authenticatedClient.get(
        `/v2/webhook/${encodeURIComponent(chavePixKey)}`
      );

      return response.data;

    } catch (error: any) {
      this.handleApiError(error, 'Erro ao obter webhook');
    }
  }

  /**
   * Listar webhooks
   * GET /v2/webhook
   */
  async listarWebhooks(inicio: string, fim: string): Promise<WebhookListResponse> {
    try {
      const authenticatedClient = await this.authService.createAuthenticatedAxios();
      
      const response = await authenticatedClient.get('/v2/webhook', {
        params: { inicio, fim }
      });

      return response.data;

    } catch (error: any) {
      this.handleApiError(error, 'Erro ao listar webhooks');
    }
  }

  /**
   * Cancelar webhook
   * DELETE /v2/webhook/:chave
   */
  async cancelarWebhook(chavePixKey: string): Promise<void> {
    try {
      const authenticatedClient = await this.authService.createAuthenticatedAxios();
      
      await authenticatedClient.delete(
        `/v2/webhook/${encodeURIComponent(chavePixKey)}`
      );

      log.info('Webhook cancelado com sucesso', {
        service: 'EfiPayWebhookService',
        method: 'cancelarWebhook',
        tenantId: this.tenantId,
        userId: this.userId,
        chavePixKey
      });

    } catch (error: any) {
      this.handleApiError(error, 'Erro ao cancelar webhook');
    }
  }

  /**
   * Reenviar webhook
   * POST /v2/gn/webhook/reenviar
   */
  async reenviarWebhook(request: WebhookResendRequest): Promise<void> {
    try {
      const authenticatedClient = await this.authService.createAuthenticatedAxios();
      
      await authenticatedClient.post('/v2/gn/webhook/reenviar', request);

      log.info('Webhook reenviado com sucesso', {
        service: 'EfiPayWebhookService',
        method: 'reenviarWebhook',
        tenantId: this.tenantId,
        userId: this.userId,
        tipo: request.tipo,
        e2eidsCount: request.e2eids.length
      });

    } catch (error: any) {
      this.handleApiError(error, 'Erro ao reenviar webhook');
    }
  }

  /**
   * Configurar webhook automaticamente para PIX envio
   */
  async configurarWebhookAutomatico(
    chavePixKey: string,
    baseUrl: string = 'http://localhost:3000'
  ): Promise<{ success: boolean; webhookUrl: string; details?: any }> {
    // Gerar URL do webhook com HMAC conforme documentação
    const hmacSecret = 'pagtracker-efipay-webhook-secret-2024';
    const webhookUrl = `${baseUrl}/api/webhook`;

    try {
      log.info('Iniciando configuração automática de webhook', {
        service: 'EfiPayWebhookService',
        method: 'configurarWebhookAutomatico',
        tenantId: this.tenantId,
        userId: this.userId,
        chavePixKey,
        webhookUrl,
        baseUrl
      });

      // Verificar se já existe webhook para esta chave
      try {
        const existingWebhook = await this.obterWebhook(chavePixKey);
        log.info('Webhook já existe para esta chave', {
          service: 'EfiPayWebhookService',
          method: 'configurarWebhookAutomatico',
          tenantId: this.tenantId,
          userId: this.userId,
          chavePixKey,
          existingWebhookUrl: existingWebhook.webhookUrl
        });
        
        if (existingWebhook.webhookUrl === webhookUrl) {
          log.info('Webhook já está configurado corretamente', {
            service: 'EfiPayWebhookService',
            method: 'configurarWebhookAutomatico',
            tenantId: this.tenantId,
            userId: this.userId,
            chavePixKey,
            webhookUrl
          });
          return { 
            success: true, 
            webhookUrl,
            details: existingWebhook 
          };
        } else {
          log.info('Atualizando webhook existente', {
            service: 'EfiPayWebhookService',
            method: 'configurarWebhookAutomatico',
            tenantId: this.tenantId,
            userId: this.userId,
            chavePixKey,
            oldUrl: existingWebhook.webhookUrl,
            newUrl: webhookUrl
          });
        }
      } catch (error) {
        log.info('Nenhum webhook existente, criando novo', {
          service: 'EfiPayWebhookService',
          method: 'configurarWebhookAutomatico',
          tenantId: this.tenantId,
          userId: this.userId,
          chavePixKey,
          webhookUrl
        });
      }

      // Configurar webhook com skip-mTLS
      const result = await this.configurarWebhook(chavePixKey, webhookUrl, true);

      log.info('Webhook configurado automaticamente com sucesso', {
        service: 'EfiPayWebhookService',
        method: 'configurarWebhookAutomatico',
        tenantId: this.tenantId,
        userId: this.userId,
        chavePixKey,
        webhookUrl
      });
      return { 
        success: true, 
        webhookUrl,
        details: result 
      };

    } catch (error: any) {
      log.error('Falha na configuração automática de webhook', {
        service: 'EfiPayWebhookService',
        method: 'configurarWebhookAutomatico',
        tenantId: this.tenantId,
        userId: this.userId,
        chavePixKey,
        webhookUrl,
        baseUrl,
        error
      });
      return { 
        success: false, 
        webhookUrl: '',
        details: { error: error.message }
      };
    }
  }

  /**
   * Validar webhook recebido (para skip-mTLS)
   */
  validateWebhookRequest(
    request: any,
    expectedHmac: string,
    expectedIp: string = '34.193.116.226'
  ): { valid: boolean; reason?: string } {
    try {
      // 1. Validar IP conforme documentação
      const clientIp = request.headers['x-forwarded-for'] || 
                      request.connection?.remoteAddress ||
                      request.socket?.remoteAddress;

      if (clientIp !== expectedIp) {
        return { 
          valid: false, 
          reason: `IP inválido: ${clientIp} (esperado: ${expectedIp})` 
        };
      }

      // 2. Validar HMAC conforme documentação
      const urlParams = new URL(request.url, 'http://localhost').searchParams;
      const receivedHmac = urlParams.get('hmac');

      if (receivedHmac !== expectedHmac) {
        return { 
          valid: false, 
          reason: `HMAC inválido: ${receivedHmac} (esperado: ${expectedHmac})` 
        };
      }

      return { valid: true };

    } catch (error) {
      return { 
        valid: false, 
        reason: `Erro na validação: ${error instanceof Error ? error.message : 'Erro desconhecido'}` 
      };
    }
  }

  /**
   * Health check do serviço webhook
   */
  async healthCheck(): Promise<{
    status: 'healthy' | 'unhealthy';
    timestamp: string;
    service: string;
    webhooks?: number;
  }> {
    try {
      // Tentar listar webhooks dos últimos 30 dias
      const fim = new Date().toISOString();
      const inicio = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();
      
      const webhooks = await this.listarWebhooks(inicio, fim);

      return {
        status: 'healthy',
        timestamp: new Date().toISOString(),
        service: 'efipay-webhook',
        webhooks: webhooks.parametros.paginacao.quantidadeTotalDeItens
      };

    } catch (error) {
      return {
        status: 'unhealthy',
        timestamp: new Date().toISOString(),
        service: 'efipay-webhook'
      };
    }
  }

  /**
   * Tratar erros da API EfiPay Webhook
   */
  private handleApiError(error: any, context: string): never {
    if (error.response) {
      const status = error.response.status;
      const data = error.response.data;

      let errorMessage = `${context} - Status ${status}`;
      
      if (data?.error_description) {
        errorMessage += `: ${data.error_description}`;
      } else if (data?.error) {
        errorMessage += `: ${data.error}`;
      }

      // Mapear erros específicos de webhook
      switch (status) {
        case 400:
          if (data?.error === 'invalid_request') {
            errorMessage += ' (Requisição inválida - verifique URL do webhook)';
          }
          break;
        case 403:
          errorMessage += ' (Sem permissão - verifique escopo webhook.write)';
          break;
        case 404:
          errorMessage += ' (Webhook não encontrado)';
          break;
        case 503:
          errorMessage += ' (Serviço temporariamente indisponível)';
          break;
      }

      throw new Error(errorMessage);
    }

    if (error.code === 'ENOTFOUND' || error.code === 'ECONNREFUSED') {
      throw new Error(`${context} - Erro de conectividade: ${error.message}`);
    }

    throw new Error(`${context} - ${error.message || 'Erro desconhecido'}`);
  }

  // ================================================================
  // WEBHOOK PIX - CONFIGURAÇÃO E GERENCIAMENTO
  // ================================================================

  /**
   * Configurar webhook PIX
   * PUT /v2/webhook/:chave
   * 
   * Escopo necessário: webhook.write
   */
  async configurarWebhookPix(
    chave: string, 
    request: WebhookPixRequest,
    skipMtls: boolean = false
  ): Promise<WebhookPixResponse> {
    try {
      log.info('Configurando webhook PIX', {
        service: 'EfiPayWebhookService',
        method: 'configurarWebhookPix',
        tenantId: this.tenantId,
        userId: this.userId,
        chave,
        webhookUrl: request.webhookUrl,
        skipMtls
      });
      
      // Validações conforme documentação EfiPay
      this.validateChavePix(chave);
      this.validateWebhookUrl(request.webhookUrl);
      
      // Obter token de autenticação
      const token = await this.authService.getValidToken();
      
      // Headers com skip-mTLS se necessário
      const headers: WebhookHeaders = {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
        'x-skip-mtls-checking': skipMtls ? 'true' : 'false'
      };
      
      // Fazer requisição para EfiPay
      const response = await this.httpClient.put(
        `/v2/webhook/${encodeURIComponent(chave)}`,
        request,
        { headers: headers as any }
      );

      // Log de auditoria (compliance BCB)
      await this.auditLog({
        id: this.generateAuditId(),
        chave,
        webhookUrl: request.webhookUrl,
        action: 'CREATE',
        status: 'SUCCESS',
        timestamp: new Date().toISOString(),
        details: {
          requestId: this.generateRequestId(),
          responseCode: response.status,
          mtlsUsed: !skipMtls
        }
      });

      log.info('Webhook PIX configurado com sucesso', {
        service: 'EfiPayWebhookService',
        method: 'configurarWebhookPix',
        tenantId: this.tenantId,
        userId: this.userId,
        chave,
        webhookUrl: response.data.webhookUrl,
        criacao: response.data.criacao,
        responseCode: response.status
      });

      return response.data;
      
    } catch (error: any) {
      log.error('Erro ao configurar webhook PIX', {
        service: 'EfiPayWebhookService',
        method: 'configurarWebhookPix',
        tenantId: this.tenantId,
        userId: this.userId,
        chave,
        webhookUrl: request.webhookUrl,
        skipMtls,
        error: error.message || error
      });
      
      // Log de erro para auditoria
      await this.auditLog({
        id: this.generateAuditId(),
        chave,
        webhookUrl: request.webhookUrl,
        action: 'CREATE',
        status: 'FAILED',
        timestamp: new Date().toISOString(),
        details: {
          errorMessage: error.message,
          mtlsUsed: !skipMtls
        }
      });
      
      // Mapear erros específicos da EfiPay
      if (error.response?.data) {
        const efiError: WebhookPixError = error.response.data;
        throw new Error(`WEBHOOK_PIX_ERROR_${efiError.nome?.toUpperCase()}: ${efiError.mensagem}`);
      }
      
      throw new Error(`WEBHOOK_PIX_CONFIG_FAILED: ${error instanceof Error ? error.message : 'Erro desconhecido'}`);
    }
  }

  /**
   * Consultar webhook PIX específico
   * GET /v2/webhook/:chave
   * 
   * Escopo necessário: webhook.read
   */
  async consultarWebhookPix(chave: string): Promise<WebhookPixDetailsResponse> {
    try {
      log.info('Consultando webhook PIX', {
        service: 'EfiPayWebhookService',
        method: 'consultarWebhookPix',
        tenantId: this.tenantId,
        userId: this.userId,
        chave
      });
      
      // Validar chave PIX
      this.validateChavePix(chave);
      
      // Obter token de autenticação
      const token = await this.authService.getValidToken();
      
      // Fazer requisição para EfiPay
      const response = await this.httpClient.get(
        `/v2/webhook/${encodeURIComponent(chave)}`,
        {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        }
      );

      log.info('Webhook PIX consultado com sucesso', {
        service: 'EfiPayWebhookService',
        method: 'consultarWebhookPix',
        tenantId: this.tenantId,
        userId: this.userId,
        chave,
        webhookUrl: response.data.webhookUrl,
        criacao: response.data.criacao,
        responseCode: response.status
      });

      return response.data;
      
    } catch (error: any) {
      log.error('Erro ao consultar webhook PIX', {
        service: 'EfiPayWebhookService',
        method: 'consultarWebhookPix',
        tenantId: this.tenantId,
        userId: this.userId,
        chave,
        error: error.message || error
      });
      
      if (error.response?.data) {
        const efiError: WebhookPixError = error.response.data;
        throw new Error(`WEBHOOK_PIX_ERROR_${efiError.nome?.toUpperCase()}: ${efiError.mensagem}`);
      }
      
      throw new Error(`WEBHOOK_PIX_GET_FAILED: ${error instanceof Error ? error.message : 'Erro desconhecido'}`);
    }
  }

  /**
   * Listar webhooks PIX com filtros
   * GET /v2/webhook
   * 
   * Escopo necessário: webhook.read
   */
  async listarWebhooksPix(filters: ListWebhooksPixFilters): Promise<ListWebhooksPixResponse> {
    try {
      log.info('Listando webhooks PIX', {
        service: 'EfiPayWebhookService',
        method: 'listarWebhooksPix',
        tenantId: this.tenantId,
        userId: this.userId,
        filters
      });
      
      // Validar filtros obrigatórios
      this.validateDateFilters(filters.inicio, filters.fim);
      
      // Obter token de autenticação
      const token = await this.authService.getValidToken();
      
      // Construir query parameters
      const params = new URLSearchParams({
        inicio: filters.inicio,
        fim: filters.fim
      });

      if (filters.paginaAtual !== undefined) {
        params.append('paginaAtual', filters.paginaAtual.toString());
      }
      if (filters.itensPorPagina !== undefined) {
        params.append('itensPorPagina', filters.itensPorPagina.toString());
      }
      
      // Fazer requisição para EfiPay
      const response = await this.httpClient.get(
        `/v2/webhook?${params.toString()}`,
        {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        }
      );

      log.info('Webhooks PIX listados com sucesso', {
        service: 'EfiPayWebhookService',
        method: 'listarWebhooksPix',
        tenantId: this.tenantId,
        userId: this.userId,
        total: response.data.parametros.paginacao.quantidadeTotalDeItens,
        pagina: response.data.parametros.paginacao.paginaAtual,
        responseCode: response.status
      });

      return response.data;
      
    } catch (error: any) {
      log.error('Erro ao listar webhooks PIX', {
        service: 'EfiPayWebhookService',
        method: 'listarWebhooksPix',
        tenantId: this.tenantId,
        userId: this.userId,
        filters,
        error: error.message || error
      });
      
      if (error.response?.data) {
        const efiError: WebhookPixError = error.response.data;
        throw new Error(`WEBHOOK_PIX_ERROR_${efiError.nome?.toUpperCase()}: ${efiError.mensagem}`);
      }
      
      throw new Error(`WEBHOOK_PIX_LIST_FAILED: ${error instanceof Error ? error.message : 'Erro desconhecido'}`);
    }
  }

  /**
   * Cancelar webhook PIX
   * DELETE /v2/webhook/:chave
   * 
   * Escopo necessário: webhook.write
   */
  async cancelarWebhookPix(chave: string): Promise<void> {
    try {
      log.info('Cancelando webhook PIX', {
        service: 'EfiPayWebhookService',
        method: 'cancelarWebhookPix',
        tenantId: this.tenantId,
        userId: this.userId,
        chave
      });
      
      // Validar chave PIX
      this.validateChavePix(chave);
      
      // Obter token de autenticação
      const token = await this.authService.getValidToken();
      
      // Fazer requisição para EfiPay
      const response = await this.httpClient.delete(
        `/v2/webhook/${encodeURIComponent(chave)}`,
        {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        }
      );

      // Log de auditoria
      await this.auditLog({
        id: this.generateAuditId(),
        chave,
        webhookUrl: '',
        action: 'DELETE',
        status: 'SUCCESS',
        timestamp: new Date().toISOString(),
        details: {
          responseCode: response.status
        }
      });

      log.info('Webhook PIX cancelado com sucesso', {
        service: 'EfiPayWebhookService',
        method: 'cancelarWebhookPix',
        tenantId: this.tenantId,
        userId: this.userId,
        chave,
        responseCode: response.status
      });
      
    } catch (error: any) {
      log.error('Erro ao cancelar webhook PIX', {
        service: 'EfiPayWebhookService',
        method: 'cancelarWebhookPix',
        tenantId: this.tenantId,
        userId: this.userId,
        chave,
        error: error.message || error
      });
      
      // Log de erro para auditoria
      await this.auditLog({
        id: this.generateAuditId(),
        chave,
        webhookUrl: '',
        action: 'DELETE',
        status: 'FAILED',
        timestamp: new Date().toISOString(),
        details: {
          errorMessage: error.message
        }
      });
      
      if (error.response?.data) {
        const efiError: WebhookPixError = error.response.data;
        throw new Error(`WEBHOOK_PIX_ERROR_${efiError.nome?.toUpperCase()}: ${efiError.mensagem}`);
      }
      
      throw new Error(`WEBHOOK_PIX_DELETE_FAILED: ${error instanceof Error ? error.message : 'Erro desconhecido'}`);
    }
  }

  // ================================================================
  // WEBHOOK RECORRÊNCIA - CONFIGURAÇÃO
  // ================================================================

  /**
   * Configurar webhook de recorrência PIX Automático
   * PUT /v2/webhookrec
   * 
   * Escopo necessário: webhookrec.write
   */
  async configurarWebhookRecorrencia(request: WebhookRecRequest): Promise<WebhookRecResponse> {
    try {
      log.info('Configurando webhook de recorrência', {
        service: 'EfiPayWebhookService',
        method: 'configurarWebhookRecorrencia',
        tenantId: this.tenantId,
        userId: this.userId,
        webhookUrl: request.webhookUrl
      });
      
      // Validar URL do webhook
      this.validateWebhookUrl(request.webhookUrl);
      
      // Obter token de autenticação
      const token = await this.authService.getValidToken();
      
      // Fazer requisição para EfiPay
      const response = await this.httpClient.put(
        '/v2/webhookrec',
        request,
        {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        }
      );

      console.log('✅ [WEBHOOK_REC_SUCCESS] Webhook de recorrência configurado', {
        webhookUrl: response.data.webhookUrl
      });

      return response.data;
      
    } catch (error: any) {
      console.error('❌ [WEBHOOK_REC_ERROR] Erro ao configurar webhook de recorrência:', error);
      
      if (error.response?.data) {
        const efiError: WebhookPixError = error.response.data;
        throw new Error(`WEBHOOK_REC_ERROR_${efiError.nome?.toUpperCase()}: ${efiError.mensagem}`);
      }
      
      throw new Error(`WEBHOOK_REC_CONFIG_FAILED: ${error instanceof Error ? error.message : 'Erro desconhecido'}`);
    }
  }

  // ================================================================
  // MÉTODOS PAGTRACKER (INTERFACE SIMPLIFICADA)
  // ================================================================

  /**
   * Configurar webhook PIX usando interface simplificada PagTracker
   */
  async configurarWebhookPixPagTracker(
    request: PagTrackerWebhookPixRequest,
    tenantId: string
  ): Promise<PagTrackerWebhookPixResponse> {
    try {
      // Configurar webhook via EfiPay
      const efiRequest: WebhookPixRequest = {
        webhookUrl: request.webhookUrl
      };

      const efiResponse = await this.configurarWebhookPix(
        request.chave, 
        efiRequest,
        request.skipMtls || false
      );

      // Converter response para formato PagTracker
      const response: PagTrackerWebhookPixResponse = {
        success: true,
        webhook: {
          id: this.generateWebhookId(request.chave),
          chave: request.chave,
          webhookUrl: efiResponse.webhookUrl,
          criacao: efiResponse.criacao,
          status: 'ATIVO'
        },
        message: 'Webhook PIX configurado com sucesso'
      };

      return response;
      
    } catch (error: any) {
      console.error('❌ [WEBHOOK_PIX_PAGTRACKER_ERROR]:', error);
      
      const response: PagTrackerWebhookPixResponse = {
        success: false,
        webhook: {
          id: '',
          chave: request.chave,
          webhookUrl: request.webhookUrl,
          criacao: '',
          status: 'INATIVO'
        },
        message: `Erro ao configurar webhook PIX: ${error.message}`
      };

      return response;
    }
  }

  /**
   * Configurar webhook de recorrência usando interface simplificada PagTracker
   */
  async configurarWebhookRecorrenciaPagTracker(
    request: PagTrackerWebhookRecRequest,
    tenantId: string
  ): Promise<PagTrackerWebhookRecResponse> {
    try {
      // Configurar webhook via EfiPay
      const efiRequest: WebhookRecRequest = {
        webhookUrl: request.webhookUrl
      };

      const efiResponse = await this.configurarWebhookRecorrencia(efiRequest);

      // Converter response para formato PagTracker
      const response: PagTrackerWebhookRecResponse = {
        success: true,
        webhook: {
          id: this.generateWebhookId('recorrencia'),
          webhookUrl: efiResponse.webhookUrl,
          criacao: new Date().toISOString(),
          status: 'ATIVO'
        },
        message: 'Webhook de recorrência configurado com sucesso'
      };

      return response;
      
    } catch (error: any) {
      console.error('❌ [WEBHOOK_REC_PAGTRACKER_ERROR]:', error);
      
      const response: PagTrackerWebhookRecResponse = {
        success: false,
        webhook: {
          id: '',
          webhookUrl: request.webhookUrl,
          criacao: '',
          status: 'INATIVO'
        },
        message: `Erro ao configurar webhook de recorrência: ${error.message}`
      };

      return response;
    }
  }

  // ================================================================
  // VALIDAÇÕES E MÉTODOS AUXILIARES
  // ================================================================

  /**
   * Validar chave PIX conforme padrão
   */
  private validateChavePix(chave: string): void {
    if (!chave || chave.trim().length === 0) {
      throw new Error('WEBHOOK_VALIDATION_ERROR: Chave PIX é obrigatória');
    }

    if (chave.length > 77) {
      throw new Error('WEBHOOK_VALIDATION_ERROR: Chave PIX deve ter no máximo 77 caracteres');
    }

    // Validações adicionais conforme tipo de chave
    const trimmedChave = chave.trim();
    
    // CPF (11 dígitos)
    if (/^\d{11}$/.test(trimmedChave)) {
      return;
    }
    
    // CNPJ (14 dígitos)
    if (/^\d{14}$/.test(trimmedChave)) {
      return;
    }
    
    // E-mail
    if (/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmedChave)) {
      return;
    }
    
    // Telefone (+5511999999999)
    if (/^\+55\d{10,11}$/.test(trimmedChave)) {
      return;
    }
    
    // Chave aleatória (UUID)
    if (/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(trimmedChave)) {
      return;
    }

    throw new Error('WEBHOOK_VALIDATION_ERROR: Formato de chave PIX inválido');
  }

  /**
   * Validar URL do webhook
   */
  private validateWebhookUrl(webhookUrl: string): void {
    if (!webhookUrl || webhookUrl.trim().length === 0) {
      throw new Error('WEBHOOK_VALIDATION_ERROR: URL do webhook é obrigatória');
    }

    try {
      const url = new URL(webhookUrl);
      
      // Deve ser HTTPS
      if (url.protocol !== 'https:') {
        throw new Error('WEBHOOK_VALIDATION_ERROR: URL do webhook deve usar HTTPS');
      }
      
      // Validar domínio
      if (!url.hostname || url.hostname.length < 3) {
        throw new Error('WEBHOOK_VALIDATION_ERROR: Domínio inválido na URL do webhook');
      }
      
    } catch (error) {
      if (error instanceof Error && error.message.startsWith('WEBHOOK_VALIDATION_ERROR:')) {
        throw error;
      }
      throw new Error('WEBHOOK_VALIDATION_ERROR: URL do webhook inválida');
    }
  }

  /**
   * Validar filtros de data
   */
  private validateDateFilters(inicio: string, fim: string): void {
    if (!inicio || !fim) {
      throw new Error('WEBHOOK_VALIDATION_ERROR: Parâmetros inicio e fim são obrigatórios');
    }

    try {
      const startDate = new Date(inicio);
      const endDate = new Date(fim);
      
      if (isNaN(startDate.getTime()) || isNaN(endDate.getTime())) {
        throw new Error('WEBHOOK_VALIDATION_ERROR: Formato de data inválido (use RFC 3339)');
      }
      
      if (startDate >= endDate) {
        throw new Error('WEBHOOK_VALIDATION_ERROR: Data de início deve ser anterior à data de fim');
      }
      
      // Validar período máximo (30 dias)
      const diffDays = (endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24);
      if (diffDays > 30) {
        throw new Error('WEBHOOK_VALIDATION_ERROR: Período máximo permitido é de 30 dias');
      }
      
    } catch (error) {
      if (error instanceof Error && error.message.startsWith('WEBHOOK_VALIDATION_ERROR:')) {
        throw error;
      }
      throw new Error('WEBHOOK_VALIDATION_ERROR: Erro ao validar filtros de data');
    }
  }

  /**
   * Carregar configurações mTLS
   */
  private loadMtlsConfig(): MtlsValidationConfig {
    return {
      requireMtls: process.env.EFIPAY_REQUIRE_MTLS === 'true',
      allowSkipMtls: process.env.EFIPAY_ALLOW_SKIP_MTLS !== 'false',
      certificateValidation: process.env.EFIPAY_VALIDATE_CERT !== 'false',
      ipValidation: process.env.EFIPAY_VALIDATE_IP === 'true',
      hmacValidation: process.env.EFIPAY_VALIDATE_HMAC === 'true',
      efipayCertificateUrl: {
        production: 'https://certificados.efipay.com.br/webhooks/certificate-chain-prod.crt',
        homologacao: 'https://certificados.efipay.com.br/webhooks/certificate-chain-homolog.crt'
      },
      allowedIps: {
        production: ['34.193.116.226'],
        homologacao: ['34.193.116.226']
      }
    };
  }

  /**
   * Gerar ID de auditoria
   */
  private generateAuditId(): string {
    return `audit_${Date.now()}_${Math.random().toString(36).substring(2, 15)}`;
  }

  /**
   * Gerar ID de requisição
   */
  private generateRequestId(): string {
    return `req_${Date.now()}_${Math.random().toString(36).substring(2, 15)}`;
  }

  /**
   * Gerar ID de webhook
   */
  private generateWebhookId(chave: string): string {
    return `webhook_${chave}_${Date.now()}`;
  }

  /**
   * Log de auditoria para compliance
   */
  private async auditLog(auditData: WebhookAuditLog): Promise<void> {
    try {
      // Log estruturado para auditoria
      log.info('Webhook audit log', {
        service: 'efipay-webhook',
        tenantId: this.tenantId,
        userId: this.userId,
        auditId: auditData.id,
        action: auditData.action,
        chave: auditData.chave,
        webhookUrl: auditData.webhookUrl,
        status: auditData.status,
        timestamp: auditData.timestamp
      });
      
      // Persistir log de auditoria no banco de dados
      try {
        const supabase = createServiceClient();
        await supabase.from('webhook_audit_logs').insert({
          audit_id: auditData.id,
          request_id: auditData.details.requestId,
          webhook_id: this.generateWebhookId(auditData.chave),
          tenant_id: this.tenantId,
          webhook_url: auditData.webhookUrl,
          status: auditData.status,
          timestamp: auditData.timestamp,
          created_at: new Date().toISOString()
        });
      } catch (dbError) {
        log.warn('Failed to persist webhook audit log to database', { error: dbError });
      }
      
    } catch (error) {
      log.error('Failed to save webhook audit log', {
        service: 'efipay-webhook',
        tenantId: this.tenantId,
        userId: this.userId,
        auditId: auditData.id
      }, error as Error);
    }
  }
}
