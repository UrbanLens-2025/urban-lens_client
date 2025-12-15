'use client';

import { ReactNode } from 'react';
import { cn } from '@/lib/utils';

interface PageContainerProps {
  children: ReactNode;
  className?: string;
  maxWidth?: 'sm' | 'md' | 'lg' | 'xl' | '2xl' | 'full';
}

const maxWidthClasses = {
  sm: 'max-w-2xl',
  md: 'max-w-4xl',
  lg: 'max-w-5xl',
  xl: 'max-w-6xl',
  '2xl': 'max-w-7xl',
  full: 'max-w-full',
};

export function PageContainer({
  children,
  className,
  maxWidth = 'full',
}: PageContainerProps) {
  return (
    <div
      className={cn(
        'space-y-6 mx-auto p-2 animate-in fade-in-50 slide-in-from-bottom-4 duration-500',
        maxWidthClasses[maxWidth],
        className
      )}
    >
      {children}
    </div>
  );
}
