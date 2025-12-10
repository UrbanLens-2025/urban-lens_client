'use client';

import { useState, useMemo, useEffect } from 'react';
import { useDebounce } from 'use-debounce';
import { useRouter, useSearchParams, usePathname } from 'next/navigation';
import Link from 'next/link';
import {
  SortableTableHeader,
  SortDirection,
} from '@/components/shared/SortableTableHeader';
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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Loader2,
  MapPin,
  Clock,
  CheckCircle2,
  XCircle,
  Building2,
  Globe,
  User,
  FileText,
  Eye,
  Search,
  Filter,
  ChevronLeft,
  ChevronRight,
  AlertTriangle,
} from 'lucide-react';
import { LocationRequest, LocationStatus } from '@/types';
import { useLocationAdminRequests } from '@/hooks/admin/useLocationAdminRequests';
import { useQueryClient } from '@tanstack/react-query';
import { formatShortDate } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import Image from 'next/image';

type StatusFilter = 'all' | 'PENDING' | 'APPROVED' | 'REJECTED';

export default function LocationRequestsPage() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const queryClient = useQueryClient();

  // Initialize state from URL params or defaults
  const [searchTerm, setSearchTerm] = useState(
    searchParams.get('search') || ''
  );
  const [debouncedSearchTerm] = useDebounce(searchTerm, 300);
  const [statusFilter, setStatusFilter] = useState<StatusFilter>(
    (searchParams.get('status') as StatusFilter) || 'all'
  );
  const [page, setPage] = useState(Number(searchParams.get('page')) || 1);
  const [sort, setSort] = useState<{
    column: string;
    direction: SortDirection;
  }>({
    column: 'createdAt',
    direction: 'DESC',
  });
  const itemsPerPage = 7;

  // Update URL when filters change
  useEffect(() => {
    const params = new URLSearchParams(searchParams.toString());
    const trimmedSearch = debouncedSearchTerm.trim();

    if (trimmedSearch) {
      params.set('search', trimmedSearch);
    } else {
      params.delete('search');
    }

    if (statusFilter !== 'all') {
      params.set('status', statusFilter);
    } else {
      params.delete('status');
    }

    if (page > 1) {
      params.set('page', page.toString());
    } else {
      params.delete('page');
    }

    router.replace(`${pathname}?${params.toString()}`);
  }, [debouncedSearchTerm, statusFilter, page, pathname, router, searchParams]);

  // Map status filter to LocationStatus
  const getRequestStatus = (): LocationStatus | undefined => {
    if (statusFilter === 'all') return undefined;
    if (statusFilter === 'PENDING') return 'AWAITING_ADMIN_REVIEW';
    if (statusFilter === 'APPROVED') return 'APPROVED';
    return 'REJECTED';
  };

  const sortBy = sort.direction
    ? `${sort.column}:${sort.direction}`
    : 'createdAt:DESC';

  // Data fetching for current view
  const { data, isLoading, error } = useLocationAdminRequests(
    page,
    itemsPerPage,
    debouncedSearchTerm.trim() || undefined,
    getRequestStatus(),
    sortBy
  );

  // Fetch statistics for all statuses (without pagination, just to get counts)
  const { data: pendingData, isLoading: isLoadingPending } =
    useLocationAdminRequests(
      1,
      1,
      undefined,
      'AWAITING_ADMIN_REVIEW',
      'createdAt:DESC'
    );

  const { data: approvedData, isLoading: isLoadingApproved } =
    useLocationAdminRequests(1, 1, undefined, 'APPROVED', 'createdAt:DESC');

  const { data: rejectedData, isLoading: isLoadingRejected } =
    useLocationAdminRequests(1, 1, undefined, 'REJECTED', 'createdAt:DESC');

  const requests = data?.data || [];
  const meta = data?.meta;

  const refresh = () => {
    queryClient.invalidateQueries({ queryKey: ['locationRequests'] });
    queryClient.invalidateQueries({ queryKey: ['locationAdminRequest'] });
  };

  // Calculate real statistics from API data
  const stats = useMemo(() => {
    const pending = pendingData?.meta?.totalItems || 0;
    const approved = approvedData?.meta?.totalItems || 0;
    const rejected = rejectedData?.meta?.totalItems || 0;
    const total = pending + approved + rejected;

    return {
      total,
      pending,
      approved,
      rejected,
      isLoading: isLoadingPending || isLoadingApproved || isLoadingRejected,
    };
  }, [
    pendingData?.meta?.totalItems,
    approvedData?.meta?.totalItems,
    rejectedData?.meta?.totalItems,
    isLoadingPending,
    isLoadingApproved,
    isLoadingRejected,
  ]);

  const handleSort = (column: string, direction: SortDirection) => {
    setSort({ column, direction: direction || 'DESC' });
    setPage(1);
  };

  const getInitials = (firstName: string, lastName: string) => {
    return `${firstName?.[0] || ''}${lastName?.[0] || ''}`.toUpperCase();
  };

  const getStatusBadge = (status: LocationStatus) => {
    const statusUpper = status?.toUpperCase();
    if (statusUpper === 'AWAITING_ADMIN_REVIEW' || statusUpper === 'PENDING') {
      return (
        <Badge
          variant='outline'
          className='px-2.5 py-0.5 bg-yellow-50 text-yellow-700 border-yellow-200 dark:bg-yellow-950 dark:text-yellow-400 dark:border-yellow-800'
        >
          Pending
        </Badge>
      );
    }
    if (statusUpper === 'APPROVED') {
      return (
        <Badge
          variant='outline'
          className='px-2.5 py-0.5 bg-green-50 text-green-700 border-green-200 dark:bg-green-950 dark:text-green-400 dark:border-green-800'
        >
          Approved
        </Badge>
      );
    }
    if (statusUpper === 'REJECTED') {
      return (
        <Badge
          variant='outline'
          className='px-2.5 py-0.5 bg-red-50 text-red-700 border-red-200 dark:bg-red-950 dark:text-red-400 dark:border-red-800'
        >
          Rejected
        </Badge>
      );
    }
    return (
      <Badge variant='outline' className='px-2.5 py-0.5'>
        {status || 'Unknown'}
      </Badge>
    );
  };

  if (error) {
    return (
      <div className='space-y-6'>
        <Card className='border-red-200 dark:border-red-800'>
          <CardContent className='pt-6'>
            <div className='flex items-center gap-3 text-red-600 dark:text-red-400'>
              <AlertTriangle className='h-5 w-5' />
              <p>Error loading location requests. Please try again.</p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className='space-y-6'>
      {/* Statistics Cards */}
      <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4'>
        <Card className='hover:shadow-md transition-shadow border-l-4 border-l-blue-500'>
          <CardHeader className='flex flex-row items-center justify-between space-y-0 pb-2'>
            <CardTitle className='text-sm font-medium'>
              Total Requests
            </CardTitle>
            <div className='h-10 w-10 rounded-full bg-blue-100 dark:bg-blue-950 flex items-center justify-center'>
              <MapPin className='h-5 w-5 text-blue-600 dark:text-blue-400' />
            </div>
          </CardHeader>
          <CardContent>
            <div className='text-3xl font-bold'>
              {stats.isLoading ? '—' : stats.total.toLocaleString()}
            </div>
            <p className='text-xs text-muted-foreground mt-1'>
              {requests.length} on this page
            </p>
          </CardContent>
        </Card>

        <Card className='hover:shadow-md transition-shadow border-l-4 border-l-orange-500'>
          <CardHeader className='flex flex-row items-center justify-between space-y-0 pb-2'>
            <CardTitle className='text-sm font-medium'>
              Pending Review
            </CardTitle>
            <div className='h-10 w-10 rounded-full bg-orange-100 dark:bg-orange-950 flex items-center justify-center'>
              <Clock className='h-5 w-5 text-orange-600 dark:text-orange-400' />
            </div>
          </CardHeader>
          <CardContent>
            <div className='text-3xl font-bold'>
              {stats.isLoading ? '—' : stats.pending.toLocaleString()}
            </div>
            <p className='text-xs text-muted-foreground mt-1'>
              {stats.total > 0
                ? Math.round((stats.pending / stats.total) * 100)
                : 0}
              % of total
            </p>
          </CardContent>
        </Card>

        <Card className='hover:shadow-md transition-shadow border-l-4 border-l-green-500'>
          <CardHeader className='flex flex-row items-center justify-between space-y-0 pb-2'>
            <CardTitle className='text-sm font-medium'>Approved</CardTitle>
            <div className='h-10 w-10 rounded-full bg-green-100 dark:bg-green-950 flex items-center justify-center'>
              <CheckCircle2 className='h-5 w-5 text-green-600 dark:text-green-400' />
            </div>
          </CardHeader>
          <CardContent>
            <div className='text-3xl font-bold'>
              {stats.isLoading ? '—' : stats.approved.toLocaleString()}
            </div>
            <p className='text-xs text-muted-foreground mt-1'>
              {stats.total > 0
                ? Math.round((stats.approved / stats.total) * 100)
                : 0}
              % of total
            </p>
          </CardContent>
        </Card>

        <Card className='hover:shadow-md transition-shadow border-l-4 border-l-red-500'>
          <CardHeader className='flex flex-row items-center justify-between space-y-0 pb-2'>
            <CardTitle className='text-sm font-medium'>Rejected</CardTitle>
            <div className='h-10 w-10 rounded-full bg-red-100 dark:bg-red-950 flex items-center justify-center'>
              <XCircle className='h-5 w-5 text-red-600 dark:text-red-400' />
            </div>
          </CardHeader>
          <CardContent>
            <div className='text-3xl font-bold'>
              {stats.isLoading ? '—' : stats.rejected.toLocaleString()}
            </div>
            <p className='text-xs text-muted-foreground mt-1'>
              {stats.total > 0
                ? Math.round((stats.rejected / stats.total) * 100)
                : 0}
              % of total
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Main Card */}
      <Card>
        <CardHeader>
          <div className='flex flex-col gap-4 md:flex-row md:items-center md:justify-between'>
            <div>
              <CardTitle>Location Requests</CardTitle>
              <CardDescription className='mt-1'>
                Total {meta?.totalItems || 0} requests in the system
              </CardDescription>
            </div>
            <div className='flex flex-col sm:flex-row items-stretch sm:items-center gap-2'>
              <div className='relative'>
                <Search className='absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground' />
                <Input
                  placeholder='Search requests...'
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
                  setStatusFilter(value as StatusFilter);
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
                  <SelectItem value='PENDING'>Pending</SelectItem>
                  <SelectItem value='APPROVED'>Approved</SelectItem>
                  <SelectItem value='REJECTED'>Rejected</SelectItem>
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
                        column='name'
                        currentSort={sort}
                        onSort={handleSort}
                      >
                        Location Request
                      </SortableTableHeader>
                      <SortableTableHeader
                        column='createdBy.firstName'
                        currentSort={sort}
                        onSort={handleSort}
                      >
                        Submitted By
                      </SortableTableHeader>
                      <SortableTableHeader
                        column='type'
                        currentSort={sort}
                        onSort={handleSort}
                      >
                        Type
                      </SortableTableHeader>
                      <SortableTableHeader
                        column='addressLine'
                        currentSort={sort}
                        onSort={handleSort}
                      >
                        Address
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
                      >
                        Submitted
                      </SortableTableHeader>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {requests.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={7} className='text-center h-32'>
                          <div className='flex flex-col items-center justify-center gap-2'>
                            <FileText className='h-12 w-12 text-muted-foreground/50' />
                            <p className='text-muted-foreground font-medium'>
                              No requests found
                            </p>
                            <p className='text-sm text-muted-foreground'>
                              Try changing filters or search keywords
                            </p>
                          </div>
                        </TableCell>
                      </TableRow>
                    ) : (
                      requests.map((req: any, index: number) => (
                        <TableRow
                          key={req.id}
                          className='hover:bg-muted/50 transition-colors'
                        >
                          <TableCell className='text-center text-muted-foreground font-medium'>
                            {(page - 1) * itemsPerPage + index + 1}
                          </TableCell>
                          <TableCell>
                            <Link
                              href={`/admin/location-requests/${req.id}`}
                              className='flex items-center gap-3 group'
                            >
                              {req.locationImageUrls &&
                              req.locationImageUrls.length > 0 ? (
                                <div className='relative h-10 w-10 flex-shrink-0 rounded-md overflow-hidden border-2 border-background'>
                                  <Image
                                    src={req.locationImageUrls[0]}
                                    alt={req.name}
                                    fill
                                    className='object-cover'
                                    sizes='40px'
                                  />
                                </div>
                              ) : (
                                <div className='h-10 w-10 flex-shrink-0 rounded-md bg-muted border-2 border-background flex items-center justify-center'>
                                  <MapPin className='h-4 w-4 text-muted-foreground' />
                                </div>
                              )}
                              <div className='flex-1 min-w-0'>
                                <p className='font-medium group-hover:text-primary transition-colors truncate'>
                                  {req.name}
                                </p>
                                {req.description && (
                                  <p className='text-xs text-muted-foreground truncate'>
                                    {req.description}
                                  </p>
                                )}
                              </div>
                            </Link>
                          </TableCell>
                          <TableCell>
                            {req.createdBy ? (
                              <div className='flex items-center gap-2'>
                                <Avatar className='h-8 w-8 border-2 border-background'>
                                  {req.createdBy.avatarUrl && (
                                    <AvatarImage
                                      src={req.createdBy.avatarUrl}
                                      alt={`${req.createdBy.firstName} ${req.createdBy.lastName}`}
                                      className='object-cover'
                                    />
                                  )}
                                  <AvatarFallback className='bg-primary/10 text-primary font-semibold text-xs'>
                                    {getInitials(
                                      req.createdBy.firstName || '',
                                      req.createdBy.lastName || ''
                                    )}
                                  </AvatarFallback>
                                </Avatar>
                                <div className='flex-1 min-w-0'>
                                  <p className='text-sm font-medium truncate'>
                                    {req.createdBy.firstName}{' '}
                                    {req.createdBy.lastName}
                                  </p>
                                  {req.createdBy.email && (
                                    <p className='text-xs text-muted-foreground truncate'>
                                      {req.createdBy.email}
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
                            {req.type === 'BUSINESS_OWNED' ? (
                              <Badge
                                variant='outline'
                                className='flex items-center w-fit gap-1 bg-orange-100 text-orange-700 hover:bg-orange-100 border-orange-200 dark:bg-orange-950 dark:text-orange-400 dark:border-orange-800'
                              >
                                <Building2 className='h-3 w-3' />
                                Business
                              </Badge>
                            ) : (
                              <Badge
                                variant='outline'
                                className='flex items-center w-fit gap-1 bg-blue-100 text-blue-700 hover:bg-blue-100 border-blue-200 dark:bg-blue-950 dark:text-blue-400 dark:border-blue-800'
                              >
                                <Globe className='h-3 w-3' />
                                Public
                              </Badge>
                            )}
                          </TableCell>
                          <TableCell className='text-muted-foreground max-w-[200px]'>
                            <div className='truncate' title={req.addressLine}>
                              {req.addressLine}
                              {req.addressLevel1 && `, ${req.addressLevel1}`}
                              {req.addressLevel2 && `, ${req.addressLevel2}`}
                            </div>
                          </TableCell>
                          <TableCell>{getStatusBadge(req.status)}</TableCell>
                          <TableCell className='text-sm text-muted-foreground'>
                            {formatShortDate(req.createdAt)}
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </div>

              {/* Pagination */}
              {meta && meta.totalPages > 1 && (
                <div className='flex flex-col sm:flex-row items-center justify-between gap-4 pt-4 border-t'>
                  <div className='text-sm text-muted-foreground'>
                    Showing{' '}
                    <span className='font-medium text-foreground'>
                      {(page - 1) * itemsPerPage + 1}
                    </span>{' '}
                    -{' '}
                    <span className='font-medium text-foreground'>
                      {Math.min(page * itemsPerPage, meta.totalItems)}
                    </span>{' '}
                    of{' '}
                    <span className='font-medium text-foreground'>
                      {meta.totalItems}
                    </span>{' '}
                    requests
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
                        Page {page} of {meta.totalPages}
                      </span>
                    </div>
                    <Button
                      variant='outline'
                      size='sm'
                      onClick={() => setPage(page + 1)}
                      disabled={page >= meta.totalPages}
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
    </div>
  );
}
