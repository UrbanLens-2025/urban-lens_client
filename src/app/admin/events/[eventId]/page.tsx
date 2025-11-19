'use client';

import { use } from 'react';
import { useRouter } from 'next/navigation';
import { useEventByIdForAdmin } from '@/hooks/admin/useEventByIdForAdmin';
import {
  ArrowLeft,
  Calendar,
  CalendarDays,
  Loader2,
  MapPin,
  User,
  Mail,
  Globe,
  Tag,
  ImageIcon,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { DisplayTags } from '@/components/shared/DisplayTags';
import Link from 'next/link';
import type React from 'react';
import { ImageViewer } from '@/components/shared/ImageViewer';
import { useState } from 'react';
import { formatDate, formatDateTime } from '@/lib/utils';
import Image from 'next/image';

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

export default function AdminEventDetailsPage({
  params,
}: {
  params: Promise<{ eventId: string }>;
}) {
  const { eventId } = use(params);
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
    data: event,
    isLoading,
    isError,
  } = useEventByIdForAdmin(eventId);

  if (isLoading) {
    return (
      <div className='flex h-screen items-center justify-center'>
        <Loader2 className='animate-spin' />
      </div>
    );
  }

  if (isError || !event) {
    return (
      <div className='text-center py-20 text-red-500'>
        Error loading event details.
      </div>
    );
  }

  const getStatusBadge = (status: string) => {
    const statusUpper = status?.toUpperCase();
    if (statusUpper === 'PUBLISHED') {
      return <Badge className='bg-green-500 hover:bg-green-600'>Published</Badge>;
    }
    if (statusUpper === 'DRAFT') {
      return <Badge variant='secondary'>Draft</Badge>;
    }
    if (statusUpper === 'CANCELLED') {
      return <Badge variant='destructive'>Cancelled</Badge>;
    }
    return <Badge variant='outline'>{status || 'Unknown'}</Badge>;
  };

  return (
    <div className='space-y-6'>
      {/* Header */}
      <div className='flex items-center justify-between'>
        <div className='flex items-center gap-4'>
          <Button variant='ghost' size='icon' onClick={() => router.back()}>
            <ArrowLeft className='h-5 w-5' />
          </Button>
          <div>
            <h1 className='text-3xl font-bold'>{event.displayName}</h1>
            <p className='text-muted-foreground mt-1'>Event Details</p>
          </div>
        </div>
        <div className='flex items-center gap-2'>
          {getStatusBadge(event.status)}
        </div>
      </div>

      <div className='grid grid-cols-1 lg:grid-cols-3 gap-6'>
        {/* Main Content */}
        <div className='lg:col-span-2 space-y-6'>
          {/* Event Images */}
          {(event.coverUrl || event.avatarUrl) && (
            <Card>
              <CardHeader>
                <CardTitle>Event Images</CardTitle>
              </CardHeader>
              <CardContent>
                <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
                  {event.coverUrl && (
                    <div
                      className='relative aspect-video rounded-lg overflow-hidden cursor-pointer border'
                      onClick={() =>
                        handleImageClick(event.coverUrl!, 'Event Cover')
                      }
                    >
                      <Image
                        src={event.coverUrl}
                        alt='Event Cover'
                        fill
                        className='object-cover'
                      />
                      <div className='absolute inset-0 bg-black/0 hover:bg-black/10 transition-colors flex items-center justify-center'>
                        <ImageIcon className='h-8 w-8 text-white opacity-0 hover:opacity-100 transition-opacity' />
                      </div>
                    </div>
                  )}
                  {event.avatarUrl && (
                    <div
                      className='relative aspect-square rounded-lg overflow-hidden cursor-pointer border'
                      onClick={() =>
                        handleImageClick(event.avatarUrl!, 'Event Avatar')
                      }
                    >
                      <Image
                        src={event.avatarUrl}
                        alt='Event Avatar'
                        fill
                        className='object-cover'
                      />
                      <div className='absolute inset-0 bg-black/0 hover:bg-black/10 transition-colors flex items-center justify-center'>
                        <ImageIcon className='h-8 w-8 text-white opacity-0 hover:opacity-100 transition-opacity' />
                      </div>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Event Description */}
          {event.description && (
            <Card>
              <CardHeader>
                <CardTitle>Description</CardTitle>
              </CardHeader>
              <CardContent>
                <p className='text-muted-foreground whitespace-pre-wrap'>
                  {event.description}
                </p>
              </CardContent>
            </Card>
          )}

          {/* Location Information */}
          {event.location && (
            <Card>
              <CardHeader>
                <CardTitle>Location</CardTitle>
              </CardHeader>
              <CardContent className='space-y-4'>
                <InfoRow
                  label='Location Name'
                  value={
                    <Link
                      href={`/admin/locations/${event.location.id}`}
                      className='hover:underline text-primary'
                    >
                      {event.location.name}
                    </Link>
                  }
                  icon={MapPin}
                />
                {event.location.addressLine && (
                  <InfoRow
                    label='Address'
                    value={event.location.addressLine}
                    icon={MapPin}
                  />
                )}
                {event.location.latitude && event.location.longitude && (
                  <div className='mt-4'>
                    <p className='text-sm font-semibold text-muted-foreground mb-2'>
                      Coordinates
                    </p>
                    <p className='text-sm'>
                      {event.location.latitude}, {event.location.longitude}
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {/* Terms and Conditions */}
          {event.termsAndConditions && (
            <Card>
              <CardHeader>
                <CardTitle>Terms and Conditions</CardTitle>
              </CardHeader>
              <CardContent>
                <p className='text-muted-foreground whitespace-pre-wrap'>
                  {event.termsAndConditions}
                </p>
              </CardContent>
            </Card>
          )}

          {/* Refund Policy */}
          {event.refundPolicy && (
            <Card>
              <CardHeader>
                <CardTitle>Refund Policy</CardTitle>
              </CardHeader>
              <CardContent>
                <p className='text-muted-foreground whitespace-pre-wrap'>
                  {event.refundPolicy}
                </p>
              </CardContent>
            </Card>
          )}

          {/* Social Links */}
          {event.social && event.social.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Social Links</CardTitle>
              </CardHeader>
              <CardContent>
                <div className='space-y-2'>
                  {event.social.map((link, index) => (
                    <div key={index} className='flex items-center gap-2'>
                      <Globe className='h-4 w-4 text-muted-foreground' />
                      <a
                        href={link.url}
                        target='_blank'
                        rel='noopener noreferrer'
                        className='text-primary hover:underline'
                      >
                        {link.platform}
                        {link.isMain && (
                          <Badge variant='outline' className='ml-2'>
                            Main
                          </Badge>
                        )}
                      </a>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Sidebar */}
        <div className='space-y-6'>
          {/* Event Information */}
          <Card>
            <CardHeader>
              <CardTitle>Event Information</CardTitle>
            </CardHeader>
            <CardContent className='space-y-4'>
              <InfoRow
                label='Event ID'
                value={<code className='text-xs'>{event.id}</code>}
              />
              <InfoRow
                label='Status'
                value={getStatusBadge(event.status)}
              />
              <InfoRow
                label='Created At'
                value={formatDateTime(event.createdAt)}
                icon={Calendar}
              />
              <InfoRow
                label='Updated At'
                value={formatDateTime(event.updatedAt)}
                icon={CalendarDays}
              />
            </CardContent>
          </Card>

          {/* Creator Information */}
          {event.createdBy && (
            <Card>
              <CardHeader>
                <CardTitle>Creator</CardTitle>
              </CardHeader>
              <CardContent className='space-y-4'>
                <InfoRow
                  label='Name'
                  value={`${event.createdBy.firstName || ''} ${event.createdBy.lastName || ''}`.trim() || 'N/A'}
                  icon={User}
                />
                {event.createdBy.email && (
                  <InfoRow
                    label='Email'
                    value={event.createdBy.email}
                    icon={Mail}
                  />
                )}
                {event.createdBy.phoneNumber && (
                  <InfoRow
                    label='Phone'
                    value={event.createdBy.phoneNumber}
                    icon={Mail}
                  />
                )}
              </CardContent>
            </Card>
          )}

          {/* Tags */}
          {event.tags && event.tags.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className='flex items-center gap-2'>
                  <Tag className='h-5 w-5' />
                  Tags
                </CardTitle>
              </CardHeader>
              <CardContent>
                <DisplayTags tags={event.tags} />
              </CardContent>
            </Card>
          )}

          {/* Actions */}
          <Card>
            <CardHeader>
              <CardTitle>Actions</CardTitle>
            </CardHeader>
            <CardContent className='space-y-2'>
              <Button
                variant='outline'
                className='w-full'
                asChild
              >
                <Link href={`/dashboard/creator/events/${event.id}`}>
                  View Creator View
                </Link>
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Image Viewer */}
      <ImageViewer
        isOpen={isImageViewerOpen}
        onClose={() => setIsImageViewerOpen(false)}
        src={currentImageSrc}
        alt={currentImageAlt}
      />
    </div>
  );
}

