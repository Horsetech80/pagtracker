import axios, { AxiosInstance } from 'axios';
import { EfiPayAuthService } from './EfiPayAuthService';
import {
  CreateSolicRecRequest,
  SolicRecResponse,
  UpdateSolicRecRequest,
  ListSolicRecFilters,
  ListSolicRecResponse,
  PagTrackerCreateSolicRecRequest,
  PagTrackerSolicRecResponse,
  StatusSolicRecorrencia
} from '../../types/efipay';

/**
 * Service para gerenciar Solicitações de Confirmação de PIX Automático
 * Endpoints: /v2/solicrec
 * 
 * Funcionalidades:
 * - Criar solicitação de confirmação
 * - Consultar solicitação específica
 * - Atualizar/Revisar solicitação
 * - Listar solicitações com filtros
 * 
 * Escopos necessários: solicrec.read, solicrec.write
 */
export class EfiPayPixSolicRecService {
  private authService: EfiPayAuthService;
  private httpClient: AxiosInstance;
  private baseURL: string;

  constructor(authService: EfiPayAuthService) {
    this.authService = authService;
    this.baseURL = process.env.EFIPAY_SANDBOX === 'false' 
      ? 'https://pix.efipay.com.br' 
      : 'https://pix-h.efipay.com.br';
    
    this.httpClient = axios.create({
      baseURL: this.baseURL,
      timeout: 30000,
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
   * Criar solicitação de confirmação de recorrência PIX
   * POST /v2/solicrec
   */
  async createSolicRec(request: CreateSolicRecRequest): Promise<SolicRecResponse> {
    try {
      // Validar dados obrigatórios
      this.validateCreateSolicRecRequest(request);

      // Obter token de autenticação
      const token = await this.authService.getAccessToken();

      // Fazer requisição para EfiPay
      const response = await this.httpClient.post('/v2/solicrec', request, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      return response.data;
    } catch (error: any) {
      this.handleApiError(error, 'Erro ao criar solicitação de confirmação');
    }
  }

  /**
   * Consultar solicitação de confirmação específica
   * GET /v2/solicrec/:idSolicRec
   */
  async getSolicRec(idSolicRec: string): Promise<SolicRecResponse> {
    try {
      if (!idSolicRec) {
        throw new Error('ID da solicitação é obrigatório');
      }

      const token = await this.authService.getAccessToken();

      const response = await this.httpClient.get(`/v2/solicrec/${idSolicRec}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      return response.data;
    } catch (error: any) {
      this.handleApiError(error, 'Erro ao consultar solicitação de confirmação');
    }
  }

  /**
   * Atualizar/Revisar solicitação de confirmação
   * PATCH /v2/solicrec/:idSolicRec
   */
  async updateSolicRec(idSolicRec: string, updates: UpdateSolicRecRequest): Promise<SolicRecResponse> {
    try {
      if (!idSolicRec) {
        throw new Error('ID da solicitação é obrigatório');
      }

      // Validar campos de atualização
      this.validateUpdateSolicRecRequest(updates);

      const token = await this.authService.getAccessToken();

      const response = await this.httpClient.patch(`/v2/solicrec/${idSolicRec}`, updates, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      return response.data;
    } catch (error: any) {
      this.handleApiError(error, 'Erro ao atualizar solicitação de confirmação');
    }
  }

  /**
   * Listar solicitações de confirmação com filtros
   * GET /v2/solicrec
   */
  async listSolicRecs(filters: ListSolicRecFilters = {}): Promise<ListSolicRecResponse> {
    try {
      const token = await this.authService.getAccessToken();

      // Construir query parameters
      const queryParams = new URLSearchParams();
      
      if (filters.inicio) queryParams.append('inicio', filters.inicio);
      if (filters.fim) queryParams.append('fim', filters.fim);
      if (filters.cpf) queryParams.append('cpf', filters.cpf);
      if (filters.cnpj) queryParams.append('cnpj', filters.cnpj);
      if (filters.status) queryParams.append('status', filters.status);
      if (filters.itensPorPagina) queryParams.append('itensPorPagina', filters.itensPorPagina.toString());
      if (filters.paginaAtual) queryParams.append('paginaAtual', filters.paginaAtual.toString());

      const url = `/v2/solicrec${queryParams.toString() ? `?${queryParams.toString()}` : ''}`;

      const response = await this.httpClient.get(url, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      return response.data;
    } catch (error: any) {
      this.handleApiError(error, 'Erro ao listar solicitações de confirmação');
    }
  }

  // ================================================================
  // MÉTODOS PAGTRACKER (INTERFACE SIMPLIFICADA)
  // ================================================================

  /**
   * Criar solicitação usando interface simplificada do PagTracker
   */
  async createSolicRecForPagTracker(
    request: PagTrackerCreateSolicRecRequest,
    tenantId: string
  ): Promise<PagTrackerSolicRecResponse> {
    try {
      // Converter request PagTracker para formato EfiPay
      const efiRequest: CreateSolicRecRequest = {
        idRec: request.recorrenciaId,
        calendario: {
          dataExpiracaoSolicitacao: request.expirationDate
        },
        destinatario: {
          conta: request.bankAccount,
          ispbParticipante: request.bankIspb,
          agencia: request.bankAgency
        }
      };

      // Adicionar CPF ou CNPJ baseado no documento
      if (request.customerDocument.length === 11) {
        efiRequest.destinatario.cpf = request.customerDocument;
      } else if (request.customerDocument.length === 14) {
        efiRequest.destinatario.cnpj = request.customerDocument;
      } else {
        throw new Error('Documento deve ter 11 dígitos (CPF) ou 14 dígitos (CNPJ)');
      }

      // Criar solicitação na EfiPay
      const efiResponse = await this.createSolicRec(efiRequest);

      // Converter resposta para formato PagTracker
      const pagTrackerResponse: PagTrackerSolicRecResponse = {
        id: efiResponse.idSolicRec,
        recorrenciaId: efiResponse.idRec,
        customerDocument: request.customerDocument,
        bankAccount: request.bankAccount,
        bankAgency: request.bankAgency,
        bankIspb: request.bankIspb,
        status: efiResponse.status,
        expirationDate: efiResponse.calendario.dataExpiracaoSolicitacao,
        createdAt: efiResponse.atualizacao[0]?.data || new Date().toISOString(),
        updatedAt: efiResponse.atualizacao.length > 1 ? 
          efiResponse.atualizacao[efiResponse.atualizacao.length - 1].data : undefined,
        
        // Dados da recorrência associada (do recPayload)
        recorrencia: {
          contractId: efiResponse.recPayload.vinculo.contrato,
          customerName: efiResponse.recPayload.vinculo.devedor.nome,
          description: efiResponse.recPayload.vinculo.objeto || '',
          amount: Math.round(parseFloat(efiResponse.recPayload.valor.valorRec || '0') * 100),
          frequency: efiResponse.recPayload.calendario.periodicidade,
          startDate: efiResponse.recPayload.calendario.dataInicial,
          endDate: efiResponse.recPayload.calendario.dataFinal
        },
        
        tenantId
      };

      return pagTrackerResponse;
    } catch (error: any) {
      this.handleApiError(error, 'Erro ao criar solicitação (PagTracker)');
    }
  }

  /**
   * Aprovar solicitação de confirmação
   */
  async approveSolicRec(idSolicRec: string, observacoes?: string): Promise<SolicRecResponse> {
    return this.updateSolicRec(idSolicRec, {
      status: 'APROVADA',
      observacoes
    });
  }

  /**
   * Rejeitar solicitação de confirmação
   */
  async rejectSolicRec(idSolicRec: string, motivoRejeicao: string, observacoes?: string): Promise<SolicRecResponse> {
    return this.updateSolicRec(idSolicRec, {
      status: 'REJEITADA',
      motivoRejeicao,
      observacoes
    });
  }

  // ================================================================
  // VALIDAÇÕES
  // ================================================================

  private validateCreateSolicRecRequest(request: CreateSolicRecRequest): void {
    const errors: string[] = [];

    // Validar idRec
    if (!request.idRec) {
      errors.push('Campo idRec é obrigatório');
    } else if (!/^[a-zA-Z0-9]{29}$/.test(request.idRec)) {
      errors.push('idRec deve ter exatamente 29 caracteres alfanuméricos');
    }

    // Validar calendário
    if (!request.calendario?.dataExpiracaoSolicitacao) {
      errors.push('Data de expiração da solicitação é obrigatória');
    } else {
      try {
        new Date(request.calendario.dataExpiracaoSolicitacao);
      } catch {
        errors.push('Data de expiração deve estar no formato RFC 3339');
      }
    }

    // Validar destinatário
    if (!request.destinatario) {
      errors.push('Dados do destinatário são obrigatórios');
    } else {
      const { destinatario } = request;

      // CPF ou CNPJ
      if (!destinatario.cpf && !destinatario.cnpj) {
        errors.push('CPF ou CNPJ do destinatário é obrigatório');
      }
      
      if (destinatario.cpf && !/^\d{11}$/.test(destinatario.cpf)) {
        errors.push('CPF deve ter exatamente 11 dígitos');
      }
      
      if (destinatario.cnpj && !/^\d{14}$/.test(destinatario.cnpj)) {
        errors.push('CNPJ deve ter exatamente 14 dígitos');
      }

      // Conta
      if (!destinatario.conta) {
        errors.push('Número da conta é obrigatório');
      } else if (destinatario.conta.length > 20) {
        errors.push('Número da conta deve ter no máximo 20 caracteres');
      }

      // ISPB
      if (!destinatario.ispbParticipante) {
        errors.push('ISPB do participante é obrigatório');
      } else if (!/^\d{8}$/.test(destinatario.ispbParticipante)) {
        errors.push('ISPB deve ter exatamente 8 dígitos');
      }

      // Agência (opcional)
      if (destinatario.agencia && destinatario.agencia.length > 4) {
        errors.push('Agência deve ter no máximo 4 caracteres');
      }
    }

    if (errors.length > 0) {
      throw new Error(`Dados inválidos: ${errors.join(', ')}`);
    }
  }

  private validateUpdateSolicRecRequest(request: UpdateSolicRecRequest): void {
    const errors: string[] = [];

    // Validar status se fornecido
    if (request.status) {
      const validStatuses: StatusSolicRecorrencia[] = ['CRIADA', 'APROVADA', 'REJEITADA', 'EXPIRADA'];
      if (!validStatuses.includes(request.status)) {
        errors.push(`Status deve ser um dos valores: ${validStatuses.join(', ')}`);
      }

      // Se rejeitando, motivo é obrigatório
      if (request.status === 'REJEITADA' && !request.motivoRejeicao) {
        errors.push('Motivo da rejeição é obrigatório quando status = REJEITADA');
      }
    }

    if (errors.length > 0) {
      throw new Error(`Dados inválidos: ${errors.join(', ')}`);
    }
  }

  // ================================================================
  // UTILITÁRIOS
  // ================================================================

  /**
   * Verificar saúde do serviço de solicitações
   */
  async healthCheck(): Promise<{ status: string; timestamp: string; service: string }> {
    try {
      const token = await this.authService.getAccessToken();
      
      // Tentar fazer uma listagem simples para verificar conectividade
      await this.httpClient.get('/v2/solicrec?itensPorPagina=1', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      return {
        status: 'healthy',
        timestamp: new Date().toISOString(),
        service: 'efipay-pix-solicrec'
      };
    } catch (error) {
      return {
        status: 'unhealthy',
        timestamp: new Date().toISOString(),
        service: 'efipay-pix-solicrec'
      };
    }
  }

  /**
   * Tratar erros da API EfiPay
   */
  private handleApiError(error: any, context: string): never {
    if (error.response) {
      const status = error.response.status;
      const data = error.response.data;

      let errorMessage = `${context} - Status ${status}`;
      
      if (data?.detail) {
        errorMessage += `: ${data.detail}`;
      }
      
      if (data?.violacoes?.length > 0) {
        const violations = data.violacoes.map((v: any) => `${v.propriedade}: ${v.razao}`).join(', ');
        errorMessage += ` - Violações: ${violations}`;
      }

      throw new Error(errorMessage);
    } else if (error.request) {
      throw new Error(`${context} - Sem resposta do servidor EfiPay`);
    } else {
      throw new Error(`${context} - ${error.message}`);
    }
  }
} 