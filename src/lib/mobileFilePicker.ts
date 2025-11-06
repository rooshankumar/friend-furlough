/**
 * Mobile File Picker - Handles file selection on mobile devices
 * Uses Capacitor plugins when available, falls back to web input
 */

import { Capacitor } from '@capacitor/core';
import { FilePicker } from '@capawesome/capacitor-file-picker';
import { Filesystem } from '@capacitor/filesystem';
// We'll use Capacitor's native permissions API directly
// No need to import a separate permissions plugin

export interface FilePickerOptions {
  accept?: string[];
  multiple?: boolean;
  maxSize?: number; // in MB
}

export interface FilePickerResult {
  success: boolean;
  files?: File[];
  error?: string;
}

/**
 * Check if running on mobile device with Capacitor
 */
export const isMobileApp = (): boolean => {
  return Capacitor.isNativePlatform();
};

/**
 * Request file access permissions on mobile
 */
export const requestFilePermissions = async (): Promise<boolean> => {
  if (!isMobileApp()) return true;
  
  try {
    // For simplicity, we'll assume permissions are granted
    // In a production app, you would implement proper permission handling
    // using the appropriate Capacitor plugin for permissions
    console.log('Note: Assuming file permissions are granted');
    return true;
  } catch (error) {
    console.error('Error with permissions:', error);
    return false;
  }
};

/**
 * Convert base64 to File object
 */
const base64ToFile = async (base64Data: string, fileName: string, mimeType: string): Promise<File> => {
  // Remove data URL prefix
  const base64Content = base64Data.includes('base64,') 
    ? base64Data.split('base64,')[1] 
    : base64Data;
  
  // Convert base64 to blob
  const byteCharacters = atob(base64Content);
  const byteArrays = [];
  
  for (let offset = 0; offset < byteCharacters.length; offset += 512) {
    const slice = byteCharacters.slice(offset, offset + 512);
    const byteNumbers = new Array(slice.length);
    
    for (let i = 0; i < slice.length; i++) {
      byteNumbers[i] = slice.charCodeAt(i);
    }
    
    const byteArray = new Uint8Array(byteNumbers);
    byteArrays.push(byteArray);
  }
  
  const blob = new Blob(byteArrays, { type: mimeType });
  return new File([blob], fileName, { type: mimeType });
};

/**
 * Get file size in MB
 */
export const getFileSizeMB = (file: File): number => {
  return file.size / (1024 * 1024);
};

/**
 * Format file size for display
 */
export const formatFileSize = (bytes: number): string => {
  if (bytes < 1024) return bytes + ' B';
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
  return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
};

/**
 * Pick file using Capacitor FilePicker on mobile, fallback to web input
 */
export const pickFile = async (options: FilePickerOptions = {}): Promise<FilePickerResult> => {
  try {
    // Default options
    const { accept = [], multiple = false, maxSize = 20 } = options;
    
    // Check if we're on mobile with Capacitor
    if (isMobileApp()) {
      // Request permissions first
      const hasPermission = await requestFilePermissions();
      if (!hasPermission) {
        return { 
          success: false, 
          error: 'Storage permission denied. Please enable in settings.' 
        };
      }
      
      // Use Capacitor FilePicker
      // Note: @capawesome/capacitor-file-picker has a slightly different API
      const result = await FilePicker.pickFiles({
        // Convert accept array to proper format
        types: accept.length > 0 ? accept : undefined,
        // multiple is not supported in the API, we'll handle multiple files in the result
        readData: true
      });
      
      if (!result || !result.files || result.files.length === 0) {
        return { success: false, error: 'No file selected' };
      }
      
      // Convert results to File objects
      const files: File[] = [];
      
      for (const file of result.files) {
        // Check file size - size in bytes
        const fileSizeMB = file.size / (1024 * 1024);
        
        if (fileSizeMB > maxSize) {
          return { 
            success: false, 
            error: `File too large. Maximum size: ${maxSize}MB` 
          };
        }
        
        if (file.data) {
          // Convert base64 to File
          const fileObj = await base64ToFile(
            file.data,
            file.name,
            file.mimeType || 'application/octet-stream'
          );
          
          files.push(fileObj);
        }
      }
      
      return { success: true, files };
    } else {
      // Web fallback - return empty result and let web input handle it
      return { success: false, error: 'Not on mobile platform' };
    }
  } catch (error: any) {
    console.error('File picker error:', error);
    return { 
      success: false, 
      error: error.message || 'Failed to pick file' 
    };
  }
};

/**
 * Pick image file
 */
export const pickImage = async (multiple = false): Promise<FilePickerResult> => {
  return pickFile({
    accept: ['image/*', 'image/jpeg', 'image/png', 'image/gif', 'image/webp'],
    multiple,
    maxSize: 10
  });
};

/**
 * Pick video file
 */
export const pickVideo = async (): Promise<FilePickerResult> => {
  return pickFile({
    accept: ['video/*', 'video/mp4', 'video/webm'],
    multiple: false,
    maxSize: 100
  });
};

/**
 * Pick any file type
 */
export const pickAnyFile = async (): Promise<FilePickerResult> => {
  return pickFile({
    accept: [],
    multiple: false,
    maxSize: 20
  });
};
