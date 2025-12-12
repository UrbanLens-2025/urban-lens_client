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
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import {
  IconSearch,
  IconFilter,
  IconFlag,
  IconClock,
  IconCheck,
  IconX,
  IconRefresh,
  IconAlertTriangle,
  IconUser,
  IconFileText,
  IconCalendar,
} from '@tabler/icons-react';
import { Loader2 } from 'lucide-react';
import {
  Report,
  ReportStatus,
  ReportTargetType,
  ReportResolutionActions,
  PostReportResolutionActions,
  LocationReportResolutionActions,
  EventReportResolutionActions,
} from '@/types';
import { useReports } from '@/hooks/admin/useReports';
import { useReportById } from '@/hooks/admin/useReportById';
import { useProcessReport, useDeleteReport } from '@/hooks/admin/useProcessReport';
import { useQueryClient } from '@tanstack/react-query';
import { formatShortDate } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import Image from 'next/image';

function getStatusBadge(status: ReportStatus) {
  switch (status) {
    case 'PENDING':
      return (
        <Badge
          variant='outline'
          className='bg-yellow-50 text-yellow-700 border-yellow-300 dark:bg-yellow-950 dark:text-yellow-300 dark:border-yellow-700'
        >
          <IconClock className='h-3 w-3 mr-1' />
          Pending
        </Badge>
      );
    case 'IN_PROGRESS':
      return (
        <Badge
          variant='outline'
          className='bg-blue-50 text-blue-700 border-blue-300 dark:bg-blue-950 dark:text-blue-300 dark:border-blue-700'
        >
          <IconAlertTriangle className='h-3 w-3 mr-1' />
          In Progress
        </Badge>
      );
    case 'RESOLVED':
      return (
        <Badge
          variant='outline'
          className='bg-green-50 text-green-700 border-green-300 dark:bg-green-950 dark:text-green-300 dark:border-green-700'
        >
          <IconCheck className='h-3 w-3 mr-1' />
          Resolved
        </Badge>
      );
    case 'REJECTED':
      return (
        <Badge
          variant='outline'
          className='bg-red-50 text-red-700 border-red-300 dark:bg-red-950 dark:text-red-300 dark:border-red-700'
        >
          <IconX className='h-3 w-3 mr-1' />
          Rejected
        </Badge>
      );
    default:
      return <Badge variant='secondary'>{status}</Badge>;
  }
}

function getTypeBadge(type: ReportTargetType) {
  const colors: Record<ReportTargetType, string> = {
    post: 'bg-purple-50 text-purple-700 border-purple-300 dark:bg-purple-950 dark:text-purple-300',
    location:
      'bg-blue-50 text-blue-700 border-blue-300 dark:bg-blue-950 dark:text-blue-300',
    event:
      'bg-orange-50 text-orange-700 border-orange-300 dark:bg-orange-950 dark:text-orange-300',
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
  const [statusFilter, setStatusFilter] = useState<ReportStatus | 'all'>(
    (searchParams.get('status') as ReportStatus) || 'PENDING'
  );
  const [typeFilter, setTypeFilter] = useState<ReportTargetType | 'all'>(
    (searchParams.get('type') as ReportTargetType) || 'all'
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
  const {
    data: response,
    isLoading,
    isFetching,
  } = useReports({
    page,
    limit: itemsPerPage,
    search: debouncedSearchTerm.trim() || undefined,
    status: statusFilter !== 'all' ? statusFilter : undefined,
    targetType: typeFilter !== 'all' ? typeFilter : undefined,
    sortBy: 'createdAt:DESC',
  });

  const reports = response?.data || [];
  const meta = response?.meta;

  const { mutate: processReport, isPending: isProcessing } = useProcessReport();
  const { mutate: deleteReport, isPending: isDeleting } = useDeleteReport();

  const [selectedReportId, setSelectedReportId] = useState<string | null>(null);
  const [isProcessDialogOpen, setIsProcessDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [processStatus, setProcessStatus] = useState<
    'RESOLVED' | 'REJECTED'
  >('RESOLVED');
  const [resolutionAction, setResolutionAction] =
    useState<ReportResolutionActions | ''>('');
  const [adminNotes, setAdminNotes] = useState('');
  const [expandedDescription, setExpandedDescription] = useState(false);

  // Fetch full details of selected report
  const { data: selectedReportData } = useReportById(selectedReportId);
  const selectedReport = selectedReportData || null;

  const refresh = () => {
    queryClient.invalidateQueries({ queryKey: ['adminReports'] });
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

  // Fetch statistics for all statuses
  const { data: pendingResponse } = useReports({
    page: 1,
    limit: 1,
    status: 'PENDING',
    sortBy: 'createdAt:DESC',
  });

  const { data: inProgressResponse } = useReports({
    page: 1,
    limit: 1,
    status: 'IN_PROGRESS',
    sortBy: 'createdAt:DESC',
  });

  const { data: resolvedResponse } = useReports({
    page: 1,
    limit: 1,
    status: 'RESOLVED',
    sortBy: 'createdAt:DESC',
  });

  const { data: rejectedResponse } = useReports({
    page: 1,
    limit: 1,
    status: 'REJECTED',
    sortBy: 'createdAt:DESC',
  });

  // Calculate statistics from API data
  const stats = useMemo(() => {
    const pending = pendingResponse?.meta?.totalItems || 0;
    const inProgress = inProgressResponse?.meta?.totalItems || 0;
    const resolved = resolvedResponse?.meta?.totalItems || 0;
    const rejected = rejectedResponse?.meta?.totalItems || 0;
    const total = pending + inProgress + resolved + rejected;

    return {
      total,
      pending,
      inProgress,
      resolved,
      rejected,
    };
  }, [
    pendingResponse?.meta?.totalItems,
    inProgressResponse?.meta?.totalItems,
    resolvedResponse?.meta?.totalItems,
    rejectedResponse?.meta?.totalItems,
  ]);

  const getAvailableResolutionActions = (
    targetType?: ReportTargetType
  ): ReportResolutionActions[] => {
    if (!targetType) return [];

    switch (targetType) {
      case 'post':
        return [
          PostReportResolutionActions.NO_ACTION_TAKEN,
          PostReportResolutionActions.MALICIOUS_REPORT,
          PostReportResolutionActions.BAN_POST,
        ] as unknown as ReportResolutionActions[];
      case 'location':
        return [
          LocationReportResolutionActions.NO_ACTION_TAKEN,
          LocationReportResolutionActions.MALICIOUS_REPORT,
        ] as unknown as ReportResolutionActions[];
      case 'event':
        return [
          EventReportResolutionActions.CANCEL_EVENT,
          EventReportResolutionActions.NO_ACTION_TAKEN,
          EventReportResolutionActions.MALICIOUS_REPORT,
        ] as unknown as ReportResolutionActions[];
      default:
        return [];
    }
  };

  const getResolutionActionLabel = (action: ReportResolutionActions): string => {
    const actionStr = String(action);
    if (actionStr === 'NO_ACTION_TAKEN') {
      return 'No Action Taken';
    }
    if (actionStr === 'MALICIOUS_REPORT') {
      return 'Malicious Report';
    }
    if (actionStr === 'BAN_POST') {
      return 'Ban Post';
    }
    if (actionStr === 'CANCEL_EVENT') {
      return 'Cancel Event';
    }
    return actionStr;
  };

  const handleProcessReport = () => {
    if (!selectedReport) return;

    if (!resolutionAction) {
      toast.error('Please select a resolution action');
      return;
    }

    processReport(
      {
        reportId: selectedReport.id,
        payload: {
          status: processStatus,
          resolutionAction: resolutionAction as ReportResolutionActions,
          adminNotes: adminNotes.trim() || undefined,
        },
      },
      {
        onSuccess: () => {
          setIsProcessDialogOpen(false);
          setSelectedReportId(null);
          setResolutionAction('');
          setAdminNotes('');
          queryClient.invalidateQueries({ queryKey: ['adminReports'] });
          queryClient.invalidateQueries({ queryKey: ['adminReport'] });
        },
      }
    );
  };

  const handleDeleteReport = () => {
    if (!selectedReport) return;

    deleteReport(selectedReport.id, {
      onSuccess: () => {
        setIsDeleteDialogOpen(false);
        setSelectedReportId(null);
        queryClient.invalidateQueries({ queryKey: ['adminReports'] });
        queryClient.invalidateQueries({ queryKey: ['adminReport'] });
      },
    });
  };

  const getInitials = (firstName: string, lastName: string) => {
    return `${firstName?.[0] || ''}${lastName?.[0] || ''}`.toUpperCase();
  };

  return (
    <div className='space-y-6'>
      {/* Statistics Cards */}
      <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4'>
        <Card
          className='hover:shadow-md transition-shadow border-l-4 border-l-blue-500 cursor-pointer'
          onClick={() => {
            setStatusFilter('all');
            setPage(1);
          }}
        >
          <CardHeader className='flex flex-row items-center justify-between space-y-0 pb-2'>
            <CardTitle className='text-sm font-medium'>Total Reports</CardTitle>
            <div className='h-10 w-10 rounded-full bg-blue-100 dark:bg-blue-950 flex items-center justify-center'>
              <IconFlag className='h-5 w-5 text-blue-600 dark:text-blue-400' />
            </div>
          </CardHeader>
          <CardContent>
            <div className='text-3xl font-bold'>{stats.total}</div>
            <p className='text-xs text-muted-foreground mt-1'>All reports</p>
          </CardContent>
        </Card>

        <Card
          className='hover:shadow-md transition-shadow border-l-4 border-l-yellow-500 cursor-pointer'
          onClick={() => {
            setStatusFilter('PENDING');
            setPage(1);
          }}
        >
          <CardHeader className='flex flex-row items-center justify-between space-y-0 pb-2'>
            <CardTitle className='text-sm font-medium'>Pending</CardTitle>
            <div className='h-10 w-10 rounded-full bg-yellow-100 dark:bg-yellow-950 flex items-center justify-center'>
              <IconClock className='h-5 w-5 text-yellow-600 dark:text-yellow-400' />
            </div>
          </CardHeader>
          <CardContent>
            <div className='text-3xl font-bold text-yellow-600 dark:text-yellow-400'>
              {stats.pending}
            </div>
            <p className='text-xs text-muted-foreground mt-1'>
              Awaiting review
            </p>
          </CardContent>
        </Card>

        <Card
          className='hover:shadow-md transition-shadow border-l-4 border-l-blue-500 cursor-pointer'
          onClick={() => {
            setStatusFilter('IN_PROGRESS');
            setPage(1);
          }}
        >
          <CardHeader className='flex flex-row items-center justify-between space-y-0 pb-2'>
            <CardTitle className='text-sm font-medium'>In Progress</CardTitle>
            <div className='h-10 w-10 rounded-full bg-blue-100 dark:bg-blue-950 flex items-center justify-center'>
              <IconAlertTriangle className='h-5 w-5 text-blue-600 dark:text-blue-400' />
            </div>
          </CardHeader>
          <CardContent>
            <div className='text-3xl font-bold text-blue-600 dark:text-blue-400'>
              {stats.inProgress}
            </div>
            <p className='text-xs text-muted-foreground mt-1'>
              Being processed
            </p>
          </CardContent>
        </Card>

        <Card
          className='hover:shadow-md transition-shadow border-l-4 border-l-green-500 cursor-pointer'
          onClick={() => {
            setStatusFilter('RESOLVED');
            setPage(1);
          }}
        >
          <CardHeader className='flex flex-row items-center justify-between space-y-0 pb-2'>
            <CardTitle className='text-sm font-medium'>Resolved</CardTitle>
            <div className='h-10 w-10 rounded-full bg-green-100 dark:bg-green-950 flex items-center justify-center'>
              <IconCheck className='h-5 w-5 text-green-600 dark:text-green-400' />
            </div>
          </CardHeader>
          <CardContent>
            <div className='text-3xl font-bold text-green-600 dark:text-green-400'>
              {stats.resolved}
            </div>
            <p className='text-xs text-muted-foreground mt-1'>
              Successfully resolved
            </p>
          </CardContent>
        </Card>

        <Card
          className='hover:shadow-md transition-shadow border-l-4 border-l-red-500 cursor-pointer'
          onClick={() => {
            setStatusFilter('REJECTED');
            setPage(1);
          }}
        >
          <CardHeader className='flex flex-row items-center justify-between space-y-0 pb-2'>
            <CardTitle className='text-sm font-medium'>Rejected</CardTitle>
            <div className='h-10 w-10 rounded-full bg-red-100 dark:bg-red-950 flex items-center justify-center'>
              <IconX className='h-5 w-5 text-red-600 dark:text-red-400' />
            </div>
          </CardHeader>
          <CardContent>
            <div className='text-3xl font-bold text-red-600 dark:text-red-400'>
              {stats.rejected}
            </div>
            <p className='text-xs text-muted-foreground mt-1'>
              Rejected reports
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Two Column Layout */}
      <div className='grid grid-cols-1 lg:grid-cols-12 gap-6 h-[calc(100vh-280px)]'>
        {/* Left Column - Report List */}
        <div className='lg:col-span-5 xl:col-span-4 flex flex-col border rounded-lg bg-card overflow-hidden'>
          {/* Search and Filters */}
          <div className='p-4 border-b space-y-3'>
            <div className='flex items-center justify-between'>
              <h2 className='text-lg font-semibold'>All Reports</h2>
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
            <div className='relative'>
              <IconSearch className='absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground' />
              <Input
                placeholder='Search reports...'
                className='pl-8'
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
                setStatusFilter(value as ReportStatus | 'all');
                setPage(1);
              }}
            >
              <SelectTrigger>
                <div className='flex items-center gap-2'>
                  <IconFilter className='h-4 w-4' />
                  <SelectValue placeholder='Filter by Status' />
                </div>
              </SelectTrigger>
              <SelectContent>
                <SelectItem value='all'>All Status</SelectItem>
                <SelectItem value='PENDING'>Pending</SelectItem>
                <SelectItem value='IN_PROGRESS'>In Progress</SelectItem>
                <SelectItem value='RESOLVED'>Resolved</SelectItem>
                <SelectItem value='REJECTED'>Rejected</SelectItem>
              </SelectContent>
            </Select>
            <Select
              value={typeFilter}
              onValueChange={(value) => {
                setTypeFilter(value as ReportTargetType | 'all');
                setPage(1);
              }}
            >
              <SelectTrigger>
                <div className='flex items-center gap-2'>
                  <IconFilter className='h-4 w-4' />
                  <SelectValue placeholder='Filter by Type' />
                </div>
              </SelectTrigger>
              <SelectContent>
                <SelectItem value='all'>All Types</SelectItem>
                <SelectItem value='post'>Post</SelectItem>
                <SelectItem value='location'>Location</SelectItem>
                <SelectItem value='event'>Event</SelectItem>
              </SelectContent>
            </Select>
            <div className='text-sm text-muted-foreground'>
              {meta?.totalItems || 0} results
            </div>
          </div>

          {/* Report List */}
          <div className='flex-1 overflow-y-auto'>
            {isLoading ? (
              <div className='flex items-center justify-center h-64'>
                <Loader2 className='h-8 w-8 animate-spin text-muted-foreground' />
              </div>
            ) : reports.length === 0 ? (
              <div className='flex items-center justify-center h-64 text-muted-foreground'>
                <div className='text-center'>
                  <IconFlag className='h-12 w-12 mx-auto mb-2 opacity-50' />
                  <p>No reports found</p>
                </div>
              </div>
            ) : (
              <div className='divide-y'>
                {reports.map((report: Report, index: number) => (
                  <div
                    key={report.id}
                    onClick={() => {
                      setSelectedReportId(report.id);
                      setExpandedDescription(false);
                    }}
                    className={`p-4 cursor-pointer hover:bg-muted/50 transition-colors ${
                      selectedReportId === report.id
                        ? 'bg-muted border-l-4 border-l-primary'
                        : ''
                    }`}
                  >
                    <div className='flex items-start justify-between mb-2'>
                      <h3 className='font-semibold text-base line-clamp-1'>
                        {report.title}
                      </h3>
                      {getStatusBadge(report.status)}
                    </div>
                    <div className='flex items-center gap-2 mb-1'>
                      {getTypeBadge(report.targetType)}
                      {report.createdBy && (
                        <span className='text-xs text-muted-foreground'>
                          by {report.createdBy.firstName}{' '}
                          {report.createdBy.lastName}
                        </span>
                      )}
                    </div>
                    {report.description && (
                      <p className='text-sm text-muted-foreground line-clamp-2 mb-2'>
                        {report.description}
                      </p>
                    )}
                    <div className='flex items-center justify-between mt-2'>
                      <span className='text-xs text-muted-foreground'>
                        {formatDateTime(report.createdAt)}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Pagination */}
          {meta && meta.totalPages > 1 && (
            <div className='p-4 border-t flex items-center justify-between'>
              <Button
                variant='outline'
                size='sm'
                onClick={() => setPage(page - 1)}
                disabled={page <= 1}
              >
                Previous
              </Button>
              <div className='text-sm text-muted-foreground'>
                Page {page} of {meta.totalPages}
              </div>
              <Button
                variant='outline'
                size='sm'
                onClick={() => setPage(page + 1)}
                disabled={page >= meta.totalPages}
              >
                Next
              </Button>
            </div>
          )}
        </div>

        {/* Right Column - Details Panel */}
        <div className='lg:col-span-7 xl:col-span-8 border rounded-lg bg-card overflow-hidden'>
          {selectedReport ? (
            <div className='h-full overflow-y-auto'>
              <div className='p-6'>
                {/* Header with Title and Actions */}
                <div className='flex items-start justify-between mb-4'>
                  <div className='flex-1'>
                    <h1 className='text-2xl font-bold mb-2'>
                      {selectedReport.title}
                    </h1>
                    <div className='flex items-center gap-2 flex-wrap'>
                      {getStatusBadge(selectedReport.status)}
                      {getTypeBadge(selectedReport.targetType)}
                      {selectedReport.reportedReasonEntity && (
                        <Badge variant='secondary'>
                          {selectedReport.reportedReasonEntity.displayName}
                        </Badge>
                      )}
                    </div>

                    {/* Description - Truncated */}
                    {selectedReport.description && (
                      <div className='mt-4'>
                        <p
                          className={`text-sm text-muted-foreground ${
                            !expandedDescription ? 'line-clamp-2' : ''
                          }`}
                        >
                          {selectedReport.description}
                        </p>
                        {selectedReport.description.length > 150 && (
                          <button
                            onClick={() =>
                              setExpandedDescription(!expandedDescription)
                            }
                            className='text-sm text-blue-600 hover:underline mt-1'
                          >
                            {expandedDescription ? 'Show less' : 'Read more'}
                          </button>
                        )}
                      </div>
                    )}
                  </div>
                  {selectedReport.status === 'PENDING' && (
                    <div className='flex gap-2 ml-4'>
                      <Button
                        variant='outline'
                        size='sm'
                        onClick={() => setIsProcessDialogOpen(true)}
                        className='border-green-600 text-green-700 hover:bg-green-50 hover:text-green-800'
                      >
                        <IconCheck className='h-4 w-4 mr-1' />
                        Process
                      </Button>
                    </div>
                  )}
                </div>

                {/* Two Column Grid */}
                <div className='grid grid-cols-1 md:grid-cols-2 gap-4 mt-6'>
                  {/* Reporter Information Card */}
                  <Card>
                    <CardHeader>
                      <CardTitle className='text-base flex items-center gap-2'>
                        <IconUser className='h-4 w-4' />
                        Reporter Information
                      </CardTitle>
                    </CardHeader>
                    <CardContent className='space-y-3'>
                      {selectedReport.createdBy && (
                        <div className='flex items-start gap-2'>
                          <Avatar className='h-10 w-10 border-2 border-background'>
                            {selectedReport.createdBy.avatarUrl && (
                              <AvatarImage
                                src={selectedReport.createdBy.avatarUrl}
                                alt={`${selectedReport.createdBy.firstName} ${selectedReport.createdBy.lastName}`}
                                className='object-cover'
                              />
                            )}
                            <AvatarFallback className='bg-primary/10 text-primary font-semibold text-xs'>
                              {getInitials(
                                selectedReport.createdBy.firstName || '',
                                selectedReport.createdBy.lastName || ''
                              )}
                            </AvatarFallback>
                          </Avatar>
                          <div className='flex-1'>
                            <p className='text-sm font-medium'>
                              {selectedReport.createdBy.firstName}{' '}
                              {selectedReport.createdBy.lastName}
                            </p>
                            {selectedReport.createdBy.email && (
                              <p className='text-xs text-muted-foreground break-all'>
                                {selectedReport.createdBy.email}
                              </p>
                            )}
                          </div>
                        </div>
                      )}
                    </CardContent>
                  </Card>

                  {/* Report Details Card */}
                  <Card>
                    <CardHeader>
                      <CardTitle className='text-base flex items-center gap-2'>
                        <IconFileText className='h-4 w-4' />
                        Report Details
                      </CardTitle>
                    </CardHeader>
                    <CardContent className='space-y-3'>
                      <div>
                        <p className='text-xs font-medium text-muted-foreground mb-1'>
                          Report ID
                        </p>
                        <p className='text-xs font-mono break-all bg-muted px-2 py-1 rounded'>
                          {selectedReport.id}
                        </p>
                      </div>
                      <div>
                        <p className='text-xs font-medium text-muted-foreground mb-1'>
                          Target ID
                        </p>
                        <p className='text-xs font-mono break-all bg-muted px-2 py-1 rounded'>
                          {selectedReport.targetId}
                        </p>
                      </div>
                      <div>
                        <p className='text-xs font-medium text-muted-foreground mb-1'>
                          Created
                        </p>
                        <p className='text-sm'>
                          {formatDateTime(selectedReport.createdAt)}
                        </p>
                      </div>
                      {selectedReport.resolvedAt && (
                        <div>
                          <p className='text-xs font-medium text-muted-foreground mb-1'>
                            Resolved
                          </p>
                          <p className='text-sm'>
                            {formatDateTime(selectedReport.resolvedAt)}
                          </p>
                        </div>
                      )}
                    </CardContent>
                  </Card>

                  {/* Resolution Details Card */}
                  {selectedReport.resolutionAction && (
                    <Card>
                      <CardHeader>
                        <CardTitle className='text-base flex items-center gap-2'>
                          <IconCheck className='h-4 w-4' />
                          Resolution
                        </CardTitle>
                      </CardHeader>
                      <CardContent className='space-y-3'>
                        <div>
                          <p className='text-xs font-medium text-muted-foreground mb-1'>
                            Action
                          </p>
                          <p className='text-sm'>
                            {getResolutionActionLabel(
                              selectedReport.resolutionAction
                            )}
                          </p>
                        </div>
                        {selectedReport.resolvedAt && (
                          <div>
                            <p className='text-xs font-medium text-muted-foreground mb-1'>
                              Resolved At
                            </p>
                            <p className='text-sm'>
                              {formatDateTime(selectedReport.resolvedAt)}
                            </p>
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  )}
                </div>

                {/* Attached Images - Full Width */}
                {selectedReport.attachedImageUrls &&
                  selectedReport.attachedImageUrls.length > 0 && (
                    <Card className='mt-4'>
                      <CardHeader>
                        <CardTitle className='text-base flex items-center gap-2'>
                          <IconFileText className='h-4 w-4' />
                          Attached Images
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className='grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3'>
                          {selectedReport.attachedImageUrls.map(
                            (url: string, index: number) => (
                              <a
                                key={index}
                                href={url}
                                target='_blank'
                                rel='noopener noreferrer'
                                className='group relative aspect-square rounded-lg overflow-hidden border hover:border-primary transition-colors'
                              >
                                <Image
                                  src={url}
                                  alt={`Report image ${index + 1}`}
                                  fill
                                  className='object-cover'
                                  sizes='(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw'
                                />
                                <div className='absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors' />
                              </a>
                            )
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  )}

                {/* Action Link */}
                <div className='mt-6 pt-4 border-t'>
                  <Link
                    href={`/admin/reports/${selectedReport.id}`}
                    className='text-sm text-blue-600 hover:underline inline-flex items-center gap-1'
                  >
                    View full report details
                    <span>→</span>
                  </Link>
                </div>
              </div>
            </div>
          ) : (
            <div className='h-full flex items-center justify-center text-muted-foreground'>
              <div className='text-center'>
                <IconFlag className='h-16 w-16 mx-auto mb-4 opacity-20' />
                <p className='text-lg font-medium'>Select a report</p>
                <p className='text-sm mt-1'>
                  Choose a report from the list to view details
                </p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Process Report Dialog */}
      <Dialog open={isProcessDialogOpen} onOpenChange={setIsProcessDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Process Report</DialogTitle>
            <DialogDescription>
              Update the status of this report and add admin notes if needed.
            </DialogDescription>
          </DialogHeader>
          <div className='space-y-4 py-4'>
            <div className='space-y-2'>
              <Label>Status</Label>
              <Select
                value={processStatus}
                onValueChange={(value) =>
                  setProcessStatus(value as 'RESOLVED' | 'REJECTED')
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value='RESOLVED'>Resolved</SelectItem>
                  <SelectItem value='REJECTED'>Rejected</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className='space-y-2'>
              <Label>
                Resolution Action <span className='text-destructive'>*</span>
              </Label>
              <Select
                value={resolutionAction}
                onValueChange={(value) =>
                  setResolutionAction(value as ReportResolutionActions)
                }
                required
              >
                <SelectTrigger
                  className={!resolutionAction ? 'border-destructive' : ''}
                >
                  <SelectValue placeholder='Select action' />
                </SelectTrigger>
                <SelectContent>
                  {getAvailableResolutionActions(
                    selectedReport?.targetType
                  ).map((action) => (
                    <SelectItem key={action} value={action}>
                      {getResolutionActionLabel(action)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className='space-y-2'>
              <Label>Admin Notes (Optional)</Label>
              <Textarea
                placeholder='Add notes about how this report was processed...'
                value={adminNotes}
                onChange={(e) => setAdminNotes(e.target.value)}
                rows={4}
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant='outline'
              onClick={() => {
                setIsProcessDialogOpen(false);
                setResolutionAction('');
                setAdminNotes('');
              }}
            >
              Cancel
            </Button>
            <Button
              onClick={handleProcessReport}
              disabled={isProcessing || !resolutionAction}
            >
              {isProcessing ? (
                <>
                  <Loader2 className='h-4 w-4 mr-2 animate-spin' />
                  Processing...
                </>
              ) : (
                'Process Report'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Report Dialog */}
      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Report</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this report? This action cannot be
              undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteReport}
              disabled={isDeleting}
              className='bg-destructive text-destructive-foreground hover:bg-destructive/90'
            >
              {isDeleting ? (
                <>
                  <Loader2 className='h-4 w-4 mr-2 animate-spin' />
                  Deleting...
                </>
              ) : (
                'Delete'
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
