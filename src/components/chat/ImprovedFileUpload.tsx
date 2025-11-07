import React, { useRef, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Paperclip, Loader2, X, FileText, Image as ImageIcon } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface ImprovedFileUploadProps {
  onFileSelect: (file: File) => Promise<void>;
  accept?: string;
  maxSizeMB?: number;
  disabled?: boolean;
  className?: string;
  showProgress?: boolean;
}

/**
 * Improved file upload component with mobile-first design
 * Based on successful patterns from document upload systems
 */
export const ImprovedFileUpload: React.FC<ImprovedFileUploadProps> = ({
  onFileSelect,
  accept = "image/*,video/*,audio/*,.pdf,.doc,.docx,.txt",
  maxSizeMB = 20,
  disabled = false,
  className = "",
  showProgress = true
}) => {
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  const handleFileSelection = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    
    console.log('📎 File selected:', file ? {
      name: file.name,
      size: `${(file.size / 1024 / 1024).toFixed(2)}MB`,
      type: file.type
    } : 'NO FILE');

    if (!file) {
      console.warn('⚠️ No file selected');
      return;
    }

    // Validate file size
    const maxBytes = maxSizeMB * 1024 * 1024;
    if (file.size > maxBytes) {
      toast({
        title: 'File too large',
        description: `Maximum size: ${maxSizeMB}MB (current: ${(file.size / 1024 / 1024).toFixed(2)}MB)`,
        variant: 'destructive'
      });
      // Reset input
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
      return;
    }

    // Validate file type
    const acceptedTypes = accept.split(',').map(t => t.trim());
    const isValidType = acceptedTypes.some(type => {
      if (type.includes('*')) {
        const baseType = type.split('/')[0];
        return file.type.startsWith(baseType);
      }
      return file.type === type || file.name.endsWith(type);
    });

    if (!isValidType) {
      toast({
        title: 'Invalid file type',
        description: `Accepted types: ${accept}`,
        variant: 'destructive'
      });
      // Reset input
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
      return;
    }

    setSelectedFile(file);
    setUploading(true);
    setUploadProgress(10);

    try {
      console.log('📤 Starting upload for:', file.name);
      
      // Simulate progress (actual progress will be updated by parent)
      const progressInterval = setInterval(() => {
        setUploadProgress(prev => {
          if (prev >= 90) {
            clearInterval(progressInterval);
            return 90;
          }
          return prev + 10;
        });
      }, 200);

      // Call parent's upload handler
      await onFileSelect(file);

      clearInterval(progressInterval);
      setUploadProgress(100);
      
      console.log('✅ Upload successful');
      
      // Reset after short delay
      setTimeout(() => {
        setSelectedFile(null);
        setUploadProgress(0);
        setUploading(false);
      }, 1000);

    } catch (error: any) {
      console.error('❌ Upload failed:', error);
      toast({
        title: 'Upload failed',
        description: error.message || 'Please try again',
        variant: 'destructive'
      });
      setUploadProgress(0);
      setUploading(false);
      setSelectedFile(null);
    } finally {
      // Reset input to allow selecting the same file again
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleButtonClick = () => {
    console.log('📎 Upload button clicked');
    fileInputRef.current?.click();
  };

  const cancelUpload = () => {
    setUploading(false);
    setUploadProgress(0);
    setSelectedFile(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const getFileIcon = (file: File | null) => {
    if (!file) return <Paperclip className="h-5 w-5" />;
    if (file.type.startsWith('image/')) return <ImageIcon className="h-5 w-5" />;
    return <FileText className="h-5 w-5" />;
  };

  return (
    <div className={`relative ${className}`}>
      {/* Upload Button */}
      <Button
        type="button"
        variant="ghost"
        size="icon"
        onClick={handleButtonClick}
        disabled={disabled || uploading}
        className="h-9 w-9 p-0 flex-shrink-0"
        aria-label="Upload attachment"
      >
        {uploading ? (
          <Loader2 className="h-5 w-5 animate-spin" />
        ) : (
          getFileIcon(selectedFile)
        )}
      </Button>

      {/* Hidden file input */}
      <input
        ref={fileInputRef}
        type="file"
        accept={accept}
        onChange={handleFileSelection}
        disabled={disabled || uploading}
        style={{ display: 'none' }}
        aria-label="File input"
      />

      {/* Progress indicator (optional) */}
      {showProgress && uploading && uploadProgress > 0 && (
        <div className="absolute bottom-full left-0 right-0 mb-2 bg-background border rounded-lg p-3 shadow-lg z-50 min-w-[200px]">
          <div className="space-y-2">
            <div className="flex items-center justify-between text-xs">
              <span className="font-medium truncate flex-1 mr-2">
                {selectedFile?.name || 'Uploading...'}
              </span>
              <Button
                variant="ghost"
                size="icon"
                className="h-4 w-4 p-0"
                onClick={cancelUpload}
              >
                <X className="h-3 w-3" />
              </Button>
            </div>
            <div className="space-y-1">
              <div className="flex justify-between text-xs text-muted-foreground">
                <span>Uploading...</span>
                <span>{uploadProgress}%</span>
              </div>
              <Progress value={uploadProgress} className="h-1.5" />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ImprovedFileUpload;
