import { useCallback, useState } from 'react';
import { Upload, X, Image as ImageIcon, CheckCircle } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';

interface ImageUploaderProps {
  onImageSelect: (imageUrl: string) => void;
  selectedImage?: string;
  onClear?: () => void;
  accept?: string;
}

export function ImageUploader({ 
  onImageSelect, 
  selectedImage, 
  onClear,
  accept = "image/*" 
}: ImageUploaderProps) {
  const [isDragging, setIsDragging] = useState(false);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    
    const file = e.dataTransfer.files[0];
    if (file && file.type.startsWith('image/')) {
      const url = URL.createObjectURL(file);
      onImageSelect(url);
    }
  }, [onImageSelect]);

  const handleFileChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const url = URL.createObjectURL(file);
      onImageSelect(url);
    }
  }, [onImageSelect]);

  if (selectedImage) {
    return (
      <div className="relative border border-border rounded-lg overflow-hidden bg-card">
        <img 
          src={selectedImage} 
          alt="Selected crop" 
          className="w-full h-64 object-contain bg-muted"
        />
        {onClear && (
          <Button
            variant="destructive"
            size="icon"
            className="absolute top-2 right-2 rounded-full shadow-md"
            onClick={onClear}
          >
            <X className="w-4 h-4" />
          </Button>
        )}
        <div className="p-3 border-t border-border bg-muted/30">
          <p className="text-sm text-muted-foreground text-center flex items-center justify-center gap-2">
            <CheckCircle className="w-4 h-4 text-success" />
            Image ready for analysis
          </p>
        </div>
      </div>
    );
  }

  return (
    <div
      className={cn(
        "border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-all duration-200",
        isDragging 
          ? "border-primary bg-primary/5" 
          : "border-border hover:border-primary/50 hover:bg-accent/50"
      )}
      onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
      onDragLeave={() => setIsDragging(false)}
      onDrop={handleDrop}
    >
      <input
        type="file"
        accept={accept}
        onChange={handleFileChange}
        className="hidden"
        id="image-upload"
      />
      <label htmlFor="image-upload" className="cursor-pointer">
        <div className="flex flex-col items-center gap-4">
          <div className="w-16 h-16 bg-muted rounded-xl flex items-center justify-center">
            {isDragging ? (
              <Upload className="w-8 h-8 text-primary" />
            ) : (
              <ImageIcon className="w-8 h-8 text-muted-foreground" />
            )}
          </div>
          <div>
            <p className="font-medium text-foreground">
              {isDragging ? 'Drop image here' : 'Upload Crop Image'}
            </p>
            <p className="text-sm text-muted-foreground mt-1">
              Drag & drop or click to browse
            </p>
          </div>
          <p className="text-xs text-muted-foreground">
            Supports: JPG, PNG, WebP (Max 10MB)
          </p>
        </div>
      </label>
    </div>
  );
}
