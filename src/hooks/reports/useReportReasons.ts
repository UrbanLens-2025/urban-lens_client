"use client";

import { useQuery } from "@tanstack/react-query";
import { getReportReasons, type ReportReason } from "@/api/reports";

export function useReportReasons() {
  return useQuery<ReportReason[]>({
    queryKey: ["reportReasons"],
    queryFn: () => getReportReasons(),
  });
}

