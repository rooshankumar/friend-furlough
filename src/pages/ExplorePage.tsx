import { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useAuthStore } from '@/stores/authStore';
import { useExploreStore } from '@/stores/exploreStore';
import { useProfileReactionStore } from '@/stores/profileReactionStore';
import { useDebounce } from '@/hooks/useDebounce';
import { usePullToRefresh } from '@/hooks/usePullToRefresh';
import { useBatchPresence } from '@/hooks/useBatchPresence';
import { PullToRefreshIndicator } from '@/components/PullToRefresh';
import { PageHeader } from '@/components/PageHeader';
import { ModernProfileCard } from '@/components/explore/ModernProfileCard';
import { ModernFilters } from '@/components/explore/ModernFilters';
import { Card } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Globe } from 'lucide-react';
import { toast } from 'sonner';

// Using User type from store which has proper types

export default function ExplorePage() {
  const navigate = useNavigate();
  const { user, profile } = useAuthStore();
  const { filteredUsers, isLoading, searchTerm, filters, loadUsers, setSearchTerm, setFilters, clearFilters, users } = useExploreStore();
  const [isCreatingConversation, setIsCreatingConversation] = useState(false);
  const { toggleReaction, loadReactionData, reactions, userReactions } = useProfileReactionStore();
  const [showFilters, setShowFilters] = useState(false);
  
  const [activeView, setActiveView] = useState<'all' | 'new' | 'online'>('all');
  const [displayedUsers, setDisplayedUsers] = useState<any[]>([]);
  
  // Local search state for immediate UI update
  const [localSearchTerm, setLocalSearchTerm] = useState(searchTerm);
  
  // Debounce search to reduce API calls
  const debouncedSearchTerm = useDebounce(localSearchTerm, 300);
  
  // Get user IDs for presence tracking
  const userIds = useMemo(() => displayedUsers.map(u => u.id), [displayedUsers]);
  
  // Track online presence for all displayed users
  const { isUserOnline } = useBatchPresence(userIds);
  
  // Sort and filter users based on active view
  const sortUsers = (userList: any[], view: typeof activeView) => {
    let sortedUsers = [...userList];
    
    switch (view) {
      case 'online':
        sortedUsers = sortedUsers.filter(u => isUserOnline(u.id));
        break;
      case 'new':
        sortedUsers = sortedUsers.sort((a, b) => {
          const dateA = new Date(a.created_at || 0).getTime();
          const dateB = new Date(b.created_at || 0).getTime();
          return dateB - dateA;
        });
        break;
      default: // 'all'
        // Online users first, then shuffle
        const onlineUsers = sortedUsers.filter(u => isUserOnline(u.id));
        const offlineUsers = sortedUsers.filter(u => !isUserOnline(u.id));
        sortedUsers = [
          ...onlineUsers.sort(() => Math.random() - 0.5),
          ...offlineUsers.sort(() => Math.random() - 0.5)
        ];
    }
    
    setDisplayedUsers(sortedUsers);
  };

  // Pull-to-refresh for users
  const usersPullToRefresh = usePullToRefresh({
    onRefresh: async () => {
      await loadUsers();
      sortUsers(filteredUsers, activeView);
    },
    threshold: 80
  });

  // Check if onboarding is complete
  useEffect(() => {
    if (profile && (!profile.country || !profile.age || !profile.city)) {
      // Onboarding not complete - redirect
      toast.error('Please complete your profile first');
      navigate('/onboarding/welcome');
    }
  }, [profile, navigate]);

  useEffect(() => {
    loadUsers();
  }, []);

  // Sort users when filtered users change
  useEffect(() => {
    sortUsers(filteredUsers, activeView);
  }, [filteredUsers, reactions]);

  // Update sorting when view changes
  useEffect(() => {
    sortUsers(filteredUsers, activeView);
  }, [activeView]);

  
  // Update store search term when debounced value changes
  useEffect(() => {
    setSearchTerm(debouncedSearchTerm);
  }, [debouncedSearchTerm, setSearchTerm]);

  // Load reaction data for all visible profiles
  useEffect(() => {
    filteredUsers.forEach(profile => {
      loadReactionData(profile.id);
    });
  }, [filteredUsers, loadReactionData]);

  const profiles = displayedUsers.length > 0 ? displayedUsers : filteredUsers;


  const viewProfile = (profile: any) => {
    navigate(`/profile/${profile.id}`);
  };

  const startConversation = async (profileId: string) => {
    if (isCreatingConversation) return;
    
    try {
      setIsCreatingConversation(true);
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        toast.error('Please sign in to start a conversation');
        navigate('/auth/signin');
        return;
      }

      if (profileId === user?.id) return;

      const { ConversationManager } = await import('@/lib/conversationManager');
      const result = await ConversationManager.findOrCreateConversation(user!.id, profileId);

      if (result) {
        toast.success(result.isNew ? 'Conversation created!' : 'Opening conversation');
        navigate(`/chat/${result.conversationId}`);
      } else {
        toast.error('Failed to create conversation');
      }
    } catch (error) {
      console.error('Error starting conversation:', error);
      toast.error('Something went wrong. Please try again.');
    } finally {
      setIsCreatingConversation(false);
    }
  };

  const handleToggleFavorite = async (profileId: string) => {
    const success = await toggleReaction(profileId);
    if (success) {
      toast.success(
        userReactions[profileId] 
          ? 'Removed from favorites' 
          : 'Added to favorites!'
      );
    } else {
      toast.error('Failed to update reaction');
    }
  };


  if (isLoading) {
    return (
      <div className="min-h-screen md:ml-16 bg-background pb-16 md:pb-0">
        <div className="p-4 md:p-8">
          <div className="mb-8">
            <Skeleton className="h-8 w-64 mb-4" />
            <Skeleton className="h-4 w-96 mb-6" />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <Card key={i} className="p-4">
                <Skeleton className="h-12 w-12 rounded-full mb-3" />
                <Skeleton className="h-4 w-3/4 mb-2" />
                <Skeleton className="h-3 w-1/2 mb-3" />
                <Skeleton className="h-8 w-full" />
              </Card>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div ref={usersPullToRefresh.containerRef} className="min-h-screen md:ml-16 bg-background pb-16 md:pb-0 relative">
      <PullToRefreshIndicator 
        pullDistance={usersPullToRefresh.pullDistance}
        isRefreshing={usersPullToRefresh.isRefreshing}
        threshold={80}
      />
      
      <PageHeader 
        title="Explore" 
        showBack={false}
      />
      
      <div>
        {/* Modern Filters */}
        <ModernFilters
          filters={filters}
          onFiltersChange={setFilters}
          onClearFilters={clearFilters}
          activeView={activeView}
          onViewChange={setActiveView}
          showFilters={showFilters}
          onToggleFilters={() => setShowFilters(!showFilters)}
          searchTerm={localSearchTerm}
          onSearchChange={setLocalSearchTerm}
        />

        {/* User Grid */}
        <div className="p-4">
          {profiles.length === 0 && !isLoading ? (
            <Card className="p-8 text-center">
            <Globe className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
            <h3 className="text-lg font-semibold mb-2">No users found</h3>
            <p className="text-muted-foreground mb-4">
              {searchTerm ? 'Try a different search term' : 'Check back later for new members'}
            </p>
            {searchTerm && (
              <button 
                onClick={() => setLocalSearchTerm('')}
                className="px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-colors text-sm"
              >
                Clear Search
              </button>
            )}
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {profiles.map((profile) => (
                <ModernProfileCard
                  key={profile.id}
                  profile={profile}
                  isOnline={isUserOnline(profile.id)}
                  favoriteCount={reactions[profile.id] || 0}
                  isUserFavorite={userReactions[profile.id] || false}
                  matchPercentage={Math.floor(Math.random() * 40) + 60} // Will be dynamic later
                  onStartConversation={startConversation}
                  onToggleFavorite={handleToggleFavorite}
                  onViewProfile={viewProfile}
                  isCreatingConversation={isCreatingConversation}
                />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
