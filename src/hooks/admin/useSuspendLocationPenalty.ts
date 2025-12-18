"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { suspendLocationPenalty } from "@/api/penalty";

type SuspendLocationPenaltyPayload = {
  targetEntityId: string;
  suspensionReason: string;
  suspendedUntil: string;
};

export function useSuspendLocationPenalty() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      targetEntityId,
      suspensionReason,
      suspendedUntil,
    }: SuspendLocationPenaltyPayload) =>
      suspendLocationPenalty({
        targetEntityId,
        targetEntityType: "location",
        suspensionReason,
        suspendedUntil,
      }),
    onSuccess: () => {
      toast.success("Location suspended successfully");
      queryClient.invalidateQueries({ queryKey: ["adminPenalties"] });
    },
    onError: (error: Error) => {
      toast.error(error.message || "Failed to suspend location");
    },
  });
}


