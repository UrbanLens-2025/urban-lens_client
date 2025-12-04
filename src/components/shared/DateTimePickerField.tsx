"use client";

import { format } from "date-fns";
import { CalendarIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { cn } from "@/lib/utils";

interface DateTimePickerFieldProps {
  value: string;
  onChange: (value: string) => void;
  error?: string;
  className?: string;
  disabled?: boolean;
  minDate?: Date;
}

export function DateTimePickerField({
  value,
  onChange,
  error,
  className,
  disabled,
  minDate,
}: DateTimePickerFieldProps) {
  // Parse the datetime-local string value
  const parseValue = (val: string): Date | undefined => {
    if (!val) return undefined;
    
    try {
      const date = new Date(val);
      if (isNaN(date.getTime())) {
        return undefined;
      }
      return date;
    } catch {
      return undefined;
    }
  };

  // Format date to datetime-local string (defaults to 00:00 time)
  const formatToDateTimeLocal = (date: Date): string => {
    // Format as YYYY-MM-DDTHH:mm for datetime-local input
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");
    const hour = String(date.getHours()).padStart(2, "0");
    const minute = String(date.getMinutes()).padStart(2, "0");
    
    return `${year}-${month}-${day}T${hour}:${minute}`;
  };

  const selectedDate = parseValue(value);

  const handleDateSelect = (date: Date | undefined) => {
    if (date) {
      // Preserve existing time if available, otherwise use 00:00
      const existingTime = selectedDate 
        ? { hours: selectedDate.getHours(), minutes: selectedDate.getMinutes() }
        : { hours: 0, minutes: 0 };
      
      const newDate = new Date(date);
      newDate.setHours(existingTime.hours, existingTime.minutes, 0, 0);
      const newValue = formatToDateTimeLocal(newDate);
      onChange(newValue);
    } else {
      onChange("");
    }
  };

  const displayValue = selectedDate
    ? format(selectedDate, "PPP")
    : undefined;

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          disabled={disabled}
          className={cn(
            "w-full justify-start text-left font-normal",
            !selectedDate && "text-muted-foreground",
            error && "border-destructive",
            className
          )}
        >
          <CalendarIcon className="mr-2 h-4 w-4" />
          {displayValue || "Pick a date"}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-0" align="start">
        <Calendar
          mode="single"
          selected={selectedDate}
          onSelect={handleDateSelect}
          disabled={(date) => {
            if (minDate) {
              const today = new Date(minDate);
              today.setHours(0, 0, 0, 0);
              return date < today;
            }
            return false;
          }}
          initialFocus
        />
      </PopoverContent>
    </Popover>
  );
}

