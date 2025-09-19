import { createServerClient } from '@supabase/ssr';
import { NextRequest, NextResponse } from 'next/server';
/**
 * Cria um cliente Supabase para middleware administrativo usando @supabase/ssr
 * Usa as configurações específicas do painel admin
 * @param req - Objeto NextRequest
 * @param res - Objeto NextResponse (opcional)
 * @returns Cliente Supabase para admin
 */
export function createAdminClient(req: NextRequest, res = NextResponse.next()) {
  // Usar as configurações específicas do admin
  const supabaseUrl = process.env.NEXT_PUBLIC_ADMIN_SUPABASE_URL || 'https://tqcxbiofslypocltpxmb.supabase.co';
  const supabaseKey = process.env.NEXT_PUBLIC_ADMIN_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRxY3hiaW9mc2x5cG9jbHRweG1iIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDQzMjUxMTUsImV4cCI6MjA1OTkwMTExNX0.kOsMsS6ag_cNMQmAy6cnoSnargbN6WFJJbrck8dwym8';
  
  return createServerClient(
    supabaseUrl,
    supabaseKey,
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
 * Verifica se um email está na lista de super administradores
 * @param email - Email do usuário
 * @returns boolean
 */
export function isSuperAdminEmail(email: string): boolean {
  const SUPER_ADMIN_EMAILS = [
    'admin@pagtracker.com',
    'superadmin@pagtracker.com'
  ];
  
  return SUPER_ADMIN_EMAILS.includes(email);
}

/**
 * Verifica se um usuário tem permissões de administrador
 * @param supabase - Cliente Supabase
 * @param userId - ID do usuário
 * @param email - Email do usuário
 * @returns Promise<boolean>
 */
export async function verifyAdminPermissions(
  supabase: ReturnType<typeof createAdminClient>,
  userId: string,
  email: string
): Promise<boolean> {
  try {
    // Verificar se o email está autorizado
    if (!isSuperAdminEmail(email)) {
      console.log(`❌ Email ${email} não está na lista de super admins`);
      return false;
    }
    
    // Verificar se existe na tabela admin_users
    const { data: adminUser, error } = await supabase
      .from('admin_users')
      .select('*')
      .eq('email', email)
      .eq('is_active', true)
      .single();
    
    if (error || !adminUser) {
      console.log(`⚠️ Usuário ${email} não encontrado na tabela admin_users, criando...`);
      
      // Criar automaticamente se não existe
      const { error: createError } = await supabase
        .from('admin_users')
        .insert({
          id: userId,
          email: email,
          name: email.split('@')[0],
          role: 'super_admin',
          is_active: true,
          created_at: new Date().toISOString(),
          last_login: new Date().toISOString()
        });
      
      if (createError) {
        console.error('❌ Erro ao criar admin user:', createError);
        return false;
      }
      
      console.log(`✅ Admin user criado para ${email}`);
    }
    
    return true;
  } catch (error) {
    console.error('❌ Erro ao verificar permissões admin:', error);
    return false;
  }
}