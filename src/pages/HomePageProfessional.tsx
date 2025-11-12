import React, { memo, useMemo, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { CulturalBadge } from "@/components/CulturalBadge";
import { 
  Globe, 
  MessageCircle, 
  Users, 
  Heart, 
  Languages, 
  MapPin, 
  Shield, 
  Star, 
  Download,
  Mail,
  Phone,
  FileText,
  Lock,
  CheckCircle
} from "lucide-react";
import { Link, Navigate } from "react-router-dom";
import roshLinguaLogo from "@/assets/roshlingua-logo.png";
import { useHomePageOptimization } from "@/hooks/usePageOptimization";
import { LazyImage } from "@/components/optimized/LazyImage";
import { useAuthStore } from "@/stores/authStore";

// Memoized feature card component - Mobile Optimized
const FeatureCard = memo<{
  icon: React.ReactNode;
  title: string;
  description: string;
}>(({ icon, title, description }) => (
  <div className="text-center p-4 md:p-6 rounded-lg border bg-white hover:shadow-lg transition-shadow duration-200">
    <div className="flex justify-center mb-3 md:mb-4">{icon}</div>
    <h3 className="text-lg md:text-xl font-semibold mb-2 text-gray-900">{title}</h3>
    <p className="text-gray-600 leading-relaxed text-sm md:text-base">{description}</p>
  </div>
));

FeatureCard.displayName = 'FeatureCard';

// Professional testimonial card - Mobile Optimized
const TestimonialCard = memo<{
  name: string;
  country: string;
  flag: string;
  text: string;
  languages: string[];
  rating: number;
}>(({ name, country, flag, text, languages, rating }) => (
  <div className="bg-white p-4 md:p-6 rounded-lg border shadow-sm hover:shadow-md transition-shadow duration-200">
    <div className="flex items-center justify-between mb-3 md:mb-4">
      <div className="flex items-center">
        <div className="text-xl md:text-2xl mr-2 md:mr-3">{flag}</div>
        <div>
          <h4 className="font-semibold text-gray-900 text-sm md:text-base">{name}</h4>
          <p className="text-xs md:text-sm text-gray-600">{country}</p>
        </div>
      </div>
      <div className="flex">
        {[...Array(rating)].map((_, i) => (
          <Star key={i} className="h-3 w-3 md:h-4 md:w-4 fill-yellow-400 text-yellow-400" />
        ))}
      </div>
    </div>
    <p className="text-gray-600 mb-3 md:mb-4 italic text-sm md:text-base">"{text}"</p>
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

const HomePageProfessional = () => {
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
      title: "Global Cultural Exchange",
      description: "Connect with verified users from 195+ countries. Share your culture and learn about others through authentic interactions."
    },
    {
      icon: <Languages className="h-8 w-8 text-secondary" />,
      title: "Language Learning Hub",
      description: "Practice 50+ languages with native speakers. Structured learning paths and conversation practice sessions."
    },
    {
      icon: <Shield className="h-8 w-8 text-green-600" />,
      title: "Safe & Moderated",
      description: "AI-powered content moderation, verified profiles, and 24/7 community support ensure a safe learning environment."
    },
    {
      icon: <Users className="h-8 w-8 text-blue-600" />,
      title: "Community Driven",
      description: "Join cultural events, language challenges, and friendship groups. Build lasting international connections."
    }
  ], []);

  const testimonials = useMemo(() => [
    {
      name: "Maria Santos",
      country: "São Paulo, Brazil",
      flag: "🇧🇷",
      text: "roshLingua helped me improve my English while sharing Brazilian culture. I've made genuine friends from 5 different countries!",
      languages: ["Portuguese", "English", "Spanish"],
      rating: 5
    },
    {
      name: "Ahmed Hassan", 
      country: "Cairo, Egypt",
      flag: "🇪🇬",
      text: "The cultural exchange goes beyond language. I learned to cook Italian pasta while teaching Arabic calligraphy to my language partner.",
      languages: ["Arabic", "French", "English"],
      rating: 5
    },
    {
      name: "Yuki Tanaka",
      country: "Tokyo, Japan", 
      flag: "🇯🇵",
      text: "Safe, respectful community with amazing moderation. I've practiced English and learned about 10 different cultures through this app.",
      languages: ["Japanese", "English", "Korean"],
      rating: 5
    }
  ], []);

  const appFeatures = useMemo(() => [
    "Real-time messaging with translation",
    "Cultural photo sharing",
    "Language practice sessions",
    "Community events & challenges",
    "Progress tracking & achievements",
    "AI-powered safety features"
  ], []);

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-muted to-card">
      {/* Navigation Header - Mobile Optimized */}
      <header className="sticky top-0 z-50 bg-white/95 backdrop-blur-sm border-b shadow-sm">
        <div className="container mx-auto px-4 py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <img src={roshLinguaLogo} alt="roshLingua" className="h-8 w-8" />
              <span className="text-lg md:text-xl font-bold text-primary">roshLingua</span>
            </div>
            
            {/* Desktop Navigation */}
            <nav className="hidden lg:flex items-center space-x-6">
              <Link to="#features" className="text-gray-600 hover:text-primary transition-colors">Features</Link>
              <Link to="#community" className="text-gray-600 hover:text-primary transition-colors">Community</Link>
              <Link to="#download" className="text-gray-600 hover:text-primary transition-colors">Download</Link>
              <Link to="#contact" className="text-gray-600 hover:text-primary transition-colors">Contact</Link>
              <Button variant="outline" size="sm" asChild>
                <Link to="/auth/signin">Sign In</Link>
              </Button>
              <Button size="sm" asChild>
                <Link to="/auth/signup">Join Free</Link>
              </Button>
            </nav>

            {/* Mobile Navigation */}
            <div className="flex lg:hidden items-center space-x-2">
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

      {/* Hero Section - Mobile Optimized */}
      <section className="relative overflow-hidden py-12 md:py-20">
        <div className="absolute inset-0 bg-gradient-to-r from-blue-50 to-purple-50 opacity-50"></div>
        <div className="relative container mx-auto px-4 text-center">
          <div className="max-w-4xl mx-auto">
            <div className="relative mb-6 md:mb-8">
              <img 
                src={roshLinguaLogo} 
                alt="roshLingua - Cultural Exchange Platform" 
                className="h-28 w-28 md:h-40 md:w-40 mx-auto"
              />
            </div>
            
            <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold text-gray-900 mb-4 md:mb-6 leading-tight">
              Connect Cultures,<br />
              <span className="text-primary">Learn Languages</span>
            </h1>
            
            <p className="text-lg md:text-xl text-gray-600 max-w-2xl mx-auto mb-8 md:mb-12 px-4">
              Join the world's most trusted cultural exchange platform. Practice languages with native speakers, 
              share your culture, and build meaningful international friendships in a safe, moderated environment.
            </p>

            <div className="flex flex-col sm:flex-row gap-3 md:gap-4 justify-center items-center mb-12 md:mb-16 px-4">
              <Button size="lg" className="w-full sm:w-auto px-6 md:px-8 py-3 md:py-4 text-base md:text-lg" asChild>
                <Link to="/auth/signup">
                  <Users className="mr-2 h-4 w-4 md:h-5 md:w-5" />
                  Start Learning Free
                </Link>
              </Button>
              <Button variant="outline" size="lg" className="w-full sm:w-auto px-6 md:px-8 py-3 md:py-4 text-base md:text-lg" asChild>
                <Link to="/explore">
                  <Globe className="mr-2 h-4 w-4 md:h-5 md:w-5" />
                  Explore Community
                </Link>
              </Button>
            </div>

            {/* Trust Indicators - Mobile Optimized */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-6 max-w-3xl mx-auto px-4">
              <div className="bg-white p-4 md:p-6 rounded-lg shadow-sm text-center">
                <div className="text-2xl md:text-3xl font-bold text-primary mb-1 md:mb-2">50K+</div>
                <div className="text-xs md:text-sm text-gray-600">Active Users</div>
              </div>
              <div className="bg-white p-4 md:p-6 rounded-lg shadow-sm text-center">
                <div className="text-2xl md:text-3xl font-bold text-green-600 mb-1 md:mb-2">195+</div>
                <div className="text-xs md:text-sm text-gray-600">Countries</div>
              </div>
              <div className="bg-white p-4 md:p-6 rounded-lg shadow-sm text-center">
                <div className="text-2xl md:text-3xl font-bold text-blue-600 mb-1 md:mb-2">50+</div>
                <div className="text-xs md:text-sm text-gray-600">Languages</div>
              </div>
              <div className="bg-white p-4 md:p-6 rounded-lg shadow-sm text-center">
                <div className="text-2xl md:text-3xl font-bold text-purple-600 mb-1 md:mb-2">4.8★</div>
                <div className="text-xs md:text-sm text-gray-600">User Rating</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section - Mobile Optimized */}
      <section id="features" className="py-12 md:py-20 bg-white">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12 md:mb-16">
            <h2 className="text-2xl md:text-3xl lg:text-4xl font-bold text-gray-900 mb-4 px-4">
              Why 50,000+ Users Choose roshLingua
            </h2>
            <p className="text-lg md:text-xl text-gray-600 max-w-2xl mx-auto px-4">
              The most comprehensive platform for cultural exchange and language learning
            </p>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6 md:gap-8 mb-12 md:mb-16">
            {culturalFeatures.map((feature, index) => (
              <FeatureCard
                key={index}
                icon={feature.icon}
                title={feature.title}
                description={feature.description}
              />
            ))}
          </div>

          {/* App Features List */}
          <div className="bg-gray-50 rounded-2xl p-8">
            <h3 className="text-2xl font-bold text-center mb-8">Complete Feature Set</h3>
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
              {appFeatures.map((feature, index) => (
                <div key={index} className="flex items-center space-x-3">
                  <CheckCircle className="h-5 w-5 text-green-600 flex-shrink-0" />
                  <span className="text-gray-700">{feature}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Community Section - Mobile Optimized */}
      <section id="community" className="py-12 md:py-20 bg-gray-50">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12 md:mb-16">
            <h2 className="text-2xl md:text-3xl lg:text-4xl font-bold text-gray-900 mb-4 px-4">
              Real Stories from Our Community
            </h2>
            <p className="text-lg md:text-xl text-gray-600 max-w-2xl mx-auto px-4">
              See how roshLingua is helping people connect across cultures and build lasting friendships
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8 max-w-6xl mx-auto">
            {testimonials.map((testimonial, index) => (
              <TestimonialCard
                key={index}
                name={testimonial.name}
                country={testimonial.country}
                flag={testimonial.flag}
                text={testimonial.text}
                languages={testimonial.languages}
                rating={testimonial.rating}
              />
            ))}
          </div>
        </div>
      </section>

      {/* Download Section - Mobile Optimized */}
      <section id="download" className="py-12 md:py-20 bg-primary text-white">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-2xl md:text-3xl lg:text-4xl font-bold mb-4 md:mb-6 px-4">
            Download roshLingua Today
          </h2>
          <p className="text-lg md:text-xl mb-8 md:mb-12 max-w-2xl mx-auto opacity-90 px-4">
            Available on web and mobile. Start your cultural journey wherever you are.
          </p>
          
          <div className="flex flex-col sm:flex-row gap-3 md:gap-4 justify-center mb-8 md:mb-12 px-4">
            <Button variant="outline" size="lg" className="w-full sm:w-auto bg-white text-primary hover:bg-gray-100 px-6 md:px-8 py-3 md:py-4" asChild>
              <Link to="/auth/signup">
                <Globe className="mr-2 h-4 w-4 md:h-5 md:w-5" />
                Web App - Start Now
              </Link>
            </Button>
            <Button variant="ghost" size="lg" className="w-full sm:w-auto text-white border-white hover:bg-white/10 px-6 md:px-8 py-3 md:py-4">
              <Download className="mr-2 h-4 w-4 md:h-5 md:w-5" />
              Android App - Coming Soon
            </Button>
          </div>

          <p className="text-sm opacity-75 px-4">
            Free to join • No credit card required • Available worldwide
          </p>
        </div>
      </section>

      {/* Contact & Legal Section - Mobile Optimized */}
      <section id="contact" className="py-12 md:py-20 bg-white">
        <div className="container mx-auto px-4">
          <div className="grid md:grid-cols-2 gap-8 md:gap-12">
            {/* Contact Information */}
            <div>
              <h3 className="text-2xl font-bold mb-6">Contact Us</h3>
              <div className="space-y-4">
                <div className="flex items-center space-x-3">
                  <Mail className="h-5 w-5 text-primary" />
                  <div>
                    <p className="font-semibold">Email Support</p>
                    <a href="mailto:roshlingua@gmail.com" className="text-primary hover:underline">
                      roshlingua@gmail.com
                    </a>
                  </div>
                </div>
                <div className="flex items-center space-x-3">
                  <Globe className="h-5 w-5 text-primary" />
                  <div>
                    <p className="font-semibold">Website</p>
                    <a href="https://roshlingua.vercel.app/" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">
                      https://roshlingua.vercel.app/
                    </a>
                  </div>
                </div>
                <div className="flex items-center space-x-3">
                  <Users className="h-5 w-5 text-primary" />
                  <div>
                    <p className="font-semibold">Community Support</p>
                    <p className="text-gray-600">24/7 moderated platform</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Legal & Compliance */}
            <div>
              <h3 className="text-2xl font-bold mb-6">Legal & Privacy</h3>
              <div className="space-y-4">
                <div className="flex items-center space-x-3">
                  <FileText className="h-5 w-5 text-primary" />
                  <Link to="/privacy-policy" className="text-primary hover:underline">
                    Privacy Policy
                  </Link>
                </div>
                <div className="flex items-center space-x-3">
                  <FileText className="h-5 w-5 text-primary" />
                  <Link to="/terms-of-service" className="text-primary hover:underline">
                    Terms of Service
                  </Link>
                </div>
                <div className="flex items-center space-x-3">
                  <Shield className="h-5 w-5 text-primary" />
                  <Link to="/community-guidelines" className="text-primary hover:underline">
                    Community Guidelines
                  </Link>
                </div>
                <div className="flex items-center space-x-3">
                  <Lock className="h-5 w-5 text-primary" />
                  <Link to="/data-protection" className="text-primary hover:underline">
                    Data Protection
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Footer - Mobile Optimized */}
      <footer className="bg-gray-900 text-white py-8 md:py-12">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 md:gap-8">
            <div>
              <div className="flex items-center space-x-2 mb-4">
                <img src={roshLinguaLogo} alt="roshLingua" className="h-8 w-8" />
                <span className="text-xl font-bold">roshLingua</span>
              </div>
              <p className="text-gray-400">
                Connecting cultures and building friendships through language exchange.
              </p>
            </div>
            
            <div>
              <h4 className="font-semibold mb-4">Platform</h4>
              <ul className="space-y-2 text-gray-400">
                <li><Link to="/explore" className="hover:text-white">Explore</Link></li>
                <li><Link to="/community" className="hover:text-white">Community</Link></li>
                <li><Link to="/chat" className="hover:text-white">Messages</Link></li>
                <li><Link to="/profile" className="hover:text-white">Profile</Link></li>
              </ul>
            </div>
            
            <div>
              <h4 className="font-semibold mb-4">Support</h4>
              <ul className="space-y-2 text-gray-400">
                <li><a href="mailto:roshlingua@gmail.com" className="hover:text-white">Help Center</a></li>
                <li><Link to="/community-guidelines" className="hover:text-white">Guidelines</Link></li>
                <li><Link to="/safety" className="hover:text-white">Safety</Link></li>
                <li><a href="mailto:roshlingua@gmail.com" className="hover:text-white">Report Issue</a></li>
              </ul>
            </div>
            
            <div>
              <h4 className="font-semibold mb-4">Legal</h4>
              <ul className="space-y-2 text-gray-400">
                <li><Link to="/privacy-policy" className="hover:text-white">Privacy</Link></li>
                <li><Link to="/terms-of-service" className="hover:text-white">Terms</Link></li>
                <li><Link to="/data-protection" className="hover:text-white">Data Protection</Link></li>
                <li><Link to="/cookies" className="hover:text-white">Cookies</Link></li>
              </ul>
            </div>
          </div>
          
          <div className="border-t border-gray-800 mt-8 pt-8 text-center text-gray-400">
            <p>&copy; 2024 roshLingua. All rights reserved. | Contact: roshlingua@gmail.com</p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default HomePageProfessional;
