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
} from '@tabler/icons-react';
import { Loader2 } from 'lucide-react';
import { Report, ReportStatus, ReportTargetType, ReportResolutionActions, PostReportResolutionActions, LocationReportResolutionActions, EventReportResolutionActions } from '@/types';
import { useReports } from '@/hooks/admin/useReports';
import { useProcessReport, useDeleteReport } from '@/hooks/admin/useProcessReport';
import { useQueryClient } from '@tanstack/react-query';
import { formatShortDate, cn } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { SortableTableHeader, SortDirection } from '@/components/shared/SortableTableHeader';

function getStatusBadge(status: ReportStatus) {
  switch (status) {
    case 'PENDING':
      return (
        <Badge variant="outline" className="bg-yellow-50 text-yellow-700 border-yellow-300 dark:bg-yellow-950 dark:text-yellow-300 dark:border-yellow-700">
          <IconClock className="h-3 w-3 mr-1" />
          Pending
        </Badge>
      );
    case 'IN_PROGRESS':
      return (
        <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-300 dark:bg-blue-950 dark:text-blue-300 dark:border-blue-700">
          <IconAlertTriangle className="h-3 w-3 mr-1" />
          In Progress
        </Badge>
      );
    case 'RESOLVED':
      return (
        <Badge variant="outline" className="bg-green-50 text-green-700 border-green-300 dark:bg-green-950 dark:text-green-300 dark:border-green-700">
          <IconCheck className="h-3 w-3 mr-1" />
          Resolved
        </Badge>
      );
    case 'REJECTED':
      return (
        <Badge variant="outline" className="bg-red-50 text-red-700 border-red-300 dark:bg-red-950 dark:text-red-300 dark:border-red-700">
          <IconX className="h-3 w-3 mr-1" />
          Rejected
        </Badge>
      );
    default:
      return <Badge variant="secondary">{status}</Badge>;
  }
}

function getTypeBadge(type: ReportTargetType) {
  const colors: Record<ReportTargetType, string> = {
    post: 'bg-purple-50 text-purple-700 border-purple-300 dark:bg-purple-950 dark:text-purple-300',
    location: 'bg-blue-50 text-blue-700 border-blue-300 dark:bg-blue-950 dark:text-blue-300',
    event: 'bg-orange-50 text-orange-700 border-orange-300 dark:bg-orange-950 dark:text-orange-300',
  };

  return (
    <Badge variant="outline" className={colors[type]}>
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
  const [searchTerm, setSearchTerm] = useState(searchParams.get('search') || '');
  const [debouncedSearchTerm] = useDebounce(searchTerm, 300);
  const [statusFilter, setStatusFilter] = useState<ReportStatus | 'all'>(
    (searchParams.get('status') as ReportStatus) || 'all'
  );
  const [typeFilter, setTypeFilter] = useState<ReportTargetType | 'all'>(
    (searchParams.get('type') as ReportTargetType) || 'all'
  );
  const [page, setPage] = useState(Number(searchParams.get('page')) || 1);
  const [sort, setSort] = useState<{ column: string; direction: SortDirection }>(() => {
    const sortParam = searchParams.get('sort');
    if (sortParam) {
      const [column, direction] = sortParam.split(':');
      if (column && (direction === 'ASC' || direction === 'DESC')) {
        return { column, direction: direction as SortDirection };
      }
    }
    return {
      column: 'createdAt',
      direction: 'DESC',
    };
  });
  const [selectedReport, setSelectedReport] = useState<Report | null>(null);
  const [isProcessDialogOpen, setIsProcessDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [processStatus, setProcessStatus] = useState<'RESOLVED' | 'REJECTED'>('RESOLVED');
  const [resolutionAction, setResolutionAction] = useState<ReportResolutionActions | ''>('');
  const [adminNotes, setAdminNotes] = useState('');
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

    // Sync sort to URL
    if (sort.column !== 'createdAt' || sort.direction !== 'DESC') {
      params.set('sort', `${sort.column}:${sort.direction}`);
    } else {
      params.delete('sort');
    }

    router.replace(`${pathname}?${params.toString()}`);
  }, [debouncedSearchTerm, statusFilter, typeFilter, page, sort, pathname, router, searchParams]);

  // Build sortBy string
  const sortBy = sort.direction ? `${sort.column}:${sort.direction}` : 'createdAt:DESC';

  // Data fetching
  const { data, isLoading, error } = useReports({
    page,
    limit: itemsPerPage,
    search: debouncedSearchTerm.trim() || undefined,
    status: statusFilter !== 'all' ? statusFilter : undefined,
    targetType: typeFilter !== 'all' ? typeFilter : undefined,
    sortBy,
  });

  const { mutate: processReport, isPending: isProcessing } = useProcessReport();
  const { mutate: deleteReport, isPending: isDeleting } = useDeleteReport();

  const reports = data?.data || [];
  const meta = data?.meta;

  const refresh = () => {
    queryClient.invalidateQueries({ queryKey: ['adminReports'] });
  };

  const handleSort = (column: string, direction: SortDirection) => {
    setSort({ column, direction });
    setPage(1);
  };

  // Calculate statistics from actual reports data
  const stats = useMemo(() => {
    const allReports = reports;
    return {
      total: meta?.totalItems || 0,
      pending: allReports.filter((r) => r.status === 'PENDING').length,
      inProgress: allReports.filter((r) => r.status === 'IN_PROGRESS').length,
      resolved: allReports.filter((r) => r.status === 'RESOLVED').length,
      rejected: allReports.filter((r) => r.status === 'REJECTED').length,
    };
  }, [reports, meta]);

  const getAvailableResolutionActions = (targetType?: ReportTargetType): ReportResolutionActions[] => {
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
                setSelectedReport(null);
                setResolutionAction('');
                setAdminNotes('');
              },
      }
    );
  };

  const handleDeleteReport = () => {
    if (!selectedReport) return;
    
    deleteReport(selectedReport.id, {
      onSuccess: () => {
        setIsDeleteDialogOpen(false);
        setSelectedReport(null);
      },
    });
  };

  if (error) {
    return (
      <div className="space-y-6">
        <Card>
          <CardContent className="pt-6">
            <p className="text-red-600">Error loading reports. Please try again.</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Reports</h1>
          <p className="text-muted-foreground mt-2">
            Manage and process user reports
          </p>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={refresh}
          disabled={isLoading}
        >
          <IconRefresh className={cn("h-4 w-4 mr-2", isLoading && "animate-spin")} />
          Refresh
        </Button>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
        <Card className="border-l-4 border-l-blue-500">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Reports</CardTitle>
            <div className="h-8 w-8 rounded-full bg-blue-100 dark:bg-blue-950 flex items-center justify-center">
              <IconFlag className="h-4 w-4 text-blue-600 dark:text-blue-400" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{stats.total}</div>
            <p className="text-xs text-muted-foreground mt-1">
              All reports
            </p>
          </CardContent>
        </Card>
        <Card className="border-l-4 border-l-yellow-500 hover:shadow-md transition-shadow cursor-pointer" onClick={() => { setStatusFilter('PENDING'); setPage(1); }}>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending</CardTitle>
            <div className="h-8 w-8 rounded-full bg-yellow-100 dark:bg-yellow-950 flex items-center justify-center">
              <IconClock className="h-4 w-4 text-yellow-600 dark:text-yellow-400" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-yellow-600 dark:text-yellow-400">{stats.pending}</div>
            <p className="text-xs text-muted-foreground mt-1">
              Awaiting review
            </p>
          </CardContent>
        </Card>
        <Card className="border-l-4 border-l-blue-500 hover:shadow-md transition-shadow cursor-pointer" onClick={() => { setStatusFilter('IN_PROGRESS'); setPage(1); }}>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">In Progress</CardTitle>
            <div className="h-8 w-8 rounded-full bg-blue-100 dark:bg-blue-950 flex items-center justify-center">
              <IconAlertTriangle className="h-4 w-4 text-blue-600 dark:text-blue-400" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-blue-600 dark:text-blue-400">{stats.inProgress}</div>
            <p className="text-xs text-muted-foreground mt-1">
              Being processed
            </p>
          </CardContent>
        </Card>
        <Card className="border-l-4 border-l-green-500 hover:shadow-md transition-shadow cursor-pointer" onClick={() => { setStatusFilter('RESOLVED'); setPage(1); }}>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Resolved</CardTitle>
            <div className="h-8 w-8 rounded-full bg-green-100 dark:bg-green-950 flex items-center justify-center">
              <IconCheck className="h-4 w-4 text-green-600 dark:text-green-400" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-green-600 dark:text-green-400">{stats.resolved}</div>
            <p className="text-xs text-muted-foreground mt-1">
              Successfully resolved
            </p>
          </CardContent>
        </Card>
        <Card className="border-l-4 border-l-red-500 hover:shadow-md transition-shadow cursor-pointer" onClick={() => { setStatusFilter('REJECTED'); setPage(1); }}>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Rejected</CardTitle>
            <div className="h-8 w-8 rounded-full bg-red-100 dark:bg-red-950 flex items-center justify-center">
              <IconX className="h-4 w-4 text-red-600 dark:text-red-400" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-red-600 dark:text-red-400">{stats.rejected}</div>
            <p className="text-xs text-muted-foreground mt-1">
              Rejected reports
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <IconFilter className="h-5 w-5" />
                Filters
              </CardTitle>
              <CardDescription className="mt-1">Filter reports by status, type, or search</CardDescription>
            </div>
            {(statusFilter !== 'all' || typeFilter !== 'all' || searchTerm) && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  setStatusFilter('all');
                  setTypeFilter('all');
                  setSearchTerm('');
                  setPage(1);
                }}
              >
                Clear filters
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1 relative">
              <IconSearch className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground z-10" />
              <Input
                placeholder="Search by title, description, or reporter..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-9"
              />
            </div>
            <Select
              value={statusFilter}
              onValueChange={(value) => {
                setStatusFilter(value as ReportStatus | 'all');
                setPage(1);
              }}
            >
              <SelectTrigger className="w-full sm:w-[180px]">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="PENDING">Pending</SelectItem>
                <SelectItem value="IN_PROGRESS">In Progress</SelectItem>
                <SelectItem value="RESOLVED">Resolved</SelectItem>
                <SelectItem value="REJECTED">Rejected</SelectItem>
              </SelectContent>
            </Select>
            <Select
              value={typeFilter}
              onValueChange={(value) => {
                setTypeFilter(value as ReportTargetType | 'all');
                setPage(1);
              }}
            >
              <SelectTrigger className="w-full sm:w-[180px]">
                <SelectValue placeholder="Type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Types</SelectItem>
                <SelectItem value="post">Post</SelectItem>
                <SelectItem value="location">Location</SelectItem>
                <SelectItem value="event">Event</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Reports Table */}
      <Card>
        <CardHeader>
          <CardTitle>Reports</CardTitle>
          <CardDescription>
            {meta?.totalItems || 0} total reports
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : reports.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <IconFlag className="h-12 w-12 text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold mb-2">No reports found</h3>
              <p className="text-sm text-muted-foreground">
                {searchTerm || statusFilter !== 'all' || typeFilter !== 'all'
                  ? 'Try adjusting your filters'
                  : 'No reports have been submitted yet'}
              </p>
            </div>
          ) : (
            <>
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-12">#</TableHead>
                      <SortableTableHeader
                        column="createdBy.firstName"
                        currentSort={sort}
                        onSort={handleSort}
                      >
                        Reporter
                      </SortableTableHeader>
                      <SortableTableHeader
                        column="targetType"
                        currentSort={sort}
                        onSort={handleSort}
                      >
                        Type
                      </SortableTableHeader>
                      <SortableTableHeader
                        column="title"
                        currentSort={sort}
                        onSort={handleSort}
                      >
                        Reason
                      </SortableTableHeader>
                      <SortableTableHeader
                        column="status"
                        currentSort={sort}
                        onSort={handleSort}
                      >
                        Status
                      </SortableTableHeader>
                      <SortableTableHeader
                        column="createdAt"
                        currentSort={sort}
                        onSort={handleSort}
                      >
                        Created
                      </SortableTableHeader>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {reports.map((report, index) => {
                      const orderNumber = (page - 1) * itemsPerPage + index + 1;
                      return (
                      <TableRow 
                        key={report.id}
                        className="hover:bg-muted/50 transition-colors cursor-pointer"
                        onClick={() => router.push(`/admin/reports/${report.id}`)}
                      >
                        <TableCell className="text-muted-foreground font-medium">
                          {orderNumber}
                        </TableCell>
                        <TableCell>
                          {report.createdBy ? (
                            <div>
                              <p className="text-sm font-medium">
                                {report.createdBy.firstName} {report.createdBy.lastName}
                              </p>
                              <p className="text-xs text-muted-foreground truncate max-w-[150px]">
                                {report.createdBy.email}
                              </p>
                            </div>
                          ) : (
                            <span className="text-sm text-muted-foreground">Unknown</span>
                          )}
                        </TableCell>
                        <TableCell>{getTypeBadge(report.targetType)}</TableCell>
                        <TableCell>
                          <div className="max-w-[250px]">
                            <p className="font-medium text-sm truncate">{report.title}</p>
                            <p className="text-xs text-muted-foreground line-clamp-2 mt-0.5">
                              {report.description}
                            </p>
                            {report.reportedReasonEntity && (
                              <div className="mt-1.5">
                                <Badge variant="secondary" className="text-xs">
                                  {report.reportedReasonEntity.displayName}
                                </Badge>
                              </div>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>{getStatusBadge(report.status)}</TableCell>
                        <TableCell className="text-sm text-muted-foreground">
                          <div className="flex flex-col">
                            <span>{formatShortDate(report.createdAt)}</span>
                            {report.resolvedAt && (
                              <span className="text-xs text-muted-foreground/70 mt-0.5">
                                Resolved: {formatShortDate(report.resolvedAt)}
                              </span>
                            )}
                          </div>
                        </TableCell>
                      </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </div>

              {/* Pagination */}
              {meta && meta.totalPages > 1 && (
                <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mt-6 pt-4 border-t">
                  <p className="text-sm text-muted-foreground">
                    Showing <span className="font-medium text-foreground">{(meta.currentPage - 1) * itemsPerPage + 1}</span> to{' '}
                    <span className="font-medium text-foreground">
                      {Math.min(meta.currentPage * itemsPerPage, meta.totalItems)}
                    </span>{' '}
                    of <span className="font-medium text-foreground">{meta.totalItems}</span> reports
                  </p>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setPage((p) => Math.max(1, p - 1))}
                      disabled={page === 1 || isLoading}
                    >
                      Previous
                    </Button>
                    <div className="flex items-center gap-1">
                      {Array.from({ length: Math.min(5, meta.totalPages) }, (_, i) => {
                        let pageNum;
                        if (meta.totalPages <= 5) {
                          pageNum = i + 1;
                        } else if (meta.currentPage <= 3) {
                          pageNum = i + 1;
                        } else if (meta.currentPage >= meta.totalPages - 2) {
                          pageNum = meta.totalPages - 4 + i;
                        } else {
                          pageNum = meta.currentPage - 2 + i;
                        }
                        return (
                          <Button
                            key={pageNum}
                            variant={pageNum === meta.currentPage ? 'default' : 'outline'}
                            size="sm"
                            className="w-8 h-8 p-0"
                            onClick={() => setPage(pageNum)}
                            disabled={isLoading}
                          >
                            {pageNum}
                          </Button>
                        );
                      })}
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setPage((p) => Math.min(meta.totalPages, p + 1))}
                      disabled={page === meta.totalPages || isLoading}
                    >
                      Next
                    </Button>
                  </div>
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>

      {/* Process Report Dialog */}
      <Dialog open={isProcessDialogOpen} onOpenChange={setIsProcessDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Process Report</DialogTitle>
            <DialogDescription>
              Update the status of this report and add admin notes if needed.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Status</Label>
              <Select
                value={processStatus}
                onValueChange={(value) => setProcessStatus(value as 'RESOLVED' | 'REJECTED')}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="RESOLVED">Resolved</SelectItem>
                  <SelectItem value="REJECTED">Rejected</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Resolution Action <span className="text-destructive">*</span></Label>
              <Select
                value={resolutionAction}
                onValueChange={(value) => setResolutionAction(value as ReportResolutionActions)}
                required
              >
                <SelectTrigger className={!resolutionAction ? "border-destructive" : ""}>
                  <SelectValue placeholder="Select action" />
                </SelectTrigger>
                <SelectContent>
                  {getAvailableResolutionActions(selectedReport?.targetType).map((action) => (
                    <SelectItem key={action} value={action}>
                      {getResolutionActionLabel(action)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Admin Notes (Optional)</Label>
              <Textarea
                placeholder="Add notes about how this report was processed..."
                value={adminNotes}
                onChange={(e) => setAdminNotes(e.target.value)}
                rows={4}
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setIsProcessDialogOpen(false);
                setSelectedReport(null);
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
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
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
              Are you sure you want to delete this report? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteReport}
              disabled={isDeleting}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {isDeleting ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
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

