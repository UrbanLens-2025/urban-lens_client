'use client';

import { use, useState, useMemo } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useEventByIdForAdmin } from '@/hooks/admin/useEventByIdForAdmin';
import { useReports } from '@/hooks/admin/useReports';
import {
  ArrowLeft,
  Calendar,
  MapPin,
  User,
  Globe,
  Tag,
  FileText,
  Clock,
  Users,
  Ticket,
  CheckCircle2,
  XCircle,
  Flag,
  AlertTriangle,
  Loader2,
  ChevronDown,
  Search,
  ImageIcon,
  History,
  Filter,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { DisplayTags } from '@/components/shared/DisplayTags';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';
import Link from 'next/link';
import type React from 'react';
import { formatDate } from '@/lib/utils';
import Image from 'next/image';
import LoadingCustom from '@/components/shared/LoadingCustom';
import ErrorCustom from '@/components/shared/ErrorCustom';
import { Report, ReportStatus } from '@/types';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';

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
        <p className='text-xs font-medium text-muted-foreground uppercase tracking-wide mb-1'>
          {label}
        </p>
        <div className='text-sm text-foreground break-words'>{value}</div>
      </div>
    </div>
  );
}

function StatCard({
  icon: Icon,
  label,
  value,
  variant = 'default',
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: string | number;
  variant?: 'default' | 'success' | 'warning' | 'error';
}) {
  const variantColors = {
    default: 'bg-blue-50 text-blue-600 border-blue-100',
    success: 'bg-green-50 text-green-600 border-green-100',
    warning: 'bg-amber-50 text-amber-600 border-amber-100',
    error: 'bg-red-50 text-red-600 border-red-100',
  };

  return (
    <div className='flex items-center gap-3 p-4 rounded-lg border bg-card'>
      <div className={`p-3 rounded-lg ${variantColors[variant]}`}>
        <Icon className='h-5 w-5' />
      </div>
      <div className='flex-1 min-w-0'>
        <p className='text-xs text-muted-foreground font-medium'>{label}</p>
        <p className='text-lg font-semibold truncate'>{value}</p>
      </div>
    </div>
  );
}

export default function AdminEventDetailsPage({
  params,
}: {
  params: Promise<{ eventId: string }>;
}) {
  const { eventId } = use(params);
  const router = useRouter();
  const searchParams = useSearchParams();
  const { data: event, isLoading, isError } = useEventByIdForAdmin(eventId);
  const [selectedReportId, setSelectedReportId] = useState<string | null>(null);
  const [expandedReasons, setExpandedReasons] = useState<Record<string, boolean>>({});
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [failedImages, setFailedImages] = useState<Set<string>>(new Set());
  const [selectedReportIds, setSelectedReportIds] = useState<Set<string>>(new Set());
  const [statusFilter, setStatusFilter] = useState<ReportStatus>('PENDING');
  const [resolutionAction, setResolutionAction] = useState<string>('');

  // Get tab from URL query params, default to 'overview'
  const activeTab = searchParams.get('tab') || 'overview';
  
  // Validate tab value
  const validTabs = ['overview', 'tickets', 'reports'];
  const currentTab = validTabs.includes(activeTab) ? activeTab : 'overview';

  // Handle tab change
  const handleTabChange = (value: string) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set('tab', value);
    router.replace(`/admin/events/${eventId}?${params.toString()}`, { scroll: false });
  };

  // Fetch reports for this event
  const { data: reportsData, isLoading: isLoadingReports } = useReports({
    page: 1,
    limit: 100,
    targetType: 'event',
    targetId: eventId,
    sortBy: 'createdAt:DESC',
    status: statusFilter,
  });

  // Group reports by reportedReasonKey and filter by search query
  const groupedReports = useMemo(() => {
    if (!reportsData?.data) return {};
    
    // Filter reports by title if search query exists
    const filteredReports = searchQuery.trim()
      ? reportsData.data.filter((report: Report) =>
          report.title?.toLowerCase().includes(searchQuery.toLowerCase())
        )
      : reportsData.data;
    
    return filteredReports.reduce(
      (acc: Record<string, Report[]>, report: Report) => {
        const key = report.reportedReasonKey || 'other';
        if (!acc[key]) {
          acc[key] = [];
        }
        acc[key].push(report);
        return acc;
      },
      {}
    );
  }, [reportsData, searchQuery]);

  // Get selected report
  const selectedReport = useMemo(() => {
    if (!selectedReportId || !reportsData?.data) return null;
    return reportsData.data.find((r: Report) => r.id === selectedReportId) || null;
  }, [selectedReportId, reportsData]);

  // Format date helper
  const formatReportDate = (dateString: string) => {
    return new Date(dateString).toLocaleString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  // Format date only (no time)
  const formatReportDateOnly = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  // Get initials for avatar
  const getInitials = (firstName?: string, lastName?: string) => {
    return `${firstName?.[0] || ''}${lastName?.[0] || ''}`.toUpperCase() || '??';
  };

  if (isLoading) {
    return <LoadingCustom />;
  }

  if (isError || !event) {
    return <ErrorCustom />;
  }

  const getStatusBadge = (status: string) => {
    const statusUpper = status?.toUpperCase();
    if (statusUpper === 'PUBLISHED') {
      return (
        <Badge className='bg-green-500 hover:bg-green-600 flex items-center gap-1'>
          <CheckCircle2 className='h-3 w-3' />
          Published
        </Badge>
      );
    }
    if (statusUpper === 'DRAFT') {
      return (
        <Badge variant='secondary' className='flex items-center gap-1'>
          <Clock className='h-3 w-3' />
          Draft
        </Badge>
      );
    }
    if (statusUpper === 'CANCELLED') {
      return (
        <Badge variant='destructive' className='flex items-center gap-1'>
          <XCircle className='h-3 w-3' />
          Cancelled
        </Badge>
      );
    }
    return <Badge variant='outline'>{status || 'Unknown'}</Badge>;
  };

  return (
    <div className='min-h-screen bg-gradient-to-b from-muted/30 to-background p-4 w-full'>
      <div>
        {/* Header with Cover Image */}
        <div className='relative'>
          {event.coverUrl && (
            <div className='relative h-64 rounded-xl overflow-hidden mb-6 shadow-lg'>
              <Image
                src={event.coverUrl}
                alt='Event Cover'
                fill
                className='object-cover'
              />
              <div className='absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent' />
              <Button
                variant='secondary'
                size='icon'
                onClick={() => router.back()}
                className='absolute top-4 left-4 backdrop-blur-sm bg-white/90 hover:bg-white'
              >
                <ArrowLeft className='h-5 w-5' />
              </Button>
            </div>
          )}

          {!event.coverUrl && (
            <Button
              variant='ghost'
              size='icon'
              onClick={() => router.back()}
              className='mb-4'
            >
              <ArrowLeft className='h-5 w-5' />
            </Button>
          )}

          {/* Title Section */}
          <div className='flex flex-col sm:flex-row items-start gap-4 mb-6'>
            {event.avatarUrl && (
              <div className='relative w-24 h-24 rounded-xl overflow-hidden border-4 border-background shadow-lg cursor-pointer flex-shrink-0'>
                <Image
                  src={event.avatarUrl}
                  alt='Event Avatar'
                  fill
                  className='object-cover'
                />
              </div>
            )}
            <div className='flex-1'>
              <div className='flex items-start gap-3 mb-2'>
                <h1 className='text-3xl font-bold tracking-tight flex-1'>
                  {event.displayName}
                </h1>
                {getStatusBadge(event.status)}
              </div>
              <div className='flex flex-wrap items-center gap-3 text-sm text-muted-foreground'>
                <div className='flex items-center gap-1.5'>
                  <Calendar className='h-4 w-4' />
                  {formatDate(event.startDate!)}
                </div>
                {event.endDate && (
                  <>
                    <span>→</span>
                    <div className='flex items-center gap-1.5'>
                      {formatDate(event.endDate!)}
                    </div>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>
        {/* Tabs to switch between sections, similar to creator view */}
        <Tabs value={currentTab} onValueChange={handleTabChange} className='space-y-4'>
          <div className='border-b border-border'>
            <div className='flex gap-8'>
              <button
                onClick={() => handleTabChange('overview')}
                className={`flex items-center gap-2 px-1 py-3 text-sm font-medium border-b-2 transition-colors ${
                  currentTab === 'overview'
                    ? 'border-foreground text-foreground'
                    : 'border-transparent text-muted-foreground hover:text-foreground'
                }`}
              >
                <FileText className='h-4 w-4' />
                Overview
              </button>
              <button
                onClick={() => handleTabChange('tickets')}
                className={`flex items-center gap-2 px-1 py-3 text-sm font-medium border-b-2 transition-colors ${
                  currentTab === 'tickets'
                    ? 'border-foreground text-foreground'
                    : 'border-transparent text-muted-foreground hover:text-foreground'
                }`}
              >
                <Ticket className='h-4 w-4' />
                Tickets
              </button>
              <button
                onClick={() => handleTabChange('reports')}
                className={`flex items-center gap-2 px-1 py-3 text-sm font-medium border-b-2 transition-colors ${
                  currentTab === 'reports'
                    ? 'border-foreground text-foreground'
                    : 'border-transparent text-muted-foreground hover:text-foreground'
                }`}
              >
                <Flag className='h-4 w-4' />
                Reports
              </button>
            </div>
          </div>
          <TabsList className='hidden'>
            <TabsTrigger value='overview'>Overview</TabsTrigger>
            <TabsTrigger value='tickets'>Tickets</TabsTrigger>
            <TabsTrigger value='reports'>Reports</TabsTrigger>
          </TabsList>

          <TabsContent value='overview' className='space-y-6'>
            <div className='grid grid-cols-1 lg:grid-cols-3 gap-6'>
              {/* Main Content */}
              <div className='lg:col-span-2 space-y-6'>
                {/* Description */}
                {event.description && (
                  <Card className='shadow-sm'>
                    <CardHeader>
                      <CardTitle className='text-lg flex items-center gap-2'>
                        <FileText className='h-5 w-5 text-primary' />
                        Description
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className='text-muted-foreground whitespace-pre-wrap leading-relaxed'>
                        {event.description}
                      </p>
                    </CardContent>
                  </Card>
                )}

                {/* Location */}
                {event.location && (
                  <Card className='shadow-sm'>
                    <CardHeader>
                      <CardTitle className='text-lg flex items-center gap-2'>
                        <MapPin className='h-5 w-5 text-primary' />
                        Location
                      </CardTitle>
                    </CardHeader>
                    <CardContent className='space-y-4'>
                      {/* Top: image + basic info */}
                      <div className='flex flex-col md:flex-row gap-4'>
                        {event.location.imageUrl &&
                          event.location.imageUrl.length > 0 && (
                            <div className='relative w-full md:w-48 h-32 rounded-lg overflow-hidden border bg-muted'>
                              <Image
                                src={event.location.imageUrl[0]}
                                alt={event.location.name}
                                fill
                                className='object-cover'
                              />
                            </div>
                          )}
                        <div className='flex-1 space-y-2'>
                          <InfoRow
                            label='Location Name'
                            value={
                              <Link
                                href={`/admin/locations/${event.location.id}`}
                                className='hover:underline text-primary font-medium'
                              >
                                {event.location.name}
                              </Link>
                            }
                          />
                          {event.location.addressLine && (
                            <InfoRow
                              label='Address'
                              value={
                                event.location.addressLine +
                                (event.location.addressLevel1
                                  ? ' ' + event.location.addressLevel1
                                  : ',') +
                                (event.location.addressLevel2
                                  ? ', ' + event.location.addressLevel2
                                  : '')
                              }
                            />
                          )}
                        </div>
                      </div>

                      {/* Ownership / Visibility */}
                      <div className='grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2 border-t'>
                        <InfoRow
                          label='Ownership'
                          value={
                            event.location.ownershipType === 'OWNED_BY_BUSINESS'
                              ? 'Owned by business'
                              : event.location.ownershipType || 'N/A'
                          }
                        />
                        <InfoRow
                          label='Average rating'
                          value={event.location.averageRating?.toFixed(1) || 0}
                        />
                        <InfoRow
                          label='Total reviews'
                          value={event.location.totalReviews || 0}
                        />
                        <InfoRow
                          label='Total check-ins'
                          value={event.location.totalCheckIns || 0}
                        />
                      </div>

                      {/* Stats */}
                    </CardContent>
                  </Card>
                )}

                {/* Social Links */}
                {event.social && event.social.length > 0 && (
                  <Card className='shadow-sm'>
                    <CardHeader>
                      <CardTitle className='text-lg flex items-center gap-2'>
                        <Globe className='h-5 w-5 text-primary' />
                        Social Links
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className='space-y-2'>
                        {event.social.map((link: any, index: number) => (
                          <a
                            key={index}
                            href={link.url}
                            target='_blank'
                            rel='noopener noreferrer'
                            className='flex items-center gap-2 p-2 rounded-md hover:bg-muted transition-colors'
                          >
                            <Globe className='h-4 w-4 text-muted-foreground' />
                            <span className='text-primary hover:underline flex-1'>
                              {link.platform}
                            </span>
                            {link.isMain && (
                              <Badge variant='outline' className='text-xs'>
                                Main
                              </Badge>
                            )}
                          </a>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                )}

                {/* Terms and Policies */}
                {(event.termsAndConditions || event.refundPolicy) && (
                  <div className='grid grid-cols-1 gap-6'>
                    {event.termsAndConditions && (
                      <Card className='shadow-sm'>
                        <CardHeader>
                          <CardTitle className='text-lg'>
                            Terms and Conditions
                          </CardTitle>
                        </CardHeader>
                        <CardContent>
                          <p className='text-sm text-muted-foreground whitespace-pre-wrap'>
                            {event.termsAndConditions}
                          </p>
                        </CardContent>
                      </Card>
                    )}
                    {event.refundPolicy && (
                      <Card className='shadow-sm'>
                        <CardHeader>
                          <CardTitle className='text-lg'>
                            Refund Policy
                          </CardTitle>
                        </CardHeader>
                        <CardContent>
                          <p className='text-sm text-muted-foreground whitespace-pre-wrap'>
                            {event.refundPolicy}
                          </p>
                        </CardContent>
                      </Card>
                    )}
                  </div>
                )}
              </div>

              {/* Sidebar */}
              <div className='space-y-6'>
                {/* Creator Info */}
                {event.createdBy && (
                  <Card className='shadow-sm'>
                    <CardHeader>
                      <CardTitle className='text-lg flex items-center gap-2'>
                        <User className='h-5 w-5 text-primary' />
                        Creator
                      </CardTitle>
                    </CardHeader>
                    <CardContent className='space-y-3'>
                      <InfoRow
                        label='Name'
                        value={
                          `${event.createdBy.firstName || ''} ${
                            event.createdBy.lastName || ''
                          }`.trim() || 'N/A'
                        }
                      />
                      {event.createdBy.email && (
                        <InfoRow label='Email' value={event.createdBy.email} />
                      )}
                      {event.createdBy.phoneNumber && (
                        <InfoRow
                          label='Phone'
                          value={event.createdBy.phoneNumber}
                        />
                      )}
                    </CardContent>
                  </Card>
                )}

                {/* Tags */}
                {event.tags && event.tags.length > 0 && (
                  <Card className='shadow-sm'>
                    <CardHeader>
                      <CardTitle className='text-lg flex items-center gap-2'>
                        <Tag className='h-5 w-5 text-primary' />
                        Tags
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <DisplayTags tags={event.tags} />
                    </CardContent>
                  </Card>
                )}
              </div>
            </div>
          </TabsContent>

          <TabsContent value='tickets' className='space-y-6'>
            <div className='grid grid-cols-1 lg:grid-cols-3 gap-6'>
              <div className='lg:col-span-2 space-y-6'>
                {event.tickets && event.tickets.length > 0 ? (
                  <Card className='shadow-sm'>
                    <CardHeader>
                      <CardTitle className='text-lg flex items-center gap-2'>
                        <Ticket className='h-5 w-5 text-primary' />
                        Tickets ({event.tickets.length})
                      </CardTitle>
                    </CardHeader>
                    <CardContent className='space-y-3'>
                      {event.tickets.map((ticket: any) => (
                        <div
                          key={ticket.id}
                          className='p-4 rounded-lg border bg-muted/30 hover:bg-muted/50 transition-colors'
                        >
                          <div className='flex items-start justify-between gap-4 mb-3'>
                            <div className='flex-1'>
                              <h4 className='font-semibold mb-1'>
                                {ticket.displayName}
                              </h4>
                              {ticket.description && (
                                <p className='text-sm text-muted-foreground'>
                                  {ticket.description}
                                </p>
                              )}
                            </div>
                            <div className='text-right'>
                              <p className='text-lg font-bold text-primary'>
                                {Number(ticket.price).toLocaleString()}{' '}
                                {ticket.currency}
                              </p>
                            </div>
                          </div>
                          <div className='grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs'>
                            <div>
                              <p className='text-muted-foreground mb-0.5'>
                                Available
                              </p>
                              <p className='font-semibold'>
                                {ticket.totalQuantityAvailable}/
                                {ticket.totalQuantity}
                              </p>
                            </div>
                            <div>
                              <p className='text-muted-foreground mb-0.5'>
                                Reserved
                              </p>
                              <p className='font-semibold'>
                                {ticket.quantityReserved}
                              </p>
                            </div>
                            <div>
                              <p className='text-muted-foreground mb-0.5'>
                                Min/Max Order
                              </p>
                              <p className='font-semibold'>
                                {ticket.minQuantityPerOrder}-
                                {ticket.maxQuantityPerOrder}
                              </p>
                            </div>
                            <div>
                              <p className='text-muted-foreground mb-0.5'>
                                Status
                              </p>
                              <Badge
                                variant={
                                  ticket.isActive ? 'default' : 'secondary'
                                }
                                className='text-xs'
                              >
                                {ticket.isActive ? 'Active' : 'Inactive'}
                              </Badge>
                            </div>
                          </div>
                        </div>
                      ))}
                    </CardContent>
                  </Card>
                ) : (
                  <Card className='shadow-sm'>
                    <CardContent className='py-10 text-center text-muted-foreground text-sm'>
                      This event has no tickets.
                    </CardContent>
                  </Card>
                )}
              </div>

              {/* Reuse sidebar for context */}
              <div className='space-y-6'>
                {/* Creator Info */}
                {event.createdBy && (
                  <Card className='shadow-sm'>
                    <CardHeader>
                      <CardTitle className='text-lg flex items-center gap-2'>
                        <User className='h-5 w-5 text-primary' />
                        Creator
                      </CardTitle>
                    </CardHeader>
                    <CardContent className='space-y-3'>
                      <InfoRow
                        label='Name'
                        value={
                          `${event.createdBy.firstName || ''} ${
                            event.createdBy.lastName || ''
                          }`.trim() || 'N/A'
                        }
                      />
                      {event.createdBy.email && (
                        <InfoRow label='Email' value={event.createdBy.email} />
                      )}
                      {event.createdBy.phoneNumber && (
                        <InfoRow
                          label='Phone'
                          value={event.createdBy.phoneNumber}
                        />
                      )}
                    </CardContent>
                  </Card>
                )}

                {/* Actions */}
                <Card className='shadow-sm'>
                  <CardHeader>
                    <CardTitle className='text-lg'>Actions</CardTitle>
                  </CardHeader>
                  <CardContent className='space-y-2'>
                    <Button variant='default' className='w-full' asChild>
                      <Link href={`/dashboard/creator/events/${event.id}`}>
                        View Creator View
                      </Link>
                    </Button>
                    <Button variant='outline' className='w-full'>
                      Edit Event
                    </Button>
                  </CardContent>
                </Card>
              </div>
            </div>
          </TabsContent>

          <TabsContent value='reports' className='flex flex-col gap-2 space-y-4'>
            {/* Action Bar */}
            <div className='bg-card border rounded-lg px-3 py-2 flex items-center justify-between gap-3'>
              <div className='flex items-center gap-2'>
                <span className='text-xs text-muted-foreground'>
                  {selectedReportIds.size} {selectedReportIds.size === 1 ? 'report' : 'reports'} selected
                </span>
                <Button
                  variant='outline'
                  size='sm'
                  className='h-8 px-3 text-xs'
                  onClick={() => setSelectedReportIds(new Set())}
                  disabled={selectedReportIds.size === 0}
                >
                  Clear
                </Button>
              </div>
              <div className='flex items-center gap-2'>
                <Select value={resolutionAction} onValueChange={setResolutionAction}>
                  <SelectTrigger className='w-[130px] h-8 text-xs px-3' size='sm'>
                    <SelectValue placeholder='Select action' className='text-xs' />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value='approve' className='text-xs py-1.5'>Approve Report</SelectItem>
                    <SelectItem value='reject' className='text-xs py-1.5'>Reject Report</SelectItem>
                    <SelectItem value='no_action' className='text-xs py-1.5'>No Action</SelectItem>
                    <SelectItem value='escalate' className='text-xs py-1.5'>Escalate</SelectItem>
                  </SelectContent>
                </Select>
                <Button
                  onClick={() => {
                    // Mock - do nothing for now
                  }}
                  disabled={selectedReportIds.size === 0 || !resolutionAction}
                  size='sm'
                  className='h-8 px-3 text-xs'
                >
                  Apply
                </Button>
              </div>
            </div>
            <Card className="pt-0">
              <CardContent className='p-0'>
                {isLoadingReports ? (
                  <div className='flex items-center justify-center h-64'>
                    <Loader2 className='h-8 w-8 animate-spin text-muted-foreground' />
                  </div>
                ) : (
                  <div className='flex min-h-[500px]'>
                    {/* Left Panel - Reports List (1/3) */}
                    <div className='w-1/3 border-r flex flex-col max-h-[600px]'>
                      {/* Search Bar */}
                      <div className='p-4 border-b bg-background sticky top-0 z-10 space-y-3'>
                        <div className='relative'>
                          <Search className='absolute left-3 top-1/2 transform -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground' />
                          <Input
                            type='text'
                            placeholder='Search reports by title...'
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className='pl-9 h-9 text-sm'
                          />
                        </div>
                        <div className='flex items-center gap-2 justify-end'>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button
                                variant='default'
                                size='sm'
                                className='gap-2'
                              >
                                <Filter className='h-4 w-4' />
                                Filter
                                <Badge variant='secondary' className='ml-1 h-4 px-1 text-[10px]'>
                                  {statusFilter === 'PENDING' ? 'OPEN' : 'CLOSED'}
                                </Badge>
                                <ChevronDown className='h-3 w-3' />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align='end'>
                              <DropdownMenuItem
                                onClick={() => setStatusFilter('PENDING')}
                                className={statusFilter === 'PENDING' ? 'bg-muted' : ''}
                              >
                                OPEN
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                onClick={() => setStatusFilter('CLOSED')}
                                className={statusFilter === 'CLOSED' ? 'bg-muted' : ''}
                              >
                                CLOSED
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </div>
                      </div>
                      {/* Reports List */}
                      <div className='overflow-y-auto flex-1'>
                        {!reportsData?.data || reportsData.data.length === 0 || Object.keys(groupedReports).length === 0 ? (
                          <div className='flex items-center justify-center h-64 text-muted-foreground p-4'>
                            <div className='text-center'>
                              <Flag className='h-12 w-12 mx-auto mb-2 opacity-50' />
                              <p>No reports found</p>
                            </div>
                          </div>
                        ) : (
                          Object.entries(groupedReports).map(
                        ([reasonKey, reports]) => {
                          const displayName =
                            (reports as Report[])[0]?.reportedReasonEntity
                              ?.displayName || reasonKey;
                          const isExpanded = expandedReasons[reasonKey] ?? true;
                          return (
                            <Collapsible
                              key={reasonKey}
                              open={isExpanded}
                              onOpenChange={(open) =>
                                setExpandedReasons((prev) => ({
                                  ...prev,
                                  [reasonKey]: open,
                                }))
                              }
                            >
                              {/* Reason Header */}
                              <CollapsibleTrigger asChild>
                                <div className='px-4 py-3 bg-muted/50 border-b sticky top-0 cursor-pointer hover:bg-muted/70 transition-colors'>
                                  <div className='flex items-center gap-2'>
                                    <ChevronDown
                                      className={`h-4 w-4 text-muted-foreground transition-transform ${
                                        isExpanded ? '' : '-rotate-90'
                                      }`}
                                    />
                                    <AlertTriangle className='h-4 w-4 text-amber-500' />
                                    <span className='font-medium text-sm'>
                                      {displayName}
                                    </span>
                                    <Badge variant='secondary' className='ml-auto'>
                                      {(reports as Report[]).length}
                                    </Badge>
                                  </div>
                                </div>
                              </CollapsibleTrigger>
                              {/* Reports in this group */}
                              <CollapsibleContent>
                                {(reports as Report[]).map((report) => {
                                  const isChecked = selectedReportIds.has(report.id);

                                  const handleClick = () => {
                                    setSelectedReportId(report.id);
                                  };

                                  const handleCheckboxChange = (checked: boolean | string) => {
                                    const nextChecked = Boolean(checked);
                                    setSelectedReportIds((prev) => {
                                      const newSet = new Set(prev);
                                      if (nextChecked) {
                                        newSet.add(report.id);
                                      } else {
                                        newSet.delete(report.id);
                                      }
                                      return newSet;
                                    });
                                  };

                                  return (
                                    <div
                                      key={report.id}
                                      onClick={handleClick}
                                      className={`px-4 py-3 border-b cursor-pointer transition-colors hover:bg-muted/50 flex items-start gap-3 ${
                                        selectedReportId === report.id ? 'bg-primary/5 border-l-4 border-l-primary' : ''
                                      }`}
                                    >
                                      <div
                                        className='mt-0.5'
                                        onClick={(e) => {
                                          e.stopPropagation();
                                        }}
                                      >
                                        <Checkbox
                                          checked={isChecked}
                                          onCheckedChange={handleCheckboxChange}
                                        />
                                      </div>
                                      <div className='flex-1 min-w-0'>
                                        <div className='flex items-start justify-between gap-2 mb-1'>
                                          <h4 className='font-medium text-sm line-clamp-1 overflow-hidden flex-1'>
                                            {report.title}
                                          </h4>
                                          <Badge
                                            variant={
                                              report.status === 'PENDING'
                                                ? 'secondary'
                                                : 'default'
                                            }
                                            className={`shrink-0 text-[10px] px-1.5 py-0 h-5 ${
                                              report.status === 'PENDING'
                                                ? 'bg-amber-500/10 text-amber-600 border-amber-500/20'
                                                : 'bg-green-500/10 text-green-600 border-green-500/20'
                                            }`}
                                          >
                                            {report.status === 'PENDING' ? 'OPEN' : 'CLOSED'}
                                          </Badge>
                                        </div>
                                        <p className='text-xs text-muted-foreground line-clamp-2 mb-2 overflow-hidden'>
                                          {report.description}
                                        </p>
                                        <div className='flex items-center justify-between gap-2 text-xs text-muted-foreground'>
                                          <div className='flex items-center gap-1.5 min-w-0 flex-1'>
                                            <User className='h-3 w-3 shrink-0' />
                                            <span className='truncate'>
                                              {report.createdBy?.firstName}{' '}
                                              {report.createdBy?.lastName}
                                            </span>
                                          </div>
                                          <span className='shrink-0'>
                                            {formatReportDateOnly(report.createdAt)}
                                          </span>
                                        </div>
                                      </div>
                                    </div>
                                  );
                                })}
                              </CollapsibleContent>
                            </Collapsible>
                          );
                        }
                        )
                        )}
                      </div>
                    </div>

                    {/* Right Panel - Report Details (2/3) */}
                    <div className='w-2/3 overflow-y-auto max-h-[600px]'>
                      {!reportsData?.data || reportsData.data.length === 0 ? (
                        <div className='h-full flex items-center justify-center text-muted-foreground p-6'>
                          <div className='text-center'>
                            <div className='h-20 w-20 mx-auto mb-4 rounded-full bg-muted/50 flex items-center justify-center'>
                              <Flag className='h-10 w-10 opacity-30' />
                            </div>
                            <p className='text-lg font-semibold text-foreground/70'>
                              No reports found
                            </p>
                            <p className='text-sm mt-1 max-w-[200px] mx-auto'>
                              There are no reports for this event
                            </p>
                          </div>
                        </div>
                      ) : selectedReport ? (
                        <div className='p-6 flex flex-col h-full min-h-[600px]'>
                          <div className='space-y-6 flex-1'>
                            {/* Header with Status */}
                            <div>
                              <div className='flex items-start justify-between gap-4 mb-1'>
                                <h2 className='text-xl font-bold leading-tight'>
                                  {selectedReport.title}
                                </h2>
                              <Badge
                                className={`shrink-0 ${
                                  selectedReport.status === 'PENDING'
                                    ? 'bg-amber-500/10 text-amber-600 border-amber-500/20'
                                    : 'bg-green-500/10 text-green-600 border-green-500/20'
                                }`}
                                variant='outline'
                              >
                                {selectedReport.status === 'PENDING' ? 'OPEN' : 'CLOSED'}
                              </Badge>
                              </div>
                              <div className='flex items-center gap-2 text-sm text-muted-foreground'>
                                <AlertTriangle className='h-3.5 w-3.5 text-amber-500' />
                                <span>{selectedReport.reportedReasonEntity?.displayName}</span>
                                <span>•</span>
                                <span>{formatReportDate(selectedReport.createdAt)}</span>
                              </div>
                            </div>

                            {/* Description */}
                            <div>
                              <h3 className='text-sm font-semibold text-muted-foreground uppercase tracking-wide mb-2'>
                                Report details
                              </h3>
                              <p className='text-sm leading-relaxed'>
                                {selectedReport.description || 'No description provided.'}
                              </p>
                            </div>

                            {/* Attached Images */}
                            {selectedReport.attachedImageUrls && selectedReport.attachedImageUrls.length > 0 && (
                              <div>
                                <h3 className='text-sm font-semibold text-muted-foreground uppercase tracking-wide mb-2'>
                                  Attachments
                                </h3>
                                <div className='grid grid-cols-3 gap-2'>
                                  {selectedReport.attachedImageUrls.map((url: string, index: number) => (
                                    <div
                                      key={index}
                                      className='relative h-20 rounded-md overflow-hidden border bg-muted cursor-pointer hover:opacity-90 transition-opacity'
                                      onClick={() => window.open(url, '_blank')}
                                    >
                                      {failedImages.has(url) ? (
                                        <div className='absolute inset-0 flex flex-col items-center justify-center text-muted-foreground'>
                                          <ImageIcon className='h-4 w-4 mb-0.5 opacity-50' />
                                          <span className='text-[10px]'>Failed</span>
                                        </div>
                                      ) : (
                                        <Image
                                          src={url}
                                          alt={`Attachment ${index + 1}`}
                                          fill
                                          className='object-cover'
                                          onError={() => {
                                            setFailedImages((prev) => new Set(prev).add(url));
                                          }}
                                        />
                                      )}
                                    </div>
                                  ))}
                                </div>
                              </div>
                            )}
                          </div>

                          {/* Divider */}
                          <div className='border-t my-6' />

                          {/* Reporter - Always at bottom */}
                          {selectedReport.createdBy && (
                            <div className='mt-auto'>
                              <h3 className='text-sm font-semibold text-muted-foreground uppercase tracking-wide mb-3'>
                                Reported By
                              </h3>
                              <div className='flex items-center gap-3'>
                                <Avatar className='h-10 w-10'>
                                  {selectedReport.createdBy.avatarUrl && (
                                    <AvatarImage
                                      src={selectedReport.createdBy.avatarUrl}
                                      alt={`${selectedReport.createdBy.firstName} ${selectedReport.createdBy.lastName}`}
                                    />
                                  )}
                                  <AvatarFallback className='bg-primary/10 text-primary font-medium text-sm'>
                                    {getInitials(
                                      selectedReport.createdBy.firstName,
                                      selectedReport.createdBy.lastName
                                    )}
                                  </AvatarFallback>
                                </Avatar>
                                <div className='flex-1 min-w-0'>
                                  <p className='font-medium text-sm'>
                                    {selectedReport.createdBy.firstName}{' '}
                                    {selectedReport.createdBy.lastName}
                                  </p>
                                  <p className='text-xs text-muted-foreground truncate'>
                                    {selectedReport.createdBy.email}
                                  </p>
                                </div>
                                <Button
                                  variant='outline'
                                  size='sm'
                                  asChild
                                  className='shrink-0 gap-2'
                                >
                                  <Link
                                    href={`/admin/reports?createdById=${selectedReport.createdBy.id}`}
                                  >
                                    <History className='h-3.5 w-3.5' />
                                    History
                                  </Link>
                                </Button>
                              </div>
                            </div>
                          )}
                        </div>
                      ) : (
                        <div className='h-full flex items-center justify-center text-muted-foreground p-6'>
                          <div className='text-center'>
                            <div className='h-20 w-20 mx-auto mb-4 rounded-full bg-muted/50 flex items-center justify-center'>
                              <Flag className='h-10 w-10 opacity-30' />
                            </div>
                            <p className='text-lg font-semibold text-foreground/70'>
                              Select a report
                            </p>
                            <p className='text-sm mt-1 max-w-[200px] mx-auto'>
                              Choose a report from the list on the left to view its details
                            </p>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
