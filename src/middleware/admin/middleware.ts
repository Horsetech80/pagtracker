import { NextRequest, NextResponse } from 'next/server'
import { adminAuthMiddleware, isAdminRoute } from './auth'

/**
 * Middleware específico para o painel administrativo
 * Este middleware é executado apenas quando NEXT_PUBLIC_ADMIN_MODE=true
 */
export async function adminMiddleware(request: NextRequest) {
  const pathname = request.nextUrl.pathname
  
  // Admin middleware processing logs removed for production
  
  // Verificar se estamos no modo administrativo
  if (process.env.NEXT_PUBLIC_ADMIN_MODE !== 'true') {
    // Admin mode redirect logs removed for production
    return NextResponse.redirect(new URL('http://localhost:3000', request.url))
  }
  
  // Permitir arquivos estáticos
  if (
    pathname.startsWith('/_next/') ||
    pathname.startsWith('/favicon.ico') ||
    pathname.startsWith('/manifest.json') ||
    pathname.includes('.')
  ) {
    return NextResponse.next()
  }
  
  // Verificar se é uma rota administrativa
  if (isAdminRoute(pathname)) {
    // Admin route detection logs removed for production
    return await adminAuthMiddleware(request)
  }
  
  return NextResponse.next()
}

/**
 * Configuração do matcher para o middleware administrativo
 */
export const adminConfig = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|manifest.webmanifest).*)',
  ],
}