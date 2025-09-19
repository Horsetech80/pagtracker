import { NextRequest, NextResponse } from 'next/server';
import { EfiPayPixEnvioService } from '@/services/efipay/EfiPayPixEnvioService';
import { EfiPayAuthService } from '@/services/efipay/EfiPayAuthService';
import { withTenantAuth } from '@/middleware/api/tenant-auth';
import { log } from '@/lib/logger';

/**
 * GET /api/efipay/transactions
 * Listar transações PIX reais da conta EfiPay
 * 
 * Query Parameters:
 * - inicio: data de início (YYYY-MM-DD)
 * - fim: data de fim (YYYY-MM-DD)
 * - paginacao.paginaAtual: página atual (padrão: 0)
 * - paginacao.itensPorPagina: itens por página (padrão: 100, máximo: 1000)
 * 
 * Utiliza integração direta com a API EfiPay
 * Escopo necessário: gn.pix.send.read
 */
export const GET = withTenantAuth(async (req: NextRequest, tenantInfo) => {
  try {
    const { searchParams } = new URL(req.url);
    
    // Parâmetros de data (últimos 30 dias por padrão)
    const fimDate = searchParams.get('fim') || new Date().toISOString().split('T')[0];
    const inicioDate = searchParams.get('inicio') || new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
    
    // Converter para formato RFC 3339 (ISO 8601) exigido pela EfiPay
    const inicio = `${inicioDate}T00:00:00.000Z`;
    const fim = `${fimDate}T23:59:59.999Z`;
    
    // Parâmetros de paginação
    const paginaAtual = parseInt(searchParams.get('paginacao.paginaAtual') || '0', 10);
    const itensPorPagina = Math.min(parseInt(searchParams.get('paginacao.itensPorPagina') || '100', 10), 1000);

    // Validar parâmetros
    if (paginaAtual < 0) {
      return NextResponse.json(
        {
          success: false,
          error: 'Parâmetro inválido',
          message: 'O número da página deve ser maior ou igual a 0'
        },
        { status: 400 }
      );
    }

    if (itensPorPagina < 1) {
      return NextResponse.json(
        {
          success: false,
          error: 'Parâmetro inválido',
          message: 'O número de itens por página deve ser maior que 0'
        },
        { status: 400 }
      );
    }

    // Inicializar serviços EfiPay
    const authService = new EfiPayAuthService(tenantInfo.tenantId, tenantInfo.userId);
    const pixEnvioService = new EfiPayPixEnvioService(authService);
    
    // Listar PIX enviados da EfiPay
    const result = await pixEnvioService.listarPixEnviados({
      inicio,
      fim,
      paginaAtual,
      itensPorPagina
    });

    // Verificar se a resposta contém dados válidos
    if (!result || !result.pix) {
      log.error('Erro ao listar transações PIX EfiPay', {
        error: 'Resposta inválida da API',
        result: result,
        userId: tenantInfo.userId,
        tenantId: tenantInfo.tenantId
      });

      // Retornar lista vazia em caso de erro de conectividade
      // para evitar que a página da carteira falhe completamente
      return NextResponse.json(
        {
          success: true,
          data: {
            transactions: [],
            pagination: {
              currentPage: paginaAtual,
              itemsPerPage: itensPorPagina,
              totalItems: 0,
              totalPages: 0
            }
          },
          message: 'Não foi possível carregar as transações no momento. Tente novamente mais tarde.'
        },
        { status: 200 }
      );
    }

    // Transformar dados para formato compatível com a interface da carteira
    const transactions = result.pix?.map((pix: any) => ({
      id: pix.endToEndId || pix.idEnvio,
      type: 'withdraw',
      amount: Math.round(parseFloat(pix.valor || '0') * 100), // Converter para centavos
      status: pix.status,
      description: pix.infoPagador || 'PIX enviado',
      date: pix.horario?.solicitacao || new Date().toISOString(),
      metadata: {
        endToEndId: pix.endToEndId,
        idEnvio: pix.idEnvio,
        chave: pix.chave,
        favorecido: pix.favorecido
      }
    })) || [];

    log.info('Transações PIX EfiPay listadas com sucesso', {
      userId: tenantInfo.userId,
      tenantId: tenantInfo.tenantId,
      inicio,
      fim,
      paginaAtual,
      itensPorPagina,
      totalTransacoes: transactions.length
    });

    return NextResponse.json({
      success: true,
      data: {
        transactions,
        pagination: {
          page: paginaAtual + 1, // Converter para base 1
          limit: itensPorPagina,
          total: result.parametros?.paginacao?.quantidadeTotalDeItens || 0,
          totalPages: Math.ceil((result.parametros?.paginacao?.quantidadeTotalDeItens || 0) / itensPorPagina),
          hasNext: (paginaAtual + 1) * itensPorPagina < (result.parametros?.paginacao?.quantidadeTotalDeItens || 0),
          hasPrev: paginaAtual > 0
        },
        gateway: 'efipay'
      }
    });
  } catch (error) {
    log.error('Erro interno ao listar transações PIX EfiPay', {
      error: error instanceof Error ? error.message : 'Erro desconhecido',
      userId: tenantInfo.userId,
      tenantId: tenantInfo.tenantId
    });

    // Retornar lista vazia em caso de erro para evitar falha na página
    return NextResponse.json(
      {
        success: true,
        data: {
          transactions: [],
          pagination: {
            page: 1,
            limit: 10,
            total: 0,
            totalPages: 0,
            hasNext: false,
            hasPrev: false
          },
          gateway: 'efipay'
        },
        message: 'Não foi possível carregar as transações no momento. Tente novamente mais tarde.'
      },
      { status: 200 }
    );
  }
});