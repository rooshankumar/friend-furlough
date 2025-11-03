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
    <div className="bg-card rounded-lg border border-border/50 shadow-sm px-4 py-3">
      {/* Compact Inline Stats */}
      <div className="flex items-center justify-center md:justify-start gap-2 md:gap-3 flex-wrap text-sm">
        {statItems.map((item, index) => {
          const IconComponent = item.icon;
          
          return (
            <React.Fragment key={item.key}>
              {index > 0 && <span className="text-border hidden sm:inline">•</span>}
              <button
                onClick={() => item.clickable && handleStatClick(item.key)}
                className={`flex items-center gap-1.5 ${
                  item.clickable 
                    ? 'hover:text-primary transition-colors cursor-pointer' 
                    : 'cursor-default'
                } text-foreground`}
                disabled={!item.clickable}
              >
                <IconComponent className="h-4 w-4 text-primary" />
                <span className="font-semibold">{item.value}</span>
                <span className="text-muted-foreground">{item.label}</span>
              </button>
            </React.Fragment>
          );
        })}
        
        {/* Hearts stat inline */}
        {stats.heartsReceived > 0 && (
          <>
            <span className="text-border hidden sm:inline">•</span>
            <div className="flex items-center gap-1.5 text-red-500">
              <TrendingUp className="h-4 w-4" />
              <span className="font-semibold">{stats.heartsReceived}</span>
              <span className="text-muted-foreground">Likes</span>
            </div>
          </>
        )}
      </div>
    </div>
  );
};
