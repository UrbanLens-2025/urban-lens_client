"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { publishEvent } from "@/api/events";

export function usePublishEvent() {
  const queryClient = useQueryClient();
  const router = useRouter();

  return useMutation({
    mutationFn: (eventId: string) => publishEvent(eventId),

    onSuccess: (data) => {
      toast.success("Event published successfully!");
      queryClient.invalidateQueries({ queryKey: ['eventDetail'] });
      queryClient.invalidateQueries({ queryKey: ['myEvents'] });
      queryClient.setQueryData(['eventDetail', data.id], data);
      router.refresh();
    },
    onError: (err: Error) => {
      toast.error(err.message || "Failed to publish event. Please try again.");
    },
  });
}

