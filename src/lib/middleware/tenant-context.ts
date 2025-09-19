import { NextRequest } from 'next/server';
import { createServiceClient } from '@/lib/supabase/server';

/**
 * Middleware de API para extrair e definir o contexto de tenant
 * Para usar, basta envolver seu handler de API com esta função
 * 
 * @example
 * import { withTenantContext } from '@/lib/middleware/tenant-context';
 * 
 * export const GET = withTenantContext(async (req) => {
 *   // Seu código aqui, com tenant_id já definido no contexto
 *   return Response.json({ success: true });
 * });
 */
export function withTenantContext<T extends (...args: any[]) => Promise<Response>>(
  handler: T
): (...args: Parameters<T>) => Promise<Response> {
  return async (...args: Parameters<T>): Promise<Response> => {
    const req = args[0] as NextRequest;
    
    try {
      // Extrair tenant_id
      const tenantId = extractTenantIdFromRequest(req);
      
      if (!tenantId) {
        return new Response(
          JSON.stringify({ error: 'Tenant ID não encontrado' }),
          { status: 400, headers: { 'Content-Type': 'application/json' } }
        );
      }
      
      // Definir o tenant_id no supabase para esta sessão
      const supabase = createServiceClient();
      await supabase.rpc('set_tenant_context', { tenant_id: tenantId });
      
      // Executar o handler original com o tenant_id no contexto
      return handler(...args);
    } catch (error: any) {
      console.error('Erro ao processar contexto de tenant:', error);
      
      return new Response(
        JSON.stringify({ error: error.message || 'Erro interno' }),
        { status: 500, headers: { 'Content-Type': 'application/json' } }
      );
    }
  };
}

/**
 * Extrai o tenant_id da requisição usando várias estratégias
 */
function extractTenantIdFromRequest(req: NextRequest): string | null {
  // Tentar obter do cookie
  const tenantCookie = req.cookies.get('tenant-id')?.value;
  if (tenantCookie) {
    return tenantCookie;
  }
  
  // Tentar obter do cabeçalho
  const tenantHeader = req.headers.get('x-tenant-id');
  if (tenantHeader) {
    return tenantHeader;
  }
  
  // Tentar obter da URL (/api/tenant/[tenant_id]/resource)
  const pathSegments = req.nextUrl.pathname.split('/');
  const tenantIndex = pathSegments.findIndex(segment => segment === 'tenant');
  if (tenantIndex !== -1 && pathSegments.length > tenantIndex + 1) {
    return pathSegments[tenantIndex + 1];
  }
  
  return null;
} 