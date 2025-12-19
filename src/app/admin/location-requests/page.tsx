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
  IconSearch,
  IconFilter,
  IconMapPin,
  IconClock,
  IconCheck,
  IconX,
  IconRefresh,
  IconUser,
  IconFileText,
  IconCalendar,
  IconBuilding,
  IconWorld,
  IconMail,
  IconPhone,
  IconRuler,
  IconChevronRight,
} from '@tabler/icons-react';
import { Badge } from '@/components/ui/badge';
import {
  CheckCircle,
  Clock,
  Loader2,
  MapPin,
  MapPinOff,
  XCircle,
} from 'lucide-react';
import { LocationRequest, LocationStatus } from '@/types';
import { useLocationAdminRequests } from '@/hooks/admin/useLocationAdminRequests';
import { useLocationRequestByIdForAdmin } from '@/hooks/admin/useLocationRequestByIdForAdmin';
import { useProcessLocationRequest } from '@/hooks/admin/useProcessLocationRequest';
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
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import Image from 'next/image';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import StatisticCard from '@/components/admin/StatisticCard';
import {
  APIProvider,
  Map,
  AdvancedMarker,
  Pin,
} from '@vis.gl/react-google-maps';

type StatusFilter = 'all' | 'PENDING' | 'APPROVED' | 'REJECTED';

export default function LocationRequestsPage() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const queryClient = useQueryClient();

  // Initialize state from URL params or defaults
  const [searchTerm, setSearchTerm] = useState(
    searchParams.get('search') || ''
  );
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
  const getRequestStatus = (): LocationStatus | undefined => {
    if (statusFilter === 'all') return undefined;
    if (statusFilter === 'PENDING') return 'AWAITING_ADMIN_REVIEW';
    if (statusFilter === 'APPROVED') return 'APPROVED';
    return 'REJECTED';
  };

  const {
    data: response,
    isLoading,
    isFetching,
  } = useLocationAdminRequests(
    page,
    itemsPerPage,
    debouncedSearchTerm.trim() || undefined,
    getRequestStatus(),
    'createdAt:DESC'
  );
  const requests = response?.data || [];
  const meta = response?.meta;

  const { mutate: processRequest, isPending } = useProcessLocationRequest();

  const [selectedRequestId, setSelectedRequestId] = useState<string | null>(
    null
  );
  const [approvingRequest, setApprovingRequest] =
    useState<LocationRequest | null>(null);
  const [rejectingRequest, setRejectingRequest] =
    useState<LocationRequest | null>(null);
  const [adminNotes, setAdminNotes] = useState('');
  const [expandedDescription, setExpandedDescription] = useState(false);
  const [selectedDocument, setSelectedDocument] = useState<any | null>(null);

  // Fetch full details of selected request
  const { data: selectedRequestData } =
    useLocationRequestByIdForAdmin(selectedRequestId);
  const selectedRequest = selectedRequestData || null;

  const handleConfirmApprove = () => {
    if (!approvingRequest) return;
    processRequest(
      { id: approvingRequest.id, payload: { status: 'APPROVED' } },
      {
        onSuccess: () => {
          setStatusFilter('APPROVED');
          setPage(1);
          queryClient.invalidateQueries({ queryKey: ['locationRequests'] });
          queryClient.invalidateQueries({ queryKey: ['locationAdminRequest'] });
          setApprovingRequest(null);
        },
      }
    );
  };

  const handleConfirmReject = () => {
    if (!rejectingRequest) return;
    processRequest(
      {
        id: rejectingRequest.id,
        payload: { status: 'REJECTED', adminNotes: adminNotes },
      },
      {
        onSuccess: () => {
          setStatusFilter('REJECTED');
          setPage(1);
          queryClient.invalidateQueries({ queryKey: ['locationRequests'] });
          queryClient.invalidateQueries({ queryKey: ['locationAdminRequest'] });
          setRejectingRequest(null);
          setAdminNotes('');
        },
      }
    );
  };

  const refresh = () => {
    queryClient.invalidateQueries({ queryKey: ['locationRequests'] });
    queryClient.invalidateQueries({ queryKey: ['locationAdminRequest'] });
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
  const { data: pendingResponse } = useLocationAdminRequests(
    1,
    1,
    undefined,
    'AWAITING_ADMIN_REVIEW',
    'createdAt:DESC'
  );

  const { data: approvedResponse } = useLocationAdminRequests(
    1,
    1,
    undefined,
    'APPROVED',
    'createdAt:DESC'
  );

  const { data: rejectedResponse } = useLocationAdminRequests(
    1,
    1,
    undefined,
    'REJECTED',
    'createdAt:DESC'
  );

  // Calculate statistics from API data
  const stats = useMemo(() => {
    const pending = pendingResponse?.meta?.totalItems || 0;
    const approved = approvedResponse?.meta?.totalItems || 0;
    const rejected = rejectedResponse?.meta?.totalItems || 0;
    const total = pending + approved + rejected;

    return {
      total,
      pending,
      approved,
      rejected,
    };
  }, [
    pendingResponse?.meta?.totalItems,
    approvedResponse?.meta?.totalItems,
    rejectedResponse?.meta?.totalItems,
  ]);

  const getStatusBadge = (status: LocationStatus) => {
    const statusUpper = status?.toUpperCase();
    if (statusUpper === 'AWAITING_ADMIN_REVIEW' || statusUpper === 'PENDING') {
      return (
        <Badge
          variant='outline'
          className='px-2.5 py-0.5 bg-yellow-50 text-yellow-700 border-yellow-200 dark:bg-yellow-950 dark:text-yellow-400 dark:border-yellow-800'
        >
          Pending
        </Badge>
      );
    }
    if (statusUpper === 'APPROVED') {
      return (
        <Badge
          variant='outline'
          className='px-2.5 py-0.5 bg-green-50 text-green-700 border-green-200 dark:bg-green-950 dark:text-green-400 dark:border-green-800'
        >
          Approved
        </Badge>
      );
    }
    if (statusUpper === 'REJECTED') {
      return (
        <Badge
          variant='outline'
          className='px-2.5 py-0.5 bg-red-50 text-red-700 border-red-200 dark:bg-red-950 dark:text-red-400 dark:border-red-800'
        >
          Rejected
        </Badge>
      );
    }
    return (
      <Badge variant='outline' className='px-2.5 py-0.5'>
        {status || 'Unknown'}
      </Badge>
    );
  };

  const getInitials = (firstName: string, lastName: string) => {
    return `${firstName?.[0] || ''}${lastName?.[0] || ''}`.toUpperCase();
  };

  return (
    <div className='space-y-6'>
      {/* Statistics Cards */}
      <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4'>
        <StatisticCard
          title='Total Requests'
          subtitle='All location requests'
          value={stats.total}
          icon={MapPin}
          iconColorClass='blue'
        />

        <StatisticCard
          title='Pending'
          subtitle='Awaiting review'
          value={stats.pending}
          icon={Clock}
          iconColorClass='amber'
        />

        <StatisticCard
          title='Approved'
          subtitle='Approved requests'
          value={stats.approved}
          icon={CheckCircle}
          iconColorClass='green'
        />

        <StatisticCard
          title='Rejected'
          subtitle='Rejected requests'
          value={stats.rejected}
          icon={XCircle}
          iconColorClass='red'
        />
      </div>

      {/* Two Column Layout */}
      <div className='grid grid-cols-1 lg:grid-cols-12 gap-6 h-[calc(100vh-280px)]'>
        {/* Left Column - Request List */}
        <div className='lg:col-span-5 xl:col-span-4 flex flex-col border rounded-lg bg-card overflow-hidden'>
          {/* Search and Filters */}
          <div className='p-4 border-b space-y-3'>
            <div className='flex items-center justify-between'>
              <h2 className='text-lg font-semibold'>All Requests</h2>
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
              <IconSearch className='absolute left-2.5 top-4 h-4 w-4 text-muted-foreground' />
              <Input
                placeholder='Search requests...'
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
                setStatusFilter(value as StatusFilter);
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
                <SelectItem value='all'>All</SelectItem>
                <SelectItem value='PENDING'>Pending</SelectItem>
                <SelectItem value='APPROVED'>Approved</SelectItem>
                <SelectItem value='REJECTED'>Rejected</SelectItem>
              </SelectContent>
            </Select>
            <div className='text-sm text-muted-foreground'>
              {meta?.totalItems || 0} results
            </div>
          </div>

          {/* Request List */}
          <div className='flex-1 overflow-y-auto'>
            {isLoading ? (
              <div className='flex items-center justify-center h-64'>
                <Loader2 className='h-8 w-8 animate-spin text-muted-foreground' />
              </div>
            ) : requests.length === 0 ? (
              <div className='flex items-center justify-center h-64 text-muted-foreground'>
                <div className='text-center'>
                  <MapPinOff className='h-12 w-12 mx-auto mb-2 opacity-50' />
                  <p>No requests found</p>
                </div>
              </div>
            ) : (
              <div className='divide-y'>
                {requests.map((req: LocationRequest, index: number) => (
                  <div
                    key={req.id}
                    onClick={() => {
                      setSelectedRequestId(req.id);
                      setExpandedDescription(false);
                    }}
                    className={`p-4 cursor-pointer hover:bg-muted/50 transition-colors ${
                      selectedRequestId === req.id
                        ? 'bg-muted border-l-4 border-l-primary'
                        : ''
                    }`}
                  >
                    <div className='flex items-start justify-between mb-2'>
                      <h3 className='font-semibold text-base line-clamp-1'>
                        {req.name}
                      </h3>
                      {getStatusBadge(req.status)}
                    </div>
                    <p className='text-sm text-muted-foreground mb-1'>
                      {req.addressLine}
                    </p>
                    <div className='flex items-center justify-between mt-2'>
                      <span className='text-xs text-muted-foreground'>
                        {formatDateTime(req.createdAt)}
                      </span>
                      <Badge variant='secondary' className='text-xs'>
                        {req.type === 'BUSINESS_OWNED' ? (
                          <IconBuilding className='h-3 w-3 mr-1' />
                        ) : (
                          <IconWorld className='h-3 w-3 mr-1' />
                        )}
                        {req.type === 'BUSINESS_OWNED' ? 'Business' : 'Public'}
                      </Badge>
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
          {selectedRequest ? (
            <div className='h-full overflow-y-auto'>
              <div className='p-6'>
                {/* Header with Name and Actions */}
                <div className='flex items-start justify-between mb-4'>
                  <div className='flex-1'>
                    <div className='flex items-start gap-4'>
                      {selectedRequest.locationImageUrls &&
                      selectedRequest.locationImageUrls.length > 0 ? (
                        <div className='relative w-16 h-16 rounded-lg overflow-hidden border flex-shrink-0'>
                          <Image
                            src={selectedRequest.locationImageUrls[0]}
                            alt={selectedRequest.name}
                            fill
                            className='object-cover'
                            sizes='64px'
                          />
                        </div>
                      ) : (
                        <div className='w-16 h-16 rounded-lg bg-muted border flex items-center justify-center flex-shrink-0'>
                          <IconMapPin className='h-8 w-8 text-muted-foreground' />
                        </div>
                      )}
                      <div className='flex-1'>
                        <h1 className='text-3xl font-bold mb-1 text-primary'>
                          {selectedRequest.name}
                        </h1>
                        <p className='text-sm text-muted-foreground'>
                          {formatDateTime(selectedRequest.createdAt)}
                        </p>
                      </div>
                    </div>

                    {/* Description - Truncated */}
                    {selectedRequest.description && (
                      <div className='mt-4'>
                        <p
                          className={`text-sm text-muted-foreground ${
                            !expandedDescription ? 'line-clamp-2' : ''
                          }`}
                        ></p>
                        {selectedRequest.description.length > 150 && (
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
                  {selectedRequest.status === 'AWAITING_ADMIN_REVIEW' && (
                    <div className='flex gap-2 ml-4'>
                      <Button
                        variant='outline'
                        size='sm'
                        onClick={() => setApprovingRequest(selectedRequest)}
                        className='border-green-600 text-green-700 hover:bg-green-50 hover:text-green-800'
                      >
                        <IconCheck className='h-4 w-4 mr-1' />
                        Approve
                      </Button>
                      <Button
                        variant='outline'
                        size='sm'
                        onClick={() => setRejectingRequest(selectedRequest)}
                        className='border-red-600 text-red-700 hover:bg-red-50 hover:text-red-800'
                      >
                        <IconX className='h-4 w-4 mr-1' />
                        Reject
                      </Button>
                    </div>
                  )}
                </div>

                {/* Two Column Grid */}
                <div className='grid grid-cols-1 md:grid-cols-2 gap-4 mt-6'>
                  {/* Location Information Card */}
                  <Card>
                    <CardContent className='space-y-4'>
                      {selectedRequest.description && (
                        <div className='space-y-2'>
                          <div className='flex items-center gap-2'>
                            <IconFileText className='h-4 w-4 text-muted-foreground' />
                            <p className='text-sm font-semibold'>Description</p>
                          </div>
                          <p className='text-sm text-muted-foreground pl-6'>
                            {selectedRequest.description}
                          </p>
                        </div>
                      )}
                      <div className='flex items-start gap-2'>
                        <IconMapPin className='h-4 w-4 text-muted-foreground mt-0.5 flex-shrink-0' />
                        <div className='space-y-1 flex-1'>
                          <p className='text-sm font-semibold'>Address</p>
                          <p className='text-sm text-muted-foreground'>
                            {selectedRequest.addressLine},{' '}
                            {selectedRequest.addressLevel1},{' '}
                            {selectedRequest.addressLevel2}
                          </p>
                        </div>
                      </div>
                      {selectedRequest.radiusMeters && (
                        <div className='flex items-center gap-2'>
                          <IconRuler className='h-4 w-4 text-muted-foreground flex-shrink-0' />
                          <div className='space-y-1 flex-1'>
                            <p className='text-sm font-semibold'>Radius</p>
                            <p className='text-sm text-muted-foreground'>
                              {selectedRequest.radiusMeters} meters
                            </p>
                          </div>
                        </div>
                      )}
                    </CardContent>
                  </Card>

                  {/* Submission Details Card */}
                  <Card>
                    <CardContent className='space-y-4'>
                      {selectedRequest.createdBy && (
                        <div className='flex flex-col items-center gap-3'>
                          <Avatar className='h-20 w-20 border-2 border-background'>
                            {selectedRequest.createdBy.avatarUrl && (
                              <AvatarImage
                                src={selectedRequest.createdBy.avatarUrl}
                                alt={`avatar`}
                                className='object-cover'
                              />
                            )}
                            <AvatarFallback className='bg-primary/10 text-primary font-semibold text-base'>
                              {getInitials(
                                selectedRequest.createdBy.firstName || 'N/A',
                                selectedRequest.createdBy.lastName || 'N/A'
                              )}
                            </AvatarFallback>
                          </Avatar>
                          <div className='text-center space-y-1'>
                            <p className='text-sm font-medium'>
                              {selectedRequest.createdBy.firstName}{' '}
                              {selectedRequest.createdBy.lastName}
                            </p>
                            {selectedRequest.createdBy.email && (
                              <p className='text-xs text-muted-foreground break-all'>
                                {selectedRequest.createdBy.email}
                              </p>
                            )}
                          </div>
                          <div className='flex items-center gap-2 w-full justify-center pt-2'>
                            <Button
                              variant='outline'
                              size='sm'
                              className='flex-1 max-w-[100px]'
                            >
                              <IconUser className='h-4 w-4 mr-1' />
                              Profile
                            </Button>
                            <Button
                              variant='outline'
                              size='sm'
                              className='flex-1 max-w-[100px]'
                            >
                              <IconMail className='h-4 w-4 mr-1' />
                              Contact
                            </Button>
                            <Button
                              variant='outline'
                              size='sm'
                              className='flex-1 max-w-[100px]'
                            >
                              <IconFileText className='h-4 w-4 mr-1' />
                              Details
                            </Button>
                          </div>
                        </div>
                      )}
                    </CardContent>
                  </Card>

                  {/* Documents Card */}
                  {selectedRequest.locationValidationDocuments &&
                    selectedRequest.locationValidationDocuments.length > 0 && (
                      <Card>
                        <CardHeader>
                          <CardTitle className='text-base flex items-center gap-2'>
                            <IconFileText className='h-4 w-4' />
                            Documents
                          </CardTitle>
                        </CardHeader>
                        <CardContent className='space-y-2'>
                          {selectedRequest.locationValidationDocuments.map(
                            (doc: any, docIndex: number) => (
                              <Button
                                key={docIndex}
                                variant='outline'
                                className='w-full justify-start h-auto py-3 px-4 bg-primary/10 border-primary/20 hover:bg-primary/20 hover:border-primary/30'
                                onClick={() => setSelectedDocument(doc)}
                              >
                                <IconFileText className='h-4 w-4 mr-2' />
                                <span className='text-sm'>
                                  {doc.documentType
                                    ?.toLowerCase()
                                    .replace(/_/g, ' ') || 'Document'}
                                </span>
                                <IconChevronRight className='h-4 w-4 ml-auto' />
                              </Button>
                            )
                          )}
                        </CardContent>
                      </Card>
                    )}

                  {/* Admin Notes Card */}
                  {selectedRequest.adminNotes && (
                    <Card>
                      <CardHeader>
                        <CardTitle className='text-base flex items-center gap-2'>
                          <IconFileText className='h-4 w-4' />
                          Admin Notes
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <p className='text-sm whitespace-pre-wrap'>
                          {selectedRequest.adminNotes}
                        </p>
                      </CardContent>
                    </Card>
                  )}
                </div>

                {/* Location Images - Full Width */}
                {selectedRequest.locationImageUrls &&
                  selectedRequest.locationImageUrls.length > 0 && (
                    <Card className='mt-4'>
                      <CardContent>
                        <div className='grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3'>
                          {selectedRequest.locationImageUrls.map(
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
                                  alt={`Location image ${index + 1}`}
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

                {/* Map - Full Width */}
                {(() => {
                  const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;
                  const latValue =
                    typeof selectedRequest.latitude === 'number'
                      ? selectedRequest.latitude
                      : parseFloat(selectedRequest.latitude || '0');
                  const lngValue =
                    typeof selectedRequest.longitude === 'number'
                      ? selectedRequest.longitude
                      : parseFloat(selectedRequest.longitude || '0');
                  const lat = latValue;
                  const lng = lngValue;
                  const hasValidCoords =
                    !isNaN(lat) && !isNaN(lng) && lat !== 0 && lng !== 0;
                  const mapCenter = hasValidCoords ? { lat, lng } : null;

                  return (
                    <Card className='mt-4'>
                      <CardContent>
                        <div className='h-[400px] w-full rounded-lg overflow-hidden border'>
                          {apiKey && hasValidCoords && mapCenter ? (
                            <APIProvider apiKey={apiKey}>
                              <Map
                                defaultCenter={mapCenter}
                                defaultZoom={15}
                                mapId='location-request-map'
                                gestureHandling='none'
                                disableDefaultUI={true}
                              >
                                <AdvancedMarker
                                  position={mapCenter}
                                  title={selectedRequest.name}
                                >
                                  <Pin
                                    background='#ef4444'
                                    borderColor='#991b1b'
                                    glyphColor='#fff'
                                    scale={1.2}
                                  />
                                </AdvancedMarker>
                              </Map>
                            </APIProvider>
                          ) : (
                            <div className='flex items-center justify-center h-full bg-muted text-muted-foreground'>
                              <div className='text-center'>
                                <MapPin className='h-12 w-12 mx-auto mb-2 opacity-20' />
                                <p className='text-sm'>
                                  {!apiKey
                                    ? 'Map unavailable - API key missing'
                                    : !hasValidCoords
                                    ? 'Map unavailable - Invalid coordinates'
                                    : 'Map unavailable'}
                                </p>
                              </div>
                            </div>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  );
                })()}
              </div>
            </div>
          ) : (
            <div className='h-full flex items-center justify-center text-muted-foreground'>
              <div className='text-center'>
                <MapPinOff className='h-16 w-16 mx-auto mb-4 opacity-20' />
                <p className='text-lg font-medium'>Select a request</p>
                <p className='text-sm mt-1'>
                  Choose a request from the list to view details
                </p>
              </div>
            </div>
          )}
        </div>
      </div>

      <AlertDialog
        open={!!approvingRequest}
        onOpenChange={() => setApprovingRequest(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Approve this Location Request?</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to approve the location request &quot;
              {approvingRequest?.name}&quot;?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleConfirmApprove}
              disabled={isPending}
            >
              {isPending && <Loader2 className='mr-2 h-4 w-4 animate-spin' />}
              Confirm Approve
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog
        open={!!rejectingRequest}
        onOpenChange={() => setRejectingRequest(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Reject this Location Request?</AlertDialogTitle>
            <AlertDialogDescription>
              Please provide a reason for rejecting &quot;
              {rejectingRequest?.name}&quot;.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <Textarea
            placeholder='Reason for rejection...'
            value={adminNotes}
            onChange={(e) => setAdminNotes(e.target.value)}
            className='mt-4'
          />
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleConfirmReject}
              disabled={isPending}
            >
              {isPending && <Loader2 className='mr-2 h-4 w-4 animate-spin' />}
              Confirm Reject
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Document Images Modal */}
      <Dialog
        open={!!selectedDocument}
        onOpenChange={(open) => !open && setSelectedDocument(null)}
      >
        <DialogContent className='max-w-4xl max-h-[90vh] overflow-y-auto'>
          <DialogHeader>
            <DialogTitle className='flex items-center gap-2'>
              <IconFileText className='h-5 w-5' />
              {selectedDocument?.documentType?.replace(/_/g, ' ') || 'Document'}
            </DialogTitle>
            <DialogDescription>
              View all images for this document
            </DialogDescription>
          </DialogHeader>
          {selectedDocument?.documentImageUrls &&
            selectedDocument.documentImageUrls.length > 0 && (
              <div className='space-y-4 mt-4'>
                {/* First 2 large images */}
                {selectedDocument.documentImageUrls.length >= 2 && (
                  <div className='grid grid-cols-2 gap-4'>
                    {selectedDocument.documentImageUrls
                      .slice(0, 2)
                      .map((url: string, imgIndex: number) => (
                        <a
                          key={imgIndex}
                          href={url}
                          target='_blank'
                          rel='noopener noreferrer'
                          className='group relative aspect-square rounded-lg overflow-hidden border hover:border-primary transition-colors'
                        >
                          <Image
                            src={url}
                            alt={`${selectedDocument.documentType} ${
                              imgIndex + 1
                            }`}
                            fill
                            className='object-cover'
                            sizes='(max-width: 768px) 50vw, 25vw'
                          />
                          <div className='absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors' />
                        </a>
                      ))}
                  </div>
                )}

                {/* Remaining images in smaller grid */}
                {selectedDocument.documentImageUrls.length > 2 && (
                  <div className='grid grid-cols-3 gap-3'>
                    {selectedDocument.documentImageUrls
                      .slice(2)
                      .map((url: string, imgIndex: number) => (
                        <a
                          key={imgIndex + 2}
                          href={url}
                          target='_blank'
                          rel='noopener noreferrer'
                          className='group relative aspect-square rounded-lg overflow-hidden border hover:border-primary transition-colors'
                        >
                          <Image
                            src={url}
                            alt={`${selectedDocument.documentType} ${
                              imgIndex + 3
                            }`}
                            fill
                            className='object-cover'
                            sizes='(max-width: 768px) 33vw, 20vw'
                          />
                          <div className='absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors' />
                        </a>
                      ))}
                  </div>
                )}

                {/* If only 1 image, show it large */}
                {selectedDocument.documentImageUrls.length === 1 && (
                  <div className='w-full'>
                    <a
                      href={selectedDocument.documentImageUrls[0]}
                      target='_blank'
                      rel='noopener noreferrer'
                      className='group relative aspect-square rounded-lg overflow-hidden border hover:border-primary transition-colors block'
                    >
                      <Image
                        src={selectedDocument.documentImageUrls[0]}
                        alt={`${selectedDocument.documentType} 1`}
                        fill
                        className='object-cover'
                        sizes='(max-width: 768px) 100vw, 50vw'
                      />
                      <div className='absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors' />
                    </a>
                  </div>
                )}
              </div>
            )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
