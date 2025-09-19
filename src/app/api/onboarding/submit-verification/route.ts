import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { tenantId, documents } = body;

    if (!tenantId) {
      return NextResponse.json(
        { error: 'tenantId é obrigatório' },
        { status: 400 }
      );
    }

    if (!documents || !Array.isArray(documents)) {
      return NextResponse.json(
        { error: 'Documentos são obrigatórios' },
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

    // Verificar se todas as etapas anteriores foram completadas
    const { data: userData, error: fetchError } = await supabase
      .from('users')
      .select('personal_data_completed, company_data_completed, financial_config_completed')
      .eq('id', user.id)
      .eq('tenant_id', tenantId)
      .single();

    if (fetchError) {
      console.error('Erro ao buscar dados do usuário:', fetchError);
      return NextResponse.json(
        { error: 'Erro ao verificar status do usuário' },
        { status: 500 }
      );
    }

    if (!userData.personal_data_completed || !userData.company_data_completed || !userData.financial_config_completed) {
      return NextResponse.json(
        { error: 'Todas as etapas anteriores devem ser completadas antes da verificação' },
        { status: 400 }
      );
    }

    // Criar entrada na tabela de verificações KYC
    const { data: kycData, error: kycError } = await supabase
      .from('kyc_verifications')
      .insert({
        user_id: user.id,
        tenant_id: tenantId,
        status: 'pending',
        priority: 'medium',
        documents: documents,
        submitted_at: new Date().toISOString(),
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .select()
      .single();

    if (kycError) {
      console.error('Erro ao criar verificação KYC:', kycError);
      return NextResponse.json(
        { error: 'Erro ao criar solicitação de verificação' },
        { status: 500 }
      );
    }

    // Atualizar status do usuário
    const { error: updateError } = await supabase
      .from('users')
      .update({
        verification_status: 'submitted',
        verification_submitted_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .eq('id', user.id)
      .eq('tenant_id', tenantId);

    if (updateError) {
      console.error('Erro ao enviar para verificação:', updateError);
      return NextResponse.json(
        { error: 'Erro ao enviar dados para verificação' },
        { status: 500 }
      );
    }

    // Nota: A aprovação deve ser feita manualmente pelo painel administrativo
    // O status permanecerá como 'submitted' até aprovação manual

    return NextResponse.json(
      { 
        message: 'Dados e documentos enviados para verificação com sucesso',
        status: 'submitted',
        verificationId: kycData.id
      },
      { status: 200 }
    );

  } catch (error) {
    console.error('Erro na API de envio para verificação:', error);
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}