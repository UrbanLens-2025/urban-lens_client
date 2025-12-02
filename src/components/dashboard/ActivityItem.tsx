'use client';

import { cn } from '@/lib/utils';
import Link from 'next/link';
import { ComponentType } from 'react';

export interface ActivityItemProps {
  icon?: ComponentType<{ className?: string; size?: number }>;
  title: string;
  description?: string;
  date: string;
  href?: string;
  className?: string;
}

export function ActivityItem({
  icon: Icon,
  title,
  description,
  date,
  href,
  className,
}: ActivityItemProps) {
  const content = (
    <div
      className={cn(
        'flex items-start gap-3 p-3 rounded-lg border border-border/60 transition-colors',
        href
          ? 'hover:bg-muted/30 cursor-pointer group'
          : 'hover:bg-muted/30',
        className
      )}
    >
      {Icon && (
        <Icon
          className={cn(
            'h-4 w-4 text-muted-foreground mt-0.5 flex-shrink-0',
            href && 'group-hover:text-primary transition-colors'
          )}
        />
      )}
      <div className="flex-1 min-w-0">
        <p
          className={cn(
            'text-sm font-semibold truncate',
            href && 'group-hover:text-primary transition-colors'
          )}
        >
          {title}
        </p>
        {description && (
          <p className="text-xs text-muted-foreground mt-0.5 line-clamp-1">
            {description}
          </p>
        )}
        <p className="text-xs text-muted-foreground mt-1">
          {new Date(date).toLocaleDateString()}
        </p>
      </div>
    </div>
  );

  if (href) {
    return <Link href={href}>{content}</Link>;
  }

  return content;
}

