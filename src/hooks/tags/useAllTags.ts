"use client";

import { useQuery } from "@tanstack/react-query";
import { getAllTags } from "@/api/locations";
import { Tag } from "@/types";

/**
 * Fetches all tags from the database, handling pagination if needed
 */
export function useAllTags() {
  return useQuery({
    queryKey: ['allTags'],
    queryFn: async () => {
      // First fetch with high limit to get as many tags as possible
      const firstPage = await getAllTags({ page: 1, limit: 1000 });
      
      // If we got all tags in first page, return them
      if (firstPage.meta.totalItems <= firstPage.meta.itemsPerPage) {
        return firstPage.data;
      }
      
      // Otherwise, fetch all remaining pages
      const allTags: Tag[] = [...firstPage.data];
      const totalPages = firstPage.meta.totalPages;
      const itemsPerPage = firstPage.meta.itemsPerPage;
      
      // Fetch remaining pages if needed
      if (totalPages > 1) {
        const remainingPages = await Promise.all(
          Array.from({ length: totalPages - 1 }, (_, i) => 
            getAllTags({ page: i + 2, limit: itemsPerPage })
          )
        );
        
        remainingPages.forEach((page) => {
          allTags.push(...page.data);
        });
      }
      
      return allTags;
    },
    staleTime: 1000 * 60 * 60, // Cache for 1 hour
  });
}

