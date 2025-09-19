/**
 * API REST para pagar QR Code PIX
 * 
 * Endpoints:
 * - PUT /api/efipay/qrcode/pagar/[idEnvio] - Pagar um QR Code PIX via API
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

const pagarQRCodeSchema = z.object({
  payerPixKey: z.string().min(1, 'Chave PIX do pagador é obrigatória'),
  pixCopiaECola: z.string().min(1, 'Código PIX Copia e Cola é obrigatório'),
  payerInfo: z.string().optional(),
  description: z.string().optional(),
  reference: z.string().optional(),
  tags: z.array(z.string()).optional()
});

const idEnvioSchema = z.object({
  idEnvio: z.string().min(1, 'ID de envio é obrigatório')
});

// ================================================================
// HANDLERS
// ================================================================

/**
 * PUT /api/efipay/qrcode/pagar/[idEnvio]
 * Pagar um QR Code PIX via API
 */
export const PUT = withTenantAuth(async (
  request: NextRequest, 
  tenantInfo: any,
  { params }: { params: { idEnvio: string } }
) => {
  try {
    console.log('🔄 [API_QRCODE_PAGAR] Processando pagamento de QR Code PIX', {
      tenantId: tenantInfo.tenantId,
      idEnvio: params.idEnvio
    });
    
    const body = await request.json();
    
    // Validar parâmetro ID
    const validatedParams = idEnvioSchema.parse({ idEnvio: params.idEnvio });
    
    // Validar dados do body
    const validatedData = pagarQRCodeSchema.parse(body);
    
    console.log('💳 [API_QRCODE_PAGAR] Dados validados', {
      tenantId: tenantInfo.tenantId,
      idEnvio: validatedParams.idEnvio,
      payerPixKey: validatedData.payerPixKey,
      pixCopiaEColaLength: validatedData.pixCopiaECola.length,
      hasPayerInfo: !!validatedData.payerInfo
    });

    // Inicializar serviços
    const authService = new EfiPayAuthService(tenantInfo.tenantId, tenantInfo.userId);
    const webhookService = new EfiPayWebhookService(tenantInfo.tenantId, tenantInfo.userId);
    const qrCodeService = new EfiPayQRCodeService(authService, webhookService);

    // Preparar request para PagTracker
    const pagTrackerRequest = {
      idEnvio: validatedParams.idEnvio,
      ...validatedData,
      tenantId: tenantInfo.tenantId
    };

    const result = await qrCodeService.pagarQRCodePagTracker(pagTrackerRequest);

    console.log('✅ [API_QRCODE_PAGAR] QR Code pago com sucesso', {
      tenantId: tenantInfo.tenantId,
      idEnvio: result.data?.idEnvio,
      e2eId: result.data?.e2eId,
      amount: result.data?.amount,
      status: result.data?.status
    });

    return NextResponse.json(result, { status: 201 });
  } catch (error: any) {
    console.error('❌ [API_QRCODE_PAGAR] Erro ao pagar QR Code:', {
      tenantId: tenantInfo?.tenantId,
      idEnvio: params?.idEnvio,
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

    if (error.message.includes('webhook') || error.message.includes('callback')) {
      return NextResponse.json({
        success: false,
        error: 'Webhook não configurado',
        details: 'É necessário ter um webhook associado à chave PIX do pagador'
      }, { status: 400 });
    }

    if (error.message.includes('escopo') || error.message.includes('scope')) {
      return NextResponse.json({
        success: false,
        error: 'Escopo não autorizado',
        details: 'O escopo gn.qrcodes.pay não está habilitado para esta conta'
      }, { status: 403 });
    }

    if (error.message.includes('duplicado') || error.message.includes('duplicate')) {
      return NextResponse.json({
        success: false,
        error: 'ID de envio duplicado',
        details: `O idEnvio ${params?.idEnvio} já foi utilizado`
      }, { status: 409 });
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