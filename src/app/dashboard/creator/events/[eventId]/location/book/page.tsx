"use client";

import { use, useState, useMemo, useRef, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Building2, Loader2, MapPin as MapPinIcon, ArrowLeft, Mail, Phone, Star, ChevronLeft, ChevronRight, Calendar, Search, ChevronDown, DollarSign, Clock, ChevronUp, RotateCcw } from "lucide-react";
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
import { DateTimePicker } from "@/app/dashboard/creator/request/create/_components/DateTimePicker";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { AvailabilityCalendar } from "@/app/dashboard/creator/request/create/_components/AvailabilityCalendar";
import { useDebounce } from "use-debounce";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { useAddLocationBooking } from "@/hooks/events/useAddLocationBooking";
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
  startTime,
  endTime
}: { 
  location: BookableLocation | null; 
  onClose: () => void;
  eventId: string;
  startTime?: Date;
  endTime?: Date;
}) {
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [isDescriptionExpanded, setIsDescriptionExpanded] = useState(false);
  const [isAvailabilityExpanded, setIsAvailabilityExpanded] = useState(false);
  const [showCalendar, setShowCalendar] = useState(false);
  const [selectedSlots, setSelectedSlots] = useState<SlotSelection[]>([]);
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

  // Fetch detailed location data
  const { data: detailedLocation, isLoading: isLoadingDetails } = useBookableLocationById(
    location?.id || null
  );

  // Use detailed location data if available, otherwise fall back to basic location data
  const displayLocation = detailedLocation || location;

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
                    className={`h-1.5 rounded-full transition-all ${
                      index === currentImageIndex
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
              <div className={`flex items-start gap-3 p-3 bg-muted/50 border border-border/50 ${
                !displayLocation.bookingConfig?.refundEnabled && !businessEmail && !businessPhone ? 'rounded-b-xl rounded-t-xs' : 'rounded-xs'
              }`}>
                <DollarSign className="h-5 w-5 text-muted-foreground mt-0.5 flex-shrink-0" />
                <p className="text-sm text-foreground">
                  {parseFloat(displayLocation.bookingConfig.baseBookingPrice).toLocaleString("vi-VN")} {displayLocation.bookingConfig.currency || "VND"} / hour
                </p>
              </div>
            )}

            {/* Refund Policy */}
            {displayLocation.bookingConfig && (
              <div className={`flex items-start gap-3 p-3 bg-muted/50 border border-border/50 ${
                !businessEmail && !businessPhone ? 'rounded-b-xl rounded-t-xs' : 'rounded-xs'
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
              <div className={`flex items-start gap-3 p-3 bg-muted/50 border border-border/50 ${
                !businessPhone ? 'rounded-b-xl rounded-t-xs' : 'rounded-xs'
              }`}>
                <Mail className="h-5 w-5 text-muted-foreground mt-0.5 flex-shrink-0" />
                <p className="text-sm text-foreground">{businessEmail}</p>
              </div>
            )}

            {/* Phone */}
            {businessPhone && (
              <div className={`flex items-start gap-3 p-3 bg-muted/50 border border-border/50 ${
                availabilities.length === 0 ? 'rounded-b-xl rounded-t-xs' : 'rounded-xs'
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
            // Pre-fill slots if startTime and endTime are provided
            if (startTime && endTime) {
              setSelectedSlots(splitRangeIntoDailySlots(startTime, endTime));
            } else {
              setSelectedSlots([]);
            }
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
      <Dialog open={showCalendar} onOpenChange={setShowCalendar}>
        <DialogContent className="w-[90vw] !max-w-5xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Select Booking Time Slots</DialogTitle>
          </DialogHeader>
          {displayLocation && (
            <AvailabilityCalendar
              locationId={displayLocation.id}
              initialSlots={selectedSlots}
              onSlotsChange={setSelectedSlots}
              initialWeekStart={startTime}
            />
          )}
          <div className="flex justify-end gap-2 pt-4 border-t">
            <Button
              variant="outline"
              onClick={() => {
                setShowCalendar(false);
                setSelectedSlots([]);
              }}
            >
              Cancel
            </Button>
            <Button
              onClick={async () => {
                if (!displayLocation || collapsedSlotRanges.length === 0) return;
                
                // Map slots to API format (only the merged selections)
                const dates = collapsedSlotRanges.map((slot) => ({
                  startDateTime: slot.start.toISOString(),
                  endDateTime: slot.end.toISOString(),
                }));

                // alert(JSON.stringify(dates));

                addLocationBookingMutation.mutate(
                  {
                    locationId: displayLocation.id,
                    dates,
                  },
                  {
                    onSuccess: () => {
                      toast.success("Booking created successfully");
                      setShowCalendar(false);
                      setSelectedSlots([]);
                      router.push(`/dashboard/creator/events/${eventId}/location`);
                      router.refresh();
                    },
                  }
                );
              }}
              disabled={selectedSlots.length === 0 || addLocationBookingMutation.isPending}
            >
              {addLocationBookingMutation.isPending ? "Creating..." : "Confirm Booking"}
            </Button>
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
  const [startTime, setStartTime] = useState<Date | undefined>(undefined);
  const [endTime, setEndTime] = useState<Date | undefined>(undefined);
  const [priceRange, setPriceRange] = useState<[number, number]>([0, 1000000]);
  const [maxCapacity, setMaxCapacity] = useState<number | undefined>(undefined);
  const [isMoreFiltersOpen, setIsMoreFiltersOpen] = useState(false);

  // Calculate minimum end time (4 hours after start time)
  const minEndTime = useMemo(() => {
    if (!startTime) return undefined;
    const minEnd = new Date(startTime);
    minEnd.setHours(minEnd.getHours() + 4);
    return minEnd;
  }, [startTime]);

  // Validate end time is at least 4 hours after start time
  useEffect(() => {
    if (startTime && endTime && minEndTime && endTime < minEndTime) {
      setEndTime(minEndTime);
    }
  }, [startTime, endTime, minEndTime]);

  // Debounce filter fields
  const [debouncedSearchQuery] = useDebounce(searchQuery, 500);
  const [debouncedStartTime] = useDebounce(startTime, 500);
  const [debouncedEndTime] = useDebounce(endTime, 500);
  const [debouncedPriceRange] = useDebounce(priceRange, 500);
  const [debouncedMaxCapacity] = useDebounce(maxCapacity, 500);

  const { data: locationsData, isLoading } = useBookableLocations({ 
    page: 1, 
    limit: 100,
    search: debouncedSearchQuery || undefined,
    startTime: debouncedStartTime?.toISOString(),
    endTime: debouncedEndTime?.toISOString(),
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
      {/* Date Selection - Main Filters */}
      <div className="space-y-4 p-4 rounded-lg bg-background/80 border border-border/50 shadow-sm">
        <div className="flex items-center gap-2">
          <Calendar className="h-5 w-5 text-primary" />
          <p className="text-base font-semibold text-foreground">
            When do you want to make your booking?
          </p>
        </div>
        <p className="text-sm text-muted-foreground ml-7">
          Leave blank to search all available dates
        </p>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
          {/* Start Date */}
          <div className="space-y-2">
            <Label className="text-sm font-medium text-foreground">Start Date</Label>
            <DateTimePicker
              label=""
              value={startTime}
              onChange={setStartTime}
              eventStartDate={eventDetail?.startDate ? new Date(eventDetail.startDate) : undefined}
              eventEndDate={eventDetail?.endDate ? new Date(eventDetail.endDate) : undefined}
            />
          </div>

          {/* End Date */}
          <div className="space-y-2">
            <Label className="text-sm font-medium text-foreground">End Date (min 4h)</Label>
            <DateTimePicker
              label=""
              value={endTime}
              onChange={setEndTime}
              defaultTime="11:59"
              eventStartDate={eventDetail?.startDate ? new Date(eventDetail.startDate) : undefined}
              eventEndDate={eventDetail?.endDate ? new Date(eventDetail.endDate) : undefined}
            />
          </div>
        </div>
      </div>

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
                startTime={startTime}
                endTime={endTime}
              />
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
