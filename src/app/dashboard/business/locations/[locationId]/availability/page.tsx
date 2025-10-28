/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { use, useMemo, useState } from "react";
import { Calendar, dateFnsLocalizer, View, Views } from "react-big-calendar";
import { format, parse, startOfWeek, getDay } from "date-fns";
import { enUS } from "date-fns/locale";
import "react-big-calendar/lib/css/react-big-calendar.css";

import { useAvailabilities } from "@/hooks/availability/useAvailabilities";
import { useCreateAvailability } from "@/hooks/availability/useCreateAvailability";

import { Loader2 } from "lucide-react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { LocationAvailability } from "@/types";
import { useUpdateAvailability } from "@/hooks/availability/useUpdateAvailability";
import { useDeleteAvailability } from "@/hooks/availability/useDeleteAvailability";

const locales = { "en-US": enUS };
const localizer = dateFnsLocalizer({
  format,
  parse,
  startOfWeek,
  getDay,
  locales,
});

interface CalendarEvent {
  id: string;
  title: string;
  start: Date;
  end: Date;
  resource: LocationAvailability;
}

export default function AvailabilityPage({
  params,
}: {
  params: Promise<{ locationId: string }>;
}) {
  const { locationId } = use(params);
  const [viewDate, setViewDate] = useState(new Date());
  const [currentView, setCurrentView] = useState<View>(Views.WEEK);
  const { data: availabilities, isLoading } = useAvailabilities(
    locationId,
    viewDate.getMonth(),
    viewDate.getFullYear()
  );
  const { mutate: createAvailability, isPending: isCreating } =
    useCreateAvailability();
  const { mutate: updateAvailability, isPending: isUpdating } =
    useUpdateAvailability();
  const { mutate: deleteAvailability, isPending: isDeleting } =
    useDeleteAvailability();

  const isPending = isCreating || isUpdating || isDeleting;

  const [slotToCreate, setSlotToCreate] = useState<{
    start: Date;
    end: Date;
  } | null>(null);
  const [selectedEvent, setSelectedEvent] = useState<CalendarEvent | null>(
    null
  );
  const [editNote, setEditNote] = useState("");

  const [note, setNote] = useState("");

  const events: CalendarEvent[] = useMemo(() => {
    if (!availabilities) return [];
    return availabilities.map((av) => ({
      id: av.id.toString(),
      title: av.note || "Available",
      start: new Date(av.startDateTime),
      end: new Date(av.endDateTime),
      resource: av,
    }));
  }, [availabilities]);

  const handleSelectSlot = ({ start, end }: { start: Date; end: Date }) => {
    setSlotToCreate({ start, end });
  };

  const handleSelectEvent = (event: CalendarEvent) => {
    setSelectedEvent(event);
    setEditNote(event.resource?.note || "");
  };

  const closeModals = () => {
    setSlotToCreate(null);
    setSelectedEvent(null);
    setEditNote("");
  }

  const onConfirmCreate = () => {
    if (!slotToCreate) return;

    createAvailability(
      {
        locationId,
        startDateTime: slotToCreate.start.toISOString(),
        endDateTime: slotToCreate.end.toISOString(),
        status: "available",
        note: note || undefined,
      },
      {
        onSuccess: () => {
          setSlotToCreate(null);
          setNote("");
        },
      }
    );
  };

  const onConfirmUpdate = () => {
    if (!selectedEvent) return;
    updateAvailability({
      id: selectedEvent.id,
      payload: { note: editNote, status: "available" }
    }, {
      onSuccess: closeModals
    });
  };

  const onConfirmDelete = () => {
    if (!selectedEvent) return;
    deleteAvailability(selectedEvent.id, {
      onSuccess: closeModals
    });
  };

  if (isLoading) {
    return (
      <div className="flex h-96 items-center justify-center">
        <Loader2 className="animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Manage Availability</CardTitle>
          <CardDescription>
            Click and drag on the calendar to add new availability slots. Click
            an existing slot to edit or delete it.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div style={{ height: "70vh" }}>
            <Calendar
              localizer={localizer}
              events={events}
              startAccessor="start"
              endAccessor="end"
              defaultView={Views.WEEK}
              views={[Views.MONTH, Views.WEEK, Views.DAY]}
              selectable={true}
              onSelectSlot={handleSelectSlot}
              onSelectEvent={handleSelectEvent}
              onNavigate={(newDate) => setViewDate(newDate)}
              date={viewDate}
              view={currentView}
              onView={(view) => setCurrentView(view)}
            />
          </div>
        </CardContent>
      </Card>

      <AlertDialog
        open={!!slotToCreate}
        onOpenChange={(isOpen) => {
          if (!isOpen) {
            setSlotToCreate(null);
            setNote("");
          }
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Add New Availability?</AlertDialogTitle>
            <AlertDialogDescription>
              Slot from <strong>{slotToCreate?.start.toLocaleString()}</strong>{" "}
              to <strong>{slotToCreate?.end.toLocaleString()}</strong>.
            </AlertDialogDescription>
          </AlertDialogHeader>

          <div className="space-y-2">
            <Label htmlFor="note">Note (Optional)</Label>
            <Textarea
              id="note"
              placeholder="Add a note for this slot..."
              value={note}
              onChange={(e) => setNote(e.target.value)}
            />
          </div>

          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={onConfirmCreate} disabled={isPending}>
              {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Confirm
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={!!selectedEvent} onOpenChange={!isPending ? closeModals : undefined}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Edit Availability</AlertDialogTitle>
            <AlertDialogDescription>
              Update the note for this slot, or delete it permanently.
              <br />
              <strong>From:</strong> {selectedEvent?.start.toLocaleString()}
              <br />
              <strong>To:</strong> {selectedEvent?.end.toLocaleString()}
            </AlertDialogDescription>
          </AlertDialogHeader>

          <div className="space-y-2">
            <Label htmlFor="edit-note">Note (Optional)</Label>
            <Textarea
              id="edit-note"
              placeholder="Update note..."
              value={editNote}
              onChange={(e) => setEditNote(e.target.value)}
            />
          </div>

          <AlertDialogFooter>
            <Button variant="destructive" onClick={onConfirmDelete} disabled={isPending} className="mr-auto">
              {isDeleting && <Loader2 className="mr-2 h-4 w-4 animate-spin"/>}
              Delete
            </Button>
            <AlertDialogCancel disabled={isPending}>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={onConfirmUpdate} disabled={isPending}>
              {isUpdating && <Loader2 className="mr-2 h-4 w-4 animate-spin"/>}
              Save Changes
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
