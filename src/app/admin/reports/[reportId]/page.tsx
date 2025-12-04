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
  IconFlag,
  IconClock,
  IconCheck,
  IconX,
  IconArrowLeft,
  IconUser,
  IconCalendar,
  IconFileText,
  IconAlertTriangle,
  IconPhoto,
  IconExternalLink,
  IconCopy,
  IconStar,
  IconWorld,
  IconLock,
  IconUsers,
} from '@tabler/icons-react';
import { useReportById } from '@/hooks/admin/useReportById';
import { useProcessReport } from '@/hooks/admin/useProcessReport';
import { format } from 'date-fns';
import { Loader2 } from 'lucide-react';
import { ReportTargetType } from '@/types';
import { cn } from '@/lib/utils';
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
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';

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
  const [selectedImageIndex, setSelectedImageIndex] = useState<number | null>(null);
  const [selectedImageSource, setSelectedImageSource] = useState<'attached' | 'post' | null>(null);
  const [copiedId, setCopiedId] = useState(false);

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(true);
    toast.success('Copied to clipboard');
    setTimeout(() => setCopiedId(false), 2000);
  };

  const getResolutionActionBadge = (action: string | null) => {
    if (!action) return null;
    const colors: Record<string, string> = {
      DELETE: 'bg-red-50 text-red-700 border-red-300 dark:bg-red-950 dark:text-red-300',
      HIDE: 'bg-orange-50 text-orange-700 border-orange-300 dark:bg-orange-950 dark:text-orange-300',
      WARN: 'bg-yellow-50 text-yellow-700 border-yellow-300 dark:bg-yellow-950 dark:text-yellow-300',
      NO_ACTION: 'bg-gray-50 text-gray-700 border-gray-300 dark:bg-gray-950 dark:text-gray-300',
    };
    return (
      <Badge variant="outline" className={colors[action] || ''}>
        {action.replace('_', ' ')}
      </Badge>
    );
  };

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
      <div className="space-y-4">
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => router.push('/admin/reports')}
            className="h-8"
          >
            Reports
          </Button>
          <span>/</span>
          <span className="text-foreground font-medium">Report Details</span>
        </div>
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
              <div className="flex items-center gap-3">
                <h1 className="text-3xl font-bold tracking-tight">Report Details</h1>
                {getStatusBadge(report.status)}
              </div>
              <div className="flex items-center gap-2 mt-2">
                <p className="text-muted-foreground text-sm">
                  Report ID: <span className="font-mono">{report.id}</span>
                </p>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-6 w-6"
                  onClick={() => copyToClipboard(report.id)}
                  title="Copy ID"
                >
                  <IconCopy className={cn("h-3 w-3", copiedId && "text-green-600")} />
                </Button>
              </div>
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
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Report Information */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <IconFlag className="h-5 w-5" />
                Report Information
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-xs text-muted-foreground uppercase tracking-wide">Target Type</Label>
                  <div className="mt-2">{getTypeBadge(report.targetType)}</div>
                </div>
                <div>
                  <Label className="text-xs text-muted-foreground uppercase tracking-wide">Target ID</Label>
                  <div className="mt-2 flex items-center gap-2">
                    <p className="font-mono text-sm">{report.targetId}</p>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-6 w-6"
                      onClick={() => copyToClipboard(report.targetId)}
                      title="Copy Target ID"
                    >
                      <IconCopy className="h-3 w-3" />
                    </Button>
                  </div>
                </div>
                <div>
                  <Label className="text-xs text-muted-foreground uppercase tracking-wide">Report Reason</Label>
                  <p className="mt-2 text-sm font-medium">
                    {report.reportedReasonEntity?.displayName || report.reportedReasonKey}
                  </p>
                  {report.reportedReasonEntity?.description && (
                    <p className="mt-1 text-xs text-muted-foreground">
                      {report.reportedReasonEntity.description}
                    </p>
                  )}
                </div>
                <div>
                  <Label className="text-xs text-muted-foreground uppercase tracking-wide">Created At</Label>
                  <p className="mt-2 text-sm">
                    {format(new Date(report.createdAt), 'MMM dd, yyyy HH:mm')}
                  </p>
                </div>
              </div>
              {report.resolutionAction && (
                <>
                  <Separator />
                  <div className="space-y-2">
                    <Label className="text-xs text-muted-foreground uppercase tracking-wide">Resolution Action</Label>
                    <div className="mt-2">{getResolutionActionBadge(report.resolutionAction)}</div>
                  </div>
                </>
              )}
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
                  <Label className="text-xs text-muted-foreground uppercase tracking-wide flex items-center gap-2">
                    <IconPhoto className="h-4 w-4" />
                    Attached Images ({report.attachedImageUrls.length})
                  </Label>
                  <div className="mt-3 grid grid-cols-2 md:grid-cols-3 gap-3">
                    {report.attachedImageUrls.map((url, index) => (
                      <div
                        key={index}
                        className="relative group cursor-pointer rounded-lg border overflow-hidden bg-muted"
                        onClick={() => {
                          setSelectedImageIndex(index);
                          setSelectedImageSource('attached');
                        }}
                      >
                        <img
                          src={url}
                          alt={`Attachment ${index + 1}`}
                          className="object-cover h-32 w-full transition-transform group-hover:scale-105"
                        />
                        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors flex items-center justify-center">
                          <IconPhoto className="h-6 w-6 text-white opacity-0 group-hover:opacity-100 transition-opacity" />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Referenced Target - Post UI */}
          {report.referencedTargetPost && (
            <Card className="border-2">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg">Reported Post</CardTitle>
                  <Badge variant="outline" className="text-xs">
                    {report.referencedTargetPost.type}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent>
                {/* Post-like UI */}
                <div className="space-y-4">
                  {/* Author Header */}
                  <div className="flex items-center gap-3 pb-3 border-b">
                    <Avatar className="h-10 w-10">
                      <AvatarImage src="" alt="Author" />
                      <AvatarFallback className="bg-primary/10 text-primary">
                        <IconUser className="h-5 w-5" />
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="font-semibold text-sm truncate">
                          User {report.referencedTargetPost.authorId.slice(0, 8)}
                        </p>
                        {report.referencedTargetPost.isVerified && (
                          <Badge variant="secondary" className="h-4 px-1.5 text-xs">
                            <IconCheck className="h-3 w-3 mr-0.5" />
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
                              <IconWorld className="h-3 w-3" />
                              Public
                            </>
                          ) : report.referencedTargetPost.visibility === 'PRIVATE' ? (
                            <>
                              <IconLock className="h-3 w-3" />
                              Private
                            </>
                          ) : (
                            <>
                              <IconUsers className="h-3 w-3" />
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
                          {Array.from({ length: 5 }).map((_, i) => (
                            <IconStar
                              key={i}
                              className={cn(
                                "h-4 w-4",
                                i < Math.round(report.referencedTargetPost.rating!)
                                  ? "fill-yellow-400 text-yellow-400"
                                  : "text-muted-foreground"
                              )}
                            />
                          ))}
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
                          const isFirstImage = index === 0;
                          const isThreeImages = report.referencedTargetPost.imageUrls.length === 3;
                          const isLargeImage = isFirstImage && (report.referencedTargetPost.imageUrls.length === 1 || isThreeImages);
                          
                          return (
                            <div
                              key={index}
                              className={cn(
                                "relative group cursor-pointer overflow-hidden bg-muted rounded-lg",
                                isLargeImage && isThreeImages ? "row-span-2" : "",
                                isLargeImage ? "aspect-square" : "aspect-square"
                              )}
                              onClick={() => {
                                setSelectedImageIndex(index);
                                setSelectedImageSource('post');
                              }}
                            >
                              <img
                                src={url}
                                alt={`Post image ${index + 1}`}
                                className="object-cover w-full h-full transition-transform group-hover:scale-105"
                              />
                              <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors" />
                              {report.referencedTargetPost.imageUrls.length > 4 && index === 3 && (
                                <div className="absolute inset-0 bg-black/60 flex items-center justify-center">
                                  <span className="text-white font-semibold text-lg">
                                    +{report.referencedTargetPost.imageUrls.length - 4}
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
                  <div className="pt-3 border-t flex items-center justify-between text-xs text-muted-foreground">
                    <div className="flex items-center gap-4">
                      <span>Post ID: <span className="font-mono">{report.referencedTargetPost.postId.slice(0, 8)}...</span></span>
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
                      onClick={() => copyToClipboard(report.referencedTargetPost.postId)}
                    >
                      <IconCopy className="h-3 w-3 mr-1" />
                      Copy ID
                    </Button>
                  </div>
                </div>
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
            <CardContent>
              <div className="relative pl-6 space-y-4">
                {/* Timeline line */}
                <div className="absolute left-2 top-0 bottom-0 w-0.5 bg-border" />
                
                {/* Created */}
                <div className="relative">
                  <div className="absolute left-[-22px] top-1 h-3 w-3 rounded-full bg-blue-500 border-2 border-background" />
                  <div>
                    <Label className="text-xs text-muted-foreground uppercase tracking-wide">Created</Label>
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
                      <Label className="text-xs text-muted-foreground uppercase tracking-wide">Last Updated</Label>
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
                      <Label className="text-xs text-muted-foreground uppercase tracking-wide">Resolved</Label>
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
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  {report.status === 'RESOLVED' ? (
                    <IconCheck className="h-5 w-5 text-green-600" />
                  ) : (
                    <IconX className="h-5 w-5 text-red-600" />
                  )}
                  Resolution Details
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {report.resolutionAction && (
                  <div>
                    <Label className="text-xs text-muted-foreground uppercase tracking-wide">Action Taken</Label>
                    <div className="mt-2">{getResolutionActionBadge(report.resolutionAction)}</div>
                  </div>
                )}
                {report.resolvedAt && (
                  <div>
                    <Label className="text-xs text-muted-foreground uppercase tracking-wide">Resolved At</Label>
                    <p className="mt-1 text-sm">
                      {format(new Date(report.resolvedAt), 'MMM dd, yyyy HH:mm')}
                    </p>
                  </div>
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
                      <IconCheck className="h-4 w-4 text-green-600" />
                      Resolved
                    </div>
                  </SelectItem>
                  <SelectItem value="REJECTED">
                    <div className="flex items-center gap-2">
                      <IconX className="h-4 w-4 text-red-600" />
                      Rejected
                    </div>
                  </SelectItem>
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
                  <SelectItem value="DELETE">Delete Content</SelectItem>
                  <SelectItem value="HIDE">Hide Content</SelectItem>
                  <SelectItem value="WARN">Warn User</SelectItem>
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground">
                Choose an action to take on the reported content
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
              disabled={isProcessing}
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
                      <IconCheck className="h-4 w-4 mr-2" />
                      Resolve Report
                    </>
                  ) : (
                    <>
                      <IconX className="h-4 w-4 mr-2" />
                      Reject Report
                    </>
                  )}
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Image Lightbox */}
      {selectedImageIndex !== null && selectedImageSource && (
        <AlertDialog 
          open={selectedImageIndex !== null} 
          onOpenChange={() => {
            setSelectedImageIndex(null);
            setSelectedImageSource(null);
          }}
        >
          <AlertDialogContent className="max-w-4xl">
            <AlertDialogHeader>
              <AlertDialogTitle>
                {selectedImageSource === 'attached' 
                  ? `Attachment ${selectedImageIndex + 1} of ${report.attachedImageUrls?.length || 0}`
                  : `Post Image ${selectedImageIndex + 1} of ${report.referencedTargetPost?.imageUrls?.length || 0}`
                }
              </AlertDialogTitle>
            </AlertDialogHeader>
            <div className="relative">
              <img
                src={
                  selectedImageSource === 'attached'
                    ? report.attachedImageUrls![selectedImageIndex]
                    : report.referencedTargetPost!.imageUrls[selectedImageIndex]
                }
                alt={`${selectedImageSource === 'attached' ? 'Attachment' : 'Post image'} ${selectedImageIndex + 1}`}
                className="w-full h-auto rounded-lg"
              />
            </div>
            <AlertDialogFooter>
              <div className="flex items-center gap-2 w-full justify-between">
                <Button
                  variant="outline"
                  onClick={() => setSelectedImageIndex(Math.max(0, selectedImageIndex - 1))}
                  disabled={selectedImageIndex === 0}
                >
                  Previous
                </Button>
                <Button
                  variant="outline"
                  onClick={() => {
                    const imageUrl = selectedImageSource === 'attached'
                      ? report.attachedImageUrls![selectedImageIndex]
                      : report.referencedTargetPost!.imageUrls[selectedImageIndex];
                    window.open(imageUrl, '_blank');
                  }}
                >
                  <IconExternalLink className="h-4 w-4 mr-2" />
                  Open Full Size
                </Button>
                <Button
                  variant="outline"
                  onClick={() => {
                    const maxIndex = selectedImageSource === 'attached'
                      ? (report.attachedImageUrls?.length || 0) - 1
                      : (report.referencedTargetPost?.imageUrls?.length || 0) - 1;
                    setSelectedImageIndex(Math.min(maxIndex, selectedImageIndex + 1));
                  }}
                  disabled={
                    selectedImageIndex === (selectedImageSource === 'attached'
                      ? (report.attachedImageUrls?.length || 0) - 1
                      : (report.referencedTargetPost?.imageUrls?.length || 0) - 1)
                  }
                >
                  Next
                </Button>
              </div>
              <AlertDialogCancel
                onClick={() => {
                  setSelectedImageIndex(null);
                  setSelectedImageSource(null);
                }}
              >
                Close
              </AlertDialogCancel>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      )}
    </div>
  );
}


