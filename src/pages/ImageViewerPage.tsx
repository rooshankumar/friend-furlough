import { useNavigate, useSearchParams } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Download, ZoomIn, ZoomOut } from 'lucide-react';
import { useState } from 'react';

const ImageViewerPage = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const imageUrl = searchParams.get('url');
  const [zoom, setZoom] = useState(1);

  if (!imageUrl) {
    navigate(-1);
    return null;
  }

  const handleDownload = async () => {
    try {
      const response = await fetch(imageUrl);
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `image-${Date.now()}.jpg`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (error) {
      console.error('Download failed:', error);
    }
  };

  return (
    <div className="fixed inset-0 bg-black z-50 flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between p-4 bg-black/80 backdrop-blur-sm">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => navigate(-1)}
          className="text-white hover:bg-white/10"
        >
          <ArrowLeft className="h-5 w-5" />
        </Button>
        
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setZoom(Math.max(0.5, zoom - 0.25))}
            className="text-white hover:bg-white/10"
            disabled={zoom <= 0.5}
          >
            <ZoomOut className="h-5 w-5" />
          </Button>
          
          <span className="text-white text-sm min-w-[60px] text-center">
            {Math.round(zoom * 100)}%
          </span>
          
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setZoom(Math.min(3, zoom + 0.25))}
            className="text-white hover:bg-white/10"
            disabled={zoom >= 3}
          >
            <ZoomIn className="h-5 w-5" />
          </Button>
          
          <Button
            variant="ghost"
            size="icon"
            onClick={handleDownload}
            className="text-white hover:bg-white/10"
          >
            <Download className="h-5 w-5" />
          </Button>
        </div>
      </div>

      {/* Image Container */}
      <div className="flex-1 overflow-auto flex items-center justify-center p-4">
        <img
          src={imageUrl}
          alt="Full size"
          className="max-w-full h-auto object-contain transition-transform duration-200"
          style={{ transform: `scale(${zoom})` }}
        />
      </div>

      {/* Bottom hint */}
      <div className="p-4 bg-black/80 backdrop-blur-sm text-center">
        <p className="text-white/60 text-sm">
          Pinch to zoom • Tap back to return
        </p>
      </div>
    </div>
  );
};

export default ImageViewerPage;
