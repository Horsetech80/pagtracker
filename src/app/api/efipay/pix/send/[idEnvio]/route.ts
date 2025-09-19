import { NextRequest, NextResponse } from 'next/server';
import { EfiPayPixEnvioService } from '@/services/efipay/EfiPayPixEnvioService';
import { EfiPayAuthService } from '@/services/efipay/EfiPayAuthService';
import { EfiPayWebhookService } from '@/services/efipay/EfiPayWebhookService';
import { withTenantAuth } from '@/middleware/api/tenant-auth';
import { z } from 'zod';
import { PixEnvioRequest } from '@/types/efipay';

// Schema de validação para o valor
const valorSchema = z.string()
  .regex(/^\d{1,10}\.\d{2}$/, 'Valor deve estar no formato decimal com 2 casas decimais (ex: 12.34)');

// Schema para pagador
const pagadorSchema = z.object({
  chave: z.string()
    .max(77, 'Chave PIX deve ter no máximo 77 caracteres')
    .min(1, 'Chave PIX é obrigatória'),
  infoPagador: z.string()
    .max(140, 'Informação do pagador deve ter no máximo 140 caracteres')
    .optional()
});

// Schema para favorecido com chave PIX
const favorecidoChaveSchema = z.object({
  chave: z.string()
    .max(77, 'Chave PIX deve ter no máximo 77 caracteres')
    .min(1, 'Chave PIX é obrigatória'),
  cpf: z.string()
    .regex(/^[0-9]{11}$/, 'CPF deve conter exatamente 11 dígitos')
    .optional(),
  cnpj: z.string()
    .regex(/^[0-9]{14}$/, 'CNPJ deve conter exatamente 14 dígitos')
    .optional()
});

// Schema para dados bancários do favorecido
const contaBancoSchema = z.object({
  nome: z.string()
    .max(200, 'Nome deve ter no máximo 200 caracteres')
    .min(1, 'Nome é obrigatório'),
  cpf: z.string()
    .regex(/^[0-9]{11}$/, 'CPF deve conter exatamente 11 dígitos')
    .optional(),
  cnpj: z.string()
    .regex(/^[0-9]{14}$/, 'CNPJ deve conter exatamente 14 dígitos')
    .optional(),
  codigoBanco: z.string()
    .regex(/^[0-9]{8}$/, 'Código do banco (ISPB) deve conter exatamente 8 dígitos'),
  agencia: z.string()
    .regex(/^[0-9]{1,4}$/, 'Agência deve conter de 1 a 4 dígitos'),
  conta: z.string()
    .regex(/^[0-9]+$/, 'Conta deve conter apenas números'),
  tipoConta: z.enum(['cacc', 'svgs'], {
    message: 'Tipo de conta deve ser cacc (conta corrente) ou svgs (poupança)'
  })
});

// Schema para favorecido (união de chave PIX ou dados bancários)
const favorecidoSchema = z.union([
  favorecidoChaveSchema,
  z.object({ contaBanco: contaBancoSchema })
]);

// Schema para status (opcional)
const statusSchema = z.enum(['EM_PROCESSAMENTO', 'REALIZADO', 'NAO_REALIZADO'], {
  message: 'Status deve ser EM_PROCESSAMENTO, REALIZADO ou NAO_REALIZADO'
}).optional();

// Schema principal para envio de PIX
const enviarPixSchema = z.object({
  valor: valorSchema,
  pagador: pagadorSchema,
  favorecido: favorecidoSchema,
  status: statusSchema
});

// Schema para validação do idEnvio
const idEnvioSchema = z.string()
  .regex(/^[a-zA-Z0-9]{1,35}$/, 'idEnvio deve conter apenas letras e números, com 1 a 35 caracteres');

/**
 * PUT /api/efipay/pix/send/:idEnvio
 * Enviar PIX conforme especificações da EfiPay
 * Endpoint oficial: PUT /v3/gn/pix/:idEnvio
 */
export const PUT = withTenantAuth(async (
  request: NextRequest,
  tenantInfo: any,
  { params }: { params: { idEnvio: string } }
) => {
  try {
    console.log('🚀 [API_PIX_SEND] Iniciando envio PIX', {
      tenantId: tenantInfo.tenantId,
      idEnvio: params.idEnvio
    });
    
    // Validar idEnvio
    const validatedIdEnvio = idEnvioSchema.parse(params.idEnvio);
    
    // Extrair dados do body
    const body = await request.json();
    
    // Validar dados do body
    const validatedData = enviarPixSchema.parse(body);
    
    console.log('💸 [API_PIX_SEND] Dados validados', {
      tenantId: tenantInfo.tenantId,
      idEnvio: validatedIdEnvio,
      valor: validatedData.valor,
      hasPixKey: 'chave' in validatedData.favorecido,
      hasBankData: 'contaBanco' in validatedData.favorecido
    });

    // Inicializar serviços
    const authService = new EfiPayAuthService(tenantInfo.tenantId, tenantInfo.userId);
    const webhookService = new EfiPayWebhookService(tenantInfo.tenantId, tenantInfo.userId);
    const pixEnvioService = new EfiPayPixEnvioService(authService);

    // Preparar request para EfiPay
    const pixEnvioRequest: PixEnvioRequest = {
      valor: validatedData.valor,
      pagador: validatedData.pagador,
      favorecido: validatedData.favorecido
    };

    // Enviar PIX usando o método direto da EfiPay
    const result = await pixEnvioService.enviarPix(validatedIdEnvio, pixEnvioRequest);

    console.log('✅ [API_PIX_SEND] PIX enviado com sucesso', {
      tenantId: tenantInfo.tenantId,
      idEnvio: result.data.idEnvio,
      e2eId: result.data.e2eId,
      status: result.data.status,
      valor: result.data.valor
    });

    return NextResponse.json({
      success: true,
      data: {
        idEnvio: result.data.idEnvio,
        e2eId: result.data.e2eId,
        valor: result.data.valor,
        status: result.data.status,
        horario: result.data.horario
      },
      rateLimit: {
        tokensRemaining: result.rateLimit.bucketSize,
        retryAfterSeconds: result.rateLimit.retryAfter
      }
    }, { 
      status: 201,
      headers: {
        'X-Rate-Limit-Remaining': result.rateLimit.bucketSize.toString(),
        ...(result.rateLimit.retryAfter && {
          'Retry-After': result.rateLimit.retryAfter.toString()
        })
      }
    });

  } catch (error: any) {
    console.error('❌ [API_PIX_SEND] Erro ao enviar PIX:', {
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
    if (error.message?.includes('EFIPAY_')) {
      const errorCode = error.message.split(':')[0];
      const errorMessage = error.message.split(':')[1]?.trim() || 'Erro na EfiPay';
      
      // Mapear códigos de erro para status HTTP
      let statusCode = 500;
      if (errorCode.includes('UNAUTHORIZED')) statusCode = 401;
      else if (errorCode.includes('FORBIDDEN')) statusCode = 403;
      else if (errorCode.includes('NOT_FOUND')) statusCode = 404;
      else if (errorCode.includes('INVALID') || errorCode.includes('BAD_REQUEST')) statusCode = 400;
      else if (errorCode.includes('CONFLICT') || errorCode.includes('DUPLICATE')) statusCode = 409;
      else if (errorCode.includes('UNPROCESSABLE') || errorCode.includes('VALIDATION')) statusCode = 422;
      else if (errorCode.includes('RATE_LIMIT') || errorCode.includes('TOO_MANY')) statusCode = 429;
      
      return NextResponse.json({
        success: false,
        error: errorMessage,
        code: errorCode,
        provider: 'efipay'
      }, { status: statusCode });
    }

    // Tratar erro de conectividade
    if (error.message?.includes('fetch failed') || error.code === 'ECONNRESET') {
      return NextResponse.json({
        success: false,
        error: 'Serviço temporariamente indisponível. Tente novamente em alguns minutos.',
        code: 'SERVICE_UNAVAILABLE',
        provider: 'efipay'
      }, { status: 503 });
    }

    // Erro genérico
    return NextResponse.json({
      success: false,
      error: 'Erro interno do servidor',
      message: error.message || 'Erro desconhecido',
      code: 'INTERNAL_ERROR'
    }, { status: 500 });
  }
});

/**
 * GET /api/efipay/pix/send/:idEnvio
 * Consultar PIX enviado por ID
 */
export const GET = withTenantAuth(async (
  request: NextRequest,
  tenantInfo: any,
  { params }: { params: { idEnvio: string } }
) => {
  try {
    console.log('🔍 [API_PIX_SEND] Consultando PIX enviado', {
      tenantId: tenantInfo.tenantId,
      idEnvio: params.idEnvio
    });
    
    // Validar idEnvio
    const validatedIdEnvio = idEnvioSchema.parse(params.idEnvio);
    
    // Inicializar serviços
    const authService = new EfiPayAuthService(tenantInfo.tenantId, tenantInfo.userId);
    const webhookService = new EfiPayWebhookService(tenantInfo.tenantId, tenantInfo.userId);
    const pixEnvioService = new EfiPayPixEnvioService(authService);

    // Consultar PIX enviado
    const result = await pixEnvioService.consultarPixEnviadoPorId(validatedIdEnvio);

    console.log('✅ [API_PIX_SEND] PIX consultado com sucesso', {
      tenantId: tenantInfo.tenantId,
      idEnvio: result.idEnvio,
      status: result.status,
      valor: result.valor
    });

    return NextResponse.json({
      success: true,
      data: result
    });

  } catch (error: any) {
    console.error('❌ [API_PIX_SEND] Erro ao consultar PIX enviado:', {
      tenantId: tenantInfo?.tenantId,
      idEnvio: params?.idEnvio,
      error: error.message
    });

    // Tratar erros de validação
    if (error instanceof z.ZodError) {
      return NextResponse.json({
        success: false,
        error: 'ID de envio inválido',
        details: error.issues.map(e => `${e.path.join('.')}: ${e.message}`)
      }, { status: 400 });
    }

    // Tratar PIX não encontrado
    if (error.message?.includes('não encontrado')) {
      return NextResponse.json({
        success: false,
        error: `PIX enviado não encontrado para o ID: ${params.idEnvio}`,
        code: 'PIX_NOT_FOUND'
      }, { status: 404 });
    }

    // Tratar erro de conectividade
    if (error.message?.includes('fetch failed') || error.code === 'ECONNRESET') {
      return NextResponse.json({
        success: false,
        error: 'Serviço temporariamente indisponível. Tente novamente em alguns minutos.',
        code: 'SERVICE_UNAVAILABLE',
        provider: 'efipay'
      }, { status: 503 });
    }

    // Erro genérico
    return NextResponse.json({
      success: false,
      error: 'Erro interno do servidor',
      message: error.message || 'Erro desconhecido',
      code: 'INTERNAL_ERROR'
    }, { status: 500 });
  }
});