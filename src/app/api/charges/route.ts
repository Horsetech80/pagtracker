import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { withTenantAuth } from '@/middleware/api/tenant-auth';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import { SupabaseChargeRepository } from '@/infrastructure/repositories/SupabaseChargeRepository';
import { CreateChargeUseCase } from '@/application/use-cases/CreateCharge';
import { ListChargesUseCase } from '@/application/use-cases/ListCharges';
import { DomainErrorFactory } from '@/entities/errors/DomainErrors';

// Schema de validação para criação de cobrança conforme EfiPay POST /v2/cob
const createChargeSchema = z.object({
  // Campos EfiPay padrão (opcionais se usar campos de compatibilidade)
  valor: z.object({
    original: z.string().regex(/^\d{1,10}\.\d{2}$/, 'Valor deve estar no formato decimal (ex: 123.45)')
  }).optional(),
  chave: z.string().min(1, 'Chave PIX é obrigatória').max(77, 'Chave PIX deve ter no máximo 77 caracteres').optional(),
  calendario: z.object({
    expiracao: z.number().min(1, 'Expiração deve ser no mínimo 1 segundo').max(2147483647, 'Expiração excede limite máximo')
  }).optional(),
  
  // Campos opcionais
  devedor: z.object({
    nome: z.string().min(1, 'Nome é obrigatório').max(200, 'Nome deve ter no máximo 200 caracteres'),
    cpf: z.string().regex(/^\d{11}$/, 'CPF deve ter 11 dígitos').optional(),
    cnpj: z.string().regex(/^\d{14}$/, 'CNPJ deve ter 14 dígitos').optional()
  }).refine(data => {
    // Validação: não pode ter CPF e CNPJ ao mesmo tempo
    return !(data.cpf && data.cnpj);
  }, {
    message: 'Não é permitido informar CPF e CNPJ ao mesmo tempo'
  }).refine(data => {
    // Validação: se tem nome, deve ter CPF ou CNPJ
    if (data.nome && !data.cpf && !data.cnpj) {
      return false;
    }
    return true;
  }, {
    message: 'Se informar nome do devedor, deve informar CPF ou CNPJ'
  }).optional(),
  
  solicitacaoPagador: z.string().max(140, 'Solicitação ao pagador deve ter no máximo 140 caracteres').optional(),
  
  infoAdicionais: z.array(z.object({
    nome: z.string().min(1, 'Nome da informação adicional é obrigatório').max(50, 'Nome deve ter no máximo 50 caracteres'),
    valor: z.string().min(1, 'Valor da informação adicional é obrigatório').max(200, 'Valor deve ter no máximo 200 caracteres')
  })).max(50, 'Máximo 50 informações adicionais').optional(),
  
  loc: z.object({
    id: z.number().positive('ID do location deve ser positivo')
  }).optional(),

  // Campos de compatibilidade (opcionais se usar campos EfiPay)
  amount: z.number().positive('Valor deve ser positivo').optional(),
  description: z.string().optional(),
  expiration: z.number().optional(),
  customer: z.object({
    name: z.string().optional(),
    email: z.string().email('Email inválido').optional(),
    cpf: z.string().regex(/^\d{11}$/, 'CPF deve ter 11 dígitos').optional(),
    cnpj: z.string().regex(/^\d{14}$/, 'CNPJ deve ter 14 dígitos').optional()
  }).optional()
}).refine(data => {
  // Deve informar valor (EfiPay ou compatibilidade)
  if (!data.valor && !data.amount) {
    return false;
  }
  // Deve informar chave PIX (EfiPay, compatibilidade ou env)
  if (!data.chave && !process.env.EFIPAY_PIX_KEY) {
    return false;
  }
  return true;
}, {
  message: 'Deve informar valor e chave PIX (ou configurar EFIPAY_PIX_KEY)'
});

// Schema para listagem
const listChargesSchema = z.object({
  page: z.coerce.number().min(1).default(1),
  limit: z.coerce.number().min(1).max(100).default(20),
  status: z.enum(['pending', 'paid', 'expired', 'cancelled']).optional(),
  start_date: z.string().optional(),
  end_date: z.string().optional()
});

/**
 * POST /api/charges
 * Criar nova cobrança
 */
export const POST = withTenantAuth(async (request: NextRequest, tenantInfo: any) => {
  try {
    console.log('🔄 [API_CHARGES_POST] Criando nova cobrança', { tenantId: tenantInfo.tenantId });
    
    const body = await request.json();
    console.log('📥 [API_CHARGES_POST] Corpo da requisição recebido:', JSON.stringify(body, null, 2));
    console.log('📋 [API_CHARGES_POST] Tipos dos campos:', {
      valor: typeof body.valor,
      chave: typeof body.chave,
      calendario: typeof body.calendario
    });
    
    const validatedData = createChargeSchema.parse(body);
    console.log('🔄 [API_CHARGES_POST] Dados validados:', validatedData);
    // Converter dados para formato compatível com CreateChargeUseCase
    let chargeRequest: any = {
      tenantId: tenantInfo.tenantId,
      userId: tenantInfo.userId
    };

    console.log('🔄 [API_CHARGES_POST] Tenant info:', tenantInfo);

    // Se informou campos EfiPay diretamente, usar eles
    if (validatedData.valor && validatedData.chave && validatedData.calendario) {
      const valorOriginal = parseFloat(validatedData.valor.original);
      chargeRequest = {
        ...chargeRequest,
        valor: valorOriginal,
        descricao: validatedData.solicitacaoPagador || 'Pagamento via PIX',
        expiracao: validatedData.calendario.expiracao,
        chave: validatedData.chave,
        devedor: validatedData.devedor,
        infoAdicionais: validatedData.infoAdicionais,
        loc: validatedData.loc
      };
    } 
    // Senão, usar campos de compatibilidade
    else if (validatedData.amount) {
      chargeRequest = {
        ...chargeRequest,
        valor: validatedData.amount,
        descricao: validatedData.description || 'Pagamento via PIX',
        expiracao: validatedData.expiration || 3600,
        // Usar chave do ambiente se não informada
        chave: validatedData.chave || process.env.EFIPAY_PIX_KEY,
        // Converter customer para devedor se informado
        devedor: validatedData.customer ? {
          nome: validatedData.customer.name || '',
          cpf: validatedData.customer.cpf,
          cnpj: validatedData.customer.cnpj
        } : undefined
      };
    }

    console.log('🔄 [API_CHARGES_POST] Charge request preparado:', chargeRequest);
    // Inicializar repositório e use case com cliente de serviço
    const { createServiceClient } = await import('@/lib/supabase/server');
    const supabase = createServiceClient();
    const chargeRepository = new SupabaseChargeRepository(supabase);
    const createChargeUseCase = new CreateChargeUseCase(chargeRepository);
    
    // Criar cobrança
    console.log('🔄 [API_CHARGES_POST] Executando use case...');
    const charge = await createChargeUseCase.execute(chargeRequest);
    console.log('✅ [API_CHARGES_POST] Use case executado com sucesso');
    console.log('✅ [API_CHARGES_POST] Charge retornado:', JSON.stringify(charge, null, 2));
    
    console.log('✅ [API_CHARGES_POST] Cobrança criada com sucesso:', {
      id: charge.charge.id,
      amount: charge.charge.valor,
      status: charge.charge.status,
      txid: charge.charge.txid,
      qrcode: charge.charge.qr_code,
      imagemQrcode: charge.charge.qr_code_image
    });

    return NextResponse.json({
      success: true,
      message: 'Cobrança criada com sucesso',
      id: charge.charge.id,
      amount: charge.charge.valor,
      status: charge.charge.status,
      txid: charge.charge.txid,
      qrcode: charge.charge.qr_code,
      imagemQrcode: charge.charge.qr_code_image,
      charge: {
        id: charge.charge.id,
        valor: charge.charge.valor,
        status: charge.charge.status,
        txid: charge.charge.txid,
        qr_code: charge.charge.qr_code,
        qr_code_image: charge.charge.qr_code_image,
        descricao: charge.charge.descricao,
        created_at: charge.charge.created_at,
        expires_at: charge.charge.expires_at
      }
    }, { status: 201 });
    
  } catch (error: any) {
    console.error('❌ [API_CHARGES_POST] Erro detalhado:', {
      message: error.message,
      stack: error.stack,
      name: error.name,
      cause: error.cause
    });
    
    if (error instanceof z.ZodError) {
      console.error('❌ [API_CHARGES_POST] Erro de validação Zod:', error.issues);
      return NextResponse.json({
        success: false,
        error: 'VALIDATION_ERROR',
        message: 'Dados inválidos',
        details: Array.isArray(error.issues) ? error.issues.map((err: any) => ({
          field: err.path?.join('.') || 'unknown',
          message: err.message
        })) : []
      }, { status: 400 });
    }
    
    if (error instanceof Error && error.message.includes('DOMAIN_ERROR')) {
      return NextResponse.json({
        success: false,
        error: 'DOMAIN_ERROR',
        message: error.message
      }, { status: 422 });
    }
    
    return NextResponse.json({
      success: false,
      error: 'INTERNAL_ERROR',
      message: 'Erro interno do servidor',
      details: error.message
    }, { status: 500 });
  }
});

/**
 * GET /api/charges
 * Listar cobranças
 */
export const GET = withTenantAuth(async (request: NextRequest, tenantInfo: any) => {
  try {
    console.log('🔄 [API_CHARGES_GET] Listando cobranças', { tenantId: tenantInfo.tenantId });
    
    const { searchParams } = new URL(request.url);
    const queryParams = Object.fromEntries(searchParams.entries());
    const validatedParams = listChargesSchema.parse(queryParams);
    
    // Inicializar repositório e use case com cliente de serviço
    const { createServiceClient } = await import('@/lib/supabase/server');
    const supabase = createServiceClient();
    const chargeRepository = new SupabaseChargeRepository(supabase);
    const listChargesUseCase = new ListChargesUseCase(chargeRepository);
    
    // Listar cobranças
    const result = await listChargesUseCase.execute({
      tenantId: tenantInfo.tenantId,
      userId: tenantInfo.userId,
      page: validatedParams.page,
      limit: validatedParams.limit,
      status: validatedParams.status
    });
    
    console.log('✅ [API_CHARGES_GET] Cobranças listadas:', {
      total: result.total,
      page: validatedParams.page,
      limit: validatedParams.limit
    });
    
    return NextResponse.json({
      success: true,
      charges: result.charges,
      pagination: {
        total: result.total,
        page: validatedParams.page,
        limit: validatedParams.limit,
        totalPages: Math.ceil(result.total / validatedParams.limit)
      }
    });
    
  } catch (error) {
    console.error('❌ [API_CHARGES_GET] Erro ao listar cobranças:', error);
    
    if (error instanceof z.ZodError) {
      return NextResponse.json({
        success: false,
        error: 'VALIDATION_ERROR',
        message: 'Parâmetros inválidos',
        details: error.issues.map(err => ({
          field: err.path.join('.'),
          message: err.message,
          code: err.code
        }))
      }, { status: 400 });
    }
    
    return NextResponse.json({
      success: false,
      error: 'INTERNAL_ERROR',
      message: 'Erro interno do servidor'
    }, { status: 500 });
  }
});