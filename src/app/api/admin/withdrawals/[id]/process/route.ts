import { NextRequest, NextResponse } from 'next/server';
import { WithdrawalService } from '@/services/withdrawal/WithdrawalService';
import { createClient } from '@/lib/supabase/server';
import { z } from 'zod';

// Validation schema for processing withdrawal
const processWithdrawalSchema = z.object({
  action: z.enum(['approve', 'reject'], {
    message: 'Ação deve ser "approve" ou "reject"'
  }),
  admin_notes: z.string().optional(),
  rejection_reason: z.string().optional()
}).refine((data) => {
  // If rejecting, rejection_reason should be provided
  if (data.action === 'reject' && !data.rejection_reason) {
    return false;
  }
  return true;
}, {
  message: 'Motivo da rejeição é obrigatório quando rejeitando uma solicitação',
  path: ['rejection_reason']
});

interface RouteParams {
  params: {
    id: string;
  };
}

/**
 * POST /api/admin/withdrawals/[id]/process
 * Processes (approves or rejects) a withdrawal request
 */
export async function POST(
  request: NextRequest,
  { params }: RouteParams
) {
  try {
    // Get user and validate admin authentication
    const supabase = await createClient();
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    
    if (userError || !user) {
      return NextResponse.json(
        { error: 'Não autorizado' },
        { status: 401 }
      );
    }

    // Get user profile and check admin status
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('tenant_id, is_admin')
      .eq('id', user.id)
      .single();

    if (profileError || !profile?.is_admin) {
      return NextResponse.json(
        { error: 'Acesso negado - apenas administradores' },
        { status: 403 }
      );
    }

    // Validate withdrawal ID
    const withdrawalId = params.id;
    if (!withdrawalId || typeof withdrawalId !== 'string') {
      return NextResponse.json(
        { error: 'ID da solicitação inválido' },
        { status: 400 }
      );
    }

    // Parse and validate request body
    const body = await request.json();
    const validationResult = processWithdrawalSchema.safeParse(body);
    
    if (!validationResult.success) {
      return NextResponse.json(
        { 
          error: 'Dados inválidos',
          details: validationResult.error.issues
        },
        { status: 400 }
      );
    }

    const processData = validationResult.data;

    // Initialize withdrawal service (using admin context)
    const withdrawalService = new WithdrawalService(
      'admin', // Special tenant for admin operations
      user.id
    );

    // Process the withdrawal request
    const result = await withdrawalService.processWithdrawalRequest(
      withdrawalId,
      processData,
      user.id
    );

    if (!result.success) {
      return NextResponse.json(
        { error: result.error },
        { status: 400 }
      );
    }

    // If approved, we could trigger the actual PIX transfer here
    // For now, we just update the status to approved
    // The actual PIX transfer would be handled by a separate process/job

    const actionText = processData.action === 'approve' ? 'aprovada' : 'rejeitada';
    
    return NextResponse.json({
      success: true,
      data: result.data,
      message: `Solicitação de saque ${actionText} com sucesso`
    });

  } catch (error) {
    console.error('Error processing withdrawal request:', error);
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}