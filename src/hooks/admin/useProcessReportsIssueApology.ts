"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { processReportsIssueApology } from "@/api/reports";

type ProcessIssueApologyInput = {
  reportIds: string[];
  reason: string;
};

export function useProcessReportsIssueApology() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: ProcessIssueApologyInput) => processReportsIssueApology(payload),
    onSuccess: () => {
      toast.success("Apology sent");
      queryClient.invalidateQueries({ queryKey: ["adminReports"] });
      queryClient.invalidateQueries({ queryKey: ["adminReport"] });
    },
    onError: (error: Error) => {
      toast.error(error.message || "Failed to send apology");
    },
  });
}


