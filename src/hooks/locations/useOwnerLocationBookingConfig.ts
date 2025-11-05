"use client";

import { useQuery } from "@tanstack/react-query";
import { getOwnerLocationBookingConfig } from "@/api/locations";

export function useOwnerLocationBookingConfig(locationId: string | null | undefined) {
  return useQuery({
    queryKey: ['ownerLocationBookingConfig', locationId],
    queryFn: () => getOwnerLocationBookingConfig(locationId!),
    enabled: !!locationId,
  });
}

