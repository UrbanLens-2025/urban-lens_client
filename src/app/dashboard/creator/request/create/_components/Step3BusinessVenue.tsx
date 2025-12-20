/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { useState, useEffect, useMemo } from "react";
import { UseFormReturn } from "react-hook-form";
import { format, isSameDay } from "date-fns";
import { CreateEventRequestForm } from "../page";
import { VenueMapSelector } from "./VenueMapSelector";
import { AvailabilityCalendar } from "./AvailabilityCalendar";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Info, Building2, MapPin, Calendar, CheckCircle2, Loader2, AlertCircle, Map, Star, RotateCcw, Search, List, Grid3x3, X, Clock, AlertTriangle, XCircle, ChevronLeft, ChevronRight, HelpCircle, ArrowLeft, ChevronDown, ChevronUp } from "lucide-react";
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
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";

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
  const [showLocationModal, setShowLocationModal] = useState(false);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [isRefundPolicyOpen, setIsRefundPolicyOpen] = useState(false);
  const [isRefundPolicyOpenInDialog, setIsRefundPolicyOpenInDialog] = useState(false);
  const [isDescriptionExpanded, setIsDescriptionExpanded] = useState(false);

  // Reset image index when location changes
  useEffect(() => {
    setCurrentImageIndex(0);
    setIsDescriptionExpanded(false);
  }, [selectedLocationId]);

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
  const handleLocationSelect = (locationId: string, openModal: boolean = false) => {
    const previousLocationId = selectedLocationId;

    // If location changed (not just initial set), clear dateRanges
    if (previousLocationId && previousLocationId !== locationId) {
      form.setValue("dateRanges" as any, [], { shouldValidate: false });
    }

    setSelectedLocationId(locationId);
    form.setValue("locationId", locationId, { shouldValidate: true });

    // Open modal if requested (e.g., when clicking marker)
    if (openModal) {
      setShowLocationModal(true);
    }
  };

  useEffect(() => {
    if (selectedLocationId) {
      form.setValue("locationId", selectedLocationId, { shouldValidate: true });
    }
  }, [selectedLocationId, form]);

  // Reset image index when location changes
  useEffect(() => {
    setCurrentImageIndex(0);
  }, [selectedLocationId]);



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

        const errorTitle = "Booking doesn't cover event period";
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

    // Don't save slots to form yet - just store in pendingSlots and show payment dialog
    // Slots will be saved only when "Confirm Booking" is clicked
    setPendingSlots(currentSlots);
    setShowCalendar(false);
    setIsInitializingCalendar(false);

    // Small delay to ensure calendar closes smoothly before payment dialog opens
    setTimeout(() => {
      setShowConfirmDialog(true);
    }, 200);
  };

  // Calculate estimated cost - use pendingSlots if available (for payment dialog), otherwise use dateRanges
  const estimatedCost = useMemo(() => {
    const slotsToCalculate = pendingSlots.length > 0 ? pendingSlots : (dateRanges || []);

    if (!location?.bookingConfig?.baseBookingPrice || slotsToCalculate.length === 0) {
      return null;
    }

    const basePrice = parseFloat(location.bookingConfig.baseBookingPrice);
    const currency = location.bookingConfig.currency || "VND";

    // Calculate total hours
    let totalMilliseconds = 0;
    slotsToCalculate.forEach(slot => {
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
  }, [pendingSlots, dateRanges, location?.bookingConfig]);

  // Get wallet balance
  const walletBalance = walletData ? parseFloat(walletData.balance) : 0;
  const walletCurrency = walletData?.currency || "VND";
  const hasInsufficientBalance = estimatedCost && walletBalance < estimatedCost.totalCost;

  // Calculate refund information - use pendingSlots if available, otherwise use dateRanges
  const refundInfo = useMemo(() => {
    const slotsToCalculate = pendingSlots.length > 0 ? pendingSlots : (dateRanges || []);

    if (!estimatedCost || !location?.bookingConfig?.refundEnabled || slotsToCalculate.length === 0) {
      return null;
    }

    const config = location.bookingConfig;
    const totalCost = estimatedCost.totalCost;

    // Find earliest booking slot start time for cutoff calculation
    const earliestSlotStart = slotsToCalculate.length > 0
      ? new Date(Math.min(...slotsToCalculate.map(s => s.startDateTime.getTime())))
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
  }, [estimatedCost, location?.bookingConfig, pendingSlots, dateRanges]);

  // Handle confirmation - confirm the booking
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

    // Use pendingSlots if available, otherwise use dateRanges
    const slotsToConfirm = pendingSlots.length > 0 ? pendingSlots : (dateRanges || []);

    if (slotsToConfirm.length === 0) {
      toast.error("No slots selected", {
        description: "Please select time slots first.",
        duration: 3000,
      });
      return;
    }

    // Ensure slots are saved in the form
    form.setValue("dateRanges" as any, slotsToConfirm, { shouldValidate: true });
    setShowConfirmDialog(false);
    setPendingSlots([]);

    toast.success("Booking confirmed", {
      description: `Saved successfully. Payment will be processed when you submit the event request.`,
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

  // Booked/unavailable slots should come from booking availability APIs.
  // For now, we don't inject any predefined blocks; the calendar will show only the slots the user selects.
  const bookedSlotsPlaceholder: Array<{ startDateTime: Date; endDateTime: Date }> = [];
  const unavailableSlotsPlaceholder: Array<{ startDateTime: Date; endDateTime: Date }> = [];

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

      {/* Selected Slots Display */}
      {hasBookedSlots && dateRanges.length > 0 && (
        <div className="border-2 border-green-200 dark:border-green-800 rounded-lg p-4 bg-green-50 dark:bg-green-950/30 space-y-3">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <div className="h-8 w-8 rounded-lg bg-green-100 dark:bg-green-900/40 flex items-center justify-center">
                <Calendar className="h-4 w-4 text-green-600 dark:text-green-400" />
              </div>
              <h4 className="text-sm font-semibold text-green-900 dark:text-green-200">
                Selected Time Slots ({dateRanges.length})
              </h4>
            </div>
            <Button
              variant="outline"
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
              className="h-8 border-green-300 dark:border-green-700 text-green-700 dark:text-green-300 hover:bg-green-100 dark:hover:bg-green-900/40"
            >
              <Calendar className="h-3.5 w-3.5 mr-1.5" />
              Edit
            </Button>
          </div>
          <div className="space-y-2 max-h-48 overflow-y-auto scrollbar-thin scrollbar-thumb-green-300 scrollbar-track-transparent">
            {(() => {
              // Sort all slots by start time (regardless of date) and merge consecutive ones across days
              const sortedSlots = [...dateRanges].sort((a, b) =>
                new Date(a.startDateTime).getTime() - new Date(b.startDateTime).getTime()
              );

              const mergedRanges: Array<{ start: Date; end: Date }> = [];
              for (let i = 0; i < sortedSlots.length; i++) {
                const currentStart = new Date(sortedSlots[i].startDateTime);
                const currentEnd = new Date(sortedSlots[i].endDateTime);

                if (mergedRanges.length === 0) {
                  mergedRanges.push({ start: currentStart, end: currentEnd });
                } else {
                  const lastRange = mergedRanges[mergedRanges.length - 1];
                  // Merge if consecutive (end time equals start time) - can span across days
                  if (lastRange.end.getTime() === currentStart.getTime()) {
                    lastRange.end = currentEnd;
                  } else {
                    mergedRanges.push({ start: currentStart, end: currentEnd });
                  }
                }
              }

              // Group merged ranges by their start date for display
              const groupedByDate = mergedRanges.reduce((acc, range) => {
                const dateKey = format(range.start, "yyyy-MM-dd");
                if (!acc[dateKey]) {
                  acc[dateKey] = [];
                }
                acc[dateKey].push(range);
                return acc;
              }, {} as Record<string, Array<{ start: Date; end: Date }>>);

              // Sort dates
              const sortedDates = Object.keys(groupedByDate).sort();

              return sortedDates.map((dateKey) => {
                const ranges = groupedByDate[dateKey];
                const date = new Date(dateKey + "T00:00:00");
                const dayName = format(date, "EEEE");

                return (
                  <div key={dateKey} className="p-2.5 bg-white dark:bg-gray-900/50 rounded-md border border-green-200 dark:border-green-800">
                    <div className="flex items-center gap-2 mb-2">
                      <Clock className="h-3.5 w-3.5 text-green-600 dark:text-green-400" />
                      <span className="text-xs font-semibold text-green-900 dark:text-green-200">
                        {format(date, "MMM dd, yyyy")} ({dayName})
                      </span>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {ranges.map((range, idx) => {
                        const durationMs = range.end.getTime() - range.start.getTime();
                        const durationHours = Math.floor(durationMs / (1000 * 60 * 60));
                        const durationMinutes = Math.floor((durationMs % (1000 * 60 * 60)) / (1000 * 60));
                        const durationText = durationHours > 0
                          ? `${durationHours}h${durationMinutes > 0 ? ` ${durationMinutes}m` : ''}`
                          : `${durationMinutes}m`;

                        return (
                          <Badge
                            key={idx}
                            variant="outline"
                            className="text-xs font-mono bg-green-100 dark:bg-green-900/40 border-green-300 dark:border-green-700 text-green-900 dark:text-green-200"
                          >
                            {(() => {
                              const isSameDate = isSameDay(range.start, range.end);
                              if (isSameDate) {
                                // Same day: show both times
                                return `${format(range.start, "HH:mm")} - ${format(range.end, "HH:mm")} (${durationText})`;
                              } else {
                                // Cross-day: show both dates and times
                                return `${format(range.start, "MMM dd, HH:mm")} - ${format(range.end, "MMM dd, HH:mm")} (${durationText})`;
                              }
                            })()}
                          </Badge>
                        );
                      })}
                    </div>
                  </div>
                );
              });
            })()}
          </div>
        </div>
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
          {!isLoadingLocations && (
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
                onLocationSelect={(locationId) => handleLocationSelect(locationId, true)}
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
                  onClick={() => handleLocationSelect(loc.id, true)}
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
                  onClick={() => handleLocationSelect(loc.id, true)}
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

      {/* Location Details Modal */}
      {location && (
        <Dialog
          open={showLocationModal}
          onOpenChange={(open) => {
            setShowLocationModal(open);
            if (open) {
              setCurrentImageIndex(0);
            }
          }}
        >
          <DialogContent className="max-w-2xl max-h-[90vh] flex flex-col p-0 gap-0 overflow-hidden">
            {/* Fixed Header */}
            <DialogHeader className="sticky top-0 z-10 bg-background border-b px-6 pt-6 pb-4 shadow-sm">
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1 min-w-0 pr-2">
                  <DialogTitle className="text-xl font-bold text-foreground mb-2">
                    {location.name}
                  </DialogTitle>
                  <DialogDescription className="flex items-center gap-2 text-sm text-muted-foreground">
                    <MapPin className="h-4 w-4 flex-shrink-0" />
                    <span className="truncate">
                      {location.addressLine}
                      {location.addressLevel1 && `, ${location.addressLevel1}`}
                    </span>
                  </DialogDescription>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 rounded-full flex-shrink-0 -mr-2"
                  onClick={() => setShowLocationModal(false)}
                >
                  <X className="h-4 w-4" />
                  <span className="sr-only">Close</span>
                </Button>
              </div>
            </DialogHeader>

            {/* Scrollable Content */}
            <div className="flex-1 overflow-y-auto px-6 py-4 space-y-5">
              {/* Image Carousel */}
              {location.imageUrl && location.imageUrl.length > 0 && (
                <div className="relative w-full">
                  <div className="relative aspect-video rounded-lg overflow-hidden bg-muted group">
                    <Image
                      src={location.imageUrl[currentImageIndex]}
                      alt={`${location.name} - Image ${currentImageIndex + 1}`}
                      fill
                      className="object-cover transition-opacity duration-300"
                      priority={currentImageIndex === 0}
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />

                    {/* Navigation Buttons */}
                    {location.imageUrl.length > 1 && (
                      <>
                        <Button
                          variant="outline"
                          size="icon"
                          className="absolute left-2 top-1/2 -translate-y-1/2 h-10 w-10 rounded-full bg-background/80 backdrop-blur-sm border-2 shadow-lg hover:bg-background z-10"
                          onClick={(e) => {
                            e.stopPropagation();
                            setCurrentImageIndex((prev) =>
                              prev === 0 ? location.imageUrl.length - 1 : prev - 1
                            );
                          }}
                        >
                          <ChevronLeft className="h-5 w-5" />
                        </Button>
                        <Button
                          variant="outline"
                          size="icon"
                          className="absolute right-2 top-1/2 -translate-y-1/2 h-10 w-10 rounded-full bg-background/80 backdrop-blur-sm border-2 shadow-lg hover:bg-background z-10"
                          onClick={(e) => {
                            e.stopPropagation();
                            setCurrentImageIndex((prev) =>
                              prev === location.imageUrl.length - 1 ? 0 : prev + 1
                            );
                          }}
                        >
                          <ChevronRight className="h-5 w-5" />
                        </Button>
                      </>
                    )}

                    {/* Image Counter */}
                    {location.imageUrl.length > 1 && (
                      <div className="absolute bottom-3 left-1/2 -translate-x-1/2 bg-background/80 backdrop-blur-sm px-3 py-1.5 rounded-full border shadow-lg">
                        <span className="text-xs font-medium text-foreground">
                          {currentImageIndex + 1} / {location.imageUrl.length}
                        </span>
                      </div>
                    )}

                    {/* Dots Indicator */}
                    {location.imageUrl.length > 1 && (
                      <div className="absolute bottom-3 right-3 flex gap-1.5">
                        {location.imageUrl.map((_, index) => (
                          <button
                            key={index}
                            onClick={(e) => {
                              e.stopPropagation();
                              setCurrentImageIndex(index);
                            }}
                            className={`h-2 rounded-full transition-all ${index === currentImageIndex
                              ? 'w-6 bg-primary'
                              : 'w-2 bg-background/60 hover:bg-background/80'
                              }`}
                            aria-label={`Go to image ${index + 1}`}
                          />
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Thumbnail Strip */}
                  {location.imageUrl.length > 1 && (
                    <div className="flex gap-2 mt-3 overflow-x-auto pb-2 scrollbar-hide">
                      {location.imageUrl.map((url, index) => (
                        <button
                          key={index}
                          onClick={() => setCurrentImageIndex(index)}
                          className={`relative flex-shrink-0 w-20 h-14 rounded-md overflow-hidden border-2 transition-all ${index === currentImageIndex
                            ? 'border-primary ring-2 ring-primary/20'
                            : 'border-border hover:border-primary/50'
                            }`}
                        >
                          <Image
                            src={url}
                            alt={`Thumbnail ${index + 1}`}
                            fill
                            className="object-cover"
                          />
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* Description */}
              {location.description && (
                <div className="bg-muted/30 rounded-lg p-4 border border-border/50">
                  <p
                    className={cn(
                      "text-sm text-foreground leading-relaxed",
                      !isDescriptionExpanded && "line-clamp-2"
                    )}
                  >
                    {location.description}
                  </p>
                  {/* Only show button if description is long enough (e.g., > 150 chars) */}
                  {location.description.length > 150 && (
                    <button
                      type="button"
                      onClick={() => setIsDescriptionExpanded(!isDescriptionExpanded)}
                      className="cursor-pointer text-xs text-primary font-medium mt-1.5 hover:underline focus:outline-none flex items-center gap-1"
                    >
                      {isDescriptionExpanded ? (
                        <>
                          Show less <ChevronUp className="h-3 w-3" />
                        </>
                      ) : (
                        <>
                          Read more <ChevronDown className="h-3 w-3" />
                        </>
                      )}
                    </button>
                  )}
                </div>
              )}

              {/* Analytics */}
              <div className="flex items-center gap-4 flex-wrap p-4 bg-gradient-to-r from-primary/5 to-transparent rounded-lg border border-primary/10">
                {(locationDetails as any)?.averageRating !== undefined ? (
                  (locationDetails as any).averageRating > 0 ? (
                    <div className="flex items-center gap-2">
                      <div className="h-8 w-8 rounded-full bg-yellow-100 dark:bg-yellow-900/30 flex items-center justify-center">
                        <Star className="h-4 w-4 fill-yellow-500 text-yellow-500" />
                      </div>
                      <div>
                        <span className="font-bold text-foreground text-base">
                          {typeof (locationDetails as any).averageRating === 'string'
                            ? parseFloat((locationDetails as any).averageRating).toFixed(1)
                            : (locationDetails as any).averageRating.toFixed(1)}
                        </span>
                        <span className="text-xs text-muted-foreground ml-1">rating</span>
                      </div>
                    </div>
                  ) : (
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <Star className="h-4 w-4" />
                      <span className="text-sm">No rating yet</span>
                    </div>
                  )
                ) : (
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <Star className="h-4 w-4" />
                    <span className="text-sm">No rating yet</span>
                  </div>
                )}
                <div className="h-6 w-px bg-border" />
                <div className="flex items-center gap-2">
                  <div className="h-8 w-8 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
                    <CheckCircle2 className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                  </div>
                  <div>
                    <span className="font-semibold text-foreground">
                      {(locationDetails as any)?.totalCheckIns
                        ? (typeof (locationDetails as any).totalCheckIns === 'string'
                          ? parseInt((locationDetails as any).totalCheckIns)
                          : (locationDetails as any).totalCheckIns)
                        : 0}
                    </span>
                    <span className="text-xs text-muted-foreground ml-1">check-ins</span>
                  </div>
                </div>
                <div className="h-6 w-px bg-border" />
                <div className="flex items-center gap-2">
                  <div className="h-8 w-8 rounded-full bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center">
                    <Star className="h-4 w-4 text-purple-600 dark:text-purple-400" />
                  </div>
                  <div>
                    <span className="font-semibold text-foreground">
                      {(locationDetails as any)?.totalReviews || 0}
                    </span>
                    <span className="text-xs text-muted-foreground ml-1">reviews</span>
                  </div>
                </div>
              </div>

              {/* Booking Price */}
              {location.bookingConfig?.baseBookingPrice && (
                <div className="flex items-center gap-2 p-4 bg-gradient-to-r from-primary/5 to-transparent rounded-lg border border-primary/10">
                  <div className="h-8 w-8 rounded-full bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center">
                    <DollarSign className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
                  </div>
                  <div>
                    <span className="font-semibold text-foreground">
                      {parseFloat(location.bookingConfig.baseBookingPrice).toLocaleString("vi-VN")} {location.bookingConfig.currency || "VND"}
                    </span>
                    <span className="text-xs text-muted-foreground ml-1">/hour</span>
                  </div>
                </div>
              )}

              {/* Refund Policy */}
              {location.bookingConfig && (
                <Collapsible open={isRefundPolicyOpen} onOpenChange={setIsRefundPolicyOpen}>
                  <CollapsibleTrigger asChild>
                    <div className="border-2 border-primary/10 rounded-lg p-4 bg-card cursor-pointer hover:bg-muted/50 transition-colors">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <div className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center">
                            <RotateCcw className="h-4 w-4 text-primary" />
                          </div>
                          <h4 className="text-sm font-semibold text-foreground">Refund Policy</h4>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <button
                                type="button"
                                className="text-muted-foreground hover:text-foreground transition-colors"
                                onClick={(e) => e.stopPropagation()}
                              >
                                <HelpCircle className="h-4 w-4" />
                                <span className="sr-only">What is refund policy?</span>
                              </button>
                            </TooltipTrigger>
                            <TooltipContent className="max-w-xs">
                              <p className="text-xs">
                                The cutoff time is calculated from the location booking start date (when you receive access to the location).
                                Refund percentage depends on when you cancel relative to this cutoff time.
                              </p>
                            </TooltipContent>
                          </Tooltip>
                        </div>
                        {isRefundPolicyOpen ? (
                          <ChevronUp className="h-4 w-4 text-muted-foreground" />
                        ) : (
                          <ChevronDown className="h-4 w-4 text-muted-foreground" />
                        )}
                      </div>
                    </div>
                  </CollapsibleTrigger>
                  <CollapsibleContent>
                    <div className="border-2 border-primary/10 border-t-0 rounded-b-lg p-4 bg-card space-y-3">
                      {location.bookingConfig.refundEnabled ? (
                        <div className="space-y-3">
                          {location.bookingConfig.refundCutoffHours !== undefined && (
                            <div className="space-y-2">
                              <div className="flex justify-between items-center p-3 bg-muted/50 rounded-lg border border-border/50">
                                <div className="flex flex-col">
                                  <span className="text-sm font-medium text-foreground">
                                    Cancel {location.bookingConfig.refundCutoffHours}h+ before booking start
                                  </span>
                                  <span className="text-xs text-muted-foreground mt-0.5">
                                    Before cutoff time
                                  </span>
                                </div>
                                <Badge variant="outline" className="font-bold text-primary border-primary/30 bg-primary/5">
                                  {location.bookingConfig.refundPercentageBeforeCutoff !== undefined
                                    ? `${(location.bookingConfig.refundPercentageBeforeCutoff * 100).toFixed(0)}%`
                                    : "100%"} refund
                                </Badge>
                              </div>
                              <div className="flex justify-between items-center p-3 bg-muted/50 rounded-lg border border-border/50">
                                <div className="flex flex-col">
                                  <span className="text-sm font-medium text-foreground">
                                    Cancel less than {location.bookingConfig.refundCutoffHours}h before booking start
                                  </span>
                                  <span className="text-xs text-muted-foreground mt-0.5">
                                    After cutoff time
                                  </span>
                                </div>
                                <Badge variant="outline" className="font-bold text-primary border-primary/30 bg-primary/5">
                                  {location.bookingConfig.refundPercentageAfterCutoff !== undefined
                                    ? `${(location.bookingConfig.refundPercentageAfterCutoff * 100).toFixed(0)}%`
                                    : "0%"} refund
                                </Badge>
                              </div>
                              <div className="flex justify-between items-center p-3 bg-red-50 dark:bg-red-950/20 rounded-lg border border-red-200 dark:border-red-800">
                                <div className="flex flex-col">
                                  <span className="text-sm font-medium text-foreground">
                                    Cancel after booking has started
                                  </span>
                                  <span className="text-xs text-muted-foreground mt-0.5">
                                    Once you receive access to the location
                                  </span>
                                </div>
                                <Badge variant="outline" className="font-bold text-red-600 dark:text-red-400 border-red-300 dark:border-red-700 bg-red-100 dark:bg-red-900/30">
                                  No refund
                                </Badge>
                              </div>
                            </div>
                          )}
                        </div>
                      ) : (
                        <div className="p-3 bg-muted/50 rounded-lg border border-border/50">
                          <p className="text-sm text-muted-foreground">
                            Refunds are not available for this venue
                          </p>
                        </div>
                      )}
                    </div>
                  </CollapsibleContent>
                </Collapsible>
              )}
            </div>

            {/* Fixed Footer Button */}
            <div className="sticky bottom-0 z-10 bg-background border-t px-6 py-4 shadow-lg">
              {!hasBookedSlots ? (
                <Button
                  onClick={() => {
                    setShowLocationModal(false);
                    handleBookNow();
                  }}
                  className="w-full h-12 text-base font-semibold shadow-md"
                  size="lg"
                >
                  <Calendar className="mr-2 h-5 w-5" />
                  Book Time Slots
                </Button>
              ) : (
                <div className="p-4 bg-green-50 dark:bg-green-950/30 border-2 border-green-200 dark:border-green-800 rounded-lg">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="h-10 w-10 rounded-full bg-green-100 dark:bg-green-900/40 flex items-center justify-center">
                        <CheckCircle2 className="h-5 w-5 text-green-600 dark:text-green-400" />
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-green-900 dark:text-green-200">
                          {dateRanges.length} time slot{dateRanges.length !== 1 ? "s" : ""} booked
                        </p>
                        <p className="text-xs text-green-700 dark:text-green-300">Click to edit your selection</p>
                      </div>
                    </div>
                    <Button
                      variant="outline"
                      size="lg"
                      onClick={() => {
                        setShowLocationModal(false);
                        // Initialize tempSlots with existing dateRanges when opening calendar
                        setTempSlots(dateRanges || []);
                        setIsInitializingCalendar(true);
                        setShowCalendar(true);
                        // Reset initialization flag after a short delay to allow calendar to initialize
                        setTimeout(() => {
                          setIsInitializingCalendar(false);
                        }, 500);
                      }}
                      className="h-10 border-green-300 dark:border-green-700 text-green-700 dark:text-green-300 hover:bg-green-100 dark:hover:bg-green-900/40"
                    >
                      <Calendar className="h-4 w-4 mr-2" />
                      Edit Slots
                    </Button>
                  </div>
                </div>
              )}
            </div>
          </DialogContent>
        </Dialog>
      )}

      {/* Availability Calendar Modal */}
      <Dialog open={showCalendar} onOpenChange={(open) => {
        setShowCalendar(open);
        setIsInitializingCalendar(false);
        // Only clear slots if they haven't been saved yet
        // If slots are already saved (dateRanges has values), just close without clearing
        if (!open) {
          const savedSlots = form.watch("dateRanges") || [];
          // Only clear if no slots are saved
          if (savedSlots.length === 0) {
            setTempSlots([]);
          } else {
            // If slots are saved, just clear tempSlots but keep saved slots
            setTempSlots([]);
          }
        }
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
                <AlertDescription className="text-amber-800 dark:text-amber-200 text-sm !grid-cols-1 !gap-0 !block">
                  Your event is from{" "}
                  <span className="font-semibold">
                    {format(startDate, "MMM dd, yyyy 'at' h:mm a")}
                  </span>{" "}
                  to{" "}
                  <span className="font-semibold">
                    {format(endDate, "MMM dd, yyyy 'at' h:mm a")}
                  </span>
                  . Please select time slots that cover this entire period.
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
              <div className="flex items-center gap-4 text-[10px] mb-0.5">
                <div className="flex items-center gap-1.5">
                  <div className="w-2.5 h-2.5 rounded border border-green-600 bg-green-500 shadow-sm"></div>
                  <span className="font-medium text-foreground">Selected</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <div className="w-2.5 h-2.5 rounded border border-gray-300 bg-white shadow-sm"></div>
                  <span className="font-medium text-foreground">Available</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <div className="w-2.5 h-2.5 rounded border border-red-600 bg-red-500 shadow-sm"></div>
                  <span className="font-medium text-foreground">Booked</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <div className="w-2.5 h-2.5 rounded border border-gray-300 bg-gray-200"></div>
                  <span className="font-medium text-muted-foreground">Unavailable</span>
                </div>
              </div>
              {startDate && endDate ? (
                <p className="text-[10px] text-amber-600 dark:text-amber-400 font-medium">
                  ⚠ Selected slots must cover event period: {startDate?.toLocaleDateString('vi-VN') || ''} {startDate?.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) || ''} - {endDate?.toLocaleDateString('vi-VN') || ''} {endDate?.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) || ''}
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
                  // Only clear slots if they haven't been saved yet
                  // If slots are already saved (dateRanges has values), just close without clearing
                  const savedSlots = form.watch("dateRanges") || [];
                  if (savedSlots.length === 0) {
                    // No saved slots, clear everything
                    setTempSlots([]);
                    form.setValue("dateRanges" as any, [], { shouldValidate: false });
                  } else {
                    // Slots are saved, just clear tempSlots but keep saved slots
                    setTempSlots([]);
                  }
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
              {estimatedCost && (pendingSlots.length > 0 || (dateRanges && dateRanges.length > 0)) && (
                <>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">
                      {Math.round(estimatedCost.totalHours)}h
                    </span>
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
              <Collapsible open={isRefundPolicyOpenInDialog} onOpenChange={setIsRefundPolicyOpenInDialog}>
                <CollapsibleTrigger asChild>
                  <div className="bg-muted p-2.5 rounded-lg cursor-pointer hover:bg-muted/80 transition-colors">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-1.5">
                        <RotateCcw className="h-3.5 w-3.5 text-muted-foreground" />
                        <span className="text-xs font-medium">Refund Policy</span>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <button
                              type="button"
                              className="text-muted-foreground hover:text-foreground transition-colors"
                              onClick={(e) => e.stopPropagation()}
                            >
                              <HelpCircle className="h-3.5 w-3.5" />
                              <span className="sr-only">What is refund policy?</span>
                            </button>
                          </TooltipTrigger>
                          <TooltipContent className="max-w-xs">
                            <p className="text-xs">
                              The cutoff time is calculated from the location booking start date (when you receive access to the location).
                              Refund percentage depends on when you cancel relative to this cutoff time.
                            </p>
                          </TooltipContent>
                        </Tooltip>
                      </div>
                      {isRefundPolicyOpenInDialog ? (
                        <ChevronUp className="h-3.5 w-3.5 text-muted-foreground" />
                      ) : (
                        <ChevronDown className="h-3.5 w-3.5 text-muted-foreground" />
                      )}
                    </div>
                  </div>
                </CollapsibleTrigger>
                <CollapsibleContent>
                  <div className="bg-muted p-2.5 pt-0 rounded-b-lg space-y-2 text-xs">
                    {refundInfo.cutoffTime && (
                      <div className="text-muted-foreground mb-2 p-2 bg-background/50 rounded border border-border/50">
                        <span className="font-medium">Cutoff time: </span>
                        {format(refundInfo.cutoffTime, "MMM dd, h:mm a")} ({refundInfo.cutoffHours}h before booking start)
                      </div>
                    )}
                    <div className="flex justify-between items-center p-2 bg-background/50 rounded border border-border/50">
                      <div className="flex flex-col">
                        <span className="text-muted-foreground font-medium">Cancel {refundInfo.cutoffHours}h+ before booking start</span>
                        <span className="text-[10px] text-muted-foreground mt-0.5">Before cutoff time</span>
                      </div>
                      <span className="font-semibold text-green-600 dark:text-green-400">
                        {Math.round(refundInfo.percentageBeforeCutoff * 100)}% ({refundInfo.refundBeforeCutoff.toLocaleString("vi-VN")} {refundInfo.currency})
                      </span>
                    </div>
                    <div className="flex justify-between items-center p-2 bg-background/50 rounded border border-border/50">
                      <div className="flex flex-col">
                        <span className="text-muted-foreground font-medium">Cancel less than {refundInfo.cutoffHours}h before booking start</span>
                        <span className="text-[10px] text-muted-foreground mt-0.5">After cutoff time</span>
                      </div>
                      <span className="font-semibold text-amber-600 dark:text-amber-400">
                        {Math.round(refundInfo.percentageAfterCutoff * 100)}% ({refundInfo.refundAfterCutoff.toLocaleString("vi-VN")} {refundInfo.currency})
                      </span>
                    </div>
                    <div className="flex justify-between items-center p-2 bg-red-50 dark:bg-red-950/20 rounded border border-red-200 dark:border-red-800">
                      <div className="flex flex-col">
                        <span className="text-muted-foreground font-medium">Cancel after booking has started</span>
                        <span className="text-[10px] text-muted-foreground mt-0.5">Once you receive access to the location</span>
                      </div>
                      <span className="font-semibold text-red-600 dark:text-red-400">
                        No refund
                      </span>
                    </div>
                  </div>
                </CollapsibleContent>
              </Collapsible>
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

          </div>

          <div className="flex justify-between items-center pt-4 border-t">
            <Button
              variant="ghost"
              onClick={() => {
                setShowConfirmDialog(false);
                // Reopen calendar to edit slots
                setTimeout(() => {
                  setShowCalendar(true);
                  setIsInitializingCalendar(true);
                }, 200);
              }}
              className="flex items-center gap-2"
            >
              <ArrowLeft className="h-4 w-4" />
              Edit Slots
            </Button>
            <div className="flex gap-2">
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
                    const insufficientAmount = estimatedCost && walletBalance < estimatedCost.totalCost
                      ? estimatedCost.totalCost - walletBalance
                      : 0;
                    
                    // Save form state to localStorage
                    const formValues = form.getValues();
                    const serializedFormState = {
                      ...formValues,
                      startDate: formValues.startDate ? formValues.startDate.toISOString() : undefined,
                      endDate: formValues.endDate ? formValues.endDate.toISOString() : undefined,
                      dateRanges: formValues.dateRanges?.map(range => ({
                        startDateTime: range.startDateTime.toISOString(),
                        endDateTime: range.endDateTime.toISOString(),
                      })),
                    };
                    localStorage.setItem('createEventFormState', JSON.stringify(serializedFormState));
                    
                    router.push(`/dashboard/business/wallet/deposit?amount=${Math.ceil(insufficientAmount)}&fromEvent=true`);
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
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
