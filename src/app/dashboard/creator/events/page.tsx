'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  CalendarDays,
  PlusCircle,
  Search,
  TrendingUp,
  MapPin,
  Tag as TagIcon,
  Loader2,
  CheckCircle2,
  FileText,
  XCircle,
  Clock,
  RefreshCw,
  ImageIcon,
} from 'lucide-react';
import Image from 'next/image';
import { useState, useMemo } from 'react';
import { useDebounce } from 'use-debounce';
import { useMyEvents } from '@/hooks/events/useMyEvents';
import Link from 'next/link';
import type { Event } from '@/types';
import {
  SortableTableHeader,
  SortDirection,
} from '@/components/shared/SortableTableHeader';
import { TableFilters } from '@/components/shared/TableFilters';
import { PageHeader } from '@/components/shared/PageHeader';
import { PageContainer } from '@/components/shared/PageContainer';
import { StatCard } from '@/components/shared/StatCard';
import { formatCurrency } from '@/lib/utils';
import { IconUsers } from '@tabler/icons-react';

// Event data will come from API

const getStatusLabel = (status: string) => {
  return (
    status?.charAt(0).toUpperCase() + status?.slice(1).toLowerCase() || status
  );
};

const getStatusIcon = (status: string) => {
  const statusUpper = status?.toUpperCase();
  switch (statusUpper) {
    case 'PUBLISHED':
    case 'ACTIVE':
      return <CheckCircle2 className='h-3 w-3' />;
    case 'DRAFT':
      return <FileText className='h-3 w-3' />;
    case 'COMPLETED':
      return <CheckCircle2 className='h-3 w-3' />;
    case 'CANCELLED':
      return <XCircle className='h-3 w-3' />;
    default:
      return <Clock className='h-3 w-3' />;
  }
};

const getStatusBadgeStyle = (status: string) => {
  const statusUpper = status?.toUpperCase();
  switch (statusUpper) {
    case 'PUBLISHED':
    case 'ACTIVE':
      return 'bg-green-100 text-green-800 border-green-200 dark:bg-green-900/30 dark:text-green-400 dark:border-green-800';
    case 'DRAFT':
      return 'bg-yellow-100 text-yellow-800 border-yellow-200 dark:bg-yellow-900/30 dark:text-yellow-400 dark:border-yellow-800';
    case 'COMPLETED':
      return 'bg-blue-100 text-blue-800 border-blue-200 dark:bg-blue-900/30 dark:text-blue-400 dark:border-blue-800';
    case 'CANCELLED':
      return 'bg-red-100 text-red-800 border-red-200 dark:bg-red-900/30 dark:text-red-400 dark:border-red-800';
    default:
      return '';
  }
};

export default function CreatorEventsPage() {
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [page, setPage] = useState(1);
  const [sort, setSort] = useState<{
    column: string;
    direction: SortDirection;
  }>({
    column: 'createdAt',
    direction: 'DESC',
  });
  const [debouncedSearchTerm] = useDebounce(search, 300);

  const sortBy = sort.direction
    ? `${sort.column}:${sort.direction}`
    : undefined;

  const {
    data: eventsData,
    isLoading,
    refetch,
  } = useMyEvents({
    page,
    limit: 10,
    search: debouncedSearchTerm,
    sortBy: sortBy || 'createdAt:DESC',
  });

  const allEvents = eventsData?.data || [];
  console.log('🚀 ~ CreatorEventsPage ~ allEvents:', allEvents);
  const meta = eventsData?.meta;

  // Filter events by status if status filter is set
  const events =
    statusFilter === 'all'
      ? allEvents
      : allEvents.filter(
          (event) => event.status?.toUpperCase() === statusFilter.toUpperCase()
        );

  // Calculate statistics from actual data
  const stats = {
    totalEvents: meta?.totalItems ?? 0,
    activeEvents: events.filter(
      (e) =>
        e.status?.toUpperCase() === 'PUBLISHED' ||
        e.status?.toUpperCase() === 'ACTIVE'
    ).length,
    draftEvents: events.filter((e) => e.status?.toUpperCase() === 'DRAFT')
      .length,
    finishedEvents: events.filter((e) => e.status?.toUpperCase() === 'FINISHED')
      .length,
    totalTags: events.reduce((sum, e) => sum + (e.tags?.length || 0), 0),
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  const formatTime = (dateString: string) => {
    return new Date(dateString).toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: true,
    });
  };

  const handleSort = (column: string, direction: SortDirection) => {
    setSort({ column, direction });
    setPage(1);
  };

  const activeFiltersCount = useMemo(() => {
    let count = 0;
    if (statusFilter !== 'all') count++;
    if (debouncedSearchTerm) count++;
    return count;
  }, [statusFilter, debouncedSearchTerm]);

  const handleClearFilters = () => {
    setSearch('');
    setStatusFilter('all');
    setSort({ column: 'createdAt', direction: 'DESC' });
    setPage(1);
  };

  return (
    <PageContainer>
      {/* Professional Header */}
      <PageHeader
        title='My Events'
        description='View and manage your events'
        icon={CalendarDays}
        actions={
          <Button
            onClick={() =>
              (window.location.href = '/dashboard/creator/request/create')
            }
            className='h-11 bg-gradient-to-r from-primary to-primary/90 hover:from-primary/90 hover:to-primary shadow-lg'
          >
            <PlusCircle className='mr-2 h-4 w-4' />
            Create Event
          </Button>
        }
      />

      {/* Quick Statistics */}
      <div className='grid gap-6 md:grid-cols-2 lg:grid-cols-4'>
        <StatCard
          title='Total Events'
          value={stats.totalEvents}
          icon={CalendarDays}
          color='blue'
          description='All time'
        />

        <StatCard
          title='Active Events'
          value={stats.activeEvents}
          icon={TrendingUp}
          color='emerald'
          description='Currently active'
        />
        <StatCard
          title='Finished Events'
          value={stats.finishedEvents}
          icon={CheckCircle2}
          color='purple'
          description='Completed events'
        />
        <StatCard
          title='Draft Events'
          value={stats.draftEvents}
          icon={FileText}
          color='amber'
          description='Not published yet'
        />
      </div>

      {/* Events Table */}
      <Card className='overflow-hidden border-2 border-primary/10 shadow-xl bg-card/80 backdrop-blur-sm'>
        <CardContent className='p-0'>
          <div className='flex flex-col h-full'>
            {/* Search and Filter Section */}
            <TableFilters
              searchValue={search}
              onSearchChange={(value) => {
                setSearch(value);
                setPage(1);
              }}
              searchPlaceholder='Search by event name'
              filters={[
                {
                  key: 'status',
                  label: 'Status',
                  value: statusFilter,
                  options: [
                    { value: 'all', label: 'All Status' },
                    { value: 'PUBLISHED', label: 'Published' },
                    { value: 'ACTIVE', label: 'Active' },
                    { value: 'DRAFT', label: 'Draft' },
                    { value: 'FINISHED', label: 'Finished' },
                    { value: 'CANCELLED', label: 'Cancelled' },
                  ],
                  onValueChange: (value) => {
                    setStatusFilter(value);
                    setPage(1);
                  },
                },
              ]}
              activeFiltersCount={activeFiltersCount}
              onClearFilters={handleClearFilters}
              actions={
                <Button
                  variant='outline'
                  size='sm'
                  onClick={() => {
                    refetch();
                    setPage(1);
                  }}
                  disabled={isLoading}
                  className='h-11 border-2 border-primary/20'
                >
                  <RefreshCw
                    className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`}
                  />
                </Button>
              }
            />

            {/* Table Section */}
            <div className='flex-1 overflow-auto'>
              {isLoading && !eventsData ? (
                <div className='text-center py-12'>
                  <Loader2 className='mx-auto h-12 w-12 animate-spin text-muted-foreground/50' />
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow className='bg-muted/50 border-b'>
                      <TableHead className='w-12 font-semibold pl-6'>
                        #
                      </TableHead>
                      <SortableTableHeader
                        column='displayName'
                        currentSort={sort}
                        onSort={handleSort}
                      >
                        Event
                      </SortableTableHeader>
                      <SortableTableHeader
                        column='location.name'
                        currentSort={sort}
                        onSort={handleSort}
                      >
                        Booking Location
                      </SortableTableHeader>
                      <SortableTableHeader
                        column='participants'
                        currentSort={sort}
                        onSort={handleSort}
                      >
                        Participants
                      </SortableTableHeader>
                      <SortableTableHeader
                        column='startDate'
                        currentSort={sort}
                        onSort={handleSort}
                      >
                        Start Date
                      </SortableTableHeader>
                      <SortableTableHeader
                        column='endDate'
                        currentSort={sort}
                        onSort={handleSort}
                      >
                        End Date
                      </SortableTableHeader>
                      <SortableTableHeader
                        column='status'
                        currentSort={sort}
                        onSort={handleSort}
                        className='pr-6'
                      >
                        Status
                      </SortableTableHeader>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {events.length === 0 ? (
                      <TableRow>
                        <TableCell
                          colSpan={9}
                          className='text-center py-12 pl-6 pr-6'
                        >
                          <div className='flex flex-col items-center justify-center text-muted-foreground'>
                            <CalendarDays className='h-12 w-12 mb-4' />
                            <p className='font-medium'>No events found</p>
                            <p className='text-sm mt-2'>
                              {debouncedSearchTerm
                                ? 'Try adjusting your search terms'
                                : 'Create your first event to get started'}
                            </p>
                          </div>
                        </TableCell>
                      </TableRow>
                    ) : (
                      events.map((event: Event, index: number) => {
                        const rowNumber =
                          ((meta?.currentPage || 1) - 1) *
                            (meta?.itemsPerPage || 10) +
                          index +
                          1;
                        const visibleTags = event.tags?.slice(0, 2) || [];

                        return (
                          <TableRow
                            key={event.id}
                            className='hover:bg-muted/30 transition-colors'
                          >
                            <TableCell className='py-4 pl-6'>
                              <span className='text-sm font-medium text-muted-foreground'>
                                {rowNumber}
                              </span>
                            </TableCell>
                            <TableCell className='py-2'>
                              <Link
                                href={`/dashboard/creator/events/${event.id}`}
                                className='block max-w-[300px] overflow-hidden'
                              >
                                <div className='flex items-center gap-3'>
                                  <div className='flex h-12 w-12 flex-shrink-0 items-center justify-center overflow-hidden rounded-lg bg-muted'>
                                    {event.avatarUrl ? (
                                      <Image
                                        src={event.avatarUrl}
                                        alt={event.displayName}
                                        width={48}
                                        height={48}
                                        className='h-full w-full object-cover'
                                      />
                                    ) : (
                                      <ImageIcon className='h-6 w-6 text-muted-foreground' />
                                    )}
                                  </div>

                                  <div className='flex min-w-0 flex-1 flex-col gap-1'>
                                    <span
                                      title={event.displayName}
                                      className='truncate text-sm font-semibold text-foreground transition-colors hover:text-primary'
                                    >
                                      {event.displayName}
                                    </span>

                                    {event.description && (
                                      <span
                                        title={event.description}
                                        className='truncate text-xs text-muted-foreground'
                                      >
                                        {event.description}
                                      </span>
                                    )}
                                  </div>
                                </div>
                              </Link>
                            </TableCell>

                            <TableCell className='py-2'>
                              <div className='flex max-w-[300px] items-center gap-3 overflow-hidden'>
                                <div className='flex h-10 w-10 flex-shrink-0 items-center justify-center overflow-hidden rounded-lg bg-muted'>
                                  {event.location?.imageUrl?.length ? (
                                    <Image
                                      src={event.location.imageUrl[0]}
                                      alt={event.location.name}
                                      width={40}
                                      height={40}
                                      className='h-full w-full object-cover'
                                    />
                                  ) : (
                                    <ImageIcon className='h-5 w-5 text-muted-foreground' />
                                  )}
                                </div>

                                <div className='flex min-w-0 flex-1 flex-col gap-0.5'>
                                  <span
                                    title={event.location?.name}
                                    className='truncate text-sm font-medium'
                                  >
                                    {event.location?.name || 'N/A'}
                                  </span>

                                  {event.location?.addressLine && (
                                    <span
                                      title={event.location.addressLine}
                                      className='truncate text-xs text-muted-foreground'
                                    >
                                      {event.location.addressLine}
                                    </span>
                                  )}
                                </div>
                              </div>
                            </TableCell>
                            <TableCell className='py-2 flex items-center gap-1 my-2'>
                              <IconUsers className='h-4 w-4 text-muted-foreground' />
                              <span className='text-sm font-medium'>
                                {event.expectedNumberOfParticipants || 0}
                              </span>
                            </TableCell>
                            <TableCell className='py-2'>
                              {event.startDate ? (
                                <div className='flex flex-col gap-0.5'>
                                  <span className='text-sm font-medium'>
                                    {formatDate(event.startDate)}
                                  </span>
                                  <span className='text-xs text-muted-foreground'>
                                    {formatTime(event.startDate)}
                                  </span>
                                </div>
                              ) : (
                                <span className='text-xs text-muted-foreground'>
                                  N/A
                                </span>
                              )}
                            </TableCell>

                            <TableCell className='py-2'>
                              {event.endDate ? (
                                <div className='flex flex-col gap-0.5'>
                                  <span className='text-sm font-medium'>
                                    {formatDate(event.endDate)}
                                  </span>
                                  <span className='text-xs text-muted-foreground'>
                                    {formatTime(event.endDate)}
                                  </span>
                                </div>
                              ) : (
                                <span className='text-xs text-muted-foreground'>
                                  N/A
                                </span>
                              )}
                            </TableCell>

                            <TableCell className='py-2 pr-6'>
                              <Badge
                                variant='outline'
                                className={`${getStatusBadgeStyle(
                                  event.status
                                )} flex items-center gap-1.5 w-fit font-medium`}
                              >
                                {getStatusIcon(event.status)}
                                {getStatusLabel(event.status)}
                              </Badge>
                            </TableCell>
                          </TableRow>
                        );
                      })
                    )}
                  </TableBody>
                </Table>
              )}
            </div>

            {/* Table Bottom Border and Pagination */}
            <div className='border-t'>
              {meta && meta.totalPages > 1 && (
                <div className='px-6 py-4'>
                  <div className='flex items-center justify-between'>
                    <p className='text-sm text-muted-foreground'>
                      Showing {(meta.currentPage - 1) * meta.itemsPerPage + 1}{' '}
                      to{' '}
                      {Math.min(
                        meta.currentPage * meta.itemsPerPage,
                        meta.totalItems
                      )}{' '}
                      of {meta.totalItems} events
                    </p>
                    <div className='flex items-center gap-2'>
                      <Button
                        variant='outline'
                        size='sm'
                        onClick={() => setPage(page - 1)}
                        disabled={!meta || meta.currentPage <= 1 || isLoading}
                      >
                        Previous
                      </Button>
                      <span className='text-sm text-muted-foreground px-2'>
                        Page {meta.currentPage} of {meta.totalPages}
                      </span>
                      <Button
                        variant='outline'
                        size='sm'
                        onClick={() => setPage(page + 1)}
                        disabled={
                          !meta ||
                          meta.currentPage >= meta.totalPages ||
                          isLoading
                        }
                      >
                        Next
                      </Button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    </PageContainer>
  );
}
