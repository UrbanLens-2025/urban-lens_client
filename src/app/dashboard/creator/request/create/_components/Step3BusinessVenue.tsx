/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { useState, useEffect, useMemo } from "react";
import { UseFormReturn } from "react-hook-form";
import { format } from "date-fns";
import { CreateEventRequestForm } from "../page";
import { VenueMapSelector } from "./VenueMapSelector";
import { AvailabilityCalendar } from "./AvailabilityCalendar";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Info, Building2, MapPin, Calendar, CheckCircle2, Loader2, AlertCircle, Map, Star, RotateCcw, Search, List, Grid3x3, X, Clock, AlertTriangle, XCircle } from "lucide-react";
import Image from "next/image";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useBookableLocations } from "@/hooks/events/useBookableLocations";
import { useBookableLocationById } from "@/hooks/events/useBookableLocationById";
import { useLocationById } from "@/hooks/locations/useLocationById";
import { useWallet } from "@/hooks/user/useWallet";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { useDebounce } from "use-debounce";
import { Skeleton } from "@/components/ui/skeleton";
import { useRouter } from "next/navigation";
import { DollarSign, Wallet, CreditCard } from "lucide-react";

interface Step3BusinessVenueProps {
  form: UseFormReturn<CreateEventRequestForm>;
}

export function Step3BusinessVenue({ form }: Step3BusinessVenueProps) {
  const router = useRouter();
  const { data: walletData } = useWallet();
  const [selectedLocationId, setSelectedLocationId] = useState<string | undefined>(
    form.watch("locationId")
  );
  const [showCalendar, setShowCalendar] = useState(false);
  const [showMapView, setShowMapView] = useState(true); // Show map by default
  const [viewMode, setViewMode] = useState<"map" | "list" | "grid">("map"); // View mode: map, list, or grid
  const [isInitializingCalendar, setIsInitializingCalendar] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [debouncedSearch] = useDebounce(searchQuery, 300);
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [pendingSlots, setPendingSlots] = useState<Array<{ startDateTime: Date; endDateTime: Date }>>([]);
  const [tempSlots, setTempSlots] = useState<Array<{ startDateTime: Date; endDateTime: Date }>>([]);
  
  // Get event dates from form
  const startDate = form.watch("startDate");
  const endDate = form.watch("endDate");
  
  // Convert dates to ISO strings for API
  const startTime = startDate ? startDate.toISOString() : undefined;
  const endTime = endDate ? endDate.toISOString() : undefined;
  
  const { data: bookableLocationsData, isLoading: isLoadingLocations } = useBookableLocations({ 
    page: 1, 
    limit: 50, 
    sortBy: 'name:ASC',
    startTime,
    endTime,
    search: debouncedSearch || undefined,
  });

  const locations = bookableLocationsData?.data || [];
  
  // Filter locations by search query (client-side fallback for name/address)
  const filteredLocations = useMemo(() => {
    if (!debouncedSearch) return locations;
    const query = debouncedSearch.toLowerCase();
    return locations.filter(loc => 
      loc.name?.toLowerCase().includes(query) ||
      loc.addressLine?.toLowerCase().includes(query) ||
      loc.description?.toLowerCase().includes(query)
    );
  }, [locations, debouncedSearch]);
  const location = locations.find((loc) => loc.id === selectedLocationId);
  const dateRanges = form.watch("dateRanges") || [];
  const hasBookedSlots = dateRanges && dateRanges.length > 0;
  
  // Fetch detailed location data for analytics (check-ins, reviews, etc.)
  const { data: bookableLocationDetails } = useBookableLocationById(selectedLocationId);
  // Also fetch regular location data which may have analytics
  const { data: regularLocationDetails } = useLocationById(selectedLocationId || null);
  
  // Combine data from both sources
  const locationDetails = bookableLocationDetails || regularLocationDetails;

  // Handle location selection - clear dateRanges when location changes
  const handleLocationSelect = (locationId: string) => {
    const previousLocationId = selectedLocationId;
    
    // If location changed (not just initial set), clear dateRanges
    if (previousLocationId && previousLocationId !== locationId) {
      form.setValue("dateRanges" as any, [], { shouldValidate: false });
    }
    
    setSelectedLocationId(locationId);
    form.setValue("locationId", locationId, { shouldValidate: true });
  };

  useEffect(() => {
    if (selectedLocationId) {
      form.setValue("locationId", selectedLocationId, { shouldValidate: true });
    }
  }, [selectedLocationId, form]);



  const handleSlotsChange = (slots: Array<{ startDateTime: Date; endDateTime: Date }>) => {
    // Store slots in temporary state - don't save to form until "Save Slots" is clicked
    setTempSlots(slots);
  };

  const handleSaveSlots = () => {
    // Dismiss any existing toasts first
    toast.dismiss();
    
    // Use tempSlots (from calendar) - these are the slots selected but not yet saved
    const currentSlots = tempSlots;
    
    if (currentSlots.length === 0) {
      toast.error("No time slots selected", {
        description: "Please select at least one time slot to continue.",
        icon: <Calendar className="h-4 w-4" />,
        duration: 4000,
      });
      return;
    }
    
    // Validate that booking covers event dates
    // Booking must start on or before event start, and end on or after event end
    if (startDate && endDate) {
      // Normalize dates for accurate comparison (set milliseconds to 0 to avoid precision issues)
      const eventStart = new Date(startDate);
      eventStart.setMilliseconds(0);
      const eventEnd = new Date(endDate);
      eventEnd.setMilliseconds(0);
      
      // Find the earliest start time and latest end time across all selected slots
      const allSlotStarts = currentSlots.map(slot => {
        const d = new Date(slot.startDateTime);
        d.setMilliseconds(0);
        return d.getTime();
      });
      const allSlotEnds = currentSlots.map(slot => {
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
        
        // Clear invalid slots from form and prevent closing dialog
        form.setValue("dateRanges" as any, [], { shouldValidate: true });
        // Don't close dialog - user needs to fix it
        return; // Don't close dialog, don't save
      }
    }
    
    // Validate minimum duration per slot (if venue is selected)
    if (location?.bookingConfig?.minBookingDurationMinutes) {
      const minDurationMs = location.bookingConfig.minBookingDurationMinutes * 60 * 1000;
      const invalidSlots = currentSlots.filter((slot) => {
        const slotDurationMs = slot.endDateTime.getTime() - slot.startDateTime.getTime();
        return slotDurationMs < minDurationMs;
      });
      
      if (invalidSlots.length > 0) {
        toast.dismiss();
        toast.error("Slot duration too short", {
          description: `Each booking slot must be at least ${location.bookingConfig.minBookingDurationMinutes} minutes long. Please adjust your selection.`,
          icon: <Clock className="h-4 w-4" />,
          duration: 5000,
        });
        return;
      }
    }
    
    // Save slots to form and show confirmation dialog
    form.setValue("dateRanges" as any, currentSlots, { shouldValidate: true });
    setPendingSlots(currentSlots);
    setShowConfirmDialog(true);
  };

  // Calculate estimated cost
  const estimatedCost = useMemo(() => {
    if (!location?.bookingConfig?.baseBookingPrice || pendingSlots.length === 0) {
      return null;
    }

    const basePrice = parseFloat(location.bookingConfig.baseBookingPrice);
    const currency = location.bookingConfig.currency || "VND";
    
    // Calculate total hours
    let totalMilliseconds = 0;
    pendingSlots.forEach(slot => {
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
  }, [pendingSlots, location?.bookingConfig]);

  // Get wallet balance
  const walletBalance = walletData ? parseFloat(walletData.balance) : 0;
  const walletCurrency = walletData?.currency || "VND";
  const hasInsufficientBalance = estimatedCost && walletBalance < estimatedCost.totalCost;

  // Calculate refund information
  const refundInfo = useMemo(() => {
    if (!estimatedCost || !location?.bookingConfig?.refundEnabled) {
      return null;
    }

    const config = location.bookingConfig;
    const totalCost = estimatedCost.totalCost;
    
    // Find earliest booking slot start time for cutoff calculation
    const earliestSlotStart = pendingSlots.length > 0 
      ? new Date(Math.min(...pendingSlots.map(s => s.startDateTime.getTime())))
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
  }, [estimatedCost, location?.bookingConfig, pendingSlots]);

  // Handle confirmation
  const handleConfirmBooking = () => {
    if (hasInsufficientBalance) {
      // Redirect to wallet deposit page
      router.push('/dashboard/creator/wallet?action=deposit');
      toast.info("Please deposit funds to continue with booking", {
        description: `You need ${estimatedCost?.totalCost.toLocaleString("vi-VN")} ${estimatedCost?.currency} but have ${walletBalance.toLocaleString("vi-VN")} ${walletCurrency}`,
        duration: 6000,
      });
      return;
    }

    // Save slots to form
    form.setValue("dateRanges" as any, pendingSlots, { shouldValidate: true });
    setShowConfirmDialog(false);
    setShowCalendar(false);
    setPendingSlots([]);
    
    toast.success("Time slots saved successfully", {
      description: `Payment of ${estimatedCost?.totalCost.toLocaleString("vi-VN")} ${estimatedCost?.currency} will be processed when you submit the event request.`,
      duration: 5000,
    });
  };

  const handleBookNow = () => {
    if (!selectedLocationId) {
      return;
    }
    
    // Initialize tempSlots with existing dateRanges when opening calendar
    setTempSlots(dateRanges || []);
    setIsInitializingCalendar(true);
    setShowCalendar(true);
    // Reset initialization flag after a short delay to allow calendar to initialize
    setTimeout(() => {
      setIsInitializingCalendar(false);
    }, 500);
  };

  // Mock data for booked and unavailable slots - TODO: Replace with API calls
  const mockBookedSlots = useMemo(() => {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    tomorrow.setHours(13, 0, 0, 0);
    
    const day4 = new Date();
    day4.setDate(day4.getDate() + 3);
    day4.setHours(10, 0, 0, 0);

    return [
      { startDateTime: tomorrow, endDateTime: new Date(tomorrow.getTime() + 60 * 60 * 1000) },
      { startDateTime: day4, endDateTime: new Date(day4.getTime() + 60 * 60 * 1000) },
    ];
  }, []);

  const mockUnavailableSlots = useMemo(() => {
    const today = new Date();
    today.setDate(today.getDate());
    today.setHours(12, 0, 0, 0);

    return [
      { startDateTime: today, endDateTime: new Date(today.getTime() + 60 * 60 * 1000) },
    ];
  }, []);

  const isLocationComplete = selectedLocationId && hasBookedSlots;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start gap-4 pb-4 border-b-2 border-primary/20">
        <div className="p-3 rounded-xl bg-gradient-to-br from-primary/20 to-primary/10 text-primary shadow-md">
          <Building2 className="h-6 w-6" />
        </div>
        <div className="flex-1">
          <div className="flex items-center gap-3 mb-2">
            <h2 className="text-2xl lg:text-3xl font-bold bg-gradient-to-r from-foreground to-foreground/80 bg-clip-text">
              Choose Event Location
            </h2>
            <Badge variant="secondary" className="text-xs font-medium px-2.5 py-1">
              Optional
            </Badge>
          </div>
          <p className="text-muted-foreground text-base mb-3">
            Select a venue and book your event time slots. This step is required to continue.
          </p>
          {isLocationComplete && (
            <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-green-50 dark:bg-green-950/30 border border-green-200 dark:border-green-800 rounded-lg">
              <CheckCircle2 className="h-4 w-4 text-green-600" />
              <span className="text-sm text-green-700 dark:text-green-300 font-medium">
                Location selected and time slots booked
              </span>
            </div>
          )}
        </div>
      </div>

      {/* Info Alert */}
      {!startDate || !endDate ? (
        <Alert className="bg-gradient-to-r from-amber-50 to-amber-100/50 dark:from-amber-950/30 dark:to-amber-900/20 border-2 border-amber-200 dark:border-amber-800 shadow-sm">
          <Info className="h-5 w-5 text-amber-600 dark:text-amber-400" />
          <AlertDescription className="text-sm text-amber-900 dark:text-amber-200 ml-2">
            <strong className="font-semibold">Note:</strong> Please set your event dates in the previous step to see venues available during your event time.
          </AlertDescription>
        </Alert>
      ) : (
        <Alert className="bg-gradient-to-r from-blue-50 to-blue-100/50 dark:from-blue-950/30 dark:to-blue-900/20 border-2 border-blue-200 dark:border-blue-800 shadow-sm">
          <Info className="h-5 w-5 text-blue-600 dark:text-blue-400" />
          <AlertDescription className="text-sm text-blue-900 dark:text-blue-200 ml-2">
            <strong className="font-semibold">Tip:</strong> Only venues available during your event time ({startDate.toLocaleDateString()} - {endDate.toLocaleDateString()}) are shown. You can always add or change the location when editing your event.
          </AlertDescription>
        </Alert>
      )}

      {/* Location Selection */}
      <div className="space-y-4">
        {/* Header with Search and View Toggle */}
        <div className="space-y-3">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <div className="flex items-center gap-2">
              <Label htmlFor="location-select" className="text-base font-semibold flex items-center gap-2">
                <MapPin className="h-4 w-4 text-primary" />
                Select Venue
              </Label>
              {selectedLocationId && (
                <Badge variant="outline" className="text-xs bg-green-50 dark:bg-green-950/30 border-green-200 dark:border-green-800 text-green-700 dark:text-green-300">
                  <CheckCircle2 className="h-3 w-3 mr-1" />
                  Selected
                </Badge>
              )}
              {!isLoadingLocations && filteredLocations.length > 0 && (
                <Badge variant="secondary" className="text-xs">
                  {filteredLocations.length} venue{filteredLocations.length !== 1 ? 's' : ''}
                </Badge>
              )}
            </div>
            
            {/* View Mode Toggle */}
            {!isLoadingLocations && filteredLocations.length > 0 && (
              <div className="flex items-center gap-2">
                <div className="flex items-center border rounded-lg p-0.5 bg-muted/50">
                  <Button
                    variant={viewMode === "map" ? "default" : "ghost"}
                    size="sm"
                    onClick={() => setViewMode("map")}
                    className="h-7 text-xs"
                  >
                    <Map className="h-3 w-3 mr-1" />
                    Map
                  </Button>
                  <Button
                    variant={viewMode === "list" ? "default" : "ghost"}
                    size="sm"
                    onClick={() => setViewMode("list")}
                    className="h-7 text-xs"
                  >
                    <List className="h-3 w-3 mr-1" />
                    List
                  </Button>
                  <Button
                    variant={viewMode === "grid" ? "default" : "ghost"}
                    size="sm"
                    onClick={() => setViewMode("grid")}
                    className="h-7 text-xs"
                  >
                    <Grid3x3 className="h-3 w-3 mr-1" />
                    Grid
                  </Button>
                </div>
              </div>
            )}
          </div>
          
          {/* Search Bar */}
          {!isLoadingLocations && locations.length > 0 && (
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search venues by name, address, or description..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 pr-10 h-11 border-2 focus:border-primary/50"
              />
              {searchQuery && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setSearchQuery("")}
                  className="absolute right-1 top-1/2 -translate-y-1/2 h-7 w-7 p-0"
                >
                  <X className="h-4 w-4" />
                </Button>
              )}
            </div>
          )}
        </div>

        {/* Loading State */}
        {isLoadingLocations && (
          <div className="space-y-3">
            <Skeleton className="h-11 w-full" />
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {[1, 2, 3].map((i) => (
                <Card key={i} className="overflow-hidden">
                  <Skeleton className="h-48 w-full" />
                  <CardContent className="p-4 space-y-2">
                    <Skeleton className="h-5 w-3/4" />
                    <Skeleton className="h-4 w-full" />
                    <Skeleton className="h-4 w-2/3" />
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        )}

        {/* Map View */}
        {!isLoadingLocations && viewMode === "map" && filteredLocations.length > 0 && (
          <Card className="h-[500px] w-full border-2 border-primary/10 shadow-sm">
            <CardContent className="p-0 h-full">
              <VenueMapSelector
                locations={filteredLocations.map((loc) => {
                  const isSelected = loc.id === selectedLocationId;
                  const detailedData = isSelected && locationDetails ? locationDetails : null;
                  
                  return {
                    id: loc.id,
                    name: loc.name,
                    description: loc.description,
                    latitude: Number(loc.latitude) || 0,
                    longitude: Number(loc.longitude) || 0,
                    addressLine: loc.addressLine,
                    addressLevel1: loc.addressLevel1,
                    addressLevel2: loc.addressLevel2,
                    imageUrl: loc.imageUrl || [],
                    bookingConfig: loc.bookingConfig,
                    businessId: loc.businessId,
                    ...(detailedData && {
                      totalCheckIns: (detailedData as any).totalCheckIns,
                      analytics: {
                        totalCheckIns: (detailedData as any).totalCheckIns 
                          ? (typeof (detailedData as any).totalCheckIns === 'string' 
                              ? parseInt((detailedData as any).totalCheckIns) 
                              : (detailedData as any).totalCheckIns)
                          : 0,
                        totalReviews: (detailedData as any).totalReviews || 0,
                        averageRating: (detailedData as any).averageRating 
                          ? (typeof (detailedData as any).averageRating === 'string' 
                              ? parseFloat((detailedData as any).averageRating) 
                              : (detailedData as any).averageRating)
                          : 0,
                      },
                    }),
                  };
                })}
                onLocationSelect={handleLocationSelect}
                selectedLocationId={selectedLocationId}
              />
            </CardContent>
          </Card>
        )}

        {/* List View */}
        {!isLoadingLocations && viewMode === "list" && filteredLocations.length > 0 && (
          <div className="space-y-3">
            {filteredLocations.map((loc) => {
              const isSelected = loc.id === selectedLocationId;
              const locDetails = isSelected && locationDetails ? locationDetails : null;
              
              return (
                <Card
                  key={loc.id}
                  className={cn(
                    "cursor-pointer transition-all hover:shadow-md border-2",
                    isSelected
                      ? "border-primary bg-primary/5 shadow-sm"
                      : "border-border hover:border-primary/30"
                  )}
                  onClick={() => handleLocationSelect(loc.id)}
                >
                  <CardContent className="p-4">
                    <div className="flex gap-4">
                      {/* Image */}
                      {loc.imageUrl && loc.imageUrl.length > 0 ? (
                        <div className="relative h-24 w-32 flex-shrink-0 rounded-lg overflow-hidden bg-muted">
                          <Image
                            src={loc.imageUrl[0]}
                            alt={loc.name || "Venue"}
                            fill
                            className="object-cover"
                          />
                        </div>
                      ) : (
                        <div className="h-24 w-32 flex-shrink-0 rounded-lg bg-gradient-to-br from-primary/10 to-primary/5 flex items-center justify-center">
                          <Building2 className="h-8 w-8 text-primary/40" />
                        </div>
                      )}
                      
                      {/* Content */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-1">
                              <h3 className="font-semibold text-base truncate">{loc.name}</h3>
                              {isSelected && (
                                <Badge className="bg-primary text-primary-foreground">
                                  <CheckCircle2 className="h-3 w-3 mr-1" />
                                  Selected
                                </Badge>
                              )}
                            </div>
                            <p className="text-sm text-muted-foreground flex items-center gap-1 mb-2">
                              <MapPin className="h-3 w-3 flex-shrink-0" />
                              <span className="truncate">
                                {loc.addressLine}
                                {loc.addressLevel1 && `, ${loc.addressLevel1}`}
                              </span>
                            </p>
                            {loc.description && (
                              <p className="text-sm text-foreground/80 line-clamp-2 mb-2">
                                {loc.description}
                              </p>
                            )}
                          </div>
                        </div>
                        
                        {/* Analytics */}
                        <div className="flex items-center gap-4 text-xs text-muted-foreground mt-2">
                          {locDetails && (locDetails as any).averageRating > 0 && (
                            <div className="flex items-center gap-1">
                              <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
                              <span className="font-medium text-foreground">
                                {typeof (locDetails as any).averageRating === 'string' 
                                  ? parseFloat((locDetails as any).averageRating).toFixed(1)
                                  : (locDetails as any).averageRating.toFixed(1)}
                              </span>
                            </div>
                          )}
                          {locDetails && (locDetails as any).totalCheckIns > 0 && (
                            <span>
                              {(locDetails as any).totalCheckIns} check-in{(locDetails as any).totalCheckIns !== 1 ? 's' : ''}
                            </span>
                          )}
                          {locDetails && (locDetails as any).totalReviews > 0 && (
                            <span>
                              {(locDetails as any).totalReviews} review{(locDetails as any).totalReviews !== 1 ? 's' : ''}
                            </span>
                          )}
                          {loc.bookingConfig && (
                            <Badge variant="outline" className="text-xs">
                              Bookable
                            </Badge>
                          )}
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}

        {/* Grid View */}
        {!isLoadingLocations && viewMode === "grid" && filteredLocations.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredLocations.map((loc) => {
              const isSelected = loc.id === selectedLocationId;
              const locDetails = isSelected && locationDetails ? locationDetails : null;
              
              return (
                <Card
                  key={loc.id}
                  className={cn(
                    "cursor-pointer transition-all hover:shadow-lg border-2 overflow-hidden group",
                    isSelected
                      ? "border-primary bg-primary/5 shadow-md ring-2 ring-primary/20"
                      : "border-border hover:border-primary/50"
                  )}
                  onClick={() => handleLocationSelect(loc.id)}
                >
                  {/* Image */}
                  {loc.imageUrl && loc.imageUrl.length > 0 ? (
                    <div className="relative h-48 w-full overflow-hidden bg-muted">
                      <Image
                        src={loc.imageUrl[0]}
                        alt={loc.name || "Venue"}
                        fill
                        className="object-cover group-hover:scale-105 transition-transform duration-300"
                      />
                      {isSelected && (
                        <div className="absolute top-2 right-2">
                          <Badge className="bg-primary text-primary-foreground shadow-lg">
                            <CheckCircle2 className="h-3 w-3 mr-1" />
                            Selected
                          </Badge>
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="relative h-48 w-full bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center">
                      <Building2 className="h-16 w-16 text-primary/40" />
                      {isSelected && (
                        <div className="absolute top-2 right-2">
                          <Badge className="bg-primary text-primary-foreground shadow-lg">
                            <CheckCircle2 className="h-3 w-3 mr-1" />
                            Selected
                          </Badge>
                        </div>
                      )}
                    </div>
                  )}
                  
                  {/* Content */}
                  <CardContent className="p-4">
                    <h3 className="font-semibold text-base mb-2 line-clamp-1">{loc.name}</h3>
                    <p className="text-sm text-muted-foreground flex items-start gap-1 mb-3 line-clamp-2">
                      <MapPin className="h-3 w-3 mt-0.5 flex-shrink-0" />
                      <span>
                        {loc.addressLine}
                        {loc.addressLevel1 && `, ${loc.addressLevel1}`}
                      </span>
                    </p>
                    
                    {/* Analytics */}
                    <div className="flex items-center gap-3 text-xs text-muted-foreground pt-3 border-t">
                      {locDetails && (locDetails as any).averageRating > 0 && (
                        <div className="flex items-center gap-1">
                          <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
                          <span className="font-medium text-foreground">
                            {typeof (locDetails as any).averageRating === 'string' 
                              ? parseFloat((locDetails as any).averageRating).toFixed(1)
                              : (locDetails as any).averageRating.toFixed(1)}
                          </span>
                        </div>
                      )}
                      {locDetails && (locDetails as any).totalCheckIns > 0 && (
                        <span className="text-xs">
                          {(locDetails as any).totalCheckIns} check-ins
                        </span>
                      )}
                      {loc.bookingConfig && (
                        <Badge variant="outline" className="text-xs ml-auto">
                          Bookable
                        </Badge>
                      )}
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
        
        {/* No Results */}
        {!isLoadingLocations && searchQuery && filteredLocations.length === 0 && (
          <div className="border-2 border-dashed border-muted-foreground/30 rounded-xl p-8 text-center">
            <Search className="h-12 w-12 mx-auto text-muted-foreground/50 mb-3" />
            <p className="text-sm font-medium text-muted-foreground mb-1">
              No venues found
            </p>
            <p className="text-xs text-muted-foreground">
              Try adjusting your search terms or clear the search to see all venues.
            </p>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setSearchQuery("")}
              className="mt-4"
            >
              Clear Search
            </Button>
          </div>
        )}
        
        {/* Empty State - No Venues */}
        {!isLoadingLocations && !searchQuery && filteredLocations.length === 0 && locations.length === 0 && (
          <div className="border-2 border-dashed border-muted-foreground/30 rounded-xl p-8 text-center">
            <Building2 className="h-12 w-12 mx-auto text-muted-foreground/50 mb-3" />
            <p className="text-sm font-medium text-muted-foreground mb-1">
              No venues available
            </p>
            <p className="text-xs text-muted-foreground">
              No venues are available for your event dates. Please adjust your event dates or contact support for assistance.
            </p>
          </div>
        )}
      </div>

      {/* Form Errors */}
      {form.formState.errors.locationId && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription className="text-sm">
            {form.formState.errors.locationId.message}
          </AlertDescription>
        </Alert>
      )}

      {(form.formState.errors as any).dateRanges && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription className="text-sm">
            {(form.formState.errors as any).dateRanges.message}
          </AlertDescription>
        </Alert>
      )}

      {/* Location Details */}
      {location && (
          <div 
            data-location-details-panel
            className="border-2 rounded-xl p-5 space-y-4 transition-all border-primary/10 bg-primary/5"
          >
            {/* Images */}
            {location.imageUrl && location.imageUrl.length > 0 && (
              <div className="grid grid-cols-2 gap-2">
                {location.imageUrl.slice(0, 4).map((url, index) => (
                  <div
                    key={index}
                    className="relative aspect-video rounded-lg overflow-hidden bg-muted"
                  >
                    <Image
                      src={url}
                      alt={`${location.name} - Image ${index + 1}`}
                      fill
                      className="object-cover"
                    />
                  </div>
                ))}
              </div>
            )}
            
            <div>
              <h3 className="text-lg font-semibold mb-1">{location.name}</h3>
              <p className="text-sm text-muted-foreground">
                {location.addressLine}
                {location.addressLevel1 && `, ${location.addressLevel1}`}
              </p>
            </div>
            
            {location.description && (
              <p className="text-sm text-foreground">{location.description}</p>
            )}
            
            {/* Analytics */}
            <div className="flex items-center gap-4 text-sm text-muted-foreground">
              {(locationDetails as any)?.averageRating !== undefined ? (
                (locationDetails as any).averageRating > 0 ? (
                  <div className="flex items-center gap-1">
                    <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                    <span className="font-medium text-foreground">
                      {typeof (locationDetails as any).averageRating === 'string' 
                        ? parseFloat((locationDetails as any).averageRating).toFixed(1)
                        : (locationDetails as any).averageRating.toFixed(1)}
                    </span>
                  </div>
                ) : (
                  <span>No rating yet</span>
                )
              ) : (
                <span>No rating yet</span>
              )}
              <span>
                {(locationDetails as any)?.totalCheckIns 
                  ? (typeof (locationDetails as any).totalCheckIns === 'string' 
                      ? parseInt((locationDetails as any).totalCheckIns) 
                      : (locationDetails as any).totalCheckIns)
                  : 0} check-ins
              </span>
              <span>
                {(locationDetails as any)?.totalReviews || 0} reviews
              </span>
            </div>
            
            {/* Refund Policy */}
            {location.bookingConfig && (
              <div className="border-t pt-4 space-y-3">
                <div className="flex items-center gap-2">
                  <RotateCcw className="h-4 w-4 text-primary" />
                  <h4 className="text-sm font-semibold">Refund Policy</h4>
                </div>
                {location.bookingConfig.refundEnabled ? (
                  <div className="space-y-2 text-sm">
                    {location.bookingConfig.refundCutoffHours !== undefined && (
                      <div className="flex justify-between items-center">
                        <span className="text-muted-foreground">
                          Before {location.bookingConfig.refundCutoffHours}h:
                        </span>
                        <span className="font-medium">
                          {location.bookingConfig.refundPercentageBeforeCutoff !== undefined
                            ? `${(location.bookingConfig.refundPercentageBeforeCutoff * 100).toFixed(0)}%`
                            : "100%"}
                        </span>
                      </div>
                    )}
                    {location.bookingConfig.refundCutoffHours !== undefined && (
                      <div className="flex justify-between items-center">
                        <span className="text-muted-foreground">
                          After {location.bookingConfig.refundCutoffHours}h:
                        </span>
                        <span className="font-medium">
                          {location.bookingConfig.refundPercentageAfterCutoff !== undefined
                            ? `${(location.bookingConfig.refundPercentageAfterCutoff * 100).toFixed(0)}%`
                            : "0%"}
                        </span>
                      </div>
                    )}
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground">
                    Refunds are not available for this venue
                  </p>
                )}
              </div>
            )}
            
            {/* Book Time Slots Button */}
            {!hasBookedSlots ? (
              <Button
                onClick={handleBookNow}
                className="w-full"
                size="lg"
              >
                <Calendar className="mr-2 h-4 w-4" />
                Book Time Slots
              </Button>
            ) : (
              <div className="p-4 bg-green-50 dark:bg-green-950/30 border border-green-200 dark:border-green-800 rounded-lg">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="h-4 w-4 text-green-600" />
                    <span className="text-sm font-medium text-green-900 dark:text-green-200">
                      {dateRanges.length} time slot{dateRanges.length !== 1 ? "s" : ""} booked
                    </span>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      // Initialize tempSlots with existing dateRanges when opening calendar
                      setTempSlots(dateRanges || []);
                      setIsInitializingCalendar(true);
                      setShowCalendar(true);
                      // Reset initialization flag after a short delay to allow calendar to initialize
                      setTimeout(() => {
                        setIsInitializingCalendar(false);
                      }, 500);
                    }}
                    className="text-xs h-7"
                  >
                    <Calendar className="h-3 w-3 mr-1" />
                    Edit Slots
                  </Button>
                </div>
              </div>
            )}
          </div>
        )}

      {/* No Location Selected State */}
      {!selectedLocationId && !isLoadingLocations && (
        <div className="border-2 border-dashed border-muted-foreground/30 rounded-xl p-8 text-center">
          <Building2 className="h-12 w-12 mx-auto text-muted-foreground/50 mb-3" />
          <p className="text-sm font-medium text-muted-foreground mb-1">
            No venue selected
          </p>
          <p className="text-xs text-muted-foreground">
            Select a venue above to view details and book time slots, or skip this step to continue.
          </p>
        </div>
      )}

      {/* Availability Calendar Modal */}
      <Dialog open={showCalendar} onOpenChange={(open) => {
        setShowCalendar(open);
        setIsInitializingCalendar(false);
      }}>
        <DialogContent className="w-[95vw] !max-w-5xl max-h-[85vh] overflow-hidden flex flex-col mt-6 p-0 gap-0">
          <DialogHeader className="px-6 pt-6 pb-4 border-b bg-gradient-to-r from-primary/5 to-primary/10">
            <div className="flex items-start justify-between">
              <div>
                <DialogTitle className="text-xl font-semibold mb-1.5">Select Event Time Slots</DialogTitle>
                <DialogDescription className="text-sm text-muted-foreground flex items-center gap-2">
                  <Building2 className="h-4 w-4" />
                  {location?.name}
                </DialogDescription>
              </div>
              {dateRanges && dateRanges.length > 0 && (
                <Badge variant="secondary" className="text-xs font-medium px-3 py-1">
                  {dateRanges.length} slot{dateRanges.length !== 1 ? 's' : ''} selected
                </Badge>
              )}
            </div>
          </DialogHeader>
          
          {/* Event Time Alert */}
          {startDate && endDate && (
            <div className="px-6 pt-4">
              <Alert className="bg-amber-50 border-amber-200 dark:bg-amber-950/20 dark:border-amber-800">
                <Clock className="h-4 w-4 text-amber-600 dark:text-amber-500" />
                <AlertDescription className="text-amber-800 dark:text-amber-200">
                  <p className="font-medium mb-1">Event Time Period</p>
                  <p className="text-sm">
                    Your event runs from{" "}
                    <span className="font-semibold">
                      {format(startDate, "MMM dd, yyyy 'at' h:mm a")}
                    </span>{" "}
                    to{" "}
                    <span className="font-semibold">
                      {format(endDate, "MMM dd, yyyy 'at' h:mm a")}
                    </span>
                    . Please select time slots that cover this entire period.
                  </p>
                </AlertDescription>
              </Alert>
            </div>
          )}
          
          <div className="flex-1 overflow-y-auto px-6 py-4">
            {selectedLocationId && (
              <AvailabilityCalendar
                locationId={selectedLocationId}
                onSlotsChange={(slots) => {
                  // Allow slots to be updated, but validation happens on save
                  handleSlotsChange(slots);
                }}
                initialSlots={tempSlots.length > 0 ? tempSlots : (dateRanges || [])}
                initialWeekStart={startDate}
                eventStartDate={startDate}
                eventEndDate={endDate}
                minBookingDurationMinutes={location?.bookingConfig?.minBookingDurationMinutes}
              />
            )}
          </div>
          <div className="flex items-center justify-between px-6 py-3 border-t bg-muted/30">
            <div className="flex flex-col gap-0.5">
              <p className="text-[10px] text-muted-foreground">
                Click or drag to select time slots • Unavailable times are disabled
              </p>
              {startDate && endDate ? (
                <p className="text-[10px] text-amber-600 dark:text-amber-400 font-medium">
                  ⚠ Selected slots must cover event period: {startDate?.toLocaleDateString() || ''} {startDate?.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) || ''} - {endDate?.toLocaleDateString() || ''} {endDate?.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) || ''}
                </p>
              ) : (
                <p className="text-[10px] text-muted-foreground">
                  Please set event dates in Step 1 to see available booking slots
                </p>
              )}
            </div>
            <div className="flex items-center gap-3">
              <Button
                variant="outline"
                onClick={() => {
                  // Clear slots if invalid before closing
                  const currentSlots = form.watch("dateRanges") || [];
                  if (currentSlots.length > 0 && startDate && endDate) {
                    // Quick validation check - if booking doesn't cover event, clear and close
                    const eventStart = new Date(startDate);
                    eventStart.setMilliseconds(0);
                    const eventEnd = new Date(endDate);
                    eventEnd.setMilliseconds(0);
                    
                    const allSlotStarts = currentSlots.map(slot => {
                      const d = new Date(slot.startDateTime);
                      d.setMilliseconds(0);
                      return d.getTime();
                    });
                    const allSlotEnds = currentSlots.map(slot => {
                      const d = new Date(slot.endDateTime);
                      d.setMilliseconds(0);
                      return d.getTime();
                    });
                    
                    const bookingStart = new Date(Math.min(...allSlotStarts));
                    const bookingEnd = new Date(Math.max(...allSlotEnds));
                    
                    // Check if booking covers event period
                    if (bookingStart.getTime() > eventStart.getTime() || bookingEnd.getTime() < eventEnd.getTime()) {
                      // Clear invalid slots before closing
                      form.setValue("dateRanges" as any, [], { shouldValidate: true });
                    }
                  }
                  // Reset tempSlots when canceling
                  setTempSlots([]);
                  setShowCalendar(false);
                }}
                size="sm"
              >
                Cancel
              </Button>
              <Button
                onClick={handleSaveSlots}
                size="sm"
                className="min-w-[100px]"
              >
                Save Slots
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Confirmation Dialog */}
      <Dialog open={showConfirmDialog} onOpenChange={setShowConfirmDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader className="pb-3">
            <DialogTitle className="flex items-center gap-2 text-lg">
              <CreditCard className="h-5 w-5 text-primary" />
              Confirm Booking & Payment
            </DialogTitle>
          </DialogHeader>
          
          <div className="space-y-3">
            {/* Booking Summary */}
            <div className="bg-muted p-3 rounded-lg space-y-1.5">
              {estimatedCost && (
                <>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">{pendingSlots.length} slot{pendingSlots.length !== 1 ? 's' : ''} • {estimatedCost.totalHours.toFixed(2)}h</span>
                    <span className="font-bold text-primary text-base">
                      {estimatedCost.totalCost.toLocaleString("vi-VN")} {estimatedCost.currency}
                    </span>
                  </div>
                  <div className="text-xs text-muted-foreground pt-1 border-t">
                    {estimatedCost.basePrice.toLocaleString("vi-VN")} {estimatedCost.currency}/hour
                  </div>
                </>
              )}
            </div>

            {/* Wallet Balance */}
            <div className={`p-2.5 rounded-lg border ${hasInsufficientBalance ? 'bg-red-50 border-red-200 dark:bg-red-950/20 dark:border-red-800' : 'bg-green-50 border-green-200 dark:bg-green-950/20 dark:border-green-800'}`}>
              <div className="flex justify-between items-center text-sm">
                <span className="text-muted-foreground flex items-center gap-1.5">
                  <Wallet className="h-3.5 w-3.5" />
                  Balance:
                </span>
                <span className={`font-semibold ${hasInsufficientBalance ? 'text-red-600 dark:text-red-400' : 'text-green-600 dark:text-green-400'}`}>
                  {walletBalance.toLocaleString("vi-VN")} {walletCurrency}
                </span>
              </div>
              {estimatedCost && !hasInsufficientBalance && (
                <div className="flex justify-between items-center text-xs text-muted-foreground mt-1.5 pt-1.5 border-t">
                  <span>After payment:</span>
                  <span>{(walletBalance - estimatedCost.totalCost).toLocaleString("vi-VN")} {walletCurrency}</span>
                </div>
              )}
            </div>

            {/* Refund Policy */}
            {refundInfo && (
              <div className="bg-muted p-2.5 rounded-lg">
                <div className="flex items-center gap-1.5 mb-1.5">
                  <RotateCcw className="h-3.5 w-3.5 text-muted-foreground" />
                  <span className="text-xs font-medium">Refund Policy</span>
                </div>
                <div className="space-y-1 text-xs">
                  {refundInfo.cutoffTime && (
                    <div className="text-muted-foreground mb-1.5">
                      Cutoff: {format(refundInfo.cutoffTime, "MMM dd, h:mm a")} ({refundInfo.cutoffHours}h before)
                    </div>
                  )}
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Before cutoff ({Math.round(refundInfo.percentageBeforeCutoff * 100)}%):</span>
                    <span className="font-medium text-green-600 dark:text-green-400">
                      {refundInfo.refundBeforeCutoff.toLocaleString("vi-VN")} {refundInfo.currency}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">After cutoff ({Math.round(refundInfo.percentageAfterCutoff * 100)}%):</span>
                    <span className="font-medium text-amber-600 dark:text-amber-400">
                      {refundInfo.refundAfterCutoff.toLocaleString("vi-VN")} {refundInfo.currency}
                    </span>
                  </div>
                </div>
              </div>
            )}

            {/* Insufficient Balance Warning */}
            {hasInsufficientBalance && (
              <Alert className="bg-red-50 border-red-200 dark:bg-red-950/20 dark:border-red-800 py-2">
                <AlertTriangle className="h-4 w-4 text-red-600 dark:text-red-400" />
                <AlertDescription className="text-red-800 dark:text-red-200 text-sm">
                  <span className="font-medium">Insufficient balance.</span> Need {estimatedCost?.totalCost.toLocaleString("vi-VN")} {estimatedCost?.currency}, have {walletBalance.toLocaleString("vi-VN")} {walletCurrency}.
                </AlertDescription>
              </Alert>
            )}

            {/* Info Alert */}
            {!hasInsufficientBalance && (
              <Alert className="py-2">
                <Info className="h-4 w-4" />
                <AlertDescription className="text-sm">
                  Balance will be reduced by {estimatedCost?.totalCost.toLocaleString("vi-VN")} {estimatedCost?.currency} on confirmation.
                </AlertDescription>
              </Alert>
            )}
          </div>

          <div className="flex justify-end gap-2 pt-4 border-t">
            <Button
              variant="outline"
              onClick={() => {
                setShowConfirmDialog(false);
                setPendingSlots([]);
              }}
            >
              Cancel
            </Button>
            {hasInsufficientBalance ? (
              <Button
                onClick={() => {
                  router.push('/dashboard/creator/wallet?action=deposit');
                  setShowConfirmDialog(false);
                }}
                className="bg-primary"
              >
                <DollarSign className="h-4 w-4 mr-2" />
                Deposit Funds
              </Button>
            ) : (
              <Button
                onClick={handleConfirmBooking}
                className="bg-primary"
              >
                <CheckCircle2 className="h-4 w-4 mr-2" />
                Confirm Booking
              </Button>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
