import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Search, Sparkles, Users, Globe, Zap } from 'lucide-react';

interface ExploreHeroProps {
  totalUsers: number;
  onlineUsers: number;
  searchTerm: string;
  onSearchChange: (term: string) => void;
  onSmartMatch: () => void;
  popularLanguages: string[];
  onLanguageClick: (language: string) => void;
}

export function ExploreHero({
  totalUsers,
  onlineUsers,
  searchTerm,
  onSearchChange,
  onSmartMatch,
  popularLanguages,
  onLanguageClick
}: ExploreHeroProps) {
  return (
    <div className="px-4 py-4 border-b bg-background">
      <div className="flex items-center justify-between mb-3">
        <div>
          <h1 className="text-xl font-bold">Language Partners</h1>
          <p className="text-sm text-muted-foreground">
            {totalUsers.toLocaleString()} members • {onlineUsers} online
          </p>
        </div>
      </div>

      {/* Compact Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Search..."
          value={searchTerm}
          onChange={(e) => onSearchChange(e.target.value)}
          className="pl-10 h-9 text-sm"
          style={{ fontSize: '16px' }}
        />
      </div>
    </div>
  );
}
