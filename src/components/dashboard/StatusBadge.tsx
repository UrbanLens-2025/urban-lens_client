'use client';

import { Badge } from '@/components/ui/badge';
import { CheckCircle, Clock, AlertCircle, XCircle } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface StatusBadgeProps {
  status: string;
  className?: string;
}

const statusConfig: Record<string, { label: string; variant: 'default' | 'secondary' | 'destructive' | 'outline'; icon: typeof CheckCircle; className: string }> = {
  PAYMENT_RECEIVED: {
    label: 'Payment Received',
    variant: 'outline',
    icon: CheckCircle,
    className: 'bg-green-50 text-green-700 border-green-300 dark:bg-green-950 dark:text-green-300 dark:border-green-700',
  },
  AWAITING_BUSINESS_PROCESSING: {
    label: 'Awaiting Processing',
    variant: 'outline',
    icon: Clock,
    className: 'bg-yellow-50 text-yellow-700 border-yellow-300 dark:bg-yellow-950 dark:text-yellow-300 dark:border-yellow-700',
  },
  SOFT_LOCKED: {
    label: 'Soft Locked',
    variant: 'outline',
    icon: Clock,
    className: 'bg-blue-50 text-blue-700 border-blue-300 dark:bg-blue-950 dark:text-blue-300 dark:border-blue-700',
  },
  CANCELLED: {
    label: 'Cancelled',
    variant: 'outline',
    icon: AlertCircle,
    className: 'bg-red-50 text-red-700 border-red-300 dark:bg-red-950 dark:text-red-300 dark:border-red-700',
  },
  APPROVED: {
    label: 'Approved',
    variant: 'outline',
    icon: CheckCircle,
    className: 'bg-green-50 text-green-700 border-green-300 dark:bg-green-950 dark:text-green-300 dark:border-green-700',
  },
  REJECTED: {
    label: 'Rejected',
    variant: 'outline',
    icon: XCircle,
    className: 'bg-red-50 text-red-700 border-red-300 dark:bg-red-950 dark:text-red-300 dark:border-red-700',
  },
  PENDING: {
    label: 'Pending',
    variant: 'outline',
    icon: Clock,
    className: 'bg-yellow-50 text-yellow-700 border-yellow-300 dark:bg-yellow-950 dark:text-yellow-300 dark:border-yellow-700',
  },
  ACTIVE: {
    label: 'Active',
    variant: 'default',
    icon: CheckCircle,
    className: 'bg-green-500/10 text-green-700 dark:text-green-400 border-green-500/20',
  },
  PUBLISHED: {
    label: 'Published',
    variant: 'default',
    icon: CheckCircle,
    className: 'bg-green-500/10 text-green-700 dark:text-green-400 border-green-500/20',
  },
};

export function StatusBadge({ status, className }: StatusBadgeProps) {
  const statusUpper = status?.toUpperCase() || '';
  const config = statusConfig[statusUpper];

  if (config) {
    const Icon = config.icon;
    return (
      <Badge
        variant={config.variant}
        className={cn('font-medium', config.className, className)}
      >
        <Icon className="h-3 w-3 mr-1" />
        {config.label}
      </Badge>
    );
  }

  // Format unknown statuses
  const formattedStatus = status
    ? status
        .split('_')
        .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
        .join(' ')
    : 'Unknown';

  return (
    <Badge variant="secondary" className={cn('font-medium', className)}>
      {formattedStatus}
    </Badge>
  );
}

