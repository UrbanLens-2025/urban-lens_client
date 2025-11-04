'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

interface StatsCardProps {
  title: string;
  value: string;
  change: string;
  icon: any;
  color?: 'default' | 'green' | 'blue' | 'orange' | 'red' | 'purple';
}

export default function StatsCard({
  title,
  value,
  change,
  icon: Icon,
  color = 'default',
}: StatsCardProps) {
  const colorClasses = {
    default: 'text-muted-foreground',
    green: 'text-green-600',
    blue: 'text-blue-600',
    orange: 'text-orange-600',
    red: 'text-red-600',
    purple: 'text-purple-600',
  };

  return (
    <Card>
      <CardHeader className='flex flex-row items-center justify-between pb-2'>
        <CardTitle className='text-md font-medium'>{title}</CardTitle>
        <Icon className={`${colorClasses[color]}`} size={24} />
      </CardHeader>
      <CardContent>
        <div className='text-2xl font-bold'>{value}</div>
        <p className='text-xs text-muted-foreground'>{change}</p>
      </CardContent>
    </Card>
  );
}
