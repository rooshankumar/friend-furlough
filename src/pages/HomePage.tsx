import React, { memo, useMemo, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { CulturalBadge } from "@/components/CulturalBadge";
import { Globe, MessageCircle, Users, Heart, Languages, MapPin } from "lucide-react";
import { Link, Navigate } from "react-router-dom";
import roshLinguaLogo from "@/assets/roshlingua-logo.png";
import { useHomePageOptimization } from "@/hooks/usePageOptimization";
import { LazyImage } from "@/components/optimized/LazyImage";
import { useAuthStore } from "@/stores/authStore";
import { DarkModeToggle } from "@/components/DarkModeToggle";

// Memoized feature card component
const FeatureCard = memo<{
  icon: React.ReactNode;
  title: string;
  description: string;
}>(({ icon, title, description }) => (
  <div className="text-center p-6 rounded-lg border bg-card hover:shadow-lg transition-shadow duration-200">
    <div className="flex justify-center mb-4">{icon}</div>
    <h3 className="text-xl font-semibold mb-2">{title}</h3>
    <p className="text-muted-foreground leading-relaxed">{description}</p>
  </div>
));

FeatureCard.displayName = 'FeatureCard';

// Memoized testimonial card component
const TestimonialCard = memo<{
  name: string;
  country: string;
  flag: string;
  text: string;
  languages: string[];
}>(({ name, country, flag, text, languages }) => (
  <div className="bg-card p-6 rounded-lg border shadow-sm hover:shadow-md transition-shadow duration-200">
    <div className="flex items-center mb-4">
      <div className="text-2xl mr-3">{flag}</div>
      <div>
        <h4 className="font-semibold">{name}</h4>
        <p className="text-sm text-muted-foreground">{country}</p>
      </div>
    </div>
    <p className="text-muted-foreground mb-4 italic">"{text}"</p>
    <div className="flex flex-wrap gap-1">
      {languages.map((lang) => (
        <CulturalBadge key={lang} type="language-learning">
          {lang}
        </CulturalBadge>
      ))}
    </div>
  </div>
));

TestimonialCard.displayName = 'TestimonialCard';

const HomePage = () => {
  // Check if user is authenticated and redirect to explore
  const { isAuthenticated, onboardingCompleted } = useAuthStore();
  
  // Redirect authenticated users to explore page
  if (isAuthenticated && onboardingCompleted) {
    return <Navigate to="/explore" replace />;
  }
  
  // Performance optimization
  const { trackMetric, preloadData } = useHomePageOptimization();

  // Track page render time
  useEffect(() => {
    const startTime = performance.now();
    const endTime = performance.now();
    trackMetric('render_time', endTime - startTime);

    // Preload related pages
    preloadData(['explore', 'community', 'auth']);
  }, [trackMetric, preloadData]);

  // Memoized data to prevent re-renders
  const culturalFeatures = useMemo(() => [
    {
      icon: <Globe className="h-8 w-8 text-primary" />,
      title: "Cultural Discovery",
      description: "Connect with people from 195+ countries and learn about their unique traditions, customs, and daily life."
    },
    {
      icon: <Languages className="h-8 w-8 text-secondary" />,
      title: "Language Exchange",
      description: "Practice languages with native speakers and help others learn your language in a friendly, supportive environment."
    },
    {
      icon: <MessageCircle className="h-8 w-8 text-accent" />,
      title: "Meaningful Conversations",
      description: "Build genuine friendships through respectful cultural exchange and language practice sessions."
    },
    {
      icon: <Users className="h-8 w-8 text-success" />,
      title: "Safe Community",
      description: "Join a moderated platform focused on learning, respect, and building international friendships."
    }
  ], []);

  const testimonials = useMemo(() => [
    {
      name: "Maria Santos",
      country: "Brazil",
      flag: "🇧🇷",
      text: "Through roshLingua, I've learned so much about Japanese culture while practicing English. The connections I've made feel like real friendships!",
      languages: ["Portuguese", "English", "Japanese"]
    },
    {
      name: "Ahmed Hassan", 
      country: "Egypt",
      flag: "🇪🇬",
      text: "What I love most is sharing my culture through photos of Cairo while learning French from my language partner in Montreal.",
      languages: ["Arabic", "French", "English"]
    },
    {
      name: "Yuki Tanaka",
      country: "Japan", 
      flag: "🇯🇵",
      text: "The cultural exchange here goes beyond just language. I've learned to cook Brazilian dishes and understand Middle Eastern traditions!",
      languages: ["Japanese", "Portuguese", "English"]
    }
  ], []);

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-muted to-card-cultural">
      {/* Navigation Header */}
      <header className="sticky top-0 z-50 bg-background/95 backdrop-blur-sm border-b shadow-sm">
        <div className="container mx-auto px-4 py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <img src={roshLinguaLogo} alt="roshLingua" className="h-8 w-8" />
              <span className="text-lg md:text-xl font-bold text-primary">roshLingua</span>
            </div>
            
            <div className="flex items-center space-x-4">
              <DarkModeToggle />
              <Button variant="outline" size="sm" asChild>
                <Link to="/auth/signin">Sign In</Link>
              </Button>
              <Button size="sm" asChild>
                <Link to="/auth/signup">Join Free</Link>
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-hero opacity-10"></div>
        <div className="relative container mx-auto px-4 py-20 text-center">
          <div className="max-w-4xl mx-auto">
            <img 
              src={roshLinguaLogo} 
              alt="roshLingua Mascot" 
              className="h-32 w-32 mx-auto mb-8 animate-cultural-float"
            />
            
            <h1 className="text-hero text-cultural-gradient mb-6">
              Connect Cultures, Learn Languages, Build Friendships
            </h1>
            
            <p className="text-cultural-warm max-w-2xl mx-auto mb-12">
              Join a global community where cultural exchange meets language learning. 
              Discover new traditions, practice languages with native speakers, and form 
              meaningful international friendships in a safe, respectful environment.
            </p>

            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center mb-16">
              <Button variant="hero" size="lg" className="px-8 py-6" asChild>
                <Link to="/auth/signup">Start Your Cultural Journey</Link>
              </Button>
              <Button variant="outline" size="lg" className="px-8 py-6" asChild>
                <Link to="/explore">Explore Community</Link>
              </Button>
            </div>

            {/* Cultural Stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6 max-w-3xl mx-auto">
              <div className="card-cultural p-6 text-center">
                <div className="text-2xl font-bold text-primary mb-2">195+</div>
                <div className="text-sm text-muted-foreground">Countries</div>
              </div>
              <div className="card-cultural p-6 text-center">
                <div className="text-2xl font-bold text-secondary mb-2">50+</div>
                <div className="text-sm text-muted-foreground">Languages</div>
              </div>
              <div className="card-cultural p-6 text-center">
                <div className="text-2xl font-bold text-accent mb-2">10K+</div>
                <div className="text-sm text-muted-foreground">Cultural Posts</div>
              </div>
              <div className="card-cultural p-6 text-center">
                <div className="text-2xl font-bold text-success mb-2">25K+</div>
                <div className="text-sm text-muted-foreground">Friendships</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 bg-card/30">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-primary mb-4">
              Why Choose roshLingua?
            </h2>
            <p className="text-cultural-warm max-w-2xl mx-auto">
              More than just language learning - it's about building bridges between cultures 
              and forming genuine international connections.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            {culturalFeatures.map((feature, index) => (
              <FeatureCard
                key={index}
                icon={feature.icon}
                title={feature.title}
                description={feature.description}
              />
            ))}
          </div>
        </div>
      </section>

      {/* Cultural Showcase */}
      <section className="py-20">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-primary mb-4">
              Real Cultural Connections
            </h2>
            <p className="text-cultural-warm max-w-2xl mx-auto">
              See how our community members are building friendships and learning 
              about cultures from around the world.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto">
            {testimonials.map((testimonial, index) => (
              <TestimonialCard
                key={index}
                name={testimonial.name}
                country={testimonial.country}
                flag={testimonial.flag}
                text={testimonial.text}
                languages={testimonial.languages}
              />
            ))}
          </div>
        </div>
      </section>

      {/* Call to Action */}
      <section className="py-20 bg-gradient-cultural text-white">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-3xl md:text-4xl font-bold mb-6">
            Ready to Start Your Cultural Adventure?
          </h2>
          <p className="text-lg mb-12 max-w-2xl mx-auto opacity-90">
            Join thousands of people already connecting across cultures, learning languages, 
            and building lifelong international friendships.
          </p>
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button variant="outline" size="lg" className="bg-white text-primary hover:bg-white/90 px-8" asChild>
              <Link to="/auth/signup">Join Free Today</Link>
            </Button>
            <Button variant="ghost" size="lg" className="text-white border-white hover:bg-white/10 px-8" asChild>
              <Link to="/explore">Browse Cultures</Link>
            </Button>
          </div>
        </div>
      </section>
    </div>
  );
};

export default HomePage;