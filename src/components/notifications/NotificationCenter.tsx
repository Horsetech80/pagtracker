'use client';

import { useState, useEffect } from 'react';
import { Bell, Check, CheckCheck, X, Clock, AlertCircle, DollarSign } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Separator } from '@/components/ui/separator';
import { toast } from 'sonner';
import { WithdrawalNotification, WithdrawalNotificationType } from '@/lib/notifications/withdrawal';
import { formatCurrency } from '@/lib/utils';

interface NotificationCenterProps {
  userId: string;
  tenantId: string;
}

export function NotificationCenter({ userId, tenantId }: NotificationCenterProps) {
  const [notifications, setNotifications] = useState<WithdrawalNotification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);

  // Buscar notificações
  const fetchNotifications = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/notifications', {
        headers: {
          'x-user-id': userId,
          'x-tenant-id': tenantId
        }
      });

      if (response.ok) {
        const data = await response.json();
        setNotifications(data.notifications || []);
        setUnreadCount(data.unreadCount || 0);
      }
    } catch (error) {
      console.error('Erro ao buscar notificações:', error);
    } finally {
      setLoading(false);
    }
  };

  // Marcar notificação como lida
  const markAsRead = async (notificationId: string) => {
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

      if (response.ok) {
        setNotifications(prev => 
          prev.map(notif => 
            notif.id === notificationId 
              ? { ...notif, read: true }
              : notif
          )
        );
        setUnreadCount(prev => Math.max(0, prev - 1));
      }
    } catch (error) {
      console.error('Erro ao marcar como lida:', error);
    }
  };

  // Marcar todas como lidas
  const markAllAsRead = async () => {
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

      if (response.ok) {
        setNotifications(prev => 
          prev.map(notif => ({ ...notif, read: true }))
        );
        setUnreadCount(0);
        toast.success('Todas as notificações foram marcadas como lidas');
      }
    } catch (error) {
      console.error('Erro ao marcar todas como lidas:', error);
      toast.error('Erro ao marcar notificações como lidas');
    }
  };

  // Obter ícone da notificação
  const getNotificationIcon = (type: WithdrawalNotificationType) => {
    switch (type) {
      case 'withdrawal_requested':
        return <Clock className="h-4 w-4 text-blue-500" />;
      case 'withdrawal_approved':
        return <Check className="h-4 w-4 text-green-500" />;
      case 'withdrawal_rejected':
        return <X className="h-4 w-4 text-red-500" />;
      case 'withdrawal_processing':
        return <Clock className="h-4 w-4 text-yellow-500" />;
      case 'withdrawal_completed':
        return <CheckCheck className="h-4 w-4 text-green-600" />;
      case 'withdrawal_failed':
        return <AlertCircle className="h-4 w-4 text-red-600" />;
      default:
        return <DollarSign className="h-4 w-4 text-gray-500" />;
    }
  };

  // Obter cor do badge
  const getBadgeVariant = (type: WithdrawalNotificationType) => {
    switch (type) {
      case 'withdrawal_requested':
        return 'secondary';
      case 'withdrawal_approved':
        return 'default';
      case 'withdrawal_rejected':
        return 'destructive';
      case 'withdrawal_processing':
        return 'secondary';
      case 'withdrawal_completed':
        return 'default';
      case 'withdrawal_failed':
        return 'destructive';
      default:
        return 'secondary';
    }
  };

  // Formatar data
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInHours = (now.getTime() - date.getTime()) / (1000 * 60 * 60);

    if (diffInHours < 1) {
      const diffInMinutes = Math.floor(diffInHours * 60);
      return `${diffInMinutes}min atrás`;
    } else if (diffInHours < 24) {
      return `${Math.floor(diffInHours)}h atrás`;
    } else {
      return date.toLocaleDateString('pt-BR', {
        day: '2-digit',
        month: '2-digit',
        hour: '2-digit',
        minute: '2-digit'
      });
    }
  };

  // Carregar notificações ao abrir
  useEffect(() => {
    if (open) {
      fetchNotifications();
    }
  }, [open]);

  // Carregar notificações iniciais
  useEffect(() => {
    fetchNotifications();
    
    // Atualizar a cada 30 segundos
    const interval = setInterval(fetchNotifications, 30000);
    return () => clearInterval(interval);
  }, [userId, tenantId]);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="sm" className="relative">
          <Bell className="h-4 w-4" />
          {unreadCount > 0 && (
            <Badge 
              variant="destructive" 
              className="absolute -top-1 -right-1 h-5 w-5 rounded-full p-0 text-xs flex items-center justify-center"
            >
              {unreadCount > 99 ? '99+' : unreadCount}
            </Badge>
          )}
        </Button>
      </PopoverTrigger>
      
      <PopoverContent className="w-80 p-0" align="end">
        <Card className="border-0 shadow-none">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-medium">Notificações</CardTitle>
              {unreadCount > 0 && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={markAllAsRead}
                  className="text-xs h-auto p-1"
                >
                  Marcar todas como lidas
                </Button>
              )}
            </div>
          </CardHeader>
          
          <CardContent className="p-0">
            <div className="h-80 overflow-y-auto">
              {loading ? (
                <div className="flex items-center justify-center h-20">
                  <div className="text-sm text-muted-foreground">Carregando...</div>
                </div>
              ) : notifications.length === 0 ? (
                <div className="flex items-center justify-center h-20">
                  <div className="text-sm text-muted-foreground">Nenhuma notificação</div>
                </div>
              ) : (
                <div className="space-y-1">
                  {notifications.map((notification, index) => (
                    <div key={notification.id}>
                      <div
                        className={`p-3 hover:bg-accent cursor-pointer transition-colors ${
                          !notification.read ? 'bg-blue-50 dark:bg-blue-950/20' : ''
                        }`}
                        onClick={() => {
                          if (!notification.read) {
                            markAsRead(notification.id);
                          }
                        }}
                      >
                        <div className="flex items-start gap-3">
                          <div className="flex-shrink-0 mt-0.5">
                            {getNotificationIcon(notification.type)}
                          </div>
                          
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-1">
                              <p className="text-sm font-medium text-foreground truncate">
                                {notification.title}
                              </p>
                              {!notification.read && (
                                <div className="w-2 h-2 bg-blue-500 rounded-full flex-shrink-0" />
                              )}
                            </div>
                            
                            <p className="text-xs text-muted-foreground mb-2 line-clamp-2">
                              {notification.message}
                            </p>
                            
                            <div className="flex items-center justify-between">
                              <Badge 
                                variant={getBadgeVariant(notification.type)}
                                className="text-xs"
                              >
                                {formatCurrency(notification.data.amount_cents / 100)}
                              </Badge>
                              
                              <span className="text-xs text-muted-foreground">
                                {formatDate(notification.created_at)}
                              </span>
                            </div>
                          </div>
                        </div>
                      </div>
                      
                      {index < notifications.length - 1 && <Separator />}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </PopoverContent>
    </Popover>
  );
}