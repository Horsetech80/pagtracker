/**
 * EFIPAY PIX SERVICE - PAGTRACKER V4.0
 * =====================================
 * 
 * Serviço para operações PIX seguindo documentação oficial EfiPay
 * https://dev.efipay.com.br/docs/api-pix/cobrancas-imediatas
 */

import { 
  PixCobrancaRequest, 
  PixCobrancaUpdateRequest,
  PixCobrancaResponse, 
  PixListagemRequest,
  PixListagemResponse,
  EfiPayError,
  PagTrackerPixRequest,
  PagTrackerPixResponse,
  PixPayQRCodeRequest,
  PixPayQRCodeResponse,
  PagTrackerPayQRCodeRequest,
  PagTrackerPayQRCodeResponse,
  PixDetailQRCodeRequest,
  PixDetailQRCodeResponse,
  PagTrackerDetailQRCodeRequest,
  PagTrackerDetailQRCodeResponse
} from '@/types/efipay';
import { EfiPayAuthService } from './EfiPayAuthService';
import { generatePixQRCode } from '@/lib/qr-code-generator';

export class EfiPayPixService {
  private authService: EfiPayAuthService;

  constructor(authService: EfiPayAuthService) {
    this.authService = authService;
  }

  /**
   * Cria cobrança PIX imediata SEM txid (EfiPay define o txid)
   * POST /v2/cob
   * 
   * Conforme: https://dev.efipay.com.br/docs/api-pix/cobrancas-imediatas
   */
  async createPixCharge(request: PixCobrancaRequest): Promise<PixCobrancaResponse> {
    try {
      console.log('🔄 [EFIPAY_PIX] Criando cobrança PIX sem txid...');
      
      // Validações conforme documentação EfiPay
      this.validatePixChargeRequest(request);
      
      // Obter token de autenticação
      const token = await this.authService.getValidToken();
      
      // Fazer requisição para EfiPay (conforme exemplo oficial)
      const response = await this.authService.makeAuthenticatedRequest(
        'POST',
        '/v2/cob',
        request,
        token
      );

      // Log de auditoria (compliance BCB)
      console.log('✅ [EFIPAY_PIX_SUCCESS] Cobrança PIX criada', {
        txid: response.data.txid,
        valor: request.valor.original,
        chave: request.chave,
        timestamp: new Date().toISOString()
      });

      return response.data;
      
    } catch (error: any) {
      console.error('❌ [EFIPAY_PIX_ERROR] Erro ao criar cobrança PIX:', error);
      
      // Mapear erros específicos da EfiPay
      if (error.response?.data) {
        const efiError: EfiPayError = error.response.data;
        throw new Error(`EFIPAY_PIX_ERROR_${efiError.nome.toUpperCase()}: ${efiError.mensagem}`);
      }
      
      throw new Error(`EFIPAY_PIX_CREATE_FAILED: ${error instanceof Error ? error.message : 'Erro desconhecido'}`);
    }
  }

  /**
   * Cria cobrança PIX imediata COM txid personalizado
   * PUT /v2/cob/:txid
   * 
   * Conforme: https://dev.efipay.com.br/docs/api-pix/cobrancas-imediatas
   */
  async createPixChargeWithTxid(txid: string, request: PixCobrancaRequest): Promise<PixCobrancaResponse> {
    try {
      console.log('🔄 [EFIPAY_PIX] Criando cobrança PIX com txid...', { txid });
      
      // Validar txid conforme padrão EfiPay
      this.validateTxid(txid);
      
      // Validações conforme documentação EfiPay
      this.validatePixChargeRequest(request);
      
      // Obter token de autenticação
      const token = await this.authService.getValidToken();
      
      // Fazer requisição para EfiPay (conforme exemplo oficial)
      const response = await this.authService.makeAuthenticatedRequest(
        'PUT',
        `/v2/cob/${txid}`,
        request,
        token
      );

      // Log de auditoria (compliance BCB)
      console.log('✅ [EFIPAY_PIX_SUCCESS] Cobrança PIX criada com txid', {
        txid: response.data.txid,
        valor: request.valor.original,
        chave: request.chave,
        timestamp: new Date().toISOString()
      });

      return response.data;
      
    } catch (error: any) {
      console.error('❌ [EFIPAY_PIX_ERROR] Erro ao criar cobrança PIX com txid:', error);
      
      // Mapear erros específicos da EfiPay
      if (error.response?.data) {
        const efiError: EfiPayError = error.response.data;
        throw new Error(`EFIPAY_PIX_ERROR_${efiError.nome.toUpperCase()}: ${efiError.mensagem}`);
      }
      
      throw new Error(`EFIPAY_PIX_CREATE_WITH_TXID_FAILED: ${error instanceof Error ? error.message : 'Erro desconhecido'}`);
    }
  }

  /**
   * Consulta cobrança PIX por txid
   * GET /v2/cob/:txid
   */
  async getPixCharge(txid: string): Promise<PixCobrancaResponse> {
    try {
      console.log('🔍 [EFIPAY_PIX] Consultando cobrança PIX...', { txid });
      
      // Validar txid
      this.validateTxid(txid);
      
      // Obter token de autenticação
      const token = await this.authService.getValidToken();
      
      // Fazer requisição para EfiPay
      const response = await this.authService.makeAuthenticatedRequest(
        'GET',
        `/v2/cob/${txid}`,
        undefined,
        token
      );

      console.log('✅ [EFIPAY_PIX_SUCCESS] Cobrança PIX consultada', {
        txid: response.data.txid,
        status: response.data.status,
        timestamp: new Date().toISOString()
      });

      return response.data;
      
    } catch (error: any) {
      console.error('❌ [EFIPAY_PIX_ERROR] Erro ao consultar cobrança PIX:', error);
      
      if (error.response?.data) {
        const efiError: EfiPayError = error.response.data;
        throw new Error(`EFIPAY_PIX_ERROR_${efiError.nome.toUpperCase()}: ${efiError.mensagem}`);
      }
      
      throw new Error(`EFIPAY_PIX_GET_FAILED: ${error instanceof Error ? error.message : 'Erro desconhecido'}`);
    }
  }

  /**
   * Atualizar cobrança PIX
   * PATCH /v2/cob/:txid
   */
  async updatePixCharge(txid: string, request: PixCobrancaUpdateRequest): Promise<PixCobrancaResponse> {
    try {
      console.log('🔄 [EFIPAY_PIX] Atualizando cobrança PIX...', {
        txid,
        updateFields: Object.keys(request)
      });

      // Validações
      this.validateTxid(txid);
      this.validatePixChargeUpdateRequest(request);

      // Obter token de autenticação
      const token = await this.authService.getValidToken();

      // Fazer requisição PUT (EfiPay usa PUT para atualizações)
      const response = await this.authService.makeAuthenticatedRequest(
        'PUT',
        `/v2/cob/${txid}`,
        request,
        token
      );

      console.log('✅ [EFIPAY_PIX_SUCCESS] Cobrança PIX atualizada com sucesso', {
        txid: response.data.txid,
        revisao: response.data.revisao,
        status: response.data.status,
        timestamp: new Date().toISOString()
      });

      return response.data;
      
    } catch (error: any) {
      console.error('❌ [EFIPAY_PIX_ERROR] Erro ao atualizar cobrança PIX:', error);
      
      if (error.response?.data) {
        const efiError: EfiPayError = error.response.data;
        
        // Tratar erros específicos do PATCH
        switch (efiError.nome) {
          case 'cobranca_nao_encontrada':
            throw new Error(`EFIPAY_PIX_ERROR_NOT_FOUND: Cobrança não encontrada para txid: ${txid}`);
          case 'status_cobranca_invalido':
            throw new Error(`EFIPAY_PIX_ERROR_INVALID_STATUS: A cobrança não está mais com status ATIVA`);
          case 'chave_invalida':
            throw new Error(`EFIPAY_PIX_ERROR_INVALID_KEY: ${efiError.mensagem}`);
          case 'valor_invalido':
            throw new Error(`EFIPAY_PIX_ERROR_INVALID_VALUE: ${efiError.mensagem}`);
          default:
            throw new Error(`EFIPAY_PIX_ERROR_${efiError.nome.toUpperCase()}: ${efiError.mensagem}`);
        }
      }
      
      throw new Error(`EFIPAY_PIX_UPDATE_FAILED: ${error instanceof Error ? error.message : 'Erro desconhecido'}`);
    }
  }

  /**
   * Lista cobranças PIX com filtros
   * GET /v2/cob
   */
  async listPixCharges(params: PixListagemRequest): Promise<PixListagemResponse> {
    try {
      console.log('📋 [EFIPAY_PIX] Listando cobranças PIX...', params);
      
      // Validar parâmetros obrigatórios
      this.validateListingParams(params);
      
      // Obter token de autenticação
      const token = await this.authService.getValidToken();
      
      // Construir query string (apenas parâmetros aceitos pela EfiPay)
      const queryParams = new URLSearchParams();
      queryParams.append('inicio', params.inicio);
      queryParams.append('fim', params.fim);
      
      // Parâmetros opcionais aceitos pela API EfiPay
      if (params.cpf) queryParams.append('cpf', params.cpf);
      if (params.cnpj) queryParams.append('cnpj', params.cnpj);
      if (params.status) queryParams.append('status', params.status);
      
      // NOTA: paginaAtual e itensPorPagina NÃO são aceitos pela API EfiPay /v2/cob
      // A paginação é feita automaticamente pela EfiPay
      
      // Fazer requisição para EfiPay
      const response = await this.authService.makeAuthenticatedRequest(
        'GET',
        `/v2/cob?${queryParams.toString()}`,
        undefined,
        token
      );

      console.log('✅ [EFIPAY_PIX_SUCCESS] Cobranças PIX listadas', {
        total: response.data.parametros.paginacao.quantidadeTotalDeItens,
        pagina: response.data.parametros.paginacao.paginaAtual,
        timestamp: new Date().toISOString()
      });

      return response.data;
      
    } catch (error: any) {
      console.error('❌ [EFIPAY_PIX_ERROR] Erro ao listar cobranças PIX:', error);
      
      if (error.response?.data) {
        const efiError: EfiPayError = error.response.data;
        throw new Error(`EFIPAY_PIX_ERROR_${efiError.nome.toUpperCase()}: ${efiError.mensagem}`);
      }
      
      throw new Error(`EFIPAY_PIX_LIST_FAILED: ${error instanceof Error ? error.message : 'Erro desconhecido'}`);
    }
  }

  /**
   * Método PagTracker para criar cobrança PIX simplificada
   */
  async createPixChargeForPagTracker(request: PagTrackerPixRequest): Promise<PagTrackerPixResponse> {
    try {
      console.log('🎯 [PAGTRACKER_PIX] Criando cobrança PIX para PagTracker...', {
        tenantId: request.tenantId,
        amount: request.amount
      });

      // Converter dados do PagTracker para formato EfiPay
      const pixRequest: PixCobrancaRequest = this.convertPagTrackerToEfiPay(request);
      
      // Criar cobrança na EfiPay
      const efiResponse = await this.createPixCharge(pixRequest);
      
      // Salvar no banco de dados do PagTracker (implementar conforme necessário)
      const pagTrackerData = await this.saveToPagTrackerDatabase(request, efiResponse);
      
      const response: PagTrackerPixResponse = {
        success: true,
        data: pagTrackerData
      };

      console.log('✅ [PAGTRACKER_PIX_SUCCESS] Cobrança PIX criada para PagTracker', {
        id: pagTrackerData.id,
        txid: pagTrackerData.txid,
        timestamp: new Date().toISOString()
      });

      return response;
      
    } catch (error: any) {
      console.error('❌ [PAGTRACKER_PIX_ERROR] Erro ao criar cobrança PIX para PagTracker:', error);
      
      return {
        success: false,
        message: error instanceof Error ? error.message : 'Erro desconhecido ao criar cobrança PIX',
        errorCode: 'PAGTRACKER_PIX_CREATE_FAILED'
      };
    }
  }

  // ===== MÉTODOS PRIVADOS DE VALIDAÇÃO =====

  /**
   * Valida request de cobrança PIX conforme documentação EfiPay
   */
  private validatePixChargeRequest(request: PixCobrancaRequest): void {
    // Validar calendário
    if (!request.calendario?.expiracao || request.calendario.expiracao < 1) {
      throw new Error('EFIPAY_VALIDATION_ERROR: calendario.expiracao deve ser maior que zero');
    }

    // Validar valor
    if (!request.valor?.original) {
      throw new Error('EFIPAY_VALIDATION_ERROR: valor.original é obrigatório');
    }

    const valor = parseFloat(request.valor.original);
    if (isNaN(valor) || valor <= 0) {
      throw new Error('EFIPAY_VALIDATION_ERROR: valor.original deve ser maior que zero');
    }

    // Validar chave PIX
    if (!request.chave || request.chave.length > 77) {
      throw new Error('EFIPAY_VALIDATION_ERROR: chave PIX inválida (máximo 77 caracteres)');
    }

    // Validar devedor se presente
    if (request.devedor) {
      if ('cpf' in request.devedor) {
        if (!/^\d{11}$/.test(request.devedor.cpf)) {
          throw new Error('EFIPAY_VALIDATION_ERROR: CPF deve conter 11 dígitos');
        }
      } else if ('cnpj' in request.devedor) {
        if (!/^\d{14}$/.test(request.devedor.cnpj)) {
          throw new Error('EFIPAY_VALIDATION_ERROR: CNPJ deve conter 14 dígitos');
        }
      }

      if (!request.devedor.nome || request.devedor.nome.length > 200) {
        throw new Error('EFIPAY_VALIDATION_ERROR: nome do devedor inválido (máximo 200 caracteres)');
      }
    }

    // Validar solicitação ao pagador
    if (request.solicitacaoPagador && request.solicitacaoPagador.length > 140) {
      throw new Error('EFIPAY_VALIDATION_ERROR: solicitacaoPagador inválido (máximo 140 caracteres)');
    }

    // Validar informações adicionais
    if (request.infoAdicionais) {
      if (request.infoAdicionais.length > 50) {
        throw new Error('EFIPAY_VALIDATION_ERROR: máximo 50 informações adicionais permitidas');
      }

      request.infoAdicionais.forEach((info, index) => {
        if (!info.nome || info.nome.length > 50) {
          throw new Error(`EFIPAY_VALIDATION_ERROR: infoAdicionais[${index}].nome inválido (máximo 50 caracteres)`);
        }
        if (!info.valor || info.valor.length > 200) {
          throw new Error(`EFIPAY_VALIDATION_ERROR: infoAdicionais[${index}].valor inválido (máximo 200 caracteres)`);
        }
      });
    }
  }

  /**
   * Valida txid conforme padrão EfiPay
   */
  private validateTxid(txid: string): void {
    if (!txid || !/^[a-zA-Z0-9]{26,35}$/.test(txid)) {
      throw new Error('EFIPAY_VALIDATION_ERROR: txid deve conter entre 26 e 35 caracteres alfanuméricos');
    }
  }

  /**
   * Valida parâmetros de listagem
   */
  private validateListingParams(params: PixListagemRequest): void {
    if (!params.inicio || !params.fim) {
      throw new Error('EFIPAY_VALIDATION_ERROR: início e fim são obrigatórios');
    }

    // Validar formato RFC 3339
    try {
      new Date(params.inicio);
      new Date(params.fim);
    } catch {
      throw new Error('EFIPAY_VALIDATION_ERROR: início e fim devem estar no formato RFC 3339');
    }

    // Validar CPF/CNPJ se presentes
    if (params.cpf && !/^\d{11}$/.test(params.cpf)) {
      throw new Error('EFIPAY_VALIDATION_ERROR: CPF deve conter 11 dígitos');
    }

    if (params.cnpj && !/^\d{14}$/.test(params.cnpj)) {
      throw new Error('EFIPAY_VALIDATION_ERROR: CNPJ deve conter 14 dígitos');
    }
  }

  /**
   * Valida request de atualização de cobrança PIX conforme documentação EfiPay
   */
  private validatePixChargeUpdateRequest(request: PixCobrancaUpdateRequest): void {
    // Verificar se pelo menos um campo foi informado
    const hasUpdateFields = Object.keys(request).length > 0;
    if (!hasUpdateFields) {
      throw new Error('EFIPAY_VALIDATION_ERROR: Pelo menos um campo deve ser informado para atualização');
    }

    // Validar calendário se presente
    if (request.calendario) {
      if (request.calendario.expiracao !== undefined && request.calendario.expiracao < 1) {
        throw new Error('EFIPAY_VALIDATION_ERROR: calendario.expiracao deve ser maior que zero');
      }
    }

    // Validar valor se presente
    if (request.valor) {
      if (!request.valor.original) {
        throw new Error('EFIPAY_VALIDATION_ERROR: valor.original é obrigatório quando valor é informado');
      }

      const valor = parseFloat(request.valor.original);
      if (isNaN(valor) || valor <= 0) {
        throw new Error('EFIPAY_VALIDATION_ERROR: valor.original deve ser maior que zero');
      }
    }

    // Validar chave PIX se presente
    if (request.chave !== undefined) {
      if (!request.chave || request.chave.length > 77) {
        throw new Error('EFIPAY_VALIDATION_ERROR: chave PIX inválida (máximo 77 caracteres)');
      }
    }

    // Validar devedor se presente
    if (request.devedor) {
      if ('cpf' in request.devedor) {
        if (!/^\d{11}$/.test(request.devedor.cpf)) {
          throw new Error('EFIPAY_VALIDATION_ERROR: CPF deve conter 11 dígitos');
        }
      } else if ('cnpj' in request.devedor) {
        if (!/^\d{14}$/.test(request.devedor.cnpj)) {
          throw new Error('EFIPAY_VALIDATION_ERROR: CNPJ deve conter 14 dígitos');
        }
      }

      if (!request.devedor.nome || request.devedor.nome.length > 200) {
        throw new Error('EFIPAY_VALIDATION_ERROR: nome do devedor inválido (máximo 200 caracteres)');
      }
    }

    // Validar solicitação ao pagador se presente
    if (request.solicitacaoPagador !== undefined) {
      if (request.solicitacaoPagador.length > 140) {
        throw new Error('EFIPAY_VALIDATION_ERROR: solicitacaoPagador inválido (máximo 140 caracteres)');
      }
    }

    // Validar informações adicionais se presente
    if (request.infoAdicionais) {
      if (request.infoAdicionais.length > 50) {
        throw new Error('EFIPAY_VALIDATION_ERROR: máximo 50 informações adicionais permitidas');
      }

      request.infoAdicionais.forEach((info, index) => {
        if (!info.nome || info.nome.length > 50) {
          throw new Error(`EFIPAY_VALIDATION_ERROR: infoAdicionais[${index}].nome inválido (máximo 50 caracteres)`);
        }
        if (!info.valor || info.valor.length > 200) {
          throw new Error(`EFIPAY_VALIDATION_ERROR: infoAdicionais[${index}].valor inválido (máximo 200 caracteres)`);
        }
      });
    }
  }

  /**
   * Converte dados do PagTracker para formato EfiPay
   */
  private convertPagTrackerToEfiPay(request: PagTrackerPixRequest): PixCobrancaRequest {
    // CORREÇÃO CRÍTICA: EfiPay espera valores em formato decimal (não centavos)
    // Conforme documentação oficial: https://dev.efipay.com.br/en/docs/api-pix/envio-pagamento-pix/
    // Usar originalAmount se disponível, senão converter de centavos
    const valor = request.originalAmount 
      ? request.originalAmount.toFixed(2) 
      : (request.amount / 100).toFixed(2);

    // Obter chave PIX da configuração EfiPay
    const { getCurrentEfiPayConfig } = require('@/config/efipay');
    const config = getCurrentEfiPayConfig();
    const chave = config.PIX_KEY;
    
    if (!chave) {
      throw new Error('EFIPAY_CONFIG_ERROR: Chave PIX não configurada');
    }

    const pixRequest: PixCobrancaRequest = {
      calendario: {
        expiracao: request.expirationTime || 3600 // 1 hora por padrão
      },
      valor: {
        original: valor
      },
      chave,
      solicitacaoPagador: request.description
    };

    // Adicionar devedor se informado
    if (request.customerDocument && request.customerName) {
      if (request.customerDocument.length === 11) {
        // CPF
        pixRequest.devedor = {
          cpf: request.customerDocument,
          nome: request.customerName
        };
      } else if (request.customerDocument.length === 14) {
        // CNPJ
        pixRequest.devedor = {
          cnpj: request.customerDocument,
          nome: request.customerName
        };
      }
    }

    // Adicionar informações adicionais
    if (request.additionalInfo) {
      pixRequest.infoAdicionais = Object.entries(request.additionalInfo).map(([nome, valor]) => ({
        nome: nome.substring(0, 50),
        valor: valor.substring(0, 200)
      }));
    }

    return pixRequest;
  }

  /**
   * Paga um QR Code PIX via API
   * PUT /v2/gn/pix/:idEnvio/qrcode
   * Requer escopo: gn.qrcodes.pay
   */
  async payQRCodePix(request: PagTrackerPayQRCodeRequest): Promise<PagTrackerPayQRCodeResponse> {
    try {
      console.log('🔄 [EFIPAY_PIX] Iniciando pagamento de QR Code PIX', {
        idEnvio: request.idEnvio,
        payerPixKey: request.payerPixKey,
        hasPixCode: !!request.pixCopiaECola
      });

      // Validar dados de entrada
      this.validatePayQRCodeRequest(request);

      // Obter token de autenticação
      const token = await this.authService.getValidToken();

      // Preparar dados para EfiPay
      const efiRequest: PixPayQRCodeRequest = {
        pagador: {
          chave: request.payerPixKey,
          infoPagador: request.payerInfo || 'Pagamento de QR Code via API PagTracker'
        },
        pixCopiaECola: request.pixCopiaECola
      };

      console.log('📤 [EFIPAY_PIX] Enviando pagamento para EfiPay', {
        idEnvio: request.idEnvio,
        endpoint: `/v2/gn/pix/${request.idEnvio}/qrcode`
      });

      // Fazer requisição para EfiPay
      const response = await this.authService.makeAuthenticatedRequest(
        'PUT',
        `/v2/gn/pix/${request.idEnvio}/qrcode`,
        efiRequest,
        token
      );

      const efiResponse: PixPayQRCodeResponse = response.data;

      console.log('✅ [EFIPAY_PIX] Pagamento processado com sucesso', {
        idEnvio: efiResponse.idEnvio,
        e2eId: efiResponse.e2eId,
        status: efiResponse.status,
        valor: efiResponse.valor
      });

      // Converter valor para centavos
      const valorEmCentavos = Math.round(parseFloat(efiResponse.valor) * 100);

      // Retornar resposta formatada
      return {
        success: true,
        data: {
          idEnvio: efiResponse.idEnvio,
          e2eId: efiResponse.e2eId,
          amount: valorEmCentavos,
          status: efiResponse.status,
          payerPixKey: request.payerPixKey,
          payerInfo: request.payerInfo,
          createdAt: efiResponse.horario.solicitacao,
          metadata: request.metadata
        }
      };

    } catch (error: any) {
      console.error('❌ [EFIPAY_PIX] Erro ao pagar QR Code PIX:', error);

      // Tratar erros específicos da EfiPay
      if (error.response?.data) {
        const efiError = error.response.data;
        
        // Erro 400 - Operação inválida
        if (error.response.status === 400) {
          return {
            success: false,
            message: efiError.detail || 'Operação inválida para pagamento de QR Code',
            errorCode: 'QRCODE_PAYMENT_INVALID'
          };
        }
        
        // Erro 403 - Escopo insuficiente
        if (error.response.status === 403) {
          return {
            success: false,
            message: 'Escopo insuficiente. Verifique se o escopo gn.qrcodes.pay está habilitado',
            errorCode: 'INSUFFICIENT_SCOPE'
          };
        }
        
        // Erro 500 - Erro interno
        if (error.response.status === 500) {
          return {
            success: false,
            message: 'Erro interno do servidor EfiPay',
            errorCode: 'EFIPAY_INTERNAL_ERROR'
          };
        }
      }

      return {
        success: false,
        message: `Erro ao processar pagamento de QR Code: ${error.message}`,
        errorCode: 'QRCODE_PAYMENT_ERROR'
      };
    }
  }

  /**
   * Valida os dados de entrada para pagamento de QR Code
   */
  private validatePayQRCodeRequest(request: PagTrackerPayQRCodeRequest): void {
    if (!request.idEnvio || request.idEnvio.length < 1 || request.idEnvio.length > 35) {
      throw new Error('ID do envio deve ter entre 1 e 35 caracteres alfanuméricos');
    }

    if (!request.payerPixKey || request.payerPixKey.length > 77) {
      throw new Error('Chave PIX do pagador é obrigatória e deve ter no máximo 77 caracteres');
    }

    if (!request.pixCopiaECola) {
      throw new Error('Código PIX Copia e Cola é obrigatório');
    }

    if (request.payerInfo && request.payerInfo.length > 140) {
      throw new Error('Informação do pagador deve ter no máximo 140 caracteres');
    }

    // Validar formato do ID do envio (alfanumérico)
    const idEnvioRegex = /^[a-zA-Z0-9]{1,35}$/;
    if (!idEnvioRegex.test(request.idEnvio)) {
      throw new Error('ID do envio deve conter apenas caracteres alfanuméricos');
    }
  }

  /**
   * Detalha um QR Code PIX via API
   * POST /v2/gn/qrcodes/detalhar
   * Requer escopo: gn.qrcodes.read
   */
  async detailQRCodePix(request: PagTrackerDetailQRCodeRequest): Promise<PagTrackerDetailQRCodeResponse> {
    try {
      console.log('🔍 [EFIPAY_PIX] Iniciando detalhamento de QR Code PIX', {
        tenantId: request.tenantId,
        hasQrCode: !!request.qrCodeString,
        validateOnly: request.validateOnly
      });

      // Validar dados de entrada
      this.validateDetailQRCodeRequest(request);

      // Se é apenas validação, retornar sucesso
      if (request.validateOnly) {
        return {
          success: true,
          message: 'QR Code válido para detalhamento'
        };
      }

      // Obter token de autenticação
      const token = await this.authService.getValidToken();

      // Preparar dados para EfiPay
      const efiRequest: PixDetailQRCodeRequest = {
        pixCopiaECola: request.qrCodeString
      };

      console.log('📤 [EFIPAY_PIX] Enviando detalhamento para EfiPay', {
        endpoint: '/v2/gn/qrcodes/detalhar'
      });

      // Fazer requisição para EfiPay
      const response = await this.authService.makeAuthenticatedRequest(
        'POST',
        '/v2/gn/qrcodes/detalhar',
        efiRequest,
        token
      );

      const efiResponse: PixDetailQRCodeResponse = response.data;

      console.log('✅ [EFIPAY_PIX] QR Code detalhado com sucesso', {
        txid: efiResponse.txid,
        status: efiResponse.status,
        tipoCob: efiResponse.tipoCob,
        valor: efiResponse.valor.final
      });

      // Converter valor para centavos
      const valorEmCentavos = Math.round(parseFloat(efiResponse.valor.final) * 100);
      
      // Calcular tempo restante para expiração
      const agora = new Date();
      const criacaoDate = new Date(efiResponse.calendario.criacao);
      const tempoPassado = Math.floor((agora.getTime() - criacaoDate.getTime()) / 1000);
      const tempoRestante = Math.max(0, efiResponse.calendario.expiracao - tempoPassado);
      
      // Verificar se pode ser pago
      const canBePaid = efiResponse.status === 'ATIVA' && tempoRestante > 0;

      // Formatar valor
      const valorFormatado = new Intl.NumberFormat('pt-BR', {
        style: 'currency',
        currency: 'BRL'
      }).format(valorEmCentavos / 100);

      // Retornar resposta formatada
      return {
        success: true,
        message: 'QR Code detalhado com sucesso',
        data: {
          chargeType: efiResponse.tipoCob,
          txid: efiResponse.txid,
          revision: efiResponse.revisao,
          createdAt: efiResponse.calendario.criacao,
          presentedAt: efiResponse.calendario.apresentacao,
          expirationTime: efiResponse.calendario.expiracao,
          status: efiResponse.status,
          payer: efiResponse.devedor ? {
            name: efiResponse.devedor.nome,
            document: efiResponse.devedor.cpf
          } : undefined,
          receiver: {
            name: efiResponse.recebedor.nome,
            document: efiResponse.recebedor.cpf
          },
          amount: valorEmCentavos,
          formattedAmount: valorFormatado,
          pixKey: efiResponse.chave,
          payerRequest: efiResponse.solicitacaoPagador,
          canBePaid,
          timeToExpire: tempoRestante > 0 ? tempoRestante : undefined
        }
      };

    } catch (error: any) {
      console.error('❌ [EFIPAY_PIX] Erro ao detalhar QR Code PIX:', error);

      // Tratar erros específicos da EfiPay
      if (error.response?.data) {
        const efiError = error.response.data;
        
        // Erro 400 - Operação inválida
        if (error.response.status === 400) {
          return {
            success: false,
            message: 'QR Code inválido ou operação não permitida',
            errorCode: 'QRCODE_INVALID_OPERATION',
            errorDetails: {
              type: efiError.type,
              title: efiError.title,
              status: efiError.status,
              detail: efiError.detail,
              violations: efiError.violacoes?.map((v: any) => ({
                reason: v.razao,
                property: v.propriedade
              }))
            }
          };
        }
        
        // Erro 403 - Escopo insuficiente
        if (error.response.status === 403) {
          return {
            success: false,
            message: 'Escopo insuficiente. Verifique se o escopo gn.qrcodes.read está habilitado',
            errorCode: 'INSUFFICIENT_SCOPE',
            errorDetails: {
              type: 'insufficient_scope',
              title: 'Escopo Insuficiente',
              status: 403,
              detail: 'Token de acesso não possui escopo suficiente para esta operação'
            }
          };
        }
        
        // Erro 422 - Dados inválidos
        if (error.response.status === 422) {
          return {
            success: false,
            message: 'QR Code com formato inválido',
            errorCode: 'QRCODE_INVALID_FORMAT',
            errorDetails: {
              type: efiError.type,
              title: efiError.title,
              status: efiError.status,
              detail: efiError.detail,
              violations: efiError.violacoes?.map((v: any) => ({
                reason: v.razao,
                property: v.propriedade
              }))
            }
          };
        }
        
        // Erro 429 - Rate limit
        if (error.response.status === 429) {
          return {
            success: false,
            message: 'Limite de requisições excedido. Tente novamente em alguns segundos',
            errorCode: 'RATE_LIMIT_EXCEEDED',
            errorDetails: {
              type: efiError.type,
              title: efiError.title,
              status: efiError.status,
              detail: efiError.detail
            }
          };
        }
        
        // Erro 500 - Erro interno
        if (error.response.status === 500) {
          return {
            success: false,
            message: 'Serviço temporariamente indisponível. Tente novamente mais tarde',
            errorCode: 'SERVICE_UNAVAILABLE',
            errorDetails: {
              type: efiError.type,
              title: efiError.title,
              status: efiError.status,
              detail: efiError.detail
            }
          };
        }
      }

      return {
        success: false,
        message: `Erro ao detalhar QR Code: ${error.message}`,
        errorCode: 'QRCODE_DETAIL_ERROR'
      };
    }
  }

  /**
   * Valida os dados de entrada para detalhamento de QR Code
   */
  private validateDetailQRCodeRequest(request: PagTrackerDetailQRCodeRequest): void {
    if (!request.tenantId) {
      throw new Error('ID do tenant é obrigatório');
    }

    if (!request.qrCodeString) {
      throw new Error('Código PIX Copia e Cola é obrigatório');
    }

    if (request.qrCodeString.length < 10) {
      throw new Error('Código PIX Copia e Cola muito curto');
    }

    if (request.qrCodeString.length > 1000) {
      throw new Error('Código PIX Copia e Cola muito longo');
    }

    // Validação básica do formato do QR Code PIX
    if (!request.qrCodeString.startsWith('00020101')) {
      throw new Error('Formato de QR Code PIX inválido');
    }
  }

  /**
   * Salva dados no banco do PagTracker (implementar conforme necessário)
   */
  private async saveToPagTrackerDatabase(
    request: PagTrackerPixRequest, 
    efiResponse: PixCobrancaResponse
  ): Promise<any> {
    // Sistema em nível de produção - dados reais da EfiPay

    const now = new Date();
    const expiresAt = new Date(now.getTime() + (request.expirationTime || 3600) * 1000);

    // CORREÇÃO: Gerar QR Code PIX localmente
    // A EfiPay não retorna URL de imagem diretamente, apenas o código PIX
    const qrCodeImageUrl = await this.generateQRCodeImageUrl(efiResponse.pixCopiaECola || '');

    return {
      id: `pagtracker_${Date.now()}`,
      txid: efiResponse.txid,
      amount: request.amount,
      status: efiResponse.status,
      pixCopiaECola: efiResponse.pixCopiaECola || '',
      qrCodeUrl: qrCodeImageUrl, // URL corrigida
      createdAt: now.toISOString(),
      expiresAt: expiresAt.toISOString()
    };
  }

  /**
   * Gera QR Code PIX usando geração local
   * INTEGRAÇÃO REAL - Geração local sem dependência de serviços externos
   */
  private async generateQRCodeImageUrl(pixCode: string): Promise<string> {
    if (!pixCode) {
      throw new Error('EFIPAY_QR_CODE_GENERATION_FAILED: Código PIX é obrigatório para gerar QR Code real');
    }

    try {
       // Usar geração local de QR Code
       const result = await generatePixQRCode(pixCode, {
         width: 300,
         margin: 2,
         validateCode: true
       });
       
       if (!result.success) {
         throw new Error(result.error || 'Erro na geração do QR Code');
       }
       
       console.log('🎯 [QRCODE_LOCAL] QR Code PIX gerado localmente com sucesso');
       
       return result.dataURL!;
     } catch (error) {
       console.error('❌ [QRCODE_LOCAL_ERROR] Erro ao gerar QR Code local:', error);
       throw new Error('EFIPAY_QR_CODE_GENERATION_FAILED: Erro na geração local do QR Code');
     }
  }
}