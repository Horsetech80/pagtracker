import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    console.log('[TEST AUTH] Iniciando teste simples...');
    
    // Log dos cookies
    const cookies = request.headers.get('cookie');
    console.log('[TEST AUTH] Cookies:', cookies ? 'Presentes' : 'Ausentes');
    
    // Verificar se as variáveis de ambiente estão definidas
    const envCheck = {
      hasUrl: !!process.env.NEXT_PUBLIC_SUPABASE_URL,
      hasKey: !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
      url: process.env.NEXT_PUBLIC_SUPABASE_URL?.substring(0, 30) + '...',
      keyLength: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.length
    };
    
    console.log('[TEST AUTH] Env check:', envCheck);
    
    return NextResponse.json({
      success: true,
      message: 'API funcionando',
      cookies: {
        present: !!cookies,
        count: cookies ? cookies.split(';').length : 0
      },
      environment: envCheck
    });
    
  } catch (error) {
    console.error('[TEST AUTH] Erro:', error);
    return NextResponse.json(
      { error: 'Erro interno', details: error instanceof Error ? error.message : 'Erro desconhecido' },
      { status: 500 }
    );
  }
}