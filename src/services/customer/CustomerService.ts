import { BaseService } from '../core/BaseService';
import { createClient } from '@/lib/supabase/server';
import { log } from '@/lib/logger';
import { createError } from '@/lib/errors';

export interface Customer {
  id: string;
  tenant_id: string;
  name: string;
  email: string;
  document?: string;
  phone?: string;
  status: 'active' | 'inactive';
  first_purchase_date?: string;
  last_purchase_date?: string;
  total_orders: number;
  total_spent: number; // em centavos
  created_at: string;
  updated_at: string;
}

export interface CustomerStats {
  total_customers: number;
  new_this_month: number;
  active_customers: number;
  average_order_value: number; // em centavos
}

export interface CreateCustomerData {
  name: string;
  email: string;
  document?: string;
  phone?: string;
}

export interface UpdateCustomerData {
  name?: string;
  email?: string;
  document?: string;
  phone?: string;
  status?: 'active' | 'inactive';
}

export interface CustomerFilters {
  status?: 'active' | 'inactive' | 'all';
  search?: string; // busca por nome, email ou documento
  sort?: 'recent' | 'name' | 'value';
}

/**
 * Serviço de Clientes - PagTracker v4.0
 * 
 * Gerencia clientes extraindo dados das tabelas charges e payments,
 * criando uma vista consolidada de clientes únicos.
 */
export class CustomerService extends BaseService {
  constructor(tenantId: string, userId: string) {
    super(tenantId, userId);
  }

  /**
   * Remove dados sensíveis antes de retornar para o cliente
   */
  protected sanitizeOutput<T>(data: T): Partial<T> {
    return data;
  }

  /**
   * Obtém estatísticas dos clientes
   */
  async getStats(): Promise<CustomerStats> {
    const supabase = await createClient();
    
    try {
      // Query otimizada para buscar estatísticas consolidadas
      const { data: statsData, error } = await supabase.rpc('get_customer_stats', {
        tenant_id_param: this.tenantId
      });

      if (error) {
        log.error('Erro ao buscar estatísticas de clientes', {
          service: 'CustomerService',
          method: 'getStats',
          tenantId: this.tenantId,
          userId: this.userId,
          error: error.message
        });
        throw createError.database('Erro ao buscar estatísticas de clientes', error instanceof Error ? error : undefined);
      }

      return statsData?.[0] || this.getEmptyStats();
    } catch (error) {
      log.error('Erro ao buscar estatísticas de clientes', {
        service: 'CustomerService',
        method: 'getStats',
        tenantId: this.tenantId,
        userId: this.userId,
        error: error instanceof Error ? error.message : String(error)
      });
      throw createError.database('Erro ao buscar estatísticas de clientes', error instanceof Error ? error : undefined);
    }
  }

  /**
   * Lista clientes com filtros
   */
  async getCustomers(filters: CustomerFilters = {}, page = 1, limit = 20): Promise<{
    customers: Customer[];
    total: number;
    hasMore: boolean;
  }> {
    const supabase = await createClient();
    const offset = (page - 1) * limit;

    try {
      // Query consolidada que extrai clientes únicos de charges e payments
      const query = { user_id: this.userId, ...filters };
      const queryConsolidated = supabase.rpc('get_customers_consolidated', {
        tenant_id_param: this.tenantId,
        search_param: query.search || null,
        status_param: query.status === 'all' ? null : query.status,
        sort_param: query.sort || 'recent',
        limit_param: limit,
        offset_param: offset
      });

      const { data: customers, error } = await queryConsolidated;

      if (error) {
        log.error('Erro ao buscar clientes', {
          service: 'CustomerService',
          method: 'getCustomers',
          tenantId: this.tenantId,
          userId: this.userId,
          filters,
          page,
          limit,
          error: error.message
        });
        throw createError.database('Erro ao buscar clientes', error instanceof Error ? error : undefined);
      }

      // Buscar total de registros
      const { data: countData, error: countError } = await supabase.rpc('count_customers_consolidated', {
        tenant_id_param: this.tenantId,
        search_param: query.search || null,
        status_param: query.status === 'all' ? null : query.status
      });

      const total = countError ? 0 : (countData?.[0]?.count || 0);
      const hasMore = offset + customers.length < total;

      return {
        customers: customers || [],
        total,
        hasMore
      };
    } catch (error) {
      log.error('Erro ao buscar clientes', {
        service: 'CustomerService',
        method: 'getCustomers',
        tenantId: this.tenantId,
        userId: this.userId,
        filters,
        page,
        limit,
        error: error instanceof Error ? error.message : String(error)
      });
      throw createError.database('Erro ao buscar clientes', error instanceof Error ? error : undefined);
    }
  }

  /**
   * Busca um cliente por ID (email como identificador único)
   */
  async getCustomerById(email: string): Promise<Customer | null> {
    const supabase = await createClient();

    try {
      const { data, error } = await supabase.rpc('get_customer_by_email', {
        tenant_id_param: this.tenantId,
        email_param: email
      });

      if (error) {
        log.error('Erro ao buscar cliente por email', {
          service: 'CustomerService',
          method: 'getCustomerById',
          tenantId: this.tenantId,
          userId: this.userId,
          email,
          error: error.message
        });
        throw createError.database('Erro ao buscar cliente por email', error instanceof Error ? error : undefined);
      }

      return data?.[0] || null;
    } catch (error) {
      log.error('Erro ao buscar cliente por email', {
        service: 'CustomerService',
        method: 'getCustomerById',
        tenantId: this.tenantId,
        userId: this.userId,
        email,
        error: error instanceof Error ? error.message : String(error)
      });
      throw createError.database('Erro ao buscar cliente por email', error instanceof Error ? error : undefined);
    }
  }

  /**
   * Cria um novo cliente
   */
  async createCustomer(data: CreateCustomerData): Promise<Customer> {
    // Validações
    if (!data.name || !data.email) {
      throw new Error('Nome e email são obrigatórios');
    }

    if (!this.isValidEmail(data.email)) {
      throw new Error('Email inválido');
    }

    // Verificar se cliente já existe
    const existingCustomer = await this.getCustomerById(data.email);
    if (existingCustomer) {
      throw new Error('Cliente com este email já existe');
    }

    const supabase = await createClient();

    try {
      // Inserir na tabela charges como um registro "virtual" para criar o cliente
      const now = new Date().toISOString();
      const { data: result, error } = await supabase
        .from('charges')
        .insert({
          id: `customer_${Date.now()}`,
          tenant_id: this.tenantId,
          user_id: this.userId,
          valor: 0, // Valor zero para cliente virtual
          descricao: 'Cliente criado manualmente',
          status: 'cancelled', // Status especial para clientes virtuais
          txid: `virtual_${Date.now()}`,
          qr_code: '',
          qr_code_image: '',
          link_pagamento: '',
          cliente_nome: data.name,
          cliente_email: data.email,
          cliente_cpf: data.document,
          cliente_telefone: data.phone,
          created_at: now,
          updated_at: now
        })
        .select()
        .single();

      if (error) {
        log.error('Erro ao criar cliente', {
          service: 'CustomerService',
          method: 'createCustomer',
          tenantId: this.tenantId,
          userId: this.userId,
          data,
          error: error.message
        });
        throw createError.database('Erro ao criar cliente', error instanceof Error ? error : undefined);
      }

      // Retornar cliente formatado
      return this.formatCustomerFromCharge(result);
    } catch (error) {
      log.error('Erro ao criar cliente', {
        service: 'CustomerService',
        method: 'createCustomer',
        tenantId: this.tenantId,
        userId: this.userId,
        data,
        error: error instanceof Error ? error.message : String(error)
      });
      throw createError.database('Erro ao criar cliente', error instanceof Error ? error : undefined);
    }
  }

  /**
   * Atualiza um cliente
   */
  async updateCustomer(email: string, data: UpdateCustomerData): Promise<Customer> {
    const supabase = await createClient();

    try {
      // Atualizar todos os registros do cliente
      const { error } = await supabase
        .from('charges')
        .update({
          cliente_nome: data.name,
          cliente_cpf: data.document,
          cliente_telefone: data.phone,
          updated_at: new Date().toISOString()
        })
        .eq('tenant_id', this.tenantId)
        .eq('cliente_email', email);

      if (error) {
        log.error('Erro ao atualizar cliente', {
          service: 'CustomerService',
          method: 'updateCustomer',
          tenantId: this.tenantId,
          userId: this.userId,
          email,
          data,
          error: error.message
        });
        throw createError.database('Erro ao atualizar cliente', error instanceof Error ? error : undefined);
      }

      // Buscar cliente atualizado
      const updatedCustomer = await this.getCustomerById(email);
      if (!updatedCustomer) {
        throw new Error('Cliente não encontrado após atualização');
      }

      return updatedCustomer;
    } catch (error) {
      log.error('Erro ao atualizar cliente', {
        service: 'CustomerService',
        method: 'updateCustomer',
        tenantId: this.tenantId,
        userId: this.userId,
        email,
        data,
        error: error instanceof Error ? error.message : String(error)
      });
      throw createError.database('Erro ao atualizar cliente', error instanceof Error ? error : undefined);
    }
  }

  /**
   * Remove um cliente (marca como inativo)
   */
  async deleteCustomer(email: string): Promise<boolean> {
    return this.updateCustomer(email, { status: 'inactive' }).then(() => true).catch(() => false);
  }

  // Métodos auxiliares privados

  private getFallbackStats(): CustomerStats {
    return {
      total_customers: 0,
      new_this_month: 0,
      active_customers: 0,
      average_order_value: 0
    };
  }

  private getEmptyStats(): CustomerStats {
    return {
      total_customers: 0,
      new_this_month: 0,
      active_customers: 0,
      average_order_value: 0
    };
  }

  private isValidEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }

  private formatCustomerFromCharge(charge: any): Customer {
    return {
      id: charge.cliente_email,
      tenant_id: charge.tenant_id,
      name: charge.cliente_nome,
      email: charge.cliente_email,
      document: charge.cliente_cpf,
      phone: charge.cliente_telefone,
      status: 'active',
      first_purchase_date: charge.created_at,
      last_purchase_date: charge.created_at,
      total_orders: 1,
      total_spent: charge.valor || 0,
      created_at: charge.created_at,
      updated_at: charge.updated_at
    };
  }
}