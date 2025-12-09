"use client";

import { useQuery } from "@tanstack/react-query";
import { getTagsForAdmin } from "@/api/admin";
import { GetTagsParams } from "@/types";

export function useAdminTags(params: GetTagsParams & { 
  isVisible?: boolean;
  groupName?: string;
}) {
  return useQuery({
    queryKey: ['adminTags', params],
    queryFn: () => getTagsForAdmin(params),
    placeholderData: (previousData) => previousData,
  });
}