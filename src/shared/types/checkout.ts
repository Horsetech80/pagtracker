/**
 * Dados de configuração do checkout transparente
 */
export interface CheckoutConfigData {
  /** ID da configuração do checkout */
  id: string;

  /** ID do tenant ao qual esta configuração pertence */
  tenant_id: string;

  /** Nome da loja que será exibido no checkout */
  nome_loja: string;

  /** URL do logotipo da loja (opcional) */
  logo_url?: string;

  /** Cor primária usada no checkout (em formato hexadecimal) */
  cor_primaria: string;

  /** Cor secundária usada no checkout (em formato hexadecimal) */
  cor_secundaria: string;

  /** Chave de API para integração */
  api_key: string;

  /** URL para receber webhooks (notificações de eventos) */
  webhooks_url?: string;

  /** URL de redirecionamento em caso de sucesso no pagamento */
  redirect_sucesso?: string;

  /** URL de redirecionamento em caso de falha no pagamento */
  redirect_falha?: string;

  /** Indica se o checkout está ativo para receber pagamentos */
  ativado: boolean;

  /** Campos adicionais a serem solicitados durante o checkout */
  campos_adicionais: {
    /** Solicitar endereço completo */
    endereco: boolean;

    /** Solicitar número de telefone */
    telefone: boolean;

    /** Solicitar data de nascimento */
    data_nascimento: boolean;
  }
} 