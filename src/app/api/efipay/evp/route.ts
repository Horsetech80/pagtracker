/**
 * API REST para gerenciamento de chaves PIX aleatórias (EVP)
 * 
 * Endpoints:
 * - POST /api/efipay/evp - Criar chave PIX aleatória
 * - GET /api/efipay/evp - Listar chaves PIX
 * - DELETE /api/efipay/evp - Deletar chave PIX (via query param)
 * 
 * @author PagTracker Team
 * @version 1.0.0
 */

import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { EfiPayEvpService } from '@/services/efipay/EfiPayEvpService';
import { EfiPayAuthService } from '@/services/efipay/EfiPayAuthService';
import { withTenantAuth } from '@/middleware/api/tenant-auth';

// ================================================================
// SCHEMAS DE VALIDAÇÃO
// ================================================================

const deleteEvpSchema = z.object({
  chave: z.string().min(1, 'Chave PIX é obrigatória')
});

// ================================================================
// HANDLERS
// ================================================================

/**
 * POST /api/efipay/evp
 * Criar chave PIX aleatória (EVP)
 */
export const POST = withTenantAuth(async (request: NextRequest, tenantInfo: any) => {
  try {
    console.log('🔄 [API_EVP] Criando chave PIX aleatória', { tenantId: tenantInfo.tenantId });
    
    // Inicializar serviços
    const authService = new EfiPayAuthService(tenantInfo.tenantId, tenantInfo.userId);
    const evpService = new EfiPayEvpService(authService);
      
      // Criar chave PIX aleatória
      const result = await evpService.createAndSetDefaultPixKey();
      
      console.log('✅ [API_EVP] Chave PIX aleatória criada com sucesso', {
        tenantId: tenantInfo.tenantId,
        chave: result.chave,
        status: result.status
      });
      
      return NextResponse.json({
        success: true,
        data: result,
        message: 'Chave PIX aleatória criada com sucesso'
      }, { status: 201 });
      
    } catch (error: any) {
      console.error('❌ [API_EVP_ERROR] Erro ao criar chave PIX:', error);
      
      // Mapear erros específicos
      
      // Verificar se é limite de criação atingido
      if (error.message?.includes('EFIPAY_EVP_LIMIT_REACHED')) {
        return NextResponse.json({
          success: false,
          error: 'EVP_LIMIT_REACHED',
          message: 'Limite de criação de chaves atingido',
          details: 'O limite máximo de chaves PIX para esta conta foi atingido.'
        }, { status: 429 });
      }
      
      if (error.message?.includes('EFIPAY_EVP_ERROR')) {
        return NextResponse.json({
          success: false,
          error: 'EFIPAY_EVP_ERROR',
          message: error.message,
          details: 'Erro na API EfiPay ao criar chave PIX aleatória'
        }, { status: 422 });
      }
      
      if (error.message?.includes('scope') || error.message?.includes('escopo')) {
        return NextResponse.json({
          success: false,
          error: 'SCOPE_ERROR',
          message: 'Escopo gn.pix.evp.write não habilitado na aplicação EfiPay',
          details: 'Verifique se o escopo gn.pix.evp.write está habilitado no painel EfiPay'
        }, { status: 403 });
      }
      
      return NextResponse.json({
        success: false,
        error: 'INTERNAL_ERROR',
        message: 'Erro interno ao criar chave PIX aleatória',
        details: error instanceof Error ? error.message : 'Erro desconhecido'
      }, { status: 500 });
    }
});

/**
 * GET /api/efipay/evp
 * Listar chaves PIX da conta
 */
export const GET = withTenantAuth(async (request: NextRequest, tenantInfo: any) => {
  try {
    console.log('🔄 [API_EVP] Listando chaves PIX', { tenantId: tenantInfo.tenantId });
    
    // Inicializar serviços
    const authService = new EfiPayAuthService(tenantInfo.tenantId, tenantInfo.userId);
    const evpService = new EfiPayEvpService(authService);
      
      // Listar chaves PIX
      const result = await evpService.listPixKeys();
      
      console.log('✅ [API_EVP] Chaves PIX listadas com sucesso', {
        tenantId: tenantInfo.tenantId,
        totalChaves: result.totalChaves
      });
      
      return NextResponse.json({
        success: true,
        data: result,
        message: 'Chaves PIX listadas com sucesso'
      });
      
    } catch (error: any) {
      console.error('❌ [API_EVP_ERROR] Erro ao listar chaves PIX:', error);
      
      if (error.message?.includes('EFIPAY_EVP_ERROR')) {
        return NextResponse.json({
          success: false,
          error: 'EFIPAY_EVP_ERROR',
          message: error.message,
          details: 'Erro na API EfiPay ao listar chaves PIX'
        }, { status: 422 });
      }
      
      if (error.message?.includes('scope') || error.message?.includes('escopo')) {
        return NextResponse.json({
          success: false,
          error: 'SCOPE_ERROR',
          message: 'Escopo gn.pix.evp.read não habilitado na aplicação EfiPay',
          details: 'Verifique se o escopo gn.pix.evp.read está habilitado no painel EfiPay'
        }, { status: 403 });
      }
      
      return NextResponse.json({
        success: false,
        error: 'INTERNAL_ERROR',
        message: 'Erro interno ao listar chaves PIX',
        details: error instanceof Error ? error.message : 'Erro desconhecido'
      }, { status: 500 });
    }
});

/**
 * DELETE /api/efipay/evp?chave=xxx
 * Deletar chave PIX específica
 */
export const DELETE = withTenantAuth(async (request: NextRequest, tenantInfo: any) => {
  try {
    console.log('🔄 [API_EVP] Deletando chave PIX', { tenantId: tenantInfo.tenantId });
    
    // Extrair chave da query string
    const { searchParams } = new URL(request.url);
    const chave = searchParams.get('chave');
    
    // Validar entrada
    const validatedData = deleteEvpSchema.parse({ chave });
    
    // Inicializar serviços
    const authService = new EfiPayAuthService(tenantInfo.tenantId, tenantInfo.userId);
    const evpService = new EfiPayEvpService(authService);
      
      // Deletar chave PIX
      const result = await evpService.deletePixKey(validatedData.chave);
      
      console.log('✅ [API_EVP] Chave PIX deletada com sucesso', {
        tenantId: tenantInfo.tenantId,
        chave: validatedData.chave
      });
      
      return NextResponse.json({
        success: true,
        data: result,
        message: 'Chave PIX deletada com sucesso'
      });
      
    } catch (error: any) {
      console.error('❌ [API_EVP_ERROR] Erro ao deletar chave PIX:', error);
      
      // Erro de validação Zod
      if (error.name === 'ZodError') {
        return NextResponse.json({
          success: false,
          error: 'VALIDATION_ERROR',
          message: 'Dados de entrada inválidos',
          details: error.issues
        }, { status: 400 });
      }
      
      if (error.message?.includes('EFIPAY_EVP_ERROR')) {
        return NextResponse.json({
          success: false,
          error: 'EFIPAY_EVP_ERROR',
          message: error.message,
          details: 'Erro na API EfiPay ao deletar chave PIX'
        }, { status: 422 });
      }
      
      if (error.message?.includes('scope') || error.message?.includes('escopo')) {
        return NextResponse.json({
          success: false,
          error: 'SCOPE_ERROR',
          message: 'Escopo gn.pix.evp.write não habilitado na aplicação EfiPay',
          details: 'Verifique se o escopo gn.pix.evp.write está habilitado no painel EfiPay'
        }, { status: 403 });
      }
      
      return NextResponse.json({
        success: false,
        error: 'INTERNAL_ERROR',
        message: 'Erro interno ao deletar chave PIX',
        details: error instanceof Error ? error.message : 'Erro desconhecido'
      }, { status: 500 });
    }
});