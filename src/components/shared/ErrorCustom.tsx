'use client';

import { AlertCircle, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface ErrorCustomProps {
  title?: string;
  description?: string;
  /**
   * Hàm retry khi người dùng bấm nút "Thử lại".
   * Nếu không truyền, nút sẽ không hiển thị.
   */
  onRetry?: () => void;
  /**
   * Nếu true: chiếm full màn hình.
   */
  fullScreen?: boolean;
  className?: string;
}

export function ErrorCustom({
  title = 'Đã có lỗi xảy ra',
  description = 'Có lỗi trong quá trình tải dữ liệu. Vui lòng thử lại sau.',
  onRetry,
  fullScreen = true,
  className,
}: ErrorCustomProps) {
  const containerClass = fullScreen
    ? 'flex h-screen flex-col items-center justify-center'
    : 'flex flex-col items-center justify-center py-10';

  return (
    <div className={cn(containerClass, 'text-center', className)}>
      <div className='mb-4 rounded-full bg-destructive/10 p-3 shadow-sm'>
        <AlertCircle className='h-8 w-8 text-destructive' />
      </div>
      <h2 className='mb-1 text-lg font-semibold text-foreground'>{title}</h2>
      <p className='mb-4 max-w-md text-sm text-muted-foreground'>
        {description}
      </p>
      {onRetry && (
        <Button
          type='button'
          variant='outline'
          size='sm'
          onClick={onRetry}
          className='gap-2'
        >
          <RefreshCw className='h-4 w-4' />
          Thử lại
        </Button>
      )}
    </div>
  );
}

export default ErrorCustom;
