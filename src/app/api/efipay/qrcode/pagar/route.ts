/**
 * API REST para pagar QR Code PIX
 * 
 * Endpoints:
 * - PUT /api/efipay/qrcode/pagar - Pagar um QR Code PIX
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
import { rateLimit } from '@/lib/rate-limit';

// ================================================================
// SCHEMAS DE VALIDAÇÃO
// ================================================================

const pagarQRCodeSchema = z.object({
  pixCopiaECola: z.string().min(1, 'Código PIX Copia e Cola é obrigatório'),
  valor: z.number().positive('Valor deve ser positivo').optional(), // Opcional para QR Code com valor fixo
  pagador: z.object({
    chave: z.string().min(1, 'Chave PIX do pagador é obrigatória'),
    nome: z.string().optional(),
    cpfCnpj: z.string().optional()
  }),
  infoPagador: z.string().max(140, 'Informação do pagador deve ter no máximo 140 caracteres').optional(),
  reference: z.string().optional(),
  tags: z.array(z.string()).optional()
});

// Rate limiting: 20 pagamentos por minuto por tenant
const limiter = rateLimit({
  maxRequests: 20,
  windowMs: 60 * 1000 // 1 minuto
});

// ================================================================
// HANDLERS
// ================================================================

/**
 * PUT /api/efipay/qrcode/pagar
 * Pagar um QR Code PIX
 */
export const PUT = withTenantAuth(async (request: NextRequest, tenantInfo: any) => {
  try {
    const tenantId = tenantInfo.tenantId;

    console.log('🔄 [API_QRCODE_PAGAR] Iniciando pagamento de QR Code PIX', { tenantId });
    
    // Rate limiting por tenant
    const rateLimitResult = limiter(request);
    if (!rateLimitResult.success) {
      return NextResponse.json(
        {
          success: false,
          error: 'Rate limit excedido',
          message: 'Muitas tentativas de pagamento. Tente novamente em alguns minutos.',
          retryAfter: Math.ceil((rateLimitResult.reset - Date.now()) / 1000)
        },
        { 
          status: 429,
          headers: {
            'X-RateLimit-Limit': rateLimitResult.limit.toString(),
            'X-RateLimit-Remaining': rateLimitResult.remaining.toString(),
            'X-RateLimit-Reset': rateLimitResult.reset.toString(),
            'Retry-After': Math.ceil((rateLimitResult.reset - Date.now()) / 1000).toString()
          }
        }
      );
    }

    const body = await request.json();
    
    // Validar dados
    const validatedData = pagarQRCodeSchema.parse(body);
    
    console.log('🔍 [API_QRCODE_PAGAR] Dados validados', {
      tenantId,
      pixCopiaEColaLength: validatedData.pixCopiaECola.length,
      hasValor: !!validatedData.valor,
      pagadorChave: validatedData.pagador.chave,
      hasReference: !!validatedData.reference,
      tagsCount: validatedData.tags?.length || 0
    });

    // Verificar se webhook está configurado (obrigatório para pagamentos)
    const authService = new EfiPayAuthService(tenantId, tenantInfo.userId);
    const webhookService = new EfiPayWebhookService(tenantId, tenantInfo.userId);
    
    // Verificar se webhook está configurado
    let webhookConfigured = false;
    try {
      const webhookDetails = await webhookService.consultarWebhookPix(validatedData.pagador.chave);
      webhookConfigured = !!webhookDetails.webhookUrl;
    } catch (error) {
      // Se não conseguir consultar, assumir que não está configurado
      webhookConfigured = false;
    }
    
    if (!webhookConfigured) {
      return NextResponse.json(
        { 
          success: false,
          error: 'Webhook não configurado',
          message: 'É necessário configurar um webhook antes de realizar pagamentos PIX. Configure em Configurações > Webhooks.'
        },
        { status: 400 }
      );
    }

    // Verificar limite diário (implementação simplificada)
    // TODO: Implementar verificação real de limite diário via EfiPaySettingsService
    const qrCodeService = new EfiPayQRCodeService(authService, webhookService);
    const limiteDiarioOk = validatedData.valor && validatedData.valor <= 5000; // Limite padrão de R$ 5.000
    
    if (!limiteDiarioOk && validatedData.valor) {
      return NextResponse.json(
        { 
          success: false,
          error: 'Limite diário excedido',
          message: `Valor excede o limite diário de R$ 5.000`,
          limite: 5000,
          valorUsado: validatedData.valor
        },
        { status: 400 }
      );
    }

    // Primeiro, detalhar o QR Code para obter informações
    const detalhesQRCode = await qrCodeService.detalharQRCode({
      pixCopiaECola: validatedData.pixCopiaECola
    });
    
    if (!detalhesQRCode) {
      return NextResponse.json(
        {
          success: false,
          error: 'QR Code inválido',
          message: 'Não foi possível obter informações do QR Code fornecido'
        },
        { status: 400 }
      );
    }

    // Verificar se o valor é necessário e válido
    if (!detalhesQRCode.valor && !validatedData.valor) {
      return NextResponse.json(
        {
          success: false,
          error: 'Valor obrigatório',
          message: 'Este QR Code não possui valor fixo. É necessário informar o valor a ser pago.'
        },
        { status: 400 }
      );
    }

    // Se QR Code tem valor fixo, usar esse valor
    const valorPagamento = detalhesQRCode.valor || validatedData.valor;

    // Verificar se o valor não excede o limite do QR Code (se houver)
    if (detalhesQRCode.valor && validatedData.valor && validatedData.valor !== parseFloat(detalhesQRCode.valor.final)) {
      return NextResponse.json(
        {
          success: false,
          error: 'Valor incorreto',
          message: `Este QR Code possui valor fixo de R$ ${detalhesQRCode.valor}. Não é possível alterar o valor.`
        },
        { status: 400 }
      );
    }

    // Realizar o pagamento
    const resultadoPagamento = await qrCodeService.pagarQRCode(
      validatedData.reference || `pag_${Date.now()}`,
      {
        pixCopiaECola: validatedData.pixCopiaECola,
        pagador: validatedData.pagador
      }
    );

    console.log('✅ [API_QRCODE_PAGAR] Pagamento realizado com sucesso', {
      tenantId,
      idEnvio: resultadoPagamento.idEnvio,
      e2eId: resultadoPagamento.e2eId,
      valor: resultadoPagamento.valor,
      status: resultadoPagamento.status
    });

    return NextResponse.json({
      success: true,
      data: {
        idEnvio: resultadoPagamento.idEnvio,
        e2eId: resultadoPagamento.e2eId,
        valor: parseFloat(resultadoPagamento.valor),
        status: resultadoPagamento.status,
        horario: resultadoPagamento.horario,
        pagador: validatedData.pagador
      },
      message: 'Pagamento realizado com sucesso'
    });

  } catch (error) {
    console.error('❌ [API_QRCODE_PAGAR] Erro ao pagar QR Code:', error);

    // Tratamento de erros de validação
    if (error instanceof z.ZodError) {
      return NextResponse.json(
          {
            success: false,
            error: 'Dados inválidos',
            details: error.issues.map(err => ({
              field: err.path.join('.'),
              message: err.message
            }))
          },
          { status: 400 }
        );
    }

    // Tratamento de erros específicos da EfiPay
    if (error instanceof Error) {
      if (error.message.includes('saldo insuficiente')) {
        return NextResponse.json(
          {
            success: false,
            error: 'Saldo insuficiente',
            message: 'Saldo insuficiente para realizar o pagamento'
          },
          { status: 400 }
        );
      }

      if (error.message.includes('QR Code expirado')) {
        return NextResponse.json(
          {
            success: false,
            error: 'QR Code expirado',
            message: 'O QR Code fornecido está expirado'
          },
          { status: 400 }
        );
      }

      if (error.message.includes('chave não encontrada')) {
        return NextResponse.json(
          {
            success: false,
            error: 'Chave PIX inválida',
            message: 'A chave PIX do pagador não foi encontrada ou é inválida'
          },
          { status: 400 }
        );
      }

      if (error.message.includes('limite excedido')) {
        return NextResponse.json(
          {
            success: false,
            error: 'Limite excedido',
            message: 'Limite de transação excedido'
          },
          { status: 400 }
        );
      }

      if (error.message.includes('token inválido')) {
        return NextResponse.json(
          {
            success: false,
            error: 'Token inválido',
            message: 'Token de autenticação da EfiPay inválido ou expirado'
          },
          { status: 401 }
        );
      }
    }

    // Erro genérico
    return NextResponse.json(
      {
        success: false,
        error: 'Erro interno do servidor',
        message: 'Ocorreu um erro inesperado ao processar o pagamento'
      },
      { status: 500 }
    );
  }
});

/**
 * POST /api/efipay/qrcode/pagar
 * Alias para PUT (compatibilidade)
 */
export const POST = PUT;