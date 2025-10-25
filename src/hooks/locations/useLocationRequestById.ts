"use client";

import { useQuery } from "@tanstack/react-query";
import { getLocationRequestById } from "@/api/locations";

export function useLocationRequestById(locationId: string | null) {
  return useQuery({
    queryKey: ["locationRequest", locationId],
    queryFn: () => getLocationRequestById(locationId!),
    enabled: !!locationId,
  });
}
