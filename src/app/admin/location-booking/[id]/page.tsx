'use client';

import { useLocationBookingDetail } from '@/hooks/admin/useDashboardAdmin';
import { useParams, useRouter } from 'next/navigation';
import React, { useMemo, useState } from 'react';
import {
  ArrowLeft,
  Calendar,
  Calendar as CalendarIcon,
  Clock,
  DollarSign,
  MapPin,
  User,
  Building,
  CreditCard,
  CheckCircle,
  CheckCircle2,
  AlertCircle,
  XCircle,
  Lock,
  Mail,
  Phone,
  Globe,
  FileText,
  Sparkles,
  Users,
  ExternalLink,
  Star,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import {
  format,
  isSameDay,
  eachDayOfInterval,
  startOfDay,
  endOfDay,
  startOfMonth,
  endOfMonth,
  addMonths,
  subMonths,
  getDay,
  isSameMonth,
} from 'date-fns';
import { formatCurrency, formatDate, formatDateTime, cn } from '@/lib/utils';
import LoadingCustom from '@/components/shared/LoadingCustom';
import ErrorCustom from '@/components/shared/ErrorCustom';
import { ImageViewer } from '@/components/shared/ImageViewer';
import { PageContainer, PageHeader } from '@/components/shared';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
  TooltipProvider,
} from '@/components/ui/tooltip';
import Link from 'next/link';

const getStatusBadge = (status: string) => {
  const statusUpper = status?.toUpperCase();
  switch (statusUpper) {
    case 'PAYMENT_RECEIVED':
      return (
        <Badge
          variant='outline'
          className='bg-green-50 text-green-700 border-green-300 dark:bg-green-950 dark:text-green-300 dark:border-green-700'
        >
          <CheckCircle className='h-3 w-3 mr-1' />
          Payment Received
        </Badge>
      );
    case 'AWAITING_BUSINESS_PROCESSING':
      return (
        <Badge
          variant='outline'
          className='bg-yellow-50 text-yellow-700 border-yellow-300 dark:bg-yellow-950 dark:text-yellow-300 dark:border-yellow-700'
        >
          <Clock className='h-3 w-3 mr-1' />
          Awaiting Processing
        </Badge>
      );
    case 'APPROVED':
      return (
        <Badge
          variant='outline'
          className='bg-green-50 text-green-700 border-green-300 dark:bg-green-950 dark:text-green-300 dark:border-green-700'
        >
          <CheckCircle className='h-3 w-3 mr-1' />
          Approved
        </Badge>
      );
    case 'REJECTED':
      return (
        <Badge
          variant='outline'
          className='bg-red-50 text-red-700 border-red-300 dark:bg-red-950 dark:text-red-300 dark:border-red-700'
        >
          <AlertCircle className='h-3 w-3 mr-1' />
          Rejected
        </Badge>
      );
    case 'SOFT_LOCKED':
      return (
        <Badge
          variant='outline'
          className='bg-blue-50 text-blue-700 border-blue-300 dark:bg-blue-950 dark:text-blue-300 dark:border-blue-700'
        >
          <Clock className='h-3 w-3 mr-1' />
          Soft Locked
        </Badge>
      );
    case 'CANCELLED':
      return (
        <Badge
          variant='outline'
          className='bg-red-50 text-red-700 border-red-300 dark:bg-red-950 dark:text-red-300 dark:border-red-700'
        >
          <AlertCircle className='h-3 w-3 mr-1' />
          Cancelled
        </Badge>
      );
    default:
      return (
        <Badge variant='outline'>
          {status?.charAt(0).toUpperCase() + status?.slice(1).toLowerCase() ||
            status}
        </Badge>
      );
  }
};

const formatBookingObject = (
  bookingObject: string | null | undefined
): string => {
  if (!bookingObject) return 'N/A';

  const formatted = bookingObject
    .split('_')
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(' ');

  return formatted;
};

export default function LocationBookingDetail() {
  const { id } = useParams();
  const router = useRouter();
  const [isImageViewerOpen, setIsImageViewerOpen] = useState(false);
  const [currentImageSrc, setCurrentImageSrc] = useState('');
  const [calendarMonth, setCalendarMonth] = useState(new Date());

  const {
    data: bookingDetail,
    isLoading,
    isError,
  } = useLocationBookingDetail(id as string);
  console.log('🚀 ~ LocationBookingDetail ~ bookingDetail:', bookingDetail);

  const handleImageClick = (src: string) => {
    setCurrentImageSrc(src);
    setIsImageViewerOpen(true);
  };

  if (isLoading) {
    return <LoadingCustom />;
  }

  if (isError || !bookingDetail) {
    return <ErrorCustom />;
  }

  // Get event data
  const eventData = bookingDetail.event
    ? {
        eventName: bookingDetail.event.displayName || 'N/A',
        eventDescription: bookingDetail.event.description || '',
        expectedNumberOfParticipants:
          bookingDetail.event.expectedNumberOfParticipants || 0,
        allowTickets: bookingDetail.event.allowTickets ?? false,
        status: bookingDetail.event.status || 'DRAFT',
        startDate: bookingDetail.event.startDate,
        endDate: bookingDetail.event.endDate,
        avatarUrl: bookingDetail.event.avatarUrl,
        coverUrl: bookingDetail.event.coverUrl,
        organizer: bookingDetail.createdBy
          ? {
              name: `${bookingDetail.createdBy.firstName} ${bookingDetail.createdBy.lastName}`,
              email: bookingDetail.createdBy.email,
              phoneNumber: bookingDetail.createdBy.phoneNumber,
              avatarUrl: bookingDetail.createdBy.avatarUrl,
            }
          : null,
        socialLinks: bookingDetail.event.social || [],
        totalReviews: bookingDetail.event.totalReviews || 0,
        avgRating: bookingDetail.event.avgRating || 0,
      }
    : null;

  return (
    <PageContainer maxWidth='2xl'>
      {/* Header */}
      <PageHeader
        title='Booking Details'
        icon={Calendar}
        actions={
          <div className='flex items-center gap-3'>
            {getStatusBadge(bookingDetail.status)}
            <Button variant='outline' size='icon' onClick={() => router.back()}>
              <ArrowLeft className='h-4 w-4' />
            </Button>
          </div>
        }
      />

      {/* Grid Content */}
      <div className='grid grid-cols-1 lg:grid-cols-3 gap-6'>
        {/* Left Column */}
        <div className='lg:col-span-2 space-y-6'>
          {/* Event Information */}
          {eventData && (
            <Card className='border-2 border-primary/10 shadow-lg bg-card/80 backdrop-blur-sm overflow-hidden'>
              {/* Cover Image */}
              {eventData.coverUrl && (
                <div className='relative h-48 w-full overflow-hidden'>
                  <img
                    src={eventData.coverUrl}
                    alt='Event cover'
                    className='w-full h-full object-cover cursor-pointer'
                    onClick={() => handleImageClick(eventData.coverUrl!)}
                  />
                  <div className='absolute inset-0 bg-gradient-to-t from-background/80 via-background/40 to-transparent' />
                </div>
              )}

              <CardHeader
                className={cn(
                  'bg-white border-b border-primary/20 py-3',
                  !eventData.coverUrl && 'border-b'
                )}
              >
                <div className='flex items-start gap-4'>
                  {/* Event Avatar */}
                  {eventData.avatarUrl ? (
                    <div className='relative flex-shrink-0'>
                      <img
                        src={eventData.avatarUrl}
                        alt='Event avatar'
                        className={cn(
                          'rounded-lg object-cover border-2 border-background shadow-md cursor-pointer',
                          eventData.coverUrl ? 'h-20 w-20 -mt-10' : 'h-16 w-16'
                        )}
                        onClick={() => handleImageClick(eventData.avatarUrl!)}
                      />
                    </div>
                  ) : (
                    <div
                      className={cn(
                        'rounded-lg bg-primary/20 flex items-center justify-center border-2 border-background shadow-md flex-shrink-0',
                        eventData.coverUrl ? 'h-20 w-20 -mt-10' : 'h-16 w-16'
                      )}
                    >
                      <Sparkles
                        className={cn(
                          'text-primary',
                          eventData.coverUrl ? 'h-8 w-8' : 'h-6 w-6'
                        )}
                      />
                    </div>
                  )}

                  <div className='flex-1 min-w-0 pt-1'>
                    <div className='flex items-center gap-2 flex-wrap'>
                      <CardTitle className='text-xl font-bold text-foreground'>
                        {eventData.eventName}
                      </CardTitle>
                      <Badge
                        variant='outline'
                        className='text-xs bg-primary/10 text-primary border-primary/30'
                      >
                        {formatBookingObject(bookingDetail.bookingObject)}
                      </Badge>
                    </div>
                    {eventData.status && eventData.status !== 'N/A' && (
                      <Badge variant='outline' className='mt-1.5 text-xs'>
                        {eventData.status}
                      </Badge>
                    )}
                  </div>
                </div>
              </CardHeader>

              <CardContent className='pt-0 pb-4'>
                <div className='space-y-4'>
                  {/* Description */}
                  {eventData.eventDescription && (
                    <div>
                      <p className='text-sm text-muted-foreground leading-relaxed'>
                        {eventData.eventDescription}
                      </p>
                    </div>
                  )}

                  <Separator />

                  {/* Event Details Grid */}
                  <div className='grid grid-cols-2 gap-4'>
                    <div className='flex items-center gap-2'>
                      <Users className='h-4 w-4 text-primary flex-shrink-0' />
                      <div>
                        <p className='text-xs text-muted-foreground'>
                          Expected participants
                        </p>
                        <p className='text-sm font-semibold'>
                          {eventData.expectedNumberOfParticipants}
                        </p>
                      </div>
                    </div>
                    <div className='flex items-center gap-2'>
                      <Badge
                        variant={eventData.allowTickets ? 'default' : 'outline'}
                        className='font-medium'
                      >
                        {eventData.allowTickets
                          ? 'Tickets Enabled'
                          : 'No Tickets'}
                      </Badge>
                    </div>
                  </div>

                  {/* Ratings */}
                  {(eventData.avgRating > 0 || eventData.totalReviews > 0) && (
                    <div className='flex items-center gap-4'>
                      {eventData.avgRating > 0 && (
                        <div className='flex items-center gap-1.5'>
                          <Star className='h-4 w-4 text-amber-500 fill-amber-500' />
                          <span className='text-sm font-semibold'>
                            {eventData.avgRating.toFixed(1)}
                          </span>
                        </div>
                      )}
                      {eventData.totalReviews > 0 && (
                        <span className='text-xs text-muted-foreground'>
                          {eventData.totalReviews}{' '}
                          {eventData.totalReviews === 1 ? 'review' : 'reviews'}
                        </span>
                      )}
                    </div>
                  )}

                  {/* Dates */}
                  {eventData.startDate && eventData.endDate && (
                    <>
                      <Separator />
                      <div className='grid grid-cols-2 gap-4'>
                        <div>
                          <p className='text-xs font-semibold text-muted-foreground mb-1'>
                            Start Date
                          </p>
                          <p className='text-sm text-foreground'>
                            {format(
                              new Date(eventData.startDate),
                              "MMM dd, yyyy 'at' h:mm a"
                            )}
                          </p>
                        </div>
                        <div>
                          <p className='text-xs font-semibold text-muted-foreground mb-1'>
                            End Date
                          </p>
                          <p className='text-sm text-foreground'>
                            {format(
                              new Date(eventData.endDate),
                              "MMM dd, yyyy 'at' h:mm a"
                            )}
                          </p>
                        </div>
                      </div>
                    </>
                  )}

                  {/* Event Social Media */}
                  {eventData.socialLinks &&
                    eventData.socialLinks.length > 0 && (
                      <>
                        <Separator />
                        <div>
                          <p className='text-xs font-semibold text-muted-foreground mb-2'>
                            Social Media
                          </p>
                          <div className='flex flex-wrap gap-2'>
                            {eventData.socialLinks.map(
                              (link: any, index: number) => (
                                <a
                                  key={index}
                                  href={link.url}
                                  target='_blank'
                                  rel='noopener noreferrer'
                                  className='text-xs text-primary hover:underline flex items-center gap-1'
                                >
                                  <Globe className='h-3 w-3' />
                                  {link.platform}
                                </a>
                              )
                            )}
                          </div>
                        </div>
                      </>
                    )}

                  {/* Organizer */}
                  {eventData.organizer && (
                    <>
                      <Separator />
                      <div>
                        <p className='text-xs font-semibold text-muted-foreground mb-3'>
                          Organizer
                        </p>
                        <div className='space-y-3'>
                          <div className='flex items-center gap-3'>
                            {eventData.organizer.avatarUrl ? (
                              <img
                                src={eventData.organizer.avatarUrl}
                                alt='Organizer avatar'
                                className='h-10 w-10 rounded-full object-cover border-2 border-border cursor-pointer'
                                onClick={() =>
                                  handleImageClick(
                                    eventData.organizer!.avatarUrl!
                                  )
                                }
                              />
                            ) : (
                              <div className='h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center border-2 border-border'>
                                <User className='h-5 w-5 text-primary' />
                              </div>
                            )}
                            <div className='flex-1 min-w-0'>
                              {eventData.organizer.name && (
                                <p className='text-sm font-semibold text-foreground'>
                                  {eventData.organizer.name}
                                </p>
                              )}
                              {eventData.organizer.email && (
                                <a
                                  href={`mailto:${eventData.organizer.email}`}
                                  className='text-xs text-primary hover:underline block truncate'
                                >
                                  {eventData.organizer.email}
                                </a>
                              )}
                              {eventData.organizer.phoneNumber && (
                                <a
                                  href={`tel:${eventData.organizer.phoneNumber}`}
                                  className='text-xs text-primary hover:underline block'
                                >
                                  {eventData.organizer.phoneNumber}
                                </a>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    </>
                  )}
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Right Column */}
        <div className='lg:col-span-1 space-y-6'>
          {/* Payment Summary Card */}
          <Card className='border-2 border-primary/10 shadow-lg bg-card/80 backdrop-blur-sm overflow-hidden'>
            <CardContent className='p-6'>
              <div className='flex items-center justify-between gap-4'>
                <div className='flex items-center gap-4 flex-1 min-w-0'>
                  <div className='h-12 w-12 rounded-lg bg-green-100 dark:bg-green-900/40 flex items-center justify-center flex-shrink-0'>
                    <DollarSign className='h-6 w-6 text-green-600 dark:text-green-400' />
                  </div>
                  <div className='flex-1 min-w-0'>
                    <p className='text-sm font-medium text-muted-foreground mb-1'>
                      System will receive
                    </p>
                    <p className='text-2xl font-bold text-green-700 dark:text-green-400'>
                      {formatCurrency(
                        Number(
                          bookingDetail.amountToPay *
                            bookingDetail.systemCutPercentage || 0
                        )
                      )}
                    </p>
                    {bookingDetail.scheduledPayoutJob?.executeAt && (
                      <p className='text-xs text-muted-foreground mt-2 flex items-center gap-1'>
                        <Clock className='h-3 w-3' />
                        Scheduled:{' '}
                        <span className='font-medium'>
                          {formatDateTime(
                            bookingDetail.scheduledPayoutJob.executeAt
                          )}
                        </span>
                      </p>
                    )}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Location Card */}
          {bookingDetail.location && (
            <Card className='border-2 border-primary/10 shadow-lg bg-card/80 backdrop-blur-sm'>
              <CardHeader className='bg-white border-b border-primary/20 py-3'>
                <CardTitle className='flex items-center gap-2 text-lg'>
                  <div className='h-8 w-8 rounded-lg bg-primary/20 flex items-center justify-center'>
                    <MapPin className='h-4 w-4 text-primary' />
                  </div>
                  Booked Location
                </CardTitle>
              </CardHeader>
              <CardContent className='pt-4 pb-4'>
                <div className='space-y-4'>
                  {/* Location Image */}
                  {bookingDetail.location.imageUrl?.[0] && (
                    <div className='relative h-32 w-full rounded-lg overflow-hidden border-2 border-border/40'>
                      <img
                        src={bookingDetail.location.imageUrl[0]}
                        alt={bookingDetail.location.name}
                        className='w-full h-full object-cover cursor-pointer'
                        onClick={() =>
                          handleImageClick(bookingDetail.location!.imageUrl![0])
                        }
                      />
                    </div>
                  )}

                  {/* Location Name and Address */}
                  <div>
                    <h3 className='text-base font-bold text-foreground mb-2'>
                      {bookingDetail.location.name || 'N/A'}
                    </h3>
                    <div className='flex items-start gap-2'>
                      <MapPin className='h-4 w-4 text-muted-foreground flex-shrink-0 mt-0.5' />
                      <div className='text-sm text-muted-foreground'>
                        <p>
                          {bookingDetail.location.addressLine || 'N/A'}
                          {bookingDetail.location.addressLevel1 &&
                            `, ${bookingDetail.location.addressLevel1}`}
                          {bookingDetail.location.addressLevel2 &&
                            `, ${bookingDetail.location.addressLevel2}`}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Location Stats */}
                  <div className='grid grid-cols-2 gap-3 pt-2 border-t border-border/40'>
                    <div>
                      <p className='text-xs text-muted-foreground mb-1'>
                        Rating
                      </p>
                      <div className='flex items-center gap-1'>
                        <Star className='h-3.5 w-3.5 text-amber-500 fill-amber-500' />
                        <span className='text-sm font-semibold'>
                          {(
                            (bookingDetail.location as any)
                              ?.averageRating as number
                          )?.toFixed(1) || '0.0'}
                        </span>
                        <span className='text-xs text-muted-foreground'>
                          (
                          {((bookingDetail.location as any)
                            ?.totalReviews as number) || 0}
                          )
                        </span>
                      </div>
                    </div>
                    <div>
                      <p className='text-xs text-muted-foreground mb-1'>
                        Check-ins
                      </p>
                      <p className='text-sm font-semibold'>
                        {((bookingDetail.location as any)
                          ?.totalCheckIns as number) || 0}
                      </p>
                    </div>
                  </div>

                  {/* Action Button */}
                  <Link href={`/admin/locations/${bookingDetail.locationId}`}>
                    <Button variant='outline' className='w-full' size='sm'>
                      <ExternalLink className='h-4 w-4 mr-2' />
                      View Location Details
                    </Button>
                  </Link>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Booking Calendar */}
          {bookingDetail.dates &&
            bookingDetail.dates.length > 0 &&
            (() => {
              // Get all unique booking dates and map them to time ranges
              const bookingDates = new Set<string>();
              const dateTimeRanges = new Map<
                string,
                Array<{ start: Date; end: Date }>
              >();

              bookingDetail.dates.forEach((dateRange) => {
                const start = new Date(dateRange.startDateTime);
                const end = new Date(dateRange.endDateTime);
                const days = eachDayOfInterval({ start, end });

                days.forEach((day) => {
                  const dayKey = format(day, 'yyyy-MM-dd');
                  bookingDates.add(dayKey);

                  // Calculate the time range for this specific day
                  const dayStart = startOfDay(day);
                  const dayEnd = endOfDay(day);

                  // Get the actual start and end times for this day
                  const actualStart = start > dayStart ? start : dayStart;
                  const actualEnd = end < dayEnd ? end : dayEnd;

                  if (!dateTimeRanges.has(dayKey)) {
                    dateTimeRanges.set(dayKey, []);
                  }
                  dateTimeRanges.get(dayKey)!.push({
                    start: actualStart,
                    end: actualEnd,
                  });
                });
              });

              // Merge continuous time ranges for each date
              dateTimeRanges.forEach((ranges, dayKey) => {
                if (ranges.length <= 1) return;

                // Sort ranges by start time
                const sorted = [...ranges].sort(
                  (a, b) => a.start.getTime() - b.start.getTime()
                );
                const merged: Array<{ start: Date; end: Date }> = [];

                let current = sorted[0];

                for (let i = 1; i < sorted.length; i++) {
                  const next = sorted[i];
                  // Check if current range is adjacent or overlapping with next
                  if (current.end.getTime() >= next.start.getTime()) {
                    // Merge: extend current range to include next
                    current = {
                      start: current.start,
                      end:
                        current.end.getTime() > next.end.getTime()
                          ? current.end
                          : next.end,
                    };
                  } else {
                    // Not continuous, save current and start new
                    merged.push(current);
                    current = next;
                  }
                }

                // Add the last range
                merged.push(current);

                // Update the map with merged ranges
                dateTimeRanges.set(dayKey, merged);
              });

              // Get calendar days for current month
              const monthStart = startOfMonth(calendarMonth);
              const monthEnd = endOfMonth(calendarMonth);
              const calendarStart = startOfDay(monthStart);
              const calendarEnd = endOfDay(monthEnd);

              // Get first day of week (0 = Sunday, 1 = Monday, etc.)
              const firstDayOfWeek = getDay(monthStart);
              const daysInMonth = eachDayOfInterval({
                start: calendarStart,
                end: calendarEnd,
              });

              // Add padding days at the start
              const paddingStart =
                firstDayOfWeek === 0 ? 6 : firstDayOfWeek - 1; // Monday = 0
              const allDays: (Date | null)[] = [];
              for (let i = 0; i < paddingStart; i++) {
                allDays.push(null);
              }
              daysInMonth.forEach((day) => allDays.push(day));

              const weekDays = [
                'Mon',
                'Tue',
                'Wed',
                'Thu',
                'Fri',
                'Sat',
                'Sun',
              ];

              return (
                <TooltipProvider>
                  <Card className='border-2 border-primary/10 shadow-lg bg-card/80 backdrop-blur-sm'>
                    <CardHeader className='bg-white border-b border-primary/20 py-3'>
                      <div className='flex items-center justify-between'>
                        <CardTitle className='flex items-center gap-2 text-lg'>
                          <div className='h-8 w-8 rounded-lg bg-primary/20 flex items-center justify-center'>
                            <CalendarIcon className='h-4 w-4 text-primary' />
                          </div>
                          Booking Calendar
                        </CardTitle>
                        <div className='flex items-center gap-1'>
                          <Button
                            variant='ghost'
                            size='icon'
                            className='h-8 w-8'
                            onClick={() =>
                              setCalendarMonth(subMonths(calendarMonth, 1))
                            }
                          >
                            <ChevronLeft className='h-4 w-4' />
                          </Button>
                          <Button
                            variant='ghost'
                            size='icon'
                            className='h-8 w-8'
                            onClick={() =>
                              setCalendarMonth(addMonths(calendarMonth, 1))
                            }
                          >
                            <ChevronRight className='h-4 w-4' />
                          </Button>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent className='pt-4 pb-4 px-4'>
                      <div className='space-y-3'>
                        <div className='text-center text-sm font-semibold text-foreground'>
                          {format(calendarMonth, 'MMMM yyyy')}
                        </div>
                        <div className='grid grid-cols-7 gap-1'>
                          {weekDays.map((day) => (
                            <div
                              key={day}
                              className='text-center text-xs font-semibold text-muted-foreground py-1'
                            >
                              {day}
                            </div>
                          ))}
                          {allDays.map((day, index) => {
                            if (!day) {
                              return (
                                <div
                                  key={`empty-${index}`}
                                  className='aspect-square'
                                />
                              );
                            }
                            const dayKey = format(day, 'yyyy-MM-dd');
                            const isBookingDate = bookingDates.has(dayKey);
                            const isCurrentMonth = isSameMonth(
                              day,
                              calendarMonth
                            );
                            const isToday = isSameDay(day, new Date());
                            const timeRanges = isBookingDate
                              ? dateTimeRanges.get(dayKey) || []
                              : [];

                            const dateCell = (
                              <div
                                key={dayKey}
                                className={cn(
                                  'aspect-square flex items-center justify-center text-xs font-medium rounded-md transition-colors cursor-default',
                                  !isCurrentMonth && 'text-muted-foreground/40',
                                  isCurrentMonth &&
                                    !isBookingDate &&
                                    !isToday &&
                                    'text-foreground hover:bg-muted/50',
                                  isToday &&
                                    !isBookingDate &&
                                    'bg-primary/10 text-primary font-semibold ring-2 ring-primary/20',
                                  isBookingDate &&
                                    'bg-primary text-primary-foreground font-semibold shadow-sm'
                                )}
                              >
                                {format(day, 'd')}
                              </div>
                            );

                            if (isBookingDate && timeRanges.length > 0) {
                              return (
                                <Tooltip key={dayKey}>
                                  <TooltipTrigger asChild>
                                    {dateCell}
                                  </TooltipTrigger>
                                  <TooltipContent
                                    side='top'
                                    className='max-w-xs'
                                  >
                                    <div className='space-y-1'>
                                      <div className='font-semibold text-xs mb-1'>
                                        {format(day, 'MMM dd, yyyy')}
                                      </div>
                                      {timeRanges.map((range, idx) => (
                                        <div key={idx} className='text-xs'>
                                          {format(range.start, 'HH:mm')} -{' '}
                                          {format(range.end, 'HH:mm')}
                                        </div>
                                      ))}
                                    </div>
                                  </TooltipContent>
                                </Tooltip>
                              );
                            }

                            return dateCell;
                          })}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </TooltipProvider>
              );
            })()}
        </div>
      </div>

      <ImageViewer
        src={currentImageSrc}
        alt='Enlarged preview'
        open={isImageViewerOpen}
        onOpenChange={setIsImageViewerOpen}
      />
    </PageContainer>
  );
}
