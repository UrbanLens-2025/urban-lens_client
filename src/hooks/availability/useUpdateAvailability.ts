"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { updateAvailability } from "@/api/availability";
import { UpdateAvailabilityPayload } from "@/types";

export function useUpdateAvailability() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, payload }: { id: string, payload: UpdateAvailabilityPayload }) => 
      updateAvailability(id, payload),
    onSuccess: () => {
      toast.success("Availability slot updated!");
      queryClient.invalidateQueries({ queryKey: ['availabilities'] });
    },
    onError: (err: Error) => toast.error(err.message),
  });
}