'use client';

import { useState, useMemo, useEffect } from 'react';
import { useDebounce } from 'use-debounce';
import { useRouter, useSearchParams, usePathname } from 'next/navigation';
import Link from 'next/link';
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
  IconSearch,
  IconFilter,
  IconMapPin,
  IconClock,
  IconCheck,
  IconX,
  IconRefresh,
  IconBuildingStore,
  IconWorld,
} from '@tabler/icons-react';
import { Loader2 } from 'lucide-react';
import { LocationRequest, LocationStatus } from '@/types';
import { useLocationAdminRequests } from '@/hooks/admin/useLocationAdminRequests';
import { useQueryClient } from '@tanstack/react-query';
import { formatShortDate } from '@/lib/utils';

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

  // Data fetching
  const { data, isLoading, error } = useLocationAdminRequests(
    page,
    itemsPerPage,
    debouncedSearchTerm.trim() || undefined,
    getRequestStatus(),
    'createdAt:DESC'
  );

  const requests = data?.data || [];
  const meta = data?.meta;

  const refresh = () => {
    queryClient.invalidateQueries({ queryKey: ['locationRequests'] });
  };

  // Calculate statistics
  const stats = useMemo(() => {
    // TODO: Implement real statistics from API
    // Currently using mock data as the list API only returns paginated results
    return {
      total: meta?.totalItems || 0,
      pending: 5,
      approved: 1456,
      rejected: 12,
    };
  }, [meta]);

  if (error) {
    return (
      <div className="space-y-6">
        <Card>
          <CardContent className="pt-6">
            <p className="text-red-600">Error loading location requests. Please try again.</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Requests</CardTitle>
            <IconMapPin className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.total}</div>
            <p className="text-xs text-muted-foreground">
              All location requests
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending</CardTitle>
            <IconClock className="h-4 w-4 text-yellow-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-600">{stats.pending}</div>
            <p className="text-xs text-muted-foreground">
              Awaiting review
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Approved</CardTitle>
            <IconCheck className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{stats.approved}</div>
            <p className="text-xs text-muted-foreground">
              Total approved
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Rejected</CardTitle>
            <IconX className="h-4 w-4 text-red-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{stats.rejected}</div>
            <p className="text-xs text-muted-foreground">
              Rejected requests
            </p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>
              {statusFilter === 'PENDING' && `Pending Requests (${meta?.totalItems || 0})`}
              {statusFilter === 'APPROVED' && `Approved Requests (${meta?.totalItems || 0})`}
              {statusFilter === 'REJECTED' && `Rejected Requests (${meta?.totalItems || 0})`}
            </span>
            <div className="flex items-center gap-2">
              <div className="relative">
                <IconSearch className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search requests..."
                  className="pl-8 w-[250px]"
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
                <SelectTrigger className="w-[180px]">
                  <div className="flex items-center gap-2">
                    <IconFilter className="h-4 w-4" />
                    <SelectValue placeholder="Filter by Status" />
                  </div>
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="PENDING">Pending</SelectItem>
                  <SelectItem value="APPROVED">Approved</SelectItem>
                  <SelectItem value="REJECTED">Rejected</SelectItem>
                </SelectContent>
              </Select>
              <Button variant="outline" size="icon" onClick={refresh} disabled={isLoading}>
                {isLoading ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <IconRefresh className="h-4 w-4" />
                )}
              </Button>
            </div>
          </CardTitle>
          <CardDescription className="hidden">
            Review and manage location requests.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex items-center justify-center h-64">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : (
            <>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[50px]">#</TableHead>
                    <TableHead>Name</TableHead>
                    <TableHead>Submitted By</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Business</TableHead>
                    <TableHead>Submitted</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {requests.map((req: LocationRequest, index: number) => (
                    <TableRow key={req.id}>
                      <TableCell className="font-medium text-muted-foreground">
                        {(page - 1) * itemsPerPage + index + 1}
                      </TableCell>
                      <TableCell className="font-medium">
                        <Link
                          href={`/admin/location-requests/${req.id}`}
                          className="hover:underline text-blue-600 hover:text-blue-800"
                        >
                          {req.name}
                        </Link>
                      </TableCell>
                      <TableCell>
                        {req.createdBy
                          ? `${req.createdBy.firstName} ${req.createdBy.lastName}`
                          : 'N/A'}
                      </TableCell>
                      <TableCell>
                        {req.createdBy?.businessProfile ? (
                          <div className="flex items-center gap-2">
                            <IconBuildingStore className="h-4 w-4 text-muted-foreground" />
                            <span>Business</span>
                          </div>
                        ) : (
                          <div className="flex items-center gap-2 text-muted-foreground">
                            <IconWorld className="h-4 w-4" />
                            <span>Public</span>
                          </div>
                        )}
                      </TableCell>
                      <TableCell>
                        {req.createdBy?.businessProfile?.name || 'N/A'}
                      </TableCell>
                      <TableCell>{formatShortDate(req.createdAt)}</TableCell>
                    </TableRow>
                  ))}
                  {requests.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center h-24">
                        No {statusFilter.toLowerCase()} requests found matching your criteria.
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>

              {/* Pagination */}
              {meta && meta.totalPages > 1 && (
                <div className="flex items-center justify-end space-x-2 py-4">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setPage(page - 1)}
                    disabled={page <= 1}
                  >
                    Previous
                  </Button>
                  <div className="text-sm text-muted-foreground">
                    Page {page} of {meta.totalPages}
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setPage(page + 1)}
                    disabled={page >= meta.totalPages}
                  >
                    Next
                  </Button>
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

