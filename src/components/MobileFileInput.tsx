import React, { useRef, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Camera, Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { isMobileApp, pickFile, FilePickerOptions } from '@/lib/mobileFilePicker';

interface MobileFileInputProps {
  onFileSelect: (file: File) => void;
  accept?: string;
  buttonText?: string;
  icon?: React.ReactNode;
  variant?: 'default' | 'outline' | 'ghost' | 'secondary' | 'destructive' | 'link';
  size?: 'default' | 'sm' | 'lg' | 'icon';
  className?: string;
  disabled?: boolean;
  isLoading?: boolean;
  maxSizeMB?: number;
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
  maxSizeMB = 20
}) => {
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isPickerLoading, setIsPickerLoading] = useState(false);
  
  // Convert accept string to array for mobile picker
  const acceptTypes = accept.split(',').map(type => type.trim());
  
  const handleClick = async () => {
    if (disabled || isLoading || isPickerLoading) return;
    
    // ALWAYS use native file input (works on both mobile and web)
    // The Capacitor file picker has issues on some devices
    fileInputRef.current?.click();
  };
  
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // Check file size
      if (file.size > maxSizeMB * 1024 * 1024) {
        toast({
          title: "File too large",
          description: `Maximum file size is ${maxSizeMB}MB`,
          variant: "destructive"
        });
        return;
      }
      
      onFileSelect(file);
      
      // Reset input value to allow selecting the same file again
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };
  
  const loading = isLoading || isPickerLoading;
  
  return (
    <>
      <Button
        variant={variant}
        size={size}
        className={className}
        onClick={handleClick}
        disabled={disabled || loading}
      >
        {loading ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Uploading...
          </>
        ) : (
          <>
            {icon}
            {buttonText}
          </>
        )}
      </Button>
      
      {/* Hidden file input for web fallback */}
      <input
        ref={fileInputRef}
        type="file"
        accept={accept}
        onChange={handleFileChange}
        style={{ display: 'none' }}
        disabled={disabled || loading}
      />
    </>
  );
};

export default MobileFileInput;
