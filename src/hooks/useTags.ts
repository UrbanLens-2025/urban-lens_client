"use client";

import { getAllTags } from "@/api/tag";
import { useQuery } from "@tanstack/react-query";

export function useTags() {
  return useQuery({
    queryKey: ['allTags'],
    queryFn: getAllTags,
    staleTime: 1000 * 60 * 60,
  });
}