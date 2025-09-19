import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { 
      cnpj, 
      razao_social, 
      nome_fantasia, 
      tipo_empresa, 
      inscricao_estadual, 
      inscricao_municipal, 
      endereco, 
      cidade, 
      estado, 
      cep, 
      tenantId 
    } = body;

    // Validações básicas
    if (!cnpj || !razao_social || !tipo_empresa || !endereco || !cidade || !estado || !cep || !tenantId) {
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

    // Atualizar dados da empresa no tenant
    const { error: updateError } = await supabase
      .from('tenants')
      .update({
        cnpj,
        razao_social,
        nome_fantasia,
        tipo_empresa,
        inscricao_estadual,
        inscricao_municipal,
        endereco,
        cidade,
        estado,
        cep,
        company_data_completed: true,
        updated_at: new Date().toISOString()
      })
      .eq('id', tenantId);

    if (updateError) {
      console.error('Erro ao atualizar dados da empresa:', updateError);
      return NextResponse.json(
        { error: 'Erro ao salvar dados da empresa' },
        { status: 500 }
      );
    }

    // Atualizar status no usuário também
    const { error: userUpdateError } = await supabase
      .from('users')
      .update({
        company_data_completed: true,
        updated_at: new Date().toISOString()
      })
      .eq('id', user.id)
      .eq('tenant_id', tenantId);

    if (userUpdateError) {
      console.error('Erro ao atualizar status do usuário:', userUpdateError);
    }

    // Verificar se todas as etapas estão completas para atualizar o progresso geral
    const { data: userData, error: fetchError } = await supabase
      .from('users')
      .select('personal_data_completed, company_data_completed, financial_config_completed, verification_completed')
      .eq('id', user.id)
      .eq('tenant_id', tenantId)
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
          .eq('id', user.id)
          .eq('tenant_id', tenantId);
      }
    }

    return NextResponse.json(
      { message: 'Dados da empresa salvos com sucesso' },
      { status: 200 }
    );

  } catch (error) {
    console.error('Erro na API de dados da empresa:', error);
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

    // Buscar dados da empresa
    const { data: tenantData, error: fetchError } = await supabase
      .from('tenants')
      .select(`
        cnpj, 
        razao_social, 
        nome_fantasia, 
        tipo_empresa, 
        inscricao_estadual, 
        inscricao_municipal, 
        endereco, 
        cidade, 
        estado, 
        cep, 
        company_data_completed
      `)
      .eq('id', tenantId)
      .single();

    if (fetchError) {
      console.error('Erro ao buscar dados da empresa:', fetchError);
      return NextResponse.json(
        { error: 'Erro ao buscar dados da empresa' },
        { status: 500 }
      );
    }

    return NextResponse.json(tenantData, { status: 200 });

  } catch (error) {
    console.error('Erro na API de dados da empresa:', error);
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}