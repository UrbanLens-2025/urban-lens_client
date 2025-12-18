"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { processReportBookingRefund } from "@/api/reports";

type ProcessBookingRefundInput = {
  reportId: string;
  reason: string;
  refundPercentage: number;
  shouldCancelBooking: boolean;
};

export function useProcessReportBookingRefund() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: ProcessBookingRefundInput) => processReportBookingRefund(payload),
    onSuccess: () => {
      toast.success("Booking refund submitted");
      queryClient.invalidateQueries({ queryKey: ["adminReports"] });
      queryClient.invalidateQueries({ queryKey: ["adminReport"] });
    },
    onError: (error: Error) => {
      toast.error(error.message || "Failed to refund booking");
    },
  });
}


