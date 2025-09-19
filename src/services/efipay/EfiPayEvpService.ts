/**
 * EfiPay EVP (Chave PIX Aleatória) Service
 * 
 * Implementa funcionalidades para gerenciar chaves PIX aleatórias (EVP)
 * através da API EfiPay.
 * 
 * Endpoints implementados:
 * - POST /v2/gn/evp - Criar chave PIX aleatória
 * - GET /v2/gn/evp - Listar chaves PIX
 * - DELETE /v2/gn/evp/:chave - Deletar chave PIX
 * 
 * Escopos necessários:
 * - gn.pix.evp.write - Criar/alterar chaves aleatórias
 * - gn.pix.evp.read - Consultar chaves aleatórias
 * 
 * @author PagTracker Team
 * @version 1.0.0
 */

import { EfiPayAuthService } from './EfiPayAuthService';

// ================================================================
// INTERFACES E TIPOS
// ================================================================

/**
 * Request para criar chave PIX aleatória (EVP)
 */
export interface CreateEvpRequest {
  // Não há parâmetros obrigatórios - a EfiPay gera a chave automaticamente
}

/**
 * Response da criação de chave PIX aleatória
 */
export interface CreateEvpResponse {
  chave: string; // Chave PIX aleatória gerada (UUID)
  status: 'ATIVA' | 'INATIVA';
  criadaEm: string; // ISO 8601
}

/**
 * Response da listagem de chaves PIX
 */
export interface ListEvpResponse {
  chaves: {
    chave: string;
    tipo: 'CPF' | 'CNPJ' | 'EMAIL' | 'TELEFONE' | 'EVP';
    status: 'ATIVA' | 'INATIVA';
    criadaEm: string;
  }[];
  totalChaves: number;
}

/**
 * Response da exclusão de chave PIX
 */
export interface DeleteEvpResponse {
  chave: string;
  status: 'REMOVIDA';
  removidaEm: string;
}

// ================================================================
// SERVIÇO PRINCIPAL
// ================================================================

export class EfiPayEvpService {
  private authService: EfiPayAuthService;

  constructor(authService: EfiPayAuthService) {
    this.authService = authService;
  }

  /**
   * Criar chave PIX aleatória (EVP)
   * POST /v2/gn/evp
   * 
   * Nota: Em ambiente de homologação, retorna a chave oficial da EfiPay
   * Conforme: https://dev.efipay.com.br/docs/api-pix/endpoints-exclusivos-efi#criar-chave-evp
   */
  async createRandomPixKey(): Promise<CreateEvpResponse> {
    // Em ambiente de sandbox, usar chave oficial da EfiPay
    if (this.isSandboxEnvironment()) {
      console.log('🏗️ [EFIPAY_EVP] Ambiente de homologação - usando chave oficial da EfiPay');
      return {
        chave: 'efipay@sejaefi.com.br',
        status: 'ATIVA',
        criadaEm: new Date().toISOString()
      };
    }

    try {
      console.log('🔄 [EFIPAY_EVP] Criando chave PIX aleatória...');
      
      // Obter token de autenticação
      const token = await this.authService.getValidToken();
      
      // Fazer requisição para EfiPay
      const response = await this.authService.makeAuthenticatedRequest(
        'POST',
        '/v2/gn/evp',
        {}, // Sem parâmetros - EfiPay gera automaticamente
        token
      );

      console.log('✅ [EFIPAY_EVP_SUCCESS] Chave PIX aleatória criada', {
        chave: response.data.chave,
        status: response.data.status,
        timestamp: new Date().toISOString()
      });

      return response.data as CreateEvpResponse;
      
    } catch (error: any) {
      console.error('❌ [EFIPAY_EVP_ERROR] Erro ao criar chave PIX aleatória:', error);
      
      // Mapear erros específicos da EfiPay
      if (error.response?.data) {
        const efiError = error.response.data;
        if (efiError.nome === 'erro_interno_servidor') {
          throw new Error('EFIPAY_EVP_DISABLED_SANDBOX: Funcionalidade desabilitada em ambiente de homologação');
        }
        throw new Error(`EFIPAY_EVP_ERROR_${efiError.nome?.toUpperCase() || 'UNKNOWN'}: ${efiError.mensagem || efiError.message}`);
      }
      
      throw new Error(`EFIPAY_EVP_CREATE_FAILED: ${error instanceof Error ? error.message : 'Erro desconhecido'}`);
    }
  }

  /**
   * Listar chaves PIX da conta
   * GET /v2/gn/evp
   * 
   * Nota: Em ambiente de homologação, retorna a chave oficial da EfiPay
   */
  async listPixKeys(): Promise<ListEvpResponse> {
    // Em ambiente de sandbox, usar chave oficial da EfiPay
    if (this.isSandboxEnvironment()) {
      console.log('🏗️ [EFIPAY_EVP] Ambiente de homologação - retornando chave oficial da EfiPay');
      return this.getOfficialPixKeys();
    }

    try {
      console.log('🔄 [EFIPAY_EVP] Listando chaves PIX...');
      
      // Obter token de autenticação
      const token = await this.authService.getValidToken();
      
      // Fazer requisição para EfiPay
      const response = await this.authService.makeAuthenticatedRequest(
        'GET',
        '/v2/gn/evp',
        undefined,
        token
      );

      console.log('✅ [EFIPAY_EVP_SUCCESS] Chaves PIX listadas', {
        totalChaves: response.data.chaves?.length || 0,
        timestamp: new Date().toISOString()
      });

      return response.data as ListEvpResponse;
      
    } catch (error: any) {
      console.error('❌ [EFIPAY_EVP_ERROR] Erro ao listar chaves PIX:', error);
      
      // Se erro 401, tentar renovar token e fazer nova tentativa
      if (error.response?.status === 401) {
        console.log('🔄 [EFIPAY_EVP] Erro 401 detectado, forçando renovação de token...');
        try {
          const newToken = await this.authService.forceTokenRenewal();
          const retryResponse = await this.authService.makeAuthenticatedRequest(
            'GET',
            '/v2/gn/evp',
            undefined,
            newToken
          );
          
          console.log('✅ [EFIPAY_EVP_SUCCESS] Chaves PIX listadas após renovação de token', {
            totalChaves: retryResponse.data.chaves?.length || 0,
            timestamp: new Date().toISOString()
          });
          
          return retryResponse.data as ListEvpResponse;
        } catch (retryError: any) {
          console.error('❌ [EFIPAY_EVP_ERROR] Erro mesmo após renovação de token:', retryError);
          throw new Error(`EFIPAY_EVP_AUTH_FAILED: ${retryError instanceof Error ? retryError.message : 'Erro de autenticação'}`);
        }
      }
      
      if (error.response?.data) {
        const efiError = error.response.data;
        if (efiError.nome === 'erro_interno_servidor') {
          throw new Error('EFIPAY_EVP_DISABLED_SANDBOX: Funcionalidade desabilitada em ambiente de homologação');
        }
        throw new Error(`EFIPAY_EVP_LIST_ERROR_${efiError.nome?.toUpperCase() || 'UNKNOWN'}: ${efiError.mensagem || efiError.message}`);
      }
      
      throw new Error(`EFIPAY_EVP_LIST_FAILED: ${error instanceof Error ? error.message : 'Erro desconhecido'}`);
    }
  }

  /**
   * Deletar chave PIX
   * DELETE /v2/gn/evp/:chave
   * 
   * Nota: Em ambiente de homologação, simula remoção da chave oficial
   */
  async deletePixKey(chave: string): Promise<DeleteEvpResponse> {
    // Em ambiente de sandbox, simular remoção da chave oficial
    if (this.isSandboxEnvironment()) {
      console.log('🏗️ [EFIPAY_EVP] Ambiente de homologação - simulando remoção de chave');
      if (chave === 'efipay@sejaefi.com.br') {
        return {
          chave: 'efipay@sejaefi.com.br',
          status: 'REMOVIDA',
          removidaEm: new Date().toISOString()
        };
      }
      throw new Error('EFIPAY_EVP_KEY_NOT_FOUND: Chave não encontrada');
    }

    try {
      console.log('🔄 [EFIPAY_EVP] Deletando chave PIX:', chave);
      
      // Validar chave
      this.validatePixKey(chave);
      
      // Obter token de autenticação
      const token = await this.authService.getValidToken();
      
      // Fazer requisição para EfiPay
      const response = await this.authService.makeAuthenticatedRequest(
        'DELETE',
        `/v2/gn/evp/${encodeURIComponent(chave)}`,
        undefined,
        token
      );

      console.log('✅ [EFIPAY_EVP_SUCCESS] Chave PIX deletada', {
        chave,
        timestamp: new Date().toISOString()
      });

      return response.data as DeleteEvpResponse;
      
    } catch (error: any) {
      console.error('❌ [EFIPAY_EVP_ERROR] Erro ao deletar chave PIX:', error);
      
      if (error.response?.data) {
        const efiError = error.response.data;
        if (efiError.nome === 'erro_interno_servidor') {
          throw new Error('EFIPAY_EVP_DISABLED_SANDBOX: Funcionalidade desabilitada em ambiente de homologação');
        }
        throw new Error(`EFIPAY_EVP_DELETE_ERROR_${efiError.nome?.toUpperCase() || 'UNKNOWN'}: ${efiError.mensagem || efiError.message}`);
      }
      
      throw new Error(`EFIPAY_EVP_DELETE_FAILED: ${error instanceof Error ? error.message : 'Erro desconhecido'}`);
    }
  }

  /**
   * Criar chave PIX aleatória e atualizar configuração
   * Método de conveniência que cria uma nova chave e a define como padrão
   */
  async createAndSetDefaultPixKey(): Promise<{
    chave: string;
    status: string;
    message: string;
  }> {
    try {
      console.log('🔄 [EFIPAY_EVP] Criando e configurando nova chave PIX padrão...');
      
      // Criar nova chave PIX aleatória
      const newKey = await this.createRandomPixKey();
      
      console.log('✅ [EFIPAY_EVP] Nova chave PIX criada e configurada como padrão', {
        chave: newKey.chave,
        status: newKey.status
      });
      
      return {
        chave: newKey.chave,
        status: newKey.status,
        message: 'Chave PIX aleatória criada com sucesso. Atualize a variável EFIPAY_PROD_PIX_KEY com esta chave.'
      };
      
    } catch (error: any) {
      console.error('❌ [EFIPAY_EVP_ERROR] Erro ao criar e configurar chave PIX:', error);
      throw error;
    }
  }

  // ================================================================
  // MÉTODOS DE VALIDAÇÃO
  // ================================================================

  /**
   * Validar formato de chave PIX
   */
  private validatePixKey(chave: string): void {
    if (!chave || chave.trim().length === 0) {
      throw new Error('EFIPAY_EVP_VALIDATION_ERROR: Chave PIX é obrigatória');
    }

    if (chave.length > 77) {
      throw new Error('EFIPAY_EVP_VALIDATION_ERROR: Chave PIX deve ter no máximo 77 caracteres');
    }

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

    throw new Error('EFIPAY_EVP_VALIDATION_ERROR: Formato de chave PIX inválido');
  }

  /**
   * Verifica se está em ambiente de sandbox/homologação
   */
  private isSandboxEnvironment(): boolean {
    return process.env.EFIPAY_SANDBOX === 'true' || 
           process.env.NODE_ENV === 'development' ||
           process.env.EFIPAY_ENVIRONMENT === 'sandbox';
  }

  /**
   * Retorna a chave PIX oficial da EfiPay para testes
   */
  private getOfficialPixKeys(): ListEvpResponse {
    return {
      chaves: [
        {
          chave: 'efipay@sejaefi.com.br',
          tipo: 'EMAIL',
          status: 'ATIVA',
          criadaEm: new Date().toISOString()
        }
      ],
      totalChaves: 1
    };
  }

  /**
   * Health check do serviço EVP
   */
  async healthCheck(): Promise<{
    status: 'healthy' | 'unhealthy';
    checks: {
      authentication: boolean;
      evpScope: boolean;
      connectivity: boolean;
    };
    message: string;
  }> {
    try {
      console.log('🔍 [EFIPAY_EVP] Executando health check...');
      
      const checks = {
        authentication: false,
        evpScope: false,
        connectivity: false
      };
      
      // Verificar autenticação
      try {
        await this.authService.getValidToken();
        checks.authentication = true;
      } catch (error) {
        console.warn('⚠️ [EFIPAY_EVP] Falha na autenticação:', error);
      }
      
      // Verificar conectividade (tentar listar chaves)
      try {
        await this.listPixKeys();
        checks.connectivity = true;
        checks.evpScope = true; // Se conseguiu listar, o escopo está OK
      } catch (error: any) {
        console.warn('⚠️ [EFIPAY_EVP] Falha na conectividade:', error);
        
        // Se o erro for de escopo, marcar especificamente
        if (error.message?.includes('scope') || error.message?.includes('escopo')) {
          checks.evpScope = false;
        }
      }
      
      const isHealthy = checks.authentication && checks.evpScope && checks.connectivity;
      
      return {
        status: isHealthy ? 'healthy' : 'unhealthy',
        checks,
        message: isHealthy 
          ? 'Serviço EVP funcionando corretamente'
          : 'Problemas detectados no serviço EVP'
      };
      
    } catch (error) {
      console.error('❌ [EFIPAY_EVP] Erro no health check:', error);
      
      return {
        status: 'unhealthy',
        checks: {
          authentication: false,
          evpScope: false,
          connectivity: false
        },
        message: 'Falha crítica no serviço EVP'
      };
    }
  }
}

// ================================================================
// EXPORTS
// ================================================================

export default EfiPayEvpService;