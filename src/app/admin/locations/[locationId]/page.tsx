'use client';

import { use, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useLocationByIdForAdmin } from '@/hooks/admin/useLocationByIdForAdmin';
import {
  ArrowLeft,
  Calendar,
  CalendarDays,
  ImageIcon,
  Layers,
  Loader2,
  MapPin,
  Building,
  Mail,
  Phone,
  Globe,
  Tag,
  Copy,
  ExternalLink,
  FileText,
  CheckCircle2,
  Users,
  Ruler,
  AlertCircle,
  Eye,
  EyeOff,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { GoogleMapsPicker } from '@/components/shared/GoogleMapsPicker';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { DisplayTags } from '@/components/shared/DisplayTags';
import Link from 'next/link';
import type React from 'react';
import { ImageViewer } from '@/components/shared/ImageViewer';
import { formatDate, formatShortDate } from '@/lib/utils';
import { Separator } from '@/components/ui/separator';
import { toast } from 'sonner';
import { PageHeader } from '@/components/shared/PageHeader';

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

export default function AdminLocationDetailsPage({
  params,
}: {
  params: Promise<{ locationId: string }>;
}) {
  const { locationId } = use(params);
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
    data: location,
    isLoading,
    isError,
  } = useLocationByIdForAdmin(locationId);

  if (isLoading) {
    return (
      <div className='flex h-screen items-center justify-center'>
        <Loader2 className='animate-spin' />
      </div>
    );
  }

  if (isError || !location) {
    return (
      <div className='container mx-auto py-12'>
        <Card className='border-destructive'>
          <CardContent className='pt-6'>
            <div className='flex flex-col items-center justify-center py-12 text-center'>
              <AlertCircle className='h-12 w-12 text-destructive mb-4' />
              <h2 className='text-xl font-semibold mb-2'>Error Loading Location</h2>
              <p className='text-muted-foreground mb-4'>
                Unable to load location details. Please try again.
              </p>
              <Button onClick={() => router.back()} variant='outline'>
                <ArrowLeft className='h-4 w-4 mr-2' />
                Go Back
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  const position = {
    lat: Number(location.latitude),
    lng: Number(location.longitude),
  };

  // Copy coordinates to clipboard
  const copyCoordinates = () => {
    const coords = `${location.latitude}, ${location.longitude}`;
    navigator.clipboard.writeText(coords);
    toast.success('Coordinates copied to clipboard');
  };

  // Open in Google Maps
  const openInGoogleMaps = () => {
    const url = `https://www.google.com/maps?q=${location.latitude},${location.longitude}`;
    window.open(url, '_blank');
  };

  // Calculate real statistics
  const imageCount = location.imageUrl?.length || 0;
  const tagCount = location.tags?.length || 0;
  const checkIns = parseInt(location.totalCheckIns || '0', 10);

  return (
    <div className='space-y-6'>
      {/* Page Header */}
      <PageHeader
        title={location.name}
        description={location.addressLine}
        icon={MapPin}
      />

      {/* Quick Stats Summary */}
      <div className='grid grid-cols-2 md:grid-cols-4 gap-4'>
        <Card>
          <CardContent className='pt-6'>
            <div className='flex items-center gap-3'>
              <div className='p-2 rounded-lg bg-blue-100 dark:bg-blue-900/30'>
                <Users className='h-5 w-5 text-blue-600 dark:text-blue-400' />
              </div>
              <div>
                <p className='text-xs text-muted-foreground'>Check-ins</p>
                <p className='text-sm font-semibold'>{checkIns.toLocaleString()}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className='pt-6'>
            <div className='flex items-center gap-3'>
              <div className='p-2 rounded-lg bg-purple-100 dark:bg-purple-900/30'>
                <ImageIcon className='h-5 w-5 text-purple-600 dark:text-purple-400' />
              </div>
              <div>
                <p className='text-xs text-muted-foreground'>Images</p>
                <p className='text-sm font-semibold'>{imageCount}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className='pt-6'>
            <div className='flex items-center gap-3'>
              <div className='p-2 rounded-lg bg-green-100 dark:bg-green-900/30'>
                <Tag className='h-5 w-5 text-green-600 dark:text-green-400' />
              </div>
              <div>
                <p className='text-xs text-muted-foreground'>Tags</p>
                <p className='text-sm font-semibold'>{tagCount}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className='pt-6'>
            <div className='flex items-center gap-3'>
              <div className='p-2 rounded-lg bg-orange-100 dark:bg-orange-900/30'>
                <Ruler className='h-5 w-5 text-orange-600 dark:text-orange-400' />
              </div>
              <div>
                <p className='text-xs text-muted-foreground'>Radius</p>
                <p className='text-sm font-semibold'>{location.radiusMeters}m</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
      {/* Content */}
      <div className='grid grid-cols-1 lg:grid-cols-2 gap-8'>
        {/* LEFT COLUMN */}
        <div className='space-y-6'>
          {/* Basic Info */}
          <Card>
            <CardHeader>
              <CardTitle className='flex items-center gap-2'>
                <Layers className='h-5 w-5' />
                Basic Information
              </CardTitle>
            </CardHeader>
            <CardContent className='space-y-4'>
              <InfoRow
                label='Description'
                value={location.description || 'No description provided'}
                icon={FileText}
              />
              <Separator />
              <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
                <InfoRow
                  label='Total Check-ins'
                  value={checkIns.toLocaleString()}
                  icon={Users}
                />
                <InfoRow
                  label='Visibility'
                  value={
                    location.isVisibleOnMap ? (
                      <Badge variant='default' className='w-fit'>
                        <Eye className='h-3 w-3 mr-1' />
                        Visible on map
                      </Badge>
                    ) : (
                      <Badge variant='secondary' className='w-fit'>
                        <EyeOff className='h-3 w-3 mr-1' />
                        Hidden from map
                      </Badge>
                    )
                  }
                />
              </div>
            </CardContent>
          </Card>
          {/* Address */}
          <Card>
            <CardHeader>
              <CardTitle className='flex items-center gap-2'>
                <MapPin className='h-5 w-5' />
                Address Information
              </CardTitle>
            </CardHeader>
            <CardContent className='space-y-4'>
              <InfoRow label='Street Address' value={location.addressLine} />
              <Separator />
              <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
                <InfoRow
                  label='District/Ward'
                  value={location.addressLevel1 || 'N/A'}
                />
                <InfoRow
                  label='Province/City'
                  value={location.addressLevel2 || 'N/A'}
                />
              </div>
              <Separator />
              <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
                <InfoRow label='Latitude' value={location.latitude.toString()} />
                <InfoRow label='Longitude' value={location.longitude.toString()} />
              </div>
              <Separator />
              <InfoRow
                label='Service Radius'
                value={`${location.radiusMeters} meters`}
              />
              <Separator />
              <div className='pt-2'>
                <div className='flex items-center justify-between mb-2'>
                  <p className='text-xs font-medium text-muted-foreground'>Map Location</p>
                  <div className='flex gap-2'>
                    <Button
                      variant='ghost'
                      size='sm'
                      onClick={copyCoordinates}
                      className='h-7 text-xs'
                    >
                      <Copy className='h-3 w-3 mr-1' />
                      Copy Coords
                    </Button>
                    <Button
                      variant='ghost'
                      size='sm'
                      onClick={openInGoogleMaps}
                      className='h-7 text-xs'
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
          {/* Tags */}
          {location.tags && location.tags.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className='flex items-center gap-2'>
                  <Tag className='h-5 w-5' />
                  Tags
                </CardTitle>
              </CardHeader>
              <CardContent>
                <DisplayTags tags={location.tags} maxCount={4} />
              </CardContent>
            </Card>
          )}
        </div>

        {/* RIGHT COLUMN */}
        <div className='space-y-6'>
          {/* Business Info */}
          {location.business && (
            <Card>
              <CardHeader>
                <CardTitle className='flex items-center gap-2'>
                  <Building className='h-5 w-5' />
                  Business Information
                </CardTitle>
              </CardHeader>
              <CardContent className='space-y-4'>
                <div className='flex items-start gap-4'>
                  {location.business.avatar && (
                    <img
                      src={location.business.avatar}
                      alt={location.business.name}
                      className='w-16 h-16 rounded-lg object-cover'
                    />
                  )}
                  <div className='flex-1'>
                    <p className='font-semibold text-lg'>
                      {location.business.name}
                    </p>
                    <p className='text-sm text-muted-foreground mt-1'>
                      {location.business.description}
                    </p>
                  </div>
                </div>

                <Separator />
                <div className='grid grid-cols-1 md:grid-cols-2 gap-4 pt-2'>
                  <InfoRow
                    label='Email'
                    value={
                      <a
                        href={`mailto:${location.business.email}`}
                        className='text-primary hover:underline'
                      >
                        {location.business.email}
                      </a>
                    }
                    icon={Mail}
                  />
                  <InfoRow
                    label='Phone'
                    value={
                      <a
                        href={`tel:${location.business.phone}`}
                        className='text-primary hover:underline'
                      >
                        {location.business.phone}
                      </a>
                    }
                    icon={Phone}
                  />
                </div>
                {location.business.website && (
                  <>
                    <Separator />
                    <InfoRow
                      label='Website'
                      value={
                        <a
                          href={location.business.website}
                          target='_blank'
                          rel='noopener noreferrer'
                          className='text-primary hover:underline flex items-center gap-1'
                        >
                          {location.business.website}
                          <ExternalLink className='h-3 w-3' />
                        </a>
                      }
                      icon={Globe}
                    />
                  </>
                )}

                {location.business.licenseNumber && (
                  <>
                    <Separator />
                    <div className='grid grid-cols-1 md:grid-cols-2 gap-4 pt-2'>
                      <InfoRow
                        label='License Type'
                        value={location.business.licenseType}
                        icon={FileText}
                      />
                      <InfoRow
                        label='License Number'
                        value={location.business.licenseNumber}
                        icon={FileText}
                      />
                    </div>
                    {location.business.licenseExpirationDate && (
                      <>
                        <Separator />
                        <InfoRow
                          label='License Expiration'
                          value={formatDate(location.business.licenseExpirationDate)}
                          icon={Calendar}
                        />
                      </>
                    )}
                  </>
                )}

                <Separator />
                <div className='pt-2'>
                  <InfoRow
                    label='Business Status'
                    value={
                      <Badge
                        variant={
                          location.business.status === 'APPROVED'
                            ? 'default'
                            : location.business.status === 'REJECTED'
                            ? 'destructive'
                            : 'secondary'
                        }
                        className='w-fit'
                      >
                        {location.business.status === 'APPROVED' && (
                          <CheckCircle2 className='h-3 w-3 mr-1' />
                        )}
                        {location.business.status}
                      </Badge>
                    }
                  />
                  {location.business.accountId && (
                    <>
                      <Separator className='my-4' />
                      <Link href={`/admin/business/${location.business.accountId}`}>
                        <Button variant='outline' size='sm' className='w-full sm:w-auto'>
                          <Building className='h-4 w-4 mr-2' />
                          View Business Account
                          <ExternalLink className='h-3 w-3 ml-2' />
                        </Button>
                      </Link>
                    </>
                  )}
                </div>
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
              <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
                <InfoRow 
                  label='Created' 
                  value={formatShortDate(location.createdAt)}
                  icon={Calendar}
                />
                <InfoRow
                  label='Last Updated'
                  value={formatShortDate(location.updatedAt)}
                  icon={CalendarDays}
                />
              </div>
            </CardContent>
          </Card>
          {/* Images */}
          {location.imageUrl?.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className='flex items-center gap-2'>
                  <ImageIcon className='h-5 w-5' />
                  Location Images
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className='grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4'>
                  {location.imageUrl.map((url, index) => (
                    <div
                      key={index}
                      className='relative aspect-video rounded-lg overflow-hidden border cursor-pointer group hover:border-primary transition-all'
                      onClick={() => handleImageClick(url, `Location Image ${index + 1}`)}
                    >
                      <img
                        src={url || '/placeholder.svg'}
                        alt={`Location image ${index + 1}`}
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
        </div>
      </div>

      {/* Image Viewer */}
      <ImageViewer
        src={currentImageSrc}
        alt={currentImageAlt}
        open={isImageViewerOpen}
        onOpenChange={setIsImageViewerOpen}
      />
    </div>
  );
}
