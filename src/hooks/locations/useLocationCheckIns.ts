"use client";

import { useQuery } from "@tanstack/react-query";
import { getLocationCheckIns, GetLocationCheckInsParams } from "@/api/locations";

export function useLocationCheckIns(params: GetLocationCheckInsParams) {
  return useQuery({
    queryKey: ['locationCheckIns', params],
    queryFn: () => getLocationCheckIns(params),
    enabled: !!params.locationId,
    placeholderData: (previousData) => previousData,
  });
}

