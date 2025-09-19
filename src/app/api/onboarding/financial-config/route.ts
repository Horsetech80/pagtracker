import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { 
      banco, 
      agencia, 
      conta, 
      tipo_conta, 
      tenantId 
    } = body;

    // Validações básicas
    if (!banco || !agencia || !conta || !tipo_conta || !tenantId) {
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

    // Atualizar configurações financeiras no tenant
    const { error: updateError } = await supabase
      .from('tenants')
      .update({
        banco,
        agencia,
        conta,
        tipo_conta,
        financial_config_completed: true,
        updated_at: new Date().toISOString()
      })
      .eq('id', tenantId);

    if (updateError) {
      console.error('Erro ao atualizar configurações financeiras:', updateError);
      return NextResponse.json(
        { error: 'Erro ao salvar configurações financeiras' },
        { status: 500 }
      );
    }

    // Atualizar status no usuário também
    const { error: userUpdateError } = await supabase
      .from('users')
      .update({
        financial_config_completed: true,
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
      { message: 'Configurações financeiras salvas com sucesso' },
      { status: 200 }
    );

  } catch (error) {
    console.error('Erro na API de configurações financeiras:', error);
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

    // Buscar configurações financeiras
    const { data: tenantData, error: fetchError } = await supabase
      .from('tenants')
      .select(`
        banco, 
        agencia, 
        conta, 
        tipo_conta, 
        financial_config_completed
      `)
      .eq('id', tenantId)
      .single();

    if (fetchError) {
      console.error('Erro ao buscar configurações financeiras:', fetchError);
      return NextResponse.json(
        { error: 'Erro ao buscar configurações financeiras' },
        { status: 500 }
      );
    }

    // Buscar chaves PIX existentes
    const { data: pixKeys, error: pixError } = await supabase
      .from('pix_keys')
      .select('id, key_value, key_type, status')
      .eq('tenant_id', tenantId)
      .order('created_at', { ascending: false });

    if (pixError) {
      console.error('Erro ao buscar chaves PIX:', pixError);
    }

    return NextResponse.json({
      ...tenantData,
      pix_keys: pixKeys || []
    }, { status: 200 });

  } catch (error) {
    console.error('Erro na API de configurações financeiras:', error);
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}