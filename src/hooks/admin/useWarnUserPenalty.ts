"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { warnUserPenalty } from "@/api/penalty";
import { ReportEntityType } from "@/types";

type WarnUserPayload = {
  targetEntityId: string;
  targetEntityType: ReportEntityType;
  warningNote: string;
};

export function useWarnUserPenalty() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ targetEntityId, targetEntityType, warningNote }: WarnUserPayload) =>
      warnUserPenalty({ targetEntityId, targetEntityType, warningNote }),
    onSuccess: () => {
      toast.success("Warning sent successfully");
      queryClient.invalidateQueries({ queryKey: ["adminPenalties"] });
    },
    onError: (error: Error) => {
      toast.error(error.message || "Failed to send warning");
    },
  });
}

