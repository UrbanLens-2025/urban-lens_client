'use client';

import { useState, useMemo, useEffect } from 'react';
import Link from 'next/link';
import { useDebounce } from 'use-debounce';
import { useRouter, useSearchParams, usePathname } from 'next/navigation';
import { useBusinessAccounts } from '@/hooks/admin/useBusinessAccounts';
import { useProcessBusinessAccount } from '@/hooks/admin/useProcessBusinessAccount';
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
import { IconSearch, IconFilter, IconBriefcase, IconClock, IconCheck, IconX, IconRefresh } from '@tabler/icons-react';
import { Badge } from '@/components/ui/badge';
import { Loader2 } from 'lucide-react';
import { BusinessProfile, BusinessStatus } from '@/types';
import { useQueryClient } from '@tanstack/react-query';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Textarea } from '@/components/ui/textarea';

export default function AdminBusinessPage() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const queryClient = useQueryClient();

  // Initialize state from URL params or defaults
  const [searchTerm, setSearchTerm] = useState(searchParams.get('search') || '');
  const [debouncedSearchTerm] = useDebounce(searchTerm, 300);
  const [statusTab, setStatusTab] = useState<BusinessStatus>((searchParams.get('status') as BusinessStatus) || 'PENDING');
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
    
    if (statusTab !== 'PENDING') {
      params.set('status', statusTab);
    } else {
      params.delete('status');
    }

    if (page > 1) {
      params.set('page', page.toString());
    } else {
      params.delete('page');
    }

    router.replace(`${pathname}?${params.toString()}`);
  }, [debouncedSearchTerm, statusTab, page, pathname, router, searchParams]);

  const { data: response, isLoading, isFetching } = useBusinessAccounts({
    page,
    limit: itemsPerPage,
    search: debouncedSearchTerm.trim() || undefined,
    status: statusTab,
    sortBy: 'createdAt:DESC',
  });
  const businesses = response?.data || [];
  const meta = response?.meta;

  const { mutate: processAccount, isPending } = useProcessBusinessAccount();

  const [approvingBusiness, setApprovingBusiness] = useState<BusinessProfile | null>(null);
  const [rejectingBusiness, setRejectingBusiness] = useState<BusinessProfile | null>(null);
  const [adminNotes, setAdminNotes] = useState('');

  const handleConfirmApprove = () => {
    if (!approvingBusiness) return;
    processAccount(
      { id: approvingBusiness.accountId, payload: { status: 'APPROVED' } },
      {
        onSuccess: () => {
          setStatusTab('APPROVED');
          setPage(1);
          queryClient.invalidateQueries({ queryKey: ['businessAccounts'] });
          setApprovingBusiness(null);
        },
      }
    );
  };

  const handleConfirmReject = () => {
    if (!rejectingBusiness) return;
    processAccount(
      {
        id: rejectingBusiness.accountId,
        payload: { status: 'REJECTED', adminNotes: adminNotes },
      },
      {
        onSuccess: () => {
          setStatusTab('REJECTED');
          setPage(1);
          queryClient.invalidateQueries({ queryKey: ['businessAccounts'] });
          setRejectingBusiness(null);
          setAdminNotes('');
        },
      }
    );
  };

  const refresh = () => {
    queryClient.invalidateQueries({ queryKey: ['businessAccounts'] });
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

  const getStatusBadge = (status: BusinessStatus) => {
    const map: Record<BusinessStatus, { label: string; variant: 'default' | 'secondary' | 'destructive' }> = {
      PENDING: { label: 'Pending', variant: 'secondary' },
      APPROVED: { label: 'Approved', variant: 'default' },
      REJECTED: { label: 'Rejected', variant: 'destructive' },
    } as const;
    const s = map[status];
    return <Badge variant={s.variant}>{s.label}</Badge>;
  };

  // Calculate statistics
  const stats = useMemo(() => {
    // TODO: Implement real statistics from API
    // Currently using mock data as the list API only returns paginated results
    return {
      total: meta?.totalItems || 0,
      pending: 15,
      approved: 120,
      rejected: 8,
    };
  }, [meta]);

  return (
    <div className="space-y-6">

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Businesses</CardTitle>
            <IconBriefcase className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.total}</div>
            <p className="text-xs text-muted-foreground">
              All business accounts
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
              Active businesses
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
              Rejected accounts
            </p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>All Registrations ({meta?.totalItems || 0})</span>
            <div className="flex items-center gap-2">
              <div className="relative">
                <IconSearch className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search businesses..."
                  className="pl-8 w-[250px]"
                  value={searchTerm}
                  onChange={(e) => {
                    setSearchTerm(e.target.value);
                    setPage(1);
                  }}
                />
              </div>
              <Select
                value={statusTab}
                onValueChange={(value) => {
                  setStatusTab(value as BusinessStatus);
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
              <Button variant="outline" size="icon" onClick={refresh} disabled={isFetching}>
                {isFetching ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <IconRefresh className="h-4 w-4" />
                )}
              </Button>
            </div>
          </CardTitle>
          <CardDescription className="hidden">
            Manage business registrations and approvals.
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
                    <TableHead>Business Name</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Category</TableHead>
                    <TableHead>Submitted</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {businesses.map((biz: BusinessProfile, index: number) => (
                    <TableRow key={biz.accountId}>
                      <TableCell className="font-medium text-muted-foreground">
                        {(page - 1) * itemsPerPage + index + 1}
                      </TableCell>
                      <TableCell className="font-medium">
                        <Link
                          href={`/admin/business/${biz.accountId}`}
                          className="hover:underline text-blue-600 hover:text-blue-800"
                        >
                          {biz.name}
                        </Link>
                      </TableCell>
                      <TableCell>{biz.email}</TableCell>
                      <TableCell>
                        <Badge variant="secondary">{biz.category}</Badge>
                      </TableCell>
                      <TableCell>{formatDateTime((biz as any).createdAt)}</TableCell>
                      <TableCell>{getStatusBadge((biz as any).status || statusTab)}</TableCell>
                    </TableRow>
                  ))}
                  {businesses.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center h-24">
                        No businesses found matching your criteria.
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

      <AlertDialog
        open={!!approvingBusiness}
        onOpenChange={() => setApprovingBusiness(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Approve this Business Account?</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to approve the business &quot;
              {approvingBusiness?.name}&quot;?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleConfirmApprove}
              disabled={isPending}
            >
              {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Confirm Approve
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog
        open={!!rejectingBusiness}
        onOpenChange={() => setRejectingBusiness(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Reject this Business Account?</AlertDialogTitle>
            <AlertDialogDescription>
              Please provide a reason for rejecting &quot;
              {rejectingBusiness?.name}&quot;.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <Textarea
            placeholder="Reason for rejection..."
            value={adminNotes}
            onChange={(e) => setAdminNotes(e.target.value)}
            className="mt-4"
          />
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleConfirmReject}
              disabled={isPending}
            >
              {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Confirm Reject
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
