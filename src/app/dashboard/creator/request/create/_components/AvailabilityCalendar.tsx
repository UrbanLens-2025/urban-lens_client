"use client";

import { useState, useMemo, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Calendar as CalendarComponent } from "@/components/ui/calendar";
import { X, Clock } from "lucide-react";
import { format, addDays, addHours, startOfDay, parseISO, isBefore, isSameDay, getDay, startOfMonth, endOfMonth, eachDayOfInterval, isSameMonth } from "date-fns";
import { cn } from "@/lib/utils";
import { useWeeklyAvailabilitiesForCreator } from "@/hooks/availability/useWeeklyAvailabilitiesForCreator";
import { useBookedDates } from "@/hooks/events/useBookedDates";

interface AvailabilityCalendarProps {
  onSlotsChange: (slots: Array<{ startDateTime: Date; endDateTime: Date }>) => void;
  initialSlots?: Array<{ startDateTime: Date; endDateTime: Date }>;
  locationId?: string;
}

export function AvailabilityCalendar({
  onSlotsChange,
  initialSlots = [],
  locationId,
}: AvailabilityCalendarProps) {
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(undefined);
  const [currentMonth, setCurrentMonth] = useState<Date>(startOfMonth(new Date()));
  const [selectedSlots, setSelectedSlots] = useState<Set<string>>(
    new Set(
      initialSlots.map((slot) => {
        const start = new Date(slot.startDateTime);
        const dateKey = format(startOfDay(start), "yyyy-MM-dd");
        const timeKey = format(start, "HH:mm");
        return `${dateKey}_${timeKey}`;
      })
    )
  );

  const today = useMemo(() => startOfDay(new Date()), []);

  // Fetch weekly availability for creator
  const { data: weeklyAvailability } = useWeeklyAvailabilitiesForCreator(locationId);

  // Calculate date range for booked dates query (current month view)
  const monthStart = useMemo(() => startOfMonth(currentMonth), [currentMonth]);
  const monthEnd = useMemo(() => endOfMonth(currentMonth), [currentMonth]);
  
  // Fetch booked dates for the month
  const { data: bookedDatesData } = useBookedDates(
    monthStart.toISOString(),
    monthEnd.toISOString()
  );

  // Map dayOfWeek to date-fns day numbers
  const dayOfWeekToNumber: Record<string, number> = {
    SUNDAY: 0,
    MONDAY: 1,
    TUESDAY: 2,
    WEDNESDAY: 3,
    THURSDAY: 4,
    FRIDAY: 5,
    SATURDAY: 6,
  };

  // Get available time slots for a specific date
  const getAvailableTimeSlots = (date: Date): Date[] => {
    if (!weeklyAvailability || !locationId) {
      // If no availability data, show all hours 9 AM - 9 PM
      const slots: Date[] = [];
      const dateStart = startOfDay(date);
      for (let hour = 9; hour < 21; hour++) {
        const slotTime = new Date(dateStart);
        slotTime.setHours(hour, 0, 0, 0);
        slots.push(slotTime);
      }
      return slots;
    }

    const dateDayNumber = getDay(date);
    const dateStart = startOfDay(date);
    const slots: Date[] = [];

    // Find availability for this day of week
    weeklyAvailability.forEach((avail) => {
      const dayNumber = dayOfWeekToNumber[avail.dayOfWeek];
      
      if (dayNumber === dateDayNumber) {
        // Parse start and end times
        const [startHour, startMinute] = avail.startTime.split(":").map(Number);
        const [endHour, endMinute] = avail.endTime.split(":").map(Number);
        
        // Create time slots from startTime to endTime (hourly)
        let currentTime = new Date(dateStart);
        currentTime.setHours(startHour, startMinute, 0, 0);
        
        const endTime = new Date(dateStart);
        endTime.setHours(endHour, endMinute, 0, 0);
        
        // Generate slots every hour
        while (currentTime < endTime) {
          slots.push(new Date(currentTime));
          currentTime = addHours(currentTime, 1);
        }
      }
    });

    return slots.sort((a, b) => a.getTime() - b.getTime());
  };

  // Check if a time slot is booked
  const isBooked = (dateTime: Date): boolean => {
    if (!bookedDatesData?.dates) return false;

    const dateKey = format(startOfDay(dateTime), "yyyy-MM-dd");
    const timeKey = format(dateTime, "HH:mm");

    return bookedDatesData.dates.some((booking) => {
      const start = new Date(booking.startDateTime);
      const end = new Date(booking.endDateTime);
      
      // Check if this time slot overlaps with any booking
      if (dateTime >= start && dateTime < end) {
        return true;
      }
      
      // Also check if any hour slot within the booking range matches
      let current = new Date(start);
      while (current < end) {
        const currentDateKey = format(startOfDay(current), "yyyy-MM-dd");
        const currentTimeKey = format(current, "HH:mm");
        if (currentDateKey === dateKey && currentTimeKey === timeKey) {
          return true;
        }
        current = addHours(current, 1);
      }
      
      return false;
    });
  };

  // Get available slots for selected date, filtered by booked and past times
  const availableSlotsForSelectedDate = useMemo(() => {
    if (!selectedDate) return [];
    
    const dateStart = startOfDay(selectedDate);
    const isSelectedDatePast = isBefore(dateStart, today) || (isSameDay(dateStart, today) && new Date() >= today);
    
    if (isSelectedDatePast) return [];
    
    const slots = getAvailableTimeSlots(selectedDate);
    
    // Filter out past times if selected date is today
    const now = new Date();
    return slots.filter((slot) => {
      // Skip past times
      if (isSameDay(selectedDate, today) && slot <= now) {
        return false;
      }
      
      // Skip booked slots
      if (isBooked(slot)) {
        return false;
      }
      
      return true;
    });
  }, [selectedDate, weeklyAvailability, bookedDatesData, locationId, today]);

  // Check if a date has available slots
  const dateHasAvailability = (date: Date): boolean => {
    if (isBefore(startOfDay(date), today)) return false;
    
    const slots = getAvailableTimeSlots(date);
    if (slots.length === 0) return false;
    
    // Check if at least one slot is not booked and not in the past
    const now = new Date();
    return slots.some((slot) => {
      if (isSameDay(date, today) && slot <= now) return false;
      return !isBooked(slot);
    });
  };

  // Handle time slot selection
  const handleTimeSlotClick = (timeSlot: Date) => {
    const dateKey = format(startOfDay(timeSlot), "yyyy-MM-dd");
    const timeKey = format(timeSlot, "HH:mm");
    const key = `${dateKey}_${timeKey}`;

    const newSelectedSlots = new Set(selectedSlots);
    
    if (newSelectedSlots.has(key)) {
      newSelectedSlots.delete(key);
    } else {
      newSelectedSlots.add(key);
    }
    
    setSelectedSlots(newSelectedSlots);

    // Convert to date ranges and notify parent
    const slots = Array.from(newSelectedSlots).map((slotKey) => {
      const [dateStr, timeStr] = slotKey.split("_");
      const [hours, minutes] = timeStr.split(":").map(Number);
      const date = parseISO(dateStr);
      date.setHours(hours, minutes, 0, 0);
      const endDate = addHours(date, 1);
      return {
        startDateTime: date,
        endDateTime: endDate,
      };
    });

    onSlotsChange(slots);
  };

  // Check if a time slot is selected
  const isTimeSlotSelected = (timeSlot: Date): boolean => {
    const dateKey = format(startOfDay(timeSlot), "yyyy-MM-dd");
    const timeKey = format(timeSlot, "HH:mm");
    const key = `${dateKey}_${timeKey}`;
    return selectedSlots.has(key);
  };

  // Get selected slots grouped by date for display
  const selectedSlotsByDate = useMemo(() => {
    const grouped = new Map<string, Date[]>();
    
    Array.from(selectedSlots).forEach((slotKey) => {
      const [dateStr, timeStr] = slotKey.split("_");
      const [hours, minutes] = timeStr.split(":").map(Number);
      const date = parseISO(dateStr);
      date.setHours(hours, minutes, 0, 0);
      
      if (!grouped.has(dateStr)) {
        grouped.set(dateStr, []);
      }
      grouped.get(dateStr)!.push(date);
    });
    
    // Sort times within each date
    grouped.forEach((times, dateKey) => {
      times.sort((a, b) => a.getTime() - b.getTime());
    });
    
    return grouped;
  }, [selectedSlots]);

  // Remove a selected slot
  const handleRemoveSlot = (dateTime: Date) => {
    const dateKey = format(startOfDay(dateTime), "yyyy-MM-dd");
    const timeKey = format(dateTime, "HH:mm");
    const key = `${dateKey}_${timeKey}`;

    const newSelectedSlots = new Set(selectedSlots);
    newSelectedSlots.delete(key);
    setSelectedSlots(newSelectedSlots);

    const slots = Array.from(newSelectedSlots).map((slotKey) => {
      const [dateStr, timeStr] = slotKey.split("_");
      const [hours, minutes] = timeStr.split(":").map(Number);
      const date = parseISO(dateStr);
      date.setHours(hours, minutes, 0, 0);
      const endDate = addHours(date, 1);
      return {
        startDateTime: date,
        endDateTime: endDate,
      };
    });

    onSlotsChange(slots);
  };

  // Disable dates in calendar that don't have availability or are in the past
  const disabledDates = (date: Date) => {
    if (isBefore(startOfDay(date), today)) return true;
    return !dateHasAvailability(date);
  };

  // Mark dates with selected slots
  const modifiers = useMemo(() => {
    const datesWithSelections: Date[] = [];
    selectedSlotsByDate.forEach((_, dateKey) => {
      datesWithSelections.push(parseISO(dateKey));
    });
    return {
      selected: datesWithSelections,
      today: today,
    };
  }, [selectedSlotsByDate, today]);

  // Update selected slots when initialSlots change
  useEffect(() => {
    const newSelectedSlots = new Set(
      initialSlots.map((slot) => {
        const start = new Date(slot.startDateTime);
        const dateKey = format(startOfDay(start), "yyyy-MM-dd");
        const timeKey = format(start, "HH:mm");
        return `${dateKey}_${timeKey}`;
      })
    );
    setSelectedSlots(newSelectedSlots);
  }, [initialSlots]);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Select Your Event Times</CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Selected Time Slots */}
        {selectedSlotsByDate.size > 0 && (
          <div className="space-y-3">
            <h4 className="text-sm font-semibold">Selected Times</h4>
            <div className="space-y-2">
              {Array.from(selectedSlotsByDate.entries()).map(([dateKey, times]) => {
                const date = parseISO(dateKey);
                return (
                  <div key={dateKey} className="space-y-2">
                    <p className="text-xs font-medium text-muted-foreground">
                      {format(date, "EEEE, MMMM d, yyyy")}
                    </p>
                    <div className="flex flex-wrap gap-2">
                      {times.map((time, index) => (
                        <Badge
                          key={`${dateKey}_${format(time, "HH:mm")}_${index}`}
                          variant="default"
                          className="pl-3 pr-2 py-1.5 bg-primary text-primary-foreground"
                        >
                          <Clock className="h-3 w-3 mr-1.5" />
                          <span className="text-xs">
                            {format(time, "h:mm a")} - {format(addHours(time, 1), "h:mm a")}
                          </span>
                          <button
                            onClick={() => handleRemoveSlot(time)}
                            className="ml-2 rounded-full hover:bg-primary-foreground/20 p-0.5"
                          >
                            <X className="h-3 w-3" />
                          </button>
                        </Badge>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Calendar */}
        <div className="space-y-4">
          <CalendarComponent
            mode="single"
            selected={selectedDate}
            onSelect={setSelectedDate}
            month={currentMonth}
            onMonthChange={setCurrentMonth}
            disabled={disabledDates}
            modifiers={modifiers}
            modifiersClassNames={{
              selected: "bg-primary text-primary-foreground hover:bg-primary hover:text-primary-foreground",
              today: "bg-accent font-semibold",
            }}
            className="rounded-md border"
          />
        </div>

        {/* Time Slots for Selected Date */}
        {selectedDate && availableSlotsForSelectedDate.length > 0 && (
          <div className="space-y-3">
            <div>
              <h4 className="text-sm font-semibold mb-1">
                Available Times for {format(selectedDate, "EEEE, MMMM d")}
              </h4>
              <p className="text-xs text-muted-foreground">
                Select one or more time slots. Each slot is 1 hour.
              </p>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-2">
              {availableSlotsForSelectedDate.map((timeSlot) => {
                const isSelected = isTimeSlotSelected(timeSlot);
                return (
                  <Button
                    key={timeSlot.toISOString()}
                    variant={isSelected ? "default" : "outline"}
                    className={cn(
                      "h-auto py-3 flex flex-col items-center justify-center",
                      isSelected && "bg-primary text-primary-foreground"
                    )}
                    onClick={() => handleTimeSlotClick(timeSlot)}
                  >
                    <span className="text-sm font-medium">
                      {format(timeSlot, "h:mm")}
                    </span>
                    <span className="text-xs opacity-70">
                      {format(timeSlot, "a")}
                    </span>
                  </Button>
                );
              })}
            </div>
          </div>
        )}

        {selectedDate && availableSlotsForSelectedDate.length === 0 && (
          <div className="text-center py-8 text-muted-foreground">
            <Clock className="h-8 w-8 mx-auto mb-2 opacity-50" />
            <p className="text-sm">No available time slots for this date</p>
          </div>
        )}

        {!selectedDate && (
          <div className="text-center py-8 text-muted-foreground">
            <p className="text-sm">Select a date to view available time slots</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}