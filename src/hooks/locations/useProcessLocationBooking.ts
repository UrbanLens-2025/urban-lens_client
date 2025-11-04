"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { processLocationBooking } from "@/api/locations";
import { ProcessLocationBookingPayload } from "@/types";

export function useProcessLocationBooking() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      locationBookingId,
      payload,
    }: {
      locationBookingId: string;
      payload: ProcessLocationBookingPayload;
    }) => processLocationBooking({ locationBookingId, payload }),
    onSuccess: (_, variables) => {
      const statusLabel = variables.payload.status === "APPROVED" ? "approved" : "rejected";
      toast.success(`Location booking has been ${statusLabel}.`);
      queryClient.invalidateQueries({ queryKey: ['locationBookingDetail'] });
      queryClient.invalidateQueries({ queryKey: ['ownerLocationBookings'] });
    },
    onError: (err: Error) => {
      toast.error(err.message || "Failed to process location booking.");
    },
  });
}

