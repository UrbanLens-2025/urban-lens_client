"use client";
import { useMutation } from "@tanstack/react-query";
import { removeTagsFromLocation } from "@/api/locations";

export function useRemoveTagsFromLocation() {
  return useMutation({
    mutationFn: ({ locationId, tagIds }: { locationId: string, tagIds: number[] }) => 
      removeTagsFromLocation(locationId, tagIds),
  });
}