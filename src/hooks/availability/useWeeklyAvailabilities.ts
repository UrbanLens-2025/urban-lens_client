"use client";

import { useQuery } from "@tanstack/react-query";
import { getWeeklyAvailabilities } from "@/api/availability";

export function useWeeklyAvailabilities(locationId: string) {
  return useQuery({
    queryKey: ["weeklyAvailabilities", locationId],
    queryFn: () => getWeeklyAvailabilities(locationId),
    enabled: !!locationId,
  });
}

