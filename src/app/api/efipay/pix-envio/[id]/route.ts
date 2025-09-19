/**
 * API REST para consulta de PIX Envio específico por ID
 * 
 * Endpoints:
 * - GET /api/efipay/pix-envio/[id] - Consultar PIX enviado por idEnvio
 * 
 * @author PagTracker Team
 * @version 1.0.0
 */

import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { EfiPayPixEnvioService } from '@/services/efipay/EfiPayPixEnvioService';
import { EfiPayAuthService } from '@/services/efipay/EfiPayAuthService';
import { EfiPayWebhookService } from '@/services/efipay/EfiPayWebhookService';
import { withTenantAuth } from '@/middleware/api/tenant-auth';

// ================================================================
// SCHEMAS DE VALIDAÇÃO
// ================================================================

const idEnvioSchema = z.object({
  id: z.string().min(1, 'ID de envio é obrigatório')
});

// ================================================================
// HANDLERS
// ================================================================

/**
 * GET /api/efipay/pix-envio/[id]
 * Consultar PIX enviado por idEnvio
 */
export const GET = withTenantAuth(async (
  request: NextRequest, 
  tenantInfo: any,
  { params }: { params: { id: string } }
) => {
  try {
    console.log('🔄 [API_PIX_ENVIO_ID] Consultando PIX enviado por ID', {
      tenantId: tenantInfo.tenantId,
      idEnvio: params.id
    });
    
    // Validar parâmetro ID
    const validatedParams = idEnvioSchema.parse({ id: params.id });
    
    // Inicializar serviços
    const authService = new EfiPayAuthService(tenantInfo.tenantId, tenantInfo.userId);
    const webhookService = new EfiPayWebhookService(tenantInfo.tenantId, tenantInfo.userId);
    const pixEnvioService = new EfiPayPixEnvioService(authService);

    // Preparar request para PagTracker
    const pagTrackerRequest = {
      idEnvio: validatedParams.id,
      tenantId: tenantInfo.tenantId
    };

    const result = await pixEnvioService.consultarPixPorIdPagTracker(pagTrackerRequest);

    console.log('✅ [API_PIX_ENVIO_ID] PIX enviado consultado com sucesso', {
      tenantId: tenantInfo.tenantId,
      idEnvio: result.originalSendId,
      e2eId: result.endToEndId,
      status: result.status
    });

    return NextResponse.json(result, { status: 200 });
  } catch (error: any) {
    console.error('❌ [API_PIX_ENVIO_ID] Erro ao consultar PIX enviado:', {
      tenantId: tenantInfo?.tenantId,
      idEnvio: params?.id,
      error: error.message,
      stack: error.stack
    });

    // Tratar erros de validação
    if (error instanceof z.ZodError) {
      return NextResponse.json({
        success: false,
        error: 'ID inválido',
        details: error.issues.map(e => `${e.path.join('.')}: ${e.message}`)
      }, { status: 400 });
    }

    // Tratar erro 404 específico
    if (error.message.includes('não encontrado') || error.message.includes('not found')) {
      return NextResponse.json({
        success: false,
        error: 'PIX enviado não encontrado',
        details: `Nenhum PIX encontrado com o ID: ${params?.id}`
      }, { status: 404 });
    }

    // Tratar outros erros
    const statusCode = error.message.includes('inválido') ? 400 :
                      error.message.includes('negado') ? 403 :
                      error.message.includes('limite') ? 429 : 500;

    return NextResponse.json({
      success: false,
      error: error.message || 'Erro interno do servidor'
    }, { status: statusCode });
  }
});