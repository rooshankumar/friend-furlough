import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { User } from '@/types';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Separator } from '@/components/ui/separator';
import { Progress } from '@/components/ui/progress';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { 
  MessageCircle, 
  Globe, 
  Calendar,
  MapPin,
  Languages,
  Heart,
  Users,
  BookOpen,
  Camera,
  Settings,
  Edit,
  Share,
  MoreHorizontal,
  Award,
  Plane,
  Music,
  Utensils,
  Loader2
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useAuthStore } from '@/stores/authStore';
import { CulturalBadge } from '@/components/CulturalBadge';
import { uploadAvatar } from '@/lib/storage';
import { supabase } from '@/integrations/supabase/client';

const ProfilePage = () => {
  const { username } = useParams();
  const navigate = useNavigate();
  const [isOwnProfile, setIsOwnProfile] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editForm, setEditForm] = useState({ name: '', bio: '', age: 0 });
  const [isUploading, setIsUploading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const { toast } = useToast();
  
  const { user, updateProfile } = useAuthStore();

  useEffect(() => {
    setIsOwnProfile(!username || username === user?.email?.split('@')[0]?.toLowerCase());
  }, [username, user]);

  const [profileUser, setProfileUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!user?.id) {
      console.log('No authenticated user found');
      setError('Please sign in to view profiles');
      setLoading(false);
      return;
    }
    
    async function fetchProfile() {
      console.log('Fetching profile for user:', user.id);
      setLoading(true);
      setError(null);
      
      try {
        const { fetchProfileById } = await import('@/integrations/supabase/fetchProfileById');
        const profile = await fetchProfileById(user.id);
        
        if (!profile) {
          console.error('No profile found for user:', user.id);
          setError('Profile not found');
          setProfileUser(null);
          return;
        }

        // Merge auth user data with profile data
        const fullProfile: User = {
          ...profile,
          email: user.email || '',  // Get email from auth user
        };

        console.log('Setting profile data:', fullProfile);
        setProfileUser(fullProfile);
        setEditForm({
          name: fullProfile.name || '',
          bio: fullProfile.bio || '',
          age: fullProfile.age || 0
        });
        
      } catch (error: any) {
        console.error('Profile fetch error:', error);
        setError(error.message || 'Failed to load profile');
        setProfileUser(null);
      } finally {
        setLoading(false);
      }
    }
    
    fetchProfile();
  }, [username, user]);


  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user?.id) return;

    try {
      setIsUploading(true);
      const avatarUrl = await uploadAvatar(file, user.id);
      await updateProfile({ avatar_url: avatarUrl });
      
      if (profileUser) {
        setProfileUser({ ...profileUser, profilePhoto: avatarUrl });
      }
      
      toast({
        title: "Avatar updated",
        description: "Your profile photo has been updated successfully."
      });
    } catch (error: any) {
      toast({
        title: "Upload failed",
        description: error.message,
        variant: "destructive"
      });
    } finally {
      setIsUploading(false);
    }
  };

  const handleSaveProfile = async () => {
    if (!user?.id) return;

    try {
      setIsSaving(true);
      await updateProfile({
        name: editForm.name,
        bio: editForm.bio,
        age: editForm.age
      });

      if (profileUser) {
        setProfileUser({
          ...profileUser,
          name: editForm.name,
          bio: editForm.bio,
          age: editForm.age
        });
      }

      setIsEditing(false);
      toast({
        title: "Profile updated",
        description: "Your changes have been saved successfully."
      });
    } catch (error: any) {
      toast({
        title: "Update failed",
        description: error.message,
        variant: "destructive"
      });
    } finally {
      setIsSaving(false);
    }
  };

  // Fetch post count for the user
  const [postsCount, setPostsCount] = useState(0);
  
  useEffect(() => {
    if (!user?.id) return;
    
    async function fetchPostCount() {
      const { count, error } = await supabase
        .from('community_posts')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', user.id);
      
      if (!error && count !== null) {
        setPostsCount(count);
      }
    }
    
    fetchPostCount();
  }, [user?.id]);

  // Placeholder stats and languageProgress until real data is available
  const stats = {
    friendsCount: 0,
    postsCount: postsCount,
    languagesLearning: profileUser?.learningLanguages?.length || 0,
    culturalExchanges: 0
  };
  const languageProgress = [];


  if (!user) return (
    <div className="p-8 text-center">
      <p className="text-red-500">Please sign in to view profiles</p>
    </div>
  );

  if (loading) return (
    <div className="p-8 text-center">
      <p>Loading profile...</p>
      <p className="text-sm text-gray-500">User ID: {user?.id}</p>
    </div>
  );
  
  if (error) return (
    <div className="p-8 text-center">
      <p className="text-red-500">{error}</p>
      <p className="text-sm text-gray-500">User ID: {user?.id}</p>
      <pre className="mt-4 text-left text-xs text-gray-600 bg-gray-100 p-4 rounded">
        Debug info:
        {JSON.stringify({ user, profileUser }, null, 2)}
      </pre>
      <button 
        className="mt-4 text-blue-500 text-sm"
        onClick={() => window.location.reload()}
      >
        Retry loading profile
      </button>
    </div>
  );
  
  if (!profileUser) return (
    <div className="p-8 text-center">
      <p>Profile not found</p>
      <p className="text-sm text-gray-500">User ID: {user?.id}</p>
      <button 
        className="mt-4 text-blue-500 text-sm"
        onClick={() => window.location.reload()}
      >
        Retry loading profile
      </button>
    </div>
  );

  // Debug: show raw profile data if something is wrong
  if (profileUser && typeof profileUser === 'object' && !profileUser.name) {
    return (
      <div className="p-8 text-center text-yellow-600">
        Profile loaded but missing expected fields.<br />
        <pre style={{textAlign:'left',margin:'1em auto',maxWidth:600,overflow:'auto',background:'#f9f9f9',padding:'1em',borderRadius:'8px'}}>{JSON.stringify(profileUser, null, 2)}</pre>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-subtle">
      <div className="container mx-auto px-4 py-8 max-w-6xl">
        {/* Profile Header */}
        <Card className="mb-6">
          <CardContent className="pt-6">
            <div className="flex flex-col lg:flex-row lg:items-start gap-6">
              {/* Profile Image & Basic Info */}
              <div className="flex flex-col items-center lg:items-start">
                <div className="relative">
                  <Avatar className="h-32 w-32 border-4 border-primary/20">
                    <AvatarImage src={profileUser.profilePhoto} />
                    <AvatarFallback className="bg-gradient-cultural text-white text-2xl">
                      {profileUser.name[0]}
                    </AvatarFallback>
                  </Avatar>
                  {isOwnProfile && (
                    <label htmlFor="avatar-upload">
                      <Button 
                        size="sm" 
                        className="absolute -bottom-2 -right-2 rounded-full h-8 w-8 p-0"
                        disabled={isUploading}
                        asChild
                      >
                        <span>
                          {isUploading ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : (
                            <Camera className="h-4 w-4" />
                          )}
                        </span>
                      </Button>
                      <input
                        id="avatar-upload"
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={handleAvatarUpload}
                      />
                    </label>
                  )}
                </div>
                
                {/* Status & Location */}
                <div className="text-center lg:text-left mt-4 space-y-2">
                  <div className="flex items-center justify-center lg:justify-start gap-2">
                    <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                    <span className="text-sm text-muted-foreground">Online</span>
                  </div>
                  <div className="flex items-center justify-center lg:justify-start gap-2 text-muted-foreground">
                    <MapPin className="h-4 w-4" />
                    <span className="text-sm">{profileUser.city || ''}, {profileUser.country || ''}</span>
                  </div>
                  <div className="flex items-center justify-center lg:justify-start gap-2 text-muted-foreground">
                    <Calendar className="h-4 w-4" />
                    <span className="text-sm">Joined {new Date(profileUser.joinedDate).toLocaleDateString()}</span>
                  </div>
                </div>
              </div>

              {/* Profile Details */}
              <div className="flex-1">
                <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4 mb-4">
                  <div>
                    <h1 className="text-3xl font-bold text-foreground mb-2">
                      {profileUser.name}
                    </h1>
                    <div className="flex items-center gap-3 flex-wrap">
                      <CulturalBadge type="country" flag={profileUser.countryFlag || ''}>{profileUser.country || ''}</CulturalBadge>
                      <Badge variant="outline" className="text-xs">
                        Age {profileUser.age || ''}
                      </Badge>
                      {profileUser.teachingExperience && (
                        <Badge className="bg-gradient-cultural text-white text-xs">
                          <Award className="h-3 w-3 mr-1" />
                          Teacher
                        </Badge>
                      )}
                    </div>
                  </div>
                  
                  {/* Action Buttons */}
                  <div className="flex items-center gap-2">
                    {isOwnProfile ? (
                      <>
                        <Button 
                          variant="outline" 
                          onClick={() => setIsEditing(!isEditing)}
                        >
                          <Edit className="h-4 w-4 mr-2" />
                          Edit Profile
                        </Button>
                        <Button variant="outline" onClick={() => navigate('/settings')}>
                          <Settings className="h-4 w-4 mr-2" />
                          Settings
                        </Button>
                      </>
                    ) : (
                      <>
                        <Button className="bg-gradient-cultural text-white">
                          <MessageCircle className="h-4 w-4 mr-2" />
                          Message
                        </Button>
                        <Button variant="outline">
                          <Users className="h-4 w-4 mr-2" />
                          Connect
                        </Button>
                        <Button variant="ghost" size="sm">
                          <Share className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="sm">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </>
                    )}
                  </div>
                </div>

                {/* Bio */}
                <p className="text-muted-foreground leading-relaxed mb-4">
                  {profileUser.bio}
                </p>

                {/* Languages */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
                  <div>
                    <h3 className="font-semibold mb-2 flex items-center gap-2">
                      <Languages className="h-4 w-4" />
                      Native Languages
                    </h3>
                    <div className="flex flex-wrap gap-2">
                      {(profileUser.nativeLanguages || []).map((lang: string) => (
                        <Badge key={lang} className="bg-gradient-cultural text-white">
                          {lang}
                        </Badge>
                      ))}
                    </div>
                  </div>
                  <div>
                    <h3 className="font-semibold mb-2 flex items-center gap-2">
                      <BookOpen className="h-4 w-4" />
                      Learning Languages
                    </h3>
                    <div className="flex flex-wrap gap-2">
                      {(profileUser.learningLanguages || []).map((lang: string) => (
                        <Badge key={lang} variant="outline">
                          {lang}
                        </Badge>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Cultural Interests */}
                <div className="mb-4">
                  <h3 className="font-semibold mb-2 flex items-center gap-2">
                    <Globe className="h-4 w-4" />
                    Cultural Interests
                  </h3>
                  <div className="flex flex-wrap gap-2">
                    {(profileUser.culturalInterests || []).map((interest: string) => (
                      <Badge key={interest} variant="secondary" className="text-xs">
                        #{interest}
                      </Badge>
                    ))}
                  </div>
                </div>

                {/* Stats */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-primary">{stats.friendsCount}</div>
                    <div className="text-xs text-muted-foreground">Friends</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-primary">{stats.postsCount}</div>
                    <div className="text-xs text-muted-foreground">Posts</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-primary">{stats.languagesLearning}</div>
                    <div className="text-xs text-muted-foreground">Languages</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-primary">{stats.culturalExchanges}</div>
                    <div className="text-xs text-muted-foreground">Exchanges</div>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Profile Content Tabs */}
        <Tabs defaultValue="posts" className="space-y-6">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="posts">Posts</TabsTrigger>
            <TabsTrigger value="languages">Languages</TabsTrigger>
            <TabsTrigger value="culture">Culture</TabsTrigger>
            <TabsTrigger value="activity">Activity</TabsTrigger>
          </TabsList>

          {/* Posts Tab */}
          <TabsContent value="posts" className="space-y-6">
            {(profileUser.posts || []).length === 0 ? (
              <div className="text-center text-muted-foreground">No posts yet.</div>
            ) : (
              (profileUser.posts || []).map((post: any) => (
                <Card key={post.id}>
                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between">
                      <div className="flex items-start space-x-3">
                        <Avatar className="h-10 w-10">
                          <AvatarImage src={profileUser.profilePhoto} />
                          <AvatarFallback className="bg-gradient-cultural text-white">
                            {profileUser.name[0]}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <h3 className="font-semibold">{profileUser.name}</h3>
                          <div className="flex items-center gap-2 text-sm text-muted-foreground">
                            <span>{post.timestamp ? new Date(post.timestamp).toLocaleDateString() : ''}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <p className="text-foreground leading-relaxed mb-4">
                      {post.content}
                    </p>
                    <div className="flex items-center justify-between text-sm text-muted-foreground border-t border-border/50 pt-3">
                      <div className="flex items-center gap-4">
                        <span className="flex items-center gap-1">
                          <Heart className="h-4 w-4" />
                          {Array.isArray(post.reactions) ? post.reactions.length : 0}
                        </span>
                        <span className="flex items-center gap-1">
                          <MessageCircle className="h-4 w-4" />
                          {Array.isArray(post.comments) ? post.comments.length : 0}
                        </span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </TabsContent>

          {/* Languages Tab */}
          <TabsContent value="languages" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Languages className="h-5 w-5" />
                  Language Learning Progress
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                {(languageProgress || []).length === 0 ? (
                  <div className="text-center text-muted-foreground">No language progress data.</div>
                ) : (
                  (languageProgress || []).map((lang: any) => (
                    <div key={lang.language} className="space-y-2">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span className="font-medium">{lang.language}</span>
                          <Badge variant="outline" className="text-xs">
                            {lang.level}
                          </Badge>
                        </div>
                        <span className="text-sm text-muted-foreground">
                          {lang.progress}%
                        </span>
                      </div>
                      <Progress value={lang.progress} className="h-2" />
                    </div>
                  ))
                )}
                
                {/* Language Goals */}
                <Separator />
                <div>
                  <h3 className="font-semibold mb-3">Language Goals</h3>
                  <div className="space-y-2">
                    {(profileUser.languageGoals || []).length === 0 ? (
                      <div className="text-center text-muted-foreground">No language goals set.</div>
                    ) : (
                      (profileUser.languageGoals || []).map((goal: string, index: number) => (
                        <div key={index} className="flex items-center gap-2">
                          <div className="w-2 h-2 bg-primary rounded-full"></div>
                          <span className="text-sm">{goal}</span>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Culture Tab */}
          <TabsContent value="culture" className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Cultural Background */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Globe className="h-5 w-5" />
                    Cultural Background
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center gap-3">
                    <span className="text-2xl">{profileUser.countryFlag}</span>
                    <div>
                      <p className="font-medium">{profileUser.country}</p>
                      <p className="text-sm text-muted-foreground">{profileUser.city}</p>
                    </div>
                  </div>
                  
                  <Separator />
                  
                  <div>
                    <h4 className="font-medium mb-2 flex items-center gap-2">
                      <Plane className="h-4 w-4" />
                      Countries Visited
                    </h4>
                    <div className="flex flex-wrap gap-2">
                      {(profileUser.countriesVisited || []).map((country: string) => (
                        <Badge key={country} variant="outline" className="text-xs">
                          {country}
                        </Badge>
                      ))}
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Cultural Interests */}
              <Card>
                <CardHeader>
                  <CardTitle>Cultural Passions</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="flex items-center gap-3 p-3 bg-accent/50 rounded-lg">
                      <Music className="h-5 w-5 text-primary" />
                      <span className="text-sm">Music</span>
                    </div>
                    <div className="flex items-center gap-3 p-3 bg-accent/50 rounded-lg">
                      <Utensils className="h-5 w-5 text-primary" />
                      <span className="text-sm">Food</span>
                    </div>
                    <div className="flex items-center gap-3 p-3 bg-accent/50 rounded-lg">
                      <Globe className="h-5 w-5 text-primary" />
                      <span className="text-sm">Travel</span>
                    </div>
                    <div className="flex items-center gap-3 p-3 bg-accent/50 rounded-lg">
                      <Award className="h-5 w-5 text-primary" />
                      <span className="text-sm">Festivals</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Activity Tab */}
          <TabsContent value="activity" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Recent Activity</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center gap-3 p-3 bg-accent/30 rounded-lg">
                    <MessageCircle className="h-5 w-5 text-primary" />
                    <div>
                      <p className="text-sm font-medium">Started a conversation with João from Portugal</p>
                      <p className="text-xs text-muted-foreground">2 hours ago</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 p-3 bg-accent/30 rounded-lg">
                    <Heart className="h-5 w-5 text-red-500" />
                    <div>
                      <p className="text-sm font-medium">Reacted to a cultural post about Japanese tea ceremony</p>
                      <p className="text-xs text-muted-foreground">5 hours ago</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 p-3 bg-accent/30 rounded-lg">
                    <BookOpen className="h-5 w-5 text-primary" />
                    <div>
                      <p className="text-sm font-medium">Completed English conversation practice</p>
                      <p className="text-xs text-muted-foreground">1 day ago</p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>

      {/* Edit Profile Dialog */}
      <Dialog open={isEditing} onOpenChange={setIsEditing}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Edit Profile</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="edit-name">Name</Label>
              <Input
                id="edit-name"
                value={editForm.name}
                onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                placeholder="Your name"
              />
            </div>
            <div>
              <Label htmlFor="edit-bio">Bio</Label>
              <Textarea
                id="edit-bio"
                value={editForm.bio}
                onChange={(e) => setEditForm({ ...editForm, bio: e.target.value })}
                placeholder="Tell us about yourself"
                rows={4}
              />
            </div>
            <div>
              <Label htmlFor="edit-age">Age</Label>
              <Input
                id="edit-age"
                type="number"
                value={editForm.age || ''}
                onChange={(e) => setEditForm({ ...editForm, age: parseInt(e.target.value) || 0 })}
                placeholder="Your age"
              />
            </div>
            <div className="flex gap-2">
              <Button
                onClick={handleSaveProfile}
                disabled={isSaving}
                className="flex-1"
              >
                {isSaving ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Saving...
                  </>
                ) : (
                  'Save Changes'
                )}
              </Button>
              <Button
                variant="outline"
                onClick={() => setIsEditing(false)}
                disabled={isSaving}
              >
                Cancel
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default ProfilePage;