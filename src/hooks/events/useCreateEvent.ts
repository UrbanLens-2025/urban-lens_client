"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { createEvent, CreateEventPayload, addLocationBookingToEvent } from "@/api/events";
import { useRouter } from "next/navigation";

export function useCreateEvent() {
  const queryClient = useQueryClient();
  const router = useRouter();

  return useMutation({
    mutationFn: async (payload: CreateEventPayload) => {
      // Create the event first
      const event = await createEvent(payload);
      
      // If location and date ranges are provided, create location booking
      if (payload.locationId && payload.dateRanges && payload.dateRanges.length > 0) {
        try {
          await addLocationBookingToEvent(event.id, {
            locationId: payload.locationId,
            dates: payload.dateRanges.map(range => ({
              startDateTime: range.startDateTime,
              endDateTime: range.endDateTime,
            })),
          });
        } catch (error) {
          // If location booking fails, log error but don't fail the entire event creation
          console.error("Failed to create location booking:", error);
          toast.warning("Event created but location booking failed. You can add it later.");
        }
      }
      
      return event;
    },
    
    onSuccess: (event) => {
      toast.success("Event created successfully!");
      queryClient.invalidateQueries({ queryKey: ['events'] });
      queryClient.invalidateQueries({ queryKey: ['eventDetail', event.id] });
      queryClient.invalidateQueries({ queryKey: ['eventLocationBookings', event.id] });
      router.push(`/dashboard/creator/events/${event.id}`);
    },
    onError: (err: Error) => {
      toast.error(err.message || "Failed to create event.");
    },
  });
}

