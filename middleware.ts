/**
 * Middleware Unificado - PagTracker v4.0
 * 
 * Sistema de middleware isolado que delega baseado no modo de operação:
 * - NEXT_PUBLIC_ADMIN_MODE=true: Painel Administrativo (porta 3001)
 * - NEXT_PUBLIC_ADMIN_MODE=false/undefined: Painel Cliente (porta 3000)
 */

import { NextRequest, NextResponse } from 'next/server';

/**
 * Middleware principal unificado
 */
export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const port = request.nextUrl.port;
  const isAdminMode = port === '3001'; // Detectar modo baseado na porta

  console.log(`[MIDDLEWARE] Modo: ${isAdminMode ? 'ADMIN' : 'CLIENT'} | Porta: ${port} | Rota: ${pathname}`);

  try {
    // Isolamento por porta
    if (port === '3001') {
      // Painel Administrativo - Porta 3001
      return await handleAdminPanel(request);
    } else if (port === '3000') {
      // Painel Cliente - Porta 3000
      return await handleClientPanel(request);
    } else {
      // Porta não reconhecida, permitir passagem
      console.log(`[MIDDLEWARE] Porta não reconhecida: ${port}`);
      return NextResponse.next();
    }

  } catch (error) {
    console.error('[MIDDLEWARE] Erro:', {
      pathname,
      port,
      mode: isAdminMode ? 'admin' : 'client',
      error: (error as Error).message
    });

    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}

/**
 * Handler para o Painel Administrativo
 */
async function handleAdminPanel(request: NextRequest) {
  const { pathname, searchParams } = request.nextUrl;
  
  console.log('[ADMIN PANEL] Processando:', pathname);
  
  // Permitir arquivos estáticos
  if (isStaticFile(pathname)) {
    return NextResponse.next();
  }
  
  // Permitir requisições RSC (React Server Components) sem interferência
  if (searchParams.has('_rsc')) {
    console.log('[ADMIN PANEL] Permitindo requisição RSC:', pathname);
    return NextResponse.next();
  }
  
  // Redirecionar /admin para /admin/painel
  if (pathname === '/admin' || pathname === '/admin/') {
    return NextResponse.redirect(new URL('/admin/painel', request.url));
  }
  
  // Verificar autenticação para rotas administrativas
  if (pathname.startsWith('/admin/')) {
    const { adminAuthMiddleware } = await import('./src/middleware/admin/auth');
    return await adminAuthMiddleware(request);
  }
  
  return NextResponse.next();
}

/**
 * Handler para o Painel Cliente
 */
async function handleClientPanel(request: NextRequest) {
  const { pathname, searchParams } = request.nextUrl;
  
  console.log('[CLIENT PANEL] Processando:', pathname);
  
  // Permitir arquivos estáticos
  if (isStaticFile(pathname)) {
    return NextResponse.next();
  }
  
  // Permitir requisições RSC (React Server Components) sem interferência
  if (searchParams.has('_rsc')) {
    console.log('[CLIENT PANEL] Permitindo requisição RSC:', pathname);
    return NextResponse.next();
  }
  
  // Bloquear acesso a rotas administrativas no painel cliente
  if (pathname.startsWith('/admin')) {
    console.log('[CLIENT PANEL] Bloqueando acesso a rota admin:', pathname);
    return NextResponse.redirect(new URL('/', request.url));
  }
  
  // Para o painel cliente, usar middleware específico apenas para rotas protegidas
  if (pathname.startsWith('/dashboard') || pathname.startsWith('/painel') || pathname.startsWith('/financeiro') || pathname.startsWith('/vendas') || pathname.startsWith('/cobrancas') || pathname.startsWith('/clientes') || pathname.startsWith('/carteira') || pathname.startsWith('/configuracoes')) {
    const { clientAuthMiddleware } = await import('./src/middleware/client/auth');
    return await clientAuthMiddleware(request);
  }
  
  // Permitir todas as outras rotas do cliente sem interferência
  return NextResponse.next();
}

/**
 * Verifica se é um arquivo estático
 */
function isStaticFile(pathname: string): boolean {
  return (
    pathname.startsWith('/_next/') ||
    pathname.startsWith('/favicon.ico') ||
    pathname.startsWith('/manifest.') ||
    // Verificar se é um arquivo estático real (com extensão no pathname, não nos query params)
    /\.[a-zA-Z0-9]+$/.test(pathname) && !pathname.includes('/api/')
  );
}

/**
 * Configuração do matcher para definir em quais rotas o middleware será executado
 */
export const config = {
  matcher: [
    /*
     * Executar em todas as rotas exceto:
     * - _next/static (arquivos estáticos)
     * - _next/image (otimização de imagens)
     * - favicon.ico
     * - arquivos com extensões reais
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\\.[a-zA-Z0-9]+$).*)',
  ],
};