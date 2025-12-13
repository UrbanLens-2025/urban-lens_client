'use client';

import { useCallback, useState, useRef } from 'react';
import { useDropzone, FileWithPath } from 'react-dropzone';
import { toast } from 'sonner';
import { uploadImage } from '@/api/upload';
import { Loader2, UploadCloud, X, RefreshCw } from 'lucide-react';
import { Button } from '../ui/button';
import { cn } from '@/lib/utils';
import {
  Dialog,
  DialogContent,
  DialogTitle,
  DialogTrigger,
} from '../ui/dialog';
import { VisuallyHidden } from '@radix-ui/react-visually-hidden';

interface SingleFileUploadProps {
  value: string | null | undefined;
  onChange: (url: string | undefined) => void;
}

export function SingleFileUpload({ value, onChange }: SingleFileUploadProps) {
  const [isUploading, setIsUploading] = useState(false);
  const [zoomedImage, setZoomedImage] = useState<string | null>(null);
  const [uploadingPreview, setUploadingPreview] = useState<string | null>(null);

  const onDrop = useCallback(
    async (acceptedFiles: FileWithPath[]) => {
      if (acceptedFiles.length === 0) return;

      const file = acceptedFiles[0];
      if (!file) return;

      setIsUploading(true);
      const tempUrl = URL.createObjectURL(file);
      setUploadingPreview(tempUrl);
      // Don't update the main value yet, show preview while uploading

      try {
        const finalUrl = await uploadImage(file);
        onChange(finalUrl);
        setUploadingPreview(null);
      } catch (error) {
        toast.error('An error occurred during upload. Please try again.');
        setUploadingPreview(null);
        // Keep the old image if upload fails
      } finally {
        setIsUploading(false);
        URL.revokeObjectURL(tempUrl);
      }
    },
    [onChange]
  );

  const { getRootProps, getInputProps, isDragActive, open } = useDropzone({
    onDrop,
    multiple: false,
    accept: { 'image/*': ['.png', '.gif', '.jpeg', '.jpg'] },
    noClick: !!value, // Disable click when image exists, we'll handle it manually
    noKeyboard: !!value,
  });

  const handleRemove = () => {
    onChange(undefined);
  };

  if (value) {
    return (
      <div className='w-full space-y-2'>
        <div className='relative inline-block max-w-sm w-full bg-muted/30 rounded-lg overflow-hidden border border-border transition-all duration-300 group'>
          {/* Image Preview - Show new image while uploading, old image otherwise */}
          <Dialog onOpenChange={(open) => !open && setZoomedImage(null)}>
            <DialogTrigger asChild>
              <button
                type='button'
                className='relative w-full h-auto max-h-[100px] sm:max-h-[200px] block cursor-pointer focus:outline-none focus:ring-2 focus:ring-primary/50 focus:ring-offset-2 rounded-lg overflow-hidden'
              >
                <img
                  src={uploadingPreview || value}
                  alt='Preview'
                  className={cn(
                    'w-full h-full object-contain transition-all duration-300',
                    !isUploading && 'group-hover:opacity-90',
                    isUploading && 'opacity-50'
                  )}
                />
              </button>
            </DialogTrigger>
            <DialogContent className='max-w-4xl p-0 bg-transparent border-none shadow-none'>
              <VisuallyHidden>
                <DialogTitle>Image preview</DialogTitle>
              </VisuallyHidden>
              <img
                src={uploadingPreview || value}
                alt='Zoomed preview'
                className='w-full h-auto max-h-[90vh] rounded-lg object-contain'
              />
            </DialogContent>
          </Dialog>

          {/* Action buttons overlay */}
          {!isUploading && (
            <div className='absolute top-1.5 right-1.5 flex gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity duration-200'>
              <Button
                type='button'
                variant='secondary'
                size='icon'
                className='h-7 w-7 bg-background/90 backdrop-blur-sm hover:bg-background shadow-sm'
                onClick={(e) => {
                  e.stopPropagation();
                  open();
                }}
                title='Replace image'
              >
                <RefreshCw className='h-3.5 w-3.5' />
              </Button>
              <Button
                type='button'
                variant='destructive'
                size='icon'
                className='h-7 w-7 bg-background/90 backdrop-blur-sm hover:bg-destructive shadow-sm'
                onClick={(e) => {
                  e.stopPropagation();
                  handleRemove();
                }}
                title='Remove image'
              >
                <X className='h-3.5 w-3.5' />
              </Button>
            </div>
          )}

          {/* Uploading Overlay */}
          {isUploading && (
            <div className='absolute inset-0 flex flex-col items-center justify-center bg-background/95 backdrop-blur-sm z-10 rounded-lg'>
              <div className='flex flex-col items-center gap-2'>
                <Loader2 className='h-6 w-6 animate-spin text-primary' />
                <p className='text-xs font-medium text-foreground'>
                  Replacing...
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <div
      {...getRootProps()}
      className={cn(
        'relative border-2 border-dashed rounded-lg p-6 text-center cursor-pointer transition-all duration-300 max-w-sm w-full min-h-[96px] sm:min-h-[120px] flex items-center justify-center',
        isDragActive
          ? 'border-primary bg-primary/5 scale-[1.01] shadow-md'
          : 'border-border hover:border-primary/50 hover:bg-muted/30 hover:shadow-sm',
        isUploading && 'opacity-50 cursor-not-allowed'
      )}
    >
      <input {...getInputProps()} disabled={isUploading} />
      {isUploading ? (
        <div className='flex flex-col items-center justify-center gap-2 w-full'>
          <Loader2 className='h-6 w-6 animate-spin text-primary' />
          <p className='text-xs font-medium text-foreground'>Uploading...</p>
        </div>
      ) : (
        <div className='flex flex-col items-center justify-center gap-2.5 w-full'>
          <div
            className={cn(
              'p-2.5 rounded-lg bg-muted/50 transition-all duration-300',
              isDragActive && 'bg-primary/10 scale-105'
            )}
          >
            <UploadCloud
              className={cn(
                'h-5 w-5 transition-colors duration-300',
                isDragActive ? 'text-primary' : 'text-muted-foreground'
              )}
            />
          </div>
          <div className='space-y-0.5'>
            <p className='text-sm font-medium text-foreground'>
              <span className='text-primary'>Click to upload</span> or drag and
              drop
            </p>
            <p className='text-xs text-muted-foreground'>
              PNG, JPG, GIF up to 10MB
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
