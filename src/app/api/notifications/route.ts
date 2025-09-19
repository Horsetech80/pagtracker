import { createServiceClient } from '@/lib/supabase/server';
import { withdrawalNotificationService } from '@/lib/notifications/withdrawal';
import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get('limit') || '20');
    const markAsRead = searchParams.get('markAsRead') === 'true';
    
    // Obter headers de autenticação
    const userId = request.headers.get('x-user-id');
    const tenantId = request.headers.get('x-tenant-id');

    if (!userId || !tenantId) {
      return NextResponse.json(
        { error: 'Headers de autenticação obrigatórios' },
        { status: 401 }
      );
    }

    // Buscar notificações do usuário
    const notifications = await withdrawalNotificationService.getUserNotifications(
      userId,
      tenantId,
      limit
    );

    // Contar notificações não lidas
    const unreadCount = await withdrawalNotificationService.getUnreadCount(
      userId,
      tenantId
    );

    // Marcar todas como lidas se solicitado
    if (markAsRead && unreadCount > 0) {
      await withdrawalNotificationService.markAllAsRead(userId, tenantId);
    }

    return NextResponse.json({
      success: true,
      notifications,
      unreadCount: markAsRead ? 0 : unreadCount,
      total: notifications.length
    });

  } catch (error) {
    console.error('Erro ao buscar notificações:', error);
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const body = await request.json();
    const { notification_id, action } = body;
    
    // Obter headers de autenticação
    const userId = request.headers.get('x-user-id');
    const tenantId = request.headers.get('x-tenant-id');

    if (!userId || !tenantId) {
      return NextResponse.json(
        { error: 'Headers de autenticação obrigatórios' },
        { status: 401 }
      );
    }

    if (!notification_id || !action) {
      return NextResponse.json(
        { error: 'ID da notificação e ação são obrigatórios' },
        { status: 400 }
      );
    }

    let success = false;

    switch (action) {
      case 'mark_as_read':
        success = await withdrawalNotificationService.markAsRead(notification_id, userId);
        break;
      
      case 'mark_all_as_read':
        success = await withdrawalNotificationService.markAllAsRead(userId, tenantId);
        break;
      
      default:
        return NextResponse.json(
          { error: 'Ação inválida' },
          { status: 400 }
        );
    }

    if (!success) {
      return NextResponse.json(
        { error: 'Erro ao atualizar notificação' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Notificação atualizada com sucesso'
    });

  } catch (error) {
    console.error('Erro ao atualizar notificação:', error);
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}