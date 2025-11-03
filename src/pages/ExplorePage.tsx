import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useAuthStore } from '@/stores/authStore';
import { useExploreStore } from '@/stores/exploreStore';
import { useProfileReactionStore } from '@/stores/profileReactionStore';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem } from '@/components/ui/command';
import { Check } from 'lucide-react';
import { MessageCircle, MapPin, Globe, Search, Filter, X, UserPlus, Heart, Users, Sparkles } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { toast } from 'sonner';
import { COUNTRIES, LANGUAGES, GENDER_OPTIONS } from '@/constants/filterOptions';

// Using User type from store which has proper types

export default function ExplorePage() {
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const { filteredUsers, isLoading, searchTerm, filters, loadUsers, setSearchTerm, setFilters, clearFilters, users } = useExploreStore();
  const { toggleReaction, loadReactionData, reactions, userReactions } = useProfileReactionStore();
  const [showFilters, setShowFilters] = useState(false);
  
  const [openCountry, setOpenCountry] = useState(false);
  const [openNative, setOpenNative] = useState(false);
  const [openLearning, setOpenLearning] = useState(false);
  const [activeView, setActiveView] = useState<'all' | 'new'>('all');

  useEffect(() => {
    loadUsers();
  }, []);

  // Load reaction data for all visible profiles
  useEffect(() => {
    filteredUsers.forEach(profile => {
      loadReactionData(profile.id);
    });
  }, [filteredUsers, loadReactionData]);

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
      <div className="min-h-screen md:ml-16 bg-gradient-subtle pb-16 md:pb-0 overflow-auto pt-4 md:pt-0">
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
    <div className="min-h-screen md:ml-16 bg-gradient-subtle pb-16 md:pb-0 overflow-auto pt-2 md:pt-0">
      <div className="p-3 md:p-8">
        {/* Header - Hidden on Mobile, Visible on Desktop */}
        <div className="hidden md:block mb-8">
          <h1 className="text-3xl font-bold mb-2">Explore Language Partners</h1>
          <p className="text-muted-foreground">
            Connect with people from around the world
          </p>
        </div>

        {/* Mobile: Filter Chips + Search */}
        <div className="lg:hidden mb-3">
          {/* Filter Chips */}
          <div className="grid grid-cols-2 gap-2 mb-3">
            <Button
              variant="ghost"
              onClick={() => setActiveView('all')}
              className={`h-9 text-xs rounded-lg transition-all ${
                activeView === 'all' 
                  ? 'bg-primary/10 text-primary border border-primary/20 shadow-sm' 
                  : 'hover:bg-muted/50'
              }`}
            >
              <Users className="h-3.5 w-3.5 mr-1" />
              All Users
            </Button>
            <Button
              variant="ghost"
              onClick={() => setActiveView('new')}
              className={`h-9 text-xs rounded-lg transition-all ${
                activeView === 'new' 
                  ? 'bg-primary/10 text-primary border border-primary/20 shadow-sm' 
                  : 'hover:bg-muted/50'
              }`}
            >
              <Sparkles className="h-3.5 w-3.5 mr-1" />
              New
            </Button>
          </div>
          
          {/* Search + Filter */}
          <div className="flex gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 h-9 text-sm"
                style={{ fontSize: '16px' }}
              />
            </div>
            <Button
              variant={showFilters ? "default" : "outline"}
              onClick={() => setShowFilters(!showFilters)}
              className="h-9 px-3"
            >
              <Filter className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* Desktop: All in one row */}
        <div className="hidden lg:block mb-6">
          <div className="flex items-center gap-3">
            {/* Filter Chips */}
            <div className="flex gap-2">
              <Button
                variant={activeView === 'all' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setActiveView('all')}
                className="h-9"
              >
                <Users className="h-4 w-4 mr-2" />
                All Users
              </Button>
              <Button
                variant={activeView === 'new' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setActiveView('new')}
                className="h-9"
              >
                <Sparkles className="h-4 w-4 mr-2" />
                New Members
              </Button>
            </div>

            {/* Search */}
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search by name, country, or interests..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 h-10"
              />
            </div>

            {/* Filter Button */}
            <Button
              variant={showFilters ? "default" : "outline"}
              onClick={() => setShowFilters(!showFilters)}
              className="h-10"
            >
              <Filter className="h-4 w-4 mr-2" />
              Filters
            </Button>

            {/* Clear Button */}
            {(searchTerm || filters.onlineOnly || filters.nativeLanguages.length > 0 || filters.learningLanguages.length > 0 || filters.gender.length > 0 || filters.ageRange[0] !== 18 || filters.ageRange[1] !== 65) && (
              <Button variant="ghost" onClick={clearFilters} className="h-10">
                <X className="h-4 w-4 mr-2" />
                Clear
              </Button>
            )}
          </div>
        </div>

        {/* Filter Panel */}
        {showFilters && (
            <Card className="p-3">
              <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
                {/* Gender Filter */}
                <div className="space-y-1">
                  <label className="text-xs font-medium">Gender</label>
                  <div className="flex gap-1">
                    {GENDER_OPTIONS.map((g) => (
                      <Button
                        key={g.value}
                        size="sm"
                        variant={filters.gender.includes(g.value) ? "default" : "outline"}
                        onClick={() => {
                          const newGenders = filters.gender.includes(g.value)
                            ? filters.gender.filter(x => x !== g.value)
                            : [...filters.gender, g.value];
                          setFilters({ gender: newGenders });
                        }}
                        className="flex-1 h-8 px-2"
                      >
                        <img src={g.icon} alt={g.value} className="h-4 w-4" />
                      </Button>
                    ))}
                  </div>
                </div>

                {/* Age Range */}
                <div className="space-y-1">
                  <label className="text-xs font-medium">Age</label>
                  <div className="flex gap-1">
                    <Input
                      type="number"
                      min={18}
                      max={65}
                      value={filters.ageRange[0]}
                      onChange={(e) => setFilters({ ageRange: [parseInt(e.target.value) || 18, filters.ageRange[1]] })}
                      className="h-8 text-xs w-full"
                      placeholder="Min"
                    />
                    <Input
                      type="number"
                      min={18}
                      max={65}
                      value={filters.ageRange[1]}
                      onChange={(e) => setFilters({ ageRange: [filters.ageRange[0], parseInt(e.target.value) || 65] })}
                      className="h-8 text-xs w-full"
                      placeholder="Max"
                    />
                  </div>
                </div>

                {/* Country Filter */}
                <div className="space-y-1">
                  <label className="text-xs font-medium">Country</label>
                  <Popover open={openCountry} onOpenChange={setOpenCountry}>
                    <PopoverTrigger asChild>
                      <Button variant="outline" className="h-8 text-xs w-full justify-between">
                        {filters.countries.length > 0 ? `${filters.countries.length} selected` : 'All'}
                        <Filter className="ml-2 h-3 w-3" />
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-[200px] p-0">
                      <Command>
                        <CommandInput placeholder="Search country..." className="h-8 text-xs" />
                        <CommandEmpty>No country found.</CommandEmpty>
                        <CommandGroup className="max-h-64 overflow-auto">
                          {COUNTRIES.map((country) => (
                            <CommandItem
                              key={country}
                              onSelect={() => {
                                const newCountries = filters.countries.includes(country)
                                  ? filters.countries.filter(c => c !== country)
                                  : [...filters.countries, country];
                                setFilters({ countries: newCountries });
                              }}
                              className="text-xs"
                            >
                              <Check className={`mr-2 h-3 w-3 ${filters.countries.includes(country) ? 'opacity-100' : 'opacity-0'}`} />
                              {country}
                            </CommandItem>
                          ))}
                        </CommandGroup>
                      </Command>
                    </PopoverContent>
                  </Popover>
                </div>

                {/* Native Languages */}
                <div className="space-y-1">
                  <label className="text-xs font-medium">Speaks</label>
                  <Popover open={openNative} onOpenChange={setOpenNative}>
                    <PopoverTrigger asChild>
                      <Button variant="outline" className="h-8 text-xs w-full justify-between">
                        {filters.nativeLanguages.length > 0 ? `${filters.nativeLanguages.length} selected` : 'Any'}
                        <Filter className="ml-2 h-3 w-3" />
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-[200px] p-0">
                      <Command>
                        <CommandInput placeholder="Search language..." className="h-8 text-xs" />
                        <CommandEmpty>No language found.</CommandEmpty>
                        <CommandGroup className="max-h-64 overflow-auto">
                          {LANGUAGES.map((lang) => (
                            <CommandItem
                              key={lang}
                              onSelect={() => {
                                const newLangs = filters.nativeLanguages.includes(lang)
                                  ? filters.nativeLanguages.filter(l => l !== lang)
                                  : [...filters.nativeLanguages, lang];
                                setFilters({ nativeLanguages: newLangs });
                              }}
                              className="text-xs"
                            >
                              <Check className={`mr-2 h-3 w-3 ${filters.nativeLanguages.includes(lang) ? 'opacity-100' : 'opacity-0'}`} />
                              {lang}
                            </CommandItem>
                          ))}
                        </CommandGroup>
                      </Command>
                    </PopoverContent>
                  </Popover>
                </div>

                {/* Learning Languages */}
                <div className="space-y-1">
                  <label className="text-xs font-medium">Learning</label>
                  <Popover open={openLearning} onOpenChange={setOpenLearning}>
                    <PopoverTrigger asChild>
                      <Button variant="outline" className="h-8 text-xs w-full justify-between">
                        {filters.learningLanguages.length > 0 ? `${filters.learningLanguages.length} selected` : 'Any'}
                        <Filter className="ml-2 h-3 w-3" />
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-[200px] p-0">
                      <Command>
                        <CommandInput placeholder="Search language..." className="h-8 text-xs" />
                        <CommandEmpty>No language found.</CommandEmpty>
                        <CommandGroup className="max-h-64 overflow-auto">
                          {LANGUAGES.map((lang) => (
                            <CommandItem
                              key={lang}
                              onSelect={() => {
                                const newLangs = filters.learningLanguages.includes(lang)
                                  ? filters.learningLanguages.filter(l => l !== lang)
                                  : [...filters.learningLanguages, lang];
                                setFilters({ learningLanguages: newLangs });
                              }}
                              className="text-xs"
                            >
                              <Check className={`mr-2 h-3 w-3 ${filters.learningLanguages.includes(lang) ? 'opacity-100' : 'opacity-0'}`} />
                              {lang}
                            </CommandItem>
                          ))}
                        </CommandGroup>
                      </Command>
                    </PopoverContent>
                  </Popover>
                </div>
              </div>
              
              {/* Online Status and Active Filters */}
              <div className="mt-3 pt-3 border-t flex flex-wrap items-center gap-2">
                <Button
                  size="sm"
                  variant={filters.onlineOnly ? "default" : "outline"}
                  onClick={() => setFilters({ onlineOnly: !filters.onlineOnly })}
                  className="h-7 text-xs"
                >
                  <div className={`w-2 h-2 rounded-full mr-2 ${filters.onlineOnly ? 'bg-white' : 'bg-green-500'}`} />
                  Online Only
                </Button>
                
                {/* Active Filter Badges */}
                {filters.gender.map((g) => (
                  <Badge key={g} variant="secondary" className="text-xs h-6 px-2">
                    {g}
                    <X 
                      className="ml-1 h-3 w-3 cursor-pointer" 
                      onClick={() => setFilters({ gender: filters.gender.filter(x => x !== g) })}
                    />
                  </Badge>
                ))}
                {filters.countries.map((c) => (
                  <Badge key={c} variant="secondary" className="text-xs h-6 px-2">
                    {c}
                    <X 
                      className="ml-1 h-3 w-3 cursor-pointer" 
                      onClick={() => setFilters({ countries: filters.countries.filter(x => x !== c) })}
                    />
                  </Badge>
                ))}
                {filters.nativeLanguages.map((l) => (
                  <Badge key={l} variant="secondary" className="text-xs h-6 px-2">
                    Speaks: {l}
                    <X 
                      className="ml-1 h-3 w-3 cursor-pointer" 
                      onClick={() => setFilters({ nativeLanguages: filters.nativeLanguages.filter(x => x !== l) })}
                    />
                  </Badge>
                ))}
                {filters.learningLanguages.map((l) => (
                  <Badge key={l} variant="secondary" className="text-xs h-6 px-2">
                    Learning: {l}
                    <X 
                      className="ml-1 h-3 w-3 cursor-pointer" 
                      onClick={() => setFilters({ learningLanguages: filters.learningLanguages.filter(x => x !== l) })}
                    />
                  </Badge>
                ))}
                {(filters.ageRange[0] !== 18 || filters.ageRange[1] !== 65) && (
                  <Badge variant="secondary" className="text-xs h-6 px-2">
                    Age: {filters.ageRange[0]}-{filters.ageRange[1]}
                    <X 
                      className="ml-1 h-3 w-3 cursor-pointer" 
                      onClick={() => setFilters({ ageRange: [18, 65] })}
                    />
                  </Badge>
                )}
              </div>
            </Card>
          )}

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
              <Card key={profile.id} className="p-4 hover:shadow-lg transition-shadow flex flex-col">
                <div className="flex gap-3 mb-3">
                  <div 
                    className="relative cursor-pointer hover:scale-105 transition-transform flex-shrink-0"
                    onClick={() => viewProfile(profile)}
                    title={`View ${profile.name}'s profile`}
                  >
                    <Avatar className="h-16 w-16">
                      <AvatarImage src={profile.avatar_url} />
                      <AvatarFallback>{profile.name?.[0] || '?'}</AvatarFallback>
                    </Avatar>
                    {profile.online && (
                      <span className="absolute bottom-0 right-0 h-3 w-3 bg-green-500 rounded-full border-2 border-background" />
                    )}
                  </div>

                  <div className="flex-1 min-w-0 flex flex-col">
                    <div className="flex items-center justify-between mb-1">
                      <h3 
                        className="text-sm font-semibold truncate cursor-pointer hover:text-primary"
                        onClick={() => viewProfile(profile)}
                      >
                        {profile.name}
                      </h3>
                      {profile.gender && (
                        <img 
                          src={
                            profile.gender === 'male' 
                              ? 'https://bblrxervgwkphkctdghe.supabase.co/storage/v1/object/public/rest_pic/male.png'
                              : profile.gender === 'female'
                              ? 'https://bblrxervgwkphkctdghe.supabase.co/storage/v1/object/public/rest_pic/female.png'
                              : 'https://bblrxervgwkphkctdghe.supabase.co/storage/v1/object/public/rest_pic/others.png'
                          }
                          alt={profile.gender}
                          className="h-4 w-4 ml-2 flex-shrink-0"
                        />
                      )}
                    </div>
                    
                    <div className="flex items-center gap-1 text-muted-foreground text-xs mb-2">
                      {profile.country && (
                        <span className="truncate">{profile.countryFlag} {profile.country}</span>
                      )}
                      {profile.age && (
                        <span>{profile.age}y</span>
                      )}
                    </div>

                    <div className="flex gap-2">
                      {profile.nativeLanguages.length > 0 && (
                        <div className="flex gap-1 flex-wrap">
                          {profile.nativeLanguages.slice(0, 2).map((lang, idx) => (
                            <Badge key={idx} variant="secondary" className="text-xs px-1.5 py-0 h-5">
                              {lang}
                            </Badge>
                          ))}
                        </div>
                      )}
                      
                      {profile.learningLanguages.length > 0 && (
                        <div className="flex gap-1 flex-wrap">
                          {profile.learningLanguages.slice(0, 2).map((lang, idx) => (
                            <Badge key={idx} variant="outline" className="text-xs px-1.5 py-0 h-5">
                              {lang}
                            </Badge>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {profile.bio && (
                  <p className="text-xs text-muted-foreground mb-3 line-clamp-2">
                    {profile.bio}
                  </p>
                )}

                <div className="flex gap-2 w-full mt-auto">
                  <Button
                    onClick={() => startConversation(profile.id)}
                    className="flex-1 h-8 text-xs"
                    size="sm"
                  >
                    <MessageCircle className="h-3 w-3 mr-1" />
                    Send
                  </Button>
                  <Button
                    variant="ghost"
                    className={`h-8 px-3 text-xs ${userReactions[profile.id] ? 'text-red-500' : ''}`}
                    size="sm"
                    onClick={async () => {
                      const success = await toggleReaction(profile.id);
                      if (success) {
                        toast.success(
                          userReactions[profile.id] 
                            ? 'Removed from favorites' 
                            : `Added ${profile.name} to favorites!`
                        );
                      } else {
                        toast.error('Failed to update reaction');
                      }
                    }}
                  >
                    <Heart className={`h-3 w-3 ${userReactions[profile.id] ? 'fill-current' : ''}`} />
                    {reactions[profile.id] > 0 && (
                      <span className="ml-1 text-xs">{reactions[profile.id]}</span>
                    )}
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
