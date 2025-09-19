import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { EfiPayPixService } from '@/services/efipay/EfiPayPixService';
import { EfiPayAuthService } from '@/services/efipay/EfiPayAuthService';
import { 
  PixListagemRequest,
  PixListagemResponse
} from '@/types/efipay';

// Schema para validação de parâmetros de listagem
const pixListagemSchema = z.object({
  inicio: z.string().datetime('Data de início deve estar no formato ISO 8601'),
  fim: z.string().datetime('Data de fim deve estar no formato ISO 8601'),
  cpf: z.string().regex(/^\d{11}$/, 'CPF deve ter 11 dígitos').optional(),
  cnpj: z.string().regex(/^\d{14}$/, 'CNPJ deve ter 14 dígitos').optional(),
  locationPresente: z.boolean().optional(),
  status: z.enum(['ATIVA', 'CONCLUIDA', 'REMOVIDA_PELO_USUARIO_RECEBEDOR', 'REMOVIDA_PELO_PSP']).optional(),
  lote: z.string().max(35, 'Lote deve ter no máximo 35 caracteres').optional(),
  paginacao: z.object({
    paginaAtual: z.number().int().min(0, 'Página atual deve ser >= 0').optional(),
    itensPorPagina: z.number().int().min(1).max(1000, 'Itens por página deve estar entre 1 e 1000').optional()
  }).optional()
});

/**
 * GET /api/pix/cobrancas - Listar cobranças imediatas
 * 
 * Endpoint para listar cobranças PIX com filtros opcionais.
 * 
 * Conforme documentação: GET /v2/cob
 * Requer autorização para o escopo: cob.read
 * 
 * Query Parameters:
 * - inicio: Data de início (ISO 8601) - obrigatório
 * - fim: Data de fim (ISO 8601) - obrigatório
 * - cpf: CPF do devedor (11 dígitos) - opcional
 * - cnpj: CNPJ do devedor (14 dígitos) - opcional
 * - locationPresente: Se deve filtrar por presença de location - opcional
 * - status: Status da cobrança - opcional
 * - lote: Identificador do lote - opcional
 * - paginaAtual: Página atual (padrão: 0) - opcional
 * - itensPorPagina: Itens por página (padrão: 100, máx: 1000) - opcional
 */
export async function GET(request: NextRequest) {
  try {
    console.log('🔄 [API_PIX_COBRANCAS] Iniciando listagem de cobranças PIX');
    
    // Extrair parâmetros da query string
    const { searchParams } = new URL(request.url);
    
    // Construir objeto de parâmetros
    const queryParams: any = {
      inicio: searchParams.get('inicio'),
      fim: searchParams.get('fim')
    };
    
    // Adicionar parâmetros opcionais se presentes
    if (searchParams.get('cpf')) {
      queryParams.cpf = searchParams.get('cpf');
    }
    
    if (searchParams.get('cnpj')) {
      queryParams.cnpj = searchParams.get('cnpj');
    }
    
    if (searchParams.get('locationPresente')) {
      queryParams.locationPresente = searchParams.get('locationPresente') === 'true';
    }
    
    if (searchParams.get('status')) {
      queryParams.status = searchParams.get('status');
    }
    
    if (searchParams.get('lote')) {
      queryParams.lote = searchParams.get('lote');
    }
    
    // Parâmetros de paginação
    const paginaAtual = searchParams.get('paginaAtual');
    const itensPorPagina = searchParams.get('itensPorPagina');
    
    if (paginaAtual || itensPorPagina) {
      queryParams.paginacao = {};
      
      if (paginaAtual) {
        queryParams.paginacao.paginaAtual = parseInt(paginaAtual, 10);
      }
      
      if (itensPorPagina) {
        queryParams.paginacao.itensPorPagina = parseInt(itensPorPagina, 10);
      }
    }
    
    // Validar parâmetros obrigatórios
    if (!queryParams.inicio || !queryParams.fim) {
      return NextResponse.json(
        { 
          error: 'Parâmetros obrigatórios ausentes',
          message: 'Os parâmetros "inicio" e "fim" são obrigatórios'
        },
        { status: 400 }
      );
    }
    
    // Validar dados de entrada conforme documentação EfiPay
    const validatedParams = pixListagemSchema.parse(queryParams);
    
    console.log('✅ [API_PIX_COBRANCAS] Parâmetros validados:', {
      periodo: `${validatedParams.inicio} até ${validatedParams.fim}`,
      filtros: {
        cpf: validatedParams.cpf || 'não informado',
        cnpj: validatedParams.cnpj || 'não informado',
        status: validatedParams.status || 'todos',
        locationPresente: validatedParams.locationPresente ?? 'não filtrado'
      },
      paginacao: validatedParams.paginacao || 'padrão'
    });
    
    // Validar período (máximo 30 dias)
    const inicioDate = new Date(validatedParams.inicio);
    const fimDate = new Date(validatedParams.fim);
    const diffDays = Math.ceil((fimDate.getTime() - inicioDate.getTime()) / (1000 * 60 * 60 * 24));
    
    if (diffDays > 30) {
      return NextResponse.json(
        { 
          error: 'Período inválido',
          message: 'O período entre início e fim não pode ser superior a 30 dias'
        },
        { status: 400 }
      );
    }
    
    if (inicioDate >= fimDate) {
      return NextResponse.json(
        { 
          error: 'Período inválido',
          message: 'A data de início deve ser anterior à data de fim'
        },
        { status: 400 }
      );
    }
    
    // Inicializar serviços EfiPay
    // TODO: Implementar autenticação adequada para obter tenantId e userId
    const authService = new EfiPayAuthService('default-tenant', 'system-user');
    const pixService = new EfiPayPixService(authService);
    
    // Construir requisição para EfiPay
    const pixListagemRequest: PixListagemRequest = {
      inicio: validatedParams.inicio,
      fim: validatedParams.fim,
      cpf: validatedParams.cpf,
      cnpj: validatedParams.cnpj,
      status: validatedParams.status,
      paginaAtual: validatedParams.paginacao?.paginaAtual,
      itensPorPagina: validatedParams.paginacao?.itensPorPagina
    };
    
    // Listar cobranças PIX na EfiPay
    const result = await pixService.listPixCharges(pixListagemRequest);
    
    console.log('✅ [API_PIX_COBRANCAS] Cobranças PIX listadas:', {
      totalItens: result.parametros?.paginacao?.quantidadeTotalDeItens || 0,
      itensPagina: result.cobs?.length || 0,
      paginaAtual: result.parametros?.paginacao?.paginaAtual || 0
    });
    
    // Retornar resposta conforme documentação EfiPay
    return NextResponse.json(result, { status: 200 });
    
  } catch (error) {
    console.error('❌ [API_PIX_COBRANCAS] Erro ao listar cobranças PIX:', error);
    
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
    case 'PERIODO_INVALIDO':
    case 'PARAMETROS_INVALIDOS':
    case 'DATA_INVALIDA':
      return 400; // Bad Request
    case 'ACESSO_NEGADO':
      return 403; // Forbidden
    case 'LIMITE_REQUISICOES_EXCEDIDO':
      return 429; // Too Many Requests
    default:
      return 500; // Internal Server Error
  }
}