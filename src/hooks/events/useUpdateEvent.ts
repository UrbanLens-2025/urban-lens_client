"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { updateEvent } from "@/api/events";
import type { UpdateEventPayload } from "@/types";

export function useUpdateEvent() {
  const queryClient = useQueryClient();
  const router = useRouter();

  return useMutation({
    mutationFn: ({ eventId, payload }: { eventId: string; payload: UpdateEventPayload }) =>
      updateEvent(eventId, payload),

    onSuccess: (data) => {
      toast.success("Event updated successfully!");
      queryClient.invalidateQueries({ queryKey: ['eventDetail'] });
      queryClient.invalidateQueries({ queryKey: ['myEvents'] });
      queryClient.setQueryData(['eventDetail', data.id], data);
      router.push('/dashboard/creator/events');
      router.refresh();
    },
    onError: (err: Error) => {
      toast.error(err.message || "Failed to update event. Please try again.");
    },
  });
}

