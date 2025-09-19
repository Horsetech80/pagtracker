import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'

/**
 * Middleware de autenticação para o painel cliente
 * Verifica se o usuário está autenticado para acessar rotas protegidas
 */
export async function clientAuthMiddleware(request: NextRequest) {
  const { pathname } = request.nextUrl
  const isApiRoute = pathname.startsWith('/api/')
  const isLoginPage = pathname === '/login'
  const isRegisterPage = pathname === '/register'
  
  // Client auth verification logs removed for production
  
  // Permitir acesso às páginas de login e registro
  if (isLoginPage || isRegisterPage) {
    return NextResponse.next()
  }
  
  try {
    // Criar cliente Supabase para o painel cliente
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
    const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    
    const supabase = createServerClient(
      supabaseUrl,
      supabaseKey,
      {
        cookies: {
          get: (name: string) => request.cookies.get(name)?.value,
          set: (name: string, value: string, options: any) => {
            // No middleware, não podemos definir cookies diretamente
            // Isso será tratado no lado do cliente
          },
          remove: (name: string, options: any) => {
            // No middleware, não podemos remover cookies diretamente
            // Isso será tratado no lado do cliente
          },
        },
      }
    )
    
    // Verificar se o usuário está autenticado
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    
    if (authError || !user) {
      // User not authenticated logs removed for production
      if (isApiRoute) {
        return NextResponse.json({ error: 'Autenticação obrigatória' }, { status: 401 })
      }
      return NextResponse.redirect(new URL('/login', request.url))
    }
    
    // User authentication success logs removed for production
    return NextResponse.next()
    
  } catch (error) {
    console.error('[CLIENT AUTH] Erro no middleware:', error)
    if (isApiRoute) {
      return NextResponse.json({ error: 'Erro interno de autenticação' }, { status: 500 })
    }
    return NextResponse.redirect(new URL('/login?error=auth_error', request.url))
  }
}

/**
 * Verifica se uma rota requer autenticação no painel cliente
 */
export function requiresClientAuth(pathname: string): boolean {
  const protectedRoutes = [
    '/dashboard',
    '/painel',
    '/financeiro',
    '/carteiras',
    '/transacoes',
    '/perfil',
    '/configuracoes'
  ]
  
  return protectedRoutes.some(route => pathname.startsWith(route))
}