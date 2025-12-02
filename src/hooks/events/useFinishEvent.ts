"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { finishEvent } from "@/api/events";

export function useFinishEvent() {
  const queryClient = useQueryClient();
  const router = useRouter();

  return useMutation({
    mutationFn: (eventId: string) => finishEvent(eventId),

    onSuccess: (data) => {
      toast.success("Event finished successfully!");
      queryClient.invalidateQueries({ queryKey: ['eventDetail'] });
      queryClient.invalidateQueries({ queryKey: ['myEvents'] });
      queryClient.setQueryData(['eventDetail', data.id], data);
      router.refresh();
    },
    onError: (err: Error) => {
      toast.error(err.message || "Failed to finish event. Please try again.");
    },
  });
}

