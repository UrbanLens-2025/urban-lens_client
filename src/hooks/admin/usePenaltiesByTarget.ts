"use client";

import { useQuery } from "@tanstack/react-query";
import { getPenaltiesByTarget } from "@/api/penalty";
import type { ReportEntityType } from "@/types";

export function usePenaltiesByTarget(targetId: string, targetType: ReportEntityType) {
  return useQuery({
    queryKey: ["adminPenalties", targetId, targetType],
    queryFn: () => getPenaltiesByTarget(targetId, targetType),
    enabled: Boolean(targetId && targetType),
  });
}

