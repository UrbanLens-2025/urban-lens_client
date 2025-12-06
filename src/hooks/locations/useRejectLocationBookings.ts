"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { rejectLocationBookings } from "@/api/locations";

export function useRejectLocationBookings() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (locationBookingIds: string[]) => rejectLocationBookings(locationBookingIds),
    onSuccess: (_, locationBookingIds) => {
      const count = locationBookingIds.length;
      toast.success(
        count === 1 
          ? "Location booking has been rejected." 
          : `${count} location bookings have been rejected.`
      );
      queryClient.invalidateQueries({ queryKey: ['locationBookingDetail'] });
      queryClient.invalidateQueries({ queryKey: ['ownerLocationBookings'] });
      queryClient.invalidateQueries({ queryKey: ['conflictingBookings'] });
    },
    onError: (err: Error) => {
      toast.error(err.message || "Failed to reject location bookings.");
    },
  });
}

