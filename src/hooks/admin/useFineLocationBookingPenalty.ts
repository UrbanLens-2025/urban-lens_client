"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { fineLocationBookingPenalty } from "@/api/penalty";

type FineLocationBookingPenaltyPayload = {
  targetEntityId: string;
  fineAmount: number;
  fineReason: string;
};

export function useFineLocationBookingPenalty() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      targetEntityId,
      fineAmount,
      fineReason,
    }: FineLocationBookingPenaltyPayload) =>
      fineLocationBookingPenalty({
        targetEntityId,
        targetEntityType: "booking",
        fineAmount,
        fineReason,
      }),
    onSuccess: () => {
      toast.success("Fine applied successfully");
      queryClient.invalidateQueries({ queryKey: ["adminPenalties"] });
    },
    onError: (error: Error) => {
      toast.error(error.message || "Failed to apply fine");
    },
  });
}

