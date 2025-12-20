'use client';

import * as React from 'react';
import { Dialog, DialogContent, DialogTitle, DialogClose } from '@/components/ui/dialog';
import { VisuallyHidden } from '@radix-ui/react-visually-hidden';
import { X } from 'lucide-react';

interface ImageViewerProps {
  src: string;
  alt: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function ImageViewer({
  src,
  alt,
  open,
  onOpenChange,
}: ImageViewerProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent 
        className='max-w-[90vw] max-h-[90vh] p-0 flex items-center justify-center bg-transparent border-none shadow-none'
        showCloseButton={false}
      >
        <VisuallyHidden>
          <DialogTitle>Image preview</DialogTitle>
        </VisuallyHidden>
        <div className='relative w-full h-full'>
          <img
            src={src}
            alt={alt}
            className='max-w-full max-h-full object-contain rounded-lg'
          />
          <DialogClose className='absolute top-4 right-4 bg-background/90 hover:bg-background border border-border rounded-full p-2 shadow-lg opacity-100 transition-opacity hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2'>
            <X className='h-4 w-4' />
            <span className='sr-only'>Close</span>
          </DialogClose>
        </div>
      </DialogContent>
    </Dialog>
  );
}
