"use client";

import { useCallback, useState } from "react";
import { useDropzone, FileWithPath } from "react-dropzone";
import { toast } from "sonner";
import { Image as ImageIcon, Loader2, UploadCloud, Video } from "lucide-react";
import { uploadImage } from "@/api/upload";

interface FileUploadProps {
  onUploadComplete: (url: string) => void; 
  multiple?: boolean;
  accept?: Record<string, string[]>;
}

const defaultAccept = { "image/*": [".png", ".gif", ".jpeg", ".jpg"] };

export function FileUpload({ 
  onUploadComplete, 
  multiple = false,
  accept = defaultAccept 
}: FileUploadProps) {
  const [isUploading, setIsUploading] = useState(false);

  const onDrop = useCallback(async (acceptedFiles: FileWithPath[]) => {
    if (!acceptedFiles.length) return;

    setIsUploading(true);
    toast.info(`Uploading ${acceptedFiles.length} file(s)...`);

    try {
      const uploadPromises = acceptedFiles.map(file => uploadImage(file));
      const urls = await Promise.all(uploadPromises);
      
      urls.forEach(url => onUploadComplete(url));
      toast.success("Upload successful!");

    } catch (error) {
      console.error("Upload failed:", error);
      toast.error("Upload failed. Please try again.");
    } finally {
      setIsUploading(false);
    }
  }, [onUploadComplete]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    multiple,
    accept,
  });

  return (
    <div
      {...getRootProps()}
      className={`relative border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors
        ${isDragActive ? "border-blue-500 bg-blue-50" : "border-gray-300 hover:border-gray-400"}
      `}
    >
      <input {...getInputProps()} />
      
      {isUploading ? (
        <div className="flex flex-col items-center justify-center">
            <Loader2 className="h-10 w-10 animate-spin text-gray-500" />
            <p className="mt-2 text-sm text-muted-foreground">Uploading...</p>
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center">
          <UploadCloud className="h-10 w-10 text-gray-400" />
          <p className="mt-2 text-sm text-muted-foreground">
            <span className="font-semibold text-blue-500">Click to upload</span> or drag and drop
          </p>
          <p className="text-xs text-muted-foreground">Images, Videos, GIFs...</p>
        </div>
      )}
    </div>
  );
}