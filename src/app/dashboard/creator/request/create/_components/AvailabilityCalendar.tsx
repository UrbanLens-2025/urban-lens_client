"use client";

import { useState } from "react";
import { Calendar as BigCalendar, momentLocalizer, SlotInfo, Event } from "react-big-calendar";
import moment from "moment";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Plus, X } from "lucide-react";

const localizer = momentLocalizer(moment);

interface TimeSlot {
  id: string;
  start: Date;
  end: Date;
  title: string;
}

interface AvailabilityCalendarProps {
  onSlotsChange: (slots: Array<{ startDateTime: Date; endDateTime: Date }>) => void;
  initialSlots?: Array<{ startDateTime: Date; endDateTime: Date }>;
}

export function AvailabilityCalendar({
  onSlotsChange,
  initialSlots = [],
}: AvailabilityCalendarProps) {
  const [selectedSlots, setSelectedSlots] = useState<TimeSlot[]>(
    initialSlots.map((slot, index) => ({
      id: `slot-${index}`,
      start: new Date(slot.startDateTime),
      end: new Date(slot.endDateTime),
      title: `Event Time ${index + 1}`,
    }))
  );

  const handleSelectSlot = (slotInfo: SlotInfo) => {
    const newSlot: TimeSlot = {
      id: `slot-${Date.now()}`,
      start: slotInfo.start,
      end: slotInfo.end,
      title: `Event Time ${selectedSlots.length + 1}`,
    };

    const updatedSlots = [...selectedSlots, newSlot];
    setSelectedSlots(updatedSlots);
    
    onSlotsChange(
      updatedSlots.map((slot) => ({
        startDateTime: slot.start,
        endDateTime: slot.end,
      }))
    );
  };

  const handleRemoveSlot = (slotId: string) => {
    const updatedSlots = selectedSlots.filter((slot) => slot.id !== slotId);
    setSelectedSlots(updatedSlots);
    
    onSlotsChange(
      updatedSlots.map((slot) => ({
        startDateTime: slot.start,
        endDateTime: slot.end,
      }))
    );
  };

  const eventStyleGetter = (event: Event) => {
    return {
      style: {
        backgroundColor: "#3b82f6",
        borderRadius: "5px",
        opacity: 0.8,
        color: "white",
        border: "0px",
        display: "block",
      },
    };
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Select Event Times</CardTitle>
        <p className="text-sm text-muted-foreground">
          Click and drag on the calendar to select time slots for your event. You can add multiple separate time slots.
        </p>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Selected Slots Display */}
        {selectedSlots.length > 0 && (
          <div className="space-y-2">
            <h4 className="text-sm font-medium">Selected Time Slots:</h4>
            <div className="flex flex-wrap gap-2">
              {selectedSlots.map((slot) => (
                <Badge key={slot.id} variant="default" className="pl-3 pr-2 py-2">
                  <span className="text-xs">
                    {moment(slot.start).format("MMM DD, h:mm A")} -{" "}
                    {moment(slot.end).format("h:mm A")}
                  </span>
                  <button
                    onClick={() => handleRemoveSlot(slot.id)}
                    className="ml-2 rounded-full hover:bg-white/20 p-0.5"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </Badge>
              ))}
            </div>
          </div>
        )}

        {/* Calendar */}
        <div className="h-[600px] border rounded-lg p-4">
          <BigCalendar
            localizer={localizer}
            events={selectedSlots}
            startAccessor="start"
            endAccessor="end"
            titleAccessor="title"
            selectable
            onSelectSlot={handleSelectSlot}
            eventPropGetter={eventStyleGetter}
            step={60}
            timeslots={1}
            defaultView="week"
            views={["week", "day"]}
            min={new Date(2024, 0, 1, 7, 0, 0)} // 7 AM
            max={new Date(2024, 0, 1, 22, 0, 0)} // 10 PM
            formats={{
              timeGutterFormat: "h A",
              eventTimeRangeFormat: ({ start, end }, culture, localizer) =>
                `${localizer?.format(start, "h:mm A", culture)} - ${localizer?.format(end, "h:mm A", culture)}`,
            }}
          />
        </div>

        {/* Instructions */}
        <div className="text-xs text-muted-foreground space-y-1">
          <p>• Click and drag to select a time slot</p>
          <p>• You can add multiple non-overlapping time slots</p>
          <p>• Click the X on a slot to remove it</p>
        </div>
      </CardContent>
    </Card>
  );
}

