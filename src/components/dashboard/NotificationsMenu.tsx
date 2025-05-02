
import React, { useState, useEffect } from 'react';
import { Bell } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
  DropdownMenuLabel
} from '@/components/ui/dropdown-menu';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/integrations/supabase/client';
import { format, parseISO } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { toast } from 'sonner';

interface Notification {
  id: string;
  user_id: string;
  message: string;
  type: string;
  related_id?: string | null;
  is_read: boolean;
  created_at: string;
}

export const NotificationsMenu: React.FC = () => {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);

  const fetchNotifications = async () => {
    setLoading(true);
    try {
      const { data: session } = await supabase.auth.getSession();
      if (!session?.session?.user) {
        setLoading(false);
        return;
      }

      const userId = session.session.user.id;

      // Use the notifications table that we've created
      const { data, error } = await supabase.from('notifications')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(10);

      if (error) throw error;

      // Set notifications with proper typing
      setNotifications(data as Notification[] || []);
      setUnreadCount((data as Notification[] || []).filter(n => !n.is_read).length || 0);
    } catch (error) {
      console.error('Erro ao carregar notificações:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchNotifications();

    // Configure real-time channel for notifications
    const channel = supabase
      .channel('notifications-changes')
      .on('postgres_changes', 
        { 
          event: '*', 
          schema: 'public', 
          table: 'notifications' 
        }, 
        (payload) => {
          console.log('Notificação em tempo real:', payload);
          fetchNotifications();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const markAsRead = async (notificationId: string) => {
    try {
      const { error } = await supabase
        .from('notifications')
        .update({ is_read: true })
        .eq('id', notificationId);

      if (error) throw error;
      
      // Update local state
      setNotifications(prev => 
        prev.map(n => n.id === notificationId ? { ...n, is_read: true } : n)
      );
      setUnreadCount(prev => Math.max(0, prev - 1));

    } catch (error) {
      console.error('Erro ao marcar notificação como lida:', error);
    }
  };

  const markAllAsRead = async () => {
    try {
      const { data: session } = await supabase.auth.getSession();
      if (!session?.session?.user) return;

      const { error } = await supabase
        .from('notifications')
        .update({ is_read: true })
        .eq('user_id', session.session.user.id)
        .eq('is_read', false);

      if (error) throw error;
      
      setNotifications(prev => prev.map(n => ({ ...n, is_read: true })));
      setUnreadCount(0);
      toast.success('Todas as notificações foram marcadas como lidas');

    } catch (error) {
      console.error('Erro ao marcar todas como lidas:', error);
      toast.error('Erro ao marcar notificações como lidas');
    }
  };

  const clearAllNotifications = async () => {
    try {
      const { data: session } = await supabase.auth.getSession();
      if (!session?.session?.user) return;

      const { error } = await supabase
        .from('notifications')
        .delete()
        .eq('user_id', session.session.user.id);

      if (error) throw error;
      
      setNotifications([]);
      setUnreadCount(0);
      toast.success('Todas as notificações foram apagadas');

    } catch (error) {
      console.error('Erro ao apagar notificações:', error);
      toast.error('Erro ao apagar notificações');
    }
  };

  const getNotificationIcon = (type: string) => {
    switch(type) {
      case 'appointment':
        return '📅';
      case 'message':
        return '💬';
      case 'system':
        return '🔔';
      default:
        return '📌';
    }
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" className="relative">
          <Bell className="h-5 w-5" />
          {unreadCount > 0 && (
            <Badge 
              className="absolute -top-1 -right-1 bg-red-500 text-white text-xs min-w-[1.25rem] h-5 flex items-center justify-center"
            >
              {unreadCount}
            </Badge>
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-80">
        <DropdownMenuLabel className="flex justify-between items-center">
          <span>Notificações</span>
          <div className="flex gap-1">
            <Button 
              variant="ghost" 
              size="sm" 
              disabled={unreadCount === 0}
              onClick={markAllAsRead}
              className="text-xs"
            >
              Marcar todas como lidas
            </Button>
            <Button 
              variant="ghost" 
              size="sm" 
              disabled={notifications.length === 0}
              onClick={clearAllNotifications}
              className="text-xs"
            >
              Limpar
            </Button>
          </div>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        
        {loading ? (
          <div className="p-4 text-center text-sm text-gray-500">
            Carregando notificações...
          </div>
        ) : notifications.length > 0 ? (
          notifications.map((notification) => (
            <DropdownMenuItem
              key={notification.id}
              className={`py-2 px-4 ${!notification.is_read ? 'bg-blue-50' : ''}`}
              onClick={() => markAsRead(notification.id)}
            >
              <div className="flex gap-3 items-start w-full">
                <div className="text-xl">
                  {getNotificationIcon(notification.type)}
                </div>
                <div className="flex-1 space-y-1">
                  <p className={`text-sm ${!notification.is_read ? 'font-medium' : ''}`}>
                    {notification.message}
                  </p>
                  <p className="text-xs text-gray-500">
                    {format(parseISO(notification.created_at), "dd 'de' MMM, HH:mm", {
                      locale: ptBR
                    })}
                  </p>
                </div>
                {!notification.is_read && (
                  <div className="h-2 w-2 bg-blue-500 rounded-full mt-1"></div>
                )}
              </div>
            </DropdownMenuItem>
          ))
        ) : (
          <div className="p-4 text-center text-sm text-gray-500">
            Você não tem novas notificações
          </div>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
};
