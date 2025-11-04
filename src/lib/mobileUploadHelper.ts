/**
 * Mobile Upload Helper - Comprehensive mobile file upload utilities
 * Addresses mobile-specific upload issues and provides better UX
 */

export interface MobileUploadOptions {
  maxSizeMB?: number;
  allowedTypes?: string[];
  showProgress?: boolean;
  enableRetry?: boolean;
  maxRetries?: number;
}

export interface MobileUploadResult {
  success: boolean;
  url?: string;
  error?: string;
  retryCount?: number;
}

class MobileUploadHelper {
  private static instance: MobileUploadHelper;
  
  public readonly isMobile: boolean;
  public readonly isLowEndDevice: boolean;
  public readonly isPWA: boolean;
  
  constructor() {
    this.isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
    this.isLowEndDevice = this.detectLowEndDevice();
    this.isPWA = window.matchMedia('(display-mode: standalone)').matches;
    
    console.log('📱 Mobile Upload Helper initialized:', {
      isMobile: this.isMobile,
      isLowEndDevice: this.isLowEndDevice,
      isPWA: this.isPWA,
      deviceMemory: (navigator as any).deviceMemory || 'unknown',
      hardwareConcurrency: navigator.hardwareConcurrency || 'unknown'
    });
  }
  
  static getInstance(): MobileUploadHelper {
    if (!MobileUploadHelper.instance) {
      MobileUploadHelper.instance = new MobileUploadHelper();
    }
    return MobileUploadHelper.instance;
  }
  
  private detectLowEndDevice(): boolean {
    const memory = (navigator as any).deviceMemory || 4;
    const cores = navigator.hardwareConcurrency || 4;
    return memory <= 2 || cores <= 2;
  }
  
  /**
   * Validate file for mobile upload with detailed feedback
   */
  validateFile(file: File, options: MobileUploadOptions = {}): { valid: boolean; error?: string } {
    const {
      maxSizeMB = this.isLowEndDevice ? 5 : 10,
      allowedTypes = ['image/', 'video/', 'audio/', 'application/pdf', 'text/']
    } = options;
    
    console.log('📱 Validating file for mobile:', {
      name: file.name,
      size: `${(file.size / 1024 / 1024).toFixed(2)}MB`,
      type: file.type,
      maxAllowed: `${maxSizeMB}MB`,
      isLowEndDevice: this.isLowEndDevice
    });
    
    // Check file size
    const maxBytes = maxSizeMB * 1024 * 1024;
    if (file.size > maxBytes) {
      return {
        valid: false,
        error: `File too large. Maximum size: ${maxSizeMB}MB (current: ${(file.size / 1024 / 1024).toFixed(2)}MB)`
      };
    }
    
    // Check file type
    const isValidType = allowedTypes.some(type => file.type.startsWith(type));
    if (!isValidType) {
      return {
        valid: false,
        error: `File type not supported. Allowed types: ${allowedTypes.join(', ')}`
      };
    }
    
    // Check if device can handle the file
    if (!this.canHandleUpload(file.size)) {
      return {
        valid: false,
        error: 'Device may not have enough memory to process this file'
      };
    }
    
    console.log('✅ File validation passed');
    return { valid: true };
  }
  
  /**
   * Check if device has sufficient resources for upload
   */
  canHandleUpload(fileSize: number): boolean {
    const availableMemory = (navigator as any).deviceMemory || 4;
    const fileSizeMB = fileSize / 1024 / 1024;
    
    // Conservative memory check - don't use more than 10% of device memory
    const memoryThreshold = availableMemory * 1024 * 0.1; // MB
    
    return fileSizeMB <= memoryThreshold;
  }
  
  /**
   * Create mobile-optimized file input attributes
   * Note: Removed 'capture' attribute to allow users to choose between camera and gallery
   */
  getMobileInputAttributes(type: 'avatar' | 'post' | 'attachment' = 'attachment') {
    const baseAttributes = {
      style: { display: 'none' },
      className: 'hidden'
    };
    
    switch (type) {
      case 'avatar':
        return {
          ...baseAttributes,
          accept: 'image/jpeg,image/jpg,image/png,image/gif,image/webp',
          multiple: false
        };
      
      case 'post':
        return {
          ...baseAttributes,
          accept: 'image/jpeg,image/jpg,image/png,image/gif,image/webp',
          multiple: true
        };
      
      case 'attachment':
      default:
        return {
          ...baseAttributes,
          accept: 'image/*,video/*,audio/*,.pdf,.doc,.docx,.txt',
          multiple: false
        };
    }
  }
  
  /**
   * Handle file selection with mobile-specific validation
   */
  async handleFileSelection(
    files: FileList | File[], 
    options: MobileUploadOptions = {}
  ): Promise<{ validFiles: File[]; errors: string[] }> {
    const fileArray = Array.from(files);
    const validFiles: File[] = [];
    const errors: string[] = [];
    
    console.log('📱 Processing file selection:', {
      fileCount: fileArray.length,
      isMobile: this.isMobile,
      isLowEndDevice: this.isLowEndDevice
    });
    
    for (const file of fileArray) {
      const validation = this.validateFile(file, options);
      
      if (validation.valid) {
        validFiles.push(file);
      } else {
        errors.push(`${file.name}: ${validation.error}`);
      }
    }
    
    console.log('📱 File selection results:', {
      validFiles: validFiles.length,
      errors: errors.length,
      validFileNames: validFiles.map(f => f.name)
    });
    
    return { validFiles, errors };
  }
  
  /**
   * Upload file with mobile-specific retry logic
   */
  async uploadWithRetry<T>(
    uploadFn: (file: File) => Promise<T>,
    file: File,
    options: MobileUploadOptions = {}
  ): Promise<MobileUploadResult> {
    const { enableRetry = true, maxRetries = this.isLowEndDevice ? 2 : 3 } = options;
    
    let lastError: Error | null = null;
    let retryCount = 0;
    
    // Validate file first
    const validation = this.validateFile(file, options);
    if (!validation.valid) {
      return {
        success: false,
        error: validation.error,
        retryCount: 0
      };
    }
    
    const actualRetries = enableRetry ? maxRetries : 1;
    
    for (let attempt = 1; attempt <= actualRetries; attempt++) {
      try {
        console.log(`📱 Upload attempt ${attempt}/${actualRetries} for ${file.name}`);
        
        // Add delay between retries on mobile
        if (attempt > 1) {
          const delay = Math.min(1000 * attempt, 5000); // Max 5 second delay
          await new Promise(resolve => setTimeout(resolve, delay));
        }
        
        const result = await uploadFn(file);
        
        console.log(`✅ Upload successful on attempt ${attempt}`);
        return {
          success: true,
          url: result as string,
          retryCount: attempt - 1
        };
        
      } catch (error: any) {
        lastError = error;
        retryCount = attempt - 1;
        
        console.warn(`❌ Upload attempt ${attempt} failed:`, error.message);
        
        // Don't retry on certain errors
        if (error.message?.includes('401') || 
            error.message?.includes('403') || 
            error.message?.includes('413') || // Payload too large
            error.message?.includes('unsupported')) {
          break;
        }
      }
    }
    
    return {
      success: false,
      error: lastError?.message || 'Upload failed after all retries',
      retryCount
    };
  }
  
  /**
   * Show mobile-friendly error messages
   */
  getMobileErrorMessage(error: string): string {
    if (error.includes('too large') || error.includes('413')) {
      return `File is too large for your device. Try a smaller file or use a different device.`;
    }
    
    if (error.includes('network') || error.includes('fetch')) {
      return `Network error. Check your connection and try again.`;
    }
    
    if (error.includes('type') || error.includes('format')) {
      return `File type not supported on mobile. Try a different file format.`;
    }
    
    if (error.includes('memory') || error.includes('device')) {
      return `Your device may not have enough memory. Try closing other apps or use a smaller file.`;
    }
    
    return error;
  }
  
  /**
   * Get recommended file size limits for mobile
   */
  getRecommendedLimits() {
    return {
      avatar: this.isLowEndDevice ? 2 : 5, // MB
      post: this.isLowEndDevice ? 5 : 10,  // MB
      attachment: this.isLowEndDevice ? 10 : 20 // MB
    };
  }
}

// Export singleton instance
export const mobileUploadHelper = MobileUploadHelper.getInstance();

// Export utility functions
export const validateMobileFile = (file: File, options?: MobileUploadOptions) => 
  mobileUploadHelper.validateFile(file, options);

export const handleMobileFileSelection = (files: FileList | File[], options?: MobileUploadOptions) =>
  mobileUploadHelper.handleFileSelection(files, options);

export const uploadWithMobileRetry = <T>(
  uploadFn: (file: File) => Promise<T>,
  file: File,
  options?: MobileUploadOptions
) => mobileUploadHelper.uploadWithRetry(uploadFn, file, options);

export const getMobileInputAttributes = (type?: 'avatar' | 'post' | 'attachment') =>
  mobileUploadHelper.getMobileInputAttributes(type);

export const getMobileErrorMessage = (error: string) =>
  mobileUploadHelper.getMobileErrorMessage(error);
