"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { deleteAvailability } from "@/api/availability";

export function useDeleteAvailability() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => deleteAvailability(id),
    onSuccess: () => {
      toast.success("Availability slot deleted!");
      queryClient.invalidateQueries({ queryKey: ['availabilities'] });
    },
    onError: (err: Error) => toast.error(err.message),
  });
}