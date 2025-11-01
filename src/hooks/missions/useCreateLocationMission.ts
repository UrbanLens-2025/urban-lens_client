"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { CreateLocationMissionPayload } from "@/types";
import { useRouter } from "next/navigation";
import { createLocationMission } from "@/api/missions";

export function useCreateLocationMission(locationId: string) {
  const queryClient = useQueryClient();
  const router = useRouter();

  return useMutation({
    mutationFn: (payload: CreateLocationMissionPayload) => 
      createLocationMission({ locationId, payload }),
    
    onSuccess: () => {
      toast.success("Mission created successfully!");
      queryClient.invalidateQueries({ queryKey: ['locationMissions', locationId] });
      
      router.back();
    },
    onError: (err: Error) => {
      toast.error(err.message || "Failed to create mission.");
    },
  });
}