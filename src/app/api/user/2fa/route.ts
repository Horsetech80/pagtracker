import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { cookies } from 'next/headers';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// Ativar 2FA
export async function POST(request: NextRequest) {
  try {
    const cookieStore = cookies();
    const tenantId = cookieStore.get('tenant-id')?.value;
    const userId = cookieStore.get('user-id')?.value;

    if (!tenantId || !userId) {
      return NextResponse.json(
        { error: 'Usuário não autenticado' },
        { status: 401 }
      );
    }

    // Atualizar o campo two_factor_enabled para true
    const { data, error } = await supabase
      .from('users')
      .update({ 
        two_factor_enabled: true,
        updated_at: new Date().toISOString()
      })
      .eq('id', userId)
      .eq('tenant_id', tenantId)
      .select('two_factor_enabled')
      .single();

    if (error) {
      console.error('Erro ao ativar 2FA:', error);
      return NextResponse.json(
        { error: 'Erro interno do servidor' },
        { status: 500 }
      );
    }

    if (!data) {
      return NextResponse.json(
        { error: 'Usuário não encontrado' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      message: '2FA ativado com sucesso',
      two_factor_enabled: data.two_factor_enabled
    });

  } catch (error) {
    console.error('Erro ao ativar 2FA:', error);
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}

// Desativar 2FA
export async function DELETE(request: NextRequest) {
  try {
    const cookieStore = cookies();
    const tenantId = cookieStore.get('tenant-id')?.value;
    const userId = cookieStore.get('user-id')?.value;

    if (!tenantId || !userId) {
      return NextResponse.json(
        { error: 'Usuário não autenticado' },
        { status: 401 }
      );
    }

    // Atualizar o campo two_factor_enabled para false
    const { data, error } = await supabase
      .from('users')
      .update({ 
        two_factor_enabled: false,
        updated_at: new Date().toISOString()
      })
      .eq('id', userId)
      .eq('tenant_id', tenantId)
      .select('two_factor_enabled')
      .single();

    if (error) {
      console.error('Erro ao desativar 2FA:', error);
      return NextResponse.json(
        { error: 'Erro interno do servidor' },
        { status: 500 }
      );
    }

    if (!data) {
      return NextResponse.json(
        { error: 'Usuário não encontrado' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      message: '2FA desativado com sucesso',
      two_factor_enabled: data.two_factor_enabled
    });

  } catch (error) {
    console.error('Erro ao desativar 2FA:', error);
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}