import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { 
  Users, 
  FileText, 
  Languages, 
  MessageSquare,
  TrendingUp,
  Globe
} from 'lucide-react';

interface QuickStatsProps {
  stats: {
    friendsCount: number;
    postsCount: number;
    languagesLearning: number;
    culturalExchanges: number;
    heartsReceived: number;
  };
  isOwnProfile: boolean;
  onStatsClick?: (statType: string) => void;
}

export const QuickStats: React.FC<QuickStatsProps> = ({
  stats,
  isOwnProfile,
  onStatsClick
}) => {
  const navigate = useNavigate();

  const handleStatClick = (statType: string) => {
    if (onStatsClick) {
      onStatsClick(statType);
    } else {
      // Default navigation behavior
      switch (statType) {
        case 'friends':
          // Scroll to friends section on same page
          document.getElementById('friends-section')?.scrollIntoView({ behavior: 'smooth' });
          break;
        case 'posts':
          // Scroll to posts section or navigate to community
          document.getElementById('posts-section')?.scrollIntoView({ behavior: 'smooth' });
          break;
        case 'languages':
          // Show languages modal or scroll to languages section
          document.getElementById('languages-section')?.scrollIntoView({ behavior: 'smooth' });
          break;
        case 'exchanges':
          navigate('/chat');
          break;
      }
    }
  };

  const statItems = [
    {
      key: 'friends',
      icon: Users,
      value: stats.friendsCount,
      label: 'Friends',
      clickable: true
    },
    {
      key: 'posts',
      icon: FileText,
      value: stats.postsCount,
      label: 'Posts',
      clickable: true
    },
    {
      key: 'languages',
      icon: Languages,
      value: stats.languagesLearning,
      label: 'Languages',
      clickable: true
    },
    {
      key: 'exchanges',
      icon: MessageSquare,
      value: stats.culturalExchanges,
      label: 'Exchanges',
      clickable: true
    }
  ];

  return (
    <div className="bg-white rounded-xl border border-border/50 shadow-sm p-4 mb-6">
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {statItems.map((item) => {
          const IconComponent = item.icon;
          
          if (item.clickable) {
            return (
              <Button
                key={item.key}
                variant="ghost"
                className="h-auto p-4 flex flex-col items-center gap-2 bg-primary/5 hover:bg-primary/10 border border-primary/20 transition-all duration-200"
                onClick={() => handleStatClick(item.key)}
              >
                <IconComponent className="h-5 w-5 text-primary" />
                <div className="text-center">
                  <div className="text-2xl font-bold text-primary">
                    {item.value}
                  </div>
                  <div className="text-xs text-muted-foreground font-medium">
                    {item.label}
                  </div>
                </div>
              </Button>
            );
          }

          return (
            <div
              key={item.key}
              className="p-4 flex flex-col items-center gap-2 bg-primary/5 border border-primary/20 rounded-lg"
            >
              <IconComponent className="h-5 w-5 text-primary" />
              <div className="text-center">
                <div className="text-2xl font-bold text-primary">
                  {item.value}
                </div>
                <div className="text-xs text-muted-foreground font-medium">
                  {item.label}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Additional Stats Row for Hearts */}
      {stats.heartsReceived > 0 && (
        <div className="mt-4 pt-4 border-t border-border/50">
          <div className="flex items-center justify-center gap-2 text-red-500">
            <TrendingUp className="h-4 w-4" />
            <span className="text-sm font-medium">
              {stats.heartsReceived} profile {stats.heartsReceived === 1 ? 'like' : 'likes'} received
            </span>
          </div>
        </div>
      )}
    </div>
  );
};
