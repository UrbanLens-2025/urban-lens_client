"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { updateLocationMission } from "@/api/missions";
import { UpdateLocationMissionPayload } from "@/types";
import { useRouter } from "next/navigation";

export function useUpdateLocationMission() {
  const queryClient = useQueryClient();
  const router = useRouter();

  return useMutation({
    mutationFn: ({ missionId, payload }: { missionId: string, payload: UpdateLocationMissionPayload }) => 
      updateLocationMission({ missionId, payload }),
    
    onSuccess: (updatedMission) => {
      toast.success("Mission updated successfully!");
      
      queryClient.invalidateQueries({ 
        queryKey: ['locationMissions', updatedMission.locationId] 
      });
      queryClient.setQueryData(
        ['locationMission', updatedMission.id], 
        updatedMission
      );
      
      router.back();
      router.refresh();
    },
    onError: (err: Error) => {
      toast.error(err.message || "Failed to update mission.");
    },
  });
}