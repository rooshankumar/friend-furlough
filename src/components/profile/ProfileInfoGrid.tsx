import React from 'react';
import { Badge } from '@/components/ui/badge';
import { CulturalBadge } from '@/components/CulturalBadge';
import { 
  UserCircle, 
  Target, 
  Heart,
  Languages,
  BookOpen,
  Globe,
  Plane,
  Star,
  Sparkles
} from 'lucide-react';
import { User } from '@/types';

interface ProfileInfoGridProps {
  profileUser: User;
  culturalInterests: string[];
  lookingFor: string[];
  nativeLanguages: string[];
  learningLanguages: string[];
}

export const ProfileInfoGrid: React.FC<ProfileInfoGridProps> = ({
  profileUser,
  culturalInterests,
  lookingFor,
  nativeLanguages,
  learningLanguages
}) => {
  const hasLanguages = nativeLanguages.length > 0 || learningLanguages.length > 0 || 
                       (profileUser.countriesVisited && profileUser.countriesVisited.length > 0);
  const hasInterests = culturalInterests.length > 0 || lookingFor.length > 0;

  return (
    <div className="bg-card rounded-xl border border-border/50 shadow-sm overflow-hidden">
      <div className="grid grid-cols-1 lg:grid-cols-2 divide-y lg:divide-y-0 lg:divide-x divide-border/50">
        {/* Left Column - About & Looking For */}
        <div className="p-4 md:p-5 space-y-4">
          {/* About Section */}
          <div>
            <div className="flex items-center gap-2 mb-2">
              <UserCircle className="h-4 w-4 text-primary" />
              <h3 className="text-sm font-semibold text-card-foreground">About</h3>
            </div>
            <div className="bg-gradient-to-r from-primary/5 to-secondary/5 rounded-lg p-3 border border-primary/10">
              <p className="text-sm text-card-foreground leading-relaxed line-clamp-4">
                {profileUser.bio || "This user hasn't written a bio yet."}
              </p>
            </div>
          </div>

          {/* Looking For Section */}
          {lookingFor.length > 0 && (
            <div>
              <div className="flex items-center gap-2 mb-2">
                <Target className="h-4 w-4 text-success" />
                <h3 className="text-sm font-semibold text-card-foreground">Looking For</h3>
              </div>
              <div className="flex flex-wrap gap-1.5">
                {lookingFor.slice(0, 6).map((item: string, index: number) => (
                  <Badge 
                    key={`${item}-${index}`} 
                    className="bg-green-50 text-green-700 border-green-200 hover:bg-green-100 transition-colors px-2 py-0.5 text-xs"
                  >
                    #{item.replace(/-/g, ' ')}
                  </Badge>
                ))}
                {lookingFor.length > 6 && (
                  <Badge variant="outline" className="text-xs px-2 py-0.5">
                    +{lookingFor.length - 6} more
                  </Badge>
                )}
              </div>
            </div>
          )}

          {/* Interests Section */}
          {culturalInterests.length > 0 && (
            <div>
              <div className="flex items-center gap-2 mb-2">
                <Sparkles className="h-4 w-4 text-accent" />
                <h3 className="text-sm font-semibold text-card-foreground">Interests</h3>
              </div>
              <div className="flex flex-wrap gap-1.5">
                {culturalInterests.slice(0, 8).map((interest: string, index: number) => (
                  <Badge 
                    key={`${interest}-${index}`} 
                    variant="secondary" 
                    className="bg-purple-50 text-purple-700 border-purple-200 hover:bg-purple-100 transition-colors px-2 py-0.5 text-xs"
                  >
                    #{interest}
                  </Badge>
                ))}
                {culturalInterests.length > 8 && (
                  <Badge variant="outline" className="text-xs px-2 py-0.5">
                    +{culturalInterests.length - 8} more
                  </Badge>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Right Column - Languages & Countries */}
        <div className="p-4 md:p-5 space-y-4">
          {hasLanguages ? (
            <>
              <div className="flex items-center gap-2 mb-2">
                <Languages className="h-4 w-4 text-primary" />
                <h3 className="text-sm font-semibold text-foreground">Languages</h3>
              </div>

              {/* Native Languages */}
              {nativeLanguages.length > 0 && (
                <div>
                  <div className="flex items-center gap-1.5 mb-2">
                    <Star className="h-3.5 w-3.5 text-yellow-500" />
                    <h4 className="text-xs font-medium text-foreground">Native</h4>
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {nativeLanguages.map((lang: string, index: number) => (
                      <CulturalBadge key={`native-${lang}-${index}`} type="language-native" className="text-xs px-2 py-0.5">
                        {lang}
                      </CulturalBadge>
                    ))}
                  </div>
                </div>
              )}

              {/* Learning Languages */}
              {learningLanguages.length > 0 && (
                <div>
                  <div className="flex items-center gap-1.5 mb-2">
                    <BookOpen className="h-3.5 w-3.5 text-blue-500" />
                    <h4 className="text-xs font-medium text-foreground">Learning</h4>
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {learningLanguages.map((lang: string, index: number) => (
                      <CulturalBadge key={`learning-${lang}-${index}`} type="language-learning" className="text-xs px-2 py-0.5">
                        {lang}
                      </CulturalBadge>
                    ))}
                  </div>
                </div>
              )}

              {/* Countries Visited */}
              {profileUser.countriesVisited && profileUser.countriesVisited.length > 0 && (
                <div>
                  <div className="flex items-center gap-1.5 mb-2">
                    <Plane className="h-3.5 w-3.5 text-green-500" />
                    <h4 className="text-xs font-medium text-foreground">
                      Visited ({profileUser.countriesVisited.length})
                    </h4>
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {profileUser.countriesVisited.slice(0, 6).map((country: string, index: number) => (
                      <Badge 
                        key={`${country}-${index}`} 
                        variant="outline" 
                        className="text-xs px-2 py-0.5"
                      >
                        <Globe className="h-2.5 w-2.5 mr-1" />
                        {country}
                      </Badge>
                    ))}
                    {profileUser.countriesVisited.length > 6 && (
                      <Badge variant="outline" className="text-xs px-2 py-0.5">
                        +{profileUser.countriesVisited.length - 6}
                      </Badge>
                    )}
                  </div>
                </div>
              )}
            </>
          ) : (
            <div className="text-center py-6">
              <Languages className="h-10 w-10 mx-auto mb-3 text-muted-foreground opacity-50" />
              <p className="text-sm text-muted-foreground">
                No language information available
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
