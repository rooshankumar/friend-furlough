import React from 'react';
import { Button } from '@/components/ui/button';
import { ArrowLeft, RefreshCw } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface PageHeaderProps {
  title: string;
  showBack?: boolean;
  onRefresh?: () => void;
  isRefreshing?: boolean;
  rightAction?: React.ReactNode;
}

export const PageHeader: React.FC<PageHeaderProps> = ({
  title,
  showBack = true,
  onRefresh,
  isRefreshing = false,
  rightAction
}) => {
  const navigate = useNavigate();

  return (
    <div className="sticky top-0 z-20 bg-card/95 backdrop-blur-xl border-b border-border/50 shadow-sm">
      <div className="max-w-4xl mx-auto flex items-center justify-between px-3 py-2">
        {showBack ? (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate(-1)}
            className="gap-1.5 hover:bg-primary/10 h-8 text-xs"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">Back</span>
          </Button>
        ) : (
          <div className="w-8" />
        )}
        
        <h2 className="text-sm font-semibold truncate max-w-[200px]">
          {title}
        </h2>
        
        {rightAction ? (
          rightAction
        ) : onRefresh ? (
          <Button
            variant="ghost"
            size="sm"
            onClick={onRefresh}
            disabled={isRefreshing}
            className="gap-1.5 hover:bg-primary/10 h-8 px-2"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${isRefreshing ? 'animate-spin' : ''}`} />
          </Button>
        ) : (
          <div className="w-8" />
        )}
      </div>
    </div>
  );
};
