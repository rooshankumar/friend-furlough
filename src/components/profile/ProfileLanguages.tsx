import React from 'react';
import { Badge } from '@/components/ui/badge';
import { CulturalBadge } from '@/components/CulturalBadge';
import { 
  Languages, 
  BookOpen, 
  Globe,
  Plane,
  Star
} from 'lucide-react';
import { User } from '@/types';

interface ProfileLanguagesProps {
  profileUser: User;
  nativeLanguages: string[];
  learningLanguages: string[];
}

export const ProfileLanguages: React.FC<ProfileLanguagesProps> = ({
  profileUser,
  nativeLanguages,
  learningLanguages
}) => {
  // Don't render if no language data
  if (nativeLanguages.length === 0 && learningLanguages.length === 0 && 
      (!profileUser.countriesVisited || profileUser.countriesVisited.length === 0)) {
    return null;
  }

  return (
    <div className="bg-white rounded-xl border border-border/50 shadow-sm p-6 mb-6">
      <div className="flex items-center gap-2 mb-6">
        <Languages className="h-5 w-5 text-primary" />
        <h3 className="text-lg font-semibold text-foreground">Languages</h3>
      </div>

      {/* Native Languages */}
      {nativeLanguages.length > 0 && (
        <div className="mb-6">
          <div className="flex items-center gap-2 mb-3">
            <Star className="h-4 w-4 text-yellow-500" />
            <h4 className="font-medium text-foreground">Native Languages</h4>
          </div>
          <div className="flex flex-wrap gap-2">
            {nativeLanguages.map((lang: string, index: number) => (
              <CulturalBadge key={`native-${lang}-${index}`} type="language-native">
                {lang}
              </CulturalBadge>
            ))}
          </div>
        </div>
      )}

      {/* Learning Languages - Simple */}
      {learningLanguages.length > 0 && (
        <div className="mb-6">
          <div className="flex items-center gap-2 mb-3">
            <BookOpen className="h-4 w-4 text-blue-500" />
            <h4 className="font-medium text-foreground">Learning Languages</h4>
          </div>
          <div className="flex flex-wrap gap-2">
            {learningLanguages.map((lang: string, index: number) => (
              <CulturalBadge key={`learning-${lang}-${index}`} type="language-learning">
                {lang}
              </CulturalBadge>
            ))}
          </div>
        </div>
      )}

      {/* Countries Visited */}
      {profileUser.countriesVisited && profileUser.countriesVisited.length > 0 && (
        <div>
          <div className="flex items-center gap-2 mb-3">
            <Plane className="h-4 w-4 text-green-500" />
            <h4 className="font-medium text-foreground">
              Countries Visited ({profileUser.countriesVisited.length})
            </h4>
          </div>
          <div className="flex flex-wrap gap-2">
            {profileUser.countriesVisited.map((country: string, index: number) => (
              <Badge 
                key={`${country}-${index}`} 
                variant="outline" 
                className="text-xs"
              >
                <Globe className="h-3 w-3 mr-1" />
                {country}
              </Badge>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
