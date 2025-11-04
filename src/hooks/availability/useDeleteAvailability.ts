"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { deleteAvailability } from "@/api/availability";

export function useDeleteAvailability(locationId?: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string | number) => deleteAvailability(String(id)),
    onSuccess: () => {
      toast.success("Availability slot deleted!");
      queryClient.invalidateQueries({ queryKey: ['availabilities'] });
      if (locationId) {
        queryClient.invalidateQueries({ queryKey: ["weeklyAvailabilities", locationId] });
      }
    },
    onError: (err: Error) => toast.error(err.message),
  });
}