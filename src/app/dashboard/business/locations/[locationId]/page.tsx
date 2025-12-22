'use client';

import { useLocationById } from '@/hooks/locations/useLocationById';
import {
  Rocket,
  Ticket,
  DollarSign,
  Users,
  ArrowRight,
  Calendar,
  MapPin as MapPinIcon,
  Clock,
} from 'lucide-react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { GoogleMapsPicker } from '@/components/shared/GoogleMapsPicker';
import { Badge } from '@/components/ui/badge';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { use, useMemo, useState, useEffect, useCallback } from 'react';
import { usePathname } from 'next/navigation';
import React from 'react';
import { ImageViewer } from '@/components/shared/ImageViewer';
import { useLocationVouchers } from '@/hooks/vouchers/useLocationVouchers';
import { useLocationMissions } from '@/hooks/missions/useLocationMissions';
import { CalendarDays as CalendarDaysIcon, Megaphone } from 'lucide-react';
import { useOwnerLocationBookingConfig } from '@/hooks/locations/useOwnerLocationBookingConfig';
import { Label } from '@/components/ui/label';
import { useAnnouncements } from '@/hooks/announcements/useAnnouncements';
import { useLocationTabs } from '@/contexts/LocationTabContext';
import { StatCard } from '@/components/shared/StatCard';
import { Tabs, TabsContent } from '@/components/ui/tabs';
import { useOwnerLocationBookings } from '@/hooks/locations/useOwnerLocationBookings';
import { useLocationCheckIns } from '@/hooks/locations/useLocationCheckIns';
import { format, formatDistanceToNow } from 'date-fns';
import { useLocationGeneralAnalytics } from '@/hooks/locations/useLocationGeneralAnalytics';

export default function LocationDetailsPage({
  params,
}: {
  params: Promise<{ locationId: string }>;
}) {
  const { locationId } = use(params);
  const { data: location, isLoading, isError } = useLocationById(locationId);
  const router = useRouter();
  const pathname = usePathname();
  const [activeTab, setActiveTab] = useState('overview');
  const [isImageViewerOpen, setIsImageViewerOpen] = useState(false);
  const [currentImageSrc, setCurrentImageSrc] = useState<string>('');

  // Fetch booking config to check if bookings are enabled
  const { data: bookingConfig } = useOwnerLocationBookingConfig(locationId);

  // Fetch all vouchers and missions for visualizations
  const { data: allVouchersResponse } = useLocationVouchers({
    locationId,
    page: 1,
    limit: 1000,
    sortBy: 'createdAt:DESC',
  });

  const { data: allMissionsResponse } = useLocationMissions({
    locationId,
    page: 1,
    limit: 1000,
    sortBy: 'createdAt:DESC',
  });

  const allVouchers = allVouchersResponse?.data || [];
  const allMissions = allMissionsResponse?.data || [];

  const { data: generalAnalytics } = useLocationGeneralAnalytics(locationId);

  const totalAnnouncements = generalAnalytics?.announcements ?? 0;
  const totalVouchers = generalAnalytics?.vouchers ?? 0;
  const totalMissions = generalAnalytics?.missions ?? 0;
  const totalCheckIns = generalAnalytics?.checkIns ?? 0;
  const totalRevenue = generalAnalytics?.revenue ?? 0;

  useEffect(() => {
    if (pathname.includes('/vouchers')) setActiveTab('vouchers');
    else if (pathname.includes('/missions')) setActiveTab('missions');
    else if (
      pathname.includes('/availability') ||
      pathname.includes('/booking-config')
    )
      setActiveTab('booking');
    else if (pathname.includes('/announcements')) setActiveTab('announcements');
    else if (pathname.includes('/check-ins')) setActiveTab('check-ins');
    else if (pathname.includes('/edit')) setActiveTab('edit');
    else setActiveTab('overview');
  }, [pathname]);

  // Get bookings data for calculations
  const { data: bookingsData } = useOwnerLocationBookings({
    page: 1,
    limit: 100,
    sortBy: 'createdAt:DESC',
    status: 'ALL',
  });

  // Fetch recent check-ins
  const { data: checkInsData } = useLocationCheckIns({
    locationId,
    page: 1,
    limit: 10,
    sortBy: 'createdAt:DESC',
  });

  const recentCheckIns = checkInsData?.data || [];

  // Calculate revenue from bookings
  const revenueData = generalAnalytics?.revenue ?? 0;

  // Get upcoming bookings
  const upcomingBookings = useMemo(() => {
    const allBookings = bookingsData?.data || [];
    const locationBookings = allBookings
      .filter((booking: any) => {
        if (booking.locationId !== location?.id) return false;
        if (booking.status?.toUpperCase() === 'CANCELLED') return false;
        const hasFutureDate = booking.dates?.some((dateSlot: any) => {
          const endDate = new Date(dateSlot.endDateTime);
          return endDate >= new Date();
        });
        return hasFutureDate;
      })
      .slice(0, 5);

    return locationBookings.map((booking: any) => {
      const earliestDate = booking.dates?.[0]?.startDateTime
        ? new Date(booking.dates[0].startDateTime)
        : new Date();
      return {
        id: booking.id,
        eventName: booking.event?.displayName || 'Unnamed Event',
        date: earliestDate,
        amount: parseFloat(booking.amountToPay || '0'),
        status: booking.status,
      };
    });
  }, [bookingsData, location?.id]);

  // Format currency helper for overview
  const formatCurrencyOverview = useCallback((amount: number) => {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND',
    }).format(amount);
  }, []);

  if (isLoading) {
    return null; // Layout handles loading state
  }
  if (isError || !location) {
    return null; // Layout handles error state
  }

  const position = {
    lat: location.latitude,
    lng: location.longitude,
  };

  return (
    <Tabs value={activeTab} onValueChange={setActiveTab} className='w-full'>
      {/* Tab Content */}
      <div className='animate-in fade-in-0 slide-in-from-bottom-2 duration-300'>
        <TabsContent value='overview' className='mt-0'>
          <div className='space-y-6'>
            {/* Enhanced Stats Cards - 8 Cards in 2 rows */}
            <div className='grid gap-4 md:grid-cols-2 xl:grid-cols-5'>
              {/* Row 1 */}
              <StatCard
                title='Check-ins'
                value={totalCheckIns}
                icon={Users}
                color='red'
              />

              <StatCard
                title='Revenue'
                value={formatCurrencyOverview(totalRevenue)}
                icon={DollarSign}
                color='emerald'
              />

              <StatCard
                title='Announcements'
                value={totalAnnouncements}
                icon={Megaphone}
                color='amber'
              />

              <StatCard
                title='Vouchers'
                value={totalVouchers}
                icon={Ticket}
                color='orange'
              />

              <StatCard
                title='Missions'
                value={totalMissions}
                icon={Rocket}
                color='purple'
              />
            </div>

            {/* Upcoming Bookings & Recent Activity */}
            <div className='grid grid-cols-1 lg:grid-cols-2 gap-4'>
              {/* Upcoming Bookings Widget */}
              <Card className='border-border/60 shadow-sm py-2'>
                <CardHeader className='pb-3 pt-4'>
                  <CardTitle className='flex items-center gap-2 text-base'>
                    <Calendar className='h-5 w-5 text-primary' />
                    Upcoming Bookings
                  </CardTitle>
                  <CardDescription>Next 5 upcoming bookings</CardDescription>
                </CardHeader>
                <CardContent className='space-y-3'>
                  {upcomingBookings.length === 0 ? (
                    bookingConfig && !bookingConfig.allowBooking ? (
                      <div className='text-center py-8'>
                        <Calendar className='h-12 w-12 mx-auto mb-3 opacity-50 text-muted-foreground' />
                        <p className='text-sm font-medium text-foreground mb-1'>
                          Bookings are disabled
                        </p>
                        <p className='text-xs text-muted-foreground mb-4'>
                          Go to Booking and Availability to enable location
                          bookings.
                        </p>
                        <Button
                          variant='outline'
                          size='sm'
                          onClick={() =>
                            router.push(
                              `/dashboard/business/locations/${locationId}/availability?tab=calendar`
                            )
                          }
                        >
                          Go to Booking and Availability
                          <ArrowRight className='h-4 w-4 ml-2' />
                        </Button>
                      </div>
                    ) : (
                      <div className='text-center py-8 text-muted-foreground'>
                        <Calendar className='h-12 w-12 mx-auto mb-2 opacity-50' />
                        <p className='text-sm'>No upcoming bookings</p>
                      </div>
                    )
                  ) : (
                    upcomingBookings.map((booking: any) => (
                      <div
                        key={booking.id}
                        onClick={() =>
                          router.push(
                            `/dashboard/business/location-bookings/${booking.id}`
                          )
                        }
                        className='flex items-center justify-between p-3 rounded-lg border bg-muted/30 hover:bg-muted/50 transition-colors cursor-pointer'
                      >
                        <div className='flex-1 min-w-0'>
                          <p className='font-semibold text-sm truncate'>
                            {booking.eventName}
                          </p>
                          <div className='flex items-center gap-3 mt-1 text-xs text-muted-foreground'>
                            <span className='flex items-center gap-1'>
                              <Calendar className='h-3 w-3' />
                              {format(booking.date, 'MMM dd, yyyy')}
                            </span>
                            <span className='flex items-center gap-1 text-emerald-600 font-medium'>
                              <DollarSign className='h-3 w-3' />
                              {formatCurrencyOverview(booking.amount)}
                            </span>
                          </div>
                        </div>
                        <Badge
                          variant={
                            booking.status === 'PAYMENT_RECEIVED'
                              ? 'default'
                              : booking.status ===
                                'AWAITING_BUSINESS_PROCESSING'
                              ? 'secondary'
                              : 'outline'
                          }
                          className='ml-2 shrink-0'
                        >
                          {booking.status === 'PAYMENT_RECEIVED'
                            ? 'Paid'
                            : booking.status === 'AWAITING_BUSINESS_PROCESSING'
                            ? 'Pending'
                            : booking.status}
                        </Badge>
                      </div>
                    ))
                  )}
                  {upcomingBookings.length > 0 && (
                    <Button
                      variant='ghost'
                      size='sm'
                      className='w-full mt-2'
                      onClick={() =>
                        router.push(
                          `/dashboard/business/locations/${locationId}/availability?tab=calendar`
                        )
                      }
                    >
                      View All Bookings
                      <ArrowRight className='h-4 w-4 ml-2' />
                    </Button>
                  )}
                </CardContent>
              </Card>

              {/* Map - Main Component */}
              <Card className='border-border/60 shadow-sm py-0'>
                <CardContent className='h-[400px] rounded-lg overflow-hidden p-0'>
                  <GoogleMapsPicker
                    position={position}
                    onPositionChange={() => {}}
                    label={`${location.addressLine}${
                      location.addressLevel1 && location.addressLevel2
                        ? `, ${location.addressLevel1}, ${location.addressLevel2}`
                        : ''
                    }`}
                    readOnly={true}
                  />
                </CardContent>
              </Card>
            </div>

            {/* Recent Check-ins Widget */}
            <Card className='border-border/60 shadow-sm py-3'>
              <CardHeader className='pb-3 pt-4'>
                <CardTitle className='flex items-center gap-2 text-base'>
                  <MapPinIcon className='h-5 w-5 text-primary' />
                  Recent Check-ins
                </CardTitle>
                <CardDescription>
                  Latest check-ins at this location
                </CardDescription>
              </CardHeader>
              <CardContent className='space-y-3'>
                {recentCheckIns.length === 0 ? (
                  <div className='text-center py-8 text-muted-foreground'>
                    <MapPinIcon className='h-12 w-12 mx-auto mb-2 opacity-50' />
                    <p className='text-sm'>No check-ins yet</p>
                  </div>
                ) : (
                  <>
                    <div className='space-y-2'>
                      {recentCheckIns.map((checkIn: any) => {
                        const userName = checkIn.userProfile?.account
                          ? `${checkIn.userProfile.account.firstName} ${checkIn.userProfile.account.lastName}`.trim() ||
                            checkIn.userProfile.account.email
                          : 'Unknown User';
                        const checkInDate = new Date(checkIn.createdAt);
                        const timeAgo = formatDistanceToNow(checkInDate, {
                          addSuffix: true,
                        });

                        return (
                          <div
                            key={checkIn.id}
                            className='flex items-center gap-3 p-2 rounded-lg border bg-muted/30 hover:bg-muted/50 transition-colors'
                          >
                            <div className='flex-shrink-0'>
                              {checkIn.userProfile?.account?.avatarUrl ? (
                                <img
                                  src={checkIn.userProfile.account.avatarUrl}
                                  alt={userName}
                                  className='w-10 h-10 rounded-full object-cover border-2 border-background'
                                />
                              ) : (
                                <div className='w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center border-2 border-background'>
                                  <Users className='h-5 w-5 text-primary' />
                                </div>
                              )}
                            </div>
                            <div className='flex-1 min-w-0'>
                              <p className='font-medium text-sm truncate'>
                                {userName}
                              </p>
                              <div className='flex items-center gap-2 mt-0.5 text-xs text-muted-foreground'>
                                <Clock className='h-3 w-3' />
                                <span>{timeAgo}</span>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                    <Button
                      variant='ghost'
                      size='sm'
                      className='w-full mt-2'
                      onClick={() =>
                        router.push(
                          `/dashboard/business/locations/${locationId}/check-ins`
                        )
                      }
                    >
                      View More
                      <ArrowRight className='h-4 w-4 ml-2' />
                    </Button>
                  </>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Image Viewer for Overview Tab */}
          <ImageViewer
            src={currentImageSrc}
            alt='Location image'
            open={isImageViewerOpen}
            onOpenChange={setIsImageViewerOpen}
          />
        </TabsContent>
      </div>
    </Tabs>
  );
}
