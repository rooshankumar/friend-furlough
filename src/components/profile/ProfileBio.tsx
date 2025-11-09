import React from 'react';
import { Badge } from '@/components/ui/badge';
import { 
  UserCircle, 
  Target, 
  Heart,
  Users,
  Globe,
  Sparkles
} from 'lucide-react';
import { User } from '@/types';

interface ProfileBioProps {
  profileUser: User;
  culturalInterests: string[];
  lookingFor: string[];
}

export const ProfileBio: React.FC<ProfileBioProps> = ({
  profileUser,
  culturalInterests,
  lookingFor
}) => {
  return (
    <div className="bg-card rounded-xl border border-border/50 shadow-sm p-6 mb-6">
      {/* About Section */}
      <div className="mb-6">
        <div className="flex items-center gap-2 mb-3">
          <UserCircle className="h-5 w-5 text-primary" />
          <h3 className="text-lg font-semibold text-card-foreground">About</h3>
        </div>
        <div className="bg-gradient-to-r from-primary/5 to-secondary/5 rounded-lg p-4 border border-primary/10">
          <p className="text-card-foreground leading-relaxed">
            {profileUser.bio || "This user hasn't written a bio yet."}
          </p>
        </div>
      </div>

      {/* Looking For Section */}
      {lookingFor.length > 0 && (
        <div className="mb-6">
          <div className="flex items-center gap-2 mb-3">
            <Target className="h-5 w-5 text-success" />
            <h3 className="text-lg font-semibold text-card-foreground">Looking For</h3>
          </div>
          <div className="flex flex-wrap gap-2">
            {lookingFor.map((item: string, index: number) => (
              <Badge 
                key={`${item}-${index}`} 
                className="bg-green-50 text-green-700 border-green-200 hover:bg-green-100 transition-colors px-3 py-1"
              >
                <Heart className="h-3 w-3 mr-1" />
                #{item.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
              </Badge>
            ))}
          </div>
        </div>
      )}

      {/* Cultural Interests Section */}
      {culturalInterests.length > 0 && (
        <div>
          <div className="flex items-center gap-2 mb-3">
            <Sparkles className="h-5 w-5 text-accent" />
            <h3 className="text-lg font-semibold text-card-foreground">Interests</h3>
          </div>
          <div className="flex flex-wrap gap-2">
            {culturalInterests.map((interest: string, index: number) => (
              <Badge 
                key={`${interest}-${index}`} 
                variant="secondary" 
                className="bg-purple-50 text-purple-700 border-purple-200 hover:bg-purple-100 transition-colors px-3 py-1"
              >
                <Globe className="h-3 w-3 mr-1" />
                #{interest}
              </Badge>
            ))}
          </div>
        </div>
      )}

      {/* Empty State */}
      {lookingFor.length === 0 && culturalInterests.length === 0 && !profileUser.bio && (
        <div className="text-center py-8">
          <Users className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
          <h3 className="text-lg font-semibold mb-2 text-muted-foreground">Profile Incomplete</h3>
          <p className="text-muted-foreground">
            This user hasn't added their bio, interests, or preferences yet.
          </p>
        </div>
      )}
    </div>
  );
};
