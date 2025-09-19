import { NextRequest, NextResponse } from 'next/server';
import { WithdrawalService } from '@/services/withdrawal/WithdrawalService';
import { createClient } from '@/lib/supabase/server';
import { z } from 'zod';

// Validation schema for withdrawal validation
const withdrawalValidationSchema = z.object({
  amount: z.number().min(100, 'Valor mínimo de R$ 1,00').max(100000000, 'Valor máximo de R$ 1.000.000,00') // in cents
});

/**
 * POST /api/wallet/withdraw/validate
 * Validates if a withdrawal request is possible
 */
export async function POST(request: NextRequest) {
  try {
    // Get user and validate authentication
    const supabase = await createClient();
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    
    if (userError || !user) {
      return NextResponse.json(
        { error: 'Não autorizado' },
        { status: 401 }
      );
    }

    // Get user profile with tenant_id
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('tenant_id')
      .eq('id', user.id)
      .single();

    if (profileError || !profile?.tenant_id) {
      return NextResponse.json(
        { error: 'Perfil de usuário não encontrado' },
        { status: 404 }
      );
    }

    // Parse and validate request body
    const body = await request.json();
    const validationResult = withdrawalValidationSchema.safeParse(body);
    
    if (!validationResult.success) {
      return NextResponse.json(
        { 
          error: 'Dados inválidos',
          details: validationResult.error.issues
        },
        { status: 400 }
      );
    }

    const { amount } = validationResult.data;

    // Initialize withdrawal service
    const withdrawalService = new WithdrawalService(
      profile.tenant_id,
      user.id
    );

    // Validate withdrawal
    const validationResponse = await withdrawalService.validateWithdrawal(amount);
    
    if (!validationResponse.success) {
      return NextResponse.json(
        { error: validationResponse.error },
        { status: 400 }
      );
    }

    // Calculate fee
    const feeResult = await withdrawalService.calculateFee(amount);
    
    if (!feeResult.success) {
      return NextResponse.json(
        { error: feeResult.error },
        { status: 400 }
      );
    }

    const fee_amount = feeResult.data || 0;
    const net_amount = amount - fee_amount;

    return NextResponse.json({
      success: true,
      data: {
        ...validationResponse.data,
        fee_amount,
        net_amount,
        gross_amount: amount
      }
    });

  } catch (error) {
    console.error('Error validating withdrawal:', error);
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}