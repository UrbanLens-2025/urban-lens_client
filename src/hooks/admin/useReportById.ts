"use client";

import { useQuery } from "@tanstack/react-query";
import { getReportById } from "@/api/reports";

export function useReportById(reportId: string | null) {
  return useQuery({
    queryKey: ["adminReport", reportId],
    queryFn: () => getReportById(reportId!),
    enabled: !!reportId,
  });
}


