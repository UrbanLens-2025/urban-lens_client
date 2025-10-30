"use client";

import { useQuery } from "@tanstack/react-query";
import { getLocationMissionById } from "@/api/missions";

export function useLocationMissionById(missionId: string | null) {
  return useQuery({
    queryKey: ["locationMission", missionId],
    queryFn: () => getLocationMissionById(missionId!),
    enabled: !!missionId,
  });
}
