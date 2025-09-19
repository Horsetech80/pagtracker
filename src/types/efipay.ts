/**
 * EFIPAY PIX TYPES - PAGTRACKER V4.0
 * ===============================================
 * 
 * Interfaces TypeScript baseadas na documentação oficial EfiPay
 * https://dev.efipay.com.br/docs/api-pix/cobrancas-imediatas
 */

// ===== INTERFACES DE AUTENTICAÇÃO =====

export interface EfiPayCredentials {
  clientId: string;
  clientSecret: string;
  certificatePath: string;
  certificatePassword?: string;
  environment: 'development' | 'production';
  baseUrl: string;
}

export interface EfiPayAuthResponse {
  access_token: string;
  token_type: 'Bearer';
  expires_in: number;
  scope: string;
}

// ===== INTERFACES DE COBRANÇA PIX =====

/**
 * Calendário da cobrança (conforme documentação EfiPay)
 */
export interface PixCalendario {
  /** Timestamp RFC 3339 de criação da cobrança */
  criacao?: string;
  /** Tempo de vida em segundos (min: 1, max: int32) */
  expiracao: number;
}

/**
 * Pessoa Física - Devedor (conforme documentação EfiPay)
 */
export interface PixDevedorPF {
  /** CPF do devedor - formato: 11 dígitos */
  cpf: string;
  /** Nome do devedor - máximo 200 caracteres */
  nome: string;
}

/**
 * Pessoa Jurídica - Devedor (conforme documentação EfiPay)
 */
export interface PixDevedorPJ {
  /** CNPJ do devedor - formato: 14 dígitos */
  cnpj: string;
  /** Nome/Razão social do devedor - máximo 200 caracteres */
  nome: string;
}

/**
 * Valor da cobrança (conforme especificação EMV/BR Code)
 */
export interface PixValor {
  /** Valor original - formato: "0.00" com ponto decimal */
  original: string;
}

/**
 * Informações adicionais (máximo 50 itens)
 */
export interface PixInfoAdicional {
  /** Nome do campo - máximo 50 caracteres */
  nome: string;
  /** Valor do campo - máximo 200 caracteres */
  valor: string;
}

/**
 * Location para QR Code estático
 */
export interface PixLocation {
  /** ID do location cadastrado */
  id: number;
}

/**
 * Request para criar cobrança PIX (conforme documentação EfiPay)
 */
export interface PixCobrancaRequest {
  /** Controle de tempo da cobrança */
  calendario: PixCalendario;
  /** Devedor (opcional) - CPF ou CNPJ */
  devedor?: PixDevedorPF | PixDevedorPJ;
  /** Valor da cobrança */
  valor: PixValor;
  /** Chave PIX do recebedor - máximo 77 caracteres */
  chave: string;
  /** Solicitação ao pagador - máximo 140 caracteres */
  solicitacaoPagador?: string;
  /** Informações adicionais - máximo 50 itens */
  infoAdicionais?: PixInfoAdicional[];
  /** Location para QR Code estático */
  loc?: PixLocation;
}

/**
 * Request para atualizar cobrança PIX (PATCH /v2/cob/:txid)
 * Todos os campos são opcionais para permitir atualizações parciais
 */
export interface PixCobrancaUpdateRequest {
  /** Controle de tempo da cobrança */
  calendario?: PixCalendario;
  /** Devedor (opcional) - CPF ou CNPJ */
  devedor?: PixDevedorPF | PixDevedorPJ;
  /** Valor da cobrança */
  valor?: PixValor;
  /** Chave PIX do recebedor - máximo 77 caracteres */
  chave?: string;
  /** Solicitação ao pagador - máximo 140 caracteres */
  solicitacaoPagador?: string;
  /** Informações adicionais - máximo 50 itens */
  infoAdicionais?: PixInfoAdicional[];
  /** Location para QR Code estático */
  loc?: PixLocation;
}

// ===== INTERFACES DE RESPOSTA =====

/**
 * Location na resposta da cobrança
 */
export interface PixLocationResponse {
  /** ID do location */
  id: number;
  /** URL do location */
  location: string;
  /** Tipo da cobrança */
  tipoCob: 'cob';
}

/**
 * Status da cobrança PIX
 */
export type PixCobrancaStatus = 'ATIVA' | 'CONCLUIDA' | 'REMOVIDA_PELO_USUARIO_RECEBEDOR' | 'REMOVIDA_PELO_PSP';

/**
 * Informações do PIX recebido
 */
export interface PixRecebido {
  /** End to End ID do PIX */
  endToEndId: string;
  /** Transaction ID */
  txid: string;
  /** Valor recebido */
  valor: string;
  /** Horário do recebimento */
  horario: string;
  /** Informações do pagador */
  pagador?: PixDevedorPF | PixDevedorPJ;
  /** Informação do pagador */
  infoPagador?: string;
  /** Devoluções */
  devolucoes?: PixDevolucao[];
}

/**
 * Devolução PIX
 */
export interface PixDevolucao {
  /** ID da devolução */
  id: string;
  /** Return ID */
  rtrId: string;
  /** Valor da devolução */
  valor: string;
  /** Horário da solicitação */
  horario: {
    solicitacao: string;
  };
  /** Status da devolução */
  status: 'EM_PROCESSAMENTO' | 'DEVOLVIDO' | 'NAO_REALIZADO';
}

/**
 * Response completa da cobrança PIX (conforme documentação EfiPay)
 */
export interface PixCobrancaResponse {
  /** Calendário da cobrança */
  calendario: PixCalendario & { criacao: string };
  /** Transaction ID gerado */
  txid: string;
  /** Número da revisão */
  revisao: number;
  /** Location information */
  loc?: PixLocationResponse;
  /** URL do location (deprecated, use loc.location) */
  location?: string;
  /** Status atual da cobrança */
  status: PixCobrancaStatus;
  /** Devedor da cobrança */
  devedor?: PixDevedorPF | PixDevedorPJ;
  /** Valor da cobrança */
  valor: PixValor;
  /** Chave PIX utilizada */
  chave: string;
  /** Solicitação ao pagador */
  solicitacaoPagador?: string;
  /** Informações adicionais */
  infoAdicionais?: PixInfoAdicional[];
  /** Código PIX Copia e Cola */
  pixCopiaECola?: string;
  /** PIX recebidos (quando status = CONCLUIDA) */
  pix?: PixRecebido[];
}

// ===== INTERFACES DE ERRO =====

/**
 * Tipos de erro EfiPay (conforme documentação)
 */
export type EfiPayErrorType = 
  | 'documento_bloqueado'
  | 'chave_invalida'
  | 'valor_invalido'
  | 'txid_duplicado'
  | 'cobranca_nao_encontrada'
  | 'status_cobranca_invalido'
  | 'erro_aplicacao';

/**
 * Error response da EfiPay
 */
export interface EfiPayError {
  /** Nome do erro */
  nome: EfiPayErrorType | string;
  /** Mensagem descritiva */
  mensagem: string;
}

// ===== INTERFACES DE LISTAGEM =====

/**
 * Parâmetros de paginação
 */
export interface PixPaginacao {
  paginaAtual: number;
  itensPorPagina: number;
  quantidadeDePaginas: number;
  quantidadeTotalDeItens: number;
}

/**
 * Parâmetros para listagem de cobranças
 */
export interface PixListagemRequest {
  /** Data início (obrigatório) - RFC 3339 */
  inicio: string;
  /** Data fim (obrigatório) - RFC 3339 */
  fim: string;
  /** CPF do devedor */
  cpf?: string;
  /** CNPJ do devedor */
  cnpj?: string;
  /** Status da cobrança */
  status?: PixCobrancaStatus;
  /** Página atual */
  paginaAtual?: number;
  /** Itens por página */
  itensPorPagina?: number;
}

/**
 * Response da listagem de cobranças
 */
export interface PixListagemResponse {
  /** Parâmetros utilizados na consulta */
  parametros: {
    inicio: string;
    fim: string;
    paginacao: PixPaginacao;
  };
  /** Lista de cobranças */
  cobs: PixCobrancaResponse[];
}

// ===== INTERFACES INTERNAS PAGTRACKER =====

/**
 * Dados internos do PagTracker para criar cobrança PIX
 */
export interface PagTrackerPixRequest {
  /** ID do tenant */
  tenantId: string;
  /** Valor em centavos (compatibilidade interna) */
  amount: number;
  /** Valor original em reais para EfiPay (formato decimal) */
  originalAmount?: number;
  /** Descrição da cobrança */
  description: string;
  /** Email do cliente */
  customerEmail?: string;
  /** Nome do cliente */
  customerName?: string;
  /** CPF/CNPJ do cliente */
  customerDocument?: string;
  /** Tempo de expiração em segundos (padrão: 3600) */
  expirationTime?: number;
  /** Informações adicionais */
  additionalInfo?: { [key: string]: string };
}

/**
 * Response interna do PagTracker
 */
export interface PagTrackerPixResponse {
  /** Sucesso da operação */
  success: boolean;
  /** Dados da cobrança (se sucesso) */
  data?: {
    /** ID interno do PagTracker */
    id: string;
    /** Transaction ID da EfiPay */
    txid: string;
    /** Valor da cobrança */
    amount: number;
    /** Status da cobrança */
    status: PixCobrancaStatus;
    /** Código PIX Copia e Cola */
    pixCopiaECola: string;
    /** URL do QR Code */
    qrCodeUrl?: string;
    /** Data de criação */
    createdAt: string;
    /** Data de expiração */
    expiresAt: string;
  };
  /** Mensagem de erro (se falha) */
  message?: string;
  /** Código do erro */
  errorCode?: string;
}

// ================================================================
// PIX AUTOMÁTICO (RECORRÊNCIAS) - FASE 3
// ================================================================

/**
 * Periodicidade das cobranças recorrentes
 */
export type RecorrenciaPeriodicidade = 'SEMANAL' | 'MENSAL' | 'TRIMESTRAL' | 'SEMESTRAL' | 'ANUAL';

/**
 * Política de retentativa pós vencimento
 */
export type PoliticaRetentativa = 'NAO_PERMITE' | 'PERMITE_3R_7D';

/**
 * Status da recorrência
 */
export type StatusRecorrencia = 'CRIADA' | 'ATIVA' | 'PAUSADA' | 'CANCELADA' | 'EXPIRADA';

/**
 * Dados do vínculo da recorrência
 */
export interface RecorrenciaVinculo {
  contrato: string; // máx 35 chars
  devedor: {
    cpf?: string; // regex: ^\d{11}$
    cnpj?: string; // regex: ^\d{14}$
    nome: string; // máx 140 chars
  };
  objeto?: string; // máx 35 chars - descrição do contrato
}

/**
 * Calendário da recorrência
 */
export interface RecorrenciaCalendario {
  dataInicial: string; // formato YYYY-MM-DD
  dataFinal?: string; // formato YYYY-MM-DD (opcional para tempo indeterminado)
  periodicidade: RecorrenciaPeriodicidade;
}

/**
 * Valor da recorrência
 */
export interface RecorrenciaValor {
  valorRec?: string; // valor fixo (regex: \d{1,10}\.\d{2})
  valorMinimoRecebedor?: string; // valor mínimo (não pode ser usado com valorRec)
}

/**
 * Dados do recebedor
 */
export interface RecorrenciaRecebedor {
  cnpj?: number;
  nome?: string;
  convenio?: string; // máx 60 chars
}

/**
 * Dados de ativação da recorrência
 */
export interface RecorrenciaAtivacao {
  dadosJornada: {
    tipoJornada?: string; // ex: 'JORNADA_3'
    txid: string; // identificador da transação de ativação (26-35 chars alfanuméricos)
  };
}

/**
 * Location da recorrência
 */
export interface RecorrenciaLocation {
  criacao?: string; // ISO 8601
  id: number;
  location?: string;
  idRec?: string;
}

/**
 * Histórico de atualizações
 */
export interface RecorrenciaAtualizacao {
  data: string; // ISO 8601
  nome: string; // ex: 'CRIADA', 'ATIVA', etc.
}

/**
 * Request para criar recorrência PIX Automático
 */
export interface CreateRecorrenciaRequest {
  vinculo: RecorrenciaVinculo;
  calendario: RecorrenciaCalendario;
  valor?: RecorrenciaValor;
  politicaRetentativa: PoliticaRetentativa;
  loc?: number; // ID da location
  ativacao?: RecorrenciaAtivacao;
  recebedor?: RecorrenciaRecebedor;
}

/**
 * Response da criação/consulta de recorrência
 */
export interface RecorrenciaResponse {
  idRec: string; // ID único da recorrência
  vinculo: RecorrenciaVinculo;
  calendario: RecorrenciaCalendario;
  valor: RecorrenciaValor;
  politicaRetentativa: PoliticaRetentativa;
  recebedor: RecorrenciaRecebedor;
  status: StatusRecorrencia;
  loc: RecorrenciaLocation;
  ativacao?: RecorrenciaAtivacao;
  atualizacao: RecorrenciaAtualizacao[];
}

/**
 * Request para atualizar recorrência
 */
export interface UpdateRecorrenciaRequest {
  calendario?: Partial<RecorrenciaCalendario>;
  valor?: Partial<RecorrenciaValor>;
  politicaRetentativa?: PoliticaRetentativa;
  status?: StatusRecorrencia;
}

/**
 * Filtros para listar recorrências
 */
export interface ListRecorrenciasFilters {
  inicio?: string; // data início (ISO 8601)
  fim?: string; // data fim (ISO 8601)
  cpf?: string; // filtrar por CPF do devedor
  cnpj?: string; // filtrar por CNPJ do devedor
  status?: StatusRecorrencia; // filtrar por status
  itensPorPagina?: number; // paginação (padrão: 100)
  paginaAtual?: number; // página atual (padrão: 0)
}

/**
 * Response da listagem de recorrências
 */
export interface ListRecorrenciasResponse {
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
  recorrencias: RecorrenciaResponse[];
}

// ================================================================
// SOLICITAÇÕES DE CONFIRMAÇÃO - PIX AUTOMÁTICO
// ================================================================

/**
 * Tipos de jornada para confirmação
 */
export type TipoJornada = 'JORNADA_1' | 'JORNADA_2' | 'JORNADA_3';

/**
 * Status da solicitação de confirmação
 */
export type StatusSolicitacao = 'PENDENTE' | 'CONFIRMADA' | 'REJEITADA' | 'EXPIRADA';

/**
 * Request para criar solicitação de confirmação
 */
export interface CreateSolicitacaoConfirmacaoRequest {
  idRec: string; // ID da recorrência
  dadosJornada: {
    tipoJornada: TipoJornada;
    txid?: string; // opcional para algumas jornadas
  };
}

/**
 * Response da solicitação de confirmação
 */
export interface SolicitacaoConfirmacaoResponse {
  idSolicitacao: string;
  idRec: string;
  status: StatusSolicitacao;
  dadosJornada: {
    tipoJornada: TipoJornada;
    txid?: string;
    urlConfirmacao?: string; // URL para confirmação pelo usuário
  };
  criacao: string; // ISO 8601
  atualizacao?: string; // ISO 8601
}

/**
 * Request para revisar solicitação de confirmação
 */
export interface UpdateSolicitacaoConfirmacaoRequest {
  status: StatusSolicitacao;
  motivoRejeicao?: string; // obrigatório se status = 'REJEITADA'
}

// ================================================================
// INTERFACES PAGTRACKER PARA PIX AUTOMÁTICO
// ================================================================

/**
 * Interface simplificada para o PagTracker criar recorrências
 */
export interface PagTrackerCreateRecorrenciaRequest {
  // Dados do cliente
  customerName: string;
  customerDocument: string; // CPF ou CNPJ
  customerEmail?: string;
  
  // Dados da recorrência
  description: string; // descrição do serviço/produto
  contractId?: string; // ID do contrato (opcional, será gerado se não informado)
  
  // Valor
  amount: number; // valor em centavos (será convertido para string com 2 decimais)
  isFixedAmount: boolean; // se true, usa valorRec; se false, usa valorMinimoRecebedor
  
  // Periodicidade
  frequency: RecorrenciaPeriodicidade;
  startDate: string; // data inicial (YYYY-MM-DD)
  endDate?: string; // data final (opcional para recorrência por tempo indeterminado)
  
  // Configurações
  retryPolicy: PoliticaRetentativa;
  
  // Ativação (opcional)
  activationTxid?: string; // TXID da transação que ativa a recorrência
}

/**
 * Response simplificada do PagTracker para recorrências
 */
export interface PagTrackerRecorrenciaResponse {
  id: string; // idRec da EfiPay
  contractId: string;
  customerName: string;
  customerDocument: string;
  description: string;
  amount: number; // em centavos
  frequency: RecorrenciaPeriodicidade;
  startDate: string;
  endDate?: string;
  status: StatusRecorrencia;
  retryPolicy: PoliticaRetentativa;
  qrCode?: string; // QR Code para ativação (se necessário)
  activationUrl?: string; // URL para ativação pelo cliente
  createdAt: string;
  updatedAt?: string;
  tenantId: string;
}

// ================================================================
// SOLICITAÇÕES DE CONFIRMAÇÃO SEPARADAS - /v2/solicrec
// ================================================================

/**
 * Status das solicitações de confirmação
 */
export type StatusSolicRecorrencia = 'CRIADA' | 'APROVADA' | 'REJEITADA' | 'EXPIRADA';

/**
 * Dados do destinatário da solicitação
 */
export interface SolicRecDestinatario {
  cpf?: string; // regex: ^\d{11}$
  cnpj?: string; // regex: ^\d{14}$
  conta: string; // máx 20 chars
  ispbParticipante: string; // 8 dígitos
  agencia?: string; // máx 4 chars
}

/**
 * Calendário da solicitação de confirmação
 */
export interface SolicRecCalendario {
  dataExpiracaoSolicitacao: string; // RFC 3339
}

/**
 * Histórico de atualizações da solicitação
 */
export interface SolicRecAtualizacao {
  data: string; // ISO 8601
  status: string; // status da atualização
}

/**
 * Payload da recorrência dentro da solicitação
 */
export interface SolicRecPayload {
  idRec: string;
  vinculo: RecorrenciaVinculo;
  calendario: RecorrenciaCalendario;
  recebedor: RecorrenciaRecebedor;
  valor: RecorrenciaValor;
  atualizacao: RecorrenciaAtualizacao[];
}

/**
 * Request para criar solicitação de confirmação
 * POST /v2/solicrec
 */
export interface CreateSolicRecRequest {
  idRec: string; // regex: [a-zA-Z0-9]{29}
  calendario: SolicRecCalendario;
  destinatario: SolicRecDestinatario;
}

/**
 * Response da solicitação de confirmação
 */
export interface SolicRecResponse {
  idSolicRec: string; // ID único da solicitação
  idRec: string; // ID da recorrência associada
  calendario: SolicRecCalendario;
  status: StatusSolicRecorrencia;
  destinatario: SolicRecDestinatario;
  atualizacao: SolicRecAtualizacao[];
  recPayload: SolicRecPayload; // dados completos da recorrência
}

/**
 * Request para atualizar solicitação de confirmação
 * PATCH /v2/solicrec/:idSolicRec
 */
export interface UpdateSolicRecRequest {
  status?: StatusSolicRecorrencia;
  motivoRejeicao?: string; // obrigatório se status = 'REJEITADA'
  observacoes?: string; // observações adicionais
}

/**
 * Filtros para listar solicitações de confirmação
 */
export interface ListSolicRecFilters {
  inicio?: string; // data início (ISO 8601)
  fim?: string; // data fim (ISO 8601)
  cpf?: string; // filtrar por CPF do destinatário
  cnpj?: string; // filtrar por CNPJ do destinatário
  status?: StatusSolicRecorrencia; // filtrar por status
  itensPorPagina?: number; // paginação (padrão: 100)
  paginaAtual?: number; // página atual (padrão: 0)
}

/**
 * Response da listagem de solicitações
 */
export interface ListSolicRecResponse {
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
  solicrecs: SolicRecResponse[];
}

// ================================================================
// INTERFACES PAGTRACKER PARA SOLICITAÇÕES
// ================================================================

/**
 * Interface simplificada PagTracker para criar solicitação
 */
export interface PagTrackerCreateSolicRecRequest {
  // Dados da recorrência
  recorrenciaId: string; // ID da recorrência
  
  // Dados do destinatário
  customerDocument: string; // CPF ou CNPJ
  bankAccount: string; // conta bancária
  bankAgency?: string; // agência (opcional)
  bankIspb: string; // ISPB do banco
  
  // Configurações
  expirationDate: string; // data de expiração (ISO 8601)
  
  // Metadados
  description?: string; // descrição adicional
}

/**
 * Response simplificada PagTracker para solicitações
 */
export interface PagTrackerSolicRecResponse {
  id: string; // idSolicRec
  recorrenciaId: string; // idRec
  customerDocument: string;
  bankAccount: string;
  bankAgency?: string;
  bankIspb: string;
  status: StatusSolicRecorrencia;
  expirationDate: string;
  createdAt: string;
  updatedAt?: string;
  
  // Dados da recorrência associada
  recorrencia: {
    contractId: string;
    customerName: string;
    description: string;
    amount: number; // em centavos
    frequency: RecorrenciaPeriodicidade;
    startDate: string;
    endDate?: string;
  };
  
  tenantId: string;
}

// ================================================================
// PIX ENVIO (PIX SEND) - /v3/gn/pix/:idEnvio
// ================================================================

/**
 * Status do envio PIX
 */
export type StatusPixEnvio = 'EM_PROCESSAMENTO' | 'REALIZADO' | 'NAO_REALIZADO';

/**
 * Tipos de conta bancária
 */
export type TipoContaBancaria = 'cacc' | 'svgs'; // cacc = conta corrente, svgs = poupança

/**
 * Dados do pagador PIX
 */
export interface PixPagador {
  chave: string; // máx 77 chars - chave PIX do pagador
  infoPagador?: string; // máx 140 chars - informação sobre o pagamento
}

/**
 * Dados do favorecido PIX por chave
 */
export interface PixFavorecidoChave {
  chave: string; // máx 77 chars - chave PIX do favorecido
  cpf?: string; // validação de titularidade (opcional)
  cnpj?: string; // validação de titularidade (opcional)
}

/**
 * Dados bancários do favorecido
 */
export interface PixContaBanco {
  nome: string; // máx 200 chars - nome do recebedor
  cpf?: string; // 11 dígitos
  cnpj?: string; // 14 dígitos
  codigoBanco: string; // 8 dígitos - ISPB
  agencia: string; // 1-4 dígitos - sem DV
  conta: string; // conta com DV, sem traço
  tipoConta: TipoContaBancaria; // cacc ou svgs
}

/**
 * Union type para favorecido (chave ou dados bancários)
 */
export type PixFavorecido = PixFavorecidoChave | { contaBanco: PixContaBanco };

/**
 * Request para envio de PIX
 * PUT /v3/gn/pix/:idEnvio
 */
export interface PixEnvioRequest {
  valor: string; // formato: \d{1,10}\.\d{2} (ex: "12.34")
  pagador: PixPagador;
  favorecido: PixFavorecido;
}

/**
 * Horário da solicitação
 */
export interface PixEnvioHorario {
  solicitacao: string; // ISO 8601
}

/**
 * Response do envio PIX
 */
export interface PixEnvioResponse {
  idEnvio: string; // ID da transação
  e2eId: string; // ID end-to-end do PIX
  valor: string; // valor enviado
  horario: PixEnvioHorario;
  status: StatusPixEnvio;
}

/**
 * Headers de resposta do PIX Envio
 */
export interface PixEnvioHeaders {
  'Bucket-Size'?: number; // fichas restantes no balde
  'Retry-After'?: number; // segundos para tentar novamente
}

/**
 * Informações de rate limiting
 */
export interface PixEnvioRateLimit {
  bucketSize: number; // fichas disponíveis
  retryAfter?: number; // tempo para retry em segundos
}

/**
 * Dados para webhook de PIX Envio
 */
export interface PixEnvioWebhook {
  idEnvio: string;
  e2eId: string;
  valor: string;
  status: StatusPixEnvio;
  horario: {
    solicitacao: string;
    processamento?: string;
  };
  // Campos adicionais para devoluções
  natureza?: 'ORIGINAL'; // para devoluções
  valorDevolucao?: string;
}

// ================================================================
// NOVAS INTERFACES PARA PIX ENVIO v2/v3
// ================================================================

/**
 * Identificação do favorecido no PIX enviado
 */
export interface PixEnviadoIdentificacao {
  nome: string;
  cpf: string; // mascarado: ***.456.789-**
}

/**
 * Horários do PIX enviado
 */
export interface PixEnviadoHorario {
  solicitacao: string; // ISO 8601
  liquidacao?: string; // ISO 8601 (opcional)
}

/**
 * Response da consulta de PIX enviado por e2eId
 * GET /v2/gn/pix/enviados/:e2eId
 */
export interface PixEnviadoResponse {
  endToEndId: string;
  idEnvio: string;
  valor: string;
  chave: string;
  status: StatusPixEnvio;
  infoPagador?: string;
  horario: PixEnviadoHorario;
  favorecido: PixEnviadoFavorecido;
}

/**
 * Response da consulta de PIX enviado por idEnvio
 * GET /v2/gn/pix/enviados/id-envio/:idEnvio
 */
export interface PixEnviadoPorIdResponse extends PixEnviadoResponse {}



/**
 * Response da listagem de PIX enviados
 * GET /v2/gn/pix/enviados
 */
export interface ListPixEnviadosResponse {
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
  pix: PixEnviadoResponse[];
}

/**
 * Request para PIX de mesma titularidade
 * PUT /v2/gn/pix/:idEnvio/mesma-titularidade
 */
export interface PixMesmaTitularidadeRequest {
  valor: string; // formato: \d{1,10}\.\d{2}
  pagador: {
    chave: string; // chave PIX do pagador
    infoPagador?: string; // máx 140 chars
  };
  favorecido: {
    contaBanco: {
      nome: string; // máx 200 chars
      cpf?: string; // 11 dígitos
      cnpj?: string; // 14 dígitos
      codigoBanco: string; // 8 dígitos ISPB
      agencia: string; // 1-4 dígitos sem DV
      conta: string; // conta com DV, sem traço
      tipoConta: TipoContaBancaria; // cacc ou svgs
    };
  };
}

/**
 * Response do PIX de mesma titularidade
 */
export interface PixMesmaTitularidadeResponse {
  idEnvio: string;
  e2eId: string;
  valor: string;
  horario: {
    solicitacao: string;
  };
  status: StatusPixEnvio;
}

/**
 * Error para PIX enviado não encontrado
 */
export interface PixEnviadoNotFoundError {
  nome: 'pix_enviado_nao_encontrado';
  mensagem: string;
}

// ================================================================
// INTERFACES PAGTRACKER PARA PIX ENVIO
// ================================================================

/**
 * Interface simplificada PagTracker para envio PIX
 */
export interface PagTrackerPixEnvioRequest {
  // Valor
  amount: number; // em centavos

  // Pagador
  payerPixKey: string; // chave PIX do pagador
  payerInfo?: string; // informação adicional

  // Favorecido (chave ou dados bancários)
  recipient: {
    // Por chave PIX
    pixKey?: string;
    // Por dados bancários
    bankData?: {
      name: string;
      document: string; // CPF ou CNPJ
      bankCode: string; // ISPB
      agency: string;
      account: string;
      accountType: 'checking' | 'savings'; // conta corrente ou poupança
    };
  };

  // Validações opcionais
  validateRecipientDocument?: boolean; // validar titularidade da chave

  // Metadados
  description?: string;
  reference?: string; // referência interna
  tags?: string[]; // tags para organização
}

/**
 * Response simplificada PagTracker para envio PIX
 */
export interface PagTrackerPixEnvioResponse {
  id: string; // idEnvio
  e2eId: string; // ID end-to-end
  amount: number; // em centavos
  status: StatusPixEnvio;
  
  // Rate limiting
  rateLimitInfo: {
    tokensRemaining: number; // fichas restantes
    retryAfterSeconds?: number; // tempo para retry
  };

  // Dados do envio
  payer: {
    pixKey: string;
    info?: string;
  };
  
  recipient: {
    pixKey?: string;
    bankData?: {
      name: string;
      document: string;
      bankCode: string;
      agency: string;
      account: string;
      accountType: string;
    };
  };

  // Timestamps
  createdAt: string;
  processedAt?: string;

  // Metadata
  description?: string;
  reference?: string;
  tags?: string[];
  
  tenantId: string;
}

/**
 * Filtros para listar envios PIX
 */
export interface ListPixEnviosFilters {
  inicio?: string; // data início
  fim?: string; // data fim
  status?: StatusPixEnvio; // filtrar por status
  pagadorChave?: string; // filtrar por chave do pagador
  favorecidoChave?: string; // filtrar por chave do favorecido
  valorMin?: number; // valor mínimo em centavos
  valorMax?: number; // valor máximo em centavos
  itensPorPagina?: number; // paginação
  paginaAtual?: number; // página atual
}

/**
 * Response da listagem de envios PIX
 */
export interface ListPixEnviosResponse {
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
  envios: PixEnvioResponse[];
}

/**
 * Request PagTracker para consultar PIX enviado por e2eId
 */
export interface PagTrackerConsultarPixEnviadoRequest {
  e2eId: string;
  tenantId: string;
}

/**
 * Request PagTracker para consultar PIX enviado por idEnvio
 */
export interface PagTrackerConsultarPixPorIdRequest {
  idEnvio: string;
  tenantId: string;
}

/**
 * Request PagTracker para listar PIX enviados
 */
export interface PagTrackerListarPixEnviadosRequest {
  startDate: string; // ISO 8601
  endDate: string; // ISO 8601
  page?: number;
  itemsPerPage?: number;
  tenantId: string;
}

/**
 * Response PagTracker para consulta de PIX enviado
 */
// Removendo definição duplicada - usando apenas a versão da linha 1373
export interface PagTrackerPixEnviadoResponse {
  endToEndId: string; // ID end-to-end
  originalSendId: string; // ID do envio original
  amount: number; // Valor em centavos
  payerPixKey: string; // Chave PIX do pagador
  status: StatusPixEnvio; // Status
  payerInfo?: string; // Informação do pagador
  
  // Dados do favorecido
  recipient: {
    // Por chave PIX
    pixKey?: string;
    identification?: {
      name: string;
      document: string; // CPF mascarado
    };
    // Por dados bancários
    bankData?: {
      name?: string;
      document?: string; // CPF mascarado
      bankCode?: string; // ISPB
      agency?: string;
      account?: string;
      accountType?: string; // "corrente" ou "poupanca"
    };
  };

  // Timestamps
  requestedAt: string; // Horário da solicitação
  settledAt?: string; // Horário da liquidação (se realizado)

  // Metadata PagTracker
  tenantId: string;
  searchableText?: string; // Para facilitar buscas
}

/**
 * Response PagTracker para listagem de PIX enviados
 */
export interface PagTrackerListarPixEnviadosResponse {
  success: boolean;
  data?: {
    filters: {
      startDate: string;
      endDate: string;
      pagination: {
        currentPage: number;
        itemsPerPage: number;
        totalPages: number;
        totalItems: number;
      };
    };
    pixSent: Array<{
      endToEndId: string;
      idEnvio: string;
      amount: number; // em centavos
      pixKey: string;
      status: StatusPixEnvio;
      payerInfo?: string;
      requestedAt: string;
      settledAt?: string;
      recipient: {
        pixKey: string;
        identification: {
          name: string;
          document: string;
        };
        bankData: {
          bankCode: string;
        };
      };
    }>;
  };
  message?: string;
  errorCode?: string;
}

/**
 * Request PagTracker para PIX de mesma titularidade
 */
export interface PagTrackerPixMesmaTitularidadeRequest {
  idEnvio: string;
  amount: number; // em centavos
  payerPixKey: string;
  payerInfo?: string;
  
  // Dados bancários do favorecido
  recipientBankData: {
    name: string;
    document: string; // CPF ou CNPJ
    bankCode: string; // ISPB
    agency: string;
    account: string;
    accountType: 'checking' | 'savings';
  };
  
  // Metadados
  description?: string;
  reference?: string;
  tags?: string[];
  tenantId: string;
}

/**
 * Response PagTracker para PIX de mesma titularidade
 */
export interface PagTrackerPixMesmaTitularidadeResponse {
  success: boolean;
  data?: {
    idEnvio: string;
    e2eId: string;
    amount: number; // em centavos
    status: StatusPixEnvio;
    requestedAt: string;
    
    // Dados do envio
    payer: {
      pixKey: string;
      info?: string;
    };
    
    recipient: {
      bankData: {
        name: string;
        document: string;
        bankCode: string;
        agency: string;
        account: string;
        accountType: string;
      };
    };
    
    // Metadados
    description?: string;
    reference?: string;
    tags?: string[];
    tenantId: string;
  };
  message?: string;
  errorCode?: string;
}

// ================================================================
// CONSULTA PIX ENVIADO POR E2E ID - /v2/gn/pix/enviados/:e2eId
// ================================================================

/**
 * Identificação do favorecido PIX enviado
 */
export interface PixEnviadoIdentificacao {
  nome: string;
  cpf: string; // Formato mascarado: ***.456.789-**
}

/**
 * Conta bancária do favorecido PIX enviado
 */
export interface PixEnviadoContaBanco {
  nome?: string; // Nome do titular (quando enviado por dados bancários)
  cpf?: string; // CPF mascarado
  codigoBanco?: string; // ISPB do banco
  agencia?: string; // Agência
  conta?: string; // Conta
  tipoConta?: string; // "corrente" ou "poupanca"
}

/**
 * Dados do favorecido PIX enviado
 */
export interface PixEnviadoFavorecido {
  chave?: string; // Chave PIX (quando enviado por chave)
  identificacao?: PixEnviadoIdentificacao; // Dados do titular da chave
  contaBanco?: PixEnviadoContaBanco; // Dados bancários (quando enviado por dados bancários)
}

/**
 * Horários do PIX enviado
 */
export interface PixEnviadoHorario {
  solicitacao: string; // ISO 8601
  liquidacao?: string; // ISO 8601 - só aparece quando status = REALIZADO
}

/**
 * Response da consulta PIX enviado por e2eId
 * GET /v2/gn/pix/enviados/:e2eId
 */
export interface PixEnviadoResponse {
  endToEndId: string; // ID end-to-end (32 chars)
  idEnvio: string; // ID do envio original
  valor: string; // Valor em formato decimal
  chave: string; // Chave PIX do pagador
  status: StatusPixEnvio; // Status atual do PIX
  infoPagador?: string; // Informação do pagador
  horario: PixEnviadoHorario; // Horários da transação
  favorecido: PixEnviadoFavorecido; // Dados do favorecido
}

/**
 * Erro 404 específico para PIX enviado não encontrado
 */
export interface PixEnviadoNotFoundError {
  type: string; // "https://pix.bcb.gov.br/api/v2/error/PixEnviadoNaoEncontrado"
  title: string; // "Não Encontrado"
  status: 404;
  detail: string; // "Pix enviado não encontrado para o e2eId informado."
}

/**
 * Filtros para listar PIX enviados (possível extensão futura)
 */
export interface ListPixEnviadosFilters {
  inicio?: string; // Data início
  fim?: string; // Data fim
  status?: StatusPixEnvio; // Filtrar por status
  chave?: string; // Filtrar por chave pagador
  valorMin?: number; // Valor mínimo em centavos
  valorMax?: number; // Valor máximo em centavos
  itensPorPagina?: number; // Paginação
  paginaAtual?: number; // Página atual
}

/**
 * Interface PagTracker simplificada para PIX enviado
 */
export interface PagTrackerPixEnviadoResponse {
  endToEndId: string; // ID end-to-end
  originalSendId: string; // ID do envio original
  amount: number; // Valor em centavos
  payerPixKey: string; // Chave PIX do pagador
  status: StatusPixEnvio; // Status
  payerInfo?: string; // Informação do pagador
  
  // Dados do favorecido
  recipient: {
    // Por chave PIX
    pixKey?: string;
    identification?: {
      name: string;
      document: string; // CPF mascarado
    };
    // Por dados bancários
    bankData?: {
      name?: string;
      document?: string; // CPF mascarado
      bankCode?: string; // ISPB
      agency?: string;
      account?: string;
      accountType?: string; // "corrente" ou "poupanca"
    };
  };

  // Timestamps
  requestedAt: string; // Horário da solicitação
  settledAt?: string; // Horário da liquidação (se realizado)

  // Metadata PagTracker
  tenantId: string;
  searchableText?: string; // Para facilitar buscas
}

// ===== WEBHOOK PIX INTERFACES =====

/**
 * Interface para configurar webhook PIX
 * PUT /v2/webhook/:chave
 */
export interface WebhookPixRequest {
  webhookUrl: string;
}

/**
 * Resposta da configuração de webhook PIX
 */
export interface WebhookPixResponse {
  webhookUrl: string;
  chave: string;
  criacao: string;
}

/**
 * Resposta da consulta de webhook PIX específico
 * GET /v2/webhook/:chave
 */
export interface WebhookPixDetailsResponse {
  webhookUrl: string;
  chave: string;
  criacao: string;
}

/**
 * Filtros para listagem de webhooks PIX
 * GET /v2/webhook
 */
export interface ListWebhooksPixFilters {
  inicio: string; // RFC 3339 (obrigatório)
  fim: string; // RFC 3339 (obrigatório)
  paginaAtual?: number;
  itensPorPagina?: number;
}

/**
 * Paginação para listagem de webhooks
 */
export interface WebhooksPaginacao {
  paginaAtual: number;
  itensPorPagina: number;
  quantidadeDePaginas: number;
  quantidadeTotalDeItens: number;
}

/**
 * Item de webhook na listagem
 */
export interface WebhookPixItem {
  webhookUrl: string;
  chave: string;
  criacao: string;
}

/**
 * Resposta da listagem de webhooks PIX
 * GET /v2/webhook
 */
export interface ListWebhooksPixResponse {
  parametros: {
    inicio: string;
    fim: string;
    paginacao: WebhooksPaginacao;
  };
  webhooks: WebhookPixItem[];
}

/**
 * Interface para configurar webhook de recorrência PIX
 * PUT /v2/webhookrec
 */
export interface WebhookRecRequest {
  webhookUrl: string;
}

/**
 * Resposta da configuração de webhook de recorrência
 */
export interface WebhookRecResponse {
  webhookUrl: string;
}

/**
 * Configurações mTLS para webhook
 */
export interface WebhookMtlsConfig {
  skipMtls?: boolean; // Skip mTLS validation
  certificatePath?: string; // Path to EfiPay certificate
  privateKeyPath?: string; // Path to domain private key
  domainCertPath?: string; // Path to domain certificate
  minTlsVersion?: string; // Minimum TLS version (default: TLSv1.2)
  validateCertificate?: boolean; // Validate EfiPay certificate
  allowedIps?: string[]; // Allowed IPs for webhook notifications
  hmacSecret?: string; // HMAC secret for URL validation
}

/**
 * Headers para configuração de webhook com skip-mTLS
 */
export interface WebhookHeaders {
  'x-skip-mtls-checking'?: 'true' | 'false';
  'Content-Type': 'application/json';
  'Authorization': string;
}

/**
 * Notificação de webhook PIX recebida
 */
export interface WebhookPixNotification {
  pix: PixWebhookData[];
}

/**
 * Dados do PIX no webhook
 */
export interface PixWebhookData {
  endToEndId: string;
  txid?: string;
  valor: string;
  chave: string;
  horario: string;
  infoPagador?: string;
  devolucoes?: PixDevolucaoWebhook[];
}

/**
 * Dados de devolução no webhook
 */
export interface PixDevolucaoWebhook {
  id: string;
  rtrId: string;
  valor: string;
  horario: {
    solicitacao: string;
    liquidacao?: string;
  };
  status: 'EM_PROCESSAMENTO' | 'DEVOLVIDO' | 'NAO_REALIZADO';
}

/**
 * Configuração de validação mTLS
 */
export interface MtlsValidationConfig {
  requireMtls: boolean; // Exigir mTLS
  allowSkipMtls: boolean; // Permitir skip-mTLS
  certificateValidation: boolean; // Validar certificado EfiPay
  ipValidation: boolean; // Validar IP de origem
  hmacValidation: boolean; // Validar HMAC na URL
  efipayCertificateUrl: {
    production: string;
    homologacao: string;
  };
  allowedIps: {
    production: string[];
    homologacao: string[];
  };
}

/**
 * Request para PagTracker simplificado - Webhook PIX
 */
export interface PagTrackerWebhookPixRequest {
  chave: string;
  webhookUrl: string;
  skipMtls?: boolean;
  hmacSecret?: string;
  description?: string;
}

/**
 * Response para PagTracker simplificado - Webhook PIX
 */
export interface PagTrackerWebhookPixResponse {
  success: boolean;
  webhook: {
    id: string;
    chave: string;
    webhookUrl: string;
    criacao: string;
    status: 'ATIVO' | 'INATIVO';
  };
  message: string;
}

/**
 * Request para PagTracker - Webhook Recorrência
 */
export interface PagTrackerWebhookRecRequest {
  webhookUrl: string;
  description?: string;
}

/**
 * Response para PagTracker - Webhook Recorrência
 */
export interface PagTrackerWebhookRecResponse {
  success: boolean;
  webhook: {
    id: string;
    webhookUrl: string;
    criacao: string;
    status: 'ATIVO' | 'INATIVO';
  };
  message: string;
}

/**
 * Tipos de erro específicos para webhooks
 */
export interface WebhookPixError extends EfiPayError {
  code: 'WEBHOOK_URL_INVALID' | 'WEBHOOK_MTLS_FAILED' | 'WEBHOOK_ALREADY_EXISTS' | 'WEBHOOK_NOT_FOUND' | 'WEBHOOK_VALIDATION_FAILED';
  details?: {
    url?: string;
    chave?: string;
    certificateIssue?: string;
    mtlsError?: string;
  };
}

/**
 * Status de validação do webhook
 */
export interface WebhookValidationStatus {
  isValid: boolean;
  mtlsValid: boolean;
  certificateValid: boolean;
  urlReachable: boolean;
  responseValid: boolean;
  validationTime: string;
  errors?: string[];
}

/**
 * Log de webhook para auditoria
 */
export interface WebhookAuditLog {
  id: string;
  chave: string;
  webhookUrl: string;
  action: 'CREATE' | 'UPDATE' | 'DELETE' | 'NOTIFICATION_SENT' | 'VALIDATION_TEST';
  status: 'SUCCESS' | 'FAILED' | 'RETRY';
  timestamp: string;
  details: {
    requestId?: string;
    responseCode?: number;
    errorMessage?: string;
    retryCount?: number;
    mtlsUsed?: boolean;
  };
}

// ===== INTERFACES PARA PAGAMENTO DE QR CODE PIX =====

/**
 * Request para pagar QR Code PIX
 * PUT /v2/gn/pix/:idEnvio/qrcode
 * Requer escopo: gn.qrcodes.pay
 */
export interface PixPayQRCodeRequest {
  /** Dados do pagador */
  pagador: PixPagador;
  /** Código PIX Copia e Cola do QR Code a ser pago */
  pixCopiaECola: string;
}

/**
 * Response do pagamento de QR Code PIX
 */
export interface PixPayQRCodeResponse {
  /** ID do envio */
  idEnvio: string;
  /** End-to-End ID */
  e2eId: string;
  /** Valor pago */
  valor: string;
  /** Horário da solicitação */
  horario: {
    solicitacao: string;
  };
  /** Status do pagamento */
  status: StatusPixEnvio;
}

/**
 * Request PagTracker para pagamento de QR Code PIX
 */
export interface PagTrackerPayQRCodeRequest {
  /** ID único do envio */
  idEnvio: string;
  /** Chave PIX do pagador */
  payerPixKey: string;
  /** Informação adicional do pagador */
  payerInfo?: string;
  /** Código PIX Copia e Cola */
  pixCopiaECola: string;
  /** Metadados adicionais */
  metadata?: {
    description?: string;
    reference?: string;
    tags?: string[];
  };
}

/**
 * Response PagTracker para pagamento de QR Code PIX
 */
export interface PagTrackerPayQRCodeResponse {
  /** Sucesso da operação */
  success: boolean;
  /** Dados do pagamento (se sucesso) */
  data?: {
    /** ID do envio */
    idEnvio: string;
    /** End-to-End ID */
    e2eId: string;
    /** Valor pago em centavos */
    amount: number;
    /** Status do pagamento */
    status: StatusPixEnvio;
    /** Chave PIX do pagador */
    payerPixKey: string;
    /** Informação do pagador */
    payerInfo?: string;
    /** Data da solicitação */
    createdAt: string;
    /** Metadados */
    metadata?: any;
  };
  /** Mensagem de erro (se falha) */
  message?: string;
  /** Código do erro */
  errorCode?: string;
}

// ===== INTERFACES PARA DETALHAR QR CODE PIX =====

/**
 * Request para detalhar QR Code PIX
 * POST /v2/gn/qrcodes/detalhar
 * Requer escopo: gn.qrcodes.read
 */
export interface PixDetailQRCodeRequest {
  /** Código PIX Copia e Cola do QR Code a ser detalhado */
  pixCopiaECola: string;
}

/**
 * Response do detalhamento de QR Code PIX
 */
export interface PixDetailQRCodeResponse {
  /** Tipo da cobrança */
  tipoCob: 'cob' | 'cobv';
  /** Transaction ID */
  txid: string;
  /** Número da revisão */
  revisao: number;
  /** Informações de calendário */
  calendario: {
    /** Data de criação (ISO 8601) */
    criacao: string;
    /** Data de apresentação (ISO 8601) */
    apresentacao: string;
    /** Tempo de expiração em segundos */
    expiracao: number;
  };
  /** Status da cobrança */
  status: 'ATIVA' | 'CONCLUIDA' | 'REMOVIDA_PELO_USUARIO_RECEBEDOR' | 'REMOVIDA_PELO_PSP';
  /** Dados do devedor (opcional) */
  devedor?: {
    /** Nome do devedor */
    nome: string;
    /** CPF mascarado */
    cpf: string;
  };
  /** Dados do recebedor */
  recebedor: {
    /** Nome do recebedor */
    nome: string;
    /** CPF mascarado */
    cpf: string;
  };
  /** Valor da cobrança */
  valor: {
    /** Valor final em formato decimal */
    final: string;
  };
  /** Chave PIX do recebedor */
  chave: string;
  /** Solicitação ao pagador (opcional) */
  solicitacaoPagador?: string;
}

/**
 * Request para PagTracker - Detalhar QR Code
 */
export interface PagTrackerDetailQRCodeRequest {
  /** ID do tenant */
  tenantId: string;
  /** Código PIX Copia e Cola */
  qrCodeString: string;
  /** Validar se o QR Code é válido antes de processar */
  validateOnly?: boolean;
}

/**
 * Response para PagTracker - Detalhar QR Code
 */
export interface PagTrackerDetailQRCodeResponse {
  /** Sucesso da operação */
  success: boolean;
  /** Mensagem de status */
  message: string;
  /** Dados do QR Code (se sucesso) */
  data?: {
    /** Tipo da cobrança */
    chargeType: 'cob' | 'cobv';
    /** Transaction ID */
    txid: string;
    /** Número da revisão */
    revision: number;
    /** Data de criação (ISO 8601) */
    createdAt: string;
    /** Data de apresentação (ISO 8601) */
    presentedAt: string;
    /** Tempo de expiração em segundos */
    expirationTime: number;
    /** Status da cobrança */
    status: 'ATIVA' | 'CONCLUIDA' | 'REMOVIDA_PELO_USUARIO_RECEBEDOR' | 'REMOVIDA_PELO_PSP';
    /** Dados do devedor (opcional) */
    payer?: {
      /** Nome do devedor */
      name: string;
      /** CPF mascarado */
      document: string;
    };
    /** Dados do recebedor */
    receiver: {
      /** Nome do recebedor */
      name: string;
      /** CPF mascarado */
      document: string;
    };
    /** Valor em centavos */
    amount: number;
    /** Valor formatado (R$ X,XX) */
    formattedAmount: string;
    /** Chave PIX do recebedor */
    pixKey: string;
    /** Solicitação ao pagador (opcional) */
    payerRequest?: string;
    /** Indica se o QR Code pode ser pago */
    canBePaid: boolean;
    /** Tempo restante para expiração em segundos */
    timeToExpire?: number;
  };
  /** Código do erro (se falha) */
  errorCode?: string;
  /** Detalhes do erro */
  errorDetails?: {
    /** Tipo do erro EfiPay */
    type?: string;
    /** Título do erro */
    title?: string;
    /** Status HTTP */
    status?: number;
    /** Detalhes do erro */
    detail?: string;
    /** Violações específicas */
    violations?: Array<{
      /** Razão da violação */
      reason: string;
      /** Propriedade relacionada */
      property: string;
    }>;
  };
}