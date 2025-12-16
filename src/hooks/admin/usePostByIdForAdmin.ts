"use client";

import { useQuery } from "@tanstack/react-query";
import { getPostByIdForAdmin } from "@/api/admin";

export function usePostByIdForAdmin(postId: string | null) {
  return useQuery({
    queryKey: ["adminPost", postId],
    queryFn: () => getPostByIdForAdmin(postId!),
    enabled: !!postId,
  });
}

