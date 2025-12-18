'use client';

import { useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  CalendarDays,
  DollarSign,
  PlusCircle,
  ArrowRight,
  Activity,
  Ticket,
  MapPin,
  Eye,
} from 'lucide-react';
import Link from 'next/link';
import { useMyEvents } from '@/hooks/events/useMyEvents';
import { format, subDays, subMonths, subYears } from 'date-fns';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Bar,
  BarChart,
  CartesianGrid,
  XAxis,
  YAxis,
  Tooltip as RechartsTooltip,
  ResponsiveContainer,
} from 'recharts';
import {
  ChartContainer,
  ChartTooltipContent,
  ChartConfig,
} from '@/components/ui/chart';
import { PageHeader } from '@/components/shared/PageHeader';
import { PageContainer } from '@/components/shared/PageContainer';
import { StatCard } from '@/components/shared/StatCard';
import { DashboardSection } from '@/components/dashboard';
import LoadingCustom from '@/components/shared/LoadingCustom';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { formatCurrency } from '@/lib/utils';

type PeriodType = 'day' | 'month' | 'year';

export default function CreatorDashboardPage() {
  const router = useRouter();
  const [revenuePeriod, setRevenuePeriod] = useState<PeriodType>('month');
  const [eventPeriod, setEventPeriod] = useState<PeriodType>('month');

  // Fetch events data
  const { data: eventsData, isLoading } = useMyEvents({
    page: 1,
    limit: 100, // Get more events for better statistics
    sortBy: 'createdAt:DESC',
  });

  const events = eventsData?.data || [];
  const meta = eventsData?.meta;

  const stats = useMemo(() => {
    const totalEvents = meta?.totalItems ?? 0;

    const activeEvents = events.filter((e) => {
      return (
        e.status?.toUpperCase() === 'PUBLISHED' ||
        e.status?.toUpperCase() === 'ACTIVE'
      );
    });

    const draftEvents = events.filter((e) => {
      return e.status?.toUpperCase() === 'DRAFT';
    });

    const completedEvents = events.filter((e) => {
      return e.status?.toUpperCase() === 'COMPLETED';
    });

    // Placeholder real metrics until attendance/revenue APIs are available
    const totalRevenue = 0;
    const thisMonthRevenue = 0;
    const revenueChange = 0;

    const thirtyDaysAgo = subDays(new Date(), 30);
    const recentEvents = events.filter((e) => {
      const eventDate = new Date(e.createdAt);
      return eventDate >= thirtyDaysAgo;
    }).length;

    const previousPeriodEvents = events.filter((e) => {
      const eventDate = new Date(e.createdAt);
      const previousThirtyDaysAgo = subDays(new Date(), 60);
      return eventDate >= previousThirtyDaysAgo && eventDate < thirtyDaysAgo;
    }).length;

    const eventsChange =
      previousPeriodEvents > 0
        ? ((recentEvents - previousPeriodEvents) / previousPeriodEvents) * 100
        : recentEvents > 0
        ? 100
        : 0;

    return {
      totalEvents,
      activeEvents: activeEvents.length,
      draftEvents: draftEvents.length,
      completedEvents: completedEvents.length,
      totalRevenue,
      thisMonthRevenue,
      revenueChange,
      recentEvents,
      eventsChange,
    };
  }, [events, meta]);

  // Get upcoming events (events with future dates)
  const upcomingEvents = useMemo(() => {
    const now = new Date();
    return events
      .filter((e) => {
        if (e.startDate) {
          const startDate = new Date(e.startDate);
          return startDate >= now;
        }
        return (
          e.status?.toUpperCase() === 'PUBLISHED' ||
          e.status?.toUpperCase() === 'ACTIVE'
        );
      })
      .sort((a, b) => {
        const dateA = a.startDate
          ? new Date(a.startDate).getTime()
          : new Date(a.createdAt).getTime();
        const dateB = b.startDate
          ? new Date(b.startDate).getTime()
          : new Date(b.createdAt).getTime();
        return dateA - dateB;
      })
      .slice(0, 5);
  }, [events]);

  const recentEventsList = useMemo(
    () => events.slice(0, 3),
    [events]
  );

  // Mock revenue performance data based on selected period (structure matches business dashboard)
  const revenueData = useMemo(() => {
    const now = new Date();
    const data: Array<{ period: string; revenue: number }> = [];

    const baseRevenue = {
      day: [
        850000, 920000, 1100000, 780000, 1300000, 1450000, 980000, 1200000,
        1350000, 1150000, 1050000, 1400000, 1250000, 950000, 1600000, 1100000,
        1320000, 1480000, 1020000, 1380000, 1150000, 1260000, 1420000, 980000,
        1550000, 1180000, 1340000, 1470000, 1080000, 1520000,
      ],
      month: [
        8500000, 9200000, 11000000, 7800000, 13000000, 14500000, 9800000,
        12000000, 13500000, 11500000, 10500000, 14000000,
      ],
      year: [125000000, 142000000, 158000000, 175000000, 198000000],
    };

    if (revenuePeriod === 'day') {
      for (let i = 29; i >= 0; i--) {
        const dayDate = subDays(now, i);
        const dayOfWeek = dayDate.getDay();
        const baseIndex = 29 - i;

        let revenue = baseRevenue.day[baseIndex % baseRevenue.day.length];
        if (dayOfWeek === 0 || dayOfWeek === 6) {
          revenue = Math.floor(revenue * 0.7);
        }

        revenue = Math.floor(revenue * (0.85 + Math.random() * 0.3));

        data.push({
          period: format(dayDate, 'MMM dd'),
          revenue,
        });
      }
    } else if (revenuePeriod === 'month') {
      for (let i = 11; i >= 0; i--) {
        const monthDate = subMonths(now, i);
        const baseIndex = 11 - i;
        let revenue = baseRevenue.month[baseIndex % baseRevenue.month.length];

        const growthFactor = 1 + (11 - i) * 0.03;
        revenue = Math.floor(revenue * growthFactor);

        revenue = Math.floor(revenue * (0.9 + Math.random() * 0.2));

        data.push({
          period: format(monthDate, 'MMM yyyy'),
          revenue,
        });
      }
    } else {
      for (let i = 4; i >= 0; i--) {
        const yearDate = subYears(now, i);
        const baseIndex = 4 - i;
        let revenue = baseRevenue.year[baseIndex];

        revenue = Math.floor(revenue * (0.95 + Math.random() * 0.1));

        data.push({
          period: format(yearDate, 'yyyy'),
          revenue,
        });
      }
    }
    return data;
  }, [revenuePeriod]);

  // Mock event performance timeline data based on selected period
  const eventPerformanceData = useMemo(() => {
    const now = new Date();
    const data: Array<{
      period: string;
      created: number;
      published: number;
      completed: number;
    }> = [];

    const baseDayData = [
      { created: 3, published: 2, completed: 1 },
      { created: 4, published: 3, completed: 2 },
      { created: 2, published: 2, completed: 1 },
      { created: 5, published: 4, completed: 2 },
      { created: 3, published: 3, completed: 3 },
      { created: 6, published: 5, completed: 4 },
      { created: 2, published: 2, completed: 2 },
      { created: 4, published: 3, completed: 3 },
      { created: 5, published: 4, completed: 2 },
      { created: 3, published: 3, completed: 4 },
      { created: 4, published: 3, completed: 2 },
      { created: 5, published: 4, completed: 3 },
      { created: 6, published: 5, completed: 4 },
      { created: 3, published: 2, completed: 2 },
      { created: 7, published: 6, completed: 5 },
      { created: 4, published: 4, completed: 3 },
      { created: 5, published: 4, completed: 4 },
      { created: 6, published: 5, completed: 3 },
      { created: 4, published: 3, completed: 2 },
      { created: 5, published: 4, completed: 5 },
      { created: 3, published: 3, completed: 2 },
      { created: 6, published: 5, completed: 4 },
      { created: 5, published: 4, completed: 3 },
      { created: 3, published: 2, completed: 2 },
      { created: 7, published: 6, completed: 5 },
      { created: 4, published: 4, completed: 3 },
      { created: 5, published: 4, completed: 4 },
      { created: 6, published: 5, completed: 3 },
      { created: 4, published: 3, completed: 2 },
      { created: 8, published: 7, completed: 6 },
    ];

    const baseMonthData = [
      { created: 85, published: 72, completed: 58 },
      { created: 92, published: 78, completed: 65 },
      { created: 88, published: 75, completed: 62 },
      { created: 95, published: 82, completed: 68 },
      { created: 102, published: 88, completed: 74 },
      { created: 98, published: 85, completed: 71 },
      { created: 105, published: 92, completed: 78 },
      { created: 112, published: 98, completed: 84 },
      { created: 108, published: 95, completed: 81 },
      { created: 115, published: 102, completed: 88 },
      { created: 120, published: 108, completed: 94 },
      { created: 125, published: 112, completed: 98 },
    ];

    const baseYearData = [
      { created: 980, published: 850, completed: 720 },
      { created: 1150, published: 1020, completed: 880 },
      { created: 1320, published: 1180, completed: 1020 },
      { created: 1480, published: 1330, completed: 1160 },
      { created: 1650, published: 1500, completed: 1320 },
    ];

    if (eventPeriod === 'day') {
      for (let i = 29; i >= 0; i--) {
        const dayDate = subDays(now, i);
        const dayOfWeek = dayDate.getDay();
        const baseIndex = 29 - i;
        let { created, published, completed } =
          baseDayData[baseIndex % baseDayData.length];

        if (dayOfWeek === 0 || dayOfWeek === 6) {
          created = Math.max(1, Math.floor(created * 0.6));
          published = Math.max(1, Math.floor(published * 0.6));
          completed = Math.max(0, Math.floor(completed * 0.7));
        }

        created = Math.max(0, created + Math.floor((Math.random() - 0.5) * 2));
        published = Math.max(
          0,
          Math.min(published + Math.floor((Math.random() - 0.5) * 2), created)
        );
        completed = Math.max(
          0,
          Math.min(completed + Math.floor((Math.random() - 0.5) * 2), published)
        );

        data.push({
          period: format(dayDate, 'MMM dd'),
          created,
          published,
          completed,
        });
      }
    } else if (eventPeriod === 'month') {
      for (let i = 11; i >= 0; i--) {
        const monthDate = subMonths(now, i);
        const baseIndex = 11 - i;
        let { created, published, completed } =
          baseMonthData[baseIndex % baseMonthData.length];

        const growthFactor = 1 + (11 - i) * 0.02;
        created = Math.floor(created * growthFactor);
        published = Math.floor(published * growthFactor);
        completed = Math.floor(completed * growthFactor);

        created = Math.max(0, created + Math.floor((Math.random() - 0.5) * 10));
        published = Math.max(
          0,
          Math.min(published + Math.floor((Math.random() - 0.5) * 8), created)
        );
        completed = Math.max(
          0,
          Math.min(completed + Math.floor((Math.random() - 0.5) * 6), published)
        );

        data.push({
          period: format(monthDate, 'MMM yyyy'),
          created,
          published,
          completed,
        });
      }
    } else {
      for (let i = 4; i >= 0; i--) {
        const yearDate = subYears(now, i);
        const baseIndex = 4 - i;
        let { created, published, completed } = baseYearData[baseIndex];

        created = Math.max(0, created + Math.floor((Math.random() - 0.5) * 50));
        published = Math.max(
          0,
          Math.min(published + Math.floor((Math.random() - 0.5) * 40), created)
        );
        completed = Math.max(
          0,
          Math.min(
            completed + Math.floor((Math.random() - 0.5) * 30),
            published
          )
        );

        data.push({
          period: format(yearDate, 'yyyy'),
          created,
          published,
          completed,
        });
      }
    }
    return data;
  }, [eventPeriod]);

  const revenueChartConfig: ChartConfig = {
    revenue: {
      label: 'Revenue',
      color: 'lab(58.8635% 31.6645 115.942)',
    },
  };

  const eventPerformanceChartConfig: ChartConfig = {
    created: {
      label: 'Created',
      color: 'hsl(221.2 83.2% 53.3%)',
    },
    published: {
      label: 'Published',
      color: 'hsl(142.1 76.2% 36.3%)',
    },
    completed: {
      label: 'Completed',
      color: 'hsl(47.9 95.8% 53.1%)',
    },
  };

  if (isLoading) {
    return <LoadingCustom />;
  }

  return (
    <PageContainer>
      <PageHeader
        title='Creator Dashboard'
        description='Overview of your events, attendees, and revenue'
        icon={CalendarDays}
        actions={
          <>
            <Button
              variant='outline'
              onClick={() => router.push('/dashboard/creator/events')}
              className='h-11 border-2 border-primary/20 hover:border-primary/40'
            >
              <Eye className='mr-2 h-4 w-4' />
              View Events
            </Button>
            <Button
              onClick={() => router.push('/dashboard/creator/request/create')}
              className='h-11 bg-gradient-to-r from-primary to-primary/90 hover:from-primary/90 hover:to-primary shadow-lg'
            >
              <PlusCircle className='mr-2 h-4 w-4' />
              Create Event
            </Button>
          </>
        }
      />

      <div className='grid gap-6 md:grid-cols-2 lg:grid-cols-4'>
        <StatCard
          title='Total Events'
          value={stats.totalEvents}
          icon={CalendarDays}
          color='blue'
          description={`${stats.activeEvents} active`}
          trend={
            stats.eventsChange !== 0
              ? {
                  value: stats.eventsChange,
                  isPositive: stats.eventsChange > 0,
                }
              : undefined
          }
          onClick={() => router.push('/dashboard/creator/events')}
        />

        <StatCard
          title='Upcoming Events'
          value={upcomingEvents.length}
          icon={Ticket}
          color='blue'
          description='Scheduled events'
          onClick={() => router.push('/dashboard/creator/events')}
        />

        <StatCard
          title='Active Events'
          value={stats.activeEvents}
          icon={MapPin}
          color='purple'
          description={`${stats.draftEvents} drafts`}
          footer={
            stats.completedEvents > 0 && (
              <Badge variant='outline' className='text-xs'>
                {stats.completedEvents} completed
              </Badge>
            )
          }
          onClick={() => router.push('/dashboard/creator/events')}
        />

        <StatCard
          title='Total Revenue'
          value={formatCurrency(stats.totalRevenue)}
          icon={DollarSign}
          color='amber'
          description={`${formatCurrency(stats.thisMonthRevenue)} this month`}
          trend={
            stats.revenueChange !== 0
              ? {
                  value: stats.revenueChange,
                  isPositive: stats.revenueChange > 0,
                }
              : undefined
          }
          onClick={() => router.push('/dashboard/creator/wallet')}
        />
      </div>

      <div className='grid gap-6 md:grid-cols-2'>
        <Card className='border-2 border-primary/10 shadow-xl bg-card/80 backdrop-blur-sm'>
          <CardHeader>
            <div className='flex items-center justify-between'>
              <div>
                <CardTitle className='text-base flex items-center gap-2'>
                  <DollarSign className='h-4 w-4 text-primary' />
                  Revenue Overview
                </CardTitle>
                <CardDescription className='mt-1'>
                  Revenue trends over time
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className='space-y-4'>
              <div className='grid grid-cols-2 gap-4'>
                <div className='rounded-lg border border-border/60 bg-muted/30 p-4'>
                  <p className='text-xs text-muted-foreground mb-1'>
                    This Month
                  </p>
                  <p className='text-2xl font-bold text-emerald-600'>
                    {formatCurrency(stats.thisMonthRevenue)}
                  </p>
                </div>
                <div className='rounded-lg border border-border/60 bg-muted/30 p-4'>
                  <p className='text-xs text-muted-foreground mb-1'>Total</p>
                  <p className='text-2xl font-bold text-amber-600'>
                    {formatCurrency(stats.totalRevenue)}
                  </p>
                </div>
              </div>
              {stats.revenueChange !== 0 && (
                <div
                  className={`flex items-center gap-2 p-3 rounded-lg ${
                    stats.revenueChange > 0
                      ? 'bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-800'
                      : 'bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-800'
                  }`}
                >
                  {stats.revenueChange > 0 ? (
                    <Activity className='h-4 w-4 text-emerald-600' />
                  ) : (
                    <Activity className='h-4 w-4 text-red-600' />
                  )}
                  <div>
                    <p
                      className={`text-sm font-medium ${
                        stats.revenueChange > 0
                          ? 'text-emerald-600'
                          : 'text-red-600'
                      }`}
                    >
                      {stats.revenueChange > 0 ? '+' : ''}
                      {stats.revenueChange.toFixed(1)}% from last month
                    </p>
                    <p className='text-xs text-muted-foreground'>
                      Revenue {stats.revenueChange > 0 ? 'increased' : 'decreased'}
                    </p>
                  </div>
                </div>
              )}
              <Button
                variant='outline'
                className='w-full'
                onClick={() => router.push('/dashboard/creator/wallet')}
              >
                <ArrowRight className='mr-2 h-4 w-4' />
                View Wallet Details
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card className='border-2 border-primary/10 shadow-xl bg-card/80 backdrop-blur-sm'>
          <CardHeader>
            <div className='flex items-center justify-between'>
              <div>
                <CardTitle className='text-lg font-bold flex items-center gap-2'>
                  <div className='p-1.5 rounded-lg bg-gradient-to-br from-primary/20 to-primary/10'>
                    <Activity className='h-4 w-4 text-primary' />
                  </div>
                  Event Performance Timeline
                </CardTitle>
                <CardDescription className='mt-1 text-sm'>
                  Event lifecycle over time
                </CardDescription>
              </div>
              <div className='flex gap-1'>
                <Button
                  variant={eventPeriod === 'day' ? 'default' : 'outline'}
                  size='sm'
                  onClick={() => setEventPeriod('day')}
                  className='h-8 px-3 text-xs'
                >
                  Day
                </Button>
                <Button
                  variant={eventPeriod === 'month' ? 'default' : 'outline'}
                  size='sm'
                  onClick={() => setEventPeriod('month')}
                  className='h-8 px-3 text-xs'
                >
                  Month
                </Button>
                <Button
                  variant={eventPeriod === 'year' ? 'default' : 'outline'}
                  size='sm'
                  onClick={() => setEventPeriod('year')}
                  className='h-8 px-3 text-xs'
                >
                  Year
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className='h-64'>
              {eventPerformanceData.length === 0 ? (
                <div className='flex flex-col items-center justify-center h-full text-center'>
                  <Activity className='h-12 w-12 text-muted-foreground/50 mb-3' />
                  <p className='text-sm text-muted-foreground font-medium'>
                    No event data yet
                  </p>
                  <p className='text-xs text-muted-foreground mt-1'>
                    Create events to see performance metrics
                  </p>
                </div>
              ) : (
                <ChartContainer
                  config={eventPerformanceChartConfig}
                  className='h-full w-full'
                >
                  <ResponsiveContainer width='100%' height='100%'>
                    <BarChart data={eventPerformanceData}>
                      <CartesianGrid
                        strokeDasharray='3 3'
                        vertical={false}
                        className='stroke-muted'
                      />
                      <XAxis
                        dataKey='period'
                        tickLine={false}
                        axisLine={false}
                        tickMargin={10}
                        tick={{ fontSize: 11 }}
                      />
                      <YAxis
                        tickLine={false}
                        axisLine={false}
                        tick={{ fontSize: 11 }}
                      />
                      <RechartsTooltip
                        cursor={{ fill: 'hsl(var(--muted))', opacity: 0.4 }}
                        content={<ChartTooltipContent />}
                      />
                      <Bar
                        dataKey='created'
                        fill='hsl(221.2 83.2% 53.3%)'
                        radius={[4, 4, 0, 0]}
                      />
                      <Bar
                        dataKey='published'
                        fill='hsl(142.1 76.2% 36.3%)'
                        radius={[4, 4, 0, 0]}
                      />
                      <Bar
                        dataKey='completed'
                        fill='hsl(47.9 95.8% 53.1%)'
                        radius={[4, 4, 0, 0]}
                      />
                    </BarChart>
                  </ResponsiveContainer>
                </ChartContainer>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      <div className='grid grid-cols-1 lg:grid-cols-5 gap-10'>
        <DashboardSection
          title='My Events'
          icon={CalendarDays}
          action={{
            label: 'View all',
            href: '/dashboard/creator/events',
          }}
          className='lg:col-span-3'
          isEmpty={!isLoading && events.length === 0}
          emptyState={{
            icon: CalendarDays,
            title: 'No events yet',
            description: 'Get started by creating your first event',
            action: {
              label: 'Create Your First Event',
              href: '/dashboard/creator/request/create',
            },
          }}
        >
          <Table>
            <TableHeader>
              <TableRow className='hover:bg-transparent border-b'>
                <TableHead className='font-semibold w-[50%]'>Name</TableHead>
                <TableHead className='font-semibold w-[25%]'>
                  Start Date
                </TableHead>
                <TableHead className='font-semibold w-[25%]'>
                  Status
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {events.slice(0, 5).map((event) => (
                <TableRow
                  key={event.id}
                  className='hover:bg-muted/50 cursor-pointer transition-colors'
                  onClick={() =>
                    router.push(`/dashboard/creator/events/${event.id}`)
                  }
                >
                  <TableCell className='font-medium'>
                    <div className='flex flex-col gap-1 min-w-0 flex-1'>
                      <span className='truncate font-medium'>
                        {event.displayName || 'Untitled event'}
                      </span>
                      {event.location?.name && (
                        <div className='flex items-center gap-1 min-w-0 max-w-[300px]'>
                          <MapPin className='h-3 w-3 shrink-0 text-muted-foreground' />
                          <span className='text-xs text-muted-foreground truncate'>
                            {event.location.name}
                          </span>
                        </div>
                      )}
                    </div>
                  </TableCell>
                  <TableCell className='text-sm text-muted-foreground'>
                    {event.startDate
                      ? format(new Date(event.startDate), 'MMM dd, yyyy')
                      : '-'}
                  </TableCell>
                  <TableCell>
                    <Badge variant='secondary' className='font-medium'>
                      {event.status || 'DRAFT'}
                    </Badge>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </DashboardSection>

        <DashboardSection
          title='Upcoming Events'
          icon={Ticket}
          action={{
            label: 'View all',
            href: '/dashboard/creator/events',
          }}
          className='lg:col-span-2'
          isEmpty={!isLoading && upcomingEvents.length === 0}
          emptyState={{
            icon: Ticket,
            title: 'No upcoming events',
            description: 'Schedule events to see them here',
          }}
        >
          {upcomingEvents.length === 0 ? (
            <div className='flex items-center justify-center py-8'>
              <p className='text-sm text-muted-foreground'>
                No upcoming events.
              </p>
            </div>
          ) : (
            <div className='space-y-3'>
              {upcomingEvents.map((event) => {
                const startDate = event.startDate
                  ? new Date(event.startDate)
                  : new Date(event.createdAt);

                return (
                  <Link
                    key={event.id}
                    href={`/dashboard/creator/events/${event.id}`}
                    className='block'
                  >
                    <div className='flex flex-col p-4 border-2 rounded-lg bg-muted/30 hover:bg-muted/50 transition-all shadow-sm cursor-pointer hover:shadow-md'>
                      <div className='flex items-start justify-between mb-2'>
                        <div className='flex-1 min-w-0'>
                          <p className='font-semibold text-sm truncate'>
                            {event.displayName || 'Untitled event'}
                          </p>
                          {event.location?.name && (
                            <p className='text-xs text-muted-foreground mt-0.5 truncate'>
                              {event.location.name}
                            </p>
                          )}
                        </div>
                        <Badge variant='secondary' className='text-xs'>
                          {event.status || 'DRAFT'}
                        </Badge>
                      </div>
                      <div className='flex items-center justify-between'>
                        <p className='text-xs text-muted-foreground flex items-center gap-1'>
                          <CalendarDays className='h-3 w-3' />
                          {format(startDate, 'MMM dd, yyyy')}
                        </p>
                        <ArrowRight className='h-4 w-4 text-muted-foreground' />
                      </div>
                    </div>
                  </Link>
                );
              })}
            </div>
          )}
        </DashboardSection>
      </div>
    </PageContainer>
  );
}
