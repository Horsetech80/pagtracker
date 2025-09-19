import { NextRequest, NextResponse } from 'next/server';
import { WithdrawalService } from '@/services/withdrawal/WithdrawalService';
import { createClient } from '@/lib/supabase/server';
import { z } from 'zod';

// Validation schema for withdrawal request
const withdrawalRequestSchema = z.object({
  amount: z.number().min(100, 'Valor mínimo de R$ 1,00').max(100000000, 'Valor máximo de R$ 1.000.000,00'), // in cents
  pix_key: z.string().min(1, 'Chave PIX é obrigatória'),
  pix_key_type: z.enum(['cpf', 'cnpj', 'email', 'phone', 'random'], {
    message: 'Tipo de chave PIX inválido'
  }),
  description: z.string().optional()
});

/**
 * POST /api/wallet/withdraw
 * Creates a new withdrawal request
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
      .from('users')
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
    const validationResult = withdrawalRequestSchema.safeParse(body);
    
    if (!validationResult.success) {
      return NextResponse.json(
        { 
          error: 'Dados inválidos',
          details: validationResult.error.issues
        },
        { status: 400 }
      );
    }

    const { amount, pix_key, pix_key_type, description } = validationResult.data;

    // Get client IP and user agent for audit
    const ip_address = request.headers.get('x-forwarded-for') || 
                      request.headers.get('x-real-ip') || 
                      'unknown';
    const user_agent = request.headers.get('user-agent') || 'unknown';

    // Initialize withdrawal service
    const withdrawalService = new WithdrawalService(
      profile.tenant_id,
      user.id
    );

    // Create withdrawal request
    const result = await withdrawalService.createWithdrawalRequest({
      amount,
      pix_key,
      pix_key_type,
      description,
      ip_address,
      user_agent
    });

    if (!result.success) {
      return NextResponse.json(
        { error: result.error },
        { status: 400 }
      );
    }

    return NextResponse.json({
      success: true,
      data: result.data,
      message: 'Solicitação de saque criada com sucesso'
    });

  } catch (error) {
    console.error('Error creating withdrawal request:', error);
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}

/**
 * GET /api/wallet/withdraw
 * Gets withdrawal requests for the authenticated user
 */
export async function GET(request: NextRequest) {
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

    // Parse query parameters
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');
    const status = searchParams.get('status') || undefined;

    // Validate pagination parameters
    if (page < 1 || limit < 1 || limit > 100) {
      return NextResponse.json(
        { error: 'Parâmetros de paginação inválidos' },
        { status: 400 }
      );
    }

    // Initialize withdrawal service
    const withdrawalService = new WithdrawalService(
      profile.tenant_id,
      user.id
    );

    // Get withdrawal requests
    const result = await withdrawalService.getWithdrawalRequests(
      page,
      limit,
      status
    );

    if (!result.success) {
      return NextResponse.json(
        { error: result.error },
        { status: 400 }
      );
    }

    return NextResponse.json({
      success: true,
      data: result.data
    });

  } catch (error) {
    console.error('Error fetching withdrawal requests:', error);
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}