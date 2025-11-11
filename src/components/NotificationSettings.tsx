import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Bell, MessageSquare, UserPlus, Heart, Eye, Calendar } from 'lucide-react';
import { toast } from 'sonner';

interface NotificationSettings {
  messages: boolean;
  friend_requests: boolean;
  post_reactions: boolean;
  profile_views: boolean;
  events: boolean;
}

export default function NotificationSettings() {
  const [settings, setSettings] = useState<NotificationSettings>({
    messages: true,
    friend_requests: true,
    post_reactions: true,
    profile_views: true,
    events: true,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      const { data, error } = await supabase.rpc('get_notification_settings');
      
      if (error) throw error;
      
      if (data) {
        setSettings(data);
      }
    } catch (error) {
      console.error('Error loading notification settings:', error);
      toast.error('Failed to load notification settings');
    } finally {
      setLoading(false);
    }
  };

  const toggleSetting = async (key: keyof NotificationSettings, enabled: boolean) => {
    try {
      // Optimistic update
      setSettings(prev => ({ ...prev, [key]: enabled }));

      const { error } = await supabase.rpc('toggle_notification_setting', {
        setting_key: key,
        enabled: enabled,
      });

      if (error) throw error;

      toast.success(
        enabled 
          ? `${formatSettingName(key)} notifications enabled` 
          : `${formatSettingName(key)} notifications disabled`
      );
    } catch (error) {
      console.error('Error toggling notification:', error);
      // Revert on error
      setSettings(prev => ({ ...prev, [key]: !enabled }));
      toast.error('Failed to update notification settings');
    }
  };

  const formatSettingName = (key: string): string => {
    return key.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
  };

  const notificationTypes = [
    {
      key: 'messages' as keyof NotificationSettings,
      icon: MessageSquare,
      title: 'Messages',
      description: 'Get notified when someone sends you a message',
    },
    {
      key: 'friend_requests' as keyof NotificationSettings,
      icon: UserPlus,
      title: 'Friend Requests',
      description: 'Get notified about new friend requests and acceptances',
    },
    {
      key: 'post_reactions' as keyof NotificationSettings,
      icon: Heart,
      title: 'Post Reactions',
      description: 'Get notified when someone likes or comments on your posts',
    },
    {
      key: 'profile_views' as keyof NotificationSettings,
      icon: Eye,
      title: 'Profile Views',
      description: 'Get notified when someone views your profile',
    },
    {
      key: 'events' as keyof NotificationSettings,
      icon: Calendar,
      title: 'Events',
      description: 'Get notified about upcoming events and RSVPs',
    },
  ];

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Bell className="h-5 w-5" />
            Notification Settings
          </CardTitle>
          <CardDescription>Loading...</CardDescription>
        </CardHeader>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Bell className="h-5 w-5" />
          Notification Settings
        </CardTitle>
        <CardDescription>
          Choose what notifications you want to receive. Messages are grouped within 30 minutes to avoid spam.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {notificationTypes.map(({ key, icon: Icon, title, description }) => (
          <div key={key} className="flex items-start justify-between space-x-4">
            <div className="flex items-start space-x-4 flex-1">
              <div className="mt-1">
                <Icon className="h-5 w-5 text-muted-foreground" />
              </div>
              <div className="space-y-1 flex-1">
                <Label htmlFor={key} className="text-base font-medium cursor-pointer">
                  {title}
                </Label>
                <p className="text-sm text-muted-foreground">
                  {description}
                </p>
              </div>
            </div>
            <Switch
              id={key}
              checked={settings[key]}
              onCheckedChange={(checked) => toggleSetting(key, checked)}
            />
          </div>
        ))}

        <div className="pt-4 border-t">
          <p className="text-sm text-muted-foreground">
            💡 <strong>Tip:</strong> Message notifications are grouped within 30 minutes. 
            If someone sends multiple messages, you'll see "X new messages" instead of 
            separate notifications for each message.
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
