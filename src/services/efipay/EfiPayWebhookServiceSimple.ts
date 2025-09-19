import { EfiPayAuthService } from './EfiPayAuthService';

/**
 * SERVIÇO WEBHOOK SIMPLIFICADO EFIPAY
 * ====================================
 * 
 * Implementação simplificada para configuração de webhooks PIX
 * conforme documentação oficial EfiPay
 */
export class EfiPayWebhookServiceSimple {
  constructor(private authService: EfiPayAuthService) {}

  /**
   * Configurar webhook para uma chave PIX
   * Endpoint: PUT /v2/webhook/{chave}
   */
  async configurarWebhook(
    chavePixKey: string,
    webhookUrl: string
  ): Promise<{ success: boolean; details?: any }> {
    try {
      console.log(`🔧 [WEBHOOK] Configurando webhook para chave: ${chavePixKey}`);
      console.log(`🔗 [WEBHOOK] URL: ${webhookUrl}`);

      // Usar cliente autenticado com certificado mTLS
      const authenticatedClient = await this.authService.createAuthenticatedAxios();
      
      const requestBody = {
        webhookUrl: webhookUrl
      };

      console.log('📤 [WEBHOOK] Enviando requisição:', JSON.stringify(requestBody, null, 2));

      const response = await authenticatedClient.put(
        `/v2/webhook/${encodeURIComponent(chavePixKey)}`,
        requestBody
      );

      console.log('✅ [WEBHOOK] Webhook configurado com sucesso:', response.data);
      
      return {
        success: true,
        details: response.data
      };

    } catch (error: any) {
      console.error('❌ [WEBHOOK] Erro ao configurar webhook:', error.response?.data || error.message);
      
      throw new Error(`Erro ao configurar webhook: ${error.message}`);
    }
  }

  /**
   * Obter webhook configurado para uma chave PIX
   * Endpoint: GET /v2/webhook/{chave}
   */
  async obterWebhook(chavePixKey: string): Promise<{ success: boolean; webhookUrl?: string; details?: any }> {
    try {
      console.log(`🔍 [WEBHOOK] Consultando webhook para chave: ${chavePixKey}`);

      const authenticatedClient = await this.authService.createAuthenticatedAxios();
      
      const response = await authenticatedClient.get(
        `/v2/webhook/${encodeURIComponent(chavePixKey)}`
      );

      console.log('✅ [WEBHOOK] Webhook encontrado:', response.data);
      
      return {
        success: true,
        webhookUrl: response.data.webhookUrl,
        details: response.data
      };

    } catch (error: any) {
      if (error.response?.status === 404) {
        console.log('ℹ️ [WEBHOOK] Nenhum webhook configurado para esta chave');
        return {
          success: false,
          details: { message: 'Webhook não configurado' }
        };
      }

      console.error('❌ [WEBHOOK] Erro ao consultar webhook:', error.response?.data || error.message);
      throw new Error(`Erro ao consultar webhook: ${error.message}`);
    }
  }

  /**
   * Configurar webhook automaticamente
   * Usa URL pública válida conforme documentação oficial
   */
  async configurarWebhookAutomatico(
    chavePixKey: string,
    baseUrl: string = 'http://localhost:3001'
  ): Promise<{ success: boolean; webhookUrl: string; details?: any }> {
    try {
      // CONFORME DOCUMENTAÇÃO OFICIAL: Webhook deve ser URL pública válida
      // Para desenvolvimento, usar servidor HTTP local
      // Em produção, usar HTTPS com mTLS conforme documentação
      const webhookUrl = `${baseUrl}/api/webhook`;

      console.log('🤖 [WEBHOOK-AUTO] Iniciando configuração automática');
      console.log(`🔑 [WEBHOOK-AUTO] Chave PIX: ${chavePixKey}`);
      console.log(`🔗 [WEBHOOK-AUTO] URL Webhook: ${webhookUrl}`);

      // Primeiro, verificar se já existe webhook configurado
      try {
        const existingWebhook = await this.obterWebhook(chavePixKey);
        if (existingWebhook.success && existingWebhook.webhookUrl) {
          console.log('✅ [WEBHOOK-AUTO] Webhook já configurado:', existingWebhook.webhookUrl);
          return {
            success: true,
            webhookUrl: existingWebhook.webhookUrl,
            details: { message: 'Webhook já existente', existing: true }
          };
        }
      } catch (consultError) {
        console.log('ℹ️ [WEBHOOK-AUTO] Webhook não existe, criando novo...');
      }

      // Configurar novo webhook
      const result = await this.configurarWebhook(chavePixKey, webhookUrl);
      
      if (result.success) {
        console.log('✅ [WEBHOOK-AUTO] Configuração automática concluída com sucesso');
        return {
          success: true,
          webhookUrl: webhookUrl,
          details: result.details
        };
      } else {
        throw new Error('Falha na configuração do webhook');
      }

    } catch (error: any) {
      console.error('❌ [WEBHOOK-AUTO] Falha na configuração automática:', error);
      throw new Error(`Erro ao configurar webhook: ${error.message}`);
    }
  }
}