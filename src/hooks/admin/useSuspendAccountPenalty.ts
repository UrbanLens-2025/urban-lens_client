"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { suspendAccountPenalty } from "@/api/penalty";

type SuspendAccountPenaltyPayload = {
  targetEntityId: string;
  suspendUntil: string;
  suspensionReason: string;
};

export function useSuspendAccountPenalty() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      targetEntityId,
      suspendUntil,
      suspensionReason,
    }: SuspendAccountPenaltyPayload) =>
      suspendAccountPenalty({
        targetEntityId,
        targetEntityType: "post",
        suspendUntil,
        suspensionReason,
      }),
    onSuccess: () => {
      toast.success("Account suspended successfully");
      queryClient.invalidateQueries({ queryKey: ["adminPenalties"] });
    },
    onError: (error: Error) => {
      toast.error(error.message || "Failed to suspend account");
    },
  });
}


