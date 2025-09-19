import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { SupabaseAuthRefresh } from '@/lib/supabase/auth-refresh';

/**
 * 🔒 UTILITÁRIOS COMPARTILHADOS DE AUTENTICAÇÃO
 * Funções comuns para criação de clientes Supabase e validação de auth
 * Mantém separação clara entre contextos admin e tenant
 */

export interface BaseAuthContext {
  user: any;
  supabase: ReturnType<typeof createServerClient>;
}

/**
 * Cria um cliente Supabase padronizado que suporta cookies e Bearer tokens
 * Usado tanto para admin quanto para tenant, mas em contextos separados
 */
export function createAuthenticatedSupabaseClient(request: NextRequest) {
  const authHeader = request.headers.get('authorization');
  const bearerToken = authHeader?.startsWith('Bearer ') ? authHeader.substring(7) : null;
  
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return request.cookies.get(name)?.value;
        },
        set() {}, // Read-only no middleware
        remove() {}, // Read-only no middleware
      },
      global: {
        headers: bearerToken ? {
          Authorization: `Bearer ${bearerToken}`
        } : {}
      }
    }
  );
}

/**
 * Autentica um usuário usando o cliente Supabase com retry automático
 * Função compartilhada entre admin e tenant
 */
export async function authenticateUser(supabase: any): Promise<{ user: any; error: any }> {
  const authRefresh = SupabaseAuthRefresh.getInstance();
  
  try {
    const result = await authRefresh.executeWithRetry(async () => {
      return await supabase.auth.getUser();
    });
    
    return {
      user: result.data.user,
      error: result.error
    };
  } catch (error) {
    return {
      user: null,
      error
    };
  }
}

/**
 * Cria resposta de erro padronizada para APIs
 */
export function createAuthErrorResponse(message: string, status: number): NextResponse {
  return NextResponse.json({ error: message }, { status });
}

/**
 * Cria redirecionamento de erro padronizado para páginas
 */
export function createAuthRedirect(url: string, request: NextRequest): NextResponse {
  return NextResponse.redirect(new URL(url, request.url));
}