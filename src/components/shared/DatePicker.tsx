"use client";

import { format } from "date-fns";
import { CalendarIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { TimePicker } from "@/components/ui/time-picker";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import { useEffect, useState } from "react";

interface DatePickerProps {
  value: string | undefined;
  onChange: (value: string) => void;
  error?: string;
  className?: string;
  disabled?: boolean;
  minDate?: Date;
  maxDate?: Date;
  placeholder?: string;
  showTime?: boolean;
  defaultTime?: string;
}

export function DatePicker({
  value,
  onChange,
  error,
  className,
  disabled = false,
  minDate,
  maxDate,
  placeholder = "Pick a date",
  showTime = false,
  defaultTime = "00:00",
}: DatePickerProps) {
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(() => {
    if (value) {
      const date = new Date(value);
      return isNaN(date.getTime()) ? undefined : date;
    }
    return undefined;
  });

  const [timeString, setTimeString] = useState<string>(() => {
    if (value) {
      const date = new Date(value);
      if (!isNaN(date.getTime())) {
        return `${String(date.getHours()).padStart(2, "0")}:${String(date.getMinutes()).padStart(2, "0")}`;
      }
    }
    return defaultTime;
  });

  // Sync internal state with external value
  useEffect(() => {
    if (value) {
      const date = new Date(value);
      if (!isNaN(date.getTime())) {
        setSelectedDate(date);
        setTimeString(
          `${String(date.getHours()).padStart(2, "0")}:${String(date.getMinutes()).padStart(2, "0")}`
        );
      } else {
        setSelectedDate(undefined);
        setTimeString(defaultTime);
      }
    } else {
      setSelectedDate(undefined);
      setTimeString(defaultTime);
    }
  }, [value, defaultTime]);

  // Format date in local time (YYYY-MM-DDTHH:mm) without timezone conversion
  const formatLocalDateTime = (date: Date): string => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");
    const hours = String(date.getHours()).padStart(2, "0");
    const minutes = String(date.getMinutes()).padStart(2, "0");
    return `${year}-${month}-${day}T${hours}:${minutes}`;
  };

  const handleDateSelect = (date: Date | undefined) => {
    if (date) {
      const [hours, minutes] = timeString.split(":").map(Number);
      const newDate = new Date(date);
      newDate.setHours(hours || 0, minutes || 0, 0, 0);
      setSelectedDate(newDate);
      // Use local time formatting to avoid timezone conversion
      onChange(formatLocalDateTime(newDate));
    } else {
      setSelectedDate(undefined);
      onChange("");
    }
  };

  const handleTimeChange = (time: string) => {
    setTimeString(time);
    if (selectedDate) {
      const [hours, minutes] = time.split(":").map(Number);
      const newDate = new Date(selectedDate);
      newDate.setHours(hours || 0, minutes || 0, 0, 0);
      setSelectedDate(newDate);
      // Use local time formatting to avoid timezone conversion
      onChange(formatLocalDateTime(newDate));
    } else {
      // If no date selected, create a date with today's date and the selected time
      const today = new Date();
      const [hours, minutes] = time.split(":").map(Number);
      today.setHours(hours || 0, minutes || 0, 0, 0);
      setSelectedDate(today);
      onChange(formatLocalDateTime(today));
    }
  };

  const displayValue = selectedDate
    ? showTime
      ? format(selectedDate, "PPP 'at' HH:mm")
      : format(selectedDate, "PPP")
    : undefined;

  return (
    <div className={cn("space-y-2", className)}>
      <div className="flex gap-2">
        <Popover>
          <PopoverTrigger asChild>
            <Button
              variant="outline"
              disabled={disabled}
              className={cn(
                "flex-1 justify-start text-left font-normal h-11",
                !selectedDate && "text-muted-foreground",
                error && "border-destructive"
              )}
            >
              <CalendarIcon className="mr-2 h-4 w-4" />
              {displayValue || placeholder}
            </Button>
          </PopoverTrigger>
          {!disabled && (
            <PopoverContent className="w-auto p-0" align="start">
              <Calendar
                mode="single"
                selected={selectedDate}
                onSelect={handleDateSelect}
                disabled={(date) => {
                  if (minDate) {
                    const min = new Date(minDate);
                    min.setHours(0, 0, 0, 0);
                    if (date < min) return true;
                  }
                  if (maxDate) {
                    const max = new Date(maxDate);
                    max.setHours(23, 59, 59, 999);
                    if (date > max) return true;
                  }
                  return false;
                }}
                initialFocus
              />
            </PopoverContent>
          )}
        </Popover>

        {showTime && (
          <TimePicker
            value={timeString}
            onChange={handleTimeChange}
            error={error}
            className="w-32"
            disabled={disabled}
          />
        )}
      </div>
    </div>
  );
}

