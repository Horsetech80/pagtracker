import { createClient } from '@/lib/supabase/server';
import { headers } from 'next/headers';

export interface AuditLog {
  id: string;
  tenant_id: string;
  user_id: string;
  admin_id?: string;
  action: string;
  resource_type: 'withdrawal_request' | 'wallet_transaction' | 'user_action' | 'admin_action';
  resource_id: string;
  old_values?: Record<string, any>;
  new_values?: Record<string, any>;
  ip_address?: string;
  user_agent?: string;
  risk_score?: number;
  fraud_indicators?: string[];
  metadata?: Record<string, any>;
  created_at: string;
}

export interface FraudCheck {
  is_suspicious: boolean;
  risk_score: number;
  indicators: string[];
  recommendations: string[];
}

export interface WithdrawalPattern {
  user_id: string;
  tenant_id: string;
  total_amount_24h: number;
  total_requests_24h: number;
  total_amount_7d: number;
  total_requests_7d: number;
  avg_amount: number;
  different_pix_keys_count: number;
  last_request_at?: string;
}

export interface FraudStatistics {
  total_suspicious_requests: number;
  avg_risk_score: number;
  top_fraud_indicators: Array<{
    indicator: string;
    count: number;
  }>;
  suspicious_requests_24h: number;
}

export class AuditService {
  private async getSupabaseClient() {
    return await createClient();
  }

  /**
   * Registra uma ação no log de auditoria
   */
  async logAction({
    tenant_id,
    user_id,
    admin_id,
    action,
    resource_type,
    resource_id,
    old_values,
    new_values,
    metadata
  }: Omit<AuditLog, 'id' | 'created_at' | 'ip_address' | 'user_agent' | 'risk_score' | 'fraud_indicators'>): Promise<AuditLog> {
    try {
      // Obter IP e User Agent do request
      const headersList = headers();
      const ip_address = headersList.get('x-forwarded-for') || headersList.get('x-real-ip') || 'unknown';
      const user_agent = headersList.get('user-agent') || 'unknown';

      // Calcular risk score se for uma solicitação de saque
      let risk_score: number | undefined;
      let fraud_indicators: string[] | undefined;
      
      if (resource_type === 'withdrawal_request' && action === 'create') {
        const fraudCheck = await this.performFraudCheck({
          user_id,
          tenant_id,
          amount: new_values?.amount || 0,
          pix_key: new_values?.pix_key || '',
          ip_address
        });
        
        risk_score = fraudCheck.risk_score;
        fraud_indicators = fraudCheck.indicators;
      }

      const supabase = await this.getSupabaseClient();
      const { data, error } = await supabase
        .from('audit_logs')
        .insert({
          tenant_id,
          user_id,
          admin_id,
          action,
          resource_type,
          resource_id,
          old_values,
          new_values,
          ip_address,
          user_agent,
          risk_score,
          fraud_indicators,
          metadata
        })
        .select()
        .single();

      if (error) {
        console.error('Erro ao registrar log de auditoria:', error);
        throw new Error('Falha ao registrar ação no log de auditoria');
      }

      return data;
    } catch (error) {
      console.error('Erro no serviço de auditoria:', error);
      throw error;
    }
  }

  /**
   * Realiza verificação anti-fraude para solicitações de saque
   */
  async performFraudCheck({
    tenant_id,
    user_id,
    amount,
    pix_key,
    ip_address,
    user_agent
  }: {
    tenant_id: string;
    user_id: string;
    amount: number;
    pix_key: string;
    ip_address?: string;
    user_agent?: string;
  }): Promise<FraudCheck> {
    const indicators: string[] = [];
    let risk_score = 0;
    const recommendations: string[] = [];

    try {
      // 1. Verificar padrões de saque do usuário
      const pattern = await this.getUserWithdrawalPattern(user_id, tenant_id);
      
      // 2. Verificar valor muito alto comparado ao histórico
      if (pattern.avg_amount > 0 && amount > pattern.avg_amount * 5) {
        indicators.push('amount_significantly_higher_than_average');
        risk_score += 30;
        recommendations.push('Verificar se o valor está correto');
      }

      // 3. Verificar frequência de saques (mais de 3 em 24h)
      if (pattern.total_requests_24h >= 3) {
        indicators.push('high_frequency_withdrawals_24h');
        risk_score += 25;
        recommendations.push('Usuário com alta frequência de saques');
      }

      // 4. Verificar valor total em 24h (mais de R$ 10.000)
      if (pattern.total_amount_24h + amount > 1000000) { // R$ 10.000 em centavos
        indicators.push('high_amount_24h');
        risk_score += 20;
        recommendations.push('Valor total em 24h excede limite recomendado');
      }

      // 5. Verificar múltiplas chaves PIX diferentes
      if (pattern.different_pix_keys_count >= 3) {
        indicators.push('multiple_different_pix_keys');
        risk_score += 15;
        recommendations.push('Usuário utiliza muitas chaves PIX diferentes');
      }

      // 6. Verificar se é uma chave PIX nova para o usuário
      const isNewPixKey = await this.isNewPixKeyForUser(user_id, tenant_id, pix_key);
      if (isNewPixKey) {
        indicators.push('new_pix_key');
        risk_score += 10;
        recommendations.push('Primeira vez usando esta chave PIX');
      }

      // 7. Verificar horário suspeito (madrugada)
      const hour = new Date().getHours();
      if (hour >= 0 && hour <= 5) {
        indicators.push('unusual_hour');
        risk_score += 5;
        recommendations.push('Solicitação feita em horário incomum');
      }

      // 8. Verificar IP suspeito (se disponível)
      if (ip_address) {
        const isNewIP = await this.isNewIPForUser(user_id, tenant_id, ip_address);
        if (isNewIP) {
          indicators.push('new_ip_address');
          risk_score += 10;
          recommendations.push('Primeiro acesso deste IP');
        }
      }

      // 9. Verificar valor muito baixo (possível teste)
      if (amount < 100) { // Menos de R$ 1,00
        indicators.push('very_low_amount');
        risk_score += 5;
        recommendations.push('Valor muito baixo - possível teste');
      }

      // 10. Verificar se último saque foi muito recente (menos de 1 hora)
      if (pattern.last_request_at) {
        const lastRequest = new Date(pattern.last_request_at);
        const hoursSinceLastRequest = (Date.now() - lastRequest.getTime()) / (1000 * 60 * 60);
        if (hoursSinceLastRequest < 1) {
          indicators.push('recent_withdrawal_request');
          risk_score += 15;
          recommendations.push('Solicitação muito próxima da anterior');
        }
      }

      return {
        is_suspicious: risk_score >= 50,
        risk_score: Math.min(risk_score, 100),
        indicators,
        recommendations
      };
    } catch (error) {
      console.error('Error in fraud check:', error);
      return {
        is_suspicious: false,
        risk_score: 0,
        indicators: ['fraud_check_error'],
        recommendations: ['Erro na verificação anti-fraude']
      };
    }
  }

  /**
   * Obtém padrão de saques do usuário
   */
  private async getUserWithdrawalPattern(user_id: string, tenant_id: string): Promise<WithdrawalPattern> {
    try {
      const supabase = await this.getSupabaseClient();
      const { data, error } = await supabase
        .rpc('get_user_withdrawal_pattern', {
          p_user_id: user_id,
          p_tenant_id: tenant_id
        });

      if (error) {
        console.error('Error getting withdrawal pattern:', error);
        return {
          user_id,
          tenant_id,
          total_amount_24h: 0,
          total_requests_24h: 0,
          total_amount_7d: 0,
          total_requests_7d: 0,
          avg_amount: 0,
          different_pix_keys_count: 0
        };
      }

      return data || {
        user_id,
        tenant_id,
        total_amount_24h: 0,
        total_requests_24h: 0,
        total_amount_7d: 0,
        total_requests_7d: 0,
        avg_amount: 0,
        different_pix_keys_count: 0
      };
    } catch (error) {
      console.error('Error in getUserWithdrawalPattern:', error);
      return {
        user_id,
        tenant_id,
        total_amount_24h: 0,
        total_requests_24h: 0,
        total_amount_7d: 0,
        total_requests_7d: 0,
        avg_amount: 0,
        different_pix_keys_count: 0
      };
    }
  }

  /**
   * Verifica se é uma chave PIX nova para o usuário
   */
  private async isNewPixKeyForUser(user_id: string, tenant_id: string, pix_key: string): Promise<boolean> {
    try {
      const supabase = await this.getSupabaseClient();
      const { data, error } = await supabase
        .from('withdrawal_requests')
        .select('id')
        .eq('user_id', user_id)
        .eq('tenant_id', tenant_id)
        .eq('pix_key', pix_key)
        .limit(1);

      if (error) {
        console.error('Error checking PIX key:', error);
        return false;
      }

      return !data || data.length === 0;
    } catch (error) {
      console.error('Error in isNewPixKeyForUser:', error);
      return false;
    }
  }

  /**
   * Verifica se é um IP novo para o usuário
   */
  private async isNewIPForUser(user_id: string, tenant_id: string, ip_address: string): Promise<boolean> {
    try {
      const supabase = await this.getSupabaseClient();
      const { data, error } = await supabase
        .from('audit_logs')
        .select('id')
        .eq('user_id', user_id)
        .eq('tenant_id', tenant_id)
        .eq('ip_address', ip_address)
        .gte('created_at', new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString()) // Últimos 30 dias
        .limit(1);

      if (error) {
        console.error('Error checking IP address:', error);
        return false;
      }

      return !data || data.length === 0;
    } catch (error) {
      console.error('Error in isNewIPForUser:', error);
      return false;
    }
  }

  /**
   * Obtém logs de auditoria com filtros
   */
  async getAuditLogs({
    tenant_id,
    user_id,
    admin_id,
    resource_type,
    action,
    start_date,
    end_date,
    page = 1,
    limit = 50
  }: {
    tenant_id?: string;
    user_id?: string;
    admin_id?: string;
    resource_type?: string;
    action?: string;
    start_date?: string;
    end_date?: string;
    page?: number;
    limit?: number;
  }): Promise<{ success: boolean; data?: { items: AuditLog[]; total: number }; error?: string }> {
    try {
      const supabase = await this.getSupabaseClient();
      let query = supabase
        .from('audit_logs')
        .select('*', { count: 'exact' })
        .order('created_at', { ascending: false });

      if (tenant_id) query = query.eq('tenant_id', tenant_id);
      if (user_id) query = query.eq('user_id', user_id);
      if (admin_id) query = query.eq('admin_id', admin_id);
      if (resource_type) query = query.eq('resource_type', resource_type);
      if (action) query = query.eq('action', action);
      if (start_date) query = query.gte('created_at', start_date);
      if (end_date) query = query.lte('created_at', end_date);

      const { data, error, count } = await query
        .range((page - 1) * limit, page * limit - 1);

      if (error) {
        console.error('Error getting audit logs:', error);
        return { success: false, error: error.message };
      }

      return {
        success: true,
        data: {
          items: data || [],
          total: count || 0
        }
      };
    } catch (error) {
      console.error('Error in getAuditLogs:', error);
      return { success: false, error: 'Internal server error' };
    }
  }

  /**
   * Obtém estatísticas de fraude
   */
  async getFraudStats(tenant_id?: string): Promise<{
    success: boolean;
    data?: {
      total_suspicious_requests: number;
      avg_risk_score: number;
      top_fraud_indicators: Array<{ indicator: string; count: number }>;
      suspicious_requests_24h: number;
    };
    error?: string;
  }> {
    try {
      const supabase = await this.getSupabaseClient();
      const { data, error } = await supabase
        .rpc('get_fraud_statistics', {
          p_tenant_id: tenant_id
        });

      if (error) {
        console.error('Error getting fraud stats:', error);
        return { success: false, error: error.message };
      }

      return { success: true, data: data || {} };
    } catch (error) {
      console.error('Error in getFraudStats:', error);
      return { success: false, error: 'Internal server error' };
    }
  }
}

export const auditService = new AuditService();