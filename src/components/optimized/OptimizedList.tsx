import React, { memo, useMemo, useCallback } from 'react';

interface OptimizedListProps<T> {
  items: T[];
  itemHeight: number;
  height: number;
  renderItem: (item: T, index: number) => React.ReactNode;
  keyExtractor: (item: T, index: number) => string;
  onItemClick?: (item: T, index: number) => void;
  className?: string;
  loading?: boolean;
  loadingComponent?: React.ReactNode;
  emptyComponent?: React.ReactNode;
}

// Memoized list item wrapper
const ListItem = memo<{
  index: number;
  style: React.CSSProperties;
  data: {
    items: any[];
    renderItem: (item: any, index: number) => React.ReactNode;
    onItemClick?: (item: any, index: number) => void;
  };
}>(({ index, style, data }) => {
  const { items, renderItem, onItemClick } = data;
  const item = items[index];

  const handleClick = useCallback(() => {
    if (onItemClick) {
      onItemClick(item, index);
    }
  }, [item, index, onItemClick]);

  return (
    <div style={style} onClick={handleClick}>
      {renderItem(item, index)}
    </div>
  );
});

ListItem.displayName = 'ListItem';

export const OptimizedList = memo(<T,>({
  items,
  itemHeight,
  height,
  renderItem,
  keyExtractor,
  onItemClick,
  className = '',
  loading = false,
  loadingComponent,
  emptyComponent
}: OptimizedListProps<T>) => {
  // Memoize item data to prevent unnecessary re-renders
  const itemData = useMemo(() => ({
    items,
    renderItem,
    onItemClick
  }), [items, renderItem, onItemClick]);

  // Loading state
  if (loading) {
    return (
      <div className={`flex items-center justify-center ${className}`} style={{ height }}>
        {loadingComponent || (
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        )}
      </div>
    );
  }

  // Empty state
  if (items.length === 0) {
    return (
      <div className={`flex items-center justify-center ${className}`} style={{ height }}>
        {emptyComponent || (
          <div className="text-center text-muted-foreground">
            <p>No items to display</p>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className={className} style={{ height }}>
      {items.map((item, index) => (
        <div key={keyExtractor(item, index)} onClick={() => onItemClick?.(item, index)}>
          {renderItem(item, index)}
        </div>
      ))}
    </div>
  );
});

OptimizedList.displayName = 'OptimizedList';
