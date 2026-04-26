import { useState, useRef, useCallback } from 'react';
import { useMutation } from '@tanstack/react-query';
import { uploadProductImages, deleteProductImage } from '@/api/products';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Upload, X, Loader2, ImagePlus, GripVertical } from 'lucide-react';
import { cn } from '@/lib/utils';

interface ImageUploadProps {
  productId: string;
  images: string[];
  onImagesChange: (images: string[]) => void;
  apiBase: string;
}

export default function ImageUpload({ productId, images, onImagesChange, apiBase }: ImageUploadProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [dragIdx, setDragIdx] = useState<number | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  const uploadMutation = useMutation({
    mutationFn: (files: File[]) => uploadProductImages(productId, files),
    onSuccess: (updatedImages) => onImagesChange(updatedImages),
  });

  const deleteMutation = useMutation({
    mutationFn: (url: string) => deleteProductImage(productId, url),
    onSuccess: (updatedImages) => onImagesChange(updatedImages),
  });

  const handleFiles = useCallback((files: FileList | null) => {
    if (!files || files.length === 0) return;
    const accepted = Array.from(files).filter((f) =>
      ['image/jpeg', 'image/png', 'image/webp', 'image/avif'].includes(f.type),
    );
    if (accepted.length > 0) uploadMutation.mutate(accepted);
  }, [uploadMutation]);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    handleFiles(e.dataTransfer.files);
  }, [handleFiles]);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleReorderDrop = useCallback((e: React.DragEvent, targetIdx: number) => {
    e.preventDefault();
    if (dragIdx === null || dragIdx === targetIdx) return;
    const reordered = [...images];
    const [moved] = reordered.splice(dragIdx, 1);
    reordered.splice(targetIdx, 0, moved);
    onImagesChange(reordered);
    setDragIdx(null);
  }, [dragIdx, images, onImagesChange]);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Product Images</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Drop zone */}
        <div
          onDrop={handleDrop}
          onDragOver={handleDragOver}
          onDragLeave={() => setIsDragging(false)}
          onClick={() => fileRef.current?.click()}
          className={cn(
            'flex cursor-pointer flex-col items-center justify-center gap-2 rounded-lg border-2 border-dashed px-4 py-8 text-center transition-colors',
            isDragging
              ? 'border-primary bg-primary/5 text-primary'
              : 'border-muted-foreground/25 text-muted-foreground hover:border-muted-foreground/50',
          )}
        >
          {uploadMutation.isPending ? (
            <Loader2 className="h-8 w-8 animate-spin" />
          ) : (
            <Upload className="h-8 w-8" />
          )}
          <div className="text-sm font-medium">
            {uploadMutation.isPending ? 'Uploading...' : 'Drop images here or click to browse'}
          </div>
          <div className="text-xs text-muted-foreground">JPEG, PNG, WebP, AVIF up to 10 MB</div>
        </div>

        <input
          ref={fileRef}
          type="file"
          accept="image/jpeg,image/png,image/webp,image/avif"
          multiple
          className="hidden"
          onChange={(e) => { handleFiles(e.target.files); e.target.value = ''; }}
        />

        {uploadMutation.isError && (
          <p className="text-sm text-destructive">
            Upload failed: {(uploadMutation.error as Error).message}
          </p>
        )}

        {/* Image grid */}
        {images.length > 0 && (
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4">
            {images.map((url, idx) => (
              <div
                key={url}
                draggable
                onDragStart={() => setDragIdx(idx)}
                onDragOver={(e) => e.preventDefault()}
                onDrop={(e) => handleReorderDrop(e, idx)}
                onDragEnd={() => setDragIdx(null)}
                className={cn(
                  'group relative aspect-square overflow-hidden rounded-lg border bg-muted',
                  dragIdx === idx && 'opacity-50',
                )}
              >
                <img
                  src={`${apiBase}${url}`}
                  alt={`Product image ${idx + 1}`}
                  className="h-full w-full object-cover"
                />
                <div className="absolute inset-0 bg-black/0 transition-colors group-hover:bg-black/30" />

                {/* Drag handle */}
                <div className="absolute top-1 left-1 rounded bg-black/50 p-0.5 text-white opacity-0 transition-opacity group-hover:opacity-100">
                  <GripVertical className="h-4 w-4" />
                </div>

                {/* First image badge */}
                {idx === 0 && (
                  <span className="absolute bottom-1 left-1 rounded bg-primary px-1.5 py-0.5 text-[10px] font-medium text-primary-foreground">
                    Main
                  </span>
                )}

                {/* Delete button */}
                <Button
                  type="button"
                  variant="destructive"
                  size="icon-xs"
                  className="absolute top-1 right-1 opacity-0 transition-opacity group-hover:opacity-100"
                  disabled={deleteMutation.isPending}
                  onClick={() => deleteMutation.mutate(url)}
                >
                  <X className="h-3 w-3" />
                </Button>
              </div>
            ))}

            {/* Add more placeholder */}
            <div
              onClick={() => fileRef.current?.click()}
              className="flex aspect-square cursor-pointer flex-col items-center justify-center gap-1 rounded-lg border-2 border-dashed border-muted-foreground/25 text-muted-foreground transition-colors hover:border-muted-foreground/50"
            >
              <ImagePlus className="h-6 w-6" />
              <span className="text-xs">Add more</span>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
