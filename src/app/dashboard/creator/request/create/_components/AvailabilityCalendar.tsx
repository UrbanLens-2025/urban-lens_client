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
  initialWeekStart?: Date;
  eventStartDate?: Date;
  eventEndDate?: Date;
  minBookingDurationMinutes?: number;
}

type CellStatus = "available" | "selected" | "dragging" | "past" | "booked" | "unavailable";

const dayOfWeekToNumber: Record<string, number> = {
  SUNDAY: 0,
  MONDAY: 1,
  TUESDAY: 2,
  WEDNESDAY: 3,
  THURSDAY: 4,
  FRIDAY: 5,
  SATURDAY: 6,
};

export function AvailabilityCalendar({
  onSlotsChange,
  initialSlots = [],
  locationId,
  initialWeekStart,
  eventStartDate,
  eventEndDate,
  minBookingDurationMinutes,
}: AvailabilityCalendarProps) {
  // Week navigation state
  const [currentWeekStart, setCurrentWeekStart] = useState(() => {
    if (initialWeekStart) {
      return startOfWeek(startOfDay(initialWeekStart), { weekStartsOn: 1 });
    }
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

  // Track selected slots as Set of date+time string keys
  const [selectedSlots, setSelectedSlots] = useState<Set<string>>(new Set());
  const [hasValidatedInitialSlots, setHasValidatedInitialSlots] = useState(false);
  // Ref to track if we're currently syncing from initialSlots to prevent infinite loops
  const isSyncingFromInitialSlotsRef = useRef(false);

  // Transform weekly availability to actual date ranges for current week
  // Map dayOfWeek to date-fns day numbers (0 = Sunday, 1 = Monday, etc.)

  // Create availability slots for the current week
  // Only slots marked as available by the business owner will be included
  const availabilitySlots = useMemo(() => {
    // If no location is selected, return empty set (all slots will be considered unavailable until location is selected)
    if (!locationId) return new Set<string>();
    
    // If location is selected but availability data hasn't loaded yet, return empty set
    // This ensures slots are unavailable until we know what the business owner has made available
    if (!weeklyAvailability || !dates.length) return new Set<string>();

    const slots = new Set<string>();
    
    // Build set of available slots based on business owner's weekly availability
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
          // Only these slots will be available for selection
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
  }, [locationId, weeklyAvailability, dates]);

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

  // Validate and set initial slots once availability data is loaded
  // Also sync when initialSlots changes (e.g., when reopening calendar with saved slots)
  useEffect(() => {
    if (locationId && !weeklyAvailability) return; // Wait for availability data if locationId is provided
    if (locationId && !bookedDatesData) return; // Wait for booked dates data if locationId is provided
    
    // If initialSlots is empty, don't do anything
    if (initialSlots.length === 0) {
      // If we haven't validated yet and there are no initial slots, mark as validated
      if (!hasValidatedInitialSlots) {
        setHasValidatedInitialSlots(true);
      }
      return;
    }

    // Helper function to normalize a slot according to weekly availability
    const normalizeSlotByAvailability = (
      slotStart: Date,
      slotEnd: Date
    ): Array<{ start: Date; end: Date }> => {
      if (!locationId || !weeklyAvailability) {
        // No normalization needed if no location or availability
        return [{ start: slotStart, end: slotEnd }];
      }

      const normalized: Array<{ start: Date; end: Date }> = [];
      let currentDay = startOfDay(slotStart);
      const lastDay = startOfDay(slotEnd);

      while (currentDay <= lastDay) {
        const dayOfWeekNumber = getDay(currentDay);
        const dayOfWeekName = Object.keys(dayOfWeekToNumber).find(
          (key) => dayOfWeekToNumber[key] === dayOfWeekNumber
        );

        if (!dayOfWeekName) {
          currentDay = addDays(currentDay, 1);
          continue;
        }

        // Find availability for this day
        const dayAvailability = weeklyAvailability.find(
          (avail) => avail.dayOfWeek === dayOfWeekName
        );

        if (!dayAvailability) {
          // No availability for this day, skip it
          currentDay = addDays(currentDay, 1);
          continue;
        }

        // Parse availability hours
        const [availStartHour, availStartMinute] = dayAvailability.startTime
          .split(":")
          .map(Number);
        const [availEndHour, availEndMinute] = dayAvailability.endTime
          .split(":")
          .map(Number);

        // Create availability boundaries for this day
        const dayAvailStart = new Date(currentDay);
        dayAvailStart.setHours(availStartHour, availStartMinute, 0, 0);
        const dayAvailEnd = new Date(currentDay);
        dayAvailEnd.setHours(availEndHour, availEndMinute, 0, 0);

        // Determine the actual start and end for this day
        let daySlotStart: Date;
        let daySlotEnd: Date;

        if (isSameDay(currentDay, slotStart)) {
          // First day: use the slot start, but clamp to availability
          daySlotStart = new Date(Math.max(slotStart.getTime(), dayAvailStart.getTime()));
        } else {
          // Middle days: start at the beginning of availability
          daySlotStart = new Date(dayAvailStart);
        }

        if (isSameDay(currentDay, slotEnd)) {
          // Last day: use the slot end, but clamp to availability
          daySlotEnd = new Date(Math.min(slotEnd.getTime(), dayAvailEnd.getTime()));
        } else {
          // Middle days: end at the end of availability
          daySlotEnd = new Date(dayAvailEnd);
        }

        // Only add if the normalized slot is valid (start < end)
        if (daySlotStart < daySlotEnd) {
          normalized.push({ start: daySlotStart, end: daySlotEnd });
        }

        currentDay = addDays(currentDay, 1);
      }

      return normalized;
    };

    // Normalize and validate initial slots
    const validSlots: string[] = [];
    
    initialSlots.forEach((slot) => {
      const start = new Date(slot.startDateTime);
      const end = new Date(slot.endDateTime);
      
      // Normalize the slot according to availability
      const normalizedRanges = normalizeSlotByAvailability(start, end);
      
      // Process each normalized range
      normalizedRanges.forEach((range) => {
        // Generate all hour slots within the normalized range
        let current = new Date(range.start);
        while (current < range.end) {
          const dateStart = startOfDay(current);
          const dateKey = format(dateStart, "yyyy-MM-dd");
          const timeKey = format(current, "HH:mm");
          const key = `${dateKey}_${timeKey}`;
          
          // Check if date is in the past
          const isDatePast = isBefore(dateStart, today);
          const isTimePast = isSameDay(dateStart, today) && current.getHours() < new Date().getHours();
          
          if (isDatePast || isTimePast) {
            current = addHours(current, 1);
            continue; // Skip past slots
          }
          
          // Check if booked
          if (bookedSlotsSet.has(key)) {
            current = addHours(current, 1);
            continue; // Skip booked slots
          }
          
          // When syncing from initialSlots, preserve all slots regardless of current week's availability
          // because availabilitySlots only contains slots for the current week (dates dependency).
          // Slots from other weeks were already validated when originally selected.
          // Only validate availability if the slot is in the current week being displayed.
          if (locationId && !availabilitySlots.has(key)) {
            const slotDate = parseISO(dateKey);
            const isInCurrentWeek = dates.some(d => isSameDay(d, slotDate));
            
            // Only filter out if it's in the current week AND not available
            // Preserve slots from other weeks - they were valid when selected
            if (isInCurrentWeek) {
              current = addHours(current, 1);
              continue; // Skip unavailable slots in current week
            }
            // Keep slots from other weeks - they're from initialSlots and were valid when selected
          }
          
          // Slot is valid
          validSlots.push(key);
          current = addHours(current, 1);
        }
      });
    });
    
    // Merge initial slots with existing selected slots (don't replace)
    // This ensures slots from all weeks are maintained when navigating
    const validSlotsSet = new Set(validSlots);
    
    // Set flag to prevent second useEffect from triggering during sync
    isSyncingFromInitialSlotsRef.current = true;
    
    setSelectedSlots((prevSelectedSlots) => {
      // If we have initial slots and haven't validated yet, use them as base
      // Otherwise, merge with existing slots to preserve selections across weeks
      if (!hasValidatedInitialSlots && validSlots.length > 0) {
        return validSlotsSet;
      }
      // Merge: combine existing slots with new initial slots
      const merged = new Set(prevSelectedSlots);
      validSlots.forEach(key => merged.add(key));
      return merged;
    });
    
    // Only notify parent if this is the initial load (not when just syncing)
    if (!hasValidatedInitialSlots && validSlots.length > 0) {
      // Notify parent of the normalized result
      const normalizedSlotsForParent = Array.from(validSlotsSet).map((slotKey) => {
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
      
      onSlotsChange(filterSlotsByEventTime(normalizedSlotsForParent));
    }
    
    setHasValidatedInitialSlots(true);
    
    // Reset flag in next tick to allow state updates to complete
    // Use requestAnimationFrame to ensure it happens after React's state update
    requestAnimationFrame(() => {
      isSyncingFromInitialSlotsRef.current = false;
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialSlots, weeklyAvailability, bookedDatesData, availabilitySlots, bookedSlotsSet, locationId, today]);

  // Ensure parent always has the complete list of selected slots
  // This is important when navigating weeks - parent should always know about all slots
  useEffect(() => {
    // Skip if we're currently syncing from initialSlots to prevent infinite loops
    if (isSyncingFromInitialSlotsRef.current) {
      return;
    }
    
    // Convert all selected slots to date ranges and notify parent
    const slots = Array.from(selectedSlots).map((slotKey) => {
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
    
    // Only notify if we have slots and have validated initial slots (to avoid duplicate calls during initialization)
    if (hasValidatedInitialSlots && slots.length > 0) {
      onSlotsChange(filterSlotsByEventTime(slots));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedSlots, hasValidatedInitialSlots]);

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

  // Helper function - no filtering during selection, allow all slots
  // Validation for minimum duration and event coverage happens when saving
  const filterSlotsByEventTime = (slots: Array<{ startDateTime: Date; endDateTime: Date }>) => {
    // Don't filter during selection - allow users to select freely
    // Validation happens in Step3BusinessVenue when saving
    return slots;
  };

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
    const slotDateTime = new Date(dateStart);
    slotDateTime.setHours(timeSlot.getHours(), timeSlot.getMinutes(), 0, 0);
    const slotEndDateTime = addHours(slotDateTime, 1);
    
    // Allow selecting all available slots regardless of event time
    // Users can select any slot that the business has marked as available

    const dateKey = format(dateStart, "yyyy-MM-dd");
    const timeKey = format(timeSlot, "HH:mm");
    const key = `${dateKey}_${timeKey}`;

    // Check if booked
    if (bookedSlotsSet.has(key)) {
      return "booked";
    }

    // CRITICAL: Check if business owner has made this slot available
    // If locationId exists, only slots in availabilitySlots are available
    // All other slots are unavailable (business owner hasn't opened them for booking)
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
    const slotDateTime = new Date(dateStart);
    slotDateTime.setHours(timeSlot.getHours(), timeSlot.getMinutes(), 0, 0);
    const dateKey = format(dateStart, "yyyy-MM-dd");
    const timeKey = format(timeSlot, "HH:mm");
    const key = `${dateKey}_${timeKey}`;

    // CRITICAL: Prevent interaction with unavailable slots
    // If locationId exists, only slots explicitly marked available by business owner can be selected
    if (locationId && !availabilitySlots.has(key)) {
      return; // Business owner has not made this time available - cannot interact
    }

    if (bookedSlotsSet.has(key)) {
      return; // Slot is already booked - cannot interact
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
      const slotDateTime = new Date(dateStart);
      slotDateTime.setHours(timeSlot.getHours(), timeSlot.getMinutes(), 0, 0);
      const slotEndDateTime = addHours(slotDateTime, 1);
      
      // Check if slot is available - disable unavailable and booked slots
      const dateKey = format(dateStart, "yyyy-MM-dd");
      const timeKey = format(timeSlot, "HH:mm");
      const key = `${dateKey}_${timeKey}`;

      // CRITICAL: Prevent dragging to unavailable slots
      if (locationId && !availabilitySlots.has(key)) {
        return; // Business owner has not made this time available - cannot drag here
      }

      if (bookedSlotsSet.has(key)) {
        return; // Slot is already booked - cannot drag here
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
      // Allow selecting all available slots regardless of event time
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

        // CRITICAL: Only allow slots that business owner has made available
        if (locationId && !availabilitySlots.has(key)) {
          continue; // Business owner has not made this time available - skip it
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

      onSlotsChange(filterSlotsByEventTime(slots));
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
          const dateKey = format(dateStart, "yyyy-MM-dd");
          
          for (let i = minIndex; i <= maxIndex; i++) {
            const isDatePast = isBefore(dateStart, today);
            const isTimePast = isSameDay(dateStart, today) && i < new Date().getHours();
            if (isDatePast || isTimePast) {
              continue;
            }

            // Check if slot is available
            const timeSlot = timeSlots[i];
            const timeKey = format(timeSlot, "HH:mm");
            const key = `${dateKey}_${timeKey}`;

            if (bookedSlotsSet.has(key)) {
              continue; // Skip booked slots
            }

            // CRITICAL: Only allow slots that business owner has made available
            if (locationId && !availabilitySlots.has(key)) {
              continue; // Business owner has not made this time available - skip it
            }

            validSlots.push(i);
          }

          if (validSlots.length === 0) {
            setIsDragging(false);
            setDragStart(null);
            setDragCurrent(null);
            return;
          }
          
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

          onSlotsChange(filterSlotsByEventTime(slots));
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
      "w-full h-[28px] border-r border-b transition-all duration-150 flex items-center justify-center text-[10px] font-medium relative group",
      {
        "bg-gradient-to-br from-green-500 to-green-600 border-green-700 text-white hover:from-green-600 hover:to-green-700 cursor-pointer shadow-sm active:scale-95": status === "selected",
        "bg-white border-gray-200 text-gray-700 hover:bg-blue-50 hover:border-blue-300 cursor-pointer active:bg-blue-100": status === "available",
        "bg-gradient-to-br from-blue-400 to-blue-500 border-blue-600 text-white cursor-pointer shadow-md ring-2 ring-blue-300": status === "dragging",
        "bg-gray-100 border-gray-200 text-gray-400 cursor-not-allowed": status === "past",
        "bg-gradient-to-br from-red-500 to-red-600 border-red-700 text-white cursor-not-allowed shadow-sm": status === "booked",
        "bg-gray-200 border-gray-300 text-gray-500 cursor-not-allowed": status === "unavailable",
      }
    );
  };

  // Get selected slots for display, combining consecutive slots across days
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
      };
    });

    // Sort all slots by start time (regardless of date)
    allSlots.sort((a, b) => a.start.getTime() - b.start.getTime());
    
    if (allSlots.length === 0) return [];

    // Combine consecutive slots across days
    const combinedRanges: Array<{ start: Date; end: Date; keys: string[] }> = [];
    
    let rangeStart = allSlots[0];
    let rangeEnd = allSlots[0];
    let rangeKeys = [rangeStart.key];
    
    for (let i = 1; i < allSlots.length; i++) {
      const currentSlot = allSlots[i];
      
      // Check if this slot is consecutive (end time of previous slot equals start time of current)
      if (rangeEnd.end.getTime() === currentSlot.start.getTime()) {
        // Extend the range (can span across days)
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
    
    // Get all available slots for this date (within availability hours, not booked, and within event time)
    const dateSlotKeys: string[] = [];
    timeSlots.forEach((timeSlot, timeIndex) => {
      // Don't include past time slots on today
      const isTimePast = isSameDay(dateStart, today) && timeIndex < new Date().getHours();
      if (isTimePast) return;

      // Allow selecting all available slots regardless of event time

      const timeKey = format(timeSlot, "HH:mm");
      const key = `${dateKey}_${timeKey}`;

      // CRITICAL: Only include slots that business owner has made available and are not booked
      if (bookedSlotsSet.has(key)) return;
      if (locationId && !availabilitySlots.has(key)) return; // Business owner has not made this time available

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

    onSlotsChange(filterSlotsByEventTime(slots));
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
    <div className="space-y-4">
      {/* Selected Slots Display */}
      {selectedSlotsList.length > 0 && (
        <div className="bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-950/20 dark:to-emerald-950/20 border border-green-200 dark:border-green-800 rounded-lg p-3">
          <div className="flex items-center justify-between mb-2">
            <h4 className="text-xs font-semibold text-green-900 dark:text-green-100 flex items-center gap-2">
              <div className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse"></div>
              Selected Time Slots ({selectedSlotsList.length})
            </h4>
          </div>
          <div 
            className="overflow-x-auto overflow-y-hidden scrollbar-thin scrollbar-thumb-green-300 scrollbar-track-transparent" 
            style={{ WebkitOverflowScrolling: 'touch' }}
            onWheel={(e) => {
              if (Math.abs(e.deltaX) > Math.abs(e.deltaY)) {
                e.stopPropagation();
              }
            }}
          >
            <div className="flex gap-2 pb-1 min-w-max">
              {selectedSlotsList.map((slot, index) => (
                <Badge 
                  key={`${slot.start.toISOString()}-${slot.end.toISOString()}-${index}`} 
                  variant="default" 
                  className="pl-3 pr-2 py-1.5 bg-green-600 hover:bg-green-700 text-white shrink-0 shadow-sm transition-all duration-200 group"
                >
                  <span className="text-xs font-medium whitespace-nowrap">
                    {(() => {
                      const isSameDate = isSameDay(slot.start, slot.end);
                      if (isSameDate) {
                        // Same day: show date once, then both times
                        return `${format(slot.start, "MMM dd, HH:mm")} - ${format(slot.end, "HH:mm")}`;
                      } else {
                        // Cross-day: show both dates and times
                        return `${format(slot.start, "MMM dd, HH:mm")} - ${format(slot.end, "MMM dd, HH:mm")}`;
                      }
                    })()}
                  </span>
                  <button
                    onClick={() => handleRemoveSlot(slot.keys)}
                    className="ml-2 rounded-full hover:bg-white/30 p-0.5 transition-colors"
                    aria-label="Remove slot"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </Badge>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Legend and Info */}
      <div className="flex items-center justify-between gap-4 pb-2 border-b">
        <div className="flex items-center gap-4 text-[10px]">
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
        {locationId && (
          <div className="text-[10px] text-muted-foreground max-w-xs text-right leading-tight">
            <span className="font-medium">Tip:</span> Unavailable times are disabled - venue owner hasn't opened them for booking
          </div>
        )}
      </div>

        {/* Week Navigation */}
        <div className="flex items-center justify-between py-2 bg-muted/30 rounded-lg px-3">
          <Button
            variant="outline"
            size="sm"
            onClick={goToPreviousWeek}
            className="h-8 px-3 flex items-center gap-1.5 hover:bg-background transition-colors"
          >
            <ChevronLeft className="h-3.5 w-3.5" />
            <span className="text-[10px] font-medium">{previousWeekRange}</span>
          </Button>
          
          <div className="flex items-center gap-2">
            <div className="text-center">
              <div className="text-xs font-semibold text-foreground">
                {format(dates[0], "MMM d")} - {format(dates[6], "MMM d, yyyy")}
              </div>
              {isThisWeek && (
                <div className="text-[9px] text-muted-foreground mt-0.5">Current Week</div>
              )}
            </div>
            {!isThisWeek && (
              <Button
                variant="ghost"
                size="sm"
                onClick={goToThisWeek}
                className="h-8 text-[10px] hover:bg-background px-2"
              >
                Today
              </Button>
            )}
          </div>

          <Button
            variant="outline"
            size="sm"
            onClick={goToNextWeek}
            className="h-8 px-3 flex items-center gap-1.5 hover:bg-background transition-colors"
          >
            <span className="text-[10px] font-medium">{nextWeekRange}</span>
            <ChevronRight className="h-3.5 w-3.5" />
          </Button>
        </div>

        {/* Calendar Grid */}
        <div className="overflow-x-auto rounded-lg border bg-white shadow-sm" ref={calendarRef}>
          <div className="inline-block min-w-full">
            <div 
              className="select-none"
              onMouseLeave={handleCalendarMouseLeave}
              style={{ 
                maxHeight: 'calc(85vh - 280px)', 
                overflowY: 'auto', 
                minHeight: '672px',
                height: '672px' // Fixed height to show all 24 hours (24 hours × 28px = 672px)
              }}
            >
              {/* Header Row - Dates */}
              <div className="grid grid-cols-[70px_repeat(7,1fr)] gap-0">
                <div className="h-10 flex items-center justify-center border-b border-r font-semibold text-xs text-foreground bg-muted/50 sticky left-0 z-10">
                  Time
                </div>
                {dates.map((date, dateIndex) => {
                  const dateStart = startOfDay(date);
                  const isDatePast = isBefore(dateStart, today);
                  const isToday = isSameDay(dateStart, today);
                  const hasSelected = hasSelectedSlots(dateIndex);
                  return (
                    <div
                      key={date.toISOString()}
                      onClick={() => !isDatePast && handleDateHeaderClick(dateIndex)}
                      className={cn(
                        "h-10 text-center font-semibold border-b border-r flex flex-col items-center justify-center transition-all duration-200",
                        {
                          "bg-muted/30 text-foreground cursor-pointer hover:bg-muted/50": !isDatePast && !hasSelected && !isToday,
                          "bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300 border-green-300 dark:border-green-700 cursor-pointer hover:bg-green-200 dark:hover:bg-green-900/40": !isDatePast && hasSelected,
                          "bg-blue-50 dark:bg-blue-950/30 border-blue-300 dark:border-blue-800 text-blue-700 dark:text-blue-300": isToday && !hasSelected,
                          "text-muted-foreground opacity-50 bg-muted/20 cursor-not-allowed": isDatePast,
                        }
                      )}
                    >
                      <div className="text-[10px] font-medium text-muted-foreground uppercase tracking-wide">
                        {format(date, "EEE")}
                      </div>
                      <div className={cn("text-sm font-semibold", {
                        "text-green-700 dark:text-green-300": hasSelected,
                        "text-blue-700 dark:text-blue-300": isToday && !hasSelected,
                      })}>
                        {format(date, "d")}
                      </div>
                      {isToday && (
                        <div className="absolute bottom-1 w-1 h-1 rounded-full bg-blue-500"></div>
                      )}
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
                      className="grid grid-cols-[75px_repeat(7,1fr)] gap-0"
                    >
                      {/* Time Label */}
                      <div className="h-[28px] flex items-center justify-end pr-2 text-[10px] font-medium text-muted-foreground border-r bg-muted/20 sticky left-0 z-10">
                        {timeLabel}
                      </div>

                      {/* Date Cells */}
                      {dates.map((date, dateIndex) => {
                        const status = getCellStatus(dateIndex, timeIndex);
                        const isDisabled = status === "unavailable" || status === "booked" || status === "past";
                        return (
                          <div
                            key={`${date.toISOString()}_${timeSlot.toISOString()}`}
                            className="h-[28px] border-r border-b"
                            onMouseDown={(e) => !isDisabled && handleMouseDown(e, dateIndex, timeIndex)}
                            onMouseEnter={() => !isDisabled && handleMouseEnter(dateIndex, timeIndex)}
                            onMouseUp={handleMouseUp}
                          >
                            <div 
                              className={getCellClassName(status)} 
                              title={
                                status === "unavailable" 
                                  ? "Not available - venue owner hasn't opened this time for booking" 
                                  : status === "booked" 
                                  ? "Already booked" 
                                  : status === "past"
                                  ? "Past time - cannot select"
                                  : status === "available"
                                  ? "Click to select this time slot"
                                  : status === "selected"
                                  ? "Selected - click to deselect"
                                  : ""
                              }
                            >
                              {status === "booked" && (
                                <span className="text-[8px] font-bold px-1 py-0.5 bg-red-700 rounded leading-tight">BOOKED</span>
                              )}
                              {status === "unavailable" && (
                                <span className="text-[8px] px-1 text-gray-500">—</span>
                              )}
                              {status === "selected" && (
                                <div className="absolute inset-0 flex items-center justify-center">
                                  <div className="w-1.5 h-1.5 rounded-full bg-white"></div>
                                </div>
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
      </div>
  );
}