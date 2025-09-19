import { NextResponse } from 'next/server';

/**
 * Verifica se é rota administrativa que requer permissões especiais
 */
export function isAdminRoute(pathname: string) {
  return pathname.startsWith('/admin');
}

/**
 * Verifica se é rota de gerenciamento que requer permissões específicas
 */
export function isManagerRoute(pathname: string) {
  return pathname.startsWith('/manage');
}

/**
 * Verifica se o usuário tem o papel necessário para acessar a rota
 */
export function hasRoleForRoute(role: string, pathname: string): boolean {
  // Super admin pode acessar tudo
  if (role === 'SUPER_ADMIN') return true;
  
  // Admin pode acessar rotas de admin e gerenciamento
  if (role === 'ADMIN') {
    return !pathname.startsWith('/super-admin');
  }
  
  // Gerente pode acessar rotas de gerenciamento, mas não admin
  if (role === 'MANAGER') {
    return !pathname.startsWith('/admin') && !pathname.startsWith('/super-admin');
  }
  
  // Usuário comum não pode acessar rotas protegidas
  return !isAdminRoute(pathname) && !isManagerRoute(pathname);
}

/**
 * Criar resposta de acesso negado
 */
export function createAccessDeniedResponse(message = 'Acesso não autorizado') {
  return new NextResponse(
    JSON.stringify({ success: false, message }),
    { status: 403, headers: { 'content-type': 'application/json' } }
  );
} 