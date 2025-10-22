"use client";

import { useCallback, useState, useEffect } from "react";
import { useDropzone, FileWithPath } from "react-dropzone";
import { toast } from "sonner";
import { uploadImage } from "@/api/upload";
import { Loader2, UploadCloud, X } from "lucide-react";
import { Button } from "../ui/button";

interface FileUploadProps {
  value: string[];
  onChange: (urls: string[]) => void;
}

export function FileUpload({ value, onChange }: FileUploadProps) {
  const [isUploading, setIsUploading] = useState(false);
  const [previews, setPreviews] = useState<string[]>(value || []);

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

        const nonTempPreviews = (value || []).filter(p => !tempUrls.includes(p));
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
  });

  const handleRemove = (urlToRemove: string) => {
    const updatedPreviews = previews.filter((url) => url !== urlToRemove);
    onChange(updatedPreviews);
  };

  return (
    <div>
      {previews && previews.length > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3 mb-4">
          {previews.map((url, index) => (
            <div
              key={url || index}
              className="w-full aspect-video bg-gray-100 rounded-md overflow-hidden relative"
            >
              <img
                src={url}
                alt={`Preview ${index + 1}`}
                className="w-full h-full object-cover rounded-md"
              />
              <Button
                type="button"
                variant="destructive"
                size="icon"
                className="absolute top-1 right-1 h-6 w-6 rounded-full"
                onClick={() => handleRemove(url)}
                disabled={isUploading}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          ))}
          {isUploading && (
             <div className="w-full aspect-video bg-gray-100 rounded-md overflow-hidden relative flex items-center justify-center border-2 border-dashed">
                <Loader2 className="h-8 w-8 animate-spin text-gray-500" />
            </div>
          )}
        </div>
      )}

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
            <span className="font-semibold text-blue-500">Click to upload more</span>{" "}
            or drag and drop
          </p>
        </div>
      </div>
    </div>
  );
}
