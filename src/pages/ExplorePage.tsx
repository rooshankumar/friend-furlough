import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useAuthStore } from '@/stores/authStore';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { MessageCircle, MapPin, Globe } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';

interface UserProfile {
  id: string;
  name: string;
  avatar_url?: string;
  country?: string;
  country_flag?: string;
  bio?: string;
  online: boolean;
}

export default function ExplorePage() {
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const [profiles, setProfiles] = useState<UserProfile[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadProfiles();
  }, []);

  const loadProfiles = async () => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .neq('id', user?.id || '')
        .limit(20);

      if (error) throw error;
      setProfiles(data || []);
    } catch (error) {
      console.error('Error loading profiles:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const startConversation = async (profileId: string) => {
    try {
      // Prevent self-chat
      if (profileId === user?.id) {
        return;
      }

      // Check if conversation already exists
      const { data: existingParticipants } = await supabase
        .from('conversation_participants')
        .select('conversation_id')
        .eq('user_id', user!.id);

      if (existingParticipants) {
        for (const participant of existingParticipants) {
          const { data: otherParticipant } = await supabase
            .from('conversation_participants')
            .select('conversation_id')
            .eq('conversation_id', participant.conversation_id)
            .eq('user_id', profileId)
            .maybeSingle();

          if (otherParticipant) {
            // Conversation already exists
            navigate(`/chat/${participant.conversation_id}`);
            return;
          }
        }
      }

      // Create new conversation
      const { data: conversation, error: convError } = await supabase
        .from('conversations')
        .insert({ 
          is_language_exchange: true,
          user_id: user!.id
        })
        .select()
        .single();

      if (convError) throw convError;

      // Add participants
      await supabase.from('conversation_participants').insert([
        { conversation_id: conversation.id, user_id: user!.id },
        { conversation_id: conversation.id, user_id: profileId }
      ]);

      navigate(`/chat/${conversation.id}`);
    } catch (error) {
      console.error('Error starting conversation:', error);
    }
  };

  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold mb-8">Explore Language Partners</h1>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <Card key={i} className="p-6">
              <Skeleton className="h-20 w-20 rounded-full mx-auto mb-4" />
              <Skeleton className="h-6 w-3/4 mx-auto mb-2" />
              <Skeleton className="h-4 w-1/2 mx-auto mb-4" />
              <Skeleton className="h-10 w-full" />
            </Card>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-2">Explore Language Partners</h1>
      <p className="text-muted-foreground mb-8">
        Connect with people from around the world
      </p>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {profiles.map((profile) => (
          <Card key={profile.id} className="p-6 hover:shadow-lg transition-shadow">
            <div className="flex flex-col items-center text-center">
              <div className="relative mb-4">
                <Avatar className="h-20 w-20">
                  <AvatarImage src={profile.avatar_url} />
                  <AvatarFallback>{profile.name?.[0] || '?'}</AvatarFallback>
                </Avatar>
                {profile.online && (
                  <span className="absolute bottom-0 right-0 h-4 w-4 bg-green-500 rounded-full border-2 border-background" />
                )}
              </div>

              <h3 className="text-xl font-semibold mb-1">{profile.name}</h3>
              
              {profile.country && (
                <div className="flex items-center gap-2 text-muted-foreground mb-2">
                  <MapPin className="h-4 w-4" />
                  <span className="text-sm">
                    {profile.country_flag} {profile.country}
                  </span>
                </div>
              )}

              {profile.bio && (
                <p className="text-sm text-muted-foreground mb-4 line-clamp-2">
                  {profile.bio}
                </p>
              )}

              <Button
                onClick={() => startConversation(profile.id)}
                className="w-full"
              >
                <MessageCircle className="h-4 w-4 mr-2" />
                Start Chat
              </Button>
            </div>
          </Card>
        ))}
      </div>

      {profiles.length === 0 && (
        <div className="text-center py-12">
          <Globe className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
          <h3 className="text-xl font-semibold mb-2">No users found</h3>
          <p className="text-muted-foreground">
            Be the first to join the community!
          </p>
        </div>
      )}
    </div>
  );
}
