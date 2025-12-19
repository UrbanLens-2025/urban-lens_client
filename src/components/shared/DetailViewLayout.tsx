'use client';

import React from 'react';
import { Button } from '@/components/ui/button';
import {
  ArrowLeft,
  Edit,
} from 'lucide-react';
export interface DetailViewLayoutProps {
  title: string;
  badges: React.ReactNode;
  onClose: () => void;
  onEdit: () => void;
  editLabel: string;
  mainContent: React.ReactNode;
  location?: any;
  onImageClick?: (src: string) => void;
}

export function DetailViewLayout({
  title,
  badges,
  onClose,
  onEdit,
  editLabel,
  mainContent,
  location,
  onImageClick,
}: DetailViewLayoutProps) {

  return (
    <div className='space-y-6'>
      {/* Header */}
      <div className='flex items-center justify-between flex-wrap gap-4'>
        <div className='flex items-center gap-4 flex-wrap'>
          <Button variant='outline' size='icon' onClick={onClose}>
            <ArrowLeft className='h-4 w-4' />
          </Button>
          <div>
            <h1 className='text-2xl font-bold mb-2'>{title}</h1>
            <div className='flex items-center gap-2 flex-wrap'>{badges}</div>
          </div>
        </div>
        <Button onClick={onEdit} variant='outline'>
          <Edit className='mr-2 h-4 w-4' /> {editLabel}
        </Button>
      </div>

      {/* Main Content */}
      <div className='space-y-6'>{mainContent}</div>
    </div>
  );
}
