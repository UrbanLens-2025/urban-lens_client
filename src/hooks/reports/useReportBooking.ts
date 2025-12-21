"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { reportBooking, type ReportBookingPayload } from "@/api/reports";

export function useReportBooking() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: ReportBookingPayload) => reportBooking(payload),
    onSuccess: () => {
      toast.success("Booking report submitted successfully");
      queryClient.invalidateQueries({ queryKey: ["eventLocationBookings"] });
    },
    onError: (error: Error) => {
      toast.error(error.message || "Failed to submit booking report");
    },
  });
}

