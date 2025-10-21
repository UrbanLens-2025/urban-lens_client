"use client"

import { useCallback, useState, useEffect } from "react"
import { useDropzone, type FileWithPath } from "react-dropzone"
import { toast } from "sonner"
import { uploadImage } from "@/api/upload"
import { Loader2, UploadCloud, X } from "lucide-react"
import { Button } from "@/components/ui/button"

interface FileUploadProps {
  onUploadComplete: (urls: string[]) => void
  initialPreviews?: string[] | null
}

interface UploadingFile {
  id: string
  file: FileWithPath
  preview: string
  isUploading: boolean
  finalUrl?: string
}

export function FileUpload({ onUploadComplete, initialPreviews }: FileUploadProps) {
  const [uploadingFiles, setUploadingFiles] = useState<UploadingFile[]>([])

  useEffect(() => {
    if (initialPreviews) {
      setUploadingFiles(
        initialPreviews.map((url, index) => ({
          id: `initial-${index}`,
          file: {} as FileWithPath,
          preview: url,
          isUploading: false,
          finalUrl: url,
        })),
      )
    }
  }, [initialPreviews])

  const onDrop = useCallback(
    async (acceptedFiles: FileWithPath[]) => {
      if (acceptedFiles.length === 0) return

      // Create temporary preview URLs for all files
      const newFiles: UploadingFile[] = acceptedFiles.map((file) => ({
        id: `${Date.now()}-${Math.random()}`,
        file,
        preview: URL.createObjectURL(file),
        isUploading: true,
      }))

      setUploadingFiles((prev) => [...prev, ...newFiles])

      // Upload each file
      for (const uploadingFile of newFiles) {
        try {
          const finalUrl = await uploadImage(uploadingFile.file)

          setUploadingFiles((prev) =>
            prev.map((f) => (f.id === uploadingFile.id ? { ...f, isUploading: false, finalUrl } : f)),
          )
        } catch (error) {
          toast.error(`Failed to upload ${uploadingFile.file.name}`)
          setUploadingFiles((prev) => prev.filter((f) => f.id !== uploadingFile.id))
        }
      }

      // Notify parent of all uploaded URLs
      const uploadedUrls = uploadingFiles.filter((f) => f.finalUrl).map((f) => f.finalUrl!)
      if (uploadedUrls.length > 0) {
        onUploadComplete(uploadedUrls)
      }
    },
    [uploadingFiles, onUploadComplete],
  )

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    multiple: true,
    accept: { "image/*": [".png", ".gif", ".jpeg", ".jpg"] },
  })

  const handleRemoveFile = (id: string) => {
    setUploadingFiles((prev) => {
      const updated = prev.filter((f) => f.id !== id)
      const remainingUrls = updated.filter((f) => f.finalUrl).map((f) => f.finalUrl!)
      onUploadComplete(remainingUrls)
      return updated
    })
  }

  if (uploadingFiles.length > 0) {
    return (
      <div className="w-full space-y-4">
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {uploadingFiles.map((uploadingFile) => (
            <div key={uploadingFile.id} className="relative aspect-square bg-gray-100 rounded-md overflow-hidden">
              <img
                src={uploadingFile.preview || "/placeholder.svg"}
                alt="Preview"
                className="w-full h-full object-cover rounded-md"
              />
              <Button
                type="button"
                variant="destructive"
                size="icon"
                className="absolute top-1 right-1 h-6 w-6 rounded-full"
                onClick={() => handleRemoveFile(uploadingFile.id)}
                disabled={uploadingFile.isUploading}
              >
                <X className="h-4 w-4" />
              </Button>
              {uploadingFile.isUploading && (
                <div className="absolute inset-0 bg-black/50 flex items-center justify-center rounded-md">
                  <Loader2 className="h-6 w-6 animate-spin text-white" />
                </div>
              )}
            </div>
          ))}
        </div>

        <div
          {...getRootProps()}
          className={`relative border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors
            ${isDragActive ? "border-blue-500 bg-blue-50" : "border-gray-300 hover:border-gray-400"}
          `}
        >
          <input {...getInputProps()} />
          <div className="flex flex-col items-center justify-center">
            <UploadCloud className="h-10 w-10 text-gray-400" />
            <p className="mt-2 text-sm text-muted-foreground">
              <span className="font-semibold text-blue-500">Click to upload more</span> or drag and drop
            </p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div
      {...getRootProps()}
      className={`relative border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors
        ${isDragActive ? "border-blue-500 bg-blue-50" : "border-gray-300 hover:border-gray-400"}
      `}
    >
      <input {...getInputProps()} />
      <div className="flex flex-col items-center justify-center">
        <UploadCloud className="h-10 w-10 text-gray-400" />
        <p className="mt-2 text-sm text-muted-foreground">
          <span className="font-semibold text-blue-500">Click to upload</span> or drag and drop
        </p>
      </div>
    </div>
  )
}
