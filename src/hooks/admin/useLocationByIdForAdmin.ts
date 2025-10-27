"use client";

import { useQuery } from "@tanstack/react-query";
import { getLocationByIdForAdmin } from "@/api/admin";

export function useLocationByIdForAdmin(locationId: string | null) {
  return useQuery({
    queryKey: ['adminLocation', locationId],
    queryFn: () => getLocationByIdForAdmin(locationId!),
    enabled: !!locationId,
  });
}