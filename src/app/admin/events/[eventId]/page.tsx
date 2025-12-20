'use client';

import { use, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
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
  Flag,
  Gavel,
  ImageIcon,
  Mail,
  Phone,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import Image from 'next/image';
import Link from 'next/link';
import type React from 'react';
import { formatDate, formatDateTime } from '@/lib/utils';
import LoadingCustom from '@/components/shared/LoadingCustom';
import ErrorCustom from '@/components/shared/ErrorCustom';
import { ReportsPanel } from '@/components/admin/event/ReportsPanel';
import { usePenaltiesByTarget } from '@/hooks/admin/usePenaltiesByTarget';
import { ImageViewer } from '@/components/shared/ImageViewer';
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

export default function AdminEventDetailsPage({
  params,
}: {
  params: Promise<{ eventId: string }>;
}) {
  const { eventId } = use(params);
  const router = useRouter();
  const searchParams = useSearchParams();
  const { data: event, isLoading, isError } = useEventByIdForAdmin(eventId);
  const [isImageViewerOpen, setIsImageViewerOpen] = useState(false);
  const [currentImageSrc, setCurrentImageSrc] = useState('');
  const [currentImageAlt, setCurrentImageAlt] = useState('');

  const activeTab = searchParams.get('tab') || 'overview';

  const validTabs = ['overview', 'tickets', 'reports', 'penalties'];
  const currentTab = validTabs.includes(activeTab) ? activeTab : 'overview';

  const handleTabChange = (value: string) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set('tab', value);
    router.replace(`/admin/events/${eventId}?${params.toString()}`, {
      scroll: false,
    });
  };

  const {
    data: penalties,
    isLoading: isLoadingPenalties,
    isError: isErrorPenalties,
  } = usePenaltiesByTarget(eventId, 'event');

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

  const formatPenaltyDate = (dateString: string) => {
    return new Date(dateString).toLocaleString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const formatDocumentType = (documentType: string) => {
    return documentType
      .replace(/_/g, ' ')
      .replace(/\b\w/g, (l: string) => l.toUpperCase());
  };

  const handleImageClick = (src: string, alt: string) => {
    setCurrentImageSrc(src);
    setCurrentImageAlt(alt);
    setIsImageViewerOpen(true);
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
              <div className='flex flex-row items-start gap-3 text-sm text-muted-foreground'>
                <div className='flex items-center gap-1.5'>
                  <Calendar className='h-4 w-4' />
                  {formatDateTime(event.startDate!)}
                </div>
                <div>-</div>
                <div className='flex items-center gap-1.5'>
                  <Calendar className='h-4 w-4' />
                  {formatDateTime(event.endDate!)}
                </div>
              </div>
            </div>
          </div>
        </div>
        {/* Tabs to switch between sections, similar to creator view */}
        <Tabs
          value={currentTab}
          onValueChange={handleTabChange}
          className='space-y-4'
        >
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
              <button
                onClick={() => handleTabChange('penalties')}
                className={`flex items-center gap-2 px-1 py-3 text-sm font-medium border-b-2 transition-colors ${
                  currentTab === 'penalties'
                    ? 'border-foreground text-foreground'
                    : 'border-transparent text-muted-foreground hover:text-foreground'
                }`}
              >
                <Gavel className='h-4 w-4' />
                Penalties
              </button>
            </div>
          </div>
          <TabsList className='hidden'>
            <TabsTrigger value='overview'>Overview</TabsTrigger>
            <TabsTrigger value='tickets'>Tickets</TabsTrigger>
            <TabsTrigger value='reports'>Reports</TabsTrigger>
            <TabsTrigger value='penalties'>Penalties</TabsTrigger>
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
                        Basic Information
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className='flex items-center gap-2'>
                        <Image
                          src={event.avatarUrl}
                          alt='Event Avatar'
                          width={120}
                          height={100}
                          className='object-cover rounded-lg'
                        />
                        <Image
                          src={event.coverUrl}
                          alt='Event Cover'
                          width={120}
                          height={100}
                          className='object-cover rounded-lg'
                        />
                      </div>
                      <p className='text-muted-foreground whitespace-pre-wrap leading-relaxed mt-3'>
                        {event.description}
                      </p>
                    </CardContent>
                  </Card>
                )}

                {/* Organizer */}
                {event.createdBy && (
                  <Card className='shadow-sm'>
                    <CardHeader>
                      <CardTitle className='text-lg flex items-center gap-2'>
                        <User className='h-5 w-5 text-primary' />
                        Organizer
                      </CardTitle>
                    </CardHeader>
                    <CardContent className='space-y-4'>
                      {/* Avatar and Name */}
                      <div className='flex items-start gap-4'>
                        {event.createdBy.avatarUrl && (
                          <div className='relative w-20 h-20 rounded-lg overflow-hidden border flex-shrink-0'>
                            <Image
                              src={event.createdBy.avatarUrl}
                              alt={
                                `${event.createdBy.firstName || ''} ${
                                  event.createdBy.lastName || ''
                                }`.trim() || 'Organizer'
                              }
                              fill
                              className='object-cover'
                            />
                          </div>
                        )}
                        <div className='flex-1'>
                          <h3 className='text-lg font-semibold'>
                            {`${event.createdBy.firstName || ''} ${
                              event.createdBy.lastName || ''
                            }`.trim() || 'N/A'}
                          </h3>
                          {event.createdBy.role && (
                            <Badge variant='secondary' className='mt-1 text-xs'>
                              {event.createdBy.role.replace(/_/g, ' ')}
                            </Badge>
                          )}
                        </div>
                      </div>

                      <Separator />

                      {/* Contact Information */}
                      <div className='flex gap-10'>
                        {event.createdBy.email && (
                          <InfoRow
                            label='Email'
                            value={
                              <a
                                href={`mailto:${event.createdBy.email}`}
                                className='text-primary hover:underline'
                              >
                                {event.createdBy.email}
                              </a>
                            }
                            icon={Mail}
                          />
                        )}
                        {event.createdBy.phoneNumber && (
                          <InfoRow
                            label='Phone'
                            value={
                              <a
                                href={`tel:${event.createdBy.phoneNumber}`}
                                className='text-primary hover:underline'
                              >
                                {event.createdBy.phoneNumber}
                              </a>
                            }
                            icon={Phone}
                          />
                        )}
                      </div>

                      {/* Social Links */}
                      {event.social && event.social.length > 0 && (
                        <div>
                          <p className='text-xs font-medium text-muted-foreground uppercase tracking-wide'>
                            Social Links
                          </p>
                          <div className='flex gap-4'>
                            {event.social.map((link: any, index: number) => (
                              <a
                                key={index}
                                href={link.url}
                                target='_blank'
                                rel='noopener noreferrer'
                                className='flex items-center gap-2 p-2 rounded-md hover:bg-muted transition-colors'
                              >
                                <Globe className='h-4 w-4 text-primary' />
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
                        </div>
                      )}
                    </CardContent>
                  </Card>
                )}
              </div>

              {/* Sidebar */}
              <div className='space-y-6'>
                {/* Location Info */}
                {event.location && (
                  <Card className='shadow-sm'>
                    <CardHeader>
                      <CardTitle className='text-lg flex items-center gap-2'>
                        <MapPin className='h-5 w-5 text-primary' />
                        Location
                      </CardTitle>
                    </CardHeader>
                    <CardContent className='space-y-3'>
                      <div className='flex items-start gap-2'>
                        <div className='relative w-36 h-24 rounded-lg overflow-hidden border bg-muted'>
                          <Image
                            src={event.location.imageUrl[0]}
                            alt={event.location.name}
                            fill
                            className='object-cover'
                          />
                        </div>
                        <div className='flex-1 flex flex-col gap-1'>
                          <span className='text-xl font-semibold text-primary'>
                            {event.location.name}
                          </span>
                          <span className='text-sm text-muted-foreground'>
                            {event.location.addressLine +
                              (event.location.addressLevel1
                                ? ', ' + event.location.addressLevel1
                                : '') +
                              (event.location.addressLevel2
                                ? ', ' + event.location.addressLevel2
                                : '')}
                          </span>
                        </div>
                      </div>
                      {event.location.description && (
                        <InfoRow
                          label='Description'
                          value={event.location.description}
                        />
                      )}
                      <div className='grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2 border-t'>
                        <InfoRow
                          label='Rating'
                          value={
                            event.location.averageRating &&
                            event.location.averageRating > 0
                              ? `${event.location.averageRating.toFixed(1)} ⭐`
                              : '0.0 ⭐'
                          }
                        />
                        <InfoRow
                          label='Reviews'
                          value={event.location.totalReviews || 0}
                        />
                        <InfoRow
                          label='Check-ins'
                          value={event.location.totalCheckIns || 0}
                        />
                        {event.location.radiusMeters && (
                          <InfoRow
                            label='Radius'
                            value={`${event.location.radiusMeters}m`}
                          />
                        )}
                      </div>
                    </CardContent>
                  </Card>
                )}
                {/* Documents */}
                {event.eventValidationDocuments.length > 0 && (
                  <Card className='shadow-sm'>
                    <CardHeader>
                      <CardTitle className='text-lg flex items-center gap-2'>
                        <FileText className='h-5 w-5 text-primary' />
                        Validation Documents
                      </CardTitle>
                    </CardHeader>
                    <CardContent className='space-y-6'>
                      {event.eventValidationDocuments.map(
                        (doc: any, docIndex: number) => (
                          <div key={docIndex} className='space-y-3'>
                            {docIndex > 0 && <Separator />}
                            <div className='flex items-center justify-between'>
                              <div className='flex items-center gap-2'>
                                <FileText className='h-4 w-4 text-primary' />
                                <span className='font-semibold text-sm'>
                                  {formatDocumentType(doc.documentType)}
                                </span>
                              </div>
                              <Badge variant='secondary' className='text-xs'>
                                {doc.documentImageUrls.length}{' '}
                                {doc.documentImageUrls.length === 1
                                  ? 'image'
                                  : 'images'}
                              </Badge>
                            </div>
                            <div className='grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4'>
                              {doc.documentImageUrls.map(
                                (imageUrl: string, imgIndex: number) => (
                                  <div
                                    key={imgIndex}
                                    className='relative aspect-[4/3] rounded-lg overflow-hidden border cursor-pointer group hover:border-primary transition-all'
                                    onClick={() =>
                                      handleImageClick(
                                        imageUrl,
                                        `${formatDocumentType(
                                          doc.documentType
                                        )} - Document ${imgIndex + 1}`
                                      )
                                    }
                                  >
                                    <Image
                                      src={imageUrl || '/placeholder.svg'}
                                      alt={`${formatDocumentType(
                                        doc.documentType
                                      )} - Document ${imgIndex + 1}`}
                                      fill
                                      className='object-cover group-hover:scale-105 transition-transform duration-200'
                                      sizes='(max-width: 768px) 50vw, (max-width: 1200px) 33vw, 25vw'
                                    />
                                    <div className='absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors flex items-center justify-center'>
                                      <ImageIcon className='h-6 w-6 text-white opacity-0 group-hover:opacity-100 transition-opacity' />
                                    </div>
                                    <div className='absolute top-2 right-2 bg-black/60 text-white text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity'>
                                      #{imgIndex + 1}
                                    </div>
                                  </div>
                                )
                              )}
                            </div>
                          </div>
                        )
                      )}
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
                            <div className='flex-1 flex items-center gap-2'>
                              <Image
                                src={ticket.imageUrl}
                                alt={ticket.displayName}
                                width={100}
                                height={80}
                                className='object-cover rounded-lg'
                              />
                              <div className='flex flex-col gap-1'>
                                <h4 className='font-semibold mb-1'>
                                  {ticket.displayName}
                                </h4>
                                {ticket.description && (
                                  <p className='text-sm text-muted-foreground'>
                                    {ticket.description}
                                  </p>
                                )}
                              </div>
                            </div>
                            <div className='text-right'>
                              <p className='text-lg font-bold text-primary'>
                                {Number(ticket.price).toLocaleString()}{' '}
                                {ticket.currency}
                              </p>
                            </div>
                          </div>
                          <div className='grid grid-cols-2 sm:grid-cols-5 gap-3 text-xs'>
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
                                Sale Start Date
                              </p>
                              <p className='font-semibold'>
                                {formatDate(ticket.saleStartDate)}
                              </p>
                            </div>
                            <div>
                              <p className='text-muted-foreground mb-0.5'>
                                Sale End Date
                              </p>
                              <p className='font-semibold'>
                                {formatDate(ticket.saleEndDate)}
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
              {/* Location Info */}
              {event.location && (
                <Card className='shadow-sm'>
                  <CardHeader>
                    <CardTitle className='text-lg flex items-center gap-2'>
                      <MapPin className='h-5 w-5 text-primary' />
                      Location
                    </CardTitle>
                  </CardHeader>
                  <CardContent className='space-y-3'>
                    <div className='flex items-start gap-2'>
                      <div className='relative w-36 h-24 rounded-lg overflow-hidden border bg-muted'>
                        <Image
                          src={event.location.imageUrl[0]}
                          alt={event.location.name}
                          fill
                          className='object-cover'
                        />
                      </div>
                      <div className='flex-1 flex flex-col gap-1'>
                        <span className='text-xl font-semibold text-primary'>
                          {event.location.name}
                        </span>
                        <span className='text-sm text-muted-foreground'>
                          {event.location.addressLine +
                            (event.location.addressLevel1
                              ? ', ' + event.location.addressLevel1
                              : '') +
                            (event.location.addressLevel2
                              ? ', ' + event.location.addressLevel2
                              : '')}
                        </span>
                      </div>
                    </div>
                    {event.location.description && (
                      <InfoRow
                        label='Description'
                        value={event.location.description}
                      />
                    )}
                    <div className='grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2 border-t'>
                      <InfoRow
                        label='Rating'
                        value={
                          event.location.averageRating &&
                          event.location.averageRating > 0
                            ? `${event.location.averageRating.toFixed(1)} ⭐`
                            : '0.0 ⭐'
                        }
                      />
                      <InfoRow
                        label='Reviews'
                        value={event.location.totalReviews || 0}
                      />
                      <InfoRow
                        label='Check-ins'
                        value={event.location.totalCheckIns || 0}
                      />
                      {event.location.radiusMeters && (
                        <InfoRow
                          label='Radius'
                          value={`${event.location.radiusMeters}m`}
                        />
                      )}
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>
          </TabsContent>

          <TabsContent
            value='reports'
            className='flex flex-col gap-2 space-y-4'
          >
            <ReportsPanel targetId={eventId} targetType='event' />
          </TabsContent>

          <TabsContent value='penalties' className='space-y-4'>
            <Card className='shadow-sm'>
              <CardHeader className='flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between'>
                <CardTitle className='text-lg flex items-center gap-2'>
                  <Gavel className='h-5 w-5 text-primary' />
                  Penalty history
                </CardTitle>
              </CardHeader>
              <CardContent>
                {isLoadingPenalties ? (
                  <div className='flex items-center justify-center h-48'>
                    <LoadingCustom />
                  </div>
                ) : isErrorPenalties ? (
                  <div className='text-sm text-destructive'>
                    Failed to load penalties.
                  </div>
                ) : !penalties || penalties.length === 0 ? (
                  <div className='text-sm text-muted-foreground'>
                    No penalties found for this event.
                  </div>
                ) : (
                  <div className='rounded-md border overflow-hidden'>
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead className='w-1/4'>Action</TableHead>
                          <TableHead className='w-1/3'>Reason</TableHead>
                          <TableHead className='w-1/4'>Created by</TableHead>
                          <TableHead className='w-1/5'>Created at</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {penalties.map((penalty) => (
                          <TableRow key={penalty.id}>
                            <TableCell className='font-medium'>
                              <Badge variant='secondary' className='uppercase'>
                                {penalty.penaltyAction}
                              </Badge>
                            </TableCell>
                            <TableCell className='text-sm text-foreground'>
                              {penalty.reason || '—'}
                            </TableCell>
                            <TableCell className='text-sm text-foreground'>
                              {penalty.createdBy
                                ? `${penalty.createdBy.firstName} ${penalty.createdBy.lastName}`
                                : '—'}
                            </TableCell>
                            <TableCell className='text-sm text-muted-foreground'>
                              {formatPenaltyDate(penalty.createdAt)}
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
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
