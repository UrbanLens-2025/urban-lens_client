"use client";

import { useQuery } from "@tanstack/react-query";
import { getBookableLocations } from "@/api/events";
import { GetBookableLocationsParams } from "@/types";

export function useBookableLocations(params: GetBookableLocationsParams) {
  return useQuery({
    queryKey: ['bookableLocations', params],
    queryFn: () => getBookableLocations(params),
    placeholderData: (previousData) => previousData,
  });
}