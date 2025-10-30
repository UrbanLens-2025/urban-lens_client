"use client";

import { useQuery } from "@tanstack/react-query";
import { GetLocationMissionsParams } from "@/types";
import { getLocationMissions } from "@/api/missions";

export function useLocationMissions(params: GetLocationMissionsParams) {
  return useQuery({
    queryKey: ["locationMissions", params],
    queryFn: () => getLocationMissions(params),
    placeholderData: (previousData) => previousData,
  });
}
