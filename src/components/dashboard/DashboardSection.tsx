'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ArrowUpRight } from 'lucide-react';
import Link from 'next/link';
import { ReactNode, ComponentType } from 'react';
import { cn } from '@/lib/utils';

export interface DashboardSectionProps {
  title: string;
  icon?: ComponentType<{ className?: string; size?: number }>;
  action?: {
    label: string;
    href: string;
    variant?: 'default' | 'ghost' | 'outline';
  };
  children: ReactNode;
  className?: string;
  headerClassName?: string;
  emptyState?: {
    icon?: ComponentType<{ className?: string; size?: number }>;
    title: string;
    description: string;
    action?: {
      label: string;
      href: string;
    };
  };
  isEmpty?: boolean;
}

export function DashboardSection({
  title,
  icon: Icon,
  action,
  children,
  className,
  headerClassName,
  emptyState,
  isEmpty = false,
}: DashboardSectionProps) {
  return (
    <Card className={cn('shadow-lg border-2', className)}>
      <CardHeader className={cn('border-b bg-muted/20', headerClassName)}>
        <div className='flex justify-between items-center'>
          <CardTitle className='text-lg font-semibold flex items-center'>
            {Icon && <Icon className='h-5 w-5 text-primary' />}
            <span className='ml-2'>{title}</span>
          </CardTitle>
          {action && (
            <Link href={action.href}>
              <Button
                variant={action.variant || 'ghost'}
                size='sm'
                className='h-8 w-8 p-0'
              >
                <ArrowUpRight className='h-4 w-4' />
              </Button>
            </Link>
          )}
        </div>
      </CardHeader>
      <CardContent>
        {isEmpty && emptyState ? (
          <div className='flex flex-col items-center justify-center py-12 text-center'>
            {emptyState.icon && (
              <div className='h-12 w-12 rounded-full bg-muted flex items-center justify-center mb-3'>
                <emptyState.icon className='h-6 w-6 text-muted-foreground' />
              </div>
            )}
            <p className='text-sm font-semibold mb-1'>{emptyState.title}</p>
            <p className='text-xs text-muted-foreground mb-4'>
              {emptyState.description}
            </p>
            {emptyState.action && (
              <Link href={emptyState.action.href}>
                <Button variant='outline' size='sm'>
                  {emptyState.action.label}
                </Button>
              </Link>
            )}
          </div>
        ) : (
          children
        )}
      </CardContent>
    </Card>
  );
}
