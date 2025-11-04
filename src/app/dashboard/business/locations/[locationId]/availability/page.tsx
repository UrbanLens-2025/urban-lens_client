"use client";

import { use, useMemo, useState, useEffect, useRef, useCallback } from "react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { cn } from "@/lib/utils";
import { format } from "date-fns";

// Mock data structure for weekly availability slots
interface WeeklyAvailabilitySlot {
  dayOfWeek: number; // 0 = Monday, 6 = Sunday
  startHour: number; // 0-23
  endHour: number; // 0-23 (exclusive, so 7-11 means 7 AM to 11 AM)
}

// Mock saved availability data
const MOCK_SAVED_AVAILABILITY: WeeklyAvailabilitySlot[] = [
  { dayOfWeek: 0, startHour: 7, endHour: 11 }, // Mon 7-11 AM
  { dayOfWeek: 0, startHour: 14, endHour: 17 }, // Mon 2-5 PM
  { dayOfWeek: 2, startHour: 9, endHour: 17 }, // Wed 9 AM-5 PM
  { dayOfWeek: 4, startHour: 10, endHour: 18 }, // Fri 10 AM-6 PM
];

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

type CellStatus = "available" | "saved";

export default function AvailabilityPage({
  params,
}: {
  params: Promise<{ locationId: string }>;
}) {
  const { locationId } = use(params);

  // Availability slots
  const [availability, setAvailability] = useState<WeeklyAvailabilitySlot[]>(
    MOCK_SAVED_AVAILABILITY
  );

  // Track which cells are selected (day_hour format: "0_7" = Monday 7 AM)
  const [selectedCells, setSelectedCells] = useState<Set<string>>(new Set());

  // Dialog state
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [slotsToConfirm, setSlotsToConfirm] = useState<WeeklyAvailabilitySlot[]>([]);
  
  // Track if we should show dialog after selection
  const selectionTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Track if user is dragging to select multiple cells
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState<{ day: number; hour: number } | null>(null);
  const isDraggingRef = useRef(false);
  const dragStartRef = useRef<{ day: number; hour: number } | null>(null);
  const hasMovedRef = useRef(false); // Track if mouse moved during drag

  // Convert availability slots to a set of cell keys for quick lookup
  const availabilityCellsSet = useMemo(() => {
    const set = new Set<string>();
    availability.forEach((slot) => {
      for (let hour = slot.startHour; hour < slot.endHour; hour++) {
        set.add(`${slot.dayOfWeek}_${hour}`);
      }
    });
    return set;
  }, [availability]);

  // Get cell status
  const getCellStatus = (day: number, hour: number): CellStatus => {
    const key = `${day}_${hour}`;
    
    if (availabilityCellsSet.has(key)) return "saved";
    return "available";
  };

  // Round hour to nearest integer (already handled since we use 0-23, but ensure no decimals)
  const roundHour = (hour: number): number => {
    return Math.round(hour);
  };


  // Handle mouse down (start drag)
  const handleMouseDown = (day: number, hour: number, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    const roundedHour = roundHour(hour);
    const key = `${day}_${roundedHour}`;
    
    // Don't allow dragging from already saved cells
    if (availabilityCellsSet.has(key)) {
      return;
    }
    
    const dragStartValue = { day, hour: roundedHour };
    setIsDragging(true);
    setDragStart(dragStartValue);
    isDraggingRef.current = true;
    dragStartRef.current = dragStartValue;
    hasMovedRef.current = false; // Reset move flag
    setSelectedCells(new Set([key]));
  };

  // Handle mouse enter (during drag)
  const handleMouseEnter = (day: number, hour: number) => {
    // Check if we're dragging using refs for immediate access
    if (!isDraggingRef.current || !dragStartRef.current) return;

    // Mark that mouse has moved (so it's a drag, not a click)
    hasMovedRef.current = true;

    const roundedHour = roundHour(hour);
    const newSelectedCells = new Set<string>();

    // Select all cells between drag start and current position
    const startDay = Math.min(dragStartRef.current.day, day);
    const endDay = Math.max(dragStartRef.current.day, day);
    const startHour = Math.min(dragStartRef.current.hour, roundedHour);
    const endHour = Math.max(dragStartRef.current.hour, roundedHour);

    for (let d = startDay; d <= endDay; d++) {
      for (let h = startHour; h <= endHour; h++) {
        const key = `${d}_${h}`;
        // Only allow selecting cells that aren't already saved
        if (!availabilityCellsSet.has(key)) {
          newSelectedCells.add(key);
        }
      }
    }

    setSelectedCells(newSelectedCells);
  };

  // Process a specific set of selected cells
  const processSelectedCellsWithSet = useCallback((cellsToProcess: Set<string>) => {
    if (cellsToProcess.size === 0) return;

    // Group consecutive hours per day into slots
    const slotsByDay = new Map<number, number[]>();

    cellsToProcess.forEach((key) => {
      const [dayStr, hourStr] = key.split("_");
      const day = parseInt(dayStr, 10);
      const hour = parseInt(hourStr, 10);

      if (!slotsByDay.has(day)) {
        slotsByDay.set(day, []);
      }
      slotsByDay.get(day)!.push(hour);
    });

    // Create slots from consecutive hours
    const newSlots: WeeklyAvailabilitySlot[] = [];
    slotsByDay.forEach((hours, day) => {
      if (hours.length === 0) return;
      
      hours.sort((a, b) => a - b);

      let startHour = hours[0];
      for (let i = 1; i < hours.length; i++) {
        if (hours[i] !== hours[i - 1] + 1) {
          // Gap found, create slot
          newSlots.push({
            dayOfWeek: day,
            startHour,
            endHour: hours[i - 1] + 1,
          });
          startHour = hours[i];
        }
      }
      // Add final slot
      newSlots.push({
        dayOfWeek: day,
        startHour,
        endHour: hours[hours.length - 1] + 1,
      });
    });

    // Show confirmation dialog
    setSlotsToConfirm(newSlots);
    setShowConfirmDialog(true);
  }, [availabilityCellsSet]);

  // Process selected cells and show confirmation dialog
  const processSelectedCells = () => {
    if (selectedCells.size === 0) return;
    processSelectedCellsWithSet(selectedCells);
  };

  // Handle mouse up (end drag) - show confirmation dialog after a short delay
  const handleMouseUp = useCallback(() => {
    const wasDragging = isDraggingRef.current;
    const hadMoved = hasMovedRef.current;
    const currentSelectedCells = new Set(selectedCells); // Capture current state
    
    setIsDragging(false);
    setDragStart(null);
    isDraggingRef.current = false;
    dragStartRef.current = null;

    // If mouse moved during drag, or if we have multiple selected cells, it was a drag
    const shouldProcess = (wasDragging && hadMoved) || currentSelectedCells.size > 1;

    if (shouldProcess && currentSelectedCells.size > 0) {
      // Clear any existing timeout
      if (selectionTimeoutRef.current) {
        clearTimeout(selectionTimeoutRef.current);
      }
      
      // Show dialog after a short delay to allow for smooth interaction
      selectionTimeoutRef.current = setTimeout(() => {
        processSelectedCellsWithSet(currentSelectedCells);
      }, 100);
    }

    // Reset move flag
    hasMovedRef.current = false;
  }, [selectedCells, processSelectedCellsWithSet]);

  // Handle single cell click - show dialog immediately
  const handleCellClick = (day: number, hour: number) => {
    // If mouse moved during the interaction, it was a drag, not a click
    // In that case, handleMouseUp will handle it
    if (hasMovedRef.current || isDraggingRef.current) {
      return;
    }

    const roundedHour = roundHour(hour);
    const key = `${day}_${roundedHour}`;

    // Don't allow selecting already saved cells
    if (availabilityCellsSet.has(key)) {
      return;
    }

    // If clicking on a single cell, select just that one and show dialog
    const newSelectedCells = new Set([key]);
    setSelectedCells(newSelectedCells);

    // Process and show dialog immediately for single clicks
    setTimeout(() => {
      // Use the current selectedCells state
      const currentSelected = new Set([key]);
      processSelectedCellsWithSet(currentSelected);
    }, 50);
  };

  // Format hour for display
  const formatHour = (hour: number): string => {
    return `${String(hour).padStart(2, '0')}:00`;
  };

  // Confirm and add availability slots
  const handleConfirmAdd = () => {
    // TODO: Replace with actual API call
    console.log("Adding availability:", {
      locationId,
      slots: slotsToConfirm,
    });

    // Add to availability
    setAvailability((prev) => [...prev, ...slotsToConfirm]);
    
    // Reset state
    setSelectedCells(new Set());
    setShowConfirmDialog(false);
    setSlotsToConfirm([]);
  };

  // Cancel dialog
  const handleCancelDialog = () => {
    setSelectedCells(new Set());
    setShowConfirmDialog(false);
    setSlotsToConfirm([]);
  };

  // Get cell class names
  const getCellClassName = (status: CellStatus, isSelected: boolean) => {
    return cn(
      "w-full h-full rounded border cursor-pointer transition-all hover:opacity-80 flex items-center justify-center text-[8px] font-medium",
      {
        "bg-green-500 border-green-600 text-white": status === "saved",
        "bg-blue-400 border-blue-500 text-white": isSelected && status === "available",
        "bg-white border-gray-200 text-gray-700": !isSelected && status === "available",
      }
    );
  };

  // Format hour range for display in military time (e.g., "01:00 - 02:00")
  const formatHourRange = (hour: number): string => {
    const formatSingleHour = (h: number): string => {
      return `${String(h).padStart(2, '0')}:00`;
    };
    
    const nextHour = (hour + 1) % 24;
    return `${formatSingleHour(hour)} - ${formatSingleHour(nextHour)}`;
  };

  // Add global mouse up handler to end dragging
  useEffect(() => {
    const handleGlobalMouseUp = () => {
      handleMouseUp();
    };

    window.addEventListener("mouseup", handleGlobalMouseUp);
    return () => {
      window.removeEventListener("mouseup", handleGlobalMouseUp);
      if (selectionTimeoutRef.current) {
        clearTimeout(selectionTimeoutRef.current);
      }
    };
  }, [handleMouseUp]);

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Manage Weekly Availability</CardTitle>
              <CardDescription>
                Set your recurring weekly availability. Click or drag to select time slots. A confirmation dialog will appear to add the selected time ranges.
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Legend */}
          <div className="flex items-center justify-center gap-6 text-xs pb-2 border-b">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded bg-green-500 border border-green-600"></div>
              <span>Available</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded bg-blue-400 border border-blue-500"></div>
              <span>Selected</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded bg-white border border-gray-200"></div>
              <span>Empty</span>
            </div>
          </div>

          {/* Weekly Grid */}
          <div className="overflow-x-auto">
            <div className="inline-block min-w-full">
              <div className="border rounded-lg bg-gray-50 p-2">
                {/* Header Row - Days of Week */}
                <div className="grid grid-cols-[80px_repeat(7,1fr)] gap-1 mb-1">
                  <div></div>
                  {DAYS_OF_WEEK.map((day, index) => (
                    <div
                      key={index}
                      className="text-center font-semibold text-sm py-2"
                    >
                      {day.slice(0, 3)}
                    </div>
                  ))}
                </div>

                {/* Time Slot Rows */}
                <div className="space-y-0.5">
                  {HOURS.map((hour) => {
                    const isNightTime = hour >= 20 || hour <= 5;
                    return (
                      <div
                        key={hour}
                        className={cn(
                          "grid grid-cols-[90px_repeat(7,1fr)] gap-1",
                          isNightTime && "bg-gray-100/50"
                        )}
                        onMouseUp={(e) => {
                          e.stopPropagation();
                          handleMouseUp();
                        }}
                      >
                        {/* Time Label */}
                        <div className="flex items-center justify-center pr-2 text-xs font-medium text-gray-600">
                          {formatHourRange(hour)}
                        </div>

                        {/* Day Cells */}
                        {DAYS_OF_WEEK.map((_, dayIndex) => {
                          const status = getCellStatus(dayIndex, hour);
                          const key = `${dayIndex}_${hour}`;
                          const isSelected = selectedCells.has(key);

                          return (
                            <div
                              key={`${dayIndex}_${hour}`}
                              className="h-[20px] select-none"
                              onClick={() => handleCellClick(dayIndex, hour)}
                              onMouseDown={(e) => handleMouseDown(dayIndex, hour, e)}
                              onMouseEnter={() => handleMouseEnter(dayIndex, hour)}
                            >
                              <div className={getCellClassName(status, isSelected)}></div>
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

      {/* Confirmation Dialog */}
      <Dialog open={showConfirmDialog} onOpenChange={setShowConfirmDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add Availability</DialogTitle>
            <DialogDescription>
              Confirm adding the following time ranges to your weekly availability:
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-2 py-4">
            {slotsToConfirm.map((slot, index) => (
              <div
                key={index}
                className="flex items-center justify-between p-2 bg-gray-50 rounded"
              >
                <div className="font-medium">
                  {DAYS_OF_WEEK[slot.dayOfWeek]}
                </div>
                <div className="text-sm text-gray-600">
                  {formatHour(slot.startHour)} - {formatHour(slot.endHour)}
                </div>
              </div>
            ))}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={handleCancelDialog}>
              Cancel
            </Button>
            <Button onClick={handleConfirmAdd}>
              Confirm
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
