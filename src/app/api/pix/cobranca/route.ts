import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { EfiPayPixService } from '@/services/efipay/EfiPayPixService';
import { EfiPayAuthService } from '@/services/efipay/EfiPayAuthService';
import { 
  PixCobrancaRequest, 
  PixCobrancaResponse,
  PixCalendario,
  PixDevedorPF,
  PixDevedorPJ,
  PixValor,
  PixInfoAdicional,
  PixLocation
} from '@/types/efipay';

// Schema de validação para calendário
const calendarioSchema = z.object({
  expiracao: z.number().min(1).max(2147483647, 'Expiração deve ser entre 1 e 2147483647 segundos')
});

// Schema para devedor pessoa física
const devedorPFSchema = z.object({
  cpf: z.string().regex(/^\d{11}$/, 'CPF deve ter 11 dígitos'),
  nome: z.string().max(200, 'Nome deve ter no máximo 200 caracteres')
});

// Schema para devedor pessoa jurídica
const devedorPJSchema = z.object({
  cnpj: z.string().regex(/^\d{14}$/, 'CNPJ deve ter 14 dígitos'),
  nome: z.string().max(200, 'Nome deve ter no máximo 200 caracteres')
});

// Schema para valor
const valorSchema = z.object({
  original: z.string().regex(/^\d{1,10}\.\d{2}$/, 'Valor deve estar no formato 0.00 com ponto decimal')
});

// Schema para informações adicionais
const infoAdicionalSchema = z.object({
  nome: z.string().max(50, 'Nome do campo deve ter no máximo 50 caracteres'),
  valor: z.string().max(200, 'Valor do campo deve ter no máximo 200 caracteres')
});

// Schema para location
const locationSchema = z.object({
  id: z.number().int().positive('ID do location deve ser um número positivo')
});

// Schema principal para cobrança PIX
const pixCobrancaSchema = z.object({
  calendario: calendarioSchema,
  devedor: z.union([devedorPFSchema, devedorPJSchema]).optional(),
  valor: valorSchema,
  chave: z.string().max(77, 'Chave PIX deve ter no máximo 77 caracteres'),
  solicitacaoPagador: z.string().max(140, 'Solicitação ao pagador deve ter no máximo 140 caracteres').optional(),
  infoAdicionais: z.array(infoAdicionalSchema).max(50, 'Máximo 50 informações adicionais').optional(),
  loc: locationSchema.optional()
});

/**
 * POST /api/pix/cobranca - Criar cobrança imediata (sem txid)
 * 
 * Endpoint para criar uma cobrança imediata sem informar um txid.
 * O txid será definido pela EfiPay.
 * 
 * Conforme documentação: POST /v2/cob
 * Requer autorização para o escopo: cob.write
 */
export async function POST(request: NextRequest) {
  try {
    console.log('🔄 [API_PIX_COBRANCA] Iniciando criação de cobrança PIX sem txid');
    
    // Extrair dados do corpo da requisição
    const body = await request.json();
    
    // Validar dados de entrada conforme documentação EfiPay
    const validatedData = pixCobrancaSchema.parse(body);
    
    console.log('✅ [API_PIX_COBRANCA] Dados validados:', {
      valor: validatedData.valor.original,
      chave: validatedData.chave,
      expiracao: validatedData.calendario.expiracao,
      temDevedor: !!validatedData.devedor
    });
    
    // Inicializar serviços EfiPay
    // TODO: Implementar autenticação adequada para obter tenantId e userId
    const authService = new EfiPayAuthService('default-tenant', 'system-user');
    const pixService = new EfiPayPixService(authService);
    
    // Criar cobrança PIX na EfiPay
    const pixCobrancaRequest: PixCobrancaRequest = {
      calendario: {
        expiracao: validatedData.calendario.expiracao
      },
      devedor: validatedData.devedor,
      valor: {
        original: validatedData.valor.original
      },
      chave: validatedData.chave,
      solicitacaoPagador: validatedData.solicitacaoPagador,
      infoAdicionais: validatedData.infoAdicionais,
      loc: validatedData.loc
    };
    
    const result = await pixService.createPixCharge(pixCobrancaRequest);
    
    console.log('✅ [API_PIX_COBRANCA] Cobrança PIX criada com sucesso:', {
      txid: result.txid,
      status: result.status,
      location: result.location
    });
    
    // Retornar resposta conforme documentação EfiPay
    return NextResponse.json(result, { status: 201 });
    
  } catch (error) {
    console.error('❌ [API_PIX_COBRANCA] Erro ao criar cobrança PIX:', error);
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { 
          error: 'Dados inválidos',
          details: error.issues.map(err => ({
            field: err.path.join('.'),
            message: err.message,
            code: err.code
          }))
        },
        { status: 400 }
      );
    }
    
    // Verificar se é erro específico da EfiPay
    if (error instanceof Error && error.message.startsWith('EFIPAY_PIX_ERROR_')) {
      const errorType = error.message.split(':')[0].replace('EFIPAY_PIX_ERROR_', '');
      
      // Mapear códigos de erro conforme documentação EfiPay
      const statusCode = getEfiPayErrorStatusCode(errorType);
      
      return NextResponse.json(
        { 
          error: 'Erro na EfiPay',
          type: errorType,
          message: error.message.split(':')[1]?.trim() || 'Erro desconhecido'
        },
        { status: statusCode }
      );
    }
    
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}

/**
 * Mapear tipos de erro EfiPay para códigos HTTP
 * Conforme documentação oficial
 */
function getEfiPayErrorStatusCode(errorType: string): number {
  switch (errorType) {
    case 'DOCUMENTO_BLOQUEADO':
    case 'CHAVE_INVALIDA':
    case 'VALOR_INVALIDO':
      return 400; // Bad Request
    case 'TXID_DUPLICADO':
      return 409; // Conflict
    case 'COBRANCA_NAO_ENCONTRADA':
      return 404; // Not Found
    case 'STATUS_COBRANCA_INVALIDO':
      return 422; // Unprocessable Entity
    default:
      return 500; // Internal Server Error
  }
}