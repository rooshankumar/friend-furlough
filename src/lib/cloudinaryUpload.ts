/**
 * Cloudinary Upload Service
 * Fast, reliable image uploads for mobile
 */

// Cloudinary credentials
const CLOUDINARY_CLOUD_NAME = import.meta.env.VITE_CLOUDINARY_CLOUD_NAME || 'dddpigwrp';
const CLOUDINARY_UPLOAD_PRESET = import.meta.env.VITE_CLOUDINARY_UPLOAD_PRESET || 'chat_uploads';

/**
 * Upload image to Cloudinary (unsigned upload)
 * Works on mobile without backend
 */
export const uploadToCloudinary = async (
  file: File,
  onProgress?: (progress: number) => void
): Promise<string> => {
  console.log('☁️ Uploading to Cloudinary:', file.name, `(${(file.size / 1024 / 1024).toFixed(2)}MB)`);
  
  try {
    onProgress?.(10);

    // Create form data
    const formData = new FormData();
    formData.append('file', file);
    formData.append('upload_preset', CLOUDINARY_UPLOAD_PRESET);
    formData.append('cloud_name', CLOUDINARY_CLOUD_NAME);
    
    // Optional: Add folder organization
    formData.append('folder', 'chat_attachments');
    
    onProgress?.(30);

    // Upload with XMLHttpRequest for progress tracking
    const url = `https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD_NAME}/image/upload`;
    
    return new Promise((resolve, reject) => {
      const xhr = new XMLHttpRequest();
      
      // Track upload progress
      xhr.upload.addEventListener('progress', (e) => {
        if (e.lengthComputable) {
          const percentComplete = Math.round((e.loaded / e.total) * 100);
          onProgress?.(percentComplete);
          console.log(`☁️ Upload progress: ${percentComplete}%`);
        }
      });
      
      // Handle completion
      xhr.addEventListener('load', () => {
        if (xhr.status === 200) {
          const response = JSON.parse(xhr.responseText);
          console.log('✅ Cloudinary upload complete:', response.secure_url);
          onProgress?.(100);
          resolve(response.secure_url);
        } else {
          console.error('❌ Cloudinary upload failed:', xhr.status, xhr.responseText);
          reject(new Error(`Upload failed: ${xhr.status}`));
        }
      });
      
      // Handle errors
      xhr.addEventListener('error', () => {
        console.error('❌ Cloudinary network error');
        reject(new Error('Network error during upload'));
      });
      
      // Handle timeout
      xhr.addEventListener('timeout', () => {
        console.error('❌ Cloudinary upload timeout');
        reject(new Error('Upload timeout'));
      });
      
      // Set timeout (60 seconds for mobile)
      xhr.timeout = 60000;
      
      // Send request
      xhr.open('POST', url);
      xhr.send(formData);
    });
    
  } catch (error: any) {
    console.error('❌ Cloudinary upload error:', error);
    throw error;
  }
};

/**
 * Upload video to Cloudinary
 */
export const uploadVideoToCloudinary = async (
  file: File,
  onProgress?: (progress: number) => void
): Promise<string> => {
  console.log('🎥 Uploading video to Cloudinary:', file.name);
  
  const formData = new FormData();
  formData.append('file', file);
  formData.append('upload_preset', CLOUDINARY_UPLOAD_PRESET);
  formData.append('cloud_name', CLOUDINARY_CLOUD_NAME);
  formData.append('folder', 'chat_videos');
  formData.append('resource_type', 'video');
  
  const url = `https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD_NAME}/video/upload`;
  
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    
    xhr.upload.addEventListener('progress', (e) => {
      if (e.lengthComputable) {
        const percentComplete = Math.round((e.loaded / e.total) * 100);
        onProgress?.(percentComplete);
      }
    });
    
    xhr.addEventListener('load', () => {
      if (xhr.status === 200) {
        const response = JSON.parse(xhr.responseText);
        console.log('✅ Video upload complete:', response.secure_url);
        resolve(response.secure_url);
      } else {
        reject(new Error(`Video upload failed: ${xhr.status}`));
      }
    });
    
    xhr.addEventListener('error', () => reject(new Error('Network error')));
    xhr.addEventListener('timeout', () => reject(new Error('Upload timeout')));
    
    xhr.timeout = 120000; // 2 minutes for videos
    xhr.open('POST', url);
    xhr.send(formData);
  });
};

/**
 * Upload any file to Cloudinary (as raw)
 */
export const uploadFileToCloudinary = async (
  file: File,
  onProgress?: (progress: number) => void
): Promise<string> => {
  console.log('📎 Uploading file to Cloudinary:', file.name);
  
  const formData = new FormData();
  formData.append('file', file);
  formData.append('upload_preset', CLOUDINARY_UPLOAD_PRESET);
  formData.append('cloud_name', CLOUDINARY_CLOUD_NAME);
  formData.append('folder', 'chat_files');
  formData.append('resource_type', 'raw');
  
  const url = `https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD_NAME}/raw/upload`;
  
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    
    xhr.upload.addEventListener('progress', (e) => {
      if (e.lengthComputable) {
        const percentComplete = Math.round((e.loaded / e.total) * 100);
        onProgress?.(percentComplete);
      }
    });
    
    xhr.addEventListener('load', () => {
      if (xhr.status === 200) {
        const response = JSON.parse(xhr.responseText);
        console.log('✅ File upload complete:', response.secure_url);
        resolve(response.secure_url);
      } else {
        reject(new Error(`File upload failed: ${xhr.status}`));
      }
    });
    
    xhr.addEventListener('error', () => reject(new Error('Network error')));
    xhr.addEventListener('timeout', () => reject(new Error('Upload timeout')));
    
    xhr.timeout = 90000; // 90 seconds for files
    xhr.open('POST', url);
    xhr.send(formData);
  });
};
