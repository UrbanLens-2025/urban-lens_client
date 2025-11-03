"use client";

import { getBookableLocationById } from "@/api/events";
import { useQuery } from "@tanstack/react-query";

export function useBookableLocationById(locationId: string | null | undefined) {
  return useQuery({
    queryKey: ['bookableLocationDetail', locationId],
    queryFn: () => getBookableLocationById(locationId!),
    enabled: !!locationId,
  });
}