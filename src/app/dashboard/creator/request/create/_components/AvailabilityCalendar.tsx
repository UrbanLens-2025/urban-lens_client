"use client";

import { useState, useMemo, useRef, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { X, ChevronLeft, ChevronRight } from "lucide-react";
import { format, addDays, addHours, addWeeks, startOfDay, startOfWeek, parseISO, subWeeks, isBefore, isSameDay, getDay } from "date-fns";
import { cn } from "@/lib/utils";
import { useWeeklyAvailabilitiesForCreator } from "@/hooks/availability/useWeeklyAvailabilitiesForCreator";
import { useBookedDates } from "@/hooks/events/useBookedDates";

interface AvailabilityCalendarProps {
  onSlotsChange: (slots: Array<{ startDateTime: Date; endDateTime: Date }>) => void;
  initialSlots?: Array<{ startDateTime: Date; endDateTime: Date }>;
  locationId?: string;
}

type CellStatus = "available" | "selected" | "dragging" | "past" | "booked" | "unavailable";

export function AvailabilityCalendar({
  onSlotsChange,
  initialSlots = [],
  locationId,
}: AvailabilityCalendarProps) {
  // Week navigation state
  const [currentWeekStart, setCurrentWeekStart] = useState(() => {
    const today = startOfDay(new Date());
    return startOfWeek(today, { weekStartsOn: 1 }); // Monday as first day
  });

  // Generate dates (7 days starting from current week's Monday)
  const dates = useMemo(() => {
    return Array.from({ length: 7 }, (_, i) => addDays(currentWeekStart, i));
  }, [currentWeekStart]);

  // Generate time slots (24 hours: 00:00 to 23:00)
  const timeSlots = useMemo(() => {
    const baseDate = new Date();
    baseDate.setHours(0, 0, 0, 0);
    return Array.from({ length: 24 }, (_, i) => addHours(baseDate, i));
  }, []);

  // Get today's date for comparison
  const today = useMemo(() => startOfDay(new Date()), []);

  // Fetch weekly availability for creator
  const { data: weeklyAvailability } = useWeeklyAvailabilitiesForCreator(locationId);

  // Calculate week range for booked dates query
  const weekStartDate = useMemo(() => dates[0], [dates]);
  const weekEndDate = useMemo(() => {
    const end = dates[6];
    const endOfDay = new Date(end);
    endOfDay.setHours(23, 59, 59, 999);
    return endOfDay;
  }, [dates]);

  // Fetch booked dates for the week
  const { data: bookedDatesData } = useBookedDates(
    locationId,
    weekStartDate ? weekStartDate.toISOString() : undefined,
    weekEndDate ? weekEndDate.toISOString() : undefined
  );

  // Transform weekly availability to actual date ranges for current week
  // Map dayOfWeek to date-fns day numbers (0 = Sunday, 1 = Monday, etc.)
  const dayOfWeekToNumber: Record<string, number> = {
    SUNDAY: 0,
    MONDAY: 1,
    TUESDAY: 2,
    WEDNESDAY: 3,
    THURSDAY: 4,
    FRIDAY: 5,
    SATURDAY: 6,
  };

  // Create availability slots for the current week
  const availabilitySlots = useMemo(() => {
    if (!weeklyAvailability || !dates.length) return new Set<string>();

    const slots = new Set<string>();
    
    weeklyAvailability.forEach((avail) => {
      const dayNumber = dayOfWeekToNumber[avail.dayOfWeek];
      
      // Find the date in the current week that matches this day of week
      dates.forEach((date) => {
        const dateDayNumber = getDay(date); // date-fns getDay returns 0 (Sunday) to 6 (Saturday)
        
        if (dateDayNumber === dayNumber) {
          // Parse start and end times
          const [startHour, startMinute] = avail.startTime.split(":").map(Number);
          const [endHour, endMinute] = avail.endTime.split(":").map(Number);
          
          // Create time slots from startTime to endTime (exclusive of endTime)
          const dateStart = startOfDay(date);
          let currentTime = new Date(dateStart);
          currentTime.setHours(startHour, startMinute, 0, 0);
          
          const endTime = new Date(dateStart);
          endTime.setHours(endHour, endMinute, 0, 0);
          
          // Generate slots every hour within the availability range
          while (currentTime < endTime) {
            const dateKey = format(startOfDay(date), "yyyy-MM-dd");
            const timeKey = format(currentTime, "HH:mm");
            slots.add(`${dateKey}_${timeKey}`);
            
            // Move to next hour
            currentTime = addHours(currentTime, 1);
          }
        }
      });
    });
    
    return slots;
  }, [weeklyAvailability, dates]);

  // Create booked slots set
  const bookedSlotsSet = useMemo(() => {
    const set = new Set<string>();
    if (!bookedDatesData?.dates) return set;

    bookedDatesData.dates.forEach((booking) => {
      const start = new Date(booking.startDateTime);
      const end = new Date(booking.endDateTime);
      
      // Generate all hour slots within the booking range
      let current = new Date(start);
      while (current < end) {
        const dateKey = format(startOfDay(current), "yyyy-MM-dd");
        const timeKey = format(current, "HH:mm");
        set.add(`${dateKey}_${timeKey}`);
        current = addHours(current, 1);
      }
    });
    
    return set;
  }, [bookedDatesData]);

  // Week navigation functions
  const goToPreviousWeek = () => {
    setCurrentWeekStart((prev) => subWeeks(prev, 1));
  };

  const goToNextWeek = () => {
    setCurrentWeekStart((prev) => addWeeks(prev, 1));
  };

  const goToThisWeek = () => {
    const today = startOfDay(new Date());
    setCurrentWeekStart(startOfWeek(today, { weekStartsOn: 1 }));
  };

  // Track selected slots as Set of date+time string keys
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

  // Drag state management
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState<{ dateIndex: number; timeIndex: number } | null>(null);
  const [dragCurrent, setDragCurrent] = useState<{ dateIndex: number; timeIndex: number } | null>(null);
  const calendarRef = useRef<HTMLDivElement>(null);

  // Get cell status
  const getCellStatus = (dateIndex: number, timeIndex: number): CellStatus => {
    const date = dates[dateIndex];
    const dateStart = startOfDay(date);
    
    // Check if date is in the past
    const isDatePast = isBefore(dateStart, today);
    
    // For past dates, also check if the specific time slot is in the past
    if (isDatePast || (isSameDay(dateStart, today) && timeIndex < new Date().getHours())) {
      return "past";
    }

    const timeSlot = timeSlots[timeIndex];
    const dateKey = format(dateStart, "yyyy-MM-dd");
    const timeKey = format(timeSlot, "HH:mm");
    const key = `${dateKey}_${timeKey}`;

    // Check if booked
    if (bookedSlotsSet.has(key)) {
      return "booked";
    }

    // Check if within availability hours (if locationId is provided)
    if (locationId && !availabilitySlots.has(key)) {
      return "unavailable";
    }

    // Check if this cell is in the drag range
    if (isDragging && dragStart && dragCurrent) {
      // Only highlight if dragging in the same day column
      if (
        dragStart.dateIndex === dateIndex &&
        dragCurrent.dateIndex === dateIndex
      ) {
        const minIndex = Math.min(dragStart.timeIndex, dragCurrent.timeIndex);
        const maxIndex = Math.max(dragStart.timeIndex, dragCurrent.timeIndex);
        if (timeIndex >= minIndex && timeIndex <= maxIndex) {
          return "dragging";
        }
      }
    }

    if (selectedSlots.has(key)) return "selected";
    return "available";
  };

  // Handle mouse down - start drag
  const handleMouseDown = (e: React.MouseEvent, dateIndex: number, timeIndex: number) => {
    e.preventDefault(); // Prevent text selection
    
    // Don't allow dragging on past dates
    const date = dates[dateIndex];
    const dateStart = startOfDay(date);
    const isDatePast = isBefore(dateStart, today);
    const isTimePast = isSameDay(dateStart, today) && timeIndex < new Date().getHours();
    
    if (isDatePast || isTimePast) {
      return;
    }

    // Check if slot is available (within availability hours and not booked)
    const timeSlot = timeSlots[timeIndex];
    const dateKey = format(dateStart, "yyyy-MM-dd");
    const timeKey = format(timeSlot, "HH:mm");
    const key = `${dateKey}_${timeKey}`;

    if (bookedSlotsSet.has(key)) {
      return; // Can't select booked slots
    }

    if (locationId && !availabilitySlots.has(key)) {
      return; // Can't select slots outside availability
    }
    
    setIsDragging(true);
    setDragStart({ dateIndex, timeIndex });
    setDragCurrent({ dateIndex, timeIndex });
  };

  // Handle mouse enter - update drag when entering a new cell
  const handleMouseEnter = (dateIndex: number, timeIndex: number) => {
    if (!isDragging || !dragStart) return;

    // Only allow dragging within the same day column
    if (dragStart.dateIndex === dateIndex) {
      // Don't allow dragging to past times
      const date = dates[dateIndex];
      const dateStart = startOfDay(date);
      const isTimePast = isSameDay(dateStart, today) && timeIndex < new Date().getHours();
      
      if (isTimePast) {
        return;
      }

      // Check if slot is available (within availability hours and not booked)
      const timeSlot = timeSlots[timeIndex];
      const dateKey = format(dateStart, "yyyy-MM-dd");
      const timeKey = format(timeSlot, "HH:mm");
      const key = `${dateKey}_${timeKey}`;

      if (bookedSlotsSet.has(key)) {
        return; // Can't drag to booked slots
      }

      if (locationId && !availabilitySlots.has(key)) {
        return; // Can't drag to slots outside availability
      }
      
      setDragCurrent({ dateIndex, timeIndex });
    }
  };

  // Handle mouse up - finalize selection
  const handleMouseUp = () => {
    if (!isDragging || !dragStart || !dragCurrent) {
      setIsDragging(false);
      setDragStart(null);
      setDragCurrent(null);
      return;
    }

    // Only process if dragging within the same day
    if (dragStart.dateIndex === dragCurrent.dateIndex) {
      const date = dates[dragStart.dateIndex];
      const dateStart = startOfDay(date);
      const minIndex = Math.min(dragStart.timeIndex, dragCurrent.timeIndex);
      const maxIndex = Math.max(dragStart.timeIndex, dragCurrent.timeIndex);

      // Filter out past slots, booked slots, and unavailable slots
      const validSlots: number[] = [];
      for (let i = minIndex; i <= maxIndex; i++) {
        const isDatePast = isBefore(dateStart, today);
        const isTimePast = isSameDay(dateStart, today) && i < new Date().getHours();
        if (isDatePast || isTimePast) {
          continue;
        }

        // Check if slot is available
        const timeSlot = timeSlots[i];
        const dateKey = format(dateStart, "yyyy-MM-dd");
        const timeKey = format(timeSlot, "HH:mm");
        const key = `${dateKey}_${timeKey}`;

        if (bookedSlotsSet.has(key)) {
          continue; // Skip booked slots
        }

        if (locationId && !availabilitySlots.has(key)) {
          continue; // Skip slots outside availability
        }

        validSlots.push(i);
      }

      if (validSlots.length === 0) {
        setIsDragging(false);
        setDragStart(null);
        setDragCurrent(null);
        return;
      }

      const dateKey = format(dateStart, "yyyy-MM-dd");
      
      // Check if all valid slots in the range are currently selected
      const allSelected = validSlots.every((idx) => {
        const slot = timeSlots[idx];
        const slotKey = `${dateKey}_${format(slot, "HH:mm")}`;
        return selectedSlots.has(slotKey);
      });

      const newSelectedSlots = new Set(selectedSlots);

      // If all are selected, deselect all in range; otherwise select all in range
      for (const i of validSlots) {
        const timeSlot = timeSlots[i];
        const timeKey = format(timeSlot, "HH:mm");
        const key = `${dateKey}_${timeKey}`;

        if (allSelected) {
          newSelectedSlots.delete(key);
        } else {
          newSelectedSlots.add(key);
        }
      }

      setSelectedSlots(newSelectedSlots);

      // Convert selected slots to date ranges and notify parent
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
    }

    setIsDragging(false);
    setDragStart(null);
    setDragCurrent(null);
  };

  // Handle mouse leave on calendar container - cancel drag if leaving the calendar
  const handleCalendarMouseLeave = () => {
    if (isDragging) {
      setIsDragging(false);
      setDragStart(null);
      setDragCurrent(null);
    }
  };

  // Global mouse up handler to ensure drag ends even if mouse leaves element
  useEffect(() => {
    const handleGlobalMouseUp = () => {
      if (isDragging && dragStart && dragCurrent) {
        // Only process if dragging within the same day
        if (dragStart.dateIndex === dragCurrent.dateIndex) {
          const date = dates[dragStart.dateIndex];
          const dateStart = startOfDay(date);
          const minIndex = Math.min(dragStart.timeIndex, dragCurrent.timeIndex);
          const maxIndex = Math.max(dragStart.timeIndex, dragCurrent.timeIndex);

          // Filter out past slots, booked slots, and unavailable slots
          const validSlots: number[] = [];
          for (let i = minIndex; i <= maxIndex; i++) {
            const isDatePast = isBefore(dateStart, today);
            const isTimePast = isSameDay(dateStart, today) && i < new Date().getHours();
            if (isDatePast || isTimePast) {
              continue;
            }

            // Check if slot is available
            const timeSlot = timeSlots[i];
            const dateKey = format(dateStart, "yyyy-MM-dd");
            const timeKey = format(timeSlot, "HH:mm");
            const key = `${dateKey}_${timeKey}`;

            if (bookedSlotsSet.has(key)) {
              continue; // Skip booked slots
            }

            if (locationId && !availabilitySlots.has(key)) {
              continue; // Skip slots outside availability
            }

            validSlots.push(i);
          }

          if (validSlots.length === 0) {
            setIsDragging(false);
            setDragStart(null);
            setDragCurrent(null);
            return;
          }

          const dateKey = format(dateStart, "yyyy-MM-dd");
          
          // Check if all valid slots in the range are currently selected
          const allSelected = validSlots.every((idx) => {
            const slot = timeSlots[idx];
            const slotKey = `${dateKey}_${format(slot, "HH:mm")}`;
            return selectedSlots.has(slotKey);
          });

          const newSelectedSlots = new Set(selectedSlots);

          // If all are selected, deselect all in range; otherwise select all in range
          for (const i of validSlots) {
            const timeSlot = timeSlots[i];
            const timeKey = format(timeSlot, "HH:mm");
            const key = `${dateKey}_${timeKey}`;

            if (allSelected) {
              newSelectedSlots.delete(key);
            } else {
              newSelectedSlots.add(key);
            }
          }

          setSelectedSlots(newSelectedSlots);

          // Convert selected slots to date ranges and notify parent
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
        }

        setIsDragging(false);
        setDragStart(null);
        setDragCurrent(null);
      }
    };

    if (isDragging) {
      document.addEventListener("mouseup", handleGlobalMouseUp);
      return () => {
        document.removeEventListener("mouseup", handleGlobalMouseUp);
      };
    }
  }, [isDragging, dragStart, dragCurrent, dates, timeSlots, selectedSlots, onSlotsChange, availabilitySlots, bookedSlotsSet, locationId, today]);

  // Get cell class names
  const getCellClassName = (status: CellStatus) => {
    return cn(
      "w-full h-[36px] border-r border-b transition-all flex items-center justify-center text-xs font-medium",
      {
        "bg-green-500 border-green-600 text-white hover:bg-green-600 cursor-pointer": status === "selected",
        "bg-white border-gray-200 text-gray-700 hover:bg-gray-50 cursor-pointer": status === "available",
        "bg-blue-400 border-blue-500 text-white cursor-pointer": status === "dragging",
        "bg-gray-300 border-gray-400 text-gray-500 cursor-not-allowed": status === "past",
        "bg-red-500 border-red-600 text-white cursor-not-allowed": status === "booked",
        "bg-gray-200 border-gray-300 text-gray-400 cursor-not-allowed opacity-60": status === "unavailable",
      }
    );
  };

  // Get selected slots for display, combining consecutive slots on the same day
  const selectedSlotsList = useMemo(() => {
    // Parse all slots into date objects
    const allSlots = Array.from(selectedSlots).map((slotKey) => {
      const [dateStr, timeStr] = slotKey.split("_");
      const [hours, minutes] = timeStr.split(":").map(Number);
      const date = parseISO(dateStr);
      const startDate = new Date(date);
      startDate.setHours(hours, minutes, 0, 0);
      const endDate = addHours(startDate, 1);
      return { 
        start: startDate, 
        end: endDate, 
        key: slotKey,
        dateKey: dateStr,
        hourIndex: hours
      };
    });

    // Group by date
    const slotsByDate = new Map<string, typeof allSlots>();
    allSlots.forEach((slot) => {
      if (!slotsByDate.has(slot.dateKey)) {
        slotsByDate.set(slot.dateKey, []);
      }
      slotsByDate.get(slot.dateKey)!.push(slot);
    });

    // Combine consecutive slots on each date
    const combinedRanges: Array<{ start: Date; end: Date; keys: string[] }> = [];
    
    slotsByDate.forEach((dateSlots, dateKey) => {
      // Sort by hour index
      dateSlots.sort((a, b) => a.hourIndex - b.hourIndex);
      
      if (dateSlots.length === 0) return;
      
      // Find consecutive ranges
      let rangeStart = dateSlots[0];
      let rangeEnd = dateSlots[0];
      let rangeKeys = [rangeStart.key];
      
      for (let i = 1; i < dateSlots.length; i++) {
        const currentSlot = dateSlots[i];
        
        // Check if this slot is consecutive (end time of previous slot equals start time of current)
        if (rangeEnd.end.getTime() === currentSlot.start.getTime()) {
          // Extend the range
          rangeEnd = currentSlot;
          rangeKeys.push(currentSlot.key);
        } else {
          // Save the current range and start a new one
          combinedRanges.push({
            start: rangeStart.start,
            end: rangeEnd.end,
            keys: [...rangeKeys] // Create a copy of the array
          });
          
          rangeStart = currentSlot;
          rangeEnd = currentSlot;
          rangeKeys = [currentSlot.key]; // Create a new array
        }
      }
      
      // Don't forget the last range
      combinedRanges.push({
        start: rangeStart.start,
        end: rangeEnd.end,
        keys: [...rangeKeys] // Create a copy of the array
      });
    });

    // Sort combined ranges by date and time
    combinedRanges.sort((a, b) => a.start.getTime() - b.start.getTime());

    return combinedRanges;
  }, [selectedSlots]);

  const handleRemoveSlot = (keys: string[]) => {
    const newSelectedSlots = new Set(selectedSlots);
    // Remove all keys in the range
    keys.forEach((key) => newSelectedSlots.delete(key));
    setSelectedSlots(newSelectedSlots);

    const slots = Array.from(newSelectedSlots).map((key) => {
      const [dateStr, timeStr] = key.split("_");
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

  // Check if a date has any selected slots
  const hasSelectedSlots = (dateIndex: number): boolean => {
    const date = dates[dateIndex];
    const dateKey = format(startOfDay(date), "yyyy-MM-dd");
    
    return Array.from(selectedSlots).some((slotKey) => {
      return slotKey.startsWith(dateKey + "_");
    });
  };

  // Toggle all slots on a date
  const handleDateHeaderClick = (dateIndex: number) => {
    const date = dates[dateIndex];
    const dateStart = startOfDay(date);
    const dateKey = format(dateStart, "yyyy-MM-dd");
    
    // Check if date is in the past
    const isDatePast = isBefore(dateStart, today);
    if (isDatePast) return;
    
    // Get all available slots for this date (within availability hours and not booked)
    const dateSlotKeys: string[] = [];
    timeSlots.forEach((timeSlot, timeIndex) => {
      // Don't include past time slots on today
      const isTimePast = isSameDay(dateStart, today) && timeIndex < new Date().getHours();
      if (isTimePast) return;

      const timeKey = format(timeSlot, "HH:mm");
      const key = `${dateKey}_${timeKey}`;

      // Only include slots that are available (within availability hours and not booked)
      if (bookedSlotsSet.has(key)) return;
      if (locationId && !availabilitySlots.has(key)) return;

      dateSlotKeys.push(key);
    });
    
    // Check if all slots are selected
    const allSelected = dateSlotKeys.every((key) => selectedSlots.has(key));
    
    const newSelectedSlots = new Set(selectedSlots);
    
    if (allSelected) {
      // Deselect all slots on this date
      dateSlotKeys.forEach((key) => newSelectedSlots.delete(key));
    } else {
      // Select all slots on this date
      dateSlotKeys.forEach((key) => newSelectedSlots.add(key));
    }
    
    setSelectedSlots(newSelectedSlots);
    
    // Convert selected slots to date ranges and notify parent
    const slots = Array.from(newSelectedSlots).map((slotKey) => {
      const [dateStr, timeStr] = slotKey.split("_");
      const [hours, minutes] = timeStr.split(":").map(Number);
      const slotDate = parseISO(dateStr);
      slotDate.setHours(hours, minutes, 0, 0);
      const endDate = addHours(slotDate, 1);
      return {
        startDateTime: slotDate,
        endDateTime: endDate,
      };
    });
    
    onSlotsChange(slots);
  };

  // Check if current week is this week (today falls within the displayed week)
  const isThisWeek = useMemo(() => {
    const weekStart = currentWeekStart;
    const weekEnd = addDays(weekStart, 6);
    return !isBefore(today, weekStart) && !isBefore(weekEnd, today);
  }, [currentWeekStart, today]);

  // Get previous and next week date ranges for button labels
  const previousWeekRange = useMemo(() => {
    const prevWeekStart = subWeeks(currentWeekStart, 1);
    const prevWeekEnd = addDays(prevWeekStart, 6);
    return `${format(prevWeekStart, "d/M")} - ${format(prevWeekEnd, "d/M")}`;
  }, [currentWeekStart]);

  const nextWeekRange = useMemo(() => {
    const nextWeekStart = addWeeks(currentWeekStart, 1);
    const nextWeekEnd = addDays(nextWeekStart, 6);
    return `${format(nextWeekStart, "d/M")} - ${format(nextWeekEnd, "d/M")}`;
  }, [currentWeekStart]);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Select Event Times</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Selected Slots Display - Fixed above week navigation */}
        <div className="h-[72px] border-b">
          {selectedSlotsList.length > 0 ? (
            <div className="h-full flex flex-col">
              <h4 className="text-sm font-medium mb-2">Selected Time Slots:</h4>
              <div 
                className="overflow-x-auto overflow-y-hidden flex-1" 
                style={{ WebkitOverflowScrolling: 'touch' }}
                onWheel={(e) => {
                  // Only stop propagation for horizontal scrolling to prevent calendar scroll
                  if (Math.abs(e.deltaX) > Math.abs(e.deltaY)) {
                    e.stopPropagation();
                  }
                }}
              >
                <div className="flex gap-2 pb-2 min-w-max">
                  {selectedSlotsList.map((slot, index) => (
                    <Badge key={`${slot.start.toISOString()}-${slot.end.toISOString()}-${index}`} variant="default" className="pl-3 pr-2 py-2 bg-green-500 shrink-0">
                      <span className="text-xs whitespace-nowrap">
                        {format(slot.start, "MMM dd, HH:mm")} -{" "}
                        {format(slot.end, "HH:mm")}
                      </span>
                      <button
                        onClick={() => handleRemoveSlot(slot.keys)}
                        className="ml-2 rounded-full hover:bg-white/20 p-0.5"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </Badge>
                  ))}
                </div>
              </div>
            </div>
          ) : (
            <div className="h-full flex items-center">
              <h4 className="text-sm font-medium text-gray-400">No time slots selected</h4>
            </div>
          )}
        </div>

        {/* Legend */}
        <div className="flex flex-col gap-2 pb-2 border-b">
          <div className="flex items-center justify-center gap-6 text-xs">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded bg-green-500 border border-green-600"></div>
              <span>Selected</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded bg-white border border-gray-200"></div>
              <span>Available</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded bg-red-500 border border-red-600"></div>
              <span>Booked</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded bg-gray-200 border border-gray-300 opacity-60"></div>
              <span>Not Available</span>
            </div>
          </div>
          {locationId && (
            <div className="text-xs text-gray-500 text-center italic">
              Note: Time slots marked as "Not Available" are unavailable because the location owner hasn't made them available for booking.
            </div>
          )}
        </div>

        {/* Week Navigation */}
        <div className="flex items-center justify-between">
          <Button
            variant="outline"
            size="sm"
            onClick={goToPreviousWeek}
            className="h-8 px-3 flex items-center gap-2"
          >
            <ChevronLeft className="h-4 w-4" />
            <span className="text-xs">{previousWeekRange}</span>
          </Button>
          
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium">
              {format(dates[0], "MMM d")} - {format(dates[6], "MMM d, yyyy")}
            </span>
            {!isThisWeek && (
              <Button
                variant="ghost"
                size="sm"
                onClick={goToThisWeek}
                className="h-8 text-xs"
              >
                This Week
              </Button>
            )}
          </div>

          <Button
            variant="outline"
            size="sm"
            onClick={goToNextWeek}
            className="h-8 px-3 flex items-center gap-2"
          >
            <span className="text-xs">{nextWeekRange}</span>
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>

        {/* Calendar Grid */}
        <div className="overflow-x-auto" ref={calendarRef}>
          <div className="inline-block min-w-full">
            <div 
              className="border rounded-lg bg-gray-50 p-2 select-none"
              onMouseLeave={handleCalendarMouseLeave}
            >
              {/* Header Row - Dates */}
              <div className="grid grid-cols-[80px_repeat(7,1fr)] gap-0 mb-0">
                <div className="h-12 flex items-center justify-center border-b border-r font-semibold text-sm text-gray-700 bg-gray-100">
                  Time
                </div>
                {dates.map((date, dateIndex) => {
                  const dateStart = startOfDay(date);
                  const isDatePast = isBefore(dateStart, today);
                  const hasSelected = hasSelectedSlots(dateIndex);
                  return (
                    <div
                      key={date.toISOString()}
                      onClick={() => !isDatePast && handleDateHeaderClick(dateIndex)}
                      className={cn(
                        "h-12 text-center font-semibold text-sm border-b border-r flex items-center justify-center transition-colors",
                        {
                          "bg-gray-100 text-gray-700": !isDatePast && !hasSelected,
                          "bg-green-100 text-green-700 border-green-300": !isDatePast && hasSelected,
                          "text-gray-400 opacity-60 bg-gray-100 cursor-not-allowed": isDatePast,
                          "cursor-pointer hover:bg-green-200": !isDatePast,
                        }
                      )}
                    >
                      <div>
                        <div className="text-xs text-gray-500">{format(date, "EEE")}</div>
                        <div>{format(date, "d/M")}</div>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Time Slot Rows */}
              <div>
                {timeSlots.map((timeSlot, timeIndex) => {
                  const timeLabel = `${format(timeSlot, "HH:mm")}`;
                  return (
                    <div
                      key={timeSlot.toISOString()}
                      className="grid grid-cols-[80px_repeat(7,1fr)] gap-0"
                    >
                      {/* Time Label */}
                      <div className="h-[36px] flex items-center justify-end pr-2 text-xs font-medium text-gray-600 border-r bg-white">
                        {timeLabel}
                      </div>

                      {/* Date Cells */}
                      {dates.map((date, dateIndex) => {
                        const status = getCellStatus(dateIndex, timeIndex);
                        return (
                          <div
                            key={`${date.toISOString()}_${timeSlot.toISOString()}`}
                            className="h-[36px] border-r border-b"
                            onMouseDown={(e) => handleMouseDown(e, dateIndex, timeIndex)}
                            onMouseEnter={() => handleMouseEnter(dateIndex, timeIndex)}
                            onMouseUp={handleMouseUp}
                          >
                            <div className={getCellClassName(status)} title={status === "unavailable" ? "This time slot is not available - the location owner hasn't made it available for booking" : status === "booked" ? "This time slot is already booked" : ""}>
                              {status === "booked" && (
                                <span className="text-[7px] px-0.5 leading-tight">BOOKED</span>
                              )}
                              {status === "unavailable" && (
                                <span className="text-[7px] px-0.5 leading-tight opacity-75">NOT AVAILABLE</span>
                              )}
                            </div>
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
      </CardContent>
    </Card>
  );
}