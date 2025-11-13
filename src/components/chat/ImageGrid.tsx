import React from 'react';
import { B2Image } from '@/components/B2Image';
import { Loader2 } from 'lucide-react';
import { CompactUploadProgress } from '@/components/CompactUploadProgress';
import { Button } from '@/components/ui/button';

interface ImageGridProps {
  images: Array<{
    id: string;
    media_url?: string;
    status?: string;
    uploadProgress?: number;
  }>;
  onImageClick?: (url: string) => void;
  onRetry?: (message: any) => void;
  onRemove?: (message: any) => void;
  isOwnMessage?: boolean;
}

export const ImageGrid: React.FC<ImageGridProps> = ({
  images,
  onImageClick,
  onRetry,
  onRemove,
  isOwnMessage = false
}) => {
  const imageCount = images.length;

  // Single image - compact thumbnail with consistent sizing
  if (imageCount === 1) {
    const image = images[0];
    return (
      <div className="relative group w-full max-w-[200px]">
        {image.media_url ? (
          <div 
            onClick={() => onImageClick?.(image.media_url!)}
            className="cursor-pointer hover:opacity-90 transition-opacity relative overflow-hidden rounded-xl"
          >
            <B2Image 
              src={image.media_url} 
              alt="Shared image"
              loading="lazy"
              className="w-full h-auto max-h-[160px] object-cover rounded-xl"
            />
            {/* Click to expand indicator */}
            <div className="absolute bottom-2 right-2 bg-black/50 backdrop-blur-sm rounded-full p-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
              <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0zM10 7v6m3-3H7" />
              </svg>
            </div>
          </div>
        ) : (
          <div className="w-full h-32 bg-muted/20 rounded-xl flex items-center justify-center">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        )}
        {renderOverlay(image, onRetry, onRemove)}
      </div>
    );
  }

  // Two images - side by side with consistent sizing
  if (imageCount === 2) {
    return (
      <div className="grid grid-cols-2 gap-1 w-full max-w-[200px]">
        {images.map((image) => (
          <div key={image.id} className="relative group aspect-square">
            {image.media_url ? (
              <div 
                onClick={() => onImageClick?.(image.media_url!)}
                className="cursor-pointer hover:opacity-90 transition-opacity h-full group"
              >
                <B2Image 
                  src={image.media_url} 
                  alt="Shared image"
                  loading="lazy"
                  className="w-full h-full object-cover rounded-lg"
                />
                {/* Expand icon on hover */}
                <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 rounded-lg transition-colors flex items-center justify-center">
                  <div className="bg-black/50 backdrop-blur-sm rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0zM10 7v6m3-3H7" />
                    </svg>
                  </div>
                </div>
              </div>
            ) : (
              <div className="w-full h-full bg-muted/20 rounded-lg flex items-center justify-center">
                <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
              </div>
            )}
            {renderOverlay(image, onRetry, onRemove, true)}
          </div>
        ))}
      </div>
    );
  }

  // Three images - 1 large + 2 small with consistent sizing
  if (imageCount === 3) {
    return (
      <div className="grid grid-cols-2 gap-1 w-full max-w-[200px] h-[120px]">
        {/* First image takes full left side */}
        <div className="relative group row-span-2 h-full">
          {images[0].media_url ? (
            <div 
              onClick={() => onImageClick?.(images[0].media_url!)}
              className="cursor-pointer hover:opacity-90 transition-opacity h-full relative group"
            >
              <B2Image 
                src={images[0].media_url} 
                alt="Shared image"
                loading="lazy"
                className="w-full h-full object-cover rounded-lg"
              />
              <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 rounded-lg transition-colors flex items-center justify-center">
                <div className="bg-black/50 backdrop-blur-sm rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0zM10 7v6m3-3H7" />
                  </svg>
                </div>
              </div>
            </div>
          ) : (
            <div className="w-full h-full bg-muted/20 rounded-lg flex items-center justify-center">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          )}
          {renderOverlay(images[0], onRetry, onRemove, true)}
        </div>
        
        {/* Other two images on right side */}
        {images.slice(1).map((image) => (
          <div key={image.id} className="relative group h-full">
            {image.media_url ? (
              <div 
                onClick={() => onImageClick?.(image.media_url!)}
                className="cursor-pointer hover:opacity-90 transition-opacity h-full relative group"
              >
                <B2Image 
                  src={image.media_url} 
                  alt="Shared image"
                  loading="lazy"
                  className="w-full h-full object-cover rounded-lg"
                />
                <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 rounded-lg transition-colors flex items-center justify-center">
                  <div className="bg-black/50 backdrop-blur-sm rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0zM10 7v6m3-3H7" />
                    </svg>
                  </div>
                </div>
              </div>
            ) : (
              <div className="w-full h-full bg-muted/20 rounded-lg flex items-center justify-center">
                <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
              </div>
            )}
            {renderOverlay(image, onRetry, onRemove, true)}
          </div>
        ))}
      </div>
    );
  }

  // Four or more images - 2x2 grid with consistent sizing (show +N for more)
  return (
    <div className="grid grid-cols-2 gap-1 w-full max-w-[200px] h-[120px]">
      {images.slice(0, 4).map((image, index) => (
        <div key={image.id} className="relative group h-full">
          {image.media_url ? (
            <div 
              onClick={() => onImageClick?.(image.media_url!)}
              className="cursor-pointer hover:opacity-90 transition-opacity h-full relative group"
            >
              <B2Image 
                src={image.media_url} 
                alt="Shared image"
                loading="lazy"
                className="w-full h-full object-cover rounded-lg"
              />
              {/* Show +N overlay on last image if more than 4 */}
              {index === 3 && imageCount > 4 && (
                <div className="absolute inset-0 bg-black/60 rounded-lg flex items-center justify-center">
                  <span className="text-white text-lg font-bold">+{imageCount - 4}</span>
                </div>
              )}
              {/* Expand icon on hover (not on +N image) */}
              {!(index === 3 && imageCount > 4) && (
                <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 rounded-lg transition-colors flex items-center justify-center">
                  <div className="bg-black/50 backdrop-blur-sm rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0zM10 7v6m3-3H7" />
                    </svg>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="w-full h-full bg-muted/20 rounded-lg flex items-center justify-center">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          )}
          {renderOverlay(image, onRetry, onRemove, true)}
        </div>
      ))}
    </div>
  );
};

// Helper function to render upload/error overlays
function renderOverlay(
  image: any,
  onRetry?: (message: any) => void,
  onRemove?: (message: any) => void,
  compact: boolean = false
) {
  // Upload Progress
  if (image.status === 'sending' && image.uploadProgress !== undefined && image.uploadProgress < 100) {
    return (
      <div className="absolute inset-0 bg-black/40 rounded-lg flex items-center justify-center backdrop-blur-sm">
        <CompactUploadProgress 
          progress={image.uploadProgress} 
          size={compact ? 32 : 48} 
          strokeWidth={compact ? 3 : 4} 
        />
      </div>
    );
  }

  // Failed Upload
  if (image.status === 'failed') {
    return (
      <div className="absolute inset-0 bg-red-500/40 rounded-lg flex flex-col items-center justify-center backdrop-blur-sm gap-1 p-2 text-center">
        <div className="text-white text-xs font-semibold">Failed</div>
        {!compact && (
          <>
            <div className="text-white/90 text-[10px]">Auto-remove in 30s</div>
            <div className="flex gap-1 mt-1">
              <Button
                size="sm"
                variant="secondary"
                className="h-6 text-[10px] px-2"
                onClick={() => onRetry?.(image)}
              >
                Retry
              </Button>
              <Button
                size="sm"
                variant="destructive"
                className="h-6 text-[10px] px-2"
                onClick={() => onRemove?.(image)}
              >
                Remove
              </Button>
            </div>
          </>
        )}
      </div>
    );
  }

  return null;
}
