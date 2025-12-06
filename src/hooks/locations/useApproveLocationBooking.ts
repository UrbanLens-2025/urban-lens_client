"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { approveLocationBooking } from "@/api/locations";

export function useApproveLocationBooking() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (locationBookingId: string) => approveLocationBooking(locationBookingId),
    onSuccess: () => {
      toast.success("Location booking has been approved.");
      queryClient.invalidateQueries({ queryKey: ['locationBookingDetail'] });
      queryClient.invalidateQueries({ queryKey: ['ownerLocationBookings'] });
      queryClient.invalidateQueries({ queryKey: ['conflictingBookings'] });
    },
    onError: (err: Error) => {
      toast.error(err.message || "Failed to approve location booking.");
    },
  });
}

