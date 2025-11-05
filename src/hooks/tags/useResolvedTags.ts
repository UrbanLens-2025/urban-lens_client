"use client";

import { useMemo } from "react";
import { useAllTags } from "@/hooks/tags/useAllTags";
import { Tag } from "@/types";

export function useResolvedTags(tagIds: number[] | undefined) {
  const { data: allTags, isLoading: isLoadingTags } = useAllTags();

  const tagsMap = useMemo(() => {
    const map = new Map<number, Tag>();
    const tags = allTags || [];
    tags.forEach((tag) => map.set(tag.id, tag));
    return map;
  }, [allTags]);

  const resolvedTags = useMemo(() => {
    if (!tagIds || tagsMap.size === 0) {
      return [];
    }
    return tagIds
      .map(id => tagsMap.get(id))
      .filter((tag): tag is Tag => !!tag)
      .map(tag => ({ tag: tag }));
  
  }, [tagIds, tagsMap]);

  return { resolvedTags, isLoadingTags };
}