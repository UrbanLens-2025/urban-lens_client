"use client";

import { useQuery } from "@tanstack/react-query";
import { getPostById } from "@/api/posts";

export function usePostById(postId: string | null) {
  return useQuery({
    queryKey: ["post", postId],
    queryFn: () => getPostById(postId!),
    enabled: !!postId,
  });
}

