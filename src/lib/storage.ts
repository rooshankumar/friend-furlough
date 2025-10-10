import { supabase } from '@/integrations/supabase/client';

/**
 * Compress and resize image before upload
 * Returns a compressed File object
 */
const compressImage = async (file: File, maxWidth: number = 800, quality: number = 0.8): Promise<File> => {
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
              const compressedFile = new File([blob], file.name, {
                type: 'image/jpeg',
                lastModified: Date.now(),
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
 * Upload avatar image with compression
 * @param file - Image file to upload
 * @param userId - User ID for file naming
 * @returns Public URL of uploaded avatar
 */
export const uploadAvatar = async (file: File, userId: string): Promise<string> => {
  try {
    // Validate file type
    if (!file.type.startsWith('image/')) {
      throw new Error('File must be an image');
    }
    
    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      throw new Error('Image must be smaller than 5MB');
    }
    
    // Skip compression - use original file
    const compressedFile = file;
    
    const fileExt = file.name.split('.').pop() || 'jpg';
    const fileName = `${Date.now()}.${fileExt}`;
    const filePath = `${userId}/${fileName}`; // Store in user's folder

    const { error: uploadError } = await supabase.storage
      .from('avatars')
      .upload(filePath, compressedFile, { 
        upsert: true,
        contentType: file.type
      });

    if (uploadError) {
      console.error('Avatar upload error:', uploadError);
      throw new Error(`Upload failed: ${uploadError.message}`);
    }

    const { data } = supabase.storage
      .from('avatars')
      .getPublicUrl(filePath);

    return data.publicUrl;
  } catch (error) {
    console.error('Avatar upload error:', error);
    throw error;
  }
};

/**
 * Upload post image with compression
 * @param file - Image file to upload
 * @param userId - User ID for file naming
 * @returns Public URL of uploaded image
 */
export const uploadPostImage = async (file: File, userId: string): Promise<string> => {
  try {
    // Validate file type
    if (!file.type.startsWith('image/')) {
      throw new Error('File must be an image');
    }
    
    // Validate file size (max 10MB for posts)
    if (file.size > 10 * 1024 * 1024) {
      throw new Error('Image must be smaller than 10MB');
    }
    
    // Skip compression - use original file
    const compressedFile = file;
    
    const fileExt = file.name.split('.').pop() || 'jpg';
    const fileName = `${Date.now()}.${fileExt}`;
    const filePath = `${userId}/${fileName}`; // Store in user's folder

    const { error: uploadError } = await supabase.storage
      .from('post_pic')
      .upload(filePath, compressedFile, { 
        upsert: true,
        contentType: file.type
      });

    if (uploadError) {
      console.error('Post image upload error:', uploadError);
      throw new Error(`Upload failed: ${uploadError.message}`);
    }

    const { data } = supabase.storage
      .from('post_pic')
      .getPublicUrl(filePath);

    return data.publicUrl;
  } catch (error) {
    console.error('Post image upload error:', error);
    throw error;
  }
};

/**
 * Upload chat attachment (image or file)
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
    // Validate file size (max 20MB for attachments)
    if (file.size > 20 * 1024 * 1024) {
      throw new Error('File must be smaller than 20MB');
    }
    
    let fileToUpload = file;
    let contentType = file.type;
    
    // Skip compression - use original file for all types
    onProgress?.(20); // Skipping compression
    fileToUpload = file;
    contentType = file.type;
    
    const fileExt = file.name.split('.').pop();
    const fileName = `${Date.now()}.${fileExt}`;
    const filePath = `${conversationId}/${fileName}`; // Store in conversation's folder

    onProgress?.(50); // Starting upload
    
    const { error: uploadError } = await supabase.storage
      .from('chat_attachments')
      .upload(filePath, fileToUpload, {
        contentType
      });

    if (uploadError) {
      console.error('Chat attachment upload error:', uploadError);
      throw new Error(`Upload failed: ${uploadError.message}`);
    }

    onProgress?.(90); // Upload complete

    const { data } = supabase.storage
      .from('chat_attachments')
      .getPublicUrl(filePath);

    onProgress?.(100); // Done

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
