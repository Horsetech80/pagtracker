/**
 * EfiPay Charge Query API Route
 * 
 * Endpoints implementados:
 * - GET /api/efipay/charges/[txid] - Consultar cobrança PIX por txid
 * 
 * @author PagTracker Team
 * @version 1.0.0
 */

import { NextRequest, NextResponse } from 'next/server';
import { EfiPayAuthService } from '@/services/efipay/EfiPayAuthService';
import { EfiPayPixService } from '@/services/efipay/EfiPayPixService';
import { createServiceClient } from '@/lib/supabase/server';

/**
 * GET /api/efipay/charges/[txid]
 * Consulta uma cobrança PIX específica na EfiPay usando o txid
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { txid: string } }
): Promise<NextResponse> {
  try {
    console.log('🔍 [EFIPAY_CHARGE_QUERY] Iniciando consulta de cobrança...', {
      txid: params.txid
    });

    // Extrair headers de autenticação
    const userId = request.headers.get('x-user-id');
    const tenantId = request.headers.get('x-tenant-id');

    if (!userId || !tenantId) {
      console.error('❌ [EFIPAY_CHARGE_QUERY] Headers de autenticação ausentes');
      return NextResponse.json(
        { error: 'Headers de autenticação obrigatórios' },
        { status: 401 }
      );
    }

    // Validar txid
    if (!params.txid || typeof params.txid !== 'string') {
      console.error('❌ [EFIPAY_CHARGE_QUERY] txid inválido:', params.txid);
      return NextResponse.json(
        { error: 'txid é obrigatório e deve ser uma string' },
        { status: 400 }
      );
    }

    // Verificar se o usuário tem acesso ao tenant
    const supabase = createServiceClient();
    const { data: userTenant, error: tenantError } = await supabase
      .from('user_tenants')
      .select('*')
      .eq('user_id', userId)
      .eq('tenant_id', tenantId)
      .single();

    if (tenantError || !userTenant) {
      console.error('❌ [EFIPAY_CHARGE_QUERY] Usuário não tem acesso ao tenant:', {
        userId,
        tenantId,
        error: tenantError
      });
      return NextResponse.json(
        { error: 'Acesso negado ao tenant' },
        { status: 403 }
      );
    }

    // Criar serviços EfiPay
    console.log('🔄 [EFIPAY_CHARGE_QUERY] Criando serviços EfiPay...');
    const authService = new EfiPayAuthService(tenantId, userId);
    const pixService = new EfiPayPixService(authService);

    // Consultar cobrança na EfiPay
    console.log('🔄 [EFIPAY_CHARGE_QUERY] Consultando cobrança na EfiPay...', {
      txid: params.txid
    });

    const chargeData = await pixService.getPixCharge(params.txid);

    console.log('✅ [EFIPAY_CHARGE_QUERY] Cobrança consultada com sucesso:', {
      txid: params.txid,
      status: chargeData.status
    });

    return NextResponse.json(chargeData, { status: 200 });

  } catch (error: any) {
    console.error('❌ [EFIPAY_CHARGE_QUERY] Erro ao consultar cobrança:', {
      txid: params.txid,
      error: error.message,
      stack: error.stack
    });

    // Mapear erros específicos da EfiPay
    if (error.name === 'EfiPayError') {
      if (error.code === 404) {
        return NextResponse.json(
          { error: 'Cobrança não encontrada na EfiPay' },
          { status: 404 }
        );
      }
      
      return NextResponse.json(
        { error: `Erro da EfiPay: ${error.message}` },
        { status: error.statusCode || 500 }
      );
    }

    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}

/**
 * OPTIONS /api/efipay/charges/[txid]
 * Suporte para CORS
 */
export async function OPTIONS(): Promise<NextResponse> {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization, x-user-id, x-tenant-id',
    },
  });
}