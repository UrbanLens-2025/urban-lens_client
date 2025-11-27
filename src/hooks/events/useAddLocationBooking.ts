"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { addLocationBookingToEvent, type AddLocationBookingPayload } from "@/api/events";

export function useAddLocationBooking(eventId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: AddLocationBookingPayload) =>
      addLocationBookingToEvent(eventId, payload),
    onSuccess: () => {
      // Invalidate event queries to refresh data
      queryClient.invalidateQueries({ queryKey: ["events", eventId] });
      queryClient.invalidateQueries({ queryKey: ["events"] });
    },
    onError: (error: any) => {
      const message = error?.response?.data?.message ?? error?.message ?? "Failed to create location booking";
      toast.error(message);
    },
  });
}

