"use client";

import * as React from "react";
import { Clock } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";

interface TimePickerProps {
  value?: string; // Format: "HH:mm"
  onChange: (time: string) => void;
  error?: string;
  className?: string;
}

// Generate hours (0-23) and minutes (0-59)
const hours = Array.from({ length: 24 }, (_, i) => i.toString().padStart(2, "0"));
const minutes = Array.from({ length: 60 }, (_, i) => i.toString().padStart(2, "0"));

export function TimePicker({
  value,
  onChange,
  error,
  className,
}: TimePickerProps) {
  const [open, setOpen] = React.useState(false);
  const [selectedHour, setSelectedHour] = React.useState<string>("00");
  const [selectedMinute, setSelectedMinute] = React.useState<string>("00");

  React.useEffect(() => {
    if (value) {
      const [hour, minute] = value.split(":");
      setSelectedHour(hour || "00");
      setSelectedMinute(minute || "00");
    }
  }, [value]);

  const handleHourChange = (hour: string) => {
    setSelectedHour(hour);
    onChange(`${hour}:${selectedMinute}`);
  };

  const handleMinuteChange = (minute: string) => {
    setSelectedMinute(minute);
    onChange(`${selectedHour}:${minute}`);
  };

  const displayValue = value || "00:00";

  return (
    <div className={cn("w-full", className)}>
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            className={cn(
              "w-full justify-start text-left font-normal h-9",
              !value && "text-muted-foreground",
              error && "border-destructive"
            )}
          >
            <Clock className="mr-2 h-4 w-4" />
            {displayValue}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-4" align="start">
          <div className="flex items-center gap-3">
            <div className="flex flex-col gap-2">
              <label className="text-xs font-medium text-muted-foreground">Hour</label>
              <Select value={selectedHour} onValueChange={handleHourChange}>
                <SelectTrigger className="w-20">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="max-h-[200px]">
                  {hours.map((hour) => (
                    <SelectItem key={hour} value={hour}>
                      {hour}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="text-2xl font-semibold pt-6">:</div>
            <div className="flex flex-col gap-2">
              <label className="text-xs font-medium text-muted-foreground">Minute</label>
              <Select value={selectedMinute} onValueChange={handleMinuteChange}>
                <SelectTrigger className="w-20">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="max-h-[200px]">
                  {minutes.map((minute) => (
                    <SelectItem key={minute} value={minute}>
                      {minute}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="flex justify-end gap-2 mt-4 pt-4 border-t">
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                onChange("00:00");
                setSelectedHour("00");
                setSelectedMinute("00");
                setOpen(false);
              }}
            >
              Clear
            </Button>
            <Button
              size="sm"
              onClick={() => setOpen(false)}
            >
              Done
            </Button>
          </div>
        </PopoverContent>
      </Popover>
      {error && <p className="text-sm text-destructive mt-1">{error}</p>}
    </div>
  );
}

