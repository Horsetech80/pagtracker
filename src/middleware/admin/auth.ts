import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient, verifyAdminPermissions, isSuperAdminEmail } from '@/lib/supabase/admin-middleware'

/**
 * Middleware de autenticação para super administrador
 * Verifica se o usuário está autenticado e tem permissões de super admin
 */
export async function adminAuthMiddleware(request: NextRequest) {
  const supabase = createAdminClient(request)
  const isApiRoute = request.nextUrl.pathname.startsWith('/api/admin/')
  const isLoginPage = request.nextUrl.pathname === '/admin/login'
  
  // Verificar autenticação real do Supabase
  // Admin auth verification logs removed for production
  
  // Allow access to login page without authentication
  if (isLoginPage) {
    return NextResponse.next()
  }
  
  try {
    // Verificar se o usuário está autenticado
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    
    if (authError || !user) {
      // Admin user not authenticated logs removed for production
      if (isApiRoute) {
        return NextResponse.json({ error: 'Autenticação obrigatória' }, { status: 401 })
      }
      return NextResponse.redirect(new URL('/admin/login', request.url))
    }

    // Verificar permissões de administrador
    const hasPermissions = await verifyAdminPermissions(supabase, user.id, user.email || '')
    
    if (!hasPermissions) {
      console.log(`Admin auth: Usuário ${user.email} não tem permissões de admin`)
      if (isApiRoute) {
        return NextResponse.json({ error: 'Acesso não autorizado' }, { status: 403 })
      }
      return NextResponse.redirect(new URL('/admin/login?error=unauthorized', request.url))
    }

    // Admin authentication success logs removed for production
    return NextResponse.next()

  } catch (error) {
    console.error('Erro no middleware de admin auth:', error)
    if (isApiRoute) {
      return NextResponse.json({ error: 'Erro interno de autenticação' }, { status: 500 })
    }
    return NextResponse.redirect(new URL('/admin/login?error=auth_error', request.url))
  }
}

/**
 * Identifica se uma rota é exclusivamente administrativa
 * IMPORTANTE: Apenas rotas que começam com /admin ou /api/admin/ são consideradas administrativas
 * Rotas como /painel, /financeiro, /carteiras pertencem ao contexto do cliente/tenant
 */
export function isAdminRoute(pathname: string): boolean {
  return pathname.startsWith('/admin') || pathname.startsWith('/api/admin/')
}

/**
 * Verifica se o usuário atual é super admin
 */
export async function isSuperAdmin(email: string): Promise<boolean> {
  if (!isSuperAdminEmail(email)) {
    return false
  }

  const supabase = createAdminClient({} as NextRequest)
  const { data: adminUser, error } = await supabase
    .from('admin_users')
    .select('role, is_active')
    .eq('email', email)
    .single()

  if (error || !adminUser) {
    return false
  }

  return adminUser.is_active && adminUser.role === 'super_admin'
}

/**
 * Tipos para o sistema de admin
 */
export interface AdminUser {
  id: string
  email: string
  name: string
  role: 'super_admin' | 'admin' | 'moderator'
  is_active: boolean
  created_at: string
  last_login: string
  permissions?: string[]
}

export interface AdminSession {
  user: AdminUser
  permissions: string[]
  expires_at: string
}

/**
 * Permissões do sistema admin
 */
export const ADMIN_PERMISSIONS = {
  // Gestão de empresas
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
} as const

/**
 * Permissões padrão por role
 */
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
} as const