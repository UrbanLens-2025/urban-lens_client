'use client';

import { use } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  IconFlag,
  IconClock,
  IconCheck,
  IconX,
  IconArrowLeft,
  IconUser,
  IconCalendar,
  IconFileText,
  IconAlertTriangle,
} from '@tabler/icons-react';
import { useReportById } from '@/hooks/admin/useReportById';
import { useProcessReport } from '@/hooks/admin/useProcessReport';
import { format } from 'date-fns';
import { Loader2 } from 'lucide-react';
import { ReportTargetType } from '@/types';
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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useState } from 'react';
import { toast } from 'sonner';

function getStatusBadge(status: string) {
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

export default function ReportDetailPage({
  params,
}: {
  params: Promise<{ reportId: string }>;
}) {
  const { reportId } = use(params);
  const router = useRouter();
  const { data: report, isLoading, error } = useReportById(reportId);
  const { mutate: processReport, isPending: isProcessing } = useProcessReport();
  const [isProcessDialogOpen, setIsProcessDialogOpen] = useState(false);
  const [processStatus, setProcessStatus] = useState<'RESOLVED' | 'REJECTED'>('RESOLVED');
  const [resolutionAction, setResolutionAction] = useState<'DELETE' | 'HIDE' | 'WARN' | 'NO_ACTION' | ''>('');
  const [adminNotes, setAdminNotes] = useState('');

  const handleProcessReport = () => {
    if (!report) return;
    
    processReport(
      {
        reportId: report.id,
        payload: {
          status: processStatus,
          resolutionAction: resolutionAction || undefined,
          adminNotes: adminNotes.trim() || undefined,
        },
      },
      {
        onSuccess: () => {
          setIsProcessDialogOpen(false);
          setAdminNotes('');
          toast.success('Report processed successfully');
        },
      }
    );
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (error || !report) {
    return (
      <div className="space-y-6">
        <Card>
          <CardContent className="pt-6">
            <p className="text-red-600">Error loading report. Please try again.</p>
            <Button variant="outline" className="mt-4" onClick={() => router.back()}>
              Go Back
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => router.back()}
          >
            <IconArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Report Details</h1>
            <p className="text-muted-foreground mt-2">
              Report ID: <span className="font-mono text-sm">{report.id}</span>
            </p>
          </div>
        </div>
        {(report.status === 'PENDING' || report.status === 'IN_PROGRESS') && (
          <Button
            onClick={() => {
              setProcessStatus('RESOLVED');
              setResolutionAction('');
              setAdminNotes('');
              setIsProcessDialogOpen(true);
            }}
          >
            <IconCheck className="h-4 w-4 mr-2" />
            Process Report
          </Button>
        )}
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Report Information */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2">
                  <IconFlag className="h-5 w-5" />
                  Report Information
                </CardTitle>
                {getStatusBadge(report.status)}
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-xs text-muted-foreground">Target Type</Label>
                  <div className="mt-1">{getTypeBadge(report.targetType)}</div>
                </div>
                <div>
                  <Label className="text-xs text-muted-foreground">Target ID</Label>
                  <p className="mt-1 font-mono text-sm">{report.targetId}</p>
                </div>
                <div>
                  <Label className="text-xs text-muted-foreground">Report Reason</Label>
                  <p className="mt-1 text-sm font-medium">
                    {report.reportedReasonEntity?.displayName || report.reportedReasonKey}
                  </p>
                </div>
                <div>
                  <Label className="text-xs text-muted-foreground">Created At</Label>
                  <p className="mt-1 text-sm">
                    {format(new Date(report.createdAt), 'MMM dd, yyyy HH:mm')}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Reason & Description */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <IconFileText className="h-5 w-5" />
                Reason & Description
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label className="text-xs text-muted-foreground">Title</Label>
                <p className="mt-1 text-sm font-medium">{report.title}</p>
              </div>
              <div>
                <Label className="text-xs text-muted-foreground">Description</Label>
                <p className="mt-1 text-sm whitespace-pre-wrap">{report.description}</p>
              </div>
              {report.reportedReasonEntity && (
                <div>
                  <Label className="text-xs text-muted-foreground">Report Reason</Label>
                  <p className="mt-1 text-sm font-medium">{report.reportedReasonEntity.displayName}</p>
                  <p className="mt-1 text-xs text-muted-foreground">{report.reportedReasonEntity.description}</p>
                </div>
              )}
              {report.attachedImageUrls && report.attachedImageUrls.length > 0 && (
                <div>
                  <Label className="text-xs text-muted-foreground">Attached Images</Label>
                  <div className="mt-2 grid grid-cols-2 gap-2">
                    {report.attachedImageUrls.map((url, index) => (
                      <img
                        key={index}
                        src={url}
                        alt={`Attachment ${index + 1}`}
                        className="rounded-lg border object-cover h-32 w-full"
                      />
                    ))}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Referenced Target */}
          {report.referencedTargetPost && (
            <Card>
              <CardHeader>
                <CardTitle>Reported Post</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div>
                  <Label className="text-xs text-muted-foreground">Content</Label>
                  <p className="mt-1 text-sm">{report.referencedTargetPost.content}</p>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Label className="text-xs text-muted-foreground">Type</Label>
                    <p className="mt-1 text-sm">{report.referencedTargetPost.type}</p>
                  </div>
                  <div>
                    <Label className="text-xs text-muted-foreground">Visibility</Label>
                    <p className="mt-1 text-sm">{report.referencedTargetPost.visibility}</p>
                  </div>
                </div>
                {report.referencedTargetPost.imageUrls && report.referencedTargetPost.imageUrls.length > 0 && (
                  <div>
                    <Label className="text-xs text-muted-foreground">Post Images</Label>
                    <div className="mt-2 grid grid-cols-2 gap-2">
                      {report.referencedTargetPost.imageUrls.map((url, index) => (
                        <img
                          key={index}
                          src={url}
                          alt={`Post image ${index + 1}`}
                          className="rounded-lg border object-cover h-32 w-full"
                        />
                      ))}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          )}
          {report.referencedTargetEvent && (
            <Card>
              <CardHeader>
                <CardTitle>Reported Event</CardTitle>
              </CardHeader>
              <CardContent>
                <div>
                  <Label className="text-xs text-muted-foreground">Title</Label>
                  <p className="mt-1 text-sm font-medium">{report.referencedTargetEvent.title}</p>
                </div>
              </CardContent>
            </Card>
          )}
          {report.referencedTargetLocation && (
            <Card>
              <CardHeader>
                <CardTitle>Reported Location</CardTitle>
              </CardHeader>
              <CardContent>
                <div>
                  <Label className="text-xs text-muted-foreground">Name</Label>
                  <p className="mt-1 text-sm font-medium">{report.referencedTargetLocation.name}</p>
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Reporter Information */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <IconUser className="h-5 w-5" />
                Reporter
              </CardTitle>
            </CardHeader>
            <CardContent>
              {report.createdBy ? (
                <div className="space-y-3">
                  <div>
                    <Label className="text-xs text-muted-foreground">Name</Label>
                    <p className="mt-1 text-sm font-medium">
                      {report.createdBy.firstName} {report.createdBy.lastName}
                    </p>
                  </div>
                  <div>
                    <Label className="text-xs text-muted-foreground">Email</Label>
                    <p className="mt-1 text-sm">{report.createdBy.email}</p>
                  </div>
                  <div>
                    <Label className="text-xs text-muted-foreground">Role</Label>
                    <p className="mt-1 text-sm">{report.createdBy.role}</p>
                  </div>
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">Reporter information not available</p>
              )}
            </CardContent>
          </Card>

          {/* Timeline */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <IconCalendar className="h-5 w-5" />
                Timeline
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div>
                <Label className="text-xs text-muted-foreground">Created</Label>
                <p className="mt-1 text-sm">
                  {format(new Date(report.createdAt), 'MMM dd, yyyy HH:mm')}
                </p>
              </div>
              {report.updatedAt && (
                <div>
                  <Label className="text-xs text-muted-foreground">Last Updated</Label>
                  <p className="mt-1 text-sm">
                    {format(new Date(report.updatedAt), 'MMM dd, yyyy HH:mm')}
                  </p>
                </div>
              )}
              {report.resolvedAt && (
                <div>
                  <Label className="text-xs text-muted-foreground">Resolved</Label>
                  <p className="mt-1 text-sm">
                    {format(new Date(report.resolvedAt), 'MMM dd, yyyy HH:mm')}
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
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
              <Label>Resolution Action (Optional)</Label>
              <Select
                value={resolutionAction}
                onValueChange={(value) => setResolutionAction(value as typeof resolutionAction)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select action" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="NO_ACTION">No Action</SelectItem>
                  <SelectItem value="DELETE">Delete</SelectItem>
                  <SelectItem value="HIDE">Hide</SelectItem>
                  <SelectItem value="WARN">Warn</SelectItem>
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
                setResolutionAction('');
                setAdminNotes('');
              }}
            >
              Cancel
            </Button>
            <Button
              onClick={handleProcessReport}
              disabled={isProcessing}
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
    </div>
  );
}


