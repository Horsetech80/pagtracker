/**
 * API REST para PIX Envio da EfiPay
 * 
 * Endpoints:
 * - POST /api/efipay/pix-envio - Enviar PIX ou PIX de mesma titularidade
 * - GET /api/efipay/pix-envio - Listar PIX enviados com filtros
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

// Schema para validação do idEnvio (query param)
const idEnvioSchema = z.string()
  .regex(/^[a-zA-Z0-9]{1,35}$/, 'idEnvio deve conter apenas letras e números, com 1 a 35 caracteres');

// Schema para validação do valor
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

// Schema principal para envio de PIX
const enviarPixSchema = z.object({
  valor: valorSchema,
  pagador: pagadorSchema,
  favorecido: favorecidoSchema
});

// Schema para listagem de PIX enviados
const listarPixEnviadosSchema = z.object({
  startDate: z.string().regex(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(\.\d{3})?Z$/, 'Data de início deve estar no formato RFC 3339'),
  endDate: z.string().regex(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(\.\d{3})?Z$/, 'Data de fim deve estar no formato RFC 3339'),
  page: z.number().int().positive().optional(),
  itemsPerPage: z.number().int().positive().max(100).optional()
});

// ================================================================
// HANDLERS
// ================================================================

/**
 * POST /api/efipay/pix-envio?idEnvio={idEnvio}
 * Enviar PIX conforme especificações da EfiPay
 */
export const POST = withTenantAuth(async (request: NextRequest, tenantInfo: any) => {
  try {
    console.log('🔄 [API_PIX_ENVIO] Processando envio de PIX', { tenantId: tenantInfo.tenantId });
    
    // Extrair idEnvio da query string
    const { searchParams } = new URL(request.url);
    const idEnvio = searchParams.get('idEnvio');
    
    if (!idEnvio) {
      return NextResponse.json({
        success: false,
        error: 'Parâmetro idEnvio é obrigatório na query string'
      }, { status: 400 });
    }

    // Validar idEnvio
    const validatedIdEnvio = idEnvioSchema.parse(idEnvio);
    
    // Extrair dados do body
    const body = await request.json();
    
    // Validar dados do body
    const validatedData = enviarPixSchema.parse(body);
    
    console.log('💸 [API_PIX_ENVIO] Enviando PIX', {
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

    // Enviar PIX usando o método direto da EfiPay
    const result = await pixEnvioService.enviarPix(validatedIdEnvio, validatedData);

    console.log('✅ [API_PIX_ENVIO] PIX enviado com sucesso', {
      tenantId: tenantInfo.tenantId,
      idEnvio: result.data.idEnvio || validatedIdEnvio,
      e2eId: result.data.e2eId,
      status: result.data.status
    });

    return NextResponse.json(result, { status: 201 });
  } catch (error: any) {
    console.error('❌ [API_PIX_ENVIO] Erro ao enviar PIX:', {
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

/**
 * GET /api/efipay/pix-envio
 * Listar PIX enviados com filtros
 */
export const GET = withTenantAuth(async (request: NextRequest, tenantInfo: any) => {
  try {
    console.log('🔄 [API_PIX_ENVIO] Listando PIX enviados', { tenantId: tenantInfo.tenantId });
    
    const { searchParams } = new URL(request.url);
    
    // Extrair parâmetros da query string
    const queryData = {
      startDate: searchParams.get('startDate'),
      endDate: searchParams.get('endDate'),
      page: searchParams.get('page') ? parseInt(searchParams.get('page')!) : undefined,
      itemsPerPage: searchParams.get('itemsPerPage') ? parseInt(searchParams.get('itemsPerPage')!) : undefined
    };

    // Validar parâmetros obrigatórios
    if (!queryData.startDate || !queryData.endDate) {
      return NextResponse.json({
        success: false,
        error: 'Parâmetros startDate e endDate são obrigatórios'
      }, { status: 400 });
    }

    // Validar dados
    const validatedData = listarPixEnviadosSchema.parse(queryData);
    
    console.log('📋 [API_PIX_ENVIO] Filtros validados', {
      tenantId: tenantInfo.tenantId,
      startDate: validatedData.startDate,
      endDate: validatedData.endDate,
      page: validatedData.page,
      itemsPerPage: validatedData.itemsPerPage
    });

    // Inicializar serviços
    const authService = new EfiPayAuthService(tenantInfo.tenantId, tenantInfo.userId);
    const webhookService = new EfiPayWebhookService(tenantInfo.tenantId, tenantInfo.userId);
    const pixEnvioService = new EfiPayPixEnvioService(authService);

    // Preparar request para PagTracker
    const pagTrackerRequest = {
      ...validatedData,
      tenantId: tenantInfo.tenantId
    };

    const result = await pixEnvioService.listarPixEnviadosPagTracker(pagTrackerRequest);

    console.log('✅ [API_PIX_ENVIO] PIX enviados listados com sucesso', {
      tenantId: tenantInfo.tenantId,
      totalItems: result.data?.filters.pagination?.totalItems || 0,
      currentPage: result.data?.filters.pagination?.currentPage || 1
    });

    return NextResponse.json(result, { status: 200 });
  } catch (error: any) {
    console.error('❌ [API_PIX_ENVIO] Erro ao listar PIX enviados:', {
      tenantId: tenantInfo?.tenantId,
      error: error.message,
      stack: error.stack
    });

    // Tratar erros de validação
    if (error instanceof z.ZodError) {
      return NextResponse.json({
        success: false,
        error: 'Parâmetros inválidos',
        details: error.issues.map(e => `${e.path.join('.')}: ${e.message}`)
      }, { status: 400 });
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