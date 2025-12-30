/**
 * Hook for Notification Settings
 */

import { useState, useEffect } from 'react';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/useAuth';
import { db } from '@/lib/database';
import { getDefaultNotificationSettings } from '../utils/settingsHelpers';

export interface NotificationSettings {
  email_notifications: boolean;
  push_notifications: boolean;
  task_reminders: boolean;
  leave_notifications: boolean;
  payroll_notifications: boolean;
  project_updates: boolean;
  system_alerts: boolean;
  marketing_emails: boolean;
}

export const useNotificationSettings = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [notificationSettings, setNotificationSettings] = useState<NotificationSettings>(
    getDefaultNotificationSettings()
  );
  const [loading, setLoading] = useState(false);

  const fetchNotificationSettings = async () => {
    if (!user?.id) return;
    
    try {
      const { data, error } = await db
        .from('user_preferences')
        .select('*')
        .eq('user_id', user.id)
        .single();

      if (data) {
        setNotificationSettings({
          email_notifications: data.email_notifications ?? true,
          push_notifications: data.push_notifications ?? false,
          task_reminders: data.task_reminders ?? true,
          leave_notifications: data.leave_notifications ?? true,
          payroll_notifications: data.payroll_notifications ?? true,
          project_updates: data.project_updates ?? true,
          system_alerts: data.system_alerts ?? true,
          marketing_emails: data.marketing_emails ?? false,
        });
      } else {
        const stored = localStorage.getItem(`notification_prefs_${user.id}`);
        if (stored) {
          setNotificationSettings(JSON.parse(stored));
        }
      }
    } catch {
      const stored = localStorage.getItem(`notification_prefs_${user?.id}`);
      if (stored) {
        setNotificationSettings(JSON.parse(stored));
      }
    }
  };

  const saveNotificationSettings = async () => {
    if (!user?.id) return;

    setLoading(true);
    try {
      try {
        const { data: existingPrefs } = await db
          .from('user_preferences')
          .select('id')
          .eq('user_id', user.id)
          .single();

        if (existingPrefs) {
          await db
            .from('user_preferences')
            .update(notificationSettings)
            .eq('user_id', user.id);
        } else {
          await db
            .from('user_preferences')
            .insert({
              user_id: user.id,
              ...notificationSettings,
            });
        }
      } catch {
        localStorage.setItem(
          `notification_prefs_${user.id}`,
          JSON.stringify(notificationSettings)
        );
      }

      toast({
        title: "Success",
        description: "Notification preferences updated successfully",
      });
    } catch (error) {
      console.error('Error saving notification settings:', error);
      toast({
        title: "Error",
        description: "Failed to update notification preferences",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user?.id) {
      fetchNotificationSettings();
    }
  }, [user?.id]);

  return {
    notificationSettings,
    setNotificationSettings,
    loading,
    fetchNotificationSettings,
    saveNotificationSettings,
  };
};

