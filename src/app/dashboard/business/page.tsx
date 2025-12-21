'use client';

import { useMemo } from 'react';
import { useRouter } from 'next/navigation';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import {
  PlusCircle,
  Building2,
  Users,
  Calendar,
  DollarSign,
  Loader2,
  TrendingUp,
  ArrowRight,
  MapPin,
  CheckCircle2,
  Activity,
  Wallet,
  Eye,
  MessageCircle,
} from 'lucide-react';
import Link from 'next/link';
import { useMyLocations } from '@/hooks/locations/useMyLocations';
import { useOwnerLocationBookings } from '@/hooks/locations/useOwnerLocationBookings';
import {
  format,
  subDays,
  isSameMonth,
  subMonths,
} from 'date-fns';
import { DashboardSection, StatusBadge } from '@/components/dashboard';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { PageHeader } from '@/components/shared/PageHeader';
import { PageContainer } from '@/components/shared/PageContainer';
import { StatCard } from '@/components/shared/StatCard';
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
import LoadingCustom from '@/components/shared/LoadingCustom';
import { IconFile, IconLocation, IconStar } from '@tabler/icons-react';
import { useRevenueSummary, useTopLocationsByRevenue } from '@/hooks/dashboard/useDashboardOwner';

export default function BusinessDashboardPage() {
  const router = useRouter();

  const { data: locationsData, isLoading: isLoadingLocations } = useMyLocations(
    1,
    '',
    {
      limit: 100,
      sortBy: 'createdAt:DESC',
    }
  );

  const { data: bookingsData, isLoading: isLoadingBookings } =
    useOwnerLocationBookings({
      page: 1,
      limit: 500,
      sortBy: 'createdAt:DESC',
    });

  const { data: revenueData } = useRevenueSummary();

  const { data: topLocationsRaw, isLoading: isLoadingTopLocations } = useTopLocationsByRevenue(5);

  const locations = locationsData?.data || [];
  const locationsMeta = locationsData?.meta;
  const bookings = bookingsData?.data || [];
  const bookingsMeta = bookingsData?.meta;

  const isLoading = isLoadingLocations || isLoadingBookings;

  const stats = useMemo(() => {
    const totalLocations = locationsMeta?.totalItems || 0;
    const totalReviews = locations.reduce(
      (sum, loc) => sum + parseInt(loc.totalReviews || '0'),
      0
    );
    const totalCheckIns = locations.reduce(
      (sum, loc) => sum + parseInt(loc.totalCheckIns || '0'),
      0
    );
    const totalBookings = bookingsMeta?.totalItems || 0;

    const approvedLocations = locations.filter((loc) => {
      return loc.isVisibleOnMap;
    }).length;

    let visibleLocationsCount: number;
    if (locations.length === 0 || totalLocations === 0) {
      visibleLocationsCount = 0;
    } else if (locationsMeta && locationsMeta.totalItems <= locations.length) {
      visibleLocationsCount = approvedLocations;
    } else {
      const ratio = approvedLocations / locations.length;
      visibleLocationsCount = Math.round(ratio * totalLocations);
    }
    visibleLocationsCount = isNaN(visibleLocationsCount)
      ? 0
      : visibleLocationsCount;

    const now = new Date();
    const thirtyDaysAgo = subDays(now, 30);
    const previousThirtyDaysAgo = subDays(now, 60);

    const recentBookings = bookings.filter((booking) => {
      const bookingDate = new Date(booking.createdAt);
      return bookingDate >= thirtyDaysAgo;
    }).length;

    const previousPeriodBookings = bookings.filter((booking) => {
      const bookingDate = new Date(booking.createdAt);
      return (
        bookingDate >= previousThirtyDaysAgo && bookingDate < thirtyDaysAgo
      );
    }).length;

    const bookingsChange =
      previousPeriodBookings > 0
        ? ((recentBookings - previousPeriodBookings) / previousPeriodBookings) *
          100
        : recentBookings > 0
        ? 100
        : 0;

    const thisMonthBookings = bookings.filter((booking) => {
      const bookingDate = new Date(booking.createdAt);
      return isSameMonth(bookingDate, now);
    });

    const lastMonthBookings = bookings.filter((booking) => {
      const bookingDate = new Date(booking.createdAt);
      return isSameMonth(bookingDate, subMonths(now, 1));
    });

    const totalRevenue = revenueData?.totalRevenue || 0;
    const totalWithdrawals = revenueData?.pendingWithdraw || 0;
    const availableRevenue = revenueData?.availableBalance || 0;
    const pendingRevenue = revenueData?.pendingRevenue || 0;

    const thisMonthRevenue = thisMonthBookings
      .filter((b) => b.status?.toUpperCase() === 'PAYMENT_RECEIVED')
      .reduce((sum, b) => sum + parseFloat(b.amountToPay || '0'), 0);

    const lastMonthRevenue = lastMonthBookings
      .filter((b) => b.status?.toUpperCase() === 'PAYMENT_RECEIVED')
      .reduce((sum, b) => sum + parseFloat(b.amountToPay || '0'), 0);

    const revenueChange =
      lastMonthRevenue > 0
        ? ((thisMonthRevenue - lastMonthRevenue) / lastMonthRevenue) * 100
        : thisMonthRevenue > 0
        ? 100
        : 0;

    return {
      totalLocations,
      totalReviews,
      totalCheckIns,
      totalBookings,
      approvedLocations: visibleLocationsCount,
      recentBookings,
      bookingsChange,
      totalRevenue,
      availableRevenue,
      pendingRevenue,
      totalWithdrawals,
      thisMonthRevenue,
      revenueChange,
      hasMoreBookings:
        bookingsMeta && bookingsMeta.totalItems > bookings.length,
      hasMoreLocations:
        locationsMeta && locationsMeta.totalItems > locations.length,
    };
  }, [locations, locationsMeta, bookings, bookingsMeta, revenueData]);

  const topRevenueLocations = useMemo(() => {
    if (!topLocationsRaw) return [];
    return topLocationsRaw.map((loc) => ({
      name: loc.locationName,
      revenue: loc.revenue,
    }));
  }, [topLocationsRaw]);

  const recentLocations = locations.slice(0, 5);
  const recentBookingsList = bookings.slice(0, 3);

  if (isLoading) {
    return <LoadingCustom />;
  }

  const locationChartConfig: ChartConfig = {
    checkIns: {
      label: 'Revenue',
      color: 'lab(58.8635% 31.6645 115.942)',
    },
  };

  return (
    <PageContainer>
      {/* Professional Header */}
      <PageHeader
        title='Business Dashboard'
        description='Overview of your locations, bookings, and revenue'
        icon={Building2}
        actions={
          <>
            <Button
              variant='outline'
              onClick={() =>
                router.push('/dashboard/business/location-bookings')
              }
              className='h-11 border-2 border-primary/20 hover:border-primary/40'
            >
              <Calendar className='mr-2 h-4 w-4' />
              View Bookings
            </Button>
            <Button
              onClick={() =>
                router.push('/dashboard/business/locations/create')
              }
              className='h-11 bg-gradient-to-r from-primary to-primary/90 hover:from-primary/90 hover:to-primary shadow-lg'
            >
              <PlusCircle className='mr-2 h-4 w-4' />
              Add Location
            </Button>
          </>
        }
      />

      {/* Enhanced Statistics Cards */}
      <div className='grid gap-6 md:grid-cols-2 lg:grid-cols-4'>
        <StatCard
          title='Total Locations'
          value={stats.totalLocations}
          icon={Building2}
          color='blue'
          description={`${stats.approvedLocations} visible on map`}
          onClick={() => router.push('/dashboard/business/locations')}
        />

        <StatCard
          title='Total Bookings'
          value={stats.totalBookings}
          icon={Calendar}
          color='purple'
          description={`${stats.recentBookings} in last 30 days`}
          onClick={() => router.push('/dashboard/business/location-bookings')}
        />

        <StatCard
          title='Total Check-ins'
          value={stats.totalCheckIns}
          icon={Users}
          color='emerald'
          description='Across all locations'
          onClick={() => router.push('/dashboard/business/locations')}
        />

        <StatCard
          title='Total Reviews'
          value={stats.totalReviews}
          icon={MessageCircle}
          color='amber'
          description='Across all locations'
          onClick={() => router.push('/dashboard/business/locations')}
        />
      </div>

      {/* Charts Section */}
      <div className='grid gap-6 md:grid-cols-2'>
        <Card className='border-2 border-primary/10 shadow-xl bg-card/80 backdrop-blur-sm'>
          <CardHeader>
            <div className='flex items-center justify-between'>
              <div>
                <CardTitle className='text-base flex items-center gap-2'>
                  <Activity className='h-4 w-4 text-primary' />
                  Top Locations by Revenue
                </CardTitle>
                <CardDescription className='mt-1'>
                  Your best performing locations
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className='h-64'>
              {isLoadingTopLocations ? (
                <div className='flex items-center justify-center h-full'>
                  <Loader2 className='h-6 w-6 animate-spin text-muted-foreground' />
                </div>
              ) : topRevenueLocations.length === 0 ? (
                <div className='flex flex-col items-center justify-center h-full text-center'>
                  <Building2 className='h-12 w-12 text-muted-foreground/50 mb-3' />
                  <p className='text-sm text-muted-foreground font-medium'>
                    No revenue data yet
                  </p>
                  <p className='text-xs text-muted-foreground mt-1'>
                    Revenue will appear once customers book your locations
                  </p>
                </div>
              ) : (
                <ChartContainer
                  config={locationChartConfig}
                  className='h-full w-full'
                >
                  <ResponsiveContainer width='100%' height='100%'>
                    <BarChart data={topRevenueLocations}>
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
                        fill={locationChartConfig.checkIns.color}
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
                  Overall financial summary
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
                onClick={() => router.push('/dashboard/business/wallet')}
              >
                <Wallet className='mr-2 h-4 w-4' />
                View Wallet Details
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Content Grid */}
      <div className='grid grid-cols-1 lg:grid-cols-5 gap-10'>
        <DashboardSection
          title='Recent Locations'
          icon={Building2}
          action={{
            label: 'View all',
            href: '/dashboard/business/locations',
          }}
          className='lg:col-span-3'
          isEmpty={!isLoadingLocations && recentLocations.length === 0}
          emptyState={{
            icon: Building2,
            title: 'No locations yet',
            description: 'Get started by adding your first location',
            action: {
              label: 'Add Your First Location',
              href: '/dashboard/business/locations/create',
            },
          }}
        >
          <Table>
            <TableHeader>
              <TableRow className='hover:bg-transparent border-b'>
                <TableHead className='font-semibold w-[50%]'>Name</TableHead>
                <TableHead className='font-semibold w-[10%] '>Radius</TableHead>
                <TableHead className='font-semibold w-[20%] '>
                  Interaction
                </TableHead>
                <TableHead className='font-semibold w-[20%] '>
                  Visible on map
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {recentLocations.map((location) => (
                <TableRow
                  key={location.id}
                  className='hover:bg-muted/50 cursor-pointer transition-colors'
                  onClick={() =>
                    router.push(
                      `/dashboard/business/locations/${location.id}`
                    )
                  }
                >
                  <TableCell className='font-medium'>
                    <div className='flex items-start gap-2 min-w-0 max-w-96'>
                      {location.imageUrl && location.imageUrl.length > 0 ? (
                        <img
                          src={location.imageUrl[0]}
                          alt={location.name}
                          className='h-10 w-10 rounded object-cover shrink-0 mt-0.5'
                        />
                      ) : (
                        <div className='h-8 w-8 rounded bg-muted shrink-0 flex items-center justify-center mt-0.5'>
                          <Building2 className='h-4 w-4 text-muted-foreground' />
                        </div>
                      )}
                      <div className='flex flex-col gap-1 min-w-0 flex-1'>
                        <span className='truncate font-medium'>
                          {location.name}
                        </span>
                        {location.addressLine && (
                          <div className='flex items-center gap-1 min-w-0 max-w-[300px]'>
                            <MapPin className='h-3 w-3 shrink-0 text-muted-foreground' />
                            <span className='text-xs text-muted-foreground truncate'>
                              {location.addressLine}
                              {location.addressLevel2 &&
                                `, ${location.addressLevel2}`}
                            </span>
                          </div>
                        )}
                      </div>
                    </div>
                  </TableCell>
                  <TableCell className='font-medium'>
                    <div className='flex items-center gap-1'>
                      <IconLocation className='h-3 w-3' />
                      {location.radiusMeters || 0} m
                    </div>
                  </TableCell>
                  <TableCell className='font-medium'>
                    <div className='flex items-center gap-3'>
                      <div className='flex items-center gap-1'>
                        <Users className='h-3 w-3' />
                        {location.totalCheckIns || 0}
                      </div>
                      <div className='flex items-center gap-1'>
                        <IconStar className='h-3 w-3' />
                        {location.totalReviews || 0}
                      </div>
                      <div className='flex items-center gap-1'>
                        <IconFile className='h-3 w-3' />
                        {location.averageRating || 0}
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    {location.isVisibleOnMap ? (
                      <Badge
                        variant='default'
                        className='bg-emerald-500 hover:bg-emerald-600'
                      >
                        <CheckCircle2 className='h-3 w-3 mr-1' />
                        Visible
                      </Badge>
                    ) : (
                      <Badge variant='secondary' className='font-medium'>
                        <Eye className='h-3 w-3 mr-1' />
                        Hidden
                      </Badge>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </DashboardSection>
        <DashboardSection
          title='Recent Bookings'
          icon={Calendar}
          action={{
            label: 'View all',
            href: '/dashboard/business/location-bookings',
          }}
          className='lg:col-span-2'
          isEmpty={!isLoadingBookings && recentBookingsList.length === 0}
          emptyState={{
            icon: Calendar,
            title: 'No bookings yet',
            description:
              'Bookings will appear here when creators book your locations',
          }}
        >
          {isLoadingBookings ? (
            <div className='flex items-center justify-center py-8'>
              <Loader2 className='h-5 w-5 animate-spin text-muted-foreground' />
            </div>
          ) : (
            <div className='space-y-3'>
              {recentBookingsList.map((booking) => {
                const bookingDate = booking.dates?.[0]?.startDateTime
                  ? new Date(booking.dates[0].startDateTime)
                  : new Date(booking.createdAt);
                const isUpcoming = bookingDate >= new Date();

                return (
                  <Link
                    key={booking.id}
                    href={`/dashboard/business/location-bookings/${booking.id}`}
                    className='block'
                  >
                    <div className='flex flex-col p-4 border-2 rounded-lg bg-muted/30 hover:bg-muted/50 transition-all shadow-sm cursor-pointer hover:shadow-md'>
                      <div className='flex items-start justify-between mb-2'>
                        <div className='flex-1 min-w-0'>
                          <p className='font-semibold text-sm truncate'>
                            {booking.location?.name || 'Location'}
                          </p>
                          {booking.referencedEventRequest?.eventName && (
                            <p className='text-xs text-muted-foreground mt-0.5 truncate'>
                              {booking.referencedEventRequest.eventName}
                            </p>
                          )}
                        </div>
                        <StatusBadge status={booking.status || ''} />
                      </div>
                      <div className='flex items-center gap-3 text-xs text-muted-foreground mb-2'>
                        <span className='flex items-center gap-1'>
                          <Calendar className='h-3 w-3' />
                          {format(bookingDate, 'MMM dd, yyyy')}
                        </span>
                        {isUpcoming && (
                          <Badge variant='outline' className='text-xs'>
                            Upcoming
                          </Badge>
                        )}
                      </div>
                      <div className='flex items-center justify-between'>
                        <p className='text-sm font-semibold text-emerald-600'>
                          {formatCurrency(
                            parseFloat(booking.amountToReceive || '0')
                          )}
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