'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { supabase } from '@/lib/supabase/client';
import { User as SupabaseUser } from '@supabase/supabase-js';

// Interface para representar um usuário autenticado
export interface AuthUser {
  id: string;
  email: string;
  nome?: string;
  tenant_id: string;
  role: 'ADMIN' | 'MANAGER' | 'USER';
  created_at?: string;
  updated_at?: string;
}

interface AuthContextType {
  user: AuthUser | null;
  supabaseUser: SupabaseUser | null;
  isLoading: boolean;
  error: string | null;
  signIn: (email: string, password: string) => Promise<{ success: boolean; error?: string }>;
  signOut: () => Promise<void>;
  refreshUser: () => Promise<void>;
}

// Criando o contexto
const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Hook para usar o contexto de autenticação
export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth deve ser usado dentro de um AuthProvider');
  }
  return context;
}

interface AuthProviderProps {
  children: ReactNode;
}

// Provider do contexto
export function AuthProvider({ children }: AuthProviderProps) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [supabaseUser, setSupabaseUser] = useState<SupabaseUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isMounted, setIsMounted] = useState(false);
  const [lastAuthEvent, setLastAuthEvent] = useState<string | null>(null);

  // Controlar montagem do componente para evitar problemas de hidratação
  useEffect(() => {
    setIsMounted(true);
  }, []);

  // Função para buscar dados do usuário do banco de dados
  const fetchUserData = async (supabaseUser: SupabaseUser): Promise<AuthUser | null> => {
    try {
      // Buscar dados do usuário na tabela users
      const { data: userData, error: userError } = await supabase
        .from('users')
        .select('id, email, nome, tenant_id')
        .eq('id', supabaseUser.id)
        .single();

      if (userError || !userData) {
        console.error('Erro ao buscar dados do usuário:', userError);
        return null;
      }

      // Buscar role do usuário no tenant
      const { data: roleData, error: roleError } = await supabase
        .from('tenant_users')
        .select('role')
        .eq('tenant_id', userData.tenant_id)
        .eq('user_id', supabaseUser.id)
        .single();

      if (roleError || !roleData) {
        console.error('Erro ao buscar role do usuário:', roleError);
        return null;
      }

      return {
        id: supabaseUser.id,
        email: supabaseUser.email || '',
        nome: userData.nome || '',
        tenant_id: userData.tenant_id,
        role: roleData.role.toUpperCase() as 'ADMIN' | 'MANAGER' | 'USER',
        created_at: supabaseUser.created_at,
        updated_at: supabaseUser.updated_at
      };
    } catch (err) {
      console.error('Erro ao buscar dados do usuário:', err);
      return null;
    }
  };

  // Função para fazer login
  const signIn = async (email: string, password: string): Promise<{ success: boolean; error?: string }> => {
    try {
      setIsLoading(true);
      setError(null);

      const { data, error: signInError } = await supabase.auth.signInWithPassword({
        email,
        password
      });

      if (signInError) {
        setError(signInError.message);
        return { success: false, error: signInError.message };
      }

      if (data.user) {
        const userData = await fetchUserData(data.user);
        if (userData) {
          setUser(userData);
          setSupabaseUser(data.user);
          return { success: true };
        } else {
          setError('Erro ao carregar dados do usuário');
          return { success: false, error: 'Erro ao carregar dados do usuário' };
        }
      }

      return { success: false, error: 'Erro desconhecido' };
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erro ao fazer login';
      setError(errorMessage);
      return { success: false, error: errorMessage };
    } finally {
      setIsLoading(false);
    }
  };

  // Função para fazer logout
  const signOut = async (): Promise<void> => {
    try {
      setIsLoading(true);
      await supabase.auth.signOut();
      setUser(null);
      setSupabaseUser(null);
      setError(null);
    } catch (err) {
      console.error('Erro ao fazer logout:', err);
    } finally {
      setIsLoading(false);
    }
  };

  // Função para atualizar dados do usuário
  const refreshUser = async (): Promise<void> => {
    try {
      const { data: { user: currentUser } } = await supabase.auth.getUser();
      
      if (currentUser) {
        const userData = await fetchUserData(currentUser);
        if (userData) {
          setUser(userData);
          setSupabaseUser(currentUser);
        }
      } else {
        setUser(null);
        setSupabaseUser(null);
      }
    } catch (err) {
      console.error('Erro ao atualizar usuário:', err);
    }
  };

  // Inicializar autenticação ao carregar o componente
  useEffect(() => {
    if (!isMounted) return;

    let isInitializing = false;
    let mounted = true;

    const initializeAuth = async () => {
      if (isInitializing || !mounted) return; // Prevenir múltiplas inicializações
      isInitializing = true;
      
      setIsLoading(true);
      setError(null);

      try {
        // Verificar se há um usuário logado
        const { data: { user: currentUser } } = await supabase.auth.getUser();
        
        if (currentUser && mounted) {
          const userData = await fetchUserData(currentUser);
          if (userData && mounted) {
            setUser(userData);
            setSupabaseUser(currentUser);
          } else if (mounted) {
            // Se não conseguir buscar dados do usuário, limpar estado sem logout forçado
            setUser(null);
            setSupabaseUser(null);
          }
        } else if (mounted) {
          setUser(null);
          setSupabaseUser(null);
        }
      } catch (err) {
        if (mounted) {
          console.error('Erro ao inicializar autenticação:', err);
          setError('Erro ao inicializar autenticação');
        }
      } finally {
        if (mounted) {
          setIsLoading(false);
        }
        isInitializing = false;
      }
    };

    // Listener para mudanças de autenticação
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        // Evitar processamento durante inicialização
        if (isInitializing) {
          return;
        }
        
        if (event === 'SIGNED_IN' && session?.user && mounted) {
          const userData = await fetchUserData(session.user);
          if (userData && mounted) {
            setUser(userData);
            setSupabaseUser(session.user);
          }
        } else if (event === 'SIGNED_OUT' && mounted) {
          setUser(null);
          setSupabaseUser(null);
        }
      }
    );

    // Inicializar após configurar o listener
    initializeAuth();

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, [isMounted]);

  const contextValue: AuthContextType = {
    user,
    supabaseUser,
    isLoading,
    error,
    signIn,
    signOut,
    refreshUser
  };

  return (
    <AuthContext.Provider value={contextValue}>
      {children}
    </AuthContext.Provider>
  );
}