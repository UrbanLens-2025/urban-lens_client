'use client';

import { Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';

interface LoadingCustomProps {
  message?: string;
  /**
   * Nếu true: chiếm full màn hình (thường dùng cho page-level loading)
   * Nếu false: chỉ chiếm không gian parent (dùng trong card / section)
   */
  fullScreen?: boolean;
  className?: string;
}

export function LoadingCustom({
  message = 'Loading data...',
  fullScreen = true,
  className,
}: LoadingCustomProps) {
  const containerClass = fullScreen
    ? 'flex h-screen flex-col items-center justify-center'
    : 'flex flex-col items-center justify-center py-10';

  return (
    <div className={cn(containerClass, 'text-center', className)}>
      <div className='flex items-center justify-center rounded-full bg-muted/60 p-3 shadow-sm mb-3'>
        <Loader2 className='h-6 w-6 animate-spin text-primary' />
      </div>
      <p className='text-sm font-medium text-foreground mb-1'>{message}</p>
      <p className='text-xs text-muted-foreground max-w-sm'>
        Please wait a moment, we are processing your request.
      </p>
    </div>
  );
}

export default LoadingCustom;
