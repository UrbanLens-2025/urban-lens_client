"use client";

import { useQuery } from "@tanstack/react-query";
import { getLocationById } from "@/api/locations";

export function useLocationById(locationId: string | null) {
  return useQuery({
    queryKey: ["location", locationId],
    queryFn: () => getLocationById(locationId!),
    enabled: !!locationId,
  });
}