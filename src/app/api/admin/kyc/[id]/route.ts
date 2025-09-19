import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;
    const body = await request.json();
    const { action, notes } = body;

    if (!action || !['approve', 'reject'].includes(action)) {
      return NextResponse.json(
        { error: 'Ação inválida. Use "approve" ou "reject"' },
        { status: 400 }
      );
    }

    const supabase = await createClient();

    // Verificar se o usuário está autenticado e é admin
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json(
        { error: 'Usuário não autenticado' },
        { status: 401 }
      );
    }

    // Verificar se é admin na tabela admin_users
    const { data: adminData, error: adminError } = await supabase
      .from('admin_users')
      .select('role, is_active, name')
      .eq('id', user.id)
      .eq('is_active', true)
      .single();

    if (adminError || !adminData) {
      return NextResponse.json(
        { error: 'Acesso negado - usuário não é administrador' },
        { status: 403 }
      );
    }

    // Buscar a verificação KYC
    const { data: verification, error: fetchError } = await supabase
      .from('kyc_verifications')
      .select('*')
      .eq('id', id)
      .single();

    if (fetchError || !verification) {
      return NextResponse.json(
        { error: 'Verificação não encontrada' },
        { status: 404 }
      );
    }

    if (verification.status !== 'pending') {
      return NextResponse.json(
        { error: 'Esta verificação já foi processada' },
        { status: 400 }
      );
    }

    const newStatus = action === 'approve' ? 'approved' : 'rejected';
    const reviewedAt = new Date().toISOString();

    // Atualizar a verificação KYC
    const { error: updateError } = await supabase
      .from('kyc_verifications')
      .update({
        status: newStatus,
        reviewed_by: user.id,
        reviewed_at: reviewedAt,
        review_notes: notes || null,
        updated_at: reviewedAt
      })
      .eq('id', id);

    if (updateError) {
      console.error('Erro ao atualizar verificação KYC:', updateError);
      return NextResponse.json(
        { error: 'Erro ao processar verificação' },
        { status: 500 }
      );
    }

    // Atualizar status do usuário se aprovado
    if (action === 'approve') {
      const { error: userUpdateError } = await supabase
        .from('users')
        .update({
          verification_status: 'approved',
          verification_completed: true,
          can_access_payments: true,
          can_access_withdrawals: true,
          onboarding_completed: true,
          updated_at: reviewedAt
        })
        .eq('id', verification.user_id)
        .eq('tenant_id', verification.tenant_id);

      if (userUpdateError) {
        console.error('Erro ao atualizar usuário:', userUpdateError);
      }

      // Atualizar tenant
      const { error: tenantUpdateError } = await supabase
        .from('tenants')
        .update({
          verification_completed: true,
          onboarding_completed: true,
          updated_at: reviewedAt
        })
        .eq('id', verification.tenant_id);

      if (tenantUpdateError) {
        console.error('Erro ao atualizar tenant:', tenantUpdateError);
      }
    } else {
      // Se rejeitado, atualizar apenas o status
      const { error: userUpdateError } = await supabase
        .from('users')
        .update({
          verification_status: 'rejected',
          updated_at: reviewedAt
        })
        .eq('id', verification.user_id)
        .eq('tenant_id', verification.tenant_id);

      if (userUpdateError) {
        console.error('Erro ao atualizar usuário:', userUpdateError);
      }
    }

    return NextResponse.json({
      message: `Verificação ${action === 'approve' ? 'aprovada' : 'rejeitada'} com sucesso`,
      status: newStatus,
      reviewedBy: adminData.name || user.email,
      reviewedAt
    });

  } catch (error) {
    console.error('Erro na API de processamento KYC:', error);
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;
    const supabase = await createClient();

    // Verificar se o usuário está autenticado e é admin
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json(
        { error: 'Usuário não autenticado' },
        { status: 401 }
      );
    }

    // Verificar se é admin na tabela admin_users
    const { data: adminData, error: adminError } = await supabase
      .from('admin_users')
      .select('role, is_active')
      .eq('id', user.id)
      .eq('is_active', true)
      .single();

    if (adminError || !adminData) {
      return NextResponse.json(
        { error: 'Acesso negado - usuário não é administrador' },
        { status: 403 }
      );
    }

    // Buscar a verificação KYC com dados relacionados
    const { data: verification, error: fetchError } = await supabase
      .from('kyc_verifications')
      .select(`
        *,
        users!inner(
          id,
          email,
          full_name,
          cpf,
          phone,
          created_at
        ),
        tenants!inner(
          id,
          name,
          cnpj,
          created_at
        ),
        reviewed_by_user:users!kyc_verifications_reviewed_by_fkey(
          id,
          full_name,
          email
        )
      `)
      .eq('id', id)
      .single();

    if (fetchError || !verification) {
      return NextResponse.json(
        { error: 'Verificação não encontrada' },
        { status: 404 }
      );
    }

    return NextResponse.json({ verification });

  } catch (error) {
    console.error('Erro na API de busca KYC:', error);
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}