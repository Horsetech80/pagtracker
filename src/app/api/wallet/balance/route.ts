import { NextRequest, NextResponse } from 'next/server';
import { createServiceClient } from '@/lib/supabase/server';
import { withTenantAuth } from '@/middleware/api/tenant-auth';

/**
 * GET /api/wallet/balance
 * Retorna o saldo da carteira virtual do usuário
 */
export const GET = withTenantAuth(async (request: NextRequest, tenantInfo) => {
  console.log('🏦 [WALLET] API de saldo chamada');
  
  try {
    const { tenantId, userId } = tenantInfo;
    
    console.log('🏦 [WALLET] Dados do usuário:', { tenantId, userId });
    
    // 🔧 CORREÇÃO: Usar service client para contornar RLS (padrão gateway de pagamento)
    const supabase = createServiceClient();
    console.log('✅ [WALLET] Cliente Supabase de serviço criado');
    
    // Consultar charges pagos para calcular saldo
    const { data: charges, error: chargesError } = await supabase
      .from('charges')
      .select('valor, status')
      .eq('tenant_id', tenantId)
      .eq('status', 'pago');
      
    if (chargesError) {
      console.error('❌ [WALLET] Erro ao consultar charges:', chargesError);
      throw new Error(`Erro ao consultar pagamentos: ${chargesError.message}`);
    }
    
    console.log('📊 [WALLET] Charges encontradas:', charges?.length || 0);
    
    // Calcular saldo total dos pagamentos
    const totalReceived = charges?.reduce((sum, charge) => {
      const valor = Number(charge.valor) || 0;
      return sum + valor;
    }, 0) || 0;
    
    console.log('💰 [WALLET] Total recebido calculado:', totalReceived);
    
    const walletBalance = {
      available: totalReceived, // Por enquanto, sem descontar saques
      processing: 0,
      total: totalReceived,
      last_updated: new Date().toISOString(),
      charges_count: charges?.length || 0
    };

    console.log('✅ [WALLET] Retornando saldo com teste de conexão:', walletBalance);

    return NextResponse.json({
      success: true,
      data: walletBalance
    });

  } catch (error) {
    console.error('❌ [WALLET] Erro:', error);
    
    return NextResponse.json(
      {
        success: false,
        error: 'Erro interno do servidor'
      },
      { status: 500 }
    );
  }
});