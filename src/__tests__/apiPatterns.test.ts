/**
 * Unit tests for API patterns utilities
 */

import {
  fetchData,
  insertData,
  updateData,
  deleteData,
  fetchById,
  upsertData,
  countData,
} from '@/lib/apiPatterns';
import { supabase } from '@/integrations/supabase/client';

jest.mock('@/integrations/supabase/client');

describe('API Patterns Utilities', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('fetchData', () => {
    it('should fetch data with default options', async () => {
      const mockData = [{ id: '1', name: 'Test' }];
      (supabase.from as jest.Mock).mockReturnValue({
        select: jest.fn().mockReturnThis(),
        order: jest.fn().mockReturnThis(),
        limit: jest.fn().mockResolvedValue({ data: mockData, error: null }),
      });

      const result = await fetchData('profiles');

      expect(result).toEqual(mockData);
    });

    it('should fetch data with custom select', async () => {
      const mockData = [{ id: '1', name: 'Test' }];
      const selectMock = jest.fn().mockReturnThis();
      (supabase.from as jest.Mock).mockReturnValue({
        select: selectMock,
        order: jest.fn().mockReturnThis(),
        limit: jest.fn().mockResolvedValue({ data: mockData, error: null }),
      });

      await fetchData('profiles', { select: 'id, name' });

      expect(selectMock).toHaveBeenCalledWith('id, name');
    });

    it('should apply filters', async () => {
      const mockData = [{ id: '1', country: 'US' }];
      const eqMock = jest.fn().mockReturnThis();
      (supabase.from as jest.Mock).mockReturnValue({
        select: jest.fn().mockReturnThis(),
        eq: eqMock,
        order: jest.fn().mockReturnThis(),
        limit: jest.fn().mockResolvedValue({ data: mockData, error: null }),
      });

      await fetchData('profiles', {
        filters: [{ field: 'country', operator: 'eq', value: 'US' }],
      });

      expect(eqMock).toHaveBeenCalledWith('country', 'US');
    });

    it('should apply ordering', async () => {
      const mockData = [{ id: '1' }];
      const orderMock = jest.fn().mockReturnThis();
      (supabase.from as jest.Mock).mockReturnValue({
        select: jest.fn().mockReturnThis(),
        order: orderMock,
        limit: jest.fn().mockResolvedValue({ data: mockData, error: null }),
      });

      await fetchData('profiles', {
        orderBy: { field: 'created_at', ascending: false },
      });

      expect(orderMock).toHaveBeenCalledWith('created_at', { ascending: false });
    });

    it('should apply limit', async () => {
      const mockData = [{ id: '1' }];
      const limitMock = jest.fn().mockResolvedValue({ data: mockData, error: null });
      (supabase.from as jest.Mock).mockReturnValue({
        select: jest.fn().mockReturnThis(),
        order: jest.fn().mockReturnThis(),
        limit: limitMock,
      });

      await fetchData('profiles', { limit: 10 });

      expect(limitMock).toHaveBeenCalledWith(10);
    });

    it('should throw error on failure', async () => {
      const error = new Error('Query failed');
      (supabase.from as jest.Mock).mockReturnValue({
        select: jest.fn().mockReturnThis(),
        order: jest.fn().mockReturnThis(),
        limit: jest.fn().mockResolvedValue({ data: null, error }),
      });

      await expect(fetchData('profiles')).rejects.toThrow();
    });
  });

  describe('insertData', () => {
    it('should insert data successfully', async () => {
      const newData = { name: 'Test', email: 'test@example.com' };
      const mockResult = { id: '1', ...newData };
      (supabase.from as jest.Mock).mockReturnValue({
        insert: jest.fn().mockReturnThis(),
        select: jest.fn().mockReturnThis(),
        single: jest.fn().mockResolvedValue({ data: mockResult, error: null }),
      });

      const result = await insertData('profiles', newData);

      expect(result).toEqual(mockResult);
    });

    it('should throw error on insert failure', async () => {
      const error = new Error('Insert failed');
      (supabase.from as jest.Mock).mockReturnValue({
        insert: jest.fn().mockReturnThis(),
        select: jest.fn().mockReturnThis(),
        single: jest.fn().mockResolvedValue({ data: null, error }),
      });

      await expect(insertData('profiles', {})).rejects.toThrow();
    });
  });

  describe('updateData', () => {
    it('should update data successfully', async () => {
      const updateData_data = { name: 'Updated' };
      const mockResult = { id: '1', ...updateData_data };
      (supabase.from as jest.Mock).mockReturnValue({
        update: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        select: jest.fn().mockReturnThis(),
        single: jest.fn().mockResolvedValue({ data: mockResult, error: null }),
      });

      const result = await updateData('profiles', '1', updateData_data);

      expect(result).toEqual(mockResult);
    });

    it('should throw error on update failure', async () => {
      const error = new Error('Update failed');
      (supabase.from as jest.Mock).mockReturnValue({
        update: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        select: jest.fn().mockReturnThis(),
        single: jest.fn().mockResolvedValue({ data: null, error }),
      });

      await expect(updateData('profiles', '1', {})).rejects.toThrow();
    });
  });

  describe('deleteData', () => {
    it('should delete data successfully', async () => {
      (supabase.from as jest.Mock).mockReturnValue({
        delete: jest.fn().mockReturnThis(),
        eq: jest.fn().mockResolvedValue({ error: null }),
      });

      await expect(deleteData('profiles', '1')).resolves.not.toThrow();
    });

    it('should throw error on delete failure', async () => {
      const error = new Error('Delete failed');
      (supabase.from as jest.Mock).mockReturnValue({
        delete: jest.fn().mockReturnThis(),
        eq: jest.fn().mockResolvedValue({ error }),
      });

      await expect(deleteData('profiles', '1')).rejects.toThrow();
    });
  });

  describe('fetchById', () => {
    it('should fetch single record by ID', async () => {
      const mockData = { id: '1', name: 'Test' };
      (supabase.from as jest.Mock).mockReturnValue({
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        single: jest.fn().mockResolvedValue({ data: mockData, error: null }),
      });

      const result = await fetchById('profiles', '1');

      expect(result).toEqual(mockData);
    });

    it('should return null if record not found', async () => {
      (supabase.from as jest.Mock).mockReturnValue({
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        single: jest.fn().mockResolvedValue({ data: null, error: null }),
      });

      const result = await fetchById('profiles', '999');

      expect(result).toBeNull();
    });
  });

  describe('upsertData', () => {
    it('should upsert data successfully', async () => {
      const data = { id: '1', name: 'Test' };
      const mockResult = data;
      (supabase.from as jest.Mock).mockReturnValue({
        upsert: jest.fn().mockReturnThis(),
        select: jest.fn().mockReturnThis(),
        single: jest.fn().mockResolvedValue({ data: mockResult, error: null }),
      });

      const result = await upsertData('profiles', data);

      expect(result).toEqual(mockResult);
    });
  });

  describe('countData', () => {
    it('should count records', async () => {
      (supabase.from as jest.Mock).mockReturnValue({
        select: jest.fn().mockResolvedValue({ count: 5, error: null }),
      });

      const result = await countData('profiles');

      expect(result).toBe(5);
    });

    it('should count with filters', async () => {
      (supabase.from as jest.Mock).mockReturnValue({
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockResolvedValue({ count: 2, error: null }),
      });

      const result = await countData('profiles', [
        { field: 'country', operator: 'eq', value: 'US' },
      ]);

      expect(result).toBe(2);
    });

    it('should return 0 on error', async () => {
      (supabase.from as jest.Mock).mockReturnValue({
        select: jest.fn().mockResolvedValue({ count: null, error: new Error('Count failed') }),
      });

      const result = await countData('profiles');

      expect(result).toBe(0);
    });
  });
});
