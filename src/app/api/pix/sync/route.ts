/**
 * PIX Sync API - PagTracker v4.0
 * 
 * Endpoint simples para sincronização de status PIX
 */

import { NextRequest, NextResponse } from 'next/server';
import { syncPixCharges, syncChargeByTxid } from '@/services/payment/PixStatusSync';

/**
 * POST /api/pix/sync
 * Sincroniza status de cobranças PIX
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json().catch(() => ({}));
    const { txid, tenant_id } = body;

    // Se foi fornecido um TXID específico, sincronizar apenas ele
    if (txid) {
      console.log(`Sincronizando cobrança específica: ${txid}`);
      
      const updated = await syncChargeByTxid(txid);
      
      return NextResponse.json({
        success: true,
        message: updated ? 'Cobrança sincronizada com sucesso' : 'Cobrança já estava atualizada',
        txid,
        updated
      });
    }

    // Sincronização geral
    console.log('Iniciando sincronização geral de cobranças PIX');
    
    const result = await syncPixCharges(tenant_id);
    
    return NextResponse.json({
      success: result.success,
      message: `Sincronização concluída. ${result.updated} cobranças atualizadas.`,
      updated: result.updated,
      errors: result.errors
    });

  } catch (error) {
    console.error('Erro na sincronização PIX:', error);
    
    return NextResponse.json(
      {
        success: false,
        message: 'Erro na sincronização PIX',
        error: (error as Error).message
      },
      { status: 500 }
    );
  }
}

/**
 * GET /api/pix/sync
 * Sincronização automática (para uso interno)
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const tenantId = searchParams.get('tenant_id');
    
    console.log('Sincronização automática iniciada', { tenantId });
    
    const result = await syncPixCharges(tenantId || undefined);
    
    return NextResponse.json({
      success: result.success,
      updated: result.updated,
      errors: result.errors,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Erro na sincronização automática:', error);
    
    return NextResponse.json(
      {
        success: false,
        error: (error as Error).message,
        timestamp: new Date().toISOString()
      },
      { status: 500 }
    );
  }
}