'use client';

import { useState, useMemo } from 'react';
import { useDebounce } from 'use-debounce';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  X,
  RefreshCw,
  Calendar,
  MapPin,
  User,
} from 'lucide-react';
import { Event, SortState } from '@/types';
import { useAllEvents } from '@/hooks/admin/useAllEvents';
import Link from 'next/link';
import { StatsCard } from '@/components/dashboard';
import {
  IconCalendar,
  IconEye,
  IconSearch,
  IconUsers,
  IconTrendingUp,
  IconFilter,
} from '@tabler/icons-react';
import { Badge } from '@/components/ui/badge';
import Image from 'next/image';
import { formatDateTime } from '@/lib/utils';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useQueryClient } from '@tanstack/react-query';
import { SortableTableHeader, SortDirection } from '@/components/shared/SortableTableHeader';

export default function AdminEventsPage() {
  const queryClient = useQueryClient();
  
  // Unified search and sort state
  const [page, setPage] = useState(1);
  const [searchTerm, setSearchTerm] = useState('');
  const [debouncedSearchTerm] = useDebounce(searchTerm, 300);
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [sort, setSort] = useState<{ column: string; direction: SortDirection }>({
    column: 'createdAt',
    direction: 'DESC',
  });
  const sortByString = sort.direction ? `${sort.column}:${sort.direction}` : undefined;

  // Data fetching
  const { data: eventsResponse, isLoading } = useAllEvents(
    page,
    debouncedSearchTerm,
    sortByString || 'createdAt:DESC'
  );
  const events = eventsResponse?.data || [];
  const eventsMeta = eventsResponse?.meta;

  // Filter events by status
  const filteredEvents = useMemo(() => {
    if (statusFilter === 'all') return events;
    return events.filter((e) => e.status?.toUpperCase() === statusFilter.toUpperCase());
  }, [events, statusFilter]);

  // Refresh data
  const handleRefresh = () => {
    queryClient.invalidateQueries({ queryKey: ['allEvents'] });
  };

  // Clear search
  const handleClearSearch = () => {
    setSearchTerm('');
    setPage(1);
  };

  // Sort
  const handleSort = (column: string, direction: SortDirection) => {
    setSort({ column, direction });
    setPage(1);
  };

  // Calculate statistics from all events (not just current page)
  const stats = useMemo(() => {
    const total = eventsMeta?.totalItems || 0;
    const published = events.filter((e) => e.status?.toUpperCase() === 'PUBLISHED').length;
    const draft = events.filter((e) => e.status?.toUpperCase() === 'DRAFT').length;
    const cancelled = events.filter((e) => e.status?.toUpperCase() === 'CANCELLED').length;
    const uniqueCreators = new Set(events.map((e) => e.createdBy?.id).filter(Boolean)).size;

    // Estimate totals based on current page if we have paginated data
    const publishedEstimate = total > 0 && events.length > 0
      ? Math.round((published / events.length) * total)
      : published;
    const draftEstimate = total > 0 && events.length > 0
      ? Math.round((draft / events.length) * total)
      : draft;

    return [
      {
        title: 'Total Events',
        value: total.toString(),
        change: `${events.length} on this page`,
        icon: IconCalendar,
        color: 'blue' as const,
      },
      {
        title: 'Published',
        value: publishedEstimate.toString(),
        change: 'Active events',
        icon: IconTrendingUp,
        color: 'green' as const,
      },
      {
        title: 'Draft',
        value: draftEstimate.toString(),
        change: 'Unpublished events',
        icon: IconCalendar,
        color: 'orange' as const,
      },
      {
        title: 'Creators',
        value: uniqueCreators.toString(),
        change: 'Unique creators',
        icon: IconUsers,
        color: 'purple' as const,
      },
    ];
  }, [events, eventsMeta]);

  const getStatusBadge = (status: string) => {
    const statusUpper = status?.toUpperCase();
    if (statusUpper === 'PUBLISHED') {
      return <Badge className='bg-green-500 hover:bg-green-600'>Published</Badge>;
    }
    if (statusUpper === 'DRAFT') {
      return <Badge variant='secondary'>Draft</Badge>;
    }
    if (statusUpper === 'CANCELLED') {
      return <Badge variant='destructive'>Cancelled</Badge>;
    }
    return <Badge variant='outline'>{status || 'Unknown'}</Badge>;
  };

  // Loading skeleton
  const LoadingSkeleton = () => (
    <div className='space-y-3'>
      {[...Array(5)].map((_, i) => (
        <div key={i} className='flex items-center gap-4 p-4 border rounded-lg animate-pulse'>
          <div className='w-16 h-16 bg-muted rounded-md' />
          <div className='flex-1 space-y-2'>
            <div className='h-4 bg-muted rounded w-3/4' />
            <div className='h-3 bg-muted rounded w-1/2' />
          </div>
        </div>
      ))}
    </div>
  );

  // Empty state
  const EmptyState = ({ message, description }: { message: string; description?: string }) => (
    <div className='flex flex-col items-center justify-center py-16 text-center'>
      <div className='h-16 w-16 rounded-full bg-muted flex items-center justify-center mb-4'>
        <Calendar className='h-8 w-8 text-muted-foreground' />
      </div>
      <h3 className='text-lg font-semibold mb-2'>{message}</h3>
      {description && <p className='text-sm text-muted-foreground max-w-md'>{description}</p>}
    </div>
  );

  return (
    <div className='space-y-6'>
      {/* Header
      <div className='flex flex-col sm:flex-row sm:items-center justify-between gap-4'>
        <Button
          variant='outline'
          onClick={handleRefresh}
          disabled={isLoading}
          className='w-full sm:w-auto'
        >
          <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
          Refresh
        </Button>
      </div> */}

      {/* Statistics Cards */}
      <div className='grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4'>
        {stats.map((stat) => (
          <StatsCard
            key={stat.title}
            title={stat.title}
            value={stat.value}
            change={stat.change}
            icon={stat.icon}
            color={stat.color}
            variant="minimal"
          />
        ))}
      </div>

      {/* Events Table with Tabs */}
      <Card className='border-border/60 shadow-sm'>
        <CardHeader className='space-y-4'>
          <div className='flex flex-col sm:flex-row sm:items-center justify-between gap-4'>
            <CardTitle>Events</CardTitle>
            <div className='flex flex-col sm:flex-row items-stretch sm:items-center gap-2'>
              <div className='relative flex-1 sm:flex-initial sm:w-64'>
                <IconSearch className='absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground' />
                <Input
                  placeholder='Search events...'
                  value={searchTerm}
                  onChange={(e) => {
                    setSearchTerm(e.target.value);
                    setPage(1);
                  }}
                  className='pl-9 pr-9'
                />
                {searchTerm && (
                  <Button
                    variant='ghost'
                    size='icon'
                    className='absolute right-1 top-1/2 transform -translate-y-1/2 h-7 w-7'
                    onClick={handleClearSearch}
                  >
                    <X className='h-4 w-4' />
                  </Button>
                )}
              </div>
              <Select value={statusFilter} onValueChange={(value) => {
                setStatusFilter(value);
                setPage(1);
              }}>
                <SelectTrigger className='w-full sm:w-[180px]'>
                  <IconFilter className='h-4 w-4 mr-2' />
                  <SelectValue placeholder='Filter by status' />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value='all'>All Status</SelectItem>
                  <SelectItem value='PUBLISHED'>Published</SelectItem>
                  <SelectItem value='DRAFT'>Draft</SelectItem>
                  <SelectItem value='CANCELLED'>Cancelled</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <CardDescription className='flex items-center justify-between'>
            <span>
              Showing {filteredEvents.length} of {eventsMeta?.totalItems || 0} events
              {statusFilter !== 'all' && ` (${statusFilter})`}
            </span>
            <span>
              Page {eventsMeta?.currentPage || 1} of {eventsMeta?.totalPages || 1}
            </span>
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <LoadingSkeleton />
          ) : filteredEvents.length === 0 ? (
            <EmptyState
              message={searchTerm ? 'No events found' : statusFilter !== 'all' ? `No ${statusFilter.toLowerCase()} events` : 'No events yet'}
              description={
                searchTerm
                  ? 'Try adjusting your search terms or filters'
                  : statusFilter !== 'all'
                  ? 'There are no events with this status'
                  : 'Events will appear here once they are created'
              }
            />
          ) : (
            <>
              <div className='rounded-md border overflow-hidden'>
                <Table>
                  <TableHeader>
                    <TableRow className='bg-muted/50'>
                      <SortableTableHeader
                        column='displayName'
                        currentSort={sort}
                        onSort={handleSort}
                        className='w-[300px]'
                      >
                        Event Name
                      </SortableTableHeader>
                      <SortableTableHeader
                        column='createdBy.firstName'
                        currentSort={sort}
                        onSort={handleSort}
                        className='hidden md:table-cell'
                      >
                        Creator
                      </SortableTableHeader>
                      <SortableTableHeader
                        column='location.name'
                        currentSort={sort}
                        onSort={handleSort}
                        className='hidden lg:table-cell'
                      >
                        Location
                      </SortableTableHeader>
                      <SortableTableHeader
                        column='status'
                        currentSort={sort}
                        onSort={handleSort}
                      >
                        Status
                      </SortableTableHeader>
                      <SortableTableHeader
                        column='createdAt'
                        currentSort={sort}
                        onSort={handleSort}
                        className='hidden sm:table-cell'
                      >
                        Created
                      </SortableTableHeader>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredEvents.map((event: Event) => (
                      <TableRow
                        key={event.id}
                        className='hover:bg-muted/50 transition-colors cursor-pointer'
                      >
                        <TableCell className='font-medium'>
                          <Link
                            href={`/admin/events/${event.id}`}
                            className='flex items-center gap-4 group'
                          >
                            {event.avatarUrl ? (
                              <div className='relative w-14 h-14 rounded-lg overflow-hidden flex-shrink-0 border group-hover:ring-2 group-hover:ring-primary transition-all'>
                                <Image
                                  src={event.avatarUrl}
                                  alt={event.displayName}
                                  fill
                                  className='object-cover'
                                />
                              </div>
                            ) : (
                              <div className='w-14 h-14 rounded-lg bg-muted flex items-center justify-center flex-shrink-0'>
                                <Calendar className='h-6 w-6 text-muted-foreground' />
                              </div>
                            )}
                            <div className='flex flex-col min-w-0 flex-1'>
                              <span className='font-semibold group-hover:text-primary transition-colors truncate'>
                                {event.displayName}
                              </span>
                            </div>
                          </Link>
                        </TableCell>
                        <TableCell className='hidden md:table-cell'>
                          {event.createdBy ? (
                            <div className='flex items-center gap-2'>
                              <div className='h-8 w-8 rounded-full bg-muted flex items-center justify-center flex-shrink-0'>
                                <User className='h-4 w-4 text-muted-foreground' />
                              </div>
                              <div className='flex flex-col min-w-0'>
                                <span className='text-sm font-medium truncate'>
                                  {event.createdBy.firstName} {event.createdBy.lastName}
                                </span>
                                {event.createdBy.email && (
                                  <span className='text-xs text-muted-foreground truncate'>
                                    {event.createdBy.email}
                                  </span>
                                )}
                              </div>
                            </div>
                          ) : (
                            <span className='text-muted-foreground text-sm'>N/A</span>
                          )}
                        </TableCell>
                        <TableCell className='hidden lg:table-cell'>
                          {event.location ? (
                            <div className='flex items-center gap-2'>
                              <MapPin className='h-4 w-4 text-muted-foreground flex-shrink-0' />
                              <div className='flex flex-col min-w-0'>
                                <span className='text-sm truncate'>{event.location.name}</span>
                                {event.location.addressLine && (
                                  <span className='text-xs text-muted-foreground truncate'>
                                    {event.location.addressLine}
                                  </span>
                                )}
                              </div>
                            </div>
                          ) : (
                            <span className='text-muted-foreground text-sm'>N/A</span>
                          )}
                        </TableCell>
                        <TableCell>{getStatusBadge(event.status)}</TableCell>
                        <TableCell className='hidden sm:table-cell'>
                          <span className='text-sm text-muted-foreground'>
                            {formatDateTime(event.createdAt)}
                          </span>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>

              {/* Enhanced Pagination */}
              {eventsMeta && eventsMeta.totalPages > 1 && (
                <div className='flex flex-col sm:flex-row items-center justify-between gap-4 pt-4 border-t'>
                  <div className='text-sm text-muted-foreground'>
                    Showing {(eventsMeta.currentPage - 1) * (eventsMeta.itemsPerPage || 10) + 1} to{' '}
                    {Math.min(
                      eventsMeta.currentPage * (eventsMeta.itemsPerPage || 10),
                      eventsMeta.totalItems
                    )}{' '}
                    of {eventsMeta.totalItems} events
                  </div>
                  <div className='flex items-center gap-2'>
                    <Button
                      variant='outline'
                      size='sm'
                      onClick={() => setPage(1)}
                      disabled={eventsMeta.currentPage <= 1}
                    >
                      First
                    </Button>
                    <Button
                      variant='outline'
                      size='sm'
                      onClick={() => setPage(page - 1)}
                      disabled={eventsMeta.currentPage <= 1}
                    >
                      Previous
                    </Button>
                    <div className='flex items-center gap-1 px-2'>
                      {[...Array(Math.min(5, eventsMeta.totalPages))].map((_, i) => {
                        const pageNum =
                          eventsMeta.totalPages <= 5
                            ? i + 1
                            : eventsMeta.currentPage <= 3
                            ? i + 1
                            : eventsMeta.currentPage >= eventsMeta.totalPages - 2
                            ? eventsMeta.totalPages - 4 + i
                            : eventsMeta.currentPage - 2 + i;
                        if (pageNum > eventsMeta.totalPages) return null;
                        return (
                          <Button
                            key={pageNum}
                            variant={pageNum === eventsMeta.currentPage ? 'default' : 'outline'}
                            size='sm'
                            onClick={() => setPage(pageNum)}
                            className='w-8 h-8 p-0'
                          >
                            {pageNum}
                          </Button>
                        );
                      })}
                    </div>
                    <Button
                      variant='outline'
                      size='sm'
                      onClick={() => setPage(page + 1)}
                      disabled={eventsMeta.currentPage >= eventsMeta.totalPages}
                    >
                      Next
                    </Button>
                    <Button
                      variant='outline'
                      size='sm'
                      onClick={() => setPage(eventsMeta.totalPages)}
                      disabled={eventsMeta.currentPage >= eventsMeta.totalPages}
                    >
                      Last
                    </Button>
                  </div>
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
