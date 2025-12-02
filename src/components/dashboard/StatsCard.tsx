'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2 } from 'lucide-react';
import { LucideIcon } from 'lucide-react';
import { cn } from '@/lib/utils';
import { ComponentType } from 'react';

export interface StatsCardProps {
  title: string;
  value: string | number;
  change?: string;
  icon: ComponentType<{ className?: string; size?: number }>;
  isLoading?: boolean;
  color?: 'default' | 'primary' | 'green' | 'blue' | 'orange' | 'red' | 'purple' | 'emerald' | 'amber';
  variant?: 'default' | 'minimal';
  onClick?: () => void;
}

const colorClasses = {
  default: {
    icon: 'text-muted-foreground',
    bg: 'bg-muted/10',
  },
  primary: {
    icon: 'text-primary',
    bg: 'bg-primary/10',
  },
  green: {
    icon: 'text-green-600 dark:text-green-400',
    bg: 'bg-green-500/10',
  },
  blue: {
    icon: 'text-blue-600 dark:text-blue-400',
    bg: 'bg-blue-500/10',
  },
  orange: {
    icon: 'text-orange-600 dark:text-orange-400',
    bg: 'bg-orange-500/10',
  },
  red: {
    icon: 'text-red-600 dark:text-red-400',
    bg: 'bg-red-500/10',
  },
  purple: {
    icon: 'text-purple-600 dark:text-purple-400',
    bg: 'bg-purple-500/10',
  },
  emerald: {
    icon: 'text-emerald-600 dark:text-emerald-400',
    bg: 'bg-emerald-500/10',
  },
  amber: {
    icon: 'text-amber-600 dark:text-amber-400',
    bg: 'bg-amber-500/10',
  },
};

export function StatsCard({
  title,
  value,
  change,
  icon: Icon,
  isLoading = false,
  color = 'default',
  variant = 'default',
  onClick,
}: StatsCardProps) {
  const colors = colorClasses[color];
  const isClickable = !!onClick;

  if (variant === 'minimal') {
    return (
      <Card
        className={cn(
          'border-border/60 shadow-sm hover:shadow-md transition-shadow',
          isClickable && 'cursor-pointer hover:border-primary/20'
        )}
        onClick={onClick}
      >
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium text-muted-foreground">
            {title}
          </CardTitle>
          <div className={cn('h-8 w-8 rounded-full flex items-center justify-center', colors.bg)}>
            <Icon className={cn('h-4 w-4', colors.icon)} />
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex items-center justify-center h-12">
              <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
            </div>
          ) : (
            <>
              <div className={cn('text-3xl font-bold', colors.icon)}>{value}</div>
              {change && (
                <p className="text-xs text-muted-foreground mt-1">{change}</p>
              )}
            </>
          )}
        </CardContent>
      </Card>
    );
  }

  return (
    <Card
      className={cn(
        'shadow-md hover:shadow-lg transition-all border-2 hover:border-primary/20',
        isClickable && 'cursor-pointer'
      )}
      onClick={onClick}
    >
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3 border-b bg-muted/20">
        <CardTitle className="text-sm font-semibold uppercase tracking-wide">
          {title}
        </CardTitle>
        <div className={cn('p-2 rounded-lg', colors.bg)}>
          <Icon className={cn('h-4 w-4', colors.icon)} />
        </div>
      </CardHeader>
      <CardContent className="pt-6">
        {isLoading ? (
          <div className="flex items-center justify-center h-12">
            <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
          </div>
        ) : (
          <>
            <div className="text-3xl font-bold mb-2 bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text text-transparent">
              {value}
            </div>
            {change && (
              <p className="text-xs font-medium text-muted-foreground">{change}</p>
            )}
          </>
        )}
      </CardContent>
    </Card>
  );
}

