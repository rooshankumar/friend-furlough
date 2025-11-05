/**
 * Comprehensive validation utilities for forms and user input
 */

export interface ValidationError {
  field: string;
  message: string;
}

export interface ValidationResult {
  valid: boolean;
  errors: ValidationError[];
}

/**
 * Validate profile form data
 */
export const validateProfileForm = (data: {
  name?: string;
  bio?: string;
  age?: string | number;
  city?: string;
  country?: string;
}): ValidationResult => {
  const errors: ValidationError[] = [];

  // Name validation
  if (!data.name || data.name.trim().length === 0) {
    errors.push({ field: 'name', message: 'Name is required' });
  } else if (data.name.trim().length < 2) {
    errors.push({ field: 'name', message: 'Name must be at least 2 characters' });
  } else if (data.name.trim().length > 100) {
    errors.push({ field: 'name', message: 'Name must not exceed 100 characters' });
  }

  // Bio validation
  if (data.bio && data.bio.length > 500) {
    errors.push({ field: 'bio', message: 'Bio must not exceed 500 characters' });
  }

  // Age validation
  if (data.age) {
    const ageNum = typeof data.age === 'string' ? parseInt(data.age, 10) : data.age;
    if (isNaN(ageNum)) {
      errors.push({ field: 'age', message: 'Age must be a valid number' });
    } else if (ageNum < 13) {
      errors.push({ field: 'age', message: 'Age must be at least 13' });
    } else if (ageNum > 120) {
      errors.push({ field: 'age', message: 'Age must not exceed 120' });
    }
  }

  // City validation
  if (data.city && data.city.length > 100) {
    errors.push({ field: 'city', message: 'City must not exceed 100 characters' });
  }

  return {
    valid: errors.length === 0,
    errors,
  };
};

/**
 * Validate post/comment content
 */
export const validatePostContent = (content?: string, maxLength = 5000): ValidationResult => {
  const errors: ValidationError[] = [];

  if (!content || content.trim().length === 0) {
    errors.push({ field: 'content', message: 'Content is required' });
  } else if (content.trim().length > maxLength) {
    errors.push({ field: 'content', message: `Content must not exceed ${maxLength} characters` });
  }

  return {
    valid: errors.length === 0,
    errors,
  };
};

/**
 * Validate email format
 */
export const validateEmail = (email: string): boolean => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

/**
 * Validate URL format
 */
export const validateUrl = (url: string): boolean => {
  try {
    new URL(url);
    return true;
  } catch {
    return false;
  }
};

/**
 * Validate file upload
 */
export const validateFileUpload = (
  file: File,
  options: {
    maxSizeMB?: number;
    allowedTypes?: string[];
  } = {}
): ValidationResult => {
  const errors: ValidationError[] = [];
  const { maxSizeMB = 10, allowedTypes = ['image/'] } = options;

  if (!file) {
    errors.push({ field: 'file', message: 'File is required' });
    return { valid: false, errors };
  }

  // Check file size
  const maxSizeBytes = maxSizeMB * 1024 * 1024;
  if (file.size > maxSizeBytes) {
    errors.push({
      field: 'file',
      message: `File size must not exceed ${maxSizeMB}MB`,
    });
  }

  // Check file type
  const isAllowedType = allowedTypes.some((type) =>
    type.endsWith('/')
      ? file.type.startsWith(type)
      : file.type === type
  );

  if (!isAllowedType) {
    errors.push({
      field: 'file',
      message: `File type not allowed. Allowed types: ${allowedTypes.join(', ')}`,
    });
  }

  return {
    valid: errors.length === 0,
    errors,
  };
};

/**
 * Validate array field (e.g., interests, languages)
 */
export const validateArrayField = (
  array: any[],
  options: {
    minItems?: number;
    maxItems?: number;
    fieldName?: string;
  } = {}
): ValidationResult => {
  const errors: ValidationError[] = [];
  const { minItems = 0, maxItems = 100, fieldName = 'items' } = options;

  if (array.length < minItems) {
    errors.push({
      field: fieldName,
      message: `At least ${minItems} ${fieldName} required`,
    });
  }

  if (array.length > maxItems) {
    errors.push({
      field: fieldName,
      message: `Maximum ${maxItems} ${fieldName} allowed`,
    });
  }

  return {
    valid: errors.length === 0,
    errors,
  };
};

/**
 * Get first error message for a field
 */
export const getFieldError = (errors: ValidationError[], field: string): string | null => {
  const error = errors.find((e) => e.field === field);
  return error?.message || null;
};

/**
 * Check if field has error
 */
export const hasFieldError = (errors: ValidationError[], field: string): boolean => {
  return errors.some((e) => e.field === field);
};
