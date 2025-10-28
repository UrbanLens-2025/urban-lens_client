"use client";

import { useQuery } from "@tanstack/react-query";
import { getAvailabilities } from "@/api/availability";

export function useAvailabilities(
  locationId: string,
  month: number,
  year: number
) {
  return useQuery({
    queryKey: ["availabilities", locationId, month, year],
    queryFn: () => getAvailabilities(locationId, month, year),
  });
}
