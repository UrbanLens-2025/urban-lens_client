"use client";
import { useMutation } from "@tanstack/react-query";
import { addTagsToLocation } from "@/api/locations";

export function useAddTagsToLocation() {
  return useMutation({
    mutationFn: ({ locationId, tagIds }: { locationId: string, tagIds: number[] }) => 
      addTagsToLocation(locationId, tagIds),
  });
}