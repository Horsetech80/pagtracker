'use client';

import { useState, useEffect, useCallback } from 'react';
import { WithdrawalNotification } from '@/lib/notifications/withdrawal';

interface UseNotificationsProps {
  userId: string;
  tenantId: string;
  autoRefresh?: boolean;
  refreshInterval?: number;
}

interface UseNotificationsReturn {
  notifications: WithdrawalNotification[];
  unreadCount: number;
  loading: boolean;
  error: string | null;
  fetchNotifications: () => Promise<void>;
  markAsRead: (notificationId: string) => Promise<void>;
  markAllAsRead: () => Promise<void>;
  refresh: () => void;
}

export function useNotifications({
  userId,
  tenantId,
  autoRefresh = true,
  refreshInterval = 30000
}: UseNotificationsProps): UseNotificationsReturn {
  const [notifications, setNotifications] = useState<WithdrawalNotification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Buscar notificações
  const fetchNotifications = useCallback(async () => {
    if (!userId || !tenantId) return;

    try {
      setLoading(true);
      setError(null);
      
      const response = await fetch('/api/notifications', {
        headers: {
          'x-user-id': userId,
          'x-tenant-id': tenantId
        }
      });

      if (!response.ok) {
        throw new Error(`Erro ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();
      
      if (data.success) {
        setNotifications(data.notifications || []);
        setUnreadCount(data.unreadCount || 0);
      } else {
        throw new Error(data.error || 'Erro ao buscar notificações');
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erro desconhecido';
      setError(errorMessage);
      console.error('Erro ao buscar notificações:', err);
    } finally {
      setLoading(false);
    }
  }, [userId, tenantId]);

  // Marcar notificação como lida
  const markAsRead = useCallback(async (notificationId: string) => {
    if (!userId || !tenantId) return;

    try {
      const response = await fetch('/api/notifications', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'x-user-id': userId,
          'x-tenant-id': tenantId
        },
        body: JSON.stringify({
          notification_id: notificationId,
          action: 'mark_as_read'
        })
      });

      if (!response.ok) {
        throw new Error(`Erro ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();
      
      if (data.success) {
        setNotifications(prev => 
          prev.map(notif => 
            notif.id === notificationId 
              ? { ...notif, read: true }
              : notif
          )
        );
        setUnreadCount(prev => Math.max(0, prev - 1));
      } else {
        throw new Error(data.error || 'Erro ao marcar notificação como lida');
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erro desconhecido';
      setError(errorMessage);
      console.error('Erro ao marcar como lida:', err);
    }
  }, [userId, tenantId]);

  // Marcar todas as notificações como lidas
  const markAllAsRead = useCallback(async () => {
    if (!userId || !tenantId) return;

    try {
      const response = await fetch('/api/notifications', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'x-user-id': userId,
          'x-tenant-id': tenantId
        },
        body: JSON.stringify({
          notification_id: '',
          action: 'mark_all_as_read'
        })
      });

      if (!response.ok) {
        throw new Error(`Erro ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();
      
      if (data.success) {
        setNotifications(prev => 
          prev.map(notif => ({ ...notif, read: true }))
        );
        setUnreadCount(0);
      } else {
        throw new Error(data.error || 'Erro ao marcar todas as notificações como lidas');
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erro desconhecido';
      setError(errorMessage);
      console.error('Erro ao marcar todas como lidas:', err);
    }
  }, [userId, tenantId]);

  // Função para forçar atualização
  const refresh = useCallback(() => {
    fetchNotifications();
  }, [fetchNotifications]);

  // Carregar notificações iniciais
  useEffect(() => {
    fetchNotifications();
  }, [fetchNotifications]);

  // Auto-refresh otimizado
  useEffect(() => {
    if (!autoRefresh || refreshInterval <= 0) return;

    // Mínimo de 30 segundos para evitar requisições excessivas
    const safeInterval = Math.max(refreshInterval, 30000);

    const interval = setInterval(() => {
      // Só faz refresh se a aba estiver ativa
      if (document.visibilityState === 'visible') {
        fetchNotifications();
      }
    }, safeInterval);

    return () => clearInterval(interval);
  }, [autoRefresh, refreshInterval, fetchNotifications]);

  return {
    notifications,
    unreadCount,
    loading,
    error,
    fetchNotifications,
    markAsRead,
    markAllAsRead,
    refresh
  };
}

// Hook simplificado para apenas contar notificações não lidas
export function useUnreadNotifications({
  userId,
  tenantId,
  refreshInterval = 60000
}: Pick<UseNotificationsProps, 'userId' | 'tenantId' | 'refreshInterval'>) {
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(false);

  const fetchUnreadCount = useCallback(async () => {
    if (!userId || !tenantId) return;

    try {
      setLoading(true);
      
      const response = await fetch(`/api/notifications?limit=1`, {
        headers: {
          'x-user-id': userId,
          'x-tenant-id': tenantId
        }
      });

      if (response.ok) {
        const data = await response.json();
        setUnreadCount(data.unreadCount || 0);
      }
    } catch (error) {
      console.error('Erro ao buscar contagem de não lidas:', error);
    } finally {
      setLoading(false);
    }
  }, [userId, tenantId]);

  useEffect(() => {
    fetchUnreadCount();
    
    const interval = setInterval(fetchUnreadCount, refreshInterval);
    return () => clearInterval(interval);
  }, [fetchUnreadCount, refreshInterval]);

  return {
    unreadCount,
    loading,
    refresh: fetchUnreadCount
  };
}