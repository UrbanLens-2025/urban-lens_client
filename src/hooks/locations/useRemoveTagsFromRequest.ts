"use client";
import { useMutation } from "@tanstack/react-query";
import { removeTagsFromLocationRequest } from "@/api/locations";

export function useRemoveTagsFromRequest() {
  return useMutation({
    mutationFn: ({
      requestId,
      tagIds,
    }: {
      requestId: string;
      tagIds: number[];
    }) => removeTagsFromLocationRequest(requestId, tagIds),
  });
}
