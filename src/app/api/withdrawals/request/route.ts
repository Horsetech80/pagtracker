import { NextRequest, NextResponse } from 'next/server';
import { createServiceClient } from '@/lib/supabase/server';
import { notifyWithdrawalStatusChange } from '@/lib/notifications/withdrawal';
import { z } from 'zod';

// Schema de validação para solicitação de saque
const withdrawalRequestSchema = z.object({
  amount: z.number().positive('Valor deve ser positivo'),
  pix_key: z.string().min(1, 'Chave PIX é obrigatória'),
  pix_key_type: z.enum(['cpf', 'cnpj', 'email', 'phone', 'random'], 'Tipo de chave PIX inválido'),
  recipient_name: z.string().min(1, 'Nome do destinatário é obrigatório'),
  recipient_document: z.string().optional()
});

export async function POST(request: NextRequest) {
  try {
    // Obter tenant_id e user_id dos headers
    const tenantId = request.headers.get('x-tenant-id');
    const userId = request.headers.get('x-user-id');

    if (!tenantId || !userId) {
      return NextResponse.json(
        { error: 'Headers de autenticação obrigatórios' },
        { status: 401 }
      );
    }

    // Parse e validação do body
    const body = await request.json();
    const validatedData = withdrawalRequestSchema.parse(body);

    // Converter valor para centavos
    const amountCents = Math.round(validatedData.amount * 100);

    // Criar cliente Supabase
    const supabase = createServiceClient();

    // Verificar saldo disponível do usuário
    const { data: balanceData, error: balanceError } = await supabase
      .rpc('get_wallet_balance', {
        p_tenant_id: tenantId,
        p_user_id: userId
      });

    if (balanceError) {
      console.error('Erro ao verificar saldo:', balanceError);
      return NextResponse.json(
        { error: 'Erro ao verificar saldo disponível' },
        { status: 500 }
      );
    }

    const availableBalance = balanceData?.[0]?.saldo_disponivel || 0;
    
    // Verificar se há saldo suficiente
    if (amountCents > availableBalance) {
      return NextResponse.json(
        { 
          error: 'Saldo insuficiente',
          available_balance: availableBalance / 100,
          requested_amount: validatedData.amount
        },
        { status: 400 }
      );
    }

    // Criar solicitação de saque
    const { data: withdrawal, error: insertError } = await supabase
      .from('withdrawals')
      .insert({
        tenant_id: tenantId,
        user_id: userId,
        amount: validatedData.amount,
        amount_cents: amountCents,
        pix_key: validatedData.pix_key,
        pix_key_type: validatedData.pix_key_type,
        recipient_name: validatedData.recipient_name,
        recipient_document: validatedData.recipient_document,
        status: 'pending'
      })
      .select()
      .single();

    if (insertError) {
      console.error('Erro ao criar solicitação de saque:', insertError);
      return NextResponse.json(
        { error: 'Erro ao criar solicitação de saque' },
        { status: 500 }
      );
    }

    // Enviar notificação de saque solicitado
    try {
      await notifyWithdrawalStatusChange(withdrawal);
    } catch (notificationError) {
      console.error('Erro ao enviar notificação:', notificationError);
      // Não falhar a requisição por erro de notificação
    }

    // Retornar dados da solicitação criada
    return NextResponse.json({
      success: true,
      withdrawal: {
        id: withdrawal.id,
        amount: withdrawal.amount,
        pix_key: withdrawal.pix_key,
        pix_key_type: withdrawal.pix_key_type,
        recipient_name: withdrawal.recipient_name,
        status: withdrawal.status,
        created_at: withdrawal.created_at
      }
    });

  } catch (error) {
    console.error('Erro na API de solicitação de saque:', error);
    
    // Erro de validação do Zod
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { 
          error: 'Dados inválidos',
          details: error.issues.map(err => ({
            field: err.path.join('.'),
            message: err.message
          }))
        },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}

// Método GET para listar saques do usuário
export async function GET(request: NextRequest) {
  try {
    // Obter tenant_id e user_id dos headers
    const tenantId = request.headers.get('x-tenant-id');
    const userId = request.headers.get('x-user-id');

    if (!tenantId || !userId) {
      return NextResponse.json(
        { error: 'Headers de autenticação obrigatórios' },
        { status: 401 }
      );
    }

    // Parâmetros de paginação
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');
    const offset = (page - 1) * limit;

    // Criar cliente Supabase
    const supabase = createServiceClient();

    // Buscar saques do usuário
    const { data: withdrawals, error } = await supabase
      .from('withdrawals')
      .select('*')
      .eq('tenant_id', tenantId)
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (error) {
      console.error('Erro ao buscar saques:', error);
      return NextResponse.json(
        { error: 'Erro ao buscar histórico de saques' },
        { status: 500 }
      );
    }

    // Contar total de registros
    const { count, error: countError } = await supabase
      .from('withdrawals')
      .select('*', { count: 'exact', head: true })
      .eq('tenant_id', tenantId)
      .eq('user_id', userId);

    if (countError) {
      console.error('Erro ao contar saques:', countError);
    }

    return NextResponse.json({
      withdrawals: withdrawals || [],
      pagination: {
        page,
        limit,
        total: count || 0,
        pages: Math.ceil((count || 0) / limit)
      }
    });

  } catch (error) {
    console.error('Erro na API de listagem de saques:', error);
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}