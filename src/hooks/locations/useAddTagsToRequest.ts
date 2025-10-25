"use client";
import { useMutation } from "@tanstack/react-query";
import { addTagsToLocationRequest } from "@/api/locations";
import { toast } from "sonner";

export function useAddTagsToRequest() {
  return useMutation({
    mutationFn: ({ locationRequestId, tagIds }: { locationRequestId: string, tagIds: number[] }) => 
      addTagsToLocationRequest(locationRequestId, tagIds),
    onError: (err: Error) => toast.error(`Failed to add tags: ${err.message}`),
  });
}