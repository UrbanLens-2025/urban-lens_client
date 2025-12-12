"use client";

import { useQuery } from "@tanstack/react-query";
import { getPostComments, GetCommentsParams } from "@/api/posts";

export function usePostComments(params: GetCommentsParams) {
  return useQuery({
    queryKey: ["postComments", params],
    queryFn: () => getPostComments(params),
    placeholderData: (previousData) => previousData,
  });
}

