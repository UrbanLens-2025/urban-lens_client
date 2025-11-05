"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { addEventTags, removeEventTags } from "@/api/events";
import type { AddEventTagsPayload, RemoveEventTagsPayload } from "@/types";

export function useAddEventTags() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ eventId, payload }: { eventId: string; payload: AddEventTagsPayload }) =>
      addEventTags(eventId, payload),

    onSuccess: (_, variables) => {
      toast.success("Tags added successfully!");
      queryClient.invalidateQueries({ queryKey: ['eventDetail', variables.eventId] });
      queryClient.invalidateQueries({ queryKey: ['myEvents'] });
    },
    onError: (err: Error) => {
      toast.error(err.message || "Failed to add tags. Please try again.");
    },
  });
}

export function useRemoveEventTags() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ eventId, payload }: { eventId: string; payload: RemoveEventTagsPayload }) =>
      removeEventTags(eventId, payload),

    onSuccess: (_, variables) => {
      toast.success("Tags removed successfully!");
      queryClient.invalidateQueries({ queryKey: ['eventDetail', variables.eventId] });
      queryClient.invalidateQueries({ queryKey: ['myEvents'] });
    },
    onError: (err: Error) => {
      toast.error(err.message || "Failed to remove tags. Please try again.");
    },
  });
}

