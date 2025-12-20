'use client';

import { useCallback, useState, useEffect } from 'react';
// 1. Thêm import FileRejection để định nghĩa kiểu dữ liệu
import { useDropzone, FileWithPath, FileRejection } from 'react-dropzone';
import { toast } from 'sonner';
import { uploadImage } from '@/api/upload';
import { Loader2, UploadCloud, X } from 'lucide-react';
import { Button } from '../ui/button';
import { cn } from '@/lib/utils';
import {
  Dialog,
  DialogContent,
  DialogTrigger,
  DialogTitle,
} from '@/components/ui/dialog';
import { VisuallyHidden } from '@radix-ui/react-visually-hidden';

interface FileUploadProps {
  value: string[];
  onChange: (urls: string[]) => void;
  disabled?: boolean;
  onUploadingChange?: (isUploading: boolean) => void;
}

export function FileUpload({
  value,
  onChange,
  disabled = false,
  onUploadingChange,
}: FileUploadProps) {
  const [isUploading, setIsUploading] = useState(false);
  const [previews, setPreviews] = useState<string[]>(value || []);
  const [zoomedImage, setZoomedImage] = useState<string | null>(null);
  const [uploadingUrls, setUploadingUrls] = useState<Set<string>>(new Set());

  useEffect(() => {
    setPreviews(value || []);
  }, [value]);

  useEffect(() => {
    onUploadingChange?.(isUploading);
  }, [isUploading, onUploadingChange]);

  // --- CẬP NHẬT MỚI: Thêm tham số fileRejections ---
  const onDrop = useCallback(
    async (acceptedFiles: FileWithPath[], fileRejections: FileRejection[]) => {
      if (fileRejections.length > 0) {
        // Kiểm tra xem có lỗi "too-many-files" trong bất kỳ file nào không
        const isTooManyFiles = fileRejections.some((rejection) =>
          rejection.errors.some((error) => error.code === 'too-many-files')
        );

        if (isTooManyFiles) {
          toast.error('Lỗi: Bạn chỉ được tải lên tối đa 5 hình ảnh một lần.');
          return;
        }

        // Nếu không phải lỗi quá số lượng, lấy lỗi của file đầu tiên để báo (tránh spam)
        const firstRejection = fileRejections[0];
        const firstError = firstRejection.errors[0];

        if (firstError.code === 'file-invalid-type') {
          toast.error(
            `Lỗi: File "${firstRejection.file.name}" không đúng định dạng ảnh.`
          );
        } else if (firstError.code === 'file-too-large') {
          toast.error(
            `Lỗi: File "${firstRejection.file.name}" quá lớn (Max 10MB).`
          );
        } else {
          toast.error(`Lỗi: ${firstError.message}`);
        }

        return;
      }

      // 2. Kiểm tra thủ công (Fallback)
      if (acceptedFiles.length > 5) {
        toast.error('Bạn chỉ có thể tải lên tối đa 5 hình ảnh cùng một lúc.');
        return;
      }

      if (acceptedFiles.length === 0) return;

      setIsUploading(true);
      const tempUrls = acceptedFiles.map((file) => URL.createObjectURL(file));
      const currentUrls = value || [];

      setUploadingUrls(new Set(tempUrls));
      onChange([...currentUrls, ...tempUrls]);

      try {
        const uploadPromises = acceptedFiles.map((file) => uploadImage(file));
        const finalUrls = await Promise.all(uploadPromises);

        const nonTempPreviews = (value || []).filter(
          (p) => !tempUrls.includes(p)
        );
        onChange([...nonTempPreviews, ...finalUrls]);
        setUploadingUrls(new Set());
        // Thông báo thành công (tuỳ chọn)
        toast.success(`Uploaded ${finalUrls.length} images.`);
      } catch (error) {
        toast.error('An error occurred during upload. Please try again.');
        const nonTempPreviews = (value || []).filter(
          (p) => !tempUrls.includes(p)
        );
        onChange(nonTempPreviews);
        setUploadingUrls(new Set());
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
    maxFiles: 5, // Quan trọng: Prop này báo cho thư viện biết giới hạn
    maxSize: 10 * 1024 * 1024, // 10MB (Khớp với text hiển thị)
    accept: { 'image/*': ['.png', '.gif', '.jpeg', '.jpg'] },
    disabled: disabled || isUploading,
  });

  const handleRemove = (urlToRemove: string) => {
    const updatedPreviews = previews.filter((url) => url !== urlToRemove);
    onChange(updatedPreviews);
  };

  return (
    <div>
      {/* Phần hiển thị ảnh preview giữ nguyên */}
      {previews && previews.length > 0 && (
        <div className='grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-5 mb-6'>
          {previews.map((url, index) => {
            const isUploadingThis = uploadingUrls.has(url);
            return (
              <div
                key={url || index}
                className='relative w-full aspect-square min-h-[150px] sm:min-h-[180px] bg-muted/50 rounded-lg overflow-hidden border-2 border-border transition-all duration-300 shadow-sm'
              >
                <Dialog onOpenChange={(open) => !open && setZoomedImage(null)}>
                  <DialogTrigger asChild>
                    <div
                      className={cn(
                        'relative w-full h-full group transition-all duration-300',
                        !isUploadingThis &&
                          'cursor-pointer hover:border-primary/50'
                      )}
                    >
                      <img
                        src={url}
                        alt={`Preview ${index + 1}`}
                        className={cn(
                          'w-full h-full object-contain transition-all duration-300',
                          !isUploadingThis && 'group-hover:scale-105',
                          isUploadingThis && 'opacity-60'
                        )}
                        onClick={() => !isUploadingThis && setZoomedImage(url)}
                      />
                      {!isUploadingThis && (
                        <>
                          <div className='absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors duration-300' />
                          <Button
                            type='button'
                            variant='destructive'
                            size='icon'
                            className='absolute top-2 right-2 h-7 w-7 rounded-full z-10 shadow-lg opacity-0 group-hover:opacity-100 transition-opacity duration-200 hover:scale-110'
                            onClick={(e) => {
                              e.stopPropagation();
                              handleRemove(url);
                            }}
                            disabled={disabled || isUploading}
                          >
                            <X className='h-3.5 w-3.5' />
                          </Button>
                        </>
                      )}
                    </div>
                  </DialogTrigger>

                  <DialogContent className='max-w-4xl p-0 bg-transparent border-none shadow-none'>
                    <VisuallyHidden>
                      <DialogTitle>Image preview</DialogTitle>
                    </VisuallyHidden>
                    <img
                      src={zoomedImage || url}
                      alt='Zoomed preview'
                      className='w-full h-auto max-h-[90vh] rounded-lg object-contain'
                    />
                  </DialogContent>
                </Dialog>

                {isUploadingThis && (
                  <div className='absolute inset-0 flex flex-col items-center justify-center bg-background/90 backdrop-blur-sm z-10 rounded-lg pointer-events-none'>
                    <div className='flex flex-col items-center gap-3'>
                      <div className='relative'>
                        <Loader2 className='h-10 w-10 animate-spin text-primary' />
                      </div>
                      <div className='text-center space-y-1'>
                        <p className='text-sm font-semibold text-foreground'>
                          Uploading...
                        </p>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Phần Dropzone */}
      {!disabled && (
        <div
          {...getRootProps()}
          className={cn(
            'relative border-2 border-dashed rounded-lg p-6 sm:p-8 text-center cursor-pointer transition-all duration-300 min-h-[150px] sm:min-h-[180px] flex items-center justify-center',
            isDragActive
              ? 'border-primary bg-primary/5 scale-[1.01] shadow-md'
              : 'border-border hover:border-primary/50 hover:bg-muted/30 hover:shadow-sm',
            isUploading && 'opacity-50 cursor-not-allowed'
          )}
        >
          <input {...getInputProps()} disabled={isUploading} />
          {isUploading ? (
            <div className='flex flex-col items-center justify-center gap-3 w-full'>
              <Loader2 className='h-10 w-10 animate-spin text-primary' />
              <div className='text-center space-y-1'>
                <p className='text-sm font-semibold text-foreground'>
                  Uploading images...
                </p>
                <p className='text-xs text-muted-foreground'>Please wait</p>
              </div>
            </div>
          ) : (
            <div className='flex flex-col items-center justify-center gap-3 w-full'>
              <div
                className={cn(
                  'p-3 rounded-full bg-muted transition-all duration-300',
                  isDragActive && 'bg-primary/10 scale-110'
                )}
              >
                <UploadCloud
                  className={cn(
                    'h-8 w-8 sm:h-10 sm:w-10 transition-colors duration-300',
                    isDragActive ? 'text-primary' : 'text-muted-foreground'
                  )}
                />
              </div>
              <div className='space-y-1'>
                <p className='text-sm font-semibold text-foreground'>
                  <span className='text-primary'>Click to upload more</span> or
                  drag and drop
                </p>
                <p className='text-xs text-muted-foreground'>
                  PNG, JPG, GIF up to 10MB (Max 5 images per upload)
                </p>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
