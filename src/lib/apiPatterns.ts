/**
 * Common API operation patterns to reduce code duplication
 */

import { supabase } from '@/integrations/supabase/client';
import { parseSupabaseError } from '@/lib/errorHandler';

/**
 * Generic fetch operation with error handling
 */
export const fetchData = async <T>(
  table: string,
  options: {
    select?: string;
    filters?: Array<{ field: string; operator: string; value: any }>;
    orderBy?: { field: string; ascending?: boolean };
    limit?: number;
  } = {}
): Promise<T[]> => {
  try {
    const { select = '*', filters = [], orderBy, limit } = options;

    // @ts-ignore - Generic utility requires string table names (Supabase limitation)
    let query: any = supabase.from(table).select(select);

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
      }
    }

    // Apply ordering
    if (orderBy) {
      query = query.order(orderBy.field, {
        ascending: orderBy.ascending !== false,
      });
    }

    // Apply limit
    if (limit) {
      query = query.limit(limit);
    }

    const { data, error } = await query;

    if (error) throw error;
    return data || [];
  } catch (error) {
    const errorResponse = parseSupabaseError(error);
    console.error(`Error fetching from ${table}:`, errorResponse);
    throw errorResponse;
  }
};

/**
 * Generic insert operation with error handling
 */
export const insertData = async <T>(
  table: string,
  data: T
): Promise<T> => {
  try {
    const { data: result, error } = await (supabase as any)
      .from(table)
      .insert(data)
      .select()
      .single();

    if (error) throw error;
    return result;
  } catch (error) {
    const errorResponse = parseSupabaseError(error);
    console.error(`Error inserting into ${table}:`, errorResponse);
    throw errorResponse;
  }
};

/**
 * Generic update operation with error handling
 */
export const updateData = async <T>(
  table: string,
  id: string,
  data: Partial<T>
): Promise<T> => {
  try {
    const { data: result, error } = await (supabase as any)
      .from(table)
      .update(data)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return result;
  } catch (error) {
    const errorResponse = parseSupabaseError(error);
    console.error(`Error updating ${table}:`, errorResponse);
    throw errorResponse;
  }
};

/**
 * Generic delete operation with error handling
 */
export const deleteData = async (
  table: string,
  id: string
): Promise<void> => {
  try {
    const { error } = await (supabase as any)
      .from(table)
      .delete()
      .eq('id', id);

    if (error) throw error;
  } catch (error) {
    const errorResponse = parseSupabaseError(error);
    console.error(`Error deleting from ${table}:`, errorResponse);
    throw errorResponse;
  }
};

/**
 * Generic fetch by ID operation
 */
export const fetchById = async <T>(
  table: string,
  id: string,
  select: string = '*'
): Promise<T | null> => {
  try {
    const { data, error } = await (supabase as any)
      .from(table)
      .select(select)
      .eq('id', id)
      .single();

    if (error) throw error;
    return data;
  } catch (error) {
    const errorResponse = parseSupabaseError(error);
    console.error(`Error fetching ${table} by ID:`, errorResponse);
    throw errorResponse;
  }
};

/**
 * Generic upsert operation
 */
export const upsertData = async <T>(
  table: string,
  data: T
): Promise<T> => {
  try {
    const { data: result, error } = await (supabase as any)
      .from(table)
      .upsert(data)
      .select()
      .single();

    if (error) throw error;
    return result;
  } catch (error) {
    const errorResponse = parseSupabaseError(error);
    console.error(`Error upserting into ${table}:`, errorResponse);
    throw errorResponse;
  }
};

/**
 * Generic count operation
 */
export const countData = async (
  table: string,
  filters: Array<{ field: string; operator: string; value: any }> = []
): Promise<number> => {
  try {
    let query: any = (supabase as any)
      .from(table)
      .select('id', { count: 'exact', head: true });

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
        case 'in':
          query = query.in(filter.field, filter.value);
          break;
      }
    }

    const { count, error } = await query;

    if (error) throw error;
    return count || 0;
  } catch (error) {
    const errorResponse = parseSupabaseError(error);
    console.error(`Error counting ${table}:`, errorResponse);
    throw errorResponse;
  }
};
