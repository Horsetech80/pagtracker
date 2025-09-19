/**
 * API Route: Admin Master Balance
 * 
 * Endpoint para consultar saldo da conta master EfiPay no painel administrativo
 * 
 * @route GET /api/admin/master-balance
 * @description Consulta o saldo da conta master EfiPay para administradores
 * @auth Requer autenticação de administrador
 * 
 * @author PagTracker Team
 * @version 1.0.0
 */

import { NextRequest, NextResponse } from 'next/server';
import { EfiPayBalanceService } from '@/services/efipay/EfiPayBalanceService';
import { withAdminAuth } from '@/middleware/api/admin-auth';
import { log } from '@/lib/logger';

// ================================================================
// GET - Consultar Saldo da Conta Master
// ================================================================

export const GET = withAdminAuth(async (request: NextRequest, adminInfo) => {
  try {
    console.log('🏦 [ADMIN-API] Consultando saldo da conta master...');
    
    const { adminId, role } = adminInfo;
    
    // Verificar permissões (apenas super_admin e admin podem consultar)
    if (!['super_admin', 'admin'].includes(role)) {
      log.warn('Tentativa de acesso negada ao saldo master', {
        adminId,
        role,
        endpoint: '/api/admin/master-balance'
      });
      
      return NextResponse.json(
        { 
          success: false, 
          error: 'Acesso negado',
          message: 'Apenas super administradores e administradores podem consultar o saldo da conta master'
        },
        { status: 403 }
      );
    }
    
    // Extrair parâmetro bloqueios da query string
    const { searchParams } = new URL(request.url);
    const bloqueios = searchParams.get('bloqueios') === 'true';
    
    console.log(`🏦 [ADMIN-API] Parâmetro bloqueios: ${bloqueios}`);
    
    // Instanciar serviço de saldo (usando tenant master/admin)
    const balanceService = new EfiPayBalanceService('admin', adminId);
    
    // Usar a interface PagTracker que já faz a conversão correta de reais para centavos
    const pagTrackerResult = await balanceService.obterSaldoPagTracker({
      tenantId: 'admin',
      incluirBloqueado: bloqueios
    });
    
    console.log('✅ [ADMIN-API] Saldo consultado com sucesso');
    console.log('📊 [ADMIN-API] Resultado PagTracker:', JSON.stringify(pagTrackerResult, null, 2));
    
    if (!pagTrackerResult.success) {
      throw new Error(pagTrackerResult.error || 'Erro ao consultar saldo');
    }
    
    // Converter centavos para reais para exibição
    const saldoDisponivel = (pagTrackerResult.data!.saldo.disponivel / 100).toFixed(2);
    const saldoBloqueado = (pagTrackerResult.data!.saldo.bloqueado / 100).toFixed(2);
    
    console.log('🔍 [DEBUG] Saldo disponível (centavos):', pagTrackerResult.data!.saldo.disponivel);
    console.log('🔍 [DEBUG] Saldo disponível (reais):', saldoDisponivel);
    
    log.info('Saldo da conta master consultado com sucesso', {
      adminId,
      role,
      saldoDisponivel: saldoDisponivel,
      consultadoEm: pagTrackerResult.data!.consultadoEm,
      incluirBloqueios: bloqueios
    });
    
    return NextResponse.json({
      success: true,
      data: {
        saldo: saldoDisponivel,
        bloqueios: {
          judicial: '0.00', // TODO: Implementar bloqueios específicos
          med: '0.00',
          total: saldoBloqueado
        },
        consultadoEm: pagTrackerResult.data!.consultadoEm,
        gateway: 'efipay',
        admin: {
          consultadoPor: adminId,
          role: role
        }
      }
    });
    
  } catch (error: any) {
    console.error('❌ [ADMIN-API] Erro ao consultar saldo da conta master:', error);
    
    log.error('Erro ao consultar saldo da conta master', {
      error: error.message,
      adminId: adminInfo?.adminId,
      role: adminInfo?.role
    });
    
    return NextResponse.json(
      { 
        success: false, 
        error: 'Erro interno do servidor',
        message: 'Não foi possível consultar o saldo da conta master',
        details: error.message
      },
      { status: 500 }
    );
  }
});

// ================================================================
// HEALTH CHECK - Verificar Status da Conta Master
// ================================================================

export const HEAD = withAdminAuth(async (request: NextRequest, adminInfo) => {
  try {
    console.log('🏥 [ADMIN-API] Health check da conta master...');
    
    const { adminId } = adminInfo;
    
    // Instanciar serviço de saldo
    const balanceService = new EfiPayBalanceService('admin', adminId);
    
    // Fazer health check
    const healthResult = await balanceService.healthCheck();
    
    console.log('✅ [ADMIN-API] Health check da conta master concluído');
    
    return new NextResponse(null, {
      status: healthResult.status === 'healthy' ? 200 : 503,
      headers: {
        'X-Master-Account-Status': healthResult.status,
        'X-Last-Check': healthResult.timestamp,
        'X-Gateway': 'efipay'
      }
    });
    
  } catch (error: any) {
    console.error('❌ [ADMIN-API] Erro no health check da conta master:', error);
    
    return new NextResponse(null, {
      status: 503,
      headers: {
        'X-Master-Account-Status': 'error',
        'X-Error': error.message
      }
    });
  }
});

// ================================================================
// MÉTODOS NÃO PERMITIDOS
// ================================================================

export async function POST() {
  return NextResponse.json(
    { error: 'Método não permitido' },
    { status: 405 }
  );
}

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