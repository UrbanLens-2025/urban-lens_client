"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { processReportsMalicious } from "@/api/reports";
import { toast } from "sonner";

type ProcessMaliciousInput = {
  reportIds: string[];
  reason: string;
};

export function useProcessReportsMalicious() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: ProcessMaliciousInput) => processReportsMalicious(payload),
    onSuccess: () => {
      toast.success("Reports marked as malicious");
      queryClient.invalidateQueries({ queryKey: ["adminReports"] });
      queryClient.invalidateQueries({ queryKey: ["adminReport"] });
    },
    onError: (error: Error) => {
      toast.error(error.message || "Failed to mark reports as malicious");
    },
  });
}

