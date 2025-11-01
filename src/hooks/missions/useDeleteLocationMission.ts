"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { deleteLocationMission } from "@/api/missions";

export function useDeleteLocationMission(locationId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (missionId: string) => deleteLocationMission(missionId),
    
    onSuccess: () => {
      toast.success("Mission deleted successfully!");
      queryClient.invalidateQueries({ queryKey: ['locationMissions', { locationId }] });
    },
    onError: (err: Error) => {
      toast.error(err.message || "Failed to delete mission.");
    },
  });
}