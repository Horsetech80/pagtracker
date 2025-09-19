import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { withTenantAuth } from '@/middleware/api/tenant-auth';
import { createServerSupabaseClient, createServiceClient } from '@/lib/supabase/server';
import { SupabaseChargeRepository } from '@/infrastructure/repositories/SupabaseChargeRepository';
import { GetChargeUseCase } from '@/application/use-cases/GetChargeUseCase';
import { UpdateChargeUseCase } from '@/application/use-cases/UpdateChargeUseCase';
import { DeleteChargeUseCase } from '@/application/use-cases/DeleteChargeUseCase';
import { DomainErrorFactory } from '@/entities/errors/DomainErrors';

interface RouteParams {
  params: {
    id: string;
  };
}

// Schema de validação para atualização
const updateChargeSchema = z.object({
  description: z.string().optional(),
  status: z.enum(['pending', 'paid', 'expired', 'cancelled']).optional(),
  amount: z.number().positive().optional()
});

/**
 * GET /api/charges/[id]
 * Buscar cobrança específica
 */
export const GET = withTenantAuth(async (request: NextRequest, tenantInfo: any, context: any) => {
  try {
    const { params } = context;
    console.log('🔄 [API_CHARGES_GET_ID] Buscando cobrança:', { id: params?.id, tenantId: tenantInfo.tenantId });
    
    // Validar ID
    if (!params?.id || typeof params.id !== 'string') {
      return NextResponse.json({
        success: false,
        error: 'INVALID_ID',
        message: 'ID da cobrança é obrigatório'
      }, { status: 400 });
    }
    
    // Inicializar repositório e use case com Service Role Key
    const supabase = createServiceClient();
    const chargeRepository = new SupabaseChargeRepository(supabase);
    const getChargeUseCase = new GetChargeUseCase(chargeRepository);
    
    // Buscar cobrança
    const charge = await getChargeUseCase.execute({
      id: params.id,
      tenantId: tenantInfo.tenantId
    });
    
    console.log('✅ [API_CHARGES_GET_ID] Cobrança encontrada:', {
      id: charge.id,
      status: charge.status,
      amount: charge.amount
    });
    
    return NextResponse.json({
      success: true,
      charge
    });
    
  } catch (error) {
    console.error('❌ [API_CHARGES_GET_ID] Erro ao buscar cobrança:', error);
    
    if (error instanceof Error && error.message.includes('not found')) {
      return NextResponse.json({
        success: false,
        error: 'NOT_FOUND',
        message: 'Cobrança não encontrada'
      }, { status: 404 });
    }
    
    return NextResponse.json({
      success: false,
      error: 'INTERNAL_ERROR',
      message: 'Erro interno do servidor'
    }, { status: 500 });
  }
});

/**
 * PATCH /api/charges/[id]
 * Atualizar cobrança
 */
export const PATCH = withTenantAuth(async (request: NextRequest, tenantInfo: any, context: any) => {
  try {
    const { params } = context;
    console.log('🔄 [API_CHARGES_PATCH_ID] Atualizando cobrança:', { id: params?.id, tenantId: tenantInfo.tenantId });
    
    // Validar ID
    if (!params?.id || typeof params.id !== 'string') {
      return NextResponse.json({
        success: false,
        error: 'INVALID_ID',
        message: 'ID da cobrança é obrigatório'
      }, { status: 400 });
    }
    
    const body = await request.json();
    const validatedData = updateChargeSchema.parse(body);
    
    // Inicializar repositório e use case com Service Role Key
    const supabase = createServiceClient();
    const chargeRepository = new SupabaseChargeRepository(supabase);
    const updateChargeUseCase = new UpdateChargeUseCase(chargeRepository);
    
    // Atualizar cobrança
    const charge = await updateChargeUseCase.execute({
      id: params.id,
      tenantId: tenantInfo.tenantId,
      updateData: validatedData
    });
    
    console.log('✅ [API_CHARGES_PATCH] Cobrança atualizada:', {
      id: charge.id,
      status: charge.status
    });
    
    return NextResponse.json({
      success: true,
      charge
    });
    
  } catch (error) {
    console.error('❌ [API_CHARGES_PATCH] Erro ao atualizar cobrança:', error);
    
    if (error instanceof z.ZodError) {
      return NextResponse.json({
        success: false,
        error: 'VALIDATION_ERROR',
        message: 'Dados inválidos',
        details: error.issues.map(err => ({
          field: err.path.join('.'),
          message: err.message,
          code: err.code
        }))
      }, { status: 400 });
    }
    
    if (error instanceof Error && error.message.includes('not found')) {
      return NextResponse.json({
        success: false,
        error: 'NOT_FOUND',
        message: 'Cobrança não encontrada'
      }, { status: 404 });
    }
    
    return NextResponse.json({
      success: false,
      error: 'INTERNAL_ERROR',
      message: 'Erro interno do servidor'
    }, { status: 500 });
  }
});

/**
 * DELETE /api/charges/[id]
 * Deletar cobrança
 */
export const DELETE = withTenantAuth(async (request: NextRequest, tenantInfo: any, context: any) => {
  try {
    const { params } = context;
    console.log('🔄 [API_CHARGES_DELETE_ID] Deletando cobrança:', { id: params?.id, tenantId: tenantInfo.tenantId });
    
    // Validar ID
    if (!params?.id || typeof params.id !== 'string') {
      return NextResponse.json({
        success: false,
        error: 'INVALID_ID',
        message: 'ID da cobrança é obrigatório'
      }, { status: 400 });
    }
    
    // Inicializar repositório e use case com Service Role Key
    const supabase = createServiceClient();
    const chargeRepository = new SupabaseChargeRepository(supabase);
    const deleteChargeUseCase = new DeleteChargeUseCase(chargeRepository);
    
    // Deletar cobrança
    await deleteChargeUseCase.execute({
      id: params.id,
      tenantId: tenantInfo.tenantId
    });
    
    console.log('✅ [API_CHARGES_DELETE] Cobrança deletada:', { id: params.id });
    
    return NextResponse.json({
      success: true,
      message: 'Cobrança deletada com sucesso'
    });
    
  } catch (error) {
    console.error('❌ [API_CHARGES_DELETE] Erro ao deletar cobrança:', error);
    
    if (error instanceof Error && error.message.includes('not found')) {
      return NextResponse.json({
        success: false,
        error: 'NOT_FOUND',
        message: 'Cobrança não encontrada'
      }, { status: 404 });
    }
    
    return NextResponse.json({
      success: false,
      error: 'INTERNAL_ERROR',
      message: 'Erro interno do servidor'
    }, { status: 500 });
  }
});