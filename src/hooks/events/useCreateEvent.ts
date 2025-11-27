"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { createEvent, CreateEventPayload } from "@/api/events";
import { useRouter } from "next/navigation";

export function useCreateEvent() {
  const queryClient = useQueryClient();
  const router = useRouter();

  return useMutation({
    mutationFn: (payload: CreateEventPayload) => createEvent(payload),
    
    onSuccess: (event) => {
      toast.success("Event created successfully!");
      queryClient.invalidateQueries({ queryKey: ['events'] });
      router.push(`/dashboard/creator/events/${event.id}`);
    },
    onError: (err: Error) => {
      toast.error(err.message || "Failed to create event.");
    },
  });
}

