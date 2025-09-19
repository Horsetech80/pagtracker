import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { tenantId } = body;

    if (!tenantId) {
      return NextResponse.json(
        { error: 'tenantId é obrigatório' },
        { status: 400 }
      );
    }

    const supabase = await createClient();

    // Verificar se o usuário está autenticado
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json(
        { error: 'Usuário não autenticado' },
        { status: 401 }
      );
    }

    // Simular atualização de status de verificação
    // Em um cenário real, isso seria feito por um processo de verificação automático ou manual
    const { error: updateError } = await supabase
      .from('users')
      .update({
        verification_status: 'pending',
        updated_at: new Date().toISOString()
      })
      .eq('id', user.id)
      .eq('tenant_id', tenantId);

    if (updateError) {
      console.error('Erro ao atualizar status de verificação:', updateError);
      return NextResponse.json(
        { error: 'Erro ao atualizar status de verificação' },
        { status: 500 }
      );
    }

    return NextResponse.json(
      { message: 'Status de verificação atualizado com sucesso' },
      { status: 200 }
    );

  } catch (error) {
    console.error('Erro na API de status de verificação:', error);
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const tenantId = searchParams.get('tenantId');

    if (!tenantId) {
      return NextResponse.json(
        { error: 'tenantId é obrigatório' },
        { status: 400 }
      );
    }

    const supabase = await createClient();

    // Verificar se o usuário está autenticado
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json(
        { error: 'Usuário não autenticado' },
        { status: 401 }
      );
    }

    // Buscar status atual de verificação
    const { data: userData, error: fetchError } = await supabase
      .from('users')
      .select('verification_status, verification_completed')
      .eq('id', user.id)
      .eq('tenant_id', tenantId)
      .single();

    if (fetchError) {
      console.error('Erro ao buscar status de verificação:', fetchError);
      return NextResponse.json(
        { error: 'Erro ao buscar status de verificação' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      status: userData.verification_status || 'not_started',
      completed: userData.verification_completed || false
    }, { status: 200 });

  } catch (error) {
    console.error('Erro na API de status de verificação:', error);
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}