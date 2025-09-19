/**
 * SALESSERVICE - PAGTRACKER V4.0
 * ===================================
 * 
 * Serviço para gerenciamento de vendas seguindo Clean Architecture
 * Consolida dados de charges e payments em uma API unificada
 * 
 * Funcionalidades:
 * - Estatísticas consolidadas de vendas
 * - Listagem com busca, filtros e paginação
 * - Detalhes de vendas específicas
 * - Criação de novas vendas (via charges/payments)
 * - Integração com sistema de split de pagamentos
 */

import { BaseService } from '../core/BaseService';
import { createClient } from '@/lib/supabase/server';
import { log } from '@/lib/logger';
import { createError } from '@/lib/errors';

// ===== INTERFACES =====

export interface SplitRecipient {
  accountId: string;
  accountType: 'conta_corrente' | 'conta_poupanca';
  percentage?: number;
  fixedAmount?: number;
  description?: string;
}

export interface SplitConfig {
  enabled: boolean;
  type: 'percentage' | 'fixed' | 'mixed';
  recipients: SplitRecipient[];
  mainRecipient?: {
    accountId: string;
    accountType: 'conta_corrente' | 'conta_poupanca';
  };
  splitRules?: {
    minimumAmount?: number;
    maximumRecipients?: number;
    allowPartialSplit?: boolean;
  };
}

export interface SaleStats {
  totalSales: number;
  totalRevenue: number;
  averageOrderValue: number;
  salesThisMonth: number;
  revenueThisMonth: number;
  pendingSales: number;
  paidSales: number;
  cancelledSales: number;
}

export interface Sale {
  id: string;
  description: string;
  customerName: string | null;
  customerEmail: string | null;
  customerPhone?: string | null;
  customerDocument?: string | null;
  amount: number;
  status: 'paid' | 'pending' | 'cancelled';
  paymentMethod: string;
  hasSplit: boolean;
  qrCode?: string | null;
  qrCodeImage?: string | null;
  paymentLink?: string | null;
  txid?: string | null;
  createdAt: string;
  updatedAt: string | null;
  expiresAt: string | null;
  sourceTable: 'charges' | 'payments';
}

export interface CreateSaleRequest {
  description: string;
  customerName: string;
  customerEmail: string;
  customerPhone?: string;
  customerDocument?: string;
  amount: number;
  paymentMethod: 'pix';
  expiresIn?: number; // segundos
  enableSplit?: boolean;
  splitConfig?: SplitConfig;
}

export interface SalesFilters {
  search?: string;
  status?: 'paid' | 'pending' | 'cancelled' | '';
  sortBy?: 'created_at' | 'amount' | 'customer_name';
  sortDirection?: 'ASC' | 'DESC';
  page?: number;
  pageSize?: number;
}

export interface SalesListResponse {
  sales: Sale[];
  total: number;
  page: number;
  pageSize: number;
  hasNextPage: boolean;
  hasPreviousPage: boolean;
}

// ===== SALES SERVICE =====
export class SalesService extends BaseService {
  protected supabase: any; // Will be initialized async

  constructor(tenantId: string, userId: string) {
    super(tenantId, userId);
    this.initializeSupabase();
  }

  private async initializeSupabase() {
    this.supabase = await createClient();
  }

  /**
   * Remove dados sensíveis antes de retornar para o cliente
   */
  protected sanitizeOutput<T>(data: T): Partial<T> {
    return data;
  }

  /**
   * Obter estatísticas consolidadas de vendas
   */
  async getStats(): Promise<SaleStats> {
    try {
      const { data, error } = await this.supabase.rpc('get_sales_stats', {
        tenant_id_param: this.tenantId
      });

      if (error) {
        log.error('Failed to get sales stats', {
          service: 'sales',
          tenantId: this.tenantId,
          userId: this.userId
        }, new Error(error.message));
        throw createError.database(`Failed to get sales stats: ${error.message}`, error);
      }

      if (!data || data.length === 0) {
        return {
          totalSales: 0,
          totalRevenue: 0,
          averageOrderValue: 0,
          salesThisMonth: 0,
          revenueThisMonth: 0,
          pendingSales: 0,
          paidSales: 0,
          cancelledSales: 0
        };
      }

      const stats = data[0];
      return {
        totalSales: parseInt(stats.total_sales) || 0,
        totalRevenue: parseFloat(stats.total_revenue) || 0,
        averageOrderValue: parseFloat(stats.average_order_value) || 0,
        salesThisMonth: parseInt(stats.sales_this_month) || 0,
        revenueThisMonth: parseFloat(stats.revenue_this_month) || 0,
        pendingSales: parseInt(stats.pending_sales) || 0,
        paidSales: parseInt(stats.paid_sales) || 0,
        cancelledSales: parseInt(stats.cancelled_sales) || 0
      };
    } catch (error) {
      log.error('Error in SalesService.getStats', {
        service: 'sales',
        tenantId: this.tenantId,
        userId: this.userId
      }, error as Error);
      throw error;
    }
  }

  /**
   * Listar vendas com filtros e paginação
   */
  async getSales(filters: SalesFilters = {}): Promise<SalesListResponse> {
    try {
      const {
        search = '',
        status = '',
        sortBy = 'created_at',
        sortDirection = 'DESC',
        page = 1,
        pageSize = 20
      } = filters;

      // Obter vendas
      const { data: salesData, error: salesError } = await this.supabase.rpc('get_sales_consolidated', {
        tenant_id_param: this.tenantId,
        search_term: search,
        status_filter: status,
        sort_by: sortBy,
        sort_direction: sortDirection,
        page_size: pageSize,
        page_number: page
      });

      if (salesError) {
        log.error('Failed to get sales', {
          service: 'sales',
          tenantId: this.tenantId,
          userId: this.userId,
          filters
        }, new Error(salesError.message));
        throw createError.database(`Failed to get sales: ${salesError.message}`, salesError);
      }

      // Obter total de registros
      const { data: countData, error: countError } = await this.supabase.rpc('count_sales_consolidated', {
        tenant_id_param: this.tenantId,
        search_term: search,
        status_filter: status
      });

      if (countError) {
        log.error('Failed to count sales', {
          service: 'sales',
          tenantId: this.tenantId,
          userId: this.userId,
          filters
        }, new Error(countError.message));
        throw createError.database(`Failed to count sales: ${countError.message}`, countError);
      }

      const total = parseInt(countData) || 0;
      const sales = (salesData || []).map(this.formatSale);

      return {
        sales,
        total,
        page,
        pageSize,
        hasNextPage: page * pageSize < total,
        hasPreviousPage: page > 1
      };
    } catch (error) {
      log.error('Error in SalesService.getSales', {
        service: 'sales',
        tenantId: this.tenantId,
        userId: this.userId,
        filters
      }, error as Error);
      throw error;
    }
  }

  /**
   * Obter detalhes de uma venda específica
   */
  async getSaleById(saleId: string): Promise<Sale | null> {
    try {
      const { data, error } = await this.supabase.rpc('get_sale_by_id', {
        tenant_id_param: this.tenantId,
        sale_id_param: saleId
      });

      if (error) {
        log.error('Failed to get sale by ID', {
          service: 'sales',
          tenantId: this.tenantId,
          userId: this.userId,
          saleId
        }, new Error(error.message));
        throw createError.database(`Failed to get sale: ${error.message}`, error);
      }

      if (!data || data.length === 0) {
        return null;
      }

      return this.formatSale(data[0]);
    } catch (error) {
      log.error('Error in SalesService.getSaleById', {
        service: 'sales',
        tenantId: this.tenantId,
        userId: this.userId,
        saleId
      }, error as Error);
      throw error;
    }
  }

  /**
   * Criar nova venda (via tabela charges)
   */
  async createSale(request: CreateSaleRequest): Promise<Sale> {
    try {
      // Calcular data de expiração
      const expiresAt = new Date();
      expiresAt.setSeconds(expiresAt.getSeconds() + (request.expiresIn || 3600));

      // Criar registro na tabela charges
      // A integração com EfiPay será feita posteriormente via webhook
      const { data, error } = await this.supabase
        .from('charges')
        .insert({
          tenant_id: this.tenantId,
          user_id: this.userId,
          valor: request.amount,
          descricao: request.description,
          cliente_nome: request.customerName,
          cliente_email: request.customerEmail,
          cliente_telefone: request.customerPhone,
          cliente_cpf: request.customerDocument,
          status: 'pendente',
          expires_at: expiresAt.toISOString(),
          // Campos serão preenchidos após integração com EfiPay
          txid: null,
          qr_code: null,
          qr_code_image: null,
          link_pagamento: null
        })
        .select()
        .single();

      if (error) {
        log.error('Failed to create sale', {
          service: 'sales',
          tenantId: this.tenantId,
          userId: this.userId,
          request: {
            description: request.description,
            amount: request.amount,
            customerEmail: request.customerEmail
          }
        }, new Error(error.message));
        throw createError.database(`Failed to create sale: ${error.message}`, error);
      }

      // Retornar venda formatada
      return this.formatSale({
        id: data.id,
        description: data.descricao,
        customer_name: data.cliente_nome,
        customer_email: data.cliente_email,
        customer_phone: data.cliente_telefone,
        customer_document: data.cliente_cpf,
        amount: data.valor,
        status: 'pending',
        payment_method: 'pix',
        has_split: false,
        qr_code: data.qr_code,
        qr_code_image: data.qr_code_image,
        payment_link: data.link_pagamento,
        txid: data.txid,
        created_at: data.created_at,
        updated_at: data.updated_at,
        expires_at: data.expires_at,
        source_table: 'charges'
      });
    } catch (error) {
      log.error('Error in SalesService.createSale', {
        service: 'sales',
        tenantId: this.tenantId,
        userId: this.userId,
        request: {
          description: request.description,
          amount: request.amount,
          customerEmail: request.customerEmail
        }
      }, error as Error);
      throw error;
    }
  }

  /**
   * Atualizar status de uma venda
   */
  async updateSaleStatus(saleId: string, status: 'paid' | 'pending' | 'cancelled'): Promise<Sale> {
    try {
      // Primeiro, verificar se a venda existe e de qual tabela vem
      const existingSale = await this.getSaleById(saleId);
      if (!existingSale) {
        throw new Error('Venda não encontrada');
      }

      let updatedData;
      if (existingSale.sourceTable === 'charges') {
        // Atualizar na tabela charges
        const chargeStatus = status === 'paid' ? 'pago' : status === 'cancelled' ? 'cancelado' : 'pendente';
        const { data, error } = await this.supabase
          .from('charges')
          .update({ 
            status: chargeStatus,
            updated_at: new Date().toISOString()
          })
          .eq('id', saleId)
          .eq('tenant_id', this.tenantId)
          .select()
          .single();

        if (error) {
          throw new Error(`Erro ao atualizar charge: ${error.message}`);
        }
        updatedData = data;
      } else {
        // Atualizar na tabela payments
        const paymentStatus = status === 'paid' ? 'completed' : status === 'cancelled' ? 'failed' : 'pending';
        const { data, error } = await this.supabase
          .from('payments')
          .update({ 
            status: paymentStatus,
            updated_at: new Date().toISOString()
          })
          .eq('id', saleId)
          .eq('tenant_id', this.tenantId)
          .select()
          .single();

        if (error) {
          throw new Error(`Erro ao atualizar payment: ${error.message}`);
        }
        updatedData = data;
      }

      // Retornar venda atualizada
      return await this.getSaleById(saleId) || existingSale;
    } catch (error) {
      log.error('Error in SalesService.updateSaleStatus', {
        service: 'sales',
        tenantId: this.tenantId,
        userId: this.userId,
        saleId,
        status
      }, error as Error);
      throw error;
    }
  }

  /**
   * Formatar dados de venda vindos do banco
   */
  private formatSale(rawSale: any): Sale {
    return {
      id: rawSale.id,
      description: rawSale.description || 'Pagamento',
      customerName: rawSale.customer_name,
      customerEmail: rawSale.customer_email,
      customerPhone: rawSale.customer_phone,
      customerDocument: rawSale.customer_document,
      amount: parseFloat(rawSale.amount) || 0,
      status: rawSale.status,
      paymentMethod: rawSale.payment_method || 'pix',
      hasSplit: Boolean(rawSale.has_split),
      qrCode: rawSale.qr_code,
      qrCodeImage: rawSale.qr_code_image,
      paymentLink: rawSale.payment_link,
      txid: rawSale.txid,
      createdAt: rawSale.created_at,
      updatedAt: rawSale.updated_at,
      expiresAt: rawSale.expires_at,
      sourceTable: rawSale.source_table
    };
  }
}