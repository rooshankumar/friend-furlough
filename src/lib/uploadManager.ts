import { supabase } from '@/integrations/supabase/client';

const CHUNK_SIZE = 1024 * 1024; // 1MB chunks
const MAX_RETRIES = 3;
const TIMEOUT_MS = 30000;

interface UploadOptions {
  onProgress?: (progress: number) => void;
  timeout?: number;
}

/**
 * Compress image with proper error handling
 */
export const compressImage = async (
  file: File,
  maxWidth: number = 1200,
  quality: number = 0.85
): Promise<File> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        let { width, height } = img;

        if (width > maxWidth) {
          height = (height * maxWidth) / width;
          width = maxWidth;
        }

        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        ctx?.drawImage(img, 0, 0, width, height);

        canvas.toBlob(
          (blob) => {
            if (blob) {
              resolve(new File([blob], file.name, { type: 'image/jpeg' }));
            } else {
              reject(new Error('Compression failed'));
            }
          },
          'image/jpeg',
          quality
        );
      };
      img.onerror = () => reject(new Error('Image load failed'));
      img.src = e.target?.result as string;
    };
    reader.onerror = () => reject(new Error('File read failed'));
    reader.readAsDataURL(file);
  });
};

/**
 * Upload with retry and timeout
 */
async function uploadWithRetry(
  bucket: string,
  path: string,
  file: File,
  options: { contentType: string; cacheControl: string },
  retries = MAX_RETRIES
): Promise<void> {
  for (let i = 0; i < retries; i++) {
    try {
      const { error } = await supabase.storage
        .from(bucket)
        .upload(path, file, options);

      if (!error) return;
      
      if (i === retries - 1) throw error;
      
      console.log(`⚠️ Upload failed, retrying (${i + 1}/${retries})...`);
      await new Promise(resolve => setTimeout(resolve, 1000 * (i + 1)));
    } catch (error) {
      if (i === retries - 1) throw error;
    }
  }
}

/**
 * Upload chat attachment with proper error handling
 */
export const uploadChatAttachment = async (
  conversationId: string,
  file: File,
  options: UploadOptions = {}
): Promise<string> => {
  const { onProgress, timeout = TIMEOUT_MS } = options;

  return new Promise(async (resolve, reject) => {
    const timeoutId = setTimeout(() => {
      reject(new Error('Upload timeout - please check your connection'));
    }, timeout);

    try {
      console.log('📤 Upload started:', file.name, `${(file.size / 1024 / 1024).toFixed(2)}MB`);
      onProgress?.(10);

      let fileToUpload = file;
      let contentType = file.type || 'application/octet-stream';
      let fileExt = file.name.split('.').pop() || 'file';

      // Compress images
      if (file.type.startsWith('image/')) {
        try {
          onProgress?.(20);
          console.log('🖼️ Compressing image...');
          fileToUpload = await compressImage(file, 1200, 0.85);
          contentType = 'image/jpeg';
          fileExt = 'jpg';
          console.log('✅ Compressed to:', `${(fileToUpload.size / 1024 / 1024).toFixed(2)}MB`);
          onProgress?.(40);
        } catch (err) {
          console.warn('⚠️ Compression failed, using original');
          fileToUpload = file;
        }
      }

      const fileName = `${Date.now()}-${Math.random().toString(36).substr(2, 9)}.${fileExt}`;
      const filePath = `${conversationId}/${fileName}`;

      console.log('📤 Uploading to:', filePath);
      onProgress?.(50);

      await uploadWithRetry('chat_attachments', filePath, fileToUpload, {
        contentType,
        cacheControl: '3600',
      });

      onProgress?.(90);

      const { data } = supabase.storage
        .from('chat_attachments')
        .getPublicUrl(filePath);

      onProgress?.(100);
      clearTimeout(timeoutId);
      
      console.log('✅ Upload complete:', data.publicUrl);
      resolve(data.publicUrl);
    } catch (error: any) {
      clearTimeout(timeoutId);
      console.error('❌ Upload failed:', error);
      reject(new Error(error.message || 'Upload failed'));
    }
  });
};

/**
 * Upload avatar with proper mobile handling
 */
export const uploadAvatar = async (
  userId: string,
  file: File,
  onProgress?: (progress: number) => void
): Promise<string> => {
  try {
    console.log('📸 Avatar upload:', file.name);
    onProgress?.(10);

    // Always compress avatars
    const compressed = await compressImage(file, 512, 0.9);
    onProgress?.(40);

    const fileExt = 'jpg';
    const fileName = `${userId}-${Date.now()}.${fileExt}`;
    const filePath = `${userId}/${fileName}`;

    console.log('📤 Uploading avatar to:', filePath);
    onProgress?.(60);

    await uploadWithRetry('avatars', filePath, compressed, {
      contentType: 'image/jpeg',
      cacheControl: '3600',
    });

    onProgress?.(90);

    const { data } = supabase.storage
      .from('avatars')
      .getPublicUrl(filePath);

    onProgress?.(100);
    console.log('✅ Avatar uploaded:', data.publicUrl);
    return data.publicUrl;
  } catch (error: any) {
    console.error('❌ Avatar upload failed:', error);
    throw new Error(error.message || 'Avatar upload failed');
  }
};
