"use client";

import { getAllTags } from "@/api/locations";
import { useQuery } from "@tanstack/react-query";
import type { GetTagsParams } from "@/types";

export function useTags(params: GetTagsParams = {}) {
  return useQuery({
    queryKey: ['allTags', params],
    queryFn: () => getAllTags(params),
    staleTime: 1000 * 60 * 5,
  });
}