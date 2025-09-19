import { NextRequest, NextResponse } from 'next/server';
import { withTenantAuth } from '@/middleware/api/tenant-auth';
import { log } from '@/lib/logger';
import { createClient } from '@/lib/supabase/server';

/**
 * GET /api/wallet/transactions
 * Retorna o histórico de transações da carteira do tenant
 */
export const GET = withTenantAuth(async (req: NextRequest, tenantInfo) => {
    try {
      const { searchParams } = new URL(req.url);
      const limit = parseInt(searchParams.get('limit') || '50');
      const offset = parseInt(searchParams.get('offset') || '0');

      log.info('📋 [WALLET] Consultando transações da carteira...', {
        tenant: tenantInfo.tenantId,
        user: tenantInfo.userEmail,
        limit,
        offset
      });

      // Consultar transações reais da carteira usando função SQL
      const supabase = await createClient();
      
      const { data: transactionsData, error: transactionsError } = await supabase
        .rpc('get_wallet_transactions', {
          p_user_id: tenantInfo.userId,
          p_tenant_id: tenantInfo.tenantId,
          p_limit: limit,
          p_offset: offset
        });

      if (transactionsError) {
        log.error('❌ [WALLET] Erro ao consultar função get_wallet_transactions:', undefined, transactionsError);
        throw new Error('Erro ao consultar transações da carteira');
      }

      // Formatar transações para o frontend
      const transactions = (transactionsData || []).map((transaction: any) => ({
        id: transaction.id,
        type: transaction.type,
        amount: Number(transaction.amount) / 100, // Converter centavos para reais
        description: transaction.description,
        status: transaction.status,
        created_at: transaction.created_at,
        reference_id: transaction.reference_id
      }));

      log.info('✅ [WALLET] Transações consultadas com sucesso', {
        count: transactions.length
      });

      return NextResponse.json({
        success: true,
        data: {
          transactions,
          pagination: {
            limit,
            offset,
            total: transactions.length
          }
        }
      });

    } catch (error) {
      log.error('❌ [WALLET] Erro ao consultar transações da carteira:', undefined, error as Error);
      
      return NextResponse.json(
        {
          success: false,
          error: 'Erro interno do servidor'
        },
        { status: 500 }
      );
    }
});