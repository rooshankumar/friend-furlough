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
 * Upload post image with mobile optimization
 * @param file - Image file to upload
 * @param userId - User ID for file naming
 * @returns Public URL of uploaded image
 */
export const uploadPostImage = async (file: File, userId: string): Promise<string> => {
  try {
    // Mobile-optimized validation
    validateMobileFile(file, 10, ['image/']);
    
    // Smart compression for posts (balance quality/size, 1200px max)
    const compressedFile = await compressImage(file, 1200, 0.85);
    
    const fileExt = 'jpg';
    const fileName = `${Date.now()}.${fileExt}`;
    const filePath = `${userId}/${fileName}`;

    const { error: uploadError } = await supabase.storage
      .from('post_pic')
      .upload(filePath, compressedFile, { 
        upsert: true,
        contentType: 'image/jpeg'
      });

    if (uploadError) {
      console.error('Post image upload error:', uploadError);
      throw new Error(`Upload failed: ${uploadError.message}`);
    }

    const { data } = supabase.storage
      .from('post_pic')
      .getPublicUrl(filePath);

    console.log('✅ Post image uploaded:', data.publicUrl);
    return data.publicUrl;
  } catch (error) {
    console.error('Post image upload error:', error);
    throw error;
  }
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
  try {
    const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
    const isLowEndDevice = (navigator as any).deviceMemory <= 2 || navigator.hardwareConcurrency <= 2;
    
    const maxSizeMB = isMobile && isLowEndDevice ? 10 : 20;
    const maxBytes = maxSizeMB * 1024 * 1024;
    
    if (file.size > maxBytes) {
      throw new Error(`File too large. Maximum size: ${maxSizeMB}MB`);
    }
    
    onProgress?.(10);
    
    let fileToUpload = file;
    let contentType = file.type;
    let fileExt = file.name.split('.').pop() || 'file';
    
    // Smart compression for images only
    if (file.type.startsWith('image/')) {
      try {
        onProgress?.(20);
        fileToUpload = await compressImage(file, 1200, 0.85);
        contentType = 'image/jpeg';
        fileExt = 'jpg';
        onProgress?.(40);
      } catch (err) {
        console.warn('Compression failed, using original:', err);
        fileToUpload = file;
        onProgress?.(40);
      }
    } else {
      onProgress?.(40);
    }
    
    const fileName = `${Date.now()}.${fileExt}`;
    const filePath = `${conversationId}/${fileName}`;

    onProgress?.(50);
    
    const { error: uploadError } = await supabase.storage
      .from('chat_attachments')
      .upload(filePath, fileToUpload, {
        contentType,
        cacheControl: '3600'
      });

    if (uploadError) {
      console.error('Chat attachment upload error:', uploadError);
      throw new Error(`Upload failed: ${uploadError.message}`);
    }

    onProgress?.(90);

    const { data } = supabase.storage
      .from('chat_attachments')
      .getPublicUrl(filePath);

    onProgress?.(100);
    
    console.log('✅ Chat attachment uploaded:', data.publicUrl);
    return data.publicUrl;
  } catch (error) {
    console.error('Chat attachment upload error:', error);
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
