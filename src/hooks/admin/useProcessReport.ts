"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { processReport, deleteReport } from "@/api/reports";
import { ProcessReportPayload } from "@/types";

export function useProcessReport() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ reportId, payload }: { reportId: string; payload: ProcessReportPayload }) =>
      processReport(reportId, payload),
    onSuccess: () => {
      toast.success("Report processed successfully");
      queryClient.invalidateQueries({ queryKey: ["adminReports"] });
      queryClient.invalidateQueries({ queryKey: ["adminReport"] });
    },
    onError: (error: Error) => {
      toast.error(error.message || "Failed to process report");
    },
  });
}

export function useDeleteReport() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (reportId: string) => deleteReport(reportId),
    onSuccess: () => {
      toast.success("Report deleted successfully");
      queryClient.invalidateQueries({ queryKey: ["adminReports"] });
    },
    onError: (error: Error) => {
      toast.error(error.message || "Failed to delete report");
    },
  });
}


