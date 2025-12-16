'use client';

import { use } from 'react';
import { useRouter } from 'next/navigation';
import { useEventByIdForAdmin } from '@/hooks/admin/useEventByIdForAdmin';
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
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { DisplayTags } from '@/components/shared/DisplayTags';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import Link from 'next/link';
import type React from 'react';
import { formatDate } from '@/lib/utils';
import Image from 'next/image';
import LoadingCustom from '@/components/shared/LoadingCustom';
import ErrorCustom from '@/components/shared/ErrorCustom';

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
  const { data: event, isLoading, isError } = useEventByIdForAdmin(eventId);
  console.log('🚀 ~ AdminEventDetailsPage ~ event:', event);

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
        <Tabs defaultValue='overview' className='space-y-4'>
          <TabsList>
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
                        <InfoRow
                          label='Total posts'
                          value={event.location.totalPosts || 0}
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

          <TabsContent value='reports' className='space-y-6'>
            <Card className='shadow-sm'>
              <CardHeader>
                <CardTitle className='text-lg flex items-center gap-2'>
                  <FileText className='h-5 w-5 text-primary' />
                  Reports
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className='text-muted-foreground whitespace-pre-wrap leading-relaxed'>
                  No reports found for this event.
                </p>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
