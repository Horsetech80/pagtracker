/**
 * EFIPAY PIX AUTOMÁTICO (RECORRÊNCIAS) SERVICE - PAGTRACKER V4.0
 * ==============================================================
 * 
 * Implementa todas as funcionalidades de PIX Automático (Recorrências)
 * Conformidade: BCB Resolution + Documentação EfiPay oficial
 * 
 * Funcionalidades:
 * - Criar recorrência de PIX Automático
 * - Consultar recorrência específica
 * - Atualizar/revisar recorrência
 * - Listar recorrências com filtros
 * - Gerenciar solicitações de confirmação
 * 
 * Endpoints:
 * - POST /v2/rec - Criar recorrência
 * - GET /v2/rec/:idRec - Consultar recorrência
 * - PATCH /v2/rec/:idRec - Revisar recorrência
 * - GET /v2/rec - Listar recorrências
 * - POST /v2/rec/:idRec/solicitacao-confirmacao - Criar solicitação
 * - GET /v2/rec/:idRec/solicitacao-confirmacao/:idSolicitacao - Consultar solicitação
 * - PATCH /v2/rec/:idRec/solicitacao-confirmacao/:idSolicitacao - Revisar solicitação
 */

import { BaseService } from '../core/BaseService';
import { EfiPayAuthService } from './EfiPayAuthService';
import {
  // Tipos de recorrência
  RecorrenciaPeriodicidade,
  PoliticaRetentativa,
  StatusRecorrencia,
  TipoJornada,
  StatusSolicitacao,
  
  // Interfaces de request/response EfiPay
  CreateRecorrenciaRequest,
  RecorrenciaResponse,
  UpdateRecorrenciaRequest,
  ListRecorrenciasFilters,
  ListRecorrenciasResponse,
  CreateSolicitacaoConfirmacaoRequest,
  SolicitacaoConfirmacaoResponse,
  UpdateSolicitacaoConfirmacaoRequest,
  
  // Interfaces PagTracker
  PagTrackerCreateRecorrenciaRequest,
  PagTrackerRecorrenciaResponse,
  
  // Interfaces base
  EfiPayError
} from '@/types/efipay';

/**
 * Serviço de PIX Automático (Recorrências) EfiPay
 */
export class EfiPayPixRecorrenciaService extends BaseService {
  private authService: EfiPayAuthService;

  constructor(tenantId: string, userId: string) {
    super(tenantId, userId);
    this.authService = new EfiPayAuthService(tenantId, userId);
  }

  /**
   * Remove dados sensíveis antes de retornar para o cliente
   */
  protected sanitizeOutput<T>(data: T): Partial<T> {
    return data;
  }

  // ================================================================
  // GERENCIAMENTO DE RECORRÊNCIAS
  // ================================================================

  /**
   * Criar recorrência de PIX Automático
   * POST /v2/rec
   */
  async createRecorrencia(request: CreateRecorrenciaRequest): Promise<RecorrenciaResponse> {
    try {
      console.log('🔄 [EFIPAY_REC] Criando recorrência PIX Automático', {
        tenantId: this.tenantId,
        periodicidade: request.calendario.periodicidade,
        valor: request.valor?.valorRec || request.valor?.valorMinimoRecebedor,
        devedor: request.vinculo.devedor.nome
      });

      // Validar dados obrigatórios
      this.validateCreateRecorrenciaRequest(request);

      // Obter token de autenticação
      const token = await this.authService.getValidToken();

      // Fazer requisição para API EfiPay
      const response = await this.authService.makeAuthenticatedRequest(
        'POST',
        '/v2/rec',
        request,
        token
      );

      console.log('✅ [EFIPAY_REC] Recorrência criada com sucesso', {
        idRec: response.idRec,
        status: response.status,
        periodicidade: response.calendario.periodicidade,
        valor: response.valor?.valorRec || response.valor?.valorMinimoRecebedor
      });

      return response as RecorrenciaResponse;

    } catch (error) {
      console.error('❌ [EFIPAY_REC_CREATE_ERROR]', error);
      throw this.handleEfiPayError(error, 'Erro ao criar recorrência PIX Automático');
    }
  }

  /**
   * Consultar recorrência específica
   * GET /v2/rec/:idRec
   */
  async getRecorrencia(idRec: string): Promise<RecorrenciaResponse> {
    try {
      console.log('🔍 [EFIPAY_REC] Consultando recorrência', { idRec, tenantId: this.tenantId });

      if (!idRec) {
        throw new Error('ID da recorrência é obrigatório');
      }

      const token = await this.authService.getValidToken();

      const response = await this.authService.makeAuthenticatedRequest(
        'GET',
        `/v2/rec/${idRec}`,
        null,
        token
      );

      console.log('✅ [EFIPAY_REC] Recorrência consultada', {
        idRec: response.idRec,
        status: response.status,
        periodicidade: response.calendario.periodicidade
      });

      return response as RecorrenciaResponse;

    } catch (error) {
      console.error('❌ [EFIPAY_REC_GET_ERROR]', { idRec, error });
      throw this.handleEfiPayError(error, `Erro ao consultar recorrência ${idRec}`);
    }
  }

  /**
   * Revisar/atualizar recorrência
   * PATCH /v2/rec/:idRec
   */
  async updateRecorrencia(idRec: string, request: UpdateRecorrenciaRequest): Promise<RecorrenciaResponse> {
    try {
      console.log('🔄 [EFIPAY_REC] Atualizando recorrência', {
        idRec,
        tenantId: this.tenantId,
        updates: Object.keys(request)
      });

      if (!idRec) {
        throw new Error('ID da recorrência é obrigatório');
      }

      this.validateUpdateRecorrenciaRequest(request);

      const token = await this.authService.getValidToken();

      const response = await this.authService.makeAuthenticatedRequest(
        'PUT',
        `/v2/rec/${idRec}`,
        request,
        token
      );

      console.log('✅ [EFIPAY_REC] Recorrência atualizada', {
        idRec: response.idRec,
        status: response.status
      });

      return response as RecorrenciaResponse;

    } catch (error) {
      console.error('❌ [EFIPAY_REC_UPDATE_ERROR]', { idRec, error });
      throw this.handleEfiPayError(error, `Erro ao atualizar recorrência ${idRec}`);
    }
  }

  /**
   * Listar recorrências com filtros e paginação
   * GET /v2/rec
   */
  async listRecorrencias(filters: ListRecorrenciasFilters = {}): Promise<ListRecorrenciasResponse> {
    try {
      console.log('📋 [EFIPAY_REC] Listando recorrências', {
        tenantId: this.tenantId,
        filters
      });

      const token = await this.authService.getValidToken();

      // Construir query string
      const queryParams = this.buildRecorrenciasQueryString(filters);
      const endpoint = `/v2/rec${queryParams ? `?${queryParams}` : ''}`;

      const response = await this.authService.makeAuthenticatedRequest(
        'GET',
        endpoint,
        null,
        token
      );

      console.log('✅ [EFIPAY_REC] Listagem concluída', {
        total: response.parametros?.paginacao?.quantidadeTotalDeItens || 0,
        pagina: response.parametros?.paginacao?.paginaAtual || 0
      });

      return response as ListRecorrenciasResponse;

    } catch (error) {
      console.error('❌ [EFIPAY_REC_LIST_ERROR]', { filters, error });
      throw this.handleEfiPayError(error, 'Erro ao listar recorrências');
    }
  }

  // ================================================================
  // SOLICITAÇÕES DE CONFIRMAÇÃO
  // ================================================================

  /**
   * Criar solicitação de confirmação de recorrência
   * POST /v2/rec/:idRec/solicitacao-confirmacao
   */
  async createSolicitacaoConfirmacao(
    idRec: string, 
    request: CreateSolicitacaoConfirmacaoRequest
  ): Promise<SolicitacaoConfirmacaoResponse> {
    try {
      console.log('🔄 [EFIPAY_REC] Criando solicitação de confirmação', {
        idRec,
        tipoJornada: request.dadosJornada.tipoJornada,
        tenantId: this.tenantId
      });

      if (!idRec) {
        throw new Error('ID da recorrência é obrigatório');
      }

      this.validateCreateSolicitacaoRequest(request);

      const token = await this.authService.getValidToken();

      const response = await this.authService.makeAuthenticatedRequest(
        'POST',
        `/v2/rec/${idRec}/solicitacao-confirmacao`,
        request,
        token
      );

      console.log('✅ [EFIPAY_REC] Solicitação criada', {
        idSolicitacao: response.idSolicitacao,
        status: response.status
      });

      return response as SolicitacaoConfirmacaoResponse;

    } catch (error) {
      console.error('❌ [EFIPAY_REC_SOLICITACAO_CREATE_ERROR]', { idRec, error });
      throw this.handleEfiPayError(error, `Erro ao criar solicitação de confirmação para ${idRec}`);
    }
  }

  /**
   * Consultar solicitação de confirmação
   * GET /v2/rec/:idRec/solicitacao-confirmacao/:idSolicitacao
   */
  async getSolicitacaoConfirmacao(
    idRec: string, 
    idSolicitacao: string
  ): Promise<SolicitacaoConfirmacaoResponse> {
    try {
      console.log('🔍 [EFIPAY_REC] Consultando solicitação', {
        idRec,
        idSolicitacao,
        tenantId: this.tenantId
      });

      if (!idRec || !idSolicitacao) {
        throw new Error('ID da recorrência e ID da solicitação são obrigatórios');
      }

      const token = await this.authService.getValidToken();

      const response = await this.authService.makeAuthenticatedRequest(
        'GET',
        `/v2/rec/${idRec}/solicitacao-confirmacao/${idSolicitacao}`,
        null,
        token
      );

      console.log('✅ [EFIPAY_REC] Solicitação consultada', {
        idSolicitacao: response.idSolicitacao,
        status: response.status
      });

      return response as SolicitacaoConfirmacaoResponse;

    } catch (error) {
      console.error('❌ [EFIPAY_REC_SOLICITACAO_GET_ERROR]', { idRec, idSolicitacao, error });
      throw this.handleEfiPayError(error, `Erro ao consultar solicitação ${idSolicitacao}`);
    }
  }

  /**
   * Revisar solicitação de confirmação
   * PATCH /v2/rec/:idRec/solicitacao-confirmacao/:idSolicitacao
   */
  async updateSolicitacaoConfirmacao(
    idRec: string,
    idSolicitacao: string,
    request: UpdateSolicitacaoConfirmacaoRequest
  ): Promise<SolicitacaoConfirmacaoResponse> {
    try {
      console.log('🔄 [EFIPAY_REC] Atualizando solicitação', {
        idRec,
        idSolicitacao,
        novoStatus: request.status,
        tenantId: this.tenantId
      });

      if (!idRec || !idSolicitacao) {
        throw new Error('ID da recorrência e ID da solicitação são obrigatórios');
      }

      this.validateUpdateSolicitacaoRequest(request);

      const token = await this.authService.getValidToken();

      const response = await this.authService.makeAuthenticatedRequest(
        'PUT',
        `/v2/rec/${idRec}/solicitacao-confirmacao/${idSolicitacao}`,
        request,
        token
      );

      console.log('✅ [EFIPAY_REC] Solicitação atualizada', {
        idSolicitacao: response.idSolicitacao,
        status: response.status
      });

      return response as SolicitacaoConfirmacaoResponse;

    } catch (error) {
      console.error('❌ [EFIPAY_REC_SOLICITACAO_UPDATE_ERROR]', { idRec, idSolicitacao, error });
      throw this.handleEfiPayError(error, `Erro ao atualizar solicitação ${idSolicitacao}`);
    }
  }

  // ================================================================
  // MÉTODOS PAGTRACKER (INTERFACE SIMPLIFICADA)
  // ================================================================

  /**
   * Criar recorrência usando interface simplificada do PagTracker
   */
  async createRecorrenciaForPagTracker(
    request: PagTrackerCreateRecorrenciaRequest
  ): Promise<PagTrackerRecorrenciaResponse> {
    try {
      console.log('🚀 [PAGTRACKER_REC] Criando recorrência simplificada', {
        customerName: request.customerName,
        amount: request.amount,
        frequency: request.frequency,
        tenantId: this.tenantId
      });

      // Converter request PagTracker para formato EfiPay
      const efiPayRequest = this.convertPagTrackerToEfiPayRequest(request);

      // Criar recorrência na EfiPay
      const efiPayResponse = await this.createRecorrencia(efiPayRequest);

      // Converter response EfiPay para formato PagTracker
      const pagTrackerResponse = this.convertEfiPayToPagTrackerResponse(efiPayResponse, request);

      console.log('✅ [PAGTRACKER_REC] Recorrência criada com interface simplificada', {
        id: pagTrackerResponse.id,
        contractId: pagTrackerResponse.contractId,
        status: pagTrackerResponse.status
      });

      return pagTrackerResponse;

    } catch (error) {
      console.error('❌ [PAGTRACKER_REC_ERROR]', error);
      throw error;
    }
  }

  // ================================================================
  // MÉTODOS DE VALIDAÇÃO
  // ================================================================

  private validateCreateRecorrenciaRequest(request: CreateRecorrenciaRequest): void {
    if (!request.vinculo?.contrato) {
      throw new Error('Contrato é obrigatório');
    }

    if (request.vinculo.contrato.length > 35) {
      throw new Error('Contrato deve ter no máximo 35 caracteres');
    }

    if (!request.vinculo.devedor?.nome) {
      throw new Error('Nome do devedor é obrigatório');
    }

    if (request.vinculo.devedor.nome.length > 140) {
      throw new Error('Nome do devedor deve ter no máximo 140 caracteres');
    }

    if (!request.vinculo.devedor.cpf && !request.vinculo.devedor.cnpj) {
      throw new Error('CPF ou CNPJ do devedor é obrigatório');
    }

    if (request.vinculo.devedor.cpf && !/^\d{11}$/.test(request.vinculo.devedor.cpf)) {
      throw new Error('CPF deve ter 11 dígitos numéricos');
    }

    if (request.vinculo.devedor.cnpj && !/^\d{14}$/.test(request.vinculo.devedor.cnpj)) {
      throw new Error('CNPJ deve ter 14 dígitos numéricos');
    }

    if (!request.calendario?.dataInicial) {
      throw new Error('Data inicial é obrigatória');
    }

    if (!request.calendario.periodicidade) {
      throw new Error('Periodicidade é obrigatória');
    }

    if (!request.politicaRetentativa) {
      throw new Error('Política de retentativa é obrigatória');
    }

    // Validar valores
    if (request.valor?.valorRec && request.valor?.valorMinimoRecebedor) {
      throw new Error('Não é possível informar valor fixo e valor mínimo simultaneamente');
    }

    if (request.valor?.valorRec && !/^\d{1,10}\.\d{2}$/.test(request.valor.valorRec)) {
      throw new Error('Valor fixo deve estar no formato 0.00');
    }

    if (request.valor?.valorMinimoRecebedor && !/^\d{1,10}\.\d{2}$/.test(request.valor.valorMinimoRecebedor)) {
      throw new Error('Valor mínimo deve estar no formato 0.00');
    }
  }

  private validateUpdateRecorrenciaRequest(request: UpdateRecorrenciaRequest): void {
    if (Object.keys(request).length === 0) {
      throw new Error('Pelo menos um campo deve ser informado para atualização');
    }

    // Validar campos se informados
    if (request.valor?.valorRec && request.valor?.valorMinimoRecebedor) {
      throw new Error('Não é possível informar valor fixo e valor mínimo simultaneamente');
    }

    if (request.valor?.valorRec && !/^\d{1,10}\.\d{2}$/.test(request.valor.valorRec)) {
      throw new Error('Valor fixo deve estar no formato 0.00');
    }
  }

  private validateCreateSolicitacaoRequest(request: CreateSolicitacaoConfirmacaoRequest): void {
    if (!request.dadosJornada?.tipoJornada) {
      throw new Error('Tipo de jornada é obrigatório');
    }

    const tiposValidos: TipoJornada[] = ['JORNADA_1', 'JORNADA_2', 'JORNADA_3'];
    if (!tiposValidos.includes(request.dadosJornada.tipoJornada)) {
      throw new Error('Tipo de jornada inválido');
    }

    if (request.dadosJornada.txid && !/^[a-zA-Z0-9]{26,35}$/.test(request.dadosJornada.txid)) {
      throw new Error('TXID deve ter entre 26 e 35 caracteres alfanuméricos');
    }
  }

  private validateUpdateSolicitacaoRequest(request: UpdateSolicitacaoConfirmacaoRequest): void {
    if (!request.status) {
      throw new Error('Status é obrigatório para atualização');
    }

    const statusValidos: StatusSolicitacao[] = ['PENDENTE', 'CONFIRMADA', 'REJEITADA', 'EXPIRADA'];
    if (!statusValidos.includes(request.status)) {
      throw new Error('Status inválido');
    }

    if (request.status === 'REJEITADA' && !request.motivoRejeicao) {
      throw new Error('Motivo de rejeição é obrigatório quando status é REJEITADA');
    }
  }

  // ================================================================
  // MÉTODOS AUXILIARES
  // ================================================================

  private buildRecorrenciasQueryString(filters: ListRecorrenciasFilters): string {
    const params = new URLSearchParams();

    if (filters.inicio) params.append('inicio', filters.inicio);
    if (filters.fim) params.append('fim', filters.fim);
    if (filters.cpf) params.append('cpf', filters.cpf);
    if (filters.cnpj) params.append('cnpj', filters.cnpj);
    if (filters.status) params.append('status', filters.status);
    if (filters.itensPorPagina) params.append('itensPorPagina', filters.itensPorPagina.toString());
    if (filters.paginaAtual) params.append('paginaAtual', filters.paginaAtual.toString());

    return params.toString();
  }

  private convertPagTrackerToEfiPayRequest(request: PagTrackerCreateRecorrenciaRequest): CreateRecorrenciaRequest {
    // Gerar ID do contrato se não informado
    const contractId = request.contractId || this.generateContractId();

    // Determinar se é CPF ou CNPJ
    const documentLength = request.customerDocument.replace(/\D/g, '').length;
    const isCpf = documentLength === 11;
    const isCnpj = documentLength === 14;

    if (!isCpf && !isCnpj) {
      throw new Error('Documento deve ser CPF (11 dígitos) ou CNPJ (14 dígitos)');
    }

    // Converter valor de centavos para string decimal
    const valor = (request.amount / 100).toFixed(2);

    const efiPayRequest: CreateRecorrenciaRequest = {
      vinculo: {
        contrato: contractId,
        devedor: {
          [isCpf ? 'cpf' : 'cnpj']: request.customerDocument.replace(/\D/g, ''),
          nome: request.customerName
        },
        objeto: request.description.length > 35 ? request.description.substring(0, 35) : request.description
      },
      calendario: {
        dataInicial: request.startDate,
        dataFinal: request.endDate,
        periodicidade: request.frequency
      },
      valor: request.isFixedAmount 
        ? { valorRec: valor }
        : { valorMinimoRecebedor: valor },
      politicaRetentativa: request.retryPolicy
    };

    // Adicionar ativação se informada
    if (request.activationTxid) {
      efiPayRequest.ativacao = {
        dadosJornada: {
          txid: request.activationTxid
        }
      };
    }

    return efiPayRequest;
  }

  private convertEfiPayToPagTrackerResponse(
    efiPayResponse: RecorrenciaResponse,
    originalRequest: PagTrackerCreateRecorrenciaRequest
  ): PagTrackerRecorrenciaResponse {
    // Converter valor de string decimal para centavos
    const valorString = efiPayResponse.valor?.valorRec || efiPayResponse.valor?.valorMinimoRecebedor || '0.00';
    const amount = Math.round(parseFloat(valorString) * 100);

    return {
      id: efiPayResponse.idRec,
      contractId: efiPayResponse.vinculo.contrato,
      customerName: efiPayResponse.vinculo.devedor.nome,
      customerDocument: efiPayResponse.vinculo.devedor.cpf || efiPayResponse.vinculo.devedor.cnpj || '',
      description: originalRequest.description,
      amount,
      frequency: efiPayResponse.calendario.periodicidade,
      startDate: efiPayResponse.calendario.dataInicial,
      endDate: efiPayResponse.calendario.dataFinal,
      status: efiPayResponse.status,
      retryPolicy: efiPayResponse.politicaRetentativa,
      qrCode: efiPayResponse.loc?.location,
      createdAt: efiPayResponse.atualizacao?.[0]?.data || new Date().toISOString(),
      tenantId: this.tenantId
    };
  }

  private generateContractId(): string {
    const timestamp = Date.now();
    const random = Math.random().toString(36).substring(2, 8);
    return `PAGTRACKER_${timestamp}_${random}`.substring(0, 35);
  }

  private handleEfiPayError(error: any, defaultMessage: string): Error {
    // Verifica se é um erro da EfiPay
    if (error.response?.data) {
      const efiError = error.response.data as EfiPayError;
      return new Error(`${defaultMessage}: ${efiError.mensagem}`);
    }

    // Verifica se já é um erro com detalhes
    if (error.message?.includes(':')) {
      return error;
    }

    // Retorna erro genérico
    return new Error(`${defaultMessage}: ${error.message || 'Erro desconhecido'}`);
  }

  /**
   * Valida se um valor é válido para recorrência
   */
  private isValidRecurrenceValue(v: any): boolean {
    return typeof v === 'string' && /^\d{1,10}\.\d{2}$/.test(v);
  }

  /**
   * Health check específico para PIX Automático
   */
  async healthCheck(): Promise<{
    status: 'healthy' | 'unhealthy';
    tests: Record<string, boolean>;
    message?: string;
  }> {
    const tests: Record<string, boolean> = {};

    try {
      // Teste 1: Autenticação
      try {
        await this.authService.getValidToken();
        tests.authentication = true;
      } catch {
        tests.authentication = false;
      }

      // Teste 2: Validação de request
      try {
        const testRequest: CreateRecorrenciaRequest = {
          vinculo: {
            contrato: 'TEST_CONTRACT',
            devedor: {
              cpf: '12345678909',
              nome: 'Teste'
            }
          },
          calendario: {
            dataInicial: '2025-01-01',
            periodicidade: 'MENSAL'
          },
          politicaRetentativa: 'NAO_PERMITE'
        };
        
        this.validateCreateRecorrenciaRequest(testRequest);
        tests.validation = true;
      } catch {
        tests.validation = false;
      }

      const isHealthy = Object.values(tests).every(Boolean);

      return {
        status: isHealthy ? 'healthy' : 'unhealthy',
        tests,
        message: isHealthy ? 'PIX Automático operacional' : 'PIX Automático com problemas'
      };

    } catch (error) {
      return {
        status: 'unhealthy',
        tests,
        message: `Erro no health check: ${error instanceof Error ? error.message : 'Erro desconhecido'}`
      };
    }
  }
} 