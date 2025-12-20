"use client";

import React, { use, useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert";
import {
  MapPin,
  Calendar,
  CalendarDays,
  Plus,
  Building2,
  Loader2,
  CheckCircle,
  Clock,
  AlertCircle,
  List,
  Info,
  Star,
  Mail,
  Phone,
  Globe,
  CreditCard,
  XCircle,
  ChevronLeft,
  ChevronRight,
  RotateCcw,
  Copy,
  Check,
  Wallet,
} from "lucide-react";
import { useEventTabs } from "@/contexts/EventTabContext";
import { useEventById } from "@/hooks/events/useEventById";
import { useBookableLocationById } from "@/hooks/events/useBookableLocationById";
import { format, startOfDay, endOfDay, eachDayOfInterval, differenceInHours, addDays, subDays, startOfWeek, getHours, getMinutes, setHours, setMinutes, isSameDay } from "date-fns";
import Image from "next/image";
import { APIProvider, Map, AdvancedMarker, Pin } from "@vis.gl/react-google-maps";
import { toast } from "sonner";
import type { LocationBooking } from "@/types";
import { PaymentModal } from "@/components/shared/PaymentModal";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { initiateLocationBookingPayment } from "@/api/events";
import { useEventLocationBookings } from "@/hooks/events/useEventLocationBookings";
import { CancelBookingDialog } from "./_components/CancelBookingDialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

// ... [GoogleMapsErrorBoundary class remains the same] ...
class GoogleMapsErrorBoundary extends React.Component<
  { children: React.ReactNode },
  { hasError: boolean; isGoogleMapsError: boolean }
> {
    // ... [implementation omitted for brevity, same as original] ...
    constructor(props: { children: React.ReactNode }) {
    super(props);
    this.state = { hasError: false, isGoogleMapsError: false };
  }

  static getDerivedStateFromError(error: any) {
    const errorMessage = error?.message || String(error) || "";
    const errorName = error?.name || "";
    
    // Check if it's a Google Maps error
    const isGoogleMapsError = 
      errorName === "ExpiredKeyMapError" ||
      errorName === "InvalidKeyMapError" ||
      errorMessage.includes("ExpiredKeyMapError") ||
      errorMessage.includes("InvalidKeyMapError") ||
      errorMessage.includes("Google Maps API") ||
      errorMessage.includes("Google Maps JavaScript API") ||
      errorMessage.includes("maps.googleapis.com");
    
    // Always catch errors in the map component to prevent page crash
    return { hasError: true, isGoogleMapsError };
  }

  componentDidCatch(error: any) {
    const errorMessage = error?.message || String(error) || "";
    if (this.state.isGoogleMapsError) {
      console.warn("Google Maps API error (non-blocking):", errorMessage);
    } else {
      console.error("Map component error (non-blocking):", errorMessage);
    }
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="flex items-center justify-center h-full bg-muted text-muted-foreground">
          <div className="text-center">
            <MapPin className="h-12 w-12 mx-auto mb-2 opacity-20" />
            <p className="text-sm">Map unavailable</p>
            <p className="text-xs mt-2 opacity-60">
              {this.state.isGoogleMapsError ? "Google Maps API error" : "Map error"}
            </p>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

// ... [getStatusBadge function remains the same] ...
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

// ... [formatCurrency function remains the same] ...
const formatCurrency = (amount: string) => {
    const num = parseFloat(amount);
    return new Intl.NumberFormat("vi-VN", {
      style: "currency",
      currency: "VND",
      minimumFractionDigits: 0,
    }).format(num);
  };

// UPDATED: Optimized date formatting with time merging
const formatDateRange = (dates: { startDateTime: string; endDateTime: string }[]) => {
  if (dates.length === 0) return "No dates";

  // 1. Sort dates by start time
  const sortedDates = [...dates].sort((a, b) => 
    new Date(a.startDateTime).getTime() - new Date(b.startDateTime).getTime()
  );

  // 2. Merge consecutive slots
  const mergedDates: typeof dates = [];
  if (sortedDates.length > 0) {
    let current = { ...sortedDates[0] };

    for (let i = 1; i < sortedDates.length; i++) {
      const next = sortedDates[i];
      
      // Check if the current slot ends exactly when the next slot starts
      // We use getTime() to compare milliseconds for accuracy
      if (new Date(current.endDateTime).getTime() === new Date(next.startDateTime).getTime()) {
        // Merge: Update the end time of the current slot to the end of the next slot
        current.endDateTime = next.endDateTime;
      } else {
        // Not consecutive: Push current to results and start a new block
        mergedDates.push(current);
        current = { ...next };
      }
    }
    // Push the final slot
    mergedDates.push(current);
  }

  // 3. Render the merged list
  return (
    <div className="flex flex-col gap-1">
      {mergedDates.map((date, index) => {
        const start = new Date(date.startDateTime);
        const end = new Date(date.endDateTime);
        const isSameDay = start.toDateString() === end.toDateString();

        return (
          <div key={index} className="text-sm">
            <span className="font-medium">{format(start, "MMM dd, yyyy")}</span>:{" "}
            <span className="text-muted-foreground">
              {format(start, "HH:mm")} - {format(end, "HH:mm")}
              {/* Optional indicator if the merged slot spans across midnight */}
              {!isSameDay && <span className="text-xs ml-1 italic">(+1 day)</span>}
            </span>
          </div>
        );
      })}
    </div>
  );
};

// ... [TransactionIdDisplay function remains the same] ...
function TransactionIdDisplay({ transactionId }: { transactionId: string }) {
    const [copied, setCopied] = useState(false);
    
    const truncatedId = transactionId.length > 16 
      ? `${transactionId.slice(0, 8)}...${transactionId.slice(-8)}`
      : transactionId;
    
    const handleCopy = async () => {
      await navigator.clipboard.writeText(transactionId);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    };
    
    return (
      <div className="flex items-center justify-between gap-3">
        <p className="text-sm text-muted-foreground">Transaction ID</p>
        <div className="flex items-center gap-2">
          <p className="text-xs font-mono text-muted-foreground">{truncatedId}</p>
          <Button
            variant="ghost"
            size="icon"
            onClick={handleCopy}
            className="h-6 w-6"
            title="Copy transaction ID"
          >
            {copied ? (
              <Check className="h-3 w-3 text-green-600" />
            ) : (
              <Copy className="h-3 w-3" />
            )}
          </Button>
        </div>
      </div>
    );
  }

// ... [BookingCalendar function remains largely same but could benefit from showing tooltips] ...
function BookingCalendar({ 
    dates 
  }: { 
    dates: { startDateTime: string; endDateTime: string }[] 
  }) {
    const [currentStartDate, setCurrentStartDate] = useState<Date>(() => {
      if (dates.length === 0) return new Date();
      // Find the earliest date in the bookings
      const earliestDate = dates.reduce((earliest, dateRange) => {
        const start = new Date(dateRange.startDateTime);
        return start < earliest ? start : earliest;
      }, new Date(dates[0].startDateTime));
      // Start from the beginning of the week containing the earliest date
      return startOfWeek(earliestDate, { weekStartsOn: 1 });
    });
  
    const DAYS_TO_SHOW = 7; // Show full week (7 days)
    const TIME_SLOT_HOURS = 2; // 2-hour increments
  
    // Generate time slots: 00:00, 02:00, 04:00, ..., 22:00
    const timeSlots = Array.from({ length: 12 }, (_, i) => i * TIME_SLOT_HOURS);
  
    // Generate days to display
    const displayedDays = Array.from({ length: DAYS_TO_SHOW }, (_, i) => 
      addDays(currentStartDate, i)
    );
  
    // Process booking dates into a map for quick lookup
    const bookingMap: Record<string, Array<{ start: Date; end: Date }>> = {};
  
    dates.forEach((dateRange) => {
      const start = new Date(dateRange.startDateTime);
      const end = new Date(dateRange.endDateTime);
      
      // Split multi-day bookings into individual days
      const days = eachDayOfInterval({ start, end });
      
      days.forEach((day, dayIndex) => {
        const isFirstDay = dayIndex === 0;
        const isLastDay = dayIndex === days.length - 1;
        
        let dayStart: Date;
        let dayEnd: Date;
        
        if (isFirstDay && isLastDay) {
          dayStart = start;
          dayEnd = end;
        } else if (isFirstDay) {
          dayStart = start;
          // If end is exactly 00:00 of the next day, preserve it (it's 24:00 of current day)
          // Otherwise use endOfDay
          if (format(end, "yyyy-MM-dd") === format(addDays(day, 1), "yyyy-MM-dd") &&
              getHours(end) === 0 && getMinutes(end) === 0) {
            dayEnd = end; // Keep as 00:00 next day (represents 24:00)
          } else {
            dayEnd = endOfDay(day);
          }
        } else if (isLastDay) {
          dayStart = startOfDay(day);
          dayEnd = end;
        } else {
          dayStart = startOfDay(day);
          dayEnd = endOfDay(day);
        }
        
        const dateKey = format(day, "yyyy-MM-dd");
        if (!bookingMap[dateKey]) {
          bookingMap[dateKey] = [];
        }
        bookingMap[dateKey].push({ start: dayStart, end: dayEnd });
      });
    });
  
    // Merge consecutive bookings on each day to detect full cells
    Object.keys(bookingMap).forEach((dateKey) => {
      const bookings = bookingMap[dateKey];
      // Sort by start time
      bookings.sort((a, b) => a.start.getTime() - b.start.getTime());
      
      // Merge consecutive bookings
      const merged: Array<{ start: Date; end: Date }> = [];
      for (const booking of bookings) {
        if (merged.length === 0) {
          merged.push({ start: booking.start, end: booking.end });
        } else {
          const last = merged[merged.length - 1];
          // If this booking starts exactly when the last one ends, merge them
          if (last.end.getTime() === booking.start.getTime()) {
            last.end = booking.end;
          } else {
            merged.push({ start: booking.start, end: booking.end });
          }
        }
      }
      bookingMap[dateKey] = merged;
    });
  
    // Check if a time slot cell should be colored
    const getCellBooking = (day: Date, timeSlotHour: number) => {
      const dateKey = format(day, "yyyy-MM-dd");
      const bookings = bookingMap[dateKey] || [];
      
      // Handle 22:00 slot specially (spans to next day: 22:00-00:00)
      let slotStart: Date;
      let slotEnd: Date;
      if (timeSlotHour === 22) {
        slotStart = setMinutes(setHours(startOfDay(day), 22), 0);
        slotEnd = setMinutes(setHours(startOfDay(addDays(day, 1)), 0), 0); // Next day 00:00
      } else {
        slotStart = setMinutes(setHours(startOfDay(day), timeSlotHour), 0);
        slotEnd = setMinutes(setHours(startOfDay(day), timeSlotHour + TIME_SLOT_HOURS), 0);
      }
      const slotMid = setMinutes(setHours(startOfDay(day), timeSlotHour + 1), 0); // Middle of 2-hour slot
      
      // Collect all bookings that overlap with this slot
      const allBookings = [...bookings];
      
      // For 22:00 slot, we'll check next day bookings separately below
      
      const slotStartTime = slotStart.getTime();
      const slotMidTime = slotMid.getTime();
      const slotEndTime = slotEnd.getTime();
      
      // Track coverage of top and bottom halves
      let topHalfCovered = false;
      let bottomHalfCovered = false;
      let fullCellCovered = false;
      
      for (const booking of allBookings) {
        const bookingStartTime = booking.start.getTime();
        const bookingEndTime = booking.end.getTime();
        
        // Check if booking overlaps with this time slot
        if (bookingStartTime < slotEndTime && bookingEndTime > slotStartTime) {
          // Check if booking covers the entire cell (completely spans the slot)
          if (bookingStartTime <= slotStartTime && bookingEndTime >= slotEndTime) {
            fullCellCovered = true;
            continue;
          }
          
          // Check if booking spans both halves (starts before slotMid and ends after slotMid)
          // This should be treated as full cell coverage
          if (bookingStartTime < slotMidTime && bookingEndTime > slotMidTime) {
            fullCellCovered = true;
            continue;
          }
          
          // Check if booking covers top half [slotStart, slotMid)
          // A booking covers top half if it overlaps with [slotStart, slotMid)
          // Top half: 22:00-23:00 in 22:00-00:00 slot, or 00:00-01:00 in 00:00-02:00 slot
          if (bookingStartTime < slotMidTime && bookingEndTime > slotStartTime) {
            topHalfCovered = true;
          }
          
          // Check if booking covers bottom half [slotMid, slotEnd)
          // A booking covers bottom half if it overlaps with [slotMid, slotEnd)
          // Bottom half: 23:00-00:00 in 22:00-00:00 slot, or 01:00-02:00 in 00:00-02:00 slot
          if (bookingStartTime < slotEndTime && bookingEndTime > slotMidTime) {
            bottomHalfCovered = true;
          }
        }
      }
      
      // For 22:00 slot, check if 23:00-00:00 (or 23:00-24:00) is covered
      // Check original dates for bookings that span midnight (23:00-00:00 or 23:00-24:00)
      if (timeSlotHour === 22 && !bottomHalfCovered) {
        const dayStartTime = startOfDay(day).getTime();
        const dayEndTime = endOfDay(day).getTime();
        const nextDayStartTime = startOfDay(addDays(day, 1)).getTime();
        
        // Check original dates for bookings that span from 23:00 to 00:00 next day (or 24:00)
        for (const dateRange of dates) {
          const bookingStart = new Date(dateRange.startDateTime);
          const bookingEnd = new Date(dateRange.endDateTime);
          const bookingStartTime = bookingStart.getTime();
          const bookingEndTime = bookingEnd.getTime();
          
          // Check if this booking is part of 23:00-00:00 (or 23:00-24:00) on the current day
          const startsAt23 = getHours(bookingStart) === 23 && getMinutes(bookingStart) === 0;
          const endsAt00 = getHours(bookingEnd) === 0 && getMinutes(bookingEnd) === 0;
          const isOnCurrentDay = bookingStartTime >= dayStartTime && bookingStartTime < dayEndTime;
          const endsOnNextDay = bookingEndTime >= nextDayStartTime && bookingEndTime < nextDayStartTime + 60 * 60 * 1000; // Within first hour of next day
          
          // Also check if the original string indicates 24:00
          const originalEndTime = dateRange.endDateTime;
          const is24Hour = originalEndTime.includes("T24:00") || 
                           (endsAt00 && endsOnNextDay && 
                            Math.abs(bookingEndTime - bookingStartTime - 60 * 60 * 1000) < 1000); // Exactly 1 hour
          
          if (startsAt23 && (endsAt00 || is24Hour) && isOnCurrentDay && endsOnNextDay) {
            bottomHalfCovered = true;
            break;
          }
        }
        
        // Also check the processed bookings - look for bookings that end at 00:00 next day
        // (which represents 24:00 of current day)
        if (!bottomHalfCovered) {
          // Check if there's a booking on current day that ends at 00:00 next day
          const endsAtMidnight = bookings.some(b => {
            const endHour = getHours(b.end);
            const endMin = getMinutes(b.end);
            const endDate = format(b.end, "yyyy-MM-dd");
            const nextDate = format(addDays(day, 1), "yyyy-MM-dd");
            // Check if it ends at 00:00 of the next day
            return endHour === 0 && endMin === 0 && endDate === nextDate;
          });
          
          // Also check if there's a booking starting at 23:00 on current day
          const startsAt23 = bookings.some(b => {
            const startHour = getHours(b.start);
            const startMin = getMinutes(b.start);
            return startHour === 23 && startMin === 0;
          });
          
          // If we have a booking that starts at 23:00 and ends at 00:00 next day, it's the bottom half
          if (startsAt23 && endsAtMidnight) {
            bottomHalfCovered = true;
          }
        }
      }
      
      // Determine result
      if (fullCellCovered || (topHalfCovered && bottomHalfCovered)) {
        return {
          isBooked: true,
          isFullCell: true,
          isTopHalf: false,
          isBottomHalf: false,
          isMiddle: fullCellCovered,
        };
      }
      
      if (topHalfCovered) {
        return {
          isBooked: true,
          isFullCell: false,
          isTopHalf: true,
          isBottomHalf: false,
          isMiddle: false,
        };
      }
      
      if (bottomHalfCovered) {
        return {
          isBooked: true,
          isFullCell: false,
          isTopHalf: false,
          isBottomHalf: true,
          isMiddle: false,
        };
      }
      
      return { isBooked: false, isFullCell: false, isTopHalf: false, isBottomHalf: false, isMiddle: false };
    };
  
    const goToPrevious = () => {
      setCurrentStartDate(prev => subDays(prev, DAYS_TO_SHOW));
    };
  
    const goToNext = () => {
      setCurrentStartDate(prev => addDays(prev, DAYS_TO_SHOW));
    };
  
    const goToBookings = () => {
      if (dates.length === 0) return;
      // Find the earliest date in the bookings
      const earliestDate = dates.reduce((earliest, dateRange) => {
        const start = new Date(dateRange.startDateTime);
        return start < earliest ? start : earliest;
      }, new Date(dates[0].startDateTime));
      // Start from the beginning of the week containing the earliest date
      setCurrentStartDate(startOfWeek(earliestDate, { weekStartsOn: 1 }));
    };
  
    // Check if current view overlaps with any booking dates
    const isViewingBookings = dates.length > 0 && (() => {
      const viewStart = startOfDay(displayedDays[0]);
      const viewEnd = endOfDay(displayedDays[DAYS_TO_SHOW - 1]);
      
      return dates.some(dateRange => {
        const bookingStart = startOfDay(new Date(dateRange.startDateTime));
        const bookingEnd = endOfDay(new Date(dateRange.endDateTime));
        // Check if booking overlaps with current view
        return bookingStart <= viewEnd && bookingEnd >= viewStart;
      });
    })();
  
    return (
      <div className="space-y-4">
        {/* Calendar Navigation - Compact */}
        <div className="flex items-center justify-between gap-3 p-2.5 rounded-lg border border-border bg-gradient-to-r from-primary/10 via-primary/5 to-primary/10">
          <Button
            variant="outline"
            size="sm"
            onClick={goToPrevious}
            className="h-8 px-3 flex items-center gap-1.5 border-primary/20 hover:bg-primary/10 hover:border-primary/30 transition-all"
          >
            <ChevronLeft className="h-3.5 w-3.5" />
            <span className="text-[10px] font-medium">Prev</span>
          </Button>
          <div className="flex-1 text-center px-3 py-1.5 bg-background/80 rounded-md border border-border/50">
            <div className="flex items-center justify-center gap-1.5">
              <CalendarDays className="h-3.5 w-3.5 text-primary" />
              <span className="text-xs font-bold text-foreground">
                {format(displayedDays[0], "MMM dd")} - {format(displayedDays[DAYS_TO_SHOW - 1], "MMM dd, yyyy")}
              </span>
            </div>
          </div>
          <div className="flex items-center gap-1.5">
            {dates.length > 0 && !isViewingBookings && (
              <Button
                variant="outline"
                size="sm"
                onClick={goToBookings}
                className="h-8 px-2 border-primary/20 hover:bg-primary/10 hover:border-primary/30 transition-all"
                title="Return to bookings"
              >
                <RotateCcw className="h-3.5 w-3.5" />
              </Button>
            )}
            <Button
              variant="outline"
              size="sm"
              onClick={goToNext}
              className="h-8 px-3 flex items-center gap-1.5 border-primary/20 hover:bg-primary/10 hover:border-primary/30 transition-all"
            >
              <span className="text-[10px] font-medium">Next</span>
              <ChevronRight className="h-3.5 w-3.5" />
            </Button>
          </div>
        </div>
  
        {/* Calendar Grid - Compact, No Scroll */}
        <div className="border-2 border-border rounded-xl overflow-hidden bg-card shadow-lg">
          <div className="overflow-x-auto">
            <table className="w-full border-collapse">
              <thead>
                <tr className="bg-gradient-to-br from-muted/60 via-muted/40 to-muted/30 border-b-2 border-border">
                  {/* Time Column Header */}
                  <th className="w-16 p-1.5 text-center border-r-2 border-border sticky left-0 z-10 bg-gradient-to-br from-muted/60 via-muted/40 to-muted/30 shadow-sm">
                    <div className="flex flex-col items-center gap-0.5">
                      <Clock className="h-3 w-3 text-primary" />
                      <span className="text-[10px] font-bold uppercase tracking-wide">Time</span>
                    </div>
                  </th>
                  {/* 7 Day Headers - Compact */}
                  {displayedDays.map((day) => {
                    const isToday = isSameDay(day, new Date());
                    return (
                      <th
                        key={format(day, "yyyy-MM-dd")}
                        className="min-w-[100px] max-w-[100px] p-1.5 text-center border-r last:border-r-0"
                      >
                        <div className="flex flex-col items-center gap-0.5">
                          <span className="text-[10px] font-extrabold uppercase tracking-wider text-muted-foreground">
                            {format(day, "EEE")}
                          </span>
                          <span className="text-sm font-black leading-none">
                            {format(day, "d")}
                          </span>
                          <span className="text-[9px] font-semibold uppercase text-muted-foreground">
                            {format(day, "MMM")}
                          </span>
                          {isToday && (
                            <div className="mt-0.5 w-1.5 h-1.5 rounded-full bg-primary ring-1 ring-primary/30"></div>
                          )}
                        </div>
                      </th>
                    );
                  })}
                </tr>
              </thead>
              <tbody>
                {timeSlots.map((hour) => (
                  <tr key={hour} className="border-b last:border-b-0 hover:bg-muted/20 transition-colors">
                    {/* Time Label - Sticky, Compact */}
                    <td className="w-16 p-1 text-[10px] font-bold font-mono text-muted-foreground border-r-2 border-border bg-gradient-to-r from-muted/40 to-muted/20 sticky left-0 z-10">
                      <div className="text-right pr-1">
                        {String(hour).padStart(2, "0")}:00
                      </div>
                    </td>
                    {/* 7 Day Cells - Compact */}
                    {displayedDays.map((day) => {
                      const cellBooking = getCellBooking(day, hour);
                      return (
                        <td
                          key={`${format(day, "yyyy-MM-dd")}-${hour}`}
                          className="min-w-[100px] max-w-[100px] h-6 p-0.5 border-r last:border-r-0 relative bg-background hover:bg-muted/10 transition-colors"
                        >
                          {cellBooking.isBooked && (
                            <div
                              className={`absolute rounded ${
                                cellBooking.isFullCell || cellBooking.isMiddle
                                  ? "inset-0 bg-gradient-to-br from-primary/30 via-primary/25 to-primary/20 border border-primary/50"
                                  : cellBooking.isTopHalf
                                  ? "bg-gradient-to-br from-primary/30 via-primary/25 to-primary/20 border border-primary/50 border-b-0 rounded-b-none"
                                  : cellBooking.isBottomHalf
                                  ? "bg-gradient-to-br from-primary/30 via-primary/25 to-primary/20 border border-primary/50 border-t-0 rounded-t-none"
                                  : "inset-0 bg-gradient-to-br from-primary/30 via-primary/25 to-primary/20 border border-primary/50"
                              }`}
                              style={{
                                ...(cellBooking.isTopHalf && {
                                  top: 0,
                                  left: 0,
                                  right: 0,
                                  height: "50%",
                                }),
                                ...(cellBooking.isBottomHalf && {
                                  bottom: 0,
                                  left: 0,
                                  right: 0,
                                  height: "50%",
                                  top: "auto",
                                }),
                              }}
                            />
                          )}
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    );
  }

// ... [LocationCard component remains the same] ...
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
        <Card className="h-[520px] flex flex-col p-0 overflow-hidden col-span-2">
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
        <div className="relative h-[520px] w-full rounded-lg overflow-hidden border">
          {apiKey && hasValidCoords ? (
            <GoogleMapsErrorBoundary>
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
            </GoogleMapsErrorBoundary>
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
  const [showInsufficientBalanceDialog, setShowInsufficientBalanceDialog] =
    useState(false);
  const paymentReturnUrl = typeof window !== "undefined" ? window.location.href : undefined;

  const { openBookLocationTab } = useEventTabs();

  const isEventCancelled = event?.status?.toUpperCase() === "CANCELLED";
  const isPublished = event?.status?.toUpperCase() === "PUBLISHED";
  const isDraft = event?.status?.toUpperCase() === "DRAFT";

  // ... [useEffect for Google Maps error handling remains same] ...
  useEffect(() => {
    const isGoogleMapsError = (error: any): boolean => {
      if (!error) return false;
      const errorName = error?.name || "";
      const errorMessage = error?.message || String(error) || "";
      
      return (
        errorName === "ExpiredKeyMapError" ||
        errorName === "InvalidKeyMapError" ||
        errorMessage.includes("ExpiredKeyMapError") ||
        errorMessage.includes("InvalidKeyMapError") ||
        errorMessage.includes("Google Maps API") ||
        errorMessage.includes("Google Maps JavaScript API") ||
        errorMessage.includes("maps.googleapis.com")
      );
    };

    const handleError = (event: ErrorEvent) => {
      const error = event.error || event.message;
      
      // Only suppress Google Maps errors, let others through
      if (isGoogleMapsError(error)) {
        event.preventDefault();
        event.stopPropagation();
        const errorMessage = error?.message || String(error) || "";
        console.warn("Google Maps API error (suppressed):", errorMessage);
        return false;
      }
    };

    const handleUnhandledRejection = (event: PromiseRejectionEvent) => {
      const error = event.reason;
      
      // Only suppress Google Maps promise rejections
      if (isGoogleMapsError(error)) {
        event.preventDefault();
        const errorMessage = error?.message || String(error) || "";
        console.warn("Google Maps API promise rejection (suppressed):", errorMessage);
        return false;
      }
    };

    // Use capture phase to catch errors early, but don't override console.error
    window.addEventListener('error', handleError, true);
    window.addEventListener('unhandledrejection', handleUnhandledRejection, true);

    return () => {
      window.removeEventListener('error', handleError, true);
      window.removeEventListener('unhandledrejection', handleUnhandledRejection, true);
    };
  }, []);

  // ... [useEffect for focus handling remains same] ...
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

  // ... [Booking calculations remain same] ...
  const currentBooking = locationBookings
    ?.filter((booking) => {
      const status = booking.status?.toUpperCase();
      return status === "AWAITING_BUSINESS_PROCESSING" || 
             status === "APPROVED" ||
             status === "PAYMENT_RECEIVED"
    })
    ?.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())[0];
  const hasCurrentBooking = !!currentBooking;
  
  // Check if payment has been received (either status is PAYMENT_RECEIVED or referencedTransactionId exists)
  const isPaymentReceived = currentBooking 
    ? (currentBooking.status?.toUpperCase() === "PAYMENT_RECEIVED" || currentBooking.referencedTransactionId !== null)
    : false;
  
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
      const errorMessage = err?.message || "Failed to complete payment.";
      const lower = errorMessage.toLowerCase();

      if (lower.includes("insufficient") || lower.includes("balance")) {
        setShowInsufficientBalanceDialog(true);
        toast.error("Insufficient funds", {
          description:
            "Your wallet balance is not enough to complete this venue booking payment. Please deposit funds and try again.",
          duration: 6000,
        });
      } else {
        toast.error(errorMessage);
      }
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
                  
                  {/* Callout - show for approved status (but not if payment already received) */}
                  {currentBooking.status?.toUpperCase() === "APPROVED" && !isPaymentReceived && (
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
                  <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-stretch">
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
                        {/* Display list of booked times */}
                        {currentBooking.dates && currentBooking.dates.length > 0 && (
                          <div className="p-4 bg-muted/20 rounded-lg border border-border">
                            <h4 className="text-sm font-semibold mb-2 flex items-center gap-2">
                              <Clock className="h-4 w-4 text-primary" />
                              Reserved Times
                            </h4>
                            {formatDateRange(currentBooking.dates)}
                          </div>
                        )}

                        {currentBooking.dates && currentBooking.dates.length > 0 ? (
                          <BookingCalendar dates={currentBooking.dates} />
                        ) : (
                          <div className="text-center py-8 text-muted-foreground">
                            No booking dates available
                          </div>
                        )}
                      </CardContent>
                    </Card>
                    
                    {/* Payment Details & Destructive Actions Card */}
                    <Card className="h-full flex flex-col">
                      <div className="flex flex-col flex-1">
                        {isPaymentReceived && currentBooking && (() => {
                          // ... [payment received details logic remains same] ...
                          let totalHours = 0;
                          if (currentBooking.dates && currentBooking.dates.length > 0) {
                            currentBooking.dates.forEach((dateRange) => {
                              const start = new Date(dateRange.startDateTime);
                              const end = new Date(dateRange.endDateTime);
                              totalHours += differenceInHours(end, start);
                            });
                          }
                          
                          const totalAmount = parseFloat(currentBooking.amountToPay);
                          const pricePerHour = totalHours > 0 ? totalAmount / totalHours : 0;
                          const paidAt = currentBooking.updatedAt;
                          
                          return (
                            <>
                              <CardHeader>
                                <CardTitle className="text-lg flex items-center gap-2">
                                  <CreditCard className="h-5 w-5 text-primary" />
                                  Payment Details
                                </CardTitle>
                              </CardHeader>
                              <CardContent className="space-y-6">
                                <div className="space-y-3">
                                  <div className="flex items-center justify-between">
                                    <p className="text-sm text-muted-foreground">Total Hours</p>
                                    <p className="text-sm font-medium">{totalHours} {totalHours === 1 ? 'hour' : 'hours'}</p>
                                  </div>
                                  <div className="flex items-center justify-between">
                                    <p className="text-sm text-muted-foreground">Price per Hour</p>
                                    <p className="text-sm font-medium">{formatCurrency(pricePerHour.toString())}/hour</p>
                                  </div>
                                  <div className="flex items-center justify-between pt-3 border-t">
                                    <p className="text-sm font-semibold text-foreground">Total Amount</p>
                                    <p className="text-lg font-bold">{formatCurrency(currentBooking.amountToPay)}</p>
                                  </div>
                                </div>
                                
                                <div className="space-y-3 pt-2 border-t">
                                  {paidAt && (
                                    <div className="flex items-center justify-between">
                                      <p className="text-sm text-muted-foreground">Paid At</p>
                                      <p className="text-sm font-medium">{format(new Date(paidAt), "MMM dd, yyyy 'at' HH:mm")}</p>
                                    </div>
                                  )}
                                  {currentBooking.referencedTransactionId && (
                                    <TransactionIdDisplay transactionId={currentBooking.referencedTransactionId} />
                                  )}
                                </div>
                              </CardContent>
                            </>
                          );
                        })()}
                      </div>
                      <div className={`${isPaymentReceived ? "pt-6 mt-6 border-t" : ""} mt-auto`}>
                        <CardHeader className={isPaymentReceived ? "pb-4" : ""}>
                          <CardTitle className="text-lg">Actions</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-3">
                          <Button
                            variant="outline"
                            size="default"
                            onClick={() => {}}
                            className="w-full"
                          >
                            <AlertCircle className="h-4 w-4 mr-2" />
                            Report location
                          </Button>
                          <div className="space-y-2">
                            {!isDraft ? (
                              <Alert variant="destructive">
                                <AlertCircle className="h-4 w-4" />
                                <AlertDescription className="text-xs">
                                  You're only allowed to cancel booking when your event is in DRAFT status.
                                </AlertDescription>
                              </Alert>
                            ) : (
                              <p className="text-xs text-muted-foreground">
                                This action cannot be undone. Cancelling will refund 100% of the booking fee if already paid.
                              </p>
                            )}
                            <Button
                              variant="destructive"
                              size="default"
                              onClick={() => setIsCancelDialogOpen(true)}
                              className={`w-full ${!isDraft ? "opacity-50 cursor-not-allowed" : ""}`}
                              disabled={!isDraft}
                            >
                              <XCircle className="h-4 w-4 mr-2" />
                              Cancel Booking
                            </Button>
                          </div>
                        </CardContent>
                      </div>
                    </Card>
                    
                    {/* ... [CancelBookingDialog remains same] ... */}
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
                    
                    {/* ... [Payment section logic remains same] ... */}
                    {currentBooking.dates && currentBooking.dates.length > 0 && 
                     !isPaymentReceived && (() => {
                      let totalHours = 0;
                      currentBooking.dates.forEach((dateRange) => {
                        const start = new Date(dateRange.startDateTime);
                        const end = new Date(dateRange.endDateTime);
                        totalHours += differenceInHours(end, start);
                      });
                      
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
                              {currentBooking.status?.toUpperCase() === "AWAITING_BUSINESS_PROCESSING" ||
                                currentBooking.status?.toUpperCase() === "SOFT_LOCKED" ? (
                                <div className="w-full rounded-md border border-amber-200 bg-amber-50 dark:bg-amber-950/20 dark:border-amber-800 py-2.5 px-4">
                                  <div className="flex items-center justify-center gap-2">
                                    <Clock className="h-4 w-4 text-amber-600 dark:text-amber-400 animate-pulse" />
                                    <div className="flex flex-col items-center">
                                      <span className="text-sm font-semibold text-amber-700 dark:text-amber-300">Awaiting Confirmation</span>
                                      <span className="text-xs text-amber-600 dark:text-amber-400 mt-0.5">Business owner is reviewing your booking</span>
                                    </div>
                                  </div>
                                </div>
                              ) : (
                                <Button 
                                  className="w-full"
                                  onClick={() => setIsPaymentModalOpen(true)}
                                  disabled={paymentMutation.isPending}
                                >
                                  {paymentMutation.isPending ? (
                                    <>
                                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                      Processing...
                                    </>
                                  ) : (
                                    "Proceed to Payment"
                                  )}
                                </Button>
                              )}
                            </div>
                          </CardContent>
                        </Card>
                      );
                    })()}
                  </div>
                  
                  {/* Payment Modal */}
                  {currentBooking && currentBooking.dates && currentBooking.dates.length > 0 && (() => {
                    let totalHours = 0;
                    currentBooking.dates.forEach((dateRange) => {
                      const start = new Date(dateRange.startDateTime);
                      const end = new Date(dateRange.endDateTime);
                      totalHours += differenceInHours(end, start);
                    });
                    
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
              ) : (
                <div className="text-center py-16 border rounded-lg bg-muted/10">
                  <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
                    <Building2 className="h-8 w-8 text-primary" />
                  </div>
                  <h3 className="text-lg font-semibold mb-2">
                    {hasLocation ? "No Active Booking" : "No Venue Booked Yet"}
                  </h3>
                  <p className="text-sm text-muted-foreground mb-6 max-w-md mx-auto">
                    {hasLocation 
                      ? "Your previous booking has been cancelled. You can now book a new venue for your event."
                      : "Your event needs a location. Browse our available venues to find the perfect spot for your event."}
                  </p>
                  {!isEventCancelled && (
                    <Button size="lg" onClick={() => {
                      openBookLocationTab();
                      router.push(`/dashboard/creator/events/${eventId}/location/book`);
                    }}>
                      <Plus className="h-4 w-4 mr-2" />
                      {hasLocation ? "Book a New Venue" : "Book a Venue"}
                    </Button>
                  )}
                </div>
              )}
            </TabsContent>
            
            <TabsContent value="all" className="mt-6">
              {/* ... [Booking History Table remains the same] ... */}
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
                              {/* Use the new formatter here too if you want detailed list, or keep simple range */}
                              {booking.dates.length === 1 
                                ? `${format(new Date(booking.dates[0].startDateTime), "MMM dd, HH:mm")} - ${format(new Date(booking.dates[0].endDateTime), "HH:mm")}`
                                : `${booking.dates.length} slots`}
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

      {/* ... [Insufficient Balance Dialog remains the same] ... */}
      <AlertDialog
        open={showInsufficientBalanceDialog}
        onOpenChange={setShowInsufficientBalanceDialog}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <Wallet className="h-5 w-5 text-primary" />
              Insufficient wallet balance
            </AlertDialogTitle>
            <AlertDialogDescription>
              Your wallet balance is not enough to pay for this venue booking.
              The booking payment is still pending. Please deposit funds into
              your wallet and then try the payment again from this location tab.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Close</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                const depositPath = paymentReturnUrl
                  ? `/dashboard/creator/wallet/deposit?returnUrl=${encodeURIComponent(
                      paymentReturnUrl
                    )}`
                  : "/dashboard/creator/wallet/deposit";
                window.open(depositPath, "_blank");
              }}
            >
              Open wallet in new tab
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}