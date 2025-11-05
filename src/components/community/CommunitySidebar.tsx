import React from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { TrendingUp, Hash, Users } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface CommunitySidebarProps {
  stats: {
    totalPosts: number;
    activeToday: number;
    members: number;
  };
  trendingHashtags: Array<{ tag: string; count: number }>;
  onHashtagClick?: (tag: string) => void;
}

export const CommunitySidebar: React.FC<CommunitySidebarProps> = ({
  stats,
  trendingHashtags,
  onHashtagClick,
}) => {
  const { toast } = useToast();

  const handleHashtagClick = (tag: string) => {
    if (onHashtagClick) {
      onHashtagClick(tag);
    } else {
      toast({ title: `Filtering by #${tag}` });
    }
  };

  return (
    <div className="hidden lg:block w-64 xl:w-80 border-r border-border/50 p-4 overflow-y-auto">
      <div className="sticky top-4 space-y-4">
        {/* Community Stats */}
        <Card className="p-4">
          <h3 className="font-semibold text-sm mb-3 flex items-center gap-2">
            <TrendingUp className="h-4 w-4 text-primary" />
            Community Stats
          </h3>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Total Posts</span>
              <span className="font-semibold">{stats.totalPosts}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Active Today</span>
              <span className="font-semibold">{stats.activeToday}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Members</span>
              <span className="font-semibold">
                {stats.members >= 1000
                  ? `${(stats.members / 1000).toFixed(1)}K`
                  : stats.members}
              </span>
            </div>
          </div>
        </Card>

        {/* Trending Hashtags */}
        <Card className="p-4">
          <h3 className="font-semibold text-sm mb-3 flex items-center gap-2">
            <Hash className="h-4 w-4 text-primary" />
            Trending Topics
          </h3>
          <div className="space-y-2">
            {trendingHashtags.length > 0 ? (
              trendingHashtags.map((item) => (
                <button
                  key={item.tag}
                  className="w-full text-left px-2 py-1.5 rounded hover:bg-muted/50 transition-colors"
                  onClick={() => handleHashtagClick(item.tag)}
                >
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-primary">#{item.tag}</span>
                    <span className="text-xs text-muted-foreground">{item.count}</span>
                  </div>
                </button>
              ))
            ) : (
              <p className="text-xs text-muted-foreground text-center py-2">
                No trending topics yet
              </p>
            )}
          </div>
        </Card>
      </div>
    </div>
  );
};
