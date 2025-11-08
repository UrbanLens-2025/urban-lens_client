"use client";

import { use, useMemo, useState, useEffect, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
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
import { Loader2, Pencil, Trash2, ChevronLeft, ChevronRight, CalendarDays, Clock, Layers } from "lucide-react";
import { useWeeklyAvailabilities } from "@/hooks/availability/useWeeklyAvailabilities";
import { useCreateWeeklyAvailability } from "@/hooks/availability/useCreateWeeklyAvailability";
import { useDeleteAvailability } from "@/hooks/availability/useDeleteAvailability";
import { useUpdateWeeklyAvailability } from "@/hooks/availability/useUpdateWeeklyAvailability";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import type { WeeklyAvailabilityResponse } from "@/api/availability";
import { Badge } from "@/components/ui/badge";

// Internal data structure for weekly availability slots
interface WeeklyAvailabilitySlot {
  id?: number; // API ID for deletion
  dayOfWeek: number; // 0 = Monday, 6 = Sunday
  startHour: number; // 0-23
  endHour: number; // 0-23 (exclusive, so 7-11 means 7 AM to 11 AM)
}

// Day of week mapping: API string -> internal number (0=Monday, 6=Sunday)
const DAY_OF_WEEK_MAP: Record<string, number> = {
  MONDAY: 0,
  TUESDAY: 1,
  WEDNESDAY: 2,
  THURSDAY: 3,
  FRIDAY: 4,
  SATURDAY: 5,
  SUNDAY: 6,
};

const DAY_OF_WEEK_REVERSE_MAP: Record<number, string> = {
  0: "MONDAY",
  1: "TUESDAY",
  2: "WEDNESDAY",
  3: "THURSDAY",
  4: "FRIDAY",
  5: "SATURDAY",
  6: "SUNDAY",
};

// Transform API response to internal format
const transformApiResponse = (apiData: WeeklyAvailabilityResponse[]): WeeklyAvailabilitySlot[] => {
  return apiData.map((item) => {
    // Parse time strings like "11:00" to hour numbers
    const startHour = parseInt(item.startTime.split(":")[0], 10);
    const endHour = parseInt(item.endTime.split(":")[0], 10);

    return {
      id: item.id,
      dayOfWeek: DAY_OF_WEEK_MAP[item.dayOfWeek],
      startHour,
      endHour,
    };
  });
};

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
  const router = useRouter();

  // Fetch weekly availability from API
  const { data: apiAvailability, isLoading } = useWeeklyAvailabilities(locationId);
  const { mutate: createWeeklyAvailability, isPending: isCreating } = useCreateWeeklyAvailability();
  const { mutate: deleteAvailability, isPending: isDeleting } = useDeleteAvailability(locationId);
  const { mutate: updateWeeklyAvailability, isPending: isUpdating } = useUpdateWeeklyAvailability(locationId);

  // Transform API data to internal format
  const availability = useMemo(() => {
    if (!apiAvailability) return [];
    return transformApiResponse(apiAvailability);
  }, [apiAvailability]);

  // Track which cells are selected (day_hour format: "0_7" = Monday 7 AM)
  const [selectedCells, setSelectedCells] = useState<Set<string>>(new Set());

  // Dialog state
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [slotsToConfirm, setSlotsToConfirm] = useState<WeeklyAvailabilitySlot[]>([]);

  // Edit/Delete dialog state
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [slotToEdit, setSlotToEdit] = useState<WeeklyAvailabilitySlot | null>(null);
  const [editedStartHour, setEditedStartHour] = useState<number>(0);
  const [editedEndHour, setEditedEndHour] = useState<number>(0);
  const [editErrors, setEditErrors] = useState<{ start?: string; end?: string; overlap?: string }>({});

  // Track hovered block for highlighting
  const [hoveredBlock, setHoveredBlock] = useState<WeeklyAvailabilitySlot | null>(null);
  const hoverTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Track if we should show dialog after selection
  const selectionTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Track if user is dragging to select multiple cells
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState<{ day: number; hour: number } | null>(null);
  const isDraggingRef = useRef(false);
  const dragStartRef = useRef<{ day: number; hour: number } | null>(null);
  const hasMovedRef = useRef(false); // Track if mouse moved during drag

  // Track resize state (resizing an existing slot)
  const [isResizing, setIsResizing] = useState(false);
  const [resizeSlot, setResizeSlot] = useState<WeeklyAvailabilitySlot | null>(null);
  const [resizeEdge, setResizeEdge] = useState<"start" | "end" | null>(null);
  const isResizingRef = useRef(false);
  const resizeSlotRef = useRef<WeeklyAvailabilitySlot | null>(null);
  const resizeEdgeRef = useRef<"start" | "end" | null>(null);

  // Local state for availability (for mock updates during resize)
  const [localAvailability, setLocalAvailability] = useState<WeeklyAvailabilitySlot[]>([]);

  // Sync local availability with API data
  useEffect(() => {
    if (apiAvailability) {
      setLocalAvailability(transformApiResponse(apiAvailability));
    }
  }, [apiAvailability]);

  // Use local availability for rendering
  const displayAvailability = localAvailability.length > 0 ? localAvailability : availability;

  const weeklyStats = useMemo(() => {
    if (displayAvailability.length === 0) {
      return {
        totalHours: 0,
        activeDays: 0,
        slotCount: 0,
        longestBlock: 0,
      };
    }

    const activeDaysSet = new Set<number>();
    let totalHours = 0;
    let longestBlock = 0;

    displayAvailability.forEach((slot) => {
      activeDaysSet.add(slot.dayOfWeek);
      const duration = slot.endHour - slot.startHour;
      totalHours += duration;
      if (duration > longestBlock) {
        longestBlock = duration;
      }
    });

    return {
      totalHours,
      activeDays: activeDaysSet.size,
      slotCount: displayAvailability.length,
      longestBlock,
    };
  }, [displayAvailability]);

  // Convert availability slots to a set of cell keys for quick lookup
  const availabilityCellsSet = useMemo(() => {
    const set = new Set<string>();
    displayAvailability.forEach((slot) => {
      for (let hour = slot.startHour; hour < slot.endHour; hour++) {
        set.add(`${slot.dayOfWeek}_${hour}`);
      }
    });
    return set;
  }, [displayAvailability]);

  // Get the slot that contains a specific cell
  const getSlotAtCell = (day: number, hour: number): WeeklyAvailabilitySlot | null => {
    return displayAvailability.find(
      (slot) => slot.dayOfWeek === day && hour >= slot.startHour && hour < slot.endHour
    ) || null;
  };

  // Check if a cell is on the left edge (startHour) or right edge (endHour) of a slot
  const getEdgeAtCell = (day: number, hour: number): "start" | "end" | null => {
    const slot = getSlotAtCell(day, hour);
    if (!slot) return null;

    if (hour === slot.startHour) return "start";
    if (hour === slot.endHour - 1) return "end";
    return null;
  };

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


  // Handle mouse down (start drag or resize)
  const handleMouseDown = (day: number, hour: number, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    const roundedHour = roundHour(hour);
    const key = `${day}_${roundedHour}`;

    // Check if we're on an edge of an existing slot (resize mode)
    const edge = getEdgeAtCell(day, roundedHour);
    if (edge) {
      const slot = getSlotAtCell(day, roundedHour);
      if (slot) {
        setIsResizing(true);
        setResizeSlot(slot);
        setResizeEdge(edge);
        isResizingRef.current = true;
        resizeSlotRef.current = slot;
        resizeEdgeRef.current = edge;
        hasMovedRef.current = false;
        return;
      }
    }

    // Don't allow dragging from already saved cells (unless we're resizing)
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

  // Handle mouse enter (during drag or resize)
  const handleMouseEnter = (day: number, hour: number) => {
    // Check if we're resizing
    if (isResizingRef.current && resizeSlotRef.current && resizeEdgeRef.current) {
      hasMovedRef.current = true;
      const roundedHour = roundHour(hour);

      // Only allow resizing within the same day
      if (resizeSlotRef.current.dayOfWeek !== day) {
        return;
      }

      // Get the current slot from local state (it may have been updated)
      const currentSlot = localAvailability.find((s) => s.id === resizeSlotRef.current?.id);
      if (!currentSlot) return;

      // Update the slot based on which edge is being dragged
      let newStartHour = currentSlot.startHour;
      let newEndHour = currentSlot.endHour;

      if (resizeEdgeRef.current === "start") {
        // Resizing the start edge
        newStartHour = Math.min(roundedHour, currentSlot.endHour - 1);
        // Ensure minimum 1 hour duration
        if (newStartHour >= currentSlot.endHour) {
          newStartHour = currentSlot.endHour - 1;
        }
      } else {
        // Resizing the end edge
        newEndHour = Math.max(roundedHour + 1, currentSlot.startHour + 1);
        // Ensure minimum 1 hour duration
        if (newEndHour <= currentSlot.startHour) {
          newEndHour = currentSlot.startHour + 1;
        }
      }

      // Check for overlaps with other slots (excluding the current slot being resized)
      const otherSlots = displayAvailability.filter((s) => s.id !== currentSlot.id);
      let hasOverlap = false;

      for (let h = newStartHour; h < newEndHour; h++) {
        const key = `${day}_${h}`;
        // Check if this hour is in any other slot
        for (const otherSlot of otherSlots) {
          if (otherSlot.dayOfWeek === day && h >= otherSlot.startHour && h < otherSlot.endHour) {
            hasOverlap = true;
            break;
          }
        }
        if (hasOverlap) break;
      }

      // If no overlap, update the slot
      if (!hasOverlap) {
        setLocalAvailability((prev) =>
          prev.map((s) =>
            s.id === currentSlot.id
              ? { ...s, startHour: newStartHour, endHour: newEndHour }
              : s
          )
        );
      }

      return;
    }

    // Check if we're dragging using refs for immediate access
    if (!isDraggingRef.current || !dragStartRef.current) return;

    // Only allow selecting cells within the same day as the drag start
    if (dragStartRef.current.day !== day) {
      return;
    }

    // Mark that mouse has moved (so it's a drag, not a click)
    hasMovedRef.current = true;

    const roundedHour = roundHour(hour);
    const newSelectedCells = new Set<string>();

    // Select all cells between drag start and current position (same day only)
    const startHour = Math.min(dragStartRef.current.hour, roundedHour);
    const endHour = Math.max(dragStartRef.current.hour, roundedHour);

    // Check if any cell in the range overlaps with existing availability
    let hasOverlap = false;
    for (let h = startHour; h <= endHour; h++) {
      const key = `${day}_${h}`;
      if (availabilityCellsSet.has(key)) {
        hasOverlap = true;
        break;
      }
    }

    // If there's an overlap, don't allow the selection
    if (hasOverlap) {
      return;
    }

    // Only allow selecting cells that aren't already saved
    for (let h = startHour; h <= endHour; h++) {
      const key = `${day}_${h}`;
      if (!availabilityCellsSet.has(key)) {
        newSelectedCells.add(key);
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

  const hasSelection = selectedCells.size > 0;
  const clearSelection = useCallback(() => setSelectedCells(new Set()), []);

  // Handle mouse up (end drag or resize) - show confirmation dialog after a short delay
  const handleMouseUp = useCallback(() => {
    // Handle resize end
    if (isResizingRef.current && resizeSlotRef.current) {
      const finalSlot = localAvailability.find((s) => s.id === resizeSlotRef.current?.id);
      // Use 'availability' (original API data) instead of 'displayAvailability' which may have been updated
      const originalSlot = availability.find((s) => s.id === resizeSlotRef.current?.id);

      if (finalSlot && originalSlot) {
        // Always open edit dialog after resize (even if no change, user can see and adjust)
        // Set slotToEdit to the ORIGINAL slot (for ID and comparison), but edited values to the resized ones
        setSlotToEdit(originalSlot);
        setEditedStartHour(finalSlot.startHour);
        setEditedEndHour(finalSlot.endHour);
        setEditErrors({});
        setShowEditDialog(true);
      }

      // Reset resize state
      setIsResizing(false);
      isResizingRef.current = false;
      resizeSlotRef.current = null;
      resizeEdgeRef.current = null;
      hasMovedRef.current = false;
      return;
    }

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
  }, [selectedCells, processSelectedCellsWithSet, localAvailability]);

  // Find the block of saved cells in the same day starting from a given hour
  const findSavedBlockInDay = (day: number, startHour: number): WeeklyAvailabilitySlot | null => {
    // Find the slot that contains this hour
    const matchingSlot = displayAvailability.find((slot) => {
      return slot.dayOfWeek === day && startHour >= slot.startHour && startHour < slot.endHour;
    });

    return matchingSlot || null;
  };

  // Convert internal format to API format for creation (single entry)
  const convertToApiFormat = (slot: WeeklyAvailabilitySlot) => {
    return {
      dayOfWeek: DAY_OF_WEEK_REVERSE_MAP[slot.dayOfWeek] as "MONDAY" | "TUESDAY" | "WEDNESDAY" | "THURSDAY" | "FRIDAY" | "SATURDAY" | "SUNDAY",
      startTime: `${String(slot.startHour).padStart(2, '0')}:00`,
      endTime: `${String(slot.endHour).padStart(2, '0')}:00`,
    };
  };

  // Handle single cell click - show dialog immediately
  const handleCellClick = (day: number, hour: number) => {
    // If we were resizing, don't treat it as a click
    if (isResizingRef.current || hasMovedRef.current || isDraggingRef.current) {
      return;
    }

    const roundedHour = roundHour(hour);
    const key = `${day}_${roundedHour}`;

    // If clicking on a saved cell (and not on an edge), show edit dialog
    if (availabilityCellsSet.has(key)) {
      const edge = getEdgeAtCell(day, roundedHour);
      // Only show edit dialog if not clicking on an edge
      if (!edge) {
        const block = findSavedBlockInDay(day, roundedHour);
        if (block) {
          setSlotToEdit(block);
          setEditedStartHour(block.startHour);
          setEditedEndHour(block.endHour);
          setEditErrors({});
          setShowEditDialog(true);
        }
      }
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

  // Confirm and add availability slots (one at a time)
  const handleConfirmAdd = () => {
    if (slotsToConfirm.length === 0) return;

    // Create availability entries one by one
    const createSequentially = async () => {
      for (const slot of slotsToConfirm) {
        const apiPayload = {
          locationId,
          ...convertToApiFormat(slot),
        };

        await new Promise<void>((resolve, reject) => {
          createWeeklyAvailability(apiPayload, {
            onSuccess: () => resolve(),
            onError: (err) => reject(err),
          });
        });
      }

      // Reset state after all creations
      setSelectedCells(new Set());
      setShowConfirmDialog(false);
      setSlotsToConfirm([]);
    };

    createSequentially();
  };

  // Cancel dialog
  const handleCancelDialog = () => {
    setSelectedCells(new Set());
    setShowConfirmDialog(false);
    setSlotsToConfirm([]);
  };

  // Validate edited times
  const validateEditedTimes = (startHour: number, endHour: number, dayOfWeek: number, slotId?: number): { start?: string; end?: string; overlap?: string } => {
    const errors: { start?: string; end?: string; overlap?: string } = {};

    // Check minimum duration (1 hour)
    if (startHour >= endHour) {
      errors.end = "End time must be after start time";
      return errors;
    }

    if (endHour - startHour < 1) {
      errors.end = "Minimum duration is 1 hour";
      return errors;
    }

    // Check bounds (0-23)
    if (startHour < 0 || startHour > 23) {
      errors.start = "Start time must be between 00:00 and 23:00";
    }

    if (endHour < 1 || endHour > 24) {
      errors.end = "End time must be between 01:00 and 24:00";
    }

    // Check for overlaps with other slots (excluding the current slot)
    const otherSlots = displayAvailability.filter((s) => s.id !== slotId);
    for (let h = startHour; h < endHour; h++) {
      for (const otherSlot of otherSlots) {
        if (otherSlot.dayOfWeek === dayOfWeek && h >= otherSlot.startHour && h < otherSlot.endHour) {
          errors.overlap = `Overlaps with existing availability on ${DAYS_OF_WEEK[otherSlot.dayOfWeek]} (${formatHour(otherSlot.startHour)} - ${formatHour(otherSlot.endHour)})`;
          return errors;
        }
      }
    }

    return errors;
  };

  // Handle time input change
  const handleStartTimeChange = (value: string) => {
    const hour = parseInt(value, 10);
    if (isNaN(hour)) {
      return; // Allow empty input while typing
    }
    const clampedHour = Math.max(0, Math.min(23, hour));
    setEditedStartHour(clampedHour);
  };

  const handleEndTimeChange = (value: string) => {
    const hour = parseInt(value, 10);
    if (isNaN(hour)) {
      return; // Allow empty input while typing
    }
    const clampedHour = Math.max(1, Math.min(24, hour));
    setEditedEndHour(clampedHour);
  };

  // Validate whenever times change
  useEffect(() => {
    if (slotToEdit && editedStartHour !== undefined && editedEndHour !== undefined) {
      const errors = validateEditedTimes(editedStartHour, editedEndHour, slotToEdit.dayOfWeek, slotToEdit.id);
      setEditErrors(errors);
    }
  }, [editedStartHour, editedEndHour, slotToEdit, displayAvailability]);

  // Confirm update
  const handleConfirmUpdate = () => {
    if (!slotToEdit || !slotToEdit.id) return;

    const errors = validateEditedTimes(editedStartHour, editedEndHour, slotToEdit.dayOfWeek, slotToEdit.id);
    if (Object.keys(errors).length > 0) {
      setEditErrors(errors);
      return;
    }

    const payload = {
      startTime: `${String(editedStartHour).padStart(2, '0')}:00`,
      endTime: `${String(editedEndHour).padStart(2, '0')}:00`,
    };

    updateWeeklyAvailability(
      { id: slotToEdit.id, payload },
      {
        onSuccess: () => {
          // Close dialog
          setShowEditDialog(false);
          setSlotToEdit(null);
          setEditErrors({});
        },
      }
    );
  };

  // Confirm delete
  const handleConfirmDelete = () => {
    if (!slotToEdit || !slotToEdit.id) return;

    deleteAvailability(slotToEdit.id, {
      onSuccess: () => {
        setShowEditDialog(false);
        setSlotToEdit(null);
        setEditErrors({});
      },
    });
  };

  // Cancel edit dialog
  const handleCancelEditDialog = () => {
    // If we were resizing, revert localAvailability back to API data
    if (apiAvailability) {
      setLocalAvailability(transformApiResponse(apiAvailability));
    }
    setShowEditDialog(false);
    setSlotToEdit(null);
    setEditErrors({});
  };

  // Check if a cell belongs to the hovered block
  const isCellInHoveredBlock = (day: number, hour: number): boolean => {
    if (!hoveredBlock) return false;
    return (
      hoveredBlock.dayOfWeek === day &&
      hour >= hoveredBlock.startHour &&
      hour < hoveredBlock.endHour
    );
  };

  // Handle cell hover
  const handleCellHover = (day: number, hour: number) => {
    // Clear any pending timeout
    if (hoverTimeoutRef.current) {
      clearTimeout(hoverTimeoutRef.current);
      hoverTimeoutRef.current = null;
    }

    const key = `${day}_${hour}`;

    // Only show hover effect for saved cells
    if (availabilityCellsSet.has(key)) {
      const block = findSavedBlockInDay(day, hour);
      if (block) {
        setHoveredBlock(block);
      }
    } else {
      setHoveredBlock(null);
    }
  };

  // Handle cell hover leave - clear with a small delay to allow smooth transitions
  const handleCellHoverLeave = () => {
    // Clear any pending timeout
    if (hoverTimeoutRef.current) {
      clearTimeout(hoverTimeoutRef.current);
    }

    // Small delay to allow mouse to move to adjacent cells in the same block
    hoverTimeoutRef.current = setTimeout(() => {
      setHoveredBlock(null);
      hoverTimeoutRef.current = null;
    }, 100);
  };

  // Check if a cell is the start or end of the hovered block
  const isEdgeOfHoveredBlock = (day: number, hour: number): boolean => {
    if (!hoveredBlock) return false;
    if (hoveredBlock.dayOfWeek !== day) return false;
    return hour === hoveredBlock.startHour || hour === hoveredBlock.endHour - 1;
  };

  // Get cell class names
  const getCellClassName = (status: CellStatus, isSelected: boolean, day: number, hour: number) => {
    const isHovered = isCellInHoveredBlock(day, hour);
    const edge = getEdgeAtCell(day, hour);
    const isEdgeOfHovered = isEdgeOfHoveredBlock(day, hour);

    return cn(
      "w-full h-full rounded border transition-all flex items-center justify-center text-[8px] font-medium relative",
      {
        "bg-green-500 border-green-600 border-2 text-white cursor-pointer": status === "saved" && !isEdgeOfHovered,
        "bg-green-600 border-green-700 border-2 text-white shadow-md cursor-pointer": status === "saved" && isHovered && !isEdgeOfHovered,
        "bg-green-600 border-green-700 border-2 text-white shadow-md cursor-col-resize": status === "saved" && isEdgeOfHovered,
        "bg-blue-400 border-blue-500 border-2 text-white": isSelected && status === "available",
        "bg-white border-gray-300 border-2 text-gray-700 hover:opacity-80 cursor-grab": !isSelected && status === "available",
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

  // Update document cursor during drag/resize
  useEffect(() => {
    if (isDragging) {
      document.body.style.cursor = "grabbing";
      document.body.style.userSelect = "none";
    } else if (isResizing) {
      document.body.style.cursor = "col-resize";
      document.body.style.userSelect = "none";
    } else {
      document.body.style.cursor = "";
      document.body.style.userSelect = "";
    }

    return () => {
      document.body.style.cursor = "";
      document.body.style.userSelect = "";
    };
  }, [isDragging, isResizing]);

  if (isLoading) {
    return (
      <div className="flex h-96 items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
        <div className="flex items-center gap-3 text-sm text-muted-foreground">
          <Button
            variant="outline"
            size="icon"
            onClick={() => router.back()}
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <span>Back to location</span>
        </div>
      <Card>
        <CardHeader>
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex-1">
              <CardTitle>Manage Weekly Availability</CardTitle>
              <CardDescription>
                Click or drag to select hours for each day. Confirm changes before they go live.
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid gap-3 sm:grid-cols-3">
            <div className="rounded-lg border border-border/60 bg-muted/30 p-4">
              <div className="flex items-center justify-between text-xs uppercase tracking-wide text-muted-foreground">
                <span>Total weekly hours</span>
                <Clock className="h-4 w-4 text-primary" />
              </div>
              <p className="mt-2 text-2xl font-semibold">
                {weeklyStats.totalHours}
                <span className="ml-1 text-sm font-normal text-muted-foreground">hrs</span>
              </p>
            </div>
            <div className="rounded-lg border border-border/60 bg-muted/30 p-4">
              <div className="flex items-center justify-between text-xs uppercase tracking-wide text-muted-foreground">
                <span>Active days</span>
                <CalendarDays className="h-4 w-4 text-primary" />
              </div>
              <p className="mt-2 text-2xl font-semibold">
                {weeklyStats.activeDays}
                <span className="ml-1 text-sm font-normal text-muted-foreground">days</span>
              </p>
            </div>
            <div className="rounded-lg border border-border/60 bg-muted/30 p-4">
              <div className="flex items-center justify-between text-xs uppercase tracking-wide text-muted-foreground">
                <span>Availability blocks</span>
                <Layers className="h-4 w-4 text-primary" />
              </div>
              <div className="mt-2 flex items-baseline gap-3">
                <p className="text-2xl font-semibold">{weeklyStats.slotCount}</p>
                <span className="text-xs text-muted-foreground">
                  longest block {weeklyStats.longestBlock || 0} hr{weeklyStats.longestBlock === 1 ? "" : "s"}
                </span>
              </div>
            </div>
          </div>

          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex flex-wrap items-center gap-4 rounded-lg border border-dashed border-border/60 bg-muted/20 px-4 py-3 text-xs font-medium text-muted-foreground">
              <div className="flex items-center gap-2">
                <span className="inline-block h-3 w-3 rounded bg-green-500 ring-1 ring-green-600" />
                Saved availability
              </div>
              <div className="flex items-center gap-2">
                <span className="inline-block h-3 w-3 rounded bg-blue-400 ring-1 ring-blue-500" />
                Currently selected
              </div>
              <div className="flex items-center gap-2">
                <span className="inline-block h-3 w-3 rounded bg-background ring-1 ring-border" />
                Empty slot
              </div>
            </div>
            <div className="flex items-center gap-2">
              {hasSelection && (
                <Badge variant="secondary" className="bg-primary/10 text-primary">
                  {selectedCells.size} cell{selectedCells.size === 1 ? "" : "s"} selected
                </Badge>
              )}
              <Button
                variant="outline"
                size="sm"
                onClick={clearSelection}
                disabled={!hasSelection}
              >
                Clear selection
              </Button>
            </div>
          </div>

          {/* Weekly Grid */}
          <div className="overflow-x-auto">
            <div className="inline-block min-w-full">
              <div
                className={cn(
                  "rounded-xl border border-border/60 bg-muted/10 p-3 shadow-sm",
                  isDragging && "cursor-grabbing select-none",
                  isResizing && "cursor-col-resize select-none"
                )}
                style={{
                  userSelect: (isDragging || isResizing) ? 'none' : 'auto',
                }}
              >
                {/* Header Row - Days of Week */}
                <div className="mb-2 grid grid-cols-[95px_repeat(7,1fr)] gap-1 border-b border-border/60 pb-2">
                  <div className="border-r border-border/60" />
                  {DAYS_OF_WEEK.map((day, index) => (
                    <div
                      key={index}
                      className="py-2 text-center text-sm font-semibold uppercase tracking-wide text-muted-foreground"
                    >
                      {day.slice(0, 3)}
                    </div>
                  ))}
                </div>

                {/* Time Slot Rows */}
                <div className="space-y-0.5">
                  {HOURS.map((hour) => {
                    const isNightTime = hour >= 21 || hour <= 5;
                    return (
                      <div
                        key={hour}
                        className={cn(
                          "grid grid-cols-[95px_repeat(7,1fr)] gap-1 rounded-md px-0.5 py-0.5",
                          isNightTime && "bg-muted/40"
                        )}
                        onMouseUp={(e) => {
                          e.stopPropagation();
                          handleMouseUp();
                        }}
                      >
                        {/* Time Label */}
                        <div className="flex items-center justify-center pr-2 text-xs font-medium text-muted-foreground">
                          {formatHourRange(hour)}
                        </div>

                        {/* Day Cells */}
                        {DAYS_OF_WEEK.map((_, dayIndex) => {
                          const status = getCellStatus(dayIndex, hour);
                          const key = `${dayIndex}_${hour}`;
                          const isSelected = selectedCells.has(key);
                          const edge = getEdgeAtCell(dayIndex, hour);
                          const isResizeEdge = edge !== null && !isResizing;
                          const isHovered = isCellInHoveredBlock(dayIndex, hour);
                          const isEdgeOfHovered = isEdgeOfHoveredBlock(dayIndex, hour);
                          // Show icon only on the start/end cells of the hovered block
                          const showResizeIcon = isHovered && isEdgeOfHovered && status === "saved";
                          // Determine which icon to show based on which edge of the hovered block
                          const isStartEdge = hoveredBlock && hoveredBlock.dayOfWeek === dayIndex && hour === hoveredBlock.startHour;
                          const isEndEdge = hoveredBlock && hoveredBlock.dayOfWeek === dayIndex && hour === hoveredBlock.endHour - 1;

                          return (
                            <div
                              key={`${dayIndex}_${hour}`}
                              className={cn(
                                "h-[20px] select-none",
                                !isResizeEdge && !isDragging && !isResizing && !availabilityCellsSet.has(key) && "cursor-grab",
                                isDragging && "cursor-grabbing",
                                isResizing && "cursor-col-resize"
                              )}
                              onClick={() => handleCellClick(dayIndex, hour)}
                              onMouseDown={(e) => handleMouseDown(dayIndex, hour, e)}
                              onMouseEnter={() => {
                                handleMouseEnter(dayIndex, hour);
                                handleCellHover(dayIndex, hour);
                              }}
                              onMouseLeave={handleCellHoverLeave}
                            >
                              <div className={getCellClassName(status, isSelected, dayIndex, hour)}>
                                {showResizeIcon && (
                                  <>
                                    {isStartEdge ? (
                                      <ChevronLeft className="h-3 w-3 text-white drop-shadow-md" />
                                    ) : isEndEdge ? (
                                      <ChevronRight className="h-3 w-3 text-white drop-shadow-md" />
                                    ) : null}
                                  </>
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

      {/* Confirmation Dialog */}
      <Dialog open={showConfirmDialog} onOpenChange={setShowConfirmDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add Availability</DialogTitle>
            <DialogDescription>
              Confirm adding the following time ranges to your weekly availability:
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-2 py-4 max-h-[400px] overflow-y-auto">
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
            <Button variant="outline" onClick={handleCancelDialog} disabled={isCreating}>
              Cancel
            </Button>
            <Button onClick={handleConfirmAdd} disabled={isCreating}>
              {isCreating ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Adding...
                </>
              ) : (
                "Confirm"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit/Delete Availability Dialog */}
      <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Edit Availability</DialogTitle>
            <DialogDescription>
              Update the time range or delete this availability slot.
            </DialogDescription>
          </DialogHeader>

          {slotToEdit && (
            <div className="space-y-6 py-4">
              {/* Section 1: Day Display */}
              <div className="space-y-2">
                <Label className="text-xs font-medium text-muted-foreground">Day</Label>
                <div className="rounded-lg bg-muted/50 p-4">
                  <p className="text-lg font-semibold">{DAYS_OF_WEEK[slotToEdit.dayOfWeek]}</p>
                </div>
              </div>

              {/* Section 2: Time Inputs */}
              <div className="space-y-2">
                <Label className="text-xs font-medium text-muted-foreground">Time Range</Label>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="start-time" className="text-sm">Start Time</Label>
                    <div className="flex items-center gap-2">
                      <Input
                        id="start-time"
                        type="number"
                        min="0"
                        max="23"
                        value={editedStartHour}
                        onChange={(e) => handleStartTimeChange(e.target.value)}
                        onBlur={() => {
                          if (slotToEdit) {
                            const errors = validateEditedTimes(editedStartHour, editedEndHour, slotToEdit.dayOfWeek, slotToEdit.id);
                            setEditErrors(errors);
                          }
                        }}
                        className={cn(
                          "text-center font-mono",
                          editErrors.start && "border-destructive"
                        )}
                      />
                      <span className="text-sm text-muted-foreground">:00</span>
                    </div>
                    {editErrors.start && (
                      <p className="text-xs text-destructive">{editErrors.start}</p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="end-time" className="text-sm">End Time</Label>
                    <div className="flex items-center gap-2">
                      <Input
                        id="end-time"
                        type="number"
                        min="1"
                        max="24"
                        value={editedEndHour}
                        onChange={(e) => handleEndTimeChange(e.target.value)}
                        onBlur={() => {
                          if (slotToEdit) {
                            const errors = validateEditedTimes(editedStartHour, editedEndHour, slotToEdit.dayOfWeek, slotToEdit.id);
                            setEditErrors(errors);
                          }
                        }}
                        className={cn(
                          "text-center font-mono",
                          editErrors.end && "border-destructive"
                        )}
                      />
                      <span className="text-sm text-muted-foreground">:00</span>
                    </div>
                    {editErrors.end && (
                      <p className="text-xs text-destructive">{editErrors.end}</p>
                    )}
                  </div>
                </div>
              </div>

              {/* Section 3: Duration and Comparison */}
              <div className="space-y-2">
                <Label className="text-xs font-medium text-muted-foreground">Summary</Label>
                <div className="rounded-lg border p-4 space-y-3 bg-muted/30">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Duration</span>
                    <span className="font-semibold">
                      {editedEndHour - editedStartHour} hour{editedEndHour - editedStartHour !== 1 ? 's' : ''}
                    </span>
                  </div>
                  <div className="border-t pt-3 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-muted-foreground">Current</span>
                      <span className="font-mono text-sm">
                        {formatHour(slotToEdit.startHour)} - {formatHour(slotToEdit.endHour)}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-muted-foreground">New</span>
                      <span className={cn(
                        "font-mono text-sm font-semibold",
                        (editedStartHour !== slotToEdit.startHour || editedEndHour !== slotToEdit.endHour) && "text-primary"
                      )}>
                        {formatHour(editedStartHour)} - {formatHour(editedEndHour)}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Error Alert */}
              {editErrors.overlap && (
                <Alert variant="destructive">
                  <AlertDescription>{editErrors.overlap}</AlertDescription>
                </Alert>
              )}
            </div>
          )}

          <DialogFooter className="flex-col-reverse sm:flex-row gap-2 sm:justify-between">
            <Button
              variant="ghost"
              size="icon"
              onClick={handleConfirmDelete}
              disabled={isDeleting || isUpdating}
              className="text-destructive hover:text-destructive hover:bg-destructive/10 self-start"
            >
              {isDeleting ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Trash2 className="h-4 w-4" />
              )}
            </Button>
            <div className="flex gap-2 w-full sm:w-auto">
              <Button
                variant="outline"
                onClick={handleCancelEditDialog}
                disabled={isDeleting || isUpdating}
                className="flex-1 sm:flex-initial"
              >
                Cancel
              </Button>
              <Button
                onClick={handleConfirmUpdate}
                disabled={Object.keys(editErrors).length > 0 || !slotToEdit || (editedStartHour === slotToEdit.startHour && editedEndHour === slotToEdit.endHour) || isDeleting || isUpdating}
                className="flex-1 sm:flex-initial"
              >
                {isUpdating ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Updating...
                  </>
                ) : (
                  <>
                    <Pencil className="mr-2 h-4 w-4" />
                    Update
                  </>
                )}
              </Button>
            </div>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
