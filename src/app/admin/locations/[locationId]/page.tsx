'use client';

import { use, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useLocationByIdForAdmin } from '@/hooks/admin/useLocationByIdForAdmin';
import {
  ArrowLeft,
  Calendar,
  CalendarDays,
  Eye,
  EyeOff,
  ImageIcon,
  Layers,
  Loader2,
  MapPin,
  Building,
  Mail,
  Phone,
  Globe,
  Tag,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { GoogleMapsPicker } from '@/components/shared/GoogleMapsPicker';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { DisplayTags } from '@/components/shared/DisplayTags';
import Link from 'next/link';
import type React from 'react';
import { ImageViewer } from '@/components/shared/ImageViewer';
import { formatDate } from '@/lib/utils';
import { locationStats } from '@/constants/admin/location-stats';
import StatsCard from '@/components/admin/stats-card';

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
      <div className='text-center py-20 text-red-500'>
        Error loading location details.
      </div>
    );
  }

  const position = {
    lat: Number(location.latitude),
    lng: Number(location.longitude),
  };

  return (
    <div className='space-y-8'>
      {/* Back Button and Location Name */}
      <div className='flex items-center justify-between'>
        <div className='flex items-center gap-4'>
          <Button variant='outline' size='icon' onClick={() => router.back()}>
            <ArrowLeft className='h-4 w-4' />
          </Button>
          <div>
            <h1 className='text-3xl font-bold'>{location.name}</h1>
            <p className='text-sm text-muted-foreground mt-1'>
              {location.ownershipType === 'OWNED_BY_BUSINESS'
                ? 'Business Owned'
                : location.ownershipType === 'PUBLIC_PLACE'
                ? 'Public Place'
                : 'User Owned'}
            </p>
          </div>
        </div>
      </div>
      {/* Statistics Cards */}
      <div className='grid grid-cols-1 lg:grid-cols-4 gap-4'>
        {locationStats.map((stat: any) => (
          <StatsCard
            key={stat.title}
            title={stat.title}
            value={stat.value}
            change={stat.change}
            icon={stat.icon}
            color={stat.color}
          />
        ))}
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
                value={location.description || 'No description'}
              />
              <InfoRow
                label='Total Check-ins'
                value={location.totalCheckIns || '0'}
              />
              <InfoRow
                label='Visibility'
                value={
                  location.isVisibleOnMap ? (
                    <div className='flex items-center gap-2'>
                      <span className='text-sm'>Visible on map</span>
                      <Eye className='h-4 w-4 text-green-600' />
                    </div>
                  ) : (
                    <div className='flex items-center gap-2'>
                      <span className='text-sm'>Hidden from map</span>
                      <EyeOff className='h-4 w-4 text-gray-400' />
                    </div>
                  )
                }
              />
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
              <InfoRow label='Address' value={location.addressLine} />
              <InfoRow
                label='District/Ward'
                value={location.addressLevel1 || 'N/A'}
              />
              <InfoRow
                label='Province/City'
                value={location.addressLevel2 || 'N/A'}
              />
              <InfoRow label='Latitude' value={location.latitude} />
              <InfoRow label='Longitude' value={location.longitude} />
              <InfoRow
                label='Service Radius'
                value={`${location.radiusMeters} meters`}
              />
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
          {/* Map */}
          <Card className='sticky top-6'>
            <CardHeader>
              <CardTitle className='flex items-center gap-2'>
                <MapPin className='h-5 w-5' />
                Location Map
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

                <div className='space-y-3 pt-4 border-t'>
                  <InfoRow
                    label='Email'
                    value={location.business.email}
                    icon={Mail}
                  />
                  <InfoRow
                    label='Phone'
                    value={location.business.phone}
                    icon={Phone}
                  />
                  <InfoRow
                    label='Website'
                    value={
                      location.business.website && (
                        <a
                          href={location.business.website}
                          target='_blank'
                          rel='noopener noreferrer'
                          className='text-blue-600 hover:underline'
                        >
                          {location.business.website}
                        </a>
                      )
                    }
                    icon={Globe}
                  />
                </div>

                {location.business.licenseNumber && (
                  <div className='space-y-3 pt-4 border-t'>
                    <InfoRow
                      label='License Type'
                      value={location.business.licenseType}
                    />
                    <InfoRow
                      label='License Number'
                      value={location.business.licenseNumber}
                    />
                    <InfoRow
                      label='License Expiration'
                      value={formatDate(
                        location.business.licenseExpirationDate
                      )}
                    />
                  </div>
                )}

                <div className='pt-4 border-t'>
                  <InfoRow
                    label='Status'
                    value={
                      <Badge
                        variant={
                          location.business.status === 'APPROVED'
                            ? 'default'
                            : 'secondary'
                        }
                      >
                        {location.business.status}
                      </Badge>
                    }
                  />
                </div>
              </CardContent>
            </Card>
          )}
          {/* Quick Stats */}
          <Card>
            <CardHeader>
              <CardTitle className='flex items-center gap-2'>
                <Layers className='h-5 w-5' />
                Quick Stats
              </CardTitle>
            </CardHeader>
            <CardContent className='space-y-3'>
              <div className='flex justify-between items-center'>
                <span className='text-sm text-muted-foreground'>Check-ins</span>
                <span className='font-semibold'>
                  {location.totalCheckIns || '0'}
                </span>
              </div>
              <div className='flex justify-between items-center'>
                <span className='text-sm text-muted-foreground'>
                  Service Radius
                </span>
                <span className='font-semibold'>{location.radiusMeters}m</span>
              </div>
              <div className='flex justify-between items-center'>
                <span className='text-sm text-muted-foreground'>Ownership</span>
                <Badge variant='outline' className='text-xs'>
                  {location.ownershipType === 'OWNED_BY_BUSINESS'
                    ? 'Business'
                    : 'Public'}
                </Badge>
              </div>
            </CardContent>
          </Card>
          {/* Metadata */}
          <Card>
            <CardHeader>
              <CardTitle className='flex items-center gap-2'>
                <Calendar className='h-5 w-5' />
                Metadata
              </CardTitle>
            </CardHeader>
            <CardContent className='space-y-4'>
              <InfoRow label='Created' value={formatDate(location.createdAt)} />
              <InfoRow
                label='Last Updated'
                value={formatDate(location.updatedAt)}
              />
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
                <div className='grid grid-cols-3 gap-4'>
                  {location.imageUrl.map((url, index) => (
                    <div key={index} className='flex flex-col gap-2'>
                      <img
                        src={url || '/placeholder.svg'}
                        alt={`Location image ${index + 1}`}
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
