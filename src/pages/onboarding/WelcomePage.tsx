import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Globe, Languages, Users, Heart, Camera, Loader2 } from 'lucide-react';
import { useAuthStore } from '@/stores/authStore';
import { uploadAvatar } from '@/lib/storage';
import { useToast } from '@/hooks/use-toast';
import roshLinguaLogo from '@/assets/roshlingua-logo.png';

const WelcomePage = () => {
  const navigate = useNavigate();
  const { user, profile, isAuthenticated, updateProfile } = useAuthStore();
  const { toast } = useToast();
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);

  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/auth/signin');
    }
  }, [isAuthenticated, navigate]);

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user?.id) return;

    try {
      setIsUploading(true);
      setAvatarPreview(URL.createObjectURL(file));
      const avatarUrl = await uploadAvatar(file, user.id);
      await updateProfile({ avatar_url: avatarUrl });
      
      toast({
        title: "Avatar uploaded",
        description: "Your profile photo has been set!"
      });
    } catch (error: any) {
      toast({
        title: "Upload failed",
        description: error.message,
        variant: "destructive"
      });
      setAvatarPreview(null);
    } finally {
      setIsUploading(false);
    }
  };

  const features = [
    {
      icon: <Globe className="h-12 w-12 text-primary" />,
      title: "Discover Cultures",
      description: "Connect with people from 195+ countries and explore their unique traditions"
    },
    {
      icon: <Languages className="h-12 w-12 text-secondary" />,
      title: "Language Exchange",
      description: "Practice languages with native speakers in a supportive environment"
    },
    {
      icon: <Users className="h-12 w-12 text-accent" />,
      title: "Build Friendships",
      description: "Form meaningful international connections through cultural exchange"
    },
    {
      icon: <Heart className="h-12 w-12 text-success" />,
      title: "Safe Community",
      description: "Join a respectful platform focused on learning and cultural appreciation"
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-subtle flex items-center justify-center p-4">
      <div className="max-w-4xl w-full">
        <Card className="shadow-xl">
          <CardContent className="p-8 md:p-12">
            <div className="text-center mb-8">
              <div className="relative inline-block mb-6">
                <Avatar className="h-24 w-24 mx-auto border-4 border-primary/20">
                  <AvatarImage src={avatarPreview || profile?.avatar_url || undefined} />
                  <AvatarFallback className="bg-gradient-cultural text-white text-3xl">
                    {user?.email?.[0]?.toUpperCase() || '?'}
                  </AvatarFallback>
                </Avatar>
                <label htmlFor="welcome-avatar-upload">
                  <Button
                    size="sm"
                    className="absolute -bottom-1 -right-1 rounded-full h-10 w-10 p-0 shadow-lg"
                    disabled={isUploading}
                    asChild
                  >
                    <span>
                      {isUploading ? (
                        <Loader2 className="h-5 w-5 animate-spin" />
                      ) : (
                        <Camera className="h-5 w-5" />
                      )}
                    </span>
                  </Button>
                  <input
                    id="welcome-avatar-upload"
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={handleAvatarUpload}
                  />
                </label>
              </div>
              <h1 className="text-4xl font-bold text-cultural-gradient mb-4">
                Welcome to roshLingua, {user?.email?.split('@')[0] || 'Friend'}! 🎉
              </h1>
              <p className="text-lg text-muted-foreground">
                {avatarPreview || profile?.avatar_url 
                  ? "Looking great! Now let's set up your cultural profile" 
                  : "Upload a profile picture and set up your cultural profile"}
              </p>
            </div>

            <div className="grid md:grid-cols-2 gap-6 mb-8">
              {features.map((feature, index) => (
                <div key={index} className="flex items-start space-x-4 p-4 rounded-lg bg-accent/10">
                  <div className="flex-shrink-0">
                    {feature.icon}
                  </div>
                  <div>
                    <h3 className="font-semibold text-lg mb-2">{feature.title}</h3>
                    <p className="text-sm text-muted-foreground">{feature.description}</p>
                  </div>
                </div>
              ))}
            </div>

            <div className="text-center space-y-4">
              <p className="text-muted-foreground">
                It only takes 2 minutes to complete your profile
              </p>
              <Button 
                size="lg" 
                className="bg-gradient-cultural text-white px-8"
                onClick={() => navigate('/onboarding/cultural-profile')}
              >
                Start Your Cultural Journey
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default WelcomePage;
