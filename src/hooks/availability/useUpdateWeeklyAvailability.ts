"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { updateWeeklyAvailability, UpdateWeeklyAvailabilityPayload } from "@/api/availability";

export function useUpdateWeeklyAvailability(locationId?: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, payload }: { id: number; payload: UpdateWeeklyAvailabilityPayload }) =>
      updateWeeklyAvailability(id, payload),
    onSuccess: (_, variables) => {
      toast.success("Availability updated!");
      queryClient.invalidateQueries({ queryKey: ["availabilities"] });
      if (locationId) {
        queryClient.invalidateQueries({ queryKey: ["weeklyAvailabilities", locationId] });
      }
    },
    onError: (err: Error) => toast.error(err.message),
  });
}

