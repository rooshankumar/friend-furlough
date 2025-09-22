import { Button } from "@/components/ui/button";
import { CulturalBadge } from "@/components/CulturalBadge";
import { Globe, MessageCircle, Users, Heart, Languages, MapPin } from "lucide-react";
import { Link } from "react-router-dom";
import roshLinguaLogo from "@/assets/roshlingua-logo.png";

const HomePage = () => {
  const culturalFeatures = [
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
  ];

  const testimonials = [
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
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-muted to-card-cultural">
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
              <div key={index} className="card-cultural p-8 text-center group hover:scale-105 transition-transform">
                <div className="mb-6 flex justify-center group-hover:animate-cultural-pulse">
                  {feature.icon}
                </div>
                <h3 className="text-xl font-semibold mb-4 text-card-foreground">
                  {feature.title}
                </h3>
                <p className="text-muted-foreground leading-relaxed">
                  {feature.description}
                </p>
              </div>
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
              <div key={index} className="card-warm p-8">
                <div className="mb-6">
                  <div className="flex items-center space-x-3 mb-4">
                    <span className="text-2xl">{testimonial.flag}</span>
                    <div>
                      <h4 className="font-semibold text-card-foreground">{testimonial.name}</h4>
                      <p className="text-sm text-muted-foreground flex items-center">
                        <MapPin className="h-3 w-3 mr-1" />
                        {testimonial.country}
                      </p>
                    </div>
                  </div>
                  
                  <div className="flex flex-wrap gap-2 mb-4">
                    {testimonial.languages.map((lang, langIndex) => (
                      <CulturalBadge 
                        key={langIndex} 
                        type={langIndex === 0 ? "language-native" : "language-learning"}
                      >
                        {lang}
                      </CulturalBadge>
                    ))}
                  </div>
                </div>
                
                <blockquote className="text-muted-foreground italic leading-relaxed">
                  "{testimonial.text}"
                </blockquote>
              </div>
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