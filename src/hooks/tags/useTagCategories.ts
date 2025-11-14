"use client";

import { useQuery } from "@tanstack/react-query";
import { getTagCategories } from "@/api/locations";
import { TagCategory } from "@/types";

/**
 * Fetches tag categories for a specific type (LOCATION or EVENT)
 */
export function useTagCategories(type: "LOCATION" | "EVENT") {
  return useQuery({
    queryKey: ['tagCategories', type],
    queryFn: () => getTagCategories(type),
    staleTime: 1000 * 60 * 60, // Cache for 1 hour
  });
}

