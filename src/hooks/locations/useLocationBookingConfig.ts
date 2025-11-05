"use client";

import { useQuery } from "@tanstack/react-query";
import { getLocationBookingConfig } from "@/api/locations";

export function useLocationBookingConfig(locationId: string | null | undefined) {
  return useQuery({
    queryKey: ['locationBookingConfig', locationId],
    queryFn: () => getLocationBookingConfig(locationId!),
    enabled: !!locationId,
  });
}

