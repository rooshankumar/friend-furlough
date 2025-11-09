/**
 * Attachment Service - Robust file upload with Cloudinary + Supabase fallback
 * Uses the dedicated attachments table for metadata storage
 */

import { supabase } from '@/integrations/supabase/client';
import { uploadToCloudinary, uploadVideoToCloudinary, uploadFileToCloudinary, CloudinaryResponse } from './cloudinaryUpload';
import { uploadChatAttachment } from './uploadManager';
import { Capacitor } from '@capacitor/core';

const MAX_RETRIES = 3;
const RETRY_DELAY = 1000; // 1 second
const MOBILE_CHUNK_SIZE = 1024 * 1024; // 1MB chunks for mobile

export interface AttachmentMetadata {
  width?: number;
  height?: number;
  duration?: number;
  thumbnail_url?: string;
}

export interface AttachmentUploadResult {
  attachmentId: string;
  cloudinaryUrl: string;
  cloudinaryPublicId?: string;
  metadata: AttachmentMetadata;
}

/**
 * Extract metadata from image file
 */
async function extractImageMetadata(file: File): Promise<AttachmentMetadata> {
  return new Promise((resolve) => {
    const img = new Image();
    const url = URL.createObjectURL(file);
    
    img.onload = () => {
      URL.revokeObjectURL(url);
      resolve({
        width: img.naturalWidth,
        height: img.naturalHeight
      });
    };
    
    img.onerror = () => {
      URL.revokeObjectURL(url);
      resolve({});
    };
    
    img.src = url;
  });
}

/**
 * Extract metadata from video file
 */
async function extractVideoMetadata(file: File): Promise<AttachmentMetadata> {
  return new Promise((resolve) => {
    const video = document.createElement('video');
    const url = URL.createObjectURL(file);
    
    video.onloadedmetadata = () => {
      URL.revokeObjectURL(url);
      resolve({
        width: video.videoWidth,
        height: video.videoHeight,
        duration: Math.floor(video.duration)
      });
    };
    
    video.onerror = () => {
      URL.revokeObjectURL(url);
      resolve({});
    };
    
    video.src = url;
  });
}

/**
 * Upload with retry logic
 */
async function uploadWithRetry<T>(
  uploadFn: () => Promise<T>,
  retries = MAX_RETRIES
): Promise<T> {
  let lastError: Error | null = null;
  
  for (let attempt = 0; attempt < retries; attempt++) {
    try {
      return await uploadFn();
    } catch (error: any) {
      lastError = error;
      console.warn(`Upload attempt ${attempt + 1} failed:`, error.message);
      
      if (attempt < retries - 1) {
        // Wait before retry, with exponential backoff
        await new Promise(resolve => 
          setTimeout(resolve, RETRY_DELAY * Math.pow(2, attempt))
        );
      }
    }
  }
  
  throw lastError || new Error('Upload failed after retries');
}

/**
 * Check if network is available
 */
function isNetworkAvailable(): boolean {
  return navigator.onLine;
}

/**
 * Detect if on mobile platform
 */
function isMobile(): boolean {
  return Capacitor.isNativePlatform();
}

/**
 * Upload to Cloudinary with fallback to Supabase Storage
 */
async function uploadFileWithFallback(
  file: File,
  conversationId: string,
  onProgress?: (progress: number) => void
): Promise<{ url: string; publicId?: string; provider: 'cloudinary' | 'supabase'; cloudinaryData?: CloudinaryResponse }> {
  const isMobileDevice = isMobile();
  const fileType = file.type;
  
  // Try Cloudinary first (preferred for reliability and CDN)
  try {
    console.log(`📤 Uploading to Cloudinary (mobile: ${isMobileDevice})...`);
    
    let cloudinaryResponse: CloudinaryResponse;
    
    if (fileType.startsWith('image/')) {
      cloudinaryResponse = await uploadWithRetry(() => 
        uploadToCloudinary(file, onProgress)
      );
    } else if (fileType.startsWith('video/')) {
      cloudinaryResponse = await uploadWithRetry(() => 
        uploadVideoToCloudinary(file, onProgress)
      );
    } else {
      cloudinaryResponse = await uploadWithRetry(() => 
        uploadFileToCloudinary(file, onProgress)
      );
    }
    
    console.log('✅ Cloudinary upload successful');
    return { 
      url: cloudinaryResponse.secure_url, 
      publicId: cloudinaryResponse.public_id, // Use the full public_id from Cloudinary
      provider: 'cloudinary',
      cloudinaryData: cloudinaryResponse
    };
    
  } catch (cloudinaryError: any) {
    console.warn('⚠️ Cloudinary upload failed, falling back to Supabase:', cloudinaryError.message);
    
    // Fallback to Supabase Storage
    try {
      console.log('📤 Uploading to Supabase Storage...');
      const supabaseUrl = await uploadChatAttachment(conversationId, file, { onProgress });
      
      console.log('✅ Supabase upload successful (fallback)');
      return { url: supabaseUrl, provider: 'supabase' };
      
    } catch (supabaseError: any) {
      console.error('❌ Both Cloudinary and Supabase uploads failed');
      throw new Error(`Upload failed: ${cloudinaryError.message || supabaseError.message}`);
    }
  }
}

/**
 * Main attachment upload function
 * Uploads file and saves metadata to attachments table
 */
export async function uploadAttachment(
  file: File,
  conversationId: string,
  userId: string,
  messageId: string | null = null,
  onProgress?: (progress: number) => void
): Promise<AttachmentUploadResult> {
  // Check network availability
  if (!isNetworkAvailable()) {
    throw new Error('No network connection. Please check your internet and try again.');
  }
  
  console.log('📎 Starting attachment upload:', {
    fileName: file.name,
    fileSize: `${(file.size / 1024 / 1024).toFixed(2)}MB`,
    fileType: file.type,
    conversationId,
    messageId
  });
  
  try {
    // Extract metadata based on file type
    let metadata: AttachmentMetadata = {};
    
    onProgress?.(5);
    
    if (file.type.startsWith('image/')) {
      metadata = await extractImageMetadata(file);
      console.log('📐 Image metadata:', metadata);
    } else if (file.type.startsWith('video/')) {
      metadata = await extractVideoMetadata(file);
      console.log('🎬 Video metadata:', metadata);
    }
    
    onProgress?.(10);
    
    // Upload file with fallback
    const { url, publicId, provider, cloudinaryData } = await uploadFileWithFallback(
      file,
      conversationId,
      (uploadProgress) => {
        // Map upload progress to 10-90%
        const mappedProgress = 10 + (uploadProgress * 0.8);
        onProgress?.(mappedProgress);
      }
    );
    
    console.log(`✅ File uploaded via ${provider}:`, url);
    console.log('📋 Cloudinary public_id:', publicId);
    onProgress?.(90);
    
    // Use dimensions from Cloudinary response if available (more reliable than client-side extraction)
    const finalMetadata = {
      width: cloudinaryData?.width || metadata.width || null,
      height: cloudinaryData?.height || metadata.height || null,
      duration: metadata.duration || null,
      thumbnail_url: metadata.thumbnail_url || null
    };
    
    // Save to attachments table
    const { data: attachment, error } = await supabase
      .from('attachments')
      .insert({
        message_id: messageId,
        conversation_id: conversationId,
        user_id: userId,
        file_name: file.name,
        file_type: file.type,
        file_size: file.size,
        cloudinary_url: url,
        cloudinary_public_id: publicId || null,
        thumbnail_url: finalMetadata.thumbnail_url,
        width: finalMetadata.width,
        height: finalMetadata.height,
        duration: finalMetadata.duration
      })
      .select()
      .single();
    
    if (error) {
      console.error('❌ Failed to save attachment metadata:', error);
      throw new Error(`Failed to save attachment: ${error.message}`);
    }
    
    console.log('✅ Attachment metadata saved to database:', attachment.id);
    onProgress?.(100);
    
    return {
      attachmentId: attachment.id,
      cloudinaryUrl: url,
      cloudinaryPublicId: publicId,
      metadata
    };
    
  } catch (error: any) {
    console.error('❌ Attachment upload failed:', error);
    throw error;
  }
}

/**
 * Get attachments for a message
 */
export async function getMessageAttachments(messageId: string) {
  const { data, error } = await supabase
    .from('attachments')
    .select('*')
    .eq('message_id', messageId)
    .order('created_at', { ascending: true });
  
  if (error) {
    console.error('Failed to fetch attachments:', error);
    return [];
  }
  
  return data || [];
}

/**
 * Get attachments for a conversation
 */
export async function getConversationAttachments(conversationId: string) {
  const { data, error } = await supabase
    .from('attachments')
    .select('*')
    .eq('conversation_id', conversationId)
    .order('created_at', { ascending: false });
  
  if (error) {
    console.error('Failed to fetch conversation attachments:', error);
    return [];
  }
  
  return data || [];
}

/**
 * Delete attachment
 */
export async function deleteAttachment(attachmentId: string) {
  const { error } = await supabase
    .from('attachments')
    .delete()
    .eq('id', attachmentId);
  
  if (error) {
    console.error('Failed to delete attachment:', error);
    throw error;
  }
  
  console.log('✅ Attachment deleted:', attachmentId);
}
