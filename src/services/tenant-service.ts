import { createClient } from '@supabase/supabase-js';

interface TenantCreateParams {
  name: string;
  slug: string;
  settings?: Record<string, any>;
  ownerUserId?: string; // ID do usuário que será o proprietário do tenant
}

interface TenantUpdateParams {
  id: string;
  name?: string;
  slug?: string;
  active?: boolean;
  settings?: Record<string, any>;
}

interface TenantUserParams {
  tenantId: string;
  userId: string;
  role?: string;
}

/**
 * Serviço para gerenciamento de tenants
 */
export class TenantService {
  private supabase;
  
  constructor() {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://tqcxbiofslypocltpxmb.supabase.co';
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRxY3hiaW9mc2x5cG9jbHRweG1iIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTczMTA3NDYwMiwiZXhwIjoyMDQ2NjUwNjAyfQ.s8X1OKG3bYLEyuaXbcgKDnUClWRPqo6fR7CcpHxrGo8';
    
    this.supabase = createClient(supabaseUrl, serviceRoleKey);
  }
  
  /**
   * Provisiona um novo tenant no sistema
   * @param params Parâmetros para criação do tenant
   * @returns O tenant criado
   */
  async provisionTenant(params: TenantCreateParams) {
    // Validações
    if (!params.name || !params.slug) {
      throw new Error('Nome e slug são obrigatórios');
    }
    
    // Normalizar o slug (remover caracteres especiais, espaços, etc)
    const normalizedSlug = params.slug
      .toLowerCase()
      .replace(/[^a-z0-9_-]/g, '')
      .replace(/\s+/g, '-');
    
    if (normalizedSlug !== params.slug) {
      console.warn(`Slug normalizado de '${params.slug}' para '${normalizedSlug}'`);
      params.slug = normalizedSlug;
    }
    
    // Verificar se já existe um tenant com esse slug
    const { data: existingTenant, error: checkError } = await this.supabase
      .from('tenants')
      .select('id')
      .eq('slug', params.slug)
      .maybeSingle();
    
    if (checkError) {
      throw new Error(`Erro ao verificar tenant existente: ${checkError.message}`);
    }
    
    if (existingTenant) {
      throw new Error(`Já existe um tenant com o slug '${params.slug}'`);
    }
    
    // Definir o contexto para uso do serviço administrativo
    await this.supabase.rpc('set_config', {
      name: 'app.is_admin_service',
      value: 'true',
      is_local: false
    });
    
    // Inicia uma transação
    const { data: client } = await this.supabase.rpc('begin_transaction');
    
    try {
      // 1. Criar o tenant
      const tenantId = `tenant_${params.slug}_${Date.now()}`;
      
      const { data: newTenant, error: tenantError } = await this.supabase
        .from('tenants')
        .insert({
          id: tenantId,
          name: params.name,
          slug: params.slug,
          active: true,
          settings: params.settings || {
            theme: 'light',
            features: {
              split_payments: true,
              customizable_checkout: true,
              notifications: true
            }
          }
        })
        .select()
        .single();
      
      if (tenantError) {
        throw new Error(`Erro ao criar tenant: ${tenantError.message}`);
      }
      
      // 2. Se informado, associar o usuário proprietário
      if (params.ownerUserId) {
        const { error: userError } = await this.supabase
          .from('tenant_users')
          .insert({
            tenant_id: tenantId,
            user_id: params.ownerUserId,
            role: 'admin' // O proprietário é sempre admin
          });
        
        if (userError) {
          throw new Error(`Erro ao associar usuário ao tenant: ${userError.message}`);
        }
      }
      
      // 3. Criar configurações iniciais para o tenant
      await this._createInitialSettings(tenantId);
      
      // Confirma a transação
      await this.supabase.rpc('commit_transaction');
      
      return newTenant;
    } catch (error) {
      // Rollback em caso de erro
      await this.supabase.rpc('rollback_transaction');
      throw error;
    } finally {
      // Limpar o contexto
      await this.supabase.rpc('set_config', {
        name: 'app.is_admin_service',
        value: null,
        is_local: false
      });
    }
  }
  
  /**
   * Cria as configurações iniciais para um novo tenant
   * @param tenantId ID do tenant
   * @private Função interna
   */
  private async _createInitialSettings(tenantId: string) {
    // Definir o contexto do tenant para as operações
    await this.supabase.rpc('set_tenant_context', { tenant_id: tenantId });
    
    try {
      // 1. Criar configuração de checkout padrão
      const { error: checkoutError } = await this.supabase
        .from('checkout_config')
        .insert({
          tenant_id: tenantId,
          name: 'Checkout Padrão',
          logo_url: null,
          primary_color: '#4C1D95',
          accent_color: '#8B5CF6',
          theme: 'light',
          success_message: 'Pagamento realizado com sucesso!',
          webhook_url: null,
          active: true
        });
      
      if (checkoutError) {
        console.error(`Erro ao criar config de checkout: ${checkoutError.message}`);
      }
      
      // 2. Criar configuração de split padrão (se aplicável)
      const { error: splitError } = await this.supabase
        .from('split_config')
        .insert({
          tenant_id: tenantId,
          nome: 'Configuração de Split Padrão',
          descricao: 'Configuração padrão para divisão de pagamentos',
          ativo: true,
          taxa_plataforma: 0,
          automatico: false
        });
      
      if (splitError) {
        console.error(`Erro ao criar config de split: ${splitError.message}`);
      }
      
      // Outras inicializações podem ser adicionadas conforme necessário
      
    } catch (error) {
      console.error('Erro ao criar configurações iniciais:', error);
      throw error;
    }
  }
  
  /**
   * Atualiza um tenant existente
   * @param params Parâmetros para atualização
   * @returns O tenant atualizado
   */
  async updateTenant(params: TenantUpdateParams) {
    if (!params.id) {
      throw new Error('ID do tenant é obrigatório');
    }
    
    const updates: any = {};
    if (params.name) updates.name = params.name;
    if (params.slug) updates.slug = params.slug;
    if (params.active !== undefined) updates.active = params.active;
    if (params.settings) updates.settings = params.settings;
    
    const { data, error } = await this.supabase
      .from('tenants')
      .update(updates)
      .eq('id', params.id)
      .select()
      .single();
    
    if (error) {
      throw new Error(`Erro ao atualizar tenant: ${error.message}`);
    }
    
    return data;
  }
  
  /**
   * Remove um tenant e todos os seus dados
   * @param tenantId ID do tenant a ser removido
   */
  async deleteTenant(tenantId: string) {
    // Define o contexto para o tenant específico
    await this.supabase.rpc('set_tenant_context', { tenant_id: tenantId });
    
    // Deleta o tenant (as políticas RLS garantem que apenas este tenant seja afetado)
    const { error } = await this.supabase
      .from('tenants')
      .delete()
      .eq('id', tenantId);
    
    if (error) {
      throw new Error(`Erro ao remover tenant: ${error.message}`);
    }
    
    return true;
  }
  
  /**
   * Adiciona um usuário a um tenant
   * @param params Parâmetros para associação
   */
  async addUserToTenant(params: TenantUserParams) {
    const { error } = await this.supabase
      .from('tenant_users')
      .insert({
        tenant_id: params.tenantId,
        user_id: params.userId,
        role: params.role || 'member'
      });
    
    if (error) {
      throw new Error(`Erro ao adicionar usuário ao tenant: ${error.message}`);
    }
    
    return true;
  }
  
  /**
   * Remove um usuário de um tenant
   * @param tenantId ID do tenant
   * @param userId ID do usuário
   */
  async removeUserFromTenant(tenantId: string, userId: string) {
    const { error } = await this.supabase
      .from('tenant_users')
      .delete()
      .eq('tenant_id', tenantId)
      .eq('user_id', userId);
    
    if (error) {
      throw new Error(`Erro ao remover usuário do tenant: ${error.message}`);
    }
    
    return true;
  }
  
  /**
   * Lista os tenants de um usuário
   * @param userId ID do usuário
   * @returns Lista de tenants associados ao usuário
   */
  async getUserTenants(userId: string) {
    const { data, error } = await this.supabase
      .from('tenant_users')
      .select(`
        role,
        tenants:tenant_id (
          id,
          name,
          slug,
          active,
          settings,
          created_at,
          updated_at
        )
      `)
      .eq('user_id', userId);
    
    if (error) {
      throw new Error(`Erro ao buscar tenants do usuário: ${error.message}`);
    }
    
    // Formatar os dados para um formato mais amigável
    return data?.map(item => ({
      role: item.role,
      ...item.tenants
    })) || [];
  }
  
  /**
   * Define um tenant como o contexto para as operações subsequentes
   * @param tenantId ID do tenant
   */
  async setTenantContext(tenantId: string) {
    const { error } = await this.supabase.rpc('set_tenant_context', { tenant_id: tenantId });
    
    if (error) {
      throw new Error(`Erro ao definir contexto do tenant: ${error.message}`);
    }
    
    return true;
  }
} 