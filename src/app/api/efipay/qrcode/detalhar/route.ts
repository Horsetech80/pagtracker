/**
 * API REST para detalhar QR Code PIX
 * 
 * Endpoints:
 * - POST /api/efipay/qrcode/detalhar - Detalhar informações de um QR Code PIX
 * 
 * @author PagTracker Team
 * @version 1.0.0
 */

import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { EfiPayQRCodeService } from '@/services/efipay/EfiPayQRCodeService';
import { EfiPayAuthService } from '@/services/efipay/EfiPayAuthService';
import { EfiPayWebhookService } from '@/services/efipay/EfiPayWebhookService';
import { withTenantAuth } from '@/middleware/api/tenant-auth';

// ================================================================
// SCHEMAS DE VALIDAÇÃO
// ================================================================

const detalharQRCodeSchema = z.object({
  pixCopiaECola: z.string().min(1, 'Código PIX Copia e Cola é obrigatório'),
  reference: z.string().optional(),
  tags: z.array(z.string()).optional()
});

// ================================================================
// HANDLERS
// ================================================================

/**
 * POST /api/efipay/qrcode/detalhar
 * Detalhar informações associadas a um QR Code PIX
 */
export const POST = withTenantAuth(async (request: NextRequest, tenantInfo: any) => {
  try {
    console.log('🔄 [API_QRCODE_DETALHAR] Detalhando QR Code PIX', { tenantId: tenantInfo.tenantId });
    
    const body = await request.json();
    
    // Validar dados
    const validatedData = detalharQRCodeSchema.parse(body);
    
    console.log('🔍 [API_QRCODE_DETALHAR] Dados validados', {
      tenantId: tenantInfo.tenantId,
      pixCopiaEColaLength: validatedData.pixCopiaECola.length,
      hasReference: !!validatedData.reference,
      tagsCount: validatedData.tags?.length || 0
    });

    // Inicializar serviços
    const authService = new EfiPayAuthService(tenantInfo.tenantId, tenantInfo.userId);
    const webhookService = new EfiPayWebhookService(tenantInfo.tenantId, tenantInfo.userId);
    const qrCodeService = new EfiPayQRCodeService(authService, webhookService);

    // Preparar request para PagTracker
    const pagTrackerRequest = {
      qrCodeString: validatedData.pixCopiaECola,
      reference: validatedData.reference,
      tags: validatedData.tags,
      tenantId: tenantInfo.tenantId
    };

    const result = await qrCodeService.detalharQRCodePagTracker(pagTrackerRequest);

    console.log('✅ [API_QRCODE_DETALHAR] QR Code detalhado com sucesso', {
      tenantId: tenantInfo.tenantId,
      chargeType: result.data?.chargeType,
      txid: result.data?.txid,
      status: result.data?.status,
      amount: result.data?.amount
    });

    return NextResponse.json(result, { status: 200 });
  } catch (error: any) {
    console.error('❌ [API_QRCODE_DETALHAR] Erro ao detalhar QR Code:', {
      tenantId: tenantInfo?.tenantId,
      error: error.message,
      stack: error.stack
    });

    // Tratar erros de validação
    if (error instanceof z.ZodError) {
      return NextResponse.json({
        success: false,
        error: 'Dados inválidos',
        details: error.issues.map(e => `${e.path.join('.')}: ${e.message}`)
      }, { status: 400 });
    }

    // Tratar erros específicos da EfiPay
    if (error.message.includes('QR Code inválido') || error.message.includes('malformed')) {
      return NextResponse.json({
        success: false,
        error: 'QR Code PIX inválido',
        details: 'O código PIX Copia e Cola fornecido não é válido'
      }, { status: 400 });
    }

    if (error.message.includes('escopo') || error.message.includes('scope')) {
      return NextResponse.json({
        success: false,
        error: 'Funcionalidade temporariamente indisponível',
        details: 'O escopo gn.qrcodes.read está em manutenção'
      }, { status: 403 });
    }

    // Tratar outros erros
    const statusCode = error.message.includes('não encontrado') ? 404 :
                      error.message.includes('inválido') ? 400 :
                      error.message.includes('negado') ? 403 :
                      error.message.includes('limite') ? 429 : 500;

    return NextResponse.json({
      success: false,
      error: error.message || 'Erro interno do servidor'
    }, { status: statusCode });
  }
});