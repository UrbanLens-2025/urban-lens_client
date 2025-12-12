'use client';

import { use } from 'react';
import { useRouter } from 'next/navigation';
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
  Flag,
  Clock,
  CheckCircle2,
  XCircle,
  ArrowLeft,
  User,
  Calendar,
  FileText,
  AlertCircle,
  ImageIcon,
  Copy,
  Star,
  Globe,
  Lock,
  Users,
  Mail,
  MapPin,
  Loader2,
} from 'lucide-react';
import { useReportById } from '@/hooks/admin/useReportById';
import { useProcessReport } from '@/hooks/admin/useProcessReport';
import { useRelatedReports } from '@/hooks/admin/useRelatedReports';
import { format } from 'date-fns';
import { ReportTargetType, ScheduledJobStatus, ReportResolutionActions, PostReportResolutionActions, LocationReportResolutionActions, EventReportResolutionActions } from '@/types';
import { cn, formatShortDate } from '@/lib/utils';
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
import { Separator } from '@/components/ui/separator';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { PageContainer } from '@/components/shared/PageContainer';
import { PageHeader } from '@/components/shared/PageHeader';
import { ImageViewer } from '@/components/shared/ImageViewer';
import type React from 'react';

function InfoRow({
  label,
  value,
  icon: Icon,
}: {
  label: string;
  value: React.ReactNode;
  icon?: React.ComponentType<{ className?: string }>;
}) {
  if (!value) return null;
  return (
    <div className='flex gap-3 py-2'>
      {Icon && (
        <Icon className='h-5 w-5 text-muted-foreground flex-shrink-0 mt-0.5' />
      )}
      <div className='flex-1 min-w-0'>
        <p className='text-sm font-semibold text-muted-foreground mb-1'>{label}</p>
        <div className='text-base text-foreground break-words'>{value}</div>
      </div>
    </div>
  );
}

function getStatusBadge(status: string) {
  switch (status) {
    case 'PENDING':
      return (
        <Badge variant="outline" className="bg-yellow-50 text-yellow-700 border-yellow-300 dark:bg-yellow-950 dark:text-yellow-300 dark:border-yellow-700">
          <Clock className="h-3 w-3 mr-1" />
          Pending
        </Badge>
      );
    case 'IN_PROGRESS':
      return (
        <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-300 dark:bg-blue-950 dark:text-blue-300 dark:border-blue-700">
          <AlertCircle className="h-3 w-3 mr-1" />
          In Progress
        </Badge>
      );
    case 'RESOLVED':
      return (
        <Badge variant="outline" className="bg-green-50 text-green-700 border-green-300 dark:bg-green-950 dark:text-green-300 dark:border-green-700">
          <CheckCircle2 className="h-3 w-3 mr-1" />
          Resolved
        </Badge>
      );
    case 'REJECTED':
      return (
        <Badge variant="outline" className="bg-red-50 text-red-700 border-red-300 dark:bg-red-950 dark:text-red-300 dark:border-red-700">
          <XCircle className="h-3 w-3 mr-1" />
          Rejected
        </Badge>
      );
    default:
      return <Badge variant="secondary">{status}</Badge>;
  }
}

function getScheduledJobStatusBadge(status: ScheduledJobStatus | null | undefined) {
  if (!status) return null;
  
  switch (status) {
    case ScheduledJobStatus.PENDING:
      return (
        <Badge variant="outline" className="bg-yellow-50 text-yellow-700 border-yellow-300 dark:bg-yellow-950 dark:text-yellow-300 dark:border-yellow-700">
          <Clock className="h-3 w-3 mr-1" />
          Job Pending
        </Badge>
      );
    case ScheduledJobStatus.PROCESSING:
      return (
        <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-300 dark:bg-blue-950 dark:text-blue-300 dark:border-blue-700">
          <Loader2 className="h-3 w-3 mr-1 animate-spin" />
          Processing
        </Badge>
      );
    case ScheduledJobStatus.COMPLETED:
      return (
        <Badge variant="outline" className="bg-green-50 text-green-700 border-green-300 dark:bg-green-950 dark:text-green-300 dark:border-green-700">
          <CheckCircle2 className="h-3 w-3 mr-1" />
          Job Completed
        </Badge>
      );
    case ScheduledJobStatus.FAILED:
      return (
        <Badge variant="outline" className="bg-red-50 text-red-700 border-red-300 dark:bg-red-950 dark:text-red-300 dark:border-red-700">
          <XCircle className="h-3 w-3 mr-1" />
          Job Failed
        </Badge>
      );
    default:
      return null;
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

const getResolutionActionLabel = (action: string | null): string => {
  if (!action) return '';
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
  return actionStr.replace(/_/g, ' ');
};

const getResolutionActionColor = (action: string | null): string => {
  if (!action) return '';
  const actionStr = String(action);
  if (actionStr === 'NO_ACTION_TAKEN') {
    return 'bg-gray-50 text-gray-700 border-gray-300 dark:bg-gray-950 dark:text-gray-300';
  }
  if (actionStr === 'MALICIOUS_REPORT') {
    return 'bg-red-50 text-red-700 border-red-300 dark:bg-red-950 dark:text-red-300';
  }
  if (actionStr === 'BAN_POST') {
    return 'bg-purple-50 text-purple-700 border-purple-300 dark:bg-purple-950 dark:text-purple-300';
  }
  if (actionStr === 'CANCEL_EVENT') {
    return 'bg-orange-50 text-orange-700 border-orange-300 dark:bg-orange-950 dark:text-orange-300';
  }
  return '';
};

export default function ReportDetailPage({
  params,
}: {
  params: Promise<{ reportId: string }>;
}) {
  const { reportId } = use(params);
  const router = useRouter();
  const { data: report, isLoading, error } = useReportById(reportId);
  const { mutate: processReport, isPending: isProcessing } = useProcessReport();
  const { data: relatedReportsData, isLoading: isLoadingRelated } = useRelatedReports(
    report?.targetId,
    report?.targetType,
    reportId
  );
  const [isProcessDialogOpen, setIsProcessDialogOpen] = useState(false);
  const [processStatus, setProcessStatus] = useState<'RESOLVED' | 'REJECTED'>('RESOLVED');
  const [resolutionAction, setResolutionAction] = useState<ReportResolutionActions | ''>('');
  const [adminNotes, setAdminNotes] = useState('');
  const [isImageViewerOpen, setIsImageViewerOpen] = useState(false);
  const [currentImageSrc, setCurrentImageSrc] = useState('');
  const [currentImageAlt, setCurrentImageAlt] = useState('');
  const [copiedId, setCopiedId] = useState(false);

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(true);
    toast.success('Copied to clipboard');
    setTimeout(() => setCopiedId(false), 2000);
  };

  const getResolutionActionBadge = (action: string | null) => {
    if (!action) return null;
    return (
      <Badge variant="outline" className={getResolutionActionColor(action)}>
        {getResolutionActionLabel(action)}
      </Badge>
    );
  };

  const getAvailableResolutionActions = (): ReportResolutionActions[] => {
    if (!report) return [];
    
    switch (report.targetType) {
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

  const handleProcessReport = () => {
    if (!report) return;
    
    if (!resolutionAction) {
      toast.error('Please select a resolution action');
      return;
    }
    
    processReport(
      {
        reportId: report.id,
        payload: {
          status: processStatus,
          resolutionAction: resolutionAction as ReportResolutionActions,
          adminNotes: adminNotes.trim() || undefined,
        },
      },
      {
        onSuccess: () => {
          setIsProcessDialogOpen(false);
          setAdminNotes('');
          setResolutionAction('');
          toast.success('Report processed successfully');
          router.push('/admin/reports');
        },
      }
    );
  };

  const handleImageClick = (src: string, alt: string) => {
    setCurrentImageSrc(src);
    setCurrentImageAlt(alt);
    setIsImageViewerOpen(true);
  };

  if (isLoading) {
    return (
      <PageContainer>
        <div className="flex h-[60vh] items-center justify-center">
          <div className="flex flex-col items-center gap-4">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
            <p className="text-sm text-muted-foreground">Loading report details...</p>
          </div>
        </div>
      </PageContainer>
    );
  }

  if (error || !report) {
    return (
      <PageContainer>
        <Card className="border-destructive">
          <CardContent className="pt-6">
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <AlertCircle className="h-12 w-12 text-destructive mb-4" />
              <h2 className="text-xl font-semibold mb-2">Error Loading Report</h2>
              <p className="text-muted-foreground mb-4">
                Unable to load report details. Please try again.
              </p>
              <Button variant="outline" onClick={() => router.back()}>
                <ArrowLeft className="h-4 w-4 mr-2" />
                Go Back
              </Button>
            </div>
          </CardContent>
        </Card>
      </PageContainer>
    );
  }

  const isPending = report.status === 'PENDING' || report.status === 'IN_PROGRESS';

  // Action buttons for header
  const headerActions = (
    <div className="flex items-center gap-2">
      <Button variant="outline" size="icon" onClick={() => router.back()}>
        <ArrowLeft className="h-4 w-4" />
      </Button>
      {isPending && (
        <Button
          onClick={() => {
            setProcessStatus('RESOLVED');
            setResolutionAction('');
            setAdminNotes('');
            setIsProcessDialogOpen(true);
          }}
        >
          <CheckCircle2 className="h-4 w-4 mr-2" />
          Process Report
        </Button>
      )}
    </div>
  );

  return (
    <PageContainer maxWidth="xl">
      {/* Page Header */}
      <PageHeader
        title={`Report #${report.id.slice(0, 8)}`}
        description={`Created ${formatShortDate(report.createdAt)}`}
        icon={Flag}
        actions={headerActions}
      />
      <div className="flex flex-wrap items-center gap-3 mb-6">
        {getStatusBadge(report.status)}
        {getScheduledJobStatusBadge(report.scheduledJobStatus)}
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Report Information */}
          <Card className="border-2 shadow-sm hover:shadow-md transition-shadow">
            <CardHeader className="bg-gradient-to-r from-primary/5 to-transparent border-b">
              <CardTitle className="flex items-center gap-2">
                <div className="p-2 rounded-lg bg-primary/10">
                  <Flag className="h-5 w-5 text-primary" />
                </div>
                Report Information
              </CardTitle>
              <CardDescription>
                Basic details about this report
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <InfoRow
                  label="Target Type"
                  value={getTypeBadge(report.targetType)}
                />
                <InfoRow
                  label="Target ID"
                  value={
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-sm">{report.targetId}</span>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-6 w-6"
                        onClick={() => copyToClipboard(report.targetId)}
                        title="Copy Target ID"
                      >
                        <Copy className="h-3 w-3" />
                      </Button>
                    </div>
                  }
                />
                <InfoRow
                  label="Report Reason"
                  value={
                    <div>
                      <p className="font-medium">
                        {report.reportedReasonEntity?.displayName || report.reportedReasonKey}
                      </p>
                      {report.reportedReasonEntity?.description && (
                        <p className="text-sm text-muted-foreground mt-1">
                          {report.reportedReasonEntity.description}
                        </p>
                      )}
                    </div>
                  }
                />
                <InfoRow
                  label="Created At"
                  value={format(new Date(report.createdAt), 'MMM dd, yyyy HH:mm')}
                  icon={Calendar}
                />
              </div>
              {report.resolutionAction && (
                <>
                  <Separator />
                  <InfoRow
                    label="Resolution Action"
                    value={getResolutionActionBadge(report.resolutionAction)}
                  />
                </>
              )}
            </CardContent>
          </Card>

          {/* Reason & Description */}
          <Card className="border-2 shadow-sm hover:shadow-md transition-shadow">
            <CardHeader className="bg-gradient-to-r from-primary/5 to-transparent border-b">
              <CardTitle className="flex items-center gap-2">
                <div className="p-2 rounded-lg bg-primary/10">
                  <FileText className="h-5 w-5 text-primary" />
                </div>
                Reason & Description
              </CardTitle>
              <CardDescription>
                Details provided by the reporter
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <InfoRow
                label="Title"
                value={report.title}
              />
              <InfoRow
                label="Description"
                value={<p className="whitespace-pre-wrap">{report.description}</p>}
              />
              {report.attachedImageUrls && report.attachedImageUrls.length > 0 && (
                <>
                  <Separator />
                  <div>
                    <div className="flex items-center gap-2 mb-3">
                      <ImageIcon className="h-4 w-4 text-muted-foreground" />
                      <p className="text-sm font-semibold text-muted-foreground">
                        Attached Images ({report.attachedImageUrls.length})
                      </p>
                    </div>
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                      {report.attachedImageUrls.map((url, index) => (
                        <div
                          key={index}
                          className="relative group cursor-pointer rounded-lg border overflow-hidden bg-muted aspect-video"
                          onClick={() => handleImageClick(url, `Attachment ${index + 1}`)}
                        >
                          <img
                            src={url}
                            alt={`Attachment ${index + 1}`}
                            className="object-cover w-full h-full transition-transform group-hover:scale-105"
                          />
                          <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors flex items-center justify-center">
                            <ImageIcon className="h-6 w-6 text-white opacity-0 group-hover:opacity-100 transition-opacity" />
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </>
              )}
            </CardContent>
          </Card>

          {/* Referenced Target - Post */}
          {report.referencedTargetPost && (
            <Card className="border-2 border-primary/10">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="flex items-center gap-2">
                    <FileText className="h-5 w-5" />
                    Reported Post
                  </CardTitle>
                  <Badge variant="outline" className="text-xs">
                    {report.referencedTargetPost.type}
                  </Badge>
                </div>
                <CardDescription>
                  Content that was reported
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {/* Author Header */}
                  <div className="flex items-center gap-3 pb-3 border-b">
                    <Avatar className="h-10 w-10">
                      <AvatarImage src="" alt="Author" />
                      <AvatarFallback className="bg-primary/10 text-primary">
                        <User className="h-5 w-5" />
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="font-semibold text-sm truncate">
                          User {report.referencedTargetPost.authorId.slice(0, 8)}
                        </p>
                        {report.referencedTargetPost.isVerified && (
                          <Badge variant="secondary" className="h-4 px-1.5 text-xs">
                            <CheckCircle2 className="h-3 w-3 mr-0.5" />
                            Verified
                          </Badge>
                        )}
                      </div>
                      <div className="flex items-center gap-3 mt-0.5">
                        <p className="text-xs text-muted-foreground">
                          {format(new Date(report.referencedTargetPost.createdAt), 'MMM dd, yyyy')}
                        </p>
                        <div className="flex items-center gap-1 text-xs text-muted-foreground">
                          {report.referencedTargetPost.visibility === 'PUBLIC' ? (
                            <>
                              <Globe className="h-3 w-3" />
                              Public
                            </>
                          ) : report.referencedTargetPost.visibility === 'PRIVATE' ? (
                            <>
                              <Lock className="h-3 w-3" />
                              Private
                            </>
                          ) : (
                            <>
                              <Users className="h-3 w-3" />
                              {report.referencedTargetPost.visibility}
                            </>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Post Content */}
                  <div className="space-y-3">
                    <p className="text-sm leading-relaxed whitespace-pre-wrap">
                      {report.referencedTargetPost.content}
                    </p>

                    {/* Rating */}
                    {report.referencedTargetPost.rating !== null && report.referencedTargetPost.rating > 0 && (
                      <div className="flex items-center gap-2">
                        <div className="flex items-center gap-1">
                          {Array.from({ length: 5 }).map((_, i) => {
                            const rating = report.referencedTargetPost?.rating ?? 0;
                            return (
                              <Star
                                key={i}
                                className={cn(
                                  "h-4 w-4",
                                  i < Math.round(rating)
                                    ? "fill-yellow-400 text-yellow-400"
                                    : "text-muted-foreground"
                                )}
                              />
                            );
                          })}
                        </div>
                        <span className="text-sm font-medium text-muted-foreground">
                          {report.referencedTargetPost.rating.toFixed(1)}
                        </span>
                      </div>
                    )}

                    {/* Post Images */}
                    {report.referencedTargetPost.imageUrls && report.referencedTargetPost.imageUrls.length > 0 && (
                      <div className={cn(
                        "grid gap-2 rounded-lg overflow-hidden",
                        report.referencedTargetPost.imageUrls.length === 1 ? "grid-cols-1" :
                        report.referencedTargetPost.imageUrls.length === 2 ? "grid-cols-2" :
                        report.referencedTargetPost.imageUrls.length === 3 ? "grid-cols-2" :
                        "grid-cols-2"
                      )}>
                        {report.referencedTargetPost.imageUrls.map((url, index) => {
                          const imageUrls = report.referencedTargetPost?.imageUrls ?? [];
                          const isFirstImage = index === 0;
                          const isThreeImages = imageUrls.length === 3;
                          const isLargeImage = isFirstImage && (imageUrls.length === 1 || isThreeImages);
                          
                          return (
                            <div
                              key={index}
                              className={cn(
                                "relative group cursor-pointer overflow-hidden bg-muted rounded-lg aspect-square",
                                isLargeImage && isThreeImages ? "row-span-2" : ""
                              )}
                              onClick={() => handleImageClick(url, `Post image ${index + 1}`)}
                            >
                              <img
                                src={url}
                                alt={`Post image ${index + 1}`}
                                className="object-cover w-full h-full transition-transform group-hover:scale-105"
                              />
                              <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors" />
                              {imageUrls.length > 4 && index === 3 && (
                                <div className="absolute inset-0 bg-black/60 flex items-center justify-center">
                                  <span className="text-white font-semibold text-lg">
                                    +{imageUrls.length - 4}
                                  </span>
                                </div>
                              )}
                            </div>
                          );
                        }).slice(0, 4)}
                      </div>
                    )}
                  </div>

                  {/* Post Footer Info */}
                  {report.referencedTargetPost?.postId && (
                    <div className="pt-3 border-t flex items-center justify-between text-xs text-muted-foreground">
                      <div className="flex items-center gap-4">
                        <span>Post ID: <span className="font-mono">{report.referencedTargetPost.postId?.slice?.(0, 8) || report.referencedTargetPost.postId || 'N/A'}...</span></span>
                        {report.referencedTargetPost.isHidden && (
                          <Badge variant="destructive" className="text-xs">
                            Hidden
                          </Badge>
                        )}
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-7 text-xs"
                        onClick={() => {
                          if (report.referencedTargetPost?.postId) {
                            copyToClipboard(report.referencedTargetPost.postId);
                          }
                        }}
                      >
                        <Copy className="h-3 w-3 mr-1" />
                        Copy ID
                      </Button>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Referenced Target - Event */}
          {report.referencedTargetEvent && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Calendar className="h-5 w-5" />
                  Reported Event
                </CardTitle>
                <CardDescription>
                  Event that was reported
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <InfoRow
                  label="Event Title"
                  value={report.referencedTargetEvent.title}
                />
                {report.referencedTargetEvent.description && (
                  <InfoRow
                    label="Description"
                    value={report.referencedTargetEvent.description}
                  />
                )}
                {report.referencedTargetEvent.startDate && (
                  <InfoRow
                    label="Start Date"
                    value={format(new Date(report.referencedTargetEvent.startDate), 'MMM dd, yyyy HH:mm')}
                    icon={Calendar}
                  />
                )}
                {report.referencedTargetEvent.endDate && (
                  <InfoRow
                    label="End Date"
                    value={format(new Date(report.referencedTargetEvent.endDate), 'MMM dd, yyyy HH:mm')}
                    icon={Calendar}
                  />
                )}
                {report.referencedTargetEvent?.eventId && (
                  <div className="pt-2">
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-muted-foreground">Event ID:</span>
                      <span className="font-mono text-sm">{report.referencedTargetEvent.eventId?.slice?.(0, 8) || report.referencedTargetEvent.eventId || 'N/A'}...</span>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-6 w-6"
                        onClick={() => {
                          if (report.referencedTargetEvent?.eventId) {
                            copyToClipboard(report.referencedTargetEvent.eventId);
                          }
                        }}
                      >
                        <Copy className="h-3 w-3" />
                      </Button>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {/* Referenced Target - Location */}
          {report.referencedTargetLocation && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <MapPin className="h-5 w-5" />
                  Reported Location
                </CardTitle>
                <CardDescription>
                  Location that was reported
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <InfoRow
                  label="Location Name"
                  value={report.referencedTargetLocation.name}
                />
                {report.referencedTargetLocation.description && (
                  <InfoRow
                    label="Description"
                    value={report.referencedTargetLocation.description}
                  />
                )}
                {report.referencedTargetLocation?.locationId && (
                  <div className="pt-2">
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-muted-foreground">Location ID:</span>
                      <span className="font-mono text-sm">{report.referencedTargetLocation.locationId?.slice?.(0, 8) || report.referencedTargetLocation.locationId || 'N/A'}...</span>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-6 w-6"
                        onClick={() => {
                          if (report.referencedTargetLocation?.locationId) {
                            copyToClipboard(report.referencedTargetLocation.locationId);
                          }
                        }}
                      >
                        <Copy className="h-3 w-3" />
                      </Button>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {/* Related Reports */}
          {report.targetId && report.targetType && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Flag className="h-5 w-5" />
                  Related Reports
                </CardTitle>
                <CardDescription>
                  Other reports about the same {report.targetType}
                </CardDescription>
              </CardHeader>
              <CardContent>
                {isLoadingRelated ? (
                  <div className="flex items-center justify-center py-8">
                    <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
                  </div>
                ) : relatedReportsData && relatedReportsData.data.length > 0 ? (
                  <div className="space-y-3">
                    {relatedReportsData.data.map((relatedReport) => (
                        <div
                          key={relatedReport.id}
                          className="flex items-center justify-between p-3 border rounded-lg hover:bg-muted/50 transition-colors cursor-pointer"
                          onClick={() => router.push(`/admin/reports/${relatedReport.id}`)}
                        >
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-1">
                              {getStatusBadge(relatedReport.status)}
                              {getTypeBadge(relatedReport.targetType)}
                            </div>
                            <p className="text-sm font-medium truncate">{relatedReport.title}</p>
                            <div className="flex items-center gap-3 mt-1 text-xs text-muted-foreground">
                              <span>Report #{relatedReport.id.slice(0, 8)}</span>
                              <span>•</span>
                              <span>{formatShortDate(relatedReport.createdAt)}</span>
                              {relatedReport.createdBy && (
                                <>
                                  <span>•</span>
                                  <span>
                                    {relatedReport.createdBy.firstName} {relatedReport.createdBy.lastName}
                                  </span>
                                </>
                              )}
                            </div>
                          </div>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={(e) => {
                              e.stopPropagation();
                              router.push(`/admin/reports/${relatedReport.id}`);
                            }}
                          >
                            View
                          </Button>
                        </div>
                      ))}
                    {relatedReportsData.meta.totalItems > relatedReportsData.data.length && (
                      <div className="pt-2 text-center">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            router.push(`/admin/reports?targetId=${report.targetId}&targetType=${report.targetType}`);
                          }}
                        >
                          View All Related Reports ({relatedReportsData.meta.totalItems})
                        </Button>
                      </div>
                    )}
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground text-center py-4">
                    No other reports found for this {report.targetType}
                  </p>
                )}
              </CardContent>
            </Card>
          )}
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Reporter Information */}
          <Card className="border-2 shadow-sm hover:shadow-md transition-shadow">
            <CardHeader className="bg-gradient-to-r from-primary/5 to-transparent border-b">
              <CardTitle className="flex items-center gap-2">
                <div className="p-2 rounded-lg bg-primary/10">
                  <User className="h-5 w-5 text-primary" />
                </div>
                Reporter
              </CardTitle>
              <CardDescription>
                Information about the person who submitted this report
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {report.createdBy ? (
                <>
                  <InfoRow
                    label="Full Name"
                    value={`${report.createdBy.firstName} ${report.createdBy.lastName}`}
                    icon={User}
                  />
                  <InfoRow
                    label="Email"
                    value={
                      <a
                        href={`mailto:${report.createdBy.email}`}
                        className="text-primary hover:underline"
                      >
                        {report.createdBy.email}
                      </a>
                    }
                    icon={Mail}
                  />
                  <InfoRow
                    label="Role"
                    value={<Badge variant="outline">{report.createdBy.role}</Badge>}
                  />
                </>
              ) : (
                <p className="text-sm text-muted-foreground">Reporter information not available</p>
              )}
            </CardContent>
          </Card>

          {/* Timeline */}
          <Card className="border-2 shadow-sm hover:shadow-md transition-shadow">
            <CardHeader className="bg-gradient-to-r from-primary/5 to-transparent border-b">
              <CardTitle className="flex items-center gap-2">
                <div className="p-2 rounded-lg bg-primary/10">
                  <Calendar className="h-5 w-5 text-primary" />
                </div>
                Timeline
              </CardTitle>
              <CardDescription>
                Report activity timeline
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="relative pl-6 space-y-4">
                {/* Timeline line */}
                <div className="absolute left-2 top-0 bottom-0 w-0.5 bg-border" />
                
                {/* Created */}
                <div className="relative">
                  <div className="absolute left-[-22px] top-1 h-3 w-3 rounded-full bg-blue-500 border-2 border-background" />
                  <div>
                    <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Created</p>
                    <p className="mt-1 text-sm font-medium">
                      {format(new Date(report.createdAt), 'MMM dd, yyyy')}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {format(new Date(report.createdAt), 'HH:mm')}
                    </p>
                  </div>
                </div>

                {/* Updated */}
                {report.updatedAt && report.updatedAt !== report.createdAt && (
                  <div className="relative">
                    <div className="absolute left-[-22px] top-1 h-3 w-3 rounded-full bg-muted-foreground border-2 border-background" />
                    <div>
                      <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Last Updated</p>
                      <p className="mt-1 text-sm font-medium">
                        {format(new Date(report.updatedAt), 'MMM dd, yyyy')}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {format(new Date(report.updatedAt), 'HH:mm')}
                      </p>
                    </div>
                  </div>
                )}

                {/* Resolved */}
                {report.resolvedAt && (
                  <div className="relative">
                    <div className="absolute left-[-22px] top-1 h-3 w-3 rounded-full bg-green-500 border-2 border-background" />
                    <div>
                      <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Resolved</p>
                      <p className="mt-1 text-sm font-medium">
                        {format(new Date(report.resolvedAt), 'MMM dd, yyyy')}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {format(new Date(report.resolvedAt), 'HH:mm')}
                      </p>
                      {report.resolvedByType && (
                        <p className="text-xs text-muted-foreground mt-1">
                          By: {report.resolvedByType}
                        </p>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Resolution Details */}
          {(report.status === 'RESOLVED' || report.status === 'REJECTED') && (
            <Card className="border-2 shadow-sm hover:shadow-md transition-shadow">
              <CardHeader className={`bg-gradient-to-r ${
                report.status === 'RESOLVED' 
                  ? 'from-green-50/50 to-transparent border-green-200' 
                  : 'from-red-50/50 to-transparent border-red-200'
              } border-b`}>
                <CardTitle className="flex items-center gap-2">
                  <div className={`p-2 rounded-lg ${
                    report.status === 'RESOLVED' 
                      ? 'bg-green-100' 
                      : 'bg-red-100'
                  }`}>
                    {report.status === 'RESOLVED' ? (
                      <CheckCircle2 className="h-5 w-5 text-green-600" />
                    ) : (
                      <XCircle className="h-5 w-5 text-red-600" />
                    )}
                  </div>
                  Resolution Details
                </CardTitle>
                <CardDescription>
                  Information about how this report was resolved
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {report.resolutionAction && (
                  <InfoRow
                    label="Action Taken"
                    value={getResolutionActionBadge(report.resolutionAction)}
                  />
                )}
                {report.resolvedAt && (
                  <InfoRow
                    label="Resolved At"
                    value={format(new Date(report.resolvedAt), 'MMM dd, yyyy HH:mm')}
                    icon={Calendar}
                  />
                )}
              </CardContent>
            </Card>
          )}
        </div>
      </div>

      {/* Process Report Dialog */}
      <Dialog open={isProcessDialogOpen} onOpenChange={setIsProcessDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Process Report</DialogTitle>
            <DialogDescription>
              Update the status of this report and add admin notes if needed.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Status *</Label>
              <Select
                value={processStatus}
                onValueChange={(value) => setProcessStatus(value as 'RESOLVED' | 'REJECTED')}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="RESOLVED">
                    <div className="flex items-center gap-2">
                      <CheckCircle2 className="h-4 w-4 text-green-600" />
                      Resolved
                    </div>
                  </SelectItem>
                  <SelectItem value="REJECTED">
                    <div className="flex items-center gap-2">
                      <XCircle className="h-4 w-4 text-red-600" />
                      Rejected
                    </div>
                  </SelectItem>
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
                  {getAvailableResolutionActions().map((action) => (
                    <SelectItem key={action} value={action}>
                      {getResolutionActionLabel(action)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground">
                Choose an action to take on the reported content (required)
              </p>
            </div>
            <div className="space-y-2">
              <Label>Admin Notes (Optional)</Label>
              <Textarea
                placeholder="Add notes about how this report was processed..."
                value={adminNotes}
                onChange={(e) => setAdminNotes(e.target.value)}
                rows={4}
                className="resize-none"
              />
              <p className="text-xs text-muted-foreground">
                Internal notes that will be saved with this report
              </p>
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
              disabled={isProcessing || !resolutionAction}
              className={processStatus === 'RESOLVED' ? 'bg-green-600 hover:bg-green-700' : 'bg-red-600 hover:bg-red-700'}
            >
              {isProcessing ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Processing...
                </>
              ) : (
                <>
                  {processStatus === 'RESOLVED' ? (
                    <>
                      <CheckCircle2 className="h-4 w-4 mr-2" />
                      Resolve Report
                    </>
                  ) : (
                    <>
                      <XCircle className="h-4 w-4 mr-2" />
                      Reject Report
                    </>
                  )}
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Image Viewer */}
      <ImageViewer
        src={currentImageSrc}
        alt={currentImageAlt}
        open={isImageViewerOpen}
        onOpenChange={setIsImageViewerOpen}
      />
    </PageContainer>
  );
}
