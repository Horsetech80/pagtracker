import { NextRequest, NextResponse } from 'next/server';
import { createAuthenticatedSupabaseClient, authenticateUser, createAuthErrorResponse, createAuthRedirect, BaseAuthContext } from './unified-auth';

/**
 * 🔒 MIDDLEWARE DE AUTENTICAÇÃO ADMIN
 * Específico para o painel administrativo
 * Mantém separação clara do contexto de tenant
 */

export interface AdminAuthContext extends BaseAuthContext {
  isAdmin: boolean;
  adminRole?: string;
}

/**
 * Verifica se um usuário tem permissões de administrador
 */
async function verifyAdminPermissions(supabase: any, userId: string, email: string): Promise<{ isAdmin: boolean; role?: string }> {
  // Lista de super admins
  const SUPER_ADMIN_EMAILS = [
    'admin@pagtracker.com',
    'superadmin@pagtracker.com'
  ];
  
  if (SUPER_ADMIN_EMAILS.includes(email)) {
    return { isAdmin: true, role: 'super_admin' };
  }
  
  // Verificar na tabela de admins (se existir)
  try {
    const { data: adminData, error } = await supabase
      .from('admin_users')
      .select('id, role, is_active')
      .eq('user_id', userId)
      .eq('is_active', true)
      .single();
    
    if (!error && adminData) {
      return { isAdmin: true, role: adminData.role };
    }
  } catch {
    // Fallback: verificar se tem role admin na tabela users
    try {
      const { data: userData, error: userError } = await supabase
        .from('users')
        .select('role, is_admin')
        .eq('id', userId)
        .single();
      
      if (!userError && userData && (userData.is_admin || userData.role === 'admin')) {
        return { isAdmin: true, role: userData.role || 'admin' };
      }
    } catch {
      // Ignore
    }
  }
  
  return { isAdmin: false };
}

/**
 * Middleware de autenticação para rotas administrativas
 */
export function withAdminAuth(
  handler: (req: NextRequest, context: AdminAuthContext) => Promise<NextResponse>
) {
  return async (req: NextRequest) => {
    try {
      const isApiRoute = req.nextUrl.pathname.startsWith('/api/admin/');
      const isLoginPage = req.nextUrl.pathname === '/admin/login';
      
      // Permitir acesso à página de login sem autenticação
      if (isLoginPage) {
        return NextResponse.next();
      }
      
      // Criar cliente Supabase
      const supabase = createAuthenticatedSupabaseClient(req);
      
      // Autenticar usuário
      const { user, error: authError } = await authenticateUser(supabase);
      
      if (authError || !user) {
        // Admin auth user not authenticated logs removed for production
        
        if (isApiRoute) {
          return createAuthErrorResponse('Autenticação obrigatória', 401);
        }
        
        return createAuthRedirect('/admin/login', req);
      }
      
      // Verificar permissões de administrador
      const { isAdmin, role } = await verifyAdminPermissions(supabase, user.id, user.email || '');
      
      if (!isAdmin) {
        // Admin auth insufficient permissions logs removed for production
        
        if (isApiRoute) {
          return createAuthErrorResponse('Acesso não autorizado', 403);
        }
        
        return createAuthRedirect('/admin/login?error=unauthorized', req);
      }
      
      // Admin auth success logs removed for production
      
      // Criar contexto de autenticação admin
      const context: AdminAuthContext = {
        user,
        supabase,
        isAdmin: true,
        adminRole: role
      };
      
      // Chamar o handler com o contexto
      return await handler(req, context);
      
    } catch (error) {
      console.error('[ADMIN AUTH] Erro inesperado:', error);
      
      if (req.nextUrl.pathname.startsWith('/api/admin/')) {
        return createAuthErrorResponse('Erro interno de autenticação', 500);
      }
      
      return createAuthRedirect('/admin/login?error=server_error', req);
    }
  };
}

/**
 * Verifica se uma rota é uma rota administrativa
 */
export function isAdminRoute(pathname: string): boolean {
  return pathname.startsWith('/admin');
}

/**
 * Constantes de permissões administrativas
 */
export const ADMIN_PERMISSIONS = {
  // Gestão de tenants
  MANAGE_TENANTS: 'manage_tenants',
  VIEW_TENANTS: 'view_tenants',
  
  // Gestão financeira
  MANAGE_FINANCES: 'manage_finances',
  VIEW_FINANCES: 'view_finances',
  APPROVE_WITHDRAWALS: 'approve_withdrawals',
  
  // Gestão de usuários
  MANAGE_USERS: 'manage_users',
  VIEW_USERS: 'view_users',
  
  // Configurações
  MANAGE_SETTINGS: 'manage_settings',
  VIEW_SETTINGS: 'view_settings',
  
  // Relatórios
  VIEW_REPORTS: 'view_reports',
  EXPORT_DATA: 'export_data',
  
  // Sistema
  MANAGE_SYSTEM: 'manage_system',
  VIEW_LOGS: 'view_logs'
} as const;

export const DEFAULT_PERMISSIONS = {
  super_admin: Object.values(ADMIN_PERMISSIONS),
  admin: [
    ADMIN_PERMISSIONS.VIEW_TENANTS,
    ADMIN_PERMISSIONS.MANAGE_FINANCES,
    ADMIN_PERMISSIONS.VIEW_FINANCES,
    ADMIN_PERMISSIONS.APPROVE_WITHDRAWALS,
    ADMIN_PERMISSIONS.VIEW_USERS,
    ADMIN_PERMISSIONS.VIEW_REPORTS,
    ADMIN_PERMISSIONS.EXPORT_DATA
  ],
  moderator: [
    ADMIN_PERMISSIONS.VIEW_TENANTS,
    ADMIN_PERMISSIONS.VIEW_FINANCES,
    ADMIN_PERMISSIONS.VIEW_USERS,
    ADMIN_PERMISSIONS.VIEW_REPORTS
  ]
} as const;