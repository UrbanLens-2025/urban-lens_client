"use client";

import { useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  ChevronLeft, 
  ChevronRight, 
  Calendar as CalendarIcon, 
  Clock,
  CheckCircle2,
  AlertCircle,
  Lock,
  XCircle,
  Users,
  DollarSign,
  Eye,
  TrendingUp,
  Info
} from "lucide-react";
import { format, addDays, addWeeks, startOfDay, startOfWeek, isToday } from "date-fns";
import { cn } from "@/lib/utils";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { useAllBookingsAtLocation } from "@/hooks/locations/useAllBookingsAtLocation";
import { Loader2 } from "lucide-react";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";

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
        let current = new Date(Math.max(start.getTime(), weekStartDate.getTime()));
        const bookingEnd = new Date(Math.min(end.getTime(), weekEndDate.getTime()));
        
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
            (booking.createdBy as any)?.displayName ||
            `${(booking.createdBy as any)?.firstName || ''} ${(booking.createdBy as any)?.lastName || ''}`.trim() ||
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

  // Calculate statistics
  const stats = useMemo(() => {
    if (!weekBookings || weekBookings.length === 0) {
      return {
        total: 0,
        approved: 0,
        pending: 0,
        locked: 0,
        cancelled: 0,
        totalRevenue: 0,
      };
    }

    let totalRevenue = 0;
    const statusCounts = {
      approved: 0,
      pending: 0,
      locked: 0,
      cancelled: 0,
    };

    weekBookings.forEach((booking) => {
      const status = booking.status?.toUpperCase();
      if (status === "APPROVED" || status === "PAYMENT_RECEIVED") {
        statusCounts.approved++;
      } else if (status === "AWAITING_BUSINESS_PROCESSING") {
        statusCounts.pending++;
      } else if (status === "SOFT_LOCKED") {
        statusCounts.locked++;
      } else if (status === "REJECTED" || status === "CANCELLED") {
        statusCounts.cancelled++;
      }

      if (booking.amountToPay) {
        totalRevenue += parseFloat(booking.amountToPay);
      }
    });

    return {
      total: weekBookings.length,
      ...statusCounts,
      totalRevenue,
    };
  }, [weekBookings]);
  
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
      minimumFractionDigits: 0,
    }).format(num);
  };
  
  // Get status badge color and background
  const getStatusColor = (status: string) => {
    switch (status.toUpperCase()) {
      case "PAYMENT_RECEIVED":
      case "APPROVED":
        return { 
          text: "text-green-700 dark:text-green-300", 
          bg: "bg-green-500 dark:bg-green-600", 
          border: "border-green-600 dark:border-green-500", 
          hover: "hover:bg-green-600 dark:hover:bg-green-500",
          icon: CheckCircle2,
          label: "Approved"
        };
      case "AWAITING_BUSINESS_PROCESSING":
        return { 
          text: "text-yellow-700 dark:text-yellow-300", 
          bg: "bg-yellow-500 dark:bg-yellow-600", 
          border: "border-yellow-600 dark:border-yellow-500", 
          hover: "hover:bg-yellow-600 dark:hover:bg-yellow-500",
          icon: AlertCircle,
          label: "Pending"
        };
      case "SOFT_LOCKED":
        return { 
          text: "text-blue-700 dark:text-blue-300", 
          bg: "bg-blue-500 dark:bg-blue-600", 
          border: "border-blue-600 dark:border-blue-500", 
          hover: "hover:bg-blue-600 dark:hover:bg-blue-500",
          icon: Lock,
          label: "Locked"
        };
      case "REJECTED":
      case "CANCELLED":
        return { 
          text: "text-red-700 dark:text-red-300", 
          bg: "bg-red-500 dark:bg-red-600", 
          border: "border-red-600 dark:border-red-500", 
          hover: "hover:bg-red-600 dark:hover:bg-red-500",
          icon: XCircle,
          label: "Cancelled"
        };
      default:
        return { 
          text: "text-gray-700 dark:text-gray-300", 
          bg: "bg-gray-500 dark:bg-gray-600", 
          border: "border-gray-600 dark:border-gray-500", 
          hover: "hover:bg-gray-600 dark:hover:bg-gray-500",
          icon: Info,
          label: "Unknown"
        };
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

  // Format hour for display (12-hour format)
  const formatHour = (hour: number): string => {
    if (hour === 0) return "12 AM";
    if (hour < 12) return `${hour} AM`;
    if (hour === 12) return "12 PM";
    return `${hour - 12} PM`;
  };

  // Format week range
  const weekRange = useMemo(() => {
    return `${format(dates[0], "MMM d")} - ${format(dates[6], "MMM d, yyyy")}`;
  }, [dates]);

  if (isLoading) {
    return (
      <Card className="border-2 border-primary/10 shadow-xl">
        <CardHeader className="bg-gradient-to-r from-primary/5 to-primary/10 border-b border-primary/20">
          <CardTitle className="flex items-center gap-3 text-xl">
            <div className="p-2 rounded-lg bg-primary/10">
              <CalendarIcon className="h-5 w-5 text-primary" />
            </div>
            Bookings Calendar
          </CardTitle>
          <CardDescription>
            View and manage all bookings for this location
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex h-96 items-center justify-center">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-2 border-primary/10 shadow-xl">
      <CardHeader className="bg-gradient-to-r from-primary/5 to-primary/10 border-b border-primary/20">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div className="flex-1">
            <CardTitle className="flex items-center gap-3 text-xl mb-2">
              <div className="p-2 rounded-lg bg-primary/10 shadow-md">
                <CalendarIcon className="h-5 w-5 text-primary" />
              </div>
              Bookings Calendar
            </CardTitle>
            <CardDescription className="text-base">
              View and manage all bookings for this location. Click on booked slots to view details.
            </CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4 pt-4">
        {/* Statistics Cards */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-2">
          <div className="rounded-lg border border-primary/10 bg-gradient-to-br from-primary/5 to-primary/10 p-2.5 shadow-sm">
            <div className="flex items-center justify-between mb-1">
              <span className="text-[10px] font-semibold text-muted-foreground uppercase">Total</span>
              <CalendarIcon className="h-3 w-3 text-primary" />
            </div>
            <p className="text-lg font-bold text-foreground">{stats.total}</p>
          </div>
          <div className="rounded-lg border border-green-200 dark:border-green-800 bg-gradient-to-br from-green-50 to-green-100 dark:from-green-950/30 dark:to-green-900/30 p-2.5 shadow-sm">
            <div className="flex items-center justify-between mb-1">
              <span className="text-[10px] font-semibold text-green-700 dark:text-green-300 uppercase">Approved</span>
              <CheckCircle2 className="h-3 w-3 text-green-600 dark:text-green-400" />
            </div>
            <p className="text-lg font-bold text-green-700 dark:text-green-300">{stats.approved}</p>
          </div>
          <div className="rounded-lg border border-yellow-200 dark:border-yellow-800 bg-gradient-to-br from-yellow-50 to-yellow-100 dark:from-yellow-950/30 dark:to-yellow-900/30 p-2.5 shadow-sm">
            <div className="flex items-center justify-between mb-1">
              <span className="text-[10px] font-semibold text-yellow-700 dark:text-yellow-300 uppercase">Pending</span>
              <AlertCircle className="h-3 w-3 text-yellow-600 dark:text-yellow-400" />
            </div>
            <p className="text-lg font-bold text-yellow-700 dark:text-yellow-300">{stats.pending}</p>
          </div>
          <div className="rounded-lg border border-blue-200 dark:border-blue-800 bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-950/30 dark:to-blue-900/30 p-2.5 shadow-sm">
            <div className="flex items-center justify-between mb-1">
              <span className="text-[10px] font-semibold text-blue-700 dark:text-blue-300 uppercase">Locked</span>
              <Lock className="h-3 w-3 text-blue-600 dark:text-blue-400" />
            </div>
            <p className="text-lg font-bold text-blue-700 dark:text-blue-300">{stats.locked}</p>
          </div>
          <div className="rounded-lg border border-red-200 dark:border-red-800 bg-gradient-to-br from-red-50 to-red-100 dark:from-red-950/30 dark:to-red-900/30 p-2.5 shadow-sm">
            <div className="flex items-center justify-between mb-1">
              <span className="text-[10px] font-semibold text-red-700 dark:text-red-300 uppercase">Cancelled</span>
              <XCircle className="h-3 w-3 text-red-600 dark:text-red-400" />
            </div>
            <p className="text-lg font-bold text-red-700 dark:text-red-300">{stats.cancelled}</p>
          </div>
        </div>

        {/* Week Navigation */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 p-3 rounded-lg border border-primary/10 bg-gradient-to-r from-primary/5 to-primary/10">
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="icon"
              onClick={goToPreviousWeek}
              className="h-8 w-8 border border-primary/20 hover:bg-primary/10"
            >
              <ChevronLeft className="h-3.5 w-3.5" />
            </Button>
            <Button
              variant="outline"
              onClick={goToToday}
              className="min-w-[80px] h-8 border border-primary/20 hover:bg-primary/10 font-semibold text-xs"
            >
              Today
            </Button>
            <Button
              variant="outline"
              size="icon"
              onClick={goToNextWeek}
              className="h-8 w-8 border border-primary/20 hover:bg-primary/10"
            >
              <ChevronRight className="h-3.5 w-3.5" />
            </Button>
            <div className="ml-2 flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-background/80 backdrop-blur-sm border border-primary/20">
              <Clock className="h-3.5 w-3.5 text-primary" />
              <span className="text-xs font-semibold text-foreground">
                {weekRange}
              </span>
            </div>
          </div>
        </div>

        {/* Enhanced Legend */}
        <div className="flex flex-wrap items-center gap-2 rounded-lg border border-primary/10 bg-gradient-to-r from-muted/50 to-muted/30 px-3 py-2">
          <div className="flex items-center gap-1.5 text-[10px] font-semibold text-muted-foreground">
            <Info className="h-3 w-3" />
            <span>Status:</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="h-3 w-3 rounded bg-green-500 border border-green-600" />
            <span className="text-[10px] font-medium text-foreground">Approved</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="h-3 w-3 rounded bg-yellow-500 border border-yellow-600" />
            <span className="text-[10px] font-medium text-foreground">Pending</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="h-3 w-3 rounded bg-blue-500 border border-blue-600" />
            <span className="text-[10px] font-medium text-foreground">Locked</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="h-3 w-3 rounded bg-red-500 border border-red-600" />
            <span className="text-[10px] font-medium text-foreground">Cancelled</span>
          </div>
          <div className="flex items-center gap-1.5 ml-auto">
            <div className="h-3 w-3 rounded bg-background border border-border" />
            <span className="text-[10px] font-medium text-muted-foreground">Available</span>
          </div>
        </div>

        {/* Weekly Grid */}
        <div className="overflow-x-auto rounded-lg border border-primary/10 bg-background shadow-md">
          <div className="inline-block min-w-full">
            <div className="p-2">
              {/* Header Row - Days of Week */}
              <div className="mb-2 grid grid-cols-[80px_repeat(7,1fr)] gap-1 border-b border-primary/20 pb-2">
                <div className="flex items-center justify-center">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-primary">Time</span>
                </div>
                {DAYS_OF_WEEK.map((day, index) => {
                  const date = dates[index];
                  const isDateToday = isToday(date);
                  return (
                    <div
                      key={index}
                      className={cn(
                        "py-1.5 text-center rounded transition-all",
                        isDateToday && "bg-gradient-to-br from-primary/20 to-primary/10 border border-primary"
                      )}
                    >
                      <div className={cn(
                        "text-[10px] font-bold uppercase tracking-wide",
                        isDateToday ? "text-primary" : "text-muted-foreground"
                      )}>
                        {day.slice(0, 3)}
                      </div>
                      <div className={cn(
                        "text-[10px] font-semibold mt-0.5",
                        isDateToday ? "text-primary" : "text-foreground"
                      )}>
                        {format(date, "d")}
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Time Slot Rows */}
              <div className="space-y-0.5">
                {HOURS.map((hour) => {
                  const isNightTime = hour >= 22 || hour <= 5;
                  const isBusinessHours = hour >= 9 && hour <= 17;
                  return (
                    <div
                      key={hour}
                      className={cn(
                        "grid grid-cols-[80px_repeat(7,1fr)] gap-1 rounded px-0.5 py-0.5 transition-colors",
                        isNightTime && "bg-muted/20",
                        isBusinessHours && !isNightTime && "bg-muted/5"
                      )}
                    >
                      {/* Time Label */}
                      <div className="flex items-center justify-center pr-1">
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <span className={cn(
                              "text-[10px] font-semibold cursor-help",
                              isBusinessHours ? "text-foreground" : "text-muted-foreground"
                            )}>
                              {formatHour(hour)}
                            </span>
                          </TooltipTrigger>
                          <TooltipContent>
                            <p>{formatHourRange(hour)}</p>
                          </TooltipContent>
                        </Tooltip>
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
                            className="h-[20px]"
                          >
                            {hasBooking && primaryBooking ? (
                              bookings.length > 1 ? (
                                // Multiple bookings - use Popover
                                <Popover open={isPopoverOpen} onOpenChange={(open) => setOpenPopover(open ? cellKey : null)}>
                                  <PopoverTrigger asChild>
                                    <div
                                      className={cn(
                                        "w-full h-full rounded border transition-all flex items-center justify-center text-[8px] font-bold relative cursor-pointer shadow-sm",
                                        statusColors?.bg,
                                        statusColors?.border,
                                        statusColors?.hover,
                                        "text-white",
                                        "hover:shadow-md hover:scale-[1.08] hover:z-10",
                                        isPopoverOpen && "ring-1 ring-offset-1 ring-primary z-20"
                                      )}
                                    >
                                      <span className="font-bold">{bookings.length}</span>
                                    </div>
                                  </PopoverTrigger>
                                  <PopoverContent 
                                    side="top" 
                                    className="w-96 p-0 border-2 border-primary/20 shadow-xl"
                                    align="start"
                                  >
                                    <div className="p-4 border-b bg-gradient-to-r from-primary/5 to-primary/10">
                                      <div className="font-bold text-base flex items-center gap-2">
                                        <CalendarIcon className="h-4 w-4 text-primary" />
                                        {bookings.length} Booking{bookings.length > 1 ? "s" : ""} at this time
                                      </div>
                                      <div className="text-xs text-muted-foreground mt-1 flex items-center gap-1">
                                        <Clock className="h-3 w-3" />
                                        {format(date, "MMM dd, yyyy")} at {formatHourRange(hour)}
                                      </div>
                                    </div>
                                    <div className="max-h-80 overflow-y-auto">
                                      {bookings.map((booking, idx) => {
                                        const bookingStatusColors = getStatusColor(booking.status);
                                        const StatusIcon = bookingStatusColors.icon;
                                        return (
                                          <div
                                            key={booking.id}
                                            onClick={() => {
                                              handleBookingClick(booking.id);
                                              setOpenPopover(null);
                                            }}
                                            className={cn(
                                              "p-4 border-b last:border-b-0 cursor-pointer transition-all hover:bg-gradient-to-r hover:from-primary/5 hover:to-primary/10",
                                              idx === 0 && "bg-primary/5"
                                            )}
                                          >
                                            <div className="flex items-start justify-between gap-3">
                                              <div className="flex-1 min-w-0">
                                                <div className="font-bold text-sm truncate mb-2 flex items-center gap-2">
                                                  {booking.eventName}
                                                </div>
                                                <div className="space-y-1.5 text-xs">
                                                  <div className="flex items-center gap-1.5 text-muted-foreground">
                                                    <Clock className="h-3.5 w-3.5" />
                                                    <span>
                                                      {format(booking.start, "HH:mm")} - {format(booking.end, "HH:mm")}
                                                    </span>
                                                  </div>
                                                  <div className="flex items-center gap-1.5 text-muted-foreground truncate">
                                                    <Users className="h-3.5 w-3.5 flex-shrink-0" />
                                                    <span className="truncate">{booking.customerName}</span>
                                                  </div>
                                                  <div className="flex items-center gap-1.5 text-muted-foreground">
                                                    <DollarSign className="h-3.5 w-3.5" />
                                                    <span>{formatCurrency(booking.amount)}</span>
                                                  </div>
                                                </div>
                                              </div>
                                              <div className="flex flex-col items-end gap-2 flex-shrink-0">
                                                <Badge 
                                                  variant="outline" 
                                                  className={cn(
                                                    "text-[10px] px-2 py-1 font-semibold flex items-center gap-1",
                                                    bookingStatusColors.text, 
                                                    bookingStatusColors.bg, 
                                                    bookingStatusColors.border
                                                  )}
                                                >
                                                  <StatusIcon className="h-3 w-3" />
                                                  {bookingStatusColors.label}
                                                </Badge>
                                                <Button
                                                  size="sm"
                                                  variant="ghost"
                                                  className="h-7 text-xs"
                                                  onClick={(e) => {
                                                    e.stopPropagation();
                                                    handleBookingClick(booking.id);
                                                    setOpenPopover(null);
                                                  }}
                                                >
                                                  <Eye className="h-3 w-3 mr-1" />
                                                  View
                                                </Button>
                                              </div>
                                            </div>
                                          </div>
                                        );
                                      })}
                                    </div>
                                    <div className="p-3 border-t bg-muted/30">
                                      <div className="text-[10px] text-muted-foreground text-center flex items-center justify-center gap-1">
                                        <Info className="h-3 w-3" />
                                        Click any booking to view details
                                      </div>
                                    </div>
                                  </PopoverContent>
                                </Popover>
                              ) : (
                                // Single booking
                                <Tooltip>
                                  <TooltipTrigger asChild>
                                <div
                                  onClick={() => handleBookingClick(primaryBooking.id)}
                                  className={cn(
                                    "w-full h-full rounded border transition-all flex items-center justify-center relative cursor-pointer shadow-sm",
                                    statusColors?.bg,
                                    statusColors?.border,
                                    statusColors?.hover,
                                    "text-white",
                                    "hover:shadow-md hover:scale-[1.08] hover:z-10"
                                  )}
                                >
                                  <span className="opacity-95 text-xs">●</span>
                                </div>
                                  </TooltipTrigger>
                                  <TooltipContent side="top" className="max-w-xs">
                                    <div className="space-y-1">
                                      <div className="font-semibold">{primaryBooking.eventName}</div>
                                      <div className="text-xs text-muted-foreground">
                                        {primaryBooking.customerName}
                                      </div>
                                      <div className="text-xs text-muted-foreground">
                                        {format(primaryBooking.start, "HH:mm")} - {format(primaryBooking.end, "HH:mm")}
                                      </div>
                                      <div className="text-xs font-medium">
                                        {formatCurrency(primaryBooking.amount)}
                                      </div>
                                    </div>
                                  </TooltipContent>
                                </Tooltip>
                              )
                            ) : (
                              <div
                                className={cn(
                                  "w-full h-full rounded border transition-colors",
                                  isDateToday 
                                    ? "bg-primary/5 border-primary/20 hover:border-primary/40" 
                                    : "bg-background border-border/40 hover:border-border"
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

        {/* Enhanced Bookings Summary */}
        <div className="rounded-lg border border-primary/10 bg-gradient-to-r from-primary/5 via-primary/10 to-primary/5 p-3 shadow-sm">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
            <div className="flex-1">
              <div className="flex items-center gap-2">
                <div className="p-1.5 rounded-md bg-primary/10">
                  <TrendingUp className="h-4 w-4 text-primary" />
                </div>
                <div>
                  <div className="text-sm font-bold text-foreground">Bookings This Week</div>
                  <div className="text-xs text-muted-foreground mt-0.5">
                    {weekBookings && weekBookings.length > 0 ? (
                      <>
                        {weekBookings.length} booking{weekBookings.length !== 1 ? "s" : ""} • {formatCurrency(stats.totalRevenue.toString())} revenue
                      </>
                    ) : (
                      "No bookings scheduled"
                    )}
                  </div>
                </div>
              </div>
            </div>
            {weekBookings && weekBookings.length > 0 && (
              <Badge variant="secondary" className="text-xs font-bold px-2.5 py-1 bg-primary/10 text-primary border border-primary/20">
                {weekBookings.length}
              </Badge>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
