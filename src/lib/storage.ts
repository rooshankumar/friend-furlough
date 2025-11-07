import { supabase } from '@/integrations/supabase/client';

/**
 * Smart compression - only compress if file is too large
 * Maintains quality while reducing size when needed
 */
const compressImage = async (file: File, maxWidth: number = 1200, quality: number = 0.85): Promise<File> => {
  // Skip compression for small files (under 500KB)
  if (file.size < 500 * 1024) {
    console.log('📸 File small enough, skipping compression:', (file.size / 1024).toFixed(2) + 'KB');
    return file;
  }

  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);

    reader.onload = (event) => {
      const img = new Image();
      img.src = event.target?.result as string;

      img.onload = () => {
        const canvas = document.createElement('canvas');
        let width = img.width;
        let height = img.height;

        // Only resize if larger than maxWidth
        if (width > maxWidth) {
          height = Math.round((height * maxWidth) / width);
          width = maxWidth;
        }

        canvas.width = width;
        canvas.height = height;

        const ctx = canvas.getContext('2d');
        if (!ctx) {
          reject(new Error('Canvas context failed'));
          return;
        }

        // High-quality rendering
        ctx.imageSmoothingEnabled = true;
        ctx.imageSmoothingQuality = 'high';
        ctx.drawImage(img, 0, 0, width, height);

        canvas.toBlob(
          (blob) => {
            if (blob) {
              const compressedFile = new File([blob], file.name, {
                type: 'image/jpeg',
                lastModified: Date.now(),
              });
              console.log('📸 Image compressed:', {
                before: (file.size / 1024).toFixed(2) + 'KB',
                after: (compressedFile.size / 1024).toFixed(2) + 'KB',
                saved: ((1 - compressedFile.size / file.size) * 100).toFixed(1) + '%'
              });
              resolve(compressedFile);
            } else {
              reject(new Error('Image compression failed'));
            }
          },
          'image/jpeg',
          quality
        );
      };

      img.onerror = () => reject(new Error('Failed to load image'));
    };

    reader.onerror = () => reject(new Error('Failed to read file'));
  });
};

/**
 * Mobile-optimized file validation
 */
const validateMobileFile = (file: File, maxSizeMB: number, allowedTypes: string[]): void => {
  const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
  const isLowEndDevice = (navigator as any).deviceMemory <= 2 || navigator.hardwareConcurrency <= 2;

  // Adjust limits for mobile devices
  const actualMaxSize = isMobile && isLowEndDevice ? Math.min(maxSizeMB, 3) : maxSizeMB;
  const maxBytes = actualMaxSize * 1024 * 1024;

  if (file.size > maxBytes) {
    throw new Error(`File too large. Maximum size: ${actualMaxSize}MB`);
  }

  if (!allowedTypes.some(type => file.type.startsWith(type))) {
    throw new Error('File type not supported');
  }

  console.log('📱 Mobile file validation passed:', {
    name: file.name,
    size: `${(file.size / 1024 / 1024).toFixed(2)}MB`,
    type: file.type,
    isMobile,
    isLowEndDevice,
    maxAllowed: `${actualMaxSize}MB`
  });
};

/**
 * Upload avatar image with mobile optimization
 * @param file - Image file to upload
 * @param userId - User ID for file naming
 * @returns Public URL of uploaded avatar
 */
export const uploadAvatar = async (file: File, userId: string): Promise<string> => {
  try {
    // Mobile-optimized validation
    validateMobileFile(file, 5, ['image/']);

    // Smart compression for avatars (maintain quality, 800x800 max)
    const compressedFile = await compressImage(file, 800, 0.9);

    const fileExt = 'jpg'; // Always use jpg for consistency
    const fileName = `${Date.now()}.${fileExt}`;
    const filePath = `${userId}/${fileName}`;

    const { error: uploadError } = await supabase.storage
      .from('avatars')
      .upload(filePath, compressedFile, { 
        upsert: true,
        contentType: 'image/jpeg'
      });

    if (uploadError) {
      console.error('Avatar upload error:', uploadError);
      throw new Error(`Upload failed: ${uploadError.message}`);
    }

    const { data } = supabase.storage
      .from('avatars')
      .getPublicUrl(filePath);

    console.log('✅ Avatar uploaded:', data.publicUrl);
    return data.publicUrl;
  } catch (error) {
    console.error('Avatar upload error:', error);
    throw error;
  }
};

/**
 * Upload post image with mobile optimization and progress tracking
 * @param file - Image file to upload
 * @param userId - User ID for file naming
 * @param onProgress - Optional callback for upload progress (0-100)
 * @returns Public URL of uploaded image
 */
export const uploadPostImage = async (
  file: File, 
  userId: string,
  onProgress?: (progress: number) => void
): Promise<string> => {
  console.log('📤 Starting post image upload:', file.name);

  const isMobile = /Android|webOS|iPhone|iPad|iPod/i.test(navigator.userAgent);
  const timeout = isMobile ? 60000 : 120000;

  const uploadPromise = new Promise<string>(async (resolve, reject) => {
    try {
      onProgress?.(10);

      // Compress image
      const { mobileFileHandler } = await import('./mobileFileHandler');
      const compressedFile = await mobileFileHandler.compressImage(file, 10);

      onProgress?.(40);

      const fileName = `${userId}/${Date.now()}_${file.name}`;

      onProgress?.(50);

      const { data, error } = await supabase.storage
        .from('community-posts')
        .upload(fileName, compressedFile, {
          cacheControl: '3600',
          upsert: false
        });

      if (error) throw error;

      onProgress?.(90);

      const { data: { publicUrl } } = supabase.storage
        .from('community-posts')
        .getPublicUrl(data.path);

      onProgress?.(100);
      console.log('✅ Post image uploaded:', publicUrl);

      resolve(publicUrl);
    } catch (error) {
      console.error('Post image upload error:', error);
      reject(error);
    }
  });

  const timeoutPromise = new Promise<never>((_, reject) => 
    setTimeout(() => reject(new Error('Upload timeout - please check your connection')), timeout)
  );

  return Promise.race([uploadPromise, timeoutPromise]);
};

/**
 * Upload chat attachment with mobile optimization
 * @param file - File to upload
 * @param conversationId - Conversation ID for organization
 * @param onProgress - Optional callback for upload progress (0-100)
 * @returns Public URL of uploaded file
 */
export const uploadChatAttachment = async (
  file: File,
  conversationId: string,
  onProgress?: (progress: number) => void
): Promise<string> => {
  console.log('📤 Uploading:', file.name, `(${(file.size / 1024 / 1024).toFixed(2)}MB)`);

  const isMobile = /Android|webOS|iPhone|iPad|iPod/i.test(navigator.userAgent);

  try {
    onProgress?.(5);

    // Compress image if needed (aggressive compression for mobile)
    let fileToUpload = file;
    if (file.type.startsWith('image/')) {
      onProgress?.(10);
      const { mobileFileHandler } = await import('./mobileFileHandler');
      fileToUpload = await mobileFileHandler.compressImage(file, isMobile ? 2 : 5);
      console.log('✅ Compressed:', (fileToUpload.size / 1024 / 1024).toFixed(2) + 'MB');
      
      // If still over 1MB on mobile, compress again
      if (isMobile && fileToUpload.size > 1024 * 1024) {
        fileToUpload = await mobileFileHandler.compressImage(fileToUpload, 1);
        console.log('✅ Re-compressed:', (fileToUpload.size / 1024 / 1024).toFixed(2) + 'MB');
      }
    }

    onProgress?.(30);
    const fileName = `${conversationId}/${Date.now()}_${file.name}`;
    onProgress?.(40);

    // Retry logic: Try 2 times with short timeout (Supabase API often hangs)
    const maxRetries = 2;
    let lastError: any;

    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        const timeout = attempt === 1 ? 10000 : 20000; // 10s then 20s = 30s total
        console.log(`🔄 Upload attempt ${attempt}/${maxRetries} (${timeout / 1000}s timeout)`);

        const uploadPromise = (async () => {
          const { data, error } = await supabase.storage
            .from('chat-attachments')
            .upload(fileName, fileToUpload, {
              cacheControl: '3600',
              upsert: true // Allow retry to overwrite
            });

          if (error) throw error;

          onProgress?.(80);
          const { data: { publicUrl } } = supabase.storage
            .from('chat-attachments')
            .getPublicUrl(data.path);

          onProgress?.(100);
          console.log(`✅ Uploaded (attempt ${attempt}):`, publicUrl);
          return publicUrl;
        })();

        const timeoutPromise = new Promise<never>((_, reject) => {
          setTimeout(() => {
            reject(new Error(`Timeout after ${timeout / 1000}s`));
          }, timeout);
        });

        return await Promise.race([uploadPromise, timeoutPromise]);
      } catch (error: any) {
        lastError = error;
        console.warn(`⚠️ Attempt ${attempt} failed:`, error.message);
        
        if (attempt < maxRetries) {
          // Wait before retry (exponential backoff: 1s, 2s)
          const waitTime = attempt * 1000;
          console.log(`⏳ Retrying in ${waitTime / 1000}s...`);
          await new Promise(resolve => setTimeout(resolve, waitTime));
          onProgress?.(40); // Reset to 40% for retry
        }
      }
    }

    // All retries failed
    throw lastError;
  } catch (error: any) {
    console.error('❌ Upload failed after all retries:', error.message);
    onProgress?.(0);
    throw error;
  }
};

/**
 * Upload voice message (audio file)
 * @param audioBlob - Audio blob from recording
 * @param conversationId - Conversation ID for organization
 * @returns Public URL of uploaded voice message
 */
export const uploadVoiceMessage = async (audioBlob: Blob, conversationId: string): Promise<string> => {
  try {
    // Validate file size (max 10MB for voice messages)
    if (audioBlob.size > 10 * 1024 * 1024) {
      throw new Error('Voice message must be smaller than 10MB');
    }

    // Validate minimum file size to prevent corrupted uploads
    if (audioBlob.size < 1000) {
      throw new Error('Voice message is too short or corrupted');
    }

    // Determine file extension based on blob type with better detection
    const blobType = audioBlob.type || 'audio/webm';
    let fileExt = 'webm';

    console.log('Voice message blob type:', blobType, 'size:', audioBlob.size);

    if (blobType.includes('wav')) {
      fileExt = 'wav';
    } else if (blobType.includes('mp3')) {
      fileExt = 'mp3';
    } else if (blobType.includes('ogg')) {
      fileExt = 'ogg';
    } else if (blobType.includes('opus')) {
      fileExt = 'webm'; // Opus is typically in WebM container
    } else if (blobType.includes('webm')) {
      fileExt = 'webm';
    }

    const fileName = `voice_${Date.now()}.${fileExt}`;
    const filePath = `${conversationId}/${fileName}`; // Store in conversation's folder

    console.log('Uploading voice message:', { fileName, filePath, size: audioBlob.size, type: blobType });

    const { error: uploadError } = await supabase.storage
      .from('voicemail')
      .upload(filePath, audioBlob, {
        contentType: blobType,
        upsert: false // Don't overwrite existing files
      });

    if (uploadError) {
      console.error('Voice message upload error:', uploadError);
      throw new Error(`Upload failed: ${uploadError.message}`);
    }

    const { data } = supabase.storage
      .from('voicemail')
      .getPublicUrl(filePath);

    console.log('Voice message uploaded successfully:', data.publicUrl);
    return data.publicUrl;
  } catch (error) {
    console.error('Voice message upload error:', error);
    throw error;
  }
};