/**
 * Cloudinary Upload Service
 * Fast, reliable image uploads for mobile with network monitoring
 */

import { Capacitor } from '@capacitor/core';

// Cloudinary credentials
const CLOUDINARY_CLOUD_NAME = import.meta.env.VITE_CLOUDINARY_CLOUD_NAME || 'dddpigwrp';
const CLOUDINARY_UPLOAD_PRESET = import.meta.env.VITE_CLOUDINARY_UPLOAD_PRESET || 'chat_uploads';

// Network monitoring
let isOnline = navigator.onLine;
window.addEventListener('online', () => { isOnline = true; });
window.addEventListener('offline', () => { isOnline = false; });

/**
 * Check network status with better mobile detection
 */
function checkNetwork(): void {
  if (!isOnline) {
    throw new Error('No internet connection. Please check your network and try again.');
  }
}

/**
 * Get appropriate timeout based on file size and platform
 */
function getTimeout(fileSize: number): number {
  const isMobile = Capacitor.isNativePlatform();
  const sizeMB = fileSize / (1024 * 1024);
  
  // Base timeout: 30s for mobile, 60s for desktop
  const baseTimeout = isMobile ? 30000 : 60000;
  
  // Add 10s per MB for large files
  const additionalTime = Math.floor(sizeMB) * 10000;
  
  return baseTimeout + additionalTime;
}

export interface CloudinaryResponse {
  secure_url: string;
  public_id: string;
  width?: number;
  height?: number;
  format: string;
  resource_type: string;
  bytes: number;
}

/**
 * Upload image to Cloudinary (unsigned upload)
 * Works on mobile without backend
 */
export const uploadToCloudinary = async (
  file: File,
  onProgress?: (progress: number) => void
): Promise<CloudinaryResponse> => {
  checkNetwork();
  
  onProgress?.(10);

  const formData = new FormData();
  formData.append('file', file);
  formData.append('upload_preset', CLOUDINARY_UPLOAD_PRESET);
  formData.append('cloud_name', CLOUDINARY_CLOUD_NAME);
  formData.append('folder', 'chat_attachments');
  
  onProgress?.(30);

  const url = `https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD_NAME}/image/upload`;
  const timeout = getTimeout(file.size);
  
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    let networkCheckInterval: NodeJS.Timeout;
    
    // Monitor network during upload
    networkCheckInterval = setInterval(() => {
      if (!isOnline) {
        xhr.abort();
        clearInterval(networkCheckInterval);
        reject(new Error('Network connection lost during upload'));
      }
    }, 2000);
    
    xhr.upload.addEventListener('progress', (e) => {
      if (e.lengthComputable) {
        const percentComplete = Math.round((e.loaded / e.total) * 100);
        onProgress?.(percentComplete);
      }
    });
    
    xhr.addEventListener('load', () => {
      clearInterval(networkCheckInterval);
      
      if (xhr.status === 200) {
        try {
          const response = JSON.parse(xhr.responseText);
          onProgress?.(100);
          // Return full response object with public_id and secure_url
          resolve(response);
        } catch (e) {
          reject(new Error('Invalid response from server'));
        }
      } else if (xhr.status === 413) {
        reject(new Error('File too large for upload'));
      } else if (xhr.status >= 500) {
        reject(new Error('Server error. Please try again.'));
      } else {
        reject(new Error(`Upload failed with status ${xhr.status}`));
      }
    });
    
    xhr.addEventListener('error', () => {
      clearInterval(networkCheckInterval);
      reject(new Error(isOnline ? 'Network error during upload' : 'No internet connection'));
    });
    
    xhr.addEventListener('timeout', () => {
      clearInterval(networkCheckInterval);
      reject(new Error('Upload timeout - file may be too large or connection too slow'));
    });
    
    xhr.addEventListener('abort', () => {
      clearInterval(networkCheckInterval);
      reject(new Error('Upload cancelled'));
    });
    
    xhr.timeout = timeout;
    xhr.open('POST', url);
    xhr.send(formData);
  });
};

/**
 * Upload video to Cloudinary
 */
export const uploadVideoToCloudinary = async (
  file: File,
  onProgress?: (progress: number) => void
): Promise<CloudinaryResponse> => {
  checkNetwork();
  
  const formData = new FormData();
  formData.append('file', file);
  formData.append('upload_preset', CLOUDINARY_UPLOAD_PRESET);
  formData.append('cloud_name', CLOUDINARY_CLOUD_NAME);
  formData.append('folder', 'chat_videos');
  formData.append('resource_type', 'video');
  
  const url = `https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD_NAME}/video/upload`;
  const timeout = Math.max(120000, getTimeout(file.size));
  
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    let networkCheckInterval: NodeJS.Timeout;
    
    networkCheckInterval = setInterval(() => {
      if (!isOnline) {
        xhr.abort();
        clearInterval(networkCheckInterval);
        reject(new Error('Network connection lost during upload'));
      }
    }, 2000);
    
    xhr.upload.addEventListener('progress', (e) => {
      if (e.lengthComputable) {
        onProgress?.(Math.round((e.loaded / e.total) * 100));
      }
    });
    
    xhr.addEventListener('load', () => {
      clearInterval(networkCheckInterval);
      
      if (xhr.status === 200) {
        try {
          resolve(JSON.parse(xhr.responseText));
        } catch (e) {
          reject(new Error('Invalid response from server'));
        }
      } else {
        reject(new Error(`Video upload failed with status ${xhr.status}`));
      }
    });
    
    xhr.addEventListener('error', () => {
      clearInterval(networkCheckInterval);
      reject(new Error(isOnline ? 'Network error during upload' : 'No internet connection'));
    });
    
    xhr.addEventListener('timeout', () => {
      clearInterval(networkCheckInterval);
      reject(new Error('Video upload timeout - file may be too large'));
    });
    
    xhr.timeout = timeout;
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
): Promise<CloudinaryResponse> => {
  checkNetwork();
  
  const formData = new FormData();
  formData.append('file', file);
  formData.append('upload_preset', CLOUDINARY_UPLOAD_PRESET);
  formData.append('cloud_name', CLOUDINARY_CLOUD_NAME);
  formData.append('folder', 'chat_files');
  formData.append('resource_type', 'raw');
  
  const url = `https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD_NAME}/raw/upload`;
  const timeout = getTimeout(file.size);
  
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    let networkCheckInterval: NodeJS.Timeout;
    
    networkCheckInterval = setInterval(() => {
      if (!isOnline) {
        xhr.abort();
        clearInterval(networkCheckInterval);
        reject(new Error('Network connection lost during upload'));
      }
    }, 2000);
    
    xhr.upload.addEventListener('progress', (e) => {
      if (e.lengthComputable) {
        onProgress?.(Math.round((e.loaded / e.total) * 100));
      }
    });
    
    xhr.addEventListener('load', () => {
      clearInterval(networkCheckInterval);
      
      if (xhr.status === 200) {
        try {
          resolve(JSON.parse(xhr.responseText));
        } catch (e) {
          reject(new Error('Invalid response from server'));
        }
      } else {
        reject(new Error(`File upload failed with status ${xhr.status}`));
      }
    });
    
    xhr.addEventListener('error', () => {
      clearInterval(networkCheckInterval);
      reject(new Error(isOnline ? 'Network error during upload' : 'No internet connection'));
    });
    
    xhr.addEventListener('timeout', () => {
      clearInterval(networkCheckInterval);
      reject(new Error('File upload timeout'));
    });
    
    xhr.timeout = timeout;
    xhr.open('POST', url);
    xhr.send(formData);
  });
};

/**
 * Upload community post image to Cloudinary
 */
export const uploadCommunityPostToCloudinary = async (
  file: File,
  onProgress?: (progress: number) => void
): Promise<string> => {
  const formData = new FormData();
  formData.append('file', file);
  formData.append('upload_preset', 'community_posts');
  formData.append('cloud_name', CLOUDINARY_CLOUD_NAME);
  formData.append('folder', 'community_posts');
  
  const url = `https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD_NAME}/image/upload`;
  
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    
    xhr.upload.addEventListener('progress', (e) => {
      if (e.lengthComputable) {
        onProgress?.(Math.round((e.loaded / e.total) * 100));
      }
    });
    
    xhr.addEventListener('load', () => {
      if (xhr.status === 200) {
        resolve(JSON.parse(xhr.responseText).secure_url);
      } else {
        reject(new Error(`Upload failed: ${xhr.status}`));
      }
    });
    
    xhr.addEventListener('error', () => reject(new Error('Network error')));
    xhr.addEventListener('timeout', () => reject(new Error('Upload timeout')));
    
    xhr.timeout = 90000;
    xhr.open('POST', url);
    xhr.send(formData);
  });
};

/**
 * Upload user avatar to Cloudinary
 */
export const uploadAvatarToCloudinary = async (
  file: File,
  onProgress?: (progress: number) => void
): Promise<string> => {
  const formData = new FormData();
  formData.append('file', file);
  formData.append('upload_preset', 'avatars');
  formData.append('cloud_name', CLOUDINARY_CLOUD_NAME);
  formData.append('folder', 'users_avatars');
  
  const url = `https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD_NAME}/image/upload`;
  
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    
    xhr.upload.addEventListener('progress', (e) => {
      if (e.lengthComputable) {
        onProgress?.(Math.round((e.loaded / e.total) * 100));
      }
    });
    
    xhr.addEventListener('load', () => {
      if (xhr.status === 200) {
        resolve(JSON.parse(xhr.responseText).secure_url);
      } else {
        reject(new Error(`Upload failed: ${xhr.status}`));
      }
    });
    
    xhr.addEventListener('error', () => reject(new Error('Network error')));
    xhr.addEventListener('timeout', () => reject(new Error('Upload timeout')));
    
    xhr.timeout = 60000;
    xhr.open('POST', url);
    xhr.send(formData);
  });
};
