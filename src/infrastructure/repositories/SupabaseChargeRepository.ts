import { ChargeRepository } from '@/application/repositories/ChargeRepository';
import { ChargeEntity, ChargeData, Charge } from '@/entities/models/Charge';
import { DomainErrorFactory } from '@/entities/errors/DomainErrors';
import { createClient } from '@supabase/supabase-js';

/**
 * Implementação do Repositório usando Supabase - Camada Infrastructure
 * Remove dependências de mock e localStorage
 */
export class SupabaseChargeRepository implements ChargeRepository {
  private readonly supabase;

  constructor(supabaseClient?: any) {
    if (supabaseClient) {
      // Usar cliente fornecido (para APIs do servidor)
      this.supabase = supabaseClient;
    } else {
      // Fallback para inicialização direta (compatibilidade)
      const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://tqcxbiofslypocltpxmb.supabase.co';
      const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';
      
      if (!supabaseKey) {
        throw new Error('SUPABASE_SERVICE_ROLE_KEY não encontrada nas variáveis de ambiente');
      }

      this.supabase = createClient(supabaseUrl, supabaseKey, {
        auth: {
          autoRefreshToken: false,
          persistSession: false
        },
        db: {
          schema: 'public'
        },
        global: {
          headers: {
            'Authorization': `Bearer ${supabaseKey}`
          }
        }
      });
    }
  }

  async create(chargeData: ChargeData): Promise<ChargeEntity> {
    try {
      // Garantir que o tenant_id está presente nos dados
      if (!chargeData.tenant_id) {
        throw new Error('tenant_id é obrigatório para criar uma cobrança');
      }

      // Remover campos que não existem na tabela do banco
      const { amount, ...dataToInsert } = chargeData as any;

      const { data, error } = await this.supabase
        .from('charges')
        .insert(dataToInsert)
        .select()
        .single();

      if (error) {
        console.error('[SUPABASE_ERROR] Erro ao criar cobrança:', error);
        throw DomainErrorFactory.invalidCharge(`Erro ao criar cobrança: ${error.message}`);
      }

      if (!data) {
        throw DomainErrorFactory.invalidCharge('Nenhum dado retornado após criação da cobrança');
      }

      console.log('[SUPABASE_SUCCESS] Cobrança criada com sucesso:', data.id);
      return Charge(data);
    } catch (error) {
      console.error('[CREATE_CHARGE_ERROR] Erro no repositório:', error);
      throw error;
    }
  }

  async findById(id: string, tenantId: string): Promise<ChargeEntity | null> {
    const { data, error } = await this.supabase
      .from('charges')
      .select('*')
      .eq('id', id)
      .eq('tenant_id', tenantId)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return null; // Not found
      }
      throw DomainErrorFactory.invalidCharge(`Erro ao buscar cobrança: ${error.message}`);
    }

    return Charge(data);
  }

  async findByTxid(txid: string, tenantId: string): Promise<ChargeEntity | null> {
    const { data, error } = await this.supabase
      .from('charges')
      .select('*')
      .eq('txid', txid)
      .eq('tenant_id', tenantId)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return null; // Not found
      }
      throw DomainErrorFactory.invalidCharge(`Erro ao buscar cobrança: ${error.message}`);
    }

    return Charge(data);
  }

  async findByUserId(
    userId: string, 
    tenantId: string, 
    options?: {
      page?: number;
      limit?: number;
      status?: string;
    }
  ): Promise<{ charges: ChargeEntity[]; total: number }> {
    const page = options?.page || 1;
    const limit = options?.limit || 10;
    const offset = (page - 1) * limit;

    let query = this.supabase
      .from('charges')
      .select('*', { count: 'exact' })
      .eq('user_id', userId)
      .eq('tenant_id', tenantId)
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (options?.status) {
      query = query.eq('status', options.status);
    }

    const { data, error, count } = await query;

    if (error) {
      throw DomainErrorFactory.invalidCharge(`Erro ao listar cobranças: ${error.message}`);
    }

    const charges = data?.map((item: any) => Charge(item)) || [];

    return {
      charges,
      total: count || 0
    };
  }

  async update(id: string, updateData: Partial<ChargeData>, tenantId: string): Promise<ChargeEntity> {
    const { data, error } = await this.supabase
      .from('charges')
      .update({
        ...updateData,
        updated_at: new Date().toISOString()
      })
      .eq('id', id)
      .eq('tenant_id', tenantId)
      .select()
      .single();

    if (error) {
      throw DomainErrorFactory.invalidCharge(`Erro ao atualizar cobrança: ${error.message}`);
    }

    return Charge(data);
  }

  async delete(id: string, tenantId: string): Promise<void> {
    const { error } = await this.supabase
      .from('charges')
      .delete()
      .eq('id', id)
      .eq('tenant_id', tenantId);

    if (error) {
      throw DomainErrorFactory.invalidCharge(`Erro ao deletar cobrança: ${error.message}`);
    }
  }

  async updateStatus(txid: string, status: string, tenantId: string): Promise<ChargeEntity> {
    const { data, error } = await this.supabase
      .from('charges')
      .update({ 
        status, 
        updated_at: new Date().toISOString() 
      })
      .eq('txid', txid)
      .eq('tenant_id', tenantId)
      .select()
      .single();

    if (error) {
      throw DomainErrorFactory.invalidCharge(`Erro ao atualizar status: ${error.message}`);
    }

    return Charge(data);
  }
}