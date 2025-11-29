"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { cancelLocationBooking, CancelLocationBookingPayload } from "@/api/events";

export function useCancelLocationBooking() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      eventId,
      locationBookingId,
      payload,
    }: {
      eventId: string;
      locationBookingId: string;
      payload: CancelLocationBookingPayload;
    }) => cancelLocationBooking(eventId, locationBookingId, payload),
    
    onSuccess: (data, variables) => {
      toast.success("Booking has been cancelled successfully.");
      // Invalidate both generic event queries and specific event details
      queryClient.invalidateQueries({ queryKey: ['event'] });
      queryClient.invalidateQueries({ queryKey: ['eventDetail', variables.eventId] });
    },
    onError: (err: Error) => {
      toast.error(err.message || "Failed to cancel booking.");
    },
  });
}

