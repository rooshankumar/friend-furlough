import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Globe, Languages, Users, Heart } from 'lucide-react';
import { useAuthStore } from '@/stores/authStore';
import roshLinguaLogo from '@/assets/roshlingua-logo.png';

const WelcomePage = () => {
  const navigate = useNavigate();
  const { user, profile, isAuthenticated } = useAuthStore();

  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/auth/signin');
    }
  }, [isAuthenticated, navigate]);

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
              <img 
                src={roshLinguaLogo} 
                alt="roshLingua" 
                className="h-24 w-24 mx-auto mb-6 animate-cultural-float"
              />
              <h1 className="text-4xl font-bold text-cultural-gradient mb-4">
                Welcome to roshLingua, {user?.email?.split('@')[0] || 'Friend'}! 🎉
              </h1>
              <p className="text-lg text-muted-foreground">
                Let's set up your cultural profile and start your global journey
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
