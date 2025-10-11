"use client";

import { useCallback, useState, useEffect } from "react";
import { useDropzone, FileWithPath } from "react-dropzone";
import { toast } from "sonner";
import { uploadImage } from "@/api/upload";
import { Loader2, UploadCloud, X } from "lucide-react";
import { Button } from "../ui/button";

interface FileUploadProps {
  onUploadComplete: (url: string) => void;
  initialPreview?: string | null;
}

export function FileUpload({
  onUploadComplete,
  initialPreview,
}: FileUploadProps) {
  const [isUploading, setIsUploading] = useState(false);
  const [preview, setPreview] = useState<string | null>(initialPreview || null);

  useEffect(() => {
    setPreview(initialPreview || null);
  }, [initialPreview]);

  const onDrop = useCallback(
    async (acceptedFiles: FileWithPath[]) => {
      const file = acceptedFiles[0];
      if (!file) return;

      const tempUrl = URL.createObjectURL(file);
      setPreview(tempUrl);

      setIsUploading(true);
      toast.info("Uploading image...");

      try {
        const finalUrl = await uploadImage(file);

        onUploadComplete(finalUrl);

        setPreview(finalUrl);

        toast.success("Upload successful!");
      } catch (error) {
        toast.error("Upload failed. Please try again.");
        setPreview(initialPreview || null);
      } finally {
        setIsUploading(false);
        URL.revokeObjectURL(tempUrl);
      }
    },
    [onUploadComplete, initialPreview]
  );

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    multiple: false,
    accept: { "image/*": [".png", ".gif", ".jpeg", ".jpg"] },
  });

  if (preview) {
    return (
      <div className="w-full aspect-video bg-gray-100 rounded-md overflow-hidden relative my-2">
        <img
          src={preview}
          alt="Preview"
          className="w-full h-full object-cover rounded-md"
        />
        <Button
          type="button"
          variant="destructive"
          size="icon"
          className="absolute top-1 right-1 h-6 w-6 rounded-full"
          onClick={() => {
            setPreview(null);
            onUploadComplete("");
          }}
          disabled={isUploading}
        >
          <X className="h-4 w-4" />
        </Button>
        {isUploading && (
          <div className="absolute inset-0 bg-black/50 flex items-center justify-center rounded-md">
            <Loader2 className="h-8 w-8 animate-spin text-white" />
          </div>
        )}
      </div>
    );
  }

  // Nếu không có preview, hiển thị ô kéo-thả
  return (
    <div
      {...getRootProps()}
      className={`relative border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors
        ${
          isDragActive
            ? "border-blue-500 bg-blue-50"
            : "border-gray-300 hover:border-gray-400"
        }
      `}
    >
      <input {...getInputProps()} />
      <div className="flex flex-col items-center justify-center">
        <UploadCloud className="h-10 w-10 text-gray-400" />
        <p className="mt-2 text-sm text-muted-foreground">
          <span className="font-semibold text-blue-500">Click to upload</span>{" "}
          or drag and drop
        </p>
      </div>
    </div>
  );
}
