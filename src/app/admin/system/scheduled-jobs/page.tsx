'use client';

import { useState, useMemo, useEffect } from 'react';
import { useDebounce } from 'use-debounce';
import { useRouter, useSearchParams, usePathname } from 'next/navigation';
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
  IconRefresh,
  IconClock,
  IconCheck,
  IconX,
  IconAlertTriangle,
  IconLoader,
  IconPlayerPlay,
} from '@tabler/icons-react';
import { Loader2 } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { formatShortDate, formatDateTime } from '@/lib/utils';
import { useQueryClient } from '@tanstack/react-query';
import { useScheduledJobs, useScheduledJobTypes, useRunScheduledJob } from '@/hooks/admin/useScheduledJobs';
import type { ScheduledJob } from '@/api/admin';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
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

type JobStatus = 'PENDING' | 'PROCESSING' | 'COMPLETED' | 'FAILED';

function getStatusBadge(status: JobStatus) {
  switch (status) {
    case 'PENDING':
      return (
        <Badge variant="outline" className="bg-yellow-50 text-yellow-700 border-yellow-300 dark:bg-yellow-950 dark:text-yellow-300 dark:border-yellow-700">
          <IconClock className="h-3 w-3 mr-1" />
          Pending
        </Badge>
      );
    case 'PROCESSING':
      return (
        <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-300 dark:bg-blue-950 dark:text-blue-300 dark:border-blue-700">
          <IconLoader className="h-3 w-3 mr-1 animate-spin" />
          Processing
        </Badge>
      );
    case 'COMPLETED':
      return (
        <Badge variant="outline" className="bg-green-50 text-green-700 border-green-300 dark:bg-green-950 dark:text-green-300 dark:border-green-700">
          <IconCheck className="h-3 w-3 mr-1" />
          Completed
        </Badge>
      );
    case 'FAILED':
      return (
        <Badge variant="outline" className="bg-red-50 text-red-700 border-red-300 dark:bg-red-950 dark:text-red-300 dark:border-red-700">
          <IconX className="h-3 w-3 mr-1" />
          Failed
        </Badge>
      );
    default:
      return <Badge variant="secondary">{status}</Badge>;
  }
}

function getTypeBadge(type: string) {
  const colors: Record<string, string> = {
    'event.payout': 'bg-purple-50 text-purple-700 border-purple-300 dark:bg-purple-950 dark:text-purple-300',
    'event.notify_start': 'bg-orange-50 text-orange-700 border-orange-300 dark:bg-orange-950 dark:text-orange-300',
    'location_booking.payout': 'bg-blue-50 text-blue-700 border-blue-300 dark:bg-blue-950 dark:text-blue-300',
  };

  return (
    <Badge variant="outline" className={colors[type] || 'bg-gray-50 text-gray-700 border-gray-300'}>
      {type.replace(/_/g, ' ').replace(/\./g, ' ')}
    </Badge>
  );
}

export default function ScheduledJobsPage() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const queryClient = useQueryClient();

  // Initialize state from URL params or defaults
  const [searchTerm, setSearchTerm] = useState(searchParams.get('search') || '');
  const [debouncedSearchTerm] = useDebounce(searchTerm, 300);
  const [statusFilter, setStatusFilter] = useState<JobStatus | 'all'>(
    (searchParams.get('status') as JobStatus) || 'all'
  );
  const [typeFilter, setTypeFilter] = useState<string>(
    searchParams.get('type') || 'all'
  );
  const [page, setPage] = useState(Number(searchParams.get('page')) || 1);
  const [selectedJobId, setSelectedJobId] = useState<number | null>(null);
  const [isRunJobDialogOpen, setIsRunJobDialogOpen] = useState(false);
  const itemsPerPage = 10;

  // Fetch job types
  const { data: jobTypes = [] } = useScheduledJobTypes();

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

    if (typeFilter !== 'all') {
      params.set('type', typeFilter);
    } else {
      params.delete('type');
    }

    if (page > 1) {
      params.set('page', page.toString());
    } else {
      params.delete('page');
    }

    router.replace(`${pathname}?${params.toString()}`);
  }, [debouncedSearchTerm, statusFilter, typeFilter, page, pathname, router, searchParams]);

  // Data fetching
  const { data, isLoading, error } = useScheduledJobs({
    page,
    limit: itemsPerPage,
    search: debouncedSearchTerm.trim() || undefined,
    searchBy: debouncedSearchTerm.trim() ? ['associatedId'] : undefined,
    status: statusFilter !== 'all' ? statusFilter : undefined,
    jobType: typeFilter !== 'all' ? typeFilter : undefined,
    sortBy: 'executeAt:ASC',
  });

  const jobs = useMemo(() => data?.data || [], [data?.data]);
  const meta = data?.meta;
  const runJob = useRunScheduledJob();

  const refresh = () => {
    queryClient.invalidateQueries({ queryKey: ['adminScheduledJobs'] });
    queryClient.invalidateQueries({ queryKey: ['adminScheduledJobTypes'] });
  };

  const handleRunJobClick = (jobId: number) => {
    setSelectedJobId(jobId);
    setIsRunJobDialogOpen(true);
  };

  const handleRunJobConfirm = () => {
    if (selectedJobId !== null) {
      runJob.mutate(selectedJobId, {
        onSuccess: () => {
          setIsRunJobDialogOpen(false);
          setSelectedJobId(null);
          refresh();
        },
      });
    }
  };

  const stats = useMemo(() => {
    return {
      total: meta?.totalItems || 0,
      pending: jobs.filter(j => j.status === 'PENDING').length,
      processing: jobs.filter(j => j.status === 'PROCESSING').length,
      completed: jobs.filter(j => j.status === 'COMPLETED').length,
      failed: jobs.filter(j => j.status === 'FAILED').length,
    };
  }, [jobs, meta]);

  if (error) {
    return (
      <div className="space-y-6">
        <Card>
          <CardContent className="pt-6">
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <IconAlertTriangle className="h-12 w-12 text-destructive mb-4" />
              <h3 className="text-lg font-semibold mb-2">Error loading scheduled jobs</h3>
              <p className="text-muted-foreground mb-4">
                {error instanceof Error ? error.message : 'An unexpected error occurred'}
              </p>
              <Button onClick={refresh} variant="outline">
                <IconRefresh className="h-4 w-4 mr-2" />
                Try Again
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className='space-y-6'>
      {/* Statistics Cards */}
      <div className='grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4'>
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total Jobs</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.total}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">Pending</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-600">{stats.pending}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">Processing</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">{stats.processing}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">Completed</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{stats.completed}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">Failed</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{stats.failed}</div>
          </CardContent>
        </Card>
      </div>

      {/* Jobs Table */}
      <Card className='border-border/60 shadow-sm'>
        <CardHeader>
          <div className='flex flex-col sm:flex-row sm:items-center justify-between gap-4'>
            <div>
              <CardTitle>Scheduled Jobs</CardTitle>
              <CardDescription>
                {isLoading ? 'Loading...' : `Showing ${jobs.length} of ${meta?.totalItems || 0} jobs`}
              </CardDescription>
            </div>
            <div className='flex flex-col sm:flex-row gap-2'>
              <div className='relative'>
                <IconSearch className='absolute left-2 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground' />
                <Input
                  placeholder='Search by associated ID...'
                  value={searchTerm}
                  onChange={(e) => {
                    setSearchTerm(e.target.value);
                    setPage(1);
                  }}
                  className='pl-8 w-full sm:w-[250px]'
                />
              </div>
              <Select
                value={statusFilter}
                onValueChange={(value) => {
                  setStatusFilter(value as JobStatus | 'all');
                  setPage(1);
                }}
              >
                <SelectTrigger className='w-full sm:w-[150px]'>
                  <SelectValue placeholder='Status' />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value='all'>All Status</SelectItem>
                  <SelectItem value='PENDING'>Pending</SelectItem>
                  <SelectItem value='PROCESSING'>Processing</SelectItem>
                  <SelectItem value='COMPLETED'>Completed</SelectItem>
                  <SelectItem value='FAILED'>Failed</SelectItem>
                </SelectContent>
              </Select>
              <Select
                value={typeFilter}
                onValueChange={(value) => {
                  setTypeFilter(value);
                  setPage(1);
                }}
              >
                <SelectTrigger className='w-full sm:w-[180px]'>
                  <SelectValue placeholder='Job Type' />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value='all'>All Types</SelectItem>
                  {jobTypes.map((type) => (
                    <SelectItem key={type} value={type}>
                      {type.replace(/_/g, ' ').replace(/\./g, ' ')}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {isLoading && !jobs.length ? (
            <div className='flex items-center justify-center py-12'>
              <Loader2 className='h-8 w-8 animate-spin text-muted-foreground' />
            </div>
          ) : jobs.length === 0 ? (
            <div className='flex flex-col items-center justify-center py-12 text-center'>
              <IconClock className='h-12 w-12 text-muted-foreground mb-4' />
              <h3 className='text-lg font-semibold mb-2'>No scheduled jobs found</h3>
              <p className='text-muted-foreground'>
                {searchTerm || statusFilter !== 'all' || typeFilter !== 'all'
                  ? 'Try adjusting your filters'
                  : 'No jobs have been scheduled yet'}
              </p>
            </div>
          ) : (
            <div className='overflow-x-auto'>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>ID</TableHead>
                    <TableHead className="w-[40px]"></TableHead>
                    <TableHead>Job Type</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Execute At</TableHead>
                    <TableHead>Created At</TableHead>
                    <TableHead>Updated At</TableHead>
                    <TableHead>Associated ID</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {jobs.map((job: ScheduledJob) => (
                    <TableRow key={job.id}>
                      <TableCell className='font-medium'>#{job.id}</TableCell>
                      <TableCell className="w-[40px]">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8"
                            >
                              <svg
                                width="16"
                                height="16"
                                viewBox="0 0 16 16"
                                fill="currentColor"
                                xmlns="http://www.w3.org/2000/svg"
                              >
                                <circle cx="4" cy="4" r="1.5" />
                                <circle cx="4" cy="8" r="1.5" />
                                <circle cx="4" cy="12" r="1.5" />
                                <circle cx="12" cy="4" r="1.5" />
                                <circle cx="12" cy="8" r="1.5" />
                                <circle cx="12" cy="12" r="1.5" />
                              </svg>
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem
                              onClick={() => handleRunJobClick(job.id)}
                              disabled={job.status !== 'PENDING'}
                              className="cursor-pointer"
                            >
                              <IconPlayerPlay className="mr-2 h-4 w-4" />
                              Run job now
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                      <TableCell>{getTypeBadge(job.jobType)}</TableCell>
                      <TableCell>{getStatusBadge(job.status)}</TableCell>
                      <TableCell>
                        {job.executeAt ? formatDateTime(job.executeAt) : 'N/A'}
                      </TableCell>
                      <TableCell>
                        {job.createdAt ? formatShortDate(job.createdAt) : 'N/A'}
                      </TableCell>
                      <TableCell>
                        {job.updatedAt ? formatShortDate(job.updatedAt) : 'N/A'}
                      </TableCell>
                      <TableCell>
                        {job.associatedId || (
                          <span className='text-muted-foreground italic'>None</span>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Pagination */}
      {meta && meta.totalPages > 1 && (
        <div className='flex items-center justify-between'>
          <div className='text-sm text-muted-foreground'>
            Page {meta.currentPage} of {meta.totalPages} ({meta.totalItems} total jobs)
          </div>
          <div className='flex gap-2'>
            <Button
              variant='outline'
              size='sm'
              onClick={() => setPage(page - 1)}
              disabled={page <= 1 || isLoading}
            >
              Previous
            </Button>
            <Button
              variant='outline'
              size='sm'
              onClick={() => setPage(page + 1)}
              disabled={page >= meta.totalPages || isLoading}
            >
              Next
            </Button>
          </div>
        </div>
      )}

      {/* Run Job Confirmation Dialog */}
      <AlertDialog open={isRunJobDialogOpen} onOpenChange={setIsRunJobDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <IconPlayerPlay className="h-5 w-5 text-primary" />
              Run Job Now
            </AlertDialogTitle>
            <AlertDialogDescription>
              The job will be run within the next minute.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={runJob.isPending}>
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleRunJobConfirm}
              disabled={runJob.isPending}
              className="bg-primary text-primary-foreground hover:bg-primary/90"
            >
              {runJob.isPending ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Running...
                </>
              ) : (
                <>
                  <IconPlayerPlay className="h-4 w-4 mr-2" />
                  Confirm
                </>
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
