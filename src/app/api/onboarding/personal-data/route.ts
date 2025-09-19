import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { cpf, telefone, endereco, cidade, estado, cep, tenantId } = body;

    // Validações básicas
    if (!cpf || !telefone || !endereco || !cidade || !estado || !cep || !tenantId) {
      return NextResponse.json(
        { error: 'Todos os campos obrigatórios devem ser preenchidos' },
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

    // Atualizar dados pessoais do usuário
    const { error: updateError } = await supabase
      .from('users')
      .update({
        cpf,
        phone: telefone,
        endereco,
        cidade,
        estado,
        cep,
        personal_data_completed: true,
        updated_at: new Date().toISOString()
      })
      .eq('id', user.id);

    if (updateError) {
      console.error('Erro ao atualizar dados pessoais:', updateError);
      return NextResponse.json(
        { error: 'Erro ao salvar dados pessoais' },
        { status: 500 }
      );
    }

    // Verificar se todas as etapas estão completas para atualizar o progresso geral
    const { data: userData, error: fetchError } = await supabase
      .from('users')
      .select('personal_data_completed, company_data_completed, financial_config_completed, verification_completed')
      .eq('id', user.id)
      .single();

    if (!fetchError && userData) {
      const allCompleted = userData.personal_data_completed && 
                          userData.company_data_completed && 
                          userData.financial_config_completed && 
                          userData.verification_completed;
      
      if (allCompleted) {
        await supabase
          .from('users')
          .update({ onboarding_completed: true })
          .eq('id', user.id);
      }
    }

    return NextResponse.json(
      { message: 'Dados pessoais salvos com sucesso' },
      { status: 200 }
    );

  } catch (error) {
    console.error('Erro na API de dados pessoais:', error);
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

    // Buscar dados pessoais do usuário
    const { data: userData, error: fetchError } = await supabase
      .from('users')
      .select('cpf, phone, endereco, cidade, estado, cep, personal_data_completed')
      .eq('id', user.id)
      .single();

    if (fetchError) {
      console.error('Erro ao buscar dados pessoais:', fetchError);
      return NextResponse.json(
        { error: 'Erro ao buscar dados pessoais' },
        { status: 500 }
      );
    }

    return NextResponse.json(userData, { status: 200 });

  } catch (error) {
    console.error('Erro na API de dados pessoais:', error);
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}