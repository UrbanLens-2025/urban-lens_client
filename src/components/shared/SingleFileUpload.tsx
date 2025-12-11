"use client";

import { useCallback, useState, useRef } from "react";
import { useDropzone, FileWithPath } from "react-dropzone";
import { toast } from "sonner";
import { uploadImage } from "@/api/upload";
import { Loader2, UploadCloud, X, RefreshCw } from "lucide-react";
import { Button } from "../ui/button";
import { cn } from "@/lib/utils";
import {
  Dialog,
  DialogContent,
  DialogTitle,
  DialogTrigger,
} from "../ui/dialog";
import { VisuallyHidden } from "@radix-ui/react-visually-hidden";

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
        toast.success("Image replaced successfully!");
      } catch (error) {
        toast.error("An error occurred during upload. Please try again.");
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
    accept: { "image/*": [".png", ".gif", ".jpeg", ".jpg"] },
    noClick: !!value, // Disable click when image exists, we'll handle it manually
    noKeyboard: !!value,
  });

  const handleRemove = () => {
    onChange(undefined);
  };

  if (value) {
    return (
      <div className="w-full space-y-3">
        <div className="relative w-full aspect-square min-h-[200px] sm:min-h-[220px] bg-muted/50 rounded-lg overflow-hidden border-2 border-border transition-all duration-300 shadow-sm">
          {/* Image Preview - Show new image while uploading, old image otherwise */}
          <Dialog onOpenChange={(open) => !open && setZoomedImage(null)}>
            <DialogTrigger asChild>
              <div className="relative w-full h-full group cursor-pointer hover:border-primary/50 transition-all duration-300">
                <img
                  src={uploadingPreview || value}
                  alt="Preview"
                  className={cn(
                    "w-full h-full object-cover transition-all duration-300",
                    !isUploading && "group-hover:scale-105",
                    isUploading && "opacity-60"
                  )}
                />
                {!isUploading && (
                  <>
                    <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors duration-300" />
                    <Button
                      type="button"
                      variant="destructive"
                      size="icon"
                      className="absolute top-2 right-2 h-7 w-7 rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-200 hover:scale-110 shadow-lg"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleRemove();
                      }}
                    >
                      <X className="h-3.5 w-3.5" />
                    </Button>
                  </>
                )}
              </div>
            </DialogTrigger>
            <DialogContent className="max-w-4xl p-0 bg-transparent border-none shadow-none">
              <VisuallyHidden>
                <DialogTitle>Image preview</DialogTitle>
              </VisuallyHidden>
              <img
                src={uploadingPreview || value}
                alt="Zoomed preview"
                className="w-full h-auto max-h-[90vh] rounded-lg object-contain"
              />
            </DialogContent>
          </Dialog>

          {/* Uploading Overlay */}
          {isUploading && (
            <div className="absolute inset-0 flex flex-col items-center justify-center bg-background/90 backdrop-blur-sm z-10 rounded-lg">
              <div className="flex flex-col items-center gap-3">
                <div className="relative">
                  <Loader2 className="h-10 w-10 animate-spin text-primary" />
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="h-6 w-6 rounded-full bg-primary/20 animate-pulse" />
                  </div>
                </div>
                <div className="text-center space-y-1">
                  <p className="text-sm font-semibold text-foreground">Replacing image...</p>
                  <p className="text-xs text-muted-foreground">Please wait</p>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Replace button - disabled during upload */}
        {!isUploading && (
          <div
            {...getRootProps()}
            className={cn(
              "relative border-2 border-dashed rounded-lg p-3 text-center cursor-pointer transition-all duration-300",
              isDragActive
                ? "border-primary bg-primary/5 scale-[1.01] shadow-md"
                : "border-border hover:border-primary/50 hover:bg-muted/30"
            )}
            onClick={(e) => {
              e.stopPropagation();
              if (!isUploading) {
                open();
              }
            }}
          >
            <input {...getInputProps()} disabled={isUploading} />
            <div className="flex items-center justify-center gap-2 text-sm">
              <RefreshCw className={cn(
                "h-4 w-4 transition-transform duration-300",
                isDragActive && "animate-spin"
              )} />
              <span className="text-muted-foreground font-medium">
                {isDragActive ? "Drop to replace" : "Click to replace image"}
              </span>
            </div>
          </div>
        )}
      </div>
    );
  }

  return (
    <div
      {...getRootProps()}
      className={cn(
        "relative border-2 border-dashed rounded-lg p-6 sm:p-8 text-center cursor-pointer transition-all duration-300 min-h-[200px] sm:min-h-[220px] flex items-center justify-center",
        isDragActive
          ? "border-primary bg-primary/5 scale-[1.01] shadow-md"
          : "border-border hover:border-primary/50 hover:bg-muted/30 hover:shadow-sm",
        isUploading && "opacity-50 cursor-not-allowed"
      )}
    >
      <input {...getInputProps()} disabled={isUploading} />
      {isUploading ? (
        <div className="flex flex-col items-center justify-center gap-3 w-full">
          <div className="relative">
            <Loader2 className="h-10 w-10 animate-spin text-primary" />
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="h-6 w-6 rounded-full bg-primary/20 animate-pulse" />
            </div>
          </div>
          <div className="text-center space-y-1">
            <p className="text-sm font-semibold text-foreground">Uploading...</p>
            <p className="text-xs text-muted-foreground">Please wait</p>
          </div>
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center gap-3 w-full">
          <div className={cn(
            "p-3 rounded-full bg-muted transition-all duration-300",
            isDragActive && "bg-primary/10 scale-110"
          )}>
            <UploadCloud className={cn(
              "h-8 w-8 sm:h-10 sm:w-10 transition-colors duration-300",
              isDragActive ? "text-primary" : "text-muted-foreground"
            )} />
          </div>
          <div className="space-y-1">
            <p className="text-sm font-semibold text-foreground">
              <span className="text-primary">Click to upload</span> or drag and drop
            </p>
            <p className="text-xs text-muted-foreground">
              PNG, JPG, GIF up to 10MB
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
