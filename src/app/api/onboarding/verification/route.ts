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

    // Marcar verificação como concluída
    const { error: updateError } = await supabase
      .from('users')
      .update({
        verification_completed: true,
        onboarding_completed: true,
        can_access_payments: true,
        can_access_withdrawals: true,
        updated_at: new Date().toISOString()
      })
      .eq('id', user.id)
      .eq('tenant_id', tenantId);

    if (updateError) {
      console.error('Erro ao atualizar verificação:', updateError);
      return NextResponse.json(
        { error: 'Erro ao completar verificação' },
        { status: 500 }
      );
    }

    // Atualizar status no tenant também
    const { error: tenantUpdateError } = await supabase
      .from('tenants')
      .update({
        verification_completed: true,
        onboarding_completed: true,
        updated_at: new Date().toISOString()
      })
      .eq('id', tenantId);

    if (tenantUpdateError) {
      console.error('Erro ao atualizar tenant:', tenantUpdateError);
    }

    return NextResponse.json(
      { message: 'Verificação concluída com sucesso' },
      { status: 200 }
    );

  } catch (error) {
    console.error('Erro na API de verificação:', error);
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

    // Buscar status de verificação do usuário
    const { data: userData, error: userError } = await supabase
      .from('users')
      .select(`
        personal_data_completed,
        company_data_completed,
        financial_config_completed,
        verification_completed,
        onboarding_completed,
        can_access_payments,
        can_access_withdrawals
      `)
      .eq('id', user.id)
      .eq('tenant_id', tenantId)
      .single();

    if (userError) {
      console.error('Erro ao buscar dados do usuário:', userError);
      return NextResponse.json(
        { error: 'Erro ao buscar status de verificação' },
        { status: 500 }
      );
    }

    // Buscar status de verificação do tenant
    const { data: tenantData, error: tenantError } = await supabase
      .from('tenants')
      .select(`
        company_data_completed,
        financial_config_completed,
        verification_completed,
        onboarding_completed
      `)
      .eq('id', tenantId)
      .single();

    if (tenantError) {
      console.error('Erro ao buscar dados do tenant:', tenantError);
    }

    // Calcular status geral de verificação
    const verificationStatus = {
      personal_data: userData.personal_data_completed || false,
      company_data: (userData.company_data_completed && tenantData?.company_data_completed) || false,
      financial_config: (userData.financial_config_completed && tenantData?.financial_config_completed) || false,
      documents: userData.verification_completed || false,
      compliance: userData.verification_completed || false,
      overall_completed: userData.onboarding_completed || false,
      can_access_payments: userData.can_access_payments || false,
      can_access_withdrawals: userData.can_access_withdrawals || false
    };

    return NextResponse.json(verificationStatus, { status: 200 });

  } catch (error) {
    console.error('Erro na API de verificação:', error);
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}