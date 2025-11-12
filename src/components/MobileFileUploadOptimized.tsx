/**
 * Mobile-Optimized File Upload Component
 * Specifically designed for Chrome mobile performance and UX
 */

import React, { useState, useRef, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Paperclip, Camera, Image, FileText, X, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { logger } from '@/lib/logger';
import { isMobile, getDevice, isSlowConnection } from '@/lib/mobileOptimization';

interface MobileFileUploadOptimizedProps {
  onFileSelect: (file: File) => void;
  disabled?: boolean;
  isLoading?: boolean;
  accept?: string;
  maxSizeMB?: number;
  className?: string;
}

interface FileOption {
  id: string;
  label: string;
  icon: React.ReactNode;
  accept: string;
  capture?: string;
}

export const MobileFileUploadOptimized: React.FC<MobileFileUploadOptimizedProps> = ({
  onFileSelect,
  disabled = false,
  isLoading = false,
  accept = "image/*,video/*,audio/*,.pdf,.doc,.docx,.txt",
  maxSizeMB = 10,
  className = ""
}) => {
  const [showOptions, setShowOptions] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const device = getDevice();

  // File options optimized for mobile
  const fileOptions: FileOption[] = [
    {
      id: 'camera',
      label: 'Camera',
      icon: <Camera className="h-5 w-5" />,
      accept: 'image/*',
      capture: 'environment'
    },
    {
      id: 'photo',
      label: 'Photo Library',
      icon: <Image className="h-5 w-5" />,
      accept: 'image/*'
    },
    {
      id: 'document',
      label: 'Document',
      icon: <FileText className="h-5 w-5" />,
      accept: '.pdf,.doc,.docx,.txt'
    },
    {
      id: 'any',
      label: 'Browse Files',
      icon: <Paperclip className="h-5 w-5" />,
      accept: accept
    }
  ];

  const validateFile = useCallback((file: File): boolean => {
    // Size validation
    const fileSizeMB = file.size / (1024 * 1024);
    if (fileSizeMB > maxSizeMB) {
      toast.error(`File too large. Maximum size is ${maxSizeMB}MB`);
      return false;
    }

    // Type validation for mobile
    const allowedTypes = [
      'image/jpeg', 'image/png', 'image/gif', 'image/webp',
      'video/mp4', 'video/webm', 'video/quicktime',
      'audio/mp3', 'audio/wav', 'audio/m4a',
      'application/pdf', 'text/plain',
      'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
    ];

    if (!allowedTypes.includes(file.type)) {
      toast.error('File type not supported');
      return false;
    }

    return true;
  }, [maxSizeMB]);

  const processFile = useCallback(async (file: File) => {
    if (!validateFile(file)) return;

    setIsProcessing(true);
    logger.mobile('Processing file upload', { 
      fileName: file.name, 
      size: `${(file.size / 1024 / 1024).toFixed(2)}MB`,
      type: file.type 
    });

    try {
      // Optimize image for mobile if needed
      if (file.type.startsWith('image/') && file.size > 2 * 1024 * 1024) {
        const optimizedFile = await optimizeImageForMobile(file);
        onFileSelect(optimizedFile);
      } else {
        onFileSelect(file);
      }
    } catch (error) {
      logger.error('File processing failed', error);
      toast.error('Failed to process file');
    } finally {
      setIsProcessing(false);
      setShowOptions(false);
    }
  }, [validateFile, onFileSelect]);

  const optimizeImageForMobile = useCallback(async (file: File): Promise<File> => {
    return new Promise((resolve) => {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      const img = document.createElement('img');

      img.onload = () => {
        // Calculate optimal dimensions for mobile
        const maxWidth = device.screenSize === 'small' ? 800 : 1200;
        const maxHeight = device.screenSize === 'small' ? 600 : 900;
        
        let { width, height } = img;
        
        if (width > maxWidth || height > maxHeight) {
          const ratio = Math.min(maxWidth / width, maxHeight / height);
          width *= ratio;
          height *= ratio;
        }

        canvas.width = width;
        canvas.height = height;
        
        // Use lower quality for slow connections
        const quality = isSlowConnection() ? 0.7 : 0.85;
        
        ctx?.drawImage(img, 0, 0, width, height);
        
        canvas.toBlob((blob) => {
          if (blob) {
            // Create File object with proper constructor
            const optimizedFile = new File([blob], file.name, {
              type: 'image/jpeg',
              lastModified: Date.now()
            } as FilePropertyBag);
            logger.mobile('Image optimized', {
              originalSize: `${(file.size / 1024 / 1024).toFixed(2)}MB`,
              optimizedSize: `${(optimizedFile.size / 1024 / 1024).toFixed(2)}MB`,
              dimensions: `${width}x${height}`
            });
            resolve(optimizedFile);
          } else {
            resolve(file);
          }
        }, 'image/jpeg', quality);
      };

      img.src = URL.createObjectURL(file);
    });
  }, [device.screenSize]);

  const handleFileSelect = useCallback((option: FileOption) => {
    if (!fileInputRef.current) return;

    const input = fileInputRef.current;
    input.accept = option.accept;
    
    // Set capture attribute for camera access
    if (option.capture) {
      input.setAttribute('capture', option.capture);
    } else {
      input.removeAttribute('capture');
    }

    // Optimize for mobile file picker
    if (isMobile()) {
      // Prevent multiple file selection on mobile for better UX
      input.removeAttribute('multiple');
      
      // Add mobile-specific attributes
      input.style.fontSize = '16px'; // Prevent zoom on iOS
    }

    input.click();
  }, []);

  const handleInputChange = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      processFile(file);
    }
    // Clear input to allow selecting same file again
    event.target.value = '';
  }, [processFile]);

  if (!isMobile()) {
    // Fallback to simple file input for desktop
    return (
      <div className={className}>
        <input
          ref={fileInputRef}
          type="file"
          accept={accept}
          onChange={handleInputChange}
          className="hidden"
          disabled={disabled || isLoading}
        />
        <Button
          size="sm"
          variant="ghost"
          className="h-9 w-9 p-0"
          onClick={() => fileInputRef.current?.click()}
          disabled={disabled || isLoading}
        >
          {isLoading ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Paperclip className="h-4 w-4" />
          )}
        </Button>
      </div>
    );
  }

  return (
    <div className={`relative ${className}`}>
      <input
        ref={fileInputRef}
        type="file"
        onChange={handleInputChange}
        className="hidden"
        disabled={disabled || isLoading || isProcessing}
      />

      {/* Main attachment button */}
      <Button
        size="sm"
        variant="ghost"
        className="h-9 w-9 p-0"
        onClick={() => setShowOptions(!showOptions)}
        disabled={disabled || isLoading || isProcessing}
      >
        {isLoading || isProcessing ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : (
          <Paperclip className="h-4 w-4" />
        )}
      </Button>

      {/* Mobile file options popup */}
      {showOptions && (
        <>
          {/* Backdrop */}
          <div 
            className="fixed inset-0 bg-black/20 z-40"
            onClick={() => setShowOptions(false)}
          />
          
          {/* Options panel */}
          <div className="absolute bottom-full right-0 mb-2 bg-background border border-border rounded-lg shadow-lg z-50 min-w-[200px]">
            <div className="p-2">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium">Attach File</span>
                <Button
                  size="sm"
                  variant="ghost"
                  className="h-6 w-6 p-0"
                  onClick={() => setShowOptions(false)}
                >
                  <X className="h-3 w-3" />
                </Button>
              </div>
              
              <div className="space-y-1">
                {fileOptions.map((option) => (
                  <Button
                    key={option.id}
                    variant="ghost"
                    className="w-full justify-start h-10 px-3"
                    onClick={() => handleFileSelect(option)}
                    disabled={isProcessing}
                  >
                    {option.icon}
                    <span className="ml-3">{option.label}</span>
                  </Button>
                ))}
              </div>
              
              {/* Connection status indicator */}
              {isSlowConnection() && (
                <div className="mt-2 p-2 bg-orange-50 dark:bg-orange-900/20 rounded text-xs text-orange-600 dark:text-orange-400">
                  Slow connection detected. Images will be compressed.
                </div>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
};
