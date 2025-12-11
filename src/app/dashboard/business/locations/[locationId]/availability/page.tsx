"use client";

import { use, useMemo, useState, useEffect, useRef, useCallback } from "react";
import { useRouter, usePathname, useSearchParams } from "next/navigation";
import Link from "next/link";
import { cn } from "@/lib/utils";
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
import { Loader2, Pencil, Trash2, ChevronLeft, ChevronRight, CalendarDays, Clock, Layers, DollarSign, Calendar, Save, Settings, Info, HelpCircle, ChevronDown, ChevronUp, Copy, Check, RotateCcw } from "lucide-react";
import { useWeeklyAvailabilities } from "@/hooks/availability/useWeeklyAvailabilities";
import { useCreateWeeklyAvailability } from "@/hooks/availability/useCreateWeeklyAvailability";
import { useDeleteAvailability } from "@/hooks/availability/useDeleteAvailability";
import { useUpdateWeeklyAvailability } from "@/hooks/availability/useUpdateWeeklyAvailability";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import type { WeeklyAvailabilityResponse } from "@/api/availability";
import { Badge } from "@/components/ui/badge";
import { BookingsCalendar } from "./_components/BookingsCalendar";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useOwnerLocationBookingConfig } from "@/hooks/locations/useOwnerLocationBookingConfig";
import { useCreateLocationBookingConfig, useUpdateLocationBookingConfig } from "@/hooks/locations/useCreateLocationBookingConfig";
import type { UpdateLocationBookingConfigPayload } from "@/types";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Switch } from "@/components/ui/switch";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { CurrencyInfo } from "@/components/ui/currency-display";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";

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
    let endHour = parseInt(item.endTime.split(":")[0], 10);
    
    // If endTime is "23:59", it means midnight (hour 24)
    // Convert back to internal representation of 24
    if (item.endTime === "23:59") {
      endHour = 24;
    }
    // Also handle "00:00" as midnight for backward compatibility
    else if (endHour === 0 && item.endTime === "00:00") {
      endHour = 24;
    }

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

// Booking Config Schema
const bookingConfigSchema = z
  .object({
    allowBooking: z.boolean(),
    baseBookingPrice: z
      .number()
      .positive("Base booking price must be greater than 0")
      .min(0.01, "Base booking price must be at least 0.01"),
    currency: z.literal("VND"),
    minBookingDurationMinutes: z
      .number()
      .int("Must be a whole number")
      .positive("Must be greater than 0")
      .min(1, "Minimum duration must be at least 1 minute"),
    maxBookingDurationMinutes: z
      .number()
      .int("Must be a whole number")
      .positive("Must be greater than 0"),
    minGapBetweenBookingsMinutes: z
      .number()
      .int("Must be a whole number")
      .min(0, "Minimum gap cannot be negative"),
    maxCapacity: z
      .number()
      .int("Must be a whole number")
      .positive("Must be greater than 0")
      .optional(),
    refundEnabled: z.boolean().optional(),
    refundCutoffHours: z
      .number()
      .int("Must be a whole number")
      .min(0, "Cannot be negative")
      .optional(),
    refundPercentageAfterCutoff: z
      .number()
      .min(0, "Cannot be negative")
      .max(1, "Cannot exceed 1 (100%)")
      .optional(),
    refundPercentageBeforeCutoff: z
      .number()
      .min(0, "Cannot be negative")
      .max(1, "Cannot exceed 1 (100%)")
      .optional(),
  })
  .refine(
    (data) => data.maxBookingDurationMinutes >= data.minBookingDurationMinutes,
    {
      message: "Maximum duration must be greater than or equal to minimum duration",
      path: ["maxBookingDurationMinutes"],
    }
  );

type BookingConfigForm = z.infer<typeof bookingConfigSchema>;

export default function AvailabilityPage({
  params,
}: {
  params: Promise<{ locationId: string }>;
}) {
  const { locationId } = use(params);
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const isBookingConfig = pathname.includes("/booking-config");
  const isAvailability = pathname.includes("/availability");
  
  // Tab state for Calendar/Settings (merged Availability + Booking Settings)
  const tabFromUrl = searchParams.get("tab");
  const [activeTab, setActiveTab] = useState<"settings" | "calendar">(
    tabFromUrl === "calendar" ? "calendar" : "settings"
  );
  
  // Section state for Settings tab (Availability or Booking Settings)
  const [activeSection, setActiveSection] = useState<"availability" | "booking">("availability");
  const [isAvailabilityOpen, setIsAvailabilityOpen] = useState(true);
  const [isBookingOpen, setIsBookingOpen] = useState(false);
  
  // Update tab when URL param changes
  useEffect(() => {
    const tab = searchParams.get("tab");
    if (tab === "calendar") {
      setActiveTab("calendar");
    } else {
      setActiveTab("settings");
    }
  }, [searchParams]);
  
  // Redirect from booking-config to settings tab
  useEffect(() => {
    if (isBookingConfig) {
      router.replace(`/dashboard/business/locations/${locationId}/availability?tab=settings`);
    }
  }, [isBookingConfig, locationId, router]);
  
  // Booking Config Form
  const { data: existingConfig, isLoading: isLoadingConfig, error: configError } =
    useOwnerLocationBookingConfig(locationId);
  const createConfig = useCreateLocationBookingConfig();
  const updateConfig = useUpdateLocationBookingConfig();
  
  const bookingForm = useForm<BookingConfigForm>({
    resolver: zodResolver(bookingConfigSchema),
    defaultValues: {
      allowBooking: true,
      baseBookingPrice: 0,
      currency: "VND",
      minBookingDurationMinutes: 30,
      maxBookingDurationMinutes: 240,
      minGapBetweenBookingsMinutes: 15,
      maxCapacity: undefined,
      refundEnabled: false,
      refundCutoffHours: 24,
      refundPercentageAfterCutoff: 0.8,
      refundPercentageBeforeCutoff: 1,
    },
  });
  
  // Load existing config when available
  useEffect(() => {
    if (existingConfig && !configError) {
      bookingForm.reset({
        allowBooking: existingConfig.allowBooking,
        baseBookingPrice: parseFloat(existingConfig.baseBookingPrice),
        currency: "VND",
        minBookingDurationMinutes: existingConfig.minBookingDurationMinutes,
        maxBookingDurationMinutes: existingConfig.maxBookingDurationMinutes,
        minGapBetweenBookingsMinutes: existingConfig.minGapBetweenBookingsMinutes,
        maxCapacity: existingConfig.maxCapacity,
        refundEnabled: existingConfig.refundEnabled ?? false,
        refundCutoffHours: existingConfig.refundCutoffHours ?? 24,
        refundPercentageAfterCutoff: existingConfig.refundPercentageAfterCutoff ?? 0.8,
        refundPercentageBeforeCutoff: existingConfig.refundPercentageBeforeCutoff ?? 1,
      });
    }
  }, [existingConfig, configError, bookingForm]);
  
  const hasConfig = existingConfig && !configError;
  const isSubmittingBooking = createConfig.isPending || updateConfig.isPending;
  
  const formatCurrency = (amount: number, currency: string) => {
    if (currency === "VND") {
      return new Intl.NumberFormat("vi-VN", {
        style: "currency",
        currency: "VND",
        minimumFractionDigits: 0,
      }).format(amount);
    }
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: currency,
      minimumFractionDigits: 2,
    }).format(amount);
  };
  
  const onBookingSubmit = (data: BookingConfigForm) => {
    if (hasConfig) {
      const updatePayload: UpdateLocationBookingConfigPayload = {
        allowBooking: data.allowBooking,
        baseBookingPrice: data.baseBookingPrice,
        currency: "VND",
        minBookingDurationMinutes: data.minBookingDurationMinutes,
        maxBookingDurationMinutes: data.maxBookingDurationMinutes,
        minGapBetweenBookingsMinutes: data.minGapBetweenBookingsMinutes,
        maxCapacity: data.maxCapacity,
        refundEnabled: data.refundEnabled,
        refundCutoffHours: data.refundCutoffHours,
        refundPercentageAfterCutoff: data.refundPercentageAfterCutoff,
        refundPercentageBeforeCutoff: data.refundPercentageBeforeCutoff,
      };
      updateConfig.mutate({
        configId: existingConfig.id || locationId, // Use config ID if available, fallback to locationId
        locationId,
        payload: updatePayload,
      });
    } else {
      createConfig.mutate({
        locationId,
        ...data,
        currency: "VND",
      });
    }
  };

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
  
  // Copy dialog state
  const [showCopyDialog, setShowCopyDialog] = useState(false);
  const [sourceDay, setSourceDay] = useState<number | null>(null);
  const [targetDays, setTargetDays] = useState<Set<number>>(new Set());

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

      // Allow resizing across days
      // Note: Resizing still works within the same day for better UX
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
    // Convert endHour 24 (midnight) to "23:59" for API format
    const endTimeStr = slot.endHour === 24 ? "23:59" : `${String(slot.endHour).padStart(2, '0')}:00`;
    return {
      dayOfWeek: DAY_OF_WEEK_REVERSE_MAP[slot.dayOfWeek] as "MONDAY" | "TUESDAY" | "WEDNESDAY" | "THURSDAY" | "FRIDAY" | "SATURDAY" | "SUNDAY",
      startTime: `${String(slot.startHour).padStart(2, '0')}:00`,
      endTime: endTimeStr,
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

  // Handle copy slots to other days
  const handleCopySlots = async () => {
    if (sourceDay === null || targetDays.size === 0) return;

    // Get all slots from the source day
    const sourceSlots = displayAvailability.filter(slot => slot.dayOfWeek === sourceDay);
    
    if (sourceSlots.length === 0) return;

    // Create slots for each target day
    const slotsToCreate: WeeklyAvailabilitySlot[] = [];
    
    targetDays.forEach(targetDay => {
      // Skip if target day is the same as source day
      if (targetDay === sourceDay) return;
      
      sourceSlots.forEach(sourceSlot => {
        // Check for overlaps in target day
        const hasOverlap = displayAvailability.some(existingSlot => {
          if (existingSlot.dayOfWeek !== targetDay) return false;
          // Check if time ranges overlap
          return !(sourceSlot.endHour <= existingSlot.startHour || sourceSlot.startHour >= existingSlot.endHour);
        });
        
        if (!hasOverlap) {
          slotsToCreate.push({
            dayOfWeek: targetDay,
            startHour: sourceSlot.startHour,
            endHour: sourceSlot.endHour,
          });
        }
      });
    });

    if (slotsToCreate.length === 0) {
      return;
    }

    // Create all slots sequentially
    try {
      for (const slot of slotsToCreate) {
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

      // Reset state
      setShowCopyDialog(false);
      setSourceDay(null);
      setTargetDays(new Set());
    } catch (error) {
      // Error handling is done by the mutation
      console.error("Error copying slots:", error);
    }
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

    // Convert endHour 24 (midnight) to "23:59" for API format
    const endTimeStr = editedEndHour === 24 ? "23:59" : `${String(editedEndHour).padStart(2, '0')}:00`;
    const payload = {
      startTime: `${String(editedStartHour).padStart(2, '0')}:00`,
      endTime: endTimeStr,
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
      "w-full h-full rounded border transition-all flex items-center justify-center relative",
      {
        // Saved availability - green
        "bg-green-500 dark:bg-green-600 border-green-600 dark:border-green-500 border text-white cursor-pointer shadow-sm hover:shadow-md hover:scale-[1.02]": status === "saved" && !isEdgeOfHovered && !isHovered,
        "bg-green-600 dark:bg-green-500 border-green-700 dark:border-green-400 border text-white shadow-md cursor-pointer hover:shadow-lg hover:scale-[1.03]": status === "saved" && isHovered && !isEdgeOfHovered,
        "bg-green-600 dark:bg-green-500 border-green-700 dark:border-green-400 border text-white shadow-md cursor-col-resize hover:shadow-lg": status === "saved" && isEdgeOfHovered,
        
        // Selected cells - blue
        "bg-blue-500 dark:bg-blue-600 border-blue-600 dark:border-blue-500 border text-white shadow-sm hover:shadow-md hover:scale-[1.02]": isSelected && status === "available",
        
        // Available/Empty cells
        "bg-background border-border/50 border hover:border-border hover:bg-muted/30 cursor-grab": !isSelected && status === "available",
      }
    );
  };

  // Format hour range for display in military time (e.g., "01:00 - 02:00")
  const formatHourRange = (hour: number): string => {
    const formatSingleHour = (h: number): string => {
      return `${String(h).padStart(2, '0')}:00`;
    };

    // For hour 23 (11 PM), show "23:00 - 23:59" instead of "23:00 - 00:00"
    if (hour === 23) {
      return "23:00 - 23:59";
    }

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
    <div className="space-y-6 p-6">
      {/* Tab Navigation */}
      <div className="flex items-center gap-2 border-b">
        <button
          onClick={() => {
            setActiveTab("calendar");
            router.replace(`/dashboard/business/locations/${locationId}/availability?tab=calendar`);
          }}
          className={cn(
            "px-4 py-2 text-sm font-medium transition-colors border-b-2 -mb-[1px]",
            activeTab === "calendar"
              ? "border-primary text-primary"
              : "border-transparent text-muted-foreground hover:text-foreground"
          )}
        >
          <div className="flex items-center gap-2">
            <Calendar className="h-4 w-4" />
            Calendar
          </div>
        </button>
        <button
          onClick={() => {
            setActiveTab("settings");
            router.replace(`/dashboard/business/locations/${locationId}/availability?tab=settings`);
          }}
          className={cn(
            "px-4 py-2 text-sm font-medium transition-colors border-b-2 -mb-[1px]",
            activeTab === "settings"
              ? "border-primary text-primary"
              : "border-transparent text-muted-foreground hover:text-foreground"
          )}
        >
          <div className="flex items-center gap-2">
            <Settings className="h-4 w-4" />
            Settings
          </div>
        </button>
      </div>

      {activeTab === "calendar" ? (
        <BookingsCalendar locationId={locationId} />
      ) : activeTab === "settings" ? (
        <div className="space-y-6">
          {/* Helpful Info Banner */}
          <Alert className="bg-blue-50 dark:bg-blue-950 border-blue-200 dark:border-blue-800">
            <Info className="h-4 w-4 text-blue-600 dark:text-blue-400" />
            <AlertDescription className="text-blue-800 dark:text-blue-200">
              <strong>Quick Guide:</strong> Configure your location's availability schedule and booking settings. 
              Set your weekly hours in the Availability section, then configure pricing and duration rules in Booking Settings.
            </AlertDescription>
          </Alert>

          {/* Availability Section */}
          <Collapsible open={isAvailabilityOpen} onOpenChange={setIsAvailabilityOpen}>
            <CollapsibleTrigger asChild>
              <Card className="cursor-pointer hover:bg-muted/50 transition-colors">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="p-2 rounded-lg bg-primary/10">
                        <Clock className="h-5 w-5 text-primary" />
                      </div>
                      <div>
                        <CardTitle className="flex items-center gap-2">
                          Weekly Availability
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <HelpCircle className="h-4 w-4 text-muted-foreground" />
                            </TooltipTrigger>
                            <TooltipContent>
                              <p>Set the hours your location is available each day of the week. Customers can only book during these times.</p>
                            </TooltipContent>
                          </Tooltip>
                        </CardTitle>
                        <CardDescription>
                          Click or drag to select hours for each day. Confirm changes before they go live.
                        </CardDescription>
                      </div>
                    </div>
                    {isAvailabilityOpen ? (
                      <ChevronUp className="h-5 w-5 text-muted-foreground" />
                    ) : (
                      <ChevronDown className="h-5 w-5 text-muted-foreground" />
                    )}
                  </div>
                </CardHeader>
              </Card>
            </CollapsibleTrigger>
            <CollapsibleContent>
              <Card className="border-2 border-primary/10 shadow-xl">
                <CardContent className="pt-4 space-y-4">
          {/* Statistics Cards */}
          <div className="grid gap-2 sm:grid-cols-3">
            <div className="rounded-lg border-2 border-primary/10 bg-gradient-to-br from-primary/5 to-primary/10 p-3 shadow-sm">
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wide">Total Weekly Hours</span>
                <div className="p-1 rounded-md bg-primary/10">
                  <Clock className="h-3 w-3 text-primary" />
                </div>
              </div>
              <p className="text-xl font-bold text-foreground">
                {weeklyStats.totalHours}
                <span className="ml-1 text-xs font-normal text-muted-foreground">hrs</span>
              </p>
            </div>
            <div className="rounded-lg border-2 border-primary/10 bg-gradient-to-br from-primary/5 to-primary/10 p-3 shadow-sm">
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wide">Active Days</span>
                <div className="p-1 rounded-md bg-primary/10">
                  <CalendarDays className="h-3 w-3 text-primary" />
                </div>
              </div>
              <p className="text-xl font-bold text-foreground">
                {weeklyStats.activeDays}
                <span className="ml-1 text-xs font-normal text-muted-foreground">days</span>
              </p>
            </div>
            <div className="rounded-lg border-2 border-primary/10 bg-gradient-to-br from-primary/5 to-primary/10 p-3 shadow-sm">
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wide">Availability Blocks</span>
                <div className="p-1 rounded-md bg-primary/10">
                  <Layers className="h-3 w-3 text-primary" />
                </div>
              </div>
              <div className="flex items-baseline gap-2">
                <p className="text-xl font-bold text-foreground">{weeklyStats.slotCount}</p>
                <span className="text-[10px] text-muted-foreground">
                  longest {weeklyStats.longestBlock || 0}hr{weeklyStats.longestBlock === 1 ? "" : "s"}
                </span>
              </div>
            </div>
          </div>

          {/* Legend and Actions */}
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex flex-wrap items-center gap-3 rounded-lg border-2 border-primary/10 bg-gradient-to-r from-muted/50 to-muted/30 px-3 py-2">
              <div className="flex items-center gap-1.5 text-[10px] font-semibold text-muted-foreground">
                <Info className="h-3 w-3" />
                <span>Legend:</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="inline-block h-3 w-3 rounded bg-green-500 border border-green-600 shadow-sm" />
                <span className="text-[10px] font-medium text-foreground">Saved</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="inline-block h-3 w-3 rounded bg-blue-400 border border-blue-500 shadow-sm" />
                <span className="text-[10px] font-medium text-foreground">Selected</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="inline-block h-3 w-3 rounded bg-background border border-border shadow-sm" />
                <span className="text-[10px] font-medium text-muted-foreground">Empty</span>
              </div>
            </div>
            <div className="flex items-center gap-2">
              {hasSelection && (
                <Badge variant="secondary" className="bg-primary/10 text-primary border border-primary/20 text-xs font-semibold px-2 py-1">
                  {selectedCells.size} selected
                </Badge>
              )}
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  // Find the day with the most slots to use as default source
                  const slotsByDay = new Map<number, WeeklyAvailabilitySlot[]>();
                  displayAvailability.forEach(slot => {
                    if (!slotsByDay.has(slot.dayOfWeek)) {
                      slotsByDay.set(slot.dayOfWeek, []);
                    }
                    slotsByDay.get(slot.dayOfWeek)!.push(slot);
                  });
                  
                  // Find day with most slots as default
                  let maxSlots = 0;
                  let dayWithMostSlots = 0;
                  slotsByDay.forEach((slots, day) => {
                    if (slots.length > maxSlots) {
                      maxSlots = slots.length;
                      dayWithMostSlots = day;
                    }
                  });
                  
                  if (maxSlots > 0) {
                    setSourceDay(dayWithMostSlots);
                    setTargetDays(new Set());
                    setShowCopyDialog(true);
                  }
                }}
                disabled={displayAvailability.length === 0}
                className="h-8 text-xs border-2 border-primary/20 hover:bg-primary/10"
              >
                <Copy className="h-3 w-3 mr-1.5" />
                Copy to Days
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={clearSelection}
                disabled={!hasSelection}
                className="h-8 text-xs border-2 border-primary/20 hover:bg-primary/10"
              >
                Clear
              </Button>
            </div>
          </div>

          {/* Weekly Grid */}
          <div className="overflow-x-auto rounded-lg border-2 border-primary/10 bg-background shadow-md">
            <div className="inline-block min-w-full">
              <div
                className={cn(
                  "rounded-lg border border-primary/10 bg-muted/5 p-2",
                  isDragging && "cursor-grabbing select-none",
                  isResizing && "cursor-col-resize select-none"
                )}
                style={{
                  userSelect: (isDragging || isResizing) ? 'none' : 'auto',
                }}
              >
                {/* Header Row - Days of Week */}
                <div className="mb-2 grid grid-cols-[80px_repeat(7,1fr)] gap-1 border-b-2 border-primary/20 pb-2">
                  <div className="flex items-center justify-center">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-primary">Time</span>
                  </div>
                  {DAYS_OF_WEEK.map((day, index) => (
                    <div
                      key={index}
                      className="py-1.5 text-center text-[10px] font-bold uppercase tracking-wide text-muted-foreground"
                    >
                      {day.slice(0, 3)}
                    </div>
                  ))}
                </div>

                {/* Time Slot Rows - Show all 24 hours (00:00 - 23:00) */}
                <div className="space-y-0.5 overflow-y-auto" style={{ height: '600px', minHeight: '600px', maxHeight: '600px' }}>
                  {HOURS.map((hour) => {
                    const isNightTime = (hour >= 21 || hour <= 5);
                    const isBusinessHours = hour >= 9 && hour <= 17;
                    return (
                      <div
                        key={hour}
                        className={cn(
                          "grid grid-cols-[80px_repeat(7,1fr)] gap-1 rounded px-0.5 py-0.5 transition-colors min-h-[22px]",
                          isNightTime && "bg-muted/20",
                          isBusinessHours && !isNightTime && "bg-muted/5"
                        )}
                        onMouseUp={(e) => {
                          e.stopPropagation();
                          handleMouseUp();
                        }}
                      >
                        {/* Time Label */}
                        <div className="flex items-center justify-center pr-1">
                          <span className={cn(
                            "text-[10px] font-semibold",
                            isBusinessHours ? "text-foreground" : "text-muted-foreground"
                          )}>
                            {formatHourRange(hour)}
                          </span>
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
                                "h-[16px] select-none",
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
                                      <ChevronLeft className="h-2 w-2 text-white drop-shadow-md" />
                                    ) : isEndEdge ? (
                                      <ChevronRight className="h-2 w-2 text-white drop-shadow-md" />
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
            </CollapsibleContent>
          </Collapsible>

          {/* Booking Settings Section */}
          {isLoadingConfig ? (
            <Card>
              <CardContent className="py-20">
                <div className="flex items-center justify-center">
                  <Loader2 className="h-10 w-10 animate-spin text-muted-foreground" />
                </div>
              </CardContent>
            </Card>
          ) : (
            <Collapsible open={isBookingOpen} onOpenChange={setIsBookingOpen}>
              <CollapsibleTrigger asChild>
                <Card className="cursor-pointer hover:bg-muted/50 transition-colors">
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="p-2 rounded-lg bg-emerald-500/10">
                          <DollarSign className="h-5 w-5 text-emerald-600" />
                        </div>
                        <div>
                          <CardTitle className="flex items-center gap-2">
                            Booking Settings
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <HelpCircle className="h-4 w-4 text-muted-foreground" />
                              </TooltipTrigger>
                              <TooltipContent>
                                <p>Configure pricing, duration limits, and booking rules. These settings determine how customers can book your location.</p>
                              </TooltipContent>
                            </Tooltip>
                          </CardTitle>
                          <CardDescription>
                            Configure how customers can book your location
                          </CardDescription>
                        </div>
                      </div>
                      {isBookingOpen ? (
                        <ChevronUp className="h-5 w-5 text-muted-foreground" />
                      ) : (
                        <ChevronDown className="h-5 w-5 text-muted-foreground" />
                      )}
                    </div>
                  </CardHeader>
                </Card>
              </CollapsibleTrigger>
              <CollapsibleContent>
                <Card>
                  <CardContent className="pt-6">
                    <Form {...bookingForm}>
                      <form onSubmit={bookingForm.handleSubmit(onBookingSubmit)} className="space-y-6">
                        <div className="space-y-6">
                            {/* Allow Booking Toggle */}
                            <FormField
                              control={bookingForm.control}
                              name="allowBooking"
                              render={({ field }) => (
                                <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                                  <div className="space-y-0.5 flex-1">
                                    <div className="flex items-center gap-2">
                                      <FormLabel className="text-base">Allow Booking</FormLabel>
                                      <Tooltip>
                                        <TooltipTrigger asChild>
                                          <HelpCircle className="h-3.5 w-3.5 text-muted-foreground" />
                                        </TooltipTrigger>
                                        <TooltipContent>
                                          <p>Enable or disable booking for this location. When disabled, customers cannot make new bookings.</p>
                                        </TooltipContent>
                                      </Tooltip>
                                    </div>
                                    <FormDescription>
                                      Enable or disable booking for this location
                                    </FormDescription>
                                  </div>
                                  <FormControl>
                                    <Switch
                                      checked={field.value}
                                      onCheckedChange={field.onChange}
                                    />
                                  </FormControl>
                                </FormItem>
                              )}
                            />

                            {/* Pricing */}
                            <div className="space-y-4">
                              <h3 className="text-lg font-semibold flex items-center gap-2">
                                Pricing
                                <Tooltip>
                                  <TooltipTrigger asChild>
                                    <HelpCircle className="h-4 w-4 text-muted-foreground" />
                                  </TooltipTrigger>
                                  <TooltipContent>
                                    <p>Set the base price for the minimum booking duration. Longer bookings will be calculated proportionally.</p>
                                  </TooltipContent>
                                </Tooltip>
                              </h3>
                              
                              <div className="grid grid-cols-2 gap-4">
                                <FormField
                                  control={bookingForm.control}
                                  name="baseBookingPrice"
                                  render={({ field }) => (
                                    <FormItem>
                                      <FormLabel>Base Booking Price</FormLabel>
                                      <FormControl>
                                        <Input
                                          type="number"
                                          step="0.01"
                                          min="0.01"
                                          placeholder="0.00"
                                          {...field}
                                          onChange={(e) =>
                                            field.onChange(parseFloat(e.target.value) || 0)
                                          }
                                        />
                                      </FormControl>
                                      <FormDescription>
                                        Base price for minimum booking duration
                                      </FormDescription>
                                      <FormMessage />
                                    </FormItem>
                                  )}
                                />

                                <div className="space-y-2">
                                  <FormLabel className="text-sm font-semibold flex items-center gap-2">
                                    <DollarSign className="h-4 w-4 text-primary" />
                                    Currency
                                  </FormLabel>
                                  <CurrencyInfo currency="VND" variant="compact" />
                                </div>
                              </div>
                            </div>

                            {/* Duration Settings - Hidden */}
                            {false && (
                            <div className="space-y-4">
                              <h3 className="text-lg font-semibold flex items-center gap-2">
                                <Clock className="h-5 w-5" />
                                Duration Settings
                                <Tooltip>
                                  <TooltipTrigger asChild>
                                    <HelpCircle className="h-4 w-4 text-muted-foreground" />
                                  </TooltipTrigger>
                                  <TooltipContent>
                                    <p>Set the minimum and maximum booking duration. The gap between bookings prevents back-to-back reservations.</p>
                                  </TooltipContent>
                                </Tooltip>
                              </h3>

                              <div className="grid grid-cols-2 gap-4">
                                <FormField
                                  control={bookingForm.control}
                                  name="minBookingDurationMinutes"
                                  render={({ field }) => (
                                    <FormItem>
                                      <FormLabel>Minimum Duration (minutes)</FormLabel>
                                      <FormControl>
                                        <Input
                                          type="number"
                                          min="1"
                                          placeholder="30"
                                          {...field}
                                          onChange={(e) =>
                                            field.onChange(parseInt(e.target.value) || 0)
                                          }
                                        />
                                      </FormControl>
                                      <FormDescription>
                                        Minimum booking duration in minutes
                                      </FormDescription>
                                      <FormMessage />
                                    </FormItem>
                                  )}
                                />

                                <FormField
                                  control={bookingForm.control}
                                  name="maxBookingDurationMinutes"
                                  render={({ field }) => (
                                    <FormItem>
                                      <FormLabel>Maximum Duration (minutes)</FormLabel>
                                      <FormControl>
                                        <Input
                                          type="number"
                                          min="1"
                                          placeholder="240"
                                          {...field}
                                          onChange={(e) =>
                                            field.onChange(parseInt(e.target.value) || 0)
                                          }
                                        />
                                      </FormControl>
                                      <FormDescription>
                                        Maximum booking duration in minutes
                                      </FormDescription>
                                      <FormMessage />
                                    </FormItem>
                                  )}
                                />
                              </div>

                              <FormField
                                control={bookingForm.control}
                                name="minGapBetweenBookingsMinutes"
                                render={({ field }) => (
                                  <FormItem>
                                    <FormLabel>Minimum Gap Between Bookings (minutes)</FormLabel>
                                    <FormControl>
                                      <Input
                                        type="number"
                                        min="0"
                                        placeholder="15"
                                        {...field}
                                        onChange={(e) =>
                                          field.onChange(parseInt(e.target.value) || 0)
                                        }
                                      />
                                    </FormControl>
                                    <FormDescription>
                                      Minimum time required between consecutive bookings
                                    </FormDescription>
                                    <FormMessage />
                                  </FormItem>
                                )}
                              />
                            </div>
                            )}

                            {/* Refund Settings */}
                            <div className="space-y-4">
                              <h3 className="text-lg font-semibold flex items-center gap-2">
                                <RotateCcw className="h-5 w-5" />
                                Refund Settings
                                <Tooltip>
                                  <TooltipTrigger asChild>
                                    <HelpCircle className="h-4 w-4 text-muted-foreground" />
                                  </TooltipTrigger>
                                  <TooltipContent>
                                    <p>Configure refund policies for cancellations based on timing</p>
                                  </TooltipContent>
                                </Tooltip>
                              </h3>

                              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                <FormField
                                  control={bookingForm.control}
                                  name="refundCutoffHours"
                                  render={({ field }) => (
                                    <FormItem>
                                      <FormLabel>Refund Cutoff (hours)</FormLabel>
                                      <FormControl>
                                        <Input
                                          type="number"
                                          min="0"
                                          placeholder="24"
                                          {...field}
                                          value={field.value ?? ""}
                                          onChange={(e) =>
                                            field.onChange(
                                              e.target.value
                                                ? parseInt(e.target.value)
                                                : undefined
                                            )
                                          }
                                        />
                                      </FormControl>
                                      <FormDescription>
                                        Hours before booking start time for refund cutoff
                                      </FormDescription>
                                      <FormMessage />
                                    </FormItem>
                                  )}
                                />

                                <FormField
                                  control={bookingForm.control}
                                  name="refundPercentageBeforeCutoff"
                                  render={({ field }) => (
                                    <FormItem>
                                      <FormLabel>Refund % Before Cutoff</FormLabel>
                                      <FormControl>
                                        <Input
                                          type="number"
                                          step="0.01"
                                          min="0"
                                          max="1"
                                          placeholder="1.0"
                                          {...field}
                                          value={field.value ?? ""}
                                          onChange={(e) =>
                                            field.onChange(
                                              e.target.value
                                                ? parseFloat(e.target.value)
                                                : undefined
                                            )
                                          }
                                        />
                                      </FormControl>
                                      <FormDescription>
                                        Refund percentage (0-1) before cutoff time
                                      </FormDescription>
                                      <FormMessage />
                                    </FormItem>
                                  )}
                                />

                                <FormField
                                  control={bookingForm.control}
                                  name="refundPercentageAfterCutoff"
                                  render={({ field }) => (
                                    <FormItem>
                                      <FormLabel>Refund % After Cutoff</FormLabel>
                                      <FormControl>
                                        <Input
                                          type="number"
                                          step="0.01"
                                          min="0"
                                          max="1"
                                          placeholder="0.8"
                                          {...field}
                                          value={field.value ?? ""}
                                          onChange={(e) =>
                                            field.onChange(
                                              e.target.value
                                                ? parseFloat(e.target.value)
                                                : undefined
                                            )
                                          }
                                        />
                                      </FormControl>
                                      <FormDescription>
                                        Refund percentage (0-1) after cutoff time
                                      </FormDescription>
                                      <FormMessage />
                                    </FormItem>
                                  )}
                                />
                              </div>
                            </div>

                            {/* Submit Button */}
                            <div className="flex justify-end gap-2 pt-4">
                              <Button
                                type="button"
                                variant="outline"
                                onClick={() => router.back()}
                                disabled={isSubmittingBooking}
                              >
                                Cancel
                              </Button>
                              <Button
                                type="submit"
                                disabled={isSubmittingBooking}
                              >
                                {isSubmittingBooking ? (
                                  <>
                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                    Saving...
                                  </>
                                ) : (
                                  <>
                                    <Save className="mr-2 h-4 w-4" />
                                    {hasConfig ? "Update Configuration" : "Create Configuration"}
                                  </>
                                )}
                              </Button>
                            </div>
                        </div>
                      </form>
                    </Form>
                  </CardContent>
                </Card>
              </CollapsibleContent>
            </Collapsible>
          )}
        </div>
      ) : null}

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

      {/* Copy to Days Dialog */}
      <Dialog open={showCopyDialog} onOpenChange={setShowCopyDialog}>
        <DialogContent className="sm:max-w-[550px]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-xl">
              <div className="p-2 rounded-lg bg-primary/10">
                <Copy className="h-5 w-5 text-primary" />
              </div>
              Copy Availability to Other Days
            </DialogTitle>
            <DialogDescription className="text-base">
              Select a source day and target days to copy availability slots.
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            {/* Source Day Selection */}
            <div className="space-y-3">
              <Label className="text-sm font-semibold flex items-center gap-2">
                <div className="p-1 rounded bg-primary/10">
                  <CalendarDays className="h-3.5 w-3.5 text-primary" />
                </div>
                Source Day (copy from):
              </Label>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {DAYS_OF_WEEK.map((day, index) => {
                  const hasSlots = displayAvailability.some(s => s.dayOfWeek === index);
                  const isSelected = sourceDay === index;
                  return (
                    <button
                      key={index}
                      type="button"
                      onClick={() => {
                        setSourceDay(index);
                        setTargetDays(new Set());
                      }}
                      disabled={!hasSlots}
                      className={cn(
                        "p-3 rounded-lg border-2 transition-all text-sm font-semibold",
                        isSelected
                          ? "bg-primary/10 border-primary text-primary shadow-md"
                          : hasSlots
                          ? "bg-background border-border/50 hover:border-primary/50 hover:bg-primary/5"
                          : "bg-muted/30 border-border/30 text-muted-foreground cursor-not-allowed opacity-50"
                      )}
                    >
                      <div className="flex items-center justify-center gap-2">
                        {isSelected && <Check className="h-4 w-4" />}
                        {day}
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            {sourceDay !== null && (
              <>
                {/* Source Day Info */}
                <div className="rounded-lg border-2 border-primary/20 bg-gradient-to-r from-primary/5 to-primary/10 p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="text-sm font-semibold text-muted-foreground mb-1">Copying from:</div>
                      <div className="text-lg font-bold text-foreground">{DAYS_OF_WEEK[sourceDay]}</div>
                    </div>
                    <div className="text-right">
                      <div className="text-2xl font-bold text-primary">
                        {displayAvailability.filter(s => s.dayOfWeek === sourceDay).length}
                      </div>
                      <div className="text-xs text-muted-foreground">slot(s)</div>
                    </div>
                  </div>
                </div>

                {/* Target Days Selection */}
                <div className="space-y-3">
                  <Label className="text-sm font-semibold flex items-center gap-2">
                    <div className="p-1 rounded bg-primary/10">
                      <Calendar className="h-3.5 w-3.5 text-primary" />
                    </div>
                    Target Days (copy to):
                  </Label>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                    {DAYS_OF_WEEK.map((day, index) => {
                      if (index === sourceDay) return null; // Don't show source day
                      const isSelected = targetDays.has(index);
                      return (
                        <button
                          key={index}
                          type="button"
                          onClick={() => {
                            const newTargetDays = new Set(targetDays);
                            if (isSelected) {
                              newTargetDays.delete(index);
                            } else {
                              newTargetDays.add(index);
                            }
                            setTargetDays(newTargetDays);
                          }}
                          className={cn(
                            "p-3 rounded-lg border-2 transition-all text-sm font-semibold",
                            isSelected
                              ? "bg-primary/10 border-primary text-primary shadow-md"
                              : "bg-background border-border/50 hover:border-primary/50 hover:bg-primary/5"
                          )}
                        >
                          <div className="flex items-center justify-center gap-2">
                            {isSelected && <Check className="h-4 w-4" />}
                            {day}
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Preview */}
                {targetDays.size > 0 && (
                  <div className="rounded-lg border-2 border-primary/20 bg-gradient-to-r from-muted/50 to-muted/30 p-4">
                    <div className="flex items-center justify-between mb-2">
                      <div className="text-sm font-semibold text-muted-foreground">
                        Will create:
                      </div>
                      <div className="text-lg font-bold text-primary">
                        {displayAvailability.filter(s => s.dayOfWeek === sourceDay).length * targetDays.size} slot(s)
                      </div>
                    </div>
                    <div className="flex flex-wrap gap-1.5">
                      {Array.from(targetDays).map(dayIndex => (
                        <Badge key={dayIndex} variant="secondary" className="bg-primary/10 text-primary border border-primary/20 text-xs font-semibold">
                          {DAYS_OF_WEEK[dayIndex]}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}
              </>
            )}
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setShowCopyDialog(false);
                setSourceDay(null);
                setTargetDays(new Set());
              }}
              disabled={isCreating}
            >
              Cancel
            </Button>
            <Button
              onClick={handleCopySlots}
              disabled={isCreating || targetDays.size === 0}
              className="bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary/70"
            >
              {isCreating ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Copying...
                </>
              ) : (
                <>
                  <Copy className="mr-2 h-4 w-4" />
                  Copy Slots
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
