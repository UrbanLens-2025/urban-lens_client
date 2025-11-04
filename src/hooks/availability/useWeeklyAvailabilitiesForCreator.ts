"use client";

import { useQuery } from "@tanstack/react-query";
import { getWeeklyAvailabilitiesForCreator } from "@/api/availability";

export function useWeeklyAvailabilitiesForCreator(locationId: string | undefined) {
  return useQuery({
    queryKey: ["weeklyAvailabilitiesForCreator", locationId],
    queryFn: () => getWeeklyAvailabilitiesForCreator(locationId!),
    enabled: !!locationId,
  });
}

