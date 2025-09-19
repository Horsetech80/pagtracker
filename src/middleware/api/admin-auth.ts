import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient, verifyAdminPermissions } from '@/lib/supabase/admin-middleware';
import { log } from '@/lib/logger';

/**
 * Interface para informações do administrador autenticado
 */
export interface AdminInfo {
  adminId: string;
  email: string;
  role: 'super_admin' | 'admin' | 'moderador';
  name?: string;
}

/**
 * Middleware de autenticação para APIs administrativas
 * Verifica se o usuário está autenticado e tem permissões de administrador
 * 
 * @param handler Função que processa a requisição após validação do admin
 * @returns NextResponse
 */
export function withAdminAuth(
  handler: (req: NextRequest, adminInfo: AdminInfo) => Promise<NextResponse>
) {
  return async (req: NextRequest) => {
    try {
      // Admin API auth verification logs removed for production
      
      // Criar cliente Supabase para admin
      const supabase = createAdminClient(req);
      
      // Verificar se o usuário está autenticado
      const { data: { user }, error: authError } = await supabase.auth.getUser();
      
      if (authError || !user) {
        // Admin API user not authenticated logs removed for production
        return NextResponse.json(
          { 
            success: false,
            error: 'Autenticação obrigatória',
            message: 'Você precisa estar autenticado para acessar esta API'
          },
          { status: 401 }
        );
      }
      
      // Verificar permissões de administrador
      const hasPermissions = await verifyAdminPermissions(supabase, user.id, user.email || '');
      
      if (!hasPermissions) {
        // Admin API insufficient permissions logs removed for production
        
        log.warn('Tentativa de acesso não autorizado à API administrativa', {
          userId: user.id,
          email: user.email,
          endpoint: req.nextUrl.pathname
        });
        
        return NextResponse.json(
          { 
            success: false,
            error: 'Acesso não autorizado',
            message: 'Você não tem permissões para acessar esta API administrativa'
          },
          { status: 403 }
        );
      }
      
      // Buscar informações completas do administrador
      const { data: adminData, error: adminError } = await supabase
        .from('admin_users')
        .select('*')
        .eq('email', user.email)
        .eq('is_active', true)
        .single();
      
      if (adminError || !adminData) {
        // Admin API user data not found logs removed for production
        return NextResponse.json(
          { 
            success: false,
            error: 'Dados do administrador não encontrados',
            message: 'Não foi possível carregar as informações do administrador'
          },
          { status: 500 }
        );
      }
      
      // Atualizar último login
      await supabase
        .from('admin_users')
        .update({ last_login: new Date().toISOString() })
        .eq('id', user.id);
      
      // Admin API auth success logs removed for production
      
      // Criar objeto com informações do admin
      const adminInfo: AdminInfo = {
        adminId: user.id,
        email: user.email || '',
        role: adminData.role,
        name: adminData.name
      };
      
      log.info('Acesso autorizado à API administrativa', {
        adminId: adminInfo.adminId,
        email: adminInfo.email,
        role: adminInfo.role,
        endpoint: req.nextUrl.pathname
      });
      
      // Chamar o handler com as informações do admin
      return await handler(req, adminInfo);
      
    } catch (error) {
      console.error('❌ [ADMIN-AUTH] Erro no middleware de autenticação:', error);
      
      log.error('Erro no middleware de autenticação administrativa', {
        error: (error as Error).message,
        endpoint: req.nextUrl.pathname
      });
      
      return NextResponse.json(
        { 
          success: false,
          error: 'Erro interno de autenticação',
          message: 'Ocorreu um erro durante a verificação de autenticação'
        },
        { status: 500 }
      );
    }
  };
}

/**
 * Middleware simplificado para verificar apenas se é um administrador válido
 * Sem retornar informações detalhadas
 */
export function requireAdminAuth() {
  return withAdminAuth(async (req, adminInfo) => {
    return NextResponse.next();
  });
}

/**
 * Verificar se um usuário tem uma role específica
 */
export function requireAdminRole(requiredRoles: string[]) {
  return withAdminAuth(async (req, adminInfo) => {
    if (!requiredRoles.includes(adminInfo.role)) {
      return NextResponse.json(
        { 
          success: false,
          error: 'Permissão insuficiente',
          message: `Esta operação requer uma das seguintes permissões: ${requiredRoles.join(', ')}`
        },
        { status: 403 }
      );
    }
    
    return NextResponse.next();
  });
}