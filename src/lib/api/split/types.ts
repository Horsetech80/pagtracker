/**
 * Tipos para o sistema de split de pagamentos
 */

/**
 * Status possíveis para uma divisão de pagamento
 */
export type SplitStatus = 'pendente' | 'processando' | 'concluido' | 'falha';

/**
 * Tipo de regra de split
 */
export type TipoSplit = 'percentual' | 'fixo';

/**
 * Representa um destinatário para onde o dinheiro será enviado
 */
export interface SplitDestinatario {
  id: string;
  nome: string;
  email?: string;
  documento: string;
  tipo_pessoa: 'pf' | 'pj';
  tipo?: 'pessoa_fisica' | 'pessoa_juridica';
  user_id: string;
  dados_bancarios?: {
    tipo: 'pix';
    chave_pix: string;
    tipo_chave_pix: 'cpf' | 'cnpj' | 'email' | 'telefone' | 'aleatoria';
  };
  metodo_pagamento?: 'pix' | 'conta_bancaria';
  banco?: string;
  agencia?: string;
  conta?: string;
  conta_tipo?: 'corrente' | 'poupanca';
  chave_pix?: string;
  status: 'ativo' | 'inativo';
  created_at: string;
  updated_at?: string;
}

/**
 * Divisão dentro de uma regra de split
 */
export interface SplitRegraDivisao {
  id?: string;
  destinatario_id: string;
  tipo: TipoSplit;
  valor: number; // Percentual ou valor fixo
  descricao?: string;
}

/**
 * Regra de divisão de pagamento
 */
export interface SplitRegra {
  id: string;
  nome: string;
  descricao?: string;
  destinatario_id?: string;
  tipo?: TipoSplit;
  valor?: number; // Percentual ou valor fixo, dependendo do tipo
  ordem?: number;
  active?: boolean;
  ativa?: boolean;
  taxa_comissao?: number;
  divisoes: SplitRegraDivisao[];
  user_id: string;
  created_at: string;
  updated_at?: string;
}

/**
 * Configuração global de split
 */
export interface SplitConfig {
  enabled: boolean;
  comissao_percentual: number;
  regras: SplitRegra[];
}

/**
 * Representa uma divisão dentro de uma transação de split
 */
export interface SplitTransacaoDivisao {
  id: string;
  transacao_id?: string;
  destinatario_id: string;
  valor: number;
  porcentagem: number;
  status: SplitStatus;
  processado_em?: string | null;
  erro?: string | null;
  created_at?: string;
  updated_at?: string;
  descricao?: string;
}

/**
 * Representa uma transação de split
 */
export interface SplitTransacao {
  id: string;
  venda_id?: string;
  charge_id?: string;
  regra_id?: string;
  user_id?: string;
  valor_total: number;
  status: SplitStatus;
  divisoes: SplitTransacaoDivisao[];
  created_at: string;
  updated_at?: string;
}

/**
 * Resposta da API para listar transações
 */
export interface ListTransacoesResponse {
  success: boolean;
  data?: SplitTransacao[];
  error?: string;
}

/**
 * Resposta da API para obter uma única transação
 */
export interface GetTransacaoResponse {
  success: boolean;
  data?: SplitTransacao;
  error?: string;
}

/**
 * Resposta da API para listar destinatários
 */
export interface ListDestinatariosResponse {
  success: boolean;
  data?: SplitDestinatario[];
  error?: string;
}

/**
 * Resposta da API para obter configuração de split
 */
export interface GetSplitConfigResponse {
  success: boolean;
  data?: SplitConfig;
  error?: string;
}

/**
 * Payload para criar um novo destinatário
 */
export interface CreateDestinatarioPayload {
  nome: string;
  documento: string;
  tipo_pessoa: 'pf' | 'pj';
  dados_bancarios: {
    tipo: 'pix' | 'conta';
    banco?: string;
    agencia?: string;
    conta?: string;
    chave_pix?: string;
    tipo_chave_pix?: 'cpf' | 'cnpj' | 'email' | 'telefone' | 'aleatoria';
  };
}

/**
 * Alias para SplitTransacaoDivisao
 */
export type SplitDivisao = SplitTransacaoDivisao;

/**
 * Resposta padrão da API
 */
export interface SplitResponse {
  success: boolean;
  data?: any;
  error?: string;
  message?: string;
}

/**
 * Payload para criar uma transação de split
 */
export interface CreateSplitRequest {
  venda_id: string;
  valor_total: number;
  regra_id: string;
  divisoes_customizadas?: SplitRegraDivisao[];
} 