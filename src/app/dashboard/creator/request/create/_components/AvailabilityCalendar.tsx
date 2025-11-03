"use client";

import { useState, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { X, ChevronLeft, ChevronRight } from "lucide-react";
import { format, addDays, addHours, addWeeks, startOfDay, startOfWeek, parseISO, subWeeks } from "date-fns";
import { cn } from "@/lib/utils";

interface AvailabilityCalendarProps {
  onSlotsChange: (slots: Array<{ startDateTime: Date; endDateTime: Date }>) => void;
  initialSlots?: Array<{ startDateTime: Date; endDateTime: Date }>;
  bookedSlots?: Array<{ startDateTime: Date; endDateTime: Date }>;
  unavailableSlots?: Array<{ startDateTime: Date; endDateTime: Date }>;
}

type CellStatus = "available" | "selected" | "booked" | "unavailable";

export function AvailabilityCalendar({
  onSlotsChange,
  initialSlots = [],
  bookedSlots = [],
  unavailableSlots = [],
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

  // Generate time slots (1-hour intervals from 9 AM to 9 PM)
  const timeSlots = useMemo(() => {
    const baseDate = new Date();
    baseDate.setHours(9, 0, 0, 0);
    return Array.from({ length: 13 }, (_, i) => addHours(baseDate, i));
  }, []);

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

  // Create lookup sets for booked and unavailable slots
  const bookedSlotsSet = useMemo(() => {
    const set = new Set<string>();
    bookedSlots.forEach((slot) => {
      const start = new Date(slot.startDateTime);
      const dateKey = format(startOfDay(start), "yyyy-MM-dd");
      const timeKey = format(start, "HH:mm");
      set.add(`${dateKey}_${timeKey}`);
    });
    return set;
  }, [bookedSlots]);

  const unavailableSlotsSet = useMemo(() => {
    const set = new Set<string>();
    unavailableSlots.forEach((slot) => {
      const start = new Date(slot.startDateTime);
      const dateKey = format(startOfDay(start), "yyyy-MM-dd");
      const timeKey = format(start, "HH:mm");
      set.add(`${dateKey}_${timeKey}`);
    });
    return set;
  }, [unavailableSlots]);

  // Get cell status
  const getCellStatus = (date: Date, timeSlot: Date): CellStatus => {
    const dateKey = format(startOfDay(date), "yyyy-MM-dd");
    const timeKey = format(timeSlot, "HH:mm");
    const key = `${dateKey}_${timeKey}`;

    if (unavailableSlotsSet.has(key)) return "unavailable";
    if (bookedSlotsSet.has(key)) return "booked";
    if (selectedSlots.has(key)) return "selected";
    return "available";
  };

  // Handle cell click
  const handleCellClick = (date: Date, timeSlot: Date) => {
    const dateKey = format(startOfDay(date), "yyyy-MM-dd");
    const timeKey = format(timeSlot, "HH:mm");
    const key = `${dateKey}_${timeKey}`;

    const status = getCellStatus(date, timeSlot);

    // Don't allow selection of booked or unavailable slots
    if (status === "booked" || status === "unavailable") {
      return;
    }

    const newSelectedSlots = new Set(selectedSlots);
    if (status === "selected") {
      newSelectedSlots.delete(key);
    } else {
      newSelectedSlots.add(key);
    }

    setSelectedSlots(newSelectedSlots);

    // Convert selected slots to date ranges and notify parent
    const slots = Array.from(newSelectedSlots).map((slotKey) => {
      const [dateStr, timeStr] = slotKey.split("_");
      const [hours, minutes] = timeStr.split(":").map(Number);
      const date = parseISO(dateStr);
      date.setHours(hours, minutes, 0, 0);
      
      // Each slot is 1 hour
      const endDate = addHours(date, 1);
      
      return {
        startDateTime: date,
        endDateTime: endDate,
      };
    });

    onSlotsChange(slots);
  };

  // Get cell class names
  const getCellClassName = (status: CellStatus) => {
    return cn(
      "w-full h-full rounded border cursor-pointer transition-all hover:opacity-80 flex items-center justify-center text-[8px] font-medium",
      {
        "bg-green-500 border-green-600 text-white": status === "selected",
        "bg-white border-gray-200 text-gray-700": status === "available",
        "bg-red-500 border-red-600 text-white": status === "booked",
        "bg-gray-300 border-gray-400 text-gray-600 cursor-not-allowed": status === "unavailable",
      }
    );
  };

  // Get selected slots for display
  const selectedSlotsList = useMemo(() => {
    return Array.from(selectedSlots).map((slotKey) => {
      const [dateStr, timeStr] = slotKey.split("_");
      const [hours, minutes] = timeStr.split(":").map(Number);
      const date = parseISO(dateStr);
      date.setHours(hours, minutes, 0, 0);
      const endDate = addHours(date, 1);
      return { start: date, end: endDate, key: slotKey };
    });
  }, [selectedSlots]);

  const handleRemoveSlot = (slotKey: string) => {
    const newSelectedSlots = new Set(selectedSlots);
    newSelectedSlots.delete(slotKey);
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

  // Check if current week is this week
  const isThisWeek = useMemo(() => {
    const today = startOfDay(new Date());
    const thisWeekStart = startOfWeek(today, { weekStartsOn: 1 });
    return format(currentWeekStart, "yyyy-MM-dd") === format(thisWeekStart, "yyyy-MM-dd");
  }, [currentWeekStart]);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Select Event Times</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Legend - Moved to top */}
        <div className="flex items-center justify-center gap-6 text-xs pb-2 border-b">
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
            <div className="w-3 h-3 rounded bg-gray-300 border border-gray-400"></div>
            <span>Unavailable</span>
          </div>
        </div>

        {/* Week Navigation */}
        <div className="flex items-center justify-between">
          <Button
            variant="outline"
            size="sm"
            onClick={goToPreviousWeek}
            className="h-8"
          >
            <ChevronLeft className="h-4 w-4" />
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
            className="h-8"
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>

        {/* Selected Slots Display */}
        {selectedSlotsList.length > 0 && (
          <div className="space-y-2">
            <h4 className="text-sm font-medium">Selected Time Slots:</h4>
            <div className="flex flex-wrap gap-2">
              {selectedSlotsList.map((slot) => (
                <Badge key={slot.key} variant="default" className="pl-3 pr-2 py-2 bg-green-500">
                  <span className="text-xs">
                    {format(slot.start, "MMM dd, HH:mm")} -{" "}
                    {format(slot.end, "HH:mm")}
                  </span>
                  <button
                    onClick={() => handleRemoveSlot(slot.key)}
                    className="ml-2 rounded-full hover:bg-white/20 p-0.5"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </Badge>
              ))}
            </div>
          </div>
        )}

        {/* Calendar Grid */}
        <div className="overflow-x-auto">
          <div className="inline-block min-w-full">
            <div className="border rounded-lg bg-gray-50 p-2">
              {/* Header Row - Dates */}
              <div className="grid grid-cols-[60px_repeat(7,1fr)] gap-1 mb-1">
                <div></div>
                {dates.map((date) => (
                  <div
                    key={date.toISOString()}
                    className="text-center font-semibold text-[10px]"
                  >
                    {format(date, "d/M")}
                  </div>
                ))}
              </div>

              {/* Time Slot Rows */}
              <div className="space-y-0.5">
                {timeSlots.map((timeSlot) => {
                  const timeLabel = `${format(timeSlot, "HH")}h-${format(addHours(timeSlot, 1), "HH")}h`;
                  return (
                    <div
                      key={timeSlot.toISOString()}
                      className="grid grid-cols-[60px_repeat(7,1fr)] gap-1"
                    >
                      {/* Time Label */}
                      <div className="flex items-center justify-end pr-1 text-[9px] font-medium text-gray-600">
                        {timeLabel}
                      </div>

                      {/* Date Cells */}
                      {dates.map((date) => {
                        const status = getCellStatus(date, timeSlot);
                        return (
                          <div
                            key={`${date.toISOString()}_${timeSlot.toISOString()}`}
                            className="aspect-square min-h-[20px]"
                            onClick={() => handleCellClick(date, timeSlot)}
                          >
                            <div className={getCellClassName(status)}>
                              {status === "booked" && (
                                <span className="text-[7px] px-0.5 leading-tight">BOOKED</span>
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
