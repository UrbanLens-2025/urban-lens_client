"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { suspendLocationBookingPenalty } from "@/api/penalty";

type SuspendLocationBookingPenaltyPayload = {
  targetEntityId: string;
  suspensionReason: string;
  suspendedUntil: string;
};

export function useSuspendLocationBookingPenalty() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      targetEntityId,
      suspensionReason,
      suspendedUntil,
    }: SuspendLocationBookingPenaltyPayload) =>
      suspendLocationBookingPenalty({
        targetEntityId,
        targetEntityType: "location",
        suspensionReason,
        suspendedUntil,
      }),
    onSuccess: () => {
      toast.success("Location booking suspended successfully");
      queryClient.invalidateQueries({ queryKey: ["adminPenalties"] });
    },
    onError: (error: Error) => {
      toast.error(error.message || "Failed to suspend booking ability");
    },
  });
}


