
import { supabase } from '@/integrations/supabase/client';

interface ChunkUploadOptions {
  onProgress?: (progress: number) => void;
  chunkSize?: number;
  maxRetries?: number;
}

/**
 * Upload file in chunks for better reliability on mobile
 * Falls back to normal upload if chunking fails
 */
export const uploadFileInChunks = async (
  bucket: string,
  path: string,
  file: File,
  options: ChunkUploadOptions = {}
): Promise<string> => {
  const {
    onProgress,
    chunkSize = 512 * 1024, // 512KB chunks for mobile
    maxRetries = 3
  } = options;

  console.log('🔧 Starting chunk upload:', { bucket, path, size: file.size });

  // For small files, use direct upload
  if (file.size < chunkSize * 2) {
    console.log('📤 File small enough, using direct upload');
    return await directUpload(bucket, path, file, onProgress);
  }

  try {
    // Calculate chunks
    const totalChunks = Math.ceil(file.size / chunkSize);
    const chunks: Blob[] = [];
    
    for (let i = 0; i < totalChunks; i++) {
      const start = i * chunkSize;
      const end = Math.min(start + chunkSize, file.size);
      chunks.push(file.slice(start, end));
    }

    console.log(`📦 Split into ${totalChunks} chunks`);

    // Upload chunks sequentially with retry
    const uploadedChunks: string[] = [];
    
    for (let i = 0; i < chunks.length; i++) {
      const chunk = chunks[i];
      const chunkPath = `${path}_chunk_${i}`;
      
      let uploaded = false;
      let retries = 0;

      while (!uploaded && retries < maxRetries) {
        try {
          const { error } = await supabase.storage
            .from(bucket)
            .upload(chunkPath, chunk, {
              contentType: file.type,
              upsert: true
            });

          if (error) throw error;

          uploadedChunks.push(chunkPath);
          uploaded = true;

          const progress = ((i + 1) / chunks.length) * 80; // 0-80%
          onProgress?.(progress);
          
          console.log(`✅ Chunk ${i + 1}/${chunks.length} uploaded`);

        } catch (error) {
          retries++;
          console.warn(`⚠️ Chunk ${i} failed (retry ${retries}/${maxRetries}):`, error);
          
          if (retries >= maxRetries) {
            throw new Error(`Failed to upload chunk ${i} after ${maxRetries} retries`);
          }
          
          // Wait before retry (exponential backoff)
          await new Promise(resolve => setTimeout(resolve, 1000 * retries));
        }
      }
    }

    onProgress?.(90);

    // All chunks uploaded, now combine them (use Cloud Function or direct upload)
    // For now, fallback to direct upload of original file
    console.log('🔄 Chunks uploaded, uploading full file...');
    const publicUrl = await directUpload(bucket, path, file);

    // Clean up chunks
    onProgress?.(95);
    await cleanupChunks(bucket, uploadedChunks);

    onProgress?.(100);
    return publicUrl;

  } catch (error) {
    console.error('❌ Chunk upload failed, falling back to direct upload:', error);
    // Fallback to direct upload
    return await directUpload(bucket, path, file, onProgress);
  }
};

const directUpload = async (
  bucket: string,
  path: string,
  file: File,
  onProgress?: (progress: number) => void
): Promise<string> => {
  onProgress?.(50);

  const { error } = await supabase.storage
    .from(bucket)
    .upload(path, file, {
      contentType: file.type,
      upsert: true
    });

  if (error) throw error;

  onProgress?.(90);

  const { data } = supabase.storage
    .from(bucket)
    .getPublicUrl(path);

  onProgress?.(100);
  return data.publicUrl;
};

const cleanupChunks = async (bucket: string, chunkPaths: string[]): Promise<void> => {
  try {
    await supabase.storage
      .from(bucket)
      .remove(chunkPaths);
    console.log('🧹 Cleaned up chunks');
  } catch (error) {
    console.warn('⚠️ Failed to cleanup chunks:', error);
  }
};
