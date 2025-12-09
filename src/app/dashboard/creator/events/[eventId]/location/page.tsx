"use client";

import React, { use, useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert";
import { MapPin, Calendar, Plus, Building2, Loader2, CheckCircle, Clock, AlertCircle, List, Info, Star, Mail, Phone, Globe, CreditCard, XCircle } from "lucide-react";
import { useEventTabs } from "@/contexts/EventTabContext";
import { useEventById } from "@/hooks/events/useEventById";
import { useBookableLocationById } from "@/hooks/events/useBookableLocationById";
import { format, isSameDay, startOfDay, endOfDay, eachDayOfInterval, differenceInHours } from "date-fns";
import Image from "next/image";
import { APIProvider, Map, AdvancedMarker, Pin } from "@vis.gl/react-google-maps";
import { toast } from "sonner";
import type { LocationBooking } from "@/types";
import { PaymentModal } from "@/components/shared/PaymentModal";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { initiateLocationBookingPayment } from "@/api/events";
import { useEventLocationBookings } from "@/hooks/events/useEventLocationBookings";
import { CancelBookingDialog } from "./_components/CancelBookingDialog";

const getStatusBadge = (status: string) => {
  const statusUpper = status?.toUpperCase();
  switch (statusUpper) {
    case "PAYMENT_RECEIVED":
      return (
        <Badge
          variant="outline"
          className="bg-green-50 text-green-700 border-green-300 dark:bg-green-950 dark:text-green-300 dark:border-green-700"
        >
          <CheckCircle className="h-3 w-3 mr-1" />
          Payment Received
        </Badge>
      );
    case "AWAITING_BUSINESS_PROCESSING":
      return (
        <Badge
          variant="outline"
          className="bg-yellow-50 text-yellow-700 border-yellow-300 dark:bg-yellow-950 dark:text-yellow-300 dark:border-yellow-700"
        >
          <Clock className="h-3 w-3 mr-1" />
          Awaiting Processing
        </Badge>
      );
    case "SOFT_LOCKED":
      return (
        <Badge
          variant="outline"
          className="bg-blue-50 text-blue-700 border-blue-300 dark:bg-blue-950 dark:text-blue-300 dark:border-blue-700"
        >
          <Clock className="h-3 w-3 mr-1" />
          Soft Locked
        </Badge>
      );
    case "CANCELLED":
      return (
        <Badge
          variant="outline"
          className="bg-red-50 text-red-700 border-red-300 dark:bg-red-950 dark:text-red-300 dark:border-red-700"
        >
          <AlertCircle className="h-3 w-3 mr-1" />
          Cancelled
        </Badge>
      );
    default:
      return (
        <Badge variant="outline">
          {status?.charAt(0).toUpperCase() + status?.slice(1).toLowerCase() || status}
        </Badge>
      );
  }
};

const formatCurrency = (amount: string) => {
  const num = parseFloat(amount);
  return new Intl.NumberFormat("vi-VN", {
    style: "currency",
    currency: "VND",
    minimumFractionDigits: 0,
  }).format(num);
};

const formatDateRange = (dates: { startDateTime: string; endDateTime: string }[]) => {
  if (dates.length === 0) return "No dates";
  if (dates.length === 1) {
    const start = new Date(dates[0].startDateTime);
    const end = new Date(dates[0].endDateTime);
    return `${format(start, "MMM dd, yyyy HH:mm")} - ${format(end, "HH:mm")}`;
  }
  return `${dates.length} time slots`;
};

function LocationCard({
  location,
  detailedLocation,
  mapCenter,
  hasValidCoords,
  apiKey,
}: {
  location: { 
    id: string;
    name: string;
    description: string | null;
    latitude: string;
    longitude: string;
    addressLine: string;
    addressLevel1: string | null;
    addressLevel2: string | null;
    imageUrl: string[];
  };
  detailedLocation: unknown;
  mapCenter: { lat: number; lng: number };
  hasValidCoords: boolean;
  apiKey: string;
}) {
  const [isDescriptionExpanded, setIsDescriptionExpanded] = useState(false);
  const [isDescriptionTruncated, setIsDescriptionTruncated] = useState(false);
  const descriptionRef = useRef<HTMLParagraphElement>(null);
  
  useEffect(() => {
    if (descriptionRef.current && location.description) {
      // Check if the text is actually truncated by comparing scrollHeight with clientHeight
      const isTruncated = descriptionRef.current.scrollHeight > descriptionRef.current.clientHeight;
      setIsDescriptionTruncated(isTruncated);
    }
  }, [location.description, isDescriptionExpanded]);
  
  type LocationWithAnalytics = typeof detailedLocation & {
    averageRating?: string | number;
    totalReviews?: number;
    totalCheckIns?: string | number;
    business?: { 
      email?: string; 
      phone?: string;
      website?: string;
    };
  };
  
  const displayLocation = detailedLocation || location;
  const averageRating = (displayLocation as LocationWithAnalytics)?.averageRating;
  const totalReviews = (displayLocation as LocationWithAnalytics)?.totalReviews ?? 0;
  const totalCheckInsValue = (displayLocation as LocationWithAnalytics)?.totalCheckIns ?? 0;
  const totalCheckIns = typeof totalCheckInsValue === 'string' ? parseInt(totalCheckInsValue, 10) : totalCheckInsValue;
  const ratingValue = averageRating ? parseFloat(String(averageRating)) : 0;
  const businessEmail = (displayLocation as LocationWithAnalytics)?.business?.email;
  const businessPhone = (displayLocation as LocationWithAnalytics)?.business?.phone;
  const businessWebsite = (displayLocation as LocationWithAnalytics)?.business?.website;

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      {/* Left Column: Location Data Card */}
      <Card className="h-[600px] flex flex-col p-0 overflow-hidden col-span-2">
        {/* Hero Image */}
        {location.imageUrl && location.imageUrl.length > 0 && (
          <div className="relative w-full h-48 flex-shrink-0">
            <Image
              src={location.imageUrl[0]}
              alt={location.name || "Location"}
              fill
              className="object-cover"
            />
          </div>
        )}
        
        <div className="flex-1 overflow-y-auto p-6 pt-0">
          {/* Location Name */}
          <h2 className="text-2xl font-bold mb-1">{location.name || "Unknown Location"}</h2>
          
          {/* Rating, Reviews, and Check-ins */}
          <div className="flex items-center gap-3 text-sm text-muted-foreground mb-6">
            <div className="flex items-center gap-1">
              <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
              <span className="text-foreground font-medium">{ratingValue.toFixed(1)}</span>
            </div>
            <span>•</span>
            <span>{totalReviews} {totalReviews === 1 ? 'review' : 'reviews'}</span>
            <span>•</span>
            <span>{totalCheckIns} {totalCheckIns === 1 ? 'check-in' : 'check-ins'}</span>
          </div>
          
          {/* Address */}
          <div className="flex items-center gap-2 mb-2">
            <MapPin className="h-5 w-5 text-red-500 flex-shrink-0" />
            <p className="text-sm text-foreground">
              {`${location.addressLine}${location.addressLevel1 ? `, ${location.addressLevel1}` : ""}${location.addressLevel2 ? `, ${location.addressLevel2}` : ""}`}
            </p>
          </div>
          
          {/* Contact Information */}
          {(businessEmail || businessPhone || businessWebsite) && (
            <div className="space-y-2 mb-6">
              {businessEmail && (
                <div className="flex items-center gap-2">
                  <Mail className="h-5 w-5 text-blue-500 flex-shrink-0" />
                  <p className="text-sm text-foreground">{businessEmail}</p>
                </div>
              )}
              {businessPhone && (
                <div className="flex items-center gap-2">
                  <Phone className="h-5 w-5 text-green-500 flex-shrink-0" />
                  <p className="text-sm text-foreground">{businessPhone}</p>
                </div>
              )}
              {businessWebsite && (
                <div className="flex items-center gap-2">
                  <Globe className="h-5 w-5 text-purple-500 flex-shrink-0" />
                  <a 
                    href={businessWebsite} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="text-sm text-blue-600 hover:underline"
                  >
                    {businessWebsite}
                  </a>
                </div>
              )}
            </div>
          )}
          
          {/* Separator */}
          <div className="border-t border-border mb-6"></div>
          
          {/* Description */}
          {location.description && (
            <div className="space-y-2">
              <p 
                ref={descriptionRef}
                className={`text-sm text-foreground leading-relaxed ${!isDescriptionExpanded ? 'line-clamp-2' : ''}`}
              >
                {location.description}
              </p>
              {isDescriptionTruncated && (
                <button
                  onClick={() => setIsDescriptionExpanded(!isDescriptionExpanded)}
                  className="text-sm text-primary hover:underline"
                >
                  {isDescriptionExpanded ? 'Read less' : 'Read more'}
                </button>
              )}
            </div>
          )}
        </div>
      </Card>

      {/* Right Column: Map */}
      <div className="relative h-[600px] w-full rounded-lg overflow-hidden border">
        {apiKey && hasValidCoords ? (
          <APIProvider apiKey={apiKey}>
            <Map
              defaultCenter={mapCenter}
              defaultZoom={15}
              mapId="location-details-map"
              gestureHandling="none"
              disableDefaultUI={true}
              zoomControl={false}
              mapTypeControl={false}
              streetViewControl={false}
              fullscreenControl={false}
              draggable={false}
              keyboardShortcuts={false}
            >
              <AdvancedMarker
                position={mapCenter}
                title={location.name || "Location"}
              >
                <div title={location.name || "Location"}>
                  <Pin
                    background="#ef4444"
                    borderColor="#991b1b"
                    glyphColor="#fff"
                    scale={1.2}
                  />
                </div>
              </AdvancedMarker>
            </Map>
          </APIProvider>
        ) : (
          <div className="flex items-center justify-center h-full bg-muted text-muted-foreground">
            <div className="text-center">
              <MapPin className="h-12 w-12 mx-auto mb-2 opacity-20" />
              <p className="text-sm">Map unavailable</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default function EventLocationPage({
  params,
}: {
  params: Promise<{ eventId: string }>;
}) {
  const { eventId } = use(params);
  const router = useRouter();
  const queryClient = useQueryClient();
  const { data: event, isLoading: isEventLoading, refetch } = useEventById(eventId);
  const { data: locationBookings, isLoading: isBookingsLoading, refetch: refetchBookings } = useEventLocationBookings(eventId);
  const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || "";
  const [isCancelDialogOpen, setIsCancelDialogOpen] = useState(false);
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
  const paymentReturnUrl = typeof window !== "undefined" ? window.location.href : undefined;

  const { openBookLocationTab } = useEventTabs();

  const isEventCancelled = event?.status?.toUpperCase() === "CANCELLED";

  // Refetch data when page regains focus (e.g., after returning from payment gateway)
  useEffect(() => {
    const handleFocus = () => {
      // Refetch event and bookings to check for payment status updates
      refetch();
      refetchBookings();
      queryClient.invalidateQueries({ queryKey: ['eventDetail', eventId] });
    };

    window.addEventListener('focus', handleFocus);
    return () => window.removeEventListener('focus', handleFocus);
  }, [eventId, refetch, refetchBookings, queryClient]);

  // Get the latest booking with relevant statuses (awaiting approval, approved, paid, rejected)
  const currentBooking = locationBookings
    ?.filter((booking) => {
      const status = booking.status?.toUpperCase();
      return status === "AWAITING_BUSINESS_PROCESSING" || 
             status === "APPROVED" ||
             status === "PAYMENT_RECEIVED"
    })
    ?.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())[0];
  const hasCurrentBooking = !!currentBooking;
  
  // Fetch detailed location data for rating, reviews, and check-ins
  const { data: detailedLocation } = useBookableLocationById(currentBooking?.location?.id || null);

  const paymentMutation = useMutation({
    mutationFn: async ({ bookingId }: { bookingId: string }) => {
      await initiateLocationBookingPayment(eventId, bookingId);
    },
    onSuccess: () => {
      toast.success("Payment completed successfully.");
      // Invalidate all relevant queries to refresh payment status
      queryClient.invalidateQueries({ queryKey: ['eventDetail', eventId] });
      queryClient.invalidateQueries({ queryKey: ['eventLocationBookings', eventId] });
      // Refetch event and bookings data
      refetch();
      refetchBookings();
      router.refresh();
    },
    onError: (err: Error) => {
      toast.error(err.message || "Failed to complete payment.");
    },
  });

  const handleProceedPayment = async () => {
    if (!currentBooking?.id) {
      throw new Error("No active booking found.");
    }
    await paymentMutation.mutateAsync({ bookingId: currentBooking.id });
  };

  if (isEventLoading || isBookingsLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-12 w-12 animate-spin text-muted-foreground" />
      </div>
    );
  }

  const hasLocation = !!event?.locationId;

  return (
    <div className="space-y-6">
      <div className="space-y-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2 text-lg font-semibold">
            <MapPin className="h-5 w-5 text-primary" />
            <span>Venue Booking</span>
          </div>
          <p className="text-sm text-muted-foreground">
            Current booking status and venue details
          </p>
        </div>

        <Tabs defaultValue="current" className="w-full">
          <TabsList className="grid w-full max-w-md grid-cols-2">
            <TabsTrigger value="current">Current Booking</TabsTrigger>
            <TabsTrigger value="all">
              <List className="h-4 w-4 mr-2" />
              Booking History
            </TabsTrigger>
          </TabsList>
          
          <TabsContent value="current" className="mt-6">
              {hasCurrentBooking && currentBooking ? (
                <div className="space-y-6">
                  {/* Callout - show for awaiting approval status */}
                  {currentBooking.status?.toUpperCase() === "AWAITING_BUSINESS_PROCESSING" || 
                   currentBooking.status?.toUpperCase() === "SOFT_LOCKED" ? (
                    <Alert className="bg-yellow-50 border-yellow-200 dark:bg-yellow-950/20 dark:border-yellow-800">
                      <Info className="h-4 w-4 text-yellow-600 dark:text-yellow-500" />
                      <AlertTitle className="text-yellow-900 dark:text-yellow-100">Awaiting Confirmation</AlertTitle>
                      <AlertDescription className="text-yellow-800 dark:text-yellow-200">
                        We&apos;re waiting for the Owner of the location to confirm this booking.
                      </AlertDescription>
                    </Alert>
                  ) : null}
                  
                  {/* Callout - show for approved status */}
                  {currentBooking.status?.toUpperCase() === "APPROVED" && (
                    <Alert className="bg-green-50 border-green-200 dark:bg-green-950/20 dark:border-green-800">
                      <CheckCircle className="h-4 w-4 text-green-600 dark:text-green-500" />
                      <div className="flex-1 flex items-center justify-between gap-4">
                        <div className="flex-1">
                          <AlertTitle className="text-green-900 dark:text-green-100 mb-2">Location Approved</AlertTitle>
                          <AlertDescription className="text-green-800 dark:text-green-200">
                            <p>
                              Your location booking has been approved. Please pay before: {currentBooking.softLockedUntil ? (
                                <span className="font-semibold">{format(new Date(currentBooking.softLockedUntil), "MMM dd, yyyy 'at' HH:mm")}</span>
                              ) : (
                                <span className="font-semibold">N/A</span>
                              )}
                            </p>
                          </AlertDescription>
                        </div>
                        <Button 
                          onClick={() => setIsPaymentModalOpen(true)}
                          className="shrink-0 bg-green-600 hover:bg-green-700 text-white"
                          disabled={paymentMutation.isPending}
                        >
                          Complete Payment
                        </Button>
                      </div>
                    </Alert>
                  )}

                  {/* Location Information */}
                  {currentBooking.location && (() => {
                    const location = currentBooking.location;
                    const locationLat = parseFloat(location.latitude || "0");
                    const locationLng = parseFloat(location.longitude || "0");
                    const hasValidCoords = !isNaN(locationLat) && !isNaN(locationLng) && locationLat !== 0 && locationLng !== 0;
                    const mapCenter = hasValidCoords ? { lat: locationLat, lng: locationLng } : { lat: 10.8231, lng: 106.6297 };

                    return (
                      <LocationCard
                        location={location}
                        detailedLocation={detailedLocation}
                        mapCenter={mapCenter}
                        hasValidCoords={hasValidCoords}
                        apiKey={apiKey}
                      />
                    );
                  })()}

                  {/* Booking Information */}
                  <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    <Card className="col-span-2">
                      <CardHeader>
                        <div className="flex items-center justify-between gap-4 flex-wrap">
                          <CardTitle className="text-lg flex items-center gap-2">
                            <Calendar className="h-5 w-5 text-primary" />
                            Booking Details
                          </CardTitle>
                          <div className="flex items-center gap-4">
                            <div className="text-sm">
                              <span className="text-muted-foreground">Created: </span>
                              <span className="font-medium">{format(new Date(currentBooking.createdAt), "MMM dd, yyyy 'at' HH:mm")}</span>
                            </div>
                            {getStatusBadge(currentBooking.status)}
                          </div>
                        </div>
                      </CardHeader>
                      <CardContent className="space-y-6">
                        {currentBooking.dates && currentBooking.dates.length > 0 && (() => {
                          // Process dates: split multi-day ranges into individual days
                          const processedDates: Array<{ date: Date; startTime: Date; endTime: Date; isAllDay: boolean }> = [];
                          
                          currentBooking.dates.forEach((dateRange) => {
                            const start = new Date(dateRange.startDateTime);
                            const end = new Date(dateRange.endDateTime);
                            
                            if (isSameDay(start, end)) {
                              // Single day - add as is
                              const isAllDay = start.getHours() === 0 && 
                                              start.getMinutes() === 0 &&
                                              end.getHours() === 23 && 
                                              end.getMinutes() === 59;
                              processedDates.push({
                                date: start,
                                startTime: start,
                                endTime: end,
                                isAllDay
                              });
                            } else {
                              // Multiple days - split into individual days
                              const days = eachDayOfInterval({ start, end });
                              
                              days.forEach((day, dayIndex) => {
                                const isFirstDay = dayIndex === 0;
                                const isLastDay = dayIndex === days.length - 1;
                                
                                let dayStart: Date;
                                let dayEnd: Date;
                                
                                if (isFirstDay && isLastDay) {
                                  // Shouldn't happen, but handle it
                                  dayStart = start;
                                  dayEnd = end;
                                } else if (isFirstDay) {
                                  // First day: from start time to end of day
                                  dayStart = start;
                                  dayEnd = endOfDay(day);
                                } else if (isLastDay) {
                                  // Last day: from start of day to end time
                                  dayStart = startOfDay(day);
                                  dayEnd = end;
                                } else {
                                  // Middle days: full day
                                  dayStart = startOfDay(day);
                                  dayEnd = endOfDay(day);
                                }
                                
                                const isAllDay = dayStart.getHours() === 0 && 
                                                dayStart.getMinutes() === 0 &&
                                                dayEnd.getHours() === 23 && 
                                                dayEnd.getMinutes() === 59;
                                
                                processedDates.push({
                                  date: day,
                                  startTime: dayStart,
                                  endTime: dayEnd,
                                  isAllDay
                                });
                              });
                            }
                          });
                          
                          return (
                            <ul className="space-y-3 list-disc list-inside">
                              {processedDates.map((item, index) => (
                                <li key={index} className="text-base">
                                  {format(item.date, "EEEE, MMM d, yyyy")} - {item.isAllDay 
                                    ? `All day (${format(item.startTime, "HH:mm")} - ${format(item.endTime, "HH:mm")})`
                                    : `${format(item.startTime, "HH:mm")} - ${format(item.endTime, "HH:mm")}`
                                  }
                                </li>
                              ))}
                            </ul>
                          );
                        })()}
                        
                        {/* Destructive Actions */}
                        <div className="pt-6 mt-6 border-t">
                          <div className="space-y-3">
                            <h4 className="text-sm font-semibold text-destructive">Destructive Actions</h4>
                            <p className="text-xs text-muted-foreground">
                              This action cannot be undone. Cancelling will refund 100% of the booking fee if already paid.
                            </p>
                            <Button
                              variant="destructive"
                              size="default"
                              onClick={() => setIsCancelDialogOpen(true)}
                              className="w-full sm:w-auto"
                            >
                              <XCircle className="h-4 w-4 mr-2" />
                              Cancel Booking
                            </Button>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                    
                    {/* Cancel Booking Confirmation Dialog */}
                    <CancelBookingDialog
                      open={isCancelDialogOpen}
                      onOpenChange={setIsCancelDialogOpen}
                      eventId={eventId}
                      bookingId={currentBooking?.id}
                      onCancelled={() => {
                        router.refresh();
                        refetch();
                      }}
                    />
                    
                    {/* Payment Card */}
                    {currentBooking.dates && currentBooking.dates.length > 0 && (() => {
                      // Calculate total hours
                      let totalHours = 0;
                      currentBooking.dates.forEach((dateRange) => {
                        const start = new Date(dateRange.startDateTime);
                        const end = new Date(dateRange.endDateTime);
                        totalHours += differenceInHours(end, start);
                      });
                      
                      // Calculate price per hour
                      const totalAmount = parseFloat(currentBooking.amountToPay);
                      const pricePerHour = totalHours > 0 ? totalAmount / totalHours : 0;
                      
                      return (
                        <Card>
                          <CardHeader>
                            <CardTitle className="text-lg flex items-center gap-2">
                              <CreditCard className="h-5 w-5 text-primary" />
                              Payment
                            </CardTitle>
                          </CardHeader>
                          <CardContent className="flex flex-col space-y-4">
                            <div className="flex-grow flex flex-col space-y-4">
                              <div className="flex items-center justify-between">
                                <p className="text-sm text-muted-foreground">Total Hours</p>
                                <p className="text-base font-medium">{totalHours} {totalHours === 1 ? 'hour' : 'hours'}</p>
                              </div>
                              <div className="flex items-center justify-between">
                                <p className="text-sm text-muted-foreground">Price per Hour</p>
                                <p className="text-base font-medium">{formatCurrency(pricePerHour.toString())}/hour</p>
                              </div>
                              <div className="flex items-center justify-between pt-2 border-t">
                                <p className="text-sm text-muted-foreground">Total Amount</p>
                                <p className="text-xl font-bold">{formatCurrency(currentBooking.amountToPay)}</p>
                              </div>
                            </div>
                            <div className="mt-auto pt-4">
                              {currentBooking.status?.toUpperCase() === "PAYMENT_RECEIVED" ? (
                                <div className="w-full rounded-md border border-muted bg-muted/50 py-2 text-center font-semibold text-muted-foreground">
                                  Paid
                                </div>
                              ) : (
                                <Button 
                                  className="w-full"
                                  onClick={() => setIsPaymentModalOpen(true)}
                                  disabled={
                                    paymentMutation.isPending ||
                                    currentBooking.status?.toUpperCase() === "AWAITING_BUSINESS_PROCESSING" ||
                                    currentBooking.status?.toUpperCase() === "SOFT_LOCKED"
                                  }
                                >
                                  {currentBooking.status?.toUpperCase() === "AWAITING_BUSINESS_PROCESSING" ||
                                   currentBooking.status?.toUpperCase() === "SOFT_LOCKED"
                                    ? "Awaiting Confirmation"
                                    : "Proceed to Payment"}
                                </Button>
                              )}
                            </div>
                          </CardContent>
                        </Card>
                      );
                    })()}
                  </div>
                  
                  {/* Payment Modal - Shared for both Complete Payment and Proceed to Payment buttons */}
                  {currentBooking && currentBooking.dates && currentBooking.dates.length > 0 && (() => {
                    // Calculate total hours
                    let totalHours = 0;
                    currentBooking.dates.forEach((dateRange) => {
                      const start = new Date(dateRange.startDateTime);
                      const end = new Date(dateRange.endDateTime);
                      totalHours += differenceInHours(end, start);
                    });
                    
                    // Calculate price per hour
                    const totalAmount = parseFloat(currentBooking.amountToPay);
                    const pricePerHour = totalHours > 0 ? totalAmount / totalHours : 0;
                    
                    return (
                      <PaymentModal
                        open={isPaymentModalOpen}
                        onOpenChange={setIsPaymentModalOpen}
                        amount={currentBooking.amountToPay}
                        currency="VND"
                    returnUrl={paymentReturnUrl}
                        onConfirm={() => {
                          setIsPaymentModalOpen(false);
                        }}
                        onCancel={() => {
                          setIsPaymentModalOpen(false);
                        }}
                        onProceed={handleProceedPayment}
                      >
                        {/* Payment Details */}
                        <div className="space-y-3">
                          <div className="flex items-center justify-between">
                            <p className="text-sm text-muted-foreground">Total Hours</p>
                            <p className="text-base font-medium">{totalHours} {totalHours === 1 ? 'hour' : 'hours'}</p>
                          </div>
                          <div className="flex items-center justify-between">
                            <p className="text-sm text-muted-foreground">Price per Hour</p>
                            <p className="text-base font-medium">{formatCurrency(pricePerHour.toString())}/hour</p>
                          </div>
                        </div>
                      </PaymentModal>
                    );
                  })()}
                </div>
              ) : !hasLocation ? (
                <div className="text-center py-16 border rounded-lg bg-muted/10">
                  <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
                    <Building2 className="h-8 w-8 text-primary" />
                  </div>
                  <h3 className="text-lg font-semibold mb-2">
                    No Venue Booked Yet
                  </h3>
                  <p className="text-sm text-muted-foreground mb-6 max-w-md mx-auto">
                    Your event needs a location. Browse our available venues to find the perfect spot for your event.
                  </p>
                  {!isEventCancelled && (
                    <Button size="lg" onClick={() => {
                      openBookLocationTab();
                      router.push(`/dashboard/creator/events/${eventId}/location/book`);
                    }}>
                      <Plus className="h-4 w-4 mr-2" />
                      Book a Venue
                    </Button>
                  )}
                </div>
              ) : (
                <div className="text-center py-12 text-muted-foreground">
                  <MapPin className="h-12 w-12 mx-auto mb-4 opacity-20" />
                  <p>Location details coming soon.</p>
                </div>
              )}
            </TabsContent>
            
            <TabsContent value="all" className="mt-6">
              {locationBookings && locationBookings.length > 0 ? (
                <div className="space-y-4">
                  <div className="rounded-md border">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Location</TableHead>
                          <TableHead>Status</TableHead>
                          <TableHead>Date Range</TableHead>
                          <TableHead>Amount</TableHead>
                          <TableHead>Created</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {locationBookings.map((booking: LocationBooking) => (
                          <TableRow key={booking.id}>
                            <TableCell className="font-medium">
                              {booking.location?.name || "Unknown Location"}
                            </TableCell>
                            <TableCell>
                              {getStatusBadge(booking.status)}
                            </TableCell>
                            <TableCell className="text-sm text-muted-foreground">
                              {formatDateRange(booking.dates)}
                            </TableCell>
                            <TableCell className="font-medium">
                              {formatCurrency(booking.amountToPay)}
                            </TableCell>
                            <TableCell className="text-sm text-muted-foreground">
                              {format(new Date(booking.createdAt), "MMM dd, yyyy")}
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                </div>
              ) : (
                <div className="text-center py-16 border rounded-lg bg-muted/10">
                  <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center mx-auto mb-4">
                    <List className="h-8 w-8 text-muted-foreground" />
                  </div>
                  <h3 className="text-lg font-semibold mb-2">
                    No Bookings Yet
                  </h3>
                  <p className="text-sm text-muted-foreground mb-6 max-w-md mx-auto">
                    You haven&apos;t made any location bookings for this event yet.
                  </p>
                  {!isEventCancelled && (
                    <Button size="lg" onClick={() => {
                      openBookLocationTab();
                      router.push(`/dashboard/creator/events/${eventId}/location/book`);
                    }}>
                      <Plus className="h-4 w-4 mr-2" />
                      Book a Venue
                    </Button>
                  )}
                </div>
              )}
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}

