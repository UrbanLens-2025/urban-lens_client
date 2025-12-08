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
import { Label } from "@/components/ui/label";
import { TimePicker } from "@/components/ui/time-picker";
import { cn } from "@/lib/utils";
import { useEffect, useState } from "react";

interface DateTimePickerProps {
  label: string;
  value: Date | undefined;
  onChange: (date: Date | undefined) => void;
  error?: string;
  className?: string;
  defaultTime?: string;
  eventStartDate?: Date;
  eventEndDate?: Date;
}

export function DateTimePicker({
  label,
  value,
  onChange,
  error,
  className,
  defaultTime = "00:00",
  eventStartDate,
  eventEndDate,
}: DateTimePickerProps) {
  const normalizedDefault =
    /^\d{2}:\d{2}$/.test(defaultTime) ? defaultTime : "00:00";
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(
    value ? new Date(value) : undefined
  );
  const [timeString, setTimeString] = useState<string>(
    value
      ? `${String(value.getHours()).padStart(2, "0")}:${String(value.getMinutes()).padStart(2, "0")}`
      : normalizedDefault
  );

  // Sync internal state with external value
  useEffect(() => {
    if (value) {
      setSelectedDate(new Date(value));
      setTimeString(
        `${String(value.getHours()).padStart(2, "0")}:${String(value.getMinutes()).padStart(2, "0")}`
      );
    } else {
      setSelectedDate(undefined);
      setTimeString(normalizedDefault);
    }
  }, [value, normalizedDefault]);

  const handleDateSelect = (date: Date | undefined) => {
    if (date) {
      const [hours, minutes] = timeString.split(":").map(Number);
      const newDate = new Date(date);
      newDate.setHours(hours || 0, minutes || 0, 0, 0);
      setSelectedDate(date);
      onChange(newDate);
    } else {
      setSelectedDate(undefined);
      onChange(undefined);
    }
  };

  const handleTimeChange = (time: string) => {
    setTimeString(time);
    if (selectedDate) {
      const [hours, minutes] = time.split(":").map(Number);
      const newDate = new Date(selectedDate);
      newDate.setHours(hours || 0, minutes || 0, 0, 0);
      onChange(newDate);
    } else {
      // If no date selected, create a date with today's date and the selected time
      const today = new Date();
      const [hours, minutes] = time.split(":").map(Number);
      today.setHours(hours || 0, minutes || 0, 0, 0);
      onChange(today);
    }
  };

  const displayValue = value
    ? format(value, "PPP")
    : undefined;

  return (
    <div className={cn("space-y-2", className)}>
      <Label>{label}</Label>
      <div className="flex flex-wrap gap-2">
        <Popover>
          <PopoverTrigger asChild>
            <Button
              variant="outline"
              className={cn(
                "flex-1 justify-start text-left font-normal min-w-[140px]",
                !value && "text-muted-foreground",
                error && "border-destructive"
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
                const today = new Date();
                today.setHours(0, 0, 0, 0);
                return date < today;
              }}
              modifiers={{
                eventStart: eventStartDate ? (date: Date) => {
                  const eventStart = new Date(eventStartDate);
                  eventStart.setHours(0, 0, 0, 0);
                  const compareDate = new Date(date);
                  compareDate.setHours(0, 0, 0, 0);
                  return compareDate.getTime() === eventStart.getTime();
                } : undefined,
                eventEnd: eventEndDate ? (date: Date) => {
                  const eventEnd = new Date(eventEndDate);
                  eventEnd.setHours(0, 0, 0, 0);
                  const compareDate = new Date(date);
                  compareDate.setHours(0, 0, 0, 0);
                  return compareDate.getTime() === eventEnd.getTime();
                } : undefined,
              }}
              modifiersClassNames={{
                eventStart: "bg-red-100 dark:bg-red-900/30 border-2 border-red-500 text-red-700 dark:text-red-400 font-semibold",
                eventEnd: "bg-red-100 dark:bg-red-900/30 border-2 border-red-500 text-red-700 dark:text-red-400 font-semibold",
              }}
              initialFocus
            />
          </PopoverContent>
        </Popover>

        <TimePicker
          value={timeString}
          onChange={handleTimeChange}
          error={error}
          className="w-32"
        />
      </div>
    </div>
  );
}

