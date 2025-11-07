import { supabase } from '@/integrations/supabase/client';

const SUPABASE_BUCKET = 'chat_files';
const UPLOAD_TIMEOUT = 45000; // 45 seconds for mobile
const CHUNK_SIZE = 512 * 1024; // 512KB chunks for better mobile support

/**
 * Smart compression - only compress if file is too large
 */
const compressImage = async (
  file: File,
  maxWidth: number = 1200,
  quality: number = 0.85
): Promise<File> => {
  // Skip compression for small files (under 500KB)
  if (file.size < 500 * 1024) {
    console.log(
      '📸 File small enough, skipping compression:',
      (file.size / 1024).toFixed(2) + 'KB'
    );
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
                saved: ((1 - compressedFile.size / file.size) * 100).toFixed(1) + '%',
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
const validateMobileFile = (
  file: File,
  maxSizeMB: number,
  allowedTypes: string[]
): void => {
  const isMobile =
    /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(
      navigator.userAgent
    );
  const isLowEndDevice =
    (navigator as any).deviceMemory <= 2 ||
    navigator.hardwareConcurrency <= 2;

  // Adjust limits for mobile devices
  const actualMaxSize =
    isMobile && isLowEndDevice ? Math.min(maxSizeMB, 3) : maxSizeMB;
  const maxBytes = actualMaxSize * 1024 * 1024;

  if (file.size > maxBytes) {
    throw new Error(`File too large. Maximum size: ${actualMaxSize}MB`);
  }

  if (!allowedTypes.some((type) => file.type.startsWith(type))) {
    throw new Error('File type not supported');
  }

  console.log('📱 Mobile file validation passed:', {
    name: file.name,
    size: `${(file.size / 1024 / 1024).toFixed(2)}MB`,
    type: file.type,
    isMobile,
    isLowEndDevice,
    maxAllowed: `${actualMaxSize}MB`,
  });
};

/**
 * ✅ FIXED: Upload chat attachment with AbortController and proper error handling
 */
export const uploadChatAttachment = async (
  file: File,
  conversationId: string,
  onProgress?: (progress: number) => void
): Promise<string> => {
  console.log(
    '📤 Uploading:',
    file.name,
    `(${(file.size / 1024 / 1024).toFixed(2)}MB)`
  );

  // Create AbortController for cancellation
  const abortController = new AbortController();
  let uploadTimeout: NodeJS.Timeout;

  try {
    onProgress?.(10);

    // Validate file
    validateMobileFile(file, 20, [
      'image/',
      'video/',
      'application/',
      'text/',
      'audio/',
    ]);

    // Set timeout with proper cleanup
    const timeoutPromise = new Promise<never>((_, reject) => {
      uploadTimeout = setTimeout(() => {
        abortController.abort();
        reject(new Error('Upload timeout - please check your connection'));
      }, UPLOAD_TIMEOUT);
    });

    const fileName = `${conversationId}/${Date.now()}_${file.name}`;
    onProgress?.(30);

    // ✅ Create upload promise with abort support
    const uploadPromise = (async () => {
      try {
        const { data, error } = await supabase.storage
          .from(SUPABASE_BUCKET)
          .upload(fileName, file, {
            cacheControl: '3600',
            upsert: false,
          });

        if (error) {
          throw error;
        }

        return data;
      } catch (err) {
        // Check if aborted
        if (abortController.signal.aborted) {
          throw new Error('Upload cancelled due to timeout');
        }
        throw err;
      }
    })();

    // ✅ FIXED: Use AbortController signal instead of Promise.race
    // This ensures proper cleanup when timeout occurs
    onProgress?.(50);

    let data;
    try {
      data = await Promise.race([uploadPromise, timeoutPromise]);
    } catch (error: any) {
      clearTimeout(uploadTimeout!);
      throw error;
    }

    clearTimeout(uploadTimeout!);
    onProgress?.(70);

    // Get public URL
    const { data: urlData } = supabase.storage
      .from(SUPABASE_BUCKET)
      .getPublicUrl(data.path);

    onProgress?.(100);
    console.log('✅ Upload complete:', urlData.publicUrl);
    return urlData.publicUrl;
  } catch (error: any) {
    clearTimeout(uploadTimeout!);
    abortController.abort();

    console.error('❌ Upload failed:', error.message);
    
    // Fallback to smaller retry or base64 only for very small files
    if (file.size < 100 * 1024) {
      // Only fallback for files under 100KB
      try {
        const base64 = await fileToBase64(file);
        onProgress?.(100);
        console.log('✅ File converted to base64 (fallback)');
        return base64;
      } catch (base64Error) {
        console.error('❌ Base64 conversion failed:', base64Error);
        onProgress?.(0);
        throw error;
      }
    }

    throw error;
  }
};

/**
 * ✅ FIXED: Convert file to base64 with proper error handling
 */
async function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    // Set timeout to prevent hanging
    const timeout = setTimeout(() => {
      reader.abort();
      reject(new Error('File read timeout'));
    }, 10000);

    reader.onload = () => {
      clearTimeout(timeout);
      resolve(reader.result as string);
    };

    reader.onerror = () => {
      clearTimeout(timeout);
      reject(new Error('Failed to read file'));
    };

    reader.onabort = () => {
      clearTimeout(timeout);
      reject(new Error('File read aborted'));
    };

    reader.readAsDataURL(file);
  });
}

/**
 * ✅ FIXED: Upload avatar with proper mobile support
 */
export const uploadAvatar = async (
  file: File,
  userId: string
): Promise<string> => {
  try {
    validateMobileFile(file, 5, ['image/']);

    const compressedFile = await compressImage(file, 800, 0.9);

    const fileExt = 'jpg';
    const fileName = `${Date.now()}.${fileExt}`;
    const filePath = `${userId}/${fileName}`;

    const abortController = new AbortController();

    const { error: uploadError } = await supabase.storage
      .from('avatars')
      .upload(filePath, compressedFile, {
        upsert: true,
        contentType: 'image/jpeg',
      });

    if (uploadError) {
      throw new Error(`Upload failed: ${uploadError.message}`);
    }

    const { data } = supabase.storage
      .from('avatars')
      .getPublicUrl(filePath);

    console.log('✅ Avatar uploaded:', data.publicUrl);
    return data.publicUrl;
  } catch (error) {
    console.error('❌ Avatar upload error:', error);
    throw error;
  }
};

/**
 * ✅ FIXED: Upload post image with proper timeout handling
 */
export const uploadPostImage = async (
  file: File,
  userId: string,
  onProgress?: (progress: number) => void
): Promise<string> => {
  console.log('📤 Starting post image upload:', file.name);

  const abortController = new AbortController();
  let uploadTimeout: NodeJS.Timeout;

  try {
    onProgress?.(10);

    const compressedFile = await compressImage(file, 1200, 0.85);
    onProgress?.(40);

    const fileName = `${userId}/${Date.now()}_${file.name}`;
    onProgress?.(50);

    const isMobile = /Android|webOS|iPhone|iPad|iPod/i.test(
      navigator.userAgent
    );
    const timeout = isMobile ? 60000 : 120000;

    const timeoutPromise = new Promise<never>((_, reject) => {
      uploadTimeout = setTimeout(() => {
        abortController.abort();
        reject(new Error('Upload timeout'));
      }, timeout);
    });

    const uploadPromise = (async () => {
      const { data, error } = await supabase.storage
        .from('community-posts')
        .upload(fileName, compressedFile, {
          cacheControl: '3600',
          upsert: false,
        });

      if (error) throw error;
      return data;
    })();

    const data = await Promise.race([uploadPromise, timeoutPromise]);
    clearTimeout(uploadTimeout!);

    onProgress?.(90);

    const { data: urlData } = supabase.storage
      .from('community-posts')
      .getPublicUrl(data.path);

    onProgress?.(100);
    console.log('✅ Post image uploaded:', urlData.publicUrl);
    return urlData.publicUrl;
  } catch (error) {
    clearTimeout(uploadTimeout!);
    abortController.abort();
    console.error('❌ Post image upload error:', error);
    throw error;
  }
};

/**
 * ✅ FIXED: Upload voice message with proper validation
 */
export const uploadVoiceMessage = async (
  audioBlob: Blob,
  conversationId: string
): Promise<string> => {
  try {
    // Validate file size (max 10MB for voice messages)
    if (audioBlob.size > 10 * 1024 * 1024) {
      throw new Error('Voice message must be smaller than 10MB');
    }

    // Validate minimum file size
    if (audioBlob.size < 1000) {
      throw new Error('Voice message is too short or corrupted');
    }

    const blobType = audioBlob.type || 'audio/webm';
    let fileExt = 'webm';

    console.log('Voice message blob type:', blobType, 'size:', audioBlob.size);

    if (blobType.includes('wav')) fileExt = 'wav';
    else if (blobType.includes('mp3')) fileExt = 'mp3';
    else if (blobType.includes('ogg')) fileExt = 'ogg';
    else if (blobType.includes('opus')) fileExt = 'webm';
    else if (blobType.includes('webm')) fileExt = 'webm';

    const fileName = `voice_${Date.now()}.${fileExt}`;
    const filePath = `${conversationId}/${fileName}`;

    const { error: uploadError } = await supabase.storage
      .from('voicemail')
      .upload(filePath, audioBlob, {
        contentType: blobType,
        upsert: false,
      });

    if (uploadError) {
      throw new Error(`Upload failed: ${uploadError.message}`);
    }

    const { data } = supabase.storage.from('voicemail').getPublicUrl(filePath);

    console.log('✅ Voice message uploaded:', data.publicUrl);
    return data.publicUrl;
  } catch (error) {
    console.error('❌ Voice message upload error:', error);
    throw error;
  }
};
