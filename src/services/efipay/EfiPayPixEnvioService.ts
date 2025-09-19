import axios, { AxiosInstance } from 'axios';
import { EfiPayAuthService } from './EfiPayAuthService';
import { EfiPayWebhookServiceSimple } from './EfiPayWebhookServiceSimple';
import {
  PixEnvioRequest,
  PixEnvioResponse,
  PixEnvioHeaders,
  PixEnvioRateLimit,
  PagTrackerPixEnvioRequest,
  PagTrackerPixEnvioResponse,
  ListPixEnviosFilters,
  ListPixEnviosResponse,
  StatusPixEnvio,
  TipoContaBancaria,
  PixEnviadoResponse,
  PagTrackerPixEnviadoResponse,
  PixEnviadoPorIdResponse,
  ListPixEnviadosFilters,
  ListPixEnviadosResponse,
  PixMesmaTitularidadeRequest,
  PixMesmaTitularidadeResponse,
  PagTrackerConsultarPixPorIdRequest,
  PagTrackerListarPixEnviadosRequest,
  PagTrackerListarPixEnviadosResponse,
  PagTrackerPixMesmaTitularidadeRequest,
  PagTrackerPixMesmaTitularidadeResponse
} from '../../types/efipay';

/**
 * Service para PIX Envio (PIX Send)
 * Endpoint: PUT /v3/gn/pix/:idEnvio
 * 
 * Funcionalidades:
 * - Enviar PIX para chave PIX
 * - Enviar PIX para dados bancários
 * - Consultar envio específico
 * - Listar envios com filtros
 * - Gestão de rate limiting (balde de fichas)
 * - Webhooks para status
 * 
 * Escopo necessário: pix.send
 * 
 * IMPORTANTE:
 * - Necessário webhook configurado na chave PIX do pagador
 * - Rate limiting com sistema de fichas (bucket)
 * - Envios condicionados à conclusão da transação anterior
 */
export class EfiPayPixEnvioService {
  private authService: EfiPayAuthService;
  private webhookService: EfiPayWebhookServiceSimple;
  private httpClient: AxiosInstance;
  private baseURL: string;

  constructor(authService: EfiPayAuthService) {
    this.authService = authService;
    this.webhookService = new EfiPayWebhookServiceSimple(authService);
    this.baseURL = process.env.EFIPAY_SANDBOX === 'false' 
      ? 'https://pix.api.efipay.com.br' 
      : 'https://pix-h.api.efipay.com.br';
    
    // Não criar httpClient aqui - usar o do authService que tem certificado
    this.httpClient = axios.create({
      baseURL: this.baseURL,
      timeout: 60000,
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
   * Enviar PIX (principal método)
   * PUT /v3/gn/pix/:idEnvio
   */
  async enviarPix(idEnvio: string, request: PixEnvioRequest): Promise<{
    data: PixEnvioResponse;
    rateLimit: PixEnvioRateLimit;
  }> {
    try {
      // Validar dados obrigatórios
      this.validatePixEnvioRequest(idEnvio, request);

      // 🔧 CONFIGURAR WEBHOOK CONFORME DOCUMENTAÇÃO OFICIAL
      // Documentação: "it is necessary for the payer's Pix key to have a webhook associated with it"
      // Usar chave de teste oficial: teste@efipay.com.br
      
      const chaveParaWebhook = request.pagador?.chave || 'teste@efipay.com.br';
      
      console.log('🤖 [PIX-ENVIO] Configurando webhook conforme documentação oficial...');
      console.log('🔑 [PIX-ENVIO] Chave para webhook:', chaveParaWebhook);
      
      try {
        const webhookResult = await this.webhookService.configurarWebhookAutomatico(chaveParaWebhook);
        
        if (webhookResult.success) {
          console.log('✅ [PIX-ENVIO] Webhook configurado:', webhookResult.webhookUrl);
        } else {
          console.warn('⚠️ [PIX-ENVIO] Falha na configuração do webhook:', webhookResult.details);
          // Continuar envio mesmo com falha no webhook (conforme documentação)
        }
      } catch (webhookError) {
        console.warn('⚠️ [PIX-ENVIO] Erro ao configurar webhook:', webhookError);
        // Continuar envio mesmo com falha no webhook
      }

      // Obter token de autenticação
      const token = await this.authService.getAccessToken();

      // Usar cliente autenticado com certificado
      const authenticatedClient = await this.authService.createAuthenticatedAxios();
      
      // Fazer requisição para EfiPay
      const response = await authenticatedClient.put(`/v3/gn/pix/${idEnvio}`, request);

      // Extrair rate limiting dos headers
      const rateLimit: PixEnvioRateLimit = {
        bucketSize: parseInt(response.headers['bucket-size'] || '0'),
        retryAfter: response.headers['retry-after'] ? 
          parseInt(response.headers['retry-after']) : undefined
      };

      return {
        data: response.data,
        rateLimit
      };

    } catch (error: any) {
      this.handleApiError(error, 'Erro ao enviar PIX');
    }
  }

  /**
   * Consultar envio PIX específico
   * GET /v3/gn/pix/:idEnvio
   */
  async getPixEnvio(idEnvio: string): Promise<PixEnvioResponse> {
    try {
      if (!idEnvio) {
        throw new Error('ID do envio é obrigatório');
      }

      const token = await this.authService.getAccessToken();

      const response = await this.httpClient.get(`/v3/gn/pix/${idEnvio}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      return response.data;
    } catch (error: any) {
      this.handleApiError(error, 'Erro ao consultar envio PIX');
    }
  }

  /**
   * Listar envios PIX com filtros
   * GET /v3/gn/pix
   */
  async listPixEnvios(filters: ListPixEnviosFilters = {}): Promise<ListPixEnviosResponse> {
    try {
      const token = await this.authService.getAccessToken();

      // Construir query parameters
      const queryParams = new URLSearchParams();
      
      if (filters.inicio) queryParams.append('inicio', filters.inicio);
      if (filters.fim) queryParams.append('fim', filters.fim);
      if (filters.status) queryParams.append('status', filters.status);
      if (filters.pagadorChave) queryParams.append('pagadorChave', filters.pagadorChave);
      if (filters.favorecidoChave) queryParams.append('favorecidoChave', filters.favorecidoChave);
      if (filters.valorMin) queryParams.append('valorMin', (filters.valorMin / 100).toFixed(2));
      if (filters.valorMax) queryParams.append('valorMax', (filters.valorMax / 100).toFixed(2));
      if (filters.itensPorPagina) queryParams.append('itensPorPagina', filters.itensPorPagina.toString());
      if (filters.paginaAtual) queryParams.append('paginaAtual', filters.paginaAtual.toString());

      const url = `/v3/gn/pix${queryParams.toString() ? `?${queryParams.toString()}` : ''}`;

      const response = await this.httpClient.get(url, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      return response.data;
    } catch (error: any) {
      this.handleApiError(error, 'Erro ao listar envios PIX');
    }
  }

  // ================================================================
  // MÉTODOS PAGTRACKER (INTERFACE SIMPLIFICADA)
  // ================================================================

  /**
   * Enviar PIX usando interface simplificada PagTracker
   */
  async enviarPixPagTracker(
    request: PagTrackerPixEnvioRequest,
    tenantId: string
  ): Promise<PagTrackerPixEnvioResponse> {
    try {
      // Gerar ID único para envio
      const idEnvio = this.generateIdEnvio();

      // Converter request PagTracker para formato EfiPay
      const efiRequest: PixEnvioRequest = {
        valor: (request.amount / 100).toFixed(2), // centavos para decimal
        pagador: {
          chave: request.payerPixKey,
          infoPagador: request.payerInfo
        },
        favorecido: this.convertRecipientToEfiFormat(request.recipient, request.validateRecipientDocument)
      };

      // Enviar PIX via EfiPay
      const efiResponse = await this.enviarPix(idEnvio, efiRequest);

      // Converter resposta para formato PagTracker
      const pagTrackerResponse: PagTrackerPixEnvioResponse = {
        id: efiResponse.data.idEnvio,
        e2eId: efiResponse.data.e2eId,
        amount: Math.round(parseFloat(efiResponse.data.valor) * 100),
        status: efiResponse.data.status,
        
        rateLimitInfo: {
          tokensRemaining: efiResponse.rateLimit.bucketSize,
          retryAfterSeconds: efiResponse.rateLimit.retryAfter
        },

        payer: {
          pixKey: request.payerPixKey,
          info: request.payerInfo
        },

        recipient: {
          pixKey: request.recipient.pixKey,
          bankData: request.recipient.bankData ? {
            name: request.recipient.bankData.name,
            document: request.recipient.bankData.document,
            bankCode: request.recipient.bankData.bankCode,
            agency: request.recipient.bankData.agency,
            account: request.recipient.bankData.account,
            accountType: request.recipient.bankData.accountType
          } : undefined
        },

        createdAt: efiResponse.data.horario.solicitacao,
        description: request.description,
        reference: request.reference,
        tags: request.tags,
        
        tenantId
      };

      return pagTrackerResponse;
    } catch (error: any) {
      this.handleApiError(error, 'Erro ao enviar PIX (PagTracker)');
    }
  }

  /**
   * Enviar PIX por chave (método simplificado)
   */
  async enviarPixPorChave(
    idEnvio: string,
    valor: number, // em centavos
    chavePixPagador: string,
    chavePixFavorecido: string,
    infoPagador?: string
  ): Promise<{ data: PixEnvioResponse; rateLimit: PixEnvioRateLimit }> {
    const request: PixEnvioRequest = {
      valor: (valor / 100).toFixed(2),
      pagador: {
        chave: chavePixPagador,
        infoPagador
      },
      favorecido: {
        chave: chavePixFavorecido
      }
    };

    return this.enviarPix(idEnvio, request);
  }

  /**
   * Verificar rate limiting (fichas no balde)
   */
  async checkRateLimit(): Promise<PixEnvioRateLimit> {
    try {
      const token = await this.authService.getAccessToken();

      // Fazer uma requisição HEAD para verificar headers
      const response = await this.httpClient.head('/v3/gn/pix/rate-limit-check', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      return {
        bucketSize: parseInt(response.headers['bucket-size'] || '0'),
        retryAfter: response.headers['retry-after'] ? 
          parseInt(response.headers['retry-after']) : undefined
      };
    } catch (error: any) {
      // Se endpoint não existir, retornar valores padrão
      return {
        bucketSize: 0,
        retryAfter: 60
      };
    }
  }

  // ================================================================
  // MÉTODOS AUXILIARES
  // ================================================================

  /**
   * Converter destinatário PagTracker para formato EfiPay
   */
  private convertRecipientToEfiFormat(
    recipient: PagTrackerPixEnvioRequest['recipient'],
    validateDocument?: boolean
  ): PixEnvioRequest['favorecido'] {
    if (recipient.pixKey) {
      // Envio por chave PIX
      const favorecido: any = { chave: recipient.pixKey };
      
      if (validateDocument && recipient.bankData?.document) {
        if (recipient.bankData.document.length === 11) {
          favorecido.cpf = recipient.bankData.document;
        } else if (recipient.bankData.document.length === 14) {
          favorecido.cnpj = recipient.bankData.document;
        }
      }

      return favorecido;
    } else if (recipient.bankData) {
      // Envio por dados bancários
      return {
        contaBanco: {
          nome: recipient.bankData.name,
          codigoBanco: recipient.bankData.bankCode,
          agencia: recipient.bankData.agency,
          conta: recipient.bankData.account,
          tipoConta: recipient.bankData.accountType === 'checking' ? 'cacc' : 'svgs',
          ...(recipient.bankData.document.length === 11 
            ? { cpf: recipient.bankData.document }
            : { cnpj: recipient.bankData.document }
          )
        }
      };
    } else {
      throw new Error('Favorecido deve ter chave PIX ou dados bancários');
    }
  }

  /**
   * Gerar ID único para envio (35 chars alfanuméricos)
   */
  private generateIdEnvio(): string {
    const timestamp = Date.now().toString();
    const random = Math.random().toString(36).substring(2);
    const idEnvio = `${timestamp}${random}`.substring(0, 35).toUpperCase();
    
    // Garantir que tem exatamente o tamanho correto
    return idEnvio.padEnd(35, '0').substring(0, 35);
  }

  // ================================================================
  // VALIDAÇÕES
  // ================================================================

  private validatePixEnvioRequest(idEnvio: string, request: PixEnvioRequest): void {
    const errors: string[] = [];

    // Validar idEnvio
    if (!idEnvio) {
      errors.push('ID do envio é obrigatório');
    } else if (!/^[a-zA-Z0-9]{1,35}$/.test(idEnvio)) {
      errors.push('ID do envio deve ter 1-35 caracteres alfanuméricos');
    }

    // Validar valor
    if (!request.valor) {
      errors.push('Valor é obrigatório');
    } else if (!/^\d{1,10}\.\d{2}$/.test(request.valor)) {
      errors.push('Valor deve estar no formato decimal (ex: 12.34)');
    } else if (parseFloat(request.valor) <= 0) {
      errors.push('Valor deve ser maior que zero');
    }

    // Validar pagador
    if (!request.pagador?.chave) {
      errors.push('Chave PIX do pagador é obrigatória');
    } else if (request.pagador.chave.length > 77) {
      errors.push('Chave PIX do pagador deve ter no máximo 77 caracteres');
    }

    if (request.pagador?.infoPagador && request.pagador.infoPagador.length > 140) {
      errors.push('Informação do pagador deve ter no máximo 140 caracteres');
    }

    // Validar favorecido
    if (!request.favorecido) {
      errors.push('Dados do favorecido são obrigatórios');
    } else {
      this.validateFavorecido(request.favorecido, errors);
    }

    if (errors.length > 0) {
      throw new Error(`Dados inválidos: ${errors.join(', ')}`);
    }
  }

  private validateFavorecido(favorecido: PixEnvioRequest['favorecido'], errors: string[]): void {
    if ('chave' in favorecido) {
      // Validação por chave PIX
      if (!favorecido.chave) {
        errors.push('Chave PIX do favorecido é obrigatória');
      } else if (favorecido.chave.length > 77) {
        errors.push('Chave PIX do favorecido deve ter no máximo 77 caracteres');
      }

      if (favorecido.cpf && !/^\d{11}$/.test(favorecido.cpf)) {
        errors.push('CPF do favorecido deve ter 11 dígitos');
      }

      if (favorecido.cnpj && !/^\d{14}$/.test(favorecido.cnpj)) {
        errors.push('CNPJ do favorecido deve ter 14 dígitos');
      }

    } else if ('contaBanco' in favorecido) {
      // Validação por dados bancários
      const conta = favorecido.contaBanco;

      if (!conta.nome) {
        errors.push('Nome do favorecido é obrigatório');
      } else if (conta.nome.length > 200) {
        errors.push('Nome do favorecido deve ter no máximo 200 caracteres');
      }

      if (!conta.codigoBanco) {
        errors.push('Código do banco (ISPB) é obrigatório');
      } else if (!/^\d{8}$/.test(conta.codigoBanco)) {
        errors.push('Código do banco deve ter 8 dígitos');
      }

      if (!conta.agencia) {
        errors.push('Agência é obrigatória');
      } else if (!/^\d{1,4}$/.test(conta.agencia)) {
        errors.push('Agência deve ter 1-4 dígitos');
      }

      if (!conta.conta) {
        errors.push('Conta é obrigatória');
      } else if (!/^\d+$/.test(conta.conta)) {
        errors.push('Conta deve conter apenas dígitos');
      }

      if (!conta.tipoConta) {
        errors.push('Tipo de conta é obrigatório');
      } else if (!['cacc', 'svgs'].includes(conta.tipoConta)) {
        errors.push('Tipo de conta deve ser "cacc" (corrente) ou "svgs" (poupança)');
      }

      if (conta.cpf && !/^\d{11}$/.test(conta.cpf)) {
        errors.push('CPF deve ter 11 dígitos');
      }

      if (conta.cnpj && !/^\d{14}$/.test(conta.cnpj)) {
        errors.push('CNPJ deve ter 14 dígitos');
      }

      if (!conta.cpf && !conta.cnpj) {
        errors.push('CPF ou CNPJ do favorecido é obrigatório');
      }

    } else {
      errors.push('Favorecido deve ter chave PIX ou dados bancários');
    }
  }

  // ================================================================
  // UTILITÁRIOS
  // ================================================================

  /**
   * Verificar saúde do serviço PIX Envio
   */
  async healthCheck(): Promise<{ status: string; timestamp: string; service: string; rateLimit?: PixEnvioRateLimit }> {
    try {
      const rateLimit = await this.checkRateLimit();
      
      return {
        status: 'healthy',
        timestamp: new Date().toISOString(),
        service: 'efipay-pix-envio',
        rateLimit
      };
    } catch (error) {
      return {
        status: 'unhealthy',
        timestamp: new Date().toISOString(),
        service: 'efipay-pix-envio'
      };
    }
  }

  /**
   * Tratar erros da API EfiPay PIX Envio
   */
  private handleApiError(error: any, context: string): never {
    if (error.response) {
      const status = error.response.status;
      const data = error.response.data;

      let errorMessage = `${context} - Status ${status}`;
      
      if (data?.mensagem) {
        errorMessage += `: ${data.mensagem}`;
      }
      
      if (data?.nome) {
        errorMessage += ` (${data.nome})`;
      }

      // Mapear erros específicos do PIX Envio
      switch (status) {
        case 400:
          if (data?.nome === 'documento_bloqueado') {
            errorMessage = 'Documento da conta tem bloqueios que impedem o envio';
          } else if (data?.nome === 'chave_invalida') {
            errorMessage = 'Chave PIX informada não pertence à conta autenticada';
          } else if (data?.nome === 'chave_nao_pertence_ao_documento') {
            errorMessage = 'CPF/CNPJ do favorecido difere do documento da chave';
          } else if (data?.nome === 'valor_invalido') {
            errorMessage = 'Valor informado é inválido';
          }
          break;
        case 404:
          if (data?.nome === 'chave_favorecido_nao_encontrada') {
            errorMessage = 'Chave PIX do favorecido não foi encontrada';
          }
          break;
        case 409:
          if (data?.nome === 'id_envio_duplicado') {
            errorMessage = 'ID do envio já foi utilizado em outro pagamento';
          }
          break;
        case 422:
          if (data?.nome === 'pagamento_negado') {
            errorMessage = 'Pagamento negado por análises de segurança';
          }
          break;
        case 429:
          if (data?.nome === 'balde_fichas_vazio') {
            errorMessage = 'Não há fichas disponíveis no balde. Aguarde para tentar novamente.';
            // Incluir informação de retry se disponível
            const retryAfter = error.response.headers['retry-after'];
            if (retryAfter) {
              errorMessage += ` Tente novamente em ${retryAfter} segundos.`;
            }
          }
          break;
        case 500:
          if (data?.nome === 'erro_aplicacao') {
            errorMessage = 'Erro interno do servidor EfiPay';
          }
          break;
      }

      throw new Error(errorMessage);
    } else if (error.request) {
      throw new Error(`${context} - Sem resposta do servidor EfiPay`);
    } else {
      throw new Error(`${context} - ${error.message}`);
    }
  }

  /**
   * Consultar PIX enviado através do endToEndId
   * GET /v2/gn/pix/enviados/:e2eId
   * Requer escopo: gn.pix.send.read
   */
  async consultarPixEnviado(e2eId: string): Promise<PixEnviadoResponse> {
    try {
      console.log('🔍 Consultando PIX enviado por e2eId:', e2eId);

      // Validar e2eId
      if (!this.validateE2eId(e2eId)) {
        throw new Error('e2eId inválido: deve ter 32 caracteres alfanuméricos');
      }

      const accessToken = await this.authService.getAccessToken();
      
      const response = await fetch(`${this.baseURL}/v2/gn/pix/enviados/${e2eId}`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json'
        }
      });

      const data = await response.json();

      if (!response.ok) {
        console.error('❌ Erro ao consultar PIX enviado:', {
          status: response.status,
          error: data
        });
        
        if (response.status === 404) {
          throw new Error(`PIX enviado não encontrado para o e2eId: ${e2eId}`);
        }
        
        this.handleApiError(response.status, data.detail || data.message || 'Erro ao consultar PIX enviado');
      }

      console.log('✅ PIX enviado consultado com sucesso:', {
        e2eId,
        status: data.status,
        valor: data.valor
      });

      return data as PixEnviadoResponse;
    } catch (error) {
      console.error('❌ Erro no service consultarPixEnviado:', error);
      throw error;
    }
  }

  /**
   * Consultar PIX enviado e converter para formato PagTracker
   */
  async consultarPixEnviadoPagTracker(
    e2eId: string, 
    tenantId: string
  ): Promise<PagTrackerPixEnviadoResponse> {
    try {
      const pixEnviado = await this.consultarPixEnviado(e2eId);
      
      return this.convertPixEnviadoToPagTrackerFormat(pixEnviado, tenantId);
    } catch (error) {
      console.error('❌ Erro ao consultar PIX enviado PagTracker:', error);
      throw error;
    }
  }

  /**
   * Converter PIX enviado EfiPay para formato PagTracker
   */
  private convertPixEnviadoToPagTrackerFormat(pixEnviado: PixEnviadoResponse, tenantId: string): PagTrackerPixEnviadoResponse {
    // Converter valor de string para centavos
    const amount = Math.round(parseFloat(pixEnviado.valor) * 100);

    // Preparar dados do favorecido
    const recipient: any = {};

    // Se enviado por chave PIX
    if (pixEnviado.favorecido.chave && pixEnviado.favorecido.identificacao) {
      recipient.pixKey = pixEnviado.favorecido.chave;
      recipient.identification = {
        name: pixEnviado.favorecido.identificacao.nome,
        document: pixEnviado.favorecido.identificacao.cpf
      };
    }

    // Se enviado por dados bancários
    if (pixEnviado.favorecido.contaBanco) {
      recipient.bankData = {
        name: pixEnviado.favorecido.contaBanco.nome,
        document: pixEnviado.favorecido.contaBanco.cpf,
        bankCode: pixEnviado.favorecido.contaBanco.codigoBanco,
        agency: pixEnviado.favorecido.contaBanco.agencia,
        account: pixEnviado.favorecido.contaBanco.conta,
        accountType: pixEnviado.favorecido.contaBanco.tipoConta
      };
    }

    // Texto para busca
    const searchableText = [
      pixEnviado.endToEndId,
      pixEnviado.chave,
      recipient.identification?.name || recipient.bankData?.name || ''
    ].filter(Boolean).join(' ').toLowerCase();

    return {
      endToEndId: pixEnviado.endToEndId,
      originalSendId: pixEnviado.idEnvio,
      amount,
      payerPixKey: pixEnviado.chave,
      status: pixEnviado.status,
      payerInfo: pixEnviado.infoPagador,
      recipient,
      requestedAt: pixEnviado.horario.solicitacao,
      settledAt: pixEnviado.horario.liquidacao,
      tenantId,
      searchableText
    };
  }

  /**
   * Validar endToEndId (e2eId)
   * Deve ter 32 caracteres alfanuméricos
   */
  private validateE2eId(e2eId: string): boolean {
    if (!e2eId || typeof e2eId !== 'string') {
      return false;
    }

    // Regex para validar e2eId: 32 caracteres alfanuméricos
    const e2eIdRegex = /^[a-zA-Z0-9]{32}$/;
    return e2eIdRegex.test(e2eId);
  }

  // ================================================================
  // NOVOS MÉTODOS PARA PIX ENVIO v2/v3
  // ================================================================

  /**
   * Consultar PIX enviado por idEnvio
   * GET /v2/gn/pix/enviados/id-envio/:idEnvio
   */
  async consultarPixEnviadoPorId(idEnvio: string): Promise<PixEnviadoPorIdResponse> {
    try {
      console.log('🔍 Consultando PIX enviado por idEnvio:', idEnvio);

      // Validar idEnvio
      if (!idEnvio || typeof idEnvio !== 'string' || idEnvio.trim().length === 0) {
        throw new Error('idEnvio é obrigatório e deve ser uma string válida');
      }

      const accessToken = await this.authService.getAccessToken();
      
      const response = await fetch(`${this.baseURL}/v2/gn/pix/enviados/id-envio/${idEnvio}`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json'
        }
      });

      const data = await response.json();

      if (!response.ok) {
        console.error('❌ Erro ao consultar PIX enviado por ID:', {
          status: response.status,
          error: data
        });
        
        if (response.status === 404) {
          throw new Error(`PIX enviado não encontrado para o idEnvio: ${idEnvio}`);
        }
        
        this.handleApiError(response.status, data.detail || data.message || 'Erro ao consultar PIX enviado por ID');
      }

      console.log('✅ PIX enviado consultado por ID com sucesso:', {
        idEnvio,
        status: data.status,
        valor: data.valor
      });

      return data as PixEnviadoPorIdResponse;
    } catch (error) {
      console.error('❌ Erro no service consultarPixEnviadoPorId:', error);
      throw error;
    }
  }

  /**
   * Listar PIX enviados com filtros
   * GET /v2/gn/pix/enviados
   */
  async listarPixEnviados(filters: ListPixEnviadosFilters): Promise<ListPixEnviadosResponse> {
    try {
      console.log('📋 Listando PIX enviados com filtros:', filters);

      // Validar filtros obrigatórios
      if (!filters.inicio || !filters.fim) {
        throw new Error('Os parâmetros inicio e fim são obrigatórios');
      }

      // Validar formato de data RFC 3339
      const dateRegex = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(\.\d{3})?Z$/;
      if (!dateRegex.test(filters.inicio) || !dateRegex.test(filters.fim)) {
        throw new Error('As datas inicio e fim devem estar no formato RFC 3339 (ISO 8601)');
      }

      const accessToken = await this.authService.getAccessToken();
      
      // Construir query parameters
      const queryParams = new URLSearchParams({
        inicio: filters.inicio,
        fim: filters.fim
      });

      if (filters.paginaAtual !== undefined) {
        queryParams.append('paginaAtual', filters.paginaAtual.toString());
      }

      if (filters.itensPorPagina !== undefined) {
        queryParams.append('itensPorPagina', filters.itensPorPagina.toString());
      }

      const response = await fetch(`${this.baseURL}/v2/gn/pix/enviados?${queryParams.toString()}`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json'
        }
      });

      const data = await response.json();

      if (!response.ok) {
        console.error('❌ Erro ao listar PIX enviados:', {
          status: response.status,
          error: data
        });
        
        this.handleApiError(response.status, data.detail || data.message || 'Erro ao listar PIX enviados');
      }

      console.log('✅ PIX enviados listados com sucesso:', {
        total: data.parametros?.paginacao?.quantidadeTotalDeItens || 0,
        pagina: data.parametros?.paginacao?.paginaAtual || 0
      });

      return data as ListPixEnviadosResponse;
    } catch (error) {
      console.error('❌ Erro no service listarPixEnviados:', error);
      throw error;
    }
  }

  /**
   * Enviar PIX de mesma titularidade
   * PUT /v2/gn/pix/:idEnvio/mesma-titularidade
   */
  async enviarPixMesmaTitularidade(
    idEnvio: string, 
    request: PixMesmaTitularidadeRequest
  ): Promise<PixMesmaTitularidadeResponse> {
    try {
      console.log('💸 Enviando PIX de mesma titularidade:', { idEnvio, valor: request.valor });

      // Validar dados obrigatórios
      this.validatePixMesmaTitularidadeRequest(idEnvio, request);

      // Configurar webhook para a chave do pagador
      const chaveParaWebhook = request.pagador.chave;
      
      console.log('🤖 [PIX-MESMA-TITULARIDADE] Configurando webhook...');
      
      try {
        const webhookResult = await this.webhookService.configurarWebhookAutomatico(chaveParaWebhook);
        
        if (webhookResult.success) {
          console.log('✅ [PIX-MESMA-TITULARIDADE] Webhook configurado:', webhookResult.webhookUrl);
        } else {
          console.warn('⚠️ [PIX-MESMA-TITULARIDADE] Falha na configuração do webhook:', webhookResult.details);
        }
      } catch (webhookError) {
        console.warn('⚠️ [PIX-MESMA-TITULARIDADE] Erro ao configurar webhook:', webhookError);
      }

      const accessToken = await this.authService.getAccessToken();
      
      const response = await fetch(`${this.baseURL}/v2/gn/pix/${idEnvio}/mesma-titularidade`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(request)
      });

      const data = await response.json();

      if (!response.ok) {
        console.error('❌ Erro ao enviar PIX de mesma titularidade:', {
          status: response.status,
          error: data
        });
        
        this.handleApiError(response.status, data.detail || data.message || 'Erro ao enviar PIX de mesma titularidade');
      }

      console.log('✅ PIX de mesma titularidade enviado com sucesso:', {
        idEnvio: data.idEnvio,
        e2eId: data.e2eId,
        status: data.status
      });

      return data as PixMesmaTitularidadeResponse;
    } catch (error) {
      console.error('❌ Erro no service enviarPixMesmaTitularidade:', error);
      throw error;
    }
  }

  // ================================================================
  // MÉTODOS PAGTRACKER PARA NOVOS ENDPOINTS
  // ================================================================

  /**
   * Consultar PIX enviado por ID - formato PagTracker
   */
  async consultarPixPorIdPagTracker(
    request: PagTrackerConsultarPixPorIdRequest
  ): Promise<PagTrackerPixEnviadoResponse> {
    try {
      const pixEnviado = await this.consultarPixEnviadoPorId(request.idEnvio);
      
      return this.convertPixEnviadoToPagTrackerFormat(pixEnviado, request.tenantId);
    } catch (error) {
      console.error('❌ Erro ao consultar PIX por ID PagTracker:', error);
      throw error;
    }
  }

  /**
   * Listar PIX enviados - formato PagTracker
   */
  async listarPixEnviadosPagTracker(
    request: PagTrackerListarPixEnviadosRequest
  ): Promise<PagTrackerListarPixEnviadosResponse> {
    try {
      const filters: ListPixEnviadosFilters = {
        inicio: request.startDate,
        fim: request.endDate,
        paginaAtual: request.page,
        itensPorPagina: request.itemsPerPage
      };

      const response = await this.listarPixEnviados(filters);
      
      return this.convertListPixEnviadosToPagTrackerFormat(response, request.tenantId);
    } catch (error) {
      console.error('❌ Erro ao listar PIX enviados PagTracker:', error);
      throw error;
    }
  }

  /**
   * Enviar PIX de mesma titularidade - formato PagTracker
   */
  async enviarPixMesmaTitularidadePagTracker(
    request: PagTrackerPixMesmaTitularidadeRequest
  ): Promise<PagTrackerPixMesmaTitularidadeResponse> {
    try {
      // Converter formato PagTracker para EfiPay
      const efiRequest: PixMesmaTitularidadeRequest = {
        valor: (request.amount / 100).toFixed(2), // centavos para reais
        pagador: {
          chave: request.payerPixKey,
          infoPagador: request.payerInfo
        },
        favorecido: {
          contaBanco: {
            nome: request.recipientBankData.name,
            cpf: request.recipientBankData.document.length === 11 ? request.recipientBankData.document : undefined,
            cnpj: request.recipientBankData.document.length === 14 ? request.recipientBankData.document : undefined,
            codigoBanco: request.recipientBankData.bankCode,
            agencia: request.recipientBankData.agency,
            conta: request.recipientBankData.account,
            tipoConta: request.recipientBankData.accountType === 'checking' ? 'cacc' : 'svgs'
          }
        }
      };

      const response = await this.enviarPixMesmaTitularidade(request.idEnvio, efiRequest);
      
      return this.convertPixMesmaTitularidadeToPagTrackerFormat(response, request);
    } catch (error) {
      console.error('❌ Erro ao enviar PIX mesma titularidade PagTracker:', error);
      throw error;
    }
  }

  // ================================================================
  // MÉTODOS PRIVADOS DE CONVERSÃO E VALIDAÇÃO
  // ================================================================

  /**
   * Converter lista de PIX enviados para formato PagTracker
   */
  private convertListPixEnviadosToPagTrackerFormat(
    response: ListPixEnviadosResponse,
    tenantId: string
  ): PagTrackerListarPixEnviadosResponse {
    return {
      success: true,
      data: {
        filters: {
          startDate: response.parametros.inicio,
          endDate: response.parametros.fim,
          pagination: {
            currentPage: response.parametros.paginacao.paginaAtual,
            itemsPerPage: response.parametros.paginacao.itensPorPagina,
            totalPages: response.parametros.paginacao.quantidadeDePaginas,
            totalItems: response.parametros.paginacao.quantidadeTotalDeItens
          }
        },
        pixSent: response.pix.map(pix => ({
          endToEndId: pix.endToEndId,
          idEnvio: pix.idEnvio,
          amount: Math.round(parseFloat(pix.valor) * 100), // reais para centavos
          pixKey: pix.chave,
          status: pix.status,
          payerInfo: pix.infoPagador,
          requestedAt: pix.horario.solicitacao,
          settledAt: pix.horario.liquidacao,
          recipient: {
            pixKey: pix.favorecido.chave || '',
            identification: {
              name: pix.favorecido.identificacao?.nome || '',
              document: pix.favorecido.identificacao?.cpf || ''
            },
            bankData: {
              bankCode: pix.favorecido.contaBanco?.codigoBanco || ''
            }
          }
        }))
      }
    };
  }

  /**
   * Converter PIX mesma titularidade para formato PagTracker
   */
  private convertPixMesmaTitularidadeToPagTrackerFormat(
    response: PixMesmaTitularidadeResponse,
    request: PagTrackerPixMesmaTitularidadeRequest
  ): PagTrackerPixMesmaTitularidadeResponse {
    return {
      success: true,
      data: {
        idEnvio: response.idEnvio,
        e2eId: response.e2eId,
        amount: Math.round(parseFloat(response.valor) * 100), // reais para centavos
        status: response.status,
        requestedAt: response.horario.solicitacao,
        payer: {
          pixKey: request.payerPixKey,
          info: request.payerInfo
        },
        recipient: {
          bankData: {
            name: request.recipientBankData.name,
            document: request.recipientBankData.document,
            bankCode: request.recipientBankData.bankCode,
            agency: request.recipientBankData.agency,
            account: request.recipientBankData.account,
            accountType: request.recipientBankData.accountType
          }
        },
        description: request.description,
        reference: request.reference,
        tags: request.tags,
        tenantId: request.tenantId
      }
    };
  }

  /**
   * Validar request de PIX mesma titularidade
   */
  private validatePixMesmaTitularidadeRequest(
    idEnvio: string, 
    request: PixMesmaTitularidadeRequest
  ): void {
    const errors: string[] = [];

    // Validar idEnvio
    if (!idEnvio || typeof idEnvio !== 'string' || idEnvio.trim().length === 0) {
      errors.push('idEnvio é obrigatório');
    }

    // Validar valor
    if (!request.valor || typeof request.valor !== 'string') {
      errors.push('valor é obrigatório e deve ser uma string');
    } else {
      const valorRegex = /^\d{1,10}\.\d{2}$/;
      if (!valorRegex.test(request.valor)) {
        errors.push('valor deve estar no formato 0.00 (ex: 12.34)');
      }
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

    // Validar favorecido
    if (!request.favorecido?.contaBanco) {
      errors.push('dados bancários do favorecido são obrigatórios');
    } else {
      const contaBanco = request.favorecido.contaBanco;
      
      if (!contaBanco.nome || contaBanco.nome.length > 200) {
        errors.push('nome do favorecido é obrigatório e deve ter no máximo 200 caracteres');
      }
      
      if (!contaBanco.cpf && !contaBanco.cnpj) {
        errors.push('CPF ou CNPJ do favorecido é obrigatório');
      }
      
      if (contaBanco.cpf && !/^\d{11}$/.test(contaBanco.cpf)) {
        errors.push('CPF deve ter 11 dígitos');
      }
      
      if (contaBanco.cnpj && !/^\d{14}$/.test(contaBanco.cnpj)) {
        errors.push('CNPJ deve ter 14 dígitos');
      }
      
      if (!contaBanco.codigoBanco || !/^\d{8}$/.test(contaBanco.codigoBanco)) {
        errors.push('código do banco deve ter 8 dígitos (ISPB)');
      }
      
      if (!contaBanco.agencia || !/^\d{1,4}$/.test(contaBanco.agencia)) {
        errors.push('agência deve ter de 1 a 4 dígitos');
      }
      
      if (!contaBanco.conta) {
        errors.push('conta é obrigatória');
      }
      
      if (!contaBanco.tipoConta || !['cacc', 'svgs'].includes(contaBanco.tipoConta)) {
        errors.push('tipo de conta deve ser cacc (corrente) ou svgs (poupança)');
      }
    }

    if (errors.length > 0) {
      throw new Error(`Dados inválidos para PIX mesma titularidade: ${errors.join(', ')}`);
    }
  }
}