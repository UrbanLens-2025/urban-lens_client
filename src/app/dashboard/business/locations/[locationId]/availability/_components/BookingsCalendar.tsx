"use client";

import { useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon, Clock } from "lucide-react";
import { format, addDays, addWeeks, startOfDay, startOfWeek, isToday } from "date-fns";
import { cn } from "@/lib/utils";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { useAllBookingsAtLocation } from "@/hooks/locations/useAllBookingsAtLocation";
import { Loader2 } from "lucide-react";

interface BookingsCalendarProps {
  locationId: string;
}

const DAYS_OF_WEEK = [
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
  "Sunday",
];

const HOURS = Array.from({ length: 24 }, (_, i) => i); // 0-23 (12 AM to 11 PM)

const formatBookingObject = (bookingObject: string | null | undefined): string => {
  if (!bookingObject) return "N/A";
  
  // Convert FOR_EVENT, FOR_OTHER, etc. to user-friendly format
  const formatted = bookingObject
    .split("_")
    .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(" ");
  
  return formatted;
};

export function BookingsCalendar({ locationId }: BookingsCalendarProps) {
  const router = useRouter();
  
  // Track which cell's popover is open
  const [openPopover, setOpenPopover] = useState<string | null>(null);
  
  // Week navigation state
  const [currentWeekStart, setCurrentWeekStart] = useState(() => {
    const today = startOfDay(new Date());
    return startOfWeek(today, { weekStartsOn: 1 }); // Monday as first day
  });

  // Generate dates (7 days starting from current week's Monday)
  const dates = useMemo(() => {
    return Array.from({ length: 7 }, (_, i) => addDays(currentWeekStart, i));
  }, [currentWeekStart]);

  // Calculate date range for fetching bookings
  const weekStartDate = useMemo(() => dates[0], [dates]);
  const weekEndDate = useMemo(() => {
    const end = dates[6];
    const endOfDay = new Date(end);
    endOfDay.setHours(23, 59, 59, 999);
    return endOfDay;
  }, [dates]);

  // Fetch all bookings for this location using the new API
  const { data: bookingsData, isLoading } = useAllBookingsAtLocation({
    locationId,
    startDate: weekStartDate.toISOString(),
    endDate: weekEndDate.toISOString(),
    page: 1,
    limit: 100, // Max limit to get all bookings
  });

  // Get bookings from the API response
  const weekBookings = useMemo(() => {
    return bookingsData?.data || [];
  }, [bookingsData]);

  // Create a map of bookings by date and hour for quick lookup
  const bookingsMap = useMemo(() => {
    const map = new Map<string, Array<{
      id: string;
      start: Date;
      end: Date;
      eventName: string;
      customerName: string;
      status: string;
      amount: string;
      booking: any;
    }>>();
    
    if (!weekBookings) return map;

    weekBookings.forEach((booking) => {
      if (!booking.dates) return;
      
      booking.dates.forEach((dateSlot) => {
        const start = new Date(dateSlot.startDateTime);
        const end = new Date(dateSlot.endDateTime);
        
        // Only include if it's in the current week
        if (start > weekEndDate || end < weekStartDate) return;
        
        // Generate all hour slots within the booking range
        let current = new Date(Math.max(start, weekStartDate));
        const bookingEnd = new Date(Math.min(end, weekEndDate));
        
        while (current < bookingEnd) {
          const dateKey = format(startOfDay(current), "yyyy-MM-dd");
          const hour = current.getHours();
          const key = `${dateKey}_${hour}`;
          
          if (!map.has(key)) {
            map.set(key, []);
          }
          
          // Get customer name from creatorProfile or fallback to email
          const customerName = 
            (booking.createdBy as any)?.creatorProfile?.displayName ||
            booking.createdBy?.displayName ||
            booking.createdBy?.email ||
            "Unknown";
          
          // Store the full booking information for this hour
          map.get(key)!.push({
            id: booking.id,
            start,
            end,
            eventName: booking.referencedEventRequest?.eventName || formatBookingObject(booking.bookingObject) || "Unknown Event",
            customerName,
            status: booking.status,
            amount: booking.amountToPay,
            booking,
          });
          
          // Move to next hour
          current.setHours(current.getHours() + 1, 0, 0, 0);
        }
      });
    });
    
    return map;
  }, [weekBookings, weekStartDate, weekEndDate]);
  
  // Handle booking cell click
  const handleBookingClick = (bookingId: string) => {
    router.push(`/dashboard/business/location-bookings/${bookingId}`);
  };
  
  // Format currency
  const formatCurrency = (amount: string) => {
    const num = parseFloat(amount);
    return new Intl.NumberFormat("vi-VN", {
      style: "currency",
      currency: "VND",
    }).format(num);
  };
  
  // Get status badge color and background
  const getStatusColor = (status: string) => {
    switch (status.toUpperCase()) {
      case "PAYMENT_RECEIVED":
      case "APPROVED":
        return { text: "text-green-700", bg: "bg-green-500", border: "border-green-600", hover: "hover:bg-green-600" };
      case "AWAITING_BUSINESS_PROCESSING":
        return { text: "text-yellow-700", bg: "bg-yellow-500", border: "border-yellow-600", hover: "hover:bg-yellow-600" };
      case "SOFT_LOCKED":
        return { text: "text-blue-700", bg: "bg-blue-500", border: "border-blue-600", hover: "hover:bg-blue-600" };
      case "REJECTED":
      case "CANCELLED":
        return { text: "text-red-700", bg: "bg-red-500", border: "border-red-600", hover: "hover:bg-red-600" };
      default:
        return { text: "text-gray-700", bg: "bg-gray-500", border: "border-gray-600", hover: "hover:bg-gray-600" };
    }
  };
  
  // Get today's date for highlighting
  const today = useMemo(() => startOfDay(new Date()), []);

  // Navigation functions
  const goToPreviousWeek = () => {
    setCurrentWeekStart((prev) => addWeeks(prev, -1));
  };

  const goToNextWeek = () => {
    setCurrentWeekStart((prev) => addWeeks(prev, 1));
  };

  const goToToday = () => {
    const today = startOfDay(new Date());
    setCurrentWeekStart(startOfWeek(today, { weekStartsOn: 1 }));
  };

  // Format hour range for display
  const formatHourRange = (hour: number): string => {
    const formatSingleHour = (h: number): string => {
      return `${String(h).padStart(2, '0')}:00`;
    };

    const nextHour = (hour + 1) % 24;
    return `${formatSingleHour(hour)} - ${formatSingleHour(nextHour)}`;
  };

  // Format week range
  const weekRange = useMemo(() => {
    return `${format(dates[0], "MMM d")} - ${format(dates[6], "MMM d, yyyy")}`;
  }, [dates]);

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CalendarIcon className="h-5 w-5" />
            Bookings Calendar
          </CardTitle>
          <CardDescription>
            View all bookings for this location
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex h-96 items-center justify-center">
            <Loader2 className="h-8 w-8 animate-spin" />
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex-1">
            <CardTitle className="flex items-center gap-2">
              <CalendarIcon className="h-5 w-5" />
              Bookings Calendar
            </CardTitle>
            <CardDescription>
              View and manage all bookings for this location. Click on booked slots to view details.
            </CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Week Navigation */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Button
              variant="outline"
              size="icon"
              onClick={goToPreviousWeek}
              className="h-9 w-9"
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              onClick={goToToday}
              className="min-w-[100px] h-9"
            >
              Today
            </Button>
            <Button
              variant="outline"
              size="icon"
              onClick={goToNextWeek}
              className="h-9 w-9"
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
            <div className="ml-2 flex items-center gap-2 px-3 py-1.5 rounded-md bg-muted/50">
              <Clock className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm font-semibold text-foreground">
                {weekRange}
              </span>
            </div>
          </div>
        </div>

        {/* Legend */}
        <div className="flex flex-wrap items-center gap-4 rounded-lg border border-border/60 bg-muted/30 px-4 py-3">
          <div className="flex items-center gap-2 text-xs font-medium">
            <span className="text-muted-foreground">Status:</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="inline-block h-3.5 w-3.5 rounded bg-green-500 border border-green-600" />
            <span className="text-xs font-medium text-foreground">Approved/Payment Received</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="inline-block h-3.5 w-3.5 rounded bg-yellow-500 border border-yellow-600" />
            <span className="text-xs font-medium text-foreground">Awaiting Processing</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="inline-block h-3.5 w-3.5 rounded bg-blue-500 border border-blue-600" />
            <span className="text-xs font-medium text-foreground">Soft Locked</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="inline-block h-3.5 w-3.5 rounded bg-red-500 border border-red-600" />
            <span className="text-xs font-medium text-foreground">Rejected/Cancelled</span>
          </div>
          <div className="flex items-center gap-2 ml-auto">
            <span className="inline-block h-3.5 w-3.5 rounded bg-background border-2 border-border" />
            <span className="text-xs font-medium text-muted-foreground">Available</span>
          </div>
        </div>

        {/* Weekly Grid */}
        <div className="overflow-x-auto rounded-lg border border-border/60 bg-background">
          <div className="inline-block min-w-full">
            <div className="p-4">
              {/* Header Row - Days of Week */}
              <div className="mb-3 grid grid-cols-[100px_repeat(7,1fr)] gap-2 border-b-2 border-border pb-3">
                <div className="flex items-center justify-center">
                  <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Time</span>
                </div>
                {DAYS_OF_WEEK.map((day, index) => {
                  const date = dates[index];
                  const isDateToday = isToday(date);
                  return (
                    <div
                      key={index}
                      className={cn(
                        "py-2 text-center rounded-md transition-colors",
                        isDateToday && "bg-primary/10 border-2 border-primary"
                      )}
                    >
                      <div className={cn(
                        "text-xs font-semibold uppercase tracking-wide mb-1",
                        isDateToday ? "text-primary" : "text-muted-foreground"
                      )}>
                        {day.slice(0, 3)}
                      </div>
                      <div className={cn(
                        "text-xs font-medium",
                        isDateToday ? "text-primary font-bold" : "text-foreground"
                      )}>
                        {format(date, "MMM d")}
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Time Slot Rows */}
              <div className="space-y-1">
                {HOURS.map((hour) => {
                  const isNightTime = hour >= 22 || hour <= 5;
                  const isBusinessHours = hour >= 9 && hour <= 17;
                  return (
                    <div
                      key={hour}
                      className={cn(
                        "grid grid-cols-[100px_repeat(7,1fr)] gap-2 rounded-md px-1 py-1 transition-colors",
                        isNightTime && "bg-muted/30",
                        isBusinessHours && !isNightTime && "bg-muted/10"
                      )}
                    >
                      {/* Time Label */}
                      <div className="flex items-center justify-center pr-2">
                        <span className={cn(
                          "text-xs font-semibold",
                          isBusinessHours ? "text-foreground" : "text-muted-foreground"
                        )}>
                          {formatHourRange(hour)}
                        </span>
                      </div>

                      {/* Day Cells */}
                      {DAYS_OF_WEEK.map((_, dayIndex) => {
                        const date = dates[dayIndex];
                        const dateKey = format(startOfDay(date), "yyyy-MM-dd");
                        const key = `${dateKey}_${hour}`;
                        const bookings = bookingsMap.get(key) || [];
                        const hasBooking = bookings.length > 0;
                        // Get the first booking for display (if multiple, show the first one)
                        const primaryBooking = bookings[0];
                        const isDateToday = isToday(date);
                        const statusColors = primaryBooking ? getStatusColor(primaryBooking.status) : null;

                        const cellKey = `${dayIndex}_${hour}`;
                        const isPopoverOpen = openPopover === cellKey;
                        
                        return (
                          <div
                            key={cellKey}
                            className="h-[28px]"
                          >
                            {hasBooking && primaryBooking ? (
                              bookings.length > 1 ? (
                                // Multiple bookings - use Popover
                                <Popover open={isPopoverOpen} onOpenChange={(open) => setOpenPopover(open ? cellKey : null)}>
                                  <PopoverTrigger asChild>
                                    <div
                                      className={cn(
                                        "w-full h-full rounded-md border-2 transition-all flex items-center justify-center text-[10px] font-semibold relative cursor-pointer shadow-sm",
                                        statusColors?.bg,
                                        statusColors?.border,
                                        statusColors?.hover,
                                        "text-white",
                                        "hover:shadow-md hover:scale-[1.02]",
                                        isPopoverOpen && "ring-2 ring-offset-2 ring-primary"
                                      )}
                                    >
                                      <div className="flex flex-col items-center gap-0.5">
                                        <span className="text-[8px] font-bold leading-none">{bookings.length}</span>
                                        <span className="text-[6px] leading-none opacity-80">bookings</span>
                                      </div>
                                    </div>
                                  </PopoverTrigger>
                                  <PopoverContent 
                                    side="top" 
                                    className="w-80 p-0"
                                    align="start"
                                  >
                                    <div className="p-3 border-b bg-muted/50">
                                      <div className="font-semibold text-sm">
                                        {bookings.length} Booking{bookings.length > 1 ? "s" : ""} at this time
                                      </div>
                                      <div className="text-xs text-muted-foreground mt-1">
                                        {format(date, "MMM dd, yyyy")} at {formatHourRange(hour)}
                                      </div>
                                    </div>
                                    <div className="max-h-64 overflow-y-auto">
                                      {bookings.map((booking, idx) => {
                                        const bookingStatusColors = getStatusColor(booking.status);
                                        return (
                                          <div
                                            key={booking.id}
                                            onClick={() => {
                                              handleBookingClick(booking.id);
                                              setOpenPopover(null);
                                            }}
                                            className={cn(
                                              "p-3 border-b last:border-b-0 cursor-pointer transition-colors hover:bg-muted/50",
                                              idx === 0 && "bg-primary/5"
                                            )}
                                          >
                                            <div className="flex items-start justify-between gap-2">
                                              <div className="flex-1 min-w-0">
                                                <div className="font-semibold text-sm truncate mb-1">
                                                  {booking.eventName}
                                                </div>
                                                <div className="space-y-1 text-xs text-muted-foreground">
                                                  <div className="flex items-center gap-1">
                                                    <Clock className="h-3 w-3" />
                                                    <span>
                                                      {format(booking.start, "HH:mm")} - {format(booking.end, "HH:mm")}
                                                    </span>
                                                  </div>
                                                  <div className="truncate">
                                                    Customer: {booking.customerName}
                                                  </div>
                                                  <div>
                                                    Amount: {formatCurrency(booking.amount)}
                                                  </div>
                                                </div>
                                              </div>
                                              <div className="flex flex-col items-end gap-1 flex-shrink-0">
                                                <Badge 
                                                  variant="outline" 
                                                  className={cn("text-[10px] px-1.5 py-0", bookingStatusColors.text, bookingStatusColors.bg, bookingStatusColors.border)}
                                                >
                                                  {booking.status.replace(/_/g, " ")}
                                                </Badge>
                                              </div>
                                            </div>
                                          </div>
                                        );
                                      })}
                                    </div>
                                    <div className="p-2 border-t bg-muted/30">
                                      <div className="text-[10px] text-muted-foreground text-center">
                                        Click any booking to view details
                                      </div>
                                    </div>
                                  </PopoverContent>
                                </Popover>
                              ) : (
                                // Single booking
                                <div
                                  onClick={() => handleBookingClick(primaryBooking.id)}
                                  className={cn(
                                    "w-full h-full rounded-md border-2 transition-all flex items-center justify-center text-[10px] font-semibold relative cursor-pointer shadow-sm",
                                    statusColors?.bg,
                                    statusColors?.border,
                                    statusColors?.hover,
                                    "text-white",
                                    "hover:shadow-md hover:scale-[1.02]"
                                  )}
                                >
                                  <span className="opacity-90">●</span>
                                </div>
                              )
                            ) : (
                              <div
                                className={cn(
                                  "w-full h-full rounded-md border-2 transition-colors",
                                  isDateToday 
                                    ? "bg-primary/5 border-primary/20" 
                                    : "bg-background border-border/50 hover:border-border"
                                )}
                                title="Available"
                              />
                            )}
                          </div>
                        );
                      })}
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>

        {/* Bookings Summary */}
        <div className="rounded-lg border-2 border-border bg-gradient-to-r from-muted/50 to-muted/30 p-4">
          <div className="flex items-center justify-between">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <CalendarIcon className="h-4 w-4 text-primary" />
                <div className="text-sm font-semibold">Bookings This Week</div>
              </div>
              <div className="text-xs text-muted-foreground ml-6">
                {weekBookings && weekBookings.length > 0 ? (
                  <>
                    {weekBookings.length} booking{weekBookings.length !== 1 ? "s" : ""} scheduled
                  </>
                ) : (
                  "No bookings scheduled for this week"
                )}
              </div>
            </div>
            {weekBookings && weekBookings.length > 0 && (
              <Badge variant="secondary" className="text-sm font-semibold px-3 py-1">
                {weekBookings.length}
              </Badge>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

