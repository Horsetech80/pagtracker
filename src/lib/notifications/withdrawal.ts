import { createServiceClient } from '@/lib/supabase/server';

// Tipos de notificação para saques
export type WithdrawalNotificationType = 
  | 'withdrawal_requested'
  | 'withdrawal_approved'
  | 'withdrawal_rejected'
  | 'withdrawal_processing'
  | 'withdrawal_completed'
  | 'withdrawal_failed';

// Interface para dados da notificação
export interface WithdrawalNotificationData {
  withdrawal_id: string;
  user_id: string;
  tenant_id: string;
  amount_cents: number;
  status: string;
  admin_notes?: string;
  rejection_reason?: string;
  efipay_transaction_id?: string;
  created_at?: string;
  processed_at?: string;
}

// Interface para notificação completa
export interface WithdrawalNotification {
  id: string;
  type: WithdrawalNotificationType;
  title: string;
  message: string;
  data: WithdrawalNotificationData;
  read: boolean;
  created_at: string;
}

// Classe principal para gerenciar notificações de saque
export class WithdrawalNotificationService {
  private supabase = createServiceClient();

  /**
   * Criar notificação para solicitação de saque
   */
  async notifyWithdrawalRequested(data: WithdrawalNotificationData): Promise<void> {
    const notification = {
      type: 'withdrawal_requested' as WithdrawalNotificationType,
      title: 'Saque Solicitado',
      message: `Solicitação de saque de R$ ${(data.amount_cents / 100).toFixed(2)} foi criada e está aguardando aprovação.`,
      data,
      user_id: data.user_id,
      tenant_id: data.tenant_id,
      read: false,
      created_at: new Date().toISOString()
    };

    await this.createNotification(notification);
    
    // Notificar administradores
    await this.notifyAdmins({
      type: 'withdrawal_requested',
      title: 'Nova Solicitação de Saque',
      message: `Nova solicitação de saque de R$ ${(data.amount_cents / 100).toFixed(2)} aguardando aprovação.`,
      data,
      tenant_id: data.tenant_id
    });
  }

  /**
   * Criar notificação para saque aprovado
   */
  async notifyWithdrawalApproved(data: WithdrawalNotificationData): Promise<void> {
    const notification = {
      type: 'withdrawal_approved' as WithdrawalNotificationType,
      title: 'Saque Aprovado',
      message: `Seu saque de R$ ${(data.amount_cents / 100).toFixed(2)} foi aprovado e está sendo processado.`,
      data,
      user_id: data.user_id,
      tenant_id: data.tenant_id,
      read: false,
      created_at: new Date().toISOString()
    };

    await this.createNotification(notification);
  }

  /**
   * Criar notificação para saque rejeitado
   */
  async notifyWithdrawalRejected(data: WithdrawalNotificationData): Promise<void> {
    const notification = {
      type: 'withdrawal_rejected' as WithdrawalNotificationType,
      title: 'Saque Rejeitado',
      message: `Seu saque de R$ ${(data.amount_cents / 100).toFixed(2)} foi rejeitado. ${data.rejection_reason ? `Motivo: ${data.rejection_reason}` : ''}`,
      data,
      user_id: data.user_id,
      tenant_id: data.tenant_id,
      read: false,
      created_at: new Date().toISOString()
    };

    await this.createNotification(notification);
  }

  /**
   * Criar notificação para saque em processamento
   */
  async notifyWithdrawalProcessing(data: WithdrawalNotificationData): Promise<void> {
    const notification = {
      type: 'withdrawal_processing' as WithdrawalNotificationType,
      title: 'Saque em Processamento',
      message: `Seu saque de R$ ${(data.amount_cents / 100).toFixed(2)} está sendo processado via PIX.`,
      data,
      user_id: data.user_id,
      tenant_id: data.tenant_id,
      read: false,
      created_at: new Date().toISOString()
    };

    await this.createNotification(notification);
  }

  /**
   * Criar notificação para saque concluído
   */
  async notifyWithdrawalCompleted(data: WithdrawalNotificationData): Promise<void> {
    const notification = {
      type: 'withdrawal_completed' as WithdrawalNotificationType,
      title: 'Saque Concluído',
      message: `Seu saque de R$ ${(data.amount_cents / 100).toFixed(2)} foi concluído com sucesso!`,
      data,
      user_id: data.user_id,
      tenant_id: data.tenant_id,
      read: false,
      created_at: new Date().toISOString()
    };

    await this.createNotification(notification);
  }

  /**
   * Criar notificação para saque falhado
   */
  async notifyWithdrawalFailed(data: WithdrawalNotificationData): Promise<void> {
    const notification = {
      type: 'withdrawal_failed' as WithdrawalNotificationType,
      title: 'Falha no Saque',
      message: `Houve um problema ao processar seu saque de R$ ${(data.amount_cents / 100).toFixed(2)}. Entre em contato com o suporte.`,
      data,
      user_id: data.user_id,
      tenant_id: data.tenant_id,
      read: false,
      created_at: new Date().toISOString()
    };

    await this.createNotification(notification);
  }

  /**
   * Buscar notificações do usuário
   */
  async getUserNotifications(userId: string, tenantId: string, limit: number = 20): Promise<WithdrawalNotification[]> {
    try {
      const { data, error } = await this.supabase
        .from('notifications')
        .select('*')
        .eq('user_id', userId)
        .eq('tenant_id', tenantId)
        .order('created_at', { ascending: false })
        .limit(limit);

      if (error) {
        console.error('Erro ao buscar notificações:', error);
        return [];
      }

      return data || [];
    } catch (error) {
      console.error('Erro ao buscar notificações:', error);
      return [];
    }
  }

  /**
   * Marcar notificação como lida
   */
  async markAsRead(notificationId: string, userId: string): Promise<boolean> {
    try {
      const { error } = await this.supabase
        .from('notifications')
        .update({ read: true })
        .eq('id', notificationId)
        .eq('user_id', userId);

      if (error) {
        console.error('Erro ao marcar notificação como lida:', error);
        return false;
      }

      return true;
    } catch (error) {
      console.error('Erro ao marcar notificação como lida:', error);
      return false;
    }
  }

  /**
   * Marcar todas as notificações como lidas
   */
  async markAllAsRead(userId: string, tenantId: string): Promise<boolean> {
    try {
      const { error } = await this.supabase
        .from('notifications')
        .update({ read: true })
        .eq('user_id', userId)
        .eq('tenant_id', tenantId)
        .eq('read', false);

      if (error) {
        console.error('Erro ao marcar todas as notificações como lidas:', error);
        return false;
      }

      return true;
    } catch (error) {
      console.error('Erro ao marcar todas as notificações como lidas:', error);
      return false;
    }
  }

  /**
   * Contar notificações não lidas
   */
  async getUnreadCount(userId: string, tenantId: string): Promise<number> {
    try {
      const { count, error } = await this.supabase
        .from('notifications')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', userId)
        .eq('tenant_id', tenantId)
        .eq('read', false);

      if (error) {
        console.error('Erro ao contar notificações não lidas:', error);
        return 0;
      }

      return count || 0;
    } catch (error) {
      console.error('Erro ao contar notificações não lidas:', error);
      return 0;
    }
  }

  /**
   * Criar notificação no banco de dados
   */
  private async createNotification(notification: any): Promise<void> {
    try {
      const { error } = await this.supabase
        .from('notifications')
        .insert(notification);

      if (error) {
        console.error('Erro ao criar notificação:', error);
      }
    } catch (error) {
      console.error('Erro ao criar notificação:', error);
    }
  }

  /**
   * Notificar administradores sobre eventos de saque
   */
  private async notifyAdmins(notification: {
    type: WithdrawalNotificationType;
    title: string;
    message: string;
    data: WithdrawalNotificationData;
    tenant_id: string;
  }): Promise<void> {
    try {
      // Buscar administradores do tenant
      const { data: admins, error } = await this.supabase
        .from('users')
        .select('id')
        .eq('tenant_id', notification.tenant_id)
        .in('role', ['admin', 'owner']);

      if (error || !admins) {
        console.error('Erro ao buscar administradores:', error);
        return;
      }

      // Criar notificação para cada administrador
      const adminNotifications = admins.map(admin => ({
        ...notification,
        user_id: admin.id,
        read: false,
        created_at: new Date().toISOString()
      }));

      if (adminNotifications.length > 0) {
        const { error: insertError } = await this.supabase
          .from('notifications')
          .insert(adminNotifications);

        if (insertError) {
          console.error('Erro ao criar notificações para administradores:', insertError);
        }
      }
    } catch (error) {
      console.error('Erro ao notificar administradores:', error);
    }
  }
}

// Instância singleton do serviço
export const withdrawalNotificationService = new WithdrawalNotificationService();

// Função utilitária para enviar notificação baseada no status
export async function notifyWithdrawalStatusChange(
  withdrawal: any,
  previousStatus?: string
): Promise<void> {
  const notificationData: WithdrawalNotificationData = {
    withdrawal_id: withdrawal.id,
    user_id: withdrawal.user_id,
    tenant_id: withdrawal.tenant_id,
    amount_cents: withdrawal.amount_cents,
    status: withdrawal.status,
    admin_notes: withdrawal.admin_notes,
    rejection_reason: withdrawal.rejection_reason,
    efipay_transaction_id: withdrawal.efipay_transaction_id,
    created_at: withdrawal.created_at,
    processed_at: withdrawal.processed_at
  };

  switch (withdrawal.status) {
    case 'pending':
      if (!previousStatus) {
        await withdrawalNotificationService.notifyWithdrawalRequested(notificationData);
      }
      break;
    
    case 'approved':
      await withdrawalNotificationService.notifyWithdrawalApproved(notificationData);
      break;
    
    case 'rejected':
      await withdrawalNotificationService.notifyWithdrawalRejected(notificationData);
      break;
    
    case 'processing':
      await withdrawalNotificationService.notifyWithdrawalProcessing(notificationData);
      break;
    
    case 'completed':
      await withdrawalNotificationService.notifyWithdrawalCompleted(notificationData);
      break;
    
    case 'failed':
      await withdrawalNotificationService.notifyWithdrawalFailed(notificationData);
      break;
  }
}