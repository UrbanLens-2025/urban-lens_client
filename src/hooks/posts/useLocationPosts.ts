"use client";

import { useQuery } from "@tanstack/react-query";
import { getLocationPosts, GetLocationPostsParams } from "@/api/posts";

export function useLocationPosts(params: GetLocationPostsParams) {
  return useQuery({
    queryKey: ["locationPosts", params],
    queryFn: () => getLocationPosts(params),
    placeholderData: (previousData) => previousData,
  });
}

