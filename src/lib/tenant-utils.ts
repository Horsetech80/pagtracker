import { cookies } from 'next/headers';
import { createServerSupabaseClient } from '@/lib/supabase/server';

// Nome padronizado do cookie (consistente em todo o sistema)
const TENANT_COOKIE_NAME = 'tenantId';

/**
 * Obter o tenant_id atual a partir do cookie
 * Para uso em componentes de servidor
 */
export function getCurrentTenantId() {
  const cookieStore = cookies();
  return cookieStore.get(TENANT_COOKIE_NAME)?.value;
}

/**
 * Obter o tenant_id atual a partir do cookie no browser
 * Para uso em componentes de cliente
 */
export function getCurrentTenantIdClient() {
  if (typeof document === 'undefined') return null;
  
  const cookies = document.cookie.split(';').reduce((acc, cookie) => {
    const [key, value] = cookie.trim().split('=');
    acc[key] = value;
    return acc;
  }, {} as Record<string, string>);
  
  return cookies[TENANT_COOKIE_NAME] || null;
}

/**
 * Verificar se o usuário tem acesso ao tenant
 * @param tenantId ID do tenant
 * @param userId ID do usuário (opcional, usa o usuário atual por padrão)
 */
export async function userHasTenantAccess(tenantId: string, userId?: string) {
  const supabase = await createServerSupabaseClient();
  
  try {
    const { data, error } = await supabase.rpc('user_has_tenant_access', {
      tenant_id: tenantId,
      user_id: userId
    });
    
    if (error) {
      console.error('Erro ao verificar acesso ao tenant:', error);
      return false;
    }
    
    return data;
  } catch (error) {
    console.error('Erro ao verificar acesso ao tenant:', error);
    return false;
  }
}

/**
 * Obter o papel do usuário em um tenant
 * @param tenantId ID do tenant
 * @param userId ID do usuário (opcional, usa o usuário atual por padrão)
 */
export async function getUserTenantRole(tenantId: string, userId?: string) {
  const supabase = await createServerSupabaseClient();
  
  try {
    const { data, error } = await supabase.rpc('get_user_tenant_role', {
      tenant_id: tenantId,
      user_id: userId
    });
    
    if (error) {
      console.error('Erro ao obter papel do usuário no tenant:', error);
      return 'none';
    }
    
    return data;
  } catch (error) {
    console.error('Erro ao obter papel do usuário no tenant:', error);
    return 'none';
  }
}

/**
 * Verificar se o usuário é administrador de um tenant
 * @param tenantId ID do tenant
 * @param userId ID do usuário (opcional, usa o usuário atual por padrão)
 */
export async function isTenantAdmin(tenantId: string, userId?: string) {
  const supabase = await createServerSupabaseClient();
  
  try {
    const { data, error } = await supabase.rpc('is_tenant_admin', {
      tenant_id: tenantId,
      user_id: userId
    });
    
    if (error) {
      console.error('Erro ao verificar se usuário é admin do tenant:', error);
      return false;
    }
    
    return data;
  } catch (error) {
    console.error('Erro ao verificar se usuário é admin do tenant:', error);
    return false;
  }
}

/**
 * Verificar se o usuário é um administrador global do sistema
 */
export async function isGlobalAdmin() {
  const supabase = await createServerSupabaseClient();
  
  try {
    const { data, error } = await supabase.rpc('is_global_admin');
    
    if (error) {
      console.error('Erro ao verificar se usuário é admin global:', error);
      return false;
    }
    
    return data;
  } catch (error) {
    console.error('Erro ao verificar se usuário é admin global:', error);
    return false;
  }
}

/**
 * Função para definir o contexto do tenant (compatibilidade)
 * @param tenantId ID do tenant
 * @param supabase Cliente Supabase (opcional)
 */
export async function setTenantContext(tenantId: string, supabase?: any) {
  if (!tenantId) {
    throw new Error('tenant_id é obrigatório');
  }
  
  const client = supabase || await createServerSupabaseClient();
  
  try {
    const { error } = await client.rpc('set_tenant_context', { 
      tenant_id: tenantId 
    });
    
    if (error) {
      console.error('Erro ao definir contexto do tenant:', error);
      throw error;
    }
    
    return true;
  } catch (error) {
    console.error('Erro ao definir contexto do tenant:', error);
    throw error;
  }
}

/**
 * Validar se um tenant existe e está ativo
 * @param tenantSlug Slug do tenant
 */
export async function validateTenant(tenantSlug: string): Promise<boolean> {
  if (!tenantSlug) return false;
  
  const supabase = await createServerSupabaseClient();
  
  try {
    const { data, error } = await supabase
      .from('tenants')
      .select('slug, active')
      .eq('slug', tenantSlug)
      .single();

    if (error) {
      console.error('Erro ao validar tenant:', error);
      return false;
    }

    return data?.active !== false; // Considera true se active for null ou true
  } catch (error) {
    console.error('Erro ao validar tenant:', error);
    return false;
  }
}

/**
 * Obter dados completos de um tenant
 * @param tenantSlug Slug do tenant
 */
export async function getTenantData(tenantSlug: string) {
  if (!tenantSlug) return null;
  
  const supabase = await createServerSupabaseClient();
  
  try {
    const { data, error } = await supabase
      .from('tenants')
      .select('*')
      .eq('slug', tenantSlug)
      .single();

    if (error) {
      console.error('Erro ao obter dados do tenant:', error);
      return null;
    }

    return data;
  } catch (error) {
    console.error('Erro ao obter dados do tenant:', error);
    return null;
  }
}

/**
 * Listar tenants do usuário atual
 */
export async function getUserTenants() {
  const supabase = await createServerSupabaseClient();
  
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return [];

    const { data, error } = await supabase
      .from('tenant_users')
      .select(`
        tenant_id,
        role,
        tenants (
          id,
          name,
          slug,
          active,
          settings
        )
      `)
      .eq('user_id', user.id);

    if (error) {
      console.error('Erro ao listar tenants do usuário:', error);
      return [];
    }

    return data?.map(item => ({
      ...item.tenants,
      userRole: item.role
    })) || [];
  } catch (error) {
    console.error('Erro ao listar tenants do usuário:', error);
    return [];
  }
}

/**
 * Hook para obter e definir o tenant atual
 * Para uso em componentes do cliente
 */
export function useTenant() {
  if (typeof window === 'undefined') {
    throw new Error('useTenant só pode ser usado em componentes do cliente');
  }
  
  const getTenantId = () => {
    return getCurrentTenantIdClient();
  };
  
  const setTenantId = (tenantId: string) => {
    // Definir o cookie com nome padronizado
    document.cookie = `${TENANT_COOKIE_NAME}=${tenantId}; path=/; max-age=${60 * 60 * 24 * 7}; SameSite=Lax; ${process.env.NODE_ENV === 'production' ? 'Secure' : ''}`;
    
    // Recarregar a página para aplicar o novo contexto
    window.location.reload();
  };
  
  const clearTenant = () => {
    // Limpar cookie
    document.cookie = `${TENANT_COOKIE_NAME}=; path=/; max-age=0`;
    
    // Recarregar a página
    window.location.reload();
  };
  
  return { 
    tenantId: getTenantId(),
    setTenantId,
    clearTenant
  };
}

/**
 * Função helper para criar cliente Supabase com contexto de tenant
 * @param tenantId ID do tenant
 */
export async function createTenantSupabaseClient(tenantId: string) {
  const supabase = await createServerSupabaseClient();
  
  // Definir contexto do tenant
  await setTenantContext(tenantId, supabase);
  
  return supabase;
}