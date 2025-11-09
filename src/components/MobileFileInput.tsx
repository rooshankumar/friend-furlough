import React, { useRef, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Camera, Loader2, X } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { isMobileApp, pickFile, FilePickerOptions } from '@/lib/mobileFilePicker';

interface MobileFileInputProps {
  onFileSelect: (file: File) => void | Promise<void>;
  accept?: string;
  buttonText?: string;
  icon?: React.ReactNode;
  variant?: 'default' | 'outline' | 'ghost' | 'secondary' | 'destructive' | 'link';
  size?: 'default' | 'sm' | 'lg' | 'icon';
  className?: string;
  disabled?: boolean;
  isLoading?: boolean;
  maxSizeMB?: number;
  showProgress?: boolean;
  showFileName?: boolean;
}

const MobileFileInput: React.FC<MobileFileInputProps> = ({
  onFileSelect,
  accept = "image/*,video/*,audio/*,.pdf,.doc,.docx,.txt",
  buttonText = "Upload",
  icon = <Camera className="mr-2 h-4 w-4" />,
  variant = "outline",
  size = "sm",
  className = "",
  disabled = false,
  isLoading = false,
  maxSizeMB = 20,
  showProgress = true,
  showFileName = false
}) => {
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isLoadingState, setIsLoading] = useState(false); // Renamed from isPickerLoading to avoid conflict with prop
  const [uploadProgress, setUploadProgress] = useState(0);
  const [selectedFileName, setSelectedFileName] = useState<string>('');
  const [selectedFile, setSelectedFile] = useState<File | null>(null); // Added to manage selected file state

  // Convert accept string to array for mobile picker
  const acceptTypes = accept.split(',').map(type => type.trim());

  const handleClick = async () => {
    if (disabled || isLoading || isLoadingState) return;

    // ALWAYS use native file input (works on both mobile and web)
    // The Capacitor file picker has issues on some devices
    fileInputRef.current?.click();
  };

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];

    const isMobile = /Android|webOS|iPhone|iPad|iPod/i.test(navigator.userAgent);
    
    console.log('📎 File selected (Mobile: ' + isMobile + '):', file ? {
      name: file.name,
      size: `${(file.size / 1024 / 1024).toFixed(2)}MB`,
      type: file.type,
      userAgent: navigator.userAgent.substring(0, 50)
    } : 'NO FILE');

    if (!file) {
      console.warn('⚠️ No file selected');
      return;
    }

    // Validate file size
    if (maxSizeMB && file.size > maxSizeMB * 1024 * 1024) {
      toast({
        title: 'File too large',
        description: `Maximum size: ${maxSizeMB}MB (current: ${(file.size / 1024 / 1024).toFixed(2)}MB)`,
        variant: 'destructive'
      });
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
      return;
    }

    // Validate file type if accept is specified
    if (accept && accept !== '*') {
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
        if (fileInputRef.current) {
          fileInputRef.current.value = '';
        }
        return;
      }
    }

    setIsLoading(true);
    setSelectedFile(file);
    if (showProgress) setUploadProgress(10);

    try {
      console.log('📤 Calling onFileSelect...');

      // Call the parent's upload handler
      await onFileSelect(file);

      if (showProgress) setUploadProgress(100);
      console.log('✅ File upload completed');

      // Reset after brief delay
      setTimeout(() => {
        setSelectedFile(null);
        setUploadProgress(0);
        setIsLoading(false);
      }, 500);

    } catch (error: any) {
      console.error('❌ Upload failed:', error);
      
      // Mobile-friendly error messages
      let errorMsg = error.message || 'Please try again';
      if (errorMsg.includes('timeout')) {
        errorMsg = '⏱️ Upload taking too long - try connecting to WiFi or use a smaller file';
      } else if (errorMsg.includes('network') || errorMsg.includes('connection')) {
        errorMsg = '📡 Network issue - check your internet connection';
      } else if (errorMsg.includes('large')) {
        errorMsg = '📦 File too large - try a smaller file (max 20MB)';
      }
      
      toast({
        title: 'Upload failed',
        description: errorMsg,
        variant: 'destructive',
        duration: 5000 // Longer duration for mobile users to read
      });
      setUploadProgress(0);
      setIsLoading(false);
      setSelectedFile(null);
    } finally {
      // Always reset input to allow re-selection
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const loading = isLoading || isLoadingState;

  return (
    <div className="relative">
      <Button
        variant={variant}
        size={size}
        className={className}
        onClick={handleClick}
        disabled={disabled || loading}
        aria-label="Upload file"
      >
        {loading ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            {buttonText && 'Uploading...'}
          </>
        ) : (
          <>
            {icon}
            {buttonText}
          </>
        )}
      </Button>

      {/* Hidden file input - works on both mobile and web */}
      <input
        ref={fileInputRef}
        type="file"
        accept={accept}
        onChange={handleFileSelect}
        disabled={disabled || loading}
        className="hidden"
        style={{
          display: 'none',
          position: 'absolute',
          left: '-9999px'
        }}
        aria-label="File input"
        tabIndex={-1}
      />

      {/* Progress indicator */}
      {showProgress && loading && uploadProgress > 0 && (
        <div className="absolute bottom-full left-0 right-0 mb-2 bg-background border rounded-lg p-3 shadow-lg z-50 min-w-[200px]">
          <div className="space-y-2">
            {showFileName && selectedFileName && (
              <div className="flex items-center justify-between text-xs">
                <span className="font-medium truncate flex-1 mr-2">
                  {selectedFileName}
                </span>
              </div>
            )}
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

export default MobileFileInput;