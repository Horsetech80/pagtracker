'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { supabase } from '@/lib/supabase/client';
import { useAuth } from './AuthContext';

// Nome padronizado do cookie (consistente com middleware)
const TENANT_COOKIE_NAME = 'tenantId';

// Interface para representar um tenant
export interface Tenant {
  id: string;
  name: string;
  slug: string;
  logo?: string;
  primaryColor?: string;
  secondaryColor?: string;
  settings?: any;
  active?: boolean;
  created_at?: string;
  updated_at?: string;
}

// Interface para representar um usuário
export interface User {
  id: string;
  name: string;
  email: string;
  tenant_id: string;
  role: 'ADMIN' | 'MANAGER' | 'USER';
  api_key_gerencianet?: string;
  client_id_gerencianet?: string;
  client_secret_gerencianet?: string;
  created_at?: string;
  updated_at?: string;
}

interface TenantData {
  id: string;
  name: string;
  domain?: string;
  active: boolean;
  settings?: Record<string, any>;
}

interface TenantContextType {
  tenant: TenantData | null;
  tenantId: string | null;
  isLoading: boolean;
  error: string | null;
  setTenant: (tenant: TenantData | null) => void;
  refreshTenant: () => Promise<void>;
  switchTenant: (tenantId: string) => Promise<void>;
  isValidTenant: (tenantId: string) => Promise<boolean>;
}

// Criando o contexto
const TenantContext = createContext<TenantContextType | undefined>(undefined);

// Hook para usar o contexto do tenant
export function useTenant() {
  const context = useContext(TenantContext);
  if (context === undefined) {
    throw new Error('useTenant deve ser usado dentro de um TenantProvider');
  }
  return context;
}

/**
 * Extrai tenant ID de diferentes fontes - PADRONIZADO
 * Versão segura para hidratação SSR/CSR
 */
function extractTenantId(): string | null {
  // Verificar se estamos no cliente
  if (typeof window === 'undefined') {
    return null;
  }

  // 1. Cookie (nome padronizado)
  if (typeof document !== 'undefined') {
    const cookieValue = document.cookie
      .split('; ')
      .find(row => row.startsWith(`${TENANT_COOKIE_NAME}=`))
      ?.split('=')[1];
    if (cookieValue) {
      return cookieValue;
    }
  }

  // 2. localStorage (fallback - mantido para compatibilidade)
  if (typeof localStorage !== 'undefined') {
    const legacyTenant = localStorage.getItem('tenantId');
    if (legacyTenant) {
      // Migrar para cookie e remover do localStorage
      document.cookie = `${TENANT_COOKIE_NAME}=${legacyTenant}; path=/; max-age=${60 * 60 * 24 * 7}; samesite=lax`;
      localStorage.removeItem('tenantId');
      return legacyTenant;
    }
  }

  return null;
}

/**
 * Função removida - não é mais necessária no fluxo padrão
 * O tenant_id é obtido diretamente da tabela users
 */
async function updateUserAppMetadata(tenantId: string) {
  // Função mantida para compatibilidade, mas não faz nada
  // no fluxo padrão o tenant_id vem da tabela users
  return;
}

interface TenantProviderProps {
  children: ReactNode;
  initialTenant?: TenantData;
}

// Provider do contexto
export function TenantProvider({ children, initialTenant }: TenantProviderProps) {
  const [tenant, setTenantState] = useState<TenantData | null>(initialTenant || null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isMounted, setIsMounted] = useState(false);
  
  // 🔧 CORREÇÃO: Aguardar AuthContext estar pronto
  const { supabaseUser, isLoading: authLoading } = useAuth();

  const tenantId = tenant?.id || null;

  // Controlar montagem do componente para evitar problemas de hidratação
  useEffect(() => {
    setIsMounted(true);
  }, []);

  /**
   * Busca dados do tenant do Supabase com retry automático para JWT expirado
   */
  const fetchTenantData = async (tenantId: string): Promise<TenantData | null> => {
    const { authRefresh } = await import('@/lib/supabase/auth-refresh');
    
    return authRefresh.executeWithRetry(async () => {
      const { data, error } = await supabase
        .from('tenants')
        .select('*')
        .eq('id', tenantId)
        .single();

      if (error) {
        console.error('Erro ao buscar tenant:', error);
        throw error;
      }

      return data as TenantData;
    });
  };

  /**
   * Valida se um tenant existe e está ativo com retry automático para JWT expirado
   */
  const isValidTenant = async (tenantId: string): Promise<boolean> => {
    try {
      const { authRefresh } = await import('@/lib/supabase/auth-refresh');
      
      const data = await authRefresh.executeWithRetry(async () => {
        const { data, error } = await supabase
          .from('tenants')
          .select('id, active')
          .eq('id', tenantId)
          .single();
          
        if (error) throw error;
        return data;
      });

      return data?.active !== false; // Considera true se active for null ou true
    } catch {
      return false;
    }
  };

  /**
   * Define um novo tenant - PADRONIZADO
   * Versão segura para hidratação SSR/CSR
   */
  const setTenant = async (newTenant: TenantData | null) => {
    setTenantState(newTenant);
    
    // Verificar se estamos no cliente
    if (typeof window === 'undefined') {
      return;
    }
    
    if (newTenant) {
      // Salvar no cookie (nome padronizado)
      if (typeof document !== 'undefined') {
        document.cookie = `${TENANT_COOKIE_NAME}=${newTenant.id}; path=/; max-age=${60 * 60 * 24 * 7}; samesite=lax`;
      }
      
      // BEST PRACTICE: Atualizar app_metadata
      await updateUserAppMetadata(newTenant.id);
      
      // Remover do localStorage se existir (limpeza)
      if (typeof localStorage !== 'undefined') {
        localStorage.removeItem('tenantId');
      }
    } else {
      // Limpar tenant
      if (typeof document !== 'undefined') {
        document.cookie = `${TENANT_COOKIE_NAME}=; path=/; max-age=0`;
      }
      if (typeof localStorage !== 'undefined') {
        localStorage.removeItem('tenantId');
      }
    }
  };

  /**
   * Recarrega dados do tenant atual
   */
  const refreshTenant = async () => {
    if (!tenantId) return;

    setIsLoading(true);
    setError(null);

    try {
      const tenantData = await fetchTenantData(tenantId);
      if (tenantData) {
        setTenantState(tenantData);
      } else {
        setError('Tenant não encontrado');
        setTenantState(null);
      }
    } catch (err) {
      setError('Erro ao recarregar tenant');
      console.error('Erro ao recarregar tenant:', err);
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * Troca para outro tenant
   */
  const switchTenant = async (newTenantId: string) => {
    setIsLoading(true);
    setError(null);

    try {
      const isValid = await isValidTenant(newTenantId);
      if (!isValid) {
        setError('Tenant inválido ou inativo');
        return;
      }

      const tenantData = await fetchTenantData(newTenantId);
      if (tenantData) {
        await setTenant(tenantData);
      } else {
        setError('Erro ao carregar dados do tenant');
      }
    } catch (err) {
      setError('Erro ao trocar tenant');
      console.error('Erro ao trocar tenant:', err);
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * Inicializar tenant ao carregar o componente
   * Só executa após a montagem para evitar problemas de hidratação
   * IMPLEMENTA SELEÇÃO AUTOMÁTICA DO PRIMEIRO TENANT DO USUÁRIO
   */
  useEffect(() => {
    if (!isMounted) {
      return;
    }

    // 🔧 CORREÇÃO CRÍTICA: Aguardar AuthContext estar pronto
    if (authLoading) {
      return;
    }

    // Inicializando tenant com usuário autenticado

    const initializeTenant = async () => {
      // Não inicializar se não há usuário autenticado
      if (!supabaseUser) {
        setIsLoading(false);
        setError(null);
        setTenantState(null);
        return;
      }

      setIsLoading(true);
      setError(null);

      try {
        // Fluxo padrão: Buscar tenant_id da tabela users
        const { data: userData, error: userError } = await supabase
          .from('users')
          .select('tenant_id')
          .eq('id', supabaseUser.id)
          .single();

        if (userError || !userData || !userData.tenant_id) {
          console.error('[TenantContext] Usuário não possui tenant_id na tabela users:', userError);
          setError('Usuário não possui acesso a nenhum tenant');
          setIsLoading(false);
          return;
        }

        const tenantId = userData.tenant_id;

        // Validar se o tenant existe e está ativo
        const isValid = await isValidTenant(tenantId);
        if (isValid) {
          const tenantData = await fetchTenantData(tenantId);
          if (tenantData) {
            setTenantState(tenantData);
            
            // Definir cookie para futuras requisições
            if (typeof document !== 'undefined') {
              document.cookie = `${TENANT_COOKIE_NAME}=${tenantId}; path=/; max-age=${60 * 60 * 24 * 7}; samesite=lax`;
            }
            
            console.log('[TenantContext] Tenant carregado com sucesso:', tenantData.name);
          } else {
            setError('Erro ao carregar dados do tenant');
          }
        } else {
          setError('Tenant inválido ou inativo');
        }
      } catch (err) {
        setError('Erro ao inicializar tenant');
        console.error('Erro ao inicializar tenant:', err);
      } finally {
        setIsLoading(false);
      }
    };

    initializeTenant();
  }, [isMounted, authLoading, supabaseUser]);

  const contextValue: TenantContextType = {
    tenant,
    tenantId,
    isLoading,
    error,
    setTenant,
    refreshTenant,
    switchTenant,
    isValidTenant,
  };

  return (
    <TenantContext.Provider value={contextValue}>
      {children}
    </TenantContext.Provider>
  );
}

/**
 * Hook para verificar se um tenant está ativo
 */
export function useIsTenantActive(checkTenantId?: string) {
  const { tenant, isValidTenant } = useTenant();
  const [isActive, setIsActive] = useState<boolean | null>(null);

  useEffect(() => {
    const checkActive = async () => {
      const targetId = checkTenantId || tenant?.id;
      if (targetId) {
        const active = await isValidTenant(targetId);
        setIsActive(active);
      }
    };

    checkActive();
  }, [checkTenantId, tenant?.id, isValidTenant]);

  return isActive;
}

/**
 * Hook para acessar configurações do tenant
 */
export function useTenantSettings() {
  const { tenant } = useTenant();
  return tenant?.settings || {};
}