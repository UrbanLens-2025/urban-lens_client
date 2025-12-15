import React from 'react';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from '@/components/ui/card';
import type { LucideIcon } from 'lucide-react';

interface StatisticCardProps {
  title: string;
  subtitle?: string;
  value: string | number;
  icon: LucideIcon;
  iconColorClass?: string;
}

export default function StatisticCard({
  title,
  subtitle,
  value,
  icon: Icon,
  iconColorClass,
}: StatisticCardProps) {
  return (
    <Card
      className={`hover:shadow-md transition-shadow border-l-6 border-${iconColorClass}-500`}
    >
      <CardHeader className='flex flex-row items-center justify-between'>
        <CardTitle className='text-md font-medium'>{title}</CardTitle>
        <div
          className={`h-10 w-10 rounded-full flex items-center justify-center bg-${iconColorClass}-100 dark:bg-${iconColorClass}-900`}
        >
          <Icon
            className={`h-5 w-5 text-${iconColorClass}-600 dark:text-${iconColorClass}-400`}
          />
        </div>
      </CardHeader>
      <CardContent>
        <div className='text-3xl font-bold'>{value}</div>
        {subtitle && (
          <p className='text-xs text-muted-foreground mt-1'>{subtitle}</p>
        )}
      </CardContent>
    </Card>
  );
}
