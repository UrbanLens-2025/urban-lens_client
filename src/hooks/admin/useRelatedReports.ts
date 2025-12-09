"use client";

import { useQuery } from "@tanstack/react-query";
import { getReports } from "@/api/reports";
import { GetReportsParams, ReportTargetType } from "@/types";

export function useRelatedReports(
  targetId: string | null | undefined,
  targetType: string | null | undefined,
  excludeReportId?: string
) {
  return useQuery({
    queryKey: ["relatedReports", targetId, targetType, excludeReportId],
    queryFn: async () => {
      const params: GetReportsParams = {
        page: 1,
        limit: 10,
        sortBy: "createdAt:DESC",
        targetId: targetId || undefined,
        targetType: targetType as ReportTargetType | undefined,
      };
      const data = await getReports(params);
      // Filter out the current report if excludeReportId is provided
      if (excludeReportId && data.data) {
        return {
          ...data,
          data: data.data.filter((report) => report.id !== excludeReportId),
          meta: {
            ...data.meta,
            totalItems: data.meta.totalItems - (data.data.some((r) => r.id === excludeReportId) ? 1 : 0),
          },
        };
      }
      return data;
    },
    enabled: !!targetId && !!targetType,
    placeholderData: (previousData) => previousData,
  });
}

