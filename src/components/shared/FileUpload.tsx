"use client";

import { useCallback, useState, useEffect } from "react";
import { useDropzone, FileWithPath } from "react-dropzone";
import { toast } from "sonner";
import { uploadImage } from "@/api/upload";
import { Loader2, UploadCloud, X } from "lucide-react";
import { Button } from "../ui/button";
import {
  Dialog,
  DialogContent,
  DialogTrigger,
  DialogTitle,
} from "@/components/ui/dialog";
import { VisuallyHidden } from "@radix-ui/react-visually-hidden";

interface FileUploadProps {
  value: string[];
  onChange: (urls: string[]) => void;
  disabled?: boolean;
}

export function FileUpload({ value, onChange, disabled = false }: FileUploadProps) {
  const [isUploading, setIsUploading] = useState(false);
  const [previews, setPreviews] = useState<string[]>(value || []);
  const [zoomedImage, setZoomedImage] = useState<string | null>(null);

  useEffect(() => {
    setPreviews(value || []);
  }, [value]);

  const onDrop = useCallback(
    async (acceptedFiles: FileWithPath[]) => {
      if (acceptedFiles.length === 0) return;

      setIsUploading(true);
      toast.info(`Uploading ${acceptedFiles.length} image(s)...`);

      const tempUrls = acceptedFiles.map((file) => URL.createObjectURL(file));
      const currentUrls = value || [];
      onChange([...currentUrls, ...tempUrls]);

      try {
        const uploadPromises = acceptedFiles.map((file) => uploadImage(file));
        const finalUrls = await Promise.all(uploadPromises);

        const nonTempPreviews = (value || []).filter((p) => !tempUrls.includes(p));
        onChange([...nonTempPreviews, ...finalUrls]);

        toast.success("All uploads successful!");
      } catch (error) {
        toast.error("An error occurred during upload. Please try again.");
        const nonTempPreviews = (value || []).filter((p) => !tempUrls.includes(p));
        onChange(nonTempPreviews);
      } finally {
        setIsUploading(false);
        tempUrls.forEach((url) => URL.revokeObjectURL(url));
      }
    },
    [onChange, value]
  );

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    multiple: true,
    accept: { "image/*": [".png", ".gif", ".jpeg", ".jpg"] },
    disabled: disabled || isUploading,
  });

  const handleRemove = (urlToRemove: string) => {
    const updatedPreviews = previews.filter((url) => url !== urlToRemove);
    onChange(updatedPreviews);
  };

  return (
    <div>
      {previews && previews.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-5 mb-6">
          {previews.map((url, index) => (
            <Dialog key={url || index} onOpenChange={(open) => !open && setZoomedImage(null)}>
              <DialogTrigger asChild>
                <div className="relative w-full aspect-video bg-muted/50 rounded-lg overflow-hidden group cursor-pointer border-2 border-border hover:border-primary/50 transition-all duration-300 shadow-sm hover:shadow-md">
                  <img
                    src={url}
                    alt={`Preview ${index + 1}`}
                    className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-110"
                    onClick={() => setZoomedImage(url)}
                  />
                  <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors duration-300" />
                  <Button
                    type="button"
                    variant="destructive"
                    size="icon"
                    className="absolute top-2 right-2 h-8 w-8 rounded-full z-10 shadow-lg opacity-0 group-hover:opacity-100 transition-opacity duration-200 hover:scale-110"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleRemove(url);
                    }}
                    disabled={disabled || isUploading}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              </DialogTrigger>

              <DialogContent className="max-w-4xl p-0 bg-transparent border-none shadow-none">
                <VisuallyHidden>
                  <DialogTitle>Image preview</DialogTitle>
                </VisuallyHidden>
                <img
                  src={zoomedImage || url}
                  alt="Zoomed preview"
                  className="w-full h-auto max-h-[90vh] rounded-lg object-contain"
                />
              </DialogContent>
            </Dialog>
          ))}

          {isUploading && (
            <div className="w-full aspect-video bg-muted/50 rounded-lg overflow-hidden relative flex items-center justify-center border-2 border-dashed border-primary/30">
              <div className="flex flex-col items-center gap-2">
                <Loader2 className="h-10 w-10 animate-spin text-primary" />
                <p className="text-xs text-muted-foreground">Uploading...</p>
              </div>
            </div>
          )}
        </div>
      )}

      {!disabled && (
        <div
          {...getRootProps()}
          className={`relative border-2 border-dashed rounded-lg p-10 sm:p-12 text-center cursor-pointer transition-all duration-300 ${
            isDragActive
              ? "border-primary bg-primary/5 scale-[1.02] shadow-lg"
              : "border-border hover:border-primary/50 hover:bg-muted/30 hover:shadow-md"
          }`}
        >
          <input {...getInputProps()} />
          <div className="flex flex-col items-center justify-center gap-3">
            <div className={`p-4 rounded-full bg-muted transition-colors duration-300 ${
              isDragActive ? "bg-primary/10" : ""
            }`}>
              <UploadCloud className={`h-12 w-12 transition-colors duration-300 ${
                isDragActive ? "text-primary" : "text-muted-foreground"
              }`} />
            </div>
            <div className="space-y-1">
              <p className="text-base font-semibold text-foreground">
                <span className="text-primary">Click to upload more</span> or drag and drop
              </p>
              <p className="text-sm text-muted-foreground">
                PNG, JPG, GIF up to 10MB
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
