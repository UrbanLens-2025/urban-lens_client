"use client";

import { useCallback, useState } from "react";
import { useDropzone, FileWithPath } from "react-dropzone";
import { toast } from "sonner";
import { uploadImage } from "@/api/upload";
import { Loader2, UploadCloud, X } from "lucide-react";
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

  const onDrop = useCallback(
    async (acceptedFiles: FileWithPath[]) => {
      if (acceptedFiles.length === 0) return;

      const file = acceptedFiles[0];
      if (!file) return;

      setIsUploading(true);
      toast.info(`Uploading ${file.name}...`);

      const tempUrl = URL.createObjectURL(file);
      onChange(tempUrl);

      try {
        const finalUrl = await uploadImage(file);
        onChange(finalUrl);
        toast.success("Upload successful!");
      } catch (error) {
        toast.error("An error occurred during upload. Please try again.");
        onChange(undefined);
      } finally {
        setIsUploading(false);
        URL.revokeObjectURL(tempUrl);
      }
    },
    [onChange]
  );

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    multiple: false,
    accept: { "image/*": [".png", ".gif", ".jpeg", ".jpg"] },
  });

  const handleRemove = () => {
    onChange(undefined);
  };

  if (value) {
    return (
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3 mb-4">
        <Dialog onOpenChange={(open) => !open && setZoomedImage(null)}>
          <DialogTrigger asChild>
            <div className="relative w-full aspect-video bg-gray-100 rounded-md overflow-hidden group cursor-pointer">
              <img
                src={value}
                alt="Preview"
                className="w-full h-full object-cover rounded-md"
              />
              <Button
                type="button"
                variant="destructive"
                size="icon"
                className="absolute top-1 right-1 h-6 w-6 rounded-full opacity-0 group-hover:opacity-100"
                onClick={handleRemove}
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
              src={value}
              alt="Zoomed preview"
              className="w-full h-auto max-h-[90vh] rounded-lg object-contain"
            />
          </DialogContent>
        </Dialog>

        {isUploading && (
          <div className="w-full aspect-video bg-gray-100 rounded-md overflow-hidden relative flex items-center justify-center border-2 border-dashed">
            <Loader2 className="h-8 w-8 animate-spin text-gray-500" />
          </div>
        )}
      </div>
    );
  }

  return (
    <div
      {...getRootProps()}
      className={cn(
        "relative border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors",
        isDragActive
          ? "border-primary bg-muted"
          : "border-border hover:border-muted-foreground"
      )}
    >
      <input {...getInputProps()} />
      <div className="flex flex-col items-center justify-center">
        <UploadCloud className="h-10 w-10 text-muted-foreground" />
        <p className="mt-2 text-sm text-muted-foreground">
          <span className="font-semibold text-primary">Click to upload</span> or
          drag and drop
        </p>
      </div>
    </div>
  );
}
