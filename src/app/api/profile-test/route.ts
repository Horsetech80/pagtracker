import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';

// Configurações diretas do Supabase
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

export async function GET(request: NextRequest) {
  try {
    console.log('[PROFILE TEST] Iniciando teste direto...');
    
    // Criar cliente Supabase diretamente
    const cookieStore = await cookies();
    
    const supabase = createServerClient(supabaseUrl, supabaseAnonKey, {
      cookies: {
        get(name: string) {
          return cookieStore.get(name)?.value;
        },
        set(name: string, value: string, options: any) {
          try {
            cookieStore.set({ name, value, ...options });
          } catch (error) {
            console.log('[PROFILE TEST] Erro ao definir cookie:', error);
          }
        },
        remove(name: string, options: any) {
          try {
            cookieStore.set({ name, value: '', ...options });
          } catch (error) {
            console.log('[PROFILE TEST] Erro ao remover cookie:', error);
          }
        },
      },
    });
    
    console.log('[PROFILE TEST] Cliente Supabase criado com sucesso');
    
    // Verificar usuário
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    console.log('[PROFILE TEST] Usuário:', {
      hasUser: !!user,
      userError: userError?.message
    });
    
    return NextResponse.json({
      success: true,
      message: 'Teste direto funcionando',
      user: {
        exists: !!user,
        userId: user?.id,
        email: user?.email
      },
      userError: userError?.message
    });
    
  } catch (error) {
    console.error('[PROFILE TEST] Erro:', error);
    return NextResponse.json(
      { 
        error: 'Erro interno', 
        details: error instanceof Error ? error.message : 'Erro desconhecido',
        stack: error instanceof Error ? error.stack : undefined
      },
      { status: 500 }
    );
  }
}