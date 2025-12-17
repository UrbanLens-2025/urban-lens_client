"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { processReportsTicketRefund } from "@/api/reports";

type ProcessTicketRefundInput = {
  reportIds: string[];
  reason: string;
  refundPercentage: number;
  shouldCancelTickets: boolean;
};

export function useProcessReportsTicketRefund() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: ProcessTicketRefundInput) => processReportsTicketRefund(payload),
    onSuccess: () => {
      toast.success("Ticket refund request submitted");
      queryClient.invalidateQueries({ queryKey: ["adminReports"] });
      queryClient.invalidateQueries({ queryKey: ["adminReport"] });
    },
    onError: (error: Error) => {
      toast.error(error.message || "Failed to submit ticket refund");
    },
  });
}

