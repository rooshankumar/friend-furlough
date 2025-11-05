import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Card } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { X, Upload, Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import UserAvatar from '@/components/UserAvatar';

interface PostCreatorProps {
  userProfile?: {
    id: string;
    name: string;
    avatar_url?: string;
  };
  onPostCreate: (content: string, images: File[]) => Promise<void>;
  isLoading?: boolean;
}

export const PostCreator: React.FC<PostCreatorProps> = ({
  userProfile,
  onPostCreate,
  isLoading = false,
}) => {
  const { toast } = useToast();
  const [content, setContent] = useState('');
  const [selectedImages, setSelectedImages] = useState<File[]>([]);
  const [imagePreviews, setImagePreviews] = useState<string[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;

    const validFiles: File[] = [];
    const invalidFiles: string[] = [];

    for (const file of files) {
      // Basic validation
      if (!file.type.startsWith('image/')) {
        invalidFiles.push(`${file.name}: Not an image`);
        continue;
      }

      const maxSize = 10 * 1024 * 1024; // 10MB
      if (file.size > maxSize) {
        invalidFiles.push(`${file.name}: File too large`);
        continue;
      }

      validFiles.push(file);
    }

    if (invalidFiles.length > 0) {
      toast({
        title: "Some files couldn't be added",
        description: invalidFiles.join(', '),
        variant: "destructive",
      });
    }

    const filesToAdd = validFiles.slice(0, 4 - selectedImages.length);

    if (selectedImages.length + validFiles.length > 4) {
      toast({
        title: "Image limit",
        description: "Maximum 4 images per post",
        variant: "destructive",
      });
    }

    if (filesToAdd.length === 0) return;

    setSelectedImages([...selectedImages, ...filesToAdd]);

    filesToAdd.forEach((file) => {
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreviews((prev) => [...prev, reader.result as string]);
      };
      reader.readAsDataURL(file);
    });
  };

  const removeImage = (index: number) => {
    setSelectedImages((prev) => prev.filter((_, i) => i !== index));
    setImagePreviews((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async () => {
    if (!content.trim() && selectedImages.length === 0) {
      toast({
        title: "Content required",
        description: "Please add content or images",
        variant: "destructive",
      });
      return;
    }

    setIsSubmitting(true);
    try {
      await onPostCreate(content, selectedImages);
      setContent('');
      setSelectedImages([]);
      setImagePreviews([]);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Card className="p-4 mb-6">
      <div className="space-y-4">
        {/* User Info and Input */}
        <div className="flex gap-3">
          <UserAvatar
            user={userProfile}
            size="md"
          />
          <div className="flex-1">
            <Textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="Share something with the community..."
              className="min-h-24 resize-none"
              disabled={isSubmitting || isLoading}
            />
          </div>
        </div>

        {/* Image Previews */}
        {imagePreviews.length > 0 && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
            {imagePreviews.map((preview, index) => (
              <div key={index} className="relative group">
                <img
                  src={preview}
                  alt={`Preview ${index + 1}`}
                  className="w-full h-24 object-cover rounded-lg"
                />
                <Button
                  size="sm"
                  variant="destructive"
                  className="absolute top-1 right-1 h-6 w-6 p-0 opacity-0 group-hover:opacity-100 transition-opacity"
                  onClick={() => removeImage(index)}
                >
                  <X className="h-3 w-3" />
                </Button>
              </div>
            ))}
          </div>
        )}

        {/* Actions */}
        <div className="flex items-center justify-between">
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              disabled={selectedImages.length >= 4 || isSubmitting || isLoading}
              onClick={() => document.getElementById('post-image-input')?.click()}
            >
              <Upload className="h-4 w-4 mr-2" />
              Add Image
              {selectedImages.length > 0 && ` (${selectedImages.length}/4)`}
            </Button>
            <input
              id="post-image-input"
              type="file"
              multiple
              accept="image/*"
              className="hidden"
              onChange={handleImageSelect}
              disabled={isSubmitting || isLoading}
            />
          </div>

          <Button
            onClick={handleSubmit}
            disabled={
              (!content.trim() && selectedImages.length === 0) ||
              isSubmitting ||
              isLoading
            }
          >
            {isSubmitting || isLoading ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Posting...
              </>
            ) : (
              'Post'
            )}
          </Button>
        </div>
      </div>
    </Card>
  );
};
