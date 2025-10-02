import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { CulturalBadge } from "@/components/CulturalBadge";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Search, Filter, MessageCircle, MapPin, Users } from "lucide-react";
import { useEffect, useState } from "react";
import { User } from "@/types";

const ExplorePage = () => {
  const [searchTerm, setSearchTerm] = useState("");
  
  const [culturalProfiles, setCulturalProfiles] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchProfilesData() {
      setLoading(true);
      setError(null);
      try {
        const { fetchProfiles } = await import("@/integrations/supabase/fetchProfiles");
        const profiles = await fetchProfiles();
        setCulturalProfiles(profiles);
      } catch (e) {
        setError("Failed to load profiles.");
      } finally {
        setLoading(false);
      }
    }
    fetchProfilesData();
  }, []);

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
        {loading ? (
          <div className="p-8 text-center">Loading profiles...</div>
        ) : error ? (
          <div className="p-8 text-center text-red-500">{error}</div>
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {culturalProfiles.map((profile) => (
              <Card key={profile.id} className="card-cultural hover:scale-105 transition-transform">
                <CardHeader className="pb-4">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center space-x-3">
                      <div className="relative">
                        <Avatar className="h-12 w-12">
                          <AvatarImage src={profile.profilePhoto} />
                          <AvatarFallback className="bg-primary text-primary-foreground">
                            {profile.name.split(' ').map(n => n[0]).join('')}
                          </AvatarFallback>
                        </Avatar>
                        {profile.online && (
                          <div className="absolute -bottom-1 -right-1 h-4 w-4 bg-success rounded-full border-2 border-card"></div>
                        )}
                      </div>
                      <div>
                        <h3 className="font-semibold text-card-foreground flex items-center">
                          {profile.name}
                          <span className="ml-2 text-lg">{profile.countryFlag}</span>
                        </h3>
                        <p className="text-sm text-muted-foreground flex items-center">
                          <MapPin className="h-3 w-3 mr-1" />
                          {profile.city || ''}, {profile.country}
                        </p>
                      </div>
                    </div>
                    <div className="text-xs text-muted-foreground text-right">
                      {/* Placeholder for posts count */}
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  {/* Languages */}
                  <div>
                    <h4 className="text-sm font-medium mb-2">Languages</h4>
                    <div className="flex flex-wrap gap-1">
                      {profile.nativeLanguages?.map((lang) => (
                        <CulturalBadge key={lang} type="language-native">
                          {lang}
                        </CulturalBadge>
                      ))}
                      {profile.learningLanguages?.map((lang) => (
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
                      {profile.culturalInterests?.map((interest) => (
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
        )}

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