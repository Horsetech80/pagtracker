import { createServerSupabaseClient } from "@/lib/supabase/server";
import { GerencianetConfig, User } from "./types";

/**
 * Obtém os dados do usuário atual usando auth.users com metadata
 */
export async function getCurrentUser(): Promise<User | null> {
  const supabase = await createServerSupabaseClient();
  
  // Obter o usuário atual
  const { data: { user }, error: userError } = await supabase.auth.getUser();
  
  if (userError || !user) {
    console.error('Erro ao obter usuário:', userError);
    return null;
  }
  
  // 🔧 NOVA ABORDAGEM: Usar metadata do auth.users
  const userMetadata = user.user_metadata || {};
  const appMetadata = user.app_metadata || {};
  
  return {
    id: user.id,
    email: user.email || '',
    nome: userMetadata.nome || '',
    tenant_id: appMetadata.tenant_id || '',
    cpf: userMetadata.cpf || null,
    telefone: userMetadata.telefone || null,
    endereco: userMetadata.endereco || null,
    cidade: userMetadata.cidade || null,
    estado: userMetadata.estado || null,
    cep: userMetadata.cep || null,
    data_nascimento: userMetadata.data_nascimento || null,
    avatar_url: userMetadata.avatar_url || null,
    api_key_gerencianet: appMetadata.api_key_gerencianet || null,
    client_id_gerencianet: appMetadata.client_id_gerencianet || null,
    client_secret_gerencianet: appMetadata.client_secret_gerencianet || null,
    personal_data_completed: userMetadata.personal_data_completed || false,
    company_data_completed: userMetadata.company_data_completed || false,
    financial_config_completed: userMetadata.financial_config_completed || false,
    verification_completed: userMetadata.verification_completed || false,
    onboarding_completed: userMetadata.onboarding_completed || false,
    can_access_payments: userMetadata.can_access_payments || false,
    can_access_withdrawals: userMetadata.can_access_withdrawals || false,
    verification_status: userMetadata.verification_status || 'not_started',
    verification_submitted_at: userMetadata.verification_submitted_at || null,
    document_urls: userMetadata.document_urls || {},
    last_login: userMetadata.last_login || null,
    email_verified: userMetadata.email_verified || false,
    two_factor_enabled: userMetadata.two_factor_enabled || false,
    created_at: user.created_at,
    updated_at: user.updated_at
  } as User;
}

/**
 * Salva as configurações de API da Gerencianet do usuário usando metadata
 */
export async function saveGerencianetConfig(
  userId: string,
  config: GerencianetConfig
): Promise<User> {
  const supabase = await createServerSupabaseClient();
  
  // 🔧 NOVA ABORDAGEM: Atualizar app_metadata
  const { data: user, error } = await supabase.auth.updateUser({
    data: {
      api_key_gerencianet: config.apiKey,
      client_id_gerencianet: config.clientId,
      client_secret_gerencianet: config.clientSecret,
    }
  });
  
  if (error) {
    console.error('Erro ao salvar configurações da Gerencianet:', error);
    throw new Error('Falha ao salvar configurações');
  }
  
  // Retornar dados atualizados
  return getCurrentUser() as Promise<User>;
}

/**
 * Verifica se as configurações da Gerencianet são válidas
 */
export async function validateGerencianetConfig(
  config: GerencianetConfig
): Promise<boolean> {
  try {
    // Aqui poderíamos fazer uma validação real com a API da Gerencianet
    // Por simplicidade, estamos apenas validando se os campos obrigatórios estão preenchidos
    
    return (
      !!config.apiKey &&
      !!config.clientId &&
      !!config.clientSecret &&
      config.apiKey.length >= 8 &&
      config.clientId.length >= 8 &&
      config.clientSecret.length >= 8
    );
  } catch (error) {
    console.error('Erro ao validar configurações da Gerencianet:', error);
    return false;
  }
}

/**
 * Obtém estatísticas do usuário
 */
export async function getUserStats(userId: string) {
  const supabase = await createServerSupabaseClient();
  
  // Total recebido
  const { data: totalData, error: totalError } = await supabase
    .from('charges')
    .select('valor')
    .eq('user_id', userId)
    .eq('status', 'pago');
  
  const totalRecebido = totalData?.reduce((sum, charge) => sum + charge.valor, 0) || 0;
  
  // Total de transações
  const { count: totalTransacoes, error: transacoesError } = await supabase
    .from('charges')
    .select('*', { count: 'exact' })
    .eq('user_id', userId);
  
  // Total de transações pendentes
  const { count: transacoesPendentes, error: pendentesError } = await supabase
    .from('charges')
    .select('*', { count: 'exact' })
    .eq('user_id', userId)
    .eq('status', 'pendente');
  
  if (totalError || transacoesError || pendentesError) {
    console.error('Erro ao buscar estatísticas:', { totalError, transacoesError, pendentesError });
    throw new Error('Falha ao buscar estatísticas');
  }
  
  return {
    totalRecebido,
    totalTransacoes: totalTransacoes || 0,
    transacoesPendentes: transacoesPendentes || 0,
  };
}