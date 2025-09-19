import { useCallback, useEffect, useState } from 'react';
import { authRefresh } from '@/lib/supabase/auth-refresh';
import { supabase } from '@/lib/supabase/client';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';

interface UseAuthRefreshReturn {
  isRefreshing: boolean;
  refreshToken: () => Promise<void>;
  executeWithRetry: <T>(operation: () => Promise<T>) => Promise<T>;
  isAuthenticated: boolean;
}

/**
 * Hook para gerenciar refresh automático de autenticação
 * Fornece funcionalidades para detectar e renovar tokens JWT expirados
 */
export function useAuthRefresh(): UseAuthRefreshReturn {
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const router = useRouter();

  // Verifica o status de autenticação inicial
  useEffect(() => {
    const checkAuthStatus = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        setIsAuthenticated(!!user);
      } catch (error) {
        console.error('Erro ao verificar status de autenticação:', error);
        setIsAuthenticated(false);
      }
    };

    checkAuthStatus();

    // Escuta mudanças na autenticação
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        setIsAuthenticated(!!session);
        
        if (event === 'SIGNED_OUT') {
          setIsAuthenticated(false);
          router.push('/login');
        } else if (event === 'TOKEN_REFRESHED') {
          // Token refresh success logs removed for production
          setIsAuthenticated(true);
        }
      }
    );

    return () => {
      subscription.unsubscribe();
    };
  }, [router]);

  /**
   * Executa refresh manual do token
   */
  const refreshToken = useCallback(async () => {
    if (isRefreshing) return;
    
    setIsRefreshing(true);
    
    try {
      await authRefresh.refreshToken();
      toast.success('Sessão renovada com sucesso');
    } catch (error) {
      console.error('Erro ao renovar sessão:', error);
      toast.error('Erro ao renovar sessão. Faça login novamente.');
      router.push('/login?error=session_expired');
    } finally {
      setIsRefreshing(false);
    }
  }, [isRefreshing, router]);

  /**
   * Executa operação com retry automático em caso de JWT expirado
   */
  const executeWithRetry = useCallback(async <T>(
    operation: () => Promise<T>
  ): Promise<T> => {
    try {
      return await authRefresh.executeWithRetry(operation);
    } catch (error: any) {
      // Se é erro de autenticação, mostra toast e redireciona
      if (
        error?.code === 'PGRST301' || 
        error?.message?.includes('JWT expired') ||
        error?.message?.includes('invalid JWT')
      ) {
        toast.error('Sessão expirada. Redirecionando para login...');
        router.push('/login?error=session_expired');
      }
      
      throw error;
    }
  }, [router]);

  return {
    isRefreshing,
    refreshToken,
    executeWithRetry,
    isAuthenticated
  };
}

/**
 * Hook simplificado para operações que precisam de retry automático
 */
export function useSupabaseWithRetry() {
  const { executeWithRetry } = useAuthRefresh();
  
  return {
    executeWithRetry
  };
}

/**
 * Hook para monitorar status de autenticação
 */
export function useAuthStatus() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        setIsAuthenticated(!!user);
      } catch (error) {
        console.error('Erro ao verificar autenticação:', error);
        setIsAuthenticated(false);
      } finally {
        setIsLoading(false);
      }
    };

    checkAuth();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        setIsAuthenticated(!!session);
        setIsLoading(false);
      }
    );

    return () => subscription.unsubscribe();
  }, []);

  return { isAuthenticated, isLoading };
}