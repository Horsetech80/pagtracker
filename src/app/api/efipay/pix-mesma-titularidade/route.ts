/**
 * API REST para PIX de Mesma Titularidade da EfiPay
 * 
 * Endpoints:
 * - PUT /api/efipay/pix-mesma-titularidade?idEnvio={idEnvio} - Enviar PIX de mesma titularidade
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

// Schema para dados bancários do favorecido (mesma titularidade)
const contaBancoMesmaTitularidadeSchema = z.object({
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
}).refine(data => data.cpf || data.cnpj, {
  message: 'CPF ou CNPJ é obrigatório',
  path: ['cpf']
});

// Schema para favorecido de mesma titularidade
const favorecidoMesmaTitularidadeSchema = z.object({
  contaBanco: contaBancoMesmaTitularidadeSchema
});

// Schema principal para PIX de mesma titularidade
const pixMesmaTitularidadeSchema = z.object({
  valor: valorSchema,
  pagador: pagadorSchema,
  favorecido: favorecidoMesmaTitularidadeSchema
});

// ================================================================
// HANDLERS
// ================================================================

/**
 * PUT /api/efipay/pix-mesma-titularidade?idEnvio={idEnvio}
 * Enviar PIX de mesma titularidade conforme especificações da EfiPay
 */
export const PUT = withTenantAuth(async (request: NextRequest, tenantInfo: any) => {
  try {
    console.log('🔄 [API_PIX_MESMA_TITULARIDADE] Processando envio de PIX de mesma titularidade', { 
      tenantId: tenantInfo.tenantId 
    });
    
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
    const validatedData = pixMesmaTitularidadeSchema.parse(body);
    
    console.log('💸 [API_PIX_MESMA_TITULARIDADE] Enviando PIX de mesma titularidade', {
      tenantId: tenantInfo.tenantId,
      idEnvio: validatedIdEnvio,
      valor: validatedData.valor,
      pagadorChave: validatedData.pagador.chave,
      favorecidoNome: validatedData.favorecido.contaBanco.nome
    });

    // Inicializar serviços
    const authService = new EfiPayAuthService(tenantInfo.tenantId, tenantInfo.userId);
    const webhookService = new EfiPayWebhookService(tenantInfo.tenantId, tenantInfo.userId);
    const pixEnvioService = new EfiPayPixEnvioService(authService);

    // Enviar PIX de mesma titularidade usando o método específico da EfiPay
    const result = await pixEnvioService.enviarPixMesmaTitularidade(validatedIdEnvio, validatedData);

    console.log('✅ [API_PIX_MESMA_TITULARIDADE] PIX de mesma titularidade enviado com sucesso', {
      tenantId: tenantInfo.tenantId,
      idEnvio: result.idEnvio,
      e2eId: result.e2eId,
      status: result.status
    });

    return NextResponse.json(result, { 
      status: 201,
      headers: {
        'Content-Type': 'application/json'
      }
    });
  } catch (error: any) {
    console.error('❌ [API_PIX_MESMA_TITULARIDADE] Erro ao enviar PIX de mesma titularidade:', {
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
    const statusCode = error.message.includes('não encontrado') ? 404 :
                      error.message.includes('inválido') ? 400 :
                      error.message.includes('negado') ? 422 :
                      error.message.includes('limite') || error.message.includes('fichas') ? 429 :
                      error.message.includes('duplicado') ? 409 : 500;

    return NextResponse.json({
      success: false,
      error: error.message || 'Erro interno do servidor'
    }, { status: statusCode });
  }
});

/**
 * OPTIONS /api/efipay/pix-mesma-titularidade
 * Suporte a CORS para requisições preflight
 */
export const OPTIONS = async () => {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'PUT, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    },
  });
};