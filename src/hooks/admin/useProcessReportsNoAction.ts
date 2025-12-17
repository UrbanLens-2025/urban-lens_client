"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { processReportsNoAction } from "@/api/reports";
import { toast } from "sonner";

type ProcessNoActionInput = {
  reportIds: string[];
  reason: string;
};

export function useProcessReportsNoAction() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: ProcessNoActionInput) => processReportsNoAction(payload),
    onSuccess: () => {
      toast.success("Reports processed with no action");
      queryClient.invalidateQueries({ queryKey: ["adminReports"] });
      queryClient.invalidateQueries({ queryKey: ["adminReport"] });
    },
    onError: (error: Error) => {
      toast.error(error.message || "Failed to process reports");
    },
  });
}

