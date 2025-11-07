/**
 * Mobile-optimized file handling for PWA
 * Fixes common mobile upload issues
 */

export class MobileFileHandler {
  private static instance: MobileFileHandler;
  private isMobile: boolean;
  private isLowEndDevice: boolean;

  constructor() {
    this.isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
    this.isLowEndDevice = this.detectLowEndDevice();
  }

  static getInstance(): MobileFileHandler {
    if (!MobileFileHandler.instance) {
      MobileFileHandler.instance = new MobileFileHandler();
    }
    return MobileFileHandler.instance;
  }

  private detectLowEndDevice(): boolean {
    const memory = (navigator as any).deviceMemory || 4;
    const cores = navigator.hardwareConcurrency || 4;
    return memory <= 2 || cores <= 2;
  }

  /**
   * Compress image for mobile upload
   */
  async compressImage(file: File, maxSizeMB: number = 2): Promise<File> {
    if (!file.type.startsWith('image/')) {
      return file;
    }

    return new Promise((resolve, reject) => {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      const img = new Image();

      img.onload = () => {
        try {
          // Calculate dimensions based on device capability
          const maxWidth = this.isLowEndDevice ? 800 : 1200;
          const maxHeight = this.isLowEndDevice ? 600 : 900;
          
          let { width, height } = img;
          
          // Resize if too large
          if (width > maxWidth || height > maxHeight) {
            const ratio = Math.min(maxWidth / width, maxHeight / height);
            width = Math.floor(width * ratio);
            height = Math.floor(height * ratio);
          }

          canvas.width = width;
          canvas.height = height;
          
          // Use better image rendering
          if (ctx) {
            ctx.imageSmoothingEnabled = true;
            ctx.imageSmoothingQuality = 'high';
            ctx.drawImage(img, 0, 0, width, height);
          }
          
          // Compress based on device capability
          const quality = this.isLowEndDevice ? 0.6 : 0.8;
          
          canvas.toBlob((blob) => {
            if (blob) {
              // Check if we need further compression
              const targetSize = maxSizeMB * 1024 * 1024;
              
              if (blob.size > targetSize) {
                // Further compress
                const newQuality = Math.max(0.3, quality * (targetSize / blob.size));
                canvas.toBlob((compressedBlob) => {
                  if (compressedBlob) {
                    const compressedFile = new File([compressedBlob], file.name, {
                      type: file.type,
                      lastModified: Date.now()
                    });
                    resolve(compressedFile);
                  } else {
                    resolve(file);
                  }
                }, file.type, newQuality);
              } else {
                const compressedFile = new File([blob], file.name, {
                  type: file.type,
                  lastModified: Date.now()
                });
                resolve(compressedFile);
              }
            } else {
              resolve(file);
            }
          }, file.type, quality);
        } catch (error) {
          console.error('Image compression failed:', error);
          resolve(file);
        }
      };

      img.onerror = () => {
        console.error('Failed to load image for compression');
        resolve(file);
      };

      img.src = URL.createObjectURL(file);
    });
  }

  /**
   * Validate file for mobile upload
   */
  validateFile(file: File): { valid: boolean; error?: string } {
    // Size limits based on device capability
    const maxSize = this.isLowEndDevice ? 10 * 1024 * 1024 : 20 * 1024 * 1024; // 10MB vs 20MB
    
    if (file.size > maxSize) {
      return {
        valid: false,
        error: `File too large. Maximum size: ${maxSize / 1024 / 1024}MB`
      };
    }

    // Check file type
    const allowedTypes = [
      'image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp',
      'video/mp4', 'video/webm',
      'audio/mp3', 'audio/wav', 'audio/webm',
      'application/pdf', 'text/plain'
    ];

    if (!allowedTypes.includes(file.type)) {
      return {
        valid: false,
        error: 'File type not supported'
      };
    }

    return { valid: true };
  }

  /**
   * Prepare file for upload with mobile optimizations
   */
  async prepareFileForUpload(file: File): Promise<File> {

    // Validate file
    const validation = this.validateFile(file);
    if (!validation.valid) {
      throw new Error(validation.error);
    }

    // Smart compression for images
    if (file.type.startsWith('image/')) {
      try {
        const compressed = await this.compressImage(file, 2);
        return compressed;
      } catch (error) {
        console.warn('Compression failed, using original:', error);
        return file;
      }
    }

    return file;
  }

  /**
   * Upload file with mobile-specific retry logic
   */
  async uploadWithRetry<T>(
    uploadFn: (file: File) => Promise<T>,
    file: File,
    maxRetries: number = 3
  ): Promise<T> {
    const preparedFile = await this.prepareFileForUpload(file);
    
    let lastError: Error | null = null;
    const retries = this.isLowEndDevice ? Math.min(maxRetries, 2) : maxRetries;

    for (let attempt = 1; attempt <= retries; attempt++) {
      try {
        
        // Add delay between retries on mobile
        if (attempt > 1) {
          await new Promise(resolve => setTimeout(resolve, 1000 * attempt));
        }

        const result = await uploadFn(preparedFile);
        console.log(`✅ Upload successful on attempt ${attempt}`);
        return result;
        
      } catch (error: any) {
        lastError = error;
        console.warn(`❌ Upload attempt ${attempt} failed:`, error.message);
        
        // Don't retry on certain errors
        if (error.message?.includes('401') || error.message?.includes('403')) {
          throw error;
        }
      }
    }

    throw lastError || new Error('Upload failed after all retries');
  }

  /**
   * Check if device has sufficient resources for upload
   */
  canHandleUpload(fileSize: number): boolean {
    const availableMemory = (navigator as any).deviceMemory || 4;
    const fileSizeMB = fileSize / 1024 / 1024;
    
    // Conservative memory check
    const memoryThreshold = this.isLowEndDevice ? 50 : 100; // MB
    
    if (fileSizeMB > availableMemory * 1024 * 0.1) { // Don't use more than 10% of device memory
      return false;
    }

    return fileSizeMB <= memoryThreshold;
  }

  /**
   * Get optimal chunk size for upload based on device
   */
  getOptimalChunkSize(): number {
    if (this.isLowEndDevice) {
      return 512 * 1024; // 512KB chunks
    }
    return 1024 * 1024; // 1MB chunks
  }
}

// Export singleton instance
export const mobileFileHandler = MobileFileHandler.getInstance();
