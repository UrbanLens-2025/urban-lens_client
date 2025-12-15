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
  Calendar,
  MapPin,
  X,
  Loader2,
  Search,
  Filter,
  ChevronLeft,
  ChevronRight,
  Clock,
  Users,
  CheckCircle,
} from 'lucide-react';
import { useAllEvents } from '@/hooks/admin/useAllEvents';
import { useEventStats } from '@/hooks/admin/useEventStats';
import Link from 'next/link';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import Image from 'next/image';
import { formatShortDate } from '@/lib/utils';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  SortableTableHeader,
  SortDirection,
} from '@/components/shared/SortableTableHeader';
import { PageContainer } from '@/components/shared';
import StatisticCard from '@/components/admin/StatisticCard';

export default function AdminEventsPage() {
  const [page, setPage] = useState(1);
  const [searchTerm, setSearchTerm] = useState('');
  const [debouncedSearchTerm] = useDebounce(searchTerm, 300);
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [sort, setSort] = useState<{
    column: string;
    direction: SortDirection;
  }>({
    column: 'createdAt',
    direction: 'DESC',
  });
  const sortByString = sort.direction
    ? `${sort.column}:${sort.direction}`
    : undefined;

  const itemsPerPage = 7;

  const { data: eventsResponse, isLoading } = useAllEvents(
    page,
    itemsPerPage,
    debouncedSearchTerm,
    sortByString || 'createdAt:DESC'
  );
  console.log('🚀 ~ AdminEventsPage ~ eventsResponse:', eventsResponse);
  const events = eventsResponse?.data || [];
  const eventsMeta = eventsResponse?.meta;

  const eventStats = useEventStats();

  const filteredEvents = useMemo(() => {
    if (statusFilter === 'all') return events;
    return events.filter(
      (e: any) => e.status?.toUpperCase() === statusFilter.toUpperCase()
    );
  }, [events, statusFilter]);

  // Sort
  const handleSort = (column: string, direction: SortDirection) => {
    setSort({ column, direction });
    setPage(1);
  };

  const getStatusBadge = (status: string) => {
    const statusUpper = status?.toUpperCase();
    if (statusUpper === 'PUBLISHED') {
      return (
        <Badge
          variant='outline'
          className='px-2.5 py-0.5 bg-green-50 text-green-700 border-green-200 dark:bg-green-950 dark:text-green-400 dark:border-green-800'
        >
          Published
        </Badge>
      );
    }
    if (statusUpper === 'DRAFT') {
      return (
        <Badge
          variant='outline'
          className='px-2.5 py-0.5 bg-orange-50 text-orange-700 border-orange-200 dark:bg-orange-950 dark:text-orange-400 dark:border-orange-800'
        >
          Draft
        </Badge>
      );
    }
    if (statusUpper === 'CANCELLED') {
      return (
        <Badge
          variant='outline'
          className='px-2.5 py-0.5 bg-red-50 text-red-700 border-red-200 dark:bg-red-950 dark:text-red-400 dark:border-red-800'
        >
          Cancelled
        </Badge>
      );
    }
    return (
      <Badge variant='outline' className='px-2.5 py-0.5'>
        {status || 'Unknown'}
      </Badge>
    );
  };

  const getInitials = (firstName: string, lastName: string) => {
    return `${firstName?.[0] || ''}${lastName?.[0] || ''}`.toUpperCase();
  };

  return (
    <PageContainer>
      {/* Statistics Cards */}
      <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-10'>
        <StatisticCard
          title='Total Events'
          subtitle={`${events.length} on this page`}
          value={eventStats.isLoading ? '—' : eventStats.total.toLocaleString()}
          icon={Calendar}
          iconColorClass='blue'
        />

        <StatisticCard
          title='Published'
          subtitle='Active events'
          value={
            eventStats.isLoading ? '—' : eventStats.published.toLocaleString()
          }
          icon={CheckCircle}
          iconColorClass='green'
        />

        <StatisticCard
          title='Draft'
          subtitle='Unpublished events'
          value={eventStats.isLoading ? '—' : eventStats.draft.toLocaleString()}
          icon={Clock}
          iconColorClass='amber'
        />

        <StatisticCard
          title='Cancelled'
          subtitle='Cancelled events'
          value={
            eventStats.isLoading ? '—' : eventStats.cancelled.toLocaleString()
          }
          icon={X}
          iconColorClass='red'
        />
      </div>

      {/* Main Card */}
      <Card>
        <CardHeader>
          <div className='flex flex-col gap-4 md:flex-row md:items-center md:justify-between'>
            <div>
              <CardTitle>All Events</CardTitle>
              <CardDescription className='mt-1'>
                Total {eventsMeta?.totalItems || 0} events in the system
              </CardDescription>
            </div>
            <div className='flex flex-col sm:flex-row items-stretch sm:items-center gap-2'>
              <div className='relative'>
                <Search className='absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground' />
                <Input
                  placeholder='Search events...'
                  className='pl-9 w-full sm:w-[280px]'
                  value={searchTerm}
                  onChange={(e) => {
                    setSearchTerm(e.target.value);
                    setPage(1);
                  }}
                />
              </div>
              <Select
                value={statusFilter}
                onValueChange={(value) => {
                  setStatusFilter(value);
                  setPage(1);
                }}
              >
                <SelectTrigger className='w-full sm:w-[200px]'>
                  <div className='flex items-center gap-2'>
                    <Filter className='h-4 w-4' />
                    <SelectValue placeholder='Filter by status' />
                  </div>
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
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className='flex flex-col items-center justify-center h-64 gap-3'>
              <Loader2 className='h-8 w-8 animate-spin text-muted-foreground' />
              <p className='text-sm text-muted-foreground'>Loading data...</p>
            </div>
          ) : (
            <>
              <div className='rounded-md border overflow-x-auto'>
                <Table>
                  <TableHeader>
                    <TableRow className='bg-muted/50 hover:bg-muted/50'>
                      <TableHead className='w-[60px] text-center'>#</TableHead>
                      <SortableTableHeader
                        column='displayName'
                        currentSort={sort}
                        onSort={handleSort}
                      >
                        Event
                      </SortableTableHeader>
                      <SortableTableHeader
                        column='createdBy.firstName'
                        currentSort={sort}
                        onSort={handleSort}
                      >
                        Creator
                      </SortableTableHeader>
                      <SortableTableHeader
                        column='location.name'
                        currentSort={sort}
                        onSort={handleSort}
                      >
                        Location
                      </SortableTableHeader>
                      <SortableTableHeader
                        column='startDate'
                        currentSort={sort}
                        onSort={handleSort}
                      >
                        Date/Time
                      </SortableTableHeader>
                      <TableHead className='text-center'>
                        Participants
                      </TableHead>

                      <SortableTableHeader
                        column='createdAt'
                        currentSort={sort}
                        onSort={handleSort}
                      >
                        Created
                      </SortableTableHeader>
                      <SortableTableHeader
                        column='status'
                        currentSort={sort}
                        onSort={handleSort}
                      >
                        Status
                      </SortableTableHeader>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredEvents.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={8} className='text-center h-32'>
                          <div className='flex flex-col items-center justify-center gap-2'>
                            <Calendar className='h-12 w-12 text-muted-foreground/50' />
                            <p className='text-muted-foreground font-medium'>
                              No events found
                            </p>
                            <p className='text-sm text-muted-foreground'>
                              Try changing filters or search keywords
                            </p>
                          </div>
                        </TableCell>
                      </TableRow>
                    ) : (
                      filteredEvents.map((event: any, index: number) => (
                        <TableRow
                          key={event.id}
                          className='hover:bg-muted/50 transition-colors'
                        >
                          <TableCell className='text-center text-muted-foreground font-medium'>
                            {(page - 1) * itemsPerPage + index + 1}
                          </TableCell>
                          <TableCell>
                            <Link
                              href={`/admin/events/${event.id}`}
                              className='flex items-center gap-3 group'
                            >
                              {event.avatarUrl ? (
                                <div className='relative h-10 w-10 flex-shrink-0 rounded-md overflow-hidden border-2 border-background'>
                                  <Image
                                    src={event.avatarUrl}
                                    alt={event.displayName}
                                    fill
                                    className='object-cover'
                                    sizes='40px'
                                  />
                                </div>
                              ) : (
                                <div className='h-10 w-10 flex-shrink-0 rounded-md bg-muted border-2 border-background flex items-center justify-center'>
                                  <Calendar className='h-4 w-4 text-muted-foreground' />
                                </div>
                              )}
                              <div className='flex-1 min-w-0 max-w-64'>
                                <p className='font-medium group-hover:text-primary transition-colors truncate'>
                                  {event.displayName}
                                </p>
                                {event.description && (
                                  <p className='text-xs text-muted-foreground truncate'>
                                    {event.description}
                                  </p>
                                )}
                              </div>
                            </Link>
                          </TableCell>
                          <TableCell>
                            {event.createdBy ? (
                              <div className='flex items-center gap-2'>
                                <Avatar className='h-8 w-8 border-2 border-background'>
                                  {event.createdBy.avatarUrl && (
                                    <AvatarImage
                                      src={event.createdBy.avatarUrl}
                                      alt={`${event.createdBy.firstName} ${event.createdBy.lastName}`}
                                      className='object-cover'
                                    />
                                  )}
                                  <AvatarFallback className='bg-primary/10 text-primary font-semibold text-xs'>
                                    {getInitials(
                                      event.createdBy.firstName || '',
                                      event.createdBy.lastName || ''
                                    )}
                                  </AvatarFallback>
                                </Avatar>
                                <div className='flex-1 min-w-0'>
                                  <p className='text-sm font-medium truncate'>
                                    {event.createdBy.firstName}{' '}
                                    {event.createdBy.lastName}
                                  </p>
                                  {event.createdBy.email && (
                                    <p className='text-xs text-muted-foreground truncate'>
                                      {event.createdBy.email}
                                    </p>
                                  )}
                                </div>
                              </div>
                            ) : (
                              <span className='text-sm text-muted-foreground'>
                                N/A
                              </span>
                            )}
                          </TableCell>
                          <TableCell>
                            {event.location ? (
                              <div className='flex items-center gap-2 min-w-0'>
                                <MapPin className='h-4 w-4 text-muted-foreground shrink-0' />
                                <div className='flex-1 min-w-0 max-w-36'>
                                  <p className='text-sm truncate'>
                                    {event.location.name}
                                  </p>
                                  {event.location.addressLine && (
                                    <p className='text-xs text-muted-foreground truncate'>
                                      {event.location.addressLine}
                                    </p>
                                  )}
                                </div>
                              </div>
                            ) : (
                              <span className='text-sm text-muted-foreground'>
                                N/A
                              </span>
                            )}
                          </TableCell>
                          <TableCell>
                            {event.startDate ? (
                              <div className='text-sm'>
                                <div className='font-medium'>
                                  {formatShortDate(event.startDate)}
                                </div>
                                {event.endDate && (
                                  <div className='text-xs text-muted-foreground'>
                                    to {formatShortDate(event.endDate)}
                                  </div>
                                )}
                              </div>
                            ) : (
                              <span className='text-sm text-muted-foreground'>
                                N/A
                              </span>
                            )}
                          </TableCell>
                          <TableCell className='text-center'>
                            <div className='flex items-center justify-center gap-1'>
                              <Users className='h-4 w-4 text-muted-foreground' />
                              <span className='text-sm font-medium'>
                                {event.expectedNumberOfParticipants || 0}
                              </span>
                            </div>
                          </TableCell>

                          <TableCell className='text-sm text-muted-foreground'>
                            {formatShortDate(event.createdAt)}
                          </TableCell>
                          <TableCell>{getStatusBadge(event.status)}</TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </div>

              {/* Pagination */}
              {eventsMeta && eventsMeta.totalPages > 1 && (
                <div className='flex flex-col sm:flex-row items-center justify-between gap-4 pt-4 border-t'>
                  <div className='text-sm text-muted-foreground'>
                    Showing{' '}
                    <span className='font-medium text-foreground'>
                      {(page - 1) * itemsPerPage + 1}
                    </span>{' '}
                    -{' '}
                    <span className='font-medium text-foreground'>
                      {Math.min(page * itemsPerPage, eventsMeta.totalItems)}
                    </span>{' '}
                    of{' '}
                    <span className='font-medium text-foreground'>
                      {eventsMeta.totalItems}
                    </span>{' '}
                    events
                  </div>
                  <div className='flex items-center gap-2'>
                    <Button
                      variant='outline'
                      size='sm'
                      onClick={() => setPage(page - 1)}
                      disabled={page <= 1}
                      className='gap-1'
                    >
                      <ChevronLeft className='h-4 w-4' />
                      Previous
                    </Button>
                    <div className='flex items-center gap-1 px-3'>
                      <span className='text-sm font-medium'>
                        Page {page} of {eventsMeta.totalPages}
                      </span>
                    </div>
                    <Button
                      variant='outline'
                      size='sm'
                      onClick={() => setPage(page + 1)}
                      disabled={page >= eventsMeta.totalPages}
                      className='gap-1'
                    >
                      Next
                      <ChevronRight className='h-4 w-4' />
                    </Button>
                  </div>
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>
    </PageContainer>
  );
}
