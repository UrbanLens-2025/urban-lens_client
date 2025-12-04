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
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
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
import { formatShortDate } from '@/lib/utils';
import { Separator } from '@/components/ui/separator';

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
        <Icon className='h-4 w-4 text-muted-foreground flex-shrink-0 mt-0.5' />
      )}
      <div className='flex-1 min-w-0'>
        <p className='text-xs font-medium text-muted-foreground mb-0.5'>{label}</p>
        <div className='text-sm text-foreground break-words'>{value}</div>
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
          toast.success('Request approved!');
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
      <div className='flex h-screen items-center justify-center'>
        <Loader2 className='animate-spin' />
      </div>
    );
  }

  if (isError || !request) {
    return (
      <div className='text-center py-20 text-red-500'>
        Error loading request details.
      </div>
    );
  }

  const position = {
    lat: request.latitude,
    lng: request.longitude,
  };

  const statusBadge =
    request.status === 'AWAITING_ADMIN_REVIEW'
      ? 'Pending'
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

  return (
    <div className='space-y-6'>
      {/* Header */}
      <div className='flex items-center justify-between'>
        <div className='flex items-center gap-4'>
          <Button variant='outline' size='icon' onClick={() => router.back()}>
            <ArrowLeft className='h-4 w-4' />
          </Button>
          <div>
            <h1 className='text-3xl font-bold'>{request.name}</h1>
            <div className='flex items-center gap-2 mt-1'>
              <Badge variant={statusVariant as any}>{statusBadge}</Badge>
              <span className='text-sm text-muted-foreground'>
                Submitted {formatShortDate(request.createdAt)}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Review Instructions Banner */}
      {isPending && (
        <Card className='border-blue-200 bg-blue-50 dark:bg-blue-950/20 dark:border-blue-800'>
          <CardContent className='pt-6'>
            <div className='flex items-start gap-3'>
              <AlertCircle className='h-5 w-5 text-blue-600 dark:text-blue-400 mt-0.5 flex-shrink-0' />
              <div className='flex-1'>
                <h3 className='font-semibold text-blue-900 dark:text-blue-100 mb-1'>
                  Review Required
                </h3>
                <p className='text-sm text-blue-800 dark:text-blue-200'>
                  Please review all sections below carefully before making a decision. 
                  Verify the location details, images, documents, and submitter information. 
                  Action buttons are available at the bottom of the page.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Main Content - Top to Bottom Flow */}
      <div className='space-y-6 max-w-4xl'>
        {/* Request Overview */}
        <Card>
          <CardHeader>
            <CardTitle>Request Overview</CardTitle>
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
            <div className='grid grid-cols-2 gap-4'>
              <InfoRow
                label='Request Type'
                value={
                  <Badge variant='outline' className='w-fit'>
                    {request.type === 'BUSINESS_OWNED' ? (
                      <><Building className='h-3 w-3 mr-1' /> Business Owned</>
                    ) : (
                      <><Globe className='h-3 w-3 mr-1' /> Public</>
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
                  <TagIcon className='h-4 w-4 text-muted-foreground flex-shrink-0 mt-0.5' />
                  <div className='flex-1'>
                    <p className='text-xs font-medium text-muted-foreground mb-2'>Tags</p>
                    <DisplayTags tags={tags} maxCount={10} />
                  </div>
                </div>
              </>
            )}
          </CardContent>
        </Card>

        {/* Address Information */}
        <Card>
          <CardHeader>
            <CardTitle className='flex items-center gap-2'>
              <MapPin className='h-5 w-5' />
              Address Information
            </CardTitle>
            <CardDescription>
              Location address and coordinates
            </CardDescription>
          </CardHeader>
          <CardContent className='space-y-4'>
            <InfoRow label='Street Address' value={request.addressLine} />
            <Separator />
            <div className='grid grid-cols-2 gap-4'>
              <InfoRow label='District' value={request.addressLevel1} />
              <InfoRow label='City/Province' value={request.addressLevel2} />
            </div>
            <Separator />
            <div className='grid grid-cols-2 gap-4'>
              <InfoRow label='Latitude' value={request.latitude.toString()} />
              <InfoRow label='Longitude' value={request.longitude.toString()} />
            </div>
            <Separator />
            <div className='pt-2'>
              <p className='text-xs font-medium text-muted-foreground mb-2'>Map Location</p>
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
          <Card>
            <CardHeader>
              <CardTitle className='flex items-center gap-2'>
                <ImageIcon className='h-5 w-5' />
                Location Images
              </CardTitle>
              <CardDescription>
                {request.locationImageUrls.length} image{request.locationImageUrls.length !== 1 ? 's' : ''} provided
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className='grid grid-cols-2 md:grid-cols-3 gap-4'>
                {request.locationImageUrls.map((url, index) => (
                  <div
                    key={index}
                    className='relative aspect-video rounded-lg overflow-hidden border cursor-pointer group'
                    onClick={() => handleImageClick(url, `Location Image ${index + 1}`)}
                  >
                    <img
                      src={url || '/placeholder.svg'}
                      alt={`Location ${index + 1}`}
                      className='w-full h-full object-cover group-hover:opacity-90 transition-opacity'
                    />
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Validation Documents */}
        {request.locationValidationDocuments &&
          request.locationValidationDocuments.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className='flex items-center gap-2'>
                  <FileText className='h-5 w-5' />
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
                        {doc.documentType}
                      </p>
                      <div className='grid grid-cols-2 md:grid-cols-3 gap-4'>
                        {doc.documentImageUrls.map((url, imgIndex) => (
                          <div
                            key={imgIndex}
                            className='relative aspect-[4/3] rounded-lg overflow-hidden border cursor-pointer group'
                            onClick={() =>
                              handleImageClick(url, `${doc.documentType} - Document ${imgIndex + 1}`)
                            }
                          >
                            <img
                              src={url || '/placeholder.svg'}
                              alt={`Document ${imgIndex + 1}`}
                              className='w-full h-full object-cover group-hover:opacity-90 transition-opacity'
                            />
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
          <Card>
            <CardHeader>
              <CardTitle className='flex items-center gap-2'>
                <User className='h-5 w-5' />
                Submitter Information
              </CardTitle>
              <CardDescription>
                Information about the person who submitted this request
              </CardDescription>
            </CardHeader>
            <CardContent className='space-y-4'>
              <InfoRow
                label='Full Name'
                value={`${request.createdBy.firstName} ${request.createdBy.lastName}`}
                icon={User}
              />
              <Separator />
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
              <Separator />
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
              {request.createdBy.businessProfile && (
                <>
                  <Separator />
                  <div className='pt-2'>
                    <div className='flex items-center gap-2 mb-3'>
                      <Building className='h-4 w-4 text-muted-foreground' />
                      <p className='text-sm font-semibold'>Business Profile</p>
                    </div>
                    <div className='ml-6 space-y-3'>
                      <InfoRow
                        label='Business Name'
                        value={request.createdBy.businessProfile.name}
                      />
                      <Separator />
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
                      <Separator />
                      <InfoRow
                        label='Category'
                        value={
                          <Badge variant='outline' className='w-fit'>
                            {request.createdBy.businessProfile.category}
                          </Badge>
                        }
                      />
                      {request.createdBy.businessProfile.accountId && (
                        <>
                          <Separator />
                          <div className='pt-2'>
                            <Link
                              href={`/admin/accounts/${request.createdBy.businessProfile.accountId}`}
                              className='text-sm text-primary hover:underline'
                            >
                              View Business Account →
                            </Link>
                          </div>
                        </>
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
              <p className='text-yellow-900 dark:text-yellow-100'>{request.adminNotes}</p>
            </CardContent>
          </Card>
        )}

        {/* Action Buttons - Sticky at Bottom */}
        {isPending && (
          <Card className='sticky bottom-6 border-2 border-primary/20 bg-background shadow-lg z-10'>
            <CardContent className='pt-6'>
              <div className='flex flex-col sm:flex-row items-stretch sm:items-center gap-3'>
                <Button
                  variant='destructive'
                  onClick={() => setShowRejectDialog(true)}
                  disabled={isProcessing}
                  className='flex-1'
                >
                  <XCircle className='h-4 w-4 mr-2' />
                  Reject Request
                </Button>
                <Button
                  onClick={() => setShowApproveDialog(true)}
                  disabled={isProcessing}
                  className='flex-1 bg-green-600 hover:bg-green-700'
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
              This action will approve the location request and make it publicly available. This action cannot be undone.
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
              Please provide a reason for rejection. This note will be visible to the submitter.
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
    </div>
  );
}
