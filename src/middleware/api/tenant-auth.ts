import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { createApiErrorResponse } from './handlers';

/**
 * 🎯 MIDDLEWARE CORRIGIDO - SEGUINDO MELHORES PRÁTICAS SUPABASE
 * 
 * Baseado na documentação oficial:
 * - https://supabase.com/docs/guides/auth/server-side/nextjs
 * - https://supabase.com/docs/guides/troubleshooting/how-do-you-troubleshoot-nextjs---supabase-auth-issues
 * 
 * CORREÇÕES APLICADAS:
 * 1. ✅ Configuração correta de cookies para SSR
 * 2. ✅ Cliente único Supabase (sem confusão)
 * 3. ✅ Validação mínima e eficiente
 * 4. ✅ Passagem de dados via parâmetro (não headers)
 */

export interface SimpleTenantInfo {
  tenantId: string;
  userId: string;
  userEmail: string;
  role?: string;
}

export function withTenantAuth(handler: (req: NextRequest, tenantInfo: SimpleTenantInfo, context?: any) => Promise<NextResponse>) {
  return async (req: NextRequest, context?: any) => {
    try {
      // 🔧 CORREÇÃO 1: Cliente Supabase corretamente configurado para SSR
      const supabaseAuth = createServerClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        {
          cookies: {
            // ✅ CORRETO: Permitir que Supabase leia cookies
            get(name: string) {
              return req.cookies.get(name)?.value;
            },
            // ✅ CORRETO: Middleware de leitura não precisa definir cookies
            set() {},
            remove() {},
          },
        }
      );

      // 🔧 CORREÇÃO 2: Autenticação simples e direta
      const { data: { user }, error: authError } = await supabaseAuth.auth.getUser();
      
      if (authError) {
        console.error('❌ [withTenantAuth] Erro de autenticação:', authError.message);
        return createApiErrorResponse(401, 'AUTH_ERROR', authError.message);
      }
      
      if (!user) {
        console.error('❌ [withTenantAuth] Usuário não autenticado');
        return createApiErrorResponse(401, 'UNAUTHENTICATED', 'Usuário não autenticado');
      }

      // 🔧 CORREÇÃO 3: Buscar tenant_id da tabela users usando Service Role Key
      const supabaseService = createServerClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_ROLE_KEY!,
        {
          cookies: {
            get() { return undefined; },
            set() { },
            remove() { },
          },
        }
      );

      const { data: userData, error: userError } = await supabaseService
        .from('users')
        .select('tenant_id')
        .eq('id', user.id)
        .single();
      
      if (userError || !userData || !userData.tenant_id) {
        console.error('❌ [withTenantAuth] Usuário sem tenant_id na tabela users:', userError?.message);
        return createApiErrorResponse(400, 'NO_TENANT', 'Usuário não possui tenant associado');
      }

      const tenantId = userData.tenant_id;

      // 🔧 CORREÇÃO 4: Info mínima e suficiente para gateway de pagamento
      const tenantInfo: SimpleTenantInfo = {
        tenantId,
        userId: user.id,
        userEmail: user.email || '',
        role: 'USER' // Para gateway de pagamento, role específica não é crítica
      };

      // ✅ SUCESSO: Executar handler com dados validados
      return await handler(req, tenantInfo, context);

    } catch (error: any) {
      console.error('❌ [withTenantAuth] Erro crítico:', error.message);
      return createApiErrorResponse(500, 'INTERNAL_ERROR', 'Erro interno de autenticação');
    }
  };
}

/**
 * Wrapper para funções de API que verificam acesso a recursos específicos de um tenant
 * 
 * @param handler Função que processa a requisição após validação do recurso
 * @returns NextResponse
 */
export function withResourceAuth<T>(
  handler: (req: NextRequest, tenantInfo: SimpleTenantInfo, resource: T) => Promise<NextResponse>,
  getResource: (req: NextRequest) => Promise<T | null>,
  getResourceTenantId: (resource: T) => string
) {
  return withTenantAuth(async (req: NextRequest, tenantInfo: SimpleTenantInfo) => {
    // Obter o recurso
    const resource = await getResource(req);
    
    if (!resource) {
      return createApiErrorResponse(404, 'not_found', 'Recurso não encontrado');
    }
    
    // Obter o ID do tenant do recurso
    const resourceTenantId = getResourceTenantId(resource);
    
    // Verificar acesso
    if (resourceTenantId !== tenantInfo.tenantId) {
      return createApiErrorResponse(403, 'forbidden', 'Acesso não autorizado a este recurso');
    }
    
    // Processar a requisição
    return handler(req, tenantInfo, resource);
  });
}