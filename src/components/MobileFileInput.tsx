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
  const [isPickerLoading, setIsPickerLoading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [selectedFileName, setSelectedFileName] = useState<string>('');
  
  // Convert accept string to array for mobile picker
  const acceptTypes = accept.split(',').map(type => type.trim());
  
  const handleClick = async () => {
    if (disabled || isLoading || isPickerLoading) return;
    
    // ALWAYS use native file input (works on both mobile and web)
    // The Capacitor file picker has issues on some devices
    fileInputRef.current?.click();
  };
  
  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    const maxBytes = maxSizeMB * 1024 * 1024;
    if (file.size > maxBytes) {
      toast({
        title: "File too large",
        description: `Maximum size: ${maxSizeMB}MB (current: ${(file.size / 1024 / 1024).toFixed(2)}MB)`,
        variant: "destructive"
      });
      if (fileInputRef.current) fileInputRef.current.value = '';
      return;
    }
    
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
        title: "Invalid file type",
        description: `Accepted types: ${accept}`,
        variant: "destructive"
      });
      if (fileInputRef.current) fileInputRef.current.value = '';
      return;
    }
    
    setSelectedFileName(file.name);
    setIsPickerLoading(true);
    setUploadProgress(10);
    
    try {
      const progressInterval = setInterval(() => {
        setUploadProgress(prev => {
          if (prev >= 90) {
            clearInterval(progressInterval);
            return 90;
          }
          return prev + 10;
        });
      }, 200);
      
      await Promise.resolve(onFileSelect(file));
      
      clearInterval(progressInterval);
      setUploadProgress(100);
      
      setTimeout(() => {
        setSelectedFileName('');
        setUploadProgress(0);
        setIsPickerLoading(false);
      }, 1000);
    } catch (error: any) {
      toast({
        title: "Upload failed",
        description: error.message || 'Please try again',
        variant: "destructive"
      });
      setUploadProgress(0);
      setIsPickerLoading(false);
      setSelectedFileName('');
    } finally {
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };
  
  const loading = isLoading || isPickerLoading;
  
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
        onChange={handleFileChange}
        style={{ display: 'none' }}
        disabled={disabled || loading}
        aria-label="File input"
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
