import { createServerClient } from '@supabase/ssr';
import { NextRequest, NextResponse } from 'next/server';
/**
 * Cria um cliente Supabase para middleware usando @supabase/ssr
 */
export function createClient(req: NextRequest, res = NextResponse.next()) {
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get: (name: string) => req.cookies.get(name)?.value,
        set: (name: string, value: string, options: any) => {
          req.cookies.set({ name, value, ...options });
          res = NextResponse.next({ request: { headers: req.headers } });
          res.cookies.set({ name, value, ...options });
        },
        remove: (name: string, options: any) => {
          req.cookies.set({ name, value: '', ...options });
          res = NextResponse.next({ request: { headers: req.headers } });
          res.cookies.set({ name, value: '', ...options });
        },
      },
    }
  );
}

/**
 * Função para chamar a função RPC que define o tenant_id no contexto
 * @param supabase - Cliente Supabase
 * @param tenantId - ID do tenant
 */
export async function setTenantContext(
  supabase: ReturnType<typeof createClient>,
  tenantId: string
) {
  try {
    await supabase.rpc('set_tenant_context', { tenant_id: tenantId });
    return true;
  } catch (error) {
    console.error('Erro ao definir o contexto do tenant:', error);
    return false;
  }
}