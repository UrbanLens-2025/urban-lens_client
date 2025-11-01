"use client";

import * as React from "react";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { VisuallyHidden } from "@radix-ui/react-visually-hidden";

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
      <DialogContent className="max-w-[90vw] max-h-[90vh] p-0 flex items-center justify-center bg-transparent border-none shadow-none">
        <VisuallyHidden>
          <DialogTitle>Image preview</DialogTitle>
        </VisuallyHidden>
        <div className="relative w-full h-full">
          <img
            src={src}
            alt={alt}
            className="max-w-full max-h-full object-contain rounded-lg"
          />
        </div>
      </DialogContent>
    </Dialog>
  );
}
