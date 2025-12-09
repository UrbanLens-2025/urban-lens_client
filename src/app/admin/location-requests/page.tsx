'use client';

import { useState, useMemo, useEffect } from 'react';
import { useDebounce } from 'use-debounce';
import { useRouter, useSearchParams, usePathname } from 'next/navigation';
import Link from 'next/link';
import { SortableTableHeader, SortDirection } from '@/components/shared/SortableTableHeader';
import { TableFilters } from '@/components/shared/TableFilters';
import { PageHeader } from '@/components/shared/PageHeader';
import { PageContainer } from '@/components/shared/PageContainer';
import { StatCard } from '@/components/shared/StatCard';
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
} from 'lucide-react';
import { LocationRequest, LocationStatus } from '@/types';
import { useLocationAdminRequests } from '@/hooks/admin/useLocationAdminRequests';
import { useQueryClient } from '@tanstack/react-query';
import { formatShortDate, formatDateTime } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';
import Image from 'next/image';

type StatusFilter = 'PENDING' | 'APPROVED' | 'REJECTED';

export default function LocationRequestsPage() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const queryClient = useQueryClient();

  // Initialize state from URL params or defaults
  const [searchTerm, setSearchTerm] = useState(searchParams.get('search') || '');
  const [debouncedSearchTerm] = useDebounce(searchTerm, 300);
  const [statusFilter, setStatusFilter] = useState<StatusFilter>(
    (searchParams.get('status') as StatusFilter) || 'PENDING'
  );
  const [page, setPage] = useState(Number(searchParams.get('page')) || 1);
  const [sort, setSort] = useState<{ column: string; direction: SortDirection }>({
    column: 'createdAt',
    direction: 'DESC',
  });
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
    
    if (statusFilter !== 'PENDING') {
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
  const getRequestStatus = (): LocationStatus => {
    if (statusFilter === 'PENDING') return 'AWAITING_ADMIN_REVIEW';
    if (statusFilter === 'APPROVED') return 'APPROVED';
    return 'REJECTED';
  };

  const sortBy = sort.direction ? `${sort.column}:${sort.direction}` : 'createdAt:DESC';

  // Data fetching for current view
  const { data, isLoading, error } = useLocationAdminRequests(
    page,
    itemsPerPage,
    debouncedSearchTerm.trim() || undefined,
    getRequestStatus(),
    sortBy
  );

  // Fetch statistics for all statuses (without pagination, just to get counts)
  const { data: pendingData, isLoading: isLoadingPending } = useLocationAdminRequests(
    1,
    1,
    undefined,
    'AWAITING_ADMIN_REVIEW',
    'createdAt:DESC'
  );

  const { data: approvedData, isLoading: isLoadingApproved } = useLocationAdminRequests(
    1,
    1,
    undefined,
    'APPROVED',
    'createdAt:DESC'
  );

  const { data: rejectedData, isLoading: isLoadingRejected } = useLocationAdminRequests(
    1,
    1,
    undefined,
    'REJECTED',
    'createdAt:DESC'
  );

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

  const handleClearFilters = () => {
    setSearchTerm('');
    setStatusFilter('PENDING');
    setSort({ column: 'createdAt', direction: 'DESC' });
    setPage(1);
  };

  const activeFiltersCount = useMemo(() => {
    let count = 0;
    if (statusFilter !== 'PENDING') count++;
    if (debouncedSearchTerm) count++;
    return count;
  }, [statusFilter, debouncedSearchTerm]);

  const getStatusBadge = (status: LocationStatus) => {
    const statusUpper = status?.toUpperCase();
    if (statusUpper === 'AWAITING_ADMIN_REVIEW' || statusUpper === 'PENDING') {
      return (
        <Badge
          variant="outline"
          className="flex items-center w-fit bg-yellow-100 text-yellow-700 hover:bg-yellow-100 border-yellow-200 dark:bg-yellow-900/30 dark:text-yellow-400 dark:border-yellow-800"
        >
          <Clock className="h-3 w-3 mr-1" />
          Pending
        </Badge>
      );
    }
    if (statusUpper === 'APPROVED') {
      return (
        <Badge
          variant="outline"
          className="flex items-center w-fit bg-green-100 text-green-700 hover:bg-green-100 border-green-200 dark:bg-green-900/30 dark:text-green-400 dark:border-green-800"
        >
          <CheckCircle2 className="h-3 w-3 mr-1" />
          Approved
        </Badge>
      );
    }
    if (statusUpper === 'REJECTED') {
      return (
        <Badge
          variant="outline"
          className="flex items-center w-fit bg-red-100 text-red-700 hover:bg-red-100 border-red-200 dark:bg-red-900/30 dark:text-red-400 dark:border-red-800"
        >
          <XCircle className="h-3 w-3 mr-1" />
          Rejected
        </Badge>
      );
    }
    return <Badge variant="outline">{status || 'Unknown'}</Badge>;
  };

  if (error) {
    return (
      <PageContainer>
        <Card>
          <CardContent className="pt-6">
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <XCircle className="h-12 w-12 text-destructive mb-4" />
              <h3 className="text-lg font-semibold mb-2">Error Loading Requests</h3>
              <p className="text-sm text-muted-foreground mb-4">
                Unable to load location requests. Please try again.
              </p>
              <Button variant="outline" onClick={refresh}>
                Try Again
              </Button>
            </div>
          </CardContent>
        </Card>
      </PageContainer>
    );
  }

  return (
    <PageContainer>
      <PageHeader
        title="Location Requests"
        description="Review and manage location registration requests from businesses and users"
        icon={FileText}
      />

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Total Requests"
          value={stats.isLoading ? '—' : stats.total.toLocaleString()}
          description={stats.isLoading ? 'Loading...' : `${requests.length} on this page`}
          icon={MapPin}
          color="blue"
          isLoading={stats.isLoading}
        />

        <StatCard
          title="Pending Review"
          value={stats.isLoading ? '—' : stats.pending.toLocaleString()}
          description={
            stats.isLoading
              ? 'Loading...'
              : `${stats.total > 0 ? Math.round((stats.pending / stats.total) * 100) : 0}% of total`
          }
          icon={Clock}
          color="orange"
          isLoading={stats.isLoading}
        />

        <StatCard
          title="Approved"
          value={stats.isLoading ? '—' : stats.approved.toLocaleString()}
          description={
            stats.isLoading
              ? 'Loading...'
              : `${stats.total > 0 ? Math.round((stats.approved / stats.total) * 100) : 0}% of total`
          }
          icon={CheckCircle2}
          color="green"
          isLoading={stats.isLoading}
        />

        <StatCard
          title="Rejected"
          value={stats.isLoading ? '—' : stats.rejected.toLocaleString()}
          description={
            stats.isLoading
              ? 'Loading...'
              : `${stats.total > 0 ? Math.round((stats.rejected / stats.total) * 100) : 0}% of total`
          }
          icon={XCircle}
          color="red"
          isLoading={stats.isLoading}
        />
      </div>

      {/* Main Table Card */}
      <Card className="border-border/60 shadow-sm">
        <CardHeader className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <CardTitle>
                {statusFilter === 'PENDING' && 'Pending Requests'}
                {statusFilter === 'APPROVED' && 'Approved Requests'}
                {statusFilter === 'REJECTED' && 'Rejected Requests'}
              </CardTitle>
              <CardDescription className="mt-1">
                Showing {requests.length} of {meta?.totalItems || 0} requests
                {statusFilter !== 'PENDING' && ` (${statusFilter.toLowerCase()})`}
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          {/* Filters */}
          <TableFilters
            searchValue={searchTerm}
            onSearchChange={(value) => {
              setSearchTerm(value);
              setPage(1);
            }}
            searchPlaceholder="Search requests by name..."
            filters={[
              {
                key: 'status',
                label: 'Status',
                value: statusFilter,
                options: [
                  { value: 'PENDING', label: 'Pending' },
                  { value: 'APPROVED', label: 'Approved' },
                  { value: 'REJECTED', label: 'Rejected' },
                ],
                onValueChange: (value) => {
                  setStatusFilter(value as StatusFilter);
                  setPage(1);
                },
              },
            ]}
            activeFiltersCount={activeFiltersCount}
            onClearFilters={handleClearFilters}
          />

          {/* Table */}
          {isLoading && !data ? (
            <div className="flex items-center justify-center h-64">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : requests.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <div className="h-16 w-16 rounded-full bg-muted flex items-center justify-center mb-4">
                <FileText className="h-8 w-8 text-muted-foreground" />
              </div>
              <h3 className="text-lg font-semibold mb-2">
                {searchTerm || statusFilter !== 'PENDING'
                  ? 'No requests found'
                  : 'No pending requests'}
              </h3>
              <p className="text-sm text-muted-foreground max-w-md">
                {searchTerm || statusFilter !== 'PENDING'
                  ? 'Try adjusting your search terms or filters'
                  : 'All location requests have been reviewed'}
              </p>
            </div>
          ) : (
            <>
              <div className="rounded-md border overflow-hidden">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-muted/50">
                      <TableHead className="w-[50px] font-semibold">#</TableHead>
                      <SortableTableHeader
                        column="name"
                        currentSort={sort}
                        onSort={handleSort}
                        className="w-[250px]"
                      >
                        Location Name
                      </SortableTableHeader>
                      <SortableTableHeader
                        column="createdBy.firstName"
                        currentSort={sort}
                        onSort={handleSort}
                        className="hidden md:table-cell"
                      >
                        Submitted By
                      </SortableTableHeader>
                      <TableHead className="hidden lg:table-cell">Type</TableHead>
                      <TableHead>Status</TableHead>
                      <SortableTableHeader
                        column="createdAt"
                        currentSort={sort}
                        onSort={handleSort}
                        className="hidden sm:table-cell"
                      >
                        Submitted
                      </SortableTableHeader>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {requests.map((req: LocationRequest, index: number) => (
                      <TableRow
                        key={req.id}
                        className="hover:bg-muted/50 transition-colors cursor-pointer"
                      >
                        <TableCell className="font-medium text-muted-foreground">
                          {(page - 1) * itemsPerPage + index + 1}
                        </TableCell>
                        <TableCell className="font-medium">
                          <Link
                            href={`/admin/location-requests/${req.id}`}
                            className="flex items-center gap-3 group"
                          >
                            {req.imageUrls && req.imageUrls.length > 0 ? (
                              <div className="relative w-12 h-12 rounded-lg overflow-hidden flex-shrink-0 border group-hover:ring-2 group-hover:ring-primary transition-all">
                                <Image
                                  src={req.imageUrls[0]}
                                  alt={req.name}
                                  fill
                                  className="object-cover"
                                />
                              </div>
                            ) : (
                              <div className="w-12 h-12 rounded-lg bg-muted flex items-center justify-center flex-shrink-0">
                                <MapPin className="h-5 w-5 text-muted-foreground" />
                              </div>
                            )}
                            <div className="flex flex-col min-w-0 flex-1">
                              <span className="font-semibold group-hover:text-primary transition-colors truncate">
                                {req.name}
                              </span>
                              {req.addressLine && (
                                <span className="text-xs text-muted-foreground truncate">
                                  {req.addressLine}
                                </span>
                              )}
                            </div>
                          </Link>
                        </TableCell>
                        <TableCell className="hidden md:table-cell">
                          {req.createdBy ? (
                            <div className="flex items-center gap-2">
                              <div className="h-8 w-8 rounded-full bg-muted flex items-center justify-center flex-shrink-0">
                                <User className="h-4 w-4 text-muted-foreground" />
                              </div>
                              <div className="flex flex-col min-w-0">
                                <span className="text-sm font-medium truncate">
                                  {req.createdBy.firstName} {req.createdBy.lastName}
                                </span>
                                {req.createdBy.email && (
                                  <span className="text-xs text-muted-foreground truncate">
                                    {req.createdBy.email}
                                  </span>
                                )}
                              </div>
                            </div>
                          ) : (
                            <span className="text-muted-foreground text-sm">N/A</span>
                          )}
                        </TableCell>
                        <TableCell className="hidden lg:table-cell">
                          {req.type === 'BUSINESS_OWNED' ? (
                            <Badge
                              variant="outline"
                              className="flex items-center w-fit bg-orange-100 text-orange-700 hover:bg-orange-100 border-orange-200 dark:bg-orange-900/30 dark:text-orange-400 dark:border-orange-800"
                            >
                              <Building2 className="h-3 w-3 mr-1" />
                              Business
                            </Badge>
                          ) : (
                            <Badge
                              variant="outline"
                              className="flex items-center w-fit bg-blue-100 text-blue-700 hover:bg-blue-100 border-blue-200 dark:bg-blue-900/30 dark:text-blue-400 dark:border-blue-800"
                            >
                              <Globe className="h-3 w-3 mr-1" />
                              Public
                            </Badge>
                          )}
                        </TableCell>
                        <TableCell>{getStatusBadge(req.status)}</TableCell>
                        <TableCell className="hidden sm:table-cell text-muted-foreground text-sm">
                          {formatDateTime(req.createdAt)}
                        </TableCell>
                        <TableCell className="text-right">
                          <Link href={`/admin/location-requests/${req.id}`}>
                            <Button variant="ghost" size="icon" className="h-8 w-8">
                              <Eye className="h-4 w-4" />
                            </Button>
                          </Link>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>

              {/* Enhanced Pagination */}
              {meta && meta.totalPages > 1 && (
                <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-4 border-t px-6 pb-4">
                  <div className="text-sm text-muted-foreground">
                    Showing {(meta.currentPage - 1) * (meta.itemsPerPage || 10) + 1} to{' '}
                    {Math.min(meta.currentPage * (meta.itemsPerPage || 10), meta.totalItems)} of{' '}
                    {meta.totalItems} requests
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setPage(1)}
                      disabled={meta.currentPage <= 1}
                    >
                      First
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setPage(page - 1)}
                      disabled={meta.currentPage <= 1}
                    >
                      Previous
                    </Button>
                    <div className="flex items-center gap-1 px-2">
                      {[...Array(Math.min(5, meta.totalPages))].map((_, i) => {
                        const pageNum =
                          meta.totalPages <= 5
                            ? i + 1
                            : meta.currentPage <= 3
                            ? i + 1
                            : meta.currentPage >= meta.totalPages - 2
                            ? meta.totalPages - 4 + i
                            : meta.currentPage - 2 + i;
                        if (pageNum > meta.totalPages) return null;
                        return (
                          <Button
                            key={pageNum}
                            variant={pageNum === meta.currentPage ? 'default' : 'outline'}
                            size="sm"
                            onClick={() => setPage(pageNum)}
                            className="w-8 h-8 p-0"
                          >
                            {pageNum}
                          </Button>
                        );
                      })}
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setPage(page + 1)}
                      disabled={meta.currentPage >= meta.totalPages}
                    >
                      Next
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setPage(meta.totalPages)}
                      disabled={meta.currentPage >= meta.totalPages}
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
    </PageContainer>
  );
}
