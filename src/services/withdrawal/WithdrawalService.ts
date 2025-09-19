import { BaseService } from '../core/BaseService';
import { SupabaseRepository } from '../core/SupabaseRepository';
import { PaginatedResponse } from '@/types/admin';

export interface ServiceResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

export interface WithdrawalRequest {
  id: string;
  tenant_id: string;
  user_id: string;
  amount: number; // in cents
  fee_amount: number; // in cents
  net_amount: number; // in cents
  pix_key?: string;
  pix_key_type?: 'cpf' | 'cnpj' | 'email' | 'phone' | 'random';
  bank_details?: any;
  description?: string;
  status: 'pending' | 'approved' | 'rejected' | 'processing' | 'completed' | 'failed';
  requested_at: string;
  processed_at?: string;
  completed_at?: string;
  processed_by?: string;
  admin_notes?: string;
  rejection_reason?: string;
  efipay_transaction_id?: string;
  efipay_response?: any;
  ip_address?: string;
  user_agent?: string;
  created_at: string;
  updated_at: string;
}

export interface CreateWithdrawalRequestData {
  amount: number; // in cents
  pix_key: string;
  pix_key_type: 'cpf' | 'cnpj' | 'email' | 'phone' | 'random';
  description?: string;
  ip_address?: string;
  user_agent?: string;
}

export interface WithdrawalValidation {
  valid: boolean;
  error?: string;
  available_balance: number;
  requested_amount: number;
}

export interface ProcessWithdrawalData {
  action: 'approve' | 'reject';
  admin_notes?: string;
  rejection_reason?: string;
}

export class WithdrawalService extends BaseService {
  private repository: SupabaseRepository<WithdrawalRequest>;

  constructor(
    tenantId: string,
    userId: string,
    supabaseUrl?: string,
    supabaseKey?: string
  ) {
    super(tenantId, userId);
    
    this.repository = new SupabaseRepository<WithdrawalRequest>(
      supabaseUrl || process.env.NEXT_PUBLIC_SUPABASE_URL!,
      supabaseKey || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      'withdrawal_requests'
    );
  }

  /**
   * Validates if a withdrawal request is possible
   */
  async validateWithdrawal(amount: number): Promise<ServiceResponse<WithdrawalValidation>> {
    try {
      const { data, error } = await this.repository.getClient()
        .rpc('validate_withdrawal_request', {
          p_tenant_id: this.tenantId,
          p_user_id: this.userId,
          p_amount: amount
        });

      if (error) {
        console.error('Error validating withdrawal:', error);
        return {
          success: false,
          error: 'Erro ao validar solicitação de saque'
        };
      }

      return {
        success: true,
        data: data as WithdrawalValidation
      };
    } catch (error) {
      console.error('Error validating withdrawal:', error);
      return {
        success: false,
        error: 'Erro interno do servidor'
      };
    }
  }

  /**
   * Calculates withdrawal fee for a given amount
   */
  async calculateFee(amount: number): Promise<ServiceResponse<number>> {
    try {
      const { data, error } = await this.repository.getClient()
        .rpc('calculate_withdrawal_fee', {
          amount_cents: amount
        });

      if (error) {
        console.error('Error calculating fee:', error);
        return {
          success: false,
          error: 'Erro ao calcular taxa de saque'
        };
      }

      return {
        success: true,
        data: data as number
      };
    } catch (error) {
      console.error('Error calculating fee:', error);
      return {
        success: false,
        error: 'Erro interno do servidor'
      };
    }
  }

  /**
   * Creates a new withdrawal request
   */
  async createWithdrawalRequest(
    requestData: CreateWithdrawalRequestData
  ): Promise<ServiceResponse<WithdrawalRequest>> {
    try {
      // First validate the withdrawal
      const validation = await this.validateWithdrawal(requestData.amount);
      if (!validation.success || !validation.data?.valid) {
        return {
          success: false,
          error: validation.data?.error || 'Solicitação de saque inválida'
        };
      }

      // Calculate fee
      const feeResult = await this.calculateFee(requestData.amount);
      if (!feeResult.success || feeResult.data === undefined) {
        return {
          success: false,
          error: 'Erro ao calcular taxa de saque'
        };
      }

      const fee_amount = feeResult.data;
      const net_amount = requestData.amount - fee_amount;

      // Create the withdrawal request
      const withdrawalData = {
        tenant_id: this.tenantId,
        user_id: this.userId,
        amount: requestData.amount,
        fee_amount,
        net_amount,
        pix_key: requestData.pix_key,
        pix_key_type: requestData.pix_key_type,
        description: requestData.description,
        ip_address: requestData.ip_address,
        user_agent: requestData.user_agent,
        status: 'pending' as const
      };

      const { data, error } = await this.repository.getClient()
         .from('withdrawal_requests')
         .insert(withdrawalData)
         .select()
         .single();

      if (error) {
        console.error('Error creating withdrawal request:', error);
        return {
          success: false,
          error: 'Erro ao criar solicitação de saque'
        };
      }

      return {
        success: true,
        data: data as WithdrawalRequest
      };
    } catch (error) {
      console.error('Error creating withdrawal request:', error);
      return {
        success: false,
        error: 'Erro interno do servidor'
      };
    }
  }

  /**
   * Gets withdrawal requests with pagination and filters
   */
  async getWithdrawalRequests(
    page: number = 1,
    limit: number = 20,
    status?: string
  ): Promise<ServiceResponse<PaginatedResponse<WithdrawalRequest>>> {
    try {
      const { data, error } = await this.repository.getClient()
         .rpc('get_withdrawal_requests', {
           p_tenant_id: this.tenantId,
           p_status: status,
           p_page: page,
           p_limit: limit
         });

      if (error) {
        console.error('Error fetching withdrawal requests:', error);
        return {
          success: false,
          error: 'Erro ao buscar solicitações de saque'
        };
      }

      return {
        success: true,
        data: data as PaginatedResponse<WithdrawalRequest>
      };
    } catch (error) {
      console.error('Error fetching withdrawal requests:', error);
      return {
        success: false,
        error: 'Erro interno do servidor'
      };
    }
  }

  /**
   * Gets all withdrawal requests (admin only)
   */
  async getAllWithdrawalRequests(
    page: number = 1,
    limit: number = 20,
    status?: string
  ): Promise<ServiceResponse<PaginatedResponse<WithdrawalRequest>>> {
    try {
      const { data, error } = await this.repository.getClient()
         .rpc('get_withdrawal_requests', {
           p_tenant_id: null, // null means all tenants
           p_status: status,
           p_page: page,
           p_limit: limit
         });

      if (error) {
        console.error('Error fetching all withdrawal requests:', error);
        return {
          success: false,
          error: 'Erro ao buscar solicitações de saque'
        };
      }

      return {
        success: true,
        data: data as PaginatedResponse<WithdrawalRequest>
      };
    } catch (error) {
      console.error('Error fetching all withdrawal requests:', error);
      return {
        success: false,
        error: 'Erro interno do servidor'
      };
    }
  }

  /**
   * Processes a withdrawal request (admin only)
   */
  async processWithdrawalRequest(
    withdrawalId: string,
    processData: ProcessWithdrawalData,
    adminUserId: string
  ): Promise<ServiceResponse<WithdrawalRequest>> {
    try {
      const updateData: any = {
        status: processData.action === 'approve' ? 'approved' : 'rejected',
        processed_at: new Date().toISOString(),
        processed_by: adminUserId,
        admin_notes: processData.admin_notes
      };

      if (processData.action === 'reject' && processData.rejection_reason) {
        updateData.rejection_reason = processData.rejection_reason;
      }

      const { data, error } = await this.repository.getClient()
         .from('withdrawal_requests')
         .update(updateData)
         .eq('id', withdrawalId)
         .select()
         .single();

      if (error) {
        console.error('Error processing withdrawal request:', error);
        return {
          success: false,
          error: 'Erro ao processar solicitação de saque'
        };
      }

      return {
        success: true,
        data: data as WithdrawalRequest
      };
    } catch (error) {
      console.error('Error processing withdrawal request:', error);
      return {
        success: false,
        error: 'Erro interno do servidor'
      };
    }
  }

  /**
   * Updates withdrawal request with EfiPay transaction details
   */
  async updateWithEfiPayTransaction(
    withdrawalId: string,
    transactionId: string,
    response: any,
    status: 'processing' | 'completed' | 'failed'
  ): Promise<ServiceResponse<WithdrawalRequest>> {
    try {
      const updateData: any = {
        efipay_transaction_id: transactionId,
        efipay_response: response,
        status
      };

      if (status === 'completed') {
        updateData.completed_at = new Date().toISOString();
      }

      const { data, error } = await this.repository.getClient()
        .from('withdrawal_requests')
        .update(updateData)
        .eq('id', withdrawalId)
        .select()
        .single();

      if (error) {
        console.error('Error updating withdrawal with EfiPay data:', error);
        return {
          success: false,
          error: 'Erro ao atualizar solicitação de saque'
        };
      }

      return {
        success: true,
        data: data as WithdrawalRequest
      };
    } catch (error) {
      console.error('Error updating withdrawal with EfiPay data:', error);
      return {
        success: false,
        error: 'Erro interno do servidor'
      };
    }
  }

  /**
   * Gets withdrawal statistics for a tenant
   */
  async getWithdrawalStats(): Promise<ServiceResponse<any>> {
    try {
      const { data, error } = await this.repository.getClient()
         .from('withdrawal_requests')
         .select('status, amount, created_at')
         .eq('tenant_id', this.tenantId);

      if (error) {
        console.error('Error fetching withdrawal stats:', error);
        return {
          success: false,
          error: 'Erro ao buscar estatísticas de saque'
        };
      }

      const stats = {
        total_requests: data.length,
        pending_requests: data.filter(w => w.status === 'pending').length,
        approved_requests: data.filter(w => w.status === 'approved').length,
        completed_requests: data.filter(w => w.status === 'completed').length,
        rejected_requests: data.filter(w => w.status === 'rejected').length,
        total_amount: data.reduce((sum, w) => sum + w.amount, 0),
        pending_amount: data
          .filter(w => ['pending', 'approved', 'processing'].includes(w.status))
          .reduce((sum, w) => sum + w.amount, 0)
      };

      return {
        success: true,
        data: stats
      };
    } catch (error) {
      console.error('Error fetching withdrawal stats:', error);
      return {
        success: false,
        error: 'Erro interno do servidor'
      };
    }
  }

  /**
   * Creates a new instance for a different tenant/user
   */
  static createWithSupabase(
    tenantId: string,
    userId: string,
    supabaseUrl?: string,
    supabaseKey?: string
  ): WithdrawalService {
    return new WithdrawalService(tenantId, userId, supabaseUrl, supabaseKey);
  }

  protected sanitizeOutput<T>(data: T): Partial<T> {
    // Remove sensitive fields from output
    if (typeof data === 'object' && data !== null) {
      const sanitized = { ...data } as any;
      delete sanitized.tenant_id;
      delete sanitized.ip_address;
      delete sanitized.user_agent;
      return sanitized;
    }
    return data as Partial<T>;
  }
}

export default WithdrawalService;