import { useState, useCallback, useMemo } from 'react';

interface FilterConfig {
  field: string;
  value: any;
  operator?: 'includes' | 'equals' | 'startsWith' | 'custom';
  customFilter?: (item: any) => boolean;
}

/**
 * Generic hook for filtering and searching data
 * Eliminates repetitive filter/search logic across components
 */
export const useFilteredData = <T,>(
  data: T[],
  options: {
    searchFields?: (keyof T)[];
    searchTerm?: string;
    filters?: FilterConfig[];
    sortBy?: { field: keyof T; ascending?: boolean };
  } = {}
) => {
  const { searchFields = [], searchTerm = '', filters = [], sortBy } = options;

  // Apply search filter
  const searchFiltered = useMemo(() => {
    if (!searchTerm || searchFields.length === 0) return data;

    return data.filter((item) =>
      searchFields.some((field) => {
        const value = String(item[field]).toLowerCase();
        return value.includes(searchTerm.toLowerCase());
      })
    );
  }, [data, searchTerm, searchFields]);

  // Apply additional filters
  const filtered = useMemo(() => {
    return searchFiltered.filter((item) =>
      filters.every((filter) => {
        if (filter.customFilter) {
          return filter.customFilter(item);
        }

        const itemValue = item[filter.field as keyof T];

        switch (filter.operator || 'equals') {
          case 'includes':
            return String(itemValue).includes(String(filter.value));
          case 'startsWith':
            return String(itemValue).startsWith(String(filter.value));
          case 'equals':
          default:
            return itemValue === filter.value;
        }
      })
    );
  }, [searchFiltered, filters]);

  // Apply sorting
  const sorted = useMemo(() => {
    if (!sortBy) return filtered;

    return [...filtered].sort((a, b) => {
      const aValue = a[sortBy.field];
      const bValue = b[sortBy.field];

      if (aValue < bValue) return sortBy.ascending !== false ? -1 : 1;
      if (aValue > bValue) return sortBy.ascending !== false ? 1 : -1;
      return 0;
    });
  }, [filtered, sortBy]);

  return sorted;
};

/**
 * Hook for managing filter state
 */
export const useFilterState = (initialFilters: FilterConfig[] = []) => {
  const [filters, setFilters] = useState<FilterConfig[]>(initialFilters);

  const addFilter = useCallback((filter: FilterConfig) => {
    setFilters((prev) => [...prev, filter]);
  }, []);

  const removeFilter = useCallback((index: number) => {
    setFilters((prev) => prev.filter((_, i) => i !== index));
  }, []);

  const updateFilter = useCallback((index: number, filter: FilterConfig) => {
    setFilters((prev) =>
      prev.map((f, i) => (i === index ? filter : f))
    );
  }, []);

  const clearFilters = useCallback(() => {
    setFilters([]);
  }, []);

  return {
    filters,
    addFilter,
    removeFilter,
    updateFilter,
    clearFilters,
  };
};
