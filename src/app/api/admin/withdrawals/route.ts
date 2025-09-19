import { NextRequest, NextResponse } from 'next/server';
import { createServiceClient } from '@/lib/supabase/server';
import { z } from 'zod';

// Interface para estatísticas de saques
interface WithdrawalStatistics {
  total_requests: number;
  pending_requests: number;
  approved_requests: number;
  rejected_requests: number;
  processing_requests: number;
  completed_requests: number;
  failed_requests: number;
  total_amount: number;
  pending_amount: number;
  approved_amount: number;
  average_amount: number;
  average_processing_time: number;
}

// Interface para saque com dados do usuário e tenant
interface WithdrawalWithDetails {
  id: string;
  tenant_id: string;
  user_id: string;
  amount: number;
  fee_amount: number;
  net_amount: number;
  pix_key: string;
  pix_key_type: string;
  bank_details?: any;
  description?: string;
  status: string;
  requested_at: string;
  processed_at?: string;
  completed_at?: string;
  processed_by?: string;
  admin_notes?: string;
  rejection_reason?: string;
  efipay_transaction_id?: string;
  created_at: string;
  updated_at: string;
  // Dados do usuário
  user_name?: string;
  user_email?: string;
  user_document?: string;
  // Dados do tenant
  tenant_name?: string;
  tenant_email?: string;
}

// Schema de validação para filtros
const withdrawalsFilterSchema = z.object({
  status: z.enum(['pending', 'approved', 'processing', 'completed', 'rejected', 'failed']).optional(),
  tenant_id: z.string().uuid().optional(),
  user_id: z.string().uuid().optional(),
  date_from: z.string().optional(),
  date_to: z.string().optional(),
  page: z.number().int().positive().default(1),
  limit: z.number().int().positive().max(100).default(20)
});

export async function GET(request: NextRequest) {
  try {
    const adminId = request.headers.get('x-admin-id');
    if (!adminId) {
      return NextResponse.json(
        { error: 'Acesso negado - Admin requerido' },
        { status: 403 }
      );
    }

    const { searchParams } = new URL(request.url);
    const validationResult = withdrawalsFilterSchema.safeParse({
      page: searchParams.get('page') ? parseInt(searchParams.get('page')!) : undefined,
      limit: searchParams.get('limit') ? parseInt(searchParams.get('limit')!) : undefined,
      status: searchParams.get('status') || undefined,
      tenant_id: searchParams.get('tenant_id') || undefined,
      user_id: searchParams.get('user_id') || undefined,
      date_from: searchParams.get('date_from') || undefined,
      date_to: searchParams.get('date_to') || undefined
    });

    if (!validationResult.success) {
      return NextResponse.json(
        { 
          error: 'Parâmetros inválidos',
          details: validationResult.error.issues
        },
        { status: 400 }
      );
    }

    const filters = validationResult.data;
    const page = filters.page || 1;
    const limit = filters.limit || 20;
    const offset = (page - 1) * limit;

    const supabase = createServiceClient();

    // Construir query base sem joins por enquanto
    let query = supabase
      .from('withdrawal_requests')
      .select('*', { count: 'exact' });

    // Aplicar filtros
    if (filters.status) {
      query = query.eq('status', filters.status);
    }
    if (filters.tenant_id) {
      query = query.eq('tenant_id', filters.tenant_id);
    }
    if (filters.user_id) {
      query = query.eq('user_id', filters.user_id);
    }
    if (filters.date_from) {
      query = query.gte('requested_at', filters.date_from);
    }
    if (filters.date_to) {
      query = query.lte('requested_at', filters.date_to);
    }

    // Aplicar ordenação e paginação
    query = query
      .order('requested_at', { ascending: false })
      .range(offset, offset + limit - 1);

    const { data: withdrawals, error: withdrawalsError, count } = await query;

    if (withdrawalsError) {
      console.error('Erro ao buscar saques:', withdrawalsError);
      return NextResponse.json(
        { error: 'Erro ao buscar saques' },
        { status: 500 }
      );
    }

    // Buscar estatísticas
    const { data: statsData, error: statsError } = await supabase
      .from('withdrawal_requests')
      .select('status, amount, processed_at, requested_at')
      .not('status', 'eq', 'cancelled');

    if (statsError) {
      console.error('Erro ao buscar estatísticas:', statsError);
    }

    // Calcular estatísticas
    const statistics: WithdrawalStatistics = {
      total_requests: statsData?.length || 0,
      pending_requests: statsData?.filter(w => w.status === 'pending').length || 0,
      approved_requests: statsData?.filter(w => w.status === 'approved').length || 0,
      rejected_requests: statsData?.filter(w => w.status === 'rejected').length || 0,
      processing_requests: statsData?.filter(w => w.status === 'processing').length || 0,
      completed_requests: statsData?.filter(w => w.status === 'completed').length || 0,
      failed_requests: statsData?.filter(w => w.status === 'failed').length || 0,
      total_amount: statsData?.reduce((sum, w) => sum + (w.amount || 0), 0) || 0,
      pending_amount: statsData?.filter(w => w.status === 'pending').reduce((sum, w) => sum + (w.amount || 0), 0) || 0,
      approved_amount: statsData?.filter(w => w.status === 'approved').reduce((sum, w) => sum + (w.amount || 0), 0) || 0,
      average_amount: statsData?.length ? Math.round((statsData.reduce((sum, w) => sum + (w.amount || 0), 0) / statsData.length)) : 0,
      average_processing_time: statsData?.length ? 
        Math.round(statsData.reduce((sum, w) => {
          if (w.processed_at && w.requested_at) {
            const processedTime = new Date(w.processed_at).getTime();
            const requestedTime = new Date(w.requested_at).getTime();
            return sum + ((processedTime - requestedTime) / (1000 * 60 * 60)); // horas
          }
          return sum;
        }, 0) / statsData.length * 10) / 10 : 0 // média em horas com 1 casa decimal
    };

    // Formatar dados dos saques
    const formattedWithdrawals: WithdrawalWithDetails[] = withdrawals?.map(w => ({
      id: w.id,
      tenant_id: w.tenant_id,
      user_id: w.user_id,
      amount: w.amount,
      fee_amount: w.fee_amount || 0,
      net_amount: w.net_amount,
      pix_key: w.pix_key,
      pix_key_type: w.pix_key_type,
      bank_details: w.bank_details,
      description: w.description,
      status: w.status,
      requested_at: w.requested_at,
      processed_at: w.processed_at,
      completed_at: w.completed_at,
      processed_by: w.processed_by,
      admin_notes: w.admin_notes,
      rejection_reason: w.rejection_reason,
      efipay_transaction_id: w.efipay_transaction_id,
      created_at: w.created_at,
      updated_at: w.updated_at,
      // Dados do usuário - implementar join conforme necessário
      user_name: 'Usuário',
      user_email: undefined,
      user_document: undefined,
      // Dados do tenant - implementar join conforme necessário
      tenant_name: w.tenant_id,
      tenant_email: undefined
    })) || [];

    const pagination = {
      page,
      limit,
      total: count || 0,
      total_pages: Math.ceil((count || 0) / limit),
      has_next: (page * limit) < (count || 0),
      has_prev: page > 1
    };

    return NextResponse.json({
      withdrawals: formattedWithdrawals,
      statistics,
      pagination
    });

  } catch (error) {
    console.error('Erro na API admin de saques:', error);
    
    // Erro de validação do Zod
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { 
          error: 'Parâmetros inválidos',
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

// Endpoint para buscar detalhes de um saque específico
export async function POST(request: NextRequest) {
  try {
    const adminId = request.headers.get('x-admin-id');
    if (!adminId) {
      return NextResponse.json(
        { error: 'Acesso negado - Admin requerido' },
        { status: 403 }
      );
    }

    const { withdrawal_id } = await request.json();

    if (!withdrawal_id) {
      return NextResponse.json(
        { error: 'ID do saque é obrigatório' },
        { status: 400 }
      );
    }

    const supabase = createServiceClient();

    const { data: withdrawal, error } = await supabase
      .from('withdrawals')
      .select(`
        *,
        tenants:tenant_id(id, nome, email),
        users:user_id(id, nome, email),
        admin_users:approved_by(id, nome)
      `)
      .eq('id', withdrawal_id)
      .single();

    if (error) {
      console.error('Erro ao buscar saque:', error);
      return NextResponse.json(
        { error: 'Saque não encontrado' },
        { status: 404 }
      );
    }

    return NextResponse.json({ withdrawal });

  } catch (error) {
    console.error('Erro ao buscar detalhes do saque:', error);
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}