import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Separator } from '@/components/ui/separator';
import { Progress } from '@/components/ui/progress';
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
  Utensils
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useAuthStore } from '@/stores/authStore';
import { CulturalBadge } from '@/components/CulturalBadge';

const ProfilePage = () => {
  const { username } = useParams();
  const [isOwnProfile, setIsOwnProfile] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const { toast } = useToast();
  
  const { user } = useAuthStore();

  useEffect(() => {
    // Check if viewing own profile
    setIsOwnProfile(!username || username === user?.name?.toLowerCase().replace(/\s+/g, ''));
  }, [username, user]);

  // Mock user data - in real app this would come from API
  const profileUser = {
    id: '1',
    name: 'Maria Santos',
    email: 'maria@example.com',
    country: 'Brazil',
    countryCode: 'BR',
    countryFlag: '🇧🇷',
    city: 'São Paulo',
    nativeLanguages: ['Portuguese'],
    learningLanguages: ['English', 'Spanish'],
    culturalInterests: ['music', 'food', 'festivals', 'travel', 'art'],
    bio: 'Passionate about sharing Brazilian culture and learning about the world! I love teaching Portuguese and learning English. Always excited to make new international friends and explore different traditions.',
    age: 25,
    profilePhoto: '/placeholder-user.jpg',
    online: true,
    joinedDate: '2024-01-15',
    languageGoals: ['Fluent English conversation', 'Spanish for travel'],
    lookingFor: ['Language practice', 'Cultural exchange', 'Travel tips'],
    teachingExperience: true,
    countriesVisited: ['Portugal', 'Argentina', 'Chile'],
    posts: [
      {
        id: '1',
        content: 'Just celebrated Festa Junina! 🎉 The traditional Brazilian festival with amazing food, music and dancing. Who wants to learn about our cultural celebrations?',
        images: ['festa1.jpg', 'festa2.jpg'],
        timestamp: '2024-01-15T10:30:00Z',
        reactions: 24,
        comments: 8
      },
      {
        id: '2', 
        content: 'Learning English idioms today! "Break a leg" doesn\'t mean what I thought 😅 Language learning is full of surprises!',
        timestamp: '2024-01-14T15:20:00Z',
        reactions: 15,
        comments: 5
      }
    ]
  };

  const stats = {
    friendsCount: 127,
    postsCount: 45,
    languagesLearning: 2,
    culturalExchanges: 89
  };

  const languageProgress = [
    { language: 'English', level: 'Intermediate', progress: 65 },
    { language: 'Spanish', level: 'Beginner', progress: 30 }
  ];

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
                    <Button size="sm" className="absolute -bottom-2 -right-2 rounded-full h-8 w-8 p-0">
                      <Camera className="h-4 w-4" />
                    </Button>
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
                    <span className="text-sm">{profileUser.city}, {profileUser.country}</span>
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
                      <CulturalBadge type="country" flag={profileUser.countryFlag}>{profileUser.country}</CulturalBadge>
                      <Badge variant="outline" className="text-xs">
                        Age {profileUser.age}
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
                        <Button variant="outline">
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
                      {profileUser.nativeLanguages.map((lang) => (
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
                      {profileUser.learningLanguages.map((lang) => (
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
                    {profileUser.culturalInterests.map((interest) => (
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
            {profileUser.posts.map((post) => (
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
                          <span>{new Date(post.timestamp).toLocaleDateString()}</span>
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
                        {post.reactions}
                      </span>
                      <span className="flex items-center gap-1">
                        <MessageCircle className="h-4 w-4" />
                        {post.comments}
                      </span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
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
                {languageProgress.map((lang) => (
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
                ))}
                
                {/* Language Goals */}
                <Separator />
                <div>
                  <h3 className="font-semibold mb-3">Language Goals</h3>
                  <div className="space-y-2">
                    {profileUser.languageGoals.map((goal, index) => (
                      <div key={index} className="flex items-center gap-2">
                        <div className="w-2 h-2 bg-primary rounded-full"></div>
                        <span className="text-sm">{goal}</span>
                      </div>
                    ))}
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
                      {profileUser.countriesVisited.map((country) => (
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
    </div>
  );
};

export default ProfilePage;