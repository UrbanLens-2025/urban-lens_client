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
  TrendingUp,
  Users,
  Wallet,
  FileText,
  Loader2,
} from 'lucide-react';
import Link from 'next/link';
import Image from 'next/image';
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
import { formatCurrency } from '@/lib/utils';
// Updated import to include useTopRevenueEvents
import { useRevenueSummary, useTopRevenueEvents } from '@/hooks/dashboard/useDashboardCreator';

type PeriodType = 'day' | 'month' | 'year';

export default function CreatorDashboardPage() {
  const router = useRouter();
  const [revenuePeriod, setRevenuePeriod] = useState<PeriodType>('month');

  // Fetch events data
  const { data: eventsData, isLoading } = useMyEvents({
    page: 1,
    limit: 100, // Get more events for better statistics
    sortBy: 'createdAt:DESC',
  });

  const events = eventsData?.data || [];
  const meta = eventsData?.meta;

  const { data: revenueData } = useRevenueSummary();
  // Fetch Top Revenue Events (Real Data)
  const { data: topRevenueEventsData, isLoading: isLoadingTopEvents } = useTopRevenueEvents(5);

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

    const totalRevenue = revenueData?.totalRevenue || 0;
    const thisMonthRevenue = revenueData?.thisMonthRevenue || 0;
    const revenueChange = revenueData?.revenueChange || 0;

    const totalWithdrawals = revenueData?.pendingWithdraw || 0;
    const availableRevenue = revenueData?.available || 0;
    const pendingRevenue = revenueData?.pending || 0;

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
      availableRevenue,
      pendingRevenue,
      totalWithdrawals,
      thisMonthRevenue,
      revenueChange,
      recentEvents,
      eventsChange,
    };
  }, [events, meta, revenueData]);

  // Mock upcoming events data - TODO: Replace with actual API data when available
  const upcomingEvents = useMemo(() => {
    const now = new Date();
    const mockEvents = events.slice(0, 5).map((event) => {
      // Generate mock future dates if event doesn't have a startDate
      let startDate = event.startDate ? new Date(event.startDate) : null;
      let endDate = event.endDate ? new Date(event.endDate) : null;

      if (!startDate) {
        // Create a mock future date (1-30 days from now)
        const hash = event.id.split('').reduce((acc: number, char: string) => acc + char.charCodeAt(0), 0);
        const daysFromNow = (hash % 30) + 1;
        startDate = new Date(now);
        startDate.setDate(startDate.getDate() + daysFromNow);
      }

      if (!endDate && startDate) {
        // Create end date 1-3 days after start date
        const hash = event.id.split('').reduce((acc: number, char: string) => acc + char.charCodeAt(0), 0);
        endDate = new Date(startDate);
        endDate.setDate(endDate.getDate() + ((hash % 3) + 1));
      }

      // Generate mock ticket sales and revenue
      const hash = event.id.split('').reduce((acc: number, char: string) => acc + char.charCodeAt(0), 0);
      const baseTickets = (hash % 500) + 50;
      const baseRevenue = baseTickets * ((hash % 200) + 50);
      
      const isPublished = event.status?.toUpperCase() === 'PUBLISHED' || event.status?.toUpperCase() === 'ACTIVE';
      let ticketsSold = baseTickets;
      let revenue = baseRevenue;
      
      if (isPublished) {
        ticketsSold = Math.floor(baseTickets * 0.7);
        revenue = Math.floor(baseRevenue * 0.75);
      } else {
        ticketsSold = 0;
        revenue = 0;
      }

      return {
        ...event,
        startDate: startDate?.toISOString(),
        endDate: endDate?.toISOString(),
        ticketsSold,
        revenue,
      };
    });

    // Filter to only future events and sort by start date
    return mockEvents
      .filter((e) => {
        if (e.startDate) {
          const eventStartDate = new Date(e.startDate);
          return eventStartDate >= now;
        }
        return true; // Include events without dates (already have mock dates)
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
      .slice(0, 3);
  }, [events]);

  // Calculate top events with REAL data from useTopRevenueEvents
  const topEvents = useMemo(() => {
    return (topRevenueEventsData || []).map((event) => ({
      name: event.eventName || 'Untitled Event',
      revenue: event.totalRevenue || 0,
      ticketsSold: event.totalTicketsSold || 0, // Available if needed
    }));
  }, [topRevenueEventsData]);

  // Mock report list data - TODO: Replace with actual API data when available
  const reportList = useMemo(() => {
    return events.slice(0, 3).map((event, index) => {
      const hash = event.id.split('').reduce((acc: number, char: string) => acc + char.charCodeAt(0), 0);
      return {
        id: event.id,
        eventName: event.displayName || 'Untitled event',
        reportType: ['Event Summary', 'Revenue Report', 'Attendance Report', 'Performance Report'][hash % 4],
        generatedDate: subDays(new Date(), hash % 30),
        status: ['completed', 'pending', 'generating'][hash % 3] as 'completed' | 'pending' | 'generating',
      };
    });
  }, [events]);

  const eventChartConfig: ChartConfig = {
    revenue: {
      label: 'Revenue',
      color: 'lab(58.8635% 31.6645 115.942)',
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
                <CardTitle className='text-lg font-bold flex items-center gap-2'>
                  <div className='p-1.5 rounded-lg bg-gradient-to-br from-primary/20 to-primary/10'>
                    <TrendingUp className='h-4 w-4 text-primary' />
                  </div>
                  Top Performing Events
                </CardTitle>
                <CardDescription className='mt-1 text-sm'>
                  Your best events by revenue performance
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className='h-48'>
              {isLoadingTopEvents ? (
                <div className='flex items-center justify-center h-full'>
                  <Loader2 className='h-6 w-6 animate-spin text-muted-foreground' />
                </div>
              ) : topEvents.length === 0 ? (
                <div className='flex flex-col items-center justify-center h-full text-center'>
                  <TrendingUp className='h-12 w-12 text-muted-foreground/50 mb-3' />
                  <p className='text-sm text-muted-foreground font-medium'>
                    No event data yet
                  </p>
                  <p className='text-xs text-muted-foreground mt-1'>
                    Create events to see performance metrics
                  </p>
                </div>
              ) : (
                <ChartContainer
                  config={eventChartConfig}
                  className='h-full w-full'
                >
                  <ResponsiveContainer width='100%' height='100%'>
                    <BarChart data={topEvents}>
                      <CartesianGrid
                        strokeDasharray='3 3'
                        vertical={false}
                        className='stroke-muted'
                      />
                      <XAxis
                        dataKey='name'
                        tickLine={false}
                        axisLine={false}
                        tick={{ fontSize: 11 }}
                        tickFormatter={(value: string) => {
                          const maxLength = 15;
                          return value.length > maxLength
                            ? `${value.substring(0, maxLength)}...`
                            : value;
                        }}
                      />
                      <YAxis
                        tickLine={false}
                        axisLine={false}
                        tick={{ fontSize: 11 }}
                        tickFormatter={(value: number) =>
                          value.toLocaleString('en-US')
                        }
                      />
                      <RechartsTooltip
                        cursor={{
                          fill: 'hsl(var(--muted))',
                          opacity: 0.4,
                        }}
                        content={<ChartTooltipContent />}
                      />
                      <Bar
                        dataKey='revenue'
                        fill={eventChartConfig.revenue.color}
                        radius={[4, 4, 0, 0]}
                      />
                    </BarChart>
                  </ResponsiveContainer>
                </ChartContainer>
              )}
            </div>
          </CardContent>
        </Card>
        <Card className='border-2 border-primary/10 shadow-xl bg-card/80 backdrop-blur-sm'>
          <CardHeader>
            <div className='flex items-center justify-between'>
              <div>
                <CardTitle className='text-lg font-bold flex items-center gap-2'>
                  <div className='p-1.5 rounded-lg bg-gradient-to-br from-primary/20 to-primary/10'>
                    <TrendingUp className='h-4 w-4 text-primary' />
                  </div>
                  Revenue Overview
                </CardTitle>
                <CardDescription className='mt-1 text-sm'>
                  Revenue from ticket sales
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className='space-y-4'>
              <div className='grid grid-cols-2 gap-4'>
                <div className='rounded-lg border border-border/60 bg-muted/30 p-4'>
                  <p className='text-xs text-muted-foreground mb-1'>
                    Total Revenue
                  </p>
                  <p className='text-2xl font-bold text-emerald-600'>
                    {formatCurrency(stats.totalRevenue)}
                  </p>
                </div>
                <div className='rounded-lg border border-border/60 bg-muted/30 p-4'>
                  <p className='text-xs text-muted-foreground mb-1'>
                    Available Balance
                  </p>
                  <p className='text-2xl font-bold text-blue-600'>
                    {formatCurrency(stats.availableRevenue)}
                  </p>
                </div>
                <div className='rounded-lg border border-border/60 bg-muted/30 p-4'>
                  <p className='text-xs text-muted-foreground mb-1'>
                    Pending Revenue
                  </p>
                  <p className='text-2xl font-bold text-amber-600'>
                    {formatCurrency(stats.pendingRevenue)}
                  </p>
                </div>
                <div className='rounded-lg border border-border/60 bg-muted/30 p-4'>
                  <p className='text-xs text-muted-foreground mb-1'>
                    Pending Withdrawals
                  </p>
                  <p className='text-2xl font-bold text-purple-600'>
                    {formatCurrency(stats.totalWithdrawals)}
                  </p>
                </div>
              </div>
              <Button
                variant='outline'
                className='w-full'
                onClick={() => router.push('/dashboard/creator/wallet')}
              >
                <Wallet className='mr-2 h-4 w-4' />
                View Wallet Details
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className='grid grid-cols-1 lg:grid-cols-6 gap-10'>
        <DashboardSection
          title='Upcoming Events'
          icon={Ticket}
          action={{
            label: 'View all',
            href: '/dashboard/creator/events',
          }}
          className='lg:col-span-3'
          isEmpty={!isLoading && upcomingEvents.length === 0}
          emptyState={{
            icon: Ticket,
            title: 'No upcoming events',
            description: 'Schedule events to see them here',
          }}
        >
          {upcomingEvents.length === 0 ? (
            <div className='flex flex-col items-center justify-center py-8 text-center'>
              <Ticket className='h-10 w-10 text-muted-foreground/50 mb-2' />
              <p className='text-sm text-muted-foreground font-medium'>
                No upcoming events
              </p>
              <p className='text-xs text-muted-foreground mt-1'>
                Schedule events to see them here
              </p>
            </div>
          ) : (
            <div className='space-y-0'>
              <Table>
                <TableHeader>
                  <TableRow className='hover:bg-transparent border-b'>
                    <TableHead className='w-12 font-semibold'>#</TableHead>
                    <TableHead className='font-semibold min-w-[200px]'>
                      Event
                    </TableHead>
                    <TableHead className='font-semibold text-right'>
                      Tickets Sold
                    </TableHead>
                    <TableHead className='font-semibold text-right'>
                      Revenue
                    </TableHead>
                    <TableHead className='font-semibold'>Start Date</TableHead>
                    <TableHead className='font-semibold'>End Date</TableHead>
                    <TableHead className='font-semibold'>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {upcomingEvents.map((event, index) => {
                    const eventImage = event.coverUrl || event.avatarUrl;
                    const startDate = event.startDate
                      ? new Date(event.startDate)
                      : null;

                    return (
                      <TableRow
                        key={event.id}
                        className='hover:bg-muted/50 cursor-pointer transition-colors'
                        onClick={() =>
                          router.push(`/dashboard/creator/events/${event.id}`)
                        }
                      >
                        <TableCell className='font-medium text-muted-foreground py-2'>
                          <div className='flex items-center justify-center w-7 h-7 rounded-full bg-muted font-bold text-xs'>
                            {index + 1}
                          </div>
                        </TableCell>
                        <TableCell className='py-2'>
                          <div className='flex items-center gap-2 min-w-0'>
                              {eventImage ? (
                                <div className='relative w-10 h-10 rounded-lg overflow-hidden bg-muted shrink-0'>
                                <Image
                                  src={eventImage}
                                  alt={event.displayName}
                                  fill
                                  className='object-cover'
                                  sizes='48px'
                                />
                              </div>
                              ) : (
                                <div className='w-10 h-10 rounded-lg bg-gradient-to-br from-primary/20 to-primary/10 flex items-center justify-center shrink-0'>
                                  <CalendarDays className='h-4 w-4 text-primary/60' />
                                </div>
                              )}
                            <div className='flex flex-col gap-1 min-w-0 flex-1'>
                              <span className='font-semibold text-sm truncate'>
                                {event.displayName || 'Untitled event'}
                              </span>
                              {event.location?.name && (
                                <div className='flex items-center gap-1 min-w-0'>
                                  <MapPin className='h-3 w-3 shrink-0 text-muted-foreground' />
                                  <span className='text-xs text-muted-foreground truncate'>
                                    {event.location.name}
                                  </span>
                                </div>
                              )}
                            </div>
                          </div>
                        </TableCell>
                        <TableCell className='text-right py-2'>
                          <div className='flex items-center justify-end gap-1.5'>
                            <Users className='h-3.5 w-3.5 text-muted-foreground' />
                            <span className='font-semibold text-sm'>
                              {event.ticketsSold?.toLocaleString() || '0'}
                            </span>
                          </div>
                        </TableCell>
                        <TableCell className='text-right py-2'>
                          <div className='flex items-center justify-end gap-1.5'>
                            <DollarSign className='h-3.5 w-3.5 text-emerald-600' />
                            <span className='font-bold text-sm text-emerald-600'>
                              {formatCurrency(event.revenue || 0)}
                            </span>
                          </div>
                        </TableCell>
                        <TableCell className='py-2'>
                          {startDate ? (
                            <span className='text-xs font-medium'>
                              {format(startDate, 'MMM dd, yyyy')}
                            </span>
                          ) : (
                            <span className='text-xs text-muted-foreground'>
                              Not scheduled
                            </span>
                          )}
                        </TableCell>
                        <TableCell className='py-2'>
                          {event.endDate ? (
                            <span className='text-xs font-medium'>
                              {format(new Date(event.endDate), 'MMM dd, yyyy')}
                            </span>
                          ) : (
                            <span className='text-xs text-muted-foreground'>
                              Not set
                            </span>
                          )}
                        </TableCell>
                        <TableCell className='py-2'>
                          <Badge
                            variant='secondary'
                            className='font-medium capitalize text-xs'
                          >
                            {event.status || 'DRAFT'}
                          </Badge>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          )}
        </DashboardSection>

        <DashboardSection
          title='Report List'
          icon={FileText}
          action={{
            label: 'View all',
            href: '/dashboard/creator/reports',
          }}
          className='lg:col-span-3'
          isEmpty={!isLoading && reportList.length === 0}
          emptyState={{
            icon: FileText,
            title: 'No reports yet',
            description: 'Reports will appear here once generated',
          }}
        >
          {reportList.length === 0 ? (
            <div className='flex items-center justify-center py-6'>
              <p className='text-sm text-muted-foreground'>
                No reports available.
              </p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow className='hover:bg-transparent border-b'>
                  <TableHead className='font-semibold'>Event Name</TableHead>
                  <TableHead className='font-semibold'>Report Type</TableHead>
                  <TableHead className='font-semibold'>Generated Date</TableHead>
                  <TableHead className='font-semibold'>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {reportList.map((report) => (
                  <TableRow
                    key={report.id}
                    className='hover:bg-muted/50 cursor-pointer transition-colors'
                  >
                    <TableCell className='font-medium text-sm py-2'>
                      {report.eventName}
                    </TableCell>
                    <TableCell className='text-xs text-muted-foreground py-2'>
                      {report.reportType}
                    </TableCell>
                    <TableCell className='text-xs text-muted-foreground py-2'>
                      {format(report.generatedDate, 'MMM dd, yyyy')}
                    </TableCell>
                    <TableCell className='py-2'>
                      <Badge
                        variant={
                          report.status === 'completed'
                            ? 'default'
                            : report.status === 'pending'
                            ? 'secondary'
                            : 'outline'
                        }
                        className='font-medium capitalize text-xs'
                      >
                        {report.status}
                      </Badge>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </DashboardSection>
      </div>
    </PageContainer>
  );
}