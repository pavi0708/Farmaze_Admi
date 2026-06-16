import React, { useState, useCallback, useRef } from 'react';
import { Camera, Upload, X, AlertCircle } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';

interface ImageFile {
  file: File;
  preview: string;
}

interface ImageUploaderProps {
  images: ImageFile[];
  onChange: (images: ImageFile[]) => void;
  maxImages?: number;
  maxSizeMB?: number;
}

const ACCEPTED_TYPES = ['image/jpeg', 'image/jpg', 'image/png'];

const formatFileSize = (bytes: number): string => {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
};

const ImageUploader: React.FC<ImageUploaderProps> = ({
  images,
  onChange,
  maxImages = 5,
  maxSizeMB = 10,
}) => {
  const [error, setError] = useState<string | null>(null);
  const [dragActive, setDragActive] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const maxSizeBytes = maxSizeMB * 1024 * 1024;

  const validateAndAddFiles = useCallback((files: FileList | File[]) => {
    setError(null);
    const fileArray = Array.from(files);
    const remaining = maxImages - images.length;

    if (remaining <= 0) {
      setError(`Maximum ${maxImages} images allowed.`);
      return;
    }

    const validFiles: ImageFile[] = [];
    for (const file of fileArray.slice(0, remaining)) {
      if (!ACCEPTED_TYPES.includes(file.type)) {
        setError(`${file.name} is not a supported format. Use JPG or PNG.`);
        continue;
      }
      if (file.size > maxSizeBytes) {
        setError(`${file.name} exceeds ${maxSizeMB}MB limit.`);
        continue;
      }
      validFiles.push({
        file,
        preview: URL.createObjectURL(file),
      });
    }

    if (validFiles.length > 0) {
      onChange([...images, ...validFiles]);
    }
  }, [images, maxImages, maxSizeBytes, maxSizeMB, onChange]);

  const handleFileInput = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      validateAndAddFiles(e.target.files);
      e.target.value = '';
    }
  }, [validateAndAddFiles]);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files) {
      validateAndAddFiles(e.dataTransfer.files);
    }
  }, [validateAndAddFiles]);

  const handleRemove = useCallback((index: number) => {
    const updated = [...images];
    URL.revokeObjectURL(updated[index].preview);
    updated.splice(index, 1);
    onChange(updated);
    setError(null);
  }, [images, onChange]);

  const canAddMore = images.length < maxImages;

  return (
    <div className="space-y-3">
      <label className="text-sm font-medium text-gray-700">Add Photos</label>

      <div className="flex flex-wrap gap-3">
        {/* Existing image thumbnails */}
        {images.map((img, index) => (
          <div key={index} className="relative group w-24 h-24 rounded-lg overflow-hidden border">
            <img
              src={img.preview}
              alt={img.file.name}
              className="w-full h-full object-cover"
            />
            <button
              type="button"
              onClick={() => handleRemove(index)}
              className="absolute top-1 right-1 bg-black/60 text-white rounded-full p-0.5 opacity-0 group-hover:opacity-100 transition-opacity"
            >
              <X size={14} />
            </button>
            <div className="absolute bottom-0 left-0 right-0 bg-black/50 text-white text-[10px] px-1 py-0.5 truncate">
              {formatFileSize(img.file.size)}
            </div>
          </div>
        ))}

        {/* Add button */}
        {canAddMore && (
          <div
            className={`
              w-24 h-24 rounded-lg border-2 border-dashed flex flex-col items-center justify-center
              cursor-pointer transition-colors
              ${dragActive ? 'border-primary bg-primary/5' : 'border-gray-300 hover:border-gray-400 hover:bg-gray-50'}
            `}
            onClick={() => fileInputRef.current?.click()}
            onDragEnter={(e) => { e.preventDefault(); setDragActive(true); }}
            onDragLeave={(e) => { e.preventDefault(); setDragActive(false); }}
            onDragOver={(e) => e.preventDefault()}
            onDrop={handleDrop}
          >
            <Camera size={20} className="text-gray-400 mb-1" />
            <span className="text-xs text-gray-500">
              {images.length === 0 ? 'Add Photo' : 'More'}
            </span>
          </div>
        )}
      </div>

      <input
        ref={fileInputRef}
        type="file"
        accept="image/jpeg,image/jpg,image/png"
        multiple
        onChange={handleFileInput}
        className="hidden"
      />

      <p className="text-xs text-gray-500">
        Up to {maxImages} images &middot; JPG, PNG &middot; Max {maxSizeMB}MB each
      </p>

      {error && (
        <Alert variant="destructive" className="py-2">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription className="text-sm">{error}</AlertDescription>
        </Alert>
      )}
    </div>
  );
};

export default ImageUploader;
