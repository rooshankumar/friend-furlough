/**
 * Unit tests for useFilteredData hook
 */

import { renderHook, act } from '@testing-library/react';
import { useFilteredData, useFilterState } from '@/hooks/useFilteredData';

describe('useFilteredData Hook', () => {
  const testData = [
    { id: '1', name: 'Alice', country: 'US', age: 25 },
    { id: '2', name: 'Bob', country: 'UK', age: 30 },
    { id: '3', name: 'Charlie', country: 'US', age: 28 },
    { id: '4', name: 'Diana', country: 'CA', age: 26 },
  ];

  it('should return all data when no filters applied', () => {
    const { result } = renderHook(() => useFilteredData(testData));

    expect(result.current).toHaveLength(4);
    expect(result.current).toEqual(testData);
  });

  it('should filter data by search term', () => {
    const { result } = renderHook(() =>
      useFilteredData(testData, {
        searchFields: ['name'],
        searchTerm: 'Alice',
      })
    );

    expect(result.current).toHaveLength(1);
    expect(result.current[0].name).toBe('Alice');
  });

  it('should search across multiple fields', () => {
    const { result } = renderHook(() =>
      useFilteredData(testData, {
        searchFields: ['name', 'country'],
        searchTerm: 'US',
      })
    );

    expect(result.current).toHaveLength(2);
    expect(result.current.every(item => item.country === 'US' || item.name.includes('US'))).toBe(true);
  });

  it('should be case insensitive', () => {
    const { result } = renderHook(() =>
      useFilteredData(testData, {
        searchFields: ['name'],
        searchTerm: 'alice',
      })
    );

    expect(result.current).toHaveLength(1);
    expect(result.current[0].name).toBe('Alice');
  });

  it('should apply equality filter', () => {
    const { result } = renderHook(() =>
      useFilteredData(testData, {
        filters: [{ field: 'country', value: 'US', operator: 'equals' }],
      })
    );

    expect(result.current).toHaveLength(2);
    expect(result.current.every(item => item.country === 'US')).toBe(true);
  });

  it('should apply includes filter', () => {
    const { result } = renderHook(() =>
      useFilteredData(testData, {
        filters: [{ field: 'name', value: 'ar', operator: 'includes' }],
      })
    );

    expect(result.current).toHaveLength(1);
    expect(result.current[0].name).toBe('Charlie');
  });

  it('should apply startsWith filter', () => {
    const { result } = renderHook(() =>
      useFilteredData(testData, {
        filters: [{ field: 'name', value: 'D', operator: 'startsWith' }],
      })
    );

    expect(result.current).toHaveLength(1);
    expect(result.current[0].name).toBe('Diana');
  });

  it('should apply custom filter', () => {
    const { result } = renderHook(() =>
      useFilteredData(testData, {
        filters: [
          {
            field: 'age',
            value: 0,
            customFilter: (item: any) => item.age > 27,
          },
        ],
      })
    );

    expect(result.current).toHaveLength(2);
    expect(result.current.every(item => item.age > 27)).toBe(true);
  });

  it('should sort ascending', () => {
    const { result } = renderHook(() =>
      useFilteredData(testData, {
        sortBy: { field: 'age', ascending: true },
      })
    );

    expect(result.current[0].age).toBe(25);
    expect(result.current[result.current.length - 1].age).toBe(30);
  });

  it('should sort descending', () => {
    const { result } = renderHook(() =>
      useFilteredData(testData, {
        sortBy: { field: 'age', ascending: false },
      })
    );

    expect(result.current[0].age).toBe(30);
    expect(result.current[result.current.length - 1].age).toBe(25);
  });

  it('should combine search and filters', () => {
    const { result } = renderHook(() =>
      useFilteredData(testData, {
        searchFields: ['name'],
        searchTerm: 'Charlie',
        filters: [{ field: 'country', value: 'US', operator: 'equals' }],
      })
    );

    expect(result.current).toHaveLength(1);
    expect(result.current[0].name).toBe('Charlie');
  });

  it('should handle empty data', () => {
    const { result } = renderHook(() => useFilteredData([]));

    expect(result.current).toHaveLength(0);
  });
});

describe('useFilterState Hook', () => {
  it('should initialize with empty filters', () => {
    const { result } = renderHook(() => useFilterState());

    expect(result.current.filters).toHaveLength(0);
  });

  it('should initialize with provided filters', () => {
    const initialFilters = [
      { field: 'country', value: 'US', operator: 'equals' as const },
    ];
    const { result } = renderHook(() => useFilterState(initialFilters));

    expect(result.current.filters).toHaveLength(1);
    expect(result.current.filters[0]).toEqual(initialFilters[0]);
  });

  it('should add filter', () => {
    const { result } = renderHook(() => useFilterState());

    const newFilter = { field: 'country', value: 'US', operator: 'equals' as const };

    act(() => {
      result.current.addFilter(newFilter);
    });

    expect(result.current.filters).toHaveLength(1);
    expect(result.current.filters[0]).toEqual(newFilter);
  });

  it('should remove filter by index', () => {
    const initialFilters = [
      { field: 'country', value: 'US', operator: 'equals' as const },
      { field: 'age', value: 25, operator: 'equals' as const },
    ];
    const { result } = renderHook(() => useFilterState(initialFilters));

    act(() => {
      result.current.removeFilter(0);
    });

    expect(result.current.filters).toHaveLength(1);
    expect(result.current.filters[0].field).toBe('age');
  });

  it('should update filter by index', () => {
    const initialFilters = [
      { field: 'country', value: 'US', operator: 'equals' as const },
    ];
    const { result } = renderHook(() => useFilterState(initialFilters));

    const updatedFilter = { field: 'country', value: 'UK', operator: 'equals' as const };
    act(() => {
      result.current.updateFilter(0, updatedFilter);
    });

    expect(result.current.filters[0]).toEqual(updatedFilter);
  });

  it('should clear all filters', () => {
    const initialFilters = [
      { field: 'country', value: 'US', operator: 'equals' as const },
      { field: 'age', value: 25, operator: 'equals' as const },
    ];
    const { result } = renderHook(() => useFilterState(initialFilters));

    act(() => {
      result.current.clearFilters();
    });

    expect(result.current.filters).toHaveLength(0);
  });
});
