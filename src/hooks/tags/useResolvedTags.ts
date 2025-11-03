"use client";

import { useMemo } from "react";
import { useTags } from "@/hooks/tags/useTags";
import { PaginatedData, Tag } from "@/types";

export function useResolvedTags(tagIds: number[] | undefined) {
  const { data: allTagsResponse, isLoading: isLoadingTags } = useTags();

  const tagsMap = useMemo(() => {
    const map = new Map<number, Tag>();
    const allTags = (allTagsResponse as PaginatedData<Tag>)?.data || [];
    allTags.forEach((tag) => map.set(tag.id, tag));
    return map;
  }, [allTagsResponse]);

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