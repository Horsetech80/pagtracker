/**
 * Middleware do Cliente - PagTracker v4.0
 * 
 * Middleware específico para o painel do cliente
 */

import { NextRequest, NextResponse } from 'next/server';

/**
 * Middleware para o painel do cliente
 */
export async function clientMiddleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Client middleware processing logs removed for production

  try {
    // Bloquear acesso a rotas administrativas no painel cliente
    if (pathname.startsWith('/admin')) {
      // Admin route blocking logs removed for production
      return NextResponse.redirect(new URL('/', request.url));
    }

    // Continuar com o processamento normal para rotas do cliente
    return NextResponse.next();

  } catch (error) {
    console.error('[CLIENT MIDDLEWARE] Erro:', {
      pathname,
      error: (error as Error).message
    });

    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}

/**
 * Configuração do matcher para o middleware do cliente
 */
export const clientConfig = {
  matcher: [
    /*
     * Executar em todas as rotas exceto:
     * - _next/static (arquivos estáticos)
     * - _next/image (otimização de imagens)
     * - favicon.ico
     * - api routes (processadas separadamente)
     */
    '/((?!_next/static|_next/image|favicon.ico|api).*)',
  ],
};