/**
 * Unit tests for validation utilities
 */

import {
  validateProfileForm,
  validatePostContent,
  validateEmail,
  validateUrl,
  validateFileUpload,
  validateArrayField,
  getFieldError,
  hasFieldError,
} from '@/lib/validation';

describe('Validation Utilities', () => {
  describe('validateProfileForm', () => {
    it('should validate a complete profile', () => {
      const result = validateProfileForm({
        name: 'John Doe',
        bio: 'A great person',
        age: 25,
        city: 'New York',
        country: 'US',
      });

      expect(result.valid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should reject empty name', () => {
      const result = validateProfileForm({
        name: '',
        bio: 'A great person',
        age: 25,
      });

      expect(result.valid).toBe(false);
      expect(result.errors).toContainEqual(
        expect.objectContaining({ field: 'name' })
      );
    });

    it('should reject name shorter than 2 characters', () => {
      const result = validateProfileForm({
        name: 'J',
        bio: 'A great person',
      });

      expect(result.valid).toBe(false);
      expect(result.errors).toContainEqual(
        expect.objectContaining({
          field: 'name',
          message: expect.stringContaining('at least 2 characters'),
        })
      );
    });

    it('should reject name longer than 100 characters', () => {
      const result = validateProfileForm({
        name: 'A'.repeat(101),
      });

      expect(result.valid).toBe(false);
      expect(result.errors).toContainEqual(
        expect.objectContaining({
          field: 'name',
          message: expect.stringContaining('not exceed 100 characters'),
        })
      );
    });

    it('should reject bio longer than 500 characters', () => {
      const result = validateProfileForm({
        name: 'John Doe',
        bio: 'A'.repeat(501),
      });

      expect(result.valid).toBe(false);
      expect(result.errors).toContainEqual(
        expect.objectContaining({ field: 'bio' })
      );
    });

    it('should reject invalid age', () => {
      const result = validateProfileForm({
        name: 'John Doe',
        age: 'not-a-number',
      });

      expect(result.valid).toBe(false);
      expect(result.errors).toContainEqual(
        expect.objectContaining({ field: 'age' })
      );
    });

    it('should reject age below 13', () => {
      const result = validateProfileForm({
        name: 'John Doe',
        age: 12,
      });

      expect(result.valid).toBe(false);
      expect(result.errors).toContainEqual(
        expect.objectContaining({
          field: 'age',
          message: expect.stringContaining('at least 13'),
        })
      );
    });

    it('should reject age above 120', () => {
      const result = validateProfileForm({
        name: 'John Doe',
        age: 121,
      });

      expect(result.valid).toBe(false);
      expect(result.errors).toContainEqual(
        expect.objectContaining({
          field: 'age',
          message: expect.stringContaining('not exceed 120'),
        })
      );
    });
  });

  describe('validatePostContent', () => {
    it('should validate valid post content', () => {
      const result = validatePostContent('This is a great post!');

      expect(result.valid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should reject empty content', () => {
      const result = validatePostContent('');

      expect(result.valid).toBe(false);
      expect(result.errors).toContainEqual(
        expect.objectContaining({ field: 'content' })
      );
    });

    it('should reject content exceeding max length', () => {
      const result = validatePostContent('A'.repeat(5001), 5000);

      expect(result.valid).toBe(false);
      expect(result.errors).toContainEqual(
        expect.objectContaining({ field: 'content' })
      );
    });

    it('should accept content at max length', () => {
      const result = validatePostContent('A'.repeat(5000), 5000);

      expect(result.valid).toBe(true);
    });
  });

  describe('validateEmail', () => {
    it('should validate correct email', () => {
      expect(validateEmail('user@example.com')).toBe(true);
    });

    it('should reject email without @', () => {
      expect(validateEmail('userexample.com')).toBe(false);
    });

    it('should reject email without domain', () => {
      expect(validateEmail('user@')).toBe(false);
    });

    it('should reject email without local part', () => {
      expect(validateEmail('@example.com')).toBe(false);
    });
  });

  describe('validateUrl', () => {
    it('should validate correct URL', () => {
      expect(validateUrl('https://example.com')).toBe(true);
    });

    it('should validate HTTP URL', () => {
      expect(validateUrl('http://example.com')).toBe(true);
    });

    it('should reject invalid URL', () => {
      expect(validateUrl('not a url')).toBe(false);
    });

    it('should reject URL without protocol', () => {
      expect(validateUrl('example.com')).toBe(false);
    });
  });

  describe('validateFileUpload', () => {
    it('should validate correct file', () => {
      const file = new File(['content'], 'test.jpg', { type: 'image/jpeg' });
      const result = validateFileUpload(file, {
        maxSizeMB: 10,
        allowedTypes: ['image/'],
      });

      expect(result.valid).toBe(true);
    });

    it('should reject file exceeding max size', () => {
      const largeContent = new Array(11 * 1024 * 1024).fill('a').join('');
      const file = new File([largeContent], 'large.jpg', {
        type: 'image/jpeg',
      });
      const result = validateFileUpload(file, { maxSizeMB: 10 });

      expect(result.valid).toBe(false);
      expect(result.errors).toContainEqual(
        expect.objectContaining({ field: 'file' })
      );
    });

    it('should reject disallowed file type', () => {
      const file = new File(['content'], 'test.exe', {
        type: 'application/x-msdownload',
      });
      const result = validateFileUpload(file, {
        allowedTypes: ['image/'],
      });

      expect(result.valid).toBe(false);
      expect(result.errors).toContainEqual(
        expect.objectContaining({ field: 'file' })
      );
    });
  });

  describe('validateArrayField', () => {
    it('should validate array with valid items', () => {
      const result = validateArrayField(['item1', 'item2'], {
        minItems: 1,
        maxItems: 10,
      });

      expect(result.valid).toBe(true);
    });

    it('should reject array with too few items', () => {
      const result = validateArrayField([], {
        minItems: 1,
      });

      expect(result.valid).toBe(false);
      expect(result.errors).toContainEqual(
        expect.objectContaining({
          message: expect.stringContaining('At least 1'),
        })
      );
    });

    it('should reject array with too many items', () => {
      const result = validateArrayField(
        Array(101).fill('item'),
        { maxItems: 100 }
      );

      expect(result.valid).toBe(false);
      expect(result.errors).toContainEqual(
        expect.objectContaining({
          message: expect.stringContaining('Maximum 100'),
        })
      );
    });
  });

  describe('getFieldError', () => {
    it('should return error message for field', () => {
      const errors = [
        { field: 'name', message: 'Name is required' },
        { field: 'email', message: 'Invalid email' },
      ];

      expect(getFieldError(errors, 'name')).toBe('Name is required');
    });

    it('should return null if field has no error', () => {
      const errors = [{ field: 'name', message: 'Name is required' }];

      expect(getFieldError(errors, 'email')).toBeNull();
    });
  });

  describe('hasFieldError', () => {
    it('should return true if field has error', () => {
      const errors = [{ field: 'name', message: 'Name is required' }];

      expect(hasFieldError(errors, 'name')).toBe(true);
    });

    it('should return false if field has no error', () => {
      const errors = [{ field: 'name', message: 'Name is required' }];

      expect(hasFieldError(errors, 'email')).toBe(false);
    });
  });
});
