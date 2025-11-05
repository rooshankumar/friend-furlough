/**
 * Query optimization utilities for Supabase
 */

import { supabase } from '@/integrations/supabase/client';

/**
 * Batch fetch multiple items with pagination
 */
export const batchFetch = async <T>(
  table: string,
  ids: string[],
  selectFields: string = '*',
  options: {
    pageSize?: number;
    filter?: { field: string; value: any }[];
  } = {}
) => {
  const { pageSize = 100, filter = [] } = options;
  const results: T[] = [];

  // Process in batches to avoid query size limits
  for (let i = 0; i < ids.length; i += pageSize) {
    const batch = ids.slice(i, i + pageSize);
    let query: any = supabase.from(table).select(selectFields).in('id', batch);

    // Apply additional filters
    for (const f of filter) {
      query = query.eq(f.field, f.value);
    }

    const { data, error } = await query;

    if (error) {
      console.error(`Error fetching batch from ${table}:`, error);
      throw error;
    }

    results.push(...(data || []));
  }

  return results;
};

/**
 * Paginated fetch with cursor-based pagination
 */
export const paginatedFetch = async <T>(
  table: string,
  options: {
    selectFields?: string;
    pageSize?: number;
    orderBy?: { field: string; ascending?: boolean };
    filters?: Array<{ field: string; operator: string; value: any }>;
    cursor?: string;
  } = {}
) => {
  const {
    selectFields = '*',
    pageSize = 50,
    orderBy,
    filters = [],
    cursor,
  } = options;

  let query: any = supabase.from(table).select(selectFields, { count: 'exact' });

  // Apply filters
  for (const filter of filters) {
    switch (filter.operator) {
      case 'eq':
        query = query.eq(filter.field, filter.value);
        break;
      case 'neq':
        query = query.neq(filter.field, filter.value);
        break;
      case 'gt':
        query = query.gt(filter.field, filter.value);
        break;
      case 'gte':
        query = query.gte(filter.field, filter.value);
        break;
      case 'lt':
        query = query.lt(filter.field, filter.value);
        break;
      case 'lte':
        query = query.lte(filter.field, filter.value);
        break;
      case 'in':
        query = query.in(filter.field, filter.value);
        break;
      case 'like':
        query = query.like(filter.field, filter.value);
        break;
    }
  }

  // Apply ordering
  if (orderBy) {
    query = query.order(orderBy.field, {
      ascending: orderBy.ascending !== false,
    });
  }

  // Apply pagination
  if (cursor) {
    query = query.gt('created_at', cursor);
  }

  const { data, error, count } = await query.limit(pageSize);

  if (error) {
    console.error(`Error fetching paginated data from ${table}:`, error);
    throw error;
  }

  return {
    data: data || [],
    count: count || 0,
    nextCursor: data && data.length > 0 ? data[data.length - 1].created_at : null,
    hasMore: (count || 0) > pageSize,
  };
};

/**
 * Batch update multiple records
 */
export const batchUpdate = async <T>(
  table: string,
  updates: Array<{ id: string; data: Partial<T> }>,
  options: {
    batchSize?: number;
  } = {}
) => {
  const { batchSize = 100 } = options;
  const results: any[] = [];

  for (let i = 0; i < updates.length; i += batchSize) {
    const batch = updates.slice(i, i + batchSize);

    for (const update of batch) {
      const { error } = await (supabase as any)
        .from(table)
        .update(update.data)
        .eq('id', update.id);

      if (error) {
        console.error(`Error updating record in ${table}:`, error);
        throw error;
      }

      results.push({ id: update.id, success: true });
    }
  }

  return results;
};

/**
 * Batch delete multiple records
 */
export const batchDelete = async (
  table: string,
  ids: string[],
  options: {
    batchSize?: number;
  } = {}
) => {
  const { batchSize = 100 } = options;
  let deletedCount = 0;

  for (let i = 0; i < ids.length; i += batchSize) {
    const batch = ids.slice(i, i + batchSize);

    const { error } = await (supabase as any)
      .from(table)
      .delete()
      .in('id', batch);

    if (error) {
      console.error(`Error deleting records from ${table}:`, error);
      throw error;
    }

    deletedCount += batch.length;
  }

  return { deletedCount };
};

/**
 * Efficient count query
 */
export const countRecords = async (
  table: string,
  filters: Array<{ field: string; operator: string; value: any }> = []
) => {
  let query: any = (supabase as any).from(table).select('id', { count: 'exact', head: true });

  for (const filter of filters) {
    switch (filter.operator) {
      case 'eq':
        query = query.eq(filter.field, filter.value);
        break;
      case 'neq':
        query = query.neq(filter.field, filter.value);
        break;
      case 'gt':
        query = query.gt(filter.field, filter.value);
        break;
      case 'gte':
        query = query.gte(filter.field, filter.value);
        break;
      case 'lt':
        query = query.lt(filter.field, filter.value);
        break;
      case 'lte':
        query = query.lte(filter.field, filter.value);
        break;
      case 'in':
        query = query.in(filter.field, filter.value);
        break;
    }
  }

  const { count, error } = await query;

  if (error) {
    console.error(`Error counting records in ${table}:`, error);
    throw error;
  }

  return count || 0;
};

/**
 * Efficient search with full-text search
 */
export const fullTextSearch = async <T>(
  table: string,
  searchField: string,
  query: string,
  options: {
    selectFields?: string;
    pageSize?: number;
    filters?: Array<{ field: string; operator: string; value: any }>;
  } = {}
) => {
  const { selectFields = '*', pageSize = 50, filters = [] } = options;

  let dbQuery: any = (supabase as any)
    .from(table)
    .select(selectFields)
    .textSearch(searchField, query);

  for (const filter of filters) {
    switch (filter.operator) {
      case 'eq':
        dbQuery = dbQuery.eq(filter.field, filter.value);
        break;
      case 'in':
        dbQuery = dbQuery.in(filter.field, filter.value);
        break;
    }
  }

  const { data, error } = await dbQuery.limit(pageSize);

  if (error) {
    console.error(`Error searching ${table}:`, error);
    throw error;
  }

  return data || [];
};

/**
 * Efficient join query with related data
 */
export const joinQuery = async <T>(
  table: string,
  joinConfig: {
    field: string;
    foreignTable: string;
    selectFields?: string;
  },
  options: {
    filters?: Array<{ field: string; operator: string; value: any }>;
    limit?: number;
  } = {}
) => {
  const { filters = [], limit = 100 } = options;
  const selectFields = `*, ${joinConfig.foreignTable}(${joinConfig.selectFields || '*'})`;

  let query: any = (supabase as any).from(table).select(selectFields).limit(limit);

  for (const filter of filters) {
    switch (filter.operator) {
      case 'eq':
        query = query.eq(filter.field, filter.value);
        break;
      case 'in':
        query = query.in(filter.field, filter.value);
        break;
    }
  }

  const { data, error } = await query;

  if (error) {
    console.error(`Error executing join query on ${table}:`, error);
    throw error;
  }

  return data || [];
};
