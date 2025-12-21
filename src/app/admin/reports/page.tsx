'use client';

import { useState, useMemo, useEffect } from 'react';
import { useDebounce } from 'use-debounce';
import { useRouter, useSearchParams, usePathname } from 'next/navigation';
import {
  Card,
  CardContent,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Tabs,
  TabsList,
  TabsTrigger,
} from '@/components/ui/tabs';
import {
  FlagIcon,
  Loader2,
} from 'lucide-react';
import {
  CheckCircle,
  Clock,
  FlagOffIcon,
} from 'lucide-react';
import {
  ReportTargetType,
  Report,
} from '@/types';
import { useHighestReportedPosts } from '@/hooks/admin/useHighestReportedPosts';
import { useHighestReportedLocations } from '@/hooks/admin/useHighestReportedLocations';
import { useHighestReportedEvents } from '@/hooks/admin/useHighestReportedEvents';
import { useHighestReportedBookings } from '@/hooks/admin/useHighestReportedBookings';
import { useReports } from '@/hooks/admin/useReports';
import { useReportAnalytics } from '@/hooks/admin/useReportAnalytics';

type ReportFilterType = ReportTargetType | 'all';

type TransformedReportItem = {
  id: string;
  targetType: ReportTargetType;
  targetId: string;
  name: string;
  description: string;
  reportCount: number;
  createdAt: string;
  reports?: Report[];
  denormSecondaryTargetId?: string;
  postData?: HighestReportedPost;
  locationData?: HighestReportedLocation;
  eventData?: HighestReportedEvent;
  bookingData?: HighestReportedBooking;
  reportData?: Report;
  status?: string;
};

import type {
  HighestReportedPost,
  HighestReportedLocation,
  HighestReportedEvent,
  HighestReportedBooking,
} from '@/api/reports';
import { useQueryClient } from '@tanstack/react-query';
import { Badge } from '@/components/ui/badge';
import { PageContainer } from '@/components/shared';
import StatisticCard from '@/components/admin/StatisticCard';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { IconSearch, IconRefresh, IconChartBar } from '@tabler/icons-react';

function getTypeBadge(type: ReportTargetType) {
  const colors: Record<ReportTargetType, string> = {
    post: 'bg-purple-50 text-purple-700 border-purple-300 dark:bg-purple-950 dark:text-purple-300',
    location:
      'bg-blue-50 text-blue-700 border-blue-300 dark:bg-blue-950 dark:text-blue-300',
    event:
      'bg-orange-50 text-orange-700 border-orange-300 dark:bg-orange-950 dark:text-orange-300',
    booking:
      'bg-green-50 text-green-700 border-green-300 dark:bg-green-950 dark:text-green-300',
  };

  return (
    <Badge variant='outline' className={colors[type]}>
      {type.charAt(0).toUpperCase() + type.slice(1)}
    </Badge>
  );
}

export default function ReportsPage() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const queryClient = useQueryClient();

  // Initialize state from URL params or defaults
  const [searchTerm, setSearchTerm] = useState(
    searchParams.get('search') || ''
  );
  const [debouncedSearchTerm] = useDebounce(searchTerm, 300);
  const [typeFilter, setTypeFilter] = useState<ReportFilterType>(
    (searchParams.get('type') as ReportFilterType) || 'post'
  );
  const [page, setPage] = useState(Number(searchParams.get('page')) || 1);
  const itemsPerPage = 10;

  // Update URL when filters change
  useEffect(() => {
    const params = new URLSearchParams(searchParams.toString());
    const trimmedSearch = debouncedSearchTerm.trim();

    if (trimmedSearch) {
      params.set('search', trimmedSearch);
    } else {
      params.delete('search');
    }

    params.set('type', typeFilter);

    if (page > 1) {
      params.set('page', page.toString());
    } else {
      params.delete('page');
    }

    router.replace(`${pathname}?${params.toString()}`);
  }, [
    debouncedSearchTerm,
    typeFilter,
    page,
    pathname,
    router,
    searchParams,
  ]);

  // Data fetching based on type
  const {
    data: postsResponse,
    isLoading: isLoadingPosts,
    isFetching: isFetchingPosts,
  } = useHighestReportedPosts(page, itemsPerPage);

  const {
    data: locationsResponse,
    isLoading: isLoadingLocations,
    isFetching: isFetchingLocations,
  } = useHighestReportedLocations(page, itemsPerPage);

  const {
    data: eventsResponse,
    isLoading: isLoadingEvents,
    isFetching: isFetchingEvents,
  } = useHighestReportedEvents(page, itemsPerPage);

  const {
    data: bookingsResponse,
    isLoading: isLoadingBookings,
    isFetching: isFetchingBookings,
  } = useHighestReportedBookings(page, itemsPerPage);

  // All reports data fetching
  const {
    data: allReportsResponse,
    isLoading: isLoadingAllReports,
    isFetching: isFetchingAllReports,
  } = useReports({
    page,
    limit: itemsPerPage,
    sortBy: 'createdAt:DESC',
  });

  // Report analytics
  const {
    data: reportAnalytics,
    isLoading: isLoadingAnalytics,
  } = useReportAnalytics();

  // Determine which data to use based on typeFilter
  const isLoading =
    typeFilter === 'all'
      ? isLoadingAllReports
      : typeFilter === 'post'
        ? isLoadingPosts
        : typeFilter === 'location'
          ? isLoadingLocations
          : typeFilter === 'event'
            ? isLoadingEvents
            : isLoadingBookings;
  const isFetching =
    typeFilter === 'all'
      ? isFetchingAllReports
      : typeFilter === 'post'
        ? isFetchingPosts
        : typeFilter === 'location'
          ? isFetchingLocations
          : typeFilter === 'event'
            ? isFetchingEvents
            : isFetchingBookings;

  // Transform data to a common format for rendering
  const reports = useMemo(() => {
    if (typeFilter === 'all' && allReportsResponse?.data) {
      return allReportsResponse.data.map((report: Report) => ({
        ...report,
        id: report.id,
        targetType: report.targetType,
        targetId: report.targetId,
        name: report.title,
        description: report.description || '',
        reportCount: 1,
        createdAt: report.createdAt,
        status: report.status,
        reportData: report,
        denormSecondaryTargetId: report.denormSecondaryTargetId,
      }));
    }
    if (typeFilter === 'post' && postsResponse?.data) {
      return postsResponse.data.map((post: HighestReportedPost) => ({
        ...post,
        id: post.postId,
        targetType: 'post' as ReportTargetType,
        targetId: post.postId,
        name: post.content.substring(0, 100) + (post.content.length > 100 ? '...' : ''),
        description: post.content,
        reports: post.reports,
        reportCount: post.reports.length,
        createdAt: post.createdAt,
        postData: post,
      }));
    }
    if (typeFilter === 'location' && locationsResponse?.data) {
      return locationsResponse.data.map((location: HighestReportedLocation) => ({
        ...location,
        id: location.id,
        targetType: 'location' as ReportTargetType,
        targetId: location.id,
        name: location.name,
        description: location.description || '',
        reports: location.reports,
        reportCount: location.reports.length,
        createdAt: location.reports[0]?.createdAt || new Date().toISOString(),
        locationData: location,
      }));
    }
    if (typeFilter === 'event' && eventsResponse?.data) {
      return eventsResponse.data.map((event: HighestReportedEvent) => ({
        ...event,
        id: event.id,
        targetType: 'event' as ReportTargetType,
        targetId: event.id,
        name: event.displayName,
        description: event.description || '',
        reports: event.reports,
        reportCount: event.reports.length,
        createdAt: event.reports[0]?.createdAt || new Date().toISOString(),
        eventData: event,
      }));
    }
    if (typeFilter === 'booking' && bookingsResponse?.data) {
      return bookingsResponse.data.map((booking: HighestReportedBooking) => ({
        ...booking,
        id: booking.id,
        targetType: 'booking' as ReportTargetType,
        targetId: booking.id,
        name: booking.location?.name || 'Unknown Location',
        description: `Status: ${booking.status} | Amount: ${booking.amountToPay}`,
        reports: booking.reports,
        reportCount: booking.reports.length,
        createdAt: booking.reports[0]?.createdAt || booking.createdAt,
        bookingData: booking,
        denormSecondaryTargetId: booking.locationId,
      }));
    }
    return [];
  }, [typeFilter, allReportsResponse, postsResponse, locationsResponse, eventsResponse, bookingsResponse]);

  const meta = useMemo(() => {
    if (typeFilter === 'all' && allReportsResponse?.meta) {
      return {
        totalItems: allReportsResponse.meta.totalItems,
        totalPages: allReportsResponse.meta.totalPages,
        currentPage: allReportsResponse.meta.currentPage,
        itemsPerPage: allReportsResponse.meta.itemsPerPage,
      };
    }
    if (typeFilter === 'post' && postsResponse) {
      return {
        totalItems: postsResponse.count,
        totalPages: Math.ceil(postsResponse.count / itemsPerPage),
        currentPage: postsResponse.page,
        itemsPerPage: postsResponse.limit,
      };
    }
    if (typeFilter === 'location' && locationsResponse) {
      return {
        totalItems: locationsResponse.count,
        totalPages: Math.ceil(locationsResponse.count / itemsPerPage),
        currentPage: locationsResponse.page,
        itemsPerPage: locationsResponse.limit,
      };
    }
    if (typeFilter === 'event' && eventsResponse) {
      return {
        totalItems: eventsResponse.count,
        totalPages: Math.ceil(eventsResponse.count / itemsPerPage),
        currentPage: eventsResponse.page,
        itemsPerPage: eventsResponse.limit,
      };
    }
    if (typeFilter === 'booking' && bookingsResponse) {
      return {
        totalItems: bookingsResponse.count,
        totalPages: Math.ceil(bookingsResponse.count / itemsPerPage),
        currentPage: bookingsResponse.page,
        itemsPerPage: bookingsResponse.limit,
      };
    }
    return undefined;
  }, [typeFilter, allReportsResponse, postsResponse, locationsResponse, eventsResponse, bookingsResponse, itemsPerPage]);

  const refresh = () => {
    queryClient.invalidateQueries({ queryKey: ['adminReports'] });
    queryClient.invalidateQueries({ queryKey: ['highestReportedPosts'] });
    queryClient.invalidateQueries({ queryKey: ['highestReportedLocations'] });
    queryClient.invalidateQueries({ queryKey: ['highestReportedEvents'] });
    queryClient.invalidateQueries({ queryKey: ['highestReportedBookings'] });
    queryClient.invalidateQueries({ queryKey: ['reportAnalytics'] });
  };

  const formatDateTime = (dateString?: string) => {
    if (!dateString) return '-';
    return new Date(dateString).toLocaleString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  // Statistics from analytics API
  const stats = useMemo(() => {
    return {
      total: reportAnalytics?.totalReports ?? 0,
      pending: reportAnalytics?.countPending ?? 0,
      closed: reportAnalytics?.countClosed ?? 0,
      byType: {
        location: reportAnalytics?.countTotalLocationReports ?? 0,
        event: reportAnalytics?.countTotalEventReports ?? 0,
        post: reportAnalytics?.countTotalPostReports ?? 0,
        booking: reportAnalytics?.countTotalBookingReports ?? 0,
      },
    };
  }, [reportAnalytics]);

  // Filter reports based on search term
  const filteredReports = useMemo(() => {
    if (!debouncedSearchTerm.trim()) return reports;
    const search = debouncedSearchTerm.toLowerCase();
    return reports.filter((item) => {
      return (
        item.name.toLowerCase().includes(search) ||
        item.description.toLowerCase().includes(search) ||
        item.id.toLowerCase().includes(search)
      );
    });
  }, [reports, debouncedSearchTerm]);

  // Extract counts for tabs
  const tabCounts = useMemo(() => {
    return {
      post: postsResponse?.count ?? 0,
      location: locationsResponse?.count ?? 0,
      event: eventsResponse?.count ?? 0,
      booking: bookingsResponse?.count ?? 0,
      all: allReportsResponse?.meta?.totalItems ?? 0,
    };
  }, [postsResponse?.count, locationsResponse?.count, eventsResponse?.count, bookingsResponse?.count, allReportsResponse?.meta?.totalItems]);

  return (
    <PageContainer>
      {/* Statistics Cards */}
      <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-10'>
        <div>
          <StatisticCard
            title='Total Reports'
            subtitle='All reports'
            value={isLoadingAnalytics ? 0 : stats.total}
            icon={FlagIcon}
            iconColorClass='blue'
          />
        </div>

        <div>
          <StatisticCard
            title='Pending'
            subtitle='Awaiting review'
            value={isLoadingAnalytics ? 0 : stats.pending}
            icon={Clock}
            iconColorClass='amber'
          />
        </div>

        <div>
          <StatisticCard
            title='Closed'
            subtitle='Closed reports'
            value={isLoadingAnalytics ? 0 : stats.closed}
            icon={CheckCircle}
            iconColorClass='green'
          />
        </div>

        <div>
          <Card className='hover:shadow-md transition-shadow border-l-6 border-blue-500'>
            <CardContent className='pt-0'>
              <header className='mb-1 flex items-center gap-2'>
                <IconChartBar className='h-4 w-4 text-muted-foreground' />
                <h3 className='text-md font-medium'>Total Reports by Type</h3>
              </header>
              <div className=''>
                <div className='flex items-center justify-between'>
                  <span className='text-xs text-muted-foreground'>Locations</span>
                  <span className='text-base font-semibold'>{isLoadingAnalytics ? 0 : stats.byType.location}</span>
                </div>
                <div className='flex items-center justify-between'>
                  <span className='text-xs text-muted-foreground'>Events</span>
                  <span className='text-base font-semibold'>{isLoadingAnalytics ? 0 : stats.byType.event}</span>
                </div>
                <div className='flex items-center justify-between'>
                  <span className='text-xs text-muted-foreground'>Posts</span>
                  <span className='text-base font-semibold'>{isLoadingAnalytics ? 0 : stats.byType.post}</span>
                </div>
                <div className='flex items-center justify-between'>
                  <span className='text-xs text-muted-foreground'>Bookings</span>
                  <span className='text-base font-semibold'>{isLoadingAnalytics ? 0 : stats.byType.booking}</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Table Section */}
      <Card className='mt-6 py-0 pb-6'>
        <CardContent className='pt-0'>
          <div className='pt-6 pb-6 border-b'>
            <div className='flex flex-col gap-4 md:flex-row md:items-center md:justify-between'>
              <div>
                <h2 className='text-2xl font-bold'>Reports</h2>
                <p className='text-sm text-muted-foreground mt-1'>
                  Found {meta?.totalItems || 0} {typeFilter === 'all' ? 'reports' : typeFilter === 'post' ? 'posts' : typeFilter === 'location' ? 'locations' : typeFilter === 'event' ? 'events' : 'bookings'} with Pending Reports
                </p>
              </div>
              <div className='flex items-center gap-2'>
                <div className='relative flex-1 md:flex-initial'>
                  <IconSearch className='absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground' />
                  <Input
                    placeholder='Search...'
                    className='pl-9 w-full md:w-[300px]'
                    value={searchTerm}
                    onChange={(e) => {
                      setSearchTerm(e.target.value);
                      setPage(1);
                    }}
                  />
                </div>
                <Button
                  variant='outline'
                  size='icon'
                  onClick={refresh}
                  disabled={isFetching}
                >
                  {isFetching ? (
                    <Loader2 className='h-4 w-4 animate-spin' />
                  ) : (
                    <IconRefresh className='h-4 w-4' />
                  )}
                </Button>
              </div>
            </div>
          </div>

          {/* Tabs */}
          <div className='py-6 border-b'>
            <Tabs
              value={typeFilter}
              onValueChange={(value) => {
                setTypeFilter(value as ReportFilterType);
                setPage(1);
              }}
            >
              <TabsList>
                <TabsTrigger value='post'>
                  Posts
                  {tabCounts.post > 0 && (
                    <Badge variant='secondary' className='ml-2'>
                      {tabCounts.post}
                    </Badge>
                  )}
                </TabsTrigger>
                <TabsTrigger value='location'>
                  Locations
                  {tabCounts.location > 0 && (
                    <Badge variant='secondary' className='ml-2'>
                      {tabCounts.location}
                    </Badge>
                  )}
                </TabsTrigger>
                <TabsTrigger value='event'>
                  Events
                  {tabCounts.event > 0 && (
                    <Badge variant='secondary' className='ml-2'>
                      {tabCounts.event}
                    </Badge>
                  )}
                </TabsTrigger>
                <TabsTrigger value='booking'>
                  Bookings
                  {tabCounts.booking > 0 && (
                    <Badge variant='secondary' className='ml-2'>
                      {tabCounts.booking}
                    </Badge>
                  )}
                </TabsTrigger>
                <div className='mx-2 h-4 w-px bg-border' />
                <TabsTrigger value='all'>
                  All Reports
                  {tabCounts.all > 0 && (
                    <Badge variant='secondary' className='ml-2'>
                      {tabCounts.all}
                    </Badge>
                  )}
                </TabsTrigger>
              </TabsList>
            </Tabs>
          </div>

          {/* Table */}
          <div className='overflow-x-auto'>
            {isLoading ? (
              <div className='flex items-center justify-center h-64'>
                <Loader2 className='h-8 w-8 animate-spin text-muted-foreground' />
              </div>
            ) : filteredReports.length === 0 ? (
              <div className='flex items-center justify-center h-64 text-muted-foreground'>
                <div className='text-center'>
                  <FlagOffIcon className='h-12 w-12 mx-auto mb-2 opacity-50' />
                  <p>No {typeFilter === 'all' ? 'reports' : typeFilter === 'booking' ? 'bookings' : `${typeFilter}s`} found</p>
                </div>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className='w-16'>#</TableHead>
                    <TableHead>Name</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Report Count</TableHead>
                    <TableHead>Created At</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredReports.map((item: TransformedReportItem, index: number) => {
                    const rowNumber = (page - 1) * itemsPerPage + index + 1;
                    const isEvent = item.targetType === 'event';
                    const isPost = item.targetType === 'post';
                    const isLocation = item.targetType === 'location';
                    const isBooking = item.targetType === 'booking';
                    const isClickable = isEvent || isPost || isLocation || isBooking;
                    const handleRowClick = () => {
                      if (isEvent) {
                        router.push(`/admin/events/${item.targetId}?tab=reports`);
                      } else if (isPost) {
                        router.push(`/admin/posts/${item.targetId}?tab=reports`);
                      } else if (isLocation) {
                        router.push(`/admin/locations/${item.targetId}?tab=reports`);
                      } else if (isBooking) {
                        router.push(`/admin/locations/${item.denormSecondaryTargetId}?tab=booking-reports`);
                      }
                    };
                    return (
                      <TableRow 
                        key={item.id}
                        onClick={handleRowClick}
                        className={isClickable ? 'cursor-pointer hover:bg-muted/50' : ''}
                      >
                        <TableCell className='text-sm text-muted-foreground'>
                          {rowNumber}
                        </TableCell>
                        <TableCell className='font-medium'>
                          <div className='max-w-[300px]'>
                            <div className='truncate' title={item.name}>
                              {item.name}
                            </div>
                            {item.description && (
                              <div className='truncate text-sm text-muted-foreground mt-1' title={item.description}>
                                {item.description}
                              </div>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>{getTypeBadge(item.targetType)}</TableCell>
                        <TableCell>
                          <Badge
                            variant='outline'
                            className='bg-red-50 text-red-700 border-red-300 dark:bg-red-950 dark:text-red-300'
                          >
                            {item.reportCount} {item.reportCount === 1 ? 'report' : 'reports'}
                          </Badge>
                        </TableCell>
                        <TableCell className='text-sm text-muted-foreground'>
                          {formatDateTime(item.createdAt)}
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            )}
          </div>

          {/* Pagination */}
          {meta && meta.totalPages > 1 && (
            <div className='py-6 border-t flex items-center justify-between'>
              <div className='text-sm text-muted-foreground'>
                Showing page {page} of {meta.totalPages} ({meta.totalItems} total)
              </div>
              <div className='flex items-center gap-2'>
                <Button
                  variant='outline'
                  size='sm'
                  onClick={() => setPage(page - 1)}
                  disabled={page <= 1}
                >
                  Previous
                </Button>
                <Button
                  variant='outline'
                  size='sm'
                  onClick={() => setPage(page + 1)}
                  disabled={page >= meta.totalPages}
                >
                  Next
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </PageContainer>
  );
}
