'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import { ReactNode } from 'react';
import { Loader2 } from 'lucide-react';

interface StatCardProps {
  title: string;
  value: string | number;
  icon: React.ComponentType<{ className?: string }>;
  iconColor?: string;
  iconBg?: string;
  description?: string;
  trend?: {
    value: number;
    isPositive: boolean;
  };
  footer?: ReactNode;
  className?: string;
  onClick?: () => void;
  isLoading?: boolean;
  // Color variant presets for consistency
  color?:
    | 'default'
    | 'primary'
    | 'blue'
    | 'green'
    | 'orange'
    | 'red'
    | 'purple'
    | 'emerald'
    | 'amber';
}

const colorPresets = {
  default: {
    icon: 'text-primary',
    bg: 'bg-primary/10',
  },
  primary: {
    icon: 'text-primary',
    bg: 'bg-primary/10',
  },
  blue: {
    icon: 'text-blue-600 dark:text-blue-400',
    bg: 'bg-blue-100 dark:bg-blue-950',
  },
  green: {
    icon: 'text-green-600 dark:text-green-400',
    bg: 'bg-green-100 dark:bg-green-950',
  },
  orange: {
    icon: 'text-orange-600 dark:text-orange-400',
    bg: 'bg-orange-100 dark:bg-orange-950',
  },
  red: {
    icon: 'text-red-600 dark:text-red-400',
    bg: 'bg-red-100 dark:bg-red-950',
  },
  purple: {
    icon: 'text-purple-600 dark:text-purple-400',
    bg: 'bg-purple-100 dark:bg-purple-950',
  },
  emerald: {
    icon: 'text-emerald-600 dark:text-emerald-400',
    bg: 'bg-emerald-100 dark:bg-emerald-950',
  },
  amber: {
    icon: 'text-amber-600 dark:text-amber-400',
    bg: 'bg-amber-100 dark:bg-amber-950',
  },
};

export function StatCard({
  title,
  value,
  icon: Icon,
  iconColor,
  iconBg,
  description,
  trend,
  footer,
  className,
  onClick,
  isLoading = false,
  color,
}: StatCardProps) {
  // Use color preset if provided, otherwise use custom colors
  const colors =
    color && colorPresets[color]
      ? colorPresets[color]
      : {
          icon: iconColor || 'text-primary',
          bg: iconBg || 'bg-primary/10',
        };

  // Get border color based on color preset
  const getBorderColor = () => {
    if (!color) return '';
    switch (color) {
      case 'blue':
        return 'border-l-4 border-l-blue-500';
      case 'green':
        return 'border-l-4 border-l-green-500';
      case 'purple':
        return 'border-l-4 border-l-purple-500';
      case 'amber':
        return 'border-l-4 border-l-amber-500';
      case 'orange':
        return 'border-l-4 border-l-orange-500';
      case 'red':
        return 'border-l-4 border-l-red-500';
      case 'emerald':
        return 'border-l-4 border-l-emerald-500';
      default:
        return '';
    }
  };

  return (
    <Card
      className={cn(
        'hover:shadow-lg transition-shadow',
        getBorderColor(),
        onClick && 'cursor-pointer',
        className
      )}
      onClick={onClick}
    >
      <CardContent className='p-6'>
        <div className='flex items-center justify-between'>
          <div className='space-y-1'>
            <p className='text-md font-medium text-muted-foreground'>{title}</p>
            {isLoading ? (
              <div className='flex items-center justify-center h-8'>
                <Loader2 className='h-5 w-5 animate-spin text-muted-foreground' />
              </div>
            ) : (
              <>
                <p className='text-2xl font-bold'>{value}</p>
                {description && (
                  <p className='text-xs text-muted-foreground'>{description}</p>
                )}
                {trend && (
                  <div
                    className={cn(
                      'flex items-center gap-1 text-xs font-medium',
                      trend.isPositive ? 'text-emerald-600' : 'text-red-600'
                    )}
                  >
                    {trend.isPositive ? '↑' : '↓'}{' '}
                    {Math.abs(trend.value).toFixed(1)}%
                  </div>
                )}
                {footer && <div className='mt-2'>{footer}</div>}
              </>
            )}
          </div>
          <div
            className={cn(
              'h-12 w-12 rounded-full flex items-center justify-center',
              colors.bg
            )}
          >
            <Icon className={cn('h-6 w-6', colors.icon)} />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
