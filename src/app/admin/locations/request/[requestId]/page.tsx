'use client';

import type React from 'react';
import { use, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import Link from 'next/link';

import { useLocationRequestByIdForAdmin } from '@/hooks/admin/useLocationRequestByIdForAdmin';
import { useProcessLocationRequest } from '@/hooks/admin/useProcessLocationRequest';

import {
  Loader2,
  ArrowLeft,
  Calendar,
  MapPin,
  User,
  FileText,
  ImageIcon,
  Phone,
  Mail,
  Building,
  Globe,
  Tag as TagIcon,
  CheckCircle2,
  XCircle,
  AlertCircle,
  ExternalLink,
  Copy,
} from 'lucide-react';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from '@/components/ui/card';
import { GoogleMapsPicker } from '@/components/shared/GoogleMapsPicker';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ImageViewer } from '@/components/shared/ImageViewer';
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
import { DisplayTags } from '@/components/shared/DisplayTags';
import { formatShortDate, formatDocumentType } from '@/lib/utils';
import { Separator } from '@/components/ui/separator';
import { PageContainer } from '@/components/shared/PageContainer';
import { PageHeader } from '@/components/shared/PageHeader';
import { StatCard } from '@/components/shared/StatCard';

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
        <p className='text-sm font-semibold text-muted-foreground mb-1'>
          {label}
        </p>
        <div className='text-base text-foreground break-words'>{value}</div>
      </div>
    </div>
  );
}

export default function AdminLocationRequestDetailsPage({
  params,
}: {
  params: Promise<{ requestId: string }>;
}) {
  const { requestId } = use(params);
  const router = useRouter();
  const queryClient = useQueryClient();

  const [isImageViewerOpen, setIsImageViewerOpen] = useState(false);
  const [currentImageSrc, setCurrentImageSrc] = useState('');
  const [currentImageAlt, setCurrentImageAlt] = useState('');
  const [showApproveDialog, setShowApproveDialog] = useState(false);
  const [showRejectDialog, setShowRejectDialog] = useState(false);
  const [adminNotes, setAdminNotes] = useState('');

  const {
    data: request,
    isLoading: isLoadingRequest,
    isError,
  } = useLocationRequestByIdForAdmin(requestId);
  const { mutate: processRequest, isPending: isProcessing } =
    useProcessLocationRequest();

  const isLoading = isLoadingRequest;
  const tags = request?.tags || [];

  const handleImageClick = (src: string, alt: string) => {
    setCurrentImageSrc(src);
    setCurrentImageAlt(alt);
    setIsImageViewerOpen(true);
  };

  const handleApprove = () => {
    if (!request) return;
    processRequest(
      { id: request.id, payload: { status: 'APPROVED' } },
      {
        onSuccess: () => {
          toast.success('Request approved successfully!');
          queryClient.invalidateQueries({
            queryKey: ['locationRequests'],
          });
          queryClient.invalidateQueries({
            queryKey: ['locationAdminRequest'],
          });
          setShowApproveDialog(false);
          router.push('/admin/location-requests');
        },
      }
    );
  };

  const handleReject = () => {
    if (!request) return;
    processRequest(
      {
        id: request.id,
        payload: { status: 'REJECTED', adminNotes: adminNotes },
      },
      {
        onSuccess: () => {
          toast.success('Request rejected.');
          queryClient.invalidateQueries({
            queryKey: ['locationRequests'],
          });
          queryClient.invalidateQueries({
            queryKey: ['locationAdminRequest'],
          });
          setShowRejectDialog(false);
          router.push('/admin/location-requests');
        },
      }
    );
  };

  if (isLoading) {
    return (
      <PageContainer>
        <div className='flex h-[60vh] items-center justify-center'>
          <div className='flex flex-col items-center gap-4'>
            <Loader2 className='h-8 w-8 animate-spin text-primary' />
            <p className='text-sm text-muted-foreground'>
              Loading request details...
            </p>
          </div>
        </div>
      </PageContainer>
    );
  }

  if (isError || !request) {
    return (
      <PageContainer>
        <Card className='border-destructive'>
          <CardContent className='pt-6'>
            <div className='flex flex-col items-center justify-center py-12 text-center'>
              <AlertCircle className='h-12 w-12 text-destructive mb-4' />
              <h2 className='text-xl font-semibold mb-2'>
                Error Loading Request
              </h2>
              <p className='text-muted-foreground mb-4'>
                Unable to load location request details. Please try again.
              </p>
              <Button onClick={() => router.back()} variant='outline'>
                <ArrowLeft className='h-4 w-4 mr-2' />
                Go Back
              </Button>
            </div>
          </CardContent>
        </Card>
      </PageContainer>
    );
  }

  const position = {
    lat: request.latitude,
    lng: request.longitude,
  };

  const statusBadge =
    request.status === 'AWAITING_ADMIN_REVIEW'
      ? 'Pending Review'
      : request.status === 'APPROVED'
      ? 'Approved'
      : request.status === 'REJECTED'
      ? 'Rejected'
      : request.status;

  const statusVariant =
    request.status === 'AWAITING_ADMIN_REVIEW'
      ? 'secondary'
      : request.status === 'APPROVED'
      ? 'default'
      : 'destructive';

  const isPending = request.status === 'AWAITING_ADMIN_REVIEW';

  // Calculate stats
  const imageCount = request.locationImageUrls?.length || 0;
  const documentCount =
    request.locationValidationDocuments?.reduce(
      (acc, doc) => acc + doc.documentImageUrls.length,
      0
    ) || 0;

  // Copy coordinates to clipboard
  const copyCoordinates = () => {
    const coords = `${request.latitude}, ${request.longitude}`;
    navigator.clipboard.writeText(coords);
    toast.success('Coordinates copied to clipboard');
  };

  // Open in Google Maps
  const openInGoogleMaps = () => {
    const url = `https://www.google.com/maps?q=${request.latitude},${request.longitude}`;
    window.open(url, '_blank');
  };

  // Action buttons for header
  const headerActions = (
    <div className='flex items-center gap-2'>
      <Button variant='outline' size='icon' onClick={() => router.back()}>
        <ArrowLeft className='h-4 w-4' />
      </Button>
      {isPending && (
        <>
          <Button
            variant='destructive'
            onClick={() => setShowRejectDialog(true)}
            disabled={isProcessing}
          >
            <XCircle className='h-4 w-4 mr-2' />
            Reject
          </Button>
          <Button
            onClick={() => setShowApproveDialog(true)}
            disabled={isProcessing}
            className='bg-green-600 hover:bg-green-700'
          >
            <CheckCircle2 className='h-4 w-4 mr-2' />
            Approve
          </Button>
        </>
      )}
    </div>
  );

  return (
    <PageContainer maxWidth='xl'>
      {/* Page Header */}
      <PageHeader
        title={request.name}
        description={
          <div className='flex flex-wrap items-center gap-3 mt-2'>
            <Badge variant={statusVariant as any} className='text-sm px-3 py-1'>
              {statusBadge}
            </Badge>
            <div className='flex items-center gap-2 text-sm text-muted-foreground'>
              <Calendar className='h-4 w-4' />
              <span>Submitted {formatShortDate(request.createdAt)}</span>
            </div>
            {request.processedBy && (
              <div className='flex items-center gap-2 text-sm text-muted-foreground'>
                <User className='h-4 w-4' />
                <span>
                  Processed by {request.processedBy.firstName}{' '}
                  {request.processedBy.lastName}
                </span>
              </div>
            )}
          </div>
        }
        icon={MapPin}
        actions={headerActions}
      />

      {/* Quick Stats Summary */}
      <div className='grid grid-cols-2 md:grid-cols-4 gap-4'>
        <StatCard
          title='Location Type'
          value={request.type === 'BUSINESS_OWNED' ? 'Business' : 'Public'}
          icon={request.type === 'BUSINESS_OWNED' ? Building : Globe}
          iconColor='text-blue-600 dark:text-blue-400'
          iconBg='bg-blue-100 dark:bg-blue-900/30'
        />
        <StatCard
          title='Images'
          value={imageCount}
          icon={ImageIcon}
          iconColor='text-purple-600 dark:text-purple-400'
          iconBg='bg-purple-100 dark:bg-purple-900/30'
        />
        <StatCard
          title='Documents'
          value={documentCount}
          icon={FileText}
          iconColor='text-orange-600 dark:text-orange-400'
          iconBg='bg-orange-100 dark:bg-orange-900/30'
        />
        <StatCard
          title='Tags'
          value={tags.length}
          icon={TagIcon}
          iconColor='text-green-600 dark:text-green-400'
          iconBg='bg-green-100 dark:bg-green-900/30'
        />
      </div>

      {/* Review Instructions Banner */}
      {isPending && (
        <Card className='border-2 border-blue-200 dark:border-blue-800 bg-gradient-to-r from-blue-50 to-blue-50/50 dark:from-blue-950/20 dark:to-blue-950/10 shadow-lg'>
          <CardContent className='pt-6'>
            <div className='flex items-start gap-4'>
              <div className='p-3 rounded-lg bg-blue-100 dark:bg-blue-900/30 shadow-sm flex-shrink-0'>
                <AlertCircle className='h-6 w-6 text-blue-600 dark:text-blue-400' />
              </div>
              <div className='flex-1'>
                <h3 className='font-bold text-lg text-blue-900 dark:text-blue-100 mb-2'>
                  Review Required
                </h3>
                <p className='text-sm text-blue-800 dark:text-blue-200 mb-4 leading-relaxed'>
                  Please review all sections below carefully before making a
                  decision. Verify the location details, images, documents, and
                  submitter information.
                </p>
                <div className='flex flex-wrap gap-2'>
                  <Badge
                    variant='outline'
                    className='text-xs bg-white/50 dark:bg-blue-950/30 border-blue-300 dark:border-blue-700'
                  >
                    <ImageIcon className='h-3 w-3 mr-1' />
                    {imageCount} Image{imageCount !== 1 ? 's' : ''}
                  </Badge>
                  <Badge
                    variant='outline'
                    className='text-xs bg-white/50 dark:bg-blue-950/30 border-blue-300 dark:border-blue-700'
                  >
                    <FileText className='h-3 w-3 mr-1' />
                    {documentCount} Document{documentCount !== 1 ? 's' : ''}
                  </Badge>
                  <Badge
                    variant='outline'
                    className='text-xs bg-white/50 dark:bg-blue-950/30 border-blue-300 dark:border-blue-700'
                  >
                    <TagIcon className='h-3 w-3 mr-1' />
                    {tags.length} Tag{tags.length !== 1 ? 's' : ''}
                  </Badge>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Main Content */}
      <div className='space-y-6'>
        {/* Request Overview */}
        <Card className='border-2 shadow-sm hover:shadow-md transition-shadow'>
          <CardHeader className='bg-gradient-to-r from-primary/5 to-transparent border-b'>
            <CardTitle className='flex items-center gap-2'>
              <div className='p-2 rounded-lg bg-primary/10'>
                <FileText className='h-5 w-5 text-primary' />
              </div>
              Request Overview
            </CardTitle>
            <CardDescription>
              Basic information about this location request
            </CardDescription>
          </CardHeader>
          <CardContent className='space-y-4'>
            <InfoRow
              label='Description'
              value={request.description || 'No description provided'}
              icon={FileText}
            />
            <Separator />
            <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
              <InfoRow
                label='Request Type'
                value={
                  <Badge variant='outline' className='w-fit'>
                    {request.type === 'BUSINESS_OWNED' ? (
                      <>
                        <Building className='h-3 w-3 mr-1' /> Business Owned
                      </>
                    ) : (
                      <>
                        <Globe className='h-3 w-3 mr-1' /> Public
                      </>
                    )}
                  </Badge>
                }
              />
              <InfoRow
                label='Radius'
                value={`${request.radiusMeters} meters`}
                icon={MapPin}
              />
            </div>
            {tags.length > 0 && (
              <>
                <Separator />
                <div className='flex gap-3 py-2'>
                  <TagIcon className='h-5 w-5 text-muted-foreground flex-shrink-0 mt-0.5' />
                  <div className='flex-1'>
                    <p className='text-sm font-semibold text-muted-foreground mb-2'>
                      Tags
                    </p>
                    <DisplayTags tags={tags} maxCount={10} />
                  </div>
                </div>
              </>
            )}
          </CardContent>
        </Card>

        {/* Address Information */}
        <Card className='border-2 shadow-sm hover:shadow-md transition-shadow'>
          <CardHeader className='bg-gradient-to-r from-primary/5 to-transparent border-b'>
            <CardTitle className='flex items-center gap-2'>
              <div className='p-2 rounded-lg bg-primary/10'>
                <MapPin className='h-5 w-5 text-primary' />
              </div>
              Address Information
            </CardTitle>
            <CardDescription>Location address and coordinates</CardDescription>
          </CardHeader>
          <CardContent className='space-y-4'>
            <InfoRow label='Street Address' value={request.addressLine} />
            <Separator />
            <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
              <InfoRow label='District' value={request.addressLevel1} />
              <InfoRow label='City/Province' value={request.addressLevel2} />
            </div>
            <Separator />
            <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
              <InfoRow label='Latitude' value={request.latitude.toString()} />
              <InfoRow label='Longitude' value={request.longitude.toString()} />
            </div>
            <Separator />
            <div className='pt-2'>
              <div className='flex items-center justify-between mb-2'>
                <p className='text-sm font-semibold text-muted-foreground'>
                  Map Location
                </p>
                <div className='flex gap-2'>
                  <Button
                    variant='ghost'
                    size='sm'
                    onClick={copyCoordinates}
                    className='h-8 text-xs'
                  >
                    <Copy className='h-3 w-3 mr-1' />
                    Copy Coords
                  </Button>
                  <Button
                    variant='ghost'
                    size='sm'
                    onClick={openInGoogleMaps}
                    className='h-8 text-xs'
                  >
                    <ExternalLink className='h-3 w-3 mr-1' />
                    Open Maps
                  </Button>
                </div>
              </div>
              <div className='h-64 rounded-lg overflow-hidden border'>
                <GoogleMapsPicker
                  position={position}
                  onPositionChange={() => {}}
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Location Images */}
        {request.locationImageUrls && request.locationImageUrls.length > 0 && (
          <Card className='border-2 shadow-sm hover:shadow-md transition-shadow'>
            <CardHeader className='bg-gradient-to-r from-primary/5 to-transparent border-b'>
              <CardTitle className='flex items-center gap-2'>
                <div className='p-2 rounded-lg bg-primary/10'>
                  <ImageIcon className='h-5 w-5 text-primary' />
                </div>
                Location Images
              </CardTitle>
              <CardDescription>
                {request.locationImageUrls.length} image
                {request.locationImageUrls.length !== 1 ? 's' : ''} provided
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className='grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4'>
                {request.locationImageUrls.map((url, index) => (
                  <div
                    key={index}
                    className='relative aspect-video rounded-lg overflow-hidden border cursor-pointer group hover:border-primary transition-all'
                    onClick={() =>
                      handleImageClick(url, `Location Image ${index + 1}`)
                    }
                  >
                    <img
                      src={url || '/placeholder.svg'}
                      alt={`Location ${index + 1}`}
                      className='w-full h-full object-cover group-hover:scale-105 transition-transform duration-200'
                    />
                    <div className='absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors flex items-center justify-center'>
                      <ImageIcon className='h-6 w-6 text-white opacity-0 group-hover:opacity-100 transition-opacity' />
                    </div>
                    <div className='absolute top-2 right-2 bg-black/60 text-white text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity'>
                      #{index + 1}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Validation Documents */}
        {request.locationValidationDocuments &&
          request.locationValidationDocuments.length > 0 && (
            <Card className='border-2 shadow-sm hover:shadow-md transition-shadow'>
              <CardHeader className='bg-gradient-to-r from-primary/5 to-transparent border-b'>
                <CardTitle className='flex items-center gap-2'>
                  <div className='p-2 rounded-lg bg-primary/10'>
                    <FileText className='h-5 w-5 text-primary' />
                  </div>
                  Validation Documents
                </CardTitle>
                <CardDescription>
                  Required documents for location validation
                </CardDescription>
              </CardHeader>
              <CardContent className='space-y-6'>
                {request.locationValidationDocuments.map((doc, docIndex) => (
                  <div key={docIndex} className='space-y-3'>
                    {docIndex > 0 && <Separator />}
                    <div>
                      <p className='font-semibold text-sm mb-3'>
                        {formatDocumentType(doc.documentType)}
                      </p>
                      <div className='grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4'>
                        {doc.documentImageUrls.map((url, imgIndex) => (
                          <div
                            key={imgIndex}
                            className='relative aspect-[4/3] rounded-lg overflow-hidden border cursor-pointer group hover:border-primary transition-all'
                            onClick={() =>
                              handleImageClick(
                                url,
                                `${formatDocumentType(
                                  doc.documentType
                                )} - Document ${imgIndex + 1}`
                              )
                            }
                          >
                            <img
                              src={url || '/placeholder.svg'}
                              alt={`Document ${imgIndex + 1}`}
                              className='w-full h-full object-cover group-hover:scale-105 transition-transform duration-200'
                            />
                            <div className='absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors flex items-center justify-center'>
                              <FileText className='h-6 w-6 text-white opacity-0 group-hover:opacity-100 transition-opacity' />
                            </div>
                            <div className='absolute top-2 right-2 bg-black/60 text-white text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity'>
                              #{imgIndex + 1}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          )}

        {/* Submitter Information */}
        {request.createdBy && (
          <Card className='border-2 shadow-sm hover:shadow-md transition-shadow'>
            <CardHeader className='bg-gradient-to-r from-primary/5 to-transparent border-b'>
              <CardTitle className='flex items-center gap-2'>
                <div className='p-2 rounded-lg bg-primary/10'>
                  <User className='h-5 w-5 text-primary' />
                </div>
                Submitter Information
              </CardTitle>
              <CardDescription>
                Information about the person who submitted this request
              </CardDescription>
            </CardHeader>
            <CardContent className='space-y-4'>
              <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
                <InfoRow
                  label='Full Name'
                  value={`${request.createdBy.firstName} ${request.createdBy.lastName}`}
                  icon={User}
                />
                <InfoRow
                  label='Email'
                  value={
                    <a
                      href={`mailto:${request.createdBy.email}`}
                      className='text-primary hover:underline'
                    >
                      {request.createdBy.email}
                    </a>
                  }
                  icon={Mail}
                />
              </div>
              <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
                <InfoRow
                  label='Phone Number'
                  value={
                    <a
                      href={`tel:${request.createdBy.phoneNumber}`}
                      className='text-primary hover:underline'
                    >
                      {request.createdBy.phoneNumber}
                    </a>
                  }
                  icon={Phone}
                />
              </div>
              {request.createdBy.businessProfile && (
                <>
                  <Separator />
                  <div className='pt-2'>
                    <div className='flex items-center gap-2 mb-3'>
                      <Building className='h-4 w-4 text-muted-foreground' />
                      <p className='text-sm font-semibold'>Business Profile</p>
                    </div>
                    <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
                      <InfoRow
                        label='Business Name'
                        value={request.createdBy.businessProfile.name}
                      />
                      <InfoRow
                        label='Business Email'
                        value={
                          <a
                            href={`mailto:${request.createdBy.businessProfile.email}`}
                            className='text-primary hover:underline'
                          >
                            {request.createdBy.businessProfile.email}
                          </a>
                        }
                        icon={Mail}
                      />
                    </div>
                    <div className='grid grid-cols-1 md:grid-cols-2 gap-4 mt-4'>
                      <InfoRow
                        label='Category'
                        value={
                          <Badge variant='outline' className='w-fit'>
                            {request.createdBy.businessProfile.category}
                          </Badge>
                        }
                      />
                      {request.createdBy.businessProfile.accountId && (
                        <div className='pt-2'>
                          <Link
                            href={`/admin/business/${request.createdBy.businessProfile.accountId}`}
                          >
                            <Button
                              variant='outline'
                              size='sm'
                              className='w-full sm:w-auto'
                            >
                              <Building className='h-4 w-4 mr-2' />
                              View Business Account
                              <ExternalLink className='h-3 w-3 ml-2' />
                            </Button>
                          </Link>
                        </div>
                      )}
                    </div>
                  </div>
                </>
              )}
            </CardContent>
          </Card>
        )}

        {/* Admin Notes (if exists) */}
        {request.adminNotes && (
          <Card className='border-yellow-200 bg-yellow-50 dark:bg-yellow-950/20 dark:border-yellow-800'>
            <CardHeader>
              <CardTitle className='text-yellow-900 dark:text-yellow-100 flex items-center gap-2'>
                <AlertCircle className='h-5 w-5' />
                Admin Notes
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className='text-yellow-900 dark:text-yellow-100'>
                {request.adminNotes}
              </p>
            </CardContent>
          </Card>
        )}

        {/* Action Buttons - Sticky at Bottom (for mobile) */}
        {isPending && (
          <Card className='sticky bottom-6 border-2 border-primary/20 bg-background shadow-lg z-10 lg:hidden'>
            <CardContent className='pt-6'>
              <div className='flex flex-col sm:flex-row items-stretch sm:items-center gap-3'>
                <Button
                  variant='destructive'
                  onClick={() => setShowRejectDialog(true)}
                  disabled={isProcessing}
                  className='flex-1'
                  size='lg'
                >
                  <XCircle className='h-4 w-4 mr-2' />
                  Reject Request
                </Button>
                <Button
                  onClick={() => setShowApproveDialog(true)}
                  disabled={isProcessing}
                  className='flex-1 bg-green-600 hover:bg-green-700'
                  size='lg'
                >
                  <CheckCircle2 className='h-4 w-4 mr-2' />
                  Approve Request
                </Button>
              </div>
              {isProcessing && (
                <div className='mt-3 flex items-center justify-center gap-2 text-xs text-muted-foreground'>
                  <Loader2 className='h-3 w-3 animate-spin' />
                  Processing your decision...
                </div>
              )}
            </CardContent>
          </Card>
        )}
      </div>

      {/* Image Viewer */}
      <ImageViewer
        src={currentImageSrc}
        alt={currentImageAlt}
        open={isImageViewerOpen}
        onOpenChange={setIsImageViewerOpen}
      />

      {/* Approve Dialog */}
      <AlertDialog open={showApproveDialog} onOpenChange={setShowApproveDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Approve this request?</AlertDialogTitle>
            <AlertDialogDescription>
              This action will approve the location request and make it publicly
              available. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleApprove}
              disabled={isProcessing}
              className='bg-green-600 hover:bg-green-700'
            >
              {isProcessing && (
                <Loader2 className='mr-2 h-4 w-4 animate-spin' />
              )}
              Confirm Approve
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Reject Dialog */}
      <AlertDialog open={showRejectDialog} onOpenChange={setShowRejectDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Reject this request?</AlertDialogTitle>
            <AlertDialogDescription>
              Please provide a reason for rejection. This note will be visible
              to the submitter.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className='py-4'>
            <Textarea
              placeholder='Enter rejection reason...'
              value={adminNotes}
              onChange={(e) => setAdminNotes(e.target.value)}
              className='min-h-[100px]'
            />
          </div>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleReject}
              disabled={isProcessing || !adminNotes.trim()}
              className='bg-red-600 hover:bg-red-700'
            >
              {isProcessing && (
                <Loader2 className='mr-2 h-4 w-4 animate-spin' />
              )}
              Confirm Reject
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </PageContainer>
  );
}
