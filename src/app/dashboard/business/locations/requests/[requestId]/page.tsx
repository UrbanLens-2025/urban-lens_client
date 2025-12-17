'use client';

import { use, useState, useEffect } from 'react';
import React from 'react';
import { useRouter } from 'next/navigation';
import { useLocationRequestById } from '@/hooks/locations/useLocationRequestById';
import { useMyLocations } from '@/hooks/locations/useMyLocations';
import {
  Loader2,
  ArrowLeft,
  Calendar,
  MapPin,
  User,
  FileText,
  ImageIcon,
  Layers,
  Phone,
  Mail,
  Building,
  Globe,
  Tag,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { GoogleMapsPicker } from '@/components/shared/GoogleMapsPicker';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { cn, formatDocumentType } from '@/lib/utils';
import { DisplayTags } from '@/components/shared/DisplayTags';
import { ImageViewer } from '@/components/shared/ImageViewer';
import { PageContainer, PageHeader } from '@/components/shared';

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
    <div className='flex gap-3'>
      {Icon && (
        <Icon className='h-5 w-5 text-muted-foreground flex-shrink-0 mt-0.5' />
      )}
      <div className='flex-1'>
        <p className='text-sm font-semibold text-muted-foreground'>{label}</p>
        <div className='text-base text-foreground'>{value}</div>
      </div>
    </div>
  );
}

function formatDate(dateString: string) {
  return new Date(dateString).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export default function LocationRequestDetailsPage({
  params,
}: {
  params: Promise<{ requestId: string }>;
}) {
  const { requestId } = use(params);
  const router = useRouter();
  const [isImageViewerOpen, setIsImageViewerOpen] = useState(false);
  const [currentImageSrc, setCurrentImageSrc] = useState('');
  const [currentImageAlt, setCurrentImageAlt] = useState('');

  const handleImageClick = (src: string, alt: string) => {
    setCurrentImageSrc(src);
    setCurrentImageAlt(alt);
    setIsImageViewerOpen(true);
  };

  const {
    data: request,
    isLoading: isLoadingRequest,
    isError,
  } = useLocationRequestById(requestId);

  // If request is approved, try to find the corresponding location
  const { data: locationsData } = useMyLocations(1, '');
  const approvedLocation =
    request?.status === 'APPROVED'
      ? locationsData?.data?.find(
          (loc) =>
            loc.name === request?.name &&
            Math.abs(loc.latitude - (request?.latitude || 0)) < 0.0001 &&
            Math.abs(loc.longitude - (request?.longitude || 0)) < 0.0001
        )
      : undefined;

  // Redirect to location detail if approved and location found
  useEffect(() => {
    if (request?.status === 'APPROVED' && approvedLocation) {
      // Use replace with clean URL (no query parameters)
      router.replace(`/dashboard/business/locations/${approvedLocation.id}`, {
        scroll: false,
      });
    }
  }, [request?.status, approvedLocation, router]);

  if (isLoadingRequest) {
    return (
      <PageContainer>
        <div className='flex h-screen items-center justify-center'>
          <Loader2 className='animate-spin' />
        </div>
      </PageContainer>
    );
  }
  if (isError || !request) {
    return (
      <PageContainer>
        <Card className='border-destructive/50'>
          <CardContent className='pt-6'>
            <div className='text-center py-20 text-red-500'>
              Error loading request details.
            </div>
          </CardContent>
        </Card>
      </PageContainer>
    );
  }

  // If this request has already resulted in an approved location,
  // show a lightweight redirect state instead of the full detail UI
  // to avoid a flash before navigating to the location detail page.
  if (request.status === 'APPROVED' && approvedLocation) {
    return (
      <PageContainer>
        <div className='flex h-screen flex-col items-center justify-center gap-3'>
          <Loader2 className='h-8 w-8 animate-spin text-muted-foreground' />
          <p className='text-sm text-muted-foreground'>
            Opening your approved location details…
          </p>
        </div>
      </PageContainer>
    );
  }

  const position = {
    lat: request.latitude,
    lng: request.longitude,
  };

  const getStatusBadge = () => {
    const statusConfig = {
      'AWAITING_ADMIN_REVIEW': { label: 'Pending Review', className: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400' },
      'NEEDS_MORE_INFO': { label: 'Needs Info', className: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400' },
      'APPROVED': { label: 'Approved', className: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400' },
      'REJECTED': { label: 'Rejected', className: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400' },
      'CANCELLED_BY_BUSINESS': { label: 'Cancelled', className: 'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-400' },
      'AUTO_VALIDATING': { label: 'Validating', className: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400' },
    };

    const config = statusConfig[request.status as keyof typeof statusConfig];
    if (config) {
      return (
        <Badge className={config.className}>
          {config.label}
        </Badge>
      );
    }
    return <Badge>{request.status}</Badge>;
  };

  return (
    <PageContainer>
      {/* Header */}
      <PageHeader
        title={request.name}
        icon={MapPin}
        actions={
          <div className='flex items-center gap-3'>
            {getStatusBadge()}
            <Button variant='outline' size='icon' onClick={() => router.push('/dashboard/business/location-requests')}>
              <ArrowLeft className='h-4 w-4' />
            </Button>
          </div>
        }
      />

      <div className='grid grid-cols-1 lg:grid-cols-2 gap-6'>
        {/* Left Column */}
        <div className='space-y-6'>
          {/* Basic Information & Address - Consolidated */}
          <Card>
            <CardHeader>
              <CardTitle className='flex items-center gap-2'>
                <Layers className='h-5 w-5' />
                Location Details
              </CardTitle>
            </CardHeader>
            <CardContent className='space-y-4'>
              {/* Basic Info Section */}
              <div className='space-y-4'>
                <InfoRow label='Description' value={request.description} />
                <InfoRow
                  label='Radius'
                  value={`${request.radiusMeters} meters`}
                />
              </div>

              {/* Divider */}
              <div className='border-t pt-4'>
                <div className='flex items-center gap-2 mb-3'>
                  <MapPin className='h-5 w-5 text-muted-foreground' />
                  <p className='text-sm font-semibold text-muted-foreground'>
                    Address & Location
                  </p>
                </div>
                <div className='space-y-4'>
                  <InfoRow
                    label='Address'
                    value={request.addressLine}
                  />
                  <div className='grid grid-cols-2 gap-4'>
                    <InfoRow label='District' value={request.addressLevel1} />
                    <InfoRow
                      label='City/Province'
                      value={request.addressLevel2}
                    />
                  </div>
                  <div className='grid grid-cols-2 gap-4'>
                    <InfoRow
                      label='Latitude'
                      value={
                        typeof request.latitude === 'number'
                          ? request.latitude.toFixed(8)
                          : String(request.latitude || 'N/A')
                      }
                    />
                    <InfoRow
                      label='Longitude'
                      value={
                        typeof request.longitude === 'number'
                          ? request.longitude.toFixed(8)
                          : String(request.longitude || 'N/A')
                      }
                    />
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Tags */}
          {request.tags && request.tags.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className='flex items-center gap-2'>
                  <Tag className='h-5 w-5' />
                  Tags
                </CardTitle>
              </CardHeader>
              <CardContent>
                <DisplayTags tags={request.tags} maxCount={4} />
              </CardContent>
            </Card>
          )}

          {/* Admin Notes */}
          {request.adminNotes && (
            <Card className='border-yellow-200 bg-yellow-50'>
              <CardHeader>
                <CardTitle className='text-yellow-900 flex items-center gap-2'>
                  <FileText className='h-5 w-5' />
                  Admin Notes
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className='text-yellow-900'>{request.adminNotes}</p>
              </CardContent>
            </Card>
          )}

          {/* Creator Information */}
          {request.createdBy && (
            <Card>
              <CardHeader>
                <CardTitle className='flex items-center gap-2'>
                  <User className='h-5 w-5' />
                  Creator Information
                </CardTitle>
              </CardHeader>
              <CardContent className='space-y-4'>
                <InfoRow
                  label='Name'
                  value={`${request.createdBy.firstName} ${request.createdBy.lastName}`}
                />
                <InfoRow
                  label='Email'
                  value={request.createdBy.email}
                  icon={Mail}
                />
                <InfoRow
                  label='Phone Number'
                  value={request.createdBy.phoneNumber}
                  icon={Phone}
                />
                {request.createdBy.businessProfile && (
                  <>
                    <div className='border-t pt-4 mt-4'>
                      <p className='font-semibold text-sm mb-3 flex items-center gap-2'>
                        <Building className='h-4 w-4' />
                        Business Information
                      </p>
                      <div className='space-y-3 ml-3'>
                        <InfoRow
                          label='Business Email'
                          value={request.createdBy.businessProfile.email}
                          icon={Mail}
                        />
                        <InfoRow
                          label='Business Phone'
                          value={request.createdBy.businessProfile.phone}
                          icon={Phone}
                        />
                        <InfoRow
                          label='Website'
                          value={
                            request.createdBy.businessProfile.website ? (
                              <a
                                href={request.createdBy.businessProfile.website}
                                target='_blank'
                                rel='noopener noreferrer'
                                className='text-blue-600 hover:underline'
                              >
                                {request.createdBy.businessProfile.website}
                              </a>
                            ) : null
                          }
                          icon={Globe}
                        />
                        <InfoRow
                          label='Business Name'
                          value={request.createdBy.businessProfile.name}
                        />
                        <InfoRow
                          label='Address'
                          value={request.createdBy.businessProfile.addressLine}
                        />
                        <InfoRow
                          label='Description'
                          value={request.createdBy.businessProfile.description}
                        />
                        <InfoRow
                          label='License Type'
                          value={request.createdBy.businessProfile.licenseType}
                        />
                        <InfoRow
                          label='License Number'
                          value={
                            request.createdBy.businessProfile.licenseNumber
                          }
                        />
                        <InfoRow
                          label='License Expiration Date'
                          value={
                            request.createdBy.businessProfile
                              .licenseExpirationDate
                          }
                        />
                        <InfoRow
                          label='Category'
                          value={request.createdBy.businessProfile.category}
                        />
                        <InfoRow
                          label='Status'
                          value={
                            <Badge
                              className={
                                request.createdBy.businessProfile.isActive
                                  ? 'bg-green-100 text-green-800'
                                  : 'bg-red-100 text-red-800'
                              }
                            >
                              {request.createdBy.businessProfile.isActive
                                ? 'Active'
                                : 'Inactive'}
                            </Badge>
                          }
                        />
                      </div>
                    </div>
                  </>
                )}
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
                </CardHeader>
                <CardContent className='space-y-6'>
                  {request.locationValidationDocuments.map((doc, docIndex) => (
                    <div
                      key={docIndex}
                      className='border-b pb-4 last:border-b-0'
                    >
                      <p className='font-semibold mb-3 text-sm'>
                        {formatDocumentType(doc.documentType)}
                      </p>
                      <div className='flex flex-wrap gap-4'>
                        {doc.documentImageUrls.map((url, imgIndex) => (
                          <div key={imgIndex} className='flex flex-col gap-2'>
                            <img
                              src={url || '/placeholder.svg'}
                              alt={`Document ${docIndex + 1} - Image ${
                                imgIndex + 1
                              }`}
                              onClick={() =>
                                handleImageClick(
                                  url,
                                  `Location ${imgIndex + 1}`
                                )
                              }
                              className='w-48 h-48 object-cover rounded-md border cursor-pointer'
                            />
                            <p className='text-xs text-muted-foreground'>
                              Document {docIndex + 1} - Image {imgIndex + 1}
                            </p>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </CardContent>
              </Card>
            )}

          {/* Metadata */}
          <Card>
            <CardHeader>
              <CardTitle className='flex items-center gap-2'>
                <Calendar className='h-5 w-5' />
                Metadata
              </CardTitle>
            </CardHeader>
            <CardContent className='space-y-4'>
              <InfoRow
                label='Created Date'
                value={formatDate(request.createdAt)}
              />
              <InfoRow
                label='Updated Date'
                value={formatDate(request.updatedAt)}
              />
              {request.processedBy && (
                <InfoRow
                  label='Processed By'
                  value={`${request.processedBy.firstName} ${request.processedBy.lastName}`}
                  icon={User}
                />
              )}
            </CardContent>
          </Card>
        </div>

        {/* Right Column - Images and Map */}
        <div className='space-y-6'>
          {/* Location Images */}
          {request.locationImageUrls &&
            request.locationImageUrls.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className='flex items-center gap-2'>
                    <ImageIcon className='h-5 w-5' />
                    Location Images
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className='grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4'>
                    {request.locationImageUrls.map((url, index) => (
                      <div key={index} className='flex flex-col gap-2'>
                        <img
                          src={url || '/placeholder.svg'}
                          alt={`Location ${index + 1}`}
                          onClick={() =>
                            handleImageClick(url, `Location ${index + 1}`)
                          }
                          className='w-full h-36 object-cover rounded-md border cursor-pointer'
                        />
                        <p className='text-xs text-muted-foreground text-center'>
                          Image {index + 1}
                        </p>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

          {/* Map */}
          <Card className='sticky top-6'>
            <CardHeader>
              <CardTitle className='flex items-center gap-2'>
                <MapPin className='h-5 w-5' />
                Map
              </CardTitle>
            </CardHeader>
            <CardContent className='h-96 rounded-lg overflow-hidden'>
              <GoogleMapsPicker
                position={position}
                onPositionChange={() => {}}
              />
            </CardContent>
          </Card>
        </div>
      </div>
      <ImageViewer
        src={currentImageSrc}
        alt={currentImageAlt}
        open={isImageViewerOpen}
        onOpenChange={setIsImageViewerOpen}
      />
    </PageContainer>
  );
}
