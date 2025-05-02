
import { supabase } from '@/integrations/supabase/client';

interface CreateNotificationParams {
  userId: string;
  message: string;
  type?: 'system' | 'appointment' | 'message';
  relatedId?: string | null;
}

/**
 * Create a notification for a user
 */
export const createNotification = async ({
  userId,
  message,
  type = 'system',
  relatedId = null
}: CreateNotificationParams) => {
  try {
    const { error } = await supabase
      .from('notifications')
      .insert([
        {
          user_id: userId,
          message,
          type,
          related_id: relatedId,
          is_read: false
        }
      ]);

    if (error) {
      console.error('Error creating notification:', error);
      return false;
    }

    return true;
  } catch (error) {
    console.error('Error creating notification:', error);
    return false;
  }
};

/**
 * Create a system notification for an administrator
 */
export const createAdminNotification = async (message: string, relatedId?: string) => {
  try {
    // Get all users with admin role (you would need to implement user roles)
    const { data: admins, error: adminsError } = await supabase
      .from('profiles')
      .select('id')
      // If you have a role field, you can add a filter here
      // .eq('role', 'admin')
      .limit(50);

    if (adminsError) {
      console.error('Error fetching admins:', adminsError);
      return false;
    }

    // Create notifications for all admins
    if (admins && admins.length > 0) {
      const notifications = admins.map(admin => ({
        user_id: admin.id,
        message,
        type: 'system',
        related_id: relatedId || null,
        is_read: false
      }));

      const { error } = await supabase
        .from('notifications')
        .insert(notifications);

      if (error) {
        console.error('Error creating admin notifications:', error);
        return false;
      }

      return true;
    }

    return false;
  } catch (error) {
    console.error('Error creating admin notifications:', error);
    return false;
  }
};
