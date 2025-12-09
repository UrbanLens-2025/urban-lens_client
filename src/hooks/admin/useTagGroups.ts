"use client";

import { useQuery } from "@tanstack/react-query";
import { getTagsForAdmin } from "@/api/admin";
import { useMemo } from "react";

/**
 * Hook to fetch unique tag group names for filtering
 * Fetches a sample of tags to extract unique group names
 */
export function useTagGroups() {
  const { data, isLoading } = useQuery({
    queryKey: ["tagGroups"],
    queryFn: async () => {
      // Fetch a large sample to get all unique group names
      const response = await getTagsForAdmin({ page: 1, limit: 1000 });
      return response.data;
    },
    staleTime: 1000 * 60 * 60, // Cache for 1 hour
  });

  const uniqueGroups = useMemo(() => {
    if (!data) return [];
    const groups = new Set<string>();
    data.forEach((tag) => {
      if (tag.groupName) {
        groups.add(tag.groupName);
      }
    });
    return Array.from(groups).sort();
  }, [data]);

  return {
    groups: uniqueGroups,
    isLoading,
  };
}

