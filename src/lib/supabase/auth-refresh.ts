import { supabase } from './client';

/**
 * Sistema de refresh automático de JWT token para Supabase
 * Detecta tokens expirados e os renova automaticamente
 */
export class SupabaseAuthRefresh {
  private static instance: SupabaseAuthRefresh;
  private refreshPromise: Promise<void> | null = null;
  private isRefreshing = false;

  private constructor() {}

  static getInstance(): SupabaseAuthRefresh {
    if (!SupabaseAuthRefresh.instance) {
      SupabaseAuthRefresh.instance = new SupabaseAuthRefresh();
    }
    return SupabaseAuthRefresh.instance;
  }

  /**
   * Verifica se o token JWT está expirado
   */
  private isTokenExpired(token: string): boolean {
    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      const currentTime = Math.floor(Date.now() / 1000);
      return payload.exp < currentTime;
    } catch {
      return true; // Se não conseguir decodificar, considera expirado
    }
  }

  /**
   * Executa o refresh do token usando Supabase
   */
  private async performTokenRefresh(): Promise<void> {
    try {
      console.log('🔄 Iniciando refresh do token JWT...');
      
      const { data, error } = await supabase.auth.refreshSession();
      
      if (error) {
        console.error('❌ Erro ao fazer refresh do token:', error);
        throw error;
      }
      
      if (data?.session) {
        // JWT token refresh success logs removed for production
      } else {
        throw new Error('Sessão não encontrada após refresh');
      }
    } catch (error) {
      console.error('❌ Falha crítica no refresh do token:', error);
      // Redirecionar para login se o refresh falhar
      if (typeof window !== 'undefined') {
        window.location.href = '/login?error=session_expired';
      }
      throw error;
    }
  }

  /**
   * Refresh automático com controle de concorrência
   */
  async refreshToken(): Promise<void> {
    if (this.isRefreshing) {
      // Se já está fazendo refresh, aguarda o processo atual
      return this.refreshPromise || Promise.resolve();
    }

    this.isRefreshing = true;
    this.refreshPromise = this.performTokenRefresh();

    try {
      await this.refreshPromise;
    } finally {
      this.isRefreshing = false;
      this.refreshPromise = null;
    }
  }

  /**
   * Intercepta erros de JWT expirado e executa refresh automático
   */
  async handleAuthError(error: any): Promise<boolean> {
    // Verifica se é erro de JWT expirado
    if (
      error?.code === 'PGRST301' || 
      error?.message?.includes('JWT expired') ||
      error?.message?.includes('invalid JWT')
    ) {
      // JWT token expiration detection logs removed for production
      
      try {
        await this.refreshToken();
        return true; // Indica que o refresh foi bem-sucedido
      } catch (refreshError) {
        console.error('❌ Falha no refresh automático:', refreshError);
        return false;
      }
    }
    
    return false; // Não é erro de JWT expirado
  }

  /**
   * Wrapper para executar operações com retry automático em caso de JWT expirado
   */
  async executeWithRetry<T>(
    operation: () => Promise<T>,
    maxRetries: number = 1
  ): Promise<T> {
    let lastError: any;
    
    for (let attempt = 0; attempt <= maxRetries; attempt++) {
      try {
        return await operation();
      } catch (error) {
        lastError = error;
        
        // Se é o primeiro erro e é JWT expirado, tenta refresh
        if (attempt === 0 && await this.handleAuthError(error)) {
          console.log('🔄 Tentando operação novamente após refresh do token...');
          continue;
        }
        
        // Se não é JWT expirado ou já tentou refresh, propaga o erro
        break;
      }
    }
    
    throw lastError;
  }

  /**
   * Monitora a sessão e executa refresh preventivo
   * REMOVIDO: listener onAuthStateChange para evitar conflitos com AuthContext
   */
  startSessionMonitoring(): void {
    if (typeof window === 'undefined') return;

    // REMOVIDO: listener onAuthStateChange duplicado que causava conflitos
    // O AuthContext já gerencia mudanças de estado de autenticação

    // Verifica periodicamente se o token está próximo do vencimento
    // OTIMIZADO: reduzido de 1 minuto para 5 minutos para reduzir requisições
    setInterval(async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        
        if (!user) return;
        
        // Obter sessão atual sem forçar refresh
        const { data: { session } } = await supabase.auth.getSession();
        
        if (session?.access_token) {
          const payload = JSON.parse(atob(session.access_token.split('.')[1]));
          const currentTime = Math.floor(Date.now() / 1000);
          const timeUntilExpiry = payload.exp - currentTime;
          
          // Se faltam menos de 5 minutos para expirar, faz refresh preventivo
          if (timeUntilExpiry < 300 && timeUntilExpiry > 0) {
            console.log('⏰ Token próximo do vencimento, fazendo refresh preventivo...');
            await this.refreshToken();
          }
        }
      } catch (error) {
        console.error('Erro no monitoramento de sessão:', error);
      }
    }, 300000); // Verifica a cada 5 minutos (reduzido de 1 minuto)
  }
}

// Instância singleton
export const authRefresh = SupabaseAuthRefresh.getInstance();

// Inicializar monitoramento quando o módulo for carregado
if (typeof window !== 'undefined') {
  authRefresh.startSessionMonitoring();
}