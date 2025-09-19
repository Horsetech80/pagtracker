/**
 * API Route: Gateway Balance
 * 
 * Endpoint para consultar saldo do gateway EfiPay
 * 
 * @route GET /api/gateway/balance
 * @description Consulta o saldo disponível no gateway EfiPay
 * @auth Requer autenticação de tenant
 * 
 * @author PagTracker Team
 * @version 1.0.0
 */

import { NextRequest, NextResponse } from 'next/server';
import { EfiPayBalanceService } from '@/services/efipay/EfiPayBalanceService';
import { withTenantAuth } from '@/middleware/api/tenant-auth';

// ================================================================
// GET - Consultar Saldo do Gateway
// ================================================================

export const GET = withTenantAuth(async (request: NextRequest, tenantInfo) => {
  try {
    console.log('🏦 [API] Consultando saldo do gateway...');
    
    const { tenantId, userId } = tenantInfo;
    
    // Extrair parâmetro bloqueios da query string
    const { searchParams } = new URL(request.url);
    const bloqueios = searchParams.get('bloqueios') === 'true';
    
    console.log(`🏦 [API] Parâmetro bloqueios: ${bloqueios}`);
    
    // Instanciar serviço de saldo
    const balanceService = new EfiPayBalanceService(tenantId, userId);
    
    // Consultar saldo
    const balanceResult = await balanceService.obterSaldoPagTracker({
      tenantId: tenantId,
      incluirBloqueado: bloqueios
    });
    
    if (!balanceResult.success) {
      console.error('❌ [API] Erro ao consultar saldo:', balanceResult.error);
      
      return NextResponse.json(
        { 
          success: false, 
          error: balanceResult.error || 'Erro ao consultar saldo do gateway',
          code: 'GATEWAY_ERROR',
          details: balanceResult.details
        },
        { status: 500 }
      );
    }
    
    console.log('✅ [API] Saldo consultado com sucesso');
    
    // Retornar saldo
    return NextResponse.json({
      success: true,
      data: {
        gateway: {
          provider: 'efipay',
          saldo: balanceResult.data!.saldo,
          consultadoEm: balanceResult.data!.consultadoEm,
          status: 'active'
        },
        tenant: {
          id: tenantId
        }
      },
      timestamp: new Date().toISOString()
    });
    
  } catch (error: any) {
    console.error('❌ [API] Erro interno ao consultar saldo:', error);
    
    return NextResponse.json(
      { 
        success: false, 
        error: 'Erro interno do servidor',
        code: 'INTERNAL_ERROR',
        message: process.env.NODE_ENV === 'development' ? error.message : undefined
      },
      { status: 500 }
    );
  }
});

// ================================================================
// POST - Health Check do Gateway
// ================================================================

export const POST = withTenantAuth(async (request: NextRequest, tenantInfo) => {
  try {
    console.log('🔍 [API] Health check do gateway...');
    
    const { tenantId, userId } = tenantInfo;
    
    // Instanciar serviço de saldo
    const balanceService = new EfiPayBalanceService(tenantId, userId);
    
    // Fazer health check
    const healthResult = await balanceService.healthCheck();
    
    console.log('✅ [API] Health check concluído');
    
    return NextResponse.json({
      success: true,
      data: {
        gateway: {
          provider: 'efipay',
          status: healthResult.status,
          saldoDisponivel: healthResult.saldoDisponivel,
          timestamp: healthResult.timestamp
        },
        tenant: {
          id: tenantId
        }
      }
    });
    
  } catch (error: any) {
    console.error('❌ [API] Erro no health check:', error);
    
    return NextResponse.json(
      { 
        success: false, 
        error: 'Gateway indisponível',
        code: 'GATEWAY_UNHEALTHY',
        message: error.message
      },
      { status: 503 }
    );
  }
});

// ================================================================
// MÉTODOS NÃO PERMITIDOS
// ================================================================

export async function PUT() {
  return NextResponse.json(
    { error: 'Método não permitido' },
    { status: 405 }
  );
}

export async function DELETE() {
  return NextResponse.json(
    { error: 'Método não permitido' },
    { status: 405 }
  );
}

export async function PATCH() {
  return NextResponse.json(
    { error: 'Método não permitido' },
    { status: 405 }
  );
}