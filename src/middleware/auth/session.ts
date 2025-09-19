import { NextRequest } from 'next/server';

/**
 * Simula a verificação de sessão para testes
 * Em produção, utilize auth real ou JWT para obter a sessão
 */
export async function getSession(request: NextRequest) {
  // Tentar ler o cookie da sessão
  const sessionCookie = request.cookies.get('user-session');
  
  if (!sessionCookie) return null;
  
  try {
    // Em produção, verifique JWT ou outro token seguro
    return JSON.parse(decodeURIComponent(sessionCookie.value));
  } catch (error) {
    console.error('Erro ao decodificar sessão:', error);
    return null;
  }
}

/**
 * Verifica se a rota é pública (não requer autenticação)
 */
export function isPublicRoute(pathname: string) {
  const publicPaths = [
    '/login',
    '/register',
    '/api/auth',
    '/reset-password',
    '/checkout/', // Rotas públicas de checkout
    '/api/webhooks', // Webhooks públicos
    '/_next', // Arquivos estáticos do Next.js
    '/favicon.ico',
  ];
  
  return publicPaths.some(path => pathname.startsWith(path));
} 