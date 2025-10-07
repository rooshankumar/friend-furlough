import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useAuthStore } from '@/stores/authStore';
import { useExploreStore } from '@/stores/exploreStore';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { Input } from '@/components/ui/input';
import { MessageCircle, MapPin, Globe, Search, Filter, X } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { toast } from 'sonner';

// Using User type from store which has proper types

export default function ExplorePage() {
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const { filteredUsers, isLoading, searchTerm, filters, loadUsers, setSearchTerm, setFilters, clearFilters } = useExploreStore();
  const [showFilters, setShowFilters] = useState(false);

  useEffect(() => {
    loadUsers();
  }, []);

  const profiles = filteredUsers;

  const viewProfile = (profile: any) => {
    // Navigate to profile using the user ID directly
    navigate(`/profile/${profile.id}`);
  };

  const startConversation = async (profileId: string) => {
    try {
      // Ensure user is authenticated
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        toast.error('Please sign in to start a conversation');
        navigate('/auth/signin');
        return;
      }

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
      console.log('Creating conversation with user_id:', session.user.id);
      console.log('Auth session:', session);
      
      // Try without explicitly setting user_id - let the database default handle it
      const { data: conversation, error: convError } = await supabase
        .from('conversations')
        .insert({ 
          is_language_exchange: true
        })
        .select()
        .single();

      if (convError) {
        console.error('Conversation creation error:', convError);
        console.error('Full error details:', JSON.stringify(convError, null, 2));
        toast.error(`Failed to start conversation: ${convError.message}`);
        return;
      }

      // Add participants
      const { error: participantError } = await supabase
        .from('conversation_participants')
        .insert([
          { conversation_id: conversation.id, user_id: session.user.id },
          { conversation_id: conversation.id, user_id: profileId }
        ]);

      if (participantError) {
        console.error('Participant creation error:', participantError);
        toast.error('Failed to add participants. Please try again.');
        return;
      }

      toast.success('Conversation started!');
      navigate(`/chat/${conversation.id}`);
    } catch (error) {
      console.error('Error starting conversation:', error);
      toast.error('Something went wrong. Please try again.');
    }
  };

  if (isLoading) {
    return (
      <div className="fixed inset-0 top-0 md:left-16 bg-gradient-subtle pb-16 md:pb-0 overflow-auto pt-4 md:pt-0">
        <div className="p-4 md:p-8">
          <h1 className="text-3xl font-bold mb-8">Explore Language Partners</h1>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
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
      </div>
    );
  }

  return (
    <div className="fixed inset-0 top-0 md:left-16 bg-gradient-subtle pb-16 md:pb-0 overflow-auto pt-4 md:pt-0">
      <div className="p-4 md:p-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">Explore Language Partners</h1>
          <p className="text-muted-foreground">
            Connect with people from around the world
          </p>
        </div>

        {/* Search and Filter Bar */}
        <div className="mb-6 space-y-4">
          <div className="flex gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search by name, country, or interests..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <Button
              variant={showFilters ? "default" : "outline"}
              onClick={() => setShowFilters(!showFilters)}
            >
              <Filter className="h-4 w-4 mr-2" />
              Filters
            </Button>
            {(searchTerm || filters.onlineOnly || filters.nativeLanguages.length > 0) && (
              <Button variant="ghost" onClick={clearFilters}>
                <X className="h-4 w-4 mr-2" />
                Clear
              </Button>
            )}
          </div>

          {/* Filter Panel */}
          {showFilters && (
            <Card className="p-4">
              <div className="space-y-4">
                <div>
                  <h3 className="font-semibold mb-2">Quick Filters</h3>
                  <div className="flex flex-wrap gap-2">
                    <Button
                      size="sm"
                      variant={filters.onlineOnly ? "default" : "outline"}
                      onClick={() => setFilters({ onlineOnly: !filters.onlineOnly })}
                    >
                      <div className={`w-2 h-2 rounded-full mr-2 ${filters.onlineOnly ? 'bg-white' : 'bg-green-500'}`} />
                      Online Only
                    </Button>
                  </div>
                </div>
                
                <p className="text-sm text-muted-foreground">
                  More advanced filters coming soon! Search above works for languages, countries, and interests.
                </p>
              </div>
            </Card>
          )}
        </div>

        {/* Results Count */}
        <div className="mb-4 text-sm text-muted-foreground">
          {profiles.length} {profiles.length === 1 ? 'person' : 'people'} found
        </div>

        {/* User Grid */}
        {profiles.length === 0 && !isLoading ? (
          <Card className="p-12 text-center">
            <Globe className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
            <h3 className="text-lg font-semibold mb-2">No users found</h3>
            <p className="text-muted-foreground mb-4">
              {searchTerm ? 'Try adjusting your search or filters' : 'Check back later for new language partners'}
            </p>
            {(searchTerm || filters.onlineOnly) && (
              <Button variant="outline" onClick={clearFilters}>
                Clear Filters
              </Button>
            )}
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {profiles.map((profile) => (
          <Card key={profile.id} className="p-6 hover:shadow-lg transition-shadow">
            <div className="flex flex-col items-center text-center">
              <div 
                className="relative mb-4 cursor-pointer hover:scale-105 transition-transform"
                onClick={() => viewProfile(profile)}
                title={`View ${profile.name}'s profile`}
              >
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
                    {profile.countryFlag} {profile.country}
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
        )}
      </div>
    </div>
  );
}
