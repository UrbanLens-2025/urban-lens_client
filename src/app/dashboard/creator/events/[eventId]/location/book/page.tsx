"use client";

import { use, useState, useMemo, useRef, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Building2, Loader2, MapPin as MapPinIcon, ArrowLeft, Mail, Phone, Star, ChevronLeft, ChevronRight, Calendar, Search, ChevronDown, Clock, ChevronUp, RotateCcw, AlertCircle, CreditCard, Wallet, Info, CheckCircle2, DollarSign } from "lucide-react";
import { useBookableLocations } from "@/hooks/events/useBookableLocations";
import { useBookableLocationById } from "@/hooks/events/useBookableLocationById";
import { useEventById } from "@/hooks/events/useEventById";
import { APIProvider, Map, AdvancedMarker, Pin, useMap } from "@vis.gl/react-google-maps";
import { Button } from "@/components/ui/button";
import Image from "next/image";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AvailabilityCalendar } from "@/app/dashboard/creator/request/create/_components/AvailabilityCalendar";
import { useDebounce } from "use-debounce";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { useAddLocationBooking } from "@/hooks/events/useAddLocationBooking";
import { useWallet } from "@/hooks/user/useWallet";
import type { BookableLocation } from "@/types";
import { format, addDays, startOfDay, isSameDay } from "date-fns";

const DEFAULT_CENTER = { lat: 10.8231, lng: 106.6297 }; // Ho Chi Minh City center

// Component to handle map interactions
type LocationWithCoords = BookableLocation & { latitude: number; longitude: number };
type SlotSelection = { startDateTime: Date; endDateTime: Date };
type DayRange = { start: Date; end: Date };

const splitRangeIntoDailySlots = (rangeStart: Date, rangeEnd: Date): SlotSelection[] => {
  const slots: SlotSelection[] = [];
  const start = new Date(rangeStart);
  const end = new Date(rangeEnd);

  if (isNaN(start.getTime()) || isNaN(end.getTime()) || start >= end) {
    return slots;
  }

  let cursor = startOfDay(start);
  const lastDay = startOfDay(end);

  while (cursor <= lastDay) {
    const slotStart = new Date(cursor);
    const slotEnd = new Date(cursor);

    if (isSameDay(cursor, start)) {
      slotStart.setTime(start.getTime());
    } else {
      slotStart.setHours(0, 0, 0, 0);
    }

    if (isSameDay(cursor, end)) {
      slotEnd.setTime(end.getTime());
    } else {
      slotEnd.setHours(23, 59, 59, 999);
    }

    if (slotStart < slotEnd) {
      slots.push({
        startDateTime: new Date(slotStart),
        endDateTime: new Date(slotEnd),
      });
    }

    cursor = startOfDay(addDays(cursor, 1));
  }

  return slots;
};

function MapController({
  locations,
  selectedLocationId,
}: {
  locations: LocationWithCoords[];
  selectedLocationId?: string;
}) {
  const map = useMap();
  const hasInitialized = useRef(false);
  const lastSelectedId = useRef<string | undefined>(undefined);

  // Initialize center only once on mount
  useEffect(() => {
    if (map && !hasInitialized.current && locations.length > 0) {
      const validLocs = locations.filter(loc => {
        const lat = loc.latitude;
        const lng = loc.longitude;
        return !isNaN(lat) && !isNaN(lng) && lat !== 0 && lng !== 0;
      });
      if (validLocs.length > 0) {
        const avgLat = validLocs.reduce((sum, loc) => sum + loc.latitude, 0) / validLocs.length;
        const avgLng = validLocs.reduce((sum, loc) => sum + loc.longitude, 0) / validLocs.length;
        map.setCenter({ lat: avgLat, lng: avgLng });
        map.setZoom(13);
        hasInitialized.current = true;
      }
    }
  }, [locations, map]);

  // Zoom to selected location only when selection changes
  useEffect(() => {
    if (selectedLocationId && map && selectedLocationId !== lastSelectedId.current) {
      const selected = locations.find(loc => loc.id === selectedLocationId);
      if (selected) {
        const lat = selected.latitude;
        const lng = selected.longitude;
        if (!isNaN(lat) && !isNaN(lng)) {
          map.setCenter({ lat, lng });
          map.setZoom(16);
          lastSelectedId.current = selectedLocationId;
        }
      }
    } else if (!selectedLocationId && lastSelectedId.current) {
      lastSelectedId.current = undefined;
    }
  }, [selectedLocationId, locations, map]);

  return null;
}

// Location Details Overlay Component
function LocationDetailsOverlay({
  location,
  onClose,
  eventId,
  eventDetail
}: {
  location: BookableLocation | null;
  onClose: () => void;
  eventId: string;
  eventDetail?: { startDate?: string; endDate?: string };
}) {
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [isDescriptionExpanded, setIsDescriptionExpanded] = useState(false);
  const [isAvailabilityExpanded, setIsAvailabilityExpanded] = useState(false);
  const [showCalendar, setShowCalendar] = useState(false);
  const [selectedSlots, setSelectedSlots] = useState<SlotSelection[]>([]);
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [pendingBookingData, setPendingBookingData] = useState<{ locationId: string; dates: Array<{ startDateTime: string; endDateTime: string }> } | null>(null);
  const collapsedSlotRanges = useMemo<DayRange[]>(() => {
    if (selectedSlots.length === 0) return [];

    const normalized: Array<{ start: Date; end: Date }> = selectedSlots
      .map((slot) => ({
        start: new Date(slot.startDateTime),
        end: new Date(slot.endDateTime),
      }))
      .sort((a, b) => a.start.getTime() - b.start.getTime());

    const ranges: DayRange[] = [];
    let currentRange: { start: Date; end: Date; dateKey: string } | null = null;
    const pushRange = (range: { start: Date; end: Date; dateKey: string } | null) => {
      if (!range) return;
      ranges.push({ start: range.start, end: range.end });
    };

    normalized.forEach((slot) => {
      const dateKey = format(slot.start, "yyyy-MM-dd");

      if (!currentRange || currentRange.dateKey !== dateKey) {
        pushRange(currentRange);
        currentRange = { start: slot.start, end: slot.end, dateKey };
        return;
      }

      if (currentRange.end.getTime() === slot.start.getTime()) {
        currentRange.end = slot.end;
      } else {
        pushRange(currentRange);
        currentRange = { start: slot.start, end: slot.end, dateKey };
      }
    });

    pushRange(currentRange);

    return ranges;
  }, [selectedSlots]);

  const router = useRouter();
  const addLocationBookingMutation = useAddLocationBooking(eventId);
  const { data: walletData } = useWallet();

  // Fetch detailed location data
  const { data: detailedLocation, isLoading: isLoadingDetails } = useBookableLocationById(
    location?.id || null
  );

  // Use detailed location data if available, otherwise fall back to basic location data
  const displayLocation = detailedLocation || location;

  // Calculate estimated total cost based on selected slots
  const estimatedCost = useMemo(() => {
    if (!displayLocation?.bookingConfig?.baseBookingPrice || selectedSlots.length === 0) {
      return null;
    }

    const basePrice = parseFloat(displayLocation.bookingConfig.baseBookingPrice);
    const currency = displayLocation.bookingConfig.currency || "VND";

    // Calculate total hours
    let totalMilliseconds = 0;
    selectedSlots.forEach(slot => {
      const start = new Date(slot.startDateTime);
      const end = new Date(slot.endDateTime);
      totalMilliseconds += (end.getTime() - start.getTime());
    });

    const totalHours = totalMilliseconds / (1000 * 60 * 60);
    const totalCost = basePrice * totalHours;

    return {
      totalHours,
      totalCost,
      currency,
      basePrice,
    };
  }, [selectedSlots, displayLocation?.bookingConfig]);

  // Get wallet balance
  const walletBalance = walletData ? parseFloat(walletData.balance) : 0;
  const walletCurrency = walletData?.currency || "VND";
  const hasInsufficientBalance = estimatedCost ? walletBalance < estimatedCost.totalCost : false;

  // Calculate refund information
  const refundInfo = useMemo(() => {
    if (!estimatedCost || !displayLocation?.bookingConfig?.refundEnabled) {
      return null;
    }

    const config = displayLocation.bookingConfig;
    const totalCost = estimatedCost.totalCost;

    // Find earliest booking slot start time for cutoff calculation
    const earliestSlotStart = selectedSlots.length > 0
      ? new Date(Math.min(...selectedSlots.map(s => s.startDateTime.getTime())))
      : null;

    const refundBeforeCutoff = config.refundPercentageBeforeCutoff !== undefined
      ? totalCost * config.refundPercentageBeforeCutoff
      : totalCost; // Default to 100% if not specified

    const refundAfterCutoff = config.refundPercentageAfterCutoff !== undefined
      ? totalCost * config.refundPercentageAfterCutoff
      : 0; // Default to 0% if not specified

    // Calculate cutoff time (hours before earliest slot start)
    const cutoffTime = earliestSlotStart && config.refundCutoffHours !== undefined
      ? new Date(earliestSlotStart.getTime() - config.refundCutoffHours * 60 * 60 * 1000)
      : null;

    return {
      enabled: true,
      cutoffHours: config.refundCutoffHours,
      percentageBeforeCutoff: config.refundPercentageBeforeCutoff ?? 1,
      percentageAfterCutoff: config.refundPercentageAfterCutoff ?? 0,
      refundBeforeCutoff,
      refundAfterCutoff,
      cutoffTime,
      currency: estimatedCost.currency,
    };
  }, [estimatedCost, displayLocation?.bookingConfig, selectedSlots]);

  // Handle confirmation
  const handleConfirmBooking = () => {
    if (!pendingBookingData) return;

    addLocationBookingMutation.mutate(
      pendingBookingData,
      {
        onSuccess: () => {
          setShowCalendar(false);
          setShowConfirmDialog(false);
          setSelectedSlots([]);
          setPendingBookingData(null);
          router.push(`/dashboard/creator/events/${eventId}/location`);
          router.refresh();
        },
        // Error handling is done in the hook's onError
      }
    );
  };

  // Get business contact info and analytics from detailed location
  type LocationWithBusiness = BookableLocation & {
    business?: { email?: string; phone?: string };
    averageRating?: string | number;
    totalReviews?: number;
    totalCheckIns?: string | number;
    availabilities?: Array<{
      dayOfWeek: string;
      startTime: string;
      endTime: string;
    }>;
  };

  const availabilities = useMemo(() => {
    if (!displayLocation) return [];
    return (displayLocation as LocationWithBusiness)?.availabilities || [];
  }, [displayLocation]);

  // Count unique days
  const uniqueDays = useMemo(() => {
    return new Set(availabilities.map(a => a.dayOfWeek)).size;
  }, [availabilities]);

  // Group and sort availabilities by day order
  const groupedAvailabilities = useMemo(() => {
    const dayOrder = ['MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY', 'SATURDAY', 'SUNDAY'];

    // Group availabilities by day
    const grouped = availabilities.reduce((acc, availability) => {
      const day = availability.dayOfWeek;
      if (!acc[day]) {
        acc[day] = [];
      }
      acc[day].push(availability);
      return acc;
    }, {} as Record<string, typeof availabilities>);

    // Sort days and sort time slots within each day
    return dayOrder
      .filter(day => grouped[day])
      .map(day => ({
        dayOfWeek: day,
        timeSlots: grouped[day].sort((a, b) => a.startTime.localeCompare(b.startTime))
      }));
  }, [availabilities]);

  if (!location || !displayLocation) return null;

  const images = displayLocation.imageUrl || [];
  const visibleTags = displayLocation.tags?.slice(0, 3) || [];
  const remainingTagsCount = (displayLocation.tags?.length || 0) - visibleTags.length;

  const businessEmail = (displayLocation as LocationWithBusiness)?.business?.email;
  const businessPhone = (displayLocation as LocationWithBusiness)?.business?.phone;
  const averageRating = (displayLocation as LocationWithBusiness)?.averageRating;
  const totalReviews = (displayLocation as LocationWithBusiness)?.totalReviews ?? 0;
  const totalCheckInsValue = (displayLocation as LocationWithBusiness)?.totalCheckIns ?? 0;
  const totalCheckIns = typeof totalCheckInsValue === 'string' ? parseInt(totalCheckInsValue, 10) : totalCheckInsValue;

  // Format rating
  const ratingValue = averageRating ? parseFloat(String(averageRating)) : 0;

  // Format day name
  const formatDayName = (dayOfWeek: string) => {
    const dayMap: Record<string, string> = {
      'MONDAY': 'Monday',
      'TUESDAY': 'Tuesday',
      'WEDNESDAY': 'Wednesday',
      'THURSDAY': 'Thursday',
      'FRIDAY': 'Friday',
      'SATURDAY': 'Saturday',
      'SUNDAY': 'Sunday',
    };
    return dayMap[dayOfWeek] || dayOfWeek;
  };

  const nextImage = () => {
    setCurrentImageIndex((prev) => (prev + 1) % images.length);
  };

  const prevImage = () => {
    setCurrentImageIndex((prev) => (prev - 1 + images.length) % images.length);
  };

  return (
    <div className="absolute right-4 top-4 bottom-4 w-full sm:w-96 bg-background border rounded-lg shadow-2xl z-10 overflow-hidden flex flex-col">
      {/* Back Button */}
      <div className="absolute top-4 left-4 z-30">
        <Button
          variant="ghost"
          size="icon"
          onClick={onClose}
          className="h-9 w-9 bg-background/90 backdrop-blur-sm hover:bg-background border shadow-sm"
        >
          <ArrowLeft className="h-4 w-4" />
        </Button>
      </div>

      {/* Image Carousel */}
      {images.length > 0 && (
        <div className="relative w-full h-48 bg-muted">
          <Image
            src={images[currentImageIndex]}
            alt={`${location.name} - Image ${currentImageIndex + 1}`}
            fill
            className="object-cover"
          />

          {/* Carousel Navigation */}
          {images.length > 1 && (
            <>
              <Button
                variant="ghost"
                size="icon"
                onClick={prevImage}
                className="absolute left-2 top-1/2 -translate-y-1/2 h-8 w-8 bg-background/80 backdrop-blur-sm hover:bg-background border shadow-sm"
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                onClick={nextImage}
                className="absolute right-2 top-1/2 -translate-y-1/2 h-8 w-8 bg-background/80 backdrop-blur-sm hover:bg-background border shadow-sm"
              >
                <ChevronRight className="h-4 w-4" />
              </Button>

              {/* Image Indicators */}
              <div className="absolute bottom-2 left-1/2 -translate-x-1/2 flex gap-1">
                {images.map((_, index) => (
                  <button
                    key={index}
                    onClick={() => setCurrentImageIndex(index)}
                    className={`h-1.5 rounded-full transition-all ${index === currentImageIndex
                        ? "w-6 bg-background"
                        : "w-1.5 bg-background/50"
                      }`}
                  />
                ))}
              </div>
            </>
          )}
        </div>
      )}

      {/* Content Section */}
      <div className="flex-1 overflow-y-auto">
        <div className="p-4 space-y-4">
          {/* Location Name */}
          <div>
            <h2 className="text-2xl font-bold mb-2">{displayLocation.name}</h2>

            {/* Rating and Reviews */}
            <div className="flex items-center gap-2 mb-3">
              <div className="flex items-center gap-1">
                <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                <span className="text-sm font-medium">{ratingValue.toFixed(1)}</span>
              </div>
              <span className="text-xs text-muted-foreground">({totalReviews} {totalReviews === 1 ? 'review' : 'reviews'})</span>
              <span className="text-xs text-muted-foreground">•</span>
              <span className="text-xs text-muted-foreground">{totalCheckIns} check-in{totalCheckIns !== 1 ? 's' : ''}</span>
            </div>
          </div>

          {/* Tags */}
          {displayLocation.tags && displayLocation.tags.length > 0 && (
            <div className="flex items-center gap-2 flex-wrap">
              {visibleTags.map((tag) => (
                <Badge
                  key={tag.id}
                  variant="secondary"
                  style={{ backgroundColor: `${tag.color}15`, borderColor: tag.color, color: tag.color }}
                  className="text-xs"
                >
                  <span className="mr-1">{tag.icon}</span>
                  {tag.displayName}
                </Badge>
              ))}
              {remainingTagsCount > 0 && (
                <Badge variant="outline" className="text-xs">
                  +{remainingTagsCount} more
                </Badge>
              )}
            </div>
          )}

          {/* Description */}
          {displayLocation.description && (
            <div className="pt-2">
              <p className={`text-sm text-muted-foreground leading-relaxed ${!isDescriptionExpanded ? 'line-clamp-2' : ''}`}>
                {displayLocation.description}
              </p>
              {displayLocation.description.length > 100 && (
                <Button
                  variant="link"
                  size="sm"
                  onClick={() => setIsDescriptionExpanded(!isDescriptionExpanded)}
                  className="h-auto p-0 text-xs text-primary mt-1"
                >
                  {isDescriptionExpanded ? 'Read less' : 'Read more'}
                </Button>
              )}
            </div>
          )}

          {/* Contact Details */}
          <div className="space-y-0.5 pt-2">
            {/* Address */}
            <div className="flex items-start gap-3 p-3 rounded-t-xl rounded-b-xs bg-muted/50 border border-border/50">
              <MapPinIcon className="h-5 w-5 text-muted-foreground mt-0.5 flex-shrink-0" />
              <p className="text-sm text-foreground flex-1">
                {displayLocation.addressLine}, {displayLocation.addressLevel1}, {displayLocation.addressLevel2}
              </p>
            </div>

            {/* Price */}
            {displayLocation.bookingConfig?.baseBookingPrice && (
              <div className={`flex items-start gap-3 p-3 bg-muted/50 border border-border/50 ${!displayLocation.bookingConfig?.refundEnabled && !businessEmail && !businessPhone ? 'rounded-b-xl rounded-t-xs' : 'rounded-xs'
                }`}>
                <DollarSign className="h-5 w-5 text-muted-foreground mt-0.5 flex-shrink-0" />
                <p className="text-sm text-foreground">
                  {parseFloat(displayLocation.bookingConfig.baseBookingPrice).toLocaleString("vi-VN")} {displayLocation.bookingConfig.currency || "VND"} / hour
                </p>
              </div>
            )}

            {/* Refund Policy */}
            {displayLocation.bookingConfig && (
              <div className={`flex items-start gap-3 p-3 bg-muted/50 border border-border/50 ${!businessEmail && !businessPhone ? 'rounded-b-xl rounded-t-xs' : 'rounded-xs'
                }`}>
                <RotateCcw className="h-5 w-5 text-muted-foreground mt-0.5 flex-shrink-0" />
                <div className="flex-1 space-y-1">
                  <p className="text-sm font-medium text-foreground">Refund Policy</p>
                  {displayLocation.bookingConfig.refundEnabled ? (
                    <div className="space-y-0.5 text-xs text-muted-foreground">
                      {displayLocation.bookingConfig.refundCutoffHours !== undefined && (
                        <div className="flex justify-between">
                          <span>Before {displayLocation.bookingConfig.refundCutoffHours}h:</span>
                          <span className="font-medium text-foreground">
                            {displayLocation.bookingConfig.refundPercentageBeforeCutoff !== undefined
                              ? `${(displayLocation.bookingConfig.refundPercentageBeforeCutoff * 100).toFixed(0)}%`
                              : "100%"}
                          </span>
                        </div>
                      )}
                      {displayLocation.bookingConfig.refundCutoffHours !== undefined && (
                        <div className="flex justify-between">
                          <span>After {displayLocation.bookingConfig.refundCutoffHours}h:</span>
                          <span className="font-medium text-foreground">
                            {displayLocation.bookingConfig.refundPercentageAfterCutoff !== undefined
                              ? `${(displayLocation.bookingConfig.refundPercentageAfterCutoff * 100).toFixed(0)}%`
                              : "0%"}
                          </span>
                        </div>
                      )}
                    </div>
                  ) : (
                    <p className="text-xs text-muted-foreground">Refunds are not available</p>
                  )}
                </div>
              </div>
            )}

            {/* Email */}
            {businessEmail && (
              <div className={`flex items-start gap-3 p-3 bg-muted/50 border border-border/50 ${!businessPhone ? 'rounded-b-xl rounded-t-xs' : 'rounded-xs'
                }`}>
                <Mail className="h-5 w-5 text-muted-foreground mt-0.5 flex-shrink-0" />
                <p className="text-sm text-foreground">{businessEmail}</p>
              </div>
            )}

            {/* Phone */}
            {businessPhone && (
              <div className={`flex items-start gap-3 p-3 bg-muted/50 border border-border/50 ${availabilities.length === 0 ? 'rounded-b-xl rounded-t-xs' : 'rounded-xs'
                }`}>
                <Phone className="h-5 w-5 text-muted-foreground mt-0.5 flex-shrink-0" />
                <p className="text-sm text-foreground">{businessPhone}</p>
              </div>
            )}

            {/* Availability Schedule */}
            {availabilities.length > 0 && (
              <div className="bg-muted/50 border border-border/50 rounded-b-xl rounded-t-xs overflow-hidden">
                <button
                  onClick={() => setIsAvailabilityExpanded(!isAvailabilityExpanded)}
                  className="w-full flex items-center justify-between gap-3 p-3 hover:bg-muted/70 transition-colors"
                >
                  <div className="flex items-start gap-3 flex-1">
                    <Clock className="h-5 w-5 text-muted-foreground mt-0.5 flex-shrink-0" />
                    <p className="text-sm text-foreground text-left">
                      Available on {uniqueDays} {uniqueDays === 1 ? 'week day' : 'week days'}
                    </p>
                  </div>
                  {isAvailabilityExpanded ? (
                    <ChevronUp className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                  ) : (
                    <ChevronDown className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                  )}
                </button>
                {isAvailabilityExpanded && (
                  <div className="px-3 pb-3 space-y-2 border-t border-border/50 pt-3">
                    {groupedAvailabilities.map((group, index) => (
                      <div key={index} className="flex items-start justify-between gap-2 text-sm">
                        <span className="text-foreground font-medium flex-shrink-0">
                          {formatDayName(group.dayOfWeek)}
                        </span>
                        <span className="text-muted-foreground text-right">
                          {group.timeSlots.map((slot, slotIndex) => (
                            <span key={slotIndex}>
                              {slot.startTime} - {slot.endTime}
                              {slotIndex < group.timeSlots.length - 1 && ', '}
                            </span>
                          ))}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Book Location Button */}
      <div className="p-4 border-t bg-background">
        <Button
          onClick={() => {
            setSelectedSlots([]);
            setShowCalendar(true);
          }}
          disabled={isLoadingDetails}
          className="w-full h-10 text-base font-semibold py-2"
          size="lg"
        >
          <Calendar className="h-4 w-4 mr-2" />
          Book Location
        </Button>
      </div>

      {/* Booking Calendar Dialog */}
      <Dialog open={showCalendar} onOpenChange={(open) => {
        setShowCalendar(open);
        if (!open) {
          setSelectedSlots([]);
        }
      }}>
        <DialogContent className="w-[95vw] !max-w-5xl max-h-[85vh] overflow-hidden flex flex-col mt-6 p-0 gap-0">
          <DialogHeader className="px-6 pt-6 pb-4 border-b bg-gradient-to-r from-primary/5 to-primary/10">
            <div className="flex items-start justify-between">
              <div>
                <DialogTitle className="text-xl font-semibold mb-1.5 flex items-center gap-2">
                  <div className="p-1.5 rounded-lg bg-primary/10">
                    <Calendar className="h-5 w-5 text-primary" />
                  </div>
                  Select Booking Time Slots
                </DialogTitle>
                <DialogDescription className="text-sm text-muted-foreground flex items-center gap-2">
                  <Building2 className="h-4 w-4" />
                  {displayLocation?.name}
                </DialogDescription>
              </div>
              {selectedSlots.length > 0 && (
                <Badge variant="secondary" className="text-xs font-medium px-3 py-1">
                  {selectedSlots.length} slot{selectedSlots.length !== 1 ? 's' : ''} selected
                </Badge>
              )}
            </div>
          </DialogHeader>

          {/* Event Time Alert */}
          {eventDetail?.startDate && eventDetail?.endDate && (
            <div className="px-6 pt-4">
              <Alert className="bg-amber-50 border-amber-200 dark:bg-amber-950/20 dark:border-amber-800">
                <Clock className="h-4 w-4 text-amber-600 dark:text-amber-500" />
                <AlertDescription className="text-amber-800 dark:text-amber-200">
                  <p className="font-medium mb-1">Event Time Period</p>
                  <p className="text-sm">
                    Your event runs from{" "}
                    <span className="font-semibold">
                      {format(new Date(eventDetail.startDate), "MMM dd, yyyy 'at' h:mm a")}
                    </span>{" "}
                    to{" "}
                    <span className="font-semibold">
                      {format(new Date(eventDetail.endDate), "MMM dd, yyyy 'at' h:mm a")}
                    </span>
                    . Please select time slots that cover this entire period.
                  </p>
                </AlertDescription>
              </Alert>
            </div>
          )}

          <div className="flex-1 overflow-y-auto px-6 py-4">
            {displayLocation && (
              <AvailabilityCalendar
                locationId={displayLocation.id}
                initialSlots={selectedSlots}
                onSlotsChange={setSelectedSlots}
                eventStartDate={eventDetail?.startDate ? new Date(eventDetail.startDate) : undefined}
                eventEndDate={eventDetail?.endDate ? new Date(eventDetail.endDate) : undefined}
                minBookingDurationMinutes={displayLocation.bookingConfig?.minBookingDurationMinutes}
              />
            )}
          </div>
          <div className="flex items-center justify-between px-6 py-3 border-t bg-muted/30">
            <div className="flex flex-col gap-0.5">
              <p className="text-[10px] text-muted-foreground">
                Click or drag to select time slots • Unavailable times are disabled
              </p>
              {eventDetail?.startDate && eventDetail?.endDate ? (
                <p className="text-[10px] text-amber-600 dark:text-amber-400 font-medium">
                  ⚠ Selected slots must cover event period: {format(new Date(eventDetail.startDate), "MMM dd, h:mm a")} - {format(new Date(eventDetail.endDate), "MMM dd, h:mm a")}
                </p>
              ) : (
                <p className="text-[10px] text-muted-foreground">
                  Tip: Unavailable times are disabled - venue owner hasn't opened them for booking
                </p>
              )}
            </div>
            <div className="flex items-center gap-3">
              <Button
                variant="outline"
                onClick={() => {
                  // Clear all selected slots when canceling
                  setSelectedSlots([]);
                  setShowCalendar(false);
                }}
                size="sm"
              >
                Cancel
              </Button>
              <Button
                onClick={async () => {
                  // Dismiss any existing toasts first
                  toast.dismiss();

                  if (!displayLocation || selectedSlots.length === 0) {
                    toast.error("No time slots selected", {
                      description: "Please select at least one time slot to continue.",
                      icon: <Calendar className="h-4 w-4" />,
                      duration: 4000,
                    });
                    return;
                  }

                  // Validate that booking covers event dates
                  // Booking must start on or before event start, and end on or after event end
                  if (eventDetail?.startDate && eventDetail?.endDate) {
                    const eventStart = new Date(eventDetail.startDate);
                    eventStart.setMilliseconds(0);
                    const eventEnd = new Date(eventDetail.endDate);
                    eventEnd.setMilliseconds(0);

                    const allSlotStarts = selectedSlots.map(slot => {
                      const d = new Date(slot.startDateTime);
                      d.setMilliseconds(0);
                      return d.getTime();
                    });
                    const allSlotEnds = selectedSlots.map(slot => {
                      const d = new Date(slot.endDateTime);
                      d.setMilliseconds(0);
                      return d.getTime();
                    });

                    const bookingStart = new Date(Math.min(...allSlotStarts));
                    const bookingEnd = new Date(Math.max(...allSlotEnds));

                    // Validation: booking start <= event start AND booking end >= event end
                    if (bookingStart.getTime() > eventStart.getTime() || bookingEnd.getTime() < eventEnd.getTime()) {
                      const eventStartStr = eventStart.toLocaleString('en-US', {
                        month: 'short',
                        day: 'numeric',
                        year: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit',
                        hour12: true
                      });
                      const eventEndStr = eventEnd.toLocaleString('en-US', {
                        month: 'short',
                        day: 'numeric',
                        year: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit',
                        hour12: true
                      });
                      const bookingStartStr = bookingStart.toLocaleString('en-US', {
                        month: 'short',
                        day: 'numeric',
                        year: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit',
                        hour12: true
                      });
                      const bookingEndStr = bookingEnd.toLocaleString('en-US', {
                        month: 'short',
                        day: 'numeric',
                        year: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit',
                        hour12: true
                      });

                      let errorTitle = "Booking doesn't cover event period";
                      let errorDescription: React.ReactNode;

                      if (bookingStart.getTime() > eventStart.getTime() && bookingEnd.getTime() < eventEnd.getTime()) {
                        // Both conditions fail
                        errorDescription = (
                          <div className="space-y-1.5 mt-1">
                            <p className="text-sm">Your booking period (<strong className="text-destructive">{bookingStartStr}</strong> - <strong className="text-destructive">{bookingEndStr}</strong>) doesn't cover the event period (<strong>{eventStartStr}</strong> - <strong>{eventEndStr}</strong>).</p>
                            <p className="text-xs text-muted-foreground">Booking must start on or before event start and end on or after event end.</p>
                          </div>
                        );
                      } else if (bookingStart.getTime() > eventStart.getTime()) {
                        // Booking starts after event starts
                        errorDescription = (
                          <div className="space-y-1.5 mt-1">
                            <p className="text-sm">Your booking starts <strong className="text-destructive">{bookingStartStr}</strong>, but the event starts <strong>{eventStartStr}</strong>.</p>
                            <p className="text-xs text-muted-foreground">Booking must start on or before the event start time.</p>
                          </div>
                        );
                      } else {
                        // Booking ends before event ends
                        errorDescription = (
                          <div className="space-y-1.5 mt-1">
                            <p className="text-sm">Your booking ends <strong className="text-destructive">{bookingEndStr}</strong>, but the event ends <strong>{eventEndStr}</strong>.</p>
                            <p className="text-xs text-muted-foreground">Booking must end on or after the event end time.</p>
                          </div>
                        );
                      }

                      toast.error(errorTitle, {
                        description: errorDescription,
                        icon: <Clock className="h-4 w-4" />,
                        duration: 10000,
                      });
                      // Clear invalid slots
                      setSelectedSlots([]);
                      return;
                    }
                  }

                  // Validate minimum duration per slot
                  if (displayLocation.bookingConfig?.minBookingDurationMinutes) {
                    const minDurationMs = displayLocation.bookingConfig.minBookingDurationMinutes * 60 * 1000;
                    const invalidSlots = selectedSlots.filter((slot) => {
                      const slotDurationMs = slot.endDateTime.getTime() - slot.startDateTime.getTime();
                      return slotDurationMs < minDurationMs;
                    });

                    if (invalidSlots.length > 0) {
                      toast.error("Slot duration too short", {
                        description: `Each booking slot must be at least ${displayLocation.bookingConfig.minBookingDurationMinutes} minutes long. Please adjust your selection.`,
                        icon: <Clock className="h-4 w-4" />,
                        duration: 5000,
                      });
                      return;
                    }
                  }

                  // Map slots to API format
                  const dates = collapsedSlotRanges.map((slot) => ({
                    startDateTime: slot.start.toISOString(),
                    endDateTime: slot.end.toISOString(),
                  }));

                  // Store booking data and show confirmation dialog (Step 2)
                  setPendingBookingData({
                    locationId: displayLocation.id,
                    dates,
                  });
                  setShowCalendar(false);
                  setShowConfirmDialog(true);
                }}
                disabled={selectedSlots.length === 0 || addLocationBookingMutation.isPending}
                size="sm"
                className="min-w-[140px]"
              >
                {addLocationBookingMutation.isPending ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Creating...
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="h-4 w-4 mr-2" />
                    Continue to Payment
                  </>
                )}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Step 2: Confirmation Dialog */}
      <Dialog open={showConfirmDialog} onOpenChange={setShowConfirmDialog}>
        <DialogContent className="w-[95vw] !max-w-5xl max-h-[90vh] overflow-hidden flex flex-col p-0">
          <DialogHeader className="px-8 pt-6 pb-4 border-b">
            <DialogTitle className="text-xl font-bold tracking-tight flex items-center gap-2">
              <div className="p-1.5 rounded-lg bg-primary/10">
                <CreditCard className="h-5 w-5 text-primary" />
              </div>
              Confirm Booking & Payment
            </DialogTitle>
            <DialogDescription className="text-xs text-muted-foreground mt-1">
              Review your booking details, wallet balance, and refund policy before confirming.
            </DialogDescription>
          </DialogHeader>

          <div className="flex-1 overflow-y-auto px-8 py-5">
            <div className="grid grid-cols-2 gap-4">
              {/* Booking Summary */}
              <div className="bg-background p-5 rounded-xl border border-border/60 shadow-sm relative overflow-hidden">
                <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 rounded-full -mr-16 -mt-16"></div>
                <div className="relative">
                  <div className="flex items-center gap-2 mb-4">
                    <div className="p-2 rounded-lg bg-primary/10">
                      <Calendar className="h-4 w-4 text-primary" />
                    </div>
                    <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
                      Booking Details
                    </p>
                  </div>
                  {estimatedCost && (
                    <div className="space-y-3">
                      <div className="flex items-baseline justify-between">
                        <span className="text-sm text-muted-foreground">Slots</span>
                        <span className="text-sm font-semibold text-foreground">
                          {selectedSlots.length} slot{selectedSlots.length !== 1 ? 's' : ''}
                        </span>
                      </div>
                      <div className="flex items-baseline justify-between">
                        <span className="text-sm text-muted-foreground">Duration</span>
                        <span className="text-sm font-semibold text-foreground">
                          {Math.round(estimatedCost.totalHours)}h
                        </span>
                      </div>
                      <div className="pt-3 border-t border-border/50">
                        <div className="flex items-baseline justify-between mb-2">
                          <span className="text-sm text-muted-foreground">Rate</span>
                          <span className="text-sm font-medium text-foreground">
                            {estimatedCost.basePrice.toLocaleString("vi-VN")} {estimatedCost.currency}/h
                          </span>
                        </div>
                      </div>
                      <div className="pt-3 border-t-2 border-primary/20 bg-primary/5 rounded-lg p-3 -mx-3">
                        <div className="flex items-baseline justify-between">
                          <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Total</span>
                          <span className="text-xl font-bold text-primary">
                            {estimatedCost.totalCost.toLocaleString("vi-VN")} {estimatedCost.currency}
                          </span>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Wallet Balance */}
              <div className={`p-5 rounded-xl border shadow-sm relative overflow-hidden ${hasInsufficientBalance
                  ? 'bg-gradient-to-br from-red-50 via-red-50/80 to-red-100/50 border-red-300/60 dark:from-red-950/40 dark:via-red-950/30 dark:to-red-900/20 dark:border-red-800/60'
                  : 'bg-gradient-to-br from-green-50 via-emerald-50/80 to-emerald-50 border-green-300/60 dark:from-green-950/40 dark:via-emerald-950/30 dark:to-emerald-950/20 dark:border-green-800/60'
                }`}>
                <div className="absolute top-0 right-0 w-32 h-32 rounded-full -mr-16 -mt-16 opacity-20" style={{
                  backgroundColor: hasInsufficientBalance ? 'rgb(239 68 68)' : 'rgb(34 197 94)'
                }}></div>
                <div className="relative">
                  <div className="flex items-center gap-2 mb-4">
                    <div className={`p-2 rounded-lg ${hasInsufficientBalance
                        ? 'bg-red-100 dark:bg-red-900/40'
                        : 'bg-green-100 dark:bg-green-900/40'
                      }`}>
                      <Wallet className={`h-4 w-4 ${hasInsufficientBalance
                          ? 'text-red-600 dark:text-red-400'
                          : 'text-green-600 dark:text-green-500'
                        }`} />
                    </div>
                    <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
                      Wallet Balance
                    </p>
                  </div>
                  <div className="space-y-3">
                    <div className="pb-3 border-b border-border/30">
                      <p className="text-sm text-muted-foreground mb-1.5">Current</p>
                      <p className={`text-xl font-bold ${hasInsufficientBalance
                          ? 'text-red-600 dark:text-red-400'
                          : 'text-green-600 dark:text-green-400'
                        }`}>
                        {walletBalance.toLocaleString("vi-VN")} {walletCurrency}
                      </p>
                    </div>
                    {estimatedCost && !hasInsufficientBalance && (
                      <div className="pt-2">
                        <p className="text-sm text-muted-foreground mb-1">After Payment</p>
                        <p className="text-base font-semibold text-muted-foreground">
                          {(walletBalance - estimatedCost.totalCost).toLocaleString("vi-VN")} {walletCurrency}
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Refund Policy */}
              {/* Refund Policy - Simplified */}
              {refundInfo && (
                <div className="col-span-2 bg-background p-5 rounded-xl border border-border/60 shadow-sm relative overflow-hidden">
                  {/* Decorative background circle */}
                  <div className="absolute top-0 right-0 w-40 h-40 bg-blue-500/5 rounded-full -mr-20 -mt-20"></div>

                  <div className="relative">
                    <div className="flex items-center gap-2 mb-4">
                      <div className="p-2 rounded-lg bg-blue-100 dark:bg-blue-900/40">
                        <RotateCcw className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                      </div>
                      <p className="text-xs font-bold text-foreground uppercase tracking-wider">Refund Policy</p>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      {/* Before Date Box */}
                      <div className="p-4 bg-gradient-to-br from-green-50 via-emerald-50 to-green-50 dark:from-green-950/30 dark:via-emerald-950/20 dark:to-green-950/30 rounded-lg border-2 border-green-300/50 dark:border-green-800/40 shadow-sm relative overflow-hidden">
                        <div className="relative">
                          <div className="flex items-center gap-2 mb-2">
                            <div className="h-2 w-2 rounded-full bg-green-500"></div>
                            <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
                              {refundInfo.cutoffTime
                                ? `Before ${format(refundInfo.cutoffTime, "dd/MM/yyyy HH:mm")}`
                                : "Before Cutoff"}
                            </p>
                          </div>
                          <p className="text-lg font-bold text-green-600 dark:text-green-400">
                            {Math.round(refundInfo.percentageBeforeCutoff * 100)}% Refund
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {refundInfo.refundBeforeCutoff.toLocaleString("vi-VN")} {refundInfo.currency}
                          </p>
                        </div>
                      </div>

                      {/* After Date Box */}
                      <div className="p-4 bg-gradient-to-br from-amber-50 via-orange-50 to-amber-50 dark:from-amber-950/30 dark:via-orange-950/20 dark:to-amber-950/30 rounded-lg border-2 border-amber-300/50 dark:border-amber-800/40 shadow-sm relative overflow-hidden">
                        <div className="relative">
                          <div className="flex items-center gap-2 mb-2">
                            <div className="h-2 w-2 rounded-full bg-amber-500"></div>
                            <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
                              {refundInfo.cutoffTime
                                ? `After ${format(refundInfo.cutoffTime, "dd/MM/yyyy HH:mm")}`
                                : "After Cutoff"}
                            </p>
                          </div>
                          <p className="text-lg font-bold text-amber-600 dark:text-amber-400">
                            {Math.round(refundInfo.percentageAfterCutoff * 100)}% Refund
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {refundInfo.refundAfterCutoff.toLocaleString("vi-VN")} {refundInfo.currency}
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* Booking Started Warning */}
                    <div className="mt-3 flex justify-between items-center p-3 bg-red-50 dark:bg-red-950/20 rounded border border-red-200 dark:border-red-800">
                      <span className="text-xs text-muted-foreground font-medium">Cancel after booking start time</span>
                      <span className="text-xs font-bold text-red-600 dark:text-red-400 uppercase">
                        No refund
                      </span>
                    </div>
                  </div>
                </div>
              )}

              {/* Insufficient Balance Warning */}
              {hasInsufficientBalance && (
                <div className="col-span-2">
                  <Alert className="bg-gradient-to-r from-red-50 via-orange-50 to-red-50 border-2 border-red-300/60 dark:from-red-950/40 dark:via-orange-950/30 dark:to-red-950/40 dark:border-red-800/60 shadow-sm rounded-lg py-3">
                    <div className="p-1.5 rounded bg-red-100 dark:bg-red-900/50">
                      <AlertCircle className="h-4 w-4 text-red-600 dark:text-red-400" />
                    </div>
                    <AlertDescription className="text-red-900 dark:text-red-100">
                      <p className="font-bold mb-1 text-sm">Insufficient Balance</p>
                      <p className="text-xs leading-relaxed">
                        You need <span className="font-bold text-red-700 dark:text-red-300">{estimatedCost?.totalCost.toLocaleString("vi-VN")} {estimatedCost?.currency}</span> but only have <span className="font-bold text-red-700 dark:text-red-300">{walletBalance.toLocaleString("vi-VN")} {walletCurrency}</span>. Please deposit funds to continue.
                      </p>
                    </AlertDescription>
                  </Alert>
                </div>
              )}

              {/* Info Alert */}
              {!hasInsufficientBalance && (
                <div className="col-span-2">
                  <Alert className="bg-blue-50 border-blue-200 dark:bg-blue-950/20 dark:border-blue-800 rounded-lg py-3">
                    <Info className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                    <AlertDescription className="text-blue-900 dark:text-blue-100">
                      <p className="text-xs">
                        Your wallet balance will be reduced by <span className="font-semibold">{estimatedCost?.totalCost.toLocaleString("vi-VN")} {estimatedCost?.currency}</span> when you confirm this booking.
                      </p>
                    </AlertDescription>
                  </Alert>
                </div>
              )}
            </div>
          </div>

          <div className="flex justify-end gap-3 px-8 py-5 border-t bg-muted/30 flex-shrink-0">
            <Button
              variant="outline"
              onClick={() => {
                setShowConfirmDialog(false);
                setPendingBookingData(null);
              }}
              className="font-medium"
            >
              Cancel
            </Button>
            {hasInsufficientBalance ? (
              <Button
                onClick={() => {
                  router.push('/dashboard/creator/wallet?action=deposit');
                  setShowConfirmDialog(false);
                }}
                className="bg-primary font-semibold"
              >
                <DollarSign className="h-4 w-4 mr-2" />
                Deposit Funds
              </Button>
            ) : (
              <Button
                onClick={handleConfirmBooking}
                disabled={addLocationBookingMutation.isPending}
                className="bg-primary font-semibold shadow-md hover:shadow-lg transition-all min-w-[160px]"
              >
                {addLocationBookingMutation.isPending ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Processing...
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="h-4 w-4 mr-2" />
                    Confirm & Pay
                  </>
                )}
              </Button>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

export default function BookLocationPage({
  params,
}: {
  params: Promise<{ eventId: string }>;
}) {
  const { eventId } = use(params);
  const { data: eventDetail } = useEventById(eventId);
  const [selectedLocationId, setSelectedLocationId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [priceRange, setPriceRange] = useState<[number, number]>([0, 1000000]);
  const [maxCapacity, setMaxCapacity] = useState<number | undefined>(undefined);
  const [isMoreFiltersOpen, setIsMoreFiltersOpen] = useState(false);

  // Debounce filter fields
  const [debouncedSearchQuery] = useDebounce(searchQuery, 500);
  const [debouncedPriceRange] = useDebounce(priceRange, 500);
  const [debouncedMaxCapacity] = useDebounce(maxCapacity, 500);

  const { data: locationsData, isLoading } = useBookableLocations({
    page: 1,
    limit: 100,
    search: debouncedSearchQuery || undefined,
    minPrice: debouncedPriceRange[0] > 0 ? debouncedPriceRange[0] : undefined,
    maxPrice: debouncedPriceRange[1] < 1000000 ? debouncedPriceRange[1] : undefined,
    maxCapacity: debouncedMaxCapacity,
  });

  const locations = locationsData?.data || [];

  // Calculate initial center
  const initialCenter = useMemo(() => {
    const locationsList = locationsData?.data || [];
    if (locationsList.length > 0) {
      const validLocs = locationsList.filter(loc => {
        const lat = Number(loc.latitude);
        const lng = Number(loc.longitude);
        return !isNaN(lat) && !isNaN(lng) && lat !== 0 && lng !== 0;
      });
      if (validLocs.length > 0) {
        const avgLat = validLocs.reduce((sum, loc) => sum + Number(loc.latitude), 0) / validLocs.length;
        const avgLng = validLocs.reduce((sum, loc) => sum + Number(loc.longitude), 0) / validLocs.length;
        return { lat: avgLat, lng: avgLng };
      }
    }
    return DEFAULT_CENTER;
  }, [locationsData]);

  // Filter and map locations for the map
  const validLocations = useMemo(() => {
    const locationsList = locationsData?.data || [];
    return locationsList
      .filter(loc => {
        const lat = Number(loc.latitude);
        const lng = Number(loc.longitude);
        return !isNaN(lat) && !isNaN(lng) && lat !== 0 && lng !== 0;
      })
      .map(loc => ({
        ...loc,
        latitude: Number(loc.latitude),
        longitude: Number(loc.longitude),
      })) as Array<BookableLocation & { latitude: number; longitude: number }>;
  }, [locationsData]);

  const selectedLocation = selectedLocationId
    ? locations.find(loc => loc.id === selectedLocationId) || null
    : null;

  const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || "";

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-12 w-12 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Building2 className="h-5 w-5 text-primary" />
            Book a Venue
          </CardTitle>
          <CardDescription>
            Browse and select a venue for your event
          </CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          {/* Search and Filter Section */}
          <div className="p-6 border-b space-y-6 bg-gradient-to-br from-muted/50 to-muted/30">

            {/* Search Bar */}
            <div className="space-y-2">
              <Label className="text-sm font-medium text-foreground flex items-center gap-2">
                <Search className="h-4 w-4" />
                Search Locations
              </Label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search by name or address..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10 h-11"
                />
              </div>
            </div>

            {/* More Filters - Collapsible */}
            <Collapsible open={isMoreFiltersOpen} onOpenChange={setIsMoreFiltersOpen}>
              <CollapsibleTrigger asChild>
                <Button variant="outline" size="sm" className="gap-2 h-9 w-full justify-between">
                  <span className="font-medium">More filters</span>
                  <ChevronDown className={`h-4 w-4 transition-transform ${isMoreFiltersOpen ? 'rotate-180' : ''}`} />
                </Button>
              </CollapsibleTrigger>
              <CollapsibleContent className="space-y-4 pt-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Max Capacity */}
                  <div className="space-y-2">
                    <Label htmlFor="maxCapacity" className="text-sm font-medium text-foreground">Max Capacity</Label>
                    <Input
                      id="maxCapacity"
                      type="number"
                      placeholder="Any capacity"
                      value={maxCapacity || ""}
                      onChange={(e) => setMaxCapacity(e.target.value ? parseInt(e.target.value, 10) : undefined)}
                      min={1}
                      className="h-11"
                    />
                  </div>

                  {/* Price Range */}
                  <div className="space-y-2">
                    <Label className="text-sm font-medium text-foreground">
                      Price per Hour: {priceRange[0].toLocaleString("vi-VN")} - {priceRange[1].toLocaleString("vi-VN")} VND
                    </Label>
                    <Slider
                      value={priceRange}
                      onValueChange={(value) => setPriceRange(value as [number, number])}
                      min={0}
                      max={1000000}
                      step={10000}
                      className="w-full"
                    />
                  </div>
                </div>
              </CollapsibleContent>
            </Collapsible>
          </div>

          <div className="relative h-[700px] w-full">
            <div className="absolute inset-0 [&_.gm-control-active]:left-0 [&_.gm-fullscreen-control]:left-0 [&_.gm-zoom-control]:left-0">
              <APIProvider apiKey={apiKey}>
                <Map
                  defaultCenter={initialCenter}
                  defaultZoom={13}
                  mapId="book-location-map"
                  gestureHandling="greedy"
                  disableDefaultUI={false}
                  zoomControl={true}
                  zoomControlOptions={{
                    position: 5, // LEFT_CENTER
                  } as google.maps.ZoomControlOptions}
                  mapTypeControl={false}
                  streetViewControl={false}
                  fullscreenControl={true}
                  fullscreenControlOptions={{
                    position: 1, // LEFT_TOP
                  } as google.maps.FullscreenControlOptions}
                >
                  <MapController
                    locations={validLocations}
                    selectedLocationId={selectedLocationId || undefined}
                  />
                  {validLocations.map((location) => {
                    const isSelected = selectedLocationId === location.id;

                    return (
                      <AdvancedMarker
                        key={location.id}
                        position={{ lat: location.latitude, lng: location.longitude }}
                        onClick={(e) => {
                          e.stop();
                          setSelectedLocationId(location.id);
                        }}
                      >
                        <div className="relative cursor-pointer transition-transform hover:scale-110">
                          <Pin
                            background={isSelected ? "#22c55e" : "#ef4444"}
                            borderColor={isSelected ? "#16a34a" : "#991b1b"}
                            glyphColor="#fff"
                            scale={isSelected ? 1.3 : 1}
                          />
                        </div>
                      </AdvancedMarker>
                    );
                  })}
                </Map>
              </APIProvider>
            </div>
            {selectedLocation && (
              <LocationDetailsOverlay
                location={selectedLocation}
                onClose={() => setSelectedLocationId(null)}
                eventId={eventId}
                eventDetail={eventDetail}
              />
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
