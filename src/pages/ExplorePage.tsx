import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { CulturalBadge } from "@/components/CulturalBadge";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Search, Filter, MessageCircle, MapPin, Users } from "lucide-react";
import { useState } from "react";

const ExplorePage = () => {
  const [searchTerm, setSearchTerm] = useState("");
  
  // Mock data for cultural profiles
  const culturalProfiles = [
    {
      id: 1,
      name: "Sophie Laurent",
      country: "France",
      flag: "🇫🇷",
      city: "Lyon",
      avatar: "",
      nativeLanguages: ["French"],
      learningLanguages: ["Japanese", "Korean"],
      interests: ["Cuisine", "Art", "Photography"],
      bio: "Passionate about Asian cultures and love sharing French cooking secrets! Looking for language exchange partners.",
      isOnline: true,
      culturalPosts: 23
    },
    {
      id: 2,
      name: "Hiroshi Tanaka",
      country: "Japan",
      flag: "🇯🇵",
      city: "Tokyo",
      avatar: "",
      nativeLanguages: ["Japanese"],
      learningLanguages: ["French", "Spanish"],
      interests: ["Traditional Arts", "Music", "Travel"],
      bio: "Tea ceremony enthusiast who wants to learn about European cultures while sharing Japanese traditions.",
      isOnline: false,
      culturalPosts: 45
    },
    {
      id: 3,
      name: "Isabella Rodriguez",
      country: "Mexico",
      flag: "🇲🇽",
      city: "Mexico City",
      avatar: "",
      nativeLanguages: ["Spanish"],
      learningLanguages: ["English", "Mandarin"],
      interests: ["Dance", "History", "Literature"],
      bio: "Folklore dancer sharing Mexican traditions and learning about Chinese culture and language.",
      isOnline: true,
      culturalPosts: 31
    },
    {
      id: 4,
      name: "Ahmed Al-Rashid",
      country: "UAE",
      flag: "🇦🇪",
      city: "Dubai",
      avatar: "",
      nativeLanguages: ["Arabic"],
      learningLanguages: ["German", "Italian"],
      interests: ["Architecture", "Business", "Desert Culture"],
      bio: "Sharing Middle Eastern hospitality and business culture while learning European languages.",
      isOnline: true,
      culturalPosts: 18
    },
    {
      id: 5,
      name: "Priya Sharma",
      country: "India",
      flag: "🇮🇳",
      city: "Mumbai",
      avatar: "",
      nativeLanguages: ["Hindi", "English"],
      learningLanguages: ["French", "Portuguese"],
      interests: ["Bollywood", "Yoga", "Festivals"],
      bio: "Bollywood choreographer excited to share Indian festivals and learn about Latin cultures.",
      isOnline: false,
      culturalPosts: 67
    },
    {
      id: 6,
      name: "Lars Andersen",
      country: "Norway",
      flag: "🇳🇴",
      city: "Bergen",
      avatar: "",
      nativeLanguages: ["Norwegian"],
      learningLanguages: ["Japanese", "Russian"],
      interests: ["Nature", "Photography", "Viking History"],
      bio: "Mountain photographer sharing Nordic culture and winter traditions from the fjords.",
      isOnline: true,
      culturalPosts: 29
    }
  ];

  const countries = ["All Countries", "France", "Japan", "Mexico", "UAE", "India", "Norway"];
  const languages = ["All Languages", "French", "Japanese", "Spanish", "Arabic", "Hindi", "Norwegian"];

  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-card-cultural">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl md:text-4xl font-bold text-primary mb-4">
            Discover Cultural Connections
          </h1>
          <p className="text-cultural-warm max-w-2xl">
            Find language exchange partners and cultural friends from around the world. 
            Connect with people who share your interests and learning goals.
          </p>
        </div>

        {/* Search and Filters */}
        <div className="card-cultural p-6 mb-8">
          <div className="flex flex-col md:flex-row gap-4 items-center">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
              <Input
                placeholder="Search by name, country, or interests..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            
            <div className="flex gap-2">
              <Button variant="outline" size="sm">
                <Filter className="h-4 w-4 mr-2" />
                Filters
              </Button>
              <Button variant="cultural" size="sm">
                <Users className="h-4 w-4 mr-2" />
                Cultural Match
              </Button>
            </div>
          </div>

          <div className="flex flex-wrap gap-2 mt-4">
            {countries.slice(1, 5).map((country) => (
              <CulturalBadge key={country} type="country">
                {country}
              </CulturalBadge>
            ))}
            {languages.slice(1, 4).map((language) => (
              <CulturalBadge key={language} type="language-learning">
                {language}
              </CulturalBadge>
            ))}
          </div>
        </div>

        {/* Profile Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {culturalProfiles.map((profile) => (
            <Card key={profile.id} className="card-cultural hover:scale-105 transition-transform">
              <CardHeader className="pb-4">
                <div className="flex items-start justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="relative">
                      <Avatar className="h-12 w-12">
                        <AvatarImage src={profile.avatar} />
                        <AvatarFallback className="bg-primary text-primary-foreground">
                          {profile.name.split(' ').map(n => n[0]).join('')}
                        </AvatarFallback>
                      </Avatar>
                      {profile.isOnline && (
                        <div className="absolute -bottom-1 -right-1 h-4 w-4 bg-success rounded-full border-2 border-card"></div>
                      )}
                    </div>
                    <div>
                      <h3 className="font-semibold text-card-foreground flex items-center">
                        {profile.name}
                        <span className="ml-2 text-lg">{profile.flag}</span>
                      </h3>
                      <p className="text-sm text-muted-foreground flex items-center">
                        <MapPin className="h-3 w-3 mr-1" />
                        {profile.city}, {profile.country}
                      </p>
                    </div>
                  </div>
                  
                  <div className="text-xs text-muted-foreground text-right">
                    {profile.culturalPosts} posts
                  </div>
                </div>
              </CardHeader>

              <CardContent className="space-y-4">
                {/* Languages */}
                <div>
                  <h4 className="text-sm font-medium mb-2">Languages</h4>
                  <div className="flex flex-wrap gap-1">
                    {profile.nativeLanguages.map((lang) => (
                      <CulturalBadge key={lang} type="language-native">
                        {lang}
                      </CulturalBadge>
                    ))}
                    {profile.learningLanguages.map((lang) => (
                      <CulturalBadge key={lang} type="language-learning">
                        {lang}
                      </CulturalBadge>
                    ))}
                  </div>
                </div>

                {/* Interests */}
                <div>
                  <h4 className="text-sm font-medium mb-2">Cultural Interests</h4>
                  <div className="flex flex-wrap gap-1">
                    {profile.interests.map((interest) => (
                      <CulturalBadge key={interest} type="interest">
                        {interest}
                      </CulturalBadge>
                    ))}
                  </div>
                </div>

                {/* Bio */}
                <p className="text-sm text-muted-foreground leading-relaxed">
                  {profile.bio}
                </p>

                {/* Actions */}
                <div className="flex gap-2 pt-2">
                  <Button variant="cultural" size="sm" className="flex-1">
                    <MessageCircle className="h-4 w-4 mr-2" />
                    Connect
                  </Button>
                  <Button variant="outline" size="sm">
                    View Profile
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Load More */}
        <div className="text-center mt-12">
          <Button variant="outline" size="lg">
            Load More Cultural Profiles
          </Button>
        </div>
      </div>
    </div>
  );
};

export default ExplorePage;