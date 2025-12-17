"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { markReportsFirstSeen } from "@/api/reports";
import type { PaginatedData, Report } from "@/types";

type MarkFirstSeenInput = {
  reportId: string;
  firstSeenAt?: string;
  firstSeenByAdminId?: string | null;
};

export function useMarkReportFirstSeen() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ reportId }: MarkFirstSeenInput) =>
      markReportsFirstSeen([reportId]),
    onMutate: ({ reportId, firstSeenAt, firstSeenByAdminId }) => {
      queryClient.setQueriesData(
        { queryKey: ["adminReports"] },
        (existing: PaginatedData<Report> | undefined) => {
          if (!existing?.data) return existing;
          const optimisticFirstSeenAt = firstSeenAt ?? new Date().toISOString();
          const updated = existing.data.map((report) =>
            report.id === reportId
              ? {
                  ...report,
                  firstSeenAt: optimisticFirstSeenAt,
                  firstSeenByAdminId:
                    firstSeenByAdminId ?? report.firstSeenByAdminId ?? null,
                }
              : report
          );
          return { ...existing, data: updated };
        }
      );
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ["adminReports"] });
      queryClient.invalidateQueries({ queryKey: ["adminReport"] });
    },
  });
}

