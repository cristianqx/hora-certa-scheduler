
import React, { useState, useEffect } from 'react';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { Button } from '@/components/ui/button';
import { Bell } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { format, parseISO } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Separator } from '@/components/ui/separator';
import { markAllNotificationsAsRead, clearReadNotifications } from '@/utils/notificationUtils';
import { toast } from 'sonner';

interface Notification {
  id: string;
  user_id: string;
  message: string;
  type: 'system' | 'appointment' | 'message';
  related_id: string | null;
  is_read: boolean;
  created_at: string;
}

export const NotificationsMenu = () => {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const [userId, setUserId] = useState<string | null>(null);

  useEffect(() => {
    const fetchUserIdAndNotifications = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (!session?.user) return;
        
        setUserId(session.user.id);
        fetchNotifications(session.user.id);
      } catch (error) {
        console.error('Error fetching user session:', error);
      }
    };

    fetchUserIdAndNotifications();

    // Set up subscription for real-time notifications
    const setupSubscription = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (!session?.user) return;

        const channel = supabase
          .channel('notifications-changes')
          .on(
            'postgres_changes',
            {
              event: 'INSERT',
              schema: 'public',
              table: 'notifications',
              filter: `user_id=eq.${session.user.id}`,
            },
            (payload) => {
              // Add new notification to state
              const newNotification = payload.new as Notification;
              setNotifications(prev => [newNotification, ...prev]);
              setUnreadCount(prev => prev + 1);
              
              // Show toast for new notification
              toast.info(newNotification.message, {
                description: 'Nova notificação',
                duration: 3000,
              });
            }
          )
          .subscribe();

        return () => {
          supabase.removeChannel(channel);
        };
      } catch (error) {
        console.error('Error setting up notification subscription:', error);
      }
    };

    setupSubscription();
  }, []);

  const fetchNotifications = async (uid: string) => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('notifications')
        .select('*')
        .eq('user_id', uid)
        .order('created_at', { ascending: false })
        .limit(50);
      
      if (error) throw error;
      
      // Type assertion to ensure we're working with Notification[]
      const typedNotifications = data as Notification[];
      setNotifications(typedNotifications);
      
      // Count unread notifications
      setUnreadCount(typedNotifications.filter(n => !n.is_read).length);
      
    } catch (error) {
      console.error('Error fetching notifications:', error);
    } finally {
      setIsLoading(false);
    }
  };
  
  const handleMarkAsRead = async (notificationId: string) => {
    try {
      const { error } = await supabase
        .from('notifications')
        .update({ is_read: true })
        .eq('id', notificationId);
      
      if (error) throw error;
      
      // Update local state
      setNotifications(prev => 
        prev.map(n => 
          n.id === notificationId ? { ...n, is_read: true } : n
        )
      );
      setUnreadCount(prev => Math.max(0, prev - 1));
      
    } catch (error) {
      console.error('Error marking notification as read:', error);
    }
  };
  
  const handleMarkAllAsRead = async () => {
    if (!userId) return;
    
    try {
      const success = await markAllNotificationsAsRead(userId);
      
      if (success) {
        // Update local state
        setNotifications(prev => 
          prev.map(n => ({ ...n, is_read: true }))
        );
        setUnreadCount(0);
        toast.success('Todas as notificações foram marcadas como lidas');
      }
    } catch (error) {
      console.error('Error marking all notifications as read:', error);
      toast.error('Erro ao marcar notificações como lidas');
    }
  };
  
  const handleClearRead = async () => {
    if (!userId) return;
    
    try {
      const success = await clearReadNotifications(userId);
      
      if (success) {
        // Update local state - remove all read notifications
        setNotifications(prev => prev.filter(n => !n.is_read));
        toast.success('Notificações lidas foram removidas');
      }
    } catch (error) {
      console.error('Error clearing read notifications:', error);
      toast.error('Erro ao limpar notificações');
    }
  };
  
  const formatNotificationTime = (dateString: string) => {
    const date = parseISO(dateString);
    const now = new Date();
    const diffInHours = (now.getTime() - date.getTime()) / (1000 * 60 * 60);
    
    if (diffInHours < 24) {
      return format(date, "HH:mm", { locale: ptBR });
    } else if (diffInHours < 48) {
      return 'Ontem';
    } else {
      return format(date, "dd/MM/yyyy", { locale: ptBR });
    }
  };
  
  const getNotificationIcon = (type: string) => {
    switch(type) {
      case 'appointment':
        return <div className="h-2 w-2 rounded-full bg-blue-500"></div>;
      case 'message':
        return <div className="h-2 w-2 rounded-full bg-green-500"></div>;
      default:
        return <div className="h-2 w-2 rounded-full bg-orange-500"></div>;
    }
  };

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="icon" className="relative">
          <Bell className="h-5 w-5" />
          {unreadCount > 0 && (
            <span className="absolute -top-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full bg-red-500 text-xs text-white">
              {unreadCount > 9 ? '9+' : unreadCount}
            </span>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[350px] p-0" align="end">
        <div className="flex items-center justify-between p-4 bg-muted/50">
          <h3 className="font-medium">Notificações</h3>
          <div className="flex gap-2">
            {unreadCount > 0 && (
              <Button 
                variant="ghost" 
                size="sm" 
                className="text-xs h-7"
                onClick={handleMarkAllAsRead}
              >
                Marcar tudo como lido
              </Button>
            )}
            <Button 
              variant="ghost" 
              size="sm" 
              className="text-xs h-7"
              onClick={handleClearRead}
            >
              Limpar lidas
            </Button>
          </div>
        </div>
        
        <Separator />
        
        <div className="max-h-[300px] overflow-y-auto">
          {isLoading ? (
            <div className="py-8 text-center text-muted-foreground">
              Carregando notificações...
            </div>
          ) : notifications.length === 0 ? (
            <div className="py-8 text-center text-muted-foreground">
              Nenhuma notificação.
            </div>
          ) : (
            notifications.map(notification => (
              <div 
                key={notification.id}
                className={`p-3 hover:bg-muted/50 cursor-pointer flex items-start gap-2 ${
                  !notification.is_read ? 'bg-blue-50/50' : ''
                }`}
                onClick={() => {
                  if (!notification.is_read) {
                    handleMarkAsRead(notification.id);
                  }
                }}
              >
                <div className="mt-1.5">
                  {getNotificationIcon(notification.type)}
                </div>
                
                <div className="flex-1">
                  <p className="text-sm">{notification.message}</p>
                  <span className="text-xs text-muted-foreground">
                    {formatNotificationTime(notification.created_at)}
                  </span>
                </div>
                
                {!notification.is_read && (
                  <div className="h-2 w-2 rounded-full bg-primary mt-1.5"></div>
                )}
              </div>
            ))
          )}
        </div>
        
        <Separator />
        
        <div className="p-2 text-center">
          <Button variant="link" size="sm" className="text-xs h-auto">
            Ver todas as notificações
          </Button>
        </div>
      </PopoverContent>
    </Popover>
  );
};
