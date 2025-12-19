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
  Loader2,
  DollarSign,
  Clock,
  CheckCircle,
  AlertCircle,
  AlertTriangle,
  RefreshCw,
  MapPin,
  Sparkles,
} from 'lucide-react';
import { useState, useMemo } from 'react';
import { useDebounce } from 'use-debounce';
import { useOwnerLocationBookings } from '@/hooks/locations/useOwnerLocationBookings';
import { useOwnerEventById } from '@/hooks/events/useOwnerEventById';
import Link from 'next/link';
import Image from 'next/image';
import { format } from 'date-fns';
import {
  PageHeader,
  PageContainer,
  TableFilters,
  SortableTableHeader,
  type SortDirection,
} from '@/components/shared';
import { StatCard } from '@/components/shared/StatCard';
import { formatDate } from '@/lib/utils';

const getStatusBadge = (status: string) => {
  const statusUpper = status?.toUpperCase();
  switch (statusUpper) {
    case 'AWAITING_BUSINESS_PROCESSING':
      return (
        <Badge
          variant='outline'
          className='bg-amber-50 text-amber-700 border-amber-300 dark:bg-amber-950 dark:text-amber-300 dark:border-amber-700 font-medium'
        >
          <Clock className='h-3 w-3 mr-1' />
          Processing
        </Badge>
      );
    case 'APPROVED':
      return (
        <Badge
          variant='outline'
          className='bg-emerald-50 text-emerald-700 border-emerald-300 dark:bg-emerald-950 dark:text-emerald-300 dark:border-emerald-700 font-medium'
        >
          <CheckCircle className='h-3 w-3 mr-1' />
          Approved
        </Badge>
      );
    case 'REJECTED':
      return (
        <Badge
          variant='outline'
          className='bg-orange-50 text-orange-700 border-orange-300 dark:bg-orange-950 dark:text-orange-300 dark:border-orange-700 font-medium'
        >
          <AlertTriangle className='h-3 w-3 mr-1' />
          Rejected
        </Badge>
      );
    case 'CANCELLED':
      return (
        <Badge
          variant='outline'
          className='bg-red-50 text-red-700 border-red-300 dark:bg-red-950 dark:text-red-300 dark:border-red-700 font-medium'
        >
          <AlertCircle className='h-3 w-3 mr-1' />
          Cancelled
        </Badge>
      );
    default:
      return (
        <Badge
          variant='outline'
          className='bg-gray-50 text-gray-700 border-gray-300 dark:bg-gray-950 dark:text-gray-300 dark:border-gray-700 font-medium'
        >
          {status?.charAt(0).toUpperCase() + status?.slice(1).toLowerCase() ||
            status}
        </Badge>
      );
  }
};

const formatCurrency = (amount: string) => {
  const num = parseFloat(amount);
  return new Intl.NumberFormat('vi-VN', {
    style: 'currency',
    currency: 'VND',
  }).format(num);
};

const formatBookingDateRange = (
  dates: { startDateTime: string; endDateTime: string }[]
) => {
  if (!dates || dates.length === 0) return { from: 'N/A', to: 'N/A' };

  // Find the earliest startDateTime and latest endDateTime
  const startDates = dates.map((d) => new Date(d.startDateTime));
  const endDates = dates.map((d) => new Date(d.endDateTime));

  const earliestStart = new Date(
    Math.min(...startDates.map((d) => d.getTime()))
  );
  const latestEnd = new Date(Math.max(...endDates.map((d) => d.getTime())));

  return {
    from: format(earliestStart, 'MMM dd, yyyy'),
    to: format(latestEnd, 'MMM dd, yyyy'),
  };
};

const calculateTotalHours = (
  dates: { startDateTime: string; endDateTime: string }[]
) => {
  if (!dates || dates.length === 0) return 0;

  let totalMilliseconds = 0;
  dates.forEach((date) => {
    const start = new Date(date.startDateTime);
    const end = new Date(date.endDateTime);
    totalMilliseconds += end.getTime() - start.getTime();
  });

  // Convert milliseconds to hours
  const totalHours = totalMilliseconds / (1000 * 60 * 60);
  return Math.round(totalHours); // Round to integer
};

function BookingRow({
  booking,
  index,
  page,
  meta,
}: {
  booking: any;
  index: number;
  page: number;
  meta?: any;
}) {
  // Get targetId from booking (could be targetId field or event.id)
  const targetId = (booking as any).targetId || booking.event?.id;
  const { data: eventData } = useOwnerEventById(targetId);

  // Use fetched event data if available, otherwise fall back to booking.event
  const eventDisplayName =
    eventData?.displayName || booking.event?.displayName || 'N/A';
  const eventAvatarUrl = eventData?.avatarUrl || booking.event?.avatarUrl;
  const locationImageUrl = booking.location?.imageUrl?.[0];

  // Shorten location name if too long (max 30 characters)
  const locationName = booking.location.name;
  const shortenedLocationName =
    locationName.length > 30
      ? `${locationName.substring(0, 27)}...`
      : locationName;

  return (
    <TableRow className='border-b transition-colors hover:bg-muted/30 border-border/40'>
      <TableCell className='text-xs text-muted-foreground font-medium py-4 pl-6'>
        {((meta?.currentPage ?? page) - 1) * 10 + index + 1}
      </TableCell>
      <TableCell className='py-4'>
        <Link
          href={`/dashboard/business/location-bookings/${booking.id}`}
          className='group cursor-pointer hover:underline'
        >
          <div className='flex flex-col gap-0.5'>
            <span className='text-sm font-medium group-hover:text-primary transition-colors'>
              {booking.createdBy.firstName} {booking.createdBy.lastName}
            </span>
            <span className='text-xs text-muted-foreground truncate max-w-[180px]'>
              {booking.createdBy.email}
            </span>
          </div>
        </Link>
      </TableCell>
      <TableCell className='py-4'>
        <div className='flex items-center gap-2'>
          {eventAvatarUrl ? (
            <div className='relative h-8 w-8 flex-shrink-0 rounded overflow-hidden border'>
              <Image
                src={eventAvatarUrl}
                alt={eventDisplayName}
                fill
                className='object-cover'
                sizes='32px'
              />
            </div>
          ) : (
            <div className='h-8 w-8 flex-shrink-0 rounded bg-muted border flex items-center justify-center'>
              <Sparkles className='h-4 w-4 text-muted-foreground' />
            </div>
          )}
          <span className='text-sm font-semibold leading-tight truncate'>
            {eventDisplayName}
          </span>
        </div>
      </TableCell>
      <TableCell className='py-4'>
        <div className='flex items-center gap-2'>
          {locationImageUrl ? (
            <div className='relative h-8 w-8 flex-shrink-0 rounded overflow-hidden border'>
              <Image
                src={locationImageUrl}
                alt={locationName}
                fill
                className='object-cover'
                sizes='32px'
              />
            </div>
          ) : (
            <div className='h-8 w-8 flex-shrink-0 rounded bg-muted border flex items-center justify-center'>
              <MapPin className='h-4 w-4 text-muted-foreground' />
            </div>
          )}
          <span
            className='text-sm font-semibold leading-tight truncate'
            title={locationName}
          >
            {shortenedLocationName}
          </span>
        </div>
      </TableCell>
      <TableCell className='py-4'>
        <span className='text-sm text-muted-foreground'>
          {formatDate(booking.event.startDate)}
        </span>
      </TableCell>
      <TableCell className='py-4'>
        <span className='text-sm text-muted-foreground'>
          {formatDate(booking.event.endDate)}
        </span>
      </TableCell>
      <TableCell className='py-4 w-[90px]'>
        <div className='text-sm font-medium'>
          {calculateTotalHours(booking.dates)} hrs
        </div>
      </TableCell>
      {/* <TableCell className='py-4 w-[90px]'>
        <div className='text-sm font-medium'>
          {(booking.systemCutPercentage ?? 0) * 100} %
        </div>
      </TableCell> */}
      <TableCell className='py-4'>
        <div className='text-sm font-semibold text-emerald-600'>
          {formatCurrency(booking.amountToReceive)}
        </div>
      </TableCell>
      <TableCell className='py-4'>{getStatusBadge(booking.status)}</TableCell>
    </TableRow>
  );
}

export default function LocationBookingsPage() {
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
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
    : 'createdAt:DESC';

  const { data: bookingsData, isLoading } = useOwnerLocationBookings({
    page,
    limit: 10,
    search: debouncedSearchTerm || undefined,
    sortBy,
    status: statusFilter,
  });

  const bookings = bookingsData?.data || [];
  const meta = bookingsData?.meta;

  const stats = {
    totalBookings: meta?.totalItems ?? 0,
    approved: bookings.filter((b) => b.status?.toUpperCase() === 'APPROVED')
      .length,
    awaitingProcessing: bookings.filter(
      (b) => b.status?.toUpperCase() === 'AWAITING_BUSINESS_PROCESSING'
    ).length,
    totalRevenue: bookings
      .filter((b) => b.status?.toUpperCase() === 'APPROVED')
      .reduce((sum, b) => sum + parseFloat(b.amountToReceive || '0'), 0),
  };

  const handleSort = (column: string, direction: SortDirection) => {
    setSort({ column, direction });
    setPage(1);
  };

  const activeFiltersCount = useMemo(() => {
    let count = 0;
    if (statusFilter !== 'AWAITING_BUSINESS_PROCESSING') count++;
    if (debouncedSearchTerm) count++;
    return count;
  }, [statusFilter, debouncedSearchTerm]);

  return (
    <PageContainer>
      <PageHeader
        title='Location Bookings'
        description='Manage and track all bookings for your locations'
        icon={CalendarDays}
      />

      {/* Statistics Cards */}
      <div className='grid gap-6 md:grid-cols-2 lg:grid-cols-4'>
        <StatCard
          title='Total Bookings'
          value={stats.totalBookings.toLocaleString()}
          icon={CalendarDays}
          color='blue'
          description='All location bookings'
        />

        <StatCard
          title='Approved'
          value={stats.approved.toLocaleString()}
          icon={CheckCircle}
          color='green'
          description='Approved bookings'
        />

        <StatCard
          title='Pending'
          value={stats.awaitingProcessing.toLocaleString()}
          icon={Clock}
          color='amber'
          description='Awaiting your action'
        />

        <StatCard
          title='Total Revenue'
          value={formatCurrency(stats.totalRevenue.toString())}
          icon={DollarSign}
          color='purple'
          description='From approved bookings'
        />
      </div>

      {/* Bookings Table */}
      <Card className='overflow-hidden border-2 border-primary/10 shadow-xl bg-card/80 backdrop-blur-sm'>
        <CardContent className='pb-0 px-0'>
          {/* Filters */}
          <TableFilters
            searchValue={search}
            onSearchChange={(value) => {
              setSearch(value);
              setPage(1);
            }}
            searchPlaceholder='Search by event name, location, or creator...'
            filters={[
              {
                key: 'status',
                label: 'Status',
                value: statusFilter,
                options: [
                  { value: 'ALL', label: 'All statuses' },
                  {
                    value: 'AWAITING_BUSINESS_PROCESSING',
                    label: 'Awaiting Processing',
                  },
                  { value: 'APPROVED', label: 'Approved' },
                  { value: 'REJECTED', label: 'Rejected' },
                  { value: 'CANCELLED', label: 'Cancelled' },
                ],
                onValueChange: (value: string) => {
                  setStatusFilter(value);
                  setPage(1);
                },
              },
            ]}
          />

          {isLoading ? (
            <div className='flex items-center justify-center py-12'>
              <Loader2 className='h-8 w-8 animate-spin text-muted-foreground' />
            </div>
          ) : bookings.length === 0 ? (
            <div className='flex flex-col items-center justify-center rounded-lg border border-dashed border-muted py-12 text-center'>
              <div className='text-lg font-semibold'>No bookings found</div>
              <p className='mt-1.5 max-w-md text-sm text-muted-foreground'>
                Try adjusting your filters or wait for new bookings.
              </p>
            </div>
          ) : (
            <>
              <div className='overflow-x-auto'>
                <Table>
                  <TableHeader className='bg-muted/50'>
                    <TableRow className='border-b border-border/60 hover:bg-muted/50'>
                      <TableHead className='w-12 text-left text-xs font-semibold uppercase tracking-wide text-muted-foreground py-3 pl-6'>
                        #
                      </TableHead>
                      <SortableTableHeader
                        column='createdBy.firstName'
                        currentSort={sort}
                        onSort={handleSort}
                        className='min-w-[180px] max-w-[220px] text-left text-xs uppercase tracking-wide text-muted-foreground py-3'
                      >
                        Requested By
                      </SortableTableHeader>
                      <SortableTableHeader
                        column='event.displayName'
                        currentSort={sort}
                        onSort={handleSort}
                        className='min-w-[180px] max-w-[220px] text-left text-xs uppercase tracking-wide text-muted-foreground py-3'
                      >
                        Event Name
                      </SortableTableHeader>
                      <SortableTableHeader
                        column='location.name'
                        currentSort={sort}
                        onSort={handleSort}
                        className='min-w-[200px] max-w-[280px] text-left text-xs uppercase tracking-wide text-muted-foreground py-3'
                      >
                        Booking At
                      </SortableTableHeader>
                      <SortableTableHeader
                        column='event.startDate'
                        currentSort={sort}
                        onSort={handleSort}
                        className='min-w-[120px] max-w-[150px] text-left text-xs uppercase tracking-wide text-muted-foreground py-3'
                      >
                        Start Date
                      </SortableTableHeader>
                      <SortableTableHeader
                        column='event.endDate'
                        currentSort={sort}
                        onSort={handleSort}
                        className='min-w-[120px] max-w-[150px] text-left text-xs uppercase tracking-wide text-muted-foreground py-3'
                      >
                        End Date
                      </SortableTableHeader>
                      <SortableTableHeader
                        column='totalHours'
                        currentSort={sort}
                        onSort={handleSort}
                        className='text-left text-xs uppercase tracking-wide text-muted-foreground py-3 w-[90px]'
                      >
                        Hours
                      </SortableTableHeader>

                      <SortableTableHeader
                        column='amountToReceive'
                        currentSort={sort}
                        onSort={handleSort}
                        className='text-left text-xs uppercase tracking-wide text-muted-foreground py-3 w-[140px]'
                      >
                        Amount to Receive
                      </SortableTableHeader>
                      <SortableTableHeader
                        column='status'
                        currentSort={sort}
                        onSort={handleSort}
                        className='text-left text-xs uppercase tracking-wide text-muted-foreground py-3 w-[130px]'
                      >
                        Status
                      </SortableTableHeader>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {bookings.map((booking, index) => (
                      <BookingRow
                        key={booking.id}
                        booking={booking}
                        index={index}
                        page={page}
                        meta={meta}
                      />
                    ))}
                  </TableBody>
                </Table>
              </div>

              {/* Pagination */}
              <div className='flex flex-col gap-2 border-t pt-3 pb-3 px-6 sm:flex-row sm:items-center sm:justify-between'>
                <div className='text-xs text-muted-foreground'>
                  Page {meta?.currentPage ?? page} of {meta?.totalPages ?? 1}
                </div>
                <div className='flex items-center gap-2'>
                  <Button
                    variant='outline'
                    size='sm'
                    className='h-8'
                    onClick={() => setPage((p) => Math.max(1, p - 1))}
                    disabled={!meta || meta.currentPage <= 1}
                  >
                    Prev
                  </Button>
                  <Button
                    variant='outline'
                    size='sm'
                    className='h-8'
                    onClick={() =>
                      setPage((p) =>
                        meta ? Math.min(meta.totalPages, p + 1) : p + 1
                      )
                    }
                    disabled={!meta || meta.currentPage >= meta.totalPages}
                  >
                    Next
                  </Button>
                </div>
              </div>
            </>
          )}
        </CardContent>
      </Card>
    </PageContainer>
  );
}
