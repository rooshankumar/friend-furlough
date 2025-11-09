import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Globe, Languages, Users, Camera, Loader2, ArrowRight } from 'lucide-react';
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
      icon: <Globe className="h-8 w-8 text-primary" />,
      title: "Discover Cultures",
      description: "Connect with people worldwide"
    },
    {
      icon: <Languages className="h-8 w-8 text-secondary" />,
      title: "Language Exchange",
      description: "Practice with native speakers"
    },
    {
      icon: <Users className="h-8 w-8 text-accent" />,
      title: "Build Friendships",
      description: "Form international connections"
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-subtle flex items-center justify-center p-3">
      <div className="max-w-md w-full">
        <Card className="shadow-lg">
          <CardContent className="p-4 sm:p-6">
            {/* Header */}
            <div className="text-center mb-4">
              <img src={roshLinguaLogo} alt="roshLingua" className="h-12 w-12 mx-auto mb-3" />
              <h1 className="text-xl sm:text-2xl font-bold text-cultural-gradient mb-2">
                Welcome! 🎉
              </h1>
              <p className="text-sm text-muted-foreground">
                Let's set up your profile in 2 minutes
              </p>
            </div>

            {/* Avatar Upload */}
            <div className="text-center mb-4">
              <div className="relative inline-block">
                <Avatar className="h-20 w-20 mx-auto border-2 border-primary/20">
                  <AvatarImage src={avatarPreview || profile?.avatar_url || undefined} />
                  <AvatarFallback className="bg-gradient-cultural text-white text-2xl">
                    {user?.email?.[0]?.toUpperCase() || '?'}
                  </AvatarFallback>
                </Avatar>
                <label htmlFor="welcome-avatar-upload">
                  <Button
                    size="sm"
                    className="absolute -bottom-1 -right-1 rounded-full h-8 w-8 p-0 shadow-md"
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
                    id="welcome-avatar-upload"
                    type="file"
                    accept="image/jpeg,image/jpg,image/png,image/gif,image/webp"
                    className="hidden"
                    onChange={handleAvatarUpload}
                    style={{ display: 'none' }}
                  />
                </label>
              </div>
              <p className="text-xs text-muted-foreground mt-2">
                {avatarPreview || profile?.avatar_url ? 'Looking great!' : 'Add a photo (optional)'}
              </p>
            </div>

            {/* Features - Compact */}
            <div className="space-y-2 mb-4">
              {features.map((feature, index) => (
                <div key={index} className="flex items-center space-x-3 p-2 rounded-lg bg-accent/10">
                  <div className="flex-shrink-0">
                    {feature.icon}
                  </div>
                  <div>
                    <h3 className="font-semibold text-sm">{feature.title}</h3>
                    <p className="text-xs text-muted-foreground">{feature.description}</p>
                  </div>
                </div>
              ))}
            </div>

            {/* CTA Button */}
            <Button 
              size="lg" 
              className="w-full bg-gradient-cultural text-white"
              onClick={() => navigate('/onboarding/cultural-profile')}
            >
              Get Started
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default WelcomePage;
